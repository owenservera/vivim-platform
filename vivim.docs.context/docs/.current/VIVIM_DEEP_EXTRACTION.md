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