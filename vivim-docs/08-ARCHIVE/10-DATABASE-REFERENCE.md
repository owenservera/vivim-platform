# Database Schema Reference

## Complete Schema Models

This document lists all database models in `schema.prisma` relevant to the NETWORK sharing system.

## Core Models

### User
```prisma
model User {
  id                  String   @id @default(uuid())
  did                 String   @unique
  handle              String?  @unique
  displayName         String?
  email               String?  @unique
  publicKey           String
  status              AccountStatus @default(ACTIVE)
  // Relations
  sharingPolicies    SharingPolicy[]
  contentStakeholders ContentStakeholder[]
}
```

### Circle & Membership
```prisma
model Circle {
  id          String   @id @default(uuid())
  ownerId     String
  name        String
  isPublic    Boolean  @default(false)
  members     CircleMember[]
  owner       User     @relation("CircleOwner", fields: [ownerId], references: [id])
}

model CircleMember {
  circleId  String
  userId    String
  role      String   @default("member")
  canInvite Boolean  @default(false)
  canShare  Boolean  @default(true)
  circle    Circle   @relation(fields: [circleId], references: [id])
  user      User     @relation(fields: [userId], references: [id])
}
```

## Sharing Models

### SharingIntent
```prisma
model SharingIntent {
  id              String         @id @default(uuid())
  version         Int            @default(1)
  intentType      IntentType     @default(SHARE)
  actorDid        String         
  contentType     ContentType
  contentIds      String[]       
  contentScope    ContentScope   @default(FULL)
  audienceType    AudienceType
  circleIds       String[]       @default([])
  userDids        String[]       @default([])
  permissions     Json           
  schedule        Json?          
  transformations Json?          
  status          IntentStatus   @default(DRAFT)
  publishedAt     DateTime?      
  expiresAt       DateTime?      
  revokedAt       DateTime?      
  ownerDid        String         
  
  shareLinks      ShareLink[]
  contentRecords  ContentRecord[]
  
  @@index([actorDid])
  @@index([ownerDid])
  @@index([status])
}
```

### ShareLink
```prisma
model ShareLink {
  id              String        @id @default(uuid())
  linkCode        String        @unique
  intentId        String        @unique
  maxUses         Int?         
  usesCount       Int          @default(0)
  expiresAt       DateTime?    
  passwordHash    String?       
  isActive        Boolean      @default(true)
  createdAt       DateTime     @default(now())
  lastUsedAt      DateTime?    
  
  intent          SharingIntent @relation(fields: [intentId], references: [id])
}
```

### ContentRecord
```prisma
model ContentRecord {
  id                String              @id @default(uuid())
  contentId         String              @unique
  contentHash       String
  contentType       ContentType
  size              Int
  mimeType          String?
  ownerDid          String              
  creatorDid        String              
  intentId          String?
  status            ContentRecordStatus @default(ACTIVE)
  publishedAt       DateTime?          
  expiresAt         DateTime?          
  
  providers         ContentProvider[]
  accessLog         ContentAccessLog[]
  
  intent            SharingIntent?      @relation(fields: [intentId], references: [id])
}
```

### ContentProvider
```prisma
model ContentProvider {
  id              String        @id @default(uuid())
  contentRecordId String        
  nodeId          String        
  isOwner         Boolean       @default(false)
  isPrimary       Boolean       @default(false)
  replicaNumber   Int           @default(1)
  isOnline        Boolean       @default(true)
  localPath       String?
  size            BigInt?
  
  contentRecord   ContentRecord @relation(fields: [contentRecordId], references: [id])
}
```

### SharingPolicy
```prisma
model SharingPolicy {
  id          String   @id @default(uuid())
  contentId   String   @unique
  contentType String  @default("conversation")
  ownerId     String
  
  audience    Json    
  permissions Json    
  temporal    Json?   
  geographic  Json?   
  contextual  Json?   
  
  status      String   @default("active")
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  owner       User     @relation(fields: [ownerId], references: [id])
  stakeholders ContentStakeholder[]
}
```

### ContentAccessGrant
```prisma
model ContentAccessGrant {
  id              String   @id @default(uuid())
  policyId        String
  grantedTo       String   
  grantedToType   String   @default("user")
  grantedBy       String   
  accessLevel     String   @default("view")
  permissions     Json?    
  grantedAt       DateTime @default(now())
  expiresAt       DateTime?
  viewsUsed       Int      @default(0)
  maxViews        Int String   @default("active")
  
  sharingIntent   SharingIntent? @?
  status         relation(fields: [policyId], references: [id])
}
```

### ContentAccessLog
```prisma
model ContentAccessLog {
  id              String   @id @default(uuid())
  policyId        String?
  intentId        String?
  contentRecordId String?
  accessorId      String   
  accessorType    String   @default("user")
  action          String   
  granted         Boolean  @default(true)
  denialReason    String?
  timestamp       DateTime @default(now())
  ipAddress       String?
  userAgent      String?
  
  sharingIntent   SharingIntent? @relation(fields: [policyId], references: [id])
  contentRecord   ContentRecord? @relation(fields: [contentRecordId], references: [id])
}
```

## Analytics Models

### AnalyticsEvent
```prisma
model AnalyticsEvent {
  id              String              @id @default(uuid())
  eventType       AnalyticsEventType
  actorDid        String?             
  intentId        String?             
  contentRecordId String?             
  eventData       Json
  isAnonymized    Boolean             @default(false)
  timestamp       DateTime            @default(now())
  isProcessed     Boolean             @default(false)
}
```

### AggregatedMetrics
```prisma
model AggregatedMetrics {
  id              String         @id @default(uuid())
  metricType      MetricType
  entityType      String         
  entityId        String
  aggregationType AggregationType
  aggregationKey  String         
  metrics         Json           
  computedAt      DateTime       @default(now())
}
```

### Insight
```prisma
model Insight {
  id              String      @id @default(uuid())
  insightType     InsightType
  userDid         String      
  title           String
  description     String
  confidence      Float       
  relevanceScore  Float       
  data            Json?
  isRead          Boolean     @default(false)
  isDismissed     Boolean     @default(false)
  generatedAt     DateTime    @default(now())
}
```

## Enums

### IntentType
```prisma
enum IntentType {
  SHARE
  PUBLISH
  EMBED
  FORK
}
```

### ContentType
```prisma
enum ContentType {
  CONVERSATION
  ACU
  COLLECTION
  NOTEBOOK
  MEMORY
}
```

### ContentScope
```prisma
enum ContentScope {
  FULL
  PARTIAL
  SUMMARY
  PREVIEW
}
```

### AudienceType
```prisma
enum AudienceType {
  PUBLIC
  CIRCLE
  USERS
  LINK
}
```

### IntentStatus
```prisma
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
```

### AnalyticsEventType
```prisma
enum AnalyticsEventType {
  SHARE_CREATED
  SHARE_VIEWED
  SHARE_ACCEPTED
  SHARE_DECLINED
  SHARE_REVOKED
  SHARE_EXPIRED
  LINK_CLICKED
  LINK_CREATED
  CONTENT_SAVED
  CONTENT_FORWARDED
  CONTENT_ANNOTATED
  SHARE_BLOCKED
  SHARE_REPORTED
}
```

### MetricType
```prisma
enum MetricType {
  SHARING_METRICS
  ENGAGEMENT_METRICS
  REACH_METRICS
  PERFORMANCE_METRICS
}
```

### AggregationType
```prisma
enum AggregationType {
  HOURLY
  DAILY
  WEEKLY
  MONTHLY
  YEARLY
}
```

### InsightType
```prisma
enum InsightType {
  PATTERN_DETECTED
  ANOMALY_DETECTED
  RECOMMENDATION
  TREND_DETECTED
  ALERT
}
```

### ContentRecordStatus
```prisma
enum ContentRecordStatus {
  ACTIVE
  EXPIRED
  REVOKED
  ARCHIVED
  CORRUPTED
}
```

## Indexes Summary

| Model | Indexes |
|-------|---------|
| SharingIntent | actorDid, ownerDid, status, audienceType, publishedAt, expiresAt |
| ShareLink | createdByDid, (isActive, expiresAt) |
| ContentRecord | contentType, ownerDid, status, publishedAt, expiresAt |
| ContentProvider | contentRecordId, nodeId |
| AnalyticsEvent | eventType, actorDid, intentId, timestamp |
| AggregatedMetrics | (metricType, entityType, entityId, aggregationType, aggregationKey) |

---

Generated: 2026-02-14
