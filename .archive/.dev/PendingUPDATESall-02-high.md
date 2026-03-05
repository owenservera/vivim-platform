# VIVIM — Pending Updates: HIGH TIER (🟡)

**Generated**: 2026-03-05  
**Source**: `.archive/.dev/` audit documents  
**Status**: Pending Implementation  
**Excludes**: `compare-to-gap-VIVIM_UPGRADE_PLAN.md` (currently being implemented)

---

## Overview

This document contains **HIGH** priority tasks that significantly impact user experience, developer experience, and system maintainability. These should be implemented after CRITICAL tier items are resolved.

---

## 🟡 TIER 2 — HIGH: Frontend UX

### VIVIM-GAP-026: Desktop Sidebar Navigation
- [ ] **Create**: `pwa/src/components/layout/SideNav.tsx`
- [ ] **Update**: `pwa/src/components/unified/ResponsiveLayout.tsx`
- [ ] **Problem**: Desktop users (>1024px) see stretched mobile UI with BottomNav at bottom. No responsive switch to left-side rail/sidebar.
- [ ] **Fix Required**:
  - Create `SideNav` component with navigation items: Home, Capture, Search, Notebooks, Settings, Admin
  - Update `ResponsiveLayout` to conditionally render SideNav on desktop (≥1024px)
  - Hide BottomNav on desktop when SideNav is active
  - Add collapse/expand toggle for SideNav
- [ ] **Acceptance Criteria**:
  - [ ] Desktop users see left sidebar navigation
  - [ ] Sidebar collapses to icons-only mode
  - [ ] BottomNav hidden on desktop
  - [ ] Smooth transition between mobile/desktop layouts
- [ ] **Effort**: M
- [ ] **Impact**: HIGH — DESKTOP UX
- [ ] **Dependencies**: None

---

### VIVIM-GAP-027: SyncIndicator Modernization
- [ ] **File**: `pwa/src/components/SyncIndicator.tsx`
- [ ] **Problem**: Uses hardcoded emoji strings (`📡`, `🔄`, `⚠️`) instead of Lucide icons. `handleManualSync` is stubbed but button remains clickable giving false feedback.
- [ ] **Fix Required**:
  - Replace emojis with animated Lucide icons:
    - Online: `Satellite` or `Wifi`
    - Syncing: `RefreshCw` (with spin animation)
    - Offline: `WifiOff`
    - Conflict: `AlertTriangle`
  - **Option A**: Implement actual GossipSub trigger for manual sync
  - **Option B**: Disable/hide manual sync button with tooltip explaining auto-sync
- [ ] **Acceptance Criteria**:
  - [ ] Icons match design system (lucide-react)
  - [ ] Manual sync button either works or is disabled with explanation
  - [ ] ARIA labels for screen readers
- [ ] **Effort**: S
- [ ] **Impact**: MEDIUM — UX POLISH
- [ ] **Dependencies**: None

---

### VIVIM-GAP-028: ErrorState Differentiation
- [ ] **File**: `pwa/src/components/ios/ErrorState.tsx`
- [ ] **Move to**: `pwa/src/components/unified/ErrorState.tsx`
- [ ] **Problem**: All errors show generic `WifiOff` icon regardless of error type. Uses hardcoded Tailwind colors instead of semantic design tokens.
- [ ] **Fix Required**:
  - Map `IOSErrorType` to specific Lucide icons:
    - `Network` → `WifiOff`
    - `Database` → `Database`
    - `Timeout` → `Clock`
    - `NotFound` → `Search`
    - `Permission` → `Lock`
    - `Server` → `ServerCrash`
  - Replace hardcoded colors with CSS variables: `var(--color-error-*)`, `var(--color-warning-*)`
  - Move from `ios/` folder to `unified/` folder
- [ ] **Acceptance Criteria**:
  - [ ] Each error type has distinct icon
  - [ ] Colors use design tokens
  - [ ] Component usable across entire app
- [ ] **Effort**: XS
- [ ] **Impact**: MEDIUM — UX CLARITY
- [ ] **Dependencies**: None

---

### VIVIM-GAP-029: ContextVisualizer Color System
- [ ] **File**: `pwa/src/components/ContextVisualizer.tsx`
- [ ] **Problem**: `LAYER_COLORS` object has hardcoded hex values (`#8b5cf6`, `#6366f1`, etc.) bypassing Tailwind theming and preventing dark mode adaptation.
- [ ] **Fix Required**:
  - Add CSS variables to `design-system.css`:
    ```css
    --layer-0: #8b5cf6;  /* identity */
    --layer-1: #6366f1;  /* global_prefs */
    --layer-2: #0ea5e9;  /* topic */
    --layer-3: #10b981;  /* entity */
    --layer-4: #f59e0b;  /* conversation */
    --layer-5: #ef4444;  /* jit */
    --layer-6: #ec4899;  /* message_history */
    --layer-7: #14b8a6;  /* user_message */
    ```
  - Replace `LAYER_COLORS` with `var(--layer-{n})` references
  - Add dark mode variants if needed
- [ ] **Acceptance Criteria**:
  - [ ] All layer colors use CSS variables
  - [ ] Dark mode compatible
  - [ ] Theme customization possible
- [ ] **Effort**: XS
- [ ] **Impact**: MEDIUM — DESIGN SYSTEM
- [ ] **Dependencies**: Design system CSS variables

---

### VIVIM-GAP-030: Design System Consolidation (Provider Gradients)
- [ ] **Files**: `pwa/src/pages/Home.css`, `pwa/src/pages/Capture.css`
- [ ] **Problem**: Provider gradients are hardcoded hex values with no CSS variable abstraction, no dark mode fallbacks.
- [ ] **Fix Required**:
  - Extract provider gradients to CSS variables:
    ```css
    --provider-chatgpt-gradient: linear-gradient(90deg, #10b981, #059669);
    --provider-claude-gradient: linear-gradient(90deg, #f97316, #ea580c);
    --provider-gemini-gradient: linear-gradient(90deg, #3b82f6, #1d4ed8);
    --provider-grok-gradient: linear-gradient(90deg, #ef4444, #b91c1c);
    --provider-perplexity-gradient: linear-gradient(90deg, #8b5cf6, #6d28d9);
    --provider-deepseek-gradient: linear-gradient(90deg, #06b6d4, #0891b2);
    --provider-kimi-gradient: linear-gradient(90deg, #ec4899, #be185d);
    --provider-qwen-gradient: linear-gradient(90deg, #6366f1, #4f46e5);
    ```
  - Add `@media (prefers-color-scheme: dark)` fallbacks with adjusted colors
  - Update all references to use `var(--provider-{name}-gradient)`
- [ ] **Acceptance Criteria**:
  - [ ] All provider gradients use CSS variables
  - [ ] Dark mode variants defined
  - [ ] Gradients adapt to user theme preference
- [ ] **Effort**: S
- [ ] **Impact**: MEDIUM — DESIGN SYSTEM
- [ ] **Dependencies**: None

---

### VIVIM-GAP-031: AIChat Model Selector Dropdown
- [ ] **File**: `pwa/src/components/AIChat.tsx`
- [ ] **Problem**: Model selector dropdown uses global `mousedown` listener that doesn't handle touch events reliably. `activeModels` extraction casts to `any` type.
- [ ] **Fix Required**:
  - Replace custom dropdown with Radix UI `DropdownMenu` primitive
  - Ensure focus trapping and reliable outside-click detection
  - Add touch event support
  - Remove `any` type casting with proper type guards
- [ ] **Acceptance Criteria**:
  - [ ] Dropdown closes reliably on outside click (mouse and touch)
  - [ ] Keyboard navigation works (Tab, Enter, Escape)
  - [ ] No TypeScript `any` casts
- [ ] **Effort**: S
- [ ] **Impact**: MEDIUM — ACCESSIBILITY
- [ ] **Dependencies**: Radix UI (already installed)

---

### VIVIM-GAP-032: Reduced Motion Propagation
- [ ] **Files**: 
  - `pwa/src/components/ContextVisualizer.tsx`
  - `pwa/src/components/AIChat.tsx`
  - All animation-heavy components
- [ ] **Problem**: `prefers-reduced-motion` only added to `Home.css`. Other components still animate fully for users with vestibular disorders.
- [ ] **Fix Required**:
  - Add `@media (prefers-reduced-motion: reduce)` to all CSS files with animations
  - Use framer-motion's `useReducedMotion` hook in component animations
  - Disable or simplify animations when reduced motion preferred
- [ ] **Acceptance Criteria**:
  - [ ] All animations respect user preference
  - [ ] No motion-triggering effects for users with reduced motion setting
  - [ ] Functionality remains intact without animations
- [ ] **Effort**: M
- [ ] **Impact**: MEDIUM — ACCESSIBILITY
- [ ] **Dependencies**: None

---

### VIVIM-GAP-033: Virtualizer Dynamic Height Fix
- [ ] **File**: `pwa/src/pages/Home.tsx`
- [ ] **Problem**: `virtualizer.estimateSize` hardcodes pixel heights (180 for grid, 140 for list). Breaks when text wrapping pushes card to different heights, causing scroll jank.
- [ ] **Fix Required**:
  - Implement dynamic height measurement using `ResizeObserver`
  - Use `useElementSize` hook or similar pattern
  - Cache measured heights to avoid recalculation on every render
  - Fallback to estimate for unmeasured items
- [ ] **Acceptance Criteria**:
  - [ ] Scroll position stable during content load
  - [ ] No jank when cards have variable text length
  - [ ] Performance remains acceptable (no layout thrashing)
- [ ] **Effort**: M
- [ ] **Impact**: MEDIUM — MOBILE PERFORMANCE
- [ ] **Dependencies**: None

---

### VIVIM-GAP-034: ContentRenderer Lazy Load Error States
- [ ] **File**: `pwa/src/components/content/ContentRenderer.tsx`
- [ ] **Problem**: Mermaid and KaTeX lazy-load error states fall back silently or with generic UI. Users don't know why content isn't rendering.
- [ ] **Fix Required**:
  - Add specific error messages for lazy-load failures:
    - "Diagram failed to load — check connection"
    - "Math rendering unavailable offline"
  - Add retry button for failed lazy loads
  - Log errors to telemetry for debugging
- [ ] **Acceptance Criteria**:
  - [ ] Users see clear error messages for failed renders
  - [ ] Retry mechanism available
  - [ ] Errors tracked in telemetry
- [ ] **Effort**: S
- [ ] **Impact**: LOW — UX CLARITY
- [ ] **Dependencies**: None

---

## 🟡 TIER 2 — HIGH: Backend Architecture

### VIVIM-GAP-035: Cache Invalidation Refactor (Event Bus Pattern)
- [ ] **File**: `server/src/services/unified-context-service.ts:252`
- [ ] **Problem**: Cache invalidation done inline instead of emitting to `InvalidationService` via `ContextEventBus`. Creates race conditions and tightly coupled logic.
- [ ] **Fix Required**:
  - Refactor to emit events to `ContextEventBus`:
    ```typescript
    await ContextEventBus.emit('BUNDLE_INVALIDATED', {
      userId,
      bundleType: 'memory',
      relatedIds: [memoryId]
    });
    ```
  - `InvalidationService` subscribes to events and handles Prisma updates
  - Add version/timestamp to bundle cache key to prevent race conditions
- [ ] **Acceptance Criteria**:
  - [ ] No direct Prisma writes in context service
  - [ ] All invalidation goes through event bus
  - [ ] Cache race conditions eliminated
- [ ] **Effort**: S
- [ ] **Impact**: MEDIUM — ARCHITECTURAL CLEANLINESS
- [ ] **Dependencies**: ContextEventBus (exists)

---

### VIVIM-GAP-036: Feed Analytics Telemetry Sync
- [ ] **Create**: `server/src/routes/feed.js` endpoint `POST /api/v2/feed/analytics`
- [ ] **Update**: `pwa/src/lib/recommendation/analytics.ts:169`
- [ ] **Problem**: Client-side recommendation engine logs feed impressions locally but never syncs to server. Server analytics endpoints don't exist.
- [ ] **Fix Required**:
  - Create batch endpoint for impression telemetry
  - Implement rate limiting (100 impressions per batch)
  - Update PWA to batch-send telemetry every 5 minutes
  - Store impressions in `FeedImpression` table for algorithm training
- [ ] **Acceptance Criteria**:
  - [ ] Impressions synced to server
  - [ ] Batch sending reduces network overhead
  - [ ] Data available for feed ranking algorithm
- [ ] **Effort**: S
- [ ] **Impact**: MEDIUM — RECOMMENDATION SYSTEM
- [ ] **Dependencies**: None

---

### VIVIM-GAP-037: Memory TTL/Expiry Implementation
- [ ] **File**: `server/prisma/schema.prisma`
- [ ] **Add Field**: `Memory.expiresAt DateTime?`
- [ ] **Problem**: Memories never auto-expire — database grows indefinitely. No TTL implementation.
- [ ] **Fix Required**:
  - Add `expiresAt` field to Memory model
  - Implement TTL calculation based on importance score:
    - High importance (>0.8): expires in 1 year
    - Medium importance (0.5-0.8): expires in 6 months
    - Low importance (<0.5): expires in 1 month
  - Add cron job to archive expired memories monthly
- [ ] **Acceptance Criteria**:
  - [ ] Memories have expiration dates
  - [ ] Low-importance memories auto-archive
  - [ ] User can manually extend memory expiration
- [ ] **Effort**: M
- [ ] **Impact**: MEDIUM — DATABASE HYGIENE
- [ ] **Dependencies**: None

---

### VIVIM-GAP-038: Email Notification Service
- [ ] **Create**: `server/src/services/email-service.js`
- [ ] **Problem**: No email provider configured — notifications never sent. Critical for user engagement and security alerts.
- [ ] **Fix Required**:
  - Integrate email provider (SendGrid, Postmark, or AWS SES)
  - Implement email templates for:
    - Share notifications
    - Security alerts (login, MFA changes)
    - System notifications
  - Add email preferences to user settings
- [ ] **Acceptance Criteria**:
  - [ ] Transactional emails send successfully
  - [ ] Email templates match design system
  - [ ] Users can configure email preferences
- [ ] **Effort**: M
- [ ] **Impact**: HIGH — USER ENGAGEMENT
- [ ] **Dependencies**: Email provider API key

---

### VIVIM-GAP-039: Post-Quantum Crypto WASM Integration
- [ ] **File**: `pwa/src/lib/storage-v2/secure-crypto.ts`
- [ ] **Lines**: 537, 608, 737, 754
- [ ] **Problem**: CRYSTALS-Kyber and Dilithium are stubbed. Falls back to standard elliptic curves, not spec-required post-quantum algorithms.
- [ ] **Fix Required**:
  - Integrate WebAssembly modules for Kyber-1024 and Dilithium3
  - Replace stub implementations with actual PQ algorithms
  - Add fallback to classical crypto if WASM fails to load
  - Test interoperability with server-side crypto
- [ ] **Acceptance Criteria**:
  - [ ] Kyber key exchange functional
  - [ ] Dilithium signatures functional
  - [ ] Fallback graceful on WASM load failure
- [ ] **Effort**: L
- [ ] **Impact**: MEDIUM — FUTURE-PROOF SECURITY
- [ ] **Dependencies**: WASM module availability

---

## Summary

| Task ID | Severity | Effort | Impact | Status |
|---------|----------|--------|--------|--------|
| VIVIM-GAP-026 | 🟡 HIGH | M | DESKTOP UX | ⚠️ OPEN |
| VIVIM-GAP-027 | 🟡 HIGH | S | UX POLISH | ⚠️ OPEN |
| VIVIM-GAP-028 | 🟡 HIGH | XS | UX CLARITY | ⚠️ OPEN |
| VIVIM-GAP-029 | 🟡 HIGH | XS | DESIGN SYSTEM | ⚠️ OPEN |
| VIVIM-GAP-030 | 🟡 HIGH | S | DESIGN SYSTEM | ⚠️ OPEN |
| VIVIM-GAP-031 | 🟡 HIGH | S | ACCESSIBILITY | ⚠️ OPEN |
| VIVIM-GAP-032 | 🟡 HIGH | M | ACCESSIBILITY | ⚠️ OPEN |
| VIVIM-GAP-033 | 🟡 HIGH | M | MOBILE PERF | ⚠️ OPEN |
| VIVIM-GAP-034 | 🟡 HIGH | S | UX CLARITY | ⚠️ OPEN |
| VIVIM-GAP-035 | 🟡 HIGH | S | ARCHITECTURE | ⚠️ OPEN |
| VIVIM-GAP-036 | 🟡 HIGH | S | RECOMMENDATIONS | ⚠️ OPEN |
| VIVIM-GAP-037 | 🟡 HIGH | M | DATABASE | ⚠️ OPEN |
| VIVIM-GAP-038 | 🟡 HIGH | M | ENGAGEMENT | ⚠️ OPEN |
| VIVIM-GAP-039 | 🟡 HIGH | L | SECURITY | ⚠️ OPEN |

**Total High Tasks**: 14  
**Estimated Total Effort**: ~10-12 developer-days

---

## Implementation Priority Order

1. **VIVIM-GAP-026** (Desktop Sidebar) — Core desktop UX
2. **VIVIM-GAP-038** (Email service) — User engagement
3. **VIVIM-GAP-027** (SyncIndicator) — Visible polish
4. **VIVIM-GAP-028** (ErrorState) — UX clarity
5. **VIVIM-GAP-030** (Provider gradients) — Design system
6. **VIVIM-GAP-029** (ContextVisualizer colors) — Design system
7. **VIVIM-GAP-031** (AIChat dropdown) — Accessibility
8. **VIVIM-GAP-032** (Reduced motion) — Accessibility
9. **VIVIM-GAP-035** (Cache invalidation) — Architecture
10. **VIVIM-GAP-033** (Virtualizer heights) — Mobile performance
11. **VIVIM-GAP-036** (Feed analytics) — Recommendations
12. **VIVIM-GAP-037** (Memory TTL) — Database hygiene
13. **VIVIM-GAP-034** (Lazy load errors) — UX clarity
14. **VIVIM-GAP-039** (Post-quantum crypto) — Future-proofing

---

**Previous Document**: `PendingUPDATESall-01-critical.md`  
**Next Document**: `PendingUPDATESall-03-medium.md` (MEDIUM priority tasks)
