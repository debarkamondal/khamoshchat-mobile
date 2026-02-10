/**
 * Base64 encoding/decoding utilities for consistent handling across the app.
 */

import { Buffer } from 'buffer';

/**
 * Converts a Uint8Array to a Base64 string.
 */
export function toBase64(bytes: Uint8Array): string {
    return Buffer.from(bytes).toString('base64');
}

/**
 * Converts a Base64 string to a Uint8Array.
 */
export function fromBase64(str: string): Uint8Array {
    return new Uint8Array(Buffer.from(str, 'base64'));
}

/**
 * Converts a UTF-8 string to a Uint8Array.
 */
export function toBytes(str: string): Uint8Array {
    return new Uint8Array(Buffer.from(str, 'utf-8'));
}

/**
 * Converts a Uint8Array to a UTF-8 string.
 */
export function toString(bytes: Uint8Array): string {
    return Buffer.from(bytes).toString('utf-8');
}
