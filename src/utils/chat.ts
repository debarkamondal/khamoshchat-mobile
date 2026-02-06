/**
 * Utility functions for Chat operations.
 * Separates logic from database handling.
 */

import { v4 as uuidv4 } from 'uuid';

/**
 * Generates a unique message ID.
 */
export function generateMessageId(): string {
    return uuidv4();
}

/**
 * Formats a timestamp for display.
 */
export function formatMessageTime(timestamp: number): string {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/**
 * Validates message content (e.g., separate encryption validation logic could go here later).
 */
export function validateMessage(content: string): boolean {
    return content.trim().length > 0;
}
