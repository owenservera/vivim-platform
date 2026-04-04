# OpenScroll Context Engine: Complete Implementation Guide

**Document Version:** 1.0.0
**Date:** February 11, 2026
**Status:** Production Ready - Phase 1 Complete

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Architecture Overview](#architecture-overview)
3. [Implementation Phases](#implementation-phases)
4. [System Requirements](#system-requirements)
5. [Quick Start Guide](#quick-start-guide)
6. [Document Index](#document-index)

---

## Executive Summary

### The Problem: Goldfish AI

Traditional Large Language Models suffer from a fundamental limitation: **they have no persistent memory**. When a context window fills, they forget everything that preceded it. This creates an AI experience that feels disconnected and perpetually starting over.

### The Solution: Permanent Digital Consciousness

OpenScroll implements a **layered, pre-generated context architecture** that transforms the AI from a passive responder into a proactive learning organism. The system:

1. **Persists knowledge across sessions** via ACUs (Atomic Chat Units)
2. **Pre-generates context before requests** via prediction engine
3. **Intelligently budgets tokens** via elasticity-based negotiation
4. **Evolves understanding** via GLMT-4.7 autonomous librarian
5. **Maintains freshness** via event-driven invalidation

### Key Innovations

| Innovation | Traditional Approach | OpenScroll Approach |
|------------|-------------------|-------------------|
| Context Retrieval | Fetch on demand (slow) | Pre-generate + cache (instant) |
| Budget Management | Fixed ratios | Dynamic negotiation with elasticity |
| Memory Persistence | Simple RAG chunks | Layered knowledge graph |
| Token Estimation | Word-based heuristic | BPE tokenizer (accurate) |
| Context Freshness | Time-based TTL | Event-driven invalidation |
| Long Conversations | Simple truncation | Progressive compaction strategies |

---

## Architecture Overview

### System Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                                   │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │  Presence Reporter (WebSocket/REST)                            │  │
│  │  - activeConversationId                                          │  │
│  │  - visibleConversationIds                                        │  │
│  │  - localTime                                                   │  │
│  │  - navigationPath                                              │  │
│  └────────────────────────┬────────────────────────────────────────────┘  │
└───────────────────────────┼──────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                     CONTEXT ENGINE LAYER                          │
│                                                                   │
│  ┌────────────────┐  ┌─────────────────┐  ┌────────────────┐  │
│  │  Presence      │→ │  Prediction     │→ │  Bundle        │  │
│  │  Ingester      │  │  Engine        │  │  Compiler      │  │
│  └────────────────┘  └─────────────────┘  └────────────────┘  │
│                                                                   │
│  ┌────────────────┐  ┌─────────────────┐  ┌────────────────┐  │
│  │  Profile       │  │  Invalidation   │  │  Budget        │  │
│  │  Rollup       │  │  Service       │  │  Algorithm     │  │
│  └────────────────┘  └─────────────────┘  └────────────────┘  │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Dynamic Context Assembler                          │   │
│  │  - Context Detection                                           │   │
│  │  - Bundle Gathering                                           │   │
│  │  - JIT Retrieval                                              │   │
│  │  - Budget Negotiation                                           │   │
│  │  - Prompt Compilation                                            │   │
│  └────────────────────┬────────────────────────────────────────────┘   │
└─────────────────────┼──────────────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      DATA PERSISTENCE LAYER                     │
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Topic        │  │  Entity       │  │  Context      │     │
│  │  Profiles     │  │  Profiles     │  │  Bundles     │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  ACU          │  │  Conversation │  │  Client       │     │
│  │  Units        │  │  Compaction   │  │  Presence     │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                     APPLICATION LAYER                             │
│                                                                   │
│  ┌───────────────────────────────────────────────────────────────────┐    │
│  │  Unified Context Service (Bridge + Fallback)              │    │
│  │  - Try new engine first                                       │    │
│  │  - Fall back to legacy on error                                │    │
│  │  - Feature flag control                                        │    │
│  └────────────────────┬────────────────────────────────────────────┘    │
└─────────────────────┼──────────────────────────────────────────────────┘
                      │
                      ▼
              ┌─────────────────────┐
              │  AI Chat Route    │
              │  - Get context    │
              │  - Compile prompt │
              │  - LLM response   │
              └─────────────────────┘
```

### Data Flow

```
User Action → Presence Update
    ↓
Prediction Engine → Next Likely Interactions
    ↓
Bundle Compiler → Pre-build Context Bundles
    ↓
ContextBundle Table → Cache Storage
    ↓
User Sends Message → Context Assembler
    ↓
Assembled Context + LLM → Response
    ↓
New Data → Invalidation Service → Mark Dirty → Recompile
```

### The 8 Layers

| Layer | Purpose | Priority | Elasticity | Source | Refresh Rate |
|-------|---------|-----------|---------|--------------|
| **L0** | Identity Core | 100 (fixed) | 0% (rigid) | Memories | Rare (profile changes) |
| **L1** | Global Preferences | 95 (fixed) | 10% | Instructions | Medium (prefs update) |
| **L2** | Topic Profiles | 85 (dynamic) | 60% | TopicProfile + ACUs | Per-topic (new ACUs) |
| **L3** | Entity Profiles | 70 (dynamic) | 70% | EntityProfile + ACUs | Per-entity (new mentions) |
| **L4** | Conversation Arc | 90 (dynamic) | 30% | ConversationCompaction | Per-conversation (new msgs) |
| **L5** | JIT Retrieval | 55 (dynamic) | 50% | Vector Search | Per-message (real-time) |
| **L6** | Message History | 80 (dynamic) | 90% | Message Table | Per-message (sliding window) |
| **L7** | User Message | 100 (fixed) | 0% (rigid) | Current Input | N/A |

---

## Implementation Phases

### Phase 1: Foundation (COMPLETED ✅)

**Objective:** Establish safe migration path with fallback capability

**Deliverables:**
- [x] UnifiedContextService with legacy fallback
- [x] ProfileRollupService (ghost table population)
- [x] InvalidationService (event-driven freshness)
- [x] ContextWarmupWorker (proactive generation)
- [x] Context API routes (presence, warmup, rollup)
- [x] AI route integration (feature flags)
- [x] Prisma schema (all models defined)
- [x] Core bug fixes (upsert null handling, token budget passing)

**Status:** Production Ready - `USE_DYNAMIC_CONTEXT=false` by default

---

### Phase 2: Activation (IN PROGRESS ⏳)

**Objective:** Enable new engine for beta users with real embeddings

**Deliverables:**
- [ ] Configure real embedding service (OpenAI/Transformers.js)
- [ ] Run initial profile rollup for existing users
- [ ] Enable `USE_DYNAMIC_CONTEXT=true` for beta group
- [ ] Set up monitoring dashboards
- [ ] Tune BudgetAlgorithm elasticity parameters

**Estimated Time:** 1-2 weeks

**Success Criteria:**
- Cache hit rate > 80%
- Context assembly time < 100ms
- Zero production incidents

---

### Phase 3: Full Migration (PLANNED 📋)

**Objective:** Complete transition to new architecture

**Deliverables:**
- [ ] Enable for all users
- [ ] Remove legacy fallback paths
- [ ] Implement GLMT-4.7 Librarian Loop
- [ ] Add Memory Stream with evolution tracking
- [ ] Implement js-tiktoken for accurate token estimation
- [ ] Production alerting and auto-scaling

**Estimated Time:** 2-3 weeks

**Success Criteria:**
- 100% traffic on new engine
- < 1% cache miss rate
- Average context assembly < 50ms

---

## System Requirements

### Infrastructure

**Database:**
- PostgreSQL 15+ (for `NULLS NOT DISTINCT` support)
- Prisma ORM (current version)
- Connection pooling enabled (10-20 connections)

**Compute:**
- Node.js 18+ LTS
- TypeScript 5.0+
- Minimum 4 vCPU, 8GB RAM for background workers

**External Services (Required for Production):**
- OpenAI API key (for embeddings and gpt-4o-mini compaction)
  - Model: `text-embedding-3-small` (dimensions: 1536)
  - Model: `gpt-4o-mini` (for summarization)
- Alternative: Local embedding model (Transformers.js)

### Storage Estimates

| Entity | Growth Rate | Storage (1 Year) | Query Performance |
|--------|-------------|-------------------|-------------------|
| ACUs | ~100/day/user | ~36,500/user | Requires: embedding index |
| TopicProfiles | ~5/month/user | ~60/user | Requires: user+slug index |
| EntityProfiles | ~10/month/user | ~120/user | Requires: user+name+type index |
| ContextBundles | Varies by usage | ~200/user | Requires: user+type+dirty index |
| ConversationCompaction | Per long convo | ~50/user | Requires: convoId+range index |

### Environment Variables

```bash
# Context Engine Control
USE_DYNAMIC_CONTEXT=false              # Phase 1: false, Phase 2+: true
DYNAMIC_CONTEXT_LOG_LEVEL=info       # debug, info, warn, error

# Embedding Service
OPENAI_API_KEY=sk-...               # Required for production
EMBEDDING_MODEL=text-embedding-3-small
EMBEDDING_DIMENSIONS=1536
EMBEDDING_FALLBACK_TO_MOCK=false  # Only for dev/testing

# LLM for Compaction
OPENAI_COMPACTION_MODEL=gpt-4o-mini
COMPACTION_MAX_TOKENS=4000
COMPACTION_TIMEOUT_MS=30000

# Budget Configuration
MAX_CONTEXT_TOKENS=12000              # User-configurable default
MIN_TOKENS_L0_IDENTITY=150
MIN_TOKENS_L1_PREFS=100
DEFAULT_ELASTICITY_MULTIPLIER=1.0

# Warmup Worker
WARMUP_ENABLED=true
WARMUP_PREDICTION_THRESHOLD=0.15    # Min probability to pre-build
WARMUP_MAX_PREDICTIONS=8
WARMUP_BATCH_SIZE=3                   # Parallel compiles per check

# Invalidation
INVALIDATION_QUEUE_SIZE=100
INVALIDATION_BATCH_SIZE=10
INVALIDATION_PROCESS_INTERVAL_MS=5000

# Rollup Service
ROLLUP_ENABLED=true
ROLLUP_BATCH_SIZE=50                   # ACUs per batch
ROLLUP_MIN_ACUS_FOR_TOPIC=10
ROLLUP_MIN_ACUS_FOR_ENTITY=5
ROLLUP_INTERVAL_HOURS=6               # How often to run

# Monitoring
CONTEXT_HEALTH_CHECK_ENABLED=true
CONTEXT_METRICS_EXPORT=prometheus
CONTEXT_ALERT_DIRTY_QUEUE_THRESHOLD=50
CONTEXT_ALERT_CACHE_MISS_RATE_THRESHOLD=0.20  # >20% triggers alert
```

---

## Quick Start Guide

### For Developers

#### 1. Setup Database

```bash
# Navigate to server directory
cd server

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev --name init_context_engine

# (Optional) Seed test data
npx prisma db seed
```

#### 2. Configure Environment

```bash
# Copy example
cp .env.example .env

# Edit .env
OPENAI_API_KEY=your_key_here
USE_DYNAMIC_CONTEXT=true
```

#### 3. Start Development Server

```bash
npm run dev

# Context engine will start in debug mode
# Check logs for: "Context Engine: Ready"
```

#### 4. Verify Installation

```bash
# Health check
curl http://localhost:3000/api/v1/context/health

# Expected response:
{
  "status": "healthy",
  "newEngineAvailable": true,
  "oldEngineAvailable": true,
  "topicProfiles": 0,
  "entityProfiles": 0,
  "contextBundles": 0,
  "dirtyBundles": 0,
  "invalidationQueue": 0
}
```

### For System Administrators

#### 1. Production Deployment Checklist

- [ ] PostgreSQL 15+ deployed with replication
- [ ] Environment variables configured in production
- [ ] OpenAI API key with usage limits
- [ ] Connection pooling configured (pgBouncer recommended)
- [ ] Background worker processes (PM2/Docker)
- [ ] Monitoring and alerting setup
- [ ] Backup strategy in place (daily snapshots)
- [ ] Load testing completed (target: 100 req/s)

#### 2. Enable Dynamic Context

```bash
# Update environment variable
export USE_DYNAMIC_CONTEXT=true

# Restart application
pm2 restart openscroll-server

# Monitor logs for errors
pm2 logs openscroll-server --lines 100
```

#### 3. Run Initial Rollup

```bash
# Trigger rollup for all existing users
curl -X POST http://localhost:3000/api/v1/context/rollup-all \
  -H "Content-Type: application/json" \
  -d '{"adminKey": "your_admin_key"}'

# This populates TopicProfile and EntityProfile from existing ACUs
# Estimated time: 1-5 minutes per 10,000 ACUs
```

---

## Document Index

This implementation guide includes the following detailed documents:

1. **DATABASE_SCHEMA_IMPLEMENTATION.md**
   - Complete Prisma schema with all models
   - Indexes and constraints
   - Migration scripts
   - Relationships diagram

2. **CONTEXT_ENGINE_ALGORITHMS.md**
   - Budget Algorithm implementation
   - Progressive Compaction strategies
   - Conversation Context Engine
   - Token estimation methods

3. **SERVICE_LAYER_SPECIFICATIONS.md**
   - UnifiedContextService
   - ProfileRollupService
   - InvalidationService
   - ContextWarmupWorker
   - BundleCompiler
   - DynamicContextAssembler

4. **API_ENDPOINTS_AND_ROUTING.md**
   - Context routes (presence, warmup, rollup, health)
   - AI route integration
   - Request/response formats
   - Error handling

5. **MIGRATION_AND_DEPLOYMENT.md**
   - Phase 1 → Phase 2 migration steps
   - Database migration scripts
   - Deployment procedures
   - Rollback strategies

6. **TESTING_AND_VALIDATION.md**
   - Unit test specifications
   - Integration test scenarios
   - Load testing procedures
   - Validation checklists

7. **MONITORING_AND_OPERATIONS.md**
   - Key metrics to track
   - Alert configuration
   - Dashboard setup
   - Troubleshooting procedures

---

## Appendix

### Glossary

- **ACU (Atomic Chat Unit)**: Smallest unit of conversational information that makes semantic sense independently
- **Bundle**: Pre-compiled context block for a specific layer (L0-L6)
- **Cache Hit**: Bundle requested and found fresh in ContextBundle table
- **Cache Miss**: Bundle requested but not found or stale (triggered recompile)
- **Dirty Flag**: Indicates bundle source data has changed and recompilation is needed
- **Elasticity**: Layer's ability to shrink when budget is exceeded (0.0 = rigid, 1.0 = liquid)
- **Presence**: User's real-time UI state (active conversation, visible items, navigation)
- **Progressive Compaction**: Strategy for representing long conversations within limited tokens using multiple compression levels
- **JIT (Just-In-Time) Retrieval**: Real-time vector search performed at request time for context not covered by pre-built bundles
- **Invalidation**: Event-driven process that marks bundles dirty when source data changes
- **Prediction Engine**: Analyzes presence signals to determine which contexts to pre-generate
- **Budget Algorithm**: Negotiates token allocation across layers based on priorities and constraints

### References

- Design Documents: `VIVIM.docs/CONTEXT/`
  - `dynamic-context-design.md`
  - `dynamic-context-design-algo.md`
  - `DESIGN_COGNITIVE_STREAM.md`
  - `LIBRARIAN_LOOP_SPEC.md`
  - `PROGRESSIVE_ASSEMBLY_PATH.md`
  - `BRIDGE_SCHEMA_AND_INVALIDATION.md`

- Implementation Reports:
  - `IMPLEMENTATION_REPORT.md`
  - `IMPLEMENTATION_STATUS.md`
  - `PRISMA_INVALIDATION_ANALYSIS.md`

---

**Document End**

This is the master overview. For detailed implementation guidance, refer to the individual specification documents listed in the Document Index section above.
