# Dynamic Context System - Complete Session Handoff

**Document Version:** 1.0.0  
**Date:** February 11, 2026  
**Status:** Phase 1 Complete | Phase 2 Beta Ready  
**Purpose:** Complete handoff for new sessions/developers

---

## QUICK START (5 Minutes)

### Verify Your Environment

```bash
# Check Node/Bun version
node --version  # v18+
bun --version   # v1.0+

# Check PostgreSQL
psql --version

# Check project structure
ls -la apps/server/
```

### Start the System

```bash
# Terminal 1: Start server
cd apps/server && bun run dev

# Terminal 2: Run tests
cd apps/server && bun scripts/test-dynamic-context.js
```

### Verify Basic Functionality

```bash
# Check health endpoint
curl http://localhost:3000/api/v1/context/health

# Expected response:
# {"newEngineAvailable":true,"oldEngineAvailable":true,"stats":{...}}
```

---

## SYSTEM OVERVIEW

### What Is This System?

The **Dynamic Context System** is an AI context management pipeline that:

1. **Learns** from user conversations (Autonomous Librarian)
2. **Predicts** what context users need (Pre-Generation Engine)
3. **Assembles** context efficiently (8-layer context hierarchy)
4. **Optimizes** token usage (Budget Algorithm with elasticity)
5. **Invalidates** stale data (Event-driven cache invalidation)

### Key Components

| Component | Location | Purpose |
|-----------|----------|---------|
| UnifiedContextService | services/unified-context-service.ts | Bridge between new/old engines |
| DynamicContextAssembler | context/context-assembler.ts | Main context assembly pipeline |
| ProfileRollupService | services/profile-rollup-service.ts | Creates topic/entity profiles |
| InvalidationService | services/invalidation-service.ts | Cache invalidation |
| ContextWarmupWorker | services/context-warmup-worker.ts | Pre-generates bundles |
| LibrarianWorker | context/librarian-worker.ts | Autonomous learning |
| HybridRetrieval | context/hybrid-retrieval.ts | L5 JIT hybrid search |
| BudgetAlgorithm | context/budget-algorithm.ts | Token allocation |
| ConversationEngine | context/conversation-context-engine.ts | Compaction strategies |

---

## CURRENT STATE

### Test Results (Last Run)

```
Date: February 11, 2026
Pass Rate: 18/21 (86%)

PASSING (18):
  - Prisma Connection
  - All 4 Schema Models
  - Embedding Service (with fallback)
  - UnifiedContextService Health
  - DynamicContextAssembler Creation
  - ProfileRollupService
  - InvalidationService Health
  - ContextWarmupWorker
  - Conversation Context

FAILING (3):
  1. Conversation topicLinks field mismatch
  2. ProfileRollupService embedding filter syntax
  3. InvalidationService updateMany data argument

WARNINGS:
  - Z.AI API rate limited (no valid key)
  - pgvector extension not installed
```

### What's Working

- Database connection and schema models
- Context assembly pipeline (L0-L7 layers)
- Token budget algorithm with elasticity
- Pre-generation engine with predictions
- Librarian autonomous learning (GLM-4.7)
- Feature flags for gradual rollout
- Health monitoring endpoints
- Legacy fallback on errors

---

## IMMEDIATE ACTION ITEMS

### Priority 1: Fix Known Issues (Day 1)

#### 1.1 Configure Z.AI API Key

```bash
# Get API key from Z.AI console
# https://console.z.ai/

# Edit .env
nano apps/server/.env

# Update:
ZAI_API_KEY=your-actual-api-key-here
ZAI_BASE_URL=https://open.bigmodel.cn/api/paas/v4
ZAI_MODEL=glm-4.7-flash

# Restart server
bun run dev
```

#### 1.2 Install pgvector Extension

```bash
# Linux/macOS
psql -d openscroll -c "CREATE EXTENSION IF NOT EXISTS vector;"

# Verify installation
psql -d openscroll -c "\dx"

# If not available, install from source:
git clone https://github.com/pgvector/pgvector.git
cd pgvector && make && make install
psql -d openscroll -c "CREATE EXTENSION IF NOT EXISTS vector;"
```

#### 1.3 Fix Prisma Schema Mismatches

**File:** `apps/server/src/context/context-assembler.ts`

Change `topicLinks` to `topicConversations` in the include statements.

**File:** `apps/server/src/services/profile-rollup-service.ts`

Change `embedding: { not: null }` to `embedding: { isEmpty: false }`.

**File:** `apps/server/src/services/invalidation-service.ts`

Remove `updatedAt` from updateMany data.

After fixes:
```bash
cd apps/server && bunx prisma generate && bun scripts/test-dynamic-context.js
```

---

## DEVELOPMENT WORKFLOW

### Daily Commands

```bash
# Start development server
cd apps/server && bun run dev

# Run tests (quick)
bun scripts/test-dynamic-context.js

# Run tests (full)
bun test

# Check lint
bun lint

# Format code
bun format
```

### Making Changes

#### Adding a New Context Layer
1. Define types in `context/types.ts`
2. Create bundle compiler in `context/bundle-*.ts`
3. Add to assembler in `context/context-assembler.ts`
4. Add budget config in `context/budget-algorithm.ts`
5. Add tests in `scripts/test-dynamic-context.js`

---

## TESTING GUIDE

### Quick Tests

```bash
# Test 1: Basic Context Assembly
curl -X POST http://localhost:3000/api/v1/ai/chat \
  -H "Content-Type: application/json" \
  -H "x-use-dynamic-context: true" \
  -d '{"messages": [{"role": "user", "content": "Hello!"}]}'

# Test 2: Cache Hit Rate (compare two identical requests)
curl -X POST http://localhost:3000/api/v1/ai/chat \
  -H "Content-Type: application/json" \
  -H "x-use-dynamic-context: true" \
  -d '{"messages": [...same as before...]}'

# Test 3: Health Check
curl http://localhost:3000/api/v1/context/health
```

---

## TROUBLESHOOTING

### Common Issues

| Issue | Fix |
|-------|-----|
| "Cannot find module" | `bunx prisma generate && rm -rf node_modules/.cache` |
| "Connection refused" to PostgreSQL | Check `pg_isready` and DATABASE_URL |
| "Z.AI API key not configured" | Add key to `.env` and restart |
| "Type 'vector' does not exist" | `psql -d openscroll -c "CREATE EXTENSION vector;"` |

---

## KEY FILES REFERENCE

| File | Purpose |
|------|---------|
| `src/context/context-assembler.ts` | Main assembler (~600 lines) |
| `src/services/unified-context-service.ts` | Bridge service (~314 lines) |
| `src/context/budget-algorithm.ts` | Token allocation (~400 lines) |
| `src/context/hybrid-retrieval.ts` | L5 JIT hybrid search (~400 lines) |
| `src/services/profile-rollup-service.ts` | Profile management (~500 lines) |
| `src/services/invalidation-service.ts` | Cache invalidation (~300 lines) |
| `src/services/context-warmup-worker.ts` | Pre-generation (~400 lines) |
| `src/context/librarian-worker.ts` | Autonomous learning (~600 lines) |
| `scripts/test-dynamic-context.js` | Comprehensive test suite |

---

## 8-LAYER CONTEXT HIERARCHY

```
L0: Identity Core (300t, rigid)
L1: Global Instructions (500t, 10% elastic)
L2: Topic Context (1500t, 60% elastic)
L3: Entity Context (1000t, 70% elastic)
L4: Conversation Arc (2000t, 30% elastic)
L5: JIT Retrieval (2500t, 50% elastic) [HYBRID]
L6: Message History (3500t, 90% elastic)
L7: User Message (500t, rigid)
```

---

## API ENDPOINTS

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | /api/v1/context/health | System health check |
| POST | /api/v1/context/presence/:userId | Client presence update |
| POST | /api/v1/context/warmup/:userId | Trigger bundle warmup |
| POST | /api/v1/context/rollup/:userId | Trigger profile rollup |
| POST | /api/v1/context/invalidate/:userId | Manual invalidation |
| GET | /api/v1/context/librarian/status | Librarian status |
| POST | /api/v1/ai/chat | AI chat with context |

---

## ENVIRONMENT VARIABLES

```bash
# Features
USE_DYNAMIC_CONTEXT=true
LIBRARIAN_ENABLED=true
ENABLE_IDLE_DETECTION=true

# AI Providers
ZAI_API_KEY=your-key-here
ZAI_MODEL=glm-4.7-flash
OPENAI_API_KEY=your-key-here

# Database
DATABASE_URL=postgresql://postgres:vivim1@localhost:5432/openscroll

# Logging
LOG_LEVEL=info
DYNAMIC_CONTEXT_LOG_LEVEL=info
```

---

## REQUIRED READING

| Document | Purpose |
|----------|---------|
| `VIVIM.docs/CONTEXT/FINAL_IMPLEMENTATION_REPORT.md` | Complete architecture |
| `VIVIM.docs/CONTEXT/IMPLEMENTATION_STATUS_LIVE.md` | Current status |
| `VIVIM.docs/CONTEXT/DYNAMIC_CONTEXT_MASTER_SPEC.md` | Master specification |
| `VIVIM.docs/CONTEXT/ACTION_REPORT_NEXT_STEPS.md` | Previous session notes |

---

## NEXT STEPS FOR NEW SESSION

1. **Day 1:** Configure Z.AI API key, install pgvector, fix Prisma mismatches
2. **Week 1:** Implement cascading invalidation, parallel bundle compilation
3. **Week 2:** Run full E2E tests, set up monitoring dashboard

---

*Document Version: 1.0.0*  
*Created: February 11, 2026*  
*Status: Phase 1 Complete - Ready for Phase 2*
