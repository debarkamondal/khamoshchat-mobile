/**
 * Chat list operations.
 * CRUD and pub/sub for the chats table in the primary database.
 */

import { getPrimaryDatabase } from './primaryDatabase';

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
const chatListListeners: ChatListListener[] = [];

/**
 * Subscribe to chat list updates.
 */
export function subscribeToChatList(listener: ChatListListener): () => void {
    chatListListeners.push(listener);
    return () => {
        const index = chatListListeners.indexOf(listener);
        if (index > -1) chatListListeners.splice(index, 1);
    };
}

/**
 * Notify all chat list listeners of an update.
 */
function notifyChatListListeners(): void {
    chatListListeners.forEach(l => l());
}

/**
 * Inserts or updates a chat thread when a message is sent/received.
 */
export async function upsertChatThread(phone: string, lastMessage: string): Promise<void> {
    const db = await getPrimaryDatabase();
    const now = Date.now();

    try {
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
    } catch (error) {
        console.error('Failed to upsert chat thread:', error);
    }
}

/**
 * Returns all chat threads ordered by most recent first.
 */
export async function getChatThreads(): Promise<ChatThread[]> {
    const db = await getPrimaryDatabase();

    try {
        return await db.getAllAsync<ChatThread>(
            'SELECT * FROM chats ORDER BY updated_at DESC'
        );
    } catch (error) {
        console.error('Failed to get chat threads:', error);
        return [];
    }
}

/**
 * Deletes a chat thread from the list.
 */
export async function deleteChatThread(phone: string): Promise<void> {
    const db = await getPrimaryDatabase();

    try {
        await db.runAsync('DELETE FROM chats WHERE phone = ?', phone);
        notifyChatListListeners();
    } catch (error) {
        console.error('Failed to delete chat thread:', error);
    }
}
