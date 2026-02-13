/**
 * Message CRUD operations.
 * Handles reading and writing messages to the database.
 */

import { openChatDatabase, closeChatDatabase, isDatabaseOpen } from './database';
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
 */
export async function getMessages(chatId: string): Promise<Message[]> {
    const wasOpen = isDatabaseOpen(chatId);
    const db = await openChatDatabase(chatId);

    try {
        const rows = await db.getAllAsync<Message>(
            'SELECT * FROM messages ORDER BY created_at ASC'
        );
        return rows;
    } catch (error) {
        console.error(`Failed to get messages for ${chatId}:`, error);
        return [];
    } finally {
        if (!wasOpen) {
            await closeChatDatabase(chatId);
        }
    }
}

/**
 * Saves a message to the chat database.
 */
export async function saveMessage(
    chatId: string,
    message: { content: string; sender_id: string }
): Promise<void> {
    const wasOpen = isDatabaseOpen(chatId);
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

        // Update chat list in primary DB
        await upsertChatThread(chatId, message.content);

        notifyListeners(chatId);
    } catch (error) {
        console.error('Failed to save message:', error);
        throw error;
    } finally {
        if (!wasOpen) {
            await closeChatDatabase(chatId);
        }
    }
}
