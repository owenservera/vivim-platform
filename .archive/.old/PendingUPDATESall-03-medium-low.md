# VIVIM — Pending Updates: MEDIUM & LOW TIER (🟢)

**Generated**: 2026-03-05  
**Source**: `.archive/.dev/` audit documents  
**Status**: Pending Implementation  
**Excludes**: `compare-to-gap-VIVIM_UPGRADE_PLAN.md` (currently being implemented)

---

## Overview

This document contains **MEDIUM** and **LOW** priority tasks for polish, performance optimization, and long-term technical debt reduction. Implement after CRITICAL and HIGH tier items are complete.

---

## 🟢 TIER 3 — MEDIUM: Feature Completeness

### VIVIM-GAP-040: Context Recipes Implementation
- [ ] **Create**: `server/prisma/schema.prisma` model `ContextRecipe`
- [ ] **Create**: `server/src/routes/context-recipes.js`
- [ ] **Problem**: Context Recipes referenced in UI (`/settings/ai` page) but not implemented in backend. No storage or API for saved context configurations.
- [ ] **Fix Required**:
  - Define `ContextRecipe` Prisma model:
    ```prisma
    model ContextRecipe {
      id              String   @id @default(cuid())
      userId          String?
      name            String
      layerWeights    Json     // Record<layerId, weight>
      excludedLayers  String[] // Array of layer IDs to skip
      customBudget    Int?
      isDefault       Boolean  @default(false)
      createdAt       DateTime @default(now())
      updatedAt       DateTime @updatedAt
      
      @@index([userId])
    }
    ```
  - Create CRUD endpoints: `GET/POST/PUT/DELETE /api/v2/context/recipes`
  - Wire to ContextCockpit UI for recipe selection
- [ ] **Acceptance Criteria**:
  - [ ] Users can save custom context configurations
  - [ ] Default recipes provided (Research, Creative, Coding, etc.)
  - [ ] Recipes apply layer weights and budget overrides
- [ ] **Effort**: M
- [ ] **Impact**: MEDIUM — USER CONTROL
- [ ] **Dependencies**: Context Engine (exists)

---

### VIVIM-GAP-041: Public Sharing Feed
- [ ] **Create**: `server/src/routes/feed-public.js`
- [ ] **Create**: `pwa/src/pages/Discover.tsx`
- [ ] **Problem**: Public sharing enabled in schema but no feed/discovery UI. Shared ACUs not discoverable.
- [ ] **Fix Required**:
  - Create endpoint `GET /api/v2/feed/public` with pagination
  - Implement ranking algorithm (social + relevance + recency)
  - Build Discover page with infinite scroll
  - Add filtering by topic, provider, ACU type
- [ ] **Acceptance Criteria**:
  - [ ] Public ACUs discoverable in feed
  - [ ] Ranking algorithm surfaces quality content
  - [ ] Users can filter and search public content
- [ ] **Effort**: L
- [ ] **Impact**: HIGH — NETWORK EFFECTS
- [ ] **Dependencies**: Sharing system (exists)

---

### VIVIM-GAP-042: Browser Extension for Capture
- [ ] **Create**: `packages/browser-extension/` directory
- [ ] **Problem**: Capture requires manual URL copy-paste. Browser extension would enable one-click capture.
- [ ] **Fix Required**:
  - Build Chrome/Firefox extension with:
    - Context menu: "Capture with VIVIM"
    - Popup UI for capture status
    - Background script for API communication
  - Support all 9 providers
  - Add badge indicator for supported sites
- [ ] **Acceptance Criteria**:
  - [ ] One-click capture from browser
  - [ ] Capture status shown in extension popup
  - [ ] Works for all supported AI providers
- [ ] **Effort**: L
- [ ] **Impact**: HIGH — CAPTURE UX
- [ ] **Dependencies**: Capture API (exists)

---

### VIVIM-GAP-043: Mobile App (React Native or PWA Enhancement)
- [ ] **Decision Required**: React Native wrapper vs. PWA enhancement
- [ ] **Problem**: PWA may not feel native. No iOS/Android app store presence.
- [ ] **Fix Required**:
  - **Option A (React Native)**:
    - Create React Native app sharing PWA components
    - Implement native modules for push notifications, biometric auth
    - Submit to App Store and Google Play
  - **Option B (PWA Enhancement)**:
    - Improve PWA manifest for better installation
    - Add native-like gestures and animations
    - Implement push notifications via Service Worker
- [ ] **Acceptance Criteria**:
  - [ ] App available on iOS and Android
  - [ ] Native-feeling interactions
  - [ ] Push notification support
- [ ] **Effort**: XL
- [ ] **Impact**: HIGH — MOBILE REACH
- [ ] **Dependencies**: None

---

### VIVIM-GAP-044: ACU Marketplace Scaffold
- [ ] **Create**: `server/src/routes/marketplace.js`
- [ ] **Create**: `pwa/src/pages/Marketplace.tsx`
- [ ] **Problem**: No mechanism for selling/trading ACUs, prompts, or personas. Missing potential revenue stream.
- [ ] **Fix Required**:
  - Define marketplace models: `Listing`, `Purchase`, `Review`
  - Implement Stripe integration for payments
  - Build marketplace UI with search and categories
  - Add revenue sharing logic (70/30 split)
- [ ] **Acceptance Criteria**:
  - [ ] Users can list ACUs for sale
  - [ ] Secure payment processing
  - [ ] Automatic revenue distribution
- [ ] **Effort**: XL
- [ ] **Impact**: MEDIUM — REVENUE
- [ ] **Dependencies**: Stripe integration

---

### VIVIM-GAP-045: ActivityPub Federation Client
- [ ] **Create**: `server/src/services/federation-service.js`
- [ ] **Problem**: VIVIM not federated with ActivityPub ecosystem (Mastodon, etc.). Limits social reach.
- [ ] **Fix Required**:
  - Implement ActivityPub adapters in SDK
  - Create federation service for:
    - Actor provisioning
    - Activity broadcasting
    - Inbox handling
  - Map VIVIM ACUs to ActivityPub objects
- [ ] **Acceptance Criteria**:
  - [ ] VIVIM users followable from Mastodon
  - [ ] ACUs shareable as ActivityPub objects
  - [ ] Cross-platform interactions tracked
- [ ] **Effort**: L
- [ ] **Impact**: MEDIUM — FEDERATION
- [ ] **Dependencies**: ActivityPub spec knowledge

---

### VIVIM-GAP-046: Per-User SQLite Isolation
- [ ] **File**: `server/prisma/schema.prisma`
- [ ] **Problem**: Single PostgreSQL with row-level security. Target vision is per-user SQLite files for maximum isolation.
- [ ] **Fix Required**:
  - **Phase 1**: Design migration strategy
  - **Phase 2**: Implement multi-datasource Prisma setup
  - **Phase 3**: Create user DB provisioning service
  - **Phase 4**: Migrate existing users gradually
- [ ] **Acceptance Criteria**:
  - [ ] Each user has isolated SQLite database
  - [ ] Shared metadata in central PostgreSQL
  - [ ] Migration tool for existing users
- [ ] **Effort**: XL
- [ ] **Impact**: HIGH — DATA SOVEREIGNTY
- [ ] **Dependencies**: Major refactor

---

## 🟢 TIER 3 — LOW: Polish & Optimization

### VIVIM-GAP-047: pgvector HNSW Index
- [ ] **File**: `server/prisma/schema.prisma`
- [ ] **Add**: HNSW index configuration for vector columns
- [ ] **Problem**: pgvector using default IVFFlat index. HNSW provides better performance for high-dimensional vectors.
- [ ] **Fix Required**:
  - Add HNSW index to `Memory.embedding` and `AtomicChatUnit.embedding`:
    ```sql
    CREATE INDEX ON "Memory" USING hnsw ("embedding" vector_cosine_ops);
    CREATE INDEX ON "AtomicChatUnit" USING hnsw ("embedding" vector_cosine_ops);
    ```
  - Tune HNSW parameters (`m`, `ef_construction`)
- [ ] **Acceptance Criteria**:
  - [ ] Vector search <50ms for 100k+ vectors
  - [ ] Index creation doesn't block writes
- [ ] **Effort**: S
- [ ] **Impact**: LOW — PERFORMANCE
- [ ] **Dependencies**: pgvector extension

---

### VIVIM-GAP-048: React 19 Concurrent Features
- [ ] **Files**: Animation and search-heavy components
- [ ] **Problem**: Not using React 19's `useTransition` and `useDeferredValue` for non-urgent updates.
- [ ] **Fix Required**:
  - Wrap search input with `useTransition`:
    ```tsx
    const [isPending, startTransition] = useTransition();
    startTransition(() => setSearchQuery(input));
    ```
  - Use `useDeferredValue` for list filtering
  - Add suspense boundaries for loading states
- [ ] **Acceptance Criteria**:
  - [ ] Search input remains responsive during filtering
  - [ ] No UI blocking on large list updates
- [ ] **Effort**: M
- [ ] **Impact**: LOW — UX SMOOTHNESS
- [ ] **Dependencies**: React 19 (already installed)

---

### VIVIM-GAP-049: Bundle Size Audit + Code Splitting
- [ ] **Run**: `bun run build:vite` with bundle analyzer
- [ ] **Problem**: Bundle size unknown. Likely includes unused code from large dependencies.
- [ ] **Fix Required**:
  - Install `rollup-plugin-visualizer`
  - Analyze bundle composition
  - Implement aggressive code splitting:
    - Route-based splitting
    - Component lazy loading for heavy components (Mermaid, KaTeX)
    - Tree-shaking for unused Lucide icons
- [ ] **Acceptance Criteria**:
  - [ ] Initial bundle <500KB gzipped
  - [ ] Time-to-interactive <3 seconds on 3G
- [ ] **Effort**: M
- [ ] **Impact**: LOW — LOAD PERFORMANCE
- [ ] **Dependencies**: None

---

### VIVIM-GAP-050: Testing Coverage (E2E)
- [ ] **Create**: `server/tests/`, `pwa/e2e/` test suites
- [ ] **Problem**: Unknown E2E coverage. Critical flows untested.
- [ ] **Fix Required**:
  - Write E2E tests for critical flows:
    - User onboarding → first capture
    - Share link creation → acceptance
    - ACU fork/continue flow
    - Context engine assembly
  - Add visual regression tests for key pages
  - Set up CI/CD test running
- [ ] **Acceptance Criteria**:
  - [ ] 80%+ coverage for critical paths
  - [ ] Tests run on every PR
  - [ ] Visual regression detection
- [ ] **Effort**: L
- [ ] **Impact**: MEDIUM — QUALITY ASSURANCE
- [ ] **Dependencies**: Playwright (already installed)

---

### VIVIM-GAP-051: Load Testing + Query Optimization
- [ ] **Run**: k6 or Artillery load tests
- [ ] **Problem**: No load testing performed. Query performance unknown at scale.
- [ ] **Fix Required**:
  - Define load test scenarios:
    - 100 concurrent users capturing conversations
    - 1000 concurrent users browsing feed
    - 100 concurrent context assembly requests
  - Identify bottlenecks
  - Optimize slow queries with EXPLAIN ANALYZE
- [ ] **Acceptance Criteria**:
  - [ ] P95 latency <500ms under load
  - [ ] No database connection exhaustion
  - [ ] Graceful degradation on overload
- [ ] **Effort**: M
- [ ] **Impact**: MEDIUM — SCALABILITY
- [ ] **Dependencies**: Load testing tools

---

### VIVIM-GAP-052: ACUGraph Responsive Layout
- [ ] **File**: `pwa/src/components/ACUGraph.tsx`
- [ ] **Problem**: Complex visualization has layout issues on small screens. Needs responsive refinements.
- [ ] **Fix Required**:
  - Implement responsive force-directed graph layout
  - Add touch gestures for pan/zoom
  - Simplify graph for mobile (fewer nodes visible)
  - Add legend and interaction hints
- [ ] **Acceptance Criteria**:
  - [ ] Graph usable on mobile screens
  - [ ] Touch gestures intuitive
  - [ ] Performance acceptable on mobile devices
- [ ] **Effort**: M
- [ ] **Impact**: LOW — UX POLISH
- [ ] **Dependencies**: D3 or similar graph library

---

### VIVIM-GAP-053: ContentRenderer Copy Unification
- [ ] **File**: `pwa/src/components/content/ContentRenderer.tsx`
- [ ] **Problem**: `TextPart` and `CodePart` duplicate copy-to-clipboard logic. Should be unified.
- [ ] **Fix Required**:
  - Extract copy logic to shared hook: `useCopyToClipboard()`
  - Add unified toast notification
  - Support rich text copy (preserve formatting)
- [ ] **Acceptance Criteria**:
  - [ ] Single source of truth for copy logic
  - [ ] Consistent user feedback across content types
- [ ] **Effort**: XS
- [ ] **Impact**: LOW — CODE QUALITY
- [ ] **Dependencies**: None

---

### VIVIM-GAP-054: Route Transition Focus Reset
- [ ] **File**: `pwa/src/app/routes.tsx`
- [ ] **Problem**: Route transitions don't reset focus. Screen readers don't announce page changes.
- [ ] **Fix Required**:
  - Add focus reset to main content heading on route change
  - Add `aria-live` region for route announcements
  - Implement skip-to-content link
- [ ] **Acceptance Criteria**:
  - [ ] Focus moves to main content on navigation
  - [ ] Screen readers announce page title
  - [ ] Keyboard users can skip to content
- [ ] **Effort**: XS
- [ ] **Impact**: LOW — ACCESSIBILITY
- [ ] **Dependencies**: None

---

### VIVIM-GAP-055: Monitoring/Alerting Setup
- [ ] **Configure**: Sentry DSN, uptime monitoring
- [ ] **Problem**: Sentry DSN defined but may not be configured in production. No alerting for critical errors.
- [ ] **Fix Required**:
  - Configure Sentry for server and PWA
  - Set up error rate alerts
  - Add uptime monitoring (UptimeRobot or similar)
  - Create on-call rotation for critical alerts
- [ ] **Acceptance Criteria**:
  - [ ] Errors tracked with source maps
  - [ ] Alerts sent for error rate spikes
  - [ ] Uptime monitored 24/7
- [ ] **Effort**: S
- [ ] **Impact**: MEDIUM — OPERATIONS
- [ ] **Dependencies**: Sentry account

---

## Summary

| Task ID | Severity | Effort | Impact | Status |
|---------|----------|--------|--------|--------|
| VIVIM-GAP-040 | 🟢 MEDIUM | M | USER CONTROL | ⚠️ OPEN |
| VIVIM-GAP-041 | 🟢 MEDIUM | L | NETWORK EFFECTS | ⚠️ OPEN |
| VIVIM-GAP-042 | 🟢 MEDIUM | L | CAPTURE UX | ⚠️ OPEN |
| VIVIM-GAP-043 | 🟢 MEDIUM | XL | MOBILE REACH | ⚠️ OPEN |
| VIVIM-GAP-044 | 🟢 MEDIUM | XL | REVENUE | ⚠️ OPEN |
| VIVIM-GAP-045 | 🟢 MEDIUM | L | FEDERATION | ⚠️ OPEN |
| VIVIM-GAP-046 | 🟢 MEDIUM | XL | DATA SOVEREIGNTY | ⚠️ OPEN |
| VIVIM-GAP-047 | 🟢 LOW | S | PERFORMANCE | ⚠️ OPEN |
| VIVIM-GAP-048 | 🟢 LOW | M | UX SMOOTHNESS | ⚠️ OPEN |
| VIVIM-GAP-049 | 🟢 LOW | M | LOAD PERF | ⚠️ OPEN |
| VIVIM-GAP-050 | 🟢 LOW | L | QUALITY | ⚠️ OPEN |
| VIVIM-GAP-051 | 🟢 LOW | M | SCALABILITY | ⚠️ OPEN |
| VIVIM-GAP-052 | 🟢 LOW | M | UX POLISH | ⚠️ OPEN |
| VIVIM-GAP-053 | 🟢 LOW | XS | CODE QUALITY | ⚠️ OPEN |
| VIVIM-GAP-054 | 🟢 LOW | XS | ACCESSIBILITY | ⚠️ OPEN |
| VIVIM-GAP-055 | 🟢 LOW | S | OPERATIONS | ⚠️ OPEN |

**Total Medium Tasks**: 7  
**Total Low Tasks**: 9  
**Estimated Total Effort**: ~18-22 developer-days

---

## Implementation Priority Order

### Medium Priority
1. **VIVIM-GAP-041** (Public feed) — Network effects
2. **VIVIM-GAP-042** (Browser extension) — Capture UX
3. **VIVIM-GAP-040** (Context recipes) — User control
4. **VIVIM-GAP-050** (E2E testing) — Quality assurance
5. **VIVIM-GAP-051** (Load testing) — Scalability
6. **VIVIM-GAP-045** (ActivityPub) — Federation
7. **VIVIM-GAP-043** (Mobile app) — Mobile reach
8. **VIVIM-GAP-044** (Marketplace) — Revenue
9. **VIVIM-GAP-046** (Per-user isolation) — Data sovereignty

### Low Priority
1. **VIVIM-GAP-055** (Monitoring) — Operations
2. **VIVIM-GAP-047** (HNSW index) — Performance
3. **VIVIM-GAP-049** (Bundle audit) — Load performance
4. **VIVIM-GAP-048** (React 19 features) — UX smoothness
5. **VIVIM-GAP-052** (ACUGraph responsive) — UX polish
6. **VIVIM-GAP-050** (E2E tests) — Quality
7. **VIVIM-GAP-053** (Copy unification) — Code quality
8. **VIVIM-GAP-054** (Focus reset) — Accessibility

---

## Assistant-UI Migration (Special Track)

### VIVIM-GAP-056: assistant-ui Integration
- [ ] **Install**: `@assistant-ui/react` + `@assistant-ui/react-ai-sdk`
- [ ] **Create**: `pwa/src/providers/VivimAIChatProvider.tsx`
- [ ] **Create**: `pwa/src/components/ai/VIVIMThread.tsx`
- [ ] **Create**: `pwa/src/components/ai/VIVIMMessage.tsx`
- [ ] **Create**: `pwa/src/components/ai/tools/MemoryRetrievalUI.tsx`
- [ ] **Create**: `pwa/src/components/ai/tools/ACUExtractionUI.tsx`
- [ ] **Update**: `pwa/src/stores/appStore.ts` — deprecate chat state
- [ ] **Problem**: Custom streaming/state logic in `useAIChat.ts` should be replaced with `@assistant-ui/react` primitives.
- [ ] **Fix Required**:
  - Remove manual `EventSource`/`fetch` streaming
  - Replace with `useChatRuntime` from `@assistant-ui/react-ai-sdk`
  - Build tool UIs for Context Engine visualization
  - Sync completed threads from `ThreadRuntime` → Dexie on `onFinish`
- [ ] **Acceptance Criteria**:
  - [ ] Chat uses assistant-ui primitives
  - [ ] ContextCockpit bound to tool call args/results
  - [ ] Threads persist to IndexedDB
  - [ ] No manual streaming logic
- [ ] **Effort**: L
- [ ] **Impact**: HIGH — CODE QUALITY + DX
- [ ] **Dependencies**: None

---

## Production Deployment Checklist

Before going live, ensure all CRITICAL items are complete and these production configs are set:

### Security
- [ ] Rotate `SESSION_SECRET` (strong random ≥32 chars)
- [ ] Rotate `JWT_SECRET` (strong random ≥32 chars)
- [ ] Rotate `ZAI_API_KEY` (use production key)
- [ ] Restrict `CORS_ORIGINS` to production domains only
- [ ] Set `DATABASE_SSL_REQUIRED=true`
- [ ] Set `SKIP_AUTH_FOR_DEVELOPMENT=false`
- [ ] Remove/disable debug endpoints (`DEBUG=false`)
- [ ] Enable rate limiting globally

### Infrastructure
- [ ] Configure `P2P_BOOTSTRAP_PEERS` if P2P enabled
- [ ] Set up PostgreSQL with pgvector in production
- [ ] Configure Redis for caching
- [ ] Set up automated database backups
- [ ] CDN for Vite static assets
- [ ] Sentry DSN configured
- [ ] Health check endpoint monitored by uptime service

### Functional
- [ ] Playwright browsers installed on server
- [ ] All provider extractors tested against production URLs
- [ ] Email service configured for notifications
- [ ] Google OAuth callback URL updated to production domain

---

**Previous Documents**: 
- `PendingUPDATESall-01-critical.md`  
- `PendingUPDATESall-02-high.md`

---

## Master Summary

| Tier | Task Count | Est. Effort |
|------|------------|-------------|
| 🔴 CRITICAL | 11 | ~12-14 days |
| 🟡 HIGH | 14 | ~10-12 days |
| 🟢 MEDIUM | 7 | ~8-10 days |
| 🟢 LOW | 9 | ~6-8 days |
| **TOTAL** | **41** | **~36-44 days** |

**Note**: This is a comprehensive backlog. Prioritize based on immediate business needs and user feedback.
