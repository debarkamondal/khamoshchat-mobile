/**
 * Message CRUD operations.
 * Handles reading and writing messages to the per-chat database.
 *
 * DB lifecycle contract:
 *   - getMessages / saveMessage: require the DB to already be open.
 *     Use these in the chat screen which manages its own DB connection.
 *   - saveMessageWithAutoOpen: opens/closes the DB itself.
 *     Use this in background contexts (MQTT handler, inbox retry).
 */

import { openChatDatabase, closeChatDatabase, isDatabaseOpen, requireChatDatabase } from './database';
import { generateMessageId } from '../helpers/formatting';
import { upsertChatThread } from './chatList';

/**
 * Message type definition.
 */
export interface Message {
    id: string;
    content: string;
    sender_id: string;
    created_at: number;
    status: 'sent' | 'delivered' | 'read';
}

/**
 * Listeners for message updates.
 */
type MessageListener = (chatId: string) => void;
const listeners: MessageListener[] = [];

/**
 * Subscribe to message updates.
 */
export function subscribeToMessages(listener: MessageListener): () => void {
    listeners.push(listener);
    return () => {
        const index = listeners.indexOf(listener);
        if (index > -1) listeners.splice(index, 1);
    };
}

/**
 * Notify all listeners of a message update.
 */
function notifyListeners(chatId: string): void {
    listeners.forEach(l => l(chatId));
}

/**
 * Retrieves all messages for a chat, ordered by time.
 * REQUIRES the chat DB to already be open (call openChatDatabase first).
 *
 * @throws DatabaseConnectionError if the DB is not open
 */
export async function getMessages(chatId: string): Promise<Message[]> {
    const db = requireChatDatabase(chatId);
    const rows = await db.getAllAsync<Message>(
        'SELECT * FROM messages ORDER BY created_at ASC'
    );
    return rows;
}

/**
 * Saves a message to the chat database.
 * REQUIRES the chat DB to already be open (the chat screen manages this).
 *
 * @throws DatabaseConnectionError if the DB is not open
 * @throws StorageError on write failure
 */
export async function saveMessage(
    chatId: string,
    message: { content: string; sender_id: string }
): Promise<void> {
    const db = requireChatDatabase(chatId);
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

    // Update chat list in primary DB
    await upsertChatThread(chatId, message.content);
    notifyListeners(chatId);
}

/**
 * Saves a message, opening and closing the DB connection itself.
 * Use this in background contexts (MQTT handler, inbox retry) where the
 * chat screen may not be open and managing the DB lifecycle.
 *
 * @throws StorageError on write failure
 */
export async function saveMessageWithAutoOpen(
    chatId: string,
    message: { content: string; sender_id: string }
): Promise<void> {
    const wasAlreadyOpen = isDatabaseOpen(chatId);
    const db = await openChatDatabase(chatId);

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

        await upsertChatThread(chatId, message.content);
        notifyListeners(chatId);
    } finally {
        // Only close if we opened it ourselves — don't close a DB the chat screen is using
        if (!wasAlreadyOpen) {
            await closeChatDatabase(chatId);
        }
    }
}
