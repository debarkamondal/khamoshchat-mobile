/**
 * Device contacts utilities.
 * Fetches contacts from the device's address book.
 */

import * as Contacts from "expo-contacts";

export type SplitContact = {
    id: string;
    firstName: string;
    lastName: string | undefined;
    label: string;
    number: string;
};

/**
 * Fetches contacts from the device with phone numbers split into separate entries.
 */
export async function getContacts(): Promise<SplitContact[] | null> {
    const splitContacts: SplitContact[] = [];
    const { status } = await Contacts.requestPermissionsAsync();
    if (status === "granted") {
        const { data } = await Contacts.getContactsAsync({
            fields: ["firstName", "lastName", "phoneNumbers"],
            sort: "firstName",
        });
        
        const seenNumbers = new Set<string>();

        for (let i = 0; i < data.length; i++) {
            const contact = data[i];

            if (
                contact.phoneNumbers &&
                Array.isArray(contact.phoneNumbers) &&
                contact.phoneNumbers.length > 0
            ) {
                for (
                    let j = 0;
                    j < contact.phoneNumbers.length;
                    j++
                ) {
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
        }
    }
    return splitContacts;
}
