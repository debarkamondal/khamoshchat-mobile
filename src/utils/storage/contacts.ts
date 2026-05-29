/**
 * Contacts mapping operations.
 * Maps phone numbers to server-assigned UUIDs (user_id).
 */

import { openPrimaryDatabase } from './database';

export interface ContactMapping {
    phone: string;
    user_id: string;
    created_at: number;
}

/**
 * Saves or updates a mapping between phone number and UUID.
 */
export async function saveContact(phone: string, userId: string): Promise<void> {
    const db = await openPrimaryDatabase();
    const now = Date.now();

    await db.runAsync(
        `INSERT INTO contacts (phone, user_id, created_at)
         VALUES (?, ?, ?)
         ON CONFLICT(phone) DO UPDATE SET
             user_id = excluded.user_id,
             created_at = excluded.created_at`,
        phone,
        userId,
        now
    );
}

/**
 * Resolves a phone number to a server UUID.
 */
export async function getContactByPhone(phone: string): Promise<string | undefined> {
    const db = await openPrimaryDatabase();
    const row = await db.getFirstAsync<{ user_id: string }>(
        'SELECT user_id FROM contacts WHERE phone = ?',
        phone
    );
    return row?.user_id;
}

/**
 * Resolves a server UUID to a phone number.
 */
export async function getContactByUserId(userId: string): Promise<string | undefined> {
    const db = await openPrimaryDatabase();
    const row = await db.getFirstAsync<{ phone: string }>(
        'SELECT phone FROM contacts WHERE user_id = ?',
        userId
    );
    return row?.phone;
}
