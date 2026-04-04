# Responsive Breakpoints & Layout Specification

> **Purpose:** Define responsive behavior for mobile and desktop  
> **Current Status:** Broken - needs complete overhaul  
> **Target:** Fluid, CSS-based responsive design

---

## 1. Current Problems

### 1.1 Detection-Based Approach (Broken)

The current implementation uses **JavaScript device detection**:

```typescript
// Current approach ( DON'T DO THIS )
const { deviceType } = useDeviceContext();
// Returns: 'mobile' | 'tablet' | 'desktop'
```

**Problems:**
- User agent sniffing is unreliable
- Tablet vs desktop is ambiguous
- Resize doesn't trigger updates
- Creates hard breakpoints instead of fluid transitions

### 1.2 Conflicting Layouts

Current layout tries to do both:
- Desktop: Sidebar on left (hidden on mobile)
- Mobile: Bottom nav (hidden on desktop)
- Top bar: Different on each

This creates edge cases where both/neither show.

---

## 2. Proposed Solution: CSS-First Responsive

### 2.1 Breakpoint Strategy

Use CSS media queries for true responsive behavior:

```css
/* Mobile-first: Base styles apply to all */

/* Tablet */
@media (min-width: 640px) {
  /* Tablet enhancements */
}

/* Small Desktop */
@media (min-width: 1024px) {
  /* Desktop layout kicks in */
}

/* Large Desktop */
@media (min-width: 1280px) {
  /* Extra space handling */
}
```

### 2.2 Proposed Breakpoints

| Name | Min Width | Target |
|------|-----------|--------|
| xs | 320px | Small phones |
| sm | 640px | Large phones, small tablets |
| md | 768px | Tablets |
| lg | 1024px | **Desktop** (primary switch) |
| xl | 1280px | Large desktops |
| 2xl | 1536px | Extra large |

---

## 3. Layout Specifications

### 3.1 Mobile Layout (< 1024px)

```
┌─────────────────────────┐
│      Top Bar (56px)     │  ← Fixed
├─────────────────────────┤
│                         │
│     Content Area        │  ← Scrollable
│      (full width)       │
│                         │
│                         │
├─────────────────────────┤
│   Bottom Nav (64px)     │  ← Fixed
└─────────────────────────┘

Safe area: env(safe-area-inset-*)
```

**Specifications:**
- Top bar height: 56px
- Bottom nav height: 64px
- Content padding: 16px horizontal
- Safe area insets for notched devices
- Full-width cards/containers

### 3.2 Desktop Layout (≥ 1024px)

```
┌──────────┬────────────────┐
│ Sidebar  │   Top Bar      │  ← Fixed header (56px)
│ (260px)  ├────────────────┤
│          │                │
│ Fixed    │  Content Area  │  ← Scrollable
│          │  (max-width)   │
│          │                │
│          │                │
└──────────┴────────────────┘
```

**Specifications:**
- Sidebar width: 260px (collapsible to 72px)
- Top bar height: 56px
- Content max-width: 1200px (centered)
- Content padding: 24px horizontal

### 3.3 Fluid Transition Zone (768px - 1024px)

This is the problematic area. Options:

**Option A: Stack navigation**
- Show sidebar as overlay drawer
- Keep bottom nav until 1024px

**Option B: Hybrid**
- 768px-1024px: Bottom nav + expanded content
- 1024px+: Sidebar + top bar

**Recommendation: Option B** (simpler, more predictable)

---

## 4. Component Responsiveness

### 4.1 Cards & Containers

| Breakpoint | Card Max Width | Padding |
|------------|----------------|---------|
| < 640px | 100% | 12px |
| 640-1023px | 100% | 16px |
| ≥ 1024px | 720px | 24px |

### 4.2 Typography Scale

| Breakpoint | Base Size | Heading Scale |
|------------|-----------|---------------|
| < 640px | 14px | 1.2 |
| 640-1023px | 16px | 1.25 |
| ≥ 1024px | 16px | 1.3 |

### 4.3 Grid Layouts

| Breakpoint | Archive Grid | Recommendations |
|------------|--------------|-----------------|
| < 640px | 1 column | 1 column |
| 640-767px | 2 columns | 2 columns |
| 768-1023px | 3 columns | 3 columns |
| ≥ 1024px | 4 columns | 4 columns |

### 4.4 Navigation Items

**Mobile (< 1024px):**
- Icon + Label in bottom nav
- 5 items max: Home, Search, Capture (+), Archive, Profile

**Desktop (≥ 1024px):**
- Icon only in collapsed sidebar
- Icon + Label in expanded sidebar
- Items: Home, Search, Archive, Collections, Settings

---

## 5. Spacing System

### 5.1 Spacing Scale

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | Tight spacing, icon gaps |
| sm | 8px | Inline elements |
| md | 16px | Default padding |
| lg | 24px | Section spacing |
| xl | 32px | Major sections |
| 2xl | 48px | Page margins |
| 3xl | 64px | Hero sections |

### 5.2 Responsive Padding

```css
/* Mobile */
.p-responsive {
  padding-left: 16px;
  padding-right: 16px;
}

/* Desktop */
@media (min-width: 1024px) {
  .p-responsive {
    padding-left: 24px;
    padding-right: 24px;
  }
}
```

---

## 6. Touch Targets

### 6.1 Minimum Sizes

| Element | Mobile | Desktop |
|---------|--------|---------|
| Buttons | 44x44px | 36x36px |
| List items | 48px height | 40px height |
| Form inputs | 44px height | 36px height |
| Navigation | 48px hit area | 40px hit area |

### 6.2 Touch-Friendly Spacing

- Minimum 8px between interactive elements
- 16px minimum for grouped actions

---

## 7. Implementation Guide

### 7.1 Tailwind Configuration

```javascript
// tailwind.config.js
export default {
  theme: {
    extend: {
      screens: {
        'xs': '320px',
        // 'sm': '640px', (default)
        // 'md': '768px', (default)
        // 'lg': '1024px', (default) 
        // 'xl': '1280px', (default)
        // '2xl': '1536px', (default)
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      height: {
        'nav-top': '56px',
        'nav-bottom': '64px',
        'sidebar': '100vh',
        'sidebar-collapsed': '72px',
      },
      width: {
        'sidebar': '260px',
        'sidebar-collapsed': '72px',
      },
      maxWidth: {
        'content': '1200px',
        'card': '720px',
      }
    }
  }
}
```

### 7.2 Layout Component Example

```tsx
// components/AppLayout.tsx
import { ReactNode } from 'react';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Desktop sidebar - hidden on mobile */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-50 lg:block lg:w-64">
        <Sidebar />
      </aside>

      {/* Main content area */}
      <div className="lg:pl-64">
        {/* Top bar - hidden on desktop */}
        <header className="lg:hidden fixed top-0 left-0 right-0 h-14 z-40">
          <MobileTopBar />
        </header>

        {/* Desktop top bar */}
        <header className="hidden lg:fixed lg:top-0 lg:left-64 lg:right-0 lg:h-14 lg:z-40">
          <DesktopTopBar />
        </header>

        {/* Content */}
        <main className="pt-14 lg:pt-14 pb-20 lg:pb-6">
          <div className="max-w-content mx-auto px-4 lg:px-6">
            {children}
          </div>
        </main>

        {/* Bottom nav - hidden on desktop */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-16 z-50">
          <MobileBottomNav />
        </nav>
      </div>
    </div>
  );
}
```

### 7.3 Safe Area Handling

```css
/* CSS for safe areas */
.safe-area-top {
  padding-top: env(safe-area-inset-top);
}

.safe-area-bottom {
  padding-bottom: env(safe-area-inset-bottom);
}

/* JS fallback for older browsers */
@supports (padding: max(0px)) {
  .safe-area-bottom {
    padding-bottom: max(16px, env(safe-area-inset-bottom));
  }
}
```

---

## 8. Animation & Transitions

### 8.1 Layout Transitions

| Transition | Duration | Easing |
|------------|----------|--------|
| Sidebar expand/collapse | 200ms | ease-out |
| Bottom nav show/hide | 200ms | ease-out |
| Content reflow | 150ms | ease-in-out |

### 8.2 Responsive Animation Classes

```css
/* Hide/show with animation */
.nav-enter {
  transform: translateY(100%);
  opacity: 0;
}

.nav-enter-active {
  transform: translateY(0);
  opacity: 1;
  transition: transform 200ms ease-out, opacity 200ms ease-out;
}

/* Desktop-only animations */
@media (min-width: 1024px) {
  .desktop-animate {
    animation: fadeSlideIn 200ms ease-out;
  }
}
```

---

## 9. Testing Checklist

### 9.1 Device Testing

- [ ] iPhone SE (320px)
- [ ] iPhone 14/15 (390px)
- [ ] iPhone 15 Pro Max (430px)
- [ ] iPad Mini (768px)
- [ ] iPad Air (820px)
- [ ] iPad Pro 11" (834px)
- [ ] Desktop 1366x768
- [ ] Desktop 1920x1080
- [ ] Desktop 2560x1440

### 9.2 Orientation Testing

- [ ] Portrait mobile
- [ ] Landscape mobile
- [ ] Portrait tablet
- [ ] Landscape tablet

### 9.3 Edge Cases

- [ ] Very long content (scroll behavior)
- [ ] Very short content (bottom nav coverage)
- [ ] Resize from mobile to desktop
- [ ] Resize from desktop to mobile
- [ ] Browser zoom 100%, 110%, 90%
