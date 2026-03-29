/**
 * Storage error hierarchy.
 * Allows callers to distinguish recoverable vs unrecoverable failures
 * and show appropriate UI instead of silently returning empty data.
 */

/**
 * Base class for all storage errors.
 * - recoverable: true  → transient failure, caller may retry
 * - recoverable: false → data is unrecoverable, inform the user
 */
export class StorageError extends Error {
    readonly code: string;
    readonly recoverable: boolean;

    constructor(code: string, message: string, recoverable: boolean) {
        super(message);
        this.name = 'StorageError';
        this.code = code;
        this.recoverable = recoverable;
    }
}

/**
 * The PRAGMA key did not decrypt the database file.
 * Happens when SecureStore is wiped (e.g. Android reinstall) but the
 * DB file still exists on disk, or when credentials are corrupted.
 * NOT recoverable — data cannot be decrypted without the original key.
 */
export class DatabaseKeyMismatchError extends StorageError {
    readonly chatId: string;

    constructor(chatId: string) {
        super(
            'DB_KEY_MISMATCH',
            `Encryption key does not match the database for "${chatId}".` +
            ` This can happen after a reinstall. Chat history may be unrecoverable.`,
            false
        );
        this.name = 'DatabaseKeyMismatchError';
        this.chatId = chatId;
    }
}

/**
 * The database file is corrupted and cannot be read.
 * NOT recoverable without deleting and recreating the database.
 */
export class DatabaseCorruptedError extends StorageError {
    readonly chatId: string;

    constructor(chatId: string, cause?: unknown) {
        super(
            'DB_CORRUPTED',
            `Database for "${chatId}" is corrupted.`,
            false
        );
        this.name = 'DatabaseCorruptedError';
        this.chatId = chatId;
        if (cause instanceof Error) {
            this.stack = this.stack + '\nCaused by: ' + cause.stack;
        }
    }
}

/**
 * Transient connection failure — the DB handle is stale or the DB is not
 * open yet. IS recoverable — caller should retry after reopening.
 */
export class DatabaseConnectionError extends StorageError {
    readonly chatId: string;

    constructor(chatId: string, cause?: unknown) {
        super(
            'DB_CONNECTION_ERROR',
            `Database connection for "${chatId}" is not available.`,
            true
        );
        this.name = 'DatabaseConnectionError';
        this.chatId = chatId;
        if (cause instanceof Error) {
            this.stack = this.stack + '\nCaused by: ' + cause.stack;
        }
    }
}
