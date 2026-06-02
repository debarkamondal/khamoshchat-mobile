/**
 * Device contacts utilities.
 * Fetches contacts from the device's address book and handles database synchronization.
 */

import * as Contacts from "expo-contacts";
import { getAllContacts, batchSyncDeviceContacts } from "../storage/contacts";

export type SplitContact = {
    id: string;
    firstName: string;
    lastName: string | undefined;
    label: string;
    number: string;
};

// Store last sync time in memory to debounce sync queries
let lastSyncTime = 0;
const SYNC_COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Fetches contacts from the device with phone numbers split into separate entries.
 */
export async function getContacts(): Promise<SplitContact[] | null> {
    const splitContacts: SplitContact[] = [];
    const { status } = await Contacts.requestPermissionsAsync();
    
    if (status !== "granted") {
        return splitContacts;
    }

    const { data } = await Contacts.getContactsAsync({
        fields: ["firstName", "lastName", "phoneNumbers"],
        sort: "firstName",
    });
    
    const seenNumbers = new Set<string>();

    for (let i = 0; i < data.length; i++) {
        const contact = data[i];

        if (!contact.phoneNumbers || !Array.isArray(contact.phoneNumbers) || contact.phoneNumbers.length === 0) {
            continue;
        }

        for (let j = 0; j < contact.phoneNumbers.length; j++) {
            const numbers = contact.phoneNumbers[j];
            if (!numbers || !numbers.number) continue;

            // Normalize phone number to eliminate duplicates
            const normalized = numbers.number.replace(/[^0-9+]/g, "");
            if (!normalized) continue;

            if (seenNumbers.has(normalized)) continue;
            seenNumbers.add(normalized);

            splitContacts.push({
                firstName: contact.firstName ?? (numbers.number as string),
                lastName: contact.lastName,
                id: contact.id + "/" + j,
                number: numbers.number,
                label: numbers.label ?? "mobile",
            });
        }
    }
    return splitContacts;
}

/**
 * Syncs device contact names and IDs with registered contacts in our database.
 * Does not request permissions, only performs sync if permission has already been granted.
 */
export async function syncDeviceContacts(force = false): Promise<void> {
    const now = Date.now();
    if (!force && now - lastSyncTime < SYNC_COOLDOWN_MS) {
        return;
    }

    try {
        const { status } = await Contacts.getPermissionsAsync();
        if (status !== "granted") {
            return;
        }

        const dbContacts = await getAllContacts();
        if (dbContacts.length === 0) {
            return;
        }

        const { data: deviceContacts } = await Contacts.getContactsAsync({
            fields: [
                Contacts.Fields.FirstName,
                Contacts.Fields.LastName,
                Contacts.Fields.PhoneNumbers,
            ],
        });

        if (!deviceContacts || deviceContacts.length === 0) {
            return;
        }

        // Build mapping of normalizedPhone -> { contactId, name }
        const phoneToContactMap = new Map<string, { contactId: string; name: string }>();

        for (const contact of deviceContacts) {
            if (!contact.phoneNumbers || !Array.isArray(contact.phoneNumbers)) {
                continue;
            }

            const fullName = [contact.firstName, contact.lastName]
                .filter(Boolean)
                .join(" ")
                .trim();

            if (!fullName) continue;

            for (const numberObj of contact.phoneNumbers) {
                if (!numberObj || !numberObj.number) continue;

                const normalized = numberObj.number.replace(/[^0-9+]/g, "");
                if (!normalized) continue;

                phoneToContactMap.set(normalized, {
                    contactId: contact.id,
                    name: fullName,
                });
            }
        }

        // Identify which DB contacts need updating
        const updates: { phone: string; contactId: string; name: string }[] = [];

        for (const dbContact of dbContacts) {
            const match = phoneToContactMap.get(dbContact.phone);
            if (match) {
                // If contact_id or name changed, queue an update
                if (dbContact.contact_id !== match.contactId || dbContact.name !== match.name) {
                    updates.push({
                        phone: dbContact.phone,
                        contactId: match.contactId,
                        name: match.name,
                    });
                }
            }
        }

        if (updates.length > 0) {
            await batchSyncDeviceContacts(updates);
        }

        lastSyncTime = now;
    } catch (e) {
        console.error("[SyncContacts] Failed to sync contacts:", e);
    }
}
