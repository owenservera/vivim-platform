# VIVIM — Enhancement Roadmap & Competitive Analysis
**Archived**: 2026-03-05 | **Basis**: `06-ENHANCEMENT-ROADMAP.md` + `06-competitive-differentiation-map.md`

---

## Prioritized Enhancement Roadmap

### 🔴 TIER 1 — Foundation
*Required for robust, correct operation and system integrity.*

| # | Enhancement | Effort | Impact | Status |
|---|------------|--------|--------|--------|
| 1 | **Admin Metrics — Real Data** (system, database, network) | M | HIGH | ⚠️ PARTIAL (network still stubbed) |
| 2 | **WebSocket Write-Back** (CRDT sync persisted to DB) | M | HIGH | ✅ FIXED |
| 3 | **Home Panel Bugs** (archived card opacity, model name) | XS | HIGH | ✅ FIXED |
| 4 | **CRDT Conflict Resolution** (wired to CRDTSyncService) | S | HIGH | ✅ FIXED |

**Remaining Tier 1**:
- Admin Network Telemetry (libp2p integration) — still needs work

---

### 🟡 TIER 2 — Experience
*Significant UX/DX improvements, fixing broken patterns.*

| # | Enhancement | Effort | Impact | Status |
|---|------------|--------|--------|--------|
| 1 | **Design System Consolidation** (CSS variables for provider gradients, dark mode fallbacks) | S | MEDIUM | ⚠️ OPEN |
| 2 | **Differentiated Error States** (specific icons per error category) | XS | MEDIUM | ⚠️ OPEN |
| 3 | **Accessibility Overhaul** (keyboard nav, ARIA, focus management) | M | MEDIUM | ⚠️ PARTIAL (ConversationCard fixed) |
| 4 | **Federation Client** (ActivityPub protocol adapters in SDK) | L | MEDIUM | ⚠️ OPEN |
| 5 | **Desktop Sidebar** (SideNav.tsx + ResponsiveLayout.tsx) | M | MEDIUM | ⚠️ OPEN |
| 6 | **assistant-ui Migration** (replace custom streaming with @assistant-ui/react) | L | HIGH | ⚠️ OPEN |

---

### 🟢 TIER 3 — Excellence
*Polish, performance, and long-term technical debt.*

| # | Enhancement | Effort | Impact | Status |
|---|------------|--------|--------|--------|
| 1 | **Post-Quantum Crypto WASM** (Kyber/Dilithium real implementation) | L | LOW | ⚠️ OPEN |
| 2 | **Blockchain Anchoring Verification** (privacy-manager.ts completion) | M | LOW | ⚠️ OPEN |
| 3 | **Analytics Telemetry Sync** (POST /api/v2/feed/analytics + batch client) | S | LOW | ⚠️ OPEN |
| 4 | **Dead Letter Queue** (failed async jobs) | M | MEDIUM | ⚠️ OPEN |
| 5 | **Context Cache Invalidation Refactor** (use InvalidationService via EventBus) | S | LOW | ⚠️ OPEN |

---

## Competitive Differentiation Map

### Direct Competitors

| Competitor | What They Do | VIVIM Advantages | VIVIM Weaknesses |
|------------|-------------|------------------|-----------------|
| **ChatGPT** | AI chat, Custom GPTs, limited memory | Multi-provider import, full data ownership, ACU sharing, fork/continue, context engine | Brand trust, simplicity, mobile, scale |
| **Claude.ai** | AI assistant, Projects, no sharing | Cross-provider import, social sharing, fork/continue, memory persistence | Simpler UX, reliability, context window size |
| **Character.ai** | AI characters, social voting, no data ownership | User owns interactions, can import chats, full portability, context personalization | Character variety, social engagement, mobile |
| **Poe (Quora)** | Multi-AI aggregator, some sharing | Deeper data ownership, ACU granular sharing, per-user context isolation | Network effects, simpler onboarding |
| **Venice.ai** | Open-source platform, self-hosted | More sophisticated sharing, context engine, provider-agnostic capture, memory | Open-source credibility, self-hosting |

---

### What VIVIM Does That No Competitor Does

#### 1. Provider-Agnostic Data Portability
- Import from ANY AI (ChatGPT, Claude, Gemini, Grok, DeepSeek, Kimi, Mistral, Qwen, Z.AI)
- Export in multiple formats (JSON, ActivityPub, ATProtocol, Markdown, HTML)
- Cryptographically signed data you can verify you own

#### 2. Atomic Chat Units (ACUs)
- Granular, sub-conversation units with cryptographic signatures
- Fine-grained permissions: view, annotate, remix, reshare
- Fork/derivation lineage tracking
- Embeddings for semantic discovery
- Quality scoring (contentRichness, uniqueness, rediscoveryScore)

#### 3. Multi-Layer Context Engine (8 Layers)
- 6+ bundle types assembled per request
- Token budget allocation algorithm
- JIT retrieval from personal ACUs and memories
- User-configurable thresholds and layers
- ContextCockpit visualization

#### 4. User-Owned Intelligence Graph
- Memories: FACTUAL, PREFERENCE, EPISODIC, RELATIONSHIP
- Topic and Entity profiles auto-extracted
- Context bundles compiled from personal data
- Importance scoring and consolidation

#### 5. Social Layer for AI Content
- Share at conversation, ACU, or notebook level
- Fork and continue shared AI threads
- Circles (trust groups), Groups (communities), Teams (organizations)
- Friend/follow graph with block/mute
- Feed algorithm infrastructure (content discovery)

---

### Feature Comparison Matrix

| Feature | VIVIM | ChatGPT | Claude | Character.ai | Poe |
|---------|-------|---------|--------|--------------|-----|
| Multi-provider import | ✅ | ❌ | ❌ | ❌ | Partial |
| Full data ownership | ✅ | ❌ | ❌ | ❌ | Limited |
| ACU granular sharing | ✅ | ❌ | ❌ | Partial | Partial |
| Fork/continue threads | ✅ | ❌ | ❌ | ❌ | ❌ |
| Memory system | ✅ | Limited | Limited | ❌ | ❌ |
| Context engine (layered) | ✅ | ❌ | ❌ | ❌ | ❌ |
| Circles/Groups/Teams | ✅ | ❌ | ❌ | ❌ | ❌ |
| DID-based identity | ✅ | ❌ | ❌ | ❌ | ❌ |
| Per-user data isolation | 🎯 Planned | ❌ | ❌ | ❌ | ❌ |
| Native mobile app | ❌ | ✅ | ✅ | ✅ | ✅ |
| Brand recognition | ❌ | ✅ | ✅ | ✅ | ✅ |
| UX simplicity | ❌ | ✅ | ✅ | ✅ | ✅ |

---

### Current Product Weaknesses

| Weakness | Why It's Weak | Impact |
|---------|---------------|--------|
| Capture reliability | Playwright scraping is fragile — providers change HTML | Core value prop fragile |
| UX complexity | 8 layers, circles, groups, teams, fork/remix culture — steep curve | User bounce before understanding value |
| No network effects yet | No public sharing enabled, feed algorithm incomplete | Chicken-and-egg problem |
| Brand trust | Unknown startup vs. big tech | Hard to acquire users |
| Mobile experience | PWA may not feel native, no iOS/Android app | Miss mobile-first users |

---

### Strategic Bets

| Bet | Validation |
|-----|------------|
| "Walled garden" problem gets worse | Uncertain — providers haven't locked users in yet |
| AI "remix culture" emerges (GitHub for AI) | Not yet validated — Character.ai has some, limited |
| Personal AI memory becomes essential | Some evidence — ChatGPT memory features being added |
| Decentralized identity matters | Adoption slow outside crypto |
| P2P sync differentiation appeals to power users | Signal from developer/technical users |

---

### Features That Could Create True Moat

| Feature | Why Moat | Status |
|---------|---------|--------|
| Per-User Isolated Databases | Hard to replicate, great for trust | 🎯 Designed, not implemented |
| End-to-End Encryption | Privacy maximum, required for sensitive users | ⚠️ Partially designed |
| CRDT Offline-First Sync | True offline-first, works everywhere | ⚠️ Infrastructure ready |
| AI-Powered Memory Consolidation | Gets smarter than users can manage manually | ✅ Memory model exists |
| Marketplace for ACUs/Prompts | Creates economy, network effects | 🎯 Not yet designed |
