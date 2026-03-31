/**
 * Message sending orchestration.
 * Coordinates crypto, transport, and storage layers for outbound messages.
 *
 * Queue-first architecture:
 *   1. Encrypt message.
 *   2. Save plaintext to per-chat DB with status 'pending'.
 *   3. Save encrypted payload to outbox (primary DB).
 *   4. Attempt MQTT publish.
 *   5. On success: mark outbox 'sent', update message status to 'sent'.
 *   6. On failure: entries stay 'pending', retried on MQTT reconnect.
 *
 * Error handling:
 *   - Throws typed errors (BundleFetchError, EncryptionError, OutboxPersistError)
 *     so callers can distinguish recoverable vs unrecoverable failures, matching
 *     the pattern used on the receiving side (DatabaseKeyMismatchError, etc.).
 *   - Does NOT call Alert.alert — that's the caller's responsibility.
 */

import useMqttStore from '@/src/store/useMqttStore';
import { Session } from '@/src/store/useSession';
import { RatchetEncryptResult } from '@/modules/libsignal-dezire/src/LibsignalDezire.types';
import LibsignalDezireModule from '@/modules/libsignal-dezire/src/LibsignalDezireModule';

import { toBase64, fromBase64, toBytes } from '../helpers/encoding';
import { saveMessage, updateMessageStatus } from '../storage/messages';
import { saveToOutbox, markOutboxSent, incrementOutboxRetry } from '../storage/outbox';
import { BundleFetchError, EncryptionError, OutboxPersistError, UserNotFoundError } from '../storage/errors';
import { buildTopic, publishMessage } from '../transport/mqtt';
import { generateAuthParams, x3dhInitiator, PreKeyBundle } from '../crypto/x3dh';
import { constructSenderAD } from '../crypto/associatedData';

// ===== Type Definitions =====

type SendInitialMessageParams = {
    session: Session;
    number: string;
    message: string;
    initSender: (
        sharedSecret: Uint8Array,
        receiverPub: Uint8Array,
        identityKey?: string
    ) => Promise<string | undefined>;
    encrypt: (
        plaintext: Uint8Array,
        ad?: Uint8Array
    ) => Promise<RatchetEncryptResult | null>;
};

type SendMessageParams = {
    session: Session;
    number: string;
    message: string;
    encrypt: (
        plaintext: Uint8Array,
        ad?: Uint8Array
    ) => Promise<RatchetEncryptResult | null>;
    recipientIdentityKey: string;
};

// ===== Internal helpers =====

/**
 * Attempts to publish an outbox entry and update statuses.
 * On failure, increments the retry counter (auto-fails after MAX_RETRIES).
 */
async function attemptPublish(
    outboxId: number,
    chatId: string,
    messageId: string,
    topic: string,
    payload: string
): Promise<boolean> {
    const success = await publishMessage(topic, payload);
    if (success) {
        await markOutboxSent(outboxId);
        try {
            await updateMessageStatus(chatId, messageId, 'sent');
        } catch {
            // Chat DB may not be open (background context) — that's OK,
            // the status will be updated via updateMessageStatusWithAutoOpen
            // during outbox retry processing.
        }
        return true;
    } else {
        await incrementOutboxRetry(outboxId);
        return false;
    }
}

// ===== API =====

/**
 * Sends the initial message to a contact (performs X3DH key exchange).
 * Requires online connectivity — X3DH needs the recipient's pre-key bundle.
 *
 * @throws BundleFetchError    — could not fetch pre-key bundle (recoverable)
 * @throws UserNotFoundError   — the user is not registered (not recoverable)
 * @throws EncryptionError     — encryption failed (not recoverable)
 * @throws OutboxPersistError  — could not save to DB (recoverable)
 */
export async function sendInitialMessage({
    session,
    number,
    message,
    initSender,
    encrypt,
}: SendInitialMessageParams): Promise<void> {
    // 1. Check connectivity — X3DH requires fetching the bundle
    const { isConnected } = useMqttStore.getState();
    if (!isConnected) {
        throw new BundleFetchError(number);
    }

    // 2. Generate Auth Params
    const { signature, vrf } = await generateAuthParams(session, number);
    const body = {
        phone: session.phone.countryCode + session.phone.number,
        signature,
        vrf,
    };

    // 3. Fetch Bundle
    let preKeyBundle: PreKeyBundle | undefined;
    try {
        const baseUrl = process.env.EXPO_PUBLIC_IDENTITY_URL ?? 'https://identity.dkmondal.in/test';
        const res = await fetch(`${baseUrl.replace(/\/$/, '')}/bundle/${number}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });

        if (!res.ok) {
            if (res.status === 404) {
                throw new UserNotFoundError(number);
            }
            const text = await res.text();
            console.error('Bundle fetch HTTP error:', res.status, text);
            throw new BundleFetchError(number);
        }
        const rawBundle = await res.json();
        if (!rawBundle.identityKey) {
            throw new BundleFetchError(number);
        }
        preKeyBundle = {
            identityKey: rawBundle.identityKey,
            signature: rawBundle.signature,
            signedPreKey: rawBundle.signedPreKey,
            opk: rawBundle.opk,
        };
    } catch (e) {
        if (e instanceof UserNotFoundError || e instanceof BundleFetchError) throw e;
        throw new BundleFetchError(number, e);
    }

    // 4. X3DH Key Exchange
    let sharedSecret: Uint8Array;
    let ephemeralKey: Uint8Array;
    try {
        const x3dhResult = await x3dhInitiator(session, preKeyBundle);
        sharedSecret = x3dhResult.sharedSecret;
        ephemeralKey = x3dhResult.ephemeralKey;
        await initSender(
            sharedSecret,
            fromBase64(preKeyBundle.signedPreKey),
            preKeyBundle.identityKey
        );
    } catch (e) {
        throw new EncryptionError(number, e);
    }

    // 5. Construct AD and encrypt
    let ciphertext: RatchetEncryptResult;
    try {
        const ad = await constructSenderAD(session.iKey, preKeyBundle.identityKey);
        const result = await encrypt(toBytes(message), ad);
        if (!result) {
            throw new EncryptionError(number);
        }
        ciphertext = result;
    } catch (e) {
        if (e instanceof EncryptionError) throw e;
        throw new EncryptionError(number, e);
    }

    // 6. Build payload
    const senderIdentityPub = await LibsignalDezireModule.genPubKey(session.iKey);
    const payload = {
        identityKey: toBase64(senderIdentityPub),
        ephemeralKey: toBase64(ephemeralKey),
        spkId: 1,
        opkId: preKeyBundle.opk.id,
        ciphertext: toBase64(ciphertext.ciphertext),
        header: toBase64(ciphertext.header),
    };
    const payloadStr = JSON.stringify(payload);

    // 7. Save message as 'pending' + queue to outbox
    let messageId: string;
    let outboxId: number;
    const senderPhone = session.phone.countryCode + session.phone.number;
    const topic = buildTopic(senderPhone, number);
    try {
        messageId = await saveMessage(number, {
            content: message,
            sender_id: 'me',
            status: 'pending',
        });
        outboxId = await saveToOutbox(number, messageId, topic, payloadStr);
    } catch (e) {
        throw new OutboxPersistError(number, e);
    }

    // 8. Attempt publish — failure is non-fatal, outbox retry will handle it
    try {
        await attemptPublish(outboxId, number, messageId, topic, payloadStr);
    } catch (e) {
        console.error('Publish attempt failed (will retry from outbox):', e);
        // Non-fatal — message is safely persisted in outbox
    }
}

/**
 * Sends a subsequent message (ratchet already initialized).
 * Messages are always saved — publish failures are retried from the outbox.
 *
 * @throws EncryptionError     — encryption failed (not recoverable)
 * @throws OutboxPersistError  — could not save to DB (recoverable)
 */
export async function sendMessage({
    session,
    number,
    message,
    encrypt,
    recipientIdentityKey,
}: SendMessageParams): Promise<void> {
    // 1. Construct AD and encrypt
    let ciphertext: RatchetEncryptResult;
    try {
        const ad = await constructSenderAD(session.iKey, recipientIdentityKey);
        const result = await encrypt(toBytes(message), ad);
        if (!result) {
            throw new EncryptionError(number);
        }
        ciphertext = result;
    } catch (e) {
        if (e instanceof EncryptionError) throw e;
        throw new EncryptionError(number, e);
    }

    // 2. Build payload
    const payload = {
        ciphertext: toBase64(ciphertext.ciphertext),
        header: toBase64(ciphertext.header),
    };
    const payloadStr = JSON.stringify(payload);

    // 3. Save message as 'pending' + queue to outbox
    let messageId: string;
    let outboxId: number;
    const senderPhone = session.phone.countryCode + session.phone.number;
    const topic = buildTopic(senderPhone, number);
    try {
        messageId = await saveMessage(number, {
            content: message,
            sender_id: 'me',
            status: 'pending',
        });
        outboxId = await saveToOutbox(number, messageId, topic, payloadStr);
    } catch (e) {
        throw new OutboxPersistError(number, e);
    }

    // 4. Attempt publish (if connected) — failure is non-fatal
    try {
        const { isConnected } = useMqttStore.getState();
        if (isConnected) {
            await attemptPublish(outboxId, number, messageId, topic, payloadStr);
        }
        // If not connected, entries stay 'pending' — retried on reconnect
    } catch (e) {
        console.error('Publish attempt failed (will retry from outbox):', e);
        // Non-fatal — message is safely persisted in outbox
    }
}
