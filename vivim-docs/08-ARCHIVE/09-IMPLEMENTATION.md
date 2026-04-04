# NETWORK Implementation Guide

## Overview

This document describes the implemented NETWORK sharing system for VIVIM. The implementation simplifies the original dual-database design to use a single PostgreSQL database with row-level isolation via `ownerId` and `authorDid` filtering.

## Architecture Decision

### Original Design (Discarded)
- Dual-database: PostgreSQL (master) + SQLite (per-user)
- Complexity: High - 2 database systems to manage, sync logic required

### Implemented Design
- Single PostgreSQL with ownerId filtering
- Simpler: One database to manage, query, backup
- Uses existing Prisma setup with proper `where` clauses for isolation
- PostgreSQL handles millions of rows easily

## Database Schema

### New Models Added to schema.prisma

#### SharingIntent
Core model for managing sharing lifecycle:
```prisma
model SharingIntent {
  id              String       @id @default(uuid())
  version         Int          @default(1)
  intentType      IntentType   @default(SHARE)
  actorDid        String       
  contentType     ContentType
  contentIds      String[]     
  contentScope    ContentScope @default(FULL)
  audienceType    AudienceType
  circleIds       String[]     @default([])
  userDids        String[]     @default([])
  permissions     Json         
  schedule        Json?        
  transformations Json?        
  status          IntentStatus @default(DRAFT)
  expiresAt       DateTime?    
  // ... timestamps
}
```

#### ShareLink
Shareable links with optional password protection:
```prisma
model ShareLink {
  id              String        @id @default(uuid())
  linkCode        String        @unique @default(uuid())
  intentId        String        @unique
  maxUses         Int?         
  usesCount       Int          @default(0)
  expiresAt       DateTime?    
  passwordHash    String?       
  isActive        Boolean      @default(true)
}
```

#### ContentRecord
Metadata about shared content:
```prisma
model ContentRecord {
  contentId       String   @unique
  contentHash     String
  contentType     ContentType
  size            Int
  ownerDid        String
  intentId        String?
  status          ContentRecordStatus @default(ACTIVE)
}
```

#### AnalyticsEvent
Track all sharing events:
```prisma
model AnalyticsEvent {
  eventType       AnalyticsEventType
  actorDid        String?
  intentId        String?
  contentRecordId String?
  eventData       Json
  isAnonymized    Boolean  @default(false)
  timestamp       DateTime @default(now())
}
```

#### SharingPolicy (from phase3)
Granular access control:
```prisma
model SharingPolicy {
  contentId   String @unique
  contentType String
  ownerId     String
  audience    Json   
  permissions Json   
  temporal    Json?  
  geographic  Json?  
  contextual  Json?  
  status      String @default("active")
}
```

## Services

### sharing-intent-service.js

Core service for managing sharing intents:

| Function | Description |
|----------|-------------|
| `createSharingIntent()` | Create new sharing intent |
| `getSharingIntent()` | Get intent by ID |
| `getIntentsByOwner()` | List user's intents with filtering |
| `updateSharingIntent()` | Update intent properties |
| `publishSharingIntent()` | Publish to network |
| `revokeSharingIntent()` | Revoke sharing |
| `createShareLink()` | Create shareable link |
| `getShareLink()` | Get link by code |
| `accessShareLink()` | Access content via link |
| `logAnalyticsEvent()` | Track events |

### sharing-encryption-service.js

Security utilities for content encryption:

| Function | Description |
|----------|-------------|
| `generateContentKey()` | Generate random AES-256 key |
| `encryptContent()` | Encrypt with AES-256-GCM |
| `decryptContent()` | Decrypt content |
| `encryptWithPassword()` | Password-protected encryption |
| `hashPassword()` | Secure password hashing |
| `verifyPassword()` | Verify password hash |
| `generateShareCode()` | Generate random share code |

### sharing-analytics-service.js

Analytics and insights:

| Function | Description |
|----------|-------------|
| `trackShareEvent()` | Record sharing event |
| `getUserSharingMetrics()` | User's sharing statistics |
| `getContentAnalytics()` | Content engagement metrics |
| `getUserActivity()` | Activity log |
| `generateUserInsights()` | AI-generated insights |
| `getInsights()` | Retrieve insights |
| `markInsightRead()` | Mark insight as read |

## API Endpoints

All endpoints under `/api/v2/sharing`

### Intent Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/intents` | Create sharing intent |
| GET | `/intents` | List user's intents |
| GET | `/intents/:id` | Get intent details |
| PATCH | `/intents/:id` | Update intent |
| POST | `/intents/:id/publish` | Publish intent |
| POST | `/intents/:id/revoke` | Revoke intent |

### Share Links

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/links` | Create share link |
| GET | `/links/:code` | Get link info |
| POST | `/links/:code/access` | Access via link |

### Analytics

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/analytics/metrics` | User metrics |
| GET | `/analytics/activity` | Activity log |
| GET | `/analytics/insights` | AI insights |
| POST | `/analytics/insights/:id/read` | Mark read |
| POST | `/analytics/insights/:id/dismiss` | Dismiss insight |

## Data Isolation

### User Data Access Pattern

All data access must include owner filtering:

```javascript
// Conversations - filter by ownerId
const conversations = await prisma.conversation.findMany({
  where: { ownerId: userId }
});

// ACUs - filter by authorDid
const acus = await prisma.atomicChatUnit.findMany({
  where: { authorDid: userDid }
});

// Verify ownership before sharing
const isOwner = await verifyContentOwnership('conversation', contentId, userId);
```

### Helper Functions (user-database-manager.js)

- `verifyContentOwnership()` - Verify user owns content
- `checkSharePermission()` - Check if sharing is allowed

## Usage Example

### Create a Share

```javascript
// 1. Create sharing intent
const intent = await sharingIntentService.createSharingIntent({
  actorDid: user.did,
  ownerDid: user.did,
  contentType: 'CONVERSATION',
  contentIds: [conversationId],
  audienceType: 'CIRCLE',
  circleIds: [circleId],
  permissions: { canView: true, canAnnotate: true },
  schedule: { expiresAt: '2026-03-01T00:00:00Z' }
});

// 2. Publish intent
await sharingIntentService.publishSharingIntent(intent.id);

// 3. Create share link
const shareLink = await sharingIntentService.createShareLink(intent.id, {
  maxUses: 100,
  expiresAt: '2026-02-28T00:00:00Z'
});

// 4. Share URL
const shareUrl = `/share/${shareLink.linkCode}`;
```

### Access via Link

```javascript
const intent = await sharingIntentService.accessShareLink(linkCode, {
  password: userPassword,
  accessorDid: accessorDid
});
```

## Security

### Encryption
- AES-256-GCM for content encryption
- PBKDF2 (100k iterations) for password hashing
- Timing-safe comparison for password verification

### Access Control
- Owner verification before any operation
- Temporal constraints (expiration dates)
- Usage limits on share links
- Optional password protection

### Privacy
- Row-level isolation via ownerId/authorDid
- Analytics can be anonymized
- User-controlled privacy settings

## Migration from Design Docs

The implementation differs from design docs in these ways:

| Design Doc | Implementation |
|------------|----------------|
| Dual-database (PostgreSQL + SQLite) | Single PostgreSQL |
| Complex federation models | Simplified sharing intents |
| Network orchestration | Deferred to future phase |
| Content publishing pipeline | Basic implementation |

## Future Enhancements

1. **Network Orchestration** - Content replication across nodes
2. **Federation** - Cross-instance sharing
3. **Real-time updates** - WebSocket subscriptions
4. **Advanced analytics** - Time-series aggregation

## Files Modified/Created

### Modified
- `server/prisma/schema.prisma` - Added sharing models
- `server/src/lib/user-database-manager.js` - Simplified architecture
- `server/src/routes/sharing.js` - Extended API routes

### Created
- `server/src/services/sharing-intent-service.js`
- `server/src/services/sharing-encryption-service.js`
- `server/src/services/sharing-analytics-service.js`

## Testing

Run syntax validation:
```bash
cd server
node --check src/services/sharing-intent-service.js
node --check src/services/sharing-encryption-service.js
node --check src/services/sharing-analytics-service.js
node --check src/routes/sharing.js
```

Generate Prisma client:
```bash
cd server
bunx prisma generate
```

---

Generated: 2026-02-14
