/**
 * Encryption key management for database encryption.
 * Handles secure generation and storage of database encryption keys.
 */

import * as SecureStore from 'expo-secure-store';
import { getRandomValues } from 'expo-crypto';

// Polyfill for random values if not locally available
if (typeof global.crypto !== 'object') {
    global.crypto = {
        getRandomValues: (array: any) => getRandomValues(array),
    } as any;
}

/**
 * Sanitizes a chat ID for use in SecureStore keys.
 * SecureStore keys can only contain alphanumeric characters, ".", "-", and "_".
 */
export function sanitizeChatId(chatId: string): string {
    return chatId.replace(/[^a-z0-9.\-_]/gi, '_');
}

/**
 * Retrieves or generates a secure 32-byte hex key for a specific chat.
 * Keys are stored in SecureStore.
 */
export async function getOrGenerateDatabaseKey(chatId: string): Promise<string> {
    const safeChatId = sanitizeChatId(chatId);
    const keyAlias = `chat_key_${safeChatId}`;
    let key = await SecureStore.getItemAsync(keyAlias);

    if (!key) {
        // Generate a 32-byte key (256-bit) for SQLCipher
        const randomBytes = new Uint8Array(32);
        getRandomValues(randomBytes);
        // Convert to hex string
        key = Array.from(randomBytes)
            .map((b) => b.toString(16).padStart(2, '0'))
            .join('');

        await SecureStore.setItemAsync(keyAlias, key);
    }
    return key;
}
