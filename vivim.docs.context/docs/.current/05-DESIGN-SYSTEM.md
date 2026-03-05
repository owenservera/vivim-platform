# Design System Inventory

## Color Tokens & Palette
VIVIM uses Tailwind CSS heavily. While a formal strict design token file isn't explicitly separated from the Tailwind config, the established palette is:
- **Primary**: `blue-500` (#3B82F6), used for primary actions.
- **Secondary**: `violet-500` (#8B5CF6).
- **Accent**: `emerald-500` (#10B981).
- **Background (Dark Mode)**: `#0A0A0A` (App Background), `#171717` (Surface/Cards), `#262626` (Borders).
- **Text**: `#FAFAFA` (Primary), `#A3A3A3` (Muted), `#525252` (Disabled).
- **Provider Gradients (Hardcoded)**: `Home.css` contains hardcoded linear gradients for ChatGPT, Claude, and Gemini accents that currently lack CSS variable abstraction.

## Typography
- **Primary Sans**: `Inter` (used via system-ui fallback).
  - H1: 2.5rem, Weight 700
  - H2: 2rem, Weight 600
  - H3: 1.5rem, Weight 600
  - Body: 1rem, Weight 400
  - Small: 0.875rem, Weight 400
- **Monospace**: `JetBrains Mono` (used for code blocks and raw ACU outputs).
  - Code: 0.875rem, Weight 400

## Spacing Scale
Follows the standard Tailwind 4px grid:
- `1` = 0.25rem (4px)
- `2` = 0.5rem (8px)
- `3` = 0.75rem (12px)
- `4` = 1rem (16px)
- `6` = 1.5rem (24px)
- `8` = 2rem (32px)
- `12` = 3rem (48px)

## Component Inventory
All components reside in `pwa/src/components/ui/` and `pwa/src/components/unified/`.
- **Button**: Polished. Supports 5 variants (primary, secondary, ghost, destructive, tertiary) and 4 sizes with loading states.
- **Input / Textarea**: Polished. Supports labels, icons, errors, and helper text.
- **Card**: Polished. Supports 4 variants (default, elevated, outlined, glass) with interactive hover states.
- **ErrorState**: Rough. Multiple variants (Network, Database) exist but currently all render a generic `WifiOff` icon.
- **Skeleton**: Polished. PageSkeleton, ConversationSkeleton, TableSkeleton.
- **Toast**: Polished. Notification popups.
- **ContentRenderer**: Highly Polished. Pluggable system handling Markdown, Code (Shiki), KaTeX, Mermaid, and AI Tool Calls.
- **ACUViewer / ACUGraph**: Rough. Visualizes complex knowledge graphs; needs responsive layout refinements.
- **SyncIndicator**: Polished. Displays real-time Yjs CRDT synchronization status.

## Animation / Transitions
- Driven entirely by `framer-motion`.
- Utilized heavily in the `ContextVisualizer`, `ToastContainer`, and Modal mount/unmount lifecycles.
- Spring physics used for drag interactions (e.g., swipe to dismiss in the "For You" feed).

## Dark Mode Support
- **Partial/Mostly Yes**.
- The app fundamentally supports a dark theme via Tailwind's `dark:` classes.
- *Gap*: Certain CSS files (`Home.css`, `Capture.css`) contain hardcoded colors that do not have `@media (prefers-color-scheme: dark)` fallbacks, leading to harsh contrast issues on provider accent strips in dark mode.

## Accessibility (A11y) Audit
- **Keyboard Navigation**: Rough. Buttons are focusable, but many custom interactive elements (like `ConversationCard`) lack proper `Space`/`Enter` key handlers and `aria-expanded` states.
- **ARIA Usage**: Missing on complex data visualizations (ACU Graph) and stats pills.
- **Focus Management**: Modals capture focus correctly via Radix UI primitives, but route transitions don't reliably reset focus to the top of the page.
- **Contrast**: Generally good, though hardcoded provider colors occasionally violate WCAG AA ratios against dark backgrounds.