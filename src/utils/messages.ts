import { Alert } from "react-native";
import { Buffer } from "buffer";
import { getItemAsync, setItemAsync } from "expo-secure-store";
import { generateAuthParams, x3dhInitiator, PreKeyBundle, X3DHBundle, x3dhResponder } from '@/src/utils/x3dh';
import LibsignalDezireModule from "@/modules/libsignal-dezire/src/LibsignalDezireModule";
import { Session } from "@/src/store/session";
import { RatchetEncryptResult } from "@/modules/libsignal-dezire/src/LibsignalDezire.types";
import { MqttClient } from "mqtt";

type SendMessageParams = {
    session: Session;
    number: string;
    message: string;
    client: MqttClient | undefined;
    initSender: (sharedSecret: Uint8Array, receiverPub: Uint8Array) => Promise<string | undefined>;
    encrypt: (plaintext: Uint8Array, ad?: Uint8Array) => Promise<RatchetEncryptResult | null>;
};

export const sendInitialMessage = async ({
    session,
    number,
    message,
    client,
    initSender,
    encrypt
}: SendMessageParams) => {
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
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        });

        if (!res.ok) {
            console.log("Failed to fetch bundle:", await res.text());
            return;
        }
        const rawBundle = await res.json();
        if (!rawBundle.identityKey) {
            preKeyBundle = rawBundle;
            return;
        }
        preKeyBundle = {
            identityKey: rawBundle.identityKey,
            signature: rawBundle.signature,
            signedPreKey: rawBundle.signedPreKey,
            opk: rawBundle.opk
        };
    } catch (e) {
        console.error("Error fetching bundle:", e);
        return;
    }

    // 3. Process Bundle & keys
    if (!preKeyBundle) {
        Alert.alert("Error", "Failed to fetch bundle");
        return;
    }
    const { sharedSecret, ephemeralKey } = await x3dhInitiator(session, preKeyBundle);
    await initSender(sharedSecret, new Uint8Array(Buffer.from(preKeyBundle.signedPreKey, 'base64')));

    // Constructing AD
    const iKeyPubInitiator = await LibsignalDezireModule.genPubKey(session.iKey);
    const receiverIdentityKey = new Uint8Array(Buffer.from(preKeyBundle.identityKey, 'base64'));
    const ad = new Uint8Array(iKeyPubInitiator.length + receiverIdentityKey.length);
    ad.set(iKeyPubInitiator);
    ad.set(receiverIdentityKey, iKeyPubInitiator.length);

    const ciphertext = await encrypt(new Uint8Array(Buffer.from(message, 'utf-8')), ad);

    if (!ciphertext) {
        Alert.alert("Error", "Failed to encrypt message");
        return;
    }

    const payload = {
        identityKey: Buffer.from(iKeyPubInitiator).toString('base64'),
        ephemeralKey: Buffer.from(ephemeralKey).toString('base64'),
        spkId: 1, // Currently hardcoded as per original
        opkId: preKeyBundle.opk.id,
        ciphertext: Buffer.from(ciphertext.ciphertext).toString('base64'),
        header: Buffer.from(ciphertext.header).toString('base64'),
    };

    // 4. Send Message (Publish)
    if (!client) console.log("No client")
    else {
        // Derive topic from session/recipient
        // Original: /khamoshchat/<recipient>/<sender>
        const senderPhone = session.phone.countryCode + session.phone.number;
        const topic = `/khamoshchat/${encodeURIComponent(number)}/${encodeURIComponent(senderPhone)}`;
        client.publish(
            topic,
            JSON.stringify(payload)
        );
    }
};

type ReceiveMessageParams = {
    session: Session;
    payload: X3DHBundle & { ciphertext: string; header: string };
    senderPhone: string;
    initReceiver: (
        sharedSecret: Uint8Array,
        receiverPriv: Uint8Array,
        receiverPub: Uint8Array
    ) => Promise<string | undefined>;
    decrypt: (
        header: Uint8Array,
        ciphertext: Uint8Array,
        ad?: Uint8Array
    ) => Promise<Uint8Array | null>;
};

export const receiveMessage = async ({
    session,
    payload,
    senderPhone,
    initReceiver,
    decrypt,
}: ReceiveMessageParams) => {
    // 1. Validate Payload
    if (!payload.identityKey || !payload.ephemeralKey || payload.opkId === undefined) {
        console.error("Invalid X3DH payload");
        return null;
    }

    try {
        // 2. Load OPK
        const opkStr = await getItemAsync(`opks-${payload.opkId}`);
        if (!opkStr) {
            console.error("OPK not found for id:", payload.opkId);
            return null;
        }
        const opkPrivate = new Uint8Array(Buffer.from(opkStr, 'base64'));

        // 3. X3DH Responder - derive shared secret
        const sharedSecret = await x3dhResponder(session, payload, opkPrivate);

        // 4. Initialize Receiver Ratchet with SPK keypair
        const spkPrivate = session.preKey;
        const spkPublic = await LibsignalDezireModule.genPubKey(spkPrivate);
        await initReceiver(sharedSecret, spkPrivate, spkPublic);

        // 5. Construct AD: sender's identity key || receiver's identity key
        const senderIdentityKey = new Uint8Array(Buffer.from(payload.identityKey, 'base64'));
        const receiverIdentityPub = await LibsignalDezireModule.genPubKey(session.iKey);
        const ad = new Uint8Array(senderIdentityKey.length + receiverIdentityPub.length);
        ad.set(senderIdentityKey);
        ad.set(receiverIdentityPub, senderIdentityKey.length);

        // 6. Decrypt the message
        const header = new Uint8Array(Buffer.from(payload.header, 'base64'));
        const ciphertext = new Uint8Array(Buffer.from(payload.ciphertext, 'base64'));
        const plaintext = await decrypt(header, ciphertext, ad);

        if (!plaintext) {
            console.error("Failed to decrypt message");
            return null;
        }
        console.log("decrypted: ", Buffer.from(plaintext).toString('utf-8'))

        return {
            sharedSecret,
            plaintext: Buffer.from(plaintext).toString('utf-8'),
            senderPhone,
        };
    } catch (e) {
        console.error("Error processing receive message:", e);
        return null;
    }
};
