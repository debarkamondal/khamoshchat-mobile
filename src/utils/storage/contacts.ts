/**
 * Contacts mapping operations.
 * Maps phone numbers to server-assigned UUIDs (user_id) and device contacts (contact_id).
 */

import { openPrimaryDatabase } from './database';

export interface ContactMapping {
    phone: string;
    user_id: string;
    contact_id: string | null;
    name: string | null;
    picture: string | null;
    created_at: number;
}

/**
 * Saves or updates a mapping between phone number and UUID, along with optional server picture.
 */
export async function saveContact(phone: string, userId: string, picture?: string): Promise<void> {
    const db = await openPrimaryDatabase();
    const now = Date.now();

    await db.runAsync(
        `INSERT INTO contacts (phone, user_id, picture, created_at)
         VALUES (?, ?, ?, ?)
         ON CONFLICT(phone) DO UPDATE SET
             user_id = excluded.user_id,
             picture = COALESCE(excluded.picture, contacts.picture),
             created_at = excluded.created_at`,
        phone,
        userId,
        picture || null,
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

/**
 * Loads full contact mapping info by server UUID.
 */
export async function getContactInfo(userId: string): Promise<ContactMapping | undefined> {
    const db = await openPrimaryDatabase();
    const row = await db.getFirstAsync<ContactMapping>(
        'SELECT phone, user_id, contact_id, name, picture, created_at FROM contacts WHERE user_id = ?',
        userId
    );
    return row || undefined;
}

/**
 * Loads all known contacts from the database.
 */
export async function getAllContacts(): Promise<ContactMapping[]> {
    const db = await openPrimaryDatabase();
    return db.getAllAsync<ContactMapping>(
        'SELECT phone, user_id, contact_id, name, picture, created_at FROM contacts'
    );
}

/**
 * Batch updates device contact IDs and names.
 */
export async function batchSyncDeviceContacts(
    entries: { phone: string; contactId: string; name: string }[]
): Promise<void> {
    if (entries.length === 0) return;
    const db = await openPrimaryDatabase();
    
    await db.withTransactionAsync(async () => {
        for (const entry of entries) {
            await db.runAsync(
                `UPDATE contacts 
                 SET contact_id = ?, name = ? 
                 WHERE phone = ?`,
                entry.contactId,
                entry.name,
                entry.phone
            );
        }
    });
}
