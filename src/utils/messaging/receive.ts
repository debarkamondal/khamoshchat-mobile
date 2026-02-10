/**
 * Message receiving orchestration.
 * Coordinates crypto and storage layers for inbound messages.
 */

import { Session } from '@/src/store/useSession';
import LibsignalDezireModule from '@/modules/libsignal-dezire/src/LibsignalDezireModule';

import { fromBase64, toString } from '../helpers/encoding';
import { saveMessage } from '../storage/messages';
import { X3DHBundle, x3dhResponder } from '../crypto/x3dh';
import { loadOpk } from '../crypto/oneTimePreKeys';
import { constructReceiverAD } from '../crypto/associatedData';

// ===== Type Definitions =====

type ReceiveInitialMessageParams = {
    session: Session;
    payload: X3DHBundle & { ciphertext: string; header: string };
    senderPhone: string;
    initReceiver: (
        sharedSecret: Uint8Array,
        receiverPriv: Uint8Array,
        receiverPub: Uint8Array,
        identityKey?: string
    ) => Promise<string | undefined>;
    decrypt: (
        header: Uint8Array,
        ciphertext: Uint8Array,
        ad?: Uint8Array
    ) => Promise<Uint8Array | null>;
};

type ReceiveMessageParams = {
    session: Session;
    payload: { ciphertext: string; header: string };
    senderPhone: string;
    senderIdentityKey: string;
    decrypt: (
        header: Uint8Array,
        ciphertext: Uint8Array,
        ad?: Uint8Array
    ) => Promise<Uint8Array | null>;
};

type ReceiveResult = {
    plaintext: string;
    senderPhone: string;
    sharedSecret?: Uint8Array;
};

// ===== API =====

/**
 * Receives and processes an initial message (performs X3DH responder).
 */
export async function receiveInitialMessage({
    session,
    payload,
    senderPhone,
    initReceiver,
    decrypt,
}: ReceiveInitialMessageParams): Promise<ReceiveResult | null> {
    // 1. Validate payload
    if (!payload.identityKey || !payload.ephemeralKey || payload.opkId === undefined) {
        console.error('Invalid X3DH payload');
        return null;
    }

    try {
        // 2. Load OPK
        const opkPrivate = await loadOpk(payload.opkId);
        if (!opkPrivate) {
            return null;
        }

        // 3. X3DH Responder - derive shared secret
        const sharedSecret = await x3dhResponder(session, payload, opkPrivate);

        // 4. Initialize Receiver Ratchet with SPK keypair
        const spkPrivate = session.preKey;
        const spkPublic = await LibsignalDezireModule.genPubKey(spkPrivate);
        await initReceiver(sharedSecret, spkPrivate, spkPublic, payload.identityKey);

        // 5. Construct AD and decrypt
        const ad = await constructReceiverAD(payload.identityKey, session.iKey);
        const header = fromBase64(payload.header);
        const ciphertext = fromBase64(payload.ciphertext);
        const plaintext = await decrypt(header, ciphertext, ad);

        if (!plaintext) {
            console.error('Failed to decrypt message');
            return null;
        }

        // 6. Save message
        const plaintextStr = toString(plaintext);
        await saveMessage(senderPhone, {
            content: plaintextStr,
            sender_id: senderPhone,
        });

        return {
            sharedSecret,
            plaintext: plaintextStr,
            senderPhone,
        };
    } catch (e) {
        console.error('Error processing receive message:', e);
        return null;
    }
}

/**
 * Receives and processes a subsequent message (ratchet already initialized).
 */
export async function receiveMessage({
    session,
    payload,
    senderPhone,
    senderIdentityKey,
    decrypt,
}: ReceiveMessageParams): Promise<ReceiveResult | null> {
    try {
        // 1. Construct AD and decrypt
        const ad = await constructReceiverAD(senderIdentityKey, session.iKey);
        const header = fromBase64(payload.header);
        const ciphertext = fromBase64(payload.ciphertext);
        const plaintext = await decrypt(header, ciphertext, ad);

        if (!plaintext) {
            console.error('Failed to decrypt subsequent message');
            return null;
        }

        // 2. Save message
        const plaintextStr = toString(plaintext);
        await saveMessage(senderPhone, {
            content: plaintextStr,
            sender_id: senderPhone,
        });

        return {
            plaintext: plaintextStr,
            senderPhone,
        };
    } catch (e) {
        console.error('Error processing subsequent message:', e);
        return null;
    }
}
