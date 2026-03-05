# VIVIM — Master Task List
**Archived**: 2026-03-05 | **Status**: Post Socket-Sync & Security Fix Session

---

## ✅ Completed Work

### CRITICAL — Data Integrity
- [x] **VIVIM-GAP-014**: WebSocket write-back — `handleSyncPush` in `socket.ts` now uses Prisma transaction to persist conversations, messages, and ACUs. Previously a stub causing silent data loss.
- [x] **VIVIM-GAP-015**: SQL Injection patch — `admin/database.js` `/query` endpoint replaced `$queryRawUnsafe` with allowlist-based safe query routing.

### HIGH — Admin Panel Real Data
- [x] **System stats** — `admin/system.js` now uses `fs.statfs` for disk, `os` module for CPU/memory, Prisma for user/conversation/storage counts.
- [x] **Database stats** — `admin/database.js` uses `pg_stat_user_tables`, `information_schema.columns`, and `pg_database_size` for real data.
- [x] **CRDT conflict resolution** — `admin/crdt.js` wired to `sync-service.js`, supports `last-write-wins`, `explicit-value`, `delete` strategies.

### MEDIUM/LOW — Frontend UX
- [x] **Archived card opacity** — `Home.css`: moved opacity from full card to `.conv-card-body`, actions remain fully visible.
- [x] **Date fallback** — `Home.tsx` `formatDate()` returns `"Unknown"` instead of empty string for invalid dates.
- [x] **Space key navigation** — `Home.tsx` `onKeyDown` now handles Space key for card expansion (alongside Enter).
- [x] **ARIA labels** — `Home.tsx` stats pills have `<span className="sr-only">` labels for screen readers.
- [x] **Reduced motion** — `Home.css` `@media (prefers-reduced-motion: reduce)` block added.
- [x] **CSS compatibility** — `Home.css` standard `line-clamp` added alongside `-webkit-line-clamp`.

---

## ⚠️ Open Tasks — Prioritized

### 🔴 TIER 1 — Core

#### Admin Network Telemetry
- [ ] **File**: `server/src/services/admin-network-service.js`
- **Problem**: All functions return empty arrays. No libp2p integration.
- **Fix**: Inject global `NetworkNode` instance from `@vivim/network-engine`. Call peer list, topics, connection stats.
- **Effort**: M
- **Impact**: HIGH

---

### 🟡 TIER 2 — Experience

#### Desktop Sidebar
- [ ] **Create**: `pwa/src/components/SideNav.tsx`
- **Purpose**: Left navigation rail for desktop (>1024px)
- **Items**: Home, Capture, Search, Notebooks, Settings, Admin
- **Effort**: M

#### Desktop Responsive Layout
- [ ] **Update**: `pwa/src/components/unified/ResponsiveLayout.tsx`
- **Purpose**: Conditionally render SideNav on desktop
- **Effort**: S

#### exportAllData Zustand Action
- [ ] **File**: `pwa/src/stores/appStore.ts`
- **Problem**: `exportAllData` action is not wired to the portability API
- **Fix**: Call `POST /api/v2/portability/export` and handle download
- **Effort**: S

#### Error State Differentiation
- [ ] **File**: `pwa/src/components/ios/ErrorState.tsx`
- **Problem**: All errors show generic `WifiOff` icon
- **Fix**: Map `IOSErrorType` to specific Lucide icons (Database → `Database`, Timeout → `Clock`, etc.)
- **Effort**: XS

#### SyncIndicator Manual Sync Button
- [ ] **File**: `pwa/src/components/SyncIndicator.tsx`
- **Problem**: `handleManualSync` is a no-op stub
- **Fix**: Either implement actual GossipSub trigger or hide/disable the button
- **Effort**: S

#### Design System Consolidation
- [ ] **File**: `pwa/src/pages/Home.css` (and `Capture.css`)
- **Problem**: Provider gradients are hardcoded hex values, no CSS variable abstraction, no dark mode fallbacks
- **Fix**: Extract provider gradients to `--provider-{name}-gradient` CSS variables, add `@media (prefers-color-scheme: dark)` fallbacks
- **Effort**: S

#### ContextVisualizer Color System
- [ ] **File**: `pwa/src/components/ContextVisualizer.tsx`
- **Problem**: `LAYER_COLORS` object has hardcoded hex values
- **Fix**: Replace with `var(--layer-0)` through `var(--layer-7)` CSS variables
- **Effort**: XS

---

### 🟢 TIER 3 — Excellence

#### assistant-ui Migration
- [ ] Remove manual EventSource/fetch in `useAIChat.ts`
- [ ] Add `@assistant-ui/react` + `@assistant-ui/react-ai-sdk`
- [ ] Build `VivimAIChatProvider` → `VIVIMThread` → `VIVIMMessage` with primitives
- [ ] Refactor `ContentRenderer` tool outputs to `makeAssistantToolUI`
- [ ] Wire ContextCockpit to tool call args/results
- [ ] Sync completed threads from `ThreadRuntime` → Dexie on `onFinish`
- **Effort**: L
- **Impact**: HIGH (code quality + DX)

#### Post-Quantum Crypto
- [ ] **File**: `pwa/src/lib/storage-v2/secure-crypto.ts`
- **Problem**: CRYSTALS-Kyber and Dilithium are stubbed
- **Fix**: Integrate WASM modules for Kyber-1024 and Dilithium3
- **Effort**: L
- **Impact**: MEDIUM

#### Blockchain Anchoring Verification
- [ ] **File**: `pwa/src/lib/storage-v2/privacy-manager.ts`
- **Problem**: Merkle root verification stubbed — does not query VIVIM chain
- **Fix**: Implement chain client call to verify public privacy states
- **Effort**: M
- **Impact**: MEDIUM

#### Feed Analytics Telemetry
- [ ] **Create**: `POST /api/v2/feed/analytics` endpoint
- [ ] **Wire**: PWA recommendation engine (`analytics.ts`) batch-sends impressions to server
- **Effort**: S
- **Impact**: LOW (for recommendation system training)

#### Context Cache Invalidation Refactor
- [ ] **File**: `server/src/services/unified-context-service.ts:252`
- **Problem**: Inline cache invalidation instead of using `InvalidationService` via `ContextEventBus`
- **Fix**: Emit events to `ContextEventBus` → `InvalidationService` subscribes
- **Effort**: S
- **Impact**: LOW (architectural cleanliness)

#### Dead Letter Queue
- [ ] Add failed job storage for: ACU generation failures, memory extraction failures, capture retries exhausted
- **Effort**: M
- **Impact**: MEDIUM

---

## Non-Functional / Quality

| Task | Priority | File |
|------|---------|------|
| Add rate limiting to batch ACU endpoint | HIGH | `server/src/routes/acus.js` |
| JWT expiration (add TTL) | HIGH | `server/src/middleware/auth.js` |
| E2E encryption enforcement for sensitive ACUs | MEDIUM | `server/src/services/` |
| CSRF protection | MEDIUM | `server/src/server.js` |
| Database indexes (Memory + ACU + SharingPolicy) | MEDIUM | `server/prisma/schema.prisma` |
| Testing coverage (E2E for critical flows) | MEDIUM | `server/tests/`, `pwa/e2e/` |
| Memory expiresAt TTL | LOW | `server/prisma/schema.prisma` + consolidation |
| Move ErrorState to `unified/` folder | LOW | `pwa/src/components/` |

---

## Upcoming Feature Work

| Feature | Effort | Strategic Priority |
|---------|--------|-------------------|
| Public sharing enabled (feed + share link public mode) | L | HIGH |
| Feed ranking algorithm (social + relevance) | L | HIGH |
| Per-user SQLite isolation (architecture decision) | XL | BLOCKING |
| Browser extension for capture | L | HIGH |
| Mobile app (React Native or PWA improvements) | XL | HIGH |
| ActivityPub Federation Client | L | MEDIUM |
| ACU Marketplace scaffold | XL | LOW |
| Email notification service | M | HIGH |
| Load testing + query optimization | M | MEDIUM |
