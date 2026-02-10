/**
 * Chat session persistence.
 * Handles saving and loading per-chat session state in the SQLite database.
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
 */
export async function saveChatSession(phone: string, session: ChatSession): Promise<void> {
    try {
        const db = await openChatDatabase(phone);
        await db.runAsync(
            `INSERT OR REPLACE INTO sessions (key, value, updated_at) VALUES (?, ?, ?)`,
            SESSION_KEY,
            JSON.stringify(session),
            Date.now()
        );
    } catch (error) {
        console.error('Failed to save chat session:', error);
    }
}

/**
 * Loads a chat session from the SQLite database.
 */
export async function loadChatSession(phone: string): Promise<ChatSession | undefined> {
    try {
        const db = await openChatDatabase(phone);
        const row = await db.getFirstAsync<{ value: string }>(
            `SELECT value FROM sessions WHERE key = ?`,
            SESSION_KEY
        );
        if (row) {
            return JSON.parse(row.value) as ChatSession;
        }
    } catch (error) {
        console.error('Failed to load chat session:', error);
    }
    return undefined;
}

/**
 * Deletes a chat session from the SQLite database.
 */
export async function deleteChatSession(phone: string): Promise<void> {
    try {
        const db = await openChatDatabase(phone);
        await db.runAsync(
            `DELETE FROM sessions WHERE key = ?`,
            SESSION_KEY
        );
    } catch (error) {
        console.error('Failed to delete chat session:', error);
    }
}
