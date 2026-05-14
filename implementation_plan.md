# Robust Ratchet Session Storage — Binary BLOB with Dual-Mode Persistence

## Problem

The current ratchet persistence flow is fragile and slow:

```
Rust RatchetState → serde_json (~500μs, ~15KB)
  → JSON string crosses JS bridge
    → JS writes TEXT to expo-sqlite
```

This runs on **every** `encrypt`/`decrypt` call. Problems:
1. **Data loss on crash**: If the app is killed between `ratchetEncrypt` returning and `persistSession` completing, the in-memory state has advanced but storage hasn't — the ratchet desyncs permanently.
2. **Unnecessary I/O**: Full serialize + SQLite write on every message during active chatting.
3. **JSON overhead**: `serde_json` base64-encodes every key field, emits field names — 10-50x larger and slower than binary.

## Proposed Strategy

### Binary Serialization
Replace `serde_json` with `bincode` in Rust. Serialize to raw bytes (`Vec<u8>`), pass as byte buffer through FFI, store as `BLOB` in SQLite.

| | JSON (current) | bincode (proposed) |
|---|---|---|
| Serialize time | ~100-500 μs | ~1-10 μs |
| Payload size | ~10-20 KB | ~1-3 KB |
| SQLite column | TEXT | BLOB |

### Dual-Mode Persistence

Different callers have different persistence needs:

```
              ┌──────────────────────────┐
              │     Rust (bincode)        │
              │  serialize → &[u8] BLOB   │
              └────────────┬─────────────┘
                           │
         ┌─────────────────┼──────────────────┐
         │                 │                   │
   Foreground chat    AppState.background   Background task
   (hot path)         (lifecycle event)     (push notification)
         │                 │                   │
    no persist          persist             persist
   (dirty=true)        (if dirty)       (always, after decrypt)
```

- **Foreground encrypt/decrypt**: Mutate in-memory only, mark session `dirty`. Zero I/O.
- **`AppState → background`**: Flush all dirty sessions to SQLite. One write per dirty session.
- **Background notification task**: `persistImmediately: true` — must persist before the task dies, because there's no lifecycle event to catch it.

## User Review Required

> [!IMPORTANT]
> **SQLite schema migration**: The `sessions` table `value` column changes from `TEXT` (JSON) to `BLOB` (bincode). Existing sessions stored as JSON will need a one-time migration that deserializes JSON → re-serializes as bincode. If no active sessions exist in production, we can skip the migration and just recreate.

> [!WARNING]
> **Rust dependency addition**: Adding `bincode` crate to `libsignal-dezire/Cargo.toml`. This is a well-maintained, zero-dependency crate (~50KB compiled). No impact on app binary size.

---

## Proposed Changes

### [Component] Rust Core (`libsignal-dezire`)

#### [MODIFY] [Cargo.toml](file:///Users/destiny/Important/code/khamoshchat-mobile/libsignal-dezire/Cargo.toml)
- Add `bincode = "2"` dependency.

#### [MODIFY] [ffi/ratchet.rs](file:///Users/destiny/Important/code/khamoshchat-mobile/libsignal-dezire/src/ffi/ratchet.rs)

Replace JSON serialization FFI with binary:

- **Remove**: `ratchet_serialize` (returns `*mut c_char` JSON string) and `ratchet_free_string`.
- **Add**: `ratchet_serialize_bin` — serializes `RatchetState` to `bincode`, returns `(*mut u8, usize)` byte buffer.
- **Add**: `ratchet_deserialize_bin` — takes `(*const u8, usize)`, returns `*mut RatchetState`.
- Reuse existing `ratchet_free_byte_buffer` to free the serialized output.
- Update Android JNI equivalents: `ratchetSerialize` returns `jbyteArray`, `ratchetDeserialize` takes `jbyteArray`.

---

### [Component] Native Bridge (Swift/Kotlin)

#### [MODIFY] [LibsignalDezireModule.swift](file:///Users/destiny/Important/code/khamoshchat-mobile/modules/libsignal-dezire/ios/LibsignalDezireModule.swift)

- Update `ratchetSerialize` AsyncFunction: call `ratchet_serialize_bin`, return `Data` (byte buffer) instead of `String`.
- Update `ratchetDeserialize` AsyncFunction: accept `Data` instead of `String`, call `ratchet_deserialize_bin`.
- Free the Rust buffer with `ratchet_free_byte_buffer` after copying to Swift `Data`.

#### [MODIFY] Android Kotlin module (equivalent changes)
- `ratchetSerialize` returns `ByteArray` instead of `String`.
- `ratchetDeserialize` accepts `ByteArray` instead of `String`.

---

### [Component] TypeScript Module Types

#### [MODIFY] [LibsignalDezireModule.ts](file:///Users/destiny/Important/code/khamoshchat-mobile/modules/libsignal-dezire/src/LibsignalDezireModule.ts)

Update type declarations:
```typescript
// Before
ratchetSerialize(statePtr: string): Promise<string>;
ratchetDeserialize(json: string): Promise<string>;

// After
ratchetSerialize(statePtr: string): Promise<Uint8Array>;
ratchetDeserialize(blob: Uint8Array): Promise<string>;
```

---

### [Component] Storage Layer

#### [MODIFY] [database.ts](file:///Users/destiny/Important/code/khamoshchat-mobile/src/utils/storage/database.ts)

Add migration (version 2 → 3 for per-chat DB):
```sql
-- Migration v3: Replace sessions table with typed columns
CREATE TABLE IF NOT EXISTS sessions_v2 (
    phone TEXT PRIMARY KEY NOT NULL,
    identity_key TEXT,
    ratchet_state BLOB,
    updated_at INTEGER NOT NULL
);

-- Migrate existing data (if any)
INSERT OR IGNORE INTO sessions_v2 (phone, identity_key, ratchet_state, updated_at)
    SELECT key, json_extract(value, '$.identityKey'), NULL, updated_at
    FROM sessions;

DROP TABLE IF EXISTS sessions;
ALTER TABLE sessions_v2 RENAME TO sessions;
```

> [!NOTE]
> Existing `ratchetState` in JSON format cannot be auto-converted to bincode during migration. We set `ratchet_state = NULL` for existing rows — the session will need a fresh X3DH handshake. This is acceptable since the app is pre-production.

#### [MODIFY] [chats.ts](file:///Users/destiny/Important/code/khamoshchat-mobile/src/utils/storage/chats.ts)

Rewrite to use typed columns instead of JSON blob:

```typescript
export type ChatSession = {
    identityKey: string;
    ratchetState?: Uint8Array;    // bincode blob, or undefined if not initialized
};

export async function saveChatSession(
    phone: string,
    session: ChatSession
): Promise<void> {
    const db = await openChatDatabase(phone);
    await db.runAsync(
        `INSERT OR REPLACE INTO sessions (phone, identity_key, ratchet_state, updated_at)
         VALUES (?, ?, ?, ?)`,
        phone,
        session.identityKey,
        session.ratchetState ?? null,   // expo-sqlite binds Uint8Array as BLOB
        Date.now()
    );
}

export async function loadChatSession(
    phone: string
): Promise<ChatSession | undefined> {
    const db = await openChatDatabase(phone);
    const row = await db.getFirstAsync<{
        identity_key: string;
        ratchet_state: Uint8Array | null;
    }>(`SELECT identity_key, ratchet_state FROM sessions WHERE phone = ?`, phone);

    if (row) {
        return {
            identityKey: row.identity_key,
            ratchetState: row.ratchet_state ?? undefined,
        };
    }
    return undefined;
}
```

---

### [Component] Ratchet Session Manager (TypeScript)

#### [MODIFY] [ratchet.ts](file:///Users/destiny/Important/code/khamoshchat-mobile/src/utils/crypto/ratchet.ts)

**Add dirty tracking**:
```typescript
type SessionCache = {
    uuid: string;
    identityKey: string;
    dirty: boolean;  // NEW: tracks if state has advanced since last persist
};
```

**Update `encryptMessage` / `decryptMessage`**:
- Add optional `persistImmediately?: boolean` parameter (default `false`).
- After successful encrypt/decrypt, set `dirty = true`.
- If `persistImmediately` is `true`, call `persistSession` immediately. Otherwise, skip.

**Update `persistSession`**:
- Call `ratchetSerialize(uuid)` → receives `Uint8Array` (bincode blob).
- Write blob to SQLite via updated `saveChatSession`.
- Set `dirty = false`.

**Add `flushAllDirtySessions`** (new export):
```typescript
export async function flushAllDirtySessions(): Promise<void> {
    const dirtyPhones = Object.entries(sessionCache)
        .filter(([_, s]) => s.dirty)
        .map(([phone]) => phone);

    await Promise.all(dirtyPhones.map(phone => persistSession(phone)));
}
```

---

### [Component] Message Processing

#### [MODIFY] [process.ts](file:///Users/destiny/Important/code/khamoshchat-mobile/src/utils/messaging/process.ts)

Add `persistImmediately` option that threads through to `decryptMessage`:

```typescript
export async function processIncomingMessage(
    session: Session,
    topic: string,
    rawPayload: string,
    options?: { persistImmediately?: boolean }
): Promise<string> {
    // ... existing parsing ...

    // Thread persistImmediately through to decrypt calls:
    decrypt: (header, ciphertext, ad) =>
        decryptMessage(senderPhone, header, ciphertext, ad, options?.persistImmediately),
}
```

---

### [Component] Background Notification Task

#### [MODIFY] [background.ts](file:///Users/destiny/Important/code/khamoshchat-mobile/src/utils/notifications/background.ts)

Pass `persistImmediately: true` since background tasks have no AppState lifecycle:

```typescript
const decryptedPlaintext = await processIncomingMessage(
    session, topic, payload,
    { persistImmediately: true }  // Must persist before task dies
);
```

---

### [Component] AppState Lifecycle

#### [MODIFY] [_layout.tsx](file:///Users/destiny/Important/code/khamoshchat-mobile/src/app/_layout.tsx)

Add background flush to the existing AppState listener:

```typescript
import { flushAllDirtySessions } from '@/src/utils/crypto/ratchet';

AppState.addEventListener('change', async (state) => {
    if (state === 'background' || state === 'inactive') {
        await flushAllDirtySessions();
    }
    if (state === 'active') {
        await reopenAllDatabases();
    }
});
```

---

## Open Questions

> [!IMPORTANT]
> **Separate columns vs JSON wrapper**: The plan proposes two separate columns (`identity_key TEXT`, `ratchet_state BLOB`) instead of the current single `value TEXT` JSON blob. This is cleaner but is a bigger schema change. Confirm this is acceptable.

> [!IMPORTANT]
> **Existing session migration**: Are there active ratchet sessions in production that need JSON→bincode migration, or can we just drop and recreate (accept a re-handshake)?

---

## Verification Plan

### Automated Tests

1. **Rust unit test**: `cargo test` — add a roundtrip test for `bincode` serialize/deserialize of `RatchetState`.
2. **Crypto integration**: Run the existing `verifyRatchet.ts` script — confirm encrypt/decrypt still works end-to-end after the serialization format change.

### Manual Verification

1. **Foreground chat flow**: Open a chat, send 10 messages rapidly. Verify zero SQLite writes during sending (check via console logs). Background the app → verify one flush write occurs.
2. **Background notification**: Send a push notification while app is backgrounded. Verify:
   - Message is decrypted and displayed in the local notification.
   - Ratchet state is persisted (kill app, relaunch, send another message — it should decrypt successfully).
3. **Kill test**: Chat actively (dirty state in memory), force-kill the app from Xcode **without backgrounding first** → verify the last persisted state is from the most recent `AppState.background` event, and that the next message either decrypts from that state or gracefully triggers re-negotiation.
4. **Performance benchmark**: Log `console.time` around `persistSession`. Target: <5ms per session.

---

## Suggested Improvements

> [!TIP]
> Consider these architectural improvements when executing the plan to handle edge cases and enhance reliability.

### 1. Foreground Crash Mitigation (Debounced Flush)
Instead of exclusively persisting on `AppState.background` or `persistImmediately`, implement a debounced save in the `ratchet.ts` manager. Whenever a session is marked `dirty`, set a debounced timeout for 3-5 seconds to flush it. This preserves hot-path performance while capping data loss risk if the app crashes while in the foreground.

### 2. Synchronous SQLite Writes on `AppState` changes
React Native's `AppState` events do not wait for asynchronous promises to resolve before suspending the app thread (especially on iOS). If `flushAllDirtySessions()` uses async `expo-sqlite` calls, the write might never complete. Use a synchronous API (like `db.runSync()`) to guarantee the flush completes before the OS halts execution.

### 3. Exclude `'inactive'` from the AppState trigger
The `'inactive'` state on iOS triggers very easily—even when pulling down the Control Center for a second. Dropping a database flush on this transient event might cause UI stuttering. Triggering the flush only on `'background'` guarantees the user has fully switched away.

### 4. Hardened Memory Management in Swift/Kotlin
For the Rust FFI, you pass byte buffers that must be explicitly freed via `ratchet_free_byte_buffer`. If the Swift or Kotlin code throws an exception during memory mapping, Rust memory will leak. Ensure you wrap the free call in `defer { ratchet_free_byte_buffer(ptr) }` (Swift) and `try...finally` (Kotlin) to guarantee release.
