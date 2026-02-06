import * as SQLite from 'expo-sqlite';
import * as SecureStore from 'expo-secure-store';
import { Paths } from 'expo-file-system';
import { getRandomValues } from 'expo-crypto';
import { generateMessageId } from './chat';

// Polyfill for random values if not locally available (though we have a polyfill file, ensuring safety)
if (typeof global.crypto !== 'object') {
    global.crypto = {
        getRandomValues: (array: any) => getRandomValues(array),
    } as any;
}

/**
 * Manages database connections.
 * We store active DB connections in a map to avoid opening double connections
 * if the user navigates quickly or if we have background tasks.
 */
const activeDatabases = new Map<string, SQLite.SQLiteDatabase>();

/**
 * Retrieves or generates a secure 32-byte hex key for a specific chat.
 * Stored in SecureStore.
 */
async function getOrGenerateKey(chatId: string): Promise<string> {
    // SecureStore keys can only contain alphanumeric characters, ".", "-", and "_".
    // We sanitize the chatId (e.g. replace '+' in phone numbers with '')
    const safeChatId = chatId.replace(/[^a-z0-9.\-_]/gi, '_');
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

/**
 * Opens a database for a specific chat with encryption.
 * Applies the 'useLibSQL' configuration via app.json.
 * 
 * @param chatId - The unique identifier for the chat.
 * @returns The database instance.
 */
export async function getChatDatabase(chatId: string): Promise<SQLite.SQLiteDatabase> {
    if (activeDatabases.has(chatId)) {
        return activeDatabases.get(chatId)!;
    }

    // Retrieve encryption key
    const key = await getOrGenerateKey(chatId);

    // Generate safe filename
    const safeChatId = chatId.replace(/[^a-z0-9.\-_]/gi, '_');
    // Paths.document.uri gives the directory URI. We ensure a slash separator.
    const dbName = `${Paths.document.uri}/chat_${safeChatId}.db`;

    // When useLibSQL is true, it may expect a file URL.
    const db = await SQLite.openDatabaseAsync(dbName);

    // Apply Encryption Immediately
    await db.execAsync(`PRAGMA key = '${key}';`);

    // Ensure Foreign Keys are ON
    await db.execAsync('PRAGMA foreign_keys = ON;');

    // Apply default schema migration if needed
    await migrateDatabase(db);

    activeDatabases.set(chatId, db);
    return db;
}

/**
 * Closes the database connection for a specific chat.
 * Should be called when the user leaves the chat screen.
 */
export async function closeChatDatabase(chatId: string): Promise<void> {
    const db = activeDatabases.get(chatId);
    if (db) {
        try {
            await db.closeAsync();
        } catch (e) {
            console.warn(`Failed to close database for chat ${chatId}`, e);
        } finally {
            activeDatabases.delete(chatId);
        }
    }
}

/**
 * Listeners for DB updates
 */
type Listener = (chatId: string) => void;
const listeners: Listener[] = [];

export function subscribeToMessages(listener: Listener) {
    listeners.push(listener);
    return () => {
        const index = listeners.indexOf(listener);
        if (index > -1) listeners.splice(index, 1);
    };
}

export interface Message {
    id: string;
    content: string;
    sender_id: string;
    created_at: number;
    status: 'sent' | 'delivered' | 'read';
}

/**
 * Retrieves all messages for a chat, ordered by time.
 */
export async function getMessages(chatId: string): Promise<Message[]> {
    const isConnectionAlreadyOpen = activeDatabases.has(chatId);
    const db = await getChatDatabase(chatId); // This ensures we open it if needed

    try {
        const rows = await db.getAllAsync<Message>(
            'SELECT * FROM messages ORDER BY created_at ASC'
        );
        return rows;
    } catch (error) {
        console.error(`Failed to get messages for ${chatId}:`, error);
        return [];
    } finally {
        // If we opened it just for this query, close it.
        if (!isConnectionAlreadyOpen) {
            await closeChatDatabase(chatId);
        }
    }
}

/**
 * Saves a message to the chat database.
 * Handles connection management:
 * - If the user is on the screen (connection open), it uses the open connection.
 * - If the user is NOT on the screen (connection closed), it opens, saves, and closes.
 */
export async function saveMessage(chatId: string, message: { content: string; sender_id: string }) {
    const isConnectionAlreadyOpen = activeDatabases.has(chatId);
    const db = await getChatDatabase(chatId);

    try {
        const id = generateMessageId();
        const created_at = Date.now();

        await db.runAsync(
            'INSERT INTO messages (id, content, sender_id, created_at, status) VALUES (?, ?, ?, ?, ?)',
            id,
            message.content,
            message.sender_id,
            created_at,
            'sent'
        );

        // Notify listeners
        listeners.forEach(l => l(chatId));

    } catch (error) {
        console.error('Failed to save message:', error);
        throw error;
    } finally {
        // If the connection wasn't open when we started (e.g., background sync), close it now.
        if (!isConnectionAlreadyOpen) {
            await closeChatDatabase(chatId);
        }
    }
}

/**
 * Initial Schema Migration
 * Ensure tables exist for messages, etc.
 */
async function migrateDatabase(db: SQLite.SQLiteDatabase) {
    const DATABASE_VERSION = 1;
    const result = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
    let currentVersion = result?.user_version ?? 0;

    if (currentVersion >= DATABASE_VERSION) {
        return;
    }

    if (currentVersion === 0) {
        await db.execAsync(`
      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY NOT NULL,
        content TEXT,
        sender_id TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        status TEXT DEFAULT 'sent'
      );
      
      CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
    `);

        // Future: Add attachments, reactions tables here
    }

    await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
}
