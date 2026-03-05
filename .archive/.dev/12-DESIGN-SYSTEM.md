# VIVIM — Design System
**Archived**: 2026-03-05 | **Basis**: `05-DESIGN-SYSTEM.md` + `VIVIM_COMPLETE_BLUEPRINT.md`

---

## Design Philosophy

VIVIM uses a **"Neo-Glassmorphic Knowledge Hub"** aesthetic — a sophisticated dark-mode-first design language with:
- Glassmorphic surface layers (backdrop-blur, translucent cards)
- Subtle gradients and glow effects
- Spring-physics animations (framer-motion)
- Provider-specific accent colors (ChatGPT green, Claude orange, Gemini blue)

---

## Color Tokens & Palette

### Core Palette (Tailwind-mapped)

| Token | Color | Usage |
|-------|-------|-------|
| Primary | `blue-500` (#3B82F6) | Primary actions, CTAs |
| Secondary | `violet-500` (#8B5CF6) | Secondary actions, accents |
| Accent | `emerald-500` (#10B981) | Success states, positive indicators |

### Dark Mode Surfaces

| Token | Hex | Usage |
|-------|-----|-------|
| App Background | `#0A0A0A` | Root background |
| Surface / Cards | `#171717` | Card backgrounds |
| Borders | `#262626` | Dividers, card borders |

### Text Colors

| Token | Hex | Usage |
|-------|-----|-------|
| Primary Text | `#FAFAFA` | Main content |
| Muted Text | `#A3A3A3` | Secondary content, labels |
| Disabled Text | `#525252` | Disabled states, hints |

### Provider Gradients (Hardcoded — Gap)
Provider accent strips in `Home.css` use hardcoded `linear-gradient` values:
- ChatGPT: Green gradient
- Claude: Orange/warm gradient
- Gemini: Blue gradient

**Gap**: These are not abstracted into CSS variables. No dark mode `@media` fallback.

---

## Typography

### Primary Font: Inter (system-ui fallback)
| Scale | Size | Weight | Usage |
|-------|------|--------|-------|
| H1 | 2.5rem | 700 | Page titles |
| H2 | 2rem | 600 | Section headers |
| H3 | 1.5rem | 600 | Card headers |
| Body | 1rem | 400 | Content text |
| Small | 0.875rem | 400 | Labels, metadata |

### Monospace Font: JetBrains Mono
| Scale | Size | Weight | Usage |
|-------|------|--------|-------|
| Code | 0.875rem | 400 | Code blocks, ACU content, raw output |

---

## Spacing Scale (Tailwind 4px Grid)

| Step | Rem | Px | Usage |
|------|-----|-----|-------|
| 1 | 0.25rem | 4px | Tight spacing |
| 2 | 0.5rem | 8px | Component internal |
| 3 | 0.75rem | 12px | Small gaps |
| 4 | 1rem | 16px | Standard padding |
| 6 | 1.5rem | 24px | Card padding |
| 8 | 2rem | 32px | Section gaps |
| 12 | 3rem | 48px | Large layout gaps |

---

## Component Inventory

All base components in `pwa/src/components/ui/` and `pwa/src/components/unified/`.

| Component | Location | Status | Notes |
|-----------|----------|--------|-------|
| Button | `ui/button.tsx` | ✅ Polished | 5 variants, 4 sizes, loading state |
| Badge | `ui/badge.tsx` | ✅ Polished | 4 variants |
| Card | `ui/card.tsx` | ✅ Polished | Default, elevated, outlined, glass |
| Input / Textarea | `unified/Input.tsx` | ✅ Polished | Label, icon, error, helper |
| Accordion | `ui/accordion.tsx` | ✅ Polished | Radix UI |
| DropdownMenu | `ui/dropdown-menu.tsx` | ✅ Polished | Radix UI |
| Tooltip | `ui/tooltip.tsx` | ✅ Polished | Radix UI |
| Table | `ui/table.tsx` | ✅ Polished | Overflow scroll on mobile |
| Toast | (toast system) | ✅ Polished | Notification popups |
| Skeleton | (skeleton system) | ✅ Polished | Page, Conversation, Table skeletons |
| ContentRenderer | `content/ContentRenderer.tsx` | ✅ Highly Polished | Pluggable: Markdown, Code, KaTeX, Mermaid, Tool calls |
| ErrorState | `ios/ErrorState.tsx` | ⚠️ Rough | Multiple variants exist but all render generic `WifiOff` icon |
| ACUViewer | `ACUViewer.tsx` | ⚠️ Rough | Knowledge graph needs responsive refinements |
| ACUGraph | `ACUGraph.tsx` | ⚠️ Rough | Complex visualization, layout issues |
| SyncIndicator | `SyncIndicator.tsx` | ⚠️ Rough | Uses emoji instead of Lucide icons |

---

## Animations & Motion

All animations driven by **framer-motion**.

| Usage | Implementation |
|-------|---------------|
| Modal open/close | `AnimatePresence` with opacity + scale spring |
| Context Visualizer panels | `AnimatePresence` + height transition |
| Toast notifications | Slide in/out with `AnimatePresence` |
| Feed drag-to-dismiss | Spring physics drag gesture |
| BottomNav transitions | Framer layout animations |

**Accessibility gap**: `prefers-reduced-motion` was only added to `Home.css` this session. Other animation-heavy files (`ContextVisualizer.tsx`, `AIChat.tsx`) still need reduced-motion handling.

---

## Responsive Design

### Breakpoints

| Name | Width | Layout Strategy |
|------|-------|-----------------|
| Mobile | < 768px | Single column, BottomNav, FAB, 88px bottom padding |
| Tablet | 768–1024px | 2-column grid (conversation view), max-w `[800px]` |
| Desktop | > 1024px | Centered column, SideNav (⚠️ NOT YET BUILT) |

### Desktop Sidebar Gap
The Desktop layout is currently missing the side navigation (`SideNav.tsx`) and proper `ResponsiveLayout.tsx` desktop logic. Desktop users see the same centered column as tablet.

**Files to create/update**:
- `pwa/src/components/SideNav.tsx` — Desktop navigation rail
- `pwa/src/components/unified/ResponsiveLayout.tsx` — Conditional layout wrapper

---

## Dark Mode Support

- **Status**: Mostly complete via Tailwind `dark:` classes
- **Gap**: `Home.css` and `Capture.css` contain hardcoded colors without `@media (prefers-color-scheme: dark)` fallbacks
- **Gap**: Provider gradient accent strips don't adapt to dark mode
- **Gap**: Some hardcoded hex colors in `ContextVisualizer.tsx` bypass theming

---

## Accessibility Status

| Area | Status | Notes |
|------|--------|-------|
| Keyboard navigation | ⚠️ Partial | ConversationCard Enter+Space ✅ Fixed. Many custom elements still missing. |
| ARIA labels | ⚠️ Partial | Stats pills ✅ Fixed. ACUGraph, SyncIndicator still missing. |
| Focus management | ⚠️ Partial | Radix modals OK. Route transitions don't reset focus. |
| Screen readers | ⚠️ Partial | SyncIndicator uses emoji. ErrorState icons unlabelled. |
| Color contrast | ⚠️ Partial | Generally good. Provider hardcoded colors may violate WCAG AA. |
| Reduced motion | ✅ Added | `prefers-reduced-motion` block in Home.css |

---

## Design System Gaps (Priority Order)

1. **Provider gradient CSS variables** — Extract hardcoded `linear-gradient` values in `Home.css` into `--provider-chatgpt-gradient` etc.
2. **Dark mode fallbacks** — Add `@media (prefers-color-scheme: dark)` to `Home.css` and `Capture.css` for custom elements
3. **ErrorState differentiation** — Map `IOSErrorType` enum values to specific Lucide icons, not all `WifiOff`
4. **ContextVisualizer layer colors** — Replace `LAYER_COLORS` hardcoded hex with CSS variables
5. **SyncIndicator** — Replace emoji with animated Lucide icons
6. **Desktop SideNav** — Build the missing desktop navigation component
7. **Reduced motion** — Propagate `prefers-reduced-motion` to all animation-heavy components

---

## assistant-ui Integration Guidelines

VIVIM plans to modernize its AI chat to use `@assistant-ui/react` primitives (see `07-ASSISTANT-UI-GUIDELINES.md`).

### Runtime Adapter
```tsx
import { useChatRuntime, AssistantChatTransport } from "@assistant-ui/react-ai-sdk";

const runtime = useChatRuntime({
  transport: new AssistantChatTransport({
    api: `/api/v1/ai/chat/session/${conversationId}/message`,
    headers: { Authorization: `Bearer ${token}` },
  }),
});
```

### Migration Checklist
1. Remove manual `EventSource`/`fetch` streaming in `useAIChat.ts`
2. Replace with `@assistant-ui/react-ai-sdk`'s `useChatRuntime`
3. Deprecate Zustand slice used for live chat messages — use `ThreadRuntime`
4. Bridge persistence: sync completed threads from `AssistantRuntime` → Dexie IndexedDB
5. Refactor `ContentRenderer` tool output blocks to `makeAssistantToolUI`
6. Bind ContextCockpit visualization to tool call `args`/`results`
