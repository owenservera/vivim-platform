# Quick Reference Card

> **Purpose:** One-page summary for quick lookup  
> **Location:** `.archive.dev/`

---

## File Index

| Document | Purpose |
|----------|---------|
| `SPEC.md` | Complete project overview and requirements |
| `UI_COMPONENT_SPEC.md` | Component documentation and status |
| `RESPONSIVE_BREAKPOINTS.md` | Mobile/desktop layout specs |
| `CURRENT_ISSUES.md` | Problems to solve |
| `DESIGN_TOKENS.md` | Colors, typography, spacing |
| `ROUTING_NAVIGATION.md` | Routes and navigation structure |
| `INTEGRATION_GUIDE.md` | How to connect to services |

---

## Key Paths

```
pwa/
├── src/
│   ├── App.tsx                    # Root
│   ├── main.tsx                   # Entry
│   ├── index.css                  # Base styles
│   ├── pages/                     # 30+ pages
│   ├── components/                # UI components
│   │   ├── ui/                   # Base components
│   │   ├── ios/                  # iOS components (replace)
│   │   └── responsive/           # Responsive (redesign)
│   ├── stores/                   # Zustand stores
│   ├── lib/                      # Services, utilities
│   │   ├── service/             # API services
│   │   └── storage-v2/          # Storage layer
│   └── router/
│       └── routes.tsx            # Route definitions
```

---

## What to Replace

### Priority 1 - Critical
- [ ] `components/ios/*` - All iOS components
- [ ] `components/responsive/ResponsiveLayout.tsx`
- [ ] `styles/ios-design-system.css`
- [ ] `lib/device-context.ts`

### Priority 2 - Important
- [ ] `pages/Home.tsx` - Extract FeedItemCard
- [ ] `router/routes.tsx` - Simplify layout
- [ ] Consolidate card components

### Priority 3 - Nice to Have
- [ ] `styles/unified-design-system.css` → Tailwind theme
- [ ] Animation standardization

---

## Services to Use

```typescript
// Conversations
import { conversationService } from '@/lib/service/conversation-service';

// API
import { apiClient } from '@/lib/api';

// Storage
import { unifiedRepository } from '@/lib/db/unified-repository';

// Auth
import { useAuth } from '@/lib/auth-context';

// State
import { useHomeUIStore } from '@/stores/useHomeUIStore';
```

---

## Routes Overview

| Section | Routes |
|---------|--------|
| Feed | `/`, `/for-you`, `/search` |
| Archive | `/archive/*` |
| Chat | `/chat`, `/conversation/:id` |
| Capture | `/capture`, `/simple-capture` |
| Settings | `/settings`, `/settings/ai` |
| Account | `/account`, `/identity` |
| Admin | `/admin`, `/storage`, `/analytics` |

---

## Design Tokens

```css
/* Primary */
--color-primary-500: #6366f1;

/* Accent */
--color-accent-500: #8b5cf6;

/* Semantic */
--color-success-500: #10b981;
--color-warning-500: #f59e0b;
--color-error-500: #ef4444;

/* Typography */
--font-sans: 'Inter', system-ui, sans-serif;
--text-base: 1rem;      /* 16px */
--text-lg: 1.125rem;   /* 18px */

/* Spacing */
--space-4: 1rem;    /* 16px */
--space-6: 1.5rem;  /* 24px */

/* Radius */
--radius-md: 0.5rem;
--radius-lg: 0.75rem;
```

---

## Responsive Breakpoints

```css
/* Mobile-first */
@media (min-width: 640px) { }  /* sm */
@media (min-width: 768px) { }  /* md */
@media (min-width: 1024px) { } /* lg - Desktop starts */
@media (min-width: 1280px) { } /* xl */
```

---

## Layout Specs

| Element | Mobile | Desktop |
|---------|--------|---------|
| Top bar | 56px, visible | 56px, hidden |
| Bottom nav | 64px, visible | hidden |
| Sidebar | hidden | 260px, fixed left |
| Content | 100% width | max-width: 1200px |

---

## Dependencies

```json
{
  "react": "^19.2.4",
  "react-router-dom": "^7.13.0",
  "tailwindcss": "^4.1.18",
  "framer-motion": "^12.34.3",
  "zustand": "^5.0.11",
  "@tanstack/react-query": "^5.90.21",
  "@radix-ui/react-*": "^1.x",
  "lucide-react": "^0.575.0"
}
```

---

## Run Commands

```bash
# Development
bun run dev:pwa          # Frontend only (port 5173)
bun run dev              # All services

# Build
bun run build           # Production build

# Testing
bun test               # Unit tests
bun run test:e2e      # E2E tests
```

---

## Success Criteria

- [ ] Single responsive codebase
- [ ] Clear mobile vs desktop behavior
- [ ] Unified design tokens
- [ ] All existing features work
- [ ] Smooth animations
- [ ] Fast load times
