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
import { x3dhInitiator, PreKeyBundle } from '../crypto/x3dh';
import { constructSenderAD } from '../crypto/associatedData';
import { apiRequest, ApiError } from '../transport/api';

// ===== Type Definitions =====

type SendInitialMessageParams = {
    session: Session;
    recipientIdentifier: string;
    message: string;
    initSender: (
        sharedSecret: Uint8Array,
        receiverPub: Uint8Array,
        identityKey: string,
        deviceId: string
    ) => Promise<string | undefined>;
    encrypt: (
        plaintext: Uint8Array,
        ad?: Uint8Array
    ) => Promise<RatchetEncryptResult | null>;
};

type SendMessageParams = {
    session: Session;
    recipientUserId: string;
    recipientDeviceId: string;
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
    recipientIdentifier,
    message,
    initSender,
    encrypt,
}: SendInitialMessageParams): Promise<void> {
    // 1. Check connectivity — X3DH requires fetching the bundle
    const { isConnected } = useMqttStore.getState();
    if (!isConnected) {
        throw new BundleFetchError(recipientIdentifier);
    }

    // 2. Fetch Bundle
    let preKeyBundle: PreKeyBundle | undefined;
    try {
        preKeyBundle = await apiRequest<PreKeyBundle>(
            `/bundle/${encodeURIComponent(recipientIdentifier)}`,
            { method: 'POST', authenticated: true }
        );

        if (!preKeyBundle || !preKeyBundle.identityKey) {
            throw new BundleFetchError(recipientIdentifier);
        }
    } catch (e: any) {
        if (e.status === 404) throw new UserNotFoundError(recipientIdentifier);
        if (e instanceof UserNotFoundError || e instanceof BundleFetchError) throw e;
        throw new BundleFetchError(recipientIdentifier, e);
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
            preKeyBundle.identityKey,
            preKeyBundle.deviceId
        );
    } catch (e) {
        throw new EncryptionError(recipientIdentifier, e as Error);
    }

    // 5. Construct AD and encrypt
    let ciphertext: RatchetEncryptResult;
    try {
        const ad = await constructSenderAD(session.iKey, preKeyBundle.identityKey);
        const result = await encrypt(toBytes(message), ad);
        if (!result) {
            throw new EncryptionError(recipientIdentifier);
        }
        ciphertext = result;
    } catch (e) {
        if (e instanceof EncryptionError) throw e;
        throw new EncryptionError(recipientIdentifier, e as Error);
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
    const topic = buildTopic(
        preKeyBundle.userId, preKeyBundle.deviceId,
        session.userId!, session.deviceId!
    );
    const chatId = preKeyBundle.userId;
    try {
        messageId = await saveMessage(chatId, {
            content: message,
            sender_id: 'me',
            status: 'pending',
        });
        outboxId = await saveToOutbox(chatId, messageId, topic, payloadStr);
    } catch (e) {
        throw new OutboxPersistError(recipientIdentifier, e as Error);
    }

    // 8. Attempt publish — failure is non-fatal, outbox retry will handle it
    try {
        await attemptPublish(outboxId, chatId, messageId, topic, payloadStr);
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
    recipientUserId,
    recipientDeviceId,
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
            throw new EncryptionError(recipientUserId);
        }
        ciphertext = result;
    } catch (e) {
        if (e instanceof EncryptionError) throw e;
        throw new EncryptionError(recipientUserId, e as Error);
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
    const topic = buildTopic(
        recipientUserId, recipientDeviceId,
        session.userId!, session.deviceId!
    );
    try {
        messageId = await saveMessage(recipientUserId, {
            content: message,
            sender_id: 'me',
            status: 'pending',
        });
        outboxId = await saveToOutbox(recipientUserId, messageId, topic, payloadStr);
    } catch (e) {
        throw new OutboxPersistError(recipientUserId, e as Error);
    }

    // 4. Attempt publish (if connected) — failure is non-fatal
    try {
        const { isConnected } = useMqttStore.getState();
        if (isConnected) {
            await attemptPublish(outboxId, recipientUserId, messageId, topic, payloadStr);
        }
        // If not connected, entries stay 'pending' — retried on reconnect
    } catch (e) {
        console.error('Publish attempt failed (will retry from outbox):', e);
        // Non-fatal — message is safely persisted in outbox
    }
}
