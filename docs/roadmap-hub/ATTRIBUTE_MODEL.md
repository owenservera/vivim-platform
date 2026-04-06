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
â”œâ”€â”€ Name
â”œâ”€â”€ Status
â””â”€â”€ Progress

Level 2: Standard (On Hover/Expand)
â”œâ”€â”€ Dates
â”œâ”€â”€ Priority
â”œâ”€â”€ Assignee
â””â”€â”€ Dependencies

Level 3: Comprehensive (Inspector Panel)
â”œâ”€â”€ All attributes
â”œâ”€â”€ History
â”œâ”€â”€ Metadata
â””â”€â”€ Custom fields
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
| `icon` | String | No | ðŸ“Š | Icon glyph (16px) |
| `version` | String | No | 1.0 | Badge (top-right) |

### Temporal Attributes

| Attribute | Type | Required | Default | Visual Representation |
|-----------|------|----------|---------|----------------------|
| `startDate` | Date | No | null | ðŸ“… Calendar icon + date |
| `endDate` | Date | No | null | ðŸ Flag icon + date |
| `duration` | Calculated | No | - | Timeline bar length |
| `quarters` | Array | No | [] | Q1â”‚Q2â”‚Q3â”‚Q4 markers |
| `fiscalYear` | Number | No | 2026 | FY26 badge |

### Status Attributes

| Attribute | Type | Required | Default | Visual Representation |
|-----------|------|----------|---------|----------------------|
| `status` | Enum | Yes | active | â— Status dot (color-coded) |
| `isArchived` | Boolean | No | false | ðŸ“¦ Archive icon (if true) |
| `isTemplate` | Boolean | No | false | ðŸ“‹ Template badge |
| `visibility` | Enum | Yes | private | ðŸ”’/ðŸŒ icon |
| `healthScore` | Number (0-100) | No | - | Circular progress ring |

### Progress Attributes

| Attribute | Type | Required | Default | Visual Representation |
|-----------|------|----------|---------|----------------------|
| `overallProgress` | Number (0-100) | No | 0 | Progress bar (horizontal) |
| `featureCount` | Number | Calculated | 0 | ðŸ“‹ Count badge |
| `completedFeatureCount` | Number | Calculated | 0 | âœ… Count badge |
| `workstreamCount` | Number | Calculated | 0 | ðŸ—‚ï¸ Count badge |
| `milestoneCount` | Number | Calculated | 0 | ðŸŽ¯ Count badge |

### Ownership Attributes

| Attribute | Type | Required | Default | Visual Representation |
|-----------|------|----------|---------|----------------------|
| `ownerId` | UUID | Yes | - | ðŸ‘¤ Avatar |
| `ownerName` | String | Derived | - | Name text |
| `members` | Array | No | [] | ðŸ‘¥ Avatar stack |
| `stakeholders` | Array | No | [] | ðŸŽ¯ Avatar stack (outlined) |
| `teamId` | UUID | No | null | ðŸ¢ Team badge |

### Quality Attributes

| Attribute | Type | Required | Default | Visual Representation |
|-----------|------|----------|---------|----------------------|
| `riskScore` | Number (0-100) | No | - | âš ï¸ Risk meter |
| `confidenceLevel` | Number (0-100) | No | - | ðŸŽ¯ Confidence ring |
| `lastUpdated` | DateTime | Auto | now | ðŸ• "Updated X ago" |
| `dataQuality` | Enum | No | - | â˜…â˜…â˜…â˜†â˜† rating |

### Custom Attributes

| Attribute | Type | Required | Default | Visual Representation |
|-----------|------|----------|---------|----------------------|
| `tags` | Array | No | [] | ðŸ·ï¸ Tag pills |
| `customFields` | JSON | No | {} | Custom field widgets |
| `metadata` | JSON | No | {} | Hidden (internal) |
| `externalLinks` | Array | No | [] | ðŸ”— Link icons |

---

## 2. Workstream Attributes

### Core Attributes

| Attribute | Type | Required | Default | Visual Representation |
|-----------|------|----------|---------|----------------------|
| `id` | UUID | Yes | Auto | Hidden |
| `name` | String (100) | Yes | - | **Card title**, 16px, bold |
| `description` | Text | No | null | Card subtitle, 13px |
| `color` | Color | No | #3B82F6 | Background/border color |
| `icon` | String | No | ðŸ“ | Icon glyph (14px) |
| `emoji` | String | No | - | Emoji (16px) |
| `code` | String (20) | No | - | WS-001 code badge |

### Hierarchical Attributes

| Attribute | Type | Required | Default | Visual Representation |
|-----------|------|----------|---------|----------------------|
| `parentId` | UUID | No | null | Tree indentation |
| `level` | Number | Calculated | 0 | Tree depth indicator |
| `path` | Array | Calculated | [] | Breadcrumb trail |
| `children` | Array | Calculated | [] | Expand/collapse arrow |
| `hasChildren` | Boolean | Calculated | false | â–¶ï¸ Arrow (if true) |
| `order` | Number | No | 0 | Vertical position |
| `sortOrder` | Number | No | 0 | Custom sort indicator |

### Temporal Attributes

| Attribute | Type | Required | Default | Visual Representation |
|-----------|------|----------|---------|----------------------|
| `startDate` | Date | No | null | ðŸ“… Start marker |
| `endDate` | Date | No | null | ðŸ End marker |
| `targetDate` | Date | No | null | ðŸŽ¯ Target flag (dashed) |
| `actualEndDate` | Date | No | null | âœ… Green check if on time |
| `duration` | Calculated | No | - | Timeline span |
| `quarter` | Enum | No | - | Q1/Q2/Q3/Q4 badge |

### Status Attributes

| Attribute | Type | Required | Default | Visual Representation |
|-----------|------|----------|---------|----------------------|
| `status` | Enum | Yes | planned | Status pill (color-coded) |
| `isComplete` | Boolean | No | false | âœ… Check or â—‹ Circle |
| `isOnHold` | Boolean | No | false | â¸ï¸ Pause icon |
| `isBlocked` | Boolean | No | false | ðŸš« Block icon |
| `completionDate` | Date | No | null | ðŸ“… Completion date |
| `completedBy` | String | No | null | ðŸ‘¤ Completer avatar |

### Progress Attributes

| Attribute | Type | Required | Default | Visual Representation |
|-----------|------|----------|---------|----------------------|
| `progress` | Number (0-100) | No | 0 | Progress bar (colored) |
| `progressTrend` | Enum | No | - | â†‘â†“â†’ Trend arrow |
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
| `effort` | Enum | No | medium | Effort dots (â—â—â—â—‹â—‹) |
| `businessValue` | Enum | No | medium | Value stars (â˜…â˜…â˜…â˜†â˜†) |
| `strategicAlignment` | Number (0-100) | No | - | Alignment meter |
| `investmentScore` | Number (0-10) | No | - | Investment bar |

### Dependency Attributes

| Attribute | Type | Required | Default | Visual Representation |
|-----------|------|----------|---------|----------------------|
| `dependencyCount` | Number | Calculated | 0 | ðŸ”— Count badge |
| `upstreamDependencyCount` | Number | Calculated | 0 | â†‘ Count (incoming) |
| `downstreamDependencyCount` | Number | Calculated | 0 | â†“ Count (outgoing) |
| `crossWorkstreamDeps` | Number | Calculated | 0 | ðŸŒ Count (cross-team) |
| `hasCircularDependency` | Boolean | Calculated | false | âš ï¸ Warning icon |
| `criticalPath` | Boolean | Calculated | false | ðŸ”´ Red border if critical |

### Ownership Attributes

| Attribute | Type | Required | Default | Visual Representation |
|-----------|------|----------|---------|----------------------|
| `leadId` | UUID | No | null | ðŸ‘¤ Lead avatar |
| `leadName` | String | No | null | Name text |
| `assigneeIds` | Array | No | [] | ðŸ‘¥ Avatar stack |
| `teamId` | UUID | No | null | ðŸ¢ Team badge |
| `department` | String | No | null | Dept pill |
| `stakeholders` | Array | No | [] | ðŸŽ¯ Avatar stack |

### Resource Attributes

| Attribute | Type | Required | Default | Visual Representation |
|-----------|------|----------|---------|----------------------|
| `budget` | Number | No | null | ðŸ’° Budget amount |
| `spentBudget` | Number | No | null | ðŸ’¸ Spent amount |
| `budgetUtilization` | Number (0-100) | Calculated | - | Budget progress bar |
| `headcount` | Number | No | null | ðŸ‘¥ Headcount |
| `capacity` | Number (0-100) | No | - | Capacity gauge |
| `utilization` | Number (0-100) | No | - | Utilization bar |

### Quality Attributes

| Attribute | Type | Required | Default | Visual Representation |
|-----------|------|----------|---------|----------------------|
| `healthScore` | Number (0-100) | No | - | Health ring (color) |
| `riskScore` | Number (0-100) | No | - | Risk meter |
| `riskLevel` | Enum | Calculated | - | ðŸŸ¢ðŸŸ¡ðŸ”´ Risk dot |
| `confidenceLevel` | Number (0-100) | No | - | Confidence ring |
| `qualityScore` | Number (0-100) | No | - | Quality stars |
| `techDebt` | Enum | No | - | ðŸ“‰ Debt indicator |

### Custom Attributes

| Attribute | Type | Required | Default | Visual Representation |
|-----------|------|----------|---------|----------------------|
| `tags` | Array | No | [] | ðŸ·ï¸ Tag pills |
| `objectives` | Array | No | [] | ðŸŽ¯ Objective list |
| `keyResults` | Array | No | [] | ðŸ“Š KR list with progress |
| `customFields` | JSON | No | {} | Custom field widgets |
| `metadata` | JSON | No | {} | Hidden |
| `externalLinks` | Array | No | [] | ðŸ”— Link icons |
| `attachments` | Array | No | [] | ðŸ“Ž Count badge |
| `comments` | Number | Calculated | 0 | ðŸ’¬ Count badge |

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
| `isPinned` | Boolean | No | false | ðŸ“Œ Pin icon |
| `isHidden` | Boolean | No | false | ðŸ‘ï¸ Hidden (eye slash) |

### Temporal Attributes

| Attribute | Type | Required | Default | Visual Representation |
|-----------|------|----------|---------|----------------------|
| `startDate` | Date | No | null | ðŸ“… Start marker |
| `endDate` | Date | No | null | ðŸ End marker |
| `targetDate` | Date | No | null | ðŸŽ¯ Target flag |
| `dueDate` | Date | No | null | â° Due date (red if overdue) |
| `actualStartDate` | Date | No | null | âœ… Actual start (green) |
| `actualEndDate` | Date | No | null | âœ… Actual end (green) |
| `completedAt` | Date | No | null | ðŸŽ‰ Completion confetti |
| `duration` | Calculated | No | - | Timeline bar length |
| `remainingDays` | Calculated | No | - | "X days left" badge |
| `overdueDays` | Calculated | No | - | "X days overdue" (red) |

### Status Attributes

| Attribute | Type | Required | Default | Visual Representation |
|-----------|------|----------|---------|----------------------|
| `status` | Enum | Yes | backlog | Status pill (7 colors) |
| `isComplete` | Boolean | No | false | âœ… Check or â—‹ Circle |
| `isBlocked` | Boolean | No | false | ðŸš« Block overlay |
| `blockReason` | String | No | null | âš ï¸ Tooltip with reason |
| `isOnHold` | Boolean | No | false | â¸ï¸ Pause badge |
| `isArchived` | Boolean | No | false | ðŸ“¦ Archive icon |
| `isReleased` | Boolean | No | false | ðŸš€ Release badge |
| `releaseVersion` | String | No | null | v1.0 version tag |

### Progress Attributes

| Attribute | Type | Required | Default | Visual Representation |
|-----------|------|----------|---------|----------------------|
| `progress` | Number (0-100) | No | 0 | Progress bar (colored) |
| `progressSource` | Enum | No | manual | ðŸ¤– Auto / âœ‹ Manual badge |
| `taskCount` | Number | Calculated | 0 | ðŸ“‹ Task count |
| `completedTaskCount` | Number | Calculated | 0 | âœ… Done count |
| `blockedTaskCount` | Number | Calculated | 0 | ðŸš« Blocked count |
| `storyPoints` | Number | No | null | Story points (fibonacci) |
| `completedStoryPoints` | Number | Calculated | 0 | Completed SP |
| `acceptanceCriteriaCount` | Number | Calculated | 0 | âœ“ Count |
| `passedAcceptanceCriteriaCount` | Number | Calculated | 0 | âœ“âœ“ Passed count |

### Priority & Effort Attributes

| Attribute | Type | Required | Default | Visual Representation |
|-----------|------|----------|---------|----------------------|
| `priority` | Enum | No | medium | Priority badge (4 colors) |
| `effort` | Enum | No | medium | Effort size (XS-XL) |
| `businessValue` | Enum | No | medium | Value dots (â—â—â—â—‹â—‹) |
| `urgency` | Enum | No | medium | Urgency meter |
| `impact` | Enum | No | medium | Impact stars |
| `confidence` | Enum | No | high | Confidence (H/M/L) |
| `riceScore` | Number | Calculated | - | RICE score badge |
| `wsjfScore` | Number | Calculated | - | WSJF score badge |

### Dependency Attributes

| Attribute | Type | Required | Default | Visual Representation |
|-----------|------|----------|---------|----------------------|
| `dependencyCount` | Number | Calculated | 0 | ðŸ”— Link count |
| `upstreamDependencies` | Array | Calculated | [] | â†‘ Incoming arrows |
| `downstreamDependencies` | Array | Calculated | [] | â†“ Outgoing arrows |
| `dependencyType` | Enum | No | - | FS/SS/FF/SF badge |
| `hasCircularDependency` | Boolean | Calculated | false | âš ï¸ Cycle warning |
| `isOnCriticalPath` | Boolean | Calculated | false | ðŸ”´ Critical highlight |
| `blockingFeatureCount` | Number | Calculated | 0 | ðŸš« Blocking count |
| `blockedByFeatureCount` | Number | Calculated | 0 |  Blocked by count |

### Ownership Attributes

| Attribute | Type | Required | Default | Visual Representation |
|-----------|------|----------|---------|----------------------|
| `reporterId` | UUID | No | null | ðŸ‘¤ Reporter avatar |
| `reporterName` | String | No | null | Name text |
| `assigneeIds` | Array | No | [] | ðŸ‘¥ Avatar stack (max 3) |
| `reviewerIds` | Array | No | [] | ðŸ‘“ Reviewer avatars |
| `approverIds` | Array | No | [] | âœ… Approver avatars |
| `contributorIds` | Array | No | [] | ðŸ‘¥ Contributor avatars |
| `teamId` | UUID | No | null | ðŸ¢ Team badge |

### Technical Attributes

| Attribute | Type | Required | Default | Visual Representation |
|-----------|------|----------|---------|----------------------|
| `component` | String | No | null | ðŸ§© Component badge |
| `technology` | Array | No | [] | âš™ï¸ Tech stack icons |
| `repository` | String | No | null | ðŸ“ Repo link |
| `branch` | String | No | null | ðŸŒ¿ Branch name |
| `pullRequestCount` | Number | Calculated | 0 | ðŸ”€ PR count |
| `commitCount` | Number | Calculated | 0 | ðŸ’¾ Commit count |
| `codeCompletion` | Number (0-100) | Calculated | - | Code progress bar |
| `testCoverage` | Number (0-100) | No | - | ðŸ§ª Coverage badge |
| `techDebt` | Enum | No | - | ðŸ“‰ Debt level |

### Quality Attributes

| Attribute | Type | Required | Default | Visual Representation |
|-----------|------|----------|---------|----------------------|
| `healthScore` | Number (0-100) | No | - | Health ring |
| `riskScore` | Number (0-100) | No | - | Risk meter |
| `riskLevel` | Enum | Calculated | - | ðŸŸ¢ðŸŸ¡ðŸ”´ Risk dot |
| `qualityScore` | Number (0-100) | No | - | Quality stars |
| `stability` | Enum | No | - | Stability indicator |
| `complexity` | Enum | No | - | Complexity gauge |
| `aiConfidence` | Number (0-100) | No | - | ðŸ¤– AI confidence |

### Custom Attributes

| Attribute | Type | Required | Default | Visual Representation |
|-----------|------|----------|---------|----------------------|
| `tags` | Array | No | [] | ðŸ·ï¸ Tag pills (color) |
| `epic` | String | No | null | ðŸ“– Epic link |
| `initiative` | String | No | null | ðŸŽ¯ Initiative link |
| `theme` | String | No | null | ðŸŽ¨ Theme badge |
| `customerImpact` | Enum | No | - | ðŸ‘¥ Impact level |
| `userStories` | Array | No | [] | ðŸ“ Story list |
| `acceptanceCriteria` | Array | No | [] | âœ“ Criteria checklist |
| `customFields` | JSON | No | {} | Custom field widgets |
| `metadata` | JSON | No | {} | Hidden |
| `externalLinks` | Array | No | [] | ðŸ”— Link icons |
| `attachments` | Array | No | [] | ðŸ“Ž Attachment count |
| `comments` | Number | Calculated | 0 | ðŸ’¬ Comment count |
| `views` | Number | Calculated | 0 | ðŸ‘ï¸ View count |

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
| `startDate` | Date | No | null | ðŸ“… Start |
| `endDate` | Date | No | null | ðŸ End |
| `dueDate` | Date | No | null | â° Due (red if overdue) |
| `estimatedHours` | Number | No | null | â±ï¸ Estimate |
| `actualHours` | Number | No | null | â²ï¸ Actual |
| `timeRemaining` | Number | No | null | â³ Remaining |
| `completedAt` | Date | No | null | âœ… Completion date |

### Status Attributes

| Attribute | Type | Required | Default | Visual Representation |
|-----------|------|----------|---------|----------------------|
| `status` | Enum | Yes | todo | Status pill |
| `isComplete` | Boolean | No | false | â˜ Checkbox |
| `isBlocked` | Boolean | No | false | ðŸš« Block |
| `blockReason` | String | No | null | âš ï¸ Reason |

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
| `assigneeId` | UUID | No | null | ðŸ‘¤ Assignee |
| `assigneeName` | String | No | null | Name |
| `reviewerId` | UUID | No | null | ðŸ‘“ Reviewer |

### Custom Attributes

| Attribute | Type | Required | Default | Visual Representation |
|-----------|------|----------|---------|----------------------|
| `tags` | Array | No | [] | Tiny tags |
| `parentTaskId` | UUID | No | null | Parent link |
| `dependencyIds` | Array | No | [] | Dependency links |
| `attachments` | Array | No | [] | ðŸ“Ž Count |
| `comments` | Number | Calculated | 0 | ðŸ’¬ Count |

---

## 5. Milestone Attributes

### Core Attributes

| Attribute | Type | Required | Default | Visual Representation |
|-----------|------|----------|---------|----------------------|
| `id` | UUID | Yes | Auto | Hidden |
| `name` | String (100) | Yes | - | **Milestone name**, 15px |
| `description` | Text | No | null | Description |
| `icon` | String | No | ðŸŽ¯ | Milestone icon |
| `type` | Enum | No | milestone | Type (milestone/release/event) |

### Temporal Attributes

| Attribute | Type | Required | Default | Visual Representation |
|-----------|------|----------|---------|----------------------|
| `targetDate` | Date | Yes | - | ðŸŽ¯ Target date |
| `actualDate` | Date | No | null | âœ… Actual date |
| `isPastDue` | Boolean | Calculated | false | âš ï¸ Overdue highlight |

### Status Attributes

| Attribute | Type | Required | Default | Visual Representation |
|-----------|------|----------|---------|----------------------|
| `status` | Enum | Yes | upcoming | Status (upcoming/achieved/missed) |
| `isAchieved` | Boolean | No | false | âœ… Check or â—‹ |
| `isCritical` | Boolean | No | false | ðŸ”´ Critical highlight |

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
| `isBlocking` | Boolean | Calculated | false | ðŸš« Block indicator |
| `isAtRisk` | Boolean | Calculated | false | âš ï¸ Risk highlight |
| `isBroken` | Boolean | Calculated | false | ðŸ’” Broken link |

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
  roadmap: 'ðŸ“Š',
  workstream: 'ðŸ—‚ï¸',
  feature: 'âœ¨',
  task: 'ðŸ“‹',
  milestone: 'ðŸŽ¯',
  dependency: 'ðŸ”—',
  
  // Status
  complete: 'âœ…',
  incomplete: 'â—‹',
  blocked: 'ðŸš«',
  onHold: 'â¸ï¸',
  archived: 'ðŸ“¦',
  released: 'ðŸš€',
  
  // Time
  startDate: 'ðŸ“…',
  endDate: 'ðŸ',
  dueDate: 'â°',
  overdue: 'âš ï¸',
  
  // Priority
  critical: 'ðŸ”´',
  high: 'ðŸŸ ',
  medium: 'ðŸŸ¡',
  low: 'ðŸŸ¢',
  
  // Ownership
  assignee: 'ðŸ‘¤',
  team: 'ðŸ¢',
  stakeholder: 'ðŸŽ¯',
  
  // Quality
  risk: 'âš ï¸',
  health: 'ðŸ’š',
  quality: 'â­',
  
  // Actions
  edit: 'âœï¸',
  delete: 'ðŸ—‘ï¸',
  duplicate: 'ðŸ“‹',
  link: 'ðŸ”—',
  comment: 'ðŸ’¬',
  attachment: 'ðŸ“Ž',
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
