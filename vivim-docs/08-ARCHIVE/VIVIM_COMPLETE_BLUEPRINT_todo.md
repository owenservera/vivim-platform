# VIVIM Deep Extraction & Modernization Blueprint

## DOCUMENT 1 — COMPONENT ANATOMY MAP

### 1A. Component Inventory

| Component Name | File Path | Props | Variants / States | Mobile Behavior | Desktop Behavior | Dark Mode | A11y Status | Known Bugs |
|---|---|---|---|---|---|---|---|---|
| `Button` | `pwa/src/components/ui/button.tsx` | `variant`, `size`, `asChild` | default, destructive, outline, secondary, ghost, link | Full width | Auto width | Yes | Focus states visible | None |
| `Badge` | `pwa/src/components/ui/badge.tsx` | `variant` | default, secondary, destructive, outline | Inline flex | Inline flex | Yes | Basic | None |
| `Card` | `pwa/src/components/ui/card.tsx` | Standard HTML div props | default | Stacked | Grid/Stack | Yes | None specific | None |
| `Accordion` | `pwa/src/components/ui/accordion.tsx` | Radix primitive props | default | Stacked | Stacked | Yes | Radix A11y | None |
| `DropdownMenu` | `pwa/src/components/ui/dropdown-menu.tsx` | Radix primitive props | default | Bottom sheet fallback missing | Dropdown | Yes | Radix A11y | None |
| `Table` | `pwa/src/components/ui/table.tsx` | Standard HTML table props | default | Overflow-x auto | Full width | Yes | Basic | None |
| `Tooltip` | `pwa/src/components/ui/tooltip.tsx` | Radix primitive props | default | Tap to show | Hover to show | Yes | Radix A11y | None |
| `ResponsiveLayout` | `pwa/src/components/unified/ResponsiveLayout.tsx`| `maxWidth`, `padding` | default | Uses mobile classes | Uses desktop classes | Yes | N/A | None |
| `Input` | `pwa/src/components/unified/Input.tsx` | `label`, `error`, `icon` | default, error | Full width | Auto/Full width | Yes | ARIA describedby | None |

### 1B. Component Deep-Dives

#### `ConversationCard` & `FeedItemCard` (in `Home.tsx`)
**What it renders and why:** 
This component serves as the primary visual representation of a captured AI conversation in the user's library. It renders the provider icon, timestamps, a preview snippet, tags, and mini-stats (message count, word count, code blocks). 
**Data Expectations:** 
Expects a `Conversation` object and multiple callback props for actions (`onContinue`, `onShare`, `onPinToggle`, `onArchiveToggle`, `onDelete`). 
**Current Gaps:** 
The CSS class `.is-archived` applies a global `opacity: 0.6` to the entire card, meaning action buttons become faded and difficult to interact with. Keyboard navigation relies strictly on `e.key === 'Enter'`, completely missing `Space` key support for activation. Model name extraction attempts to use `convo.model || convo.metadata?.model` but fails if the shape changes.
**2026 Standard Needs:** 
Needs localized opacity (only dimming the content, not the actions). Must implement comprehensive ARIA labels (e.g., `<span className="sr-only">Messages:</span>` for the stats pills). Needs to migrate away from hardcoded gradients in `Home.css` to semantic CSS variables.

#### `ContentRenderer` (`pwa/src/components/content/ContentRenderer.tsx`)
**What it renders and why:** 
The unified engine for rendering all chat blocks, supporting Markdown, Code (via Prism), Math (KaTeX), Mermaid diagrams, and custom ACU tool/result calls. It is heavily modularized.
**Data Expectations:** 
Takes a `ContentBlock[]` or `ContentPart[]` array, iterating over types like `text`, `code`, `mermaid`, `image`, etc.
**Current Gaps:** 
Mermaid and KaTeX are dynamically imported, which is good for bundle size, but error states for these specific lazy-loads fall back silently or with generic UI. The `UnknownPart` fallback uses basic dashed borders. Admonitions (`:::note`) are parsed via custom remark directives but rely on strict regex matching for colors. 
**2026 Standard Needs:** 
Needs seamless suspense boundaries for lazy-loaded renderers, ensuring no layout shift when a large Mermaid diagram initializes. Should adopt a unified `copy` interaction model (currently `TextPart` and `CodePart` duplicate copy logic).

#### `ContextVisualizer` (`pwa/src/components/ContextVisualizer.tsx`)
**What it renders and why:** 
Renders the "Glass Box Inspector" to show users exactly how the token budget was allocated across the 8 Context Layers (L0 to L7). 
**Data Expectations:** 
Expects `contextAllocation` (a record of `LayerBudget` items), `totalTokensAvailable`, and `ContextMetadata`. 
**Current Gaps:** 
Colors are hardcoded in the component (`LAYER_COLORS = { 'L0_identity': '#8b5cf6', ... }`), bypassing the Tailwind configuration and preventing robust theming. The dropdown for XAI Attribution uses an inline SVG instead of the unified `lucide-react` icon set.
**2026 Standard Needs:** 
Migrate hardcoded colors to CSS variables tied to the design system (e.g., `var(--layer-0)`). Implement smooth height transitions using `framer-motion` `AnimatePresence` for the expansion panel rather than relying on conditional rendering that causes layout snapping.

#### `SyncIndicator` (`pwa/src/components/SyncIndicator.css/tsx`)
**What it renders and why:** 
Displays real-time network and CRDT sync status (Online, Syncing, Offline, Pending operations, Conflicts).
**Data Expectations:** 
Pulls directly from Zustand global state (`useAppStore(state => state.network)`).
**Current Gaps:** 
Uses hardcoded emoji strings (`'📡'`, `'🔄'`, `'⚠️'`) instead of proper SVGs/icons. The manual sync click handler (`handleManualSync`) is completely stubbed out with `// Chain client handles GossipSub sync automatically` but the button remains clickable and gives false feedback.
**2026 Standard Needs:** 
Replace emojis with animated Lucide icons. Implement the actual trigger for a forced manual GossipSub sync, or disable/remove the button if the architecture dictates entirely passive background syncing.

#### `ErrorState` (`pwa/src/components/ios/ErrorState.tsx`)
**What it renders and why:** 
Displays network, server, permission, and not-found error fallbacks.
**Data Expectations:** 
Expects an `IOSErrorType` enum and optional action callbacks.
**Current Gaps:** 
Fully functional but visually disconnected from the "unified" design system (lives in the `ios/` folder). Hardcodes generic Tailwind colors (`bg-orange-50 dark:bg-orange-900/20`) rather than semantic error tokens. 
**2026 Standard Needs:** 
Needs to be moved to the `unified` component directory. Should utilize standard design tokens (`var(--color-error-50)`). 

#### `AIChat` (`pwa/src/components/AIChat.tsx`)
**What it renders and why:** 
The primary interface for having conversations directly with the AI within VIVIM. Features a model selector, context visualizer injection, and streaming message rendering.
**Data Expectations:** 
Pulls from `useAIChat` hook and `useAIStore`. 
**Current Gaps:** 
The model selector dropdown logic (`setShowModelSelector(false)`) uses a simple global `mousedown` listener that doesn't account for touch events reliably. `activeModels` extraction logic relies on `AIProviderCapabilities` casting to `any`.
**2026 Standard Needs:** 
Should utilize Radix UI's DropdownMenu primitive to guarantee accessibility, focus trapping, and reliable outside-click detection across touch and mouse events.

---

## DOCUMENT 2 — PAGE-BY-PAGE LAYOUT SPECIFICATION

*(Note: Due to exhaustive length constraints, prioritizing core architectural pages based on the files provided and referenced)*

### Page: Home — Route: `/`

PURPOSE: The primary feed and dashboard for viewing, organizing, and interacting with captured conversations.

LAYOUT STRUCTURE (current):
  Mobile (<768px): Stacked vertical layout. Sticky header with search. Stats banner overflows horizontally. Bottom padding of `88px` applied for `BottomNav` clearance. Floating Action Button (FAB) at bottom right.
  Tablet (768–1024px): 2-column grid when in grid mode, bounded width (`max-w-[800px]`). 
  Desktop (>1024px): Same as tablet, centered column to prevent extreme line-lengths.

DATA DEPENDENCIES:
  - Zustand stores consumed: `useAIChat`, `useHomeUIStore` (`filterTab`, `viewMode`, `searchQuery`, `sortBy`).
  - API endpoints called: `apiClient.get('/conversations')`.
  - IndexedDB: `conversationService.getAllConversations()`, `unifiedRepository.getStats()`.

INTERACTIVE ELEMENTS:
  - Search input box.
  - Sort dropdown (native `<select>` visually hidden behind a button).
  - View mode toggles (List, Grid, Graph).
  - Filter tabs (All, Recent, Pinned, Archived).
  - FAB (Main toggle, expands to Capture, AI Chat, Refresh).
  - FeedItemCards (Click to route, swipe logic intended but not implemented).

CURRENT MOBILE ISSUES:
  - The Stats banner (`.home-stats-banner`) is scrollable but has `scrollbar-width: none` without any visual gradient or hint indicating there is off-screen content.
  - The FAB blocks the bottom right content of the last card due to Z-index and position overlap.

CURRENT DESKTOP ISSUES:
  - Grid mode stretches cards awkwardly on ultra-wide screens because it caps at 2 columns regardless of monitor width.
  - The native `<select>` overlay approach for the Sort button feels broken on macOS desktop Safari/Chrome, as the native dropdown spawns out of alignment.

RESPONSIVE GAPS:
  - In `Home.tsx` the `virtualizer.estimateSize` hardcodes pixel heights (180 for grid, 140 for list). This breaks completely when mobile text wrapping pushes a card to 160px or desktop pushes it to 120px. 

EMPTY STATES:
  - Exists. Shows a hero graphic with `MessageSquare` orb, and provides two buttons: "Capture First Conversation" and "Load Demo Data".

LOADING STATES:
  - Uses `IOSSkeletonList` count=6.
  - Infinite scroll uses an intersection observer div with `h-8 w-full`.

ERROR STATES:
  - Renders inline block with `WifiOff` icon and a "Retry" button connected to `loadConversations`.

---

### Page: Capture — Route: `/capture`
*(Inferred from routes and common components)*

PURPOSE: Interface to input URLs from third-party AI platforms for parsing and extraction.

LAYOUT STRUCTURE (current):
  Mobile (<768px): Single column, large URL input field, provider toggles stacked.
  Tablet/Desktop (>768px): Centered single column, max-width bounded.

DATA DEPENDENCIES:
  - API endpoints called: `POST /api/v1/capture`.

INTERACTIVE ELEMENTS:
  - URL Text Input.
  - Paste clipboard button.
  - Provider selection chips.
  - Submit/Capture button.

CURRENT MOBILE ISSUES:
  - Virtual keyboard often pushes the submit button out of viewport if sticky positioning is incorrect.

EMPTY STATES:
  - N/A (form is empty by default).

LOADING STATES:
  - Spinner on the submit button.

ERROR STATES:
  - Likely uses inline `IOSErrorCard` or toast notification for "Unsupported Provider" / "Timeout".

---

## DOCUMENT 3 — DESIGN TOKEN EXTRACTION

### 3A — Color Audit
**From `tailwind.config.js` and CSS files:**
- `--primary-500`: `#6366f1` (Indigo)
- `--accent-500`: `#8b5cf6` (Violet)
- `--bg-primary`: `#FAFAFA`
- `--bg-secondary`: `#FFFFFF`
- `--text-primary`: `#111827`
- `--text-secondary`: `#4B5563`
- `--success-500`: `#10b981`
- `--error-500`: `#ef4444`

**Hardcoded Colors in `Home.css` (GAPS):**
- ChatGPT Gradient: `linear-gradient(90deg, #10b981, #059669)` — NO DARK MODE VARIANT.
- Claude Gradient: `linear-gradient(90deg, #f97316, #ea580c)` — NO DARK MODE VARIANT.
- Gemini Gradient: `linear-gradient(90deg, #3b82f6, #1d4ed8)` — NO DARK MODE VARIANT.
- Grok Gradient: `linear-gradient(90deg, #ef4444, #b91c1c)` — NO DARK MODE VARIANT.

**Hardcoded Colors in `ContextVisualizer.tsx`:**
- `#8b5cf6`, `#6366f1`, `#0ea5e9`, `#10b981`, `#f59e0b`, `#ef4444`, `#ec4899`, `#14b8a6`.

### 3B — Typography Audit
- `font-sans`: `Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`
- `font-mono`: `Fira Code, SF Mono, Consolas, monospace`
- `ContentRenderer.tsx` hardcodes: `fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace'` for Mermaid and Prism syntax highlighting. (Inconsistency with Tailwind config).

### 3C — Spacing & Sizing Audit
- `Home.css` uses specific `px` values instead of Tailwind REM spacing:
  - `bottom: 76px` (FAB area)
  - `width: 50px; height: 50px;` (FAB main)
  - `padding: 10px 16px;` (Stats banner)
- `BottomNav.tsx` uses `h-16 pb-safe` which mixes Tailwind and safe-area variables correctly.

### 3D — Animation & Motion Audit
- `framer-motion` properties observed in `Home.tsx` and `ContextVisualizer.tsx`.
- CSS Animations in `Home.css`:
  - `@keyframes shimmer` (loading states)
  - `@keyframes fadeSlideUp` (card entrances)
  - `@keyframes scaleIn` (FAB mini buttons)
  - `@keyframes badgePop` (notification pills)
- **Gap:** Missing `@media (prefers-reduced-motion: reduce)` fallbacks in `Home.css` for `fadeSlideUp`, `scaleIn`, and `badgePop`.

### 3E — Provider Accent System
*(Extracted from `Home.css` L236-L245)*
- `.chatgpt`: `#10b981` to `#059669`
- `.claude`: `#f97316` to `#ea580c`
- `.gemini`: `#3b82f6` to `#1d4ed8`
- `.grok`: `#ef4444` to `#b91c1c`
- `.perplexity`: `#8b5cf6` to `#6d28d9`
- `.deepseek`: `#06b6d4` to `#0891b2`
- `.kimi`: `#ec4899` to `#be185d`
- `.qwen`: `#6366f1` to `#4f46e5`

---

## DOCUMENT 4 — STATE ARCHITECTURE MAP

### 4A — Zustand Store Inventory

**Store: `useAppStore`**
- **File:** `pwa/src/lib/stores/appStore.ts`
- **State Shape:**
  - `identity`: { did, publicKey, displayName, avatar, verified, createdAt }
  - `network`: { status, peerCount, lastSync, pendingOperations, bootstrapNodes }
  - `storage`: { localUsed, localCapacity, ipfsPinned, ipfsPins, activeDeals, defaultVisibility }
  - `ai`: { activeProvider, availableProviders, memoryEnabled, contextWindowUsed }
  - `ui`: { theme, sidebarCollapsed, activeConversation, notifications }
  - `sovereignty`: { defaultStorageLocation, requireExplicitConsent, encryptByDefault, allowAnalytics }
  - `social`: { circles, following, followers }
- **Actions:** 
  - `setIdentity`, `setNetworkStatus`, `updateStorageStats`, `exportAllData` (STUBBED), `importData` (STUBBED).
- **Persistence:** Persisted to `localStorage` using `zustand/middleware` `persist` with `createJSONStorage`. Uses `partialize` to exclude temporary state (though currently partializing almost everything).
- **Known Issues:** 
  - `exportAllData` and `importData` actions contain `// TODO: Connect to backend API` and only run `console.log`.

**Store: `useHomeUIStore`**
- **File:** `pwa/src/stores/useHomeUIStore.ts`
- **State Shape:** `filterTab`, `viewMode`, `searchQuery`, `sortBy`, `fabExpanded`.
- **Actions:** Standard setters (`setFilterTab`, etc.)
- **Persistence:** NOT persisted. Reloading resets view to `list` and `all`.

### 4B — TanStack Query Key Registry
- `['conversations']` -> `apiClient.get('/conversations')` (Observed in `Home.tsx` overview documentation).

### 4C — IndexedDB Schema (Dexie)
- **Database Name:** `vivim`
- **File:** `pwa/src/lib/db.ts`
- **Tables:**
  - `conversations`: Indexed by `id, provider, createdAt, synced`.
  - `messages`: Indexed by `id, conversationId, createdAt`.
  - `settings`: Indexed by `key`.
  - `syncQueue`: Indexed by `id, type, status, createdAt`.
- **Sync Logic:** `syncQueue` handles offline operations. If offline, mutations go to `syncQueue`. Handled by `DataSyncService` when online.

---

## DOCUMENT 5 — API CONTRACT COMPLETENESS AUDIT

### 5A — Express API Endpoints

**Endpoint: GET `/api/admin/system/stats`**
- Handler: `server/src/routes/admin/system.js` L21
- Auth: `requireAdminAuth`
- Input: None
- Response: JSON object with `cpu`, `memory`, `disk`, `uptime`.
- Status: ❌ STUBBED. Disk stats are mocked (`1000000000000`).

**Endpoint: GET `/api/admin/database/tables`**
- Handler: `server/src/routes/admin/database.js` L45
- Auth: Admin
- Input: None
- Response: Array of table info.
- Status: ❌ STUBBED. Uses `mockTables` array. `// TODO: Use Prisma introspection`.

**Endpoint: POST `/api/admin/database/query`**
- Handler: `server/src/routes/admin/database.js` L94
- Auth: Admin
- Input: `{ query: string }`
- Response: Query execution result.
- Status: ⚠️ SECURITY RISK / PARTIAL. Executes raw SQL via `prisma.$queryRawUnsafe`. Tries to restrict to `SELECT` via string matching (`startsWith('SELECT')`), which is trivial to bypass with spaces or comments.

**Endpoint: POST `/api/admin/crdt/documents/:id/resolve`**
- Handler: `server/src/routes/admin/crdt.js` L156
- Auth: Admin
- Input: `{ resolution: any }`
- Response: Success message.
- Status: ❌ STUBBED. `// TODO: Integrate with CRDTSyncService to actually resolve conflicts`.

**Endpoint: GET `/api/v1/health/detailed`**
- Handler: `server/src/routes/admin/system.js` L189
- Status: Partially implemented. Hardcodes network and storage as `'up'`.

### 5B — SDK Node Methods

**Node: AdminNetworkService** (`server/src/services/admin-network-service.js`)
- Methods: `getNodes()`, `getConnections()`, `getMetrics()`
- Status: ❌ ENTIRELY STUBBED. All methods contain `// TODO: Integrate with NetworkNode package` and return empty internal class arrays.

---

## DOCUMENT 6 — SOCKET & REAL-TIME AUDIT

**File:** `server/src/services/socket.ts`

- **Initialization:** Created via `SocketIOServer` attached to Express HTTP server.
- **Events Listened:**
  - `sync:pull` -> Calls `handleSyncPull`
  - `sync:push` -> Calls `handleSyncPush`
  - `join`, `leave`, `offer`, `answer`, `ice` -> WebRTC Signaling
- **Events Emitted:**
  - `feed:delta` (Broadcasts creation/update/delete of entities)
  - `sync:response`
  - `sync:ack`
  - `sync:error`

**Critical Sync Trace (`sync:push`):**
1. Client emits `sync:push` with `{ changes }`.
2. Server `handleConnection` maps it to `this.handleSyncPush(socket, data)`.
3. `handleSyncPush` executes (Line 158).
4. **Execution stops here.** The method contains:
   ```typescript
   handleSyncPush(socket, { changes }) {
     // TODO: Implement write-back logic
     logger.info({ changes }, 'Received sync push');
     socket.emit('sync:ack', { status: 'processed' });
   }
   ```
5. **IMPACT:** Client sends data to sync to the server. The server logs it, drops it on the floor, and lies to the client by sending `sync:ack status: 'processed'`. The database is NEVER updated.

---

## DOCUMENT 7 — MOBILE-FIRST READINESS AUDIT

### 7A — Touch & Gesture Inventory
- `Home.tsx` FeedItemCards have `onClick` routing, but no native swipe-to-archive/pin gestures are implemented (despite the design system calling for iOS-style interactions).
- The `ContextVisualizer` uses standard clicks for expansions. No pinch-to-zoom on graph views.

### 7B — Viewport & Safe Area Audit
- `index.css` defines `.safe-top`, `.safe-bottom`, etc.
- `BottomNav.tsx` correctly implements `pb-safe` to avoid the iOS home indicator.
- **Gap:** The FAB in `Home.tsx` (`bottom: 76px`) uses a hardcoded pixel value that does not account for `env(safe-area-inset-bottom)`, meaning it might overlap with the `BottomNav` on notched devices.

### 7C — Navigation Pattern Audit
- The `BottomNav` provides primary tab navigation (Home, Chain Chat, Search, Capture, AI, Settings).
- Desktop uses a wrapper but relies on the exact same `BottomNav` pinned to the bottom. There is no responsive switch to a left-side rail/sidebar on desktop. The UI just stretches.

### 7D — Performance on Mobile
- `Home.tsx` implements `@tanstack/react-virtual` (`useWindowVirtualizer`) for the conversation feed. This is excellent for mobile DOM performance.
- However, the virtualizer uses dynamic heights (`estimateSize`) with hardcoded values (`600`, `180`, `140`) that break if the text wraps significantly on narrow screens, causing scroll jank.

### 7E — PWA Installation & Offline Audit
- Uses `vite-plugin-pwa` with a `NetworkFirst` strategy for `/api/`.
- Offline state is robustly handled via `Dexie` IndexedDB + `SyncQueue`.
- The `SyncIndicator.tsx` accurately displays offline state.

---

## DOCUMENT 8 — IMPLEMENTATION GAP EXPANSION

**Gap ID: VIVIM-GAP-014**
- **File:** `server/src/services/socket.ts`
- **Line(s):** 158-161
- **Classification:** CRITICAL
- **Category:** DATA_MISMATCH
- **Description:** Real-time data sync from client to server drops all data.
- **Evidence:** `// TODO: Implement write-back logic` inside `handleSyncPush`.
- **Impact:** Any changes made by users offline or via local-first interaction are never saved to the Postgres database, leading to permanent data divergence.
- **Fix:** Implement `handleSyncPush` to parse the `changes` array, open a Prisma transaction, and apply the UPSERT/DELETE operations to the respective tables (`Conversation`, `Message`, `AtomicChatUnit`), then trigger a `ContextEventBus` invalidation.

**Gap ID: VIVIM-GAP-015**
- **File:** `server/src/routes/admin/database.js`
- **Line(s):** 105
- **Classification:** CRITICAL
- **Category:** SECURITY
- **Description:** SQL Injection vulnerability in admin query execution.
- **Evidence:** `if (!trimmedQuery.startsWith('SELECT')) ... await prisma.$queryRawUnsafe(query);`
- **Impact:** An admin (or compromised admin token) can execute destructive queries like `SELECT 1; DROP TABLE users;` because `startsWith` does not prevent stacked queries.
- **Fix:** Remove this endpoint entirely, or replace `queryRawUnsafe` with a strictly parameterized, restricted read-only connection role at the database level.

**Gap ID: VIVIM-GAP-016**
- **File:** `pwa/src/lib/stores/appStore.ts`
- **Line(s):** 244-252
- **Classification:** HIGH
- **Category:** MISSING_IMPL
- **Description:** Data export and import functions are mocked.
- **Evidence:** `exportAllData: async () => { // TODO: Connect to backend API }`
- **Impact:** Fails GDPR and data sovereignty guarantees stated in the product manifesto.
- **Fix:** Wire `exportAllData` to call `GET /api/v2/portability/export` and handle the resulting file download blob.

**Gap ID: VIVIM-GAP-017**
- **File:** `server/src/services/admin-network-service.js`
- **Line(s):** 16, 42, 57
- **Classification:** MEDIUM
- **Category:** STUB
- **Description:** Admin network telemetry is completely stubbed.
- **Evidence:** Returns empty arrays `this.nodes`, `this.connections` with `// TODO: Integrate with NetworkNode package`.
- **Impact:** The Admin Panel network graph and peer lists show zero data.
- **Fix:** Inject the `NetworkNode` libp2p instance into this service and map `networkNode.getConnections()` to the admin output format.

**Gap ID: VIVIM-GAP-018**
- **File:** `server/src/services/unified-context-service.ts`
- **Line(s):** 252
- **Classification:** LOW
- **Category:** BROKEN_PATTERN
- **Description:** Context bundles are invalidated via direct Prisma writes instead of using the designated event bus / invalidation service.
- **Evidence:** `// TODO: Move this to InvalidationService once implemented`
- **Impact:** Cache race conditions and tightly coupled database logic in the context service.
- **Fix:** Dispatch a `BUNDLE_INVALIDATED` event to `ContextEventBus` and let the dedicated service handle the Prisma updates.

---

## DOCUMENT 9 — ENHANCEMENT ROADMAP (EXPANDED)

### ID: ENH-001
**Title:** Resolve Critical Sync & Security Vulnerabilities
**Tier:** 🔴 FOUNDATION
**Priority Rank within Tier:** 1

**Problem Statement:**
The sync engine currently drops client data on the floor (`socket.ts`), rendering offline-first promises void. Simultaneously, the admin database query endpoint (`database.js`) allows raw SQL injection.

**Proposed Solution:**
1. In `server/src/services/socket.ts`, implement Prisma upserts inside `handleSyncPush` matching the entity types (conversations, messages).
2. Remove or strictly sanitize the `/api/admin/database/query` endpoint in `server/src/routes/admin/database.js`.

**Acceptance Criteria:**
- [ ] Offline edits to a conversation successfully persist to Postgres when the client reconnects.
- [ ] Admin query endpoint rejects stacked queries or is entirely disabled.

**Files to Change:**
- `server/src/services/socket.ts`
- `server/src/routes/admin/database.js`

**Effort:** M
**Impact:** HIGH
**Dependencies:** None

---

### ID: ENH-002
**Title:** Admin Telemetry and Introspection Implementation
**Tier:** 🔴 FOUNDATION
**Priority Rank within Tier:** 2

**Problem Statement:**
The Admin dashboard displays mocked data for Database tables, System resources, and Network peers.

**Proposed Solution:**
1. Update `system.js` to use Node.js `os` module for accurate memory/CPU mapping.
2. Update `database.js` to use Prisma's `$queryRaw` to fetch pg_catalog statistics for table sizes.
3. Update `admin-network-service.js` to pull connections from the libp2p instance.

**Acceptance Criteria:**
- [ ] Admin panel shows actual active peer counts.
- [ ] Database panel shows actual rows and bytes for `Conversation` and `Message` tables.

**Files to Change:**
- `server/src/routes/admin/system.js`
- `server/src/routes/admin/database.js`
- `server/src/services/admin-network-service.js`

**Effort:** M
**Impact:** HIGH
**Dependencies:** None

---

### ID: ENH-003
**Title:** Desktop Navigation Architecture Redesign
**Tier:** 🟡 EXPERIENCE
**Priority Rank within Tier:** 1

**Problem Statement:**
Desktop users currently view a stretched mobile UI with a `BottomNav`, which violates modern responsive design patterns and wastes horizontal space.

**Proposed Solution:**
Create a conditional navigation wrapper in `ResponsiveLayout.tsx`. Render `BottomNav` only on screens `<1024px`. Render a new `SideNav` component on screens `>=1024px`. 

**Acceptance Criteria:**
- [ ] Desktop screens hide the bottom navigation bar.
- [ ] Desktop screens show a left-aligned vertical sidebar with identical routing capabilities.

**New Files Required:**
- `pwa/src/components/layout/SideNav.tsx`

**Effort:** S
**Impact:** HIGH
**Dependencies:** None

---

## DOCUMENT 10 — 2026 FRONTEND MODERNIZATION BLUEPRINT

### 10A — Design Language Recommendation
**Philosophy: "Neo-Glassmorphic Knowledge Hub"**
VIVIM is a "digital brain". The design should feel deep, precise, and transparent.
- **Typography:** Replace generic `Inter` with **Geist** (or **Geist Sans**) for the interface (precise, technical) and **Geist Mono** for all code/data representations.
- **Color System:** Dark-first. Backgrounds should be deep OLED black (`#000000`) with surfaces using varying opacities of `white/5` to `white/10` paired with heavy background blur (`backdrop-blur-2xl`) to create visual depth.
- **Accents:** Evolve the Indigo/Violet/Emerald palette into intense, highly saturated neon gradients that contrast sharply against the black background. 

### 10B — Responsive Layout System
- **Mobile (<768px):** 100% width. `BottomNav` handling top-level routing. Modals open as bottom sheets (drawer pattern). 
- **Tablet (768px – 1024px):** 100% width, but max-width constrained content areas. Modals open as centered dialogs.
- **Desktop (>1024px):** Global layout shifts. `BottomNav` disappears. A permanent left `SideNav` (width 260px) appears. The main content area utilizes a fluid grid.
- **Safe Areas:** Strict enforcement of `pb-[env(safe-area-inset-bottom)]` on the `BottomNav` and `pt-[env(safe-area-inset-top)]` on TopBars.

### 10C — Component Upgrade Specifications

**Component: `ConversationCard` (FeedItemCard)**
- **Current State:** Basic card with hardcoded gradient tops, opacity issues on archived items.
- **2026 Target State:** A glassmorphic card that feels like a physical object. 
- **Mobile Layout:** Full width minus 16px padding.
- **Desktop Layout:** Masonry grid layout, max width 400px per card.
- **Interaction Model:** `transform: scale(0.98)` on active. Spacebar triggers the `onContinue` action.
- **Dark Mode:** `bg-white/5` with `border-white/10`. Hover state elevates the border to `border-white/20` and adds a subtle glow based on the provider color.
- **Accessibility:** Ensure `tabIndex={0}`, handle `onKeyDown` for Space/Enter. Use `<span className="sr-only">` for the stats (words, messages, code blocks).

**Component: `ContextVisualizer`**
- **Current State:** Standard HTML divs with inline styles for colors.
- **2026 Target State:** Animated, smooth transition panel using `framer-motion` layout animations.
- **Animation:** Expand/collapse must use `<AnimatePresence>` with `height: "auto", opacity: 1` and spring physics (`stiffness: 300, damping: 30`).
- **Implementation Notes:** Map the hardcoded hex values to CSS custom properties defined in the new token system.

### 10D — Navigation Unification Plan
Create a unified `AppNavigation` container that wraps the Router.
- `<MobileNav />` renders via CSS media queries (`block lg:hidden`).
- `<DesktopSidebar />` renders via CSS media queries (`hidden lg:flex`).
- The active route state is derived directly from `react-router-dom`'s `useLocation`.
- Deep routes (like `/conversation/:id`) will push a full-screen overlay on Mobile (hiding the BottomNav), but on Desktop, they will open in the main content pane while the sidebar remains visible.

### 10E — Token System Spec
To be injected into `pwa/src/styles/design-system.css`:

```css
@layer base {
  :root {
    /* Brand Colors */
    --color-brand-primary: #6366f1;
    --color-brand-secondary: #8b5cf6;
    
    /* Semantic Surfaces (Light) */
    --surface-base: #ffffff;
    --surface-elevated: #f8f9fb;
    --surface-glass: rgba(255, 255, 255, 0.7);
    
    /* Borders */
    --border-subtle: rgba(0, 0, 0, 0.05);
    --border-strong: rgba(0, 0, 0, 0.15);
  }

  .dark {
    /* Semantic Surfaces (Dark) */
    --surface-base: #000000;
    --surface-elevated: #0a0a0f;
    --surface-glass: rgba(20, 20, 25, 0.6);
    
    /* Borders */
    --border-subtle: rgba(255, 255, 255, 0.05);
    --border-strong: rgba(255, 255, 255, 0.15);

    /* Provider Tokens (Replacing hardcoded gradients) */
    --provider-chatgpt-start: #10b981;
    --provider-chatgpt-end: #059669;
    --provider-claude-start: #f97316;
    --provider-claude-end: #ea580c;
    --provider-gemini-start: #3b82f6;
    --provider-gemini-end: #1d4ed8;
  }
}
```
*Implementation Note: Tailwind configuration must be updated to map these variables to utility classes (e.g., `bg-surface-glass`).*
---

## DOCUMENT 11 — AI-NATIVE SOCIAL CHAT ENGAGEMENT & SHARING DESIGN

### 11A — Philosophy & Design Principles

VIVIM's social layer is not a social network bolted onto a memory app. It is a **knowledge circulation system** — a way for AI-augmented insights, context, and conversations to flow between people with the same privacy guarantees that govern the rest of VIVIM. The social model is built on three axioms:

1. **You share context, not content.** When you share a conversation, you don't just share a transcript — you share the distilled ACUs, the annotations, the context recipe that made the AI useful. The receiver gets a slice of your digital brain, not a screenshot.
2. **Consumption is AI-assisted by default.** When someone receives a shared conversation, their instance of VIVIM processes it through their own context engine, surfacing connections to their own memory.
3. **Social interactions are ephemeral by default, permanent by intent.** Reactions, comments, and responses fade unless explicitly anchored. This prevents social clutter from polluting the knowledge graph.

---

### 11B — Core Social Primitives

These are the building blocks. Each maps to an existing or near-existing data structure in VIVIM.

#### 11B.1 — The Knowledge Pulse (Shareable Unit)
A **Knowledge Pulse** is the atomic unit of social sharing in VIVIM. It is not a raw conversation — it is a curated package:

```typescript
interface KnowledgePulse {
  id: string;                        // CID-based content identifier
  authorDid: string;                 // Creator's DID
  sourceConversationId: string;      // The conversation it came from
  selectedAcuIds: string[];          // The specific ACUs included
  annotation?: string;               // Author's framing note (max 280 chars)
  contextSnapshot: ContextLayer[];   // The context layers active when this was captured
  visibility: 'circle' | 'link' | 'public';
  expiresAt?: Date;                  // Optional ephemeral TTL
  remixEnabled: boolean;             // Can others fork this?
  signature: string;                 // ed25519 signature over pulse content
  createdAt: Date;
}
```

The Pulse is the thing that gets shared, reacted to, remixed, and stored in the social feed. It is cryptographically signed, meaning the recipient can verify it was not tampered with.

#### 11B.2 — Circles (Already Partially Implemented)
The existing `Circle` Prisma model (`ownerId`, `name`, `isPublic`) is the foundation. It needs to be extended:

```typescript
// Extension to existing Circle model
interface CircleExtension {
  circleId: string;
  maxMembers: number;            // Cap for focused peer groups
  contextPolicy: ContextPolicy;  // What context is visible to members
  feedAlgorithm: 'chronological' | 'relevance' | 'ai-curated';
  requiresInvite: boolean;
  memberDids: string[];
}
```

#### 11B.3 — The Resonance System (Reactions)
Replace generic emoji reactions with semantically meaningful **Resonance Types** that feed back into VIVIM's memory system:

| Resonance | Symbol | Effect on Sender's Memory | Effect on Receiver's Context |
|---|---|---|---|
| **Spark** | ⚡ | Increases ACU `qualityOverall` score | Adds "sparked by [DID]" metadata |
| **Anchor** | ⚓ | Pins the ACU to sender's permanent memory | Nothing |
| **Diverge** | ↗ | Creates a new branch ACU in sender's graph | Notifies author of the divergence |
| **Absorb** | 🧠 | Copies selected ACUs into receiver's MemoryNode | Marks origin DID as trusted source |
| **Challenge** | ⚔ | Opens a threaded debate sub-feed | Author is notified with the challenge context |

These are not just display reactions. Each Resonance type triggers an operation on the `MemoryNode` or `ACU` — the social layer and the memory layer are unified.

#### 11B.4 — Context Handoff
When a user receives a Pulse and clicks "Open in My Context," VIVIM performs a **Context Handoff**:

1. The receiver's `MemoryNode` runs a similarity search against the incoming ACUs.
2. Overlapping concepts are surfaced: "You already know 3 things related to this."
3. Novel concepts are highlighted: "2 new concepts you haven't encountered."
4. The user can choose to **Absorb** (add to their graph) or **Observe** (read without modifying memory).

This is the killer feature of VIVIM's social layer — the AI tells you exactly what you're gaining from someone else's knowledge.

---

### 11C — The Social Feed Architecture

#### 11C.1 — Feed Types
VIVIM needs three distinct feed surfaces, each with its own algorithm:

**The Circle Feed** (`/circles/:id/feed`)
- Shows Pulses from Circle members only
- Algorithm: Relevance-ranked by vector similarity to the viewer's own ACU graph
- Rendered with: Full `KnowledgePulse` card + Context Handoff preview
- Mobile layout: Full-width cards, swipe-right to Absorb, swipe-left to Skip

**The Discovery Feed** (`/discover`)
- Shows Pulses from public shares and opted-in users outside your circles
- Algorithm: VIVIM's recommendation engine (`analytics.ts`) extended with social signals (Sparks, Absorbs from your trusted network)
- Privacy: No DID is exposed for public Pulses unless author opts in. Anonymous by default.

**The Thread Feed** (inline within any Pulse)
- Linear threaded discussion attached to a specific Pulse
- Supports: Text replies, Counter-Pulse (attach your own ACUs as response), AI-mediated summaries of long threads

#### 11C.2 — Feed Component Architecture

```
SocialFeedShell
├── FeedHeader (filter: Circle / Discover / Trending)
├── FeedList (virtualized, same TanStack Virtual setup as Home.tsx)
│   └── KnowledgePulseCard (per item)
│       ├── PulseHeader (author DID chip, timestamp, visibility badge)
│       ├── PulseAnnotation (author's framing text)
│       ├── ACUPreviewStack (2-3 stacked ACU chips with hover expand)
│       ├── ContextHandoffBadge ("3 things you know, 2 new concepts")
│       ├── ResonanceBar (Spark, Anchor, Diverge, Absorb, Challenge)
│       └── PulseActions (Thread, Remix, Copy Link, Report)
└── FeedComposer (bottom sheet on mobile, right sidebar panel on desktop)
```

#### 11C.3 — The Composer
The **Pulse Composer** is the creation interface. It lives in a bottom sheet on mobile and a slide-in panel on desktop:

```
PulseComposer
├── ConversationPicker (select source conversation from your library)
├── ACUSelector (drag-and-drop checkboxes over ACU chips)
├── ContextLayerPreview (shows which context layers will be visible)
├── AnnotationInput (280-char, with AI-suggested framing via inline completion)
├── VisibilitySelector (Circle selector | Link | Public toggle)
├── ExpiryToggle (24h, 7d, Never)
├── RemixToggle (Allow others to fork this Pulse?)
└── PublishButton (signs with DID, pushes to FederationClient)
```

The AI-suggested framing is a key UX moment: as the user selects ACUs, the system generates a one-sentence framing (e.g., "You explored how RAG pipelines fail at context boundaries — here's the key insight"). The user can accept, edit, or discard it.

---

### 11D — Sharing Flows

#### 11D.1 — In-App Sharing (Circle Share)
```
User action: Long-press on ConversationCard OR tap Share in card actions
     ↓
Bottom sheet slides up: "Share to Circle"
     ↓
Step 1: Select which ACUs to include (defaults to top-quality ACUs by qualityOverall score)
Step 2: Choose Circle(s) or "Anyone with link"
Step 3: Add annotation (optional, AI pre-fills suggestion)
Step 4: Set expiry (optional)
     ↓
KnowledgePulse object is signed locally with user's DID key
     ↓
Pushed to: SocialNode.shareToCircle() (existing SDK method — needs implementation)
     ↓
Circle members receive: push notification + feed update via socket 'feed:delta' event
```

#### 11D.2 — Link Share (External)
When visibility is set to "Anyone with link":
- A short-lived signed URL is generated: `vivim.app/p/[pulseId]?sig=[signature]`
- The recipient landing page (`/receive/:code`) is already partially built
- If the recipient has VIVIM: deep links into the Context Handoff flow
- If not: renders a static "Memory Card" — a beautiful, public-facing view of the Pulse's annotation and top ACU previews, with a CTA to install VIVIM

The `/receive/:code` page needs to be upgraded to handle `KnowledgePulse` objects, not just raw conversation links.

#### 11D.3 — Remix Flow
If `remixEnabled: true` on a Pulse, any recipient can **Remix**:
- A new Pulse Composer opens with the original ACUs pre-loaded
- The user adds their own ACUs, overwrites the annotation
- The new Pulse references `sourceKnowledgePulseId` — creating a traceable remix chain
- Attribution is preserved via DID signatures in the chain

This creates **knowledge lineages** — you can trace how an idea evolved across multiple people's AI conversations.

---

### 11E — The Async AI Collaboration Protocol

Beyond sharing static Pulses, VIVIM can enable **live collaborative context sessions** — an entirely new interaction model.

#### 11E.1 — Context Rooms
A **Context Room** is an ephemeral shared context space where 2-8 users contribute ACUs to a shared context window for a joint AI conversation:

```typescript
interface ContextRoom {
  id: string;
  hostDid: string;
  memberDids: string[];
  sharedContextLayers: ContextLayer[];  // Merged from all participants
  activeConversationId: string;          // The shared AI chat session
  mergeStrategy: 'union' | 'intersection' | 'host-curated';
  expiresAt: Date;                        // Rooms are always ephemeral
}
```

The UX: 
- Host opens an existing conversation, taps "Open Context Room"
- Shares a room code or Circle invite
- Members join, each contributing selected ACUs from their own graph
- The merged context window is visible to all (the `ContextVisualizer` shows multi-colored layer ownership)
- A shared AI conversation begins — all members see the same AI stream in real-time

On desktop: split-screen — left is the shared context panel (who contributed what), right is the live AI chat.
On mobile: tabbed — "Context" tab and "Chat" tab, swipe between them.

#### 11E.2 — Async Threads with AI Mediation
When a **Challenge** resonance is triggered, it opens an async thread where both parties can pull in their own AI conversations as evidence. After 3+ exchanges, the AI offers a synthesis:

> "Based on [User A]'s 4 ACUs about X and [User B]'s 6 ACUs about Y, the core tension is Z. Here are two framings that reconcile them..."

This synthesis becomes its own Pulse, attributed to both participants.

---

### 11F — Notification Architecture for Social

The existing `ui.notifications` slice in `useAppStore` needs social-specific event types:

```typescript
type SocialNotification = 
  | { type: 'PULSE_SPARK'; pulseId: string; fromDid: string; }
  | { type: 'PULSE_ABSORB'; pulseId: string; fromDid: string; }
  | { type: 'PULSE_CHALLENGE'; pulseId: string; threadId: string; }
  | { type: 'CIRCLE_INVITE'; circleId: string; fromDid: string; }
  | { type: 'CONTEXT_ROOM_INVITE'; roomId: string; hostDid: string; }
  | { type: 'REMIX_PUBLISHED'; originPulseId: string; newPulseId: string; fromDid: string; }
```

Notification delivery:
- **In-app**: Existing `Toast` system (already polished per Doc 1)
- **Push**: PWA Web Push API — the Service Worker already exists, needs `push` event handler
- **Feed badge**: `BottomNav` and `SideNav` badge counts driven by unread notification count from store

---

### 11G — Privacy Model for Social

Every social action must respect VIVIM's sovereignty model (`useAppStore.sovereignty`). The rules:

| User Setting | Effect on Social |
|---|---|
| `requireExplicitConsent: true` | Absorb resonance requires a confirmation dialog before copying ACUs |
| `allowAnalytics: false` | Pulse views and resonances are not reported to the recommendation engine |
| `defaultStorageLocation: 'local'` | Pulses are stored in IndexedDB only, not pushed to the VIVIM server |
| `encryptByDefault: true` | All Circle Pulses are E2E encrypted with Circle member public keys |

The Pulse Composer must surface a "Privacy Preview" step showing the user exactly what data leaves their device before they publish.

---

### 11H — Component Specifications for Social Layer

#### `KnowledgePulseCard`
- **File:** `pwa/src/components/social/KnowledgePulseCard.tsx` (NEW)
- **Mobile:** Full-width card. Swipe gestures: right = Spark, left = Skip, up = Thread.
- **Desktop:** Fixed-width card (400px) in a masonry grid. No swipe — hover reveals resonance bar.
- **Animation:** Entrance via `fadeSlideUp` (same as `ConversationCard`). Resonance button uses `badgePop` keyframe on activation.
- **Dark Mode:** Glass surface with provider-accented left border (re-using provider token system from Doc 3E).

#### `FeedComposer`
- **File:** `pwa/src/components/social/FeedComposer.tsx` (NEW)
- **Mobile:** Renders as `Sheet` (Radix bottom sheet). Trigger: FAB secondary action.
- **Desktop:** Renders as a right panel (`fixed right-0, w-96`) with slide-in animation.
- **State:** Local state only until publish (no store pollution during drafting).

#### `ContextHandoffBadge`
- **File:** `pwa/src/components/social/ContextHandoffBadge.tsx` (NEW)
- **Renders:** A pill showing "🧠 3 known · ✨ 2 new" computed by running the incoming ACUs through the local MemoryNode similarity search.
- **Performance:** This computation is async. Must show a skeleton state while the vector search completes. Results should be cached in `sessionStorage` keyed by `pulseId`.

#### `ContextRoomPanel`
- **File:** `pwa/src/components/social/ContextRoomPanel.tsx` (NEW)
- **Mobile:** Full-screen overlay, tabbed between "Context" and "Chat."
- **Desktop:** 40/60 split pane — context contributors on left, live AI chat on right.

---

### 11I — New Routes Required

| Route | Component | Description |
|---|---|---|
| `/circles` | `CirclesHome` | List of joined and owned Circles |
| `/circles/:id` | `CircleDetail` | Circle feed + member list + settings |
| `/circles/:id/room` | `ContextRoom` | Live collaborative AI session |
| `/discover` | `DiscoverFeed` | Public/curated Pulse discovery |
| `/pulse/:id` | `PulseDetail` | Full Pulse view with thread |
| `/pulse/:id/remix` | `PulseComposer` | Remix flow with pre-loaded ACUs |

---

### 11J — SDK Extensions Required

The existing `SocialNode.shareToCircle()` (currently Beta, federation partially implemented) needs these additions:

| Method | Input | Output | Priority |
|---|---|---|---|
| `SocialNode.publishPulse(pulse)` | `KnowledgePulse` | `{ pulseId, cid }` | TIER 1 |
| `SocialNode.getCircleFeed(circleId, options)` | `FeedOptions` | `KnowledgePulse[]` | TIER 1 |
| `SocialNode.sendResonance(pulseId, type)` | `ResonanceType` | `void` | TIER 1 |
| `SocialNode.openContextRoom(options)` | `ContextRoomOptions` | `ContextRoom` | TIER 2 |
| `SocialNode.remixPulse(sourcePulseId, additions)` | `RemixOptions` | `KnowledgePulse` | TIER 2 |
| `SocialNode.getPublicFeed(options)` | `FeedOptions` | `KnowledgePulse[]` | TIER 2 |


---

## DOCUMENT 12 — STATE OF THE ART (SOTA) REQUIREMENTS

### 12A — Philosophy

SOTA for VIVIM is not a checklist of trendy technologies. It is a set of non-negotiable standards that define the difference between a prototype and a platform that people trust with their most valuable intellectual data. Each requirement below is grounded in what the best consumer AI products shipped between 2024 and 2026 have proven users expect — and in the specific architectural promises VIVIM has already made (local-first, E2E encrypted, decentralized, AI-native).

---

### 12B — Frontend SOTA Requirements

#### 12B.1 — Performance Targets (Non-Negotiable)

| Metric | Target | Current State | Gap |
|---|---|---|---|
| First Contentful Paint (FCP) | < 1.2s on 4G mobile | Unknown — not measured | Must audit with Lighthouse CI |
| Largest Contentful Paint (LCP) | < 2.5s | Unknown | Must implement `<link rel="preload">` for critical fonts |
| Interaction to Next Paint (INP) | < 200ms | Likely violated by heavy Zustand re-renders | Requires selective subscriptions (`.shallow` selectors) |
| Cumulative Layout Shift (CLS) | < 0.1 | Violated by Mermaid/KaTeX lazy-load without reserved dimensions | Must add explicit height placeholders |
| Time to Interactive (TTI) | < 3.5s on mid-range mobile | Unknown | Code-splitting by route (already in Vite config but must be verified) |
| Bundle Size (initial JS) | < 200KB gzipped | Unknown — `@assistant-ui/react`, `mermaid`, `shiki` are heavy | Aggressive dynamic import strategy required |
| Offline First Action | < 50ms | Dexie reads are fast; likely met | Verify with IndexedDB profiling |

These are Web Vitals thresholds that directly affect PWA install rates and perceived quality. They must be tracked in CI with Lighthouse CI (`@lhci/cli`), not measured manually.

#### 12B.2 — Rendering Architecture
- **React 19 Concurrent Features must be fully utilized.** The codebase uses React 19 but there is no evidence of `useTransition`, `useDeferredValue`, or `Suspense` boundaries being used strategically. Heavy renders (the virtualizer, `ContentRenderer`, `ContextVisualizer`) must be wrapped in `useTransition` so they do not block user input.
- **Streaming UI for AI responses.** The existing `AIChat` component renders streaming tokens. This must use React 19's native streaming support, not a manual `setInterval`-based token drip. The `@ai-sdk/react` `useChat` hook already supports this — it must be wired correctly.
- **Server Components are not applicable** in this PWA architecture, but if a Next.js migration is ever considered, the component boundary design should be SSR-compatible (no store reads at the top level of page components).

#### 12B.3 — Accessibility (WCAG 2.2 AA — Mandatory)
The current state (per Doc 5) is "rough" for keyboard nav and missing ARIA on complex components. SOTA requires:

- **Focus management on route transitions:** Every route change must move focus to an `<h1>` or designated focus target. React Router v7 does not do this automatically. Requires a `FocusReset` component mounted in the router outlet.
- **Reduced motion compliance:** Every `framer-motion` animation must check `useReducedMotion()` and disable or simplify. Every `@keyframes` in CSS must have a `prefers-reduced-motion` block (currently missing for `fadeSlideUp`, `scaleIn`, `badgePop`).
- **Touch target minimums:** All interactive elements must meet a 44×44px minimum touch target (Apple HIG) and 48×48dp (Material). The current stats pills and card action buttons may not meet this — must audit.
- **Color contrast:** All text must meet 4.5:1 for normal text, 3:1 for large text. The muted text color (`#A3A3A3` on `#0A0A0A`) passes, but provider accent colors on dark backgrounds (e.g., Gemini blue `#3b82f6` on `#0A0A0A`) must be verified.
- **Screen reader completeness:** Every data visualization (`ACUGraph`, `ContextVisualizer`) must have a text alternative or `aria-describedby` summary table. The current implementation has no ARIA on these components.

#### 12B.4 — Progressive Web App (SOTA Bar)
- **Install prompt:** Must implement `beforeinstallprompt` event capture and surface a custom install CTA in the app UI (not rely on browser's default banner, which has low conversion).
- **Share Target API:** VIVIM's Capture flow (`/capture`) must register as a [Web Share Target](https://developer.chrome.com/docs/capabilities/web-apis/web-share-target) in the manifest, so users can "share" a ChatGPT URL directly from their mobile browser to VIVIM.
- **Badge API:** Unread social notifications must update the app icon badge via `navigator.setAppBadge(count)`.
- **Protocol Handler:** Register `web+vivim://` as a custom URL scheme for deep linking into Pulses, Context Rooms, and Circle invites from external apps.
- **Persistent Storage:** Must call `navigator.storage.persist()` on first run and surface a UI prompt if denied — VIVIM's offline-first promise is broken without persistent IndexedDB quota.
- **Background Sync API:** The existing `syncQueue` in Dexie should be backed by the Background Sync API (`ServiceWorkerRegistration.sync.register('vivim-sync')`) so sync happens even if the user closes the tab.

#### 12B.5 — Internationalization (i18n) Readiness
The codebase has no evidence of i18n infrastructure. SOTA requires:
- All user-visible strings must be externalized into a resource file format compatible with `react-i18next` or `@formatjs/intl`.
- Dates and numbers must be formatted via `Intl.DateTimeFormat` and `Intl.NumberFormat`, not manual formatting (the current `formatDate()` returning empty string for unknown dates is a symptom of this).
- RTL layout support must be considered in the CSS architecture — using `logical properties` (`padding-inline-start` instead of `padding-left`) from the start.
- This does not need to be implemented before launch, but the architecture must not create a migration cliff.

---

### 12C — Backend SOTA Requirements

#### 12C.1 — API Design Standards
- **OpenAPI 3.1 Spec:** Every endpoint must have a machine-readable OpenAPI spec. The existing `ENABLE_SWAGGER` flag confirms intent — it must be completed, not toggled. Use `zod-openapi` or `@asteasolutions/zod-to-openapi` to derive the spec from existing Zod schemas (if they exist) or create them.
- **Input Validation:** Every endpoint must validate input against a typed schema before execution. The `POST /api/admin/database/query` SQL injection (Gap 015) is a direct consequence of missing validation. Use `zod` throughout with a shared schema package in `common/`.
- **Idempotency Keys:** All mutation endpoints (`POST /capture`, `POST /pulse/publish`) must support an `Idempotency-Key` header to prevent duplicate operations from retried requests.
- **Pagination Standardization:** The existing `limit`/`offset` pattern on `GET /conversations` must be migrated to cursor-based pagination (using `createdAt` + `id` as the cursor) for stable ordering with real-time inserts.
- **Error Response Shape:** Must be consistent across all endpoints. The standard: `{ error: { code: string, message: string, details?: any, requestId: string } }`. The `requestId` must be a correlation ID set at the start of the request (via middleware) and logged alongside server-side errors.

#### 12C.2 — Authentication SOTA
- **JWT Refresh Rotation:** The current implementation issues JWTs without automatic refresh. Implement refresh token rotation: short-lived access tokens (15 min), long-lived refresh tokens (30 days) stored in `httpOnly` cookies. On every access token use, if it's within 5 minutes of expiry, silently issue a new one.
- **DID Authentication:** The `did`-based auth path is present in the schema but the verification flow is not documented in the extraction. It must implement [DID Resolution](https://www.w3.org/TR/did-core/) via `did:key` method and verify `ed25519` signatures on every authenticated DID request.
- **Rate Limiting Granularity:** The current rate limiter is binary (off in dev, on in prod). SOTA requires: different limits per endpoint tier (capture is expensive — 5/min; conversation list is cheap — 100/min), and rate limits keyed by both IP and authenticated DID.
- **CORS Hardening:** Dev wildcard `*` must never reach staging. The CORS config must be driven by an environment-specific allowlist, enforced in CI via a config lint step.

#### 12C.3 — Database SOTA
- **Query Performance:** Every Prisma query that touches `Message` or `AtomicChatUnit` tables (which will grow to millions of rows) must have an `EXPLAIN ANALYZE` baseline. Missing indexes on `conversationId` foreign keys or `embedding` vector search columns will cause catastrophic latency at scale.
- **pgvector Index:** The `embedding` field on `AtomicChatUnit` and `Memory` must use an HNSW index (`CREATE INDEX ON atomic_chat_unit USING hnsw (embedding vector_cosine_ops)`) not the default flat scan. Without this, semantic search degrades from O(log n) to O(n).
- **Migration Safety:** All Prisma migrations must be backward-compatible (no `DROP COLUMN` without a deprecation period). Zero-downtime deployment requires that new columns be nullable with defaults.
- **Connection Pooling:** The Bun/Express server must use PgBouncer or Prisma's built-in connection pooling (`?connection_limit=20` in the DATABASE_URL). Raw Express + Prisma without pooling will exhaust PostgreSQL's connection limit under modest load.

#### 12C.4 — Observability (Non-Negotiable for Production)
The current state has an `ErrorReporter` in `common/` and `logger` calls throughout, but no unified observability stack. SOTA requires:

- **Structured Logging:** All server logs must be structured JSON (the `logger` appears to be `pino` — confirm and enforce `pino` everywhere, remove any `console.log` from production paths).
- **Distributed Tracing:** Every API request must carry a `X-Trace-Id` correlation header that propagates into Prisma queries, Redis calls, and Socket events. Use OpenTelemetry (`@opentelemetry/sdk-node`) with a compatible collector.
- **Error Tracking:** The client-side `ErrorReporter` must be wired to an error tracking backend. Self-hostable option: [GlitchTip](https://glitchtip.com) (open source Sentry). Integrate via `@sentry/react` on the PWA side.
- **Health Check Depth:** The existing `/api/v1/health/detailed` endpoint must be completed (removing hardcoded "up" strings per Gap 001) and must follow the [Health Check Response Format RFC](https://tools.ietf.org/html/draft-inadarei-api-health-check).
- **Uptime Monitoring:** The health endpoint must be polled by an external monitor (self-hosted Uptime Kuma or similar) — not just relied upon internally.

---

### 12D — Security SOTA Requirements

#### 12D.1 — Immediate Blockers (Must fix before any public release)

| Issue | Current State | Required State |
|---|---|---|
| SQL Injection (Gap 015) | `queryRawUnsafe` with string-prefix check | Remove endpoint or restrict to read-only DB role |
| JWT Refresh | No rotation | httpOnly cookie + refresh rotation |
| CORS wildcard in dev | Can leak if env misconfigured | Env-validated allowlist with CI lint |
| Admin endpoints | Auth middleware present but not audited | Penetration test or manual audit of all `requireAdminAuth` paths |
| Crypto stubs | Post-quantum stubs silently fall back to standard curves | Add explicit `WARN` log when falling back; document the fallback |

#### 12D.2 — Content Security Policy
The PWA must serve a strict `Content-Security-Policy` header:
```
Content-Security-Policy: 
  default-src 'self';
  script-src 'self' 'wasm-unsafe-eval';  // wasm-unsafe-eval needed for KaTeX/Mermaid WASM
  style-src 'self' 'unsafe-inline';       // unsafe-inline needed for Tailwind until migration to CSS modules
  connect-src 'self' wss://[your-ws-domain] https://api.openai.com https://api.anthropic.com;
  img-src 'self' data: blob:;
  font-src 'self';
  frame-src 'none';
```

The current Vite dev server and production build do not set CSP headers. This must be added to the Express server for the API and to the PWA hosting configuration.

#### 12D.3 — Dependency Security
- `npm audit` and `bun audit` must pass with zero HIGH or CRITICAL vulnerabilities in CI.
- Dependabot or Renovate must be configured to auto-open PRs for security patches.
- The `playwright` dependency (used for conversation scraping) must run in a sandboxed environment — never in the main server process. It should be isolated to a worker process or separate microservice.

#### 12D.4 — Data Sovereignty Verification
VIVIM's core promise is user data sovereignty. SOTA requires that this is verifiable, not just claimed:
- **Data export must work** (currently stubbed — Gap 016). A user must be able to download all their data as a portable archive within 30 seconds.
- **Data deletion must cascade correctly.** The existing `DELETE /conversations/:id` notes "cascading deletes need monitoring" — this must be verified with a test that deletes a conversation and confirms all associated `Message`, `ACU`, and `Memory` records are removed.
- **Encryption at rest must be verified.** AES-256 encryption in `StorageNode` must be integration-tested — not just unit-tested in the SDK. A test must write encrypted data and confirm the raw IndexedDB bytes are not plaintext.

---

### 12E — AI Integration SOTA Requirements

#### 12E.1 — Model Abstraction Layer
The current AI integration uses multiple provider SDKs (`@ai-sdk/openai`, `anthropic`, `google`, `xai`). SOTA requires a unified abstraction so that:
- Adding a new provider requires changes in exactly one file
- Model capability flags (`supportsVision`, `supportsToolUse`, `maxContextWindow`) are maintained in a single capability registry
- The `AIProviderCapabilities` casting to `any` (noted in `AIChat.tsx` deep-dive) is eliminated

The Vercel AI SDK (`ai` package, already in use) is the correct abstraction layer — the codebase must be fully migrated to use it for all providers, removing any direct `anthropic` or `google` SDK calls that bypass it.

#### 12E.2 — Context Window Management
The `ContextVisualizer` shows 8 layers (L0–L7). SOTA requires that the system:
- Never silently truncates a context layer. If a layer must be dropped due to token budget exhaustion, the user must see a visual indicator.
- Tracks actual token counts, not estimates. Every provider's tokenizer must be called (or approximated via `tiktoken`/`@anthropic-ai/tokenizer`) to produce accurate counts.
- Implements graceful degradation: if the AI provider returns a `context_length_exceeded` error, the `ContextEngine` must automatically retry with L7 (lowest priority) layers removed, and notify the user.

#### 12E.3 — Streaming Resilience
AI streaming responses must handle:
- **Network interruption mid-stream:** The partial response must be preserved, and the user offered a "Resume" option that continues the generation (using provider-specific continuation APIs where available, or a re-prompt with partial context).
- **Provider timeout:** After 30 seconds without a token, abort and show a specific timeout error (not the generic `ErrorState`).
- **Rate limiting:** `429` responses from providers must be caught, the user informed of the wait time (from `Retry-After` header), and the request automatically retried.

#### 12E.4 — Prompt Injection Defense
VIVIM processes untrusted content (scraped AI conversations from third-party providers) and injects it into AI context. This creates a prompt injection attack surface. SOTA requires:
- All content ingested via `/capture` must be sanitized before being stored as ACUs or injected into context.
- Implement a lightweight injection pattern filter on `CaptureService` that detects and flags strings like "Ignore previous instructions" or "You are now..." in captured content.
- Flagged ACUs must have `qualityOverall` penalized and be marked with a `suspiciousContent: true` flag in the schema.

---

### 12F — Decentralization & P2P SOTA Requirements

#### 12F.1 — libp2p Transport Completeness
The `network/` layer uses libp2p but the admin service shows it is entirely stubbed. SOTA for VIVIM's P2P claims requires:
- **WebRTC transport** must be functional for browser-to-browser direct connections. Verified by a test that establishes a peer connection between two browser instances.
- **WebSocket transport** must be the fallback for environments where WebRTC is blocked (corporate firewalls). Must be tested in a restricted network environment.
- **DHT Discovery** must produce real peer lists — the stub returning empty arrays means the network cannot self-heal or grow.

#### 12F.2 — CRDT Conflict Resolution
The `CRDTSyncService.resolveConflict()` stub (Gap-003) is not just a missing feature — it is a data integrity requirement. SOTA requires:
- Conflict resolution must use a deterministic Last-Write-Wins (LWW) strategy with Lamport timestamps as the tiebreaker.
- Conflicts that cannot be auto-resolved must be surfaced to the user with a visual diff (similar to a Git merge conflict view) accessible from the `SyncIndicator` component.
- The resolution decision must be logged to the `syncQueue` Dexie table for auditability.

#### 12F.3 — IPFS Integration Reality Check
The `StorageNode` documentation notes "Missing actual IPFS deals." SOTA requires an honest decision:
- **Option A (Recommended for V1):** Remove IPFS deal-making from the public interface entirely. Store locally + server. Mark IPFS as a future feature. Do not expose it in the UI.
- **Option B:** Implement real IPFS pinning via the Helia client (`helia` is already a dependency). Requires: pin on write, verify CID on read, handle pin failures gracefully.
- Shipping Option A cleanly is better than shipping Option B broken. The current state (silently failing to make IPFS deals while telling users data is decentralized) violates the product's trust contract.

---

### 12G — DevOps & Operational SOTA Requirements

#### 12G.1 — CI/CD Pipeline (Minimum Viable)
- **Test gates:** No merge to `main` without: TypeScript compilation (`tsc --noEmit`), unit tests (`bun test`), Lighthouse CI mobile score ≥ 85.
- **Security gate:** `npm audit --audit-level=high` must pass. Fail the build if HIGH/CRITICAL vulnerabilities exist.
- **Bundle size gate:** Vite bundle analysis (`rollup-plugin-visualizer`) must run on every PR. Bundle size regression > 10KB gzipped must require explicit approval.
- **Migration safety:** Prisma migrations must run against a test database in CI and verify that the schema matches the generated client.

#### 12G.2 — Environment Parity
- Dev, staging, and production must use the same Docker Compose topology. No "it works on my machine" topology differences.
- Secrets must never be committed. Use `doppler` or `infisical` for secret management — `.env` files are acceptable for local dev only.
- The `ENABLE_SWAGGER` flag must be `true` in staging and `false` in production (not the reverse).

#### 12G.3 — Deployment Targets
Given the tech stack (Bun, React PWA, libp2p), the SOTA deployment architecture:

| Layer | Recommended | Why |
|---|---|---|
| PWA Hosting | Cloudflare Pages | Edge delivery, free tier, native PWA support |
| API Server | Fly.io or Railway (Bun Docker) | Native Bun support, WebSocket persistence |
| PostgreSQL | Supabase (managed) or self-hosted pg16 | pgvector support, point-in-time recovery |
| Redis | Upstash (serverless) or self-hosted | Pub/sub for real-time, TTL for sessions |
| libp2p Bootstrap Nodes | Self-hosted VPS (Hetzner/DigitalOcean) | Long-running TCP listener, no serverless cold starts |

