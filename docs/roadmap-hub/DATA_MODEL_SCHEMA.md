# VIVIM Roadmap Hub - Data Model & Schema

## Overview

This document defines the complete database schema, data relationships, and type definitions for the VIVIM Roadmap Hub.

---

## 1. Entity Relationship Diagram

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”       â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”       â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚     User        â”‚       â”‚    Roadmap       â”‚       â”‚     View        â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤       â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤       â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚ id              â”‚â—„â”€â”€â”€â”€â”€â”€â”‚ ownerId          â”‚       â”‚ id              â”‚
â”‚ email           â”‚       â”‚ name             â”‚â”€â”€â”€â”€â”€â”€â”€â”‚ roadmapId       â”‚
â”‚ name            â”‚       â”‚ description      â”‚       â”‚ type            â”‚
â”‚ role            â”‚       â”‚ createdAt        â”‚       â”‚ config          â”‚
â”‚ createdAt       â”‚       â”‚ updatedAt        â”‚       â”‚ createdAt       â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜       â””â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜       â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
                                   â”‚
                                   â”‚ 1:N
                                   â–¼
                          â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
                          â”‚   Workstream     â”‚
                          â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
                          â”‚ id               â”‚
                          â”‚ name             â”‚
                          â”‚ description      â”‚
                          â”‚ color            â”‚
                          â”‚ order            â”‚
                          â”‚ roadmapId        â”‚
                          â”‚ parentId         â”‚â”€â”€â”€â”€â”€â”€â”
                          â”‚ createdAt        â”‚      â”‚
                          â”‚ updatedAt        â”‚      â”‚ self-referential
                          â””â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜      â”‚ (hierarchy)
                                   â”‚ 1:N            â”‚
                                   â–¼                â”‚
                          â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”      â”‚
                          â”‚    Feature       â”‚      â”‚
                          â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤      â”‚
                          â”‚ id               â”‚      â”‚
                          â”‚ title            â”‚      â”‚
                          â”‚ description      â”‚      â”‚
                          â”‚ status           â”‚      â”‚
                          â”‚ priority         â”‚      â”‚
                          â”‚ startDate        â”‚      â”‚
                          â”‚ endDate          â”‚      â”‚
                          â”‚ progress         â”‚      â”‚
                          â”‚ workstreamId     â”‚      â”‚
                          â”‚ position         â”‚      â”‚
                          â”‚ createdAt        â”‚      â”‚
                          â”‚ updatedAt        â”‚      â”‚
                          â””â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜      â”‚
                                   â”‚ 1:N            â”‚
                                   â–¼                â”‚
                          â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”      â”‚
                          â”‚      Task        â”‚      â”‚
                          â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤      â”‚
                          â”‚ id               â”‚      â”‚
                          â”‚ title            â”‚      â”‚
                          â”‚ description      â”‚      â”‚
                          â”‚ status           â”‚      â”‚
                          â”‚ priority         â”‚      â”‚
                          â”‚ startDate        â”‚      â”‚
                          â”‚ endDate          â”‚      â”‚
                          â”‚ progress         â”‚      â”‚
                          â”‚ featureId        â”‚      â”‚
                          â”‚ assigneeId       â”‚      â”‚
                          â”‚ estimateHours    â”‚      â”‚
                          â”‚ actualHours      â”‚      â”‚
                          â”‚ createdAt        â”‚      â”‚
                          â”‚ updatedAt        â”‚      â”‚
                          â””â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜      â”‚
                                   â”‚                â”‚
                                   â”‚ N:M            â”‚
                                   â–¼                â”‚
                          â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”      â”‚
                          â”‚ TaskDependency   â”‚â—„â”€â”€â”€â”€â”€â”˜
                          â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
                          â”‚ id               â”‚
                          â”‚ taskId           â”‚
                          â”‚ dependsOnId      â”‚
                          â”‚ type             â”‚
                          â”‚ lag              â”‚
                          â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜

â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”       â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚   CodeInsight   â”‚       â”‚   AuditLog       â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤       â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚ id              â”‚       â”‚ id               â”‚
â”‚ taskId          â”‚       â”‚ userId           â”‚
â”‚ commitHash      â”‚       â”‚ action           â”‚
â”‚ filePaths       â”‚       â”‚ entityType       â”‚
â”‚ confidence      â”‚       â”‚ entityId         â”‚
â”‚ detectedAt      â”‚       â”‚ before           â”‚
â”‚ status          â”‚       â”‚ after            â”‚
â”‚ metadata        â”‚       â”‚ createdAt        â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜       â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

---

## 2. Prisma Schema

```prisma
// schema.prisma

generator client {
  provider = "prisma-client-js"
  output   = "../@generated"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============================================
// Core Entities
// ============================================

model Roadmap {
  id          String     @id @default(cuid())
  name        String
  description String?    @db.Text
  colorScheme String?    @default("blue")
  isArchived  Boolean    @default(false)
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt
  deletedAt   DateTime?
  
  // Relations
  workstreams Workstream[]
  views       View[]
  ownerId     String
  owner       User       @relation(fields: [ownerId], references: [id])
  
  // Indexes
  @@index([ownerId])
  @@index([isArchived])
  @@map("roadmaps")
}

model Workstream {
  id          String   @id @default(cuid())
  name        String
  description String?  @db.Text
  color       String   @default("#3B82F6")
  icon        String?
  order       Int      @default(0)
  startDate   DateTime?
  endDate     DateTime?
  progress    Int      @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // Relations
  roadmapId   String
  roadmap     Roadmap  @relation(fields: [roadmapId], references: [id], onDelete: Cascade)
  
  parentId    String?
  parent      Workstream? @relation("WorkstreamHierarchy", fields: [parentId], references: [id])
  children    Workstream[] @relation("WorkstreamHierarchy")
  
  features    Feature[]
  
  // Indexes
  @@index([roadmapId])
  @@index([parentId])
  @@index([order])
  @@map("workstreams")
}

model Feature {
  id          String      @id @default(cuid())
  title       String
  description String?     @db.Text
  status      FeatureStatus @default(BACKLOG)
  priority    Priority    @default(MEDIUM)
  startDate   DateTime?
  endDate     DateTime?
  progress    Int         @default(0)
  effort      EffortSize  @default(MEDIUM)
  
  // Visual positioning on canvas
  positionX   Float       @default(0)
  positionY   Float       @default(0)
  width       Float       @default(280)
  height      Float       @default(160)
  
  // Metadata
  tags        String[]
  metadata    Json?
  
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
  completedAt DateTime?
  
  // Relations
  workstreamId String
  workstream   Workstream @relation(fields: [workstreamId], references: [id], onDelete: Cascade)
  
  tasks        Task[]
  
  // Dependencies (many-to-many self-relation)
  dependencies Dependency[] @relation("FeatureDependencies")
  dependents   Dependency[] @relation("DependentFeatures")
  
  // Comments
  comments     Comment[]
  
  // Attachments
  attachments  Attachment[]
  
  // Indexes
  @@index([workstreamId])
  @@index([status])
  @@index([priority])
  @@index([startDate, endDate])
  @@map("features")
}

model Task {
  id          String      @id @default(cuid())
  title       String
  description String?     @db.Text
  status      TaskStatus  @default(TODO)
  priority    Priority    @default(MEDIUM)
  startDate   DateTime?
  endDate     DateTime?
  dueDate     DateTime?
  progress    Int         @default(0)
  
  // Time tracking
  estimateHours Float?
  actualHours   Float?
  
  // Order in feature
  order         Int       @default(0)
  
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  completedAt   DateTime?
  
  // Relations
  featureId   String
  feature     Feature     @relation(fields: [featureId], references: [id], onDelete: Cascade)
  
  assigneeId  String?
  assignee    User?       @relation(fields: [assigneeId], references: [id])
  
  reporterId  String?
  reporter    User?       @relation(fields: [reporterId], references: [id])
  
  // Dependencies
  dependencies TaskDependency[] @relation("TaskDependencies")
  dependents   TaskDependency[] @relation("DependentTasks")
  
  // AI insights
  codeInsights CodeInsight[]
  
  // Comments
  comments     Comment[]
  
  // Attachments
  attachments  Attachment[]
  
  // Time entries
  timeEntries  TimeEntry[]
  
  // Indexes
  @@index([featureId])
  @@index([status])
  @@index([assigneeId])
  @@index([dueDate])
  @@map("tasks")
}

// ============================================
// Dependencies
// ============================================

model Dependency {
  id           String         @id @default(cuid())
  fromFeatureId String
  toFeatureId  String
  type         DependencyType @default(FS)
  lag          Int            @default(0) // in days
  createdAt    DateTime       @default(now())
  
  // Relations
  fromFeature  Feature        @relation("FeatureDependencies", fields: [fromFeatureId], references: [id], onDelete: Cascade)
  toFeature    Feature        @relation("DependentFeatures", fields: [toFeatureId], references: [id], onDelete: Cascade)
  
  // Indexes
  @@unique([fromFeatureId, toFeatureId])
  @@index([fromFeatureId])
  @@index([toFeatureId])
  @@map("dependencies")
}

model TaskDependency {
  id          String         @id @default(cuid())
  taskId      String
  dependsOnId String
  type        DependencyType @default(FS)
  lag         Int            @default(0)
  createdAt   DateTime       @default(now())
  
  // Relations
  task      Task             @relation("TaskDependencies", fields: [taskId], references: [id], onDelete: Cascade)
  dependsOn Task             @relation("DependentTasks", fields: [dependsOnId], references: [id], onDelete: Cascade)
  
  // Indexes
  @@unique([taskId, dependsOnId])
  @@index([taskId])
  @@index([dependsOnId])
  @@map("task_dependencies")
}

// ============================================
// AI & Code Inspection
// ============================================

model CodeInsight {
  id          String        @id @default(cuid())
  taskId      String
  task        Task          @relation(fields: [taskId], references: [id], onDelete: Cascade)
  
  // Git information
  commitHash  String?
  branchName  String?
  author      String?
  
  // Code changes
  filePaths   String[]
  additions   Int           @default(0)
  deletions   Int           @default(0)
  
  // AI analysis
  confidence  Float         @default(0.0)
  summary     String?       @db.Text
  detectedChanges String[]
  
  // Status
  status      InsightStatus @default(PENDING)
  reviewedBy  String?
  reviewedAt  DateTime?
  
  detectedAt  DateTime      @default(now())
  metadata    Json?
  
  // Indexes
  @@index([taskId])
  @@index([status])
  @@index([commitHash])
  @@index([detectedAt])
  @@map("code_insights")
}

model AIAnalysis {
  id          String   @id @default(cuid())
  roadmapId   String
  roadmap     Roadmap  @relation(fields: [roadmapId], references: [id], onDelete: Cascade)
  
  // Analysis results
  riskScore   Float    @default(0.0)
  healthScore Float    @default(0.0)
  velocity    Float    @default(0.0)
  
  // Predictions
  predictedCompletion DateTime?
  confidenceLevel     Float?
  
  // Insights
  risks       Json?    // Risk[]
  suggestions Json?    // Suggestion[]
  metrics     Json?    // Metrics[]
  
  analyzedAt  DateTime @default(now())
  metadata    Json?
  
  // Indexes
  @@index([roadmapId])
  @@index([analyzedAt])
  @@map("ai_analyses")
}

// ============================================
// Views & Configurations
// ============================================

model View {
  id        String   @id @default(cuid())
  name      String
  type      ViewType
  isDefault Boolean  @default(false)
  config    Json
  filters   Json?
  sortBy    String?
  sortOrder SortOrder? @default(ASC)
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  // Relations
  roadmapId String
  roadmap   Roadmap  @relation(fields: [roadmapId], references: [id], onDelete: Cascade)
  
  // Indexes
  @@index([roadmapId])
  @@index([type])
  @@map("views")
}

model SavedFilter {
  id        String   @id @default(cuid())
  name      String
  filters   Json
  isGlobal  Boolean  @default(false)
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  // Relations
  roadmapId String?
  roadmap   Roadmap? @relation(fields: [roadmapId], references: [id], onDelete: Cascade)
  
  userId    String?
  user      User?    @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  // Indexes
  @@index([roadmapId])
  @@index([userId])
  @@map("saved_filters")
}

// ============================================
// Collaboration
// ============================================

model Comment {
  id        String   @id @default(cuid())
  content   String   @db.Text
  isEdited  Boolean  @default(false)
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  deletedAt DateTime?
  
  // Relations
  featureId String?
  feature   Feature? @relation(fields: [featureId], references: [id], onDelete: Cascade)
  
  taskId    String?
  task      Task?    @relation(fields: [taskId], references: [id], onDelete: Cascade)
  
  authorId  String
  author    User     @relation(fields: [authorId], references: [id])
  
  parentId  String?
  parent    Comment? @relation("CommentReplies", fields: [parentId], references: [id])
  replies   Comment[] @relation("CommentReplies")
  
  // Indexes
  @@index([featureId])
  @@index([taskId])
  @@index([authorId])
  @@index([parentId])
  @@map("comments")
}

model Attachment {
  id        String   @id @default(cuid())
  name      String
  url       String
  mimeType  String
  size      Int      // in bytes
  
  createdAt DateTime @default(now())
  
  // Relations
  featureId String?
  feature   Feature? @relation(fields: [featureId], references: [id], onDelete: Cascade)
  
  taskId    String?
  task      Task?    @relation(fields: [taskId], references: [id], onDelete: Cascade)
  
  uploaderId String
  uploader   User     @relation(fields: [uploaderId], references: [id])
  
  // Indexes
  @@index([featureId])
  @@index([taskId])
  @@map("attachments")
}

model TimeEntry {
  id          String   @id @default(cuid())
  taskId      String
  task        Task     @relation(fields: [taskId], references: [id], onDelete: Cascade)
  
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  
  startTime   DateTime
  endTime     DateTime?
  duration    Int      // in minutes
  
  description String?
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // Indexes
  @@index([taskId])
  @@index([userId])
  @@index([startTime])
  @@map("time_entries")
}

// ============================================
// Audit & Activity
// ============================================

model AuditLog {
  id         String   @id @default(cuid())
  userId     String
  user       User     @relation(fields: [userId], references: [id])
  
  action     AuditAction
  entityType String
  entityId   String
  
  before     Json?
  after      Json?
  
  ipAddress  String?
  userAgent  String?
  
  createdAt  DateTime @default(now())
  
  // Indexes
  @@index([userId])
  @@index([entityType, entityId])
  @@index([action])
  @@index([createdAt])
  @@map("audit_logs")
}

model Activity {
  id        String   @id @default(cuid())
  type      ActivityType
  
  // Polymorphic relation
  entityType String
  entityId   String
  
  userId    String?
  user      User?    @relation(fields: [userId], references: [id])
  
  metadata  Json?
  
  createdAt DateTime @default(now())
  
  // Indexes
  @@index([entityType, entityId])
  @@index([userId])
  @@index([type])
  @@index([createdAt])
  @@map("activities")
}

// ============================================
// User & Permissions
// ============================================

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  avatar    String?
  role      Role     @default(VIEWER)
  
  // Preferences
  preferences Json?
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  // Relations
  roadmaps     Roadmap[]
  workstreams  Workstream[]
  tasks        Task[]
  comments     Comment[]
  attachments  Attachment[]
  timeEntries  TimeEntry[]
  auditLogs    AuditLog[]
  activities   Activity[]
  
  // Indexes
  @@index([email])
  @@index([role])
  @@map("users")
}

model RoadmapMember {
  id        String   @id @default(cuid())
  roadmapId String
  roadmap   Roadmap  @relation(fields: [roadmapId], references: [id], onDelete: Cascade)
  
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  role      MemberRole @default(EDITOR)
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  // Indexes
  @@unique([roadmapId, userId])
  @@index([roadmapId])
  @@index([userId])
  @@map("roadmap_members")
}

// ============================================
// Enums
// ============================================

enum FeatureStatus {
  BACKLOG
  DISCOVERED
  PLANNED
  IN_PROGRESS
  IN_REVIEW
  BLOCKED
  COMPLETED
  CANCELLED
}

enum TaskStatus {
  TODO
  IN_PROGRESS
  IN_REVIEW
  BLOCKED
  DONE
  CANCELLED
}

enum Priority {
  CRITICAL
  HIGH
  MEDIUM
  LOW
}

enum EffortSize {
  XSMALL
  SMALL
  MEDIUM
  LARGE
  XLARGE
  MEGALARGE
}

enum DependencyType {
  FS // Finish-to-Start
  SS // Start-to-Start
  FF // Finish-to-Finish
  SF // Start-to-Finish
}

enum ViewType {
  CANVAS
  GANTT
  KANBAN
  TIMELINE
  LIST
  CALENDAR
}

enum SortOrder {
  ASC
  DESC
}

enum InsightStatus {
  PENDING
  PROCESSING
  COMPLETED
  FAILED
  REVIEWED
  ACCEPTED
  REJECTED
}

enum Role {
  ADMIN
  EDITOR
  VIEWER
}

enum MemberRole {
  ADMIN
  EDITOR
  VIEWER
}

enum AuditAction {
  CREATE
  UPDATE
  DELETE
  ARCHIVE
  RESTORE
  MOVE
  ASSIGN
  UNASSIGN
  COMPLETE
  REOPEN
}

enum ActivityType {
  FEATURE_CREATED
  FEATURE_UPDATED
  FEATURE_COMPLETED
  TASK_CREATED
  TASK_UPDATED
  TASK_COMPLETED
  COMMENT_ADDED
  DEPENDENCY_ADDED
  DEPENDENCY_REMOVED
  MEMBER_ADDED
  MEMBER_REMOVED
  AI_ANALYSIS_COMPLETED
  CODE_CHANGE_DETECTED
  MILESTONE_REACHED
  DEADLINE_APPROACHING
  RISK_IDENTIFIED
}

// ============================================
// Full-Text Search
// ============================================

model SearchIndex {
  id        String   @id @default(cuid())
  
  entityType String
  entityId   String
  
  // Searchable content
  title     String
  content   String?  @db.Text
  tags      String[]
  
  // Metadata for filtering
  roadmapId String
  status    String?
  priority  String?
  
  // Search vector (PostgreSQL full-text search)
  searchVector String @db.TsVector
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  // Indexes
  @@index([entityType, entityId])
  @@index([roadmapId])
  @@index([searchVector])
  @@map("search_index")
}
```

---

## 3. TypeScript Type Definitions

```typescript
// types/roadmap.ts

// ============================================
// Core Types
// ============================================

export interface Roadmap {
  id: string;
  name: string;
  description: string | null;
  colorScheme: string;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  ownerId: string;
  owner: User;
  workstreams: Workstream[];
  views: View[];
}

export interface Workstream {
  id: string;
  name: string;
  description: string | null;
  color: string;
  icon: string | null;
  order: number;
  startDate: Date | null;
  endDate: Date | null;
  progress: number;
  createdAt: Date;
  updatedAt: Date;
  roadmapId: string;
  roadmap: Roadmap;
  parentId: string | null;
  parent: Workstream | null;
  children: Workstream[];
  features: Feature[];
}

export interface Feature {
  id: string;
  title: string;
  description: string | null;
  status: FeatureStatus;
  priority: Priority;
  startDate: Date | null;
  endDate: Date | null;
  progress: number;
  effort: EffortSize;
  positionX: number;
  positionY: number;
  width: number;
  height: number;
  tags: string[];
  metadata: Record<string, any> | null;
  createdAt: Date;
  updatedAt: Date;
  completedAt: Date | null;
  workstreamId: string;
  workstream: Workstream;
  tasks: Task[];
  dependencies: Dependency[];
  dependents: Dependency[];
  comments: Comment[];
  attachments: Attachment[];
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: Priority;
  startDate: Date | null;
  endDate: Date | null;
  dueDate: Date | null;
  progress: number;
  estimateHours: number | null;
  actualHours: number | null;
  order: number;
  createdAt: Date;
  updatedAt: Date;
  completedAt: Date | null;
  featureId: string;
  feature: Feature;
  assigneeId: string | null;
  assignee: User | null;
  reporterId: string | null;
  reporter: User | null;
  dependencies: TaskDependency[];
  dependents: TaskDependency[];
  codeInsights: CodeInsight[];
  comments: Comment[];
  attachments: Attachment[];
  timeEntries: TimeEntry[];
}

// ============================================
// Dependency Types
// ============================================

export interface Dependency {
  id: string;
  fromFeatureId: string;
  toFeatureId: string;
  type: DependencyType;
  lag: number;
  createdAt: Date;
  fromFeature: Feature;
  toFeature: Feature;
}

export interface TaskDependency {
  id: string;
  taskId: string;
  dependsOnId: string;
  type: DependencyType;
  lag: number;
  createdAt: Date;
  task: Task;
  dependsOn: Task;
}

export enum DependencyType {
  FS = 'FS', // Finish-to-Start
  SS = 'SS', // Start-to-Start
  FF = 'FF', // Finish-to-Finish
  SF = 'SF', // Start-to-Finish
}

// ============================================
// AI & Code Inspection Types
// ============================================

export interface CodeInsight {
  id: string;
  taskId: string;
  task: Task;
  commitHash: string | null;
  branchName: string | null;
  author: string | null;
  filePaths: string[];
  additions: number;
  deletions: number;
  confidence: number;
  summary: string | null;
  detectedChanges: string[];
  status: InsightStatus;
  reviewedBy: string | null;
  reviewedAt: Date | null;
  detectedAt: Date;
  metadata: Record<string, any> | null;
}

export interface AIAnalysis {
  id: string;
  roadmapId: string;
  roadmap: Roadmap;
  riskScore: number;
  healthScore: number;
  velocity: number;
  predictedCompletion: Date | null;
  confidenceLevel: number | null;
  risks: Risk[] | null;
  suggestions: Suggestion[] | null;
  metrics: Metric[] | null;
  analyzedAt: Date;
  metadata: Record<string, any> | null;
}

export interface Risk {
  id: string;
  type: RiskType;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  affectedEntities: string[];
  likelihood: number;
  impact: number;
  mitigation?: string;
}

export enum RiskType {
  SCHEDULE = 'SCHEDULE',
  DEPENDENCY = 'DEPENDENCY',
  RESOURCE = 'RESOURCE',
  TECHNICAL = 'TECHNICAL',
  SCOPE = 'SCOPE',
}

export interface Suggestion {
  id: string;
  type: SuggestionType;
  description: string;
  priority: Priority;
  affectedEntities: string[];
  estimatedImpact: string;
}

export enum SuggestionType {
  REORDER = 'REORDER',
  REALLOCATE = 'REALLOCATE',
  DEPENDENCY = 'DEPENDENCY',
  OPTIMIZATION = 'OPTIMIZATION',
}

export interface Metric {
  name: string;
  value: number;
  trend: 'UP' | 'DOWN' | 'STABLE';
  change: number;
}

// ============================================
// View & Configuration Types
// ============================================

export interface View {
  id: string;
  name: string;
  type: ViewType;
  isDefault: boolean;
  config: ViewConfig;
  filters: FilterConfig | null;
  sortBy: string | null;
  sortOrder: SortOrder | null;
  createdAt: Date;
  updatedAt: Date;
  roadmapId: string;
  roadmap: Roadmap;
}

export interface ViewConfig {
  // Canvas view config
  zoom?: number;
  pan?: { x: number; y: number };
  showGrid?: boolean;
  snapToGrid?: boolean;
  
  // Gantt view config
  timescale?: Timescale;
  showCriticalPath?: boolean;
  showBaseline?: boolean;
  showResources?: boolean;
  
  // Kanban view config
  groupBy?: GroupBy;
  showSwimlanes?: boolean;
  cardLayout?: CardLayout;
  
  // Timeline view config
  orientation?: 'horizontal' | 'vertical';
  showMilestones?: boolean;
  showPhases?: boolean;
}

export enum ViewType {
  CANVAS = 'CANVAS',
  GANTT = 'GANTT',
  KANBAN = 'KANBAN',
  TIMELINE = 'TIMELINE',
  LIST = 'LIST',
  CALENDAR = 'CALENDAR',
}

export enum Timescale {
  HOURS = 'HOURS',
  DAYS = 'DAYS',
  WEEKS = 'WEEKS',
  MONTHS = 'MONTHS',
  QUARTERS = 'QUARTERS',
  YEARS = 'YEARS',
}

export enum GroupBy {
  STATUS = 'STATUS',
  PRIORITY = 'PRIORITY',
  ASSIGNEE = 'ASSIGNEE',
  WORKSTREAM = 'WORKSTREAM',
  NONE = 'NONE',
}

export interface FilterConfig {
  status?: FeatureStatus[];
  priority?: Priority[];
  workstreamIds?: string[];
  assigneeIds?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  search?: string;
  tags?: string[];
}

// ============================================
// Collaboration Types
// ============================================

export interface Comment {
  id: string;
  content: string;
  isEdited: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  featureId: string | null;
  feature: Feature | null;
  taskId: string | null;
  task: Task | null;
  authorId: string;
  author: User;
  parentId: string | null;
  parent: Comment | null;
  replies: Comment[];
}

export interface Attachment {
  id: string;
  name: string;
  url: string;
  mimeType: string;
  size: number;
  createdAt: Date;
  featureId: string | null;
  feature: Feature | null;
  taskId: string | null;
  task: Task | null;
  uploaderId: string;
  uploader: User;
}

export interface TimeEntry {
  id: string;
  taskId: string;
  task: Task;
  userId: string;
  user: User;
  startTime: Date;
  endTime: Date | null;
  duration: number;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// Audit & Activity Types
// ============================================

export interface AuditLog {
  id: string;
  userId: string;
  user: User;
  action: AuditAction;
  entityType: string;
  entityId: string;
  before: Record<string, any> | null;
  after: Record<string, any> | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
}

export interface Activity {
  id: string;
  type: ActivityType;
  entityType: string;
  entityId: string;
  userId: string | null;
  user: User | null;
  metadata: Record<string, any> | null;
  createdAt: Date;
}

// ============================================
// User & Permission Types
// ============================================

export interface User {
  id: string;
  email: string;
  name: string | null;
  avatar: string | null;
  role: Role;
  preferences: Record<string, any> | null;
  createdAt: Date;
  updatedAt: Date;
  roadmaps: Roadmap[];
  tasks: Task[];
  comments: Comment[];
}

export interface RoadmapMember {
  id: string;
  roadmapId: string;
  roadmap: Roadmap;
  userId: string;
  user: User;
  role: MemberRole;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// Enums
// ============================================

export enum FeatureStatus {
  BACKLOG = 'BACKLOG',
  DISCOVERED = 'DISCOVERED',
  PLANNED = 'PLANNED',
  IN_PROGRESS = 'IN_PROGRESS',
  IN_REVIEW = 'IN_REVIEW',
  BLOCKED = 'BLOCKED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum TaskStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  IN_REVIEW = 'IN_REVIEW',
  BLOCKED = 'BLOCKED',
  DONE = 'DONE',
  CANCELLED = 'CANCELLED',
}

export enum Priority {
  CRITICAL = 'CRITICAL',
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
}

export enum EffortSize {
  XSMALL = 'XSMALL',
  SMALL = 'SMALL',
  MEDIUM = 'MEDIUM',
  LARGE = 'LARGE',
  XLARGE = 'XLARGE',
  MEGALARGE = 'MEGALARGE',
}

export enum InsightStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REVIEWED = 'REVIEWED',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
}

export enum Role {
  ADMIN = 'ADMIN',
  EDITOR = 'EDITOR',
  VIEWER = 'VIEWER',
}

export enum MemberRole {
  ADMIN = 'ADMIN',
  EDITOR = 'EDITOR',
  VIEWER = 'VIEWER',
}

export enum AuditAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  ARCHIVE = 'ARCHIVE',
  RESTORE = 'RESTORE',
  MOVE = 'MOVE',
  ASSIGN = 'ASSIGN',
  UNASSIGN = 'UNASSIGN',
  COMPLETE = 'COMPLETE',
  REOPEN = 'REOPEN',
}

export enum ActivityType {
  FEATURE_CREATED = 'FEATURE_CREATED',
  FEATURE_UPDATED = 'FEATURE_UPDATED',
  FEATURE_COMPLETED = 'FEATURE_COMPLETED',
  TASK_CREATED = 'TASK_CREATED',
  TASK_UPDATED = 'TASK_UPDATED',
  TASK_COMPLETED = 'TASK_COMPLETED',
  COMMENT_ADDED = 'COMMENT_ADDED',
  DEPENDENCY_ADDED = 'DEPENDENCY_ADDED',
  DEPENDENCY_REMOVED = 'DEPENDENCY_REMOVED',
  MEMBER_ADDED = 'MEMBER_ADDED',
  MEMBER_REMOVED = 'MEMBER_REMOVED',
  AI_ANALYSIS_COMPLETED = 'AI_ANALYSIS_COMPLETED',
  CODE_CHANGE_DETECTED = 'CODE_CHANGE_DETECTED',
  MILESTONE_REACHED = 'MILESTONE_REACHED',
  DEADLINE_APPROACHING = 'DEADLINE_APPROACHING',
  RISK_IDENTIFIED = 'RISK_IDENTIFIED',
}

// ============================================
// Position & Geometry Types
// ============================================

export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

// ============================================
// API Request/Response Types
// ============================================

export interface CreateRoadmapRequest {
  name: string;
  description?: string;
  colorScheme?: string;
}

export interface UpdateRoadmapRequest {
  name?: string;
  description?: string;
  colorScheme?: string;
  isArchived?: boolean;
}

export interface CreateWorkstreamRequest {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  parentId?: string;
}

export interface CreateFeatureRequest {
  title: string;
  description?: string;
  status?: FeatureStatus;
  priority?: Priority;
  effort?: EffortSize;
  startDate?: Date;
  endDate?: Date;
  positionX?: number;
  positionY?: number;
  tags?: string[];
}

export interface CreateTaskRequest {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: Priority;
  startDate?: Date;
  endDate?: Date;
  dueDate?: Date;
  estimateHours?: number;
  assigneeId?: string;
}

export interface CreateDependencyRequest {
  fromFeatureId: string;
  toFeatureId: string;
  type?: DependencyType;
  lag?: number;
}

export interface AIAnalyzeRequest {
  roadmapId: string;
  options?: {
    scanGit?: boolean;
    generateTasks?: boolean;
    assessRisks?: boolean;
    predictTimeline?: boolean;
  };
}

export interface ExportRequest {
  roadmapId: string;
  format: 'PDF' | 'PNG' | 'SVG' | 'JSON' | 'CSV' | 'XLSX';
  options?: {
    includeArchived?: boolean;
    workstreamIds?: string[];
    dateRange?: { start: Date; end: Date };
  };
}
```

---

## 4. Database Indexes & Performance

### 4.1 Index Strategy

```sql
-- Core entity lookups
CREATE INDEX idx_roadmaps_owner ON roadmaps(owner_id);
CREATE INDEX idx_roadmaps_archived ON roadmaps(is_archived);

-- Workstream queries
CREATE INDEX idx_workstreams_roadmap ON workstreams(roadmap_id);
CREATE INDEX idx_workstreams_parent ON workstreams(parent_id);
CREATE INDEX idx_workstreams_order ON workstreams(order);

-- Feature queries
CREATE INDEX idx_features_workstream ON features(workstream_id);
CREATE INDEX idx_features_status ON features(status);
CREATE INDEX idx_features_priority ON features(priority);
CREATE INDEX idx_features_dates ON features(start_date, end_date);

-- Task queries
CREATE INDEX idx_tasks_feature ON tasks(feature_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_assignee ON tasks(assignee_id);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);

-- Dependency queries
CREATE INDEX idx_dependencies_from ON dependencies(from_feature_id);
CREATE INDEX idx_dependencies_to ON dependencies(to_feature_id);

-- AI & Analysis
CREATE INDEX idx_code_insights_task ON code_insights(task_id);
CREATE INDEX idx_code_insights_status ON code_insights(status);
CREATE INDEX idx_code_insights_commit ON code_insights(commit_hash);
CREATE INDEX idx_ai_analyses_roadmap ON ai_analyses(roadmap_id);

-- Audit & Activity
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at);

-- Full-text search
CREATE INDEX idx_search_vector ON search_index USING GIN(search_vector);
```

### 4.2 Query Optimization

```typescript
// Example optimized queries with Prisma

// Get roadmap with nested data (avoid N+1)
const roadmap = await prisma.roadmap.findUnique({
  where: { id: roadmapId },
  include: {
    workstreams: {
      include: {
        features: {
          include: {
            tasks: true,
            dependencies: true,
          },
        },
      },
    },
  },
});

// Get features with pagination
const features = await prisma.feature.findMany({
  where: { workstreamId },
  include: {
    tasks: {
      take: 10,
      orderBy: { order: 'asc' },
    },
    dependencies: true,
  },
  skip: (page - 1) * pageSize,
  take: pageSize,
  orderBy: { createdAt: 'desc' },
});

// Bulk update for progress rollup
await prisma.$transaction([
  prisma.workstream.update({
    where: { id: workstreamId },
    data: { progress: calculatedProgress },
  }),
  prisma.activity.create({
    data: {
      type: 'FEATURE_COMPLETED',
      entityType: 'workstream',
      entityId: workstreamId,
      metadata: { progress: calculatedProgress },
    },
  }),
]);
```

---

## 5. Data Migration Strategy

### 5.1 Migration Phases

```
Phase 1: Core Schema
  - Users, Roadmaps, Workstreams
  - Basic CRUD operations

Phase 2: Features & Tasks
  - Features, Tasks, Dependencies
  - Position tracking

Phase 3: AI & Code Inspection
  - CodeInsight, AIAnalysis
  - Integration tables

Phase 4: Collaboration
  - Comments, Attachments, TimeEntry
  - Activity tracking

Phase 5: Audit & Search
  - AuditLog, SearchIndex
  - Performance optimization
```

### 5.2 Seed Data

```typescript
// seed.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Create demo user
  const user = await prisma.user.upsert({
    where: { email: 'demo@vivim.app' },
    update: {},
    create: {
      email: 'demo@vivim.app',
      name: 'Demo User',
      role: 'ADMIN',
    },
  });

  // Create demo roadmap
  const roadmap = await prisma.roadmap.create({
    data: {
      name: 'VIVIM Platform Roadmap',
      description: 'Main product roadmap for VIVIM platform',
      ownerId: user.id,
      workstreams: {
        create: [
          {
            name: 'Core Platform',
            color: '#3B82F6',
            order: 1,
            features: {
              create: [
                {
                  title: 'User Authentication',
                  status: 'COMPLETED',
                  priority: 'CRITICAL',
                  progress: 100,
                },
                {
                  title: 'Database Schema',
                  status: 'IN_PROGRESS',
                  priority: 'HIGH',
                  progress: 75,
                },
              ],
            },
          },
          {
            name: 'AI Features',
            color: '#8B5CF6',
            order: 2,
            features: {
              create: [
                {
                  title: 'Memory Engine',
                  status: 'PLANNED',
                  priority: 'HIGH',
                  progress: 0,
                },
              ],
            },
          },
        ],
      },
    },
  });

  console.log('Seed data created:', { user, roadmap });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

---

**Document Version**: 1.0  
**Last Updated**: 2026-03-27  
**Status**: Ready for Implementation
