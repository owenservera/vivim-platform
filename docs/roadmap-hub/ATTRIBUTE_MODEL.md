# VIVIM Roadmap Hub - Comprehensive Attribute Model

## Overview

This document defines the complete attribute model for all roadmap objects. Every entity has a comprehensive set of trackable attributes with visual representations, supporting both minimal and detailed tracking modes.

---

## Design Philosophy

### Attribute Categories

| Category | Purpose | Examples |
|----------|---------|----------|
| **Core** | Essential identification | ID, name, description |
| **Temporal** | Time-related | Dates, duration, milestones |
| **Status** | Progress & state | Status, progress, completion |
| **Priority** | Importance ranking | Priority, effort, value |
| **Relational** | Connections | Dependencies, parent-child |
| **Descriptive** | Context & detail | Tags, notes, metadata |
| **Ownership** | Responsibility | Assignee, reporter, stakeholders |
| **Quality** | Health & risk | Confidence, risk score, health |
| **Custom** | User-defined | Custom fields, extensions |

### Progressive Disclosure

```
Level 1: Essential (Always Visible)
├── Name
├── Status
└── Progress

Level 2: Standard (On Hover/Expand)
├── Dates
├── Priority
├── Assignee
└── Dependencies

Level 3: Comprehensive (Inspector Panel)
├── All attributes
├── History
├── Metadata
└── Custom fields
```

---

## 1. Roadmap Attributes

### Core Attributes

| Attribute | Type | Required | Default | Visual Representation |
|-----------|------|----------|---------|----------------------|
| `id` | UUID | Yes | Auto | Hidden (internal) |
| `name` | String (100) | Yes | - | **Title text**, 24px, bold |
| `description` | Text | No | null | Subtitle, 14px, gray |
| `colorScheme` | Enum | No | blue | Color theme swatch |
| `icon` | String | No | 📊 | Icon glyph (16px) |
| `version` | String | No | 1.0 | Badge (top-right) |

### Temporal Attributes

| Attribute | Type | Required | Default | Visual Representation |
|-----------|------|----------|---------|----------------------|
| `startDate` | Date | No | null | 📅 Calendar icon + date |
| `endDate` | Date | No | null | 🏁 Flag icon + date |
| `duration` | Calculated | No | - | Timeline bar length |
| `quarters` | Array | No | [] | Q1│Q2│Q3│Q4 markers |
| `fiscalYear` | Number | No | 2026 | FY26 badge |

### Status Attributes

| Attribute | Type | Required | Default | Visual Representation |
|-----------|------|----------|---------|----------------------|
| `status` | Enum | Yes | active | ● Status dot (color-coded) |
| `isArchived` | Boolean | No | false | 📦 Archive icon (if true) |
| `isTemplate` | Boolean | No | false | 📋 Template badge |
| `visibility` | Enum | Yes | private | 🔒/🌍 icon |
| `healthScore` | Number (0-100) | No | - | Circular progress ring |

### Progress Attributes

| Attribute | Type | Required | Default | Visual Representation |
|-----------|------|----------|---------|----------------------|
| `overallProgress` | Number (0-100) | No | 0 | Progress bar (horizontal) |
| `featureCount` | Number | Calculated | 0 | 📋 Count badge |
| `completedFeatureCount` | Number | Calculated | 0 | ✅ Count badge |
| `workstreamCount` | Number | Calculated | 0 | 🗂️ Count badge |
| `milestoneCount` | Number | Calculated | 0 | 🎯 Count badge |

### Ownership Attributes

| Attribute | Type | Required | Default | Visual Representation |
|-----------|------|----------|---------|----------------------|
| `ownerId` | UUID | Yes | - | 👤 Avatar |
| `ownerName` | String | Derived | - | Name text |
| `members` | Array | No | [] | 👥 Avatar stack |
| `stakeholders` | Array | No | [] | 🎯 Avatar stack (outlined) |
| `teamId` | UUID | No | null | 🏢 Team badge |

### Quality Attributes

| Attribute | Type | Required | Default | Visual Representation |
|-----------|------|----------|---------|----------------------|
| `riskScore` | Number (0-100) | No | - | ⚠️ Risk meter |
| `confidenceLevel` | Number (0-100) | No | - | 🎯 Confidence ring |
| `lastUpdated` | DateTime | Auto | now | 🕐 "Updated X ago" |
| `dataQuality` | Enum | No | - | ★★★☆☆ rating |

### Custom Attributes

| Attribute | Type | Required | Default | Visual Representation |
|-----------|------|----------|---------|----------------------|
| `tags` | Array | No | [] | 🏷️ Tag pills |
| `customFields` | JSON | No | {} | Custom field widgets |
| `metadata` | JSON | No | {} | Hidden (internal) |
| `externalLinks` | Array | No | [] | 🔗 Link icons |

---

## 2. Workstream Attributes

### Core Attributes

| Attribute | Type | Required | Default | Visual Representation |
|-----------|------|----------|---------|----------------------|
| `id` | UUID | Yes | Auto | Hidden |
| `name` | String (100) | Yes | - | **Card title**, 16px, bold |
| `description` | Text | No | null | Card subtitle, 13px |
| `color` | Color | No | #3B82F6 | Background/border color |
| `icon` | String | No | 📁 | Icon glyph (14px) |
| `emoji` | String | No | - | Emoji (16px) |
| `code` | String (20) | No | - | WS-001 code badge |

### Hierarchical Attributes

| Attribute | Type | Required | Default | Visual Representation |
|-----------|------|----------|---------|----------------------|
| `parentId` | UUID | No | null | Tree indentation |
| `level` | Number | Calculated | 0 | Tree depth indicator |
| `path` | Array | Calculated | [] | Breadcrumb trail |
| `children` | Array | Calculated | [] | Expand/collapse arrow |
| `hasChildren` | Boolean | Calculated | false | ▶️ Arrow (if true) |
| `order` | Number | No | 0 | Vertical position |
| `sortOrder` | Number | No | 0 | Custom sort indicator |

### Temporal Attributes

| Attribute | Type | Required | Default | Visual Representation |
|-----------|------|----------|---------|----------------------|
| `startDate` | Date | No | null | 📅 Start marker |
| `endDate` | Date | No | null | 🏁 End marker |
| `targetDate` | Date | No | null | 🎯 Target flag (dashed) |
| `actualEndDate` | Date | No | null | ✅ Green check if on time |
| `duration` | Calculated | No | - | Timeline span |
| `quarter` | Enum | No | - | Q1/Q2/Q3/Q4 badge |

### Status Attributes

| Attribute | Type | Required | Default | Visual Representation |
|-----------|------|----------|---------|----------------------|
| `status` | Enum | Yes | planned | Status pill (color-coded) |
| `isComplete` | Boolean | No | false | ✅ Check or ○ Circle |
| `isOnHold` | Boolean | No | false | ⏸️ Pause icon |
| `isBlocked` | Boolean | No | false | 🚫 Block icon |
| `completionDate` | Date | No | null | 📅 Completion date |
| `completedBy` | String | No | null | 👤 Completer avatar |

### Progress Attributes

| Attribute | Type | Required | Default | Visual Representation |
|-----------|------|----------|---------|----------------------|
| `progress` | Number (0-100) | No | 0 | Progress bar (colored) |
| `progressTrend` | Enum | No | - | ↑↓→ Trend arrow |
| `featureCount` | Number | Calculated | 0 | Feature count |
| `completedFeatureCount` | Number | Calculated | 0 | Completed count |
| `taskCount` | Number | Calculated | 0 | Task count |
| `completedTaskCount` | Number | Calculated | 0 | Done task count |
| `milestoneCount` | Number | Calculated | 0 | Milestone count |
| `completedMilestoneCount` | Number | Calculated | 0 | Done milestone count |

### Priority & Effort Attributes

| Attribute | Type | Required | Default | Visual Representation |
|-----------|------|----------|---------|----------------------|
| `priority` | Enum | No | medium | Priority badge (color) |
| `effort` | Enum | No | medium | Effort dots (●●●○○) |
| `businessValue` | Enum | No | medium | Value stars (★★★☆☆) |
| `strategicAlignment` | Number (0-100) | No | - | Alignment meter |
| `investmentScore` | Number (0-10) | No | - | Investment bar |

### Dependency Attributes

| Attribute | Type | Required | Default | Visual Representation |
|-----------|------|----------|---------|----------------------|
| `dependencyCount` | Number | Calculated | 0 | 🔗 Count badge |
| `upstreamDependencyCount` | Number | Calculated | 0 | ↑ Count (incoming) |
| `downstreamDependencyCount` | Number | Calculated | 0 | ↓ Count (outgoing) |
| `crossWorkstreamDeps` | Number | Calculated | 0 | 🌐 Count (cross-team) |
| `hasCircularDependency` | Boolean | Calculated | false | ⚠️ Warning icon |
| `criticalPath` | Boolean | Calculated | false | 🔴 Red border if critical |

### Ownership Attributes

| Attribute | Type | Required | Default | Visual Representation |
|-----------|------|----------|---------|----------------------|
| `leadId` | UUID | No | null | 👤 Lead avatar |
| `leadName` | String | No | null | Name text |
| `assigneeIds` | Array | No | [] | 👥 Avatar stack |
| `teamId` | UUID | No | null | 🏢 Team badge |
| `department` | String | No | null | Dept pill |
| `stakeholders` | Array | No | [] | 🎯 Avatar stack |

### Resource Attributes

| Attribute | Type | Required | Default | Visual Representation |
|-----------|------|----------|---------|----------------------|
| `budget` | Number | No | null | 💰 Budget amount |
| `spentBudget` | Number | No | null | 💸 Spent amount |
| `budgetUtilization` | Number (0-100) | Calculated | - | Budget progress bar |
| `headcount` | Number | No | null | 👥 Headcount |
| `capacity` | Number (0-100) | No | - | Capacity gauge |
| `utilization` | Number (0-100) | No | - | Utilization bar |

### Quality Attributes

| Attribute | Type | Required | Default | Visual Representation |
|-----------|------|----------|---------|----------------------|
| `healthScore` | Number (0-100) | No | - | Health ring (color) |
| `riskScore` | Number (0-100) | No | - | Risk meter |
| `riskLevel` | Enum | Calculated | - | 🟢🟡🔴 Risk dot |
| `confidenceLevel` | Number (0-100) | No | - | Confidence ring |
| `qualityScore` | Number (0-100) | No | - | Quality stars |
| `techDebt` | Enum | No | - | 📉 Debt indicator |

### Custom Attributes

| Attribute | Type | Required | Default | Visual Representation |
|-----------|------|----------|---------|----------------------|
| `tags` | Array | No | [] | 🏷️ Tag pills |
| `objectives` | Array | No | [] | 🎯 Objective list |
| `keyResults` | Array | No | [] | 📊 KR list with progress |
| `customFields` | JSON | No | {} | Custom field widgets |
| `metadata` | JSON | No | {} | Hidden |
| `externalLinks` | Array | No | [] | 🔗 Link icons |
| `attachments` | Array | No | [] | 📎 Count badge |
| `comments` | Number | Calculated | 0 | 💬 Count badge |

---

## 3. Feature Attributes

### Core Attributes

| Attribute | Type | Required | Default | Visual Representation |
|-----------|------|----------|---------|----------------------|
| `id` | UUID | Yes | Auto | Hidden |
| `title` | String (150) | Yes | - | **Card title**, 14px, semibold |
| `description` | Text | No | null | Card body, 13px |
| `summary` | Text (500) | No | null | Tooltip preview |
| `type` | Enum | No | feature | Type icon (feature/bug/tech) |
| `icon` | String | No | - | Icon glyph (14px) |
| `emoji` | String | No | - | Emoji (16px) |
| `code` | String (20) | No | - | FEAT-001 code badge |
| `slug` | String | Auto | - | URL-friendly identifier |

### Visual Positioning Attributes

| Attribute | Type | Required | Default | Visual Representation |
|-----------|------|----------|---------|----------------------|
| `positionX` | Number | No | 0 | Canvas X coordinate |
| `positionY` | Number | No | 0 | Canvas Y coordinate |
| `zIndex` | Number | No | 0 | Layer order |
| `width` | Number | No | 280 | Card width (px) |
| `height` | Number | No | 160 | Card height (px) |
| `rotation` | Number | No | 0 | Rotation angle (degrees) |
| `isPinned` | Boolean | No | false | 📌 Pin icon |
| `isHidden` | Boolean | No | false | 👁️ Hidden (eye slash) |

### Temporal Attributes

| Attribute | Type | Required | Default | Visual Representation |
|-----------|------|----------|---------|----------------------|
| `startDate` | Date | No | null | 📅 Start marker |
| `endDate` | Date | No | null | 🏁 End marker |
| `targetDate` | Date | No | null | 🎯 Target flag |
| `dueDate` | Date | No | null | ⏰ Due date (red if overdue) |
| `actualStartDate` | Date | No | null | ✅ Actual start (green) |
| `actualEndDate` | Date | No | null | ✅ Actual end (green) |
| `completedAt` | Date | No | null | 🎉 Completion confetti |
| `duration` | Calculated | No | - | Timeline bar length |
| `remainingDays` | Calculated | No | - | "X days left" badge |
| `overdueDays` | Calculated | No | - | "X days overdue" (red) |

### Status Attributes

| Attribute | Type | Required | Default | Visual Representation |
|-----------|------|----------|---------|----------------------|
| `status` | Enum | Yes | backlog | Status pill (7 colors) |
| `isComplete` | Boolean | No | false | ✅ Check or ○ Circle |
| `isBlocked` | Boolean | No | false | 🚫 Block overlay |
| `blockReason` | String | No | null | ⚠️ Tooltip with reason |
| `isOnHold` | Boolean | No | false | ⏸️ Pause badge |
| `isArchived` | Boolean | No | false | 📦 Archive icon |
| `isReleased` | Boolean | No | false | 🚀 Release badge |
| `releaseVersion` | String | No | null | v1.0 version tag |

### Progress Attributes

| Attribute | Type | Required | Default | Visual Representation |
|-----------|------|----------|---------|----------------------|
| `progress` | Number (0-100) | No | 0 | Progress bar (colored) |
| `progressSource` | Enum | No | manual | 🤖 Auto / ✋ Manual badge |
| `taskCount` | Number | Calculated | 0 | 📋 Task count |
| `completedTaskCount` | Number | Calculated | 0 | ✅ Done count |
| `blockedTaskCount` | Number | Calculated | 0 | 🚫 Blocked count |
| `storyPoints` | Number | No | null | Story points (fibonacci) |
| `completedStoryPoints` | Number | Calculated | 0 | Completed SP |
| `acceptanceCriteriaCount` | Number | Calculated | 0 | ✓ Count |
| `passedAcceptanceCriteriaCount` | Number | Calculated | 0 | ✓✓ Passed count |

### Priority & Effort Attributes

| Attribute | Type | Required | Default | Visual Representation |
|-----------|------|----------|---------|----------------------|
| `priority` | Enum | No | medium | Priority badge (4 colors) |
| `effort` | Enum | No | medium | Effort size (XS-XL) |
| `businessValue` | Enum | No | medium | Value dots (●●●○○) |
| `urgency` | Enum | No | medium | Urgency meter |
| `impact` | Enum | No | medium | Impact stars |
| `confidence` | Enum | No | high | Confidence (H/M/L) |
| `riceScore` | Number | Calculated | - | RICE score badge |
| `wsjfScore` | Number | Calculated | - | WSJF score badge |

### Dependency Attributes

| Attribute | Type | Required | Default | Visual Representation |
|-----------|------|----------|---------|----------------------|
| `dependencyCount` | Number | Calculated | 0 | 🔗 Link count |
| `upstreamDependencies` | Array | Calculated | [] | ↑ Incoming arrows |
| `downstreamDependencies` | Array | Calculated | [] | ↓ Outgoing arrows |
| `dependencyType` | Enum | No | - | FS/SS/FF/SF badge |
| `hasCircularDependency` | Boolean | Calculated | false | ⚠️ Cycle warning |
| `isOnCriticalPath` | Boolean | Calculated | false | 🔴 Critical highlight |
| `blockingFeatureCount` | Number | Calculated | 0 | 🚫 Blocking count |
| `blockedByFeatureCount` | Number | Calculated | 0 |  Blocked by count |

### Ownership Attributes

| Attribute | Type | Required | Default | Visual Representation |
|-----------|------|----------|---------|----------------------|
| `reporterId` | UUID | No | null | 👤 Reporter avatar |
| `reporterName` | String | No | null | Name text |
| `assigneeIds` | Array | No | [] | 👥 Avatar stack (max 3) |
| `reviewerIds` | Array | No | [] | 👓 Reviewer avatars |
| `approverIds` | Array | No | [] | ✅ Approver avatars |
| `contributorIds` | Array | No | [] | 👥 Contributor avatars |
| `teamId` | UUID | No | null | 🏢 Team badge |

### Technical Attributes

| Attribute | Type | Required | Default | Visual Representation |
|-----------|------|----------|---------|----------------------|
| `component` | String | No | null | 🧩 Component badge |
| `technology` | Array | No | [] | ⚙️ Tech stack icons |
| `repository` | String | No | null | 📁 Repo link |
| `branch` | String | No | null | 🌿 Branch name |
| `pullRequestCount` | Number | Calculated | 0 | 🔀 PR count |
| `commitCount` | Number | Calculated | 0 | 💾 Commit count |
| `codeCompletion` | Number (0-100) | Calculated | - | Code progress bar |
| `testCoverage` | Number (0-100) | No | - | 🧪 Coverage badge |
| `techDebt` | Enum | No | - | 📉 Debt level |

### Quality Attributes

| Attribute | Type | Required | Default | Visual Representation |
|-----------|------|----------|---------|----------------------|
| `healthScore` | Number (0-100) | No | - | Health ring |
| `riskScore` | Number (0-100) | No | - | Risk meter |
| `riskLevel` | Enum | Calculated | - | 🟢🟡🔴 Risk dot |
| `qualityScore` | Number (0-100) | No | - | Quality stars |
| `stability` | Enum | No | - | Stability indicator |
| `complexity` | Enum | No | - | Complexity gauge |
| `aiConfidence` | Number (0-100) | No | - | 🤖 AI confidence |

### Custom Attributes

| Attribute | Type | Required | Default | Visual Representation |
|-----------|------|----------|---------|----------------------|
| `tags` | Array | No | [] | 🏷️ Tag pills (color) |
| `epic` | String | No | null | 📖 Epic link |
| `initiative` | String | No | null | 🎯 Initiative link |
| `theme` | String | No | null | 🎨 Theme badge |
| `customerImpact` | Enum | No | - | 👥 Impact level |
| `userStories` | Array | No | [] | 📝 Story list |
| `acceptanceCriteria` | Array | No | [] | ✓ Criteria checklist |
| `customFields` | JSON | No | {} | Custom field widgets |
| `metadata` | JSON | No | {} | Hidden |
| `externalLinks` | Array | No | [] | 🔗 Link icons |
| `attachments` | Array | No | [] | 📎 Attachment count |
| `comments` | Number | Calculated | 0 | 💬 Comment count |
| `views` | Number | Calculated | 0 | 👁️ View count |

---

## 4. Task Attributes

### Core Attributes

| Attribute | Type | Required | Default | Visual Representation |
|-----------|------|----------|---------|----------------------|
| `id` | UUID | Yes | Auto | Hidden |
| `title` | String (200) | Yes | - | Task title, 13px |
| `description` | Text | No | null | Task body, 12px |
| `type` | Enum | No | task | Type icon |
| `icon` | String | No | - | Icon (12px) |
| `code` | String (20) | No | - | TASK-001 code |

### Temporal Attributes

| Attribute | Type | Required | Default | Visual Representation |
|-----------|------|----------|---------|----------------------|
| `startDate` | Date | No | null | 📅 Start |
| `endDate` | Date | No | null | 🏁 End |
| `dueDate` | Date | No | null | ⏰ Due (red if overdue) |
| `estimatedHours` | Number | No | null | ⏱️ Estimate |
| `actualHours` | Number | No | null | ⏲️ Actual |
| `timeRemaining` | Number | No | null | ⏳ Remaining |
| `completedAt` | Date | No | null | ✅ Completion date |

### Status Attributes

| Attribute | Type | Required | Default | Visual Representation |
|-----------|------|----------|---------|----------------------|
| `status` | Enum | Yes | todo | Status pill |
| `isComplete` | Boolean | No | false | ☐ Checkbox |
| `isBlocked` | Boolean | No | false | 🚫 Block |
| `blockReason` | String | No | null | ⚠️ Reason |

### Progress Attributes

| Attribute | Type | Required | Default | Visual Representation |
|-----------|------|----------|---------|----------------------|
| `progress` | Number (0-100) | No | 0 | Mini progress bar |
| `order` | Number | No | 0 | Sequence number |
| `subtaskCount` | Number | Calculated | 0 | Subtask count |
| `completedSubtaskCount` | Number | Calculated | 0 | Done subtasks |

### Priority & Effort Attributes

| Attribute | Type | Required | Default | Visual Representation |
|-----------|------|----------|---------|----------------------|
| `priority` | Enum | No | medium | Priority dot |
| `effort` | Enum | No | - | Effort dots |
| `complexity` | Enum | No | - | Complexity (S/M/L/XL) |

### Ownership Attributes

| Attribute | Type | Required | Default | Visual Representation |
|-----------|------|----------|---------|----------------------|
| `assigneeId` | UUID | No | null | 👤 Assignee |
| `assigneeName` | String | No | null | Name |
| `reviewerId` | UUID | No | null | 👓 Reviewer |

### Custom Attributes

| Attribute | Type | Required | Default | Visual Representation |
|-----------|------|----------|---------|----------------------|
| `tags` | Array | No | [] | Tiny tags |
| `parentTaskId` | UUID | No | null | Parent link |
| `dependencyIds` | Array | No | [] | Dependency links |
| `attachments` | Array | No | [] | 📎 Count |
| `comments` | Number | Calculated | 0 | 💬 Count |

---

## 5. Milestone Attributes

### Core Attributes

| Attribute | Type | Required | Default | Visual Representation |
|-----------|------|----------|---------|----------------------|
| `id` | UUID | Yes | Auto | Hidden |
| `name` | String (100) | Yes | - | **Milestone name**, 15px |
| `description` | Text | No | null | Description |
| `icon` | String | No | 🎯 | Milestone icon |
| `type` | Enum | No | milestone | Type (milestone/release/event) |

### Temporal Attributes

| Attribute | Type | Required | Default | Visual Representation |
|-----------|------|----------|---------|----------------------|
| `targetDate` | Date | Yes | - | 🎯 Target date |
| `actualDate` | Date | No | null | ✅ Actual date |
| `isPastDue` | Boolean | Calculated | false | ⚠️ Overdue highlight |

### Status Attributes

| Attribute | Type | Required | Default | Visual Representation |
|-----------|------|----------|---------|----------------------|
| `status` | Enum | Yes | upcoming | Status (upcoming/achieved/missed) |
| `isAchieved` | Boolean | No | false | ✅ Check or ○ |
| `isCritical` | Boolean | No | false | 🔴 Critical highlight |

### Progress Attributes

| Attribute | Type | Required | Default | Visual Representation |
|-----------|------|----------|---------|----------------------|
| `linkedFeatureCount` | Number | Calculated | 0 | Features count |
| `completionCriteria` | Array | No | [] | Criteria checklist |
| `completedCriteriaCount` | Number | Calculated | 0 | Done criteria |

---

## 6. Dependency Attributes

### Core Attributes

| Attribute | Type | Required | Default | Visual Representation |
|-----------|------|----------|---------|----------------------|
| `id` | UUID | Yes | Auto | Hidden |
| `fromId` | UUID | Yes | - | Source entity |
| `toId` | UUID | Yes | - | Target entity |
| `fromType` | Enum | Yes | feature | Entity type icon |
| `toType` | Enum | Yes | feature | Entity type icon |

### Relationship Attributes

| Attribute | Type | Required | Default | Visual Representation |
|-----------|------|----------|---------|----------------------|
| `type` | Enum | Yes | FS | FS/SS/FF/SF badge |
| `lag` | Number | No | 0 | Lag indicator (days) |
| `lead` | Number | No | 0 | Lead indicator (days) |
| `strength` | Enum | No | normal | Line thickness |

### Status Attributes

| Attribute | Type | Required | Default | Visual Representation |
|-----------|------|----------|---------|----------------------|
| `status` | Enum | Calculated | active | Dependency status |
| `isBlocking` | Boolean | Calculated | false | 🚫 Block indicator |
| `isAtRisk` | Boolean | Calculated | false | ⚠️ Risk highlight |
| `isBroken` | Boolean | Calculated | false | 💔 Broken link |

### Custom Attributes

| Attribute | Type | Required | Default | Visual Representation |
|-----------|------|----------|---------|----------------------|
| `description` | Text | No | null | Description |
| `notes` | Text | No | null | Notes |

---

## 7. Enum Definitions

### Status Enums

```typescript
enum RoadmapStatus {
  ACTIVE = 'active',
  PLANNING = 'planning',
  ON_HOLD = 'on_hold',
  COMPLETED = 'completed',
  ARCHIVED = 'archived'
}

enum WorkstreamStatus {
  PLANNED = 'planned',
  IN_PROGRESS = 'in_progress',
  ON_HOLD = 'on_hold',
  BLOCKED = 'blocked',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

enum FeatureStatus {
  BACKLOG = 'backlog',
  DISCOVERED = 'discovered',
  PLANNED = 'planned',
  IN_PROGRESS = 'in_progress',
  IN_REVIEW = 'in_review',
  BLOCKED = 'blocked',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  RELEASED = 'released'
}

enum TaskStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in_progress',
  IN_REVIEW = 'in_review',
  BLOCKED = 'blocked',
  DONE = 'done',
  CANCELLED = 'cancelled'
}
```

### Priority Enums

```typescript
enum Priority {
  CRITICAL = 'critical',  // Red (#EF4444)
  HIGH = 'high',          // Orange (#F97316)
  MEDIUM = 'medium',      // Yellow (#F59E0B)
  LOW = 'low'             // Green (#84CC16)
}

enum EffortSize {
  XSMALL = 'xsmall',      // XS
  SMALL = 'small',        // S
  MEDIUM = 'medium',      // M
  LARGE = 'large',        // L
  XLARGE = 'xlarge',      // XL
  MEGALARGE = 'megalarge' // XXL
}

enum RiskLevel {
  LOW = 'low',            // Green
  MEDIUM = 'medium',      // Yellow
  HIGH = 'high',          // Orange
  CRITICAL = 'critical'   // Red
}
```

---

## 8. Visual Design System

### Color Coding by Status

```typescript
const statusColors = {
  // Roadmap Status
  active: { bg: '#DCFCE7', border: '#22C55E', text: '#166534' },
  planning: { bg: '#DBEAFE', border: '#3B82F6', text: '#1E40AF' },
  on_hold: { bg: '#FEF3C7', border: '#F59E0B', text: '#92400E' },
  completed: { bg: '#D1FAE5', border: '#10B981', text: '#065F46' },
  archived: { bg: '#F3F4F6', border: '#9CA3AF', text: '#4B5563' },
  
  // Feature Status
  backlog: { bg: '#F3F4F6', border: '#D1D5DB', text: '#374151' },
  discovered: { bg: '#E0F2FE', border: '#0EA5E9', text: '#075985' },
  planned: { bg: '#E0E7FF', border: '#6366F1', text: '#3730A3' },
  in_progress: { bg: '#FEF3C7', border: '#F59E0B', text: '#92400E' },
  in_review: { bg: '#DDD6FE', border: '#8B5CF6', text: '#5B21B6' },
  blocked: { bg: '#FEE2E2', border: '#EF4444', text: '#991B1B' },
  completed: { bg: '#D1FAE5', border: '#10B981', text: '#065F46' },
  cancelled: { bg: '#F3F4F6', border: '#9CA3AF', text: '#6B7280' },
};
```

### Iconography System

```typescript
const iconMapping = {
  // Entity Types
  roadmap: '📊',
  workstream: '🗂️',
  feature: '✨',
  task: '📋',
  milestone: '🎯',
  dependency: '🔗',
  
  // Status
  complete: '✅',
  incomplete: '○',
  blocked: '🚫',
  onHold: '⏸️',
  archived: '📦',
  released: '🚀',
  
  // Time
  startDate: '📅',
  endDate: '🏁',
  dueDate: '⏰',
  overdue: '⚠️',
  
  // Priority
  critical: '🔴',
  high: '🟠',
  medium: '🟡',
  low: '🟢',
  
  // Ownership
  assignee: '👤',
  team: '🏢',
  stakeholder: '🎯',
  
  // Quality
  risk: '⚠️',
  health: '💚',
  quality: '⭐',
  
  // Actions
  edit: '✏️',
  delete: '🗑️',
  duplicate: '📋',
  link: '🔗',
  comment: '💬',
  attachment: '📎',
};
```

### Size & Spacing

```typescript
const sizing = {
  // Card Sizes
  roadmapCard: { width: '100%', height: 'auto' },
  workstreamCard: { width: 320, height: 'auto' },
  featureCard: { width: 280, height: 160 },
  taskCard: { width: 260, height: 'auto' },
  milestoneCard: { width: 200, height: 80 },
  
  // Icon Sizes
  largeIcon: 24,
  mediumIcon: 16,
  smallIcon: 12,
  
  // Font Sizes
  titleLarge: 24,
  title: 16,
  subtitle: 14,
  body: 13,
  small: 12,
  tiny: 11,
  
  // Spacing
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
};
```

---

## 9. Attribute Tracking Modes

### Minimal Mode

Shows only essential attributes:
- Name/Title
- Status
- Progress
- Due Date (if set)

### Standard Mode

Shows common attributes:
- Name/Title
- Status
- Progress
- Priority
- Assignee
- Due Date
- Dependencies (count)

### Comprehensive Mode

Shows all attributes with full detail and custom fields.

---

## 10. Custom Field System

### Field Types

```typescript
enum CustomFieldType {
  TEXT = 'text',              // Single line text
  TEXTAREA = 'textarea',      // Multi-line text
  NUMBER = 'number',          // Numeric input
  DATE = 'date',              // Date picker
  DATETIME = 'datetime',      // Date + time
  SELECT = 'select',          // Dropdown
  MULTI_SELECT = 'multi_select', // Multi-select
  CHECKBOX = 'checkbox',      // Boolean
  USER = 'user',              // User picker
  TEAM = 'team',              // Team picker
  URL = 'url',                // URL input
  EMAIL = 'email',            // Email input
  CURRENCY = 'currency',      // Currency with symbol
  PERCENTAGE = 'percentage',  // Percentage (0-100)
  RATING = 'rating',          // Star rating
  PROGRESS = 'progress',      // Progress bar
  TAGS = 'tags',              // Tag input
  FORMULA = 'formula',        // Calculated field
  REFERENCE = 'reference',    // Link to entity
  ATTACHMENT = 'attachment',  // File upload
}
```

### Custom Field Configuration

```typescript
interface CustomField {
  id: string;
  name: string;
  type: CustomFieldType;
  required: boolean;
  defaultValue: any;
  options?: CustomFieldOption[]; // For select/multi-select
  validation?: ValidationRule[];
  visibility: 'always' | 'conditional';
  condition?: ConditionalRule;
  displayOrder: number;
  showInCard: boolean;
  showInList: boolean;
  showInReports: boolean;
  isEditable: boolean;
  isComputed: boolean;
  computationFormula?: string;
}
```

---

**Document Version**: 1.0  
**Last Updated**: 2026-03-27  
**Status**: Ready for Implementation
