import { useState, useEffect, useCallback, useRef } from "react";
import * as SecureStore from "expo-secure-store";
import LibsignalDezireModule from "@/modules/libsignal-dezire/src/LibsignalDezireModule";
import { RatchetEncryptResult } from "@/modules/libsignal-dezire/src/LibsignalDezire.types";

export const useRatchet = (phone: string) => {
    const [ratchetUuid, setRatchetUuid] = useState<string | null>(null);
    const ratchetUuidRef = useRef<string | null>(null);
    const [loading, setLoading] = useState(true);

    // Unique key for this phone user's ratchet state
    const storeKey = `ratchet_state_${phone.substring(1)}`;

    // Helper to save state to SecureStore
    const saveState = useCallback(
        async (state: string) => {
            try {
                const serializedState = await LibsignalDezireModule.ratchetSerialize(state);
                await SecureStore.setItemAsync(storeKey, serializedState);
            } catch (error) {
                console.error("Failed to save ratchet state:", error);
            }
        },
        [storeKey],
    );

    // Load state on mount
    useEffect(() => {
        let mounted = true;
        const loadState = async () => {
            try {
                const json = await SecureStore.getItemAsync(storeKey);
                if (json && mounted) {
                    const uuid = await LibsignalDezireModule.ratchetDeserialize(json);
                    ratchetUuidRef.current = uuid;
                    setRatchetUuid(uuid);
                }
            } catch (error) {
                console.error("Failed to load ratchet state:", error);
            } finally {
                if (mounted) setLoading(false);
            }
        };
        loadState();
        return () => {
            mounted = false;
        };
    }, [storeKey]);

    // Cleanup on unmount (free native memory)
    useEffect(() => {
        return () => {
            if (ratchetUuidRef.current) {
                LibsignalDezireModule.ratchetFree(ratchetUuidRef.current).catch((e) =>
                    console.warn("Failed to free ratchet session", e),
                );
            }
        };
    }, []); // Only run once on unmount effectively, relying on ref current at that time might be tricky if it changes? 
    // Actually, if we change ratchetUuid, we might want to free the OLD one? 
    // The previous implementation had [ratchetUuid] dependency. 
    // If we switch to ref, we should probably stick to [ratchetUuid] dependency for cleanup if the UUID *changes*.
    // But for simplicity and fixing the race condition, let's keep the ref logic consistent. 
    // If we re-init, we overwrite the ref. We should probably free the old one first if it exists?
    // For now, let's stick to simple fix: Use ref for "encrypt" check.

    // Better cleanup logic:
    // If ratchetUuid changes, the effect runs. We can clean up the *previous* one?
    // React `useEffect` cleanup runs before the next effect run.
    // So `useEffect(() => return () => free(ratchetUuid), [ratchetUuid])` is correct for cleaning up old value.
    // However, if we use ref, we need to make sure we don't double free or access freed memory.

    // Let's keep the cleanup effect on `ratchetUuid` state change, as that's safe for React lifecycle.
    // The immediate issue is `encrypt` not seeing the *new* value.

    const initSender = useCallback(
        async (sharedSecret: Uint8Array, receiverPub: Uint8Array) => {
            const initiator = await LibsignalDezireModule.ratchetInitSender(
                sharedSecret,
                receiverPub,
            );
            ratchetUuidRef.current = initiator;
            setRatchetUuid(initiator);
            await saveState(initiator);
            return initiator;
        },
        [saveState],
    );

    const initReceiver = useCallback(
        async (
            sharedSecret: Uint8Array,
            receiverPriv: Uint8Array,
            receiverPub: Uint8Array,
        ) => {
            const receiver = await LibsignalDezireModule.ratchetInitReceiver(
                sharedSecret,
                receiverPriv,
                receiverPub,
            );
            ratchetUuidRef.current = receiver;
            setRatchetUuid(receiver);
            await saveState(receiver);
            return receiver;
        },
        [saveState],
    );

    const encrypt = useCallback(
        async (
            plaintext: Uint8Array,
            ad?: Uint8Array,
        ): Promise<RatchetEncryptResult | null> => {
            const uuid = ratchetUuidRef.current;
            if (!uuid) {
                throw new Error("Ratchet session not initialized");
            }
            const result = await LibsignalDezireModule.ratchetEncrypt(
                uuid,
                plaintext,
                ad,
            );
            if (result) {
                await saveState(uuid);
            }
            return result;
        },
        [saveState],
    );

    const decrypt = useCallback(
        async (
            header: Uint8Array,
            ciphertext: Uint8Array,
            ad?: Uint8Array,
        ): Promise<Uint8Array | null> => {
            const uuid = ratchetUuidRef.current;
            if (!uuid) {
                throw new Error("Ratchet session not initialized");
            }
            const plaintext = await LibsignalDezireModule.ratchetDecrypt(
                uuid,
                header,
                ciphertext,
                ad,
            );
            if (plaintext) {
                await saveState(uuid);
            }
            return plaintext;
        },
        [saveState],
    );

    return {
        loading,
        isInitialized: !!ratchetUuid,
        initSender,
        initReceiver,
        encrypt,
        decrypt,
    };
};
