# VIVIM Documentation Cleanup — High-Level Overview

> **Generated:** March 26, 2026  
> **Purpose:** Foundation for comprehensive prompt design  
> **Status:** Step 1 of documentation organization project

---

## 1. Project Context

### What Is VIVIM?

VIVIM is a **sovereign AI knowledge management platform** that enables users to:
- **Capture** AI conversations from 9+ providers (ChatGPT, Claude, Gemini, etc.)
- **Vault** them in encrypted, user-owned storage
- **Continue** conversations using BYOK (Bring Your Own Key) chat
- **Share** knowledge atomically via ACUs (Atomic Chat Units)
- **Discover** insights through a social feed of forkable conversations

**Core Value Proposition:** Transform AI conversations from captive, ephemeral chats into permanent, ownable, evolvable knowledge assets.

---

## 2. Documentation Structure Analysis

### Current State: 4 Major Repositories

```
vivim-docs/
├── chain-of-trust/          (20 files)
├── knowledge/               (14 files)
├── OpenCore/                (20 files)
└── VIVIM.docs/              (40+ folders, 100+ files)
```

### Repository Breakdown

#### 2.1 `chain-of-trust/` — Biological Architecture & Security
**Purpose:** Deep theoretical foundations mapping biological systems to VIVIM architecture

**Key Documents:**
- `VIVIM Cell .md` (1,466 lines) — Cellular architecture translation
- `VIVIM Membrane.md` (948 lines) — Selective permeability design
- `AI Privacy Toolkit` series — Detection algorithms
- `New Maths` series — Novel computational approaches
- `Tools and methods required` — Implementation requirements

**Content Themes:**
- Cell membrane → Ingress architecture (5 transport mechanisms)
- DNA repair → Vault integrity verification
- Immune system → Detection algorithms (innate + adaptive)
- Nuclear pore → Inner gate admission control
- Signal transduction → Event-to-state transformation

**Quality:** High theoretical depth, but fragmented across multiple AI model outputs (Opus 4.6, ChatGPT 5.4, Minimax 4.7)

---

#### 2.2 `knowledge/` — Consolidated Migration Design
**Purpose:** Structured reference for platform migration and cinematic platform development

**Key Documents:**
- `01-architecture.md` — System diagram + technology stack
- `02-features.md` — 120+ feature inventory
- `03-context-engine.md` — 8-layer context pipeline
- `04-acus.md` — Atomic Chat Unit specification
- `05-demos.md` — Demo scenarios
- `06-integrations.md` — Third-party integrations
- `07-security.md` — Security architecture
- `08-messaging.md` — Messaging protocols
- `09-sdk.md` — SDK specification
- `10-data-models.md` — Database schema
- `11-components.md` — Component library
- `12-unreleased.md` — Unreleased features
- `13-cinematic-platform-insights.md` — Scroll-driven experience
- `14-consolidated-summary.md` — Master reference

**Quality:** Well-structured, production-ready, but incomplete (missing algorithms, advanced specs)

---

#### 2.3 `OpenCore/` — Open Source Strategy
**Purpose:** Business strategy, philosophy, and developer-facing documentation

**Key Documents:**
- `01-PHILOSOPHY.md` — Why open core (sovereignty, trust, moat)
- `02-ARCHITECTURE.md` — High-level system design
- `03-COMPONENTS.md` — 180+ open components
- `04-IMPLEMENTATION.md` — Four repositories (sdk, server, pwa, network)
- `05-WEBSITE.md` — Open Core website spec
- `06-ROADMAP.md` — Timeline (establish → ecosystem → community)
- `07-STRATEGY.md` — Business logic, flywheel, defensibility
- `GLOSSARY.md` — Technical vocabulary

**Core Narrative:**
> "VIVIM open-sources the complete intelligence layer for sovereign AI memory. The commercial layer sells operational trust — uptime SLAs, compliance certifications, enterprise support. The open core builds technical trust — auditability, transparency, sovereignty."

**Quality:** Cohesive narrative, well-written, strategically clear

---

#### 2.4 `VIVIM.docs/` — Production Specifications
**Purpose:** Detailed technical specs, implementation guides, debugging tools

**Major Folders (40 total):**
```
├── ACU/                    # Atomic Chat Unit specs
├── CORTEX/                 # Context engine deep-dives
├── CONTEXT/                # Context assembly
├── DATABASES/              # Schema, migrations
├── MEMORY/                 # Sovereign Memory v2
├── SCORING/                # Feed ranking algorithms
├── SECURITY/               # Encryption, access control
├── sdk.docs/               # SDK documentation
├── sovereign-memory/       # Memory system v2
├── vivim-app-legacy/       # Legacy app docs
└── ... (27 more folders)
```

**Key Files:**
- `01-PLATFORM-INTELLIGENCE.md` (688 lines) — Master synthesis
- `02-CONTEXT-ENGINE-SPECIFICATION.md` (1,606 lines) — 10x enhanced spec
- `03-IMPLEMENTATION-ROADMAP.md` (1,123 lines) — Gap analysis + timeline
- `04-USER-EXPERIENCE-DESIGN.md` — UX design
- `05-CRITICAL-BUGS-FIXES.md` — Bug tracking

**Quality:** Extremely detailed, production-ready, but scattered across 100+ files

---

## 3. Content Themes & Patterns

### 3.1 Core Technical Concepts

| Concept | Description | Location | Maturity |
|---------|-------------|----------|----------|
| **ACU (Atomic Chat Unit)** | Individually addressable knowledge units | `knowledge/04-acus.md`, `VIVIM.docs/ACU/` | ✅ Complete |
| **8-Layer Context Engine** | Dynamic context assembly pipeline | `knowledge/03-context-engine.md`, `VIVIM.docs/CORTEX/` | ✅ Complete |
| **Sovereign Memory v2** | 10 memory types, encryption, sync | `VIVIM.docs/sovereign-memory/` | 95% |
| **BYOK Chat** | Bring-your-own-key AI chat | `VIVIM.docs/03-IMPLEMENTATION-ROADMAP.md` | ❌ 0% |
| **Feed Scoring** | Algorithmic ranking (RRF + quality) | `VIVIM.docs/SCORING/` | ✅ Spec'd |
| **P2P Federation** | LibP2P + CRDT sync | `knowledge/01-architecture.md` | ⚠️ Partial |
| **DID Identity** | Decentralized identifiers | `OpenCore/`, `VIVIM.docs/SECURITY/` | ✅ Phase 1 |

### 3.2 Biological Architecture Mappings

| Biological System | VIVIM Analog | Status |
|-------------------|--------------|--------|
| Cell Membrane | Ingress architecture (5 transport classes) | ✅ Designed |
| Nuclear Pore | Inner gate admission control | ✅ Designed |
| Immune System | Detection algorithms (13 total) | ✅ Designed |
| DNA Repair | Vault integrity verification | ✅ Designed |
| Chromatin Folding | Knowledge graph structure | ✅ Designed |
| Signal Transduction | Event-to-state transformation | ✅ Designed |

### 3.3 AI Model Provenance

Documents show outputs from multiple AI models:
- **Opus 4.6** — Deep theoretical work (Cell, Membrane, Privacy Toolkit)
- **ChatGPT 5.4** — Architecture, mathematics, nature analysis
- **Minimax 4.7** — Memory systems, access control
- **Minimax 2.7** — Tools and methods

**Issue:** Same topics covered multiple times by different models → fragmentation, redundancy

---

## 4. Critical Gaps & Issues

### 4.1 Structural Issues

| Issue | Impact | Priority |
|-------|--------|----------|
| **Fragmentation** — Same concepts in 3+ locations | Confusion, outdated info | P0 |
| **Redundancy** — Multiple AI outputs on same topic | Wasted space, inconsistency | P0 |
| **Inconsistent Formatting** — Mixed markdown styles | Hard to parse, navigate | P1 |
| **Missing Cross-References** — No linking between related docs | Lost context | P1 |
| **No Single Source of Truth** — Which doc is authoritative? | Decision paralysis | P0 |

### 4.2 Content Gaps

| Gap | Description | Priority |
|-----|-------------|----------|
| **BYOK Implementation** — 0% complete | Core differentiator missing | P0 CRITICAL |
| **Social/Feed UI** — 40% complete | Mock data, skeleton only | P0 |
| **Vault Organization** — Collections/tags missing | High user priority | P1 |
| **Sync System** — 3 incompatible mechanisms | Data loss risk | P0 CRITICAL |
| **Algorithm Documentation** — VCAA, RRF, scoring | Needed for cinematic demos | P0 |

### 4.3 Quality Issues

| Issue | Example | Fix |
|-------|---------|-----|
| **Truncated Files** — Many docs end mid-sentence | `VIVIM Cell .md` line 616, `Membrane.md` line 373 | Reconstruct from source |
| **Typos in Filenames** — `.md` vs `,md`, trailing spaces | `New Maths - chatgpt5.4,md` | Rename + redirect |
| **Inconsistent Versioning** — "v0", "v1.1", no version | Blueprint files | Standardize |
| **Duplicate Content** — Same content, different titles | Multiple "Tools and methods" docs | Consolidate |

---

## 5. Implementation Status Summary

### 5.1 Component Completion

```
✅ Complete (90-100%):
  - Dynamic Context Engine (100%)
  - Identity Layer Phase 1 (100%)
  - ACU Backend (95%)
  - Capture System (89% — 8/9 providers)
  - Sovereign Memory Core (95%)

⚠️ Partial (40-70%):
  - Social/Feed (40% — skeleton only)
  - Vault UI (60% — storage complete, org missing)
  - Search (50% — basic only)
  - Mobile PWA (70% — foundation complete)
  - SDK Packaging (60%)

❌ Missing (0%):
  - BYOK Chat (0% — CRITICAL GAP)
  - Sync System (0% — critical bugs)
  - Recommendations (0% — low priority)
```

### 5.2 Critical Bugs

| ID | Severity | Issue | Impact |
|----|----------|-------|--------|
| **CRIT-01** | 🔴 Runtime | Undefined `context` in `computeBudget()` | Every chat crashes |
| **CRIT-02** | 🔴 Data Loss | 3 incompatible sync mechanisms | Silent corruption |
| **CRIT-03** | 🔴 Corruption | Fragile HLC parser | Hyphens break parsing |
| **CRIT-04** | 🔴 Runtime | `SystemAction` schema mismatch | Invalidation crashes |

---

## 6. Technology Stack

### 6.1 Current Stack

| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| **Frontend** | React | 19 | PWA UI |
| | TypeScript | 5.9 | Type safety |
| | TailwindCSS | — | Styling |
| | Vite | 7 | Build tool |
| | Framer Motion | — | Animations |
| | Zustand | — | State management |
| **Backend** | Bun | ≥1.0.0 | Runtime |
| | Express | 5 | Web framework |
| | Prisma ORM | 7.4.2 | Database |
| | PostgreSQL | ≥14 | Primary DB |
| | Redis | — | Caching |
| | Socket.IO | — | Real-time |
| **Decentralized** | LibP2P | — | P2P networking |
| | Yjs | — | CRDT sync |
| | WebRTC | — | P2P communication |
| **SDK** | TypeScript/Node | — | Developer toolkit |

### 6.2 Target Stack (Cinematic Platform)

| Layer | Current | Recommended |
|-------|---------|-------------|
| UI Framework | React 19 | SvelteKit 5 (evaluation) |
| Animation | Framer Motion | Theatre.js + GSAP |
| 3D/Particles | — | Three.js |
| API Server | Express 5 | Hono (Cloudflare Workers) |
| Database | PostgreSQL | Turso (libSQL) |
| Hosting | Static | Cloudflare Pages |

---

## 7. User Journey (8 Stages)

```
1. DISCOVER (Day 0)
   → Social media post, friend recommendation, viral conversation
   
2. ONBOARD (Day 1)
   → Sign-up (60s), profile setup, first capture prompt
   
3. CAPTURE — "Aha!" Moment (Day 1-7)
   → Copy ChatGPT link → VIVIM captures → Full conversation appears
   
4. EVOLVE — "Power" Moment (Week 2+)
   → Add API key → Continue someone else's conversation → 🎉
   
5. EXPLORE — Building Habit (Week 3+)
   → Daily feed check, capture work conversations, organize vault
   
6. SHARE — ACU Power (Month 1+)
   → Share solutions, build reputation, help others
   
7. BUILD — Power User (Month 2+)
   → Compose from ACUs, curate collections, active in circles
   
8. ADVOCATE — Viral Growth (Month 6+)
   → Share externally, invite friends, create tutorials
```

### Success Metrics

| Metric | Target | Why |
|--------|--------|-----|
| Sign-up → First Capture | 60% within 24h | Product value realization |
| First → Second Capture | 40% within 7 days | Habit formation |
| Week 2 BYOK Adoption | 30% of users | Core differentiator |
| Weekly Active Users | 60% of registered | Engagement |
| ACU Shares | 20% of captures | Viral coefficient |
| D7 Retention | 40%+ | Product-market fit |

---

## 8. Open Core Strategy

### 8.1 The Flywheel

```
Open source builds developer trust
  → Developers build on VIVIM SDK
    → End users encounter VIVIM through tools
      → Individuals upgrade to VIVIM Cloud
        → Power users bring VIVIM into organizations
          → Organizations need Teams/Enterprise
            → Enterprise revenue funds open source
              → More developers, more trust
```

### 8.2 Open/Commercial Boundary

**Question:** Does this require VIVIM to operate, or does it require VIVIM to be trusted?

**Open (Operation):**
- Context assembly, ACU processing, retrieval
- Provider parsers, identity primitives
- P2P federation, storage adapters
- Full self-hosted stack

**Commercial (Trust):**
- Managed uptime (SLAs)
- Compliance certifications (SOC 2, HIPAA)
- Enterprise support
- Organizational features (RBAC, SSO)

### 8.3 The Sovereignty Promise

Every component that touches user data is:
- ✅ In the repository (AGPL v3)
- ✅ Available for inspection and audit
- ✅ Usable without VIVIM as intermediary
- ✅ Exportable to open formats

---

## 9. Documentation Cleanup Objectives

### Phase 1: Consolidation (Week 1)
- [ ] Identify authoritative source for each concept
- [ ] Merge redundant documents
- [ ] Fix truncated files
- [ ] Standardize naming conventions
- [ ] Create master index with cross-references

### Phase 2: Gap Filling (Week 2)
- [ ] Document missing algorithms (VCAA, RRF, scoring)
- [ ] Complete ACU advanced specs (actions, states, hierarchy)
- [ ] Document Storage v2 architecture
- [ ] Fill SDK gap analysis
- [ ] Create cinematic integration guide

### Phase 3: Organization (Week 3)
- [ ] Restructure folder hierarchy
- [ ] Create navigation system
- [ ] Add search functionality
- [ ] Implement versioning
- [ ] Build documentation site (Mintlify?)

### Phase 4: Quality (Week 4)
- [ ] Technical review of all docs
- [ ] Consistency pass (terminology, style)
- [ ] Add diagrams and visualizations
- [ ] Create quick-start guides
- [ ] Establish maintenance workflow

---

## 10. First Comprehensive Prompt Design

### Prompt Goals

Based on this overview, the first comprehensive prompt should:

1. **Consolidate Fragmented Content**
   - Merge multiple AI outputs on same topic
   - Identify and remove redundancy
   - Preserve unique insights from each model

2. **Fill Critical Gaps**
   - Document VCAA algorithm (context assembly)
   - Document RRF algorithm (hybrid retrieval)
   - Document feed scoring formula
   - Complete ACU specification

3. **Create Authoritative References**
   - Single source of truth for each concept
   - Clear versioning and dating
   - Cross-references between related docs

4. **Enable Cinematic Platform**
   - Scroll-driven experience specs
   - Animation requirements
   - Data visualization needs
   - Audio/voiceover integration

### Prompt Structure

```
ROLE: You are a technical documentation architect specializing in
      AI infrastructure, distributed systems, and developer experience.

CONTEXT: [Link to this overview document]

TASK: Create a comprehensive, production-ready specification for
      [SPECIFIC COMPONENT — e.g., "VCAA Context Assembly Algorithm"]

REQUIREMENTS:
1. Synthesize all existing fragments from:
   - chain-of-trust/[relevant files]
   - knowledge/[relevant files]
   - VIVIM.docs/[relevant folders]
   
2. Fill gaps using:
   - Technical precision (exact algorithms, formulas, pseudocode)
   - Implementation status (what's done, what's missing)
   - Performance metrics (benchmarks, targets)
   
3. Structure output as:
   - Executive summary (1 paragraph)
   - Technical specification (detailed)
   - Implementation guide (step-by-step)
   - Testing requirements (unit tests, integration tests)
   - Cinematic demo spec (visual, animation, audio)
   
4. Quality gates:
   - No hand-waving — exact math, exact code
   - No contradictions with existing specs
   - Clear diagrams (Mermaid or ASCII)
   - Actionable for engineers

OUTPUT FORMAT: Markdown with strict hierarchy
```

### Example Prompts to Create

1. **"VCAA Context Assembly Algorithm"** — 4-phase budget allocation
2. **"Hybrid Retrieval (RRF + Weighted)"** — Search algorithm
3. **"Feed Scoring & Ranking"** — Quality × Recency × Network
4. **"ACU Advanced Specification"** — Actions, states, hierarchy
5. **"Sovereign Memory v2"** — 10 memory types, consolidation
6. **"Storage v2 Architecture"** — DAG, privacy model, on-chain
7. **"Cinematic Platform Integration"** — Scroll experiences, landing pages

---

## 11. Next Steps

### Immediate Actions (This Session)

1. **Review this overview** — Validate accuracy, identify missing context
2. **Choose first prompt target** — Which component to specify first?
3. **Design prompt structure** — Refine the template above
4. **Execute prompt** — Generate comprehensive specification
5. **Review & iterate** — Validate against existing code/docs

### Recommended First Target

**"VCAA Context Assembly Algorithm"**

**Why:**
- Core differentiator (8-layer pipeline)
- Already 100% complete (easiest to document)
- Needed for cinematic demos
- Multiple fragments exist (needs consolidation)
- High impact (every chat uses it)

---

## 12. File Reference Index

### Authoritative Sources (Use These)

| Topic | Primary Source | Secondary Sources |
|-------|----------------|-------------------|
| Architecture | `knowledge/01-architecture.md` | `VIVIM.docs/01-PLATFORM-INTELLIGENCE.md` |
| Context Engine | `VIVIM.docs/02-CONTEXT-ENGINE-SPECIFICATION.md` | `knowledge/03-context-engine.md` |
| ACUs | `knowledge/04-acus.md` | `VIVIM.docs/ACU/` |
| Open Core | `OpenCore/01-PHILOSOPHY.md` through `07-STRATEGY.md` | — |
| Implementation | `VIVIM.docs/03-IMPLEMENTATION-ROADMAP.md` | `knowledge/14-consolidated-summary.md` |
| Security | `chain-of-trust/VIVIM Cell .md`, `VIVIM Membrane.md` | `knowledge/07-security.md` |

### Files to Consolidate

| Group | Files | Action |
|-------|-------|--------|
| **New Maths** | 3 files (chatgpt5.4, opus 4.6) | Merge into one |
| **Tools & Methods** | 4 files (different models) | Consolidate |
| **AI Privacy Toolkit** | 2 files (T/nonT) | Merge |
| **AI Data Detection** | 2 files (T/nonT) | Merge |
| **VIVIM Vault** | 3 files (different models) | Consolidate |

---

## 13. Success Criteria

### Documentation Quality Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Completeness** | 100% of components documented | Checklist audit |
| **Consistency** | Zero contradictions | Cross-reference check |
| **Clarity** | Engineer can implement from spec | Peer review |
| **Currency** | Updated within 30 days of code change | Timestamp audit |
| **Discoverability** | Find any concept in <3 clicks | User testing |

### Cleanup Project Metrics

| Metric | Baseline | Target |
|--------|----------|--------|
| Total files | 150+ | <100 (after consolidation) |
| Redundant docs | ~40 | 0 |
| Truncated files | 5+ | 0 |
| Cross-references | ~10 | 100+ |
| Missing specs | 7 critical | 0 |

---

## 14. Appendix: Key Algorithms (Quick Reference)

### 14.1 VCAA (Context Assembly)

```
Phase 1: Compute layer parameters
  - Depth multiplier (minimal/standard/deep)
  - Conversation pressure
  - Knowledge-heavy vs dialogue-heavy

Phase 2: Guaranteed allocations (hard minimums)
  - L0 identity: 150-500t
  - L1 prefs: 100-800t
  - L7 message: exact size

Phase 3: Elastic allocation (L2-L6)
  - Topic count factor: min(2.0, 1.0 + (count - 1) * 0.3)
  - Entity count factor: min(2.0, 1.0 + (count - 1) * 0.4)
  - L4 logarithmic scaling
  - L5 coverage factor
  - L6 ratio selection

Phase 4: Handle overflow
  - Priority-based cutting
  - Never cut below minimums
```

### 14.2 Hybrid Retrieval (RRF)

```typescript
RRF_score(r) = Σ [ 1 / (k + rank_i(r)) ]
Final_score = α × RRF_score + (1-α) × WEIGHTED_score
```

### 14.3 Feed Scoring

```typescript
Score = (Quality × 0.02) + RecencyBonus + NetworkBoost

// RecencyBonus: Max(0, 5 - ageInHours / 24)
// NetworkBoost: Min(relatedCount × 0.1, 2.0)
```

### 14.4 ACU Actions (22 Types)

```
Creation: CAPTURE, DECOMPOSE, CREATE, IMPORT
Mutation: EDIT, FORK, MERGE, ANNOTATE, REDACT
Organization: TAG, LINK, GROUP, PIN, DISCARD
Network: SHARE_P2P, PUBLISH, REVOKE, SYNC, ATTEST
Consumption: VIEW, COPY, EXPORT, QUOTE
```

### 14.5 ACU States (6)

```
DORMANT → ACTIVE → SHARED_PRIVATE → SHARED_PUBLIC → FORKED → ARCHIVED
```

---

**Document Version:** 1.0  
**Last Updated:** March 26, 2026  
**Maintainer:** Documentation Cleanup Project  
**Next Review:** After first comprehensive prompt execution
