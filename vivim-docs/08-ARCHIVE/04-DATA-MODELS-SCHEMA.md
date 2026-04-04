# VIVIM — Data Models & Schema
**Archived**: 2026-03-05 | **Basis**: `03-data-models-schema.md` + `08C-database-schema-gap-analysis.md`

---

## Schema Overview
- **File**: `server/prisma/schema.prisma`
- **Lines**: 1,997
- **Database**: PostgreSQL with `pgvector` extension
- **Total Models**: 60+
- **Models Fully Used**: ~50
- **Models Partially Used**: ~5
- **ORM**: Prisma 7 with `@prisma/adapter-pg`

---

## Core Domain Models

### User
The central identity model.

| Field | Type | Notes |
|-------|------|-------|
| `id` | String (CUID) | PK |
| `did` | String (unique) | Decentralized Identifier (did:key:z...) |
| `handle` | String? | Optional username |
| `displayName` | String? | Display name |
| `email` | String? | Optional (Google OAuth provides this) |
| `emailVerified` | Boolean | |
| `phoneNumber` | String? | Optional |
| `phoneVerified` | Boolean | |
| `avatarUrl` | String? | |
| `verificationLevel` | Int | KYC level (0-3) |
| `trustScore` | Float | Default 50, range 0-100 |
| `publicKey` | String | Ed25519 public key (base64) |
| `keyType` | String | `ed25519` |
| `status` | AccountStatus | ACTIVE, SUSPENDED, DELETED |
| `mfaEnabled` | Boolean | 2FA status |
| `mfaSecret` | String? | TOTP secret (encrypted) |
| `backupCodes` | Json | Array of 10 backup codes |
| `pdsUrl` | String? | Personal Data Server URL (federated) |
| `settings` | Json | User preferences blob |
| `privacyPreferences` | Json | Privacy settings blob |
| `createdAt` | DateTime | |
| `updatedAt` | DateTime | |

---

### Conversation
Represents a captured AI conversation.

| Field | Type | Notes |
|-------|------|-------|
| `id` | String (CUID) | PK |
| `provider` | String | `chatgpt`, `claude`, `gemini`, etc. |
| `sourceUrl` | String | Original conversation URL |
| `contentHash` | String? | SHA-256 of conversation content |
| `version` | Int | Schema version |
| `title` | String | Conversation title |
| `model` | String? | AI model name |
| `state` | String | `active`, `archived`, `deleted` |
| `capturedAt` | DateTime | Time of capture |
| `messageCount` | Int | Total messages |
| `totalTokens` | Int? | Estimated token count |
| `metadata` | Json | Extended data (model info, settings) |
| `tags` | String[] | User-applied tags |
| `ownerId` | String? | Linked User.id |

**Indexes**: `provider`, `capturedAt`, `sourceUrl`, `createdAt`, `ownerId`, `tags`

---

### Message
Individual turn within a Conversation.

| Field | Type | Notes |
|-------|------|-------|
| `id` | String (CUID) | PK |
| `conversationId` | String | FK → Conversation |
| `role` | String | `user`, `assistant`, `system` |
| `author` | String? | Display name |
| `parts` | Json | Content blocks array |
| `contentHash` | String? | Integrity hash |
| `version` | Int | |
| `messageIndex` | Int | Order within conversation |
| `status` | String | Completion status |
| `finishReason` | String? | `stop`, `length`, `tool_calls` |
| `tokenCount` | Int? | Not always populated |
| `metadata` | Json | Extended data |

**Indexes**: `[conversationId, messageIndex]`, `[conversationId, createdAt]`, `role`, `contentHash`

---

### AtomicChatUnit (ACU)
The core primitive for AI content ownership and sharing.

| Field | Type | Notes |
|-------|------|-------|
| `id` | String | CID (content-addressed ID, not auto-increment) |
| `authorDid` | String | Author's DID |
| `signature` | Bytes | Ed25519 signature |
| `content` | String | Textual content of the ACU |
| `contentHash` | String? | SHA-256 hash |
| `version` | Int | |
| `language` | String? | Content language |
| `type` | String | `qa_pair`, `insight`, `code_snippet`, `fact`, etc. |
| `category` | String | Content category |
| `origin` | String | `extraction`, `manual`, `remix` |
| `embedding` | Float[] | pgvector — 384 or 1536 dimensions |
| `conversationId` | String? | Source conversation |
| `messageId` | String? | Source message |
| `parentId` | String? | Parent ACU (for forks/remixes) |
| `securityLevel` | Int | E2E encryption level (0=none, 3=max) |
| `isPersonal` | Boolean | Private ACU flag |
| `qualityOverall` | Float | 0–1 quality score |
| `contentRichness` | Float | |
| `structuralIntegrity` | Float | |
| `uniqueness` | Float | |
| `rediscoveryScore` | Float | Predicted future value |
| `sharingPolicy` | String | `self`, `circle`, `public` |
| `shareCount` | Int | Times shared |
| `quoteCount` | Int | Times quoted |

**Indexes**: `conversationId`, `authorDid`, `parentId`, `[conversationId, messageId]`

---

### Memory
Extracted intelligence from conversations.

| Field | Type | Notes |
|-------|------|-------|
| `id` | String (CUID) | PK |
| `userId` | String | FK → User |
| `type` | String | `FACTUAL`, `PREFERENCE`, `EPISODIC`, `RELATIONSHIP` |
| `content` | String | Extracted memory content |
| `embedding` | Float[] | pgvector |
| `importance` | Float | 0–1 importance score |
| `lastAccessedAt` | DateTime | |
| `accessCount` | Int | |
| `metadata` | Json | Source, confidence, related entities |
| `sourceConversationId` | String? | Origin |
| `sourceAcuId` | String? | Origin ACU |

**Indexes**: `userId`, `type`, `[userId, importance]`, `sourceConversationId`

---

### ContextBundle
Compiled context layer bundle for a user.

| Field | Type | Notes |
|-------|------|-------|
| `id` | String (CUID) | PK |
| `userId` | String | FK → User |
| `type` | String | `identity_core`, `global_prefs`, `topic`, `entity`, `conversation`, `composite` |
| `name` | String | Bundle name |
| `content` | Json | Compiled bundle content |
| `budget` | Int | Token budget allocated |
| `usedBudget` | Int | Actual tokens used |
| `version` | Int | |
| `isActive` | Boolean | |
| `compiledAt` | DateTime? | Last compilation timestamp |

**Indexes**: `userId`, `type`, `[userId, isActive]`, `compiledAt`

---

### Circle
A trust-based social group.

| Field | Type | Notes |
|-------|------|-------|
| `id` | String (CUID) | PK |
| `name` | String | |
| `description` | String? | |
| `ownerId` | String | FK → User |
| `isPrivate` | Boolean | Visibility |
| `avatarUrl` | String? | |
| `memberCount` | Int | Maintained counter |
| `state` | String | `active`, `archived` |
| `settings` | Json | Circle-level settings |

**Indexes**: `ownerId`, `[ownerId, isPrivate]`

---

### SharingPolicy
Defines who can access a piece of content and how.

| Field | Type | Notes |
|-------|------|-------|
| `id` | String (CUID) | PK |
| `contentId` | String | ID of shared content |
| `contentType` | String | `conversation`, `acu`, `notebook` |
| `ownerId` | String | FK → User |
| `audience` | Json | Access list (DIDs, circles, public) |
| `permissions` | Json | `{canView, canAnnotate, canRemix, canReshare}` |
| `temporal` | Json | `{expiresAt, maxViews, password}` |

**Indexes**: `contentId`, `ownerId`, `[contentId, contentType]`

---

### Notebook
User-organized collection of ACUs.

| Field | Type | Notes |
|-------|------|-------|
| `id` | String (CUID) | PK |
| `userId` | String | FK → User |
| `title` | String | |
| `description` | String? | |
| `coverImageUrl` | String? | |
| `state` | String | `active`, `archived` |
| `settings` | Json | Display preferences |
| `entryCount` | Int | Maintained counter |

**Indexes**: `userId`, `state`, `createdAt`

---

## Schema Gap Analysis

### Missing Fields Impacting Flows
| Model | Missing Field | Impact |
|-------|--------------|--------|
| Memory | `expiresAt` | No TTL implementation — memories never auto-expire |
| Conversation | `expiresAt` | No auto-delete of old conversations |
| User | `pdsUrl` | Defined but rarely populated (federated hosting) |

### Missing Indexes (Performance Gaps)
| Table | Suggested Index | Query Pattern |
|-------|-----------------|---------------|
| Memory | `[userId, type, importance]` | Multi-column memory retrieval |
| AtomicChatUnit | `[authorDid, createdAt]` | Author timeline queries |
| SharingPolicy | `[ownerId, createdAt]` | User's share history |

### Fields Never Written
| Model | Field | Issue |
|-------|-------|-------|
| User | `mfaSecret` | Write path unclear — MFA setup may not persist correctly |
| Conversation | `totalCodeBlocks` | Counting logic may not be implemented |
| Message | `tokenCount` | Not consistently populated during capture |

### JSON Fields That Should Be Normalized
| Model | Field | Reason |
|-------|-------|--------|
| User | `settings` | Frequently queried — should be dedicated columns |
| Conversation | `metadata` | Contains fixed fields (model, settings) |
| Memory | `metadata` | Source/confidence should be first-class fields |

---

## Phase Schema Files (Historical)
These files exist but `schema.prisma` is the canonical source:
- `schema-extended.prisma`
- `schema-extended-phase1.prisma`
- `schema-phase2-circles.prisma`
- `schema-phase3-sharing.prisma`
- `schema-phase4-discovery.prisma`
- `schema-phase5-portability.prisma`
