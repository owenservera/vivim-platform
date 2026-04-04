# VIVIM Implementation Roadmap & Gap Analysis

> **Generated:** March 23, 2026
> **Status:** 70% Complete → MVP Launch Ready
> **Timeline:** 4 Weeks to Working Prototype
> **Source:** VIVIM.docs/.archive implementation audits

---

## Executive Summary

VIVIM has **~70% of technical foundation** complete. The Dynamic Context Engine is production-ready, identity layer is complete, and ACU backend is functional. However, **critical user-facing features are missing**: BYOK Chat (0%), Social/Feed (40%), and Vault Organization UI (60%).

### Implementation Status Dashboard

| Component | Status | Completion | Priority | Weeks to Complete |
|-----------|--------|------------|----------|-------------------|
| **Dynamic Context Engine** | ✅ Production-Ready | 100% | Done | 0 |
| **Identity Layer (Phase 1)** | ✅ Complete | 100% | Done | 0 |
| **ACU Backend** | ✅ Complete | 95% | Done | 0 |
| **Capture System** | ⚠️ 8/9 Providers | 89% | P0 | 0.5 |
| **BYOK Chat** | ❌ Not Started | 0% | **P0 CRITICAL** | 2-3 |
| **Social/Feed** | ⚠️ Skeleton Only | 40% | P0 | 1-2 |
| **Vault UI** | ⚠️ Storage Complete | 60% | P1 | 1 |
| **Search** | ⚠️ Basic Only | 50% | P1 | 0.5 |
| **Mobile PWA** | ⚠️ Foundation | 70% | P1 | 0.5 |
| **Sync System** | 🔴 Critical Issues | 0% | **P0 CRITICAL** | 2 |

---

## 1. Feature Gap Analysis

### 1.1 Capture System (C01-C30) - 89% Complete

**Current State:**
```
✅ ChatGPT     - extractor-chatgpt.js (Complete)
✅ Claude      - extractor-claude.js (Complete)
✅ Gemini      - extractor-gemini.js (Complete)
✅ Grok        - extractor-grok.js (Present)
✅ DeepSeek    - extractor-deepseek.js (Present)
✅ Kimi        - extractor-kimi.js (Present)
✅ Qwen        - extractor-qwen.js (Present)
✅ z.ai        - extractor-zai.js (Present)
❌ Mistral     - NOT IMPLEMENTED
```

**Missing Features:**
| ID | Feature | Description | Priority | Effort |
|----|---------|-------------|----------|--------|
| C09 | Mistral Capture | Extract from mistral.ai/chat | P0 | 2-3 days |
| C21-C30 | Smart Capture | Web pages, RSS, scheduled scraping | P2 | 1 week |

**Action Required:**
```bash
# Create Mistral extractor
apps/server/src/extractors/extractor-mistral.js

# Add to router
apps/server/src/routes/capture.js

# Add tests
apps/server/tests/extractors/mistral.test.js
```

**Estimated:** 2-3 days

---

### 1.2 BYOK AI Chat (B01-B25) - 0% Complete 🔴 CRITICAL

**Status:** ❌ **ENTIRELY MISSING** - This is the **CORE DIFFERENTIATOR**

**Why This Is Critical:**
BYOK is what transforms VIVIM from a "conversation archive" into a "knowledge evolution platform." Users don't just save conversations—they continue them, evolve them, and build on others' insights.

**Implementation Requirements:**

#### 1.2.1 API Key Management (B01-B08)

```typescript
// Need to create
apps/pwa/src/lib/byok/
├── api-key-manager.ts    # Encrypted key storage
├── provider-config.ts    # Provider configurations
├── key-validation.ts     # Test API keys
└── usage-tracker.ts     # Token/cost tracking

// Supported providers needed:
- OpenAI (GPT-4, GPT-3.5) - P0
- Anthropic (Claude 3) - P0
- Google (Gemini Pro) - P0
- Mistral (Mixtral) - P0
- xAI (Grok) - P1
```

**Security Requirements:**
- Keys encrypted with user's master key (from identity service)
- Keys NEVER sent to our servers
- Local-only decryption

**Estimated Effort:** 1 week

#### 1.2.2 Continue Conversation (B09-B15)

```typescript
// Need endpoint
apps/server/src/routes/byok.js

POST /api/v1/byok/chat
  - Takes conversation ID + user message
  - Loads conversation context
  - Calls user's API provider
  - Streams response back (SSE)
  - Saves new message to conversation
```

**Request:**
```json
{
  "conversationId": "conv_456",
  "message": "Continue this discussion about JWT auth",
  "provider": "openai",
  "model": "gpt-4",
  "settings": {
    "temperature": 0.7,
    "maxTokens": 2000
  }
}
```

**Response:** Server-Sent Events stream
```
data: {"type": "token", "content": "Sure"}
data: {"type": "token", "content": "!"}
data: {"type": "token", "content": " JWT"}
data: {"type": "token", "content": " (JSON"}
data: {"type": "token", "content": " Web"}
data: {"type": "token", "content": " Token"}
data: {"type": "done", "usage": {"prompt": 1200, "completion": 350}}
```

**Estimated Effort:** 1 week

#### 1.2.3 Chat Experience (B16-B25)

```typescript
// Need frontend pages
apps/pwa/src/pages/
├── BYOKChat.tsx         # Main chat interface
├── APIKeySettings.tsx   # Key management UI
├── ModelSelector.tsx    # Model dropdown
├── ChatSettings.tsx     # Temperature, max tokens
└── UsageStats.tsx       # Cost visualization

// Need components
apps/pwa/src/components/
├── ChatMessage.tsx
├── BYOKChatInput.tsx
├── StreamingResponse.tsx
└── ModelSelector.tsx
```

**Estimated Effort:** 1 week

**Total BYOK Implementation:** 2-3 weeks

---

### 1.3 Feed & Social (F01-F30) - 40% Complete

**Current State:**
```
✅ Backend skeleton endpoints exist
✅ FeedCard.tsx component exists
✅ HomeNew.tsx with tabs exists
❌ Real engagement tracking
❌ Following system
❌ Fork functionality
❌ Comments
```

**Backend Skeleton (Complete Structure, Stubbed Logic):**
```
✅ /api/v1/feed (GET) - Returns mock data
✅ /api/v1/feed/engagement (POST) - Console.log only
✅ Engagement weights defined
✅ Scoring algorithm skeleton
```

**Critical Missing Features:**

#### 1.3.1 User Following System

```prisma
// Need to add to schema
model UserFollow {
  followerId    String
  followingId   String
  createdAt     DateTime @default(now())

  @@unique([followerId, followingId])
  @@index([followerId])
  @@index([followingId])
}
```

**Backend Routes:**
```javascript
// apps/server/src/routes/social.js
GET    /api/v1/social/followers/:userId
GET    /api/v1/social/following/:userId
POST   /api/v1/social/follow/:userId
DELETE /api/v1/social/unfollow/:userId
```

**Estimated:** 3-4 days

#### 1.3.2 Real Engagement Tracking

```javascript
// Currently just console.log in engagement endpoint
// Need:
- Like counter in DB
- Save/bookmark storage
- View count tracking
- Share link generation
```

**Database Changes:**
```prisma
model Like {
  userId        String
  acuId         String
  createdAt     DateTime @default(now())

  @@unique([userId, acuId])
  @@index([acuId])
}

model Bookmark {
  userId        String
  conversationId String
  createdAt     DateTime @default(now())

  @@unique([userId, conversationId])
}
```

**Estimated:** 2-3 days

#### 1.3.3 Fork Functionality

```typescript
// Need to implement
POST /api/v1/conversations/:id/fork

// Logic:
1. Load original conversation
2. Copy all messages to new conversation
3. Set owner to current user
4. Add attribution metadata (forkedFromId, originalAuthorId)
5. Return new conversation ID
```

**Frontend Component:**
```tsx
// apps/pwa/src/components/ForkButton.tsx
interface ForkButtonProps {
  conversationId: string;
  authorId: string;
}

export const ForkButton: React.FC<ForkButtonProps> = ({ conversationId, authorId }) => {
  const handleFork = async () => {
    const response = await fetch(`/api/v1/conversations/${conversationId}/fork`, {
      method: 'POST'
    });
    const { id: newId } = await response.json();
    // Navigate to forked conversation
    navigate(`/conversation/${newId}`);
  };
  
  return (
    <Button onClick={handleFork} icon={<GitFork />}>
      Fork
    </Button>
  );
};
```

**Estimated:** 3-4 days

#### 1.3.4 Frontend Components

```
apps/pwa/src/components/
├── LikeButton.tsx        # Heart toggle
├── BookmarkButton.tsx    # Save toggle
├── ForkButton.tsx        # Fork action
├── ShareMenu.tsx         # Share dropdown
├── FollowButton.tsx      # Follow toggle
└── CommentThread.tsx     # Discussion UI

apps/pwa/src/pages/
├── Profile.tsx           # User's own profile
└── UserProfile.tsx       # View others' profiles
```

**Estimated:** 1 week

**Total Social Implementation:** 1-2 weeks

---

### 1.4 Vault & Storage (V01-V30) - 60% Complete

**Current State:**
```
✅ IndexedDB Storage (storage-v2/)
✅ Yjs CRDT sync
✅ Encrypted storage (secure-crypto.ts)
✅ DAG schema (STORAGE_SCHEMA_V2.md)
❌ Collections/Folders UI
❌ Tagging System UI
❌ Search Filters UI
```

**Missing Vault Features:**

| Feature | Status | Priority | Effort |
|---------|--------|----------|--------|
| Collections/Folders | ❌ Missing | High | 3-4 days |
| Tagging System | ❌ Missing | High | 2-3 days |
| Search Filters | ⚠️ Basic | High | 2 days |
| Sort Options | ❌ Missing | Medium | 1 day |
| Bulk Actions | ❌ Missing | Low | 2 days |
| Archive | ❌ Missing | Low | 1 day |
| Trash | ❌ Missing | Low | 1 day |

**Files to Create:**
```
apps/pwa/src/pages/
├── Vault.tsx              # Main vault view
├── Collections.tsx        # Folder management
├── Tags.tsx              # Tag editor
└── SearchFilters.tsx      # Advanced search UI

apps/pwa/src/components/
├── CollectionCard.tsx
├── TagBadge.tsx
├── VaultItem.tsx
├── SortControl.tsx
└── BulkActionBar.tsx
```

**Estimated:** 1 week

---

### 1.5 Identity & Security (I01-I20) - 75% Complete

**Current State:**
```
✅ DID-based identity (did:key method)
✅ BIP-39 seed phrases
✅ Device key derivation
✅ Encrypted private key storage
✅ Profile (displayName, avatar, bio)
✅ 15 API endpoints for identity management
❌ Google OAuth
❌ Apple Sign-In
❌ GitHub OAuth
❌ Magic Link email
❌ 2FA support
```

**Phase 1 Complete:** ✅
- Identity lifecycle management
- Device registration/revocation
- Email/phone verification flow
- Access audit logging
- Consent management
- DID resolution

**Missing (Phase 2):**
- Social auth providers (Google, Apple, GitHub)
- Magic link authentication
- Two-factor authentication
- Session management UI
- Account deletion flow

**Estimated for Phase 2:** 1-2 weeks (can defer post-MVP)

---

### 1.6 Search & Discovery (S01-S10) - 50% Complete

**Current State:**
```
✅ Full-text search (ACU API)
❌ Semantic search (needs embeddings)
❌ Filters UI
❌ Search suggestions
❌ Search history
```

**Note:** pgvector is in schema but embeddings aren't being generated or used.

**Missing Features:**

| Feature | Status | Priority | Effort |
|---------|--------|----------|--------|
| Semantic Search | ❌ Needs embeddings | P1 | 3-4 days |
| Search Filters UI | ❌ Missing | P1 | 2 days |
| Search Suggestions | ❌ Missing | P2 | 2 days |
| Search History | ❌ Missing | P2 | 1 day |

**Implementation:**
```typescript
// apps/server/src/services/embedding.js
// Need to generate embeddings for ACUs

// Step 1: Generate embeddings on ACU creation
async processACU(acu: AtomicChatUnit): Promise<void> {
  const embedding = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: acu.content
  });
  
  await prisma.atomicChatUnit.update({
    where: { id: acu.id },
    data: { embedding: embedding.data[0].embedding }
  });
}

// Step 2: Semantic search with pgvector
async semanticSearch(query: string, userId: string, limit: number = 20) {
  const queryEmbedding = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: query
  });
  
  return prisma.$queryRaw`
    SELECT id, content, type, 
      1 - (embedding <=> ${queryEmbedding}::vector) as similarity
    FROM atomic_chat_units
    WHERE "userId" = ${userId}
    ORDER BY similarity DESC
    LIMIT ${limit}
  `;
}
```

**Estimated:** 5 days

---

### 1.7 Sharing & Collaboration (H01-H10) - 30% Complete

**Current State:**
```
✅ Circle model (sharing groups)
✅ CircleMember model
✅ Sharing policy on ACUs
❌ Share to Feed UI
❌ Copy link generation
❌ External share (Twitter, LinkedIn)
❌ Share permissions UI
❌ Expiring links
❌ Password protection
```

**Missing UX:**

| Feature | Priority | Effort |
|---------|----------|--------|
| Share to Feed UI | P0 | 2 days |
| Copy Link | P0 | 1 day |
| External Share Cards | P1 | 3 days |
| Share Permissions UI | P1 | 2 days |
| Expiring Links | P2 | 2 days |
| Password Protection | P2 | 2 days |

**Estimated:** 1 week

---

### 1.8 Recommendations (R01-R10) - 0% Complete

**Status:** ❌ **ENTIRELY MISSING** - Low priority for MVP

| ID | Feature | Priority |
|----|---------|----------|
| R01 | Interest Detection | P1 |
| R02 | Similar Content | P1 |
| R03 | Trending in Topics | P1 |
| R04 | Rediscovery | P2 |
| R05 | Daily Digest | P2 |
| R06-R10 | Advanced features | P2 |

**Impact:** Low for MVP (can be added post-launch)

**Estimated:** 1 week (post-MVP)

---

### 1.9 Mobile & PWA (M01-M10) - 70% Complete

**Current State:**
```
✅ Vite PWA plugin
✅ Service worker
✅ Offline support
❌ Push notifications
❌ Share target
❌ Haptic feedback
❌ Gesture navigation
```

**Missing Features:**

| Feature | Platform | Priority | Effort |
|---------|----------|----------|--------|
| Push Notifications | Both | P1 | 3 days |
| Share Target | Mobile | P1 | 2 days |
| Haptic Feedback | Mobile | P2 | 1 day |
| Gesture Navigation | Mobile | P2 | 2 days |
| Background Sync | Both | P2 | 2 days |

**Estimated:** 3-5 days

---

## 2. Critical Issues & Risks

### 2.1 Runtime Crashes (Must Fix Before Launch)

| Issue | File | Impact | Fix Effort |
|-------|------|--------|------------|
| **CRIT-01**: Undefined `context` in `computeBudget()` | `context-assembler.ts:461` | Every chat crashes | Low (1 hour) |
| **CRIT-04**: `SystemAction` schema mismatch | `invalidation-service.ts` | Invalidation crashes | Medium (2 hours) |

### 2.2 Data Loss Vectors (Must Fix Before Launch)

| Issue | File | Impact | Fix Effort |
|-------|------|--------|------------|
| **CRIT-02**: Three incompatible sync mechanisms | Multiple | Silent data loss | **VERY HIGH** (1-2 weeks) |
| **CRIT-03**: Fragile HLC parser | `hlc.js:19-43` | Corruption with hyphens | Medium (4 hours) |

### 2.3 High Priority Gaps

| Issue | File | Impact | Fix Effort |
|-------|------|--------|------------|
| **HIGH-01**: Duplicate `semanticSearchMemories` | `hybrid-retrieval.ts` | Qdrant path dead code | Low (1 hour) |
| **HIGH-02**: Nonexistent `totalTokensSpent` | `profile-rollup-service.ts` | Prisma runtime error | Low (30 min) |
| **HIGH-04**: Invalid Prisma JSON update | `librarian-worker.ts` | Librarian worker fails | Medium (2 hours) |
| **HIGH-05**: Typo in date property | `qdrant-vector-store.ts` | Wrong dates | Low (5 min) |

---

## 3. Implementation Roadmap (4 Weeks)

### Sprint 1: Foundation (Feb 9-15)

**Goals:**
1. ✅ Complete rebranding (OpenScroll → VIVIM)
2. ❌ Add Mistral provider
3. ❌ Fix critical bugs
4. ❌ Design BYOK architecture

**Tasks:**

#### 1.1 Rebranding Completion
| Task | Owner | Status | Hours |
|------|-------|---------|-------|
| Text changes (HTML, package.json) | Agent | 🔄 | 2 |
| Logo assets | Design | ❌ | 8 |
| CSS theme | Frontend | ❌ | 4 |
| PWA manifest | Frontend | ❌ | 1 |

**Files to Update:**
```
[ ] apps/pwa/index.html (title, meta)
[ ] apps/pwa/package.json (name)
[ ] apps/pwa/src/pages/HomeNew.tsx (logo text)
[ ] apps/pwa/src/lib/identity/identity-service.ts (storage keys)
[ ] apps/server/package.json (name, description)
[ ] apps/server/src/server.js (logs)
[ ] Root README.md
```

#### 1.2 Mistral Provider
```javascript
// Create extractor
apps/server/src/extractors/extractor-mistral.js

// Add to router
apps/server/src/routes/capture.js

// Test
apps/server/tests/extractors/mistral.test.js
```

**Estimated:** 2-3 days

#### 1.3 Critical Bug Fixes
```
[ ] CRIT-01: Pass detectedContext to computeBudget()
[ ] CRIT-04: Add metadata field to SystemAction or redesign queue
[ ] HIGH-01: Merge duplicate semanticSearchMemories
[ ] HIGH-02: Remove totalTokensSpent reference
[ ] HIGH-05: Fix typo in qdrant-vector-store.ts
```

**Estimated:** 4-6 hours

#### 1.4 BYOK Architecture Design
```typescript
// Design decisions:
├── Key Storage Strategy
│   └── Encrypt with user's master key (from identity service)
├── Provider Abstraction
│   └── Unified interface for OpenAI, Anthropic, Google
├── Streaming Response
│   └── Server-Sent Events (SSE) for real-time responses
└── Cost Tracking
    └── Local usage logging per provider
```

**Estimated:** 1 day

**Sprint 1 Total:** 2-3 days

---

### Sprint 2: BYOK Core (Feb 16-22)

**Goals:**
1. ❌ API Key Management UI
2. ❌ Chat Interface
3. ❌ Provider Integration (4+ providers)

**Tasks:**

#### 2.1 API Key Management
```
apps/pwa/src/lib/byok/
├── api-key-manager.ts    # 3 days
├── provider-config.ts    # 2 days
├── key-validation.ts     # 1 day
└── usage-tracker.ts     # 2 days

apps/pwa/src/pages/APIKeySettings.tsx  # 3 days
```

**Features:**
- Add/Remove API keys per provider
- Validate keys before saving
- Show key prefix (e.g., `sk-...abcd`)
- Delete key option

**Supported Providers:**
| Provider | Status | Setup |
|----------|--------|-------|
| OpenAI | ❌ | API key only |
| Anthropic | ❌ | API key only |
| Google Gemini | ❌ | API key only |
| xAI Grok | ❌ | API key only |
| Mistral | ❌ | Coming soon |

**Estimated:** 1 week

#### 2.2 Chat Interface
```
apps/pwa/src/pages/BYOKChat.tsx         # 3 days
apps/pwa/src/components/ChatMessage.tsx  # 2 days
apps/pwa/src/components/BYOKChatInput.tsx # 2 days
apps/pwa/src/components/StreamingResponse.tsx # 2 days
```

**Features:**
- Conversation context loading
- Streaming responses (SSE)
- Model selector dropdown
- Temperature setting
- Usage stats display

**Estimated:** 1 week

#### 2.3 Server BYOK Endpoint
```javascript
// apps/server/src/routes/byok.js
POST /api/v1/byok/chat
```

**Endpoint:**
```json
POST /api/v1/byok/chat
{
  "conversationId": "uuid",
  "message": "Continue this conversation...",
  "provider": "openai",
  "model": "gpt-4",
  "settings": {
    "temperature": 0.7,
    "maxTokens": 2000
  }
}
```

**Response:** Server-Sent Events stream

**Estimated:** 3-4 days

**Sprint 2 Total:** 2-3 weeks

---

### Sprint 3: Social Features (Feb 23 - Mar 1)

**Goals:**
1. ❌ Following system
2. ❌ Likes/Saves
3. ❌ Fork functionality
4. ❌ Basic profiles

**Tasks:**

#### 3.1 Database Additions
```prisma
// Add to schema.prisma
model UserFollow {
  followerId    String
  followingId   String
  createdAt     DateTime @default(now())

  @@unique([followerId, followingId])
}

model Like {
  userId        String
  acuId         String
  createdAt     DateTime @default(now())

  @@unique([userId, acuId])
}

model Bookmark {
  userId        String
  conversationId String
  createdAt     DateTime @default(now())
}

model UserProfile {
  userId        String @id
  bio           String?
  website       String?
  twitter       String?
  github        String?

  @@map("user_profiles")
}
```

**Migration:**
```bash
npx prisma migrate dev --name add_social_features
```

**Estimated:** 1 day

#### 3.2 Backend Routes
```javascript
// apps/server/src/routes/social.js
GET    /api/v1/social/followers/:userId
GET    /api/v1/social/following/:userId
POST   /api/v1/social/follow/:userId
DELETE /api/v1/social/unfollow/:userId

POST   /api/v1/social/like/:acuId
DELETE /api/v1/social/unlike/:acuId

POST   /api/v1/social/bookmark/:conversationId
DELETE /api/v1/social/unbookmark/:conversationId

GET    /api/v1/social/profile/:did
PUT    /api/v1/social/profile
```

**Estimated:** 2-3 days

#### 3.3 Fork Functionality
```javascript
// apps/server/src/routes/conversations.js
POST /api/v1/conversations/:id/fork
```

**Logic:**
1. Load original conversation
2. Copy all messages to new conversation
3. Set owner to current user
4. Add attribution metadata
5. Return new conversation ID

**Estimated:** 2-3 days

#### 3.4 Frontend Components
```
apps/pwa/src/components/
├── LikeButton.tsx      # 1 day
├── BookmarkButton.tsx  # 1 day
├── ForkButton.tsx      # 2 days
├── ShareMenu.tsx       # 2 days
└── FollowButton.tsx    # 1 day

apps/pwa/src/pages/
├── Profile.tsx         # 3 days
└── UserProfile.tsx     # 3 days
```

**Estimated:** 1 week

**Sprint 3 Total:** 1-2 weeks

---

### Sprint 4: Polish (Mar 2-8)

**Goals:**
1. ❌ Vault organization
2. ❌ Search improvements
3. ❌ Mobile polish
4. ❌ Testing & Bug fixes

**Tasks:**

#### 4.1 Vault Organization
```
apps/pwa/src/pages/Vault.tsx         # 3 days
apps/pwa/src/pages/Collections.tsx   # 2 days
apps/pwa/src/pages/Tags.tsx          # 2 days

apps/pwa/src/components/
├── CollectionCard.tsx  # 1 day
├── TagBadge.tsx        # 1 day
├── VaultItem.tsx       # 2 days
└── SortControl.tsx     # 1 day
```

**Features:**
- Collections (folders)
- Tag management
- Search with filters
- Sort options (date, quality, provider)
- Bulk actions

**Estimated:** 1 week

#### 4.2 Search Improvements
```javascript
// apps/server/src/services/embedding.js
// Add semantic search using pgvector
```

**Add:**
- Embedding generation on ACU creation
- Semantic search endpoint
- Filter UI in frontend
- Search suggestions

**Estimated:** 3-4 days

#### 4.3 Mobile Polish
```
- PWA install prompt        # 1 day
- Offline mode improvements # 2 days
- Touch gesture support     # 2 days
```

**Estimated:** 1 week

#### 4.4 Testing
```
- Unit tests for BYOK           # 2 days
- Integration tests for social  # 2 days
- E2E tests for critical flows  # 3 days
```

**Estimated:** 1 week

**Sprint 4 Total:** 1 week

---

## 4. Milestones

| Date | Milestone | Definition of Done |
|------|-----------|-------------------|
| Feb 15 | Sprint 1 Complete | Rebranding + Mistral + BYOK design + critical bugs fixed |
| Feb 22 | Sprint 2 Complete | BYOK chat working with 4 providers |
| Mar 1 | Sprint 3 Complete | Social features (follow/like/fork) |
| Mar 8 | Sprint 4 Complete | Testing complete, ready for demo |

---

## 5. Demo Scenario

At the end of Sprint 4, demonstrate:

```
1. User signs up (DID-based identity)
2. Captures a ChatGPT conversation (capture)
3. Views it in their vault (vault UI)
4. Adds API key for OpenAI (BYOK setup)
5. Continues the conversation (BYOK chat)
6. Forks the conversation to their vault (fork)
7. Shares to feed (social)
8. Another user likes it (social)
```

**Total demo time:** Under 5 minutes

---

## 6. Risk Analysis

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| BYOK complexity | High | Medium | Start with OpenAI only, add others incrementally |
| Social features take longer | Medium | Medium | Focus on likes/shares first, comments later |
| Embedding generation slow | Medium | Low | Use lightweight models, cache results |
| Provider API changes | Low | Low | Abstract provider logic, easy updates |
| Sync system redesign needed | High | High | Defer to post-MVP, use local-only for now |

---

## 7. Resource Requirements

### Team Capacity
- 1 Full-stack engineer (recommended)
- Design support (part-time)

### Infrastructure Needs
- Existing: PostgreSQL + pgvector
- Existing: Bun runtime
- New: Possibly Redis for BYOK rate limiting

### External Services
- OpenAI API (users bring own keys)
- Anthropic API (users bring own keys)
- Google Gemini API (users bring own keys)

---

## 8. Success Metrics

### Prototype Success Criteria
- [ ] 9 AI providers for capture (including Mistral)
- [ ] 4+ providers for BYOK chat
- [ ] Vault with collections/tags
- [ ] Feed with likes/saves
- [ ] Fork functionality
- [ ] Basic profiles
- [ ] VIVIM branding complete
- [ ] Installable PWA

### Demo Success
- [ ] User can sign up → capture → continue → share
- [ ] Total time under 5 minutes

### 12-Month Targets
| Metric | Target | Why It Matters |
|--------|--------|----------------|
| Monthly Active Users | 100K | Market validation |
| Captures/User/Month | 10+ | Engagement depth |
| BYOK Chat Sessions | 5+/user/month | Platform stickiness |
| ACU Shares | 20%+ of captures | Viral content |
| Fork Rate | 5%+ of views | Viral coefficient |
| D7 Retention | 40%+ | Product-market fit |
| Vault Size | 50+ ACUs avg | Lock-in/value |

---

## 9. Priority Matrix

| Priority | Feature | Effort | Impact | Do When |
|----------|---------|--------|--------|---------|
| P0 | Fix CRIT-01 (context-assembler crash) | 1 hour | **BLOCKER** | **IMMEDIATE** |
| P0 | Fix CRIT-04 (invalidation crash) | 2 hours | **BLOCKER** | **IMMEDIATE** |
| P0 | BYOK Chat | 2-3 weeks | Core value prop | Sprint 2 |
| P0 | Rebranding | 2 days | Product identity | Sprint 1 |
| P0 | Mistral Provider | 2-3 days | Complete coverage | Sprint 1 |
| P1 | Social Backend | 1 week | Viral mechanics | Sprint 3 |
| P1 | Vault UI | 1 week | User organization | Sprint 4 |
| P1 | Search (semantic) | 5 days | Discoverability | Sprint 4 |
| P2 | Mobile Polish | 5 days | Mobile UX | Sprint 4 |
| P2 | Recommendations | 1 week | Engagement | Post-MVP |
| P3 | Advanced Features | 2 weeks | Future roadmap | v1.1 |

---

## 10. Files Requiring Changes

### Rebranding Checklist

```
[ ] apps/pwa/index.html (title, meta)
[ ] apps/pwa/package.json (name)
[ ] apps/pwa/src/pages/HomeNew.tsx
[ ] apps/pwa/src/components/Header.tsx
[ ] apps/pwa/src/lib/identity/identity-service.ts
[ ] apps/server/package.json (name, description)
[ ] apps/server/src/server.js (logs)
[ ] apps/server/src/routes/feed.js
[ ] apps/server/prisma/schema.prisma
[ ] Root README.md
[ ] Root package.json (if exists)
```

### New Files to Create

```
apps/pwa/src/
├── lib/byok/
│   ├── api-key-manager.ts
│   ├── provider-config.ts
│   ├── key-validation.ts
│   └── usage-tracker.ts
├── pages/
│   ├── BYOKChat.tsx
│   ├── APIKeySettings.tsx
│   ├── Vault.tsx
│   ├── Collections.tsx
│   ├── Tags.tsx
│   └── Profile.tsx
└── components/
    ├── BYOKChatInput.tsx
    ├── ChatMessage.tsx
    ├── StreamingResponse.tsx
    ├── CollectionCard.tsx
    ├── TagBadge.tsx
    ├── LikeButton.tsx
    ├── BookmarkButton.tsx
    ├── ForkButton.tsx
    └── FollowButton.tsx

apps/server/src/
├── routes/byok.js
├── routes/social.js (likes, follows)
├── services/embedding.js (semantic search)
└── extractors/extractor-mistral.js
```

---

## 11. Estimated Timeline Summary

```
Week 1: Foundation
├── Day 1-2: Rebranding (OpenScroll → VIVIM)
├── Day 3-4: Mistral provider
├── Day 5: BYOK API design
└── Weekend: Critical bug fixes

Week 2: BYOK Core
├── Day 1-3: API key management UI
├── Day 4-5: Chat interface
└── Weekend: Provider integration

Week 3: BYOK Core (continued)
├── Day 1-2: Streaming responses
├── Day 3-4: Usage tracking
└── Day 5: Testing

Week 4: Social Features
├── Day 1-3: Following/likes/shares
├── Day 4-5: Fork functionality
└── Weekend: Bug fixes

Week 5: Polish
├── Day 1-3: Vault organization
├── Day 4: Search improvements
└── Day 5: Mobile polish
```

**Total Estimated: 4-5 weeks**

---

## 12. Go/No-Go Decision

### MVP Launch Criteria

**Must Have (P0):**
- [ ] 9 AI providers (including Mistral)
- [ ] BYOK Chat with 4+ providers
- [ ] Vault with basic organization
- [ ] Feed with likes/saves
- [ ] Fork functionality
- [ ] VIVIM branding
- [ ] Installable PWA
- [ ] Critical bugs fixed

**Should Have (P1):**
- [ ] Collections/tags
- [ ] Basic profiles
- [ ] Semantic search
- [ ] Following system

**Nice to Have (P2):**
- [ ] Comments
- [ ] External sharing cards
- [ ] Mobile push notifications

**Decision:** If all P0 items are complete, **GO** for MVP launch.

---

**Document Version:** 1.0
**Generated:** March 23, 2026
**Next Review:** After Sprint 1 completion
