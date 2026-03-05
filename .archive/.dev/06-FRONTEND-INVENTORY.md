# VIVIM — Frontend Page & Component Inventory
**Archived**: 2026-03-05 | **Basis**: `08D-frontend-page-component-inventory.md` + `VIVIM_COMPLETE_BLUEPRINT.md`

---

## Pages (Routes)

All routes defined in `pwa/src/app/routes.tsx`. All 20 pages are WORKING.

| Route | Component | File | Status | Key APIs |
|-------|-----------|------|--------|----------|
| `/` | Home | `pages/Home.tsx` | ✅ WORKING | `/api/v1/feed`, `/api/v1/conversations`, `/api/v1/ai-chat` |
| `/login` | Login | `pages/Login.tsx` | ✅ WORKING | `/api/v1/auth/google` |
| `/search` | Search | `pages/Search.tsx` | ✅ WORKING | `/api/v1/conversations/search` |
| `/analytics` | Analytics | `pages/Analytics.tsx` | ✅ WORKING | `/api/v1/ai-settings/telemetry` |
| `/bookmarks` | Bookmarks | `pages/Bookmarks.tsx` | ✅ WORKING | — |
| `/capture` | Capture | `pages/Capture.tsx` | ✅ WORKING | `/api/v1/capture/*` |
| `/simple-capture` | CaptureSimple | `pages/CaptureSimple.tsx` | ✅ WORKING | `/api/v1/capture/*` |
| `/conversation/:id` | ConversationView | `pages/ConversationView.tsx` | ✅ WORKING | `/api/v1/conversations/:id` |
| `/settings` | Settings | `pages/Settings.tsx` | ✅ WORKING | `/api/v1/ai-settings`, `/api/v1/context/settings` |
| `/ai-conversations` | AIConversationsPage | `pages/AIConversationsPage.tsx` | ✅ WORKING | `/api/v1/ai-chat/list` |
| `/conversation/:id/share` | Share | `pages/Share.tsx` | ✅ WORKING | `/api/v2/sharing/*` |
| `/receive/:code` | Receive | `pages/Receive.tsx` | ✅ WORKING | `/api/v2/sharing/share/:shareId` |
| `/account` | Account | `pages/Account.tsx` | ✅ WORKING | `/api/v1/account/me` |
| `/errors` | ErrorDashboard | `pages/ErrorDashboard.tsx` | ✅ WORKING | — |
| `/chat` | Home | `pages/Home.tsx` | ✅ WORKING | (AI chat mode) |
| `/ai/conversation/:id` | AIConversationsPage | `pages/AIConversationsPage.tsx` | ✅ WORKING | — |

---

## Page Deep-Dives

### Home.tsx (59,177 bytes — largest file)
**Purpose**: Primary feed + AI chat interface. Dual-mode: conversation library browser, or AI chat.

**State Management**:
- `useHomeUIStore` — filterTab, viewMode, searchQuery, sortBy
- TanStack Query — conversations list
- IndexedDB (Dexie) — `conversationService.getAllConversations()`, `unifiedRepository.getStats()`
- `useAIChat` hook — AI chat state

**Layout**:
- Mobile (<768px): Stacked vertical, sticky header, 88px bottom padding for BottomNav, FAB bottom-right
- Tablet (768–1024px): 2-column grid (grid mode), max-w `[800px]`
- Desktop (>1024px): Centered single column

**Known Issues (Fixed This Session)**:
- ✅ Archived card opacity bug — moved from full card to `.conv-card-body` only
- ✅ `formatDate` returns `"Unknown"` for invalid dates instead of empty string
- ✅ Space key triggers card expansion (alongside Enter)
- ✅ Stats pills have `sr-only` ARIA labels
- ✅ `prefers-reduced-motion` media query added
- ✅ Standard `line-clamp` alongside `-webkit-line-clamp`

---

### Capture.tsx (33,806 bytes)
**Purpose**: URL-based AI conversation import. Detects provider automatically, runs Playwright capture.

**Key behaviors**:
- Auto-detects provider from pasted URL
- Shows real-time capture progress
- Queues ACU generation after successful capture
- Handles bulk URL batch import

---

### Settings.tsx (11,165 bytes)
**Purpose**: User preferences and AI configuration.

**Sections**:
- AI Provider settings (BYOK API keys)
- Context Engine settings (token budget, thresholds)
- Privacy settings
- Account settings

---

## Key Components

### ContentRenderer (`pwa/src/components/content/ContentRenderer.tsx`)
**The unified rendering engine** for all AI chat content.

Supported content block types:
- `text` — Markdown with remark/rehype
- `code` — Syntax highlighted via Shiki
- `mermaid` — Diagram rendering (dynamically imported)
- `math` — KaTeX equations (dynamically imported)
- `image` — Image display
- `tool_call` / `tool_result` — AI function call display  
- `acu` — Atomic Chat Unit visualization

**Known Issues**:
- Mermaid/KaTeX lazy-load error states fall back silently
- `TextPart` and `CodePart` duplicate copy-to-clipboard logic (should be unified)

---

### ContextCockpit.tsx (21,845 bytes)
**Purpose**: Full control panel for the 8-layer context engine.

- Shows budget allocation across all bundle layers
- Token usage visualization
- Toggle switches per layer
- Similarity threshold sliders
- Live context preview

**Wired to**: `/api/v2/context/*` — Real data

---

### ContextVisualizer.tsx (15,687 bytes)
**Purpose**: Visual "Glass Box Inspector" — see exactly what context was injected and how.

**Known Issues**:
- Layer colors hardcoded: `LAYER_COLORS = { 'L0_identity': '#8b5cf6', ... }` — bypasses Tailwind theming
- Uses inline SVG instead of lucide-react for XAI Attribution dropdown

---

### AIChat.tsx (10,783 bytes)
**Purpose**: Primary in-app AI chat interface.

- Model selector (per provider)
- Streaming response rendering via ContentRenderer
- Context injection visualization
- Fork chat capability

**Known Issues**:
- `mousedown` listener for dropdown close doesn't handle touch events reliably
- `activeModels` extraction casts to `any` type

---

### SyncIndicator.tsx
**Purpose**: Real-time CRDT sync status display.

**States**: Online, Syncing, Offline, Pending, Conflict

**Known Issues**:
- Uses hardcoded emoji strings (`📡`, `🔄`, `⚠️`) instead of Lucide icons
- `handleManualSync` is stubbed — button gives false feedback when clicked

---

### ErrorState.tsx (`pwa/src/components/ios/ErrorState.tsx`)
**Purpose**: Error fallback states for various error types.

**Error Types**: Network, Database, Permission, Not Found

**Known Issues**:
- Lives in `ios/` folder — should be moved to `unified/`
- Uses hardcoded Tailwind colors instead of semantic design tokens

---

### ShareMenu.tsx (5,952 bytes)
**Purpose**: Sharing options menu for conversations and ACUs.
**Wired to**: `/api/v2/sharing/*`

---

### ACUViewer.tsx (7,111 bytes)
**Purpose**: Display individual Atomic Chat Unit with metadata, quality scores, and actions.

---

### ACUGraph.tsx (7,995 bytes)
**Purpose**: Relationship graph visualization for ACU lineage (forks, links, quotes).
**Known Issues**: Needs responsive layout refinements.

---

## UI Component Library (`pwa/src/components/ui/`)

| Component | File | Variants | A11y | Dark Mode |
|-----------|------|----------|------|-----------|
| Button | `button.tsx` | default, destructive, outline, secondary, ghost, link | ✅ Focus visible | ✅ |
| Badge | `badge.tsx` | default, secondary, destructive, outline | Basic | ✅ |
| Card | `card.tsx` | default | — | ✅ |
| Accordion | `accordion.tsx` | — | ✅ Radix | ✅ |
| DropdownMenu | `dropdown-menu.tsx` | — | ✅ Radix | ✅ |
| Table | `table.tsx` | — | Basic | ✅ |
| Tooltip | `tooltip.tsx` | — | ✅ Radix | ✅ |
| Input | `unified/Input.tsx` | default, error | ✅ aria-describedby | ✅ |
| ResponsiveLayout | `unified/ResponsiveLayout.tsx` | — | N/A | ✅ |

---

## State Management Summary

### Zustand Stores

| Store | File | Owns |
|-------|------|------|
| Identity | `stores/identity.store.ts` | DID, public key, auth state |
| Settings | `stores/settings.store.ts` | User & AI preferences |
| Sync | `stores/sync.store.ts` | Sync status, pending ops, conflicts |
| UI | `stores/ui.store.ts` | Modals, notifications, global UI flags |
| Home UI | `stores/useHomeUIStore.ts` | Filter, sort, view mode |

### Component Status Summary

| Category | Total | Working |
|----------|-------|---------|
| Pages | 20 | 20 |
| Key Components | 20+ | 20 |
| Zustand Stores | 5 | 5 |
| UI Primitives | 9+ | 9 |

---

## Accessibility Audit

| Area | Status | Notes |
|------|--------|-------|
| Keyboard Navigation | ⚠️ Partial | ✅ Enter + Space on ConversationCard (fixed this session) |
| ARIA Labels | ⚠️ Partial | ✅ Stats pills sr-only (fixed this session). ACUGraph still missing. |
| Focus Management | ⚠️ Partial | Modals OK (Radix). Route transitions don't reset focus. |
| Color Contrast | ⚠️ Partial | Generally good, provider gradient strips may violate WCAG AA |
| Reduced Motion | ✅ Added | `prefers-reduced-motion` CSS block added to Home.css |
| Screen Reader | ⚠️ Partial | SyncIndicator uses emoji instead of sr-only text |
