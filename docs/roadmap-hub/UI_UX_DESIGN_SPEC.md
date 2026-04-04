# VIVIM Roadmap Hub - UI/UX Design Specification

## Overview

This document provides comprehensive UI/UX design specifications, wireframes, and component documentation for the VIVIM Roadmap Hub.

---

## 1. Design Principles

### 1.1 Core Philosophy

| Principle | Description | Application |
|-----------|-------------|-------------|
| **Visual First** | Information should be understood at a glance | Color coding, icons, spatial layout |
| **Progressive Disclosure** | Show complexity gradually | Expandable sections, contextual menus |
| **Immediate Feedback** | Users know what happened | Animations, toasts, status indicators |
| **Consistency** | Predictable patterns | Reusable components, standard interactions |
| **Accessibility** | Usable by everyone | WCAG 2.1 AA compliance, keyboard navigation |

### 1.2 Visual Hierarchy

```
Level 1: Roadmap Overview (Zoomed Out)
├── Workstream boundaries visible
├── Feature density apparent
└── Status colors prominent

Level 2: Feature Details (Medium Zoom)
├── Feature cards readable
├── Dependency lines clear
└── Progress indicators visible

Level 3: Task Details (Zoomed In)
├── Individual tasks visible
├── Detailed metadata shown
└── Inline editing available
```

---

## 2. Color System

### 2.1 Status Colors

```typescript
const statusColors = {
  // Feature Status
  BACKLOG: { bg: '#F3F4F6', border: '#9CA3AF', text: '#374151' },
  DISCOVERED: { bg: '#DBEAFE', border: '#3B82F6', text: '#1E40AF' },
  PLANNED: { bg: '#E0E7FF', border: '#6366F1', text: '#3730A3' },
  IN_PROGRESS: { bg: '#FEF3C7', border: '#F59E0B', text: '#92400E' },
  IN_REVIEW: { bg: '#C7D2FE', border: '#8B5CF6', text: '#5B21B6' },
  BLOCKED: { bg: '#FEE2E2', border: '#EF4444', text: '#991B1B' },
  COMPLETED: { bg: '#D1FAE5', border: '#10B981', text: '#065F46' },
  CANCELLED: { bg: '#F3F4F6', border: '#6B7280', text: '#4B5563' },
  
  // Priority
  CRITICAL: { bg: '#DC2626', text: '#FFFFFF' },
  HIGH: { bg: '#F97316', text: '#FFFFFF' },
  MEDIUM: { bg: '#F59E0B', text: '#000000' },
  LOW: { bg: '#84CC16', text: '#000000' },
};
```

### 2.2 Workstream Colors

```typescript
const workstreamPalette = [
  { name: 'Blue', primary: '#3B82F6', light: '#DBEAFE', dark: '#1E40AF' },
  { name: 'Purple', primary: '#8B5CF6', light: '#EDE9FE', dark: '#5B21B6' },
  { name: 'Green', primary: '#10B981', light: '#D1FAE5', dark: '#065F46' },
  { name: 'Orange', primary: '#F59E0B', light: '#FEF3C7', dark: '#92400E' },
  { name: 'Pink', primary: '#EC4899', light: '#FCE7F3', dark: '#831843' },
  { name: 'Teal', primary: '#14B8A6', light: '#CCFBF1', dark: '#134E4A' },
  { name: 'Indigo', primary: '#6366F1', light: '#E0E7FF', dark: '#3730A3' },
  { name: 'Rose', primary: '#F43F5E', light: '#FFE4E6', dark: '#881337' },
];
```

### 2.3 Semantic Colors

```typescript
const semanticColors = {
  // Backgrounds
  bgPrimary: '#FFFFFF',
  bgSecondary: '#F9FAFB',
  bgTertiary: '#F3F4F6',
  
  // Borders
  borderLight: '#E5E7EB',
  borderDefault: '#D1D5DB',
  borderStrong: '#9CA3AF',
  
  // Text
  textPrimary: '#111827',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',
  textInverse: '#FFFFFF',
  
  // Interactive
  primary: '#3B82F6',
  primaryHover: '#2563EB',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#0EA5E9',
  
  // Focus
  focusRing: 'rgba(59, 130, 246, 0.5)',
};
```

---

## 3. Typography

### 3.1 Font Stack

```css
:root {
  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', monospace;
}

body {
  font-family: var(--font-sans);
  font-feature-settings: 'cv02', 'cv03', 'cv04';
}
```

### 3.2 Type Scale

```typescript
const typography = {
  // Display
  display: { fontSize: '57px', lineHeight: '64px', weight: 700 },
  headline: { fontSize: '45px', lineHeight: '52px', weight: 700 },
  title1: { fontSize: '36px', lineHeight: '44px', weight: 600 },
  title2: { fontSize: '28px', lineHeight: '36px', weight: 600 },
  title3: { fontSize: '22px', lineHeight: '28px', weight: 600 },
  
  // Body
  bodyLarge: { fontSize: '18px', lineHeight: '28px', weight: 400 },
  body: { fontSize: '14px', lineHeight: '20px', weight: 400 },
  bodySmall: { fontSize: '12px', lineHeight: '16px', weight: 400 },
  
  // Labels
  labelLarge: { fontSize: '14px', lineHeight: '20px', weight: 500 },
  label: { fontSize: '12px', lineHeight: '16px', weight: 500 },
  labelSmall: { fontSize: '11px', lineHeight: '14px', weight: 500 },
  
  // Code
  code: { fontSize: '13px', lineHeight: '20px', family: 'var(--font-mono)' },
};
```

---

## 4. Layout & Spacing

### 4.1 Grid System

```
Canvas Area (Infinite)
├── Grid snap: 8px base
├── Feature card width: 280px (35 grid units)
├── Feature card height: 160px (20 grid units)
└── Minimum spacing: 16px (2 grid units)

UI Chrome
├── Sidebar width: 280px (collapsed: 64px)
├── Inspector panel width: 360px
├── Header height: 56px
├── Toolbar height: 48px
└── Bottom bar height: 32px
```

### 4.2 Spacing Scale

```typescript
const spacing = {
  0: '0px',
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  5: '20px',
  6: '24px',
  7: '28px',
  8: '32px',
  9: '36px',
  10: '40px',
  12: '48px',
  14: '56px',
  16: '64px',
  20: '80px',
  24: '96px',
};
```

---

## 5. Component Specifications

### 5.1 Feature Card

```
┌────────────────────────────────────────────┐
│  🟦 Core Platform              ⋮ ⚙️       │  ← Header (draggable)
├────────────────────────────────────────────┤
│                                            │
│  User Authentication System                │  ← Title
│                                            │
│  Implement secure authentication with      │  ← Description (truncated)
│  OAuth, email, and wallet support          │
│                                            │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  100%     │  ← Progress bar
│                                            │
│  ┌──────────────────────────────────────┐  │
│  │ 📋 12 tasks  💬 4  📎 2              │  │  ← Metadata
│  └──────────────────────────────────────┘  │
│                                            │
│  ┌────┐ ┌────┐ ┌────┐                     │
│  │ AL │ │ HI │ │ 🎯 │  ← Status badges    │
│  └────┘ └────┘ └────┘                     │
│                                            │
└────────────────────────────────────────────┘
     └─ Dependency connectors (4 sides)
```

**Component Props:**
```typescript
interface FeatureCardProps {
  feature: Feature;
  isSelected: boolean;
  isDragging: boolean;
  zoom: number;
  
  onSelect: (id: string) => void;
  onDragStart: (id: string) => void;
  onDragEnd: (id: string, position: Position) => void;
  onContextMenu: (id: string, position: Position) => void;
}
```

**Interactions:**
- Click: Select feature
- Drag: Reposition on canvas
- Right-click: Context menu
- Double-click: Open inspector
- Hover: Show connection points

### 5.2 Dependency Connector

```
Feature A ──────► Feature B
    │              ▲
    │    FS        │
    └──────────────┘

Legend:
─────►  : Standard dependency (FS)
◄─────► : Bidirectional dependency
- - -►  : Lag/Lead time
═══►    : Critical path
```

**Visual States:**
```typescript
const connectorStates = {
  default: { stroke: '#9CA3AF', strokeWidth: 2, dash: 'none' },
  hovered: { stroke: '#3B82F6', strokeWidth: 3, dash: 'none' },
  selected: { stroke: '#3B82F6', strokeWidth: 3, dash: '5,5' },
  critical: { stroke: '#EF4444', strokeWidth: 4, dash: 'none' },
  blocked: { stroke: '#F59E0B', strokeWidth: 2, dash: '8,4' },
};
```

### 5.3 Workstream Container

```
┌─────────────────────────────────────────────────────────────┐
│  ╔═══════════════════════════════════════════════════════╗  │
│  ║  🟦 Core Platform                              ⋮ ⚙️   ║  │  ← Header
│  ╠═══════════════════════════════════════════════════════╣  │
│  ║                                                       ║  │
│  ║   ┌────────────┐    ┌────────────┐                   ║  │
│  ║   │  Feature 1 │───►│  Feature 2 │                   ║  │
│  ║   └────────────┘    └────────────┘                   ║  │
│  ║                                                       ║  │
│  ║   ┌────────────┐    ┌────────────┐                   ║  │
│  ║   │  Feature 3 │    │  Feature 4 │                   ║  │
│  ║   └────────────┘    └────────────┘                   ║  │
│  ║                                                       ║  │
│  ║                    [+ Add Feature]                    ║  │
│  ╚═══════════════════════════════════════════════════════╝  │
│                                                             │
│  Progress: ████████████░░░░░░░░  65%  |  8/13 features     │
└─────────────────────────────────────────────────────────────┘
```

### 5.4 Canvas Toolbar

```
┌─────────────────────────────────────────────────────────────────┐
│  VIVIM Roadmap Hub                                              │
│  ─────────────────────────────────────────────────────────────  │
│  [☰] [📁 Roadmap ▼] [✏️ Edit] [👁️ View ▼] [➕ Add ▼]           │
│                                                                 │
│  [↶ Undo] [↷ Redo]  │  [🔍─] [100%] [🔍+]  │  [📐 Grid ▼]     │
│                                                                 │
│  View: [◉ Canvas] [○ Gantt] [○ Kanban] [○ Timeline]            │
│                                                                 │
│  Filter: [Status ▼] [Priority ▼] [Workstream ▼] [🔍 Search...] │
│                                                                 │
│            [📤 Export ▼]  [⚙️ Settings]  [👤 User]             │
└─────────────────────────────────────────────────────────────────┘
```

### 5.5 Sidebar Navigation

```
Collapsed (64px)          Expanded (280px)
┌────────┐                ┌──────────────────────────┐
│   🏠   │                │  🏠  Roadmaps            │
│   📊   │                │  ─────────────────────   │
│   🗂️   │                │  📊  All Roadmaps       │
│   👥   │                │  🗂️  Workstreams        │
│   ⚙️   │                │  📅  Timeline           │
│        │                │  👥  Team               │
│        │                │  ─────────────────────   │
│        │                │  ⚙️  Settings           │
└────────┘                └──────────────────────────┘
```

### 5.6 Inspector Panel

```
┌─────────────────────────────────────┐
│  User Authentication        [✕]     │  ← Close
├─────────────────────────────────────┤
│                                     │
│  Status: [In Progress ▼]            │
│  Priority: [High ▼]                 │
│  Effort: [Medium ▼]                 │
│                                     │
│  ─────────────────────────────────  │
│                                     │
│  📅 Timeline                        │
│  Start: [2026-01-15]                │
│  End:   [2026-03-30]                │
│                                     │
│  Progress: [━━━━━━●━━━━] 65%       │
│                                     │
│  ─────────────────────────────────  │
│                                     │
│  📋 Tasks (12)              [+ Add] │
│  ┌──────────────────────────────┐  │
│  │ ☐ Setup OAuth providers      │  │
│  │ ☑ Implement JWT auth         │  │
│  │ ☐ Add rate limiting          │  │
│  │ ☐ Write tests                │  │
│  └──────────────────────────────┘  │
│                                     │
│  ─────────────────────────────────  │
│                                     │
│  🔗 Dependencies            [+ Add] │
│  ┌──────────────────────────────┐  │
│  │ ← Database Schema (FS)       │  │
│  │ → User Profile (FS)          │  │
│  └──────────────────────────────┘  │
│                                     │
│  ─────────────────────────────────  │
│                                     │
│  🤖 AI Insights                     │
│  ┌──────────────────────────────┐  │
│  │ ⚠️ Risk: Tight deadline      │  │
│  │ 💡 Suggestion: Add buffer    │  │
│  │ 📊 Code: 78% complete        │  │
│  └──────────────────────────────┘  │
│                                     │
│  ─────────────────────────────────  │
│                                     │
│  💬 Comments (4)                    │
│  [Type a comment...]         [Send] │
│                                     │
└─────────────────────────────────────┘
```

### 5.7 Gantt Chart View

```
┌─────────────────────────────────────────────────────────────────────┐
│  Gantt View                                                         │
│  ─────────────────────────────────────────────────────────────────  │
│  Timescale: [◉ Week] [○ Month] [○ Quarter]  |  [◀ Prev] [Next ▶]   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Core Platform           ████████████████████░░░░░░  65%           │
│  ├─ User Auth           ██████████████████████████  100%  ✓        │
│  ├─ Database Schema     ████████████████████░░░░░░  75%            │
│  └─ API Gateway         ████████░░░░░░░░░░░░░░░░░░  30%            │
│                                                                     │
│  AI Features               ░░░░████████████████████  40%           │
│  ├─ Memory Engine         ████████████░░░░░░░░░░░░  50%            │
│  └─ Chat Integration      ░░░░░░░░████████████████  25%            │
│                                                                     │
│  ─────────────────────────────────────────────────────────────────  │
│  Jan 2026  │  Feb 2026  │  Mar 2026  │  Apr 2026  │  May 2026     │
│                                                                     │
│  Legend: █ Planned  █ In Progress  █ Complete  ◄─► Dependency      │
└─────────────────────────────────────────────────────────────────────┘
```

### 5.8 Kanban Board

```
┌─────────────────────────────────────────────────────────────────────┐
│  Kanban Board                                                       │
│  ─────────────────────────────────────────────────────────────────  │
│  Group by: [Status ▼]  |  Show: [All Workstreams ▼]                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐              │
│  │ BACKLOG  │ │ PLANNED  │ │IN PROGRESS│ │ COMPLETED│              │
│  ├──────────┤ ├──────────┤ ├──────────┤ ├──────────┤              │
│  │          │ │          │ │          │ │          │              │
│  │ ┌──────┐ │ │ ┌──────┐ │ │ ┌──────┐ │ │ ┌──────┐ │              │
│  │ │Feat  │ │ │ │Feat  │ │ │ │Feat  │ │ │ │Feat  │ │              │
│  │ │  5   │ │ │ │  3   │ │ │ │  1   │ │ │ │  2   │ │              │
│  │ └──────┘ │ │ └──────┘ │ │ └──────┘ │ │ └──────┘ │              │
│  │          │ │          │ │          │ │          │              │
│  │ ┌──────┐ │ │ ┌──────┐ │ │ ┌──────┐ │ │          │              │
│  │ │Feat  │ │ │ │Feat  │ │ │ │Feat  │ │ │          │              │
│  │ │  6   │ │ │ │  4   │ │ │ │  7   │ │ │          │              │
│  │ └──────┘ │ │ └──────┘ │ │ └──────┘ │ │          │              │
│  │          │ │          │ │          │ │          │              │
│  │   [+]    │ │   [+]    │ │   [+]    │ │          │              │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘              │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 5.9 AI Insights Panel

```
┌─────────────────────────────────────┐
│  🤖 AI Analysis              [⟳]    │  ← Refresh
├─────────────────────────────────────┤
│                                     │
│  Project Health                     │
│  ┌──────────────────────────────┐  │
│  │      ████████░░  82/100      │  │
│  │      Good condition          │  │
│  └──────────────────────────────┘  │
│                                     │
│  ─────────────────────────────────  │
│                                     │
│  ⚠️ Identified Risks (3)            │
│  ┌──────────────────────────────┐  │
│  │ 🔴 High                      │  │
│  │ Feature X has tight deadline │  │
│  │ Impact: 2 week delay         │  │
│  │ [View mitigation]            │  │
│  ├──────────────────────────────┤  │
│  │ 🟡 Medium                    │  │
│  │ Cross-team dependency        │  │
│  │ Impact: Potential blocker    │  │
│  │ [View mitigation]            │  │
│  └──────────────────────────────┘  │
│                                     │
│  ─────────────────────────────────  │
│                                     │
│  💡 Suggestions                     │
│  ┌──────────────────────────────┐  │
│  │ Consider moving Feature Y    │  │
│  │ to next sprint               │  │
│  │ [Apply suggestion]           │  │
│  ├──────────────────────────────┤  │
│  │ Add 2 more tasks to complete │  │
│  │ Authentication module        │  │
│  │ [Generate tasks]             │  │
│  └──────────────────────────────┘  │
│                                     │
│  ─────────────────────────────────  │
│                                     │
│  📊 Code Activity                   │
│  ┌──────────────────────────────┐  │
│  │ Commits: 156 this week       │  │
│  │ Files changed: 47            │  │
│  │ Lines added: +2,341          │  │
│  │ Lines removed: -892          │  │
│  └──────────────────────────────┘  │
│                                     │
│  Last analysis: 2 hours ago         │
│  [Run new analysis]                 │
│                                     │
└─────────────────────────────────────┘
```

---

## 6. Interaction Patterns

### 6.1 Drag & Drop

```typescript
// Feature repositioning
const handleDrag = {
  onStart: (featureId, initialPosition) => {
    showGhostCard(featureId);
    highlightDropZones();
  },
  onDrag: (featureId, currentPosition, delta) => {
    updateGhostPosition(currentPosition);
    showConnectionPreview();
  },
  onEnd: (featureId, finalPosition) => {
    hideGhostCard();
    savePosition(featureId, finalPosition);
    showUndoToast();
  },
};
```

### 6.2 Multi-Select

```typescript
// Selection modes
const selectionModes = {
  single: 'Click feature',
  multi: 'Shift + Click (add to selection)',
  range: 'Click + Drag (lasso select)',
  all: 'Cmd/Ctrl + A',
  clear: 'Escape or click canvas',
};
```

### 6.3 Keyboard Shortcuts

```typescript
const keyboardShortcuts = {
  // Navigation
  'Cmd+K': 'Open command palette',
  'Cmd+P': 'Quick search features',
  'Cmd+0': 'Reset zoom',
  'Cmd+/': 'Toggle sidebar',
  
  // Editing
  'Enter': 'Edit selected feature',
  'Delete': 'Delete selected',
  'Cmd+D': 'Duplicate selected',
  'Cmd+S': 'Save changes',
  
  // Selection
  'Escape': 'Clear selection',
  'Cmd+A': 'Select all',
  'Cmd+Shift+A': 'Deselect all',
  
  // View
  'Space + Drag': 'Pan canvas',
  'Scroll': 'Zoom in/out',
  'Cmd+=': 'Zoom in',
  'Cmd+-': 'Zoom out',
  
  // Undo/Redo
  'Cmd+Z': 'Undo',
  'Cmd+Shift+Z': 'Redo',
};
```

### 6.4 Context Menus

```
Right-click on Feature:
┌────────────────────────┐
│ ✏️ Edit Feature        │
│ 📋 View Tasks          │
│ 🔗 Add Dependency      │
│ ────────────────────── │
│ 📎 Add Attachment      │
│ 💬 Add Comment         │
│ ────────────────────── │
│ 📊 View Analytics      │
│ 🤖 AI Insights         │
│ ────────────────────── │
│ 🗑️ Delete Feature      │
└────────────────────────┘

Right-click on Canvas:
┌────────────────────────┐
│ ➕ Add Feature Here    │
│ 🗂️ Add Workstream      │
│ ────────────────────── │
│ 📐 Grid Settings       │
│ 🎨 Theme Settings      │
│ ────────────────────── │
│ 📤 Export View         │
└────────────────────────┘
```

---

## 7. Animation Specifications

### 7.1 Timing Functions

```typescript
const animations = {
  // Duration
  fast: '150ms',
  normal: '300ms',
  slow: '500ms',
  
  // Easing
  easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
  easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
  spring: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  
  // Presets
  fadeIn: {
    from: { opacity: 0 },
    to: { opacity: 1 },
    duration: '300ms',
    easing: 'easeOut',
  },
  slideUp: {
    from: { opacity: 0, y: 20 },
    to: { opacity: 1, y: 0 },
    duration: '300ms',
    easing: 'easeOut',
  },
  scaleIn: {
    from: { opacity: 0, scale: 0.95 },
    to: { opacity: 1, scale: 1 },
    duration: '200ms',
    easing: 'easeOut',
  },
};
```

### 7.2 Micro-interactions

| Action | Animation | Duration |
|--------|-----------|----------|
| Hover card | Scale 1.02, shadow | 150ms |
| Select feature | Border pulse, scale 1.01 | 200ms |
| Complete task | Checkmark draw, fade | 400ms |
| Add dependency | Line draw animation | 300ms |
| Delete | Fade out, scale down | 200ms |
| Drag start | Lift shadow, scale 1.05 | 150ms |
| Drop | Settle bounce | 200ms |

---

## 8. Responsive Design

### 8.1 Breakpoints

```typescript
const breakpoints = {
  sm: '640px',   // Mobile landscape
  md: '768px',   // Tablet
  lg: '1024px',  // Small desktop
  xl: '1280px',  // Desktop
  '2xl': '1536px', // Large desktop
};
```

### 8.2 Adaptive Layouts

```
Mobile (< 768px):
┌─────────────────┐
│ Header          │
├─────────────────┤
│ Canvas (full)   │
│                 │
├─────────────────┤
│ Bottom Nav      │
└─────────────────┘

Tablet (768px - 1024px):
┌─────────────────────────┐
│ Header                  │
├───────────┬─────────────┤
│ Sidebar   │ Canvas      │
│ (collaps.)│             │
└───────────┴─────────────┘

Desktop (> 1024px):
┌─────────────────────────────────────┐
│ Header                              │
├───────┬───────────────────┬─────────┤
│Sidebar│ Canvas            │Inspector│
│       │                   │         │
└───────┴───────────────────┴─────────┘
```

---

## 9. Accessibility

### 9.1 WCAG 2.1 AA Compliance

| Requirement | Implementation |
|-------------|----------------|
| **Color Contrast** | Minimum 4.5:1 for text, 3:1 for UI components |
| **Keyboard Navigation** | All interactive elements focusable |
| **Focus Indicators** | 2px blue ring with 2px offset |
| **Screen Reader Support** | ARIA labels, live regions |
| **Reduced Motion** | Respect prefers-reduced-motion |

### 9.2 ARIA Labels

```typescript
const ariaLabels = {
  featureCard: (feature: Feature) => ({
    role: 'article',
    'aria-label': `${feature.title}, ${feature.status}, ${feature.progress}% complete`,
    'aria-describedby': `feature-${feature.id}-desc`,
  }),
  dependencyLine: (dep: Dependency) => ({
    role: 'link',
    'aria-label': `Dependency from ${dep.fromFeature.title} to ${dep.toFeature.title}`,
  }),
  canvas: {
    role: 'application',
    'aria-label': 'Roadmap canvas. Use arrow keys to pan, scroll to zoom',
  },
};
```

---

## 10. Component Library Structure

```
src/components/
├── ui/                          # Base UI components
│   ├── Button/
│   ├── Input/
│   ├── Select/
│   ├── Modal/
│   ├── Tooltip/
│   └── ...
├── canvas/                      # Canvas-specific components
│   ├── Canvas.tsx
│   ├── FeatureCard.tsx
│   ├── WorkstreamContainer.tsx
│   ├── DependencyLine.tsx
│   ├── ConnectionHandle.tsx
│   └── Minimap.tsx
├── views/                       # View mode components
│   ├── GanttView/
│   ├── KanbanBoard/
│   ├── TimelineView/
│   └── ListView/
├── panels/                      # Side panels
│   ├── Sidebar.tsx
│   ├── InspectorPanel.tsx
│   ├── AIInsightsPanel.tsx
│   └── FilterPanel.tsx
├── toolbar/                     # Top toolbar
│   ├── MainToolbar.tsx
│   ├── ViewSwitcher.tsx
│   └── ZoomControls.tsx
├── dialogs/                     # Modal dialogs
│   ├── FeatureDialog.tsx
│   ├── DependencyDialog.tsx
│   └── ExportDialog.tsx
└── shared/                      # Shared components
    ├── ProgressBar.tsx
    ├── StatusBadge.tsx
    ├── PriorityIcon.tsx
    └── Avatar.tsx
```

---

## 11. Design Files & Assets

### 11.1 Figma Organization

```
VIVIM Roadmap Hub/
├── 🎨 Foundations/
│   ├── Colors
│   ├── Typography
│   ├── Grid & Layout
│   └── Icons
├── 🧩 Components/
│   ├── Atoms (buttons, inputs)
│   ├── Molecules (cards, lists)
│   └── Organisms (panels, views)
├── 📐 Patterns/
│   ├── Canvas Interactions
│   ├── Drag & Drop
│   └── Context Menus
├── 🖼️ Screens/
│   ├── Canvas View
│   ├── Gantt View
│   ├── Kanban View
│   └── Settings
└── 🔬 Prototypes/
    ├── Onboarding Flow
    ├── Feature Creation
    └── Dependency Management
```

### 11.2 Icon Set

Using Lucide React icons:
- Features: `Square`, `Circle`, `Triangle`
- Status: `CheckCircle`, `Clock`, `AlertCircle`, `XCircle`
- Actions: `Plus`, `Edit`, `Trash`, `Copy`, `Link`
- Navigation: `Home`, `Folder`, `Settings`, `Users`
- Views: `LayoutGrid`, `BarChart3`, `Columns`, `Calendar`

---

**Document Version**: 1.0  
**Last Updated**: 2026-03-27  
**Status**: Ready for Design Review
