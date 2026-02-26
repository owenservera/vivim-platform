# Database Schema Extensions for Sharing System

## Overview

This document describes the database schema extensions required to support VIVIM's network sharing system. The extensions build upon the existing server and network schemas to provide comprehensive support for sharing intents, content tracking, permissions, and analytics.

## Dual-Database Architecture

VIVIM uses a dual-database architecture to achieve complete user data isolation:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         DATABASE SCHEMA LAYERS                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │                     MASTER DATABASE (PostgreSQL)                       │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────────┐   │ │
│  │  │   User     │  │   Circle    │  │        Sharing             │   │ │
│  │  │ (Identity) │  │ (Cross-user)│  │        Metadata            │   │ │
│  │  └─────────────┘  └─────────────┘  └─────────────────────────────┘   │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │                     USER DATABASES (SQLite - Per User)                │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────────┐   │ │
│  │  │Conversations│  │    ACUs     │  │       Profiles             │   │ │
│  │  │ (Content)   │  │ (Atomic)    │  │  (Topics/Entities)         │   │ │
│  │  └─────────────┘  └─────────────┘  └─────────────────────────────┘   │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │                     SHARING SCHEMA EXTENSIONS                           │ │
│  │  ┌─────────────────────────┐  ┌───────────────────────────────────┐   │ │
│  │  │  SharingIntent refs    │  │    ShareLink, Analytics refs     │   │ │
│  │  │  (Master DB)           │  │    (Master DB)                    │   │ │
│  │  └─────────────────────────┘  └───────────────────────────────────┘   │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Schema Classification

| Classification | Database | Description |
|---------------|----------|-------------|
| **MASTER** | PostgreSQL | User identity, auth, device registry |
| **CROSS** | PostgreSQL | Circles, CircleMembers, PeerConnections |
| **USER** | SQLite (per-user) | Conversations, Messages, ACUs, Profiles |
| **SHARING** | PostgreSQL | SharingIntent references, ShareLinks, ContentRecord metadata |

## New Schema Components

### 1. Master Database Models (PostgreSQL)

These tables stay in the shared master database:

```prisma
// ============================================================================
// MASTER DATABASE - IDENTITY & AUTH (PostgreSQL)
// ============================================================================

// User identity - stays in master DB for authentication
model User {
  id              String    @id @default(uuid())
  
  // DID identity
  did             String    @unique
  publicKey       String?
  
  // Profile
  displayName     String?
  avatarUrl       String?
  
  // Authentication
  createdAt       DateTime  @default(now()) @db.Timestamptz(6)
  updatedAt       DateTime  @updatedAt @db.Timestamptz(6)
  
  // Devices
  devices         Device[]
  
  // Cross-user relationships
  circles         CircleMember[]
  
  // Sharing references
  sharingIntents  SharingIntent[] @relation("UserSharingIntents")
  sharedContent   ContentRecord[] @relation("UserSharedContent")
  
  // Analytics
  analyticsEvents AnalyticsEvent[]
  
  @@map("users")
}

model Device {
  id              String    @id @default(uuid())
  userId          String
  deviceId        String    @unique
  name            String?
  
  // Keys
  publicKey       String?
  
  // Status
  lastActiveAt    DateTime  @db.Timestamptz(6)
  createdAt       DateTime  @default(now()) @db.Timestamptz(6)
  
  // Relationships
  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId])
  @@map("devices")
}

// ============================================================================
// MASTER DATABASE - CROSS-USER DATA (PostgreSQL)
// ============================================================================

model Circle {
  id              String    @id @default(uuid())
  
  // Identity
  name            String
  description     String?
  icon            String?
  
  // Ownership
  ownerId         String
  
  // Settings
  isPrivate       Boolean   @default(false)
  sharingSettings Json?
  
  // Default permissions
  defaultPermissions Json?
  
  // Analytics
  totalIncomingShares Int    @default(0)
  totalOutgoingShares Int    @default(0)
  lastSharedAt       DateTime? @db.Timestamptz(6)
  
  // Timestamps
  createdAt       DateTime  @default(now()) @db.Timestamptz(6)
  updatedAt       DateTime  @updatedAt @db.Timestamptz(6)
  
  // Relationships
  members         CircleMember[]
  sharingIntents  SharingIntent[]
  
  @@index([ownerId])
  @@map("circles")
}

model CircleMember {
  id              String    @id @default(uuid())
  circleId       String
  userId         String
  
  // Membership
  role           String    @default("member")
  canInvite      Boolean   @default(false)
  canShare       Boolean   @default(false)
  
  // Status
  joinedAt       DateTime  @default(now()) @db.Timestamptz(6)
  
  // Relationships
  circle         Circle    @relation(fields: [circleId], references: [id], onDelete: Cascade)
  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@unique([circleId, userId])
  @@index([userId])
  @@map("circle_members")
}

model PeerConnection {
  id              String    @id @default(uuid())
  
  // Connection
  peerDid         String
  connectionType  String    @default("relay")
  
  // Status
  isActive        Boolean   @default(true)
  lastConnectedAt DateTime? @db.Timestamptz(6)
  
  createdAt       DateTime  @default(now()) @db.Timestamptz(6)
  
  @@index([peerDid])
  @@map("peer_connections")
}
```

### 2. Sharing Models (PostgreSQL - Master DB)

Sharing metadata stays in the master database for cross-user access:

```prisma
// ============================================================================
// SHARING INTENT (Master DB - for cross-user access)
// ============================================================================

model SharingIntent {
  id              String         @id @default(uuid())
  
  // Intent identification
  version         Int            @default(1)
  intentType      IntentType     @default(SHARE)
  
  // Actor who created the intent
  actorDid         String         @map("actor_did")
  
  // Content reference (actual content stays in user's SQLite DB)
  contentType     ContentType
  contentIds      String[]       // IDs of content items (in user's SQLite)
  contentScope    ContentScope   @default(FULL)
  includeACUs     String[]?      // Specific ACUs to include
  excludeACUs     String[]?      // ACUs to exclude
  
  // Audience configuration
  audienceType     AudienceType
  circleIds       String[]?      // For circle audience (lookup in Master DB)
  userDids        String[]?      // For direct user audience
  linkId          String?        @unique // For link-based sharing
  
  // Permissions
  permissions     Json           // Serialized Permissions object
  
  // Temporal constraints
  schedule        Json?           // Serialized Schedule object
  
  // Content transformations
  transformations Json?           // Serialized Transformations object
  
  // Metadata
  metadata        Json?           // Title, description, tags, etc.
  
  // Policy
  policy          Json?           // Policy configuration
  
  // Lifecycle
  status          IntentStatus    @default(DRAFT)
  createdAt       DateTime        @default(now()) @db.Timestamptz(6)
  updatedAt       DateTime        @updatedAt @db.Timestamptz(6)
  publishedAt     DateTime?       @db.Timestamptz(6)
  expiresAt       DateTime?       @db.Timestamptz(6)
  revokedAt       DateTime?       @db.Timestamptz(6)
  revokedReason   String?
  
  // Ownership (reference to Master DB User)
  ownerDid         String         @map("owner_did")
  
  // Co-ownership (for collaborative shares)
  coOwners         Json?          // Array of co-owner DIDs
  
  // Relationships
  contentRecords  ContentRecord[]
  analyticsEvents AnalyticsEvent[]
  
  // Indexes
  @@index([actorDid])
  @@index([ownerDid])
  @@index([contentType, status])
  @@index([audienceType])
  @@index([publishedAt])
  @@index([expiresAt])
  @@map("sharing_intents")
}

enum IntentType {
  SHARE
  PUBLISH
  EMBED
  FORK
}

enum ContentType {
  CONVERSATION
  ACU
  COLLECTION
  ANNOTATION
  NOTEBOOK
}

enum ContentScope {
  FULL
  PARTIAL
  SUMMARY
  PREVIEW
}

enum AudienceType {
  PUBLIC
  CIRCLE
  USERS
  LINK
}

enum IntentStatus {
  DRAFT
  PENDING
  VALIDATED
  ACTIVE
  EXPIRED
  REVOKED
  CANCELLED
  ARCHIVED
}

// ============================================================================
// SHARE LINKS (Master DB)
// ============================================================================

model ShareLink {
  id              String         @id @default(uuid())
  
  // Link configuration
  linkCode        String         @unique @default(uuid())
  intentId        String         @unique
  
  // Access configuration
  maxUses         Int?           // Maximum uses (null = unlimited)
  usesCount       Int            @default(0)
  expiresAt       DateTime?      @db.Timestamptz(6)
  
  // Password protection
  passwordHash    String?        // Optional password
  
  // Creator
  createdByDid    String
  
  // Status
  isActive        Boolean        @default(true)
  createdAt       DateTime       @default(now()) @db.Timestamptz(6)
  lastUsedAt      DateTime?      @db.Timestamptz(6)
  
  // Relationship
  intent          SharingIntent  @relation(fields: [intentId], references: [id], onDelete: Cascade)
  
  // Indexes
  @@index([createdByDid])
  @@index([isActive, expiresAt])
  @@map("share_links")
}

// ============================================================================
// CONTENT RECORD (Master DB - metadata only, content in User DB)
// ============================================================================

model ContentRecord {
  id              String         @id @default(uuid())
  
  // Content identification (reference to content in user's SQLite)
  contentId       String         @unique // SHA-256 hash
  contentHash     String
  
  // Content metadata
  contentType     ContentType
  size            Int
  mimeType        String?
  
  // Ownership (reference to Master DB)
  ownerDid        String         @map("owner_did")
  creatorDid      String         @map("creator_did")
  
  // Sharing info
  intentId        String?
  
  // Encrypted metadata (for discovery)
  discoveryMetadata Json         // Title, tags, etc. (encrypted or plain)
  
  // Status
  status          ContentRecordStatus @default(ACTIVE)
  createdAt       DateTime       @default(now()) @db.Timestamptz(6)
  updatedAt       DateTime       @updatedAt @db.Timestamptz(6)
  publishedAt     DateTime?      @db.Timestamptz(6)
  expiresAt       DateTime?      @db.Timestamptz(6)
  revokedAt       DateTime?      @db.Timestamptz(6)
  
  // Relationships
  intent          SharingIntent? @relation(fields: [intentId], references: [id])
  providers       ContentProvider[]
  accessLog       ContentAccessLog[]
  
  // Indexes
  @@index([contentType])
  @@index([ownerDid])
  @@index([status])
  @@index([publishedAt])
  @@index([expiresAt])
  @@map("content_records")
}

### 2. Content Registry Models

```prisma
// ============================================================================
// CONTENT RECORD
// ============================================================================

model ContentRecord {
  id              String         @id @default(uuid())
  
  // Content identification
  contentId       String         @unique // SHA-256 hash
  contentHash     String
  
  // Content metadata
  contentType     ContentType
  size            Int
  mimeType        String?
  
  // Ownership
  ownerDid        String         @map("owner_did")
  creatorDid      String         @map("creator_did")
  
  // Sharing info
  intentId        String?
  
  // Encrypted metadata (for discovery)
  discoveryMetadata Json         // Title, tags, etc. (encrypted or plain)
  
  // Status
  status          ContentRecordStatus @default(ACTIVE)
  createdAt       DateTime       @default(now()) @db.Timestamptz(6)
  updatedAt       DateTime       @updatedAt @db.Timestamptz(6)
  publishedAt     DateTime?      @db.Timestamptz(6)
  expiresAt       DateTime?      @db.Timestamptz(6)
  revokedAt       DateTime?      @db.Timestamptz(6)
  
  // Relationships
  intent          SharingIntent? @relation(fields: [intentId], references: [id])
  providers       ContentProvider[]
  accessLog       ContentAccessLog[]
  
  // Indexes
  @@index([contentType])
  @@index([ownerDid])
  @@index([status])
  @@index([publishedAt])
  @@index([expiresAt])
  @@map("content_records")
}

enum ContentRecordStatus {
  ACTIVE
  EXPIRED
  REVOKED
  ARCHIVED
  CORRUPTED
}

// ============================================================================
// USER DATABASE SCHEMA (SQLite - Per User)
// ============================================================================
// These tables exist in each user's isolated SQLite database.
// The sharing system references content from these tables.
// ============================================================================

/*
 * IMPORTANT: The actual content being shared (Conversations, ACUs, etc.)
 * stays in the user's isolated SQLite database. The Master DB only
 * stores references and metadata for cross-user access.
 */

// Example: Conversation model in User's SQLite DB
model UserConversation {
  id              String         @id @default(uuid())
  
  // Content identification
  provider        String
  sourceUrl       String         @unique
  contentHash     String?
  title           String
  model           String?
  
  // State
  state           String         @default("ACTIVE")
  
  // Timestamps
  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt
  capturedAt      DateTime       @default(now())
  
  // Statistics
  messageCount    Int            @default(0)
  userMessageCount Int           @default(0)
  aiMessageCount  Int            @default(0)
  totalWords      Int            @default(0)
  totalCharacters Int            @default(0)
  totalTokens     Int?
  totalCodeBlocks Int            @default(0)
  totalImages     Int            @default(0)
  totalTables     Int            @default(0)
  totalLatexBlocks Int           @default(0)
  totalMermaidDiagrams Int       @default(0)
  totalToolCalls  Int            @default(0)
  
  // Metadata
  metadata        Json           @default("{}")
  tags            String[]       @default("{}")
  
  // Sharing status (reference to Master DB)
  isShared        Boolean        @default(false)
  sharingIntentId String?
  
  // Sharing analytics
  shareCount      Int            @default(0)
  viewCount       Int            @default(0)
  uniqueViewers   Int            @default(0)
  lastSharedAt    DateTime?
  
  @@map("Conversation")
}

// Example: AtomicChatUnit model in User's SQLite DB
model UserAtomicChatUnit {
  id              String         @id @default(uuid())
  
  // Content
  authorDid       String
  signature       String?
  content         String
  language        String?
  type            String
  category        String
  origin          String
  
  // References
  conversationId  String
  messageId       String?
  messageIndex   Int            @default(0)
  
  // AI Metadata
  provider        String?
  model           String?
  sourceTimestamp DateTime?
  extractorVersion String?
  parserVersion   String?
  
  // Quality metrics
  qualityOverall  Int            @default(50)
  contentRichness Int            @default(30)
  structuralIntegrity Int        @default(70)
  uniqueness      Int            @default(50)
  viewCount       Int            @default(0)
  shareCount      Int            @default(0)
  quoteCount      Int            @default(0)
  rediscoveryScore Float?
  
  // Sharing
  sharingPolicy   String         @default("self")
  sharingCircles  Json           @default("[]")
  canView         Boolean        @default(true)
  canAnnotate     Boolean        @default(false)
  canRemix        Boolean        @default(false)
  canReshare      Boolean        @default(false)
  
  // Metadata
  metadata        Json           @default("{}")
  
  @@map("AtomicChatUnit")
}

// Topic Profile - User's learned topics
model UserTopicProfile {
  id              String         @id @default(uuid())
  userId          String
  topic           String
  mentionCount    Int            @default(0)
  lastMentionedAt DateTime?
  firstMentionedAt DateTime?
  confidence      Float          @default(0)
  relatedTopics   Json           @default("[]")
  keyInsights     Json           @default("[]")
  associatedAcuIds Json          @default("[]")
  metadata        Json           @default("{}")
  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt
  
  @@map("TopicProfile")
}

// Entity Profile - User's learned entities
model UserEntityProfile {
  id              String         @id @default(uuid())
  userId          String
  name            String
  type            String
  mentionCount    Int            @default(0)
  lastMentionedAt DateTime?
  firstMentionedAt DateTime?
  confidence      Float          @default(0)
  description     String?
  relationships   Json           @default("[]")
  associatedAcuIds Json          @default("[]")
  metadata        Json           @default("{}")
  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt
  
  @@map("EntityProfile")
}

// Context Bundle - User's compiled context
model UserContextBundle {
  id              String         @id @default(uuid())
  userId          String
  name            String
  description     String?
  topicIds        Json           @default("[]")
  entityIds       Json           @default("[]")
  acuIds          Json           @default("[]")
  bundleType      String
  content         String?
  tokenCount      Int?
  compiledAt      DateTime?
  lastUsedAt      DateTime?
  usageCount      Int            @default(0)
  isDefault       Boolean        @default(false)
  metadata        Json           @default("{}")
  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt
  
  @@map("ContextBundle")
}

// ============================================================================
// CONTENT PROVIDER
// ============================================================================

model ContentProvider {
  id              String         @id @default(uuid())
  
  // References
  contentRecordId String         @map("content_record_id")
  nodeId          String         @map("node_id")
  
  // Provider details
  isOwner         Boolean        @default(false)
  isPrimary       Boolean        @default(false)
  
  // Replication info
  replicaNumber   Int            @default(1)
  
  // Status
  isOnline        Boolean        @default(true)
  lastVerifiedAt  DateTime?      @db.Timestamptz(6)
  
  // Storage info
  localPath       String?
  size            BigInt?
  checksum        String?
  
  // Timestamps
  createdAt       DateTime       @default(now()) @db.Timestamptz(6)
  updatedAt       DateTime       @updatedAt @db.Timestamptz(6)
  
  // Relationships
  contentRecord   ContentRecord  @relation(fields: [contentRecordId], references: [id], onDelete: Cascade)
  
  // Indexes
  @@unique([contentRecordId, nodeId])
  @@index([contentRecordId])
  @@index([nodeId])
  @@map("content_providers")
}

// ============================================================================
// CONTENT ACCESS LOG
// ============================================================================

model ContentAccessLog {
  id              String         @id @default(uuid())
  
  // References
  contentRecordId String         @map("content_record_id")
  intentId         String?        @map("intent_id")
  
  // Access details
  accessorDid     String?        @map("accessor_did") // Nullable for anonymous
  accessType       AccessType
  
  // Context
  sourceIp        String?
  userAgent       String?
  deviceId        String?
  referrer        String?
  
  // Result
  success         Boolean        @default(true)
  errorCode       String?
  
  // Timestamps
  accessedAt      DateTime       @default(now()) @db.Timestamptz(6)
  
  // Relationships
  contentRecord   ContentRecord  @relation(fields: [contentRecordId], references: [id], onDelete: Cascade)
  
  // Indexes
  @@index([contentRecordId])
  @@index([intentId])
  @@index([accessorDid])
  @@index([accessedAt])
  @@map("content_access_log")
}

enum AccessType {
  VIEW
  COPY
  DOWNLOAD
  ANNOTATE
  REMIX
  FORWARD
  SAVE
}
```

### 3. Analytics Models (PostgreSQL - Master DB)

```prisma
// ============================================================================
// ANALYTICS EVENT (Master DB - cross-user aggregation)
// ============================================================================

model AnalyticsEvent {
  id              String         @id @default(uuid())
  
  // Event identification
  eventType       AnalyticsEventType
  
  // Actor (reference to Master DB User)
  actorDid        String?        @map("actor_did")
  
  // Context
  intentId        String?        @map("intent_id")
  contentRecordId String?        @map("content_record_id")
  
  // Event data
  eventData       Json
  
  // Privacy
  isAnonymized    Boolean        @default(false)
  
  // Timestamps
  timestamp       DateTime       @default(now()) @db.Timestamptz(6)
  
  // Processed flag
  isProcessed     Boolean        @default(false)
  
  // Indexes
  @@index([eventType])
  @@index([actorDid])
  @@index([intentId])
  @@index([timestamp])
  @@index([isProcessed, timestamp])
  @@map("analytics_events")
}

enum AnalyticsEventType {
  // Share lifecycle
  SHARE_CREATED
  SHARE_VIEWED
  SHARE_ACCEPTED
  SHARE_DECLINED
  SHARE_REVOKED
  SHARE_EXPIRED
  
  // Link specific
  LINK_CLICKED
  LINK_CREATED
  
  // Engagement
  CONTENT_SAVED
  CONTENT_FORWARDED
  CONTENT_ANNOTATED
  
  // Privacy
  SHARE_BLOCKED
  SHARE_REPORTED
}

// ============================================================================
// AGGREGATED METRICS
// ============================================================================

model AggregatedMetrics {
  id              String         @id @default(uuid())
  
  // Metric identification
  metricType      MetricType
  entityType      String         // user, content, circle
  entityId        String
  
  // Time aggregation
  aggregationType AggregationType
  aggregationKey  String         // "2026-02" for monthly, "2026-02-14" for daily
  
  // Metric values
  metrics         Json           // JSON object with metric values
  
  // Timestamps
  computedAt      DateTime       @default(now()) @db.Timestamptz(6)
  
  // Indexes
  @@unique([metricType, entityType, entityId, aggregationType, aggregationKey])
  @@index([entityType, entityId])
  @@index([aggregationType, aggregationKey])
  @@map("aggregated_metrics")
}

enum MetricType {
  SHARING_METRICS
  ENGAGEMENT_METRICS
  REACH_METRICS
  PERFORMANCE_METRICS
}

enum AggregationType {
  HOURLY
  DAILY
  WEEKLY
  MONTHLY
  YEARLY
}

// ============================================================================
// INSIGHTS
// ============================================================================

model Insight {
  id              String         @id @default(uuid())
  
  // Insight identification
  insightType     InsightType
  
  // Target entity
  userDid         String         @map("user_did")
  
  // Content
  title           String
  description     String
  
  // Metadata
  confidence      Float          // 0-1
  relevanceScore  Float          // 0-1
  data            Json?
  
  // Status
  isRead          Boolean        @default(false)
  isDismissed     Boolean        @default(false)
  
  // Timestamps
  generatedAt     DateTime       @default(now()) @db.Timestamptz(6)
  readAt          DateTime?      @db.Timestamptz(6)
  
  // Indexes
  @@index([userDid, isRead])
  @@index([userDid, generatedAt])
  @@map("insights")
}

enum InsightType {
  PATTERN_DETECTED
  ANOMALY_DETECTED
  RECOMMENDATION
  TREND_DETECTED
  ALERT
}
```

### 4. Permission Models

```prisma
// ============================================================================
// SHARE PERMISSIONS
// ============================================================================

model SharePermission {
  id              String         @id @default(uuid())
  
  // References
  intentId        String         @map("intent_id")
  targetDid       String         @map("target_did")
  targetType      TargetType
  
  // Permissions
  canView         Boolean        @default(true)
  canCopy         Boolean        @default(false)
  canAnnotate     Boolean        @default(false)
  canRemix        Boolean        @default(false)
  canShare        Boolean        @default(false)
  canDownload     Boolean        @default(false)
  
  // Constraints
  maxViews        Int?
  viewsCount      Int            @default(0)
  expiresAt        DateTime?      @db.Timestamptz(6)
  
  // Status
  status          PermissionStatus @default(ACTIVE)
  grantedAt       DateTime       @default(now()) @db.Timestamptz(6)
  revokedAt       DateTime?      @db.Timestamptz(6)
  
  // Indexes
  @@unique([intentId, targetDid])
  @@index([targetDid])
  @@index([status])
  @@map("share_permissions")
}

enum TargetType {
  USER
  CIRCLE
  DOMAIN
}

enum PermissionStatus {
  ACTIVE
  REVOKED
  EXPIRED
  EXHAUSTED
}

// ============================================================================
// AUDIENCE MEMBER
// ============================================================================

model AudienceMember {
  id              String         @id @default(uuid())
  
  // References
  intentId        String         @map("intent_id")
  memberDid       String         @map("member_did")
  memberType      AudienceMemberType
  
  // Status
  status          AudienceMemberStatus @default(PENDING)
  
  // Timestamps
  addedAt         DateTime       @default(now()) @db.Timestamptz(6)
  acceptedAt      DateTime?      @db.Timestamptz(6)
  
  // Indexes
  @@unique([intentId, memberDid])
  @@index([memberDid])
  @@map("audience_members")
}

enum AudienceMemberType {
  USER
  CIRCLE_MEMBER
}

enum AudienceMemberStatus {
  PENDING
  ACCEPTED
  DECLINED
  REMOVED
}
```

### 5. Federation Models

```prisma
// ============================================================================
// FEDERATION SHARES
// ============================================================================

model FederationShare {
  id              String         @id @default(uuid())
  
  // References
  intentId        String         @map("intent_id")
  sourceInstance  String         // Source instance DID/URL
  targetInstance  String         // Target instance DID/URL
  
  // Status
  status          FederationShareStatus @default(PENDING)
  errorCode       String?
  errorMessage    String?
  
  // Timestamps
  initiatedAt     DateTime       @default(now()) @db.Timestamptz(6)
  completedAt     DateTime?      @db.Timestamptz(6)
  
  // Indexes
  @@index([intentId])
  @@index([sourceInstance])
  @@index([targetInstance])
  @@map("federation_shares")
}

enum FederationShareStatus {
  PENDING
  SENT
  ACKNLEDGED
  REJECTED
  FAILED
}
```

## Extended Existing Models

### Extended Circle Model

```prisma
// Add to existing Circle model
model Circle {
  // ... existing fields ...
  
  // Sharing settings
  sharingSettings Json?           // Circle-specific sharing config
  
  // Default permissions
  defaultPermissions Json?        // Default permissions for shares
  
  // Sharing analytics
  totalIncomingShares Int         @default(0)
  totalOutgoingShares Int         @default(0)
  lastSharedAt       DateTime?    @db.Timestamptz(6)
  
  // Members (existing)
  // ...
}
```

### Extended User Model

```prisma
// Add to existing User model
model User {
  // ... existing fields ...
  
  // Sharing preferences
  sharingPreferences Json?        // User's sharing preferences
  
  // Analytics settings
  analyticsSettings  Json?        // Analytics privacy settings
  
  // Sharing stats
  totalShares        Int          @default(0)
  totalViewsReceived Int          @default(0)
  
  // ... existing relations ...
}
```

### Extended Conversation Model

```prisma
// Add to existing Conversation model
model Conversation {
  // ... existing fields ...
  
  // Sharing status
  isShared          Boolean       @default(false)
  sharingIntentId  String?        @unique
  
  // Sharing analytics
  shareCount        Int           @default(0)
  viewCount         Int           @default(0)
  uniqueViewers     Int           @default(0)
  
  // Last share
  lastSharedAt      DateTime?     @db.Timestamptz(6)
  
  // ... existing relations ...
}
```

## Indexing Strategy

### Primary Indexes

```prisma
// For intent queries by user
@@index([actorDid, status, createdAt])

// For content queries by owner
@@index([ownerDid, status, createdAt])

// For analytics time-series queries
@@index([eventType, timestamp])
@@index([entityType, entityId, aggregationType, aggregationKey])
```

### Composite Indexes

```prisma
// For finding active shares by content
@@index([contentType, status, publishedAt])

// For finding expiring content
@@index([status, expiresAt])

// For audience queries
@@index([intentId, memberDid, status])
```

### Partial Indexes

```prisma
// Active intents only
@@index([status]) WHERE status = 'ACTIVE'

// Processed analytics only
@@index([timestamp]) WHERE isProcessed = false
```

## Migration Strategy

### Phase 1: Schema Extension (Dual-Database)

1. Set up PostgreSQL master database with new sharing tables
2. Create UserDatabaseManager for SQLite handling
3. Create SQLite schemas for user data
4. No data migration required for initial setup

### Phase 2: Data Population

1. Create migration scripts for existing shares to Master DB
2. Backfill analytics events to Master DB
3. Verify data integrity across both databases

### Phase 3: Application Integration

1. Update application code to use dual-database approach
2. Implement UserDatabaseManager routing
3. Deploy in stages
4. Monitor performance

### Phase 4: User Migration (Optional)

For existing users:
1. Create user SQLite database
2. Copy user-specific tables from master to SQLite
3. Keep cross-user tables in Master DB
4. Verify data integrity

## Performance Considerations

### Partitioning

For high-volume tables:

```prisma
// Partition analytics_events by time
// Use PostgreSQL table partitioning for analytics_events
```

### Query Optimization

```sql
-- Example optimized query
SELECT * FROM sharing_intents
WHERE actorDid = :userDid
  AND status = 'ACTIVE'
  AND publishedAt > NOW() - INTERVAL '30 days'
ORDER BY publishedAt DESC
LIMIT 20;
```

## Conclusion

This schema extension provides comprehensive support for VIVIM's network sharing system with the new dual-database architecture:

- **Master Database (PostgreSQL)**: Identity, auth, cross-user data, sharing metadata
- **User Databases (SQLite)**: Complete isolation for user content and intelligence

The schema supports:

- **Sharing Intent**: Full lifecycle management of sharing decisions (Master DB)
- **Content Registry**: Track shared content references across the network (Master DB)
- **User Content**: Isolated storage for conversations, ACUs, profiles (SQLite)
- **Permissions**: Fine-grained access control (Master DB)
- **Analytics**: Comprehensive event tracking and aggregation (Master DB)
- **Federation**: Cross-instance sharing support (Master DB)

The schema is designed for:

- Complete user data isolation (SQLite per user)
- Cross-user sharing coordination (PostgreSQL)
- Performance at scale
- Privacy preservation
- Flexibility for future features
- Integration with existing models
