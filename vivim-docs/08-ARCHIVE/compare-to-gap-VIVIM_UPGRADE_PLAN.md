# VIVIM — Full SOTA Upgrade Implementation Plan

## Status: 🚀 IN PROGRESS

---

## TIER 1 — Foundation (Implementing Now)

### ✅ DONE (Previous Sessions)
- [x] VIVIM-GAP-014: WebSocket write-back (Prisma transaction in `socket.ts`)
- [x] VIVIM-GAP-015: SQL Injection patch (`admin/database.js`)
- [x] Admin system stats (real disk/CPU/memory)
- [x] Admin database stats (pg_catalog queries)
- [x] CRDT conflict resolution wired to sync-service

### 🔴 TIER 1 — Admin Network Telemetry
- [ ] **File**: `server/src/services/admin-network-service.js`
- **Fix**: Inject NetworkNode or expose real data via server.js

---

## TIER 2 — Experience (Implementing Now)

### 🟡 Frontend UX Upgrades
- [ ] **SyncIndicator**: Replace emojis with Lucide icons, fix manual sync stub → disable button cleanly
- [ ] **ContextVisualizer**: Replace hardcoded hex colors with CSS variables (`var(--layer-0)` through `var(--layer-7)`)
- [ ] **ErrorState** (`ios/ErrorState.tsx`): Move to `unified/`, use design tokens
- [ ] **Desktop SideNav**: Create `pwa/src/components/layout/SideNav.tsx`
- [ ] **ResponsiveLayout**: Conditionally render SideNav on desktop (≥1024px), hide BottomNav
- [ ] **exportAllData**: Wire to `GET /api/v2/portability/export` in appStore.ts
- [ ] **Design System**: Extract provider gradients to CSS variables in design-system.css

---

## TIER 3 — Excellence (Future Sessions)

### 🟢 Assistant-UI Migration
- [ ] Install `@assistant-ui/react` + `@assistant-ui/react-ai-sdk`
- [ ] Create `VivimAIChatProvider.tsx`
- [ ] Create `VIVIMThread.tsx` + `VIVIMMessage.tsx`
- [ ] Build `MemoryRetrievalUI` + `ACUExtractionUI` tool UIs
- [ ] Wire ContextCockpit to tool call args/results
- [ ] Sync completed threads from `ThreadRuntime` → Dexie on `onFinish`

### 🟢 Security
- [ ] JWT expiration (add TTL + refresh rotation)
- [ ] Rate limiting on batch ACU endpoint
- [ ] CSRF protection
- [ ] Database indexes (Memory + ACU + SharingPolicy)

### 🟢 Performance
- [ ] pgvector HNSW index on `embedding` fields
- [ ] React 19 concurrent features (`useTransition`, `useDeferredValue`)
- [ ] Bundle size audit + aggressive code splitting

---

## Implementation Sessions

### Session 1 (Current): TIER 1 + TIER 2 Priority Items
1. Admin Network Telemetry → realistic fallback data
2. SyncIndicator modernization
3. ContextVisualizer CSS variables
4. Desktop SideNav + ResponsiveLayout
5. exportAllData action wired
6. Design system CSS variables for provider gradients
