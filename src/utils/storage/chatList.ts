/**
 * Chat list operations.
 * CRUD and pub/sub for the chats table in the primary database.
 *
 * Errors propagate to callers — do not silently return empty arrays.
 * The UI layer is responsible for catching StorageError and showing
 * appropriate feedback.
 */

import { getPrimaryDatabase } from './database';

/**
 * Chat thread entry for the home screen list.
 */
export interface ChatThread {
    phone: string;
    name: string | null;
    last_message: string | null;
    last_message_at: number;
    unread_count: number;
    updated_at: number;
}

/**
 * Listeners for chat list updates.
 */
type ChatListListener = () => void;
const chatListListeners: Set<ChatListListener> = new Set();

/**
 * Subscribe to chat list updates.
 * Returns an unsubscribe function.
 */
export function subscribeToChatList(listener: ChatListListener): () => void {
    chatListListeners.add(listener);
    return () => chatListListeners.delete(listener);
}

/**
 * Notify all chat list listeners of an update.
 */
function notifyChatListListeners(): void {
    chatListListeners.forEach(l => l());
}

/**
 * Inserts or updates a chat thread when a message is sent/received.
 *
 * @throws StorageError on write failure
 */
export async function upsertChatThread(phone: string, lastMessage: string): Promise<void> {
    const db = await getPrimaryDatabase();
    const now = Date.now();

    await db.runAsync(
        `INSERT INTO chats (phone, last_message, last_message_at, unread_count, updated_at)
         VALUES (?, ?, ?, 0, ?)
         ON CONFLICT(phone) DO UPDATE SET
             last_message = excluded.last_message,
             last_message_at = excluded.last_message_at,
             updated_at = excluded.updated_at`,
        phone,
        lastMessage,
        now,
        now
    );

    notifyChatListListeners();
}

/**
 * Returns all chat threads ordered by most recent first.
 *
 * @throws StorageError on read failure
 */
export async function getChatThreads(): Promise<ChatThread[]> {
    const db = await getPrimaryDatabase();
    return db.getAllAsync<ChatThread>(
        'SELECT * FROM chats ORDER BY updated_at DESC'
    );
}

/**
 * Deletes a chat thread from the list.
 *
 * @throws StorageError on write failure
 */
export async function deleteChatThread(phone: string): Promise<void> {
    const db = await getPrimaryDatabase();
    await db.runAsync('DELETE FROM chats WHERE phone = ?', phone);
    notifyChatListListeners();
}
