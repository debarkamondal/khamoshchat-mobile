/**
 * Primary database connection management.
 * Singleton encrypted SQLite database for app-wide data (chat list, etc.).
 */

import * as SQLite from 'expo-sqlite';
import { Paths } from 'expo-file-system';
import { getOrCreateDatabaseCredentials } from './keys';

const PRIMARY_CHAT_ID = '__primary__';

let primaryDb: SQLite.SQLiteDatabase | null = null;

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
