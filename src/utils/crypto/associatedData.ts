/**
 * Associated Data (AD) construction for authenticated encryption.
 * Consolidates the AD construction pattern used throughout messaging.
 */

import LibsignalDezireModule from '@/modules/libsignal-dezire/src/LibsignalDezireModule';
import { fromBase64 } from '../helpers/encoding';

/**
 * Constructs Associated Data from sender and receiver identity public keys.
 * AD = sender_identity_pub || receiver_identity_pub
 */
export function constructAD(
    senderIdentityPub: Uint8Array,
    receiverIdentityPub: Uint8Array
): Uint8Array {
    const ad = new Uint8Array(senderIdentityPub.length + receiverIdentityPub.length);
    ad.set(senderIdentityPub);
    ad.set(receiverIdentityPub, senderIdentityPub.length);
    return ad;
}

/**
 * Constructs AD for a sender (initiator).
 * Gets the sender's public key from their private key.
 */
export async function constructSenderAD(
    senderIdentityPrivate: Uint8Array,
    receiverIdentityKeyBase64: string
): Promise<Uint8Array> {
    const senderIdentityPub = await LibsignalDezireModule.genPubKey(senderIdentityPrivate);
    const receiverIdentityPub = fromBase64(receiverIdentityKeyBase64);
    return constructAD(senderIdentityPub, receiverIdentityPub);
}

/**
 * Constructs AD for a receiver (responder).
 * The sender's identity key comes from the incoming payload.
 */
export async function constructReceiverAD(
    senderIdentityKeyBase64: string,
    receiverIdentityPrivate: Uint8Array
): Promise<Uint8Array> {
    const senderIdentityPub = fromBase64(senderIdentityKeyBase64);
    const receiverIdentityPub = await LibsignalDezireModule.genPubKey(receiverIdentityPrivate);
    return constructAD(senderIdentityPub, receiverIdentityPub);
}
