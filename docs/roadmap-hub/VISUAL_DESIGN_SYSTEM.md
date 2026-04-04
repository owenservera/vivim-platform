# VIVIM Roadmap Hub - Visual Design System

## Overview

This document defines the complete visual design system for VIVIM Roadmap Hub, based on the tree-based roadmap visualization model with a central timeline spine.

---

## 1. Design Philosophy

### Core Concept: Tree-Based Roadmap

Your roadmap follows a **vertical timeline spine** metaphor:

```
                    ┌─────────────────────────────────┐
                    │         ROADMAP TITLE           │
                    └─────────────────────────────────┘
                                    │
                    ═══════════════════════════════════  ← Timeline Spine
                                    │ ════════════════  ← Workstream 1 (Complete)
                                    ├───────────────●   ← Feature 1.1
                                    │           ●───────  ← Feature 1.2
                                    │       ●───────────  ← Feature 1.3
                                    │
                    ═══════════════════════════════════  ← Workstream 2 (In Progress)
                                    │ ●─────────────────  ← Feature 2.1
                                    │     ●─────────────  ← Feature 2.2
                                    │         ●─────────  ← Feature 2.3
                                    │
                                    ├───────────────────  ← Fork Point (parallel paths)
                                    │ ════════════════  ← Workstream 3A
                                    │ ════════════════  ← Workstream 3B
                                    │
                    ═══════════════════════════════════  ← Workstream 4 (Planned)
                                    │
                                    ●───────────────────  ← Objective/Milestone
                                    │
                                    ▼
                          (Continues downward)
```

### Design Principles

| Principle | Description | Application |
|-----------|-------------|-------------|
| **Vertical Flow** | Time flows top-to-bottom | Timeline spine, workstream ordering |
| **Branching Structure** | Features branch from workstreams | Tree visualization |
| **Clear Hierarchy** | Roadmap → Workstream → Feature → Task | Indentation, sizing |
| **Visual Continuity** | Connected elements show relationships | Dependency lines, color coding |
| **Progressive Disclosure** | Show complexity gradually | Zoom levels, expand/collapse |

---

## 2. Timeline Spine Design

### Central Timeline

The **timeline spine** is the central organizing element:

```typescript
const timelineSpine = {
  // Visual Properties
  width: 4,
  color: '#3B82F6',  // Primary blue
  style: 'solid',     // or 'dashed' for future
  
  // Gradient for progress
  gradient: {
    completed: '#10B981',  // Green
    inProgress: '#F59E0B', // Yellow
    planned: '#3B82F6',    // Blue
  },
  
  // Tick marks
  ticks: {
    major: { width: 2, length: 16, interval: 'quarter' },
    minor: { width: 1, length: 8, interval: 'month' },
  },
  
  // Labels
  labels: {
    position: 'right',
    offset: 24,
    fontSize: 12,
    format: 'Q1 2026',
  },
};
```

### Visual Representation

```
┌─────────────────────────────────────────┐
│  Q1 2026                                │
│  ═══════════════════════════════════    │
│  Jan  │  Feb  │  Mar                   │
│  │    │    │                           │
│  ├────┴────┴────────────────────────    │
│  │                                      │
│  Q2 2026                                │
│  ═══════════════════════════════════    │
│  Apr  │  May  │  Jun                   │
│  │    │    │                           │
└─────────────────────────────────────────┘
```

---

## 3. Workstream Visualization

### Workstream Branch

Workstreams branch off from the timeline spine:

```typescript
const workstreamDesign = {
  // Container
  container: {
    width: 320,
    minHeight: 120,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'var(--workstream-color)',
    backgroundColor: 'var(--workstream-color-light)',
  },
  
  // Connection to spine
  connector: {
    width: 3,
    color: 'var(--workstream-color)',
    style: 'solid',  // or 'dashed' for dependencies
    curve: 'smooth',
  },
  
  // Header
  header: {
    height: 40,
    backgroundColor: 'var(--workstream-color)',
    textColor: '#FFFFFF',
    fontSize: 14,
    fontWeight: 600,
  },
  
  // Progress indicator
  progress: {
    type: 'bar',  // or 'ring', 'line'
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.3)',
    fillColor: '#FFFFFF',
  },
};
```

### Workstream States

```
┌─────────────────────────────────────────┐
│  🗂️  Core Platform           ✅ 100%   │  ← Complete (Green)
├─────────────────────────────────────────┤
│  ████████████████████████████████       │
│  ┌──────────────────────────────────┐  │
│  │  ✨ User Authentication          │  │
│  │  ✨ Database Schema              │  │
│  │  ✨ API Gateway                  │  │
│  └──────────────────────────────────┘  │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  🗂️  AI Features             🟡 65%    │  ← In Progress (Yellow)
├─────────────────────────────────────────┤
│  ████████████████░░░░░░░░░░░░░░░        │
│  ┌──────────────────────────────────┐  │
│  │  ✨ Memory Engine         [●]    │  │
│  │  ✨ Chat Integration      [○]    │  │
│  └──────────────────────────────────┘  │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  🗂️  Mobile App            🔵 Planned  │  ← Planned (Blue)
├─────────────────────────────────────────┤
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░        │
│  ┌──────────────────────────────────┐  │
│  │  📱 iOS App               [ ]    │  │
│  │  📱 Android App           [ ]    │  │
│  └──────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

### Workstream Hierarchy

Sub-workstreams create nested branches:

```
Timeline Spine
    │
    ├─ Workstream 1 (Parent)
    │   │
    │   ├─ Sub-Workstream 1.1
    │   │   └─ Features...
    │   │
    │   └─ Sub-Workstream 1.2
    │       └─ Features...
    │
    └─ Workstream 2 (Parent)
        └─ ...
```

**Visual Indentation:**
```
🗂️  Core Platform                    [Parent - Full width]
    🗂️  Backend Services             [Child - Indented 20px]
        🗂️  API Layer                [Grandchild - Indented 40px]
```

---

## 4. Feature Visualization

### Feature Nodes

Features branch from workstreams as nodes:

```typescript
const featureDesign = {
  // Card
  card: {
    width: 280,
    height: 160,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'var(--status-color)',
    backgroundColor: '#FFFFFF',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  
  // Connection line to workstream
  connector: {
    width: 2,
    color: 'var(--status-color)',
    style: 'solid',
    curve: 'bezier',
  },
  
  // Node (connection point)
  node: {
    radius: 6,
    fillColor: 'var(--status-color)',
    strokeColor: '#FFFFFF',
    strokeWidth: 2,
  },
};
```

### Feature Card Design

```
┌─────────────────────────────────────────┐
│  ✨ User Authentication        🔴 HIGH  │  ← Header
├─────────────────────────────────────────┤
│                                         │
│  Implement secure authentication with   │  ← Description
│  OAuth, email, and wallet support       │
│                                         │
│  ████████████████████████░░░░  75%     │  ← Progress
│                                         │
│  ┌────────────────────────────────────┐ │
│  │ 📋 12 tasks  💬 4  📎 2  🔗 3     │ │  ← Metadata
│  └────────────────────────────────────┘ │
│                                         │
│  [🟡 In Progress]  [👤 John D.]        │  ← Footer
└─────────────────────────────────────────┘
     │
     ├─ Connection to workstream
     ├─ Dependency lines to other features
     └─ Sub-feature branches
```

### Feature States

```typescript
const featureStates = {
  // Status colors
  backlog: { border: '#9CA3AF', node: '#9CA3AF', line: '#D1D5DB' },
  planned: { border: '#6366F1', node: '#6366F1', line: '#A5B4FC' },
  in_progress: { border: '#F59E0B', node: '#F59E0B', line: '#FCD34D' },
  in_review: { border: '#8B5CF6', node: '#8B5CF6', line: '#C4B5FD' },
  blocked: { border: '#EF4444', node: '#EF4444', line: '#FCA5A5', pattern: 'dashed' },
  completed: { border: '#10B981', node: '#10B981', line: '#6EE7B7' },
  cancelled: { border: '#6B7280', node: '#6B7280', line: '#9CA3AF', opacity: 0.5 },
};
```

### Feature Branching

Features can have sub-features that branch further:

```
Workstream
    │
    ├─ Feature 1
    │   │
    │   ├─ Sub-Feature 1.1
    │   └─ Sub-Feature 1.2
    │
    ├─ Feature 2
    │   │
    │   ├─ Sub-Feature 2.1
    │   │   └─ Sub-Sub-Feature 2.1.1
    │   └─ Sub-Feature 2.2
    │
    └─ Feature 3
```

**Visual Representation:**
```
        ┌─ Feature 1.1
    ┌─┤
    │   └─ Feature 1.2
────┤
    │   ┌─ Feature 2.1
    └─┤
        ─ Feature 2.2
```

---

## 5. Dependency Visualization

### Dependency Line Types

```typescript
const dependencyLines = {
  // Finish-to-Start (most common)
  FS: {
    style: 'solid',
    arrow: 'end',
    label: 'FS',
    color: '#6B7280',
  },
  
  // Start-to-Start
  SS: {
    style: 'dashed',
    dashPattern: '4,4',
    arrow: 'end',
    label: 'SS',
    color: '#6B7280',
  },
  
  // Finish-to-Finish
  FF: {
    style: 'dotted',
    dotPattern: '2,4',
    arrow: 'end',
    label: 'FF',
    color: '#6B7280',
  },
  
  // Start-to-Finish (rare)
  SF: {
    style: 'solid',
    arrow: 'start',
    label: 'SF',
    color: '#6B7280',
  },
};
```

### Visual Representation

```
Feature A ──────────────► Feature B
    │                       ▲
    │    FS (Finish-to-Start)
    └───────────────────────┘

Feature C ─ ─  ─ ─ ─  ─ ► Feature D
    │                       ▲
    │    SS (Start-to-Start, dashed)
    └───────────────────────┘

Feature E ═════════════════► Feature F
    │                       ▲
    │    Critical Path (thick, red)
    └───────────────────────┘
```

### Dependency States

```
Normal:
  ─────►  (gray, 2px)

Hovered:
  ─────►  (blue, 3px, glow)

Selected:
  ─  ─ ►  (blue, 3px, dashed)

Critical:
  ═══════►  (red, 4px)

Blocked:
  ─ / ─ / ─►  (orange, 2px, dashed with slashes)

Circular (Error):
  ◄──────►  (red, circular arrow, warning icon)
```

### Cross-Workstream Dependencies

Dependencies that cross workstream boundaries:

```
Workstream 1
    │
    ├─ Feature 1.1 ─ ─  ─ ─ ─  ─ ─ ─ ─ ┐
    │                                     │
    └─ Feature 1.2                        │
                                          │  (cross-workstream line)
Workstream 2                              │
    │                                     │
    ├─ Feature 2.1 ◄ ─  ─ ─ ─  ─ ─  ─ ┘
    │
    └─ Feature 2.2
```

**Visual Styling:**
- Use curved bezier paths
- Different color (purple) for cross-workstream
- Label with workstream name
- Show in minimap

---

## 6. Fork Points & Parallel Paths

### Fork Visualization

Fork points represent where workstreams split into parallel paths:

```typescript
const forkDesign = {
  // Fork node
  node: {
    shape: 'circle',
    radius: 12,
    fillColor: '#FFFFFF',
    strokeColor: '#3B82F6',
    strokeWidth: 3,
    icon: '🔀',
  },
  
  // Branch lines
  branches: {
    width: 3,
    color: '#3B82F6',
    style: 'solid',
    curve: 'smooth',
  },
  
  // Label
  label: {
    position: 'left',
    backgroundColor: '#3B82F6',
    textColor: '#FFFFFF',
    fontSize: 11,
    padding: 4,
    borderRadius: 4,
  },
};
```

### Visual Representation

```
                    Timeline Spine
                         │
                         │
                    ┌────┴────
                    │  FORK   │  ← Fork label
                    │  🔀     │
                    └────┬────┘
                         │
            ┌────────────┴────────────┐
            │                         │
      ═══════════════           ═══════════════
      Workstream A                 Workstream B
      (Parallel Path 1)           (Parallel Path 2)
            │                         │
      Features...               Features...
```

### Merge Points

Where parallel paths converge:

```
            Workstream A                 Workstream B
                  │                         │
                  │                         │
                  └────────────┬────────────
                               │
                         ┌─────┴─────┐
                         │  MERGE    │
                         │  🔗       │
                         └─────┬─────┘
                               │
                         Milestone
```

---

## 7. Objective & Milestone Markers

### Objective Markers

Objectives align with workstreams:

```typescript
const objectiveDesign = {
  // Marker
  marker: {
    shape: 'circle',
    radius: 10,
    fillColor: '#8B5CF6',  // Purple
    strokeColor: '#FFFFFF',
    strokeWidth: 2,
    icon: '🎯',
  },
  
  // Connection line
  line: {
    width: 2,
    color: '#8B5CF6',
    style: 'dashed',
    dashPattern: '4,4',
  },
  
  // Label
  label: {
    position: 'right',
    backgroundColor: '#8B5CF6',
    textColor: '#FFFFFF',
    fontSize: 12,
    padding: '4,8',
    borderRadius: 4,
  },
};
```

### Visual Representation

```
Timeline Spine
    │
    ═══════════════════════════  Workstream
    │               │
    │               ├─────── 🎯 Objective 1
    │               │        "Increase performance"
    │               │
    │               ├─────── 🎯 Objective 2
    │               │        "Reduce latency by 50%"
    │               │
    Features...
```

### Milestone Markers

Milestones mark significant points on the timeline:

```typescript
const milestoneDesign = {
  // Marker on timeline
  marker: {
    shape: 'diamond',
    size: 16,
    fillColor: '#F59E0B',  // Amber
    strokeColor: '#FFFFFF',
    strokeWidth: 2,
  },
  
  // Flag (for major milestones)
  flag: {
    height: 24,
    color: '#F59E0B',
    labelColor: '#FFFFFF',
  },
};
```

### Visual Representation

```
Timeline Spine
    │
    ◆  Milestone 1 (diamond marker)
    │  "Alpha Release"
    │
    ═══════════════════════════
    │
    🚩 Milestone 2 (flag marker)
    │  "Public Launch"
    │
```

---

## 8. Progress Indicators

### Workstream Progress

```typescript
const progressIndicators = {
  // Bar style (most common)
  bar: {
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(0,0,0,0.1)',
    fillColor: 'var(--status-color)',
  },
  
  // Ring style (for compact views)
  ring: {
    size: 24,
    strokeWidth: 3,
    backgroundColor: 'rgba(0,0,0,0.1)',
    fillColor: 'var(--status-color)',
  },
  
  // Dots style (for minimal views)
  dots: {
    count: 5,
    size: 6,
    spacing: 4,
    fillColor: 'var(--status-color)',
    emptyColor: 'rgba(0,0,0,0.1)',
  },
};
```

### Visual States

```
0%:       ░░░░░░░░░░░░░░░░░░░░  (empty)
25%:      ████░░░░░░░░░░░░░░░░  (quarter)
50%:      ██████████░░░░░░░░░░  (half)
75%:      ████████████████░░░░  (three quarters)
100%:     ████████████████████  (complete)
```

### Completion States

```
Not Started:
  ────────────────────────  (gray, empty)

In Progress:
  ████████████░░░░░░░░░░░░  (colored, partial)

Complete:
  ████████████████████████ ✅  (green, full, checkmark)

Blocked:
  ─ / ─ / ─ / ─ / ─ / ─ / ─  (orange, dashed with slashes)

Overdue:
  ████████░░░░░░░░░░ ⚠️  (red, pulsing warning)
```

---

## 9. Zoom Levels & Detail

### Level 1: Overview (Zoomed Out)

Shows entire roadmap structure:

```
┌─────────────────────────────────────────┐
│  ROADMAP TITLE                          │
│  ═══════════════════════════════════    │
│                                         │
│  🗂️ WS1  ████░░░░░░░░░░░░░░░░  45%    │
│  🗂️ WS2  ████████████░░░░░░░░  65%    │
│  🗂️ WS3  ░░░░░░░░░░░░░░░░░░░░   0%    │
│  🗂️ WS4  ████████████████████ 100% ✅  │
│                                         │
│  Timeline: Q1───────Q2───────Q3────Q4  │
└─────────────────────────────────────────┘
```

**Visible:**
- Workstream names
- Progress bars
- Timeline quarters
- Major milestones

### Level 2: Medium (Default View)

Shows features within workstreams:

```
┌─────────────────────────────────────────┐
│  🗂️  Core Platform           65%       │
│  ████████████████░░░░░░░░░░░░░░░        │
│  ┌──────────────────────────────────┐  │
│  │  ✨ User Auth          [████75%] │  │
│  │  ✨ Database Schema    [███░50%] │  │
│  │  ✨ API Gateway        [█░░░25%] │  │
│  └──────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

**Visible:**
- Feature names
- Feature progress
- Status indicators
- Dependency counts

### Level 3: Detail (Zoomed In)

Shows tasks and full attribute details:

```
┌─────────────────────────────────────────┐
│  ✨ User Authentication        🔴 HIGH  │
│  ─────────────────────────────────────  │
│  Status: In Progress                    │
│  Progress: ████████████████░░░░  75%   │
│  Due: Mar 30, 2026 (5 days left)        │
│  Assignee: 👤 John Doe                  │
│  ─────────────────────────────────────  │
│  📋 Tasks:                              │
│  ☑ Setup OAuth providers                │
│  ☑ Implement JWT auth                   │
│  ☐ Add rate limiting                    │
│  ☐ Write tests                          │
│  ─────────────────────────────────────  │
│  🔗 Dependencies:                       │
│  ← Database Schema (FS)                 │
│  → User Profile (FS)                    │
└─────────────────────────────────────────┘
```

**Visible:**
- All attributes
- Task list
- Full dependency details
- Comments, attachments

---

## 10. Color System

### Timeline Spine Colors

```typescript
const timelineColors = {
  // Progress-based gradient
  completed: '#10B981',    // Green
  inProgress: '#F59E0B',   // Yellow/Amber
  planned: '#3B82F6',      // Blue
  
  // Quarter markers
  past: '#6B7280',         // Gray
  current: '#3B82F6',      // Blue (highlighted)
  future: '#D1D5DB',       // Light gray
};
```

### Workstream Colors

8 distinct colors for workstream differentiation:

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

### Status Color Mapping

```typescript
const statusColors = {
  // Feature/Task Status
  backlog: { primary: '#9CA3AF', light: '#F3F4F6', dark: '#4B5563' },
  discovered: { primary: '#0EA5E9', light: '#E0F2FE', dark: '#075985' },
  planned: { primary: '#6366F1', light: '#E0E7FF', dark: '#3730A3' },
  in_progress: { primary: '#F59E0B', light: '#FEF3C7', dark: '#92400E' },
  in_review: { primary: '#8B5CF6', light: '#DDD6FE', dark: '#5B21B6' },
  blocked: { primary: '#EF4444', light: '#FEE2E2', dark: '#991B1B' },
  completed: { primary: '#10B981', light: '#D1FAE5', dark: '#065F46' },
  cancelled: { primary: '#6B7280', light: '#F3F4F6', dark: '#4B5563' },
};
```

### Priority Color Mapping

```typescript
const priorityColors = {
  critical: { bg: '#DC2626', text: '#FFFFFF', border: '#991B1B' },
  high: { bg: '#F97316', text: '#FFFFFF', border: '#C2410C' },
  medium: { bg: '#F59E0B', text: '#000000', border: '#B45309' },
  low: { bg: '#84CC16', text: '#000000', border: '#4D7C0F' },
};
```

---

## 11. Typography System

### Font Hierarchy

```typescript
const typography = {
  // Roadmap Title
  roadmapTitle: {
    fontSize: 28,
    fontWeight: 700,
    lineHeight: 1.2,
    letterSpacing: '-0.02em',
  },
  
  // Workstream Name
  workstreamName: {
    fontSize: 14,
    fontWeight: 600,
    lineHeight: 1.4,
  },
  
  // Feature Title
  featureTitle: {
    fontSize: 14,
    fontWeight: 600,
    lineHeight: 1.3,
  },
  
  // Body Text
  body: {
    fontSize: 13,
    fontWeight: 400,
    lineHeight: 1.5,
  },
  
  // Metadata
  metadata: {
    fontSize: 12,
    fontWeight: 400,
    lineHeight: 1.4,
    color: '#6B7280',
  },
  
  // Labels & Badges
  label: {
    fontSize: 11,
    fontWeight: 500,
    lineHeight: 1.2,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
};
```

---

## 12. Animation & Motion

### Transition Durations

```typescript
const animations = {
  // Fast interactions
  fast: '150ms',
  
  // Standard transitions
  normal: '300ms',
  
  // Slow, deliberate animations
  slow: '500ms',
  
  // Easing functions
  easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
  spring: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
};
```

### Animated Elements

| Element | Animation | Duration | Trigger |
|---------|-----------|----------|---------|
| **Expand workstream** | Height + fade | 300ms | Click |
| **Progress bar** | Width transition | 500ms | Update |
| **Status change** | Color pulse | 400ms | Status update |
| **New feature** | Scale + fade in | 400ms | Creation |
| **Dependency line** | Draw animation | 500ms | Creation |
| **Complete task** | Check draw + fade | 600ms | Completion |

---

## 13. Responsive Behavior

### Desktop (> 1280px)

- Full tree visualization
- All detail visible
- Side-by-side panels

### Tablet (768px - 1280px)

- Collapsed workstreams by default
- Horizontal scrolling for timeline
- Bottom sheet for details

### Mobile (< 768px)

- List view instead of tree
- Simplified progress indicators
- Full-screen detail views

---

**Document Version**: 1.0  
**Last Updated**: 2026-03-27  
**Status**: Ready for Implementation
