# VIVIM v1 Prototype Gap Analysis

> **Analysis Date:** February 9, 2026  
> **Status:** OpenScroll → VIVIM Migration Assessment  
> **Goal:** Elevate OpenScroll codebase to working VIVIM prototype

---

## Executive Summary

**OpenScroll** has ~70% of the technical foundation for **VIVIM v1**. The capture system, ACU schema, identity management, and local-first storage are solid. However, critical user-facing features are missing or incomplete:

| Category | Implementation | VIVIM Req | Gap |
|----------|----------------|-----------|-----|
| **Capture** | 8 providers | 9 | Mistral missing |
| **ACU System** | Schema + Processing | A01-A30 | UI components incomplete |
| **Identity** | DID-based | I01-I20 | Social auth missing |
| **BYOK Chat** | ❌ 0% | B01-B25 | **CRITICAL GAP** |
| **Social/Feed** | Skeleton | F01-F30 | Backend skeleton only |
| **Vault** | Storage layer | V01-V30 | Organization UI missing |
| **Search** | Basic | S01-S10 | Semantic search incomplete |
| **Sharing** | Schema exists | H01-H10 | Full sharing UX missing |

**Estimated Effort to Prototype:** 3-4 weeks (full-time)

---

## 1. Capture System Analysis (C01-C30)

### Current State

**Supported Providers:**
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

**Capture Features:**
| Feature | Status | File |
|---------|--------|------|
| URL-based extraction | ✅ | `src/routes/capture.js` |
| Playwright automation | ✅ | `src/capture-playwright.js` |
| Single-file CLI | ✅ | `single-file-cli/` |
| Cloudflare bypass | ✅ | `single-file-cli/cloudflare-bypass/` |
| Error handling | ✅ | `src/repositories/CaptureAttemptRepository.js` |

### Gap: Mistral Provider

**Action Required:**
```bash
# Create new extractor
apps/server/src/extractors/extractor-mistral.js

# Add route
apps/server/src/routes/capture.js (provider detection)

# Add tests
apps/server/tests/extractors/mistral.test.js
```

**Estimated:** 2-3 days

---

## 2. ACU System Analysis (A01-A30)

### Current State

**Backend Schema (Complete):**
```
✅ atomic_chat_units table (prisma/schema.prisma)
✅ acu_links table (relationships)
✅ acu_processor.js (generation service)
✅ acu_api.ts (frontend client)
```

**ACU Types Supported:**
- `statement` - General statements
- `question` - User questions
- `answer` - AI responses
- `code_snippet` - Code blocks
- `explanation` - Explanations
- `summary` - Auto-generated summaries

### Gap: Frontend Components

**Missing Components:**

| Component | Status | Priority |
|-----------|--------|----------|
| ACU Card | ⚠️ Basic | Medium |
| ACU Graph View | ❌ Not started | P2 |
| ACU Search | ⚠️ Basic | Medium |
| ACU Organization | ❌ Not started | High |
| ACU Sharing UI | ❌ Not started | High |
| ACU Quality Display | ❌ Not started | Low |

**Files needing work:**
```
apps/pwa/src/components/
├── ACUViewer.tsx        # Needs enhancement
├── ACUGraph.tsx         # Not implemented
├── ACUSearch.tsx        # Basic
└── ACUCard.tsx         # Needs redesign
```

**Estimated:** 1-2 weeks

---

## 3. BYOK AI Chat Analysis (B01-B25)

### Current State

**This entire system is NOT implemented.**

```
❌ API Key Management      - 0%
❌ Provider Configuration - 0%
❌ Chat Interface         - 0%
❌ Context Injection      - 0%
❌ Streaming Responses     - 0%
❌ Cost Tracking          - 0%
```

### Why This Is Critical

BYOK is the **core differentiator** for VIVIM. Users don't just save conversations—they continue them.

### Implementation Requirements

#### 3.1 API Key Management (B01-B08)

```typescript
// Need to create
apps/pwa/src/lib/byok/
├── api-key-manager.ts    # Encrypted key storage
├── provider-config.ts    # Provider configurations
├── key-validation.ts     # Test API keys
└── usage-tracker.ts     # Token/cost tracking

// Supported providers needed:
- OpenAI (GPT-4, GPT-3.5)
- Anthropic (Claude 3)
- Google (Gemini Pro)
- Mistral (Mixtral)
- xAI (Grok)
```

**Security Requirements:**
- Keys encrypted with user's master key (from identity service)
- Keys NEVER sent to our servers
- Local-only decryption

#### 3.2 Continue Conversation (B09-B15)

```typescript
// Need endpoints
apps/server/src/routes/byok.js

POST /api/v1/byok/chat
  - Takes conversation ID + user message
  - Loads conversation context
  - Calls user's API provider
  - Streams response back
  - Saves new message to conversation
```

#### 3.3 Chat Experience (B16-B25)

```typescript
// Need frontend pages
apps/pwa/src/pages/
├── BYOKChat.tsx         # Main chat interface
├── APIKeySettings.tsx   # Key management UI
├── ModelSelector.tsx    # Model dropdown
├── ChatSettings.tsx     # Temperature, max tokens
└── UsageStats.tsx       # Cost visualization
```

**Estimated:** 2-3 weeks

---

## 4. Feed & Social Analysis (F01-F30)

### Current State

**Backend Skeleton (Complete Structure, Stubbed Logic):**
```
✅ /api/v1/feed (GET)
✅ /api/v1/feed/engagement (POST)
✅ Engagement weights defined
✅ Scoring algorithm skeleton
```

**Frontend Skeleton:**
```
✅ HomeNew.tsx with tabs
✅ FeedCard.tsx
✅ Feed API client
```

### Gap: Real Implementation

| Feature | Current | Needed |
|---------|---------|--------|
| For You Feed | Mock data | Real ACU ranking |
| Following | Empty | User following system |
| Trending | ❌ | Popular ACU aggregation |
| Likes | TODO | Real tracking |
| Saves/Bookmarks | TODO | Real storage |
| Fork | Schema only | UI + copy logic |
| Comments | ❌ | Discussion system |
| Follow Users | ❌ | User relationships |

**Critical Missing:**

1. **User Following System**
   ```prisma
   -- Need table
   model UserFollow {
     followerId    String
     followingId   String
     createdAt     DateTime
     
     @@unique([followerId, followingId])
   }
   ```

2. **Real Engagement Tracking**
   ```javascript
   // Currently just console.log
   // Need:
   - Like counter in DB
   - Save/bookmark storage
   - View count tracking
   - Share link generation
   ```

3. **Fork Functionality**
   ```typescript
   // Need to implement:
   - Copy conversation to user's vault
   - Preserve attribution (forked from X)
   - Track fork lineage
   ```

**Estimated:** 1-2 weeks

---

## 5. Vault & Storage Analysis (V01-V30)

### Current State

**Storage Layer (Excellent):**
```
✅ IndexedDB wrapper (storage-v2/)
✅ Yjs CRDT sync
✅ Encrypted storage (secure-crypto.ts)
✅ DAG schema (STORAGE_SCHEMA_V2.md)
```

### Gap: Organization UI

**Missing Vault Features:**

| Feature | Status | Priority |
|---------|--------|----------|
| Collections/Folders | ❌ | High |
| Tagging System | ❌ | High |
| Favorites | ⚠️ Basic | Medium |
| Search Filters | ⚠️ Basic | High |
| Sort Options | ❌ | Medium |
| Bulk Actions | ❌ | Low |
| Archive | ❌ | Low |
| Trash | ❌ | Low |

**Files to Create:**
```
apps/pwa/src/pages/
├── Vault.tsx              # Main vault view
├── Collections.tsx        # Folder management
├── Tags.tsx              # Tag editor
└── SearchFilters.tsx      # Advanced search

apps/pwa/src/components/
├── CollectionCard.tsx
├── TagBadge.tsx
├── VaultItem.tsx
└── SortControl.tsx
```

**Estimated:** 1 week

---

## 6. Identity Analysis (I01-I20)

### Current State

**Excellent Foundation:**
```
✅ DID-based identity (did:key method)
✅ BIP-39 seed phrases
✅ Device key derivation
✅ Encrypted private key storage
✅ Profile (displayName, avatar, bio)
```

### Gap: Social Authentication

**Missing:**
```
❌ Google OAuth
❌ Apple Sign-In
❌ GitHub OAuth
❌ Magic Link email
❌ 2FA support
❌ Session management UI
❌ Account deletion
```

**Estimated:** 3-5 days

---

## 7. Sharing Analysis (H01-H10)

### Current State

**Schema Exists:**
```
✅ Circle model (sharing groups)
✅ CircleMember model
✅ Sharing policy on ACUs
```

### Gap: Sharing UX

**Missing:**
```
❌ Share to Feed UI
❌ Copy link generation
❌ External share (Twitter, LinkedIn)
❌ Share permissions UI
❌ Expiring links
❌ Password protection
❌ Fork attribution UI
```

**Estimated:** 1 week

---

## 8. Search Analysis (S01-S10)

### Current State

**Basic Implementation:**
```
✅ Full-text search (ACU API)
❌ Semantic search (needs embeddings)
❌ Filters UI
❌ Search suggestions
❌ Search history
```

**Note:** pgvector is in schema but embeddings aren't being generated.

**Estimated:** 5 days

---

## 9. Mobile & PWA Analysis (M01-M10)

### Current State

**PWA Foundation:**
```
✅ Vite PWA plugin
✅ Service worker
✅ Offline support
❌ Push notifications
❌ Share target
❌ Haptic feedback
❌ Gesture navigation
```

**Estimated:** 3-5 days

---

## Priority Matrix

| Priority | Feature | Effort | Impact |
|----------|---------|--------|--------|
| P0 | BYOK Chat | 2-3 weeks | Core value prop |
| P0 | Rebranding | 2 days | Product identity |
| P1 | Social Backend | 1 week | Viral mechanics |
| P1 | Vault UI | 1 week | User organization |
| P1 | Mistral Provider | 2 days | Complete coverage |
| P2 | Search | 5 days | Discoverability |
| P2 | Mobile Polish | 5 days | Mobile UX |
| P3 | Advanced Features | 2 weeks | Future roadmap |

---

## Estimated Timeline

```
Week 1: Foundation
├── Day 1-2: Rebranding (OpenScroll → VIVIM)
├── Day 3-4: Mistral provider
└── Day 5: BYOK API design

Week 2: BYOK Core
├── Day 1-3: API key management UI
├── Day 4-5: Chat interface
└── Weekend: Testing

Week 3: Social Features
├── Day 1-3: Following/likes/shares
├── Day 4-5: Fork functionality
└── Weekend: Bug fixes

Week 4: Polish
├── Day 1-3: Vault organization
├── Day 4: Search improvements
└── Day 5: Mobile polish
```

**Total Estimated: 4 weeks**

---

## Files Requiring Changes

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
│   └── usage-tracker.ts
├── pages/
│   ├── BYOKChat.tsx
│   ├── APIKeySettings.tsx
│   ├── Vault.tsx
│   ├── Collections.tsx
│   └── Tags.tsx
└── components/
    ├── BYOKChatInput.tsx
    ├── ChatMessage.tsx
    ├── CollectionCard.tsx
    └── TagBadge.tsx

apps/server/src/
├── routes/byok.js
├── routes/social.js (likes, follows)
└── services/embedding.js (semantic search)
```

---

## Success Criteria for Prototype

**MVP Definition (4 weeks):**
- [ ] 9 AI providers (including Mistral)
- [ ] BYOK Chat with 4+ providers
- [ ] Vault with collections/tags
- [ ] Feed with likes/saves
- [ ] Fork functionality
- [ ] Basic profiles
- [ ] VIVIM branding
- [ ] Installable PWA

**Stretch Goals:**
- [ ] Semantic search
- [ ] Comments
- [ ] External sharing cards
- [ ] Mobile push notifications

---

## Appendix: Provider Coverage Matrix

| Provider | Capture | BYOK | Priority |
|----------|---------|------|----------|
| ChatGPT | ✅ | ✅ OpenAI | P0 |
| Claude | ✅ | ✅ Anthropic | P0 |
| Gemini | ✅ | ✅ Google | P0 |
| Grok | ✅ | ✅ xAI | P1 |
| DeepSeek | ✅ | ❌ | P2 |
| Kimi | ✅ | ❌ | P2 |
| Qwen | ✅ | ❌ | P2 |
| z.ai | ✅ | ❌ | P2 |
| Mistral | ❌ | ✅ Mistral | P0 |

---

*Document Version: 1.0*  
*Last Updated: February 9, 2026*
