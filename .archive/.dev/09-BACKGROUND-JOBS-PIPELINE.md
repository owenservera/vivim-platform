# VIVIM — Background Jobs & Async Pipeline
**Archived**: 2026-03-05 | **Basis**: `08E-background-jobs-async-pipeline-audit.md`

---

## Summary

| Job/Process | Trigger | Status | Error Handling | Retry |
|-------------|---------|--------|----------------|-------|
| Librarian Worker | Cron (30min cooldown) | ✅ WORKING | Yes | Yes |
| Memory Extraction | Event (idle detection) | ✅ WORKING | Yes | Yes |
| Memory Consolidation | Manual API | ✅ WORKING | Yes | Yes |
| Context Warmup | On login / foreground | ✅ WORKING | Yes | No |
| Context Startup | App startup | ✅ WORKING | Yes | No |
| ACU Generation | Post-capture | ✅ WORKING | Yes | Yes |
| ACU Batch | Manual API | ✅ WORKING | Yes | Yes |
| Capture Queue | API call | ✅ WORKING | Yes | Yes (3x) |
| Sync (CRDT push) | Socket.IO push | ✅ WORKING | Yes | Yes |
| Feed Personalization | Per-request | ✅ WORKING | Yes | No |

**Overall Reliability**: HIGH — Most jobs have error handling and retry logic.

---

## 1. Librarian Worker

| Property | Value |
|----------|-------|
| **File** | `server/src/context/librarian-worker.ts` |
| **Trigger** | Cron — runs after `LIBRARIAN_COOLDOWN_MINUTES` (default: 30min) |
| **Dependencies** | Memory Service, Context Engine, LLM (Z.AI) |
| **Error Handling** | Yes |
| **Retry** | Yes (configurable cooldown) |
| **Status** | ✅ WORKING |

**What it does**:
1. Detects conversations idle for > `CONVERSATION_IDLE_TIMEOUT_MINUTES` (default: 5min)
2. Extracts key facts, preferences, episodic memories via LLM
3. Creates `Memory` records with embeddings
4. Updates user context bundles

**Environment variables**:
```
LIBRARIAN_ENABLED=true
LIBRARIAN_COOLDOWN_MINUTES=30
LIBRARIAN_BATCH_SIZE=20
ENABLE_IDLE_DETECTION=true
CONVERSATION_IDLE_TIMEOUT_MINUTES=5
```

**Risk**: Dependent on Z.AI API availability — will fail gracefully if API is down.

---

## 2. ACU Generation Pipeline

| Property | Value |
|----------|-------|
| **File** | `server/src/services/acu-generator.js` |
| **Trigger** | Automatically after successful conversation capture |
| **Dependencies** | Extractor output, Crypto lib, Prisma, Embedding service |
| **Retry** | Yes |
| **Status** | ✅ WORKING |

**Pipeline steps**:
1. Parse conversation messages into meaningful content chunks
2. Assign `type` and `category` to each chunk
3. Call embedding API (Z.AI — 1536 dimensions)
4. Compute SHA-256 content hash
5. Sign with Ed25519 (`nacl.sign`)
6. Upsert to `AtomicChatUnit` table with conversation/message pointers
7. Feed into `acu-memory-pipeline.ts` for memory linking

**Batch processing**: `POST /api/v1/acus/batch` — no rate limiting (risk: could overwhelm system).

---

## 3. Memory Extraction

| Property | Value |
|----------|-------|
| **Files** | `server/src/context/memory/extraction.ts`, `server/src/workers/memory-worker.js` |
| **Trigger** | Librarian Worker (cron) or manual event |
| **LLM Usage** | High — processes full conversation with LLM |
| **Retry** | Yes |
| **Status** | ✅ WORKING (⚠️ ad-hoc triggering PARTIAL) |

**Extraction types**:
- `FACTUAL` — Verifiable facts ("I am a software engineer")
- `PREFERENCE` — Stated preferences ("I prefer Python over JavaScript")
- `EPISODIC` — Past events ("I worked at Google in 2022")
- `RELATIONSHIP` — Interpersonal context ("My manager is named Sarah")

---

## 4. Memory Consolidation

| Property | Value |
|----------|-------|
| **File** | `server/src/context/memory/consolidation.ts` |
| **Trigger** | Manual: `POST /api/v1/memory/consolidate` |
| **Status** | ✅ WORKING |

**What it does**:
1. Finds similar memories using pgvector cosine similarity
2. Merges duplicate/overlapping memories
3. Updates `importance` scores based on recency and access count
4. Archives (soft-deletes) low-value memories

---

## 5. Queue Service

| Property | Value |
|----------|-------|
| **File** | `server/src/services/queue-service.js` |
| **Type** | In-memory queue (`p-queue`) |
| **Concurrency** | `MAX_CONCURRENT_EXTRACTIONS` (default: 5) |
| **Retry** | Yes (3 retries with exponential backoff) |
| **Status** | ✅ WORKING |

**Used by**: Capture pipeline, ACU processing.

**Gap**: No dead-letter queue for permanently failed jobs.

---

## 6. Context Warmup & Startup

### Context Warmup Worker
- **File**: `server/src/services/context-warmup-worker.ts`
- **Trigger**: On user login / app comes to foreground
- **Purpose**: Preloads context bundles → faster time-to-first-response
- **Status**: ✅ WORKING

### Context Startup
- **File**: `server/src/services/context-startup.ts`
- **Trigger**: Application startup
- **Purpose**: Initializes context engine, loads global preferences
- **Status**: ✅ WORKING

---

## 7. Socket.IO Sync (CRDT Write-Back)

| Property | Value |
|----------|-------|
| **File** | `server/src/services/socket.ts` |
| **Event** | `sync:push` (client → server) |
| **Status** | ✅ WORKING (FIXED 2026-03-05) |

**Fixed implementation**:
```javascript
// Before: stubbed — changes were logged but not persisted
// After: Prisma transaction
await prisma.$transaction([
  prisma.conversation.upsert({ where: { id }, update: data, create: data }),
  prisma.message.upsert({ /* ... */ }),
  prisma.atomicChatUnit.upsert({ /* ... */ })
]);
```

**Sync configuration**:
```
SYNC_INTERVAL=5000     # 5 seconds
SYNC_BATCH_SIZE=100    # ops per batch
```

---

## 8. Feed Context Integration

| Property | Value |
|----------|-------|
| **File** | `server/src/services/feed-context-integration.ts` |
| **Trigger** | Per feed request |
| **Status** | ✅ WORKING |

**Process**:
1. Fetch user's context bundles
2. Apply personalization weights
3. Re-rank feed results based on context relevance

---

## Missing Infrastructure

| Feature | Priority | Notes |
|---------|---------|-------|
| Dead Letter Queue | HIGH | Failed jobs silently dropped after 3 retries |
| Job Monitoring Dashboard | MEDIUM | No visibility into queue state |
| Scheduled Job Management UI | LOW | Admin can't trigger/pause/reset jobs |
| Rate Limiting on Batch ACU Endpoint | HIGH | Potential system overload |
| Email Notifications | HIGH | No email service configured — notifications never sent |

---

## Risk Assessment

| Risk | Likelihood | Impact |
|------|------------|--------|
| Librarian fails due to Z.AI outage | Medium | Medium — memory extraction pauses |
| Memory extraction too slow on large convos | High | Low — async, doesn't block user |
| P2P sync not operational | High | High — offline sync not actually P2P |
| Batch ACU endpoint DDOSes self | Low | High — no rate limit |
