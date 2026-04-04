# VIVIM — Open Questions & Strategic Decisions
**Archived**: 2026-03-05 | **Basis**: `05-open-questions-unresolved-decisions.md` + `07-north-star-next-phase-priorities.md`

---

## North Star

> **"VIVIM is the default place where people interact with AI content socially — where users own their intelligence, can import from any provider, and share, fork, and build on each other's AI conversations."**

---

## Success Metrics

### 6-Month Targets
- Users: 10,000–50,000 MAU
- Conversations: 100,000+ imported
- ACUs: 1M+ created
- Sharing: 1,000+ active shared ACUs
- Capture pipeline: reliable for top 5 providers

### 12-Month Targets
- Users: 100,000–500,000 MAU
- Conversations: 1M+ imported
- ACUs: 10M+ created
- Social: 10,000+ shared threads/forks
- Revenue: First revenue (freemium or marketplace pilot)

---

## Unresolved Architecture Decisions

### 1. Database Isolation Strategy
**Status**: DESIGNED but NOT IMPLEMENTED | **Urgency**: BLOCKING

| Option | Description | Status |
|--------|-------------|--------|
| A | Single PostgreSQL with row-level security | ✅ Current approach |
| B | Per-user SQLite files | 🎯 Target vision |
| C | Hybrid: user DBs + shared metadata | Alternative |

**Blocker**: Massive refactor across all services. No migration tooling. Trade-off: isolation vs. query complexity.

---

### 2. P2P Architecture
**Status**: INFRASTRUCTURE EXISTS, NOT INTEGRATED | **Urgency**: HIGH

| Option | Description |
|--------|-------------|
| A | Full P2P — peer-to-peer as primary |
| B | Optional P2P — centralized fallback |
| C | P2P for social, centralized for data |

**Blocker**: LibP2P infrastructure present in `@vivim/network-engine`. Yjs CRDT defined. Integration with PWA incomplete.

---

### 3. End-to-End Encryption
**Status**: SECURITY PATTERNS DEFINED, NOT IMPLEMENTED | **Urgency**: HIGH

| Option | Description |
|--------|-------------|
| A | All user content encrypted |
| B | Only sensitive data (memories, private ACUs) |
| C | Transit only (current state) |

**Blocker**: Key management complexity, search/retrieval with encrypted data.

---

## Unresolved Product / UX Decisions

### 4. Onboarding Experience
**Status**: INCOMPLETE | **Urgency**: MEDIUM

- Option A: Guided tour with sample import
- Option B: Browser extension first, then capture
- Option C: Start fresh, import later

### 5. Context Engine UX
**Status**: PARTIALLY IMPLEMENTED | **Urgency**: HIGH

- Option A: Advanced mode — full control (current ContextCockpit)
- Option B: Simplified — presets and recipes only
- Option C: AI-assisted — let system decide

### 6. Sharing Discovery
**Status**: DESIGNED but NOT IMPLEMENTED | **Urgency**: HIGH

- Option A: Public feed of shared ACUs
- Option B: Circle/following-only
- Option C: Search-based discovery

**Blocker**: Feed/ranking infrastructure (feed algorithm not ranking by social/relevance yet).

### 7. Fork/Merge UX
**Status**: NO CLEAR DESIGN | **Urgency**: LOW

- Option A: Always independent (no merge)
- Option B: Manual merge request
- Option C: AI-suggested merges

---

## Unresolved Business Decisions

### 8. Revenue Model
**Status**: NO CLEAR DECISION | **Urgency**: MEDIUM

| Option | Description |
|--------|-------------|
| A | Freemium — free tier with limits, paid for storage/features |
| B | Subscription — tiered by usage |
| C | Marketplace — selling ACUs, prompts, personas |
| D | Enterprise — white-label/deployment |

### 9. Data Licensing
**Status**: NO CLEAR POLICY | **Urgency**: MEDIUM

- Option A: User owns all, VIVIM has no rights
- Option B: License for aggregated/anonymized insights
- Option C: Co-ownership model

---

## Technical Debt Items

| ID | Issue | Urgency |
|----|-------|---------|
| 10 | Capture reliability (provider HTML changes) | HIGH |
| 11 | Database performance (no query optimization) | MEDIUM |
| 12 | Error handling (limited retry/circuit breaker in capture) | MEDIUM |
| 13 | Testing coverage (unknown E2E coverage) | MEDIUM |
| 14 | Context layer count inconsistency (docs say 8, code has 6 bundle types) | LOW |
| 15 | Budget allocation not user-validated | MEDIUM |
| 16 | Context caching strategy unclear | LOW |

---

## Social/Feed Decisions

### 17. Feed Algorithm
**Status**: NOT IMPLEMENTED | **Urgency**: HIGH

- Option A: Chronological
- Option B: Engagement-based
- Option C: Relevance + Social + Engagement ← recommended

**Blocker**: Recommendation system incomplete (client-side analytics, no server sync).

### 18. Social Graph Model
**Status**: DESIGN SUPPORTS BOTH | **Urgency**: MEDIUM

- Graph-based (Twitter-like: follows + feed)
- Feed-based (Facebook-like: friend graph)

### 19. Content Moderation at Scale
**Status**: MODERATION MODELS EXIST, NOT ACTIVE | **Urgency**: HIGH

- Option A: Community flags only
- Option B: AI-automated moderation
- Option C: Hybrid ← recommended

---

## Strategic Roadmap

### Do Now (0–3 months)
1. **Fix capture reliability** — robust retry, circuit breakers, provider API alternatives
2. **Ship basic sharing** — share links, view-only, fork UI
3. **Complete context engine** — end-to-end from chat to bundle compilation to response

### Do Soon (3–6 months)
4. **Data isolation** — architecture decision locked, start per-user isolation for new users
5. **Mobile experience** — PWA-native feel or React Native wrapper for app stores
6. **Discovery feed** — implement ranking algorithm, enable public sharing

### Do Later (6–12 months)
7. **E2E encryption** — key management, encrypted at rest for memories/ACUs
8. **P2P integration** — full LibP2P operational, offline-first sync
9. **Marketplace** — ACU/prompt economy

---

## Key Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Capture blocked by providers | High | High | API integrations, multiple extraction strategies |
| Too complex for users | Medium | High | Simplify, sensible defaults, progressive disclosure |
| No network effects (cold start) | Medium | High | Seed content, incentives, invite system |
| Incumbents add similar features | Medium | Medium | Move fast, stay unique on data ownership |
| Security breach | Low | High | Regular audits, encryption, penetration testing |

---

## Assumptions That Could Be Wrong

| Assumption | Risk | Mitigation |
|------------|------|------------|
| Users want data ownership | Users may not care about ideology | Focus on portability benefits, not ideology |
| Users will import past conversations | Many use AI casually | Support fresh starts too, not just import |
| Sharing AI conversations is valuable | May be too personal/domain-specific | Focus on ACUs as reusable units |
| Context engine demonstrably improves responses | Users may not notice | A/B testing, show before/after |
| Provider portability is desired | Most users stay with one provider | Aggregate, not just import |
