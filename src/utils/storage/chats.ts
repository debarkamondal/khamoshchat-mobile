/**
 * Chat session persistence.
 * Handles saving and loading per-chat session state (ratchet state + identity key)
 * in the per-chat SQLite database.
 *
 * Errors propagate to callers — do not silently swallow failures.
 */

import { openChatDatabase } from './database';

const SESSION_KEY = 'chat_session';

/**
 * Chat session data stored per contact.
 */
export type ChatSession = {
    identityKey: string;      // Base64 encoded identity key
    ratchetState?: string;    // Serialized ratchet state (optional until initialized)
};

/**
 * Saves a chat session to the SQLite database.
 *
 * @throws StorageError on write failure
 */
export async function saveChatSession(phone: string, session: ChatSession): Promise<void> {
    const db = await openChatDatabase(phone);
    await db.runAsync(
        `INSERT OR REPLACE INTO sessions (key, value, updated_at) VALUES (?, ?, ?)`,
        SESSION_KEY,
        JSON.stringify(session),
        Date.now()
    );
}

/**
 * Loads a chat session from the SQLite database.
 * Returns undefined if no session has been stored yet.
 *
 * @throws StorageError on read failure
 */
export async function loadChatSession(phone: string): Promise<ChatSession | undefined> {
    const db = await openChatDatabase(phone);
    const row = await db.getFirstAsync<{ value: string }>(
        `SELECT value FROM sessions WHERE key = ?`,
        SESSION_KEY
    );
    if (row) {
        return JSON.parse(row.value) as ChatSession;
    }
    return undefined;
}

/**
 * Deletes a chat session from the SQLite database.
 *
 * @throws StorageError on write failure
 */
export async function deleteChatSession(phone: string): Promise<void> {
    const db = await openChatDatabase(phone);
    await db.runAsync(
        `DELETE FROM sessions WHERE key = ?`,
        SESSION_KEY
    );
}
