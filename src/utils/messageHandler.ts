import LibsignalDezireModule from "@/modules/libsignal-dezire/src/LibsignalDezireModule";
import { Buffer } from "buffer";
import { Session } from "@/src/store/session";
import { MqttClient } from "mqtt";
import { getItemAsync } from "expo-secure-store";

export type PreKeyBundle = {
    identityKey: string;
    signature: string;
    signedPreKey: string;
    opk: {
        id: number;
        key: string;
    };
};

// Helper function to serialize Bob's key bundle
const serializeBobBundle = (
    identityKey: Uint8Array,
    spkId: number,
    spkPublic: Uint8Array,
    signature: Uint8Array,
    opkId: number,
    opkPublic: Uint8Array | null,
    hasOpk: boolean
): Uint8Array => {
    const size = hasOpk ? 200 : 168;
    const buffer = new ArrayBuffer(size);
    const view = new DataView(buffer);
    const bytes = new Uint8Array(buffer);

    bytes.set(identityKey, 0);           // 0-31: identityKey (32 bytes)
    view.setUint32(32, spkId, true);     // 32-35: spkId (4 bytes, little-endian)
    bytes.set(spkPublic, 36);            // 36-67: spkPublic (32 bytes)
    bytes.set(signature, 68);            // 68-163: signature (96 bytes)
    view.setUint32(164, opkId, true);    // 164-167: opkId (4 bytes, little-endian)
    if (hasOpk && opkPublic) {
        bytes.set(opkPublic, 168);         // 168-199: opkPublic (32 bytes)
    }
    return bytes;
};

export const sendInitialMessage = async (
    session: Session,
    number: string,
    client: MqttClient | undefined
) => {
    const sign = await LibsignalDezireModule.vxeddsaSign(session.preKey, new TextEncoder().encode(number))
    const body = {
        phone: session.phone.countryCode + session.phone.number,
        signature: Buffer.from(sign.signature).toString('base64'),
        vrf: Buffer.from(sign.vrf).toString('base64'),
    };

    let preKeyBundle: PreKeyBundle | undefined;
    // Assuming fetchChats().length === 0 check is done by caller or we proceed regardless for "initial" message
    const res = await fetch(`https://identity.dkmondal.in/test/bundle/${number}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
    });
    if (res.ok) {
        const rawBundle = await res.json();
        // Check if we got snake_case keys and map them, or if it's already camelCase (fallback)
        if (rawBundle.identity_key) {
            preKeyBundle = {
                identityKey: rawBundle.identity_key,
                signature: rawBundle.signature,
                signedPreKey: rawBundle.signed_pre_key,
                opk: rawBundle.opk
            };
        } else {
            preKeyBundle = rawBundle;
        }
    } else {
        console.log("Failed to fetch bundle:", await res.text());
    }

    if (preKeyBundle) {
        const hasOpk = true;
        const bobBundle = serializeBobBundle(
            Buffer.from(preKeyBundle.identityKey, 'base64'),
            1, // spkId - hardcoded for now, adjust as needed
            Buffer.from(preKeyBundle.signedPreKey, 'base64'),
            Buffer.from(preKeyBundle.signature, 'base64'),
            preKeyBundle.opk.id,
            Buffer.from(preKeyBundle.opk.key, 'base64'),
            hasOpk
        );

        const result = await LibsignalDezireModule.x3dhInitiator(
            session.iKey,
            bobBundle,
            hasOpk
        );

        const aliceIdentityPublic = await LibsignalDezireModule.genPubKey(session.iKey);

        const initialMessagePayload = {
            identityKey: Buffer.from(aliceIdentityPublic).toString('base64'),
            ephemeralKey: Buffer.from(result.ephemeralPublic).toString('base64'),
            opkId: preKeyBundle.opk.id,
            // We do NOT send result.sharedSecret
        };

        console.log("shared", result.sharedSecret)
        if (!client) return;
        client.publish(`/khamoshchat/${encodeURIComponent(number)}/${encodeURIComponent(session.phone.countryCode + session.phone.number)}`, JSON.stringify(initialMessagePayload));
    }
}

export const receiveInitialMessage = async (
    session: Session,
    payload: any // Type this effectively
) => {
    // payload is expected to be { identityKey: string, ephemeralKey: string, opkId: number } strings are base64

    const aliceIdentityPublic = new Uint8Array(Buffer.from(payload.identityKey, 'base64'));
    const aliceEphemeralPublic = new Uint8Array(Buffer.from(payload.ephemeralKey, 'base64'));
    const opkId = payload.opkId;

    let opkPrivate: Uint8Array | null = null;
    if (opkId !== undefined && opkId !== null) {
        const opkStr = await getItemAsync(`opks-${opkId}`);
        if (opkStr) {
            opkPrivate = new Uint8Array(Buffer.from(opkStr, 'base64'));
        }
    }

    const sharedSecret = await LibsignalDezireModule.x3dhResponder(
        session.iKey,
        session.preKey,
        opkPrivate,
        aliceIdentityPublic,
        aliceEphemeralPublic
    );

    return sharedSecret;
}
