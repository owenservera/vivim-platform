# UI Component Specification

> **Purpose:** Documentation of existing UI components for redesign  
> **Status:** Components marked as "REPLACE" should be redesigned  
> **Reference:** `pwa/src/components/`

---

## 1. Base UI Components (`src/components/ui/`)

These are the foundation components - most should be **RETAINED** and improved.

### 1.1 Buttons

| Component | File | Status | Notes |
|-----------|------|--------|-------|
| Button | `button.tsx` | **RETAIN** | Radix-based, cva for variants |
| IconButton | (in button.tsx) | **RETAIN** | Icon-only variant |

**Current API:**
```typescript
// Variants: default, destructive, outline, secondary, ghost, link
// Sizes: sm, default, lg
<Button variant="default" size="default">Click me</Button>
```

### 1.2 Form Elements

| Component | File | Status | Notes |
|-----------|------|--------|-------|
| Input | `unified/Input.tsx` | **RETAIN** | Clean implementation |
| Card | `unified/Card.tsx` | **RETAIN** | Flexible card wrapper |

### 1.3 Feedback

| Component | File | Status | Notes |
|-----------|------|--------|-------|
| Badge | `badge.tsx` | **RETAIN** | Status indicators |
| Toast | `ToastContainer.tsx` | **REPLACE** | Complex, needs simplification |
| Skeleton | `Skeleton/Skeleton.tsx` | **RETAIN** | Loading states |
| EmptyState | `EmptyState/EmptyState.tsx` | **RETAIN** | Empty content states |
| ErrorState | `unified/ErrorState.tsx` | **RETAIN** | Error displays |

### 1.4 Layout

| Component | File | Status | Notes |
|-----------|------|--------|-------|
| Separator | `separator.tsx` | **RETAIN** | Visual dividers |
| Table | `table.tsx` | **RETAIN** | Data tables |
| Accordion | `accordion.tsx` | **RETAIN** | Collapsible content |
| DropdownMenu | `dropdown-menu.tsx` | **RETAIN** | Radix-based |
| Tooltip | `tooltip.tsx` | **RETAIN** | Radix-based |

---

## 2. Navigation Components

### 2.1 Desktop Navigation

| Component | File | Status | Notes |
|-----------|------|--------|-------|
| SideNav | `layout/SideNav.tsx` | **REPLACE** | Desktop sidebar - needs redesign |

**Current Implementation Issues:**
- Hardcoded 260px width
- Mixed with mobile navigation logic
- No clear responsive behavior

### 2.2 Mobile Navigation

| Component | File | Status | Notes |
|-----------|------|--------|-------|
| IOSBottomNav | `ios/IOSBottomNav.tsx` | **REPLACE** | iOS-style bottom nav |
| IOSDefaultTopBar | `ios/IOSDefaultTopBar.tsx` | **REPLACE** | iOS-style top bar |

**Current Implementation Issues:**
- iOS-specific styling baked in
- Not flexible for Android/desktop
- Safe area handling is inconsistent

### 2.3 Responsive Components

| Component | File | Status | Notes |
|-----------|------|--------|-------|
| ResponsiveLayout | `responsive/ResponsiveLayout.tsx` | **REPLACE** | Needs to be the main layout |

**Current Issues:**
- Uses device detection (`useDeviceContext`)
- Not truly responsive - chooses one or the other

---

## 3. Feature Components

### 3.1 Conversation/Feed

| Component | File | Status | Notes |
|-----------|------|--------|-------|
| FeedItemCard | `pages/Home.tsx` (inline) | **REPLACE** | Complex, ~400 lines |
| ConversationCard | `archive/ConversationCard/ConversationCard.tsx` | **REPLACE** | Inconsistent with FeedItemCard |
| ConversationChatView | `ConversationChatView.tsx` | **REVIEW** | Chat display |
| ChatInputBox | `ChatInputBox.tsx` | **REVIEW** | Input component |

### 3.2 AI Chat

| Component | File | Status | Notes |
|-----------|------|--------|-------|
| AIChat | `AIChat.tsx` | **REPLACE** | Main chat interface |
| VIVIMComposer | `ai/VIVIMComposer.tsx` | **REVIEW** | Message composer |
| VIVIMThread | `ai/VIVIMThread.tsx` | **REVIEW** | Message thread |
| VIVIMMessage | `ai/VIVIMMessage.tsx` | **REVIEW** | Individual message |

### 3.3 Archive

| Component | File | Status | Notes |
|-----------|------|--------|-------|
| GridView | `archive/ViewModes/GridView.tsx` | **REPLACE** | Grid display |
| ListView | `archive/ViewModes/ListView.tsx` | **REPLACE** | List display |
| TimelineView | `archive/ViewModes/TimelineView.tsx` | **REPLACE** | Timeline display |
| CanvasView | `archive/ViewModes/CanvasView.tsx` | **REPLACE** | Canvas display |
| CollectionDetail | `archive/Collections/CollectionDetail.tsx` | **REVIEW** | Collection view |
| ArchiveSearch | `archive/Search/ArchiveSearch.tsx` | **REPLACE** | Search in archive |

### 3.4 Context & Knowledge

| Component | File | Status | Notes |
|-----------|------|--------|-------|
| ContextCockpit | `ContextCockpit.tsx` | **REVIEW** | Context management |
| ContextVisualizer | `ContextVisualizer.tsx` | **REVIEW** | Visualization |
| KnowledgeGraph | `sovereignty/KnowledgeGraph.tsx` | **RETAIN** | Graph visualization |

### 3.5 Recommendations

| Component | File | Status | Notes |
|-----------|------|--------|-------|
| RecommendationsList | `recommendation/RecommendationsList.tsx` | **RETAIN** | For You feed |
| SimilarConversations | `recommendation/SimilarConversations.tsx` | **RETAIN** | Similar items |
| TopicFilter | `recommendation/TopicFilter.tsx` | **RETAIN** | Filter options |

### 3.6 Admin

| Component | File | Status | Notes |
|-----------|------|--------|-------|
| SystemOverviewPanel | `admin/SystemOverviewPanel.tsx` | **RETAIN** | System stats |
| NetworkPanel | `admin/NetworkPanel.tsx` | **RETAIN** | P2P network |
| DatabasePanel | `admin/DatabasePanel.tsx` | **RETAIN** | Database stats |
| LogsPanel | `admin/LogsPanel.tsx` | **RETAIN** | Log viewer |
| CRDTManagementPanel | `admin/CRDTManagementPanel.tsx` | **RETAIN** | CRDT sync |

---

## 4. iOS Components (`src/components/ios/`)

**All iOS components should be REPLACED with platform-agnostic alternatives:**

| Component | Replace With |
|-----------|--------------|
| IOSBottomNav | UnifiedBottomNav |
| IOSDefaultTopBar | UnifiedTopBar |
| IOSButton | Base Button |
| IOSStories | Carousel component |
| IOSSkeletonList | Skeleton component |
| IOSToast | Unified Toast system |

---

## 5. Component Patterns to Establish

### 5.1 New Base Component Structure

```typescript
// Example: Button component pattern
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  loading?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}

// Use class-variance-authority (cva) for variants
// Use tailwind-merge (twMerge) for class composition
// Use clsx for conditional classes
```

### 5.2 Layout Component Pattern

```typescript
// Example: Main layout pattern
interface AppLayoutProps {
  sidebar?: React.ReactNode;
  topBar?: React.ReactNode;
  bottomNav?: React.ReactNode;
  children: React.ReactNode;
}

// Responsive handling via CSS, not JS detection
// CSS: @media (min-width: 1024px) { ... }
```

### 5.3 Card Component Pattern

```typescript
// Example: Unified card pattern
interface CardProps {
  variant?: 'default' | 'elevated' | 'outlined';
  interactive?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}
```

---

## 6. Existing Styles to Reference

### 6.1 CSS Variables Available

From `unified-design-system.css`:

```css
:root {
  /* Colors */
  --primary-50 through --primary-900;
  --accent-50 through --accent-900;
  --gray-50 through --gray-900;
  --success-*, --warning-*, --error-*, --info-*;
  
  /* Typography */
  --font-sans, --font-mono;
  --text-xs through --text-5xl;
  --font-light through --font-black;
  
  /* Spacing */
  --space-0 through --space-24;
  
  /* Borders */
  --radius-sm, --radius-md, --radius-lg, --radius-xl, --radius-2xl, --radius-full;
  
  /* Shadows */
  --shadow-sm, --shadow-md, --shadow-lg, --shadow-xl, --shadow-2xl;
  
  /* Transitions */
  --transition-fast, --transition-base, --transition-slow;
  --ease-in, --ease-out, --ease-in-out, --ease-spring, --ease-bounce;
}
```

### 6.2 Utility Functions Available

From `lib/utils.ts`:

```typescript
import { cn } from '@/lib/utils';          // className merge
import { twMerge } from 'tailwind-merge';   // tailwind merge

// Pattern: cn('base-classes', condition && 'conditional-class')
```

---

## 7. State Management

### 7.1 Zustand Stores

| Store | File | Purpose |
|-------|------|---------|
| useHomeUIStore | `stores/useHomeUIStore.ts` | Home page UI state |
| settingsStore | `stores/settings.store.ts` | App settings |
| archiveStore | `stores/archive.store.ts` | Archive state |
| identityStore | `stores/identity.store.ts` | User identity |
| uiStore | `stores/ui.store.ts` | Global UI state |

### 7.2 Store Pattern

```typescript
// Example store pattern
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface HomeUIState {
  filterTab: 'all' | 'pinned' | 'archived' | 'recent';
  viewMode: 'list' | 'grid' | 'graph';
  searchQuery: string;
  sortBy: 'date' | 'messages' | 'title';
  setFilterTab: (tab: HomeUIState['filterTab']) => void;
  // ...
}

export const useHomeUIStore = create<HomeUIState>()(
  persist(
    (set) => ({
      filterTab: 'all',
      viewMode: 'list',
      searchQuery: '',
      sortBy: 'date',
      setFilterTab: (tab) => set({ filterTab: tab }),
      // ...
    }),
    { name: 'home-ui-storage' }
  )
);
```

---

## 8. Priority Order

### Phase 1: Core Layout (Week 1)
1. Replace ResponsiveLayout
2. Create unified navigation
3. Establish design tokens in Tailwind

### Phase 2: Key Pages (Week 2)
1. Home/Feed redesign
2. Settings page
3. Archive views

### Phase 3: Feature Pages (Week 3)
1. Chat interface
2. Capture flow
3. Search

### Phase 4: Polish (Week 4)
1. Animations
2. Loading states
3. Error handling
4. Performance optimization
