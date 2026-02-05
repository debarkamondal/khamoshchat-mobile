import LibsignalDezireModule from "@/modules/libsignal-dezire/src/LibsignalDezireModule";
import { Buffer } from "buffer";
import { Session } from "@/src/store/session";

export type PreKeyBundle = {
    identityKey: string;
    signature: string;
    signedPreKey: string;
    opk: {
        id: number;
        key: string;
    };
};

export type X3DHBundle = {
    identityKey: string;
    ephemeralKey: string;
    opkId: number;
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
    // New sizes: 33 (IK) + 4 (SPK ID) + 33 (SPK Pub) + 96 (Sig) + 4 (OPK ID) + [33 (OPK Pub)]
    // Base size: 33 + 4 + 33 + 96 + 4 = 170
    // With OPK: 170 + 33 = 203
    const size = hasOpk ? 203 : 170;
    const buffer = new ArrayBuffer(size);
    const view = new DataView(buffer);
    const bytes = new Uint8Array(buffer);

    bytes.set(identityKey, 0);           // 0-32: identityKey (33 bytes)
    view.setUint32(33, spkId, true);     // 33-36: spkId (4 bytes, little-endian)
    bytes.set(spkPublic, 37);            // 37-69: spkPublic (33 bytes)
    bytes.set(signature, 70);            // 70-165: signature (96 bytes)
    view.setUint32(166, opkId, true);    // 166-169: opkId (4 bytes, little-endian)
    if (hasOpk && opkPublic) {
        bytes.set(opkPublic, 170);       // 170-202: opkPublic (33 bytes)
    }
    return bytes;
};

export const generateAuthParams = async (session: Session, id: string) => {
    const sign = await LibsignalDezireModule.vxeddsaSign(session.preKey, new TextEncoder().encode(id));
    return {
        signature: Buffer.from(sign.signature).toString('base64'),
        vrf: Buffer.from(sign.vrf).toString('base64')
    };
};

export const x3dhInitiator = async (
    session: Session,
    preKeyBundle: PreKeyBundle
): Promise<{ sharedSecret: Uint8Array, ephemeralKey: Uint8Array }> => {
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



    return {
        sharedSecret: result.sharedSecret,
        ephemeralKey: result.ephemeralPublic,
    };
};

export const x3dhResponder = async (
    session: Session,
    bundle: X3DHBundle,
    opkPrivate: Uint8Array | null
) => {

    const aliceIdentityPublic = new Uint8Array(Buffer.from(bundle.identityKey, 'base64'));
    const aliceEphemeralPublic = new Uint8Array(Buffer.from(bundle.ephemeralKey, 'base64'));
    const result = await LibsignalDezireModule.x3dhResponder(
        session.iKey,
        session.preKey,
        opkPrivate,
        aliceIdentityPublic,
        aliceEphemeralPublic
    );

    return result.sharedSecret;
};
