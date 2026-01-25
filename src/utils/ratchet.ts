import LibsignalDezireModule from "@/modules/libsignal-dezire/src/LibsignalDezireModule";
import { Buffer } from "buffer";

export class RatchetSession {
    private sessionId: string;
    private isClosed: boolean = false;

    private constructor(sessionId: string) {
        this.sessionId = sessionId;
    }

    /**
     * Initializes a sender ratchet.
     * @param sharedSecret The 32-byte shared secret from X3DH.
     * @param receiverPublicKey The 32-byte public key of the receiver (Bob).
     */
    static async createSender(sharedSecret: Uint8Array, receiverPublicKey: Uint8Array): Promise<RatchetSession> {
        if (sharedSecret.length !== 32 || receiverPublicKey.length !== 32) {
            throw new Error("Invalid key lengths. Must be 32 bytes.");
        }
        const uuid = await LibsignalDezireModule.ratchetInitSender(
            Buffer.from(sharedSecret),
            Buffer.from(receiverPublicKey)
        );
        return new RatchetSession(uuid);
    }

    /**
     * Initializes a receiver ratchet.
     * @param sharedSecret The 32-byte shared secret from X3DH.
     * @param receiverPrivateKey The 32-byte private key of the receiver (Bob).
     * @param receiverPublicKey The 32-byte public key of the receiver (Bob).
     */
    static async createReceiver(
        sharedSecret: Uint8Array,
        receiverPrivateKey: Uint8Array,
        receiverPublicKey: Uint8Array
    ): Promise<RatchetSession> {
        if (sharedSecret.length !== 32 || receiverPrivateKey.length !== 32 || receiverPublicKey.length !== 32) {
            throw new Error("Invalid key lengths. Must be 32 bytes.");
        }
        const uuid = await LibsignalDezireModule.ratchetInitReceiver(
            Buffer.from(sharedSecret),
            Buffer.from(receiverPrivateKey),
            Buffer.from(receiverPublicKey)
        );
        return new RatchetSession(uuid);
    }

    /**
     * Encrypts a message.
     * @param plaintext The message to encrypt.
     * @param ad Associated data (optional).
     */
    async encrypt(plaintext: Uint8Array, ad: Uint8Array = new Uint8Array(0)): Promise<{ header: Uint8Array, ciphertext: Uint8Array }> {
        if (this.isClosed) throw new Error("Session is closed");

        const result = await LibsignalDezireModule.ratchetEncrypt(
            this.sessionId,
            Buffer.from(plaintext),
            Buffer.from(ad)
        );

        return {
            header: new Uint8Array(Buffer.from(result.header, 'base64')),
            ciphertext: new Uint8Array(Buffer.from(result.ciphertext, 'base64'))
        };
    }

    /**
     * Decrypts a message.
     * @param header The message header.
     * @param ciphertext The encrypted message.
     * @param ad Associated data (optional).
     */
    async decrypt(header: Uint8Array, ciphertext: Uint8Array, ad: Uint8Array = new Uint8Array(0)): Promise<Uint8Array> {
        if (this.isClosed) throw new Error("Session is closed");

        const plaintextBase64 = await LibsignalDezireModule.ratchetDecrypt(
            this.sessionId,
            Buffer.from(header),
            Buffer.from(ciphertext),
            Buffer.from(ad)
        );

        return new Uint8Array(Buffer.from(plaintextBase64, 'base64'));
    }

    /**
     * Frees the native ratchet session.
     * IMPORTANT: Must be called when the session is no longer needed to prevent memory leaks.
     */
    async close() {
        if (!this.isClosed) {
            await LibsignalDezireModule.ratchetFree(this.sessionId);
            this.isClosed = true;
        }
    }
}
