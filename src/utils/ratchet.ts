import * as SecureStore from "expo-secure-store";
import LibsignalDezireModule from "@/modules/libsignal-dezire/src/LibsignalDezireModule";
import { RatchetEncryptResult } from "@/modules/libsignal-dezire/src/LibsignalDezire.types";

// User session data stored per contact
export type UserSession = {
    identityKey: string;      // Base64 encoded identity key
    ratchetState?: string;    // Serialized ratchet state (optional until initialized)
};

// In-memory cache for active sessions
type SessionCache = {
    uuid: string;             // Ratchet UUID (in-memory handle)
    identityKey: string;      // Identity key
};
const sessionCache: Record<string, SessionCache> = {};

// Helper to get store key
const getStoreKey = (phone: string) => `user_session_${phone.replace(/^\+/, "")}`;

// ===== User Session Persistence =====

const saveUserSession = async (phone: string, session: UserSession): Promise<void> => {
    try {
        await SecureStore.setItemAsync(getStoreKey(phone), JSON.stringify(session));
    } catch (error) {
        console.error("Failed to save user session:", error);
    }
};

const loadUserSession = async (phone: string): Promise<UserSession | undefined> => {
    try {
        const json = await SecureStore.getItemAsync(getStoreKey(phone));
        if (json) {
            return JSON.parse(json) as UserSession;
        }
    } catch (error) {
        console.error("Failed to load user session:", error);
    }
    return undefined;
};

// ===== Session Cache Management =====

const ensureSessionLoaded = async (phone: string): Promise<SessionCache | undefined> => {
    // Return from cache if available
    if (sessionCache[phone]) {
        return sessionCache[phone];
    }

    // Try loading from SecureStore
    const stored = await loadUserSession(phone);
    if (stored && stored.ratchetState) {
        try {
            const uuid = await LibsignalDezireModule.ratchetDeserialize(stored.ratchetState);
            sessionCache[phone] = {
                uuid,
                identityKey: stored.identityKey,
            };
            return sessionCache[phone];
        } catch (e) {
            console.error("Failed to deserialize ratchet state:", e);
        }
    }

    return undefined;
};

const persistSession = async (phone: string): Promise<void> => {
    const cached = sessionCache[phone];
    if (!cached) return;

    const ratchetState = await LibsignalDezireModule.ratchetSerialize(cached.uuid);
    await saveUserSession(phone, {
        identityKey: cached.identityKey,
        ratchetState,
    });
};

// ===== Public API =====

export const saveIdentityKey = async (phone: string, identityKey: string): Promise<void> => {
    if (sessionCache[phone]) {
        sessionCache[phone].identityKey = identityKey;
        await persistSession(phone);
    } else {
        // Load existing session if any, or create new entry
        const existing = await loadUserSession(phone);
        if (existing) {
            existing.identityKey = identityKey;
            await saveUserSession(phone, existing);
        } else {
            // Create new session with just identity key
            await saveUserSession(phone, {
                identityKey,
            });
        }
    }
};

export const getIdentityKey = async (phone: string): Promise<string | undefined> => {
    const cached = sessionCache[phone];
    if (cached) {
        return cached.identityKey;
    }

    const stored = await loadUserSession(phone);
    return stored?.identityKey;
};

export const initSender = async (
    phone: string,
    sharedSecret: Uint8Array,
    receiverPub: Uint8Array,
    identityKey?: string
): Promise<string> => {
    const uuid = await LibsignalDezireModule.ratchetInitSender(sharedSecret, receiverPub);

    // Get existing identity key or use provided one
    const existingIdentityKey = identityKey ?? (await getIdentityKey(phone)) ?? "";

    sessionCache[phone] = {
        uuid,
        identityKey: existingIdentityKey,
    };
    await persistSession(phone);
    return uuid;
};

export const initReceiver = async (
    phone: string,
    sharedSecret: Uint8Array,
    receiverPriv: Uint8Array,
    receiverPub: Uint8Array,
    identityKey?: string
): Promise<string> => {
    const uuid = await LibsignalDezireModule.ratchetInitReceiver(
        sharedSecret,
        receiverPriv,
        receiverPub
    );

    // Get existing identity key or use provided one
    const existingIdentityKey = identityKey ?? (await getIdentityKey(phone)) ?? "";

    sessionCache[phone] = {
        uuid,
        identityKey: existingIdentityKey,
    };
    await persistSession(phone);
    return uuid;
};

export const encryptMessage = async (
    phone: string,
    plaintext: Uint8Array,
    ad?: Uint8Array
): Promise<RatchetEncryptResult | null> => {
    const session = await ensureSessionLoaded(phone);
    if (!session) {
        throw new Error("Session not initialized for " + phone);
    }

    const result = await LibsignalDezireModule.ratchetEncrypt(session.uuid, plaintext, ad);
    if (result) {
        await persistSession(phone);
    }
    return result;
};

export const decryptMessage = async (
    phone: string,
    header: Uint8Array,
    ciphertext: Uint8Array,
    ad?: Uint8Array
): Promise<Uint8Array | null> => {
    const session = await ensureSessionLoaded(phone);
    if (!session) {
        throw new Error("Session not initialized for " + phone);
    }

    const plaintext = await LibsignalDezireModule.ratchetDecrypt(session.uuid, header, ciphertext, ad);
    if (plaintext) {
        await persistSession(phone);
    }
    return plaintext;
};

export const loadRatchetSession = async (phone: string): Promise<string | undefined> => {
    const session = await ensureSessionLoaded(phone);
    return session?.uuid;
};

export const isRatchetInitialized = async (phone: string): Promise<boolean> => {
    if (sessionCache[phone]) {
        return true;
    }
    const stored = await loadUserSession(phone);
    return !!stored?.ratchetState;
};

export const freeRatchetSession = async (phone: string): Promise<void> => {
    const cached = sessionCache[phone];
    if (cached) {
        try {
            await LibsignalDezireModule.ratchetFree(cached.uuid);
        } catch (e) {
            console.warn("Failed to free ratchet session", e);
        }
        delete sessionCache[phone];
    }
};

export const clearSession = async (phone: string): Promise<void> => {
    await freeRatchetSession(phone);
    try {
        await SecureStore.deleteItemAsync(getStoreKey(phone));
    } catch (error) {
        console.error("Failed to clear session:", error);
    }
};

export const getSession = async (phone: string): Promise<SessionCache | undefined> => {
    return ensureSessionLoaded(phone);
};
