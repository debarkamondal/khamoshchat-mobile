/**
 * Formatting and validation utilities for chat operations.
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

