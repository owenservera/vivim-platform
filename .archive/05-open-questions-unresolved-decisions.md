# DOCUMENT 5: OPEN QUESTIONS & UNRESOLVED DECISIONS

---

## Architecture Decisions Not Yet Locked

### 1. Database Isolation Strategy

**Question**: Should the system move to per-user isolated databases?

**Options**:
- **Option A**: Single PostgreSQL with row-level security (current, proven)
- **Option B**: Per-user SQLite files (target vision, requires significant refactor)
- **Option C**: Hybrid - critical data in user DBs, shared metadata in master

**Status**: DESIGNED but NOT IMPLEMENTED

**What's Blocking**:
- Massive refactor required across all services
- No migration tooling visible
- Trade-off: isolation vs. query complexity

**Urgency**: HIGH - core to product differentiation

---

### 2. P2P Architecture

**Question**: How should P2P networking be integrated with centralized services?

**Options**:
- **Option A**: Full P2P - peer-to-peer sync as primary (current CRDT infrastructure)
- **Option B**: Optional P2P - sync when online, centralized fallback
- **Option C**: P2P for social, centralized for data

**Status**: INFRASTRUCTURE EXISTS, NOT FULLY INTEGRATED

**What's Blocking**:
- LibP2P infrastructure present (network package)
- Yjs CRDT types defined
- Integration with PWA incomplete

**Urgency**: MEDIUM - enables offline-first

---

### 3. End-to-End Encryption

**Question**: What data should be E2E encrypted?

**Options**:
- **Option A**: All user content encrypted
- **Option B**: Only sensitive data (memories, private ACUs)
- **Option C**: Minimal - only during transit

**Status**: SECURITY PATTERNS DEFINED, IMPLEMENTATION INCOMPLETE

**What's Blocking**:
- Key management complexity
- Search/retrieval with encrypted data
- No visible encryption implementation

**Urgency**: HIGH - critical for trust

---

## Product/UX Decisions Still Open

### 4. Onboarding Experience

**Question**: How should new users import their first conversation?

**Options**:
- **Option A**: Guided tour with sample import
- **Option B**: Browser extension first, then capture
- **Option C**: Start fresh, import later

**Status**: INCOMPLETE

**What's Blocking**: UI flow not fully implemented

**Urgency**: MEDIUM

---

### 5. Context Engine UX

**Question**: How should users visualize and control the 8-layer context?

**Options**:
- **Option A**: Advanced mode - full control
- **Option B**: Simplified - presets and recipes only
- **Option C**: AI-assisted - let system decide

**Status**: PARTIALLY IMPLEMENTED (ContextCockpitPage exists)

**What's Blocking**:
- Bundle compilation complexity
- No clear user mental model

**Urgency**: HIGH - core to personalization

---

### 6. Sharing Discovery

**Question**: How do users discover shared content from others?

**Options**:
- **Option A**: Public feed of shared ACUs
- **Option B**: Circle/following-only
- **Option C**: Search-based discovery

**Status**: DESIGNED but NOT IMPLEMENTED

**What's Blocking**: Feed/ranking infrastructure

**Urgency**: HIGH - critical for network effects

---

### 7. Fork/Merge UX

**Question**: How should forked ACUs handle divergence and potential merge?

**Options**:
- **Option A**: Always independent (no merge)
- **Option B**: Manual merge request
- **Option C**: AI-suggested merges

**Status**: NO CLEAR DESIGN

**Urgency**: LOW - downstream of sharing

---

## Business Model / Monetization

### 8. Revenue Model

**Question**: How will VIVIM monetize?

**Options**:
- **Option A**: Freemium - free tier with limits, paid for storage/features
- **Option B**: Subscription - all features, tiered by usage
- **Option C**: Marketplace - selling ACUs, prompts, personas
- **Option D**: Enterprise - white-label/deployment

**Status**: NO CLEAR DECISION

**What's Blocking**: Product-market fit not validated

**Urgency**: MEDIUM

---

### 9. Data Licensing

**Question**: What rights does VIVIM have to user data?

**Options**:
- **Option A**: User owns all, VIVIM has no rights
- **Option B**: License for aggregated/anonymized insights
- **Option C**: Co-ownership model

**Status**: NO CLEAR POLICY

**Urgency**: MEDIUM

---

## Technical Debt That Needs Addressing Before Scaling

### 10. Capture Infrastructure

**Issue**: Provider-specific extractors are fragile

**What's Needed**:
- More robust extraction strategies
- Fallback when primary fails
- Provider API alternatives (vs scraping)

**Urgency**: HIGH - core value proposition

---

### 11. Database Performance

**Issue**: Many indexes but no visible query optimization

**What's Needed**:
- Query analysis and optimization
- Connection pooling tuning
- Read replicas for scaling

**Urgency**: MEDIUM

---

### 12. Error Handling

**Issue**: Limited visible error handling in capture flow

**What's Needed**:
- Retry logic with backoff
- Circuit breakers
- Dead letter queues

**Urgency**: MEDIUM

---

### 13. Testing Coverage

**Issue**: Testing visible but coverage unknown

**What's Needed**:
- More E2E tests for critical flows
- Load testing for scale

**Urgency**: MEDIUM

---

## Context Engine Design Decisions in Flux

### 14. Layer Count

**Question**: Should it be exactly 8 layers or flexible?

**Status**: VARIABLE - documentation says 8, code shows 6 bundle types

**What's Needed**: Clarification and consistency

**Urgency**: LOW

---

### 15. Budget Allocation Algorithm

**Question**: How should token budget be distributed across layers?

**Status**: IMPLEMENTED but not validated

**What's Needed**: User testing to validate allocation

**Urgency**: MEDIUM

---

### 16. Context Caching

**Question**: How aggressively should compiled bundles be cached?

**Options**:
- **Option A**: Cache everything, invalidate on change
- **Option B**: Time-based expiration
- **Option C**: On-demand compilation

**Status**: PARTIALLY IMPLEMENTED

**Urgency**: LOW

---

## Social/Network Layer Decisions

### 17. Feed Algorithm

**Question**: How should the "For You" feed be ranked?

**Options**:
- **Option A**: Chronological
- **Option B**: Engagement-based
- **Option C**: Relevance + Social + Engagement

**Status**: NOT IMPLEMENTED

**What's Blocking**: Recommendation system incomplete

**Urgency**: HIGH - key for retention

---

### 18. Graph vs. Feed

**Question**: Should social be graph-based (Twitter) or feed-based (Facebook)?

**Status**: DESIGN SUPPORTS BOTH

**What's Needed**: Product decision on primary model

**Urgency**: MEDIUM

---

### 19. Moderation Approach

**Question**: How to handle content moderation at scale?

**Options**:
- **Option A**: Community moderation (flags)
- **Option B**: AI-automated
- **Option C**: Hybrid

**Status**: MODERATION MODELS EXIST, NOT ACTIVE

**Urgency**: HIGH - needed before public launch

---

## Summary Table

| ID | Question | Category | Urgency |
|----|----------|----------|---------|
| 1 | Database isolation | Architecture | BLOCKING |
| 2 | P2P integration | Architecture | HIGH |
| 3 | E2E encryption | Architecture | HIGH |
| 4 | Onboarding UX | Product | MEDIUM |
| 5 | Context Engine UX | Product | HIGH |
| 6 | Sharing discovery | Product | HIGH |
| 7 | Fork/Merge UX | Product | LOW |
| 8 | Revenue model | Business | MEDIUM |
| 9 | Data licensing | Business | MEDIUM |
| 10 | Capture reliability | Technical Debt | HIGH |
| 11 | DB performance | Technical Debt | MEDIUM |
| 12 | Error handling | Technical Debt | MEDIUM |
| 13 | Testing coverage | Technical Debt | MEDIUM |
| 14 | Layer count | Context Engine | LOW |
| 15 | Budget algorithm | Context Engine | MEDIUM |
| 16 | Context caching | Context Engine | LOW |
| 17 | Feed algorithm | Social | HIGH |
| 18 | Graph vs Feed | Social | MEDIUM |
| 19 | Moderation approach | Social | HIGH |

---

## Critical Path Items

These BLOCKING or HIGH urgency items should be resolved before scaling:

1. **Database Isolation** (BLOCKING) - Core to user trust
2. **Capture Reliability** (HIGH) - Core value proposition
3. **E2E Encryption** (HIGH) - Trust requirement
4. **Context Engine UX** (HIGH) - Key differentiator
5. **Sharing Discovery** (HIGH) - Network effects
6. **Feed Algorithm** (HIGH) - Retention
7. **Moderation** (HIGH) - Safety before public
