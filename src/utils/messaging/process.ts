/**
 * Shared message processing logic.
 * Used by both the live MQTT handler and the inbox retry system.
 */

import { Session } from '@/src/store/useSession';
import { X3DHBundle, initReceiver, decryptMessage, getIdentityKey } from '@/src/utils/crypto';
import { receiveInitialMessage, receiveMessage } from './receive';

/**
 * Processes a raw MQTT message (already parsed from JSON).
 * Handles both initial (X3DH) and subsequent (ratchet) messages.
 *
 * @throws on crypto failure, storage failure, or invalid payload
 */
export async function processIncomingMessage(
    session: Session,
    topic: string,
    rawPayload: string
): Promise<void> {
    const parsed = JSON.parse(rawPayload);
    const payload = parsed as X3DHBundle & { ciphertext: string; header: string };

    // Extract sender from topic: /khamoshchat/<recipient>/<sender>
    const topicParts = topic.split('/');
    const senderPhone = topicParts.length >= 4 ? decodeURIComponent(topicParts[3]) : null;

    if (!senderPhone) {
        throw new Error(`Could not extract sender phone from topic: ${topic}`);
    }

    if (payload.identityKey && payload.ephemeralKey && payload.opkId !== undefined) {
        // Initial message — full X3DH handshake
        if (!session.isRegistered) {
            throw new Error('Session not registered, cannot process initial message');
        }

        await receiveInitialMessage({
            session,
            payload,
            senderPhone,
            initReceiver: (sharedSecret, receiverPriv, receiverPub, identityKey) =>
                initReceiver(senderPhone, sharedSecret, receiverPriv, receiverPub, identityKey),
            decrypt: (header, ciphertext, ad) =>
                decryptMessage(senderPhone, header, ciphertext, ad),
        });
    } else if (payload.ciphertext && payload.header) {
        // Subsequent message — ratchet already initialized
        const identityKey = await getIdentityKey(senderPhone);
        if (!identityKey) {
            throw new Error(`No identity key found for sender: ${senderPhone}`);
        }

        await receiveMessage({
            session,
            payload,
            senderPhone,
            senderIdentityKey: identityKey,
            decrypt: (header, ciphertext, ad) =>
                decryptMessage(senderPhone, header, ciphertext, ad),
        });
    } else {
        throw new Error(`Unrecognized message payload shape from ${senderPhone}`);
    }
}
