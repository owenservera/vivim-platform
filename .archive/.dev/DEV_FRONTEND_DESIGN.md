# VIVIM Frontend Redesign - Design Vision

> **Version:** 1.0  
> **Date:** March 2026  
> **Status:** Design Specification  
> **Output:** `.archive.dev/DEV_FRONTEND_*.md`

---

## 1. Design Philosophy

### 1.1 Core Principles

| Principle | Description | Implementation |
|-----------|-------------|----------------|
| **Native Feel** | App should feel like a native application on both mobile and desktop | Platform-appropriate patterns, gestures, keyboard support |
| **Instant Responsiveness** | Every interaction should feel immediate | Optimistic UI, optimistic mutations, skeleton loading |
| **Progressive Enhancement** | Core functionality works everywhere | Progressive web app, offline-first, graceful degradation |
| **Invisible Complexity** | User sees simplicity, not complexity | Smart defaults, contextual UI, progressive disclosure |
| **Delightful Moments** | Small surprises that create joy | Micro-interactions, thoughtful animations, easter eggs |

### 1.2 Design Language

**Aesthetic Direction:**
- **Clean & Modern** — Generous whitespace, clear hierarchy, purposeful color
- **Not Generic** — Distinctive typography, unique iconography, memorable moments
- **Professional** — Trustworthy appearance, accessible, inclusive

**Inspiration:**
- Linear — Focus, keyboard-driven, speed
- Notion — Block-based, clean, extensible  
- Raycast — Spotlight-like, commands, extensions
- Apple — Smooth animations, attention to detail
- Figma — Canvas-based, collaborative feel

---

## 2. Visual Design System

### 2.1 Color System

#### Primary Palette (Indigo)

```
Primary-50:  #EEF2FF   ← Lightest backgrounds
Primary-100: #E0E7FF
Primary-200: #C7D2FE
Primary-300: #A5B4FC
Primary-400: #818CF8   ← Hover states
Primary-500: #6366F1   ← PRIMARY - Brand color
Primary-600: #4F46E5   ← Active/pressed
Primary-700: #4338CA   ← Emphasis
Primary-800: #3730A3   ← Dark mode accent
Primary-900: #312E81   ← Deep dark
```

#### Accent Palette (Violet)

```
Accent-50:   #F5F3FF   ← Lightest
Accent-100:  #EDE9FE
Accent-200:  #DDD6FE
Accent-300:  #C4B5FD
Accent-400:  #A78BFA   ← Hover
Accent-500:  #8B5CF6   ← ACCENT - Special actions
Accent-600:  #7C3AED
Accent-700:  #6D28D9
Accent-800:  #5B21B6
Accent-900:  #4C1D95
```

#### Semantic Colors

| Token | Light BG | Light Text | Dark BG | Dark Text | Usage |
|-------|----------|------------|---------|-----------|-------|
| Success | `#ECFDF5` | `#047857` | `#064E3B` | `#34D399` | Confirmations |
| Warning | `#FFFBEB` | `#B45309` | `#78350F` | `#FBBF24` | Alerts |
| Error | `#FEF2F2` | `#B91C1C` | `#7F1D1D` | `#F87171` | Errors |
| Info | `#EFF6FF` | `#1D4ED8` | `#1E3A8A` | `#60A5FA` | Information |

#### Background System

| Token | Light Mode | Dark Mode | Usage |
|-------|------------|-----------|-------|
| BG-Page | `#FAFAFA` | `#0A0A0A` | Full page background |
| BG-Surface | `#FFFFFF` | `#171717` | Cards, panels |
| BG-Elevated | `#F5F5F5` | `#1F1F1F` | Modals, dropdowns |
| BG-Input | `#F5F5F5` | `#262626` | Input fields |
| BG-Overlay | `#000000` | `#000000` | Modal backdrop (50% opacity) |

#### Text System

| Token | Light Mode | Dark Mode | Usage |
|-------|------------|-----------|-------|
| Text-Primary | `#111827` | `#FAFAFA` | Headings, body |
| Text-Secondary | `#4B5563` | `#A1A1AA` | Captions, labels |
| Text-Tertiary | `#9CA3AF` | `#71717A` | Placeholders |
| Text-Disabled | `#D4D4D8` | `#27272A` | Disabled states |

### 2.2 Typography

#### Font Stack

```css
--font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
--font-display: 'Inter', -apple-system, sans-serif;
--font-mono: 'JetBrains Mono', 'Fira Code', 'SF Mono', monospace;
```

#### Type Scale

| Level | Size | Line Height | Weight | Usage |
|-------|------|-------------|--------|-------|
| Display | 48px / 3rem | 1.1 | 700 | Hero headlines |
| H1 | 36px / 2.25rem | 1.2 | 700 | Page titles |
| H2 | 30px / 1.875rem | 1.25 | 600 | Section headers |
| H3 | 24px / 1.5rem | 1.3 | 600 | Card titles |
| H4 | 20px / 1.25rem | 1.4 | 600 | Subsections |
| Body-LG | 18px / 1.125rem | 1.6 | 400 | Important body |
| Body | 16px / 1rem | 1.6 | 400 | Standard body |
| Body-SM | 14px / 0.875rem | 1.5 | 400 | Secondary text |
| Caption | 12px / 0.75rem | 1.4 | 500 | Labels, badges |
| Overline | 11px / 0.6875rem | 1.2 | 600 | Category labels |

### 2.3 Spacing System

#### Base Scale (8px Grid)

```
0:   0px       ← No space
1:   2px       ← Tight (icon gaps)
2:   4px       ← Very tight
3:   8px       ← Tight (inline)
4:   12px      ← Default
5:   16px      ← Standard
6:   24px      ← Relaxed
7:   32px      ← Section
8:   48px      ← Large
9:   64px      ← XL Section
10:  96px      ← Page margin
```

#### Semantic Spacing

```css
--space-inline: 8px;      /* Within components */
--space-stack: 16px;     /* Between related items */
--space-section: 24px;   /* Between sections */
--space-page: 32px;      /* Page-level spacing */
```

### 2.4 Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| Radius-SM | 4px | Inputs, small buttons |
| Radius | 8px | Cards, containers |
| Radius-LG | 12px | Modals, sheets |
| Radius-XL | 16px | Large panels |
| Radius-2XL | 24px | Special elements |
| Radius-Full | 9999px | Pills, avatars |

### 2.5 Shadows

```css
/* Subtle - Subtle elevation, tooltips */
--shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);

/* Default - Cards, dropdowns */
--shadow: 0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06);

/* Medium - Floating elements, modals */
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.06);

/* Large - Overlays, popovers */
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.06);

/* XL - Full-screen modals */
--shadow-xl: 0 25px 50px -12px rgba(0, 0, 0, 0.25);

/* Glow - Focus states, highlights */
--shadow-glow: 0 0 20px rgba(99, 102, 241, 0.25);
--shadow-glow-accent: 0 0 20px rgba(139, 92, 246, 0.25);
```

---

## 3. Layout Architecture

### 3.1 Responsive Strategy

**Core Principle:** CSS-First Responsive — No JavaScript device detection.

```css
/* Mobile-first: Base styles */

/* Tablet */
@media (min-width: 640px) { }

/* Small Desktop */
@media (min-width: 768px) { }

/* Desktop (navigation switch) */
@media (min-width: 1024px) { }

/* Large Desktop */
@media (min-width: 1280px) { }

/* Wide */
@media (min-width: 1536px) { }
```

### 3.2 Mobile Layout (< 1024px)

```
┌─────────────────────────┐
│   Status Bar (safe)     │  ← Dynamic (notch aware)
├─────────────────────────┤
│     Top Bar (56px)      │  ← App title, actions, search
├─────────────────────────┤
│                         │
│     Content Area        │  ← Scrollable, full-width
│      (padding: 16px)   │
│                         │
│                         │
├─────────────────────────┤
│   Bottom Nav (72px)     │  ← 5 items max
└─────────────────────────┘
```

**Specifications:**
- Top bar: 56px fixed height
- Bottom nav: 72px with safe-area-bottom
- Content: Full width, 16px horizontal padding
- Scroll: Native scroll, smooth scrolling
- Pull-to-refresh: Native on mobile, custom on desktop

### 3.3 Desktop Layout (≥ 1024px)

```
┌────────┬──────────────────────────┐
│ Sidebar│     Title Bar (56px)      │  ← Breadcrumb, actions
├────────┼──────────────────────────┤
│ 72px  │                          │
│ (icon)│     Content Area          │
│       │  max-width: 1200px       │
│ ----- │  padding: 24px           │
│       │  centered               │
│ 260px │                          │
│(expand│                          │
│  able)│                          │
├────────┴──────────────────────────┤
│         Command Bar (optional)    │  ← Cmd+K search
└───────────────────────────────────┘
```

**Specifications:**
- Sidebar: 72px collapsed, 260px expanded (transition: 200ms)
- Content max-width: 1200px (centered)
- Content padding: 24px
- Command palette: Cmd/Ctrl + K

### 3.4 Fluid Transition Zone (768px - 1024px)

```
Hybrid Approach:
- 768px-1023px: Bottom nav remains, content expands
- 1024px+: Sidebar appears, bottom nav hides

Transition: Smooth opacity/transform (200ms ease-out)
```

### 3.5 Adaptive Content Width

| Viewport | Content Max Width | Sidebar |
|----------|------------------|---------|
| < 640px | 100% (full) | None |
| 640-767px | 100% | None |
| 768-1023px | 100% | None (drawer) |
| 1024-1279px | 900px | 72px/260px |
| 1280-1535px | 1100px | 72px/260px |
| ≥ 1536px | 1200px | 72px/260px |

---

## 4. PWA & Offline Architecture

### 4.1 Service Worker Strategy

**Caching Strategy:**

| Resource Type | Strategy | TTL |
|---------------|----------|-----|
| HTML (app shell) | Cache-first | Forever (versioned) |
| Static assets (JS/CSS) | Cache-first | 1 year |
| API responses | Network-first | 5 minutes |
| Images | Cache-first | 30 days |
| Fonts | Cache-first | 1 year |

**Offline Capabilities:**
- Full app shell cached
- Conversations accessible offline
- Queue mutations for sync
- Show offline indicator
- Queue indicator for pending sync

### 4.2 App Shell Architecture

```typescript
// App Shell Components (Cached)
const APP_SHELL = [
  '/',
  '/index.html',
  '/static/js/main.js',
  '/static/css/main.css',
  '/manifest.json',
  '/icons/*.png',
];
```

### 4.3 Offline Data Flow

```
┌─────────────────────────────────────────────────────────┐
│                    USER ACTION                           │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│                 OPTIMISTIC UI UPDATE                     │
│  - Update local state immediately                        │
│  - Show pending indicator                                │
└─────────────────────┬───────────────────────────────────┘
                      │
          ┌───────────┴───────────┐
          │                       │
          ▼                       ▼
┌─────────────────┐   ┌─────────────────┐
│  ONLINE?        │   │  OFFLINE?      │
└────────┬────────┘   └────────┬────────┘
         │                    │
         ▼                    ▼
┌─────────────────┐   ┌─────────────────┐
│  Sync Now       │   │  Queue Action   │
│  - Send to API  │   │  - Store locally│
│  - Update state │   │  - Show queue   │
└─────────────────┘   │  - Retry later  │
                     └─────────────────┘
```

### 4.4 Background Sync

```typescript
// Register background sync
if ('serviceWorker' in navigator && 'sync' in window.SyncManager) {
  await navigator.serviceWorker.ready;
  await (registration as any).sync.register('sync-conversations');
}

// Handle sync event in service worker
self.addEventListener('sync', (event: SyncEvent) => {
  if (event.tag === 'sync-conversations') {
    event.waitUntil(syncPendingMutations());
  }
});
```

---

## 5. Desktop WebApp Features

### 5.1 Window Management

**Standalone Mode:**
```html
<meta name="theme-color" content="#6366F1">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
```

**Window Controls:**
- Minimize to system tray (optional)
- Remember window size/position
- Always on top option
- Fullscreen support (F11)

### 5.2 Keyboard Shortcuts

| Shortcut | Action | Context |
|----------|--------|---------|
| `Cmd/Ctrl + K` | Open command palette | Global |
| `Cmd/Ctrl + /` | Show shortcuts | Global |
| `Cmd/Ctrl + N` | New conversation | Global |
| `Cmd/Ctrl + S` | Save/bookmark | In conversation |
| `Cmd/Ctrl + F` | Search in page | Global |
| `Cmd/Ctrl + Shift + F` | Global search | Global |
| `Cmd/Ctrl + [` | Go back | Global |
| `Cmd/Ctrl + ]` | Go forward | Global |
| `Cmd/Ctrl + \` | Toggle sidebar | Desktop |
| `Escape` | Close modal/drawer | Global |
| `J/K` | Next/previous item | List views |
| `Enter` | Open selected | List views |

### 5.3 Command Palette

```
┌─────────────────────────────────────────────┐
│  🔍 Search commands...                        │
├─────────────────────────────────────────────┤
│  Recent                                     │
│  ├ → Go to Home                            │
│  ├ → New Conversation                      │
│  └ → Search Conversations                  │
│                                              │
│  Actions                                    │
│  ├ → Capture Conversation                 │
│  ├ → Create Collection                     │
│  └ → Export Data                           │
│                                              │
│  Navigation                                 │
│  ├ → Settings                              │
│  ├ → Archive                                │
│  └ → Account                                │
└─────────────────────────────────────────────┘
         ↑↓ Navigate   ↵ Select   Esc Close
```

**Features:**
- Fuzzy search
- Recent commands
- Categorized results
- Keyboard navigation
- Action preview

### 5.4 System Integration

| Feature | Implementation | Priority |
|---------|---------------|----------|
| System tray | Electron not needed - Web Share Target API | Optional |
| Notifications | Web Push Notifications | Must |
| File handling | File System Access API | Should |
| Clipboard | Clipboard API | Must |
| Drag & Drop | HTML5 DnD + File API | Must |
| Install prompt | BeforeInstallPrompt | Must |

### 5.5 Install Experience

```typescript
// Detect install capability
let deferredPrompt: BeforeInstallPromptEvent;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
});

// Show custom install button
const installButton = document.getElementById('install');
installButton.addEventListener('click', async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  deferredPrompt = null;
});
```

---

## 6. User Experience

### 6.1 Loading States

**Skeleton Screens:**
```tsx
// Conversation List Skeleton
<div className="space-y-3">
  {[...Array(5)].map((_, i) => (
    <div key={i} className="animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-3/4" />
      <div className="h-3 bg-gray-100 rounded w-1/2 mt-2" />
    </div>
  ))}
</div>
```

**Principles:**
- Match actual content layout
- Subtle animation (no flashing)
- Maximum 3-second skeleton display
- Transition to real content smoothly

### 6.2 Empty States

**Design Pattern:**
```
┌────────────────────────────────────────┐
│                                        │
│           [Icon - 64px]                │
│                                        │
│         Title (H3)                     │
│                                        │
│     Description (Body, muted)          │
│                                        │
│          [Primary Action]              │
│         [Secondary Action]              │
│                                        │
└────────────────────────────────────────┘
```

**Content Guidelines:**
- Icon: Relevant, friendly
- Title: What to do
- Description: Why and how
- Actions: Clear next steps

### 6.3 Error States

**Retry Pattern:**
```
┌────────────────────────────────────────┐
│           [Error Icon]                 │
│                                        │
│       Something went wrong             │
│                                        │
│    We couldn't load your data.        │
│                                        │
│        [Retry Button]                  │
│                                        │
│    Last synced: 5 minutes ago          │
└────────────────────────────────────────┘
```

### 6.4 Feedback & Toasts

**Toast Types:**
| Type | Color | Icon | Duration |
|------|-------|------|----------|
| Success | Green | Check | 3s |
| Error | Red | X | 5s |
| Warning | Yellow | ! | 5s |
| Info | Blue | i | 4s |
| Loading | Gray | Spinner | Until complete |

**Position:**
- Mobile: Top of content (below top bar)
- Desktop: Bottom-right

### 6.5 Gestures (Mobile)

| Gesture | Action | Context |
|---------|--------|---------|
| Swipe left | Delete/archive | List items |
| Swipe right | Pin/favorite | List items |
| Pull down | Refresh | Content |
| Long press | Context menu | Any item |
| Pinch | Zoom | Images |
| Two-finger swipe | Back/forward | Navigation |

---

## 7. Animation System

### 7.1 Motion Principles

| Principle | Implementation |
|-----------|---------------|
| Purposeful | Every animation has meaning |
| Subtle | Fast (150-200ms), not flashy |
| Responsive | Respects reduced-motion |
| Performant | 60fps, GPU-accelerated |

### 7.2 Animation Tokens

```css
--duration-instant: 0ms;
--duration-fast: 75ms;
--duration-quick: 100ms;
--duration-normal: 150ms;
--duration-default: 200ms;
--duration-slow: 300ms;
--duration-slower: 500ms;

--ease-in: cubic-bezier(0.4, 0, 1, 1);
--ease-out: cubic-bezier(0, 0, 0.2, 1);
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
--ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
```

### 7.3 Common Animations

**Page Transitions:**
```css
@keyframes pageIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.page-enter {
  animation: pageIn 200ms ease-out;
}
```

**Card Hover:**
```css
.card {
  transition: transform 150ms ease-out, box-shadow 150ms ease-out;
}

.card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}
```

**Skeleton Pulse:**
```css
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

.skeleton {
  background: linear-gradient(90deg, #f0f0f0 250 50%,0e0e%, #e #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}
```

### 7.4 Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 8. Accessibility

### 8.1 WCAG 2.1 AA Compliance

| Requirement | Target |
|-------------|--------|
| Color contrast | 4.5:1 (text), 3:1 (UI) |
| Focus indicators | Visible 2px outline |
| Touch targets | 44x44px minimum (mobile) |
| Screen reader | ARIA labels, live regions |
| Keyboard nav | All interactive elements |

### 8.2 Focus Management

```tsx
// Modal focus trap
<Dialog>
  <DialogTitle>Delete Conversation</DialogTitle>
  <DialogDescription>Are you sure?</DialogDescription>
  <FocusTrap>
    <DialogActions>
      <Button onClick={onClose}>Cancel</Button>
      <Button onClick={onConfirm}>Delete</Button>
    </DialogActions>
  </FocusTrap>
</Dialog>
```

### 8.3 ARIA Guidelines

```tsx
// Button with icon only
<button
  aria-label="Delete conversation"
  aria-describedby="delete-hint"
  onClick={handleDelete}
>
  <TrashIcon />
</button>
<span id="delete-hint" className="sr-only">
  This will permanently delete the conversation
</span>
```

---

## 9. Performance

### 9.1 Targets

| Metric | Target | Priority |
|--------|--------|----------|
| First Contentful Paint | < 1.0s | Critical |
| Largest Contentful Paint | < 2.0s | Critical |
| Time to Interactive | < 2.5s | Critical |
| Cumulative Layout Shift | < 0.1 | Critical |
| First Input Delay | < 100ms | Important |
| Bundle Size (JS) | < 200KB gzipped | Important |

### 9.2 Optimization Strategies

- Route-based code splitting
- Lazy load below-fold content
- Preload critical assets
- Image optimization (WebP, AVIF)
- Font subsetting
- Tree shaking
- Bundle analysis

### 9.3 Virtualization

```tsx
import { useVirtualizer } from '@tanstack/react-virtual';

function VirtualizedList({ items }) {
  const parentRef = useRef(null);
  
  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80,
    overscan: 5,
  });
  
  // Render only visible items + overscan
}
```

---

## 10. File Structure

```
src/
├── app/
│   ├── App.tsx                 # Root with providers
│   ├── routes.tsx              # All routes
│   └── shell/
│       ├── Shell.tsx           # App shell wrapper
│       ├── Sidebar.tsx         # Desktop nav
│       ├── MobileNav.tsx       # Mobile nav
│       └── CommandPalette.tsx  # Cmd+K
├── components/
│   ├── ui/                     # Base components
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Card.tsx
│   │   ├── Modal.tsx
│   │   ├── Drawer.tsx
│   │   └── ...
│   ├── layout/
│   │   ├── PageHeader.tsx
│   │   ├── ContentArea.tsx
│   │   └── ...
│   ├── features/               # Feature-specific
│   │   ├── conversation/
│   │   ├── archive/
│   │   └── ...
│   └── animations/
│       ├── Motion.tsx           # Framer Motion wrapper
│       └── transitions.ts
├── hooks/
│   ├── useKeyboard.ts
│   ├── useOnlineStatus.ts
│   └── useMediaQuery.ts
├── lib/
│   ├── services/              # API, storage
│   └── utils/
├── stores/                     # Zustand
├── styles/
│   ├── globals.css            # Tailwind + base
│   └── tokens.css             # CSS custom properties
└── public/
    ├── manifest.json          # PWA manifest
    ├── icons/                 # App icons
    └── sw.js                  # Service worker
```

---

## 11. Implementation Roadmap

### Phase 1: Foundation (Week 1-2)
- [ ] Set up project structure
- [ ] Configure TailwindCSS 4 with design tokens
- [ ] Build base UI components
- [ ] Create responsive layout shell
- [ ] Implement app shell caching

### Phase 2: Core Experience (Week 3-4)
- [ ] Build navigation (sidebar + mobile nav)
- [ ] Command palette implementation
- [ ] Keyboard shortcuts
- [ ] PWA manifest + install
- [ ] Offline support

### Phase 3: Pages (Week 5-6)
- [ ] Home/Feed page
- [ ] Conversation view
- [ ] Archive views
- [ ] Settings

### Phase 4: Polish (Week 7-8)
- [ ] Animations
- [ ] Loading states
- [ ] Error handling
- [ ] Accessibility audit
- [ ] Performance optimization

---

## 12. Success Metrics

### Qualitative
- [ ] App feels native on mobile
- [ ] Desktop feels like a webapp
- [ ] Animations are smooth
- [ ] Offline works seamlessly

### Quantitative
- [ ] Lighthouse PWA: 100
- [ ] Lighthouse Accessibility: 100
- [ ] Lighthouse Performance: > 90
- [ ] Core Web Vitals: All green

---

*This document provides the design vision for the VIVIM frontend redesign. See related documents for technical specifications.*
