/**
 * Base64 encoding/decoding utilities for consistent handling across the app.
 * Uses platform-native APIs instead of Node's Buffer (not available in React Native).
 */

/**
 * Converts a Uint8Array to a Base64 string.
 */
export function toBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Converts a Base64 string to a Uint8Array.
 */
export function fromBase64(str: string): Uint8Array {
  const binary = atob(str);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Converts a UTF-8 string to a Uint8Array.
 */
export function toBytes(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

/**
 * Converts a Uint8Array to a UTF-8 string.
 */
export function toString(bytes: Uint8Array): string {
  return new TextDecoder().decode(bytes);
}
