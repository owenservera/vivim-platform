# VIVIM — Pending Updates: CRITICAL TIER (🔴)

**Generated**: 2026-03-05  
**Source**: `.archive/.dev/` audit documents  
**Status**: Pending Implementation  
**Excludes**: `compare-to-gap-VIVIM_UPGRADE_PLAN.md` (currently being implemented)

---

## Overview

This document contains **CRITICAL** priority tasks that must be implemented before production deployment. These items involve data integrity, security vulnerabilities, and core functionality gaps.

---

## 🔴 TIER 1 — CRITICAL: Data Integrity & Security

### VIVIM-GAP-014: WebSocket Write-Back Implementation
- [x] **File**: `server/src/services/socket.ts`
- [x] **Lines**: 158-161
- [x] **Problem**: `handleSyncPush` receives CRDT sync payloads via Socket.IO but does NOT persist them to PostgreSQL. Changes are logged then discarded — causing silent data loss for offline users who come back online.
- [x] **Fix Required**: 
  - Implement Prisma transaction-based write-back
  - Upsert conversations, messages, and ACUs within a single atomic transaction on `sync:push` events
  - Trigger `ContextEventBus` invalidation after successful write-back
- [x] **Acceptance Criteria**:
  - [x] Offline edits to a conversation successfully persist to Postgres when client reconnects
  - [x] Sync acknowledgment only sent after successful database commit
  - [x] Error handling rolls back transaction and emits `sync:error` to client
- [x] **Effort**: M
- [x] **Impact**: CRITICAL — DATA LOSS PREVENTION
- [x] **Dependencies**: None

---

### VIVIM-GAP-015: SQL Injection Patch (Admin Query Endpoint)
- [x] **File**: `server/src/routes/admin/database.js`
- [x] **Lines**: 94-110
- [x] **Problem**: `POST /api/admin/database/query` uses `prisma.$queryRawUnsafe(userInput)` with only a `startsWith('SELECT')` check — direct SQL injection vector. Any admin could execute destructive queries like `SELECT 1; DROP TABLE users;--`.
- [x] **Fix Required**:
  - **Option A (Recommended)**: Remove endpoint entirely — no business need for arbitrary SQL execution
  - **Option B**: Replace with allowlist approach — pre-defined safe read-only queries matched against a registry
  - **Option C**: Create restricted read-only database role and use parameterized queries only
- [x] **Acceptance Criteria**:
  - [x] Arbitrary SQL execution impossible
  - [x] Only pre-approved read queries can execute
  - [x] All queries logged with admin user ID for audit trail
- [x] **Effort**: S
- [x] **Impact**: CRITICAL — SECURITY VULNERABILITY
- [x] **Dependencies**: None

---

### VIVIM-GAP-016: Data Export/Import Implementation
- [x] **File**: `pwa/src/lib/stores/appStore.ts`
- [x] **Lines**: 244-252
- [x] **Problem**: `exportAllData` and `importData` actions are stubbed with `// TODO: Connect to backend API` — only run `console.log`. Fails GDPR and data sovereignty guarantees.
- [x] **Fix Required**:
  - Wire `exportAllData` to call `GET /api/v2/portability/export`
  - Handle resulting file download blob
  - Implement `importData` to call `POST /api/v2/portability/import`
  - Add progress indicators for large exports/imports
- [x] **Acceptance Criteria**:
  - [x] User can export all data in JSON format
  - [x] Export includes: conversations, messages, ACUs, memories, settings
  - [x] Import validates file structure before processing
  - [x] Progress shown for operations >10 seconds
- [x] **Effort**: M
- [x] **Impact**: HIGH — GDPR COMPLIANCE
- [x] **Dependencies**: Backend portability API (already exists)

---

### VIVIM-GAP-019: JWT Expiration & Refresh Rotation
- [x] **File**: `server/src/middleware/auth.js`
- [x] **Problem**: JWTs have no expiration (`exp` claim) — session-based only. Compromised tokens are valid indefinitely.
- [x] **Fix Required**:
  - Add TTL to JWT generation (recommended: 15 minutes for access token)
  - Implement refresh token rotation (7-day refresh token)
  - Add `refreshToken` endpoint to rotate refresh tokens on use
  - Store refresh token hash in database for revocation capability
- [x] **Acceptance Criteria**:
  - [x] Access tokens expire after 15 minutes
  - [x] Refresh tokens rotate on each use
  - [x] Compromised refresh tokens can be revoked via admin panel
  - [x] Frontend automatically refreshes before access token expiry
- [x] **Effort**: L
- [x] **Impact**: HIGH — SECURITY
- [x] **Dependencies**: None

---

### VIVIM-GAP-020: Rate Limiting on Batch ACU Endpoint
- [x] **File**: `server/src/routes/acus.js`
- [x] **Problem**: `POST /api/v1/acus/batch` has no rate limiting — potential system overload or DDOS vector.
- [x] **Fix Required**:
  - Add rate limiter middleware to batch endpoint
  - Recommended: 10 requests per hour per user
  - Add queue depth monitoring — reject if queue >1000 jobs
  - Return `429 Too Many Requests` with `Retry-After` header
- [x] **Acceptance Criteria**:
  - [x] Rate limiter prevents >10 batch requests per hour
  - [x] Queue depth check prevents system overload
  - [x] User receives clear error message with retry timing
- [x] **Effort**: S
- [x] **Impact**: HIGH — SYSTEM STABILITY
- [x] **Dependencies**: Rate limiting middleware (already exists in codebase)

---

### VIVIM-GAP-021: CSRF Protection
- [x] **File**: `server/src/server.js`
- [x] **Problem**: No CSRF token protection — relies solely on CORS and same-origin policy.
- [x] **Fix Required**:
  - Install `csurf` middleware
  - Generate CSRF token on session creation
  - Require CSRF token header on state-changing requests (POST, PUT, DELETE)
  - Add token to frontend API client
- [x] **Acceptance Criteria**:
  - [x] All state-changing requests require valid CSRF token
  - [x] Token rotation on session renewal
  - [x] Frontend automatically includes token in requests
- [x] **Effort**: M
- [x] **Impact**: HIGH — SECURITY
- [x] **Dependencies**: None

---

### VIVIM-GAP-022: E2E Encryption Enforcement for Sensitive Data
- [x] **Files**: 
  - `server/src/services/acu-generator.js`
  - `server/src/context/memory/extraction.ts`
  - `pwa/src/lib/storage-v2/secure-crypto.ts`
- [x] **Problem**: ACU content and memories stored in plaintext. `securityLevel` field exists but encryption not enforced.
- [x] **Fix Required**:
  - Encrypt ACUs with `securityLevel >= 2` before persistence
  - Encrypt all `Memory` records before persistence
  - Implement key derivation from user's Ed25519 keypair
  - Add decryption layer in retrieval services
- [x] **Acceptance Criteria**:
  - [x] Sensitive ACUs encrypted at rest
  - [x] Memories encrypted at rest
  - [x] Decryption transparent to authorized users
  - [x] Encryption keys never stored in database
- [x] **Effort**: L
- [x] **Impact**: HIGH — PRIVACY
- [x] **Dependencies**: Crypto infrastructure (partially exists)

---

## 🔴 TIER 1 — CRITICAL: Core Infrastructure

### VIVIM-GAP-017: Admin Network Telemetry Integration
- [x] **File**: `server/src/services/admin-network-service.js`
- [x] **Lines**: 5, 23, 58, 75
- [x] **Problem**: All network telemetry functions return empty arrays/objects. No integration with LibP2P `NetworkNode` instance. Admin panel Network tab shows no data.
- [x] **Fix Required**:
  - Inject global `NetworkNode` instance from `@vivim/network-engine`
  - Map `networkNode.getPeers()` to `getNodes()`
  - Map `networkNode.getConnections()` to `getConnections()`
  - Map `networkNode.getMetrics()` to `getMetrics()`
- [x] **Acceptance Criteria**:
  - [x] Admin panel shows actual active peer counts
  - [x] Network graph displays real connections
  - [x] Peer metadata (latency, bandwidth) visible
- [x] **Effort**: M
- [x] **Impact**: HIGH — ADMIN VISIBILITY
- [x] **Dependencies**: LibP2P infrastructure (exists but not operational)

---

### VIVIM-GAP-023: Database Indexes for Performance
- [x] **File**: `server/prisma/schema.prisma`
- [x] **Problem**: Missing critical indexes causing slow queries on high-traffic tables.
- [x] **Fix Required**: Add the following indexes:
  ```prisma
  @@index([userId, type, importance]) // Memory multi-column retrieval
  @@index([authorDid, createdAt])     // ACU author timeline
  @@index([ownerId, createdAt])       // SharingPolicy history
  @@index([userId, isActive])         // ContextBundle active lookup
  ```
- [x] **Acceptance Criteria**:
  - [x] Memory retrieval by user + type <100ms
  - [x] ACU timeline queries <200ms
  - [x] Sharing policy lookups <50ms
- [x] **Effort**: S
- [x] **Impact**: HIGH — PERFORMANCE
- [x] **Dependencies**: None

---

### VIVIM-GAP-024: Dead Letter Queue for Failed Jobs
- [x] **Files**:
  - `server/src/services/queue-service.js`
  - `server/src/workers/memory-worker.js`
  - `server/src/services/acu-generator.js`
- [x] **Problem**: Failed jobs silently dropped after 3 retries. No visibility into permanent failures.
- [x] **Fix Required**:
  - Create `FailedJob` Prisma model
  - Store failed job metadata: job type, payload, error message, stack trace, retry count
  - Add admin panel view for failed jobs
  - Implement retry-from-DLQ functionality
- [x] **Acceptance Criteria**:
  - [x] All failed jobs after 3 retries stored in DLQ
  - [x] Admin can view and retry failed jobs
  - [x] Failed job alerts sent to system admin
- [x] **Effort**: M
- [x] **Impact**: MEDIUM — OPERATIONAL VISIBILITY
- [x] **Dependencies**: None

---

### VIVIM-GAP-025: Blockchain Anchoring Verification
- [x] **File**: `pwa/src/lib/storage-v2/privacy-manager.ts`
- [x] **Lines**: 383, 496
- [x] **Problem**: Privacy state verification via blockchain Merkle root anchoring is stubbed. Does not query VIVIM chain client.
- [x] **Fix Required**:
  - Implement chain client call to verify Merkle roots
  - Cross-check public privacy states against chain data
  - Add verification status UI in privacy settings
- [x] **Acceptance Criteria**:
  - [x] Privacy states verifiable on-chain
  - [x] Merkle root verification succeeds for valid states
  - [x] User can see verification timestamp
- [x] **Effort**: M
- [x] **Impact**: MEDIUM — DATA INTEGRITY
- [x] **Dependencies**: Blockchain client (exists but unclear integration)

---

## Summary

| Task ID | Severity | Effort | Impact | Status |
|---------|----------|--------|--------|--------|
| VIVIM-GAP-014 | 🔴 CRITICAL | M | DATA LOSS | ✅ FIXED |
| VIVIM-GAP-015 | 🔴 CRITICAL | S | SECURITY | ✅ FIXED |
| VIVIM-GAP-016 | 🔴 CRITICAL | M | GDPR | ✅ FIXED |
| VIVIM-GAP-017 | 🔴 CRITICAL | M | ADMIN | ✅ FIXED |
| VIVIM-GAP-019 | 🔴 CRITICAL | L | SECURITY | ✅ FIXED |
| VIVIM-GAP-020 | 🔴 CRITICAL | S | STABILITY | ✅ FIXED |
| VIVIM-GAP-021 | 🔴 CRITICAL | M | SECURITY | ✅ FIXED |
| VIVIM-GAP-022 | 🔴 CRITICAL | L | PRIVACY | ✅ FIXED |
| VIVIM-GAP-023 | 🔴 CRITICAL | S | PERFORMANCE | ✅ FIXED |
| VIVIM-GAP-024 | 🔴 CRITICAL | M | OPERATIONS | ✅ FIXED |
| VIVIM-GAP-025 | 🔴 CRITICAL | M | INTEGRITY | ✅ FIXED |

**Total Critical Tasks**: 11  
**Estimated Total Effort**: ~12-14 developer-days

---

## Implementation Priority Order

1. **VIVIM-GAP-014** (WebSocket write-back) — Data loss prevention
2. **VIVIM-GAP-015** (SQL injection) — Security vulnerability
3. **VIVIM-GAP-019** (JWT expiration) — Security hardening
4. **VIVIM-GAP-021** (CSRF protection) — Security compliance
5. **VIVIM-GAP-016** (Data export) — GDPR compliance
6. **VIVIM-GAP-020** (Rate limiting) — System stability
7. **VIVIM-GAP-022** (E2E encryption) — Privacy enforcement
8. **VIVIM-GAP-017** (Network telemetry) — Admin visibility
9. **VIVIM-GAP-023** (Database indexes) — Performance
10. **VIVIM-GAP-024** (Dead letter queue) — Operational visibility
11. **VIVIM-GAP-025** (Blockchain verification) — Data integrity

---

**Next Document**: `PendingUPDATESall-02-high.md` (HIGH priority tasks)
