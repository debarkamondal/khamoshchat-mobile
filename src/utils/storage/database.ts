/**
 * Database connection management.
 * Handles opening, closing, and migrating SQLite databases.
 */

import * as SQLite from 'expo-sqlite';
import { Paths } from 'expo-file-system';
import { getOrCreateDatabaseCredentials } from './keys';

const PRIMARY_CHAT_ID = '__primary__';

/**
 * Active database connections pool.
 * Avoids opening duplicate connections for the same chat.
 */
const activeDatabases = new Map<string, SQLite.SQLiteDatabase>();
let primaryDb: SQLite.SQLiteDatabase | null = null;

/**
 * Opens a database for a specific chat with encryption.
 */
export async function openChatDatabase(chatId: string): Promise<SQLite.SQLiteDatabase> {
    if (activeDatabases.has(chatId)) {
        return activeDatabases.get(chatId)!;
    }

    // Retrieve encryption key and UUID-based database ID
    const { key, dbId } = await getOrCreateDatabaseCredentials(chatId);

    // Use UUID as filename to obfuscate user info
    const db = await SQLite.openDatabaseAsync(`${dbId}.db`, {}, Paths.document.uri);

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
 * Opens the primary database with encryption and WAL mode.
 * Safe to call multiple times — returns the cached connection.
 */
export async function openPrimaryDatabase(): Promise<SQLite.SQLiteDatabase> {
    if (primaryDb) {
        return primaryDb;
    }

    const { key, dbId } = await getOrCreateDatabaseCredentials(PRIMARY_CHAT_ID);
    const db = await SQLite.openDatabaseAsync(`${dbId}.db`, {}, Paths.document.uri);

    await db.execAsync(`PRAGMA key = '${key}';`);
    await db.execAsync('PRAGMA foreign_keys = ON;');
    await db.execAsync('PRAGMA journal_mode = WAL;');

    await migratePrimaryDatabase(db);

    primaryDb = db;
    return db;
}

/**
 * Returns the primary database, opening it if needed.
 */
export async function getPrimaryDatabase(): Promise<SQLite.SQLiteDatabase> {
    return openPrimaryDatabase();
}

/**
 * Closes the primary database connection.
 */
export async function closePrimaryDatabase(): Promise<void> {
    if (primaryDb) {
        try {
            await primaryDb.closeAsync();
        } catch (e) {
            console.warn('Failed to close primary database', e);
        } finally {
            primaryDb = null;
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

/**
 * Schema migration for the primary database.
 */
async function migratePrimaryDatabase(db: SQLite.SQLiteDatabase): Promise<void> {
    const DATABASE_VERSION = 1;
    const result = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
    const currentVersion = result?.user_version ?? 0;

    if (currentVersion >= DATABASE_VERSION) {
        return;
    }

    if (currentVersion < 1) {
        await db.execAsync(`
            CREATE TABLE IF NOT EXISTS chats (
                phone         TEXT PRIMARY KEY NOT NULL,
                name          TEXT,
                last_message  TEXT,
                last_message_at INTEGER NOT NULL,
                unread_count  INTEGER DEFAULT 0,
                updated_at    INTEGER NOT NULL
            );

            CREATE INDEX IF NOT EXISTS idx_chats_updated ON chats(updated_at DESC);
        `);
    }

    await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
}
