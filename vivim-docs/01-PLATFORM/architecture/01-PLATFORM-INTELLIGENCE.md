# VIVIM Platform Intelligence Report

> **Generated:** March 23, 2026
> **Source:** VIVIM.docs/.archive (46 documents analyzed)
> **Purpose:** Comprehensive platform intelligence synthesis

---

## Executive Summary

VIVIM is a **sovereign AI knowledge management platform** designed to capture, own, evolve, and share AI conversations. The platform represents a paradigm shift from AI conversation captivity (ChatGPT, Claude, Gemini walled gardens) to user-owned knowledge assets.

### Core Value Proposition

| Pillar | Description | User Value |
|--------|-------------|------------|
| **Capture** | Extract conversations from 9+ AI platforms | Liberation from walled gardens |
| **Vault** | Personal encrypted knowledge store | Ownership, privacy, organization |
| **BYOK Chat** | Continue conversations with your own API keys | Evolution and remixing |
| **Feed** | Social network for AI conversations | Discovery, inspiration, community |

### Platform Status

| Component | Status | Readiness | Notes |
|-----------|--------|-----------|-------|
| **Dynamic Context Engine** | ✅ Complete | Production-Ready | 8-layer pipeline fully implemented |
| **Identity Layer (Phase 1)** | ✅ Complete | Production-Ready | DID-based auth, device management |
| **ACU System** | ✅ Backend Complete | 85% | Schema + processing complete, UI gaps |
| **BYOK Chat** | ⚠️ Design Complete | 0% | Critical gap - core differentiator |
| **Social/Feed** | ⚠️ Skeleton | 40% | Backend skeleton, needs implementation |
| **Vault UI** | ⚠️ Storage Complete | 60% | Organization features missing |
| **Sync System** | 🔴 Critical Issues | 0% | Three incompatible sync mechanisms |

---

## 1. Platform Architecture

### 1.1 System Topology

```
┌─────────────────────────────────────────────────────────────────┐
│                      VIVIM Architecture                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐        │
│  │  Instance A  │◄──►│  Instance B  │◄──►│  Instance C  │        │
│  │  (PDS)      │    │  (PDS)      │    │  (PDS)      │        │
│  └──────┬──────┘    └──────┬──────┘    └──────┬──────┘        │
│         │                   │                   │               │
│    ┌────┴────┐        ┌────┴────┐        ┌────┴────┐         │
│    │ Users    │        │ Users    │        │ Users    │         │
│    └────┬────┘        └────┬────┘        └────┬────┘         │
│         │                   │                   │               │
│    ┌────┴────┐        ┌────┴────┐        ┌────┴────┐         │
│    │ P2P Mesh│◄─────►│ P2P Mesh│◄─────►│ P2P Mesh│         │
│    └─────────┘        └─────────┘        └─────────┘         │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend PWA** | React + Vite + TypeScript | Primary web interface |
| **Mobile** | React Native + Tamagui | iOS/Android native apps |
| **Backend** | Node.js + Bun Runtime | API server |
| **Database** | PostgreSQL + pgvector | Relational + vector search |
| **Vector Store** | Qdrant (optional) | Semantic search |
| **Cache** | Redis | Session/presence |
| **Sync** | Yjs CRDT + HLC | Real-time collaboration |
| **Identity** | DID (Decentralized Identifiers) | User authentication |

### 1.3 Node Types

| Node Type | Role | Requirements | Self-Host |
|-----------|------|--------------|-----------|
| **PDS** (Personal Data Server) | Primary data storage, API | 2+ CPU, 4GB RAM, 50GB SSD | ✅ Yes |
| **Relay** | Message routing, federation | 4+ CPU, 8GB RAM, 100GB SSD | ✅ Yes |
| **Edge Node** | CDN, caching, compute | 2+ CPU, 2GB RAM | ✅ Yes |
| **Client Node** | User device (PWA/Mobile) | Browser/APP | N/A |

---

## 2. Dynamic Context Engine (10x Enhanced)

### 2.1 Overview

The Dynamic Context Engine is VIVIM's **crown jewel** - an 8-layer context pipeline that assembles personalized AI context from topics, entities, memories, conversations, and real-time presence signals.

### 2.2 Performance Metrics (Before vs After)

| Metric | Before | After (10x) | Improvement |
|--------|--------|-------------|-------------|
| Avg Assembly Latency | ~2000ms | ~200ms | **10x** |
| DB Queries per Assembly | 15-20 | 3-5 | **4x fewer** |
| Cache Hit Rate | 0% | 60-80% | **∞** |
| Bundle Recompilation | Full every time | Delta only | **5x faster** |
| Prediction Accuracy | ~30% (guess) | ~70% (adaptive) | **2.3x** |
| Context Detection | ~200ms (DB) | ~1ms (graph) | **200x** |
| Error Visibility | Console.log | Structured telemetry | **∞** |

### 2.3 The 8-Layer Pipeline

| Layer | Name | Token Budget | Description |
|-------|------|--------------|-------------|
| **L0** | Identity Core | 150-500t | User biography, identity, role memories |
| **L1** | Global Preferences | 100-800t | Custom instructions, preferences |
| **L2** | Topic Context | 0-25% budget | Topic-specific knowledge |
| **L3** | Entity Context | 0-12% budget | Entity facts and relationships |
| **L4** | Conversation | 0-20% budget | Current conversation arc |
| **L5** | JIT Retrieval | 0-18% budget | Real-time knowledge fetch |
| **L6** | Message History | 0-60% budget | Compressed conversation history |
| **L7** | User Message | Exact size | Current user input |

### 2.4 Core Components (16 Modules)

#### Original 7 Modules
1. `context-assembler.ts` - Runtime assembly entry point
2. `budget-algorithm.ts` - Token budget computation (4-phase algorithm)
3. `bundle-compiler.ts` - Bundle compilation and storage
4. `prediction-engine.ts` - Interaction prediction (7 signals)
5. `context-orchestrator.ts` - Presence + warmup orchestration
6. `conversation-context-engine.ts` - 4-strategy compression
7. `hybrid-retrieval.ts` - JIT knowledge retrieval

#### 10x Enhancement Modules (9 New)
8. `context-cache.ts` - LRU cache with per-namespace TTL (~80% DB reduction)
9. `context-event-bus.ts` - Event-driven reactive invalidation
10. `context-pipeline.ts` - Parallel pipeline & streaming (3-5x faster)
11. `adaptive-prediction.ts` - 4-signal adaptive prediction (2-3x accuracy)
12. `context-telemetry.ts` - Full observability and anomaly detection
13. `bundle-differ.ts` - Delta compression (60-80% faster recompilation)
14. `query-optimizer.ts` - DataLoader + coalescing (50-70% fewer DB trips)
15. `prefetch-engine.ts` - Predictive prefetch for near-zero latency
16. `context-graph.ts` - In-memory graph for 200x faster detection

### 2.5 Budget Algorithm (4 Phases)

```
Phase 1: Compute layer parameters based on situation
  - Depth multiplier (minimal/standard/deep)
  - Conversation pressure calculation
  - Knowledge-heavy vs dialogue-heavy detection

Phase 2: Guaranteed allocations (hard minimums)
  - L0 identity: 150-500t
  - L1 prefs: 100-800t
  - L7 message: exact size

Phase 3: Elastic allocation for L2-L6
  - Topic count factor: min(2.0, 1.0 + (count - 1) * 0.3)
  - Entity count factor: min(2.0, 1.0 + (count - 1) * 0.4)
  - L4 logarithmic scaling with message count
  - L5 coverage factor based on topic bundle tokens
  - L6 ratio selection (small/medium/large/huge)

Phase 4: Handle overflow
  - Priority-based cutting (lowest priority first)
  - Never cut below minimum thresholds
```

### 2.6 Conversation Compression Strategies

| Strategy | Ratio | Description |
|----------|-------|-------------|
| `strategyFull` | ≤1.0 | No compression |
| `strategyWindowed` | 1.0-2.5 | Recent full, older summarized |
| `strategyCompacted` | 2.5-8.0 | Multi-zone progressive |
| `strategyMultiLevel` | >8.0 | Hierarchical compaction |

### 2.7 Prediction Signals (7 Total)

1. **Signal 1**: Active conversation continuation (prob: 0.85)
2. **Signal 2**: Visible sidebar conversations (prob: 0.30)
3. **Signal 3**: Time-of-day topic patterns (prob: 0.2 * importance)
4. **Signal 4**: Hot topics last 48h (prob: 0.15 * importance)
5. **Signal 5**: Active entities last 72h (prob: 0.1 * importance)
6. **Signal 6**: Navigation pattern analysis (researching detection)
7. **Signal 7**: Cold start detection (prob: 0.5) - **BONUS**

### 2.8 Critical Bugs Identified

| ID | Severity | File | Issue |
|----|----------|------|-------|
| **CRIT-01** | 🔴 RUNTIME | `context-assembler.ts:461` | Undefined `context` variable in `computeBudget()` - **EVERY CHAT CRASHES** |
| **CRIT-02** | 🔴 DATA LOSS | Sync system | Three incompatible sync mechanisms with no tombstone deletes |
| **CRIT-03** | 🔴 CORRUPTION | `hlc.js:19-43` | Fragile hyphen-based HLC parsing corrupts with hyphens in nodeIds |
| **CRIT-04** | 🔴 RUNTIME | `invalidation-service.ts` | Schema mismatch - `SystemAction` has no `metadata` field |

---

## 3. Feature Inventory (120+ Features)

### 3.1 Capture System (C01-C30)

**Supported Providers:**
| Provider | Status | Method |
|----------|--------|--------|
| ChatGPT | ✅ Complete | Share URL |
| Claude | ✅ Complete | Share URL |
| Gemini | ✅ Complete | Share URL |
| Grok | ⚠️ Beta | Share URL |
| DeepSeek | ⚠️ Beta | Share URL |
| Kimi | ⚠️ Beta | Share URL |
| Qwen | ⚠️ Beta | Share URL |
| z.ai | ⚠️ Beta | Share URL |
| **Mistral** | ❌ Missing | Share URL |

**Key Features:**
- C01-C09: AI platform extraction (9 providers)
- C10-C20: Content parsing (code, images, LaTeX, tables)
- C21-C30: Smart capture (web pages, RSS, scheduled scraping)

### 3.2 Feed & Social (F01-F30)

| Feature | Status | Priority |
|---------|--------|----------|
| For You Feed | ⚠️ Mock data | P0 |
| Following Feed | ❌ Empty | P0 |
| Trending Feed | ❌ Not implemented | P0 |
| Like/Heart | ❌ TODO | P0 |
| Save/Bookmark | ❌ TODO | P0 |
| Fork/Remix | ✅ Schema only | P0 |
| Follow User | ❌ Not implemented | P0 |
| Comment | ❌ Not implemented | P1 |

**Backend Status:** Skeleton endpoints exist but return mock data

### 3.3 Vault & Storage (V01-V30)

| Component | Status | Notes |
|-----------|--------|-------|
| IndexedDB Storage | ✅ Complete | Local-first architecture |
| Offline Access | ✅ Complete | Service worker + cache |
| E2E Encryption | ✅ Complete | Zero-knowledge |
| Collections/Folders | ❌ Missing | High priority gap |
| Tagging System | ❌ Missing | High priority gap |
| Search Filters | ⚠️ Basic | Needs enhancement |

### 3.4 Atomic Chat Units (ACU) (A01-A30)

**Backend:** ✅ Complete
- Schema: `atomic_chat_units`, `acu_links` tables
- Processor: `acu_processor.js` generation service
- API: `acu-api.ts` frontend client

**ACU Types:**
- `statement`, `question`, `answer`, `code_snippet`, `explanation`, `summary`

**Frontend Gaps:**
- ACU Card: ⚠️ Basic (needs redesign)
- ACU Graph View: ❌ Not started
- ACU Search: ⚠️ Basic
- ACU Organization: ❌ Not started
- ACU Sharing UI: ❌ Not started

### 3.5 BYOK AI Chat (B01-B25) - CRITICAL GAP

**Status:** ❌ **0% IMPLEMENTED** - This is the **CORE DIFFERENTIATOR**

**Required Components:**
```
apps/pwa/src/lib/byok/
├── api-key-manager.ts    # Encrypted key storage
├── provider-config.ts    # Provider configurations
├── key-validation.ts     # Test API keys
└── usage-tracker.ts     # Token/cost tracking

apps/pwa/src/pages/
├── BYOKChat.tsx         # Main chat interface
├── APIKeySettings.tsx   # Key management UI
├── ModelSelector.tsx    # Model dropdown
└── ChatSettings.tsx     # Temperature, max tokens

apps/server/src/
└── routes/byok.js       # Backend endpoint
```

**Supported Providers Needed:**
- OpenAI (GPT-4, GPT-3.5) - P0
- Anthropic (Claude 3) - P0
- Google (Gemini Pro) - P0
- Mistral (Mixtral) - P0
- xAI (Grok) - P1

### 3.6 Identity & Security (I01-I20)

**Phase 1 Complete:**
- ✅ DID-based identity (did:key method)
- ✅ BIP-39 seed phrases
- ✅ Device key derivation
- ✅ Encrypted private key storage
- ✅ Profile (displayName, avatar, bio)
- ✅ 15 API endpoints for identity management

**Missing:**
- ❌ Google OAuth
- ❌ Apple Sign-In
- ❌ GitHub OAuth
- ❌ Magic Link email
- ❌ 2FA support
- ❌ Session management UI

### 3.7 Search & Discovery (S01-S10)

| Feature | Status | Notes |
|---------|--------|-------|
| Full-Text Search | ✅ Complete | ACU API |
| Semantic Search | ❌ Needs embeddings | pgvector in schema but not used |
| Search Filters | ⚠️ Basic | Needs UI |
| Search Suggestions | ❌ Not implemented | |
| Search History | ❌ Not implemented | |

### 3.8 Sharing & Collaboration (H01-H10)

**Schema Exists:**
- ✅ Circle model (sharing groups)
- ✅ CircleMember model
- ✅ Sharing policy on ACUs

**Missing UX:**
- ❌ Share to Feed UI
- ❌ Copy link generation
- ❌ External share (Twitter, LinkedIn)
- ❌ Share permissions UI
- ❌ Expiring links
- ❌ Password protection

### 3.9 Recommendations (R01-R10) - NOT COVERED

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

### 3.10 Mobile & PWA (M01-M10)

| Feature | Status | Notes |
|---------|--------|-------|
| Installable PWA | ✅ Complete | Vite PWA plugin |
| Service Worker | ✅ Complete | Offline support |
| Offline Mode | ✅ Complete | IndexedDB + cache |
| Push Notifications | ❌ Missing | |
| Share Target | ❌ Missing | iOS/Android share sheet |
| Haptic Feedback | ❌ Missing | Mobile only |
| Gesture Navigation | ❌ Missing | Mobile only |

---

## 4. User Journey (8 Stages)

### Stage 1: DISCOVER (Day 0)
**Trigger Moments:**
- Social media post with shared AI conversation
- Friend's recommendation
- Viral conversation getting shared
- Search: "How to save ChatGPT conversations"
- Content creator demo

**Success Metric:** Landing page → Sign up: **15%+ conversion**

### Stage 2: ONBOARD (Day 1)
**Sign-Up Flow (60 seconds):**
1. Choose auth (Google, Apple, email)
2. Profile setup (@username, display name)
3. First capture prompt

**Success Metric:** Sign up → First capture: **60%+ within 24 hours**

### Stage 3: CAPTURE - The "Aha!" Moment (Day 1-7)
**Primary Flow:**
1. Copy ChatGPT share link
2. Open VIVIM (app detects clipboard)
3. Tap "Capture"
4. Watch extraction animation (3-5 seconds)
5. Full conversation appears in Vault

**Success Metric:** First capture → Second capture: **40%+ within 7 days**

### Stage 4: EVOLVE (BYOK Chat) - The "Power" Moment (Week 2+)
**The BYOK "Aha!" Moment:**
```
User sees forked conversation with "Continue this conversation" button
→ Types follow-up question
→ AI responds with full context from original
→ 🎉 "I can build on anyone's work!"
```

**Success Metrics:**
- Users who add API key: **30%+ of Week 2 users**
- BYOK chat sessions per user per month: **5+**

### Stage 5: EXPLORE (Building the Habit) (Week 3+)
**Daily Usage Pattern:**
- Morning: Check Feed ("What's new?")
- Work: Capture AI conversations
- Evening: Organize with tags, search vault

**Success Metrics:**
- Weekly active users: **60%+ of registered**
- Vault items per user at 30 days: **25+**

### Stage 6: SHARE (ACU Power) (Month 1+)
**Share Motivations:**
- Pride: "I solved this hard problem"
- Help others: "This prompt is really useful"
- Discussion: "What do you think about this?"
- Building reputation: "I'm an expert in X"

**Success Metric:** ACU shares: **20%+ of captures yield shared ACUs**

### Stage 7: BUILD (Power User) (Month 2+)
**Power User Behaviors:**
- Compose new conversations from ACUs
- Maintain curated collections
- Active in multiple circles
- Regular forking and remixing

### Stage 8: ADVOCATE (Month 6+)
**Viral Mechanics:**
- Share to external platforms
- Invite friends to circles
- Create public tutorials
- Build reputation as expert

---

## 5. Implementation Roadmap

### Sprint 1: Foundation (Feb 9-15)
**Goals:**
1. ✅ Complete rebranding (OpenScroll → VIVIM)
2. ❌ Add Mistral provider
3. ❌ Design BYOK architecture
4. ❌ Set up CI/CD for testing

**Estimated:** 2-3 days

### Sprint 2: BYOK Core (Feb 16-22)
**Goals:**
1. ❌ API Key Management UI
2. ❌ Chat Interface
3. ❌ Provider Integration (4+ providers)

**Estimated:** 2-3 weeks

### Sprint 3: Social Features (Feb 23 - Mar 1)
**Goals:**
1. ❌ Following system
2. ❌ Likes/Saves
3. ❌ Fork functionality
4. ❌ Basic profiles

**Estimated:** 1-2 weeks

### Sprint 4: Polish (Mar 2-8)
**Goals:**
1. ❌ Vault organization
2. ❌ Search improvements
3. ❌ Mobile polish
4. ❌ Testing & Bug fixes

**Estimated:** 1 week

---

## 6. Critical Issues & Risks

### 6.1 Runtime Crashes (Must Fix Before Launch)

| Issue | Impact | Fix Effort |
|-------|--------|------------|
| **CRIT-01**: Undefined `context` in `computeBudget()` | Every chat crashes | Low - clear fix |
| **CRIT-04**: `SystemAction` schema mismatch | Invalidation crashes | Medium - schema migration |

### 6.2 Data Loss Vectors (Must Fix Before Launch)

| Issue | Impact | Fix Effort |
|-------|--------|------------|
| **CRIT-02**: Three incompatible sync mechanisms | Silent data loss | **VERY HIGH** - architectural redesign |
| **CRIT-03**: Fragile HLC parser | Corruption with hyphens | Medium - design safer delimiter |

### 6.3 High Priority Gaps

| Issue | Impact | Fix Effort |
|-------|--------|------------|
| **HIGH-01**: Duplicate `semanticSearchMemories` method | Qdrant path dead code | Low - code dedup |
| **HIGH-02**: Nonexistent `totalTokensSpent` field | Prisma runtime error | Low - schema alignment |
| **HIGH-04**: Invalid Prisma JSON update syntax | Librarian worker fails | Medium - research Prisma JSON ops |
| **HIGH-05**: Typo in `qdrant-vector-store.ts` | Wrong dates in results | Low - typo fix |

### 6.4 Medium Priority Gaps

| Issue | Impact | Fix Effort |
|-------|--------|------------|
| **MED-01**: Profile Updater not implemented | No post-conversation learning | **HIGH** - new module |
| **MED-02**: PostgreSQL fallback has no real similarity | Degraded without Qdrant | Medium - SQL math |
| **MED-03**: Budget algorithm can zero all layers | Empty context possible | Low - guard clause |
| **MED-04**: Wrong `storeBundle` argument order | Wrong foreign keys | Low - positional fix |

---

## 7. Success Metrics

### MVP Definition (4 weeks)
- [ ] 9 AI providers (including Mistral)
- [ ] BYOK Chat with 4+ providers
- [ ] Vault with collections/tags
- [ ] Feed with likes/saves
- [ ] Fork functionality
- [ ] Basic profiles
- [ ] VIVIM branding complete
- [ ] Installable PWA

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

## 8. Competitive Differentiation

| Feature | VIVIM | ChatGPT | Claude | Notion AI |
|---------|-------|---------|--------|-----------|
| Multi-Provider Capture | ✅ 9+ | ❌ Only GPT | ❌ Only Claude | ❌ None |
| User-Owned Data | ✅ E2E Encrypted | ❌ OpenAI owns | ❌ Anthropic owns | ⚠️ Cloud-only |
| Continue Conversations | ✅ BYOK | ⚠️ Only in-platform | ⚠️ Only in-platform | ❌ No |
| Social Sharing | ✅ Feed + Forks | ❌ Limited | ❌ None | ⚠️ Pages only |
| Atomic Knowledge Units | ✅ ACU System | ❌ Monolithic | ❌ Monolithic | ❌ Blocks |
| Offline Access | ✅ Local-first | ❌ Cloud-only | ❌ Cloud-only | ⚠️ Limited |
| P2P Sharing | ✅ WebRTC | ❌ None | ❌ None | ❌ None |

---

## 9. Open Questions & Decisions Needed

### 9.1 Architecture Decisions

1. **Sync Protocol**: Should we unify on HLC+CRDT or keep separate mechanisms?
2. **Federation**: ActivityPub extension vs custom protocol?
3. **Vector Search**: Invest in pgvector or require Qdrant?
4. **Self-Hosting**: Docker compose for consumers or just enthusiasts?

### 9.2 Product Decisions

1. **BYOK Pricing**: Free with usage limits or tiered pricing?
2. **Social Feed**: Algorithmic or chronological by default?
3. **ACU Granularity**: Auto-decompose or user-controlled?
4. **Privacy Defaults**: Public by default or private by default?

### 9.3 Go-to-Market Decisions

1. **Launch Strategy**: Invite-only beta or open launch?
2. **Target Audience**: AI power users or general knowledge workers?
3. **Monetization**: Freemium, subscription, or usage-based?
4. **Distribution**: Web-first or mobile-first?

---

## 10. Recommended Opus Task Queue

Ordered by impact × complexity × urgency:

| # | Task | Estimated Thinking Depth | File(s) |
|:--|:-----|:------------------------|:--------|
| 1 | **Fix CRIT-01**: Pass `detectedContext` to `computeBudget` | Low — clear fix | `context-assembler.ts` |
| 2 | **Fix CRIT-03**: Make HLC parser robust | Medium — design delimiter | `hlc.js` |
| 3 | **Fix CRIT-04**: Add fields to SystemAction or redesign queue | Medium — schema migration | `schema.prisma`, `invalidation-service.ts` |
| 4 | **Fix HIGH-01**: Merge duplicate `semanticSearchMemories` | Low — code dedup | `hybrid-retrieval.ts` |
| 5 | **Fix HIGH-02**: Remove nonexistent `totalTokensSpent` | Low — schema alignment | `profile-rollup-service.ts` |
| 6 | **Fix HIGH-04**: Correct Prisma JSON update syntax | Medium — research Prisma JSON ops | `librarian-worker.ts` |
| 7 | **Fix MED-04**: Correct `storeBundle` argument order | Low — positional fix | `bundle-compiler.ts` |
| 8 | **Design CRIT-02**: Unified Sync Protocol | **VERY HIGH** — Opus-grade | `sync-service.js`, `sync.js`, `sync-manager.ts`, `hlc.js` |
| 9 | **Design MED-01**: `profile-updater.ts` | **HIGH** — Opus-grade | New file |
| 10 | **Implement MED-02**: Postgres cosine similarity | Medium — SQL math | `hybrid-retrieval.ts` |
| 11 | **Fix MED-03**: Add minTokens floor to `cutToFit` | Low — guard clause | `budget-algorithm.ts` |
| 12 | **Enhance LOW-01**: Real LLM-powered arc generators | Medium — LLM integration | `conversation-context-engine.ts` |

---

## 11. Files Reference Index

### Core Context Engine Files
| File | Lines | Role | Status |
|:-----|:------|:-----|:-------|
| `context/context-assembler.ts` | 589 | Runtime assembly entry point | 🔴 CRIT-01 |
| `context/budget-algorithm.ts` | 248 | Token budget computation | ✅ Production |
| `context/bundle-compiler.ts` | 454 | Bundle compilation + storage | 🟠 MED-04 |
| `context/prediction-engine.ts` | 297 | Interaction prediction | ✅ Production |
| `context/context-orchestrator.ts` | 320 | Presence + warmup orchestration | ✅ Production |
| `context/conversation-context-engine.ts` | 536 | 4-strategy compression | 🔵 LOW-01 |
| `context/hybrid-retrieval.ts` | 489 | JIT knowledge retrieval | 🟠 HIGH-01, MED-02 |
| `context/librarian-worker.ts` | 626 | LLM graph synthesis worker | 🟠 HIGH-04 |
| `context/qdrant-vector-store.ts` | 285 | Qdrant integration | 🟠 HIGH-05 |
| `context/types.ts` | 300 | Type definitions | ✅ Production |

### Enhancement Files (10x Report)
| File | Lines | Size | Enhancement |
|------|-------|------|-------------|
| `context-cache.ts` | ~360 | 10KB | #1 LRU Cache |
| `context-event-bus.ts` | ~360 | 11KB | #2 Event Bus |
| `context-pipeline.ts` | ~500 | 16KB | #3 Parallel Pipeline |
| `adaptive-prediction.ts` | ~400 | 14KB | #4 Adaptive Prediction |
| `context-telemetry.ts` | ~380 | 12KB | #5 Telemetry |
| `bundle-differ.ts` | ~350 | 11KB | #6 Delta Compression |
| `query-optimizer.ts` | ~340 | 10KB | #7 Query Optimizer |
| `prefetch-engine.ts` | ~400 | 13KB | #8 Prefetch Engine |
| `context-graph.ts` | ~500 | 16KB | #9 Context Graph |

### Service Files
| File | Lines | Role | Status |
|:-----|:------|:-----|:-------|
| `services/profile-rollup-service.ts` | 476 | Batch profile builder | 🟠 HIGH-02, HIGH-03 |
| `services/sync-service.js` | 101 | HLC operation log | 🔴 CRIT-02 |
| `services/invalidation-service.ts` | 283 | Bundle invalidation | 🔴 CRIT-04 |
| `services/identity-service.ts` | 520+ | Identity lifecycle | ✅ Phase 1 Complete |

### Route Files
| File | Lines | Role | Status |
|:-----|:------|:-----|:-------|
| `routes/sync.js` | 407 | REST sync endpoints | 🔴 CRIT-02 |
| `routes/identity-v2.js` | 15 endpoints | Identity management | ✅ Complete |
| `routes/capture.js` | Multiple | Capture automation | ✅ 8/9 providers |

### PWA Files
| File | Role | Status |
|:-----|:-----|:-------|
| `pwa/src/lib/sync-manager.ts` | Yjs CRDT sync | 🔴 CRIT-02 |
| `pwa/src/lib/identity/` | Identity client | ✅ Complete |
| `pwa/src/pages/HomeNew.tsx` | Home feed | ⚠️ Needs VIVIM branding |
| `pwa/src/pages/ConversationView.tsx` | Conversation viewer | ⚠️ Needs features |

---

## 12. Appendix: Key Design Decisions

### 12.1 Why DID-Based Identity?
- **Portability**: Users own their identity, not platform
- **Privacy**: No email/phone required
- **Security**: Cryptographic authentication
- **Federation**: Cross-instance recognition

### 12.2 Why Local-First Storage?
- **Offline Access**: Works without internet
- **Privacy**: Data encrypted on user device
- **Performance**: No network latency for reads
- **Resilience**: Server outage doesn't brick app

### 12.3 Why ACU System?
- **Composability**: Atomic units can be remixed
- **Attribution**: Track knowledge lineage
- **Granular Sharing**: Share insights, not just full convos
- **Deduplication**: Hash-based duplicate detection

### 12.4 Why BYOK Model?
- **User Ownership**: Users pay their provider directly
- **No Markup**: We don't profit from AI usage
- **Provider Choice**: Users pick their preferred AI
- **Sustainability**: Aligns incentives (we optimize for quality, not token usage)

### 12.5 Why 8-Layer Context?
- **Progressive Disclosure**: Most relevant context first
- **Budget Efficiency**: Dynamic allocation based on conversation state
- **Personalization**: User settings affect each layer
- **Performance**: Caching at each layer

---

**Document Version:** 1.0
**Generated:** March 23, 2026
**Source Documents:** 46 files from VIVIM.docs/.archive
**Total Intelligence Synthesized:** ~500+ pages of documentation
