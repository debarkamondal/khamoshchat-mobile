---
name: code-cleanup
description: >
  Audits and cleans up the KhamoshChat codebase. Invoke when the user asks to
  "clean up", "refactor", "audit dead code", "de-slopify", "improve code
  quality", "security audit", or any similar phrasing. Scope can be the whole
  project or a single directory/file. Always produces an audit report first,
  then executes changes with the user's approval.
---

# Code Cleanup Skill — KhamoshChat (Expo · React Native · TypeScript)

## How to invoke

The user may say things like:
- "clean up the codebase" / "do a cleanup pass"
- "de-slopify `src/utils/`"
- "audit dead code in `src/hooks/`"
- "security audit"
- "fix code smells" / "refactor arrowhead functions"
- "improve naming" / "remove boilerplate"

**Always audit first, then act.** Never make changes without showing the user
a prioritised list of findings and getting a go-ahead (explicit or implicit
from context). If the user says "just do it", proceed without asking again.

---

## Step 1 — Scope & Read

Before touching anything:

1. Identify the **scope** from the user's request (whole `src/`, a directory,
   or a single file). Default to `src/` if unspecified.
2. `view` the relevant files. For a directory, list it first then read the
   files most likely to have issues: largest files, files with many exports,
   files previously discussed.
3. Re-read `AGENTS.md` at the root if not already in context — it is the
   canonical source of truth for conventions in this project.

---

## Step 2 — Audit

Scan for every category below. Record each finding with:
- File path and line number (or function/symbol name)
- Category label (A, B, C … H)
- One-line description of the problem
- Severity: **High** (breaks things, runtime cost, or security risk),
  **Medium** (hurts maintainability), **Low** (cosmetic/style)

---

### A. Dead Code

- **Unused exports**: symbols exported but never imported anywhere in `src/`.
  Grep the whole codebase before marking something dead — don't guess.
- **Unreachable files**: files never imported and not route files
  (`src/app/**`) or polyfills.
- **Dead parameters**: function parameters defined but never read inside the
  body.
- **Commented-out code blocks**: large sections of commented code that are not
  doc comments or intentional annotations.

---

### B. TypeScript Hygiene

- **`any` usage**: replace with a real type or `unknown` + narrowing.
- **Missing return types on exported functions**: strict mode is on — exported
  functions must have explicit return type annotations.
- **Unused imports**: imported symbols never referenced in the file.
- **Redundant type assertions**: `as X` where the type is already inferred.
- **`@ts-ignore` / `@ts-expect-error`** with no explanation comment — flag for
  review; do not silently remove, as some may be intentional workarounds.

---

### C. React / React Native Patterns

- **Inline `style={{ }}` in JSX**: creates a new object every render and
  defeats the React Compiler. Move into `useThemedStyles` (if it reads
  `colors`) or `StyleSheet.create` (if static).
- **Missing `key` props** in list renders.
- **`useEffect` subscriptions / timers without cleanup**: must return a
  cleanup function.
- **Zustand selectors missing**: `useSession()` with no selector causes the
  component to re-render on any store change. Prefer
  `useSession(s => s.field)`.
- **Unnecessary re-render triggers**: inline functions or object literals
  passed as props that should be `useCallback` / `useMemo`.

---

### D. Logging Quality

- **`console.log` in non-debug paths**: use `console.debug` for trace-level
  info, `console.warn` for recoverable problems, `console.error` for failures.
  Raw `console.log` is a leftover debugging sign.
- **Silent `catch` blocks**: `catch(e) {}` or `catch { }` with no logging
  swallows errors. Add at minimum `console.warn('[module] description', e)`.
- **Noisy debug logs in hot paths**: high-frequency paths (message processing,
  MQTT message handlers) should use `console.debug`, not `console.log`, so
  they can be filtered in production.

---

### E. Arrowhead / Complexity Anti-patterns

Flag any function with **3+ levels of nesting** (if → try → if → …):

- Long sequential `try/catch` chains doing multiple unrelated async steps —
  break into private named helpers (`fetchX`, `processY`, `storeZ`).
- Giant `if / else if / else` dispatchers — delegate to named handler
  functions and use early returns (guard clauses) at the top.
- Callbacks nested inside callbacks — flatten with `async/await`.
- Functions longer than ~80 lines that do more than one logical thing.

When refactoring: extract helpers as **unexported functions** in the same file
unless they are genuinely reusable, in which case propose a new utility file.

---

### F. Slop & Code Quality

#### F1. AI-generated boilerplate
- **Over-commenting**: comments that restate exactly what the code does
  (`// increment counter` above `counter++`). Delete them — code should be
  self-explanatory; comments should explain *why*, not *what*.
- **Verbose over-engineering**: abstractions, wrapper classes, or factory
  functions that add indirection with no benefit for a codebase of this size.
  Prefer a direct function call over a class with one method.
- **Unnecessary interfaces for single-use shapes**: inline the type unless it
  is shared across files.

#### F2. Loose / over-defensive logic
- **Redundant null checks**: `if (x !== null && x !== undefined)` where `x`
  is already typed as non-nullable. Remove the check and fix the type instead.
- **Unnecessary `?.` optional chaining** on values that cannot be nullish by
  type — these hide real bugs.
- **Pointless fallback values**: `x ?? []` where `x` is typed as always an
  array. The fallback is unreachable and misleads readers.
- **Boolean over-expression**: `if (flag === true)` → `if (flag)`;
  `return condition ? true : false` → `return condition`.
- **Defensive `try/catch` around code that cannot throw**: wrapping pure
  synchronous transformations in try/catch adds noise.

#### F3. Vague naming
Apply these naming conventions (from `AGENTS.md` plus project norms):

| Context | Bad | Better |
|---------|-----|--------|
| Generic variable | `data`, `res`, `result`, `temp`, `val` | Name what it *is*: `preKeyBundle`, `encryptedPayload` |
| Event handler | `handleThing`, `onClick` | `handleSendMessage`, `handleContactSelect` |
| Boolean | `flag`, `check`, `status` | `isLoading`, `hasUnread`, `canSend` |
| Async result | `response`, `resp` | `mqttResponse`, `apiUser` |
| Loop variable | `i`, `j` in non-trivial loops | `contactIndex`, `messageId` |

Flag every instance; rename only if the new name is unambiguous. If the
correct name is unclear, flag it for the developer to rename.

---

### G. Memory / Resource Leaks (project-specific)

This project manages Rust `RatchetSession` pointers via the `libsignal-dezire`
native module. A memory leak occurs if `close()` is not called.

Check every code path that calls `ratchetInitSender` / `ratchetInitReceiver`:
- Is `close()` guaranteed to be called? (try/finally or useEffect cleanup)
- If the session is stored in a Zustand store or component state, is there a
  teardown path when the chat screen unmounts?

Flag any path where `close()` could be skipped due to an early return, thrown
error, or unmounted component with no cleanup.

---

### H. Security Audit

#### H1. Sensitive data in logs
This is an E2E-encrypted app. Logging plaintext content or key material is a
**critical** vulnerability.

Flag any `console.*` call that logs:
- Message content (body, text, payload before decryption or after decryption)
- Key material: private keys, shared secrets, session keys, pre-keys, signed
  pre-keys, identity keys, ratchet state
- User credentials or tokens
- Anything derived from `LibsignalDezireModule` outputs

Correct fix: log a sanitised descriptor only, e.g.
`console.debug('[ratchet] encrypted message, length:', ciphertext.length)`.

#### H2. Unsafe storage
Sensitive data must live in `expo-secure-store`, never in:
- `AsyncStorage` — unencrypted, world-readable on rooted devices
- Plain Zustand state persisted to `AsyncStorage`
- `MMKV` unless explicitly encrypted
- `expo-file-system` without encryption

Flag any use of `AsyncStorage` (or equivalent) that stores:
- Auth tokens, session tokens, or JWTs
- User identity keys or pre-keys
- Any value whose name suggests it is secret (`password`, `secret`, `key`,
  `token`, `credential`, `pin`)

The correct store for sensitive data in this project is `expo-secure-store`
(already used via Zustand's persistence layer in `src/store/`).

---

## Step 3 — Present Findings

Output a structured **Audit Report**:

```
## Code Audit — <scope>

### Summary
X High | Y Medium | Z Low findings across N files.

### High Priority
| # | Cat | File | Symbol / Line | Issue |
|---|-----|------|---------------|-------|
| 1 | H1  | src/utils/messaging/process.ts | processIncomingMessage:42 | Logs decrypted message body to console.log |

### Medium Priority
...

### Low Priority
...

### Skipped / Out of Scope
Anything deliberately not checked and why (e.g. "src/utils/crypto/ — correctness-critical, not touched").
```

Then ask: **"Shall I fix all of these, or would you like to select specific
categories or items?"**

---

## Step 4 — Execute Fixes

Work through approved fixes in this order (lowest → highest blast radius):

1. **Logging & security fixes** — highest risk if left; lowest code change
2. **Dead imports & unused variables**
3. **TypeScript hygiene** (types, remove `any`, missing return types)
4. **Slop removals** (boilerplate comments, redundant checks, vague renames)
5. **Inline style extraction** → `useThemedStyles` / `StyleSheet.create`
6. **TODO / comment cleanup**
7. **Arrowhead refactors** — extract helpers, guard clauses
8. **Dead exports & unreachable files** — delete last, after verifying no references

### Rules to follow during every fix

- **Minimal change**: don't rewrite working logic; change only what is flagged.
- **Naming conventions**: follow `AGENTS.md` exactly (camelCase utils,
  PascalCase components, `use` prefix for hooks and stores).
- **Import order**: React/RN → Expo → third-party → `@/` internal → relative,
  blank line between groups.
- **Styling**: `useThemedStyles` for anything reading `colors`;
  `StyleSheet.create` for static; `useMemo(StyleSheet.create(...), [deps])`
  for dynamic.
- **Error UI**: `Alert.alert()` for user-facing errors.
- **Package manager**: `bun` only.
- **Crypto safety**: never log key material or plaintext message content under
  any circumstances.
- **No new dependencies**: do not add packages to solve cleanup problems.

---

## Step 5 — Verify

After all changes:

```bash
bun x tsc --noEmit    # Must complete with 0 errors
bun lint              # Must complete with 0 new lint errors
```

Fix any errors introduced before reporting completion. Show the user the
final output of both commands.

---

## Hard limits — what this skill never does

- **Does not touch `src/utils/crypto/` or the native module** without explicit
  user instruction — those are correctness-critical for the Signal Protocol.
- **Does not rename exported types** used across multiple files without
  explicit user approval (rename a public API surface only when asked).
- **Does not restructure directories** or change the routing layout.
- **Does not add dependencies**.
- **Does not remove `@ts-ignore`** suppressions silently — flags them for
  human review instead.