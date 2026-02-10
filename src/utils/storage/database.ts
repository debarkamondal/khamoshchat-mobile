/**
 * Database connection management.
 * Handles opening, closing, and migrating SQLite databases.
 */

import * as SQLite from 'expo-sqlite';
import { Paths } from 'expo-file-system';
import { getOrGenerateDatabaseKey, sanitizeChatId } from './keys';

/**
 * Active database connections pool.
 * Avoids opening duplicate connections for the same chat.
 */
const activeDatabases = new Map<string, SQLite.SQLiteDatabase>();

/**
 * Opens a database for a specific chat with encryption.
 */
export async function openChatDatabase(chatId: string): Promise<SQLite.SQLiteDatabase> {
    if (activeDatabases.has(chatId)) {
        return activeDatabases.get(chatId)!;
    }

    // Retrieve encryption key
    const key = await getOrGenerateDatabaseKey(chatId);

    // Generate safe filename
    const safeChatId = sanitizeChatId(chatId);
    const dbName = `${Paths.document.uri}/chat_${safeChatId}.db`;

    const db = await SQLite.openDatabaseAsync(dbName);

    // Apply Encryption
    await db.execAsync(`PRAGMA key = '${key}';`);

    // Ensure Foreign Keys are ON
    await db.execAsync('PRAGMA foreign_keys = ON;');

    // Enable WAL mode for better concurrent read/write performance
    await db.execAsync('PRAGMA journal_mode = WAL;');

    // Apply schema migration if needed
    await migrateDatabase(db);

    activeDatabases.set(chatId, db);
    return db;
}

/**
 * Closes the database connection for a specific chat.
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
 * Checks if a database connection is already open for a chat.
 */
export function isDatabaseOpen(chatId: string): boolean {
    return activeDatabases.has(chatId);
}

/**
 * Schema migration for the database.
 */
async function migrateDatabase(db: SQLite.SQLiteDatabase): Promise<void> {
    const DATABASE_VERSION = 2;
    const result = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
    const currentVersion = result?.user_version ?? 0;

    if (currentVersion >= DATABASE_VERSION) {
        return;
    }

    if (currentVersion < 1) {
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
    }

    if (currentVersion < 2) {
        // Add sessions table for ratchet state storage (no size limit unlike SecureStore)
        await db.execAsync(`
            CREATE TABLE IF NOT EXISTS sessions (
                key TEXT PRIMARY KEY NOT NULL,
                value TEXT NOT NULL,
                updated_at INTEGER NOT NULL
            );
        `);
    }

    await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
}
