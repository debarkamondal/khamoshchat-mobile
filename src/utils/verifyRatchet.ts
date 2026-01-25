import { RatchetSession } from "./ratchet";
import LibsignalDezireModule from "@/modules/libsignal-dezire/src/LibsignalDezireModule";
import { Buffer } from "buffer";

export const verifyRatchet = async () => {
    console.log("Starting Ratchet Verification...");

    try {
        // 1. Generate keys for Alice (Sender) and Bob (Receiver)
        // In a real scenario, this would involve X3DH. Here we simulate the shared secret and keys.

        // Let's pretend we have a shared secret established via X3DH
        const sharedSecret = new Uint8Array(32);
        crypto.getRandomValues(sharedSecret);

        // Bob needs a key pair for the ratchet initialization (Receiver's key)
        const bobKeyPair = await LibsignalDezireModule.genKeyPair();
        const bobPrivate = new Uint8Array(bobKeyPair.secret); // Assuming genKeyPair returns bytes
        const bobPublic = new Uint8Array(bobKeyPair.public);

        console.log("Keys generated.");

        // 2. Initialize Sessions
        const aliceSession = await RatchetSession.createSender(sharedSecret, bobPublic);
        console.log("Alice (Sender) session initialized.");

        const bobSession = await RatchetSession.createReceiver(sharedSecret, bobPrivate, bobPublic);
        console.log("Bob (Receiver) session initialized.");

        // 3. Encrypt Message from Alice
        const message = "Hello, Bob! This is a secure message.";
        const plaintext = new TextEncoder().encode(message);

        console.log(`Alice sending: "${message}"`);
        const { header, ciphertext } = await aliceSession.encrypt(plaintext);
        console.log("Message encrypted.");

        // 4. Decrypt Message by Bob
        const decryptedBytes = await bobSession.decrypt(header, ciphertext);
        const decryptedMessage = new TextDecoder().decode(decryptedBytes);
        console.log(`Bob received: "${decryptedMessage}"`);

        // 5. Verify
        if (message === decryptedMessage) {
            console.log("SUCCESS: Message round-trip verified!");
        } else {
            console.error("FAILURE: Decrypted message does not match original.");
        }

        // 6. Reply from Bob (Ratchet should handle turn-taking if implemented correctly in FFI, 
        // strictly speaking double ratchet allows this, but our simplified FFI might be half-duplex if not careful.
        // The detailed double ratchet usually updates chains. Let's test a reply.)

        const reply = "Hi Alice! Loud and clear.";
        const replyPlaintext = new TextEncoder().encode(reply);
        console.log(`Bob replying: "${reply}"`);

        const replyEnc = await bobSession.encrypt(replyPlaintext);
        const replyDecBytes = await aliceSession.decrypt(replyEnc.header, replyEnc.ciphertext);
        const replyDec = new TextDecoder().decode(replyDecBytes);
        console.log(`Alice received reply: "${replyDec}"`);

        if (reply === replyDec) {
            console.log("SUCCESS: Reply round-trip verified!");
        } else {
            console.error("FAILURE: Reply decryption failed.");
        }

        // 7. Cleanup
        await aliceSession.close();
        await bobSession.close();
        console.log("Sessions closed.");

    } catch (e) {
        console.error("Verification Error:", e);
    }
}
