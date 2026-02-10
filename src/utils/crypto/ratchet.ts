/**
 * Double Ratchet session management.
 * Handles encryption/decryption with in-memory caching and persistence.
 */

import LibsignalDezireModule from '@/modules/libsignal-dezire/src/LibsignalDezireModule';
import { RatchetEncryptResult } from '@/modules/libsignal-dezire/src/LibsignalDezire.types';
import {
    ChatSession,
    saveChatSession,
    loadChatSession,
    deleteChatSession,
} from '../storage/chats';

/**
 * In-memory cache for active sessions.
 */
type SessionCache = {
    uuid: string;             // Ratchet UUID (in-memory handle)
    identityKey: string;      // Identity key
};
const sessionCache: Record<string, SessionCache> = {};

// ===== Session Cache Management =====

/**
 * Ensures a session is loaded into the cache.
 */
async function ensureSessionLoaded(phone: string): Promise<SessionCache | undefined> {
    if (sessionCache[phone]) {
        return sessionCache[phone];
    }

    const stored = await loadChatSession(phone);
    if (stored?.ratchetState) {
        try {
            const uuid = await LibsignalDezireModule.ratchetDeserialize(stored.ratchetState);
            sessionCache[phone] = {
                uuid,
                identityKey: stored.identityKey,
            };
            return sessionCache[phone];
        } catch (e) {
            console.error('Failed to deserialize ratchet state:', e);
        }
    }

    return undefined;
}

/**
 * Persists the current session state to storage.
 */
async function persistSession(phone: string): Promise<void> {
    const cached = sessionCache[phone];
    if (!cached) return;

    const ratchetState = await LibsignalDezireModule.ratchetSerialize(cached.uuid);
    await saveChatSession(phone, {
        identityKey: cached.identityKey,
        ratchetState,
    });
}

// ===== Public API =====

/**
 * Saves an identity key for a contact.
 */
export async function saveIdentityKey(phone: string, identityKey: string): Promise<void> {
    if (sessionCache[phone]) {
        sessionCache[phone].identityKey = identityKey;
        await persistSession(phone);
    } else {
        const existing = await loadChatSession(phone);
        if (existing) {
            existing.identityKey = identityKey;
            await saveChatSession(phone, existing);
        } else {
            await saveChatSession(phone, { identityKey });
        }
    }
}

/**
 * Gets the identity key for a contact.
 */
export async function getIdentityKey(phone: string): Promise<string | undefined> {
    const cached = sessionCache[phone];
    if (cached) {
        return cached.identityKey;
    }

    const stored = await loadChatSession(phone);
    return stored?.identityKey;
}

/**
 * Initializes a sender (initiator) ratchet session.
 */
export async function initSender(
    phone: string,
    sharedSecret: Uint8Array,
    receiverPub: Uint8Array,
    identityKey?: string
): Promise<string> {
    const uuid = await LibsignalDezireModule.ratchetInitSender(sharedSecret, receiverPub);

    const existingIdentityKey = identityKey ?? (await getIdentityKey(phone)) ?? '';

    sessionCache[phone] = {
        uuid,
        identityKey: existingIdentityKey,
    };
    await persistSession(phone);
    return uuid;
}

/**
 * Initializes a receiver (responder) ratchet session.
 */
export async function initReceiver(
    phone: string,
    sharedSecret: Uint8Array,
    receiverPriv: Uint8Array,
    receiverPub: Uint8Array,
    identityKey?: string
): Promise<string> {
    const uuid = await LibsignalDezireModule.ratchetInitReceiver(
        sharedSecret,
        receiverPriv,
        receiverPub
    );

    const existingIdentityKey = identityKey ?? (await getIdentityKey(phone)) ?? '';

    sessionCache[phone] = {
        uuid,
        identityKey: existingIdentityKey,
    };
    await persistSession(phone);
    return uuid;
}

/**
 * Encrypts a message using the ratchet session.
 */
export async function encryptMessage(
    phone: string,
    plaintext: Uint8Array,
    ad?: Uint8Array
): Promise<RatchetEncryptResult | null> {
    const session = await ensureSessionLoaded(phone);
    if (!session) {
        throw new Error('Session not initialized for ' + phone);
    }

    const result = await LibsignalDezireModule.ratchetEncrypt(session.uuid, plaintext, ad);
    if (result) {
        await persistSession(phone);
    }
    return result;
}

/**
 * Decrypts a message using the ratchet session.
 */
export async function decryptMessage(
    phone: string,
    header: Uint8Array,
    ciphertext: Uint8Array,
    ad?: Uint8Array
): Promise<Uint8Array | null> {
    const session = await ensureSessionLoaded(phone);
    if (!session) {
        throw new Error('Session not initialized for ' + phone);
    }

    const plaintext = await LibsignalDezireModule.ratchetDecrypt(
        session.uuid,
        header,
        ciphertext,
        ad
    );
    if (plaintext) {
        await persistSession(phone);
    }
    return plaintext;
}

/**
 * Loads a ratchet session into cache and returns its UUID.
 */
export async function loadRatchetSession(phone: string): Promise<string | undefined> {
    const session = await ensureSessionLoaded(phone);
    return session?.uuid;
}

/**
 * Checks if a ratchet session is initialized for a phone number.
 */
export async function isRatchetInitialized(phone: string): Promise<boolean> {
    if (sessionCache[phone]) {
        return true;
    }
    const stored = await loadChatSession(phone);
    return !!stored?.ratchetState;
}

/**
 * Frees the in-memory ratchet session (does not delete from storage).
 */
export async function freeRatchetSession(phone: string): Promise<void> {
    const cached = sessionCache[phone];
    if (cached) {
        try {
            await LibsignalDezireModule.ratchetFree(cached.uuid);
        } catch (e) {
            console.warn('Failed to free ratchet session', e);
        }
        delete sessionCache[phone];
    }
}

/**
 * Clears a session completely (memory and storage).
 */
export async function clearSession(phone: string): Promise<void> {
    await freeRatchetSession(phone);
    await deleteChatSession(phone);
}

/**
 * Gets the session cache entry for a phone number.
 */
export async function getSession(phone: string): Promise<SessionCache | undefined> {
    return ensureSessionLoaded(phone);
}


