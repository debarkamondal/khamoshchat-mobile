/**
 * One-Time Pre-Key (OPK) management.
 * Handles generation and loading of one-time pre-keys.
 */

import LibsignalDezireModule from '@/modules/libsignal-dezire/src/LibsignalDezireModule';
import { getItemAsync, setItemAsync } from 'expo-secure-store';
import { toBase64, fromBase64 } from '../helpers/encoding';

/**
 * Generates a batch of one-time pre-keys and stores them in SecureStore.
 * Returns the public keys as Base64 strings.
 */
export async function generateOpks(count: number = 25): Promise<string[]> {
    const opksPub: string[] = [];

    for (let i = 0; i < count; i++) {
        const keyPair = await LibsignalDezireModule.genKeyPair();
        opksPub.push(toBase64(keyPair.public));
        await setItemAsync(`opks-${i}`, toBase64(keyPair.secret));
    }

    return opksPub;
}

/**
 * Loads a one-time pre-key by its ID from SecureStore.
 * Returns the private key as Uint8Array, or null if not found.
 */
export async function loadOpk(id: number): Promise<Uint8Array | null> {
    const opkStr = await getItemAsync(`opks-${id}`);
    if (!opkStr) {
        console.error('OPK not found for id:', id);
        return null;
    }
    return fromBase64(opkStr);
}


