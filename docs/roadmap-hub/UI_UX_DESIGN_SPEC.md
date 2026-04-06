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
â”œâ”€â”€ Workstream boundaries visible
â”œâ”€â”€ Feature density apparent
â””â”€â”€ Status colors prominent

Level 2: Feature Details (Medium Zoom)
â”œâ”€â”€ Feature cards readable
â”œâ”€â”€ Dependency lines clear
â””â”€â”€ Progress indicators visible

Level 3: Task Details (Zoomed In)
â”œâ”€â”€ Individual tasks visible
â”œâ”€â”€ Detailed metadata shown
â””â”€â”€ Inline editing available
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
â”œâ”€â”€ Grid snap: 8px base
â”œâ”€â”€ Feature card width: 280px (35 grid units)
â”œâ”€â”€ Feature card height: 160px (20 grid units)
â””â”€â”€ Minimum spacing: 16px (2 grid units)

UI Chrome
â”œâ”€â”€ Sidebar width: 280px (collapsed: 64px)
â”œâ”€â”€ Inspector panel width: 360px
â”œâ”€â”€ Header height: 56px
â”œâ”€â”€ Toolbar height: 48px
â””â”€â”€ Bottom bar height: 32px
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
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚  ðŸŸ¦ Core Platform              â‹® âš™ï¸       â”‚  â† Header (draggable)
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚                                            â”‚
â”‚  User Authentication System                â”‚  â† Title
â”‚                                            â”‚
â”‚  Implement secure authentication with      â”‚  â† Description (truncated)
â”‚  OAuth, email, and wallet support          â”‚
â”‚                                            â”‚
â”‚  â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”  100%     â”‚  â† Progress bar
â”‚                                            â”‚
â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”  â”‚
â”‚  â”‚ ðŸ“‹ 12 tasks  ðŸ’¬ 4  ðŸ“Ž 2              â”‚  â”‚  â† Metadata
â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜  â”‚
â”‚                                            â”‚
â”‚  â”Œâ”€â”€â”€â”€â” â”Œâ”€â”€â”€â”€â” â”Œâ”€â”€â”€â”€â”                     â”‚
â”‚  â”‚ AL â”‚ â”‚ HI â”‚ â”‚ ðŸŽ¯ â”‚  â† Status badges    â”‚
â”‚  â””â”€â”€â”€â”€â”˜ â””â”€â”€â”€â”€â”˜ â””â”€â”€â”€â”€â”˜                     â”‚
â”‚                                            â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
     â””â”€ Dependency connectors (4 sides)
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
Feature A â”€â”€â”€â”€â”€â”€â–º Feature B
    â”‚              â–²
    â”‚    FS        â”‚
    â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜

Legend:
â”€â”€â”€â”€â”€â–º  : Standard dependency (FS)
â—„â”€â”€â”€â”€â”€â–º : Bidirectional dependency
- - -â–º  : Lag/Lead time
â•â•â•â–º    : Critical path
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
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚  â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—  â”‚
â”‚  â•‘  ðŸŸ¦ Core Platform                              â‹® âš™ï¸   â•‘  â”‚  â† Header
â”‚  â• â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•£  â”‚
â”‚  â•‘                                                       â•‘  â”‚
â”‚  â•‘   â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”    â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”                   â•‘  â”‚
â”‚  â•‘   â”‚  Feature 1 â”‚â”€â”€â”€â–ºâ”‚  Feature 2 â”‚                   â•‘  â”‚
â”‚  â•‘   â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜    â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜                   â•‘  â”‚
â”‚  â•‘                                                       â•‘  â”‚
â”‚  â•‘   â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”    â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”                   â•‘  â”‚
â”‚  â•‘   â”‚  Feature 3 â”‚    â”‚  Feature 4 â”‚                   â•‘  â”‚
â”‚  â•‘   â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜    â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜                   â•‘  â”‚
â”‚  â•‘                                                       â•‘  â”‚
â”‚  â•‘                    [+ Add Feature]                    â•‘  â”‚
â”‚  â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•  â”‚
â”‚                                                             â”‚
â”‚  Progress: â–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–‘â–‘â–‘â–‘â–‘â–‘â–‘â–‘  65%  |  8/13 features     â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

### 5.4 Canvas Toolbar

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚  VIVIM Roadmap Hub                                              â”‚
â”‚  â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€  â”‚
â”‚  [â˜°] [ðŸ“ Roadmap â–¼] [âœï¸ Edit] [ðŸ‘ï¸ View â–¼] [âž• Add â–¼]           â”‚
â”‚                                                                 â”‚
â”‚  [â†¶ Undo] [â†· Redo]  â”‚  [ðŸ”â”€] [100%] [ðŸ”+]  â”‚  [ðŸ“ Grid â–¼]     â”‚
â”‚                                                                 â”‚
â”‚  View: [â—‰ Canvas] [â—‹ Gantt] [â—‹ Kanban] [â—‹ Timeline]            â”‚
â”‚                                                                 â”‚
â”‚  Filter: [Status â–¼] [Priority â–¼] [Workstream â–¼] [ðŸ” Search...] â”‚
â”‚                                                                 â”‚
â”‚            [ðŸ“¤ Export â–¼]  [âš™ï¸ Settings]  [ðŸ‘¤ User]             â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

### 5.5 Sidebar Navigation

```
Collapsed (64px)          Expanded (280px)
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”                â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚   ðŸ    â”‚                â”‚  ðŸ   Roadmaps            â”‚
â”‚   ðŸ“Š   â”‚                â”‚  â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€   â”‚
â”‚   ðŸ—‚ï¸   â”‚                â”‚  ðŸ“Š  All Roadmaps       â”‚
â”‚   ðŸ‘¥   â”‚                â”‚  ðŸ—‚ï¸  Workstreams        â”‚
â”‚   âš™ï¸   â”‚                â”‚  ðŸ“…  Timeline           â”‚
â”‚        â”‚                â”‚  ðŸ‘¥  Team               â”‚
â”‚        â”‚                â”‚  â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€   â”‚
â”‚        â”‚                â”‚  âš™ï¸  Settings           â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”˜                â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

### 5.6 Inspector Panel

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚  User Authentication        [âœ•]     â”‚  â† Close
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚                                     â”‚
â”‚  Status: [In Progress â–¼]            â”‚
â”‚  Priority: [High â–¼]                 â”‚
â”‚  Effort: [Medium â–¼]                 â”‚
â”‚                                     â”‚
â”‚  â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€  â”‚
â”‚                                     â”‚
â”‚  ðŸ“… Timeline                        â”‚
â”‚  Start: [2026-01-15]                â”‚
â”‚  End:   [2026-03-30]                â”‚
â”‚                                     â”‚
â”‚  Progress: [â”â”â”â”â”â”â—â”â”â”â”] 65%       â”‚
â”‚                                     â”‚
â”‚  â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€  â”‚
â”‚                                     â”‚
â”‚  ðŸ“‹ Tasks (12)              [+ Add] â”‚
â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”  â”‚
â”‚  â”‚ â˜ Setup OAuth providers      â”‚  â”‚
â”‚  â”‚ â˜‘ Implement JWT auth         â”‚  â”‚
â”‚  â”‚ â˜ Add rate limiting          â”‚  â”‚
â”‚  â”‚ â˜ Write tests                â”‚  â”‚
â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜  â”‚
â”‚                                     â”‚
â”‚  â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€  â”‚
â”‚                                     â”‚
â”‚  ðŸ”— Dependencies            [+ Add] â”‚
â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”  â”‚
â”‚  â”‚ â† Database Schema (FS)       â”‚  â”‚
â”‚  â”‚ â†’ User Profile (FS)          â”‚  â”‚
â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜  â”‚
â”‚                                     â”‚
â”‚  â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€  â”‚
â”‚                                     â”‚
â”‚  ðŸ¤– AI Insights                     â”‚
â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”  â”‚
â”‚  â”‚ âš ï¸ Risk: Tight deadline      â”‚  â”‚
â”‚  â”‚ ðŸ’¡ Suggestion: Add buffer    â”‚  â”‚
â”‚  â”‚ ðŸ“Š Code: 78% complete        â”‚  â”‚
â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜  â”‚
â”‚                                     â”‚
â”‚  â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€  â”‚
â”‚                                     â”‚
â”‚  ðŸ’¬ Comments (4)                    â”‚
â”‚  [Type a comment...]         [Send] â”‚
â”‚                                     â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

### 5.7 Gantt Chart View

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚  Gantt View                                                         â”‚
â”‚  â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€  â”‚
â”‚  Timescale: [â—‰ Week] [â—‹ Month] [â—‹ Quarter]  |  [â—€ Prev] [Next â–¶]   â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚                                                                     â”‚
â”‚  Core Platform           â–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–‘â–‘â–‘â–‘â–‘â–‘  65%           â”‚
â”‚  â”œâ”€ User Auth           â–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆ  100%  âœ“        â”‚
â”‚  â”œâ”€ Database Schema     â–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–‘â–‘â–‘â–‘â–‘â–‘  75%            â”‚
â”‚  â””â”€ API Gateway         â–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–‘â–‘â–‘â–‘â–‘â–‘â–‘â–‘â–‘â–‘â–‘â–‘â–‘â–‘â–‘â–‘â–‘â–‘  30%            â”‚
â”‚                                                                     â”‚
â”‚  AI Features               â–‘â–‘â–‘â–‘â–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆ  40%           â”‚
â”‚  â”œâ”€ Memory Engine         â–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–‘â–‘â–‘â–‘â–‘â–‘â–‘â–‘â–‘â–‘â–‘â–‘  50%            â”‚
â”‚  â””â”€ Chat Integration      â–‘â–‘â–‘â–‘â–‘â–‘â–‘â–‘â–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆ  25%            â”‚
â”‚                                                                     â”‚
â”‚  â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€  â”‚
â”‚  Jan 2026  â”‚  Feb 2026  â”‚  Mar 2026  â”‚  Apr 2026  â”‚  May 2026     â”‚
â”‚                                                                     â”‚
â”‚  Legend: â–ˆ Planned  â–ˆ In Progress  â–ˆ Complete  â—„â”€â–º Dependency      â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

### 5.8 Kanban Board

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚  Kanban Board                                                       â”‚
â”‚  â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€  â”‚
â”‚  Group by: [Status â–¼]  |  Show: [All Workstreams â–¼]                â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚                                                                     â”‚
â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â” â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â” â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â” â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”              â”‚
â”‚  â”‚ BACKLOG  â”‚ â”‚ PLANNED  â”‚ â”‚IN PROGRESSâ”‚ â”‚ COMPLETEDâ”‚              â”‚
â”‚  â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤ â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤ â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤ â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤              â”‚
â”‚  â”‚          â”‚ â”‚          â”‚ â”‚          â”‚ â”‚          â”‚              â”‚
â”‚  â”‚ â”Œâ”€â”€â”€â”€â”€â”€â” â”‚ â”‚ â”Œâ”€â”€â”€â”€â”€â”€â” â”‚ â”‚ â”Œâ”€â”€â”€â”€â”€â”€â” â”‚ â”‚ â”Œâ”€â”€â”€â”€â”€â”€â” â”‚              â”‚
â”‚  â”‚ â”‚Feat  â”‚ â”‚ â”‚ â”‚Feat  â”‚ â”‚ â”‚ â”‚Feat  â”‚ â”‚ â”‚ â”‚Feat  â”‚ â”‚              â”‚
â”‚  â”‚ â”‚  5   â”‚ â”‚ â”‚ â”‚  3   â”‚ â”‚ â”‚ â”‚  1   â”‚ â”‚ â”‚ â”‚  2   â”‚ â”‚              â”‚
â”‚  â”‚ â””â”€â”€â”€â”€â”€â”€â”˜ â”‚ â”‚ â””â”€â”€â”€â”€â”€â”€â”˜ â”‚ â”‚ â””â”€â”€â”€â”€â”€â”€â”˜ â”‚ â”‚ â””â”€â”€â”€â”€â”€â”€â”˜ â”‚              â”‚
â”‚  â”‚          â”‚ â”‚          â”‚ â”‚          â”‚ â”‚          â”‚              â”‚
â”‚  â”‚ â”Œâ”€â”€â”€â”€â”€â”€â” â”‚ â”‚ â”Œâ”€â”€â”€â”€â”€â”€â” â”‚ â”‚ â”Œâ”€â”€â”€â”€â”€â”€â” â”‚ â”‚          â”‚              â”‚
â”‚  â”‚ â”‚Feat  â”‚ â”‚ â”‚ â”‚Feat  â”‚ â”‚ â”‚ â”‚Feat  â”‚ â”‚ â”‚          â”‚              â”‚
â”‚  â”‚ â”‚  6   â”‚ â”‚ â”‚ â”‚  4   â”‚ â”‚ â”‚ â”‚  7   â”‚ â”‚ â”‚          â”‚              â”‚
â”‚  â”‚ â””â”€â”€â”€â”€â”€â”€â”˜ â”‚ â”‚ â””â”€â”€â”€â”€â”€â”€â”˜ â”‚ â”‚ â””â”€â”€â”€â”€â”€â”€â”˜ â”‚ â”‚          â”‚              â”‚
â”‚  â”‚          â”‚ â”‚          â”‚ â”‚          â”‚ â”‚          â”‚              â”‚
â”‚  â”‚   [+]    â”‚ â”‚   [+]    â”‚ â”‚   [+]    â”‚ â”‚          â”‚              â”‚
â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜ â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜ â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜ â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜              â”‚
â”‚                                                                     â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

### 5.9 AI Insights Panel

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚  ðŸ¤– AI Analysis              [âŸ³]    â”‚  â† Refresh
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚                                     â”‚
â”‚  Project Health                     â”‚
â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”  â”‚
â”‚  â”‚      â–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–‘â–‘  82/100      â”‚  â”‚
â”‚  â”‚      Good condition          â”‚  â”‚
â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜  â”‚
â”‚                                     â”‚
â”‚  â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€  â”‚
â”‚                                     â”‚
â”‚  âš ï¸ Identified Risks (3)            â”‚
â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”  â”‚
â”‚  â”‚ ðŸ”´ High                      â”‚  â”‚
â”‚  â”‚ Feature X has tight deadline â”‚  â”‚
â”‚  â”‚ Impact: 2 week delay         â”‚  â”‚
â”‚  â”‚ [View mitigation]            â”‚  â”‚
â”‚  â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤  â”‚
â”‚  â”‚ ðŸŸ¡ Medium                    â”‚  â”‚
â”‚  â”‚ Cross-team dependency        â”‚  â”‚
â”‚  â”‚ Impact: Potential blocker    â”‚  â”‚
â”‚  â”‚ [View mitigation]            â”‚  â”‚
â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜  â”‚
â”‚                                     â”‚
â”‚  â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€  â”‚
â”‚                                     â”‚
â”‚  ðŸ’¡ Suggestions                     â”‚
â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”  â”‚
â”‚  â”‚ Consider moving Feature Y    â”‚  â”‚
â”‚  â”‚ to next sprint               â”‚  â”‚
â”‚  â”‚ [Apply suggestion]           â”‚  â”‚
â”‚  â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤  â”‚
â”‚  â”‚ Add 2 more tasks to complete â”‚  â”‚
â”‚  â”‚ Authentication module        â”‚  â”‚
â”‚  â”‚ [Generate tasks]             â”‚  â”‚
â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜  â”‚
â”‚                                     â”‚
â”‚  â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€  â”‚
â”‚                                     â”‚
â”‚  ðŸ“Š Code Activity                   â”‚
â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”  â”‚
â”‚  â”‚ Commits: 156 this week       â”‚  â”‚
â”‚  â”‚ Files changed: 47            â”‚  â”‚
â”‚  â”‚ Lines added: +2,341          â”‚  â”‚
â”‚  â”‚ Lines removed: -892          â”‚  â”‚
â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜  â”‚
â”‚                                     â”‚
â”‚  Last analysis: 2 hours ago         â”‚
â”‚  [Run new analysis]                 â”‚
â”‚                                     â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
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
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ âœï¸ Edit Feature        â”‚
â”‚ ðŸ“‹ View Tasks          â”‚
â”‚ ðŸ”— Add Dependency      â”‚
â”‚ â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ â”‚
â”‚ ðŸ“Ž Add Attachment      â”‚
â”‚ ðŸ’¬ Add Comment         â”‚
â”‚ â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ â”‚
â”‚ ðŸ“Š View Analytics      â”‚
â”‚ ðŸ¤– AI Insights         â”‚
â”‚ â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ â”‚
â”‚ ðŸ—‘ï¸ Delete Feature      â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜

Right-click on Canvas:
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ âž• Add Feature Here    â”‚
â”‚ ðŸ—‚ï¸ Add Workstream      â”‚
â”‚ â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ â”‚
â”‚ ðŸ“ Grid Settings       â”‚
â”‚ ðŸŽ¨ Theme Settings      â”‚
â”‚ â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ â”‚
â”‚ ðŸ“¤ Export View         â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
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
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ Header          â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚ Canvas (full)   â”‚
â”‚                 â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚ Bottom Nav      â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜

Tablet (768px - 1024px):
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ Header                  â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚ Sidebar   â”‚ Canvas      â”‚
â”‚ (collaps.)â”‚             â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜

Desktop (> 1024px):
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ Header                              â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚Sidebarâ”‚ Canvas            â”‚Inspectorâ”‚
â”‚       â”‚                   â”‚         â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
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
â”œâ”€â”€ ui/                          # Base UI components
â”‚   â”œâ”€â”€ Button/
â”‚   â”œâ”€â”€ Input/
â”‚   â”œâ”€â”€ Select/
â”‚   â”œâ”€â”€ Modal/
â”‚   â”œâ”€â”€ Tooltip/
â”‚   â””â”€â”€ ...
â”œâ”€â”€ canvas/                      # Canvas-specific components
â”‚   â”œâ”€â”€ Canvas.tsx
â”‚   â”œâ”€â”€ FeatureCard.tsx
â”‚   â”œâ”€â”€ WorkstreamContainer.tsx
â”‚   â”œâ”€â”€ DependencyLine.tsx
â”‚   â”œâ”€â”€ ConnectionHandle.tsx
â”‚   â””â”€â”€ Minimap.tsx
â”œâ”€â”€ views/                       # View mode components
â”‚   â”œâ”€â”€ GanttView/
â”‚   â”œâ”€â”€ KanbanBoard/
â”‚   â”œâ”€â”€ TimelineView/
â”‚   â””â”€â”€ ListView/
â”œâ”€â”€ panels/                      # Side panels
â”‚   â”œâ”€â”€ Sidebar.tsx
â”‚   â”œâ”€â”€ InspectorPanel.tsx
â”‚   â”œâ”€â”€ AIInsightsPanel.tsx
â”‚   â””â”€â”€ FilterPanel.tsx
â”œâ”€â”€ toolbar/                     # Top toolbar
â”‚   â”œâ”€â”€ MainToolbar.tsx
â”‚   â”œâ”€â”€ ViewSwitcher.tsx
â”‚   â””â”€â”€ ZoomControls.tsx
â”œâ”€â”€ dialogs/                     # Modal dialogs
â”‚   â”œâ”€â”€ FeatureDialog.tsx
â”‚   â”œâ”€â”€ DependencyDialog.tsx
â”‚   â””â”€â”€ ExportDialog.tsx
â””â”€â”€ shared/                      # Shared components
    â”œâ”€â”€ ProgressBar.tsx
    â”œâ”€â”€ StatusBadge.tsx
    â”œâ”€â”€ PriorityIcon.tsx
    â””â”€â”€ Avatar.tsx
```

---

## 11. Design Files & Assets

### 11.1 Figma Organization

```
VIVIM Roadmap Hub/
â”œâ”€â”€ ðŸŽ¨ Foundations/
â”‚   â”œâ”€â”€ Colors
â”‚   â”œâ”€â”€ Typography
â”‚   â”œâ”€â”€ Grid & Layout
â”‚   â””â”€â”€ Icons
â”œâ”€â”€ ðŸ§© Components/
â”‚   â”œâ”€â”€ Atoms (buttons, inputs)
â”‚   â”œâ”€â”€ Molecules (cards, lists)
â”‚   â””â”€â”€ Organisms (panels, views)
â”œâ”€â”€ ðŸ“ Patterns/
â”‚   â”œâ”€â”€ Canvas Interactions
â”‚   â”œâ”€â”€ Drag & Drop
â”‚   â””â”€â”€ Context Menus
â”œâ”€â”€ ðŸ–¼ï¸ Screens/
â”‚   â”œâ”€â”€ Canvas View
â”‚   â”œâ”€â”€ Gantt View
â”‚   â”œâ”€â”€ Kanban View
â”‚   â””â”€â”€ Settings
â””â”€â”€ ðŸ”¬ Prototypes/
    â”œâ”€â”€ Onboarding Flow
    â”œâ”€â”€ Feature Creation
    â””â”€â”€ Dependency Management
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
