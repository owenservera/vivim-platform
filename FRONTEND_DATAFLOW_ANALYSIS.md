# VIVIM Frontend Dataflow Analysis Report

**Date:** 2026-02-22  
**Scope:** Full stack — PWA → API Client → Server Routes → Database → Auth

---

## Executive Summary

The build was broken (two separate issues). The MFA test was failing. Several server-side routes had runtime-crash bugs awaiting production. The auth system has a structural split. Below is the complete picture ranked by severity.

---

## ✅ Bugs Fixed This Session

### Fix 1 — Missing `ed2curve` dependency (Build Blocker)
**File:** `pwa/package.json` + `pwa/src/lib/storage-v2/crypto.ts`  
**Severity:** CRITICAL — blocked production build entirely  
**Root Cause:** `crypto.ts` imported `ed2curve` for key conversion, but the package was missing from `package.json`.  
**Fix:** `bun add ed2curve` — package installed, build now succeeds.

---

### Fix 2 — `use-error-reporting.ts` contains JSX (Build/TSC Error)
**File:** `pwa/src/hooks/use-error-reporting.ts` → renamed to `.tsx`  
**Severity:** HIGH — TSC error `TS1005`: `'>' expected` — breaks `bun run build:tsc`  
**Root Cause:** File used JSX (`<WrappedComponent {...props} />`) but had `.ts` extension. TypeScript only parses JSX in `.tsx` files.  
**Fix:** Renamed file to `use-error-reporting.tsx`. TSC now passes with zero errors.

---

### Fix 3 — `getPrismaClient` not imported in conversations route (Runtime Crash)
**File:** `server/src/routes/conversations.js`  
**Severity:** HIGH — routes `POST /:id/fork` and `GET /:id/related` would throw `ReferenceError: getPrismaClient is not defined` on every call.  
**Root Cause:** These two routes were added after the file was created, and the import was never added.  
**Fix:** Added `import { getPrismaClient } from '../lib/database.js';`

---

### Fix 4 — `log` used before declaration in fork route (Runtime Crash)
**File:** `server/src/routes/conversations.js`, line ~298  
**Severity:** HIGH — `log.info(...)` was called in `POST /:id/fork` but `log` is never declared as a module-level variable. Individual routes should use `createRequestLogger(req)`.  
**Fix:** Created `routeLog = createRequestLogger(req)` inside the route handler and used it for logging.

---

### Fix 5 — Wrong field name `userId` vs `ownerId` in fork/related routes (Schema Mismatch)
**File:** `server/src/routes/conversations.js`  
**Severity:** HIGH — `prisma.conversation.create({ data: { userId: ... } })` would throw a Prisma validation error because the schema field is `ownerId`, not `userId`.  
**Evidence:** The Prisma query log clearly shows `"public"."conversations"."ownerId"` in all queries. The `ConversationRepository.js` correctly uses `where.ownerId = userId`.  
**Fix:** Changed `userId: req.auth?.userId` → `ownerId: req.user?.userId ?? req.auth?.userId ?? null` in both routes.

---

### Fix 6 — `sourceUrl` uniqueness violation on fork (Runtime Crash)
**File:** `server/src/routes/conversations.js`  
**Severity:** MEDIUM — `sourceUrl` has a `@unique` constraint in the schema. Forking a conversation with the same `sourceUrl` would cause a Prisma unique constraint violation.  
**Fix:** Appended `#fork-${Date.now()}` to produce a unique sourceUrl for forked conversations.

---

### Fix 7 — MFA Setup error handling (Debugging Improvement)
**File:** `server/src/routes/account.js`  
**Severity:** LOW (the MFA setup itself now works, but this improves debuggability)  
**Fix:** Updated `catch` block to include `error.stack` in the log and surface `error.message` as `detail` in the response.

---

## 🔴 Open Issues Found (Not Yet Fixed)

### Issue 1 — Duplicate `return` statement in ConversationRepository.js
**File:** `server/src/repositories/ConversationRepository.js`, lines 115–117  
```js
return conversation;  // line 115 — code never reaches line 117
return conversation;  // line 117 — DEAD CODE
```
**Impact:** Low (dead code), but signals the file had incomplete refactoring.

---

### Issue 2 — Conversations HTTP endpoint uses wrong auth middleware for account routes
**File:** `server/src/routes/conversations.js` — uses `requireApiKey()`  
**File:** `server/src/routes/account.js` — uses `unifiedAuth` (session + API key)  
**Problem:** The `/conversations/:id/messages` HTTP route (tested in `test_e2e_features.js`) returns `undefined` data because the test sends the API key through `x-api-key` but `conversations.js` uses `requireApiKey()` which validates against `API_KEYS` env list — not the user's generated database API key.  
**Impact:** All conversation-related API calls from `apiClient` in the PWA that rely on user-generated API keys may fail auth silently.  
**Recommendation:** Switch conversations router to use `unifiedAuth` from `middleware/unified-auth.js`.

---

### Issue 3 — `DataFlow` type mismatch between packages
**PWA `admin-api.ts`:**
```typescript
type: 'sync' | 'replication' | 'migration' | 'backup'
status: 'active' | 'pending' | 'completed' | 'failed'
throughput: number
latency: number
lastUpdated: string
```
**Admin Panel `types/index.ts`:**
```typescript
type: 'DHT' | 'PUBSUB' | 'CRDT' | 'FEDERATION'
status: 'active' | 'pending' | 'error'
messagesPerSecond: number
bytesPerSecond: number
```
**Server `admin/dataflow.js` returns:**  
`messagesPerSecond`, `bytesPerSecond`, `lastActivity` — matches the **admin panel** shape, NOT the PWA admin-api shape.  
**Impact:** `DataFlowPanel.tsx` in the PWA admin panel maps `flow.throughput` and `flow.latency` which are always `0` because the server never sends those fields.

---

### Issue 4 — `withTransaction` referenced but not defined in ConversationRepository.js
**File:** `server/src/repositories/ConversationRepository.js`, lines 312 and 382  
```js
return withTransaction(async (tx) => {  // withTransaction is never imported or defined
```
**Impact:** Calling `addMessageToConversation()` or `createConversationsBatch()` will throw `ReferenceError: withTransaction is not defined` at runtime.

---

### Issue 5 — `BackgroundSync.tsx` mixes static and dynamic imports of `api.ts`
**File:** `pwa/src/components/BackgroundSync.tsx`  
The build warns: `api.ts is dynamically imported by BackgroundSync.tsx but also statically imported by BackgroundSync.tsx`.  
**Impact:** Chunk splitting breaks — api.ts and its heavy crypto dependencies (tweetnacl, ed2curve) are bundled into the main chunk (680 KB gzipped 203 KB). This significantly hurts initial load time.  
**Recommendation:** Choose either static or dynamic import, not both.

---

### Issue 6 — Storage-v2/crypto.ts is both static and dynamic imported
Same chunking problem: `crypto.ts` statically imported by `api.ts`, `storage-v2/index.ts`, `merkle.ts`, `storage.ts`, etc. but also dynamically imported by `dag-engine.ts`, `object-store.ts`, `CaptureSimple.tsx`.  
**Impact:** Dynamic import optimization is defeated.

---

### Issue 7 — PWA uses two separate auth systems simultaneously
**Google OAuth** (session-based) handled by `middleware/google-auth.js` + `passport`  
**DID-based API Keys** (stateless) handled by `middleware/unified-auth.js`  

The `auth-context.tsx` on the frontend calls `getCurrentUser()` which hits `/api/v1/account/me` (session auth), sets `user.did` and stores it in the identity store. But then `api.ts` (`apiClient`) sends `Authorization: Bearer <API_KEY>` — not a session cookie.  
**Impact:** When the user logs in via Google, the PWA identity store gets their `did`, but API calls from `apiClient` fail authentication because `getApiKey()` returns null unless explicitly stored in `localStorage`.

---

### Issue 8 — `listConversations` always filters by `state = 'ACTIVE'`  
**File:** `server/src/repositories/ConversationRepository.js`, line 230  
```js
where.state = 'ACTIVE';
```
Every conversation created without an explicit `state` field will default to `ACTIVE` — however if creation doesn't set `state`, Prisma might default to `null`. This filter would then return zero conversations until the `state` field is properly defaulted.

---

## 📊 Dataflow Architecture Summary

```
USER ACTION (Browser)
        │
        ▼
PWA React Component
        │
        ├─→ useAuth / AuthContext → GET /api/v1/account/me [Session Cookie]
        │         ↓ user object with DID
        │         └─→ initiate dataSyncService.syncFullDatabase()
        │
        ├─→ apiClient (api.ts) → GET/POST /api/v1/... [Bearer API_KEY or X-API-Key]
        │         ↓ Bearer token from localStorage / env
        │
        └─→ conversationService → IndexedDB (Dexie) ← local first
                  ↓ when online
              conversationSyncService → server /api/v1/sync [socket.io]
```

### Auth Flow (Dual System — Problematic)
```
Google OAuth → Session Cookie → /api/v1/account/me  (Session Auth, no DID-API-Key needed)
API Key Auth → X-API-Key / Bearer → /api/v1/conversations (requireApiKey, validates via env list only)
DID Auth    → X-DID / X-Signature → /api/v2/* routes (authenticateDID, on-chain identity)
```

---

## 🟡 Performance Issues

| Issue | File | Details |
|---|---|---|
| Slow DB queries | Prisma | User `upsert` takes 614ms, delete 305ms — index missing? |
| Chunk size | `pwa/dist` | Main chunk 680 KB (203 KB gzip) — exceeds 500 KB limit |
| Cache miss on messages | `conversations.js` | Message fetch hit/miss works, but API key auth fails first |
| Mixed import types | `BackgroundSync.tsx` | Static + dynamic import of `api.ts` inflates main bundle |

---

## ✅ What's Working Well

- **MFA flow end-to-end**: Setup → Enable → Backup codes — all working
- **API key generation**: `apiKeyService.createApiKey()` works correctly
- **Conversation storage (local)**: `createConversation()` in repository works
- **Caching architecture**: `cacheService` with Redis fallback works
- **Build now succeeds**: After the two fixes (ed2curve + tsx rename)

---

## 🎯 Priority Fixes Remaining

| Priority | Fix | File |
|---|---|---|
| P0 | Add `withTransaction` import or definition | `ConversationRepository.js` |
| P1 | Switch conversations router to `unifiedAuth` | `conversations.js` |
| P1 | Fix `DataFlow` type mismatch (PWA vs Admin) | `admin-api.ts` + `types/index.ts` |
| P2 | Remove duplicate `return` statement | `ConversationRepository.js:117` |
| P2 | Eliminate mixed static/dynamic imports | `BackgroundSync.tsx`, `crypto.ts` |
| P3 | Add DB indexes for slow User queries | Prisma schema |
| P3 | Set default `state = 'ACTIVE'` on conversation schema | `schema.prisma` |
