/**
 * Message sending orchestration.
 * Coordinates crypto, transport, and storage layers for outbound messages.
 */

import { Alert } from 'react-native';
import { MqttClient } from 'mqtt';
import { Session } from '@/src/store/useSession';
import { RatchetEncryptResult } from '@/modules/libsignal-dezire/src/LibsignalDezire.types';
import LibsignalDezireModule from '@/modules/libsignal-dezire/src/LibsignalDezireModule';

import { toBase64, fromBase64, toBytes } from '../helpers/encoding';
import { saveMessage } from '../storage/messages';
import { sendToRecipient } from '../transport/mqtt';
import { generateAuthParams, x3dhInitiator, PreKeyBundle } from '../crypto/x3dh';
import { constructSenderAD } from '../crypto/associatedData';

// ===== Type Definitions =====

type SendInitialMessageParams = {
    session: Session;
    number: string;
    message: string;
    client: MqttClient | undefined;
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
    client: MqttClient | undefined;
    encrypt: (
        plaintext: Uint8Array,
        ad?: Uint8Array
    ) => Promise<RatchetEncryptResult | null>;
    recipientIdentityKey: string;
};

// ===== API =====

/**
 * Sends the initial message to a contact (performs X3DH key exchange).
 */
export async function sendInitialMessage({
    session,
    number,
    message,
    client,
    initSender,
    encrypt,
}: SendInitialMessageParams): Promise<void> {
    // 1. Generate Auth Params
    const { signature, vrf } = await generateAuthParams(session, number);
    const body = {
        phone: session.phone.countryCode + session.phone.number,
        signature,
        vrf,
    };

    // 2. Fetch Bundle
    let preKeyBundle: PreKeyBundle | undefined;
    try {
        const res = await fetch(`https://identity.dkmondal.in/test/bundle/${number}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });

        if (!res.ok) {
            console.log('Failed to fetch bundle:', await res.text());
            return;
        }
        const rawBundle = await res.json();
        if (!rawBundle.identityKey) {
            return;
        }
        preKeyBundle = {
            identityKey: rawBundle.identityKey,
            signature: rawBundle.signature,
            signedPreKey: rawBundle.signedPreKey,
            opk: rawBundle.opk,
        };
    } catch (e) {
        console.error('Error fetching bundle:', e);
        return;
    }

    if (!preKeyBundle) {
        Alert.alert('Error', 'Failed to fetch bundle');
        return;
    }

    // 3. X3DH Key Exchange
    const { sharedSecret, ephemeralKey } = await x3dhInitiator(session, preKeyBundle);
    await initSender(
        sharedSecret,
        fromBase64(preKeyBundle.signedPreKey),
        preKeyBundle.identityKey
    );

    // 4. Construct AD and encrypt
    const ad = await constructSenderAD(session.iKey, preKeyBundle.identityKey);
    const ciphertext = await encrypt(toBytes(message), ad);

    if (!ciphertext) {
        Alert.alert('Error', 'Failed to encrypt message');
        return;
    }

    // 5. Build payload
    const senderIdentityPub = await LibsignalDezireModule.genPubKey(session.iKey);
    const payload = {
        identityKey: toBase64(senderIdentityPub),
        ephemeralKey: toBase64(ephemeralKey),
        spkId: 1,
        opkId: preKeyBundle.opk.id,
        ciphertext: toBase64(ciphertext.ciphertext),
        header: toBase64(ciphertext.header),
    };

    // 6. Publish and save
    if (!client) {
        console.log('No client');
        return;
    }

    const senderPhone = session.phone.countryCode + session.phone.number;
    sendToRecipient(client, senderPhone, number, payload);
    await saveMessage(number, { content: message, sender_id: 'me' });
}

/**
 * Sends a subsequent message (ratchet already initialized).
 */
export async function sendMessage({
    session,
    number,
    message,
    client,
    encrypt,
    recipientIdentityKey,
}: SendMessageParams): Promise<boolean> {
    try {
        // 1. Construct AD and encrypt
        const ad = await constructSenderAD(session.iKey, recipientIdentityKey);
        const ciphertext = await encrypt(toBytes(message), ad);

        if (!ciphertext) {
            Alert.alert('Error', 'Failed to encrypt message');
            return false;
        }

        // 2. Build payload
        const payload = {
            ciphertext: toBase64(ciphertext.ciphertext),
            header: toBase64(ciphertext.header),
        };

        // 3. Publish and save
        if (!client) {
            console.error('No MQTT client available');
            return false;
        }

        const senderPhone = session.phone.countryCode + session.phone.number;
        sendToRecipient(client, senderPhone, number, payload);
        await saveMessage(number, { content: message, sender_id: 'me' });

        return true;
    } catch (e) {
        console.error('Error sending message:', e);
        return false;
    }
}
