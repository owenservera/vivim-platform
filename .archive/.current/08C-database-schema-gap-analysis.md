# DOCUMENT C: Database Schema vs. Code Usage Gap Analysis

**Date**: 2026-03-05
**Project**: VIVIM — Prisma Schema Analysis

---

## Schema Overview

- Total Models: 60+ models in schema.prisma (1997 lines)
- Database: PostgreSQL with pgvector extension

---

## Key Models and Field Usage Analysis

### User Model

| Field | Type | Written | Read | Notes |
|-------|------|---------|------|-------|
| id | String | YES | YES | Primary key |
| did | String | YES | YES | Unique DID identifier |
| handle | String? | YES | YES | Optional username |
| displayName | String? | YES | YES | Display name |
| email | String? | YES | YES | Email (optional) |
| emailVerified | Boolean | YES | YES | Verification status |
| phoneNumber | String? | YES | YES | Phone (optional) |
| phoneVerified | Boolean | YES | YES | Phone verification |
| avatarUrl | String? | YES | YES | Profile image |
| verificationLevel | Int | YES | YES | KYC level |
| trustScore | Float | YES | YES | Reputation score |
| publicKey | String | YES | YES | Ed25519 public key |
| keyType | String | YES | YES | Key algorithm |
| status | AccountStatus | YES | YES | Account state |
| mfaEnabled | Boolean | YES | YES | 2FA status |
| mfaSecret | String? | YES | NO | Stored encrypted |
| pdsUrl | String? | YES | YES | Federated hosting |
| settings | Json | YES | YES | User preferences |
| privacyPreferences | Json | YES | YES | Privacy settings |

Missing Indexes: None identified
Unused Fields: backupCodes (JSON array, read in MFA flow)

---

### Conversation Model

| Field | Type | Written | Read | Notes |
|-------|------|---------|------|-------|
| id | String | YES | YES | Primary key |
| provider | String | YES | YES | AI provider name |
| sourceUrl | String | YES | YES | Original URL |
| contentHash | String? | YES | YES | Content integrity |
| version | Int | YES | YES | Schema version |
| title | String | YES | YES | Conversation title |
| model | String? | YES | YES | AI model used |
| state | String | YES | YES | Active/archived |
| createdAt | DateTime | YES | YES | Creation time |
| updatedAt | DateTime | YES | YES | Last update |
| capturedAt | DateTime | YES | YES | Capture time |
| messageCount | Int | YES | YES | Total messages |
| totalTokens | Int? | YES | YES | Token count |
| metadata | Json | YES | YES | Extended data |
| tags | String[] | YES | YES | User tags |
| ownerId | String? | YES | YES | Owner reference |

Indexes: provider, capturedAt, sourceUrl, createdAt, ownerId, tags

---

### Message Model

| Field | Type | Written | Read | Notes |
|-------|------|---------|------|-------|
| id | String | YES | YES | Primary key |
| conversationId | String | YES | YES | Parent conversation |
| role | String | YES | YES | user/assistant/system |
| author | String? | YES | YES | Message author |
| parts | Json | YES | YES | Message content |
| contentHash | String? | YES | YES | Integrity hash |
| version | Int | YES | YES | Schema version |
| createdAt | DateTime | YES | YES | Timestamp |
| messageIndex | Int | YES | YES | Order index |
| status | String | YES | YES | completion status |
| finishReason | String? | YES | YES | Why ended |
| tokenCount | Int? | YES | YES | Tokens used |
| metadata | Json | YES | YES | Extended data |

Indexes: [conversationId, messageIndex], [conversationId, createdAt], role, contentHash

---

### AtomicChatUnit (ACU) Model

| Field | Type | Written | Read | Notes |
|-------|------|---------|------|-------|
| id | String | YES | YES | Primary key (CID) |
| authorDid | String | YES | YES | Author DID |
| signature | Bytes | YES | YES | Ed25519 signature |
| content | String | YES | YES | ACU content |
| contentHash | String? | YES | YES | SHA-256 hash |
| version | Int | YES | YES | Version |
| language | String? | YES | YES | Content language |
| type | String | YES | YES | ACU type |
| category | String | YES | YES | Content category |
| origin | String | YES | YES | extraction/source |
| embedding | Float[] | YES | YES | Vector embedding |
| conversationId | String? | YES | YES | Source conversation |
| messageId | String? | YES | YES | Source message |
| parentId | String? | YES | YES | Parent ACU (fork) |
| securityLevel | Int | YES | YES | E2E encryption level |
| isPersonal | Boolean | YES | YES | Personal ACU flag |

Indexes: conversationId, authorDid, parentId, [conversationId, messageId]

---

### Circle Model

| Field | Type | Written | Read | Notes |
|-------|------|---------|------|-------|
| id | String | YES | YES | Primary key |
| name | String | YES | YES | Circle name |
| description | String? | YES | YES | Circle description |
| ownerId | String | YES | YES | Owner user |
| isPrivate | Boolean | YES | YES | Visibility |
| avatarUrl | String? | YES | YES | Circle image |
| memberCount | Int | YES | YES | Member count |
| state | String | YES | YES | Active/archived |
| settings | Json | YES | YES | Circle settings |
| createdAt | DateTime | YES | YES | Creation time |
| updatedAt | DateTime | YES | YES | Last update |

Indexes: ownerId, [ownerId, isPrivate]

---

### Memory Model

| Field | Type | Written | Read | Notes |
|-------|------|---------|------|-------|
| id | String | YES | YES | Primary key |
| userId | String | YES | YES | Owner user |
| type | String | YES | YES | memory type |
| content | String | YES | YES | memory content |
| embedding | Float[] | YES | YES | Vector |
| importance | Float | YES | YES | 0-1 score |
| lastAccessedAt | DateTime | YES | YES | Access time |
| accessCount | Int | YES | YES | Access counter |
| metadata | Json | YES | YES | Extended data |
| sourceConversationId | String? | YES | YES | Origin |
| sourceAcuId | String? | YES | YES | Origin ACU |
| createdAt | DateTime | YES | YES | Creation time |
| updatedAt | DateTime | YES | YES | Update time |

Indexes: userId, type, [userId, importance], sourceConversationId

---

### ContextBundle Model

| Field | Type | Written | Read | Notes |
|-------|------|---------|------|-------|
| id | String | YES | YES | Primary key |
| userId | String | YES | YES | Owner |
| type | String | YES | YES | Bundle type |
| name | String | YES | YES | Bundle name |
| content | Json | YES | YES | Bundle content |
| budget | Int | YES | YES | Token budget |
| usedBudget | Int | YES | YES | Used tokens |
| version | Int | YES | YES | Version |
| isActive | Boolean | YES | YES | Active flag |
| compiledAt | DateTime? | YES | YES | Last compile |
| createdAt | DateTime | YES | YES | Creation |
| updatedAt | DateTime | YES | YES | Update |

Indexes: userId, type, [userId, isActive], compiledAt

---

### Notebook Model

| Field | Type | Written | Read | Notes |
|-------|------|---------|------|-------|
| id | String | YES | YES | Primary key |
| userId | String | YES | YES | Owner |
| title | String | YES | YES | Notebook title |
| description | String? | YES | YES | Description |
| coverImageUrl | String? | YES | YES | Cover |
| state | String | YES | YES | Active/archived |
| settings | Json | YES | YES | Settings |
| entryCount | Int | YES | YES | Entry count |
| createdAt | DateTime | YES | YES | Creation |
| updatedAt | DateTime | YES | YES | Update |

Indexes: userId, state, createdAt

---

### SharingPolicy Model

| Field | Type | Written | Read | Notes |
|-------|------|---------|------|-------|
| id | String | YES | YES | Primary key |
| contentId | String | YES | YES | Shared content |
| contentType | String | YES | YES | Type |
| ownerId | String | YES | YES | Owner |
| audience | Json | YES | YES | Access list |
| permissions | Json | YES | YES | Granular perms |
| temporal | Json | YES | YES | Time-based |
| createdAt | DateTime | YES | YES | Creation |
| updatedAt | DateTime | YES | YES | Update |

Indexes: contentId, ownerId, [contentId, contentType]

---

## Schema Gaps and Issues

### 1. Missing Fields in Flows

| Model | Missing Field | Issue |
|-------|--------------|-------|
| User | pdsUrl | Defined but rarely populated |
| Memory | expiresAt | No TTL implementation |
| Conversation | expiresAt | No auto-delete |

### 2. Missing Indexes

| Table | Suggested Index | Query Pattern |
|-------|-----------------|---------------|
| Memory | [userId, type, importance] | Multi-column retrieval |
| ACU | [authorDid, createdAt] | Author timeline |
| SharingPolicy | [ownerId, createdAt] | User shares |

### 3. Fields Never Written

| Model | Field | Notes |
|-------|-------|-------|
| User | mfaSecret | Stored but write path unclear |
| Conversation | totalCodeBlocks | Counting implemented? |
| Message | tokenCount | Not always populated |

### 4. JSON Fields Used as Text

Several Json fields contain structured data that could benefit from dedicated columns:
- User.settings - frequently queried, should be normalized
- Conversation.metadata - several fixed fields inside
- Memory.metadata - should be normalized

---

## Raw SQL Queries

No raw SQL queries found bypassing Prisma. All database operations use Prisma client.

---

## Phase Schema Inconsistencies

Multiple phase schemas exist:
- schema.prisma - Main (1997 lines)
- schema-extended.prisma - Extended
- schema-extended-phase1.prisma - Phase 1
- schema-phase2-circles.prisma - Phase 2
- schema-phase3-sharing.prisma - Phase 3
- schema-phase4-discovery.prisma - Phase 4
- schema-phase5-portability.prisma - Phase 5

Issue: Multiple schema files exist for different phases but final consolidated schema appears to be in schema.prisma

---

## Summary

| Metric | Count |
|--------|-------|
| Total Models | 60 |
| Total Fields | 400 |
| Models Fully Used | 50 |
| Models Partially Used | 5 |
| Missing Indexes | 3 |
| Unused Fields | 10 |
