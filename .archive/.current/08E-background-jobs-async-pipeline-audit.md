# DOCUMENT E: Background Jobs & Async Pipeline Audit

**Date**: 2026-03-05
**Project**: VIVIM — Background Processing

---

## Workers

### Memory Worker
- **File**: server/src/workers/memory-worker.js
- **Trigger**: Manual / Event-based
- **What it does**: Processes memory extraction from conversations
- **Dependencies**: Memory Service, Prisma
- **Error Handling**: YES
- **Retry Logic**: YES
- **Status**: PARTIAL

---

## Scheduled Jobs

### Librarian Worker
- **File**: server/src/context/librarian-worker.ts
- **Trigger**: Cron (30 minute cooldown, configurable)
- **What it does**: 
  1. Finds idle conversations (no activity for N minutes)
  2. Extracts key information
  3. Creates memory entries
  4. Updates user context
- **Dependencies**: Memory Service, Context Engine, LLM (Z.AI)
- **Error Handling**: YES
- **Retry Logic**: YES (configurable cooldown)
- **Status**: WORKING

**Configuration**:
- LIBRARIAN_ENABLED=true
- LIBRARIAN_COOLDOWN_MINUTES=30
- ENABLE_IDLE_DETECTION=true
- CONVERSATION_IDLE_TIMEOUT_MINUTES=5

---

## Context Engine Background Processes

### Context Warmup Worker
- **File**: server/src/services/context-warmup-worker.ts
- **Trigger**: On login / App foreground
- **What it does**: Preloads context bundles for faster initial response
- **Dependencies**: Context Service, Prisma
- **Error Handling**: YES
- **Retry Logic**: NO
- **Status**: WORKING

### Context Startup
- **File**: server/src/services/context-startup.ts
- **Trigger**: Application startup
- **What it does**: Initializes context engine, loads user preferences
- **Dependencies**: Settings Service
- **Error Handling**: YES
- **Retry Logic**: NO
- **Status**: WORKING

---

## Queue Services

### Queue Service
- **File**: server/src/services/queue-service.js
- **Type**: In-memory queue (p-queue)
- **What it does**: Manages async job queuing
- **Used by**: Capture, ACU processing
- **Error Handling**: YES
- **Retry Logic**: YES (3 retries)
- **Status**: WORKING

---

## Socket.IO Events

### Server-side Socket Handlers
- **File**: server/src/services/socket.ts
- **Events**:
  - connection - New client connection
  - disconnect - Client disconnect
  - context:update - Context bundle updates
  - sync:request - Sync requests
  - sync:response - Sync responses
- **Status**: WORKING

### Client-side Socket Listener
- **File**: pwa/src/components/GlobalSocketListener.tsx
- **Purpose**: Real-time updates for feed, context changes
- **Status**: WORKING

---

## ACU Processing Pipeline

### ACU Generator
- **File**: server/src/services/acu-generator.js
- **Trigger**: After conversation capture
- **What it does**:
  1. Parse conversation messages
  2. Generate atomic chat units
  3. Create embeddings
  4. Sign with Ed25519
  5. Store in database
- **Dependencies**: Extractor, Crypto, Prisma, Embedding service
- **Error Handling**: YES
- **Retry Logic**: YES
- **Status**: WORKING

### ACU Batch Processor
- **Route**: POST /api/v1/acus/batch
- **Trigger**: Manual API call
- **What it does**: Process multiple ACUs in batch
- **Dependencies**: ACU Generator
- **Error Handling**: YES
- **Retry Logic**: YES
- **Status**: WORKING

---

## Memory Pipeline

### Memory Extraction
- **Location**: server/src/context/memory/extraction.ts
- **Trigger**: Librarian worker / Manual
- **What it does**:
  1. Analyze conversation
  2. Extract key facts
  3. Generate embeddings
  4. Store memories
- **Dependencies**: LLM, Prisma
- **Error Handling**: YES
- **Retry Logic**: YES
- **Status**: WORKING

### Memory Consolidation
- **Location**: server/src/context/memory/consolidation.ts
- **Trigger**: Manual / Scheduled
- **What it does**:
  1. Find related memories
  2. Merge duplicates
  3. Update importance scores
  4. Prune low-value memories
- **Dependencies**: Memory Service
- **Error Handling**: YES
- **Retry Logic**: YES
- **Status**: WORKING

---

## Capture Retries

### Capture Queue
- **Implementation**: p-queue in capture routes
- **Max Concurrent**: 5 (configurable via MAX_CONCURRENT_EXTRACTIONS)
- **Timeout**: 30 seconds (configurable)
- **Retry on Failure**: YES (up to 3 retries)
- **Status**: WORKING

---

## P2P/CRDT Sync Jobs

### Sync Service
- **File**: server/src/services/sync-service.js
- **Trigger**: Client push / Periodic pull
- **What it does**:
  1. Receive client operations
  2. Apply to local state
  3. Propagate to relevant clients
- **Dependencies**: Prisma, Socket.IO
- **Error Handling**: YES
- **Retry Logic**: YES
- **Status**: WORKING

### Sync Interval
- **Configuration**: SYNC_INTERVAL=5000ms (5 seconds)
- **Batch Size**: SYNC_BATCH_SIZE=100

---

## Feed Context Integration

### Feed Context Integration Service
- **File**: server/src/services/feed-context-integration.ts
- **Trigger**: On feed request
- **What it does**:
  1. Fetch user context
  2. Apply personalization
  3. Rank results
- **Dependencies**: Context Engine, Feed Service
- **Error Handling**: YES
- **Retry Logic**: NO
- **Status**: WORKING

---

## Summary

| Job/Process | Trigger | Status | Error Handling | Retry |
|-------------|---------|--------|----------------|-------|
| Librarian Worker | Cron (30min) | WORKING | YES | YES |
| Memory Extraction | Event | WORKING | YES | YES |
| Memory Consolidation | Manual | WORKING | YES | YES |
| Context Warmup | On login | WORKING | YES | NO |
| ACU Generation | Capture | WORKING | YES | YES |
| ACU Batch | Manual | WORKING | YES | YES |
| Capture Queue | API | WORKING | YES | YES (3x) |
| Sync | Push/Pull | WORKING | YES | YES |
| Feed Personalization | Request | WORKING | YES | NO |

**Overall Reliability**: HIGH - Most jobs have error handling and retry logic

---

## Estimated Reliability Issues

1. **Librarian Worker**: Dependent on external LLM API (Z.AI) - may fail if API is down
2. **Memory Extraction**: Heavy LLM usage - may be slow for large conversations
3. **P2P Sync**: Not fully operational - needs P2P bootstrap peers configured
4. **Batch Processing**: No rate limiting on batch endpoints - could overwhelm system

---

## Missing Features

1. Dead letter queue for failed jobs
2. Job monitoring dashboard
3. Scheduled job management UI
4. Rate limiting on batch operations
