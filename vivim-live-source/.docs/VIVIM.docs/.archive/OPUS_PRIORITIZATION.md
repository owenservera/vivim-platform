# 🔬 OpenScroll Deep Code Inspection — Opus 4.6 Prioritization Document

> **Generated**: 2026-02-12T08:58 CET  
> **Scope**: `apps/server/src/`, `apps/pwa/src/`, `apps/mobile/src/`  
> **Method**: Line-by-line inspection of all core systems  
> **Purpose**: Feed to Claude Opus 4.6 (thinking) for high-leverage complex problem solving

---

## 📊 Executive Summary

| Severity | Count | Description |
|:---------|:------|:------------|
| 🔴 **CRITICAL** | 4 | Runtime crashes, data loss vectors, broken contracts |
| 🟠 **HIGH** | 5 | Silent failures, schema mismatches, duplicate declarations |
| 🟡 **MEDIUM** | 4 | Missing systems, hardcoded fallbacks, performance gaps |
| 🔵 **LOW** | 3 | Enhancements, typos, optimization opportunities |

**Bottom line**: The Dynamic Context Engine (8-layer pipeline) is architecturally sound and production-ready. The **Sync/Replication subsystem is NOT** — it has fundamental design contradictions and data-loss vectors that need immediate attention.

---

## 🔴 TIER 1 — CRITICAL: Runtime Errors & Data Loss Vectors

These are issues that **will cause crashes or data loss** in production. They should be addressed first.

---

### CRIT-01: `context-assembler.ts` — Undefined Variable Reference 🔴

**File**: `server/src/context/context-assembler.ts`  
**Line**: 461  
**Severity**: RUNTIME CRASH

```typescript
// Line 461 — references `context` which does NOT exist in this scope
detectedTopicCount: context.topics.length,    // ❌ CRASH: `context` is undefined
detectedEntityCount: context.entities.length, // ❌ CRASH: `context` is undefined
```

**Context**: The `computeBudget()` method is a `private` method that receives `bundles`, `jit`, `params`, and `conversationStats` as arguments. The detected context object is never passed to it. The calling code in `assemble()` stores it in `detectedContext` (line 100-105), but `computeBudget` has no access to it.

**Fix**:
```typescript
// Option A: Pass detectedContext to computeBudget
private computeBudget(
  bundles: CompiledBundle[],
  jit: JITKnowledge,
  params: AssemblyParams,
  conversationStats: { ... },
  detectedContext: DetectedContext  // ← ADD THIS
): TokenBudget {
  // ...
  detectedTopicCount: detectedContext.topics.length,
  detectedEntityCount: detectedContext.entities.length,
}
```

**Impact**: Every single chat message that triggers context assembly will crash. This is the **most critical bug** in the codebase.

---

### CRIT-02: Sync System — Dual Architecture Contradiction 🔴

**Files**:  
- `server/src/services/sync-service.js` (HLC-based operation log)  
- `server/src/routes/sync.js` (REST timestamp-based push/pull)  
- `pwa/src/lib/sync-manager.ts` (Yjs CRDT)  

**Severity**: DATA LOSS, ARCHITECTURAL CONFLICT

There are **three separate, incompatible sync mechanisms** that do not integrate:

| System | Location | Protocol | Status |
|:-------|:---------|:---------|:-------|
| HLC Operation Log | `sync-service.js` | Hybrid Logical Clock | ⚠️ Partially implemented, never consumed |
| REST Push/Pull | `routes/sync.js` | Wall clock (ISO timestamp) | ⚠️ Active but flawed |
| Yjs CRDT | `pwa/sync-manager.ts` | Binary CRDT via WebSocket | ⚠️ Active, isolated |

**Specific issues**:

1. **`sync-service.js` vector clock is NEVER populated**: `recordOperation()` creates SyncOperations but the `vectorClock` field is always `{}`. The `getVectorClock()` function computes one from `groupBy(deviceDid)`, but no consumer reads this.

2. **`SERVER_NODE_ID` is regenerated on every restart**:
   ```javascript
   // Line 8 — random each restart, breaks clock continuity
   const SERVER_NODE_ID = `server_${crypto.randomBytes(4).toString('hex')}`;
   ```

3. **`routes/sync.js` uses wall clock for conflict detection** — not the HLC:
   ```javascript
   // Line 319 — simple wall clock comparison, NOT HLC
   if (serverTime > clientTime) {
     return { conflict: true, reason: 'Server version is newer' };
   }
   ```
   Clock skew between devices will cause arbitrary data loss.

4. **Deletes have NO tombstone mechanism**:
   ```javascript
   // Line 349-354 — hard delete, no tombstone
   if (action === 'delete') {
     await getPrismaClient().conversation.delete({
       where: { id: data.id },
     });
     return { accepted: true };
   }
   ```
   If Device A deletes a conversation and Device B edits it, the edit is lost forever.

5. **Yjs CRDT and REST sync are completely isolated** — the `YjsSyncManager` maintains its own `Y.Doc` with conversations/messages, but these are never reconciled with the server-side Prisma data.

**Opus Task**: Design a unified sync protocol that:
- Uses HLC as the single source of truth for ordering
- Implements tombstone-based soft deletes
- Bridges Yjs binary sync with the server operation log
- Persists `SERVER_NODE_ID` across restarts

---

### CRIT-03: HLC Parser — Fragile Hyphen-Based Parsing 🔴

**File**: `server/src/lib/hlc.js`  
**Lines**: 19-43  
**Severity**: SILENT CORRUPTION

The HLC format is `ISO-COUNTER-NODEID` (e.g., `2024-01-15T10:30:00.000Z-0001-node123`).

The parser uses `lastIndexOf('-')` twice to split the string. But **ISO 8601 dates contain hyphens** (`2024-01-15`), and `nodeId` could also contain hyphens (e.g., `server_a1b2c3d4` is fine, but `device-phone-001` would break).

```javascript
// Line 28-29 — all it takes is one hyphen in nodeId to corrupt parsing
const lastHyphen = timestamp.lastIndexOf('-');
const secondLastHyphen = timestamp.lastIndexOf('-', lastHyphen - 1);
```

**Example of corruption**:
```
Input:  "2024-01-15T10:30:00.000Z-0001-server-abc"
                                           ^--- lastHyphen
                                     ^--- secondLastHyphen

Result: wallTime = "2024-01-15T10:30:00.000Z-0001-server"  ← INVALID DATE
        counter = NaN
        nodeId = "abc"
```

**Fix**: Use a safer delimiter (e.g., `#` or `|`), or require nodeIds to use only alphanumeric + underscore characters, or count the ISO portion by its known structure.

---

### CRIT-04: `invalidation-service.ts` — Schema Mismatch & Undefined Variables 🔴

**File**: `server/src/services/invalidation-service.ts`  
**Severity**: RUNTIME CRASH + SCHEMA MISMATCH

**Issue 1 — Undefined `log` variable** (lines 159, 183):
```typescript
// Line 159 — `log` is defined inside invalidate() with logger.child(),
// but triggerRecompilation() is a separate private method
log.info({ userId, conversations: conversations.length }, ...);  // ❌ CRASH
```

**Issue 2 — `SystemAction` model has no `metadata` field** (lines 188-189, 226-234):
```typescript
// Lines 188-189 — accessing .metadata on SystemAction
const userId = (item.metadata as any)?.userId;  // ❌ metadata doesn't exist on SystemAction

// Line 226-234 — creating SystemAction with metadata field
await prisma.systemAction.create({
  data: {
    ...
    metadata: { ... }  // ❌ SystemAction has no metadata field in schema
  }
});
```

The `SystemAction` model in `schema.prisma` has: `id`, `trigger`, `label`, `subLabel`, `description`, `actionCode`, `icon`. No `metadata` field. No `createdAt` either (referenced in `cleanupQueue`, line 273).

**Fix**: Either add `metadata Json @default("{}")` and `createdAt DateTime @default(now())` to `SystemAction`, or use a different model for the invalidation queue.

---

## 🟠 TIER 2 — HIGH: Silent Failures & Schema Mismatches

These won't crash immediately but produce incorrect behavior or will fail at runtime under specific conditions.

---

### HIGH-01: `hybrid-retrieval.ts` — Duplicate Method Declaration

**File**: `server/src/context/hybrid-retrieval.ts`  
**Lines**: 204-221 AND 316-354  
**Severity**: SHADOWING / COMPILATION ERROR

The class `HybridRetrievalService` has **TWO declarations** of `semanticSearchMemories()`:

1. Lines 204-221: Used when Qdrant is available (calls `this.qdrant.search`)
2. Lines 316-354: Postgres raw SQL fallback

TypeScript will only keep the second declaration (it shadows the first), which means the Qdrant path is **dead code** — `semanticSearchMemories` will always use the Postgres fallback regardless of Qdrant availability.

**Fix**: Rename one or merge them into a single method with branching logic (like `semanticSearchACUs` already does).

---

### HIGH-02: `profile-rollup-service.ts` — EntityProfile Schema Mismatch

**File**: `server/src/services/profile-rollup-service.ts`  
**Line**: 281  
**Severity**: PRISMA RUNTIME ERROR

```typescript
// Line 279-281 — totalTokensSpent does NOT exist on EntityProfile
await prisma.entityProfile.update({
  where: { id: existing.id },
  data: {
    totalTokensSpent: relatedACUs.reduce(...)  // ❌ Field doesn't exist
  }
});
```

`EntityProfile` has: `mentionCount`, `conversationCount`, `lastMentionedAt`, etc. But NO `totalTokensSpent`. That field exists on `TopicProfile`.

---

### HIGH-03: `profile-rollup-service.ts` — Set<Object> Deduplication Failure

**File**: `server/src/services/profile-rollup-service.ts`  
**Line**: 119  
**Severity**: DUPLICATE PROCESSING

```typescript
const potentialEntities = new Set<{ name: string; type: string }>();
// ...
potentialEntities.add({ name: word, type });  // ← ALWAYS unique (object reference)
```

JavaScript `Set` compares objects by reference. `{ name: "React", type: "tool" } !== { name: "React", type: "tool" }`. Every iteration adds a new object even if name+type are identical, causing N² duplicate entity processing.

**Fix**: Use a `Map<string, { name: string; type: string }>` keyed by `${name}:${type}`.

---

### HIGH-04: `librarian-worker.ts` — Invalid Prisma JSON Update Syntax

**File**: `server/src/context/librarian-worker.ts`  
**Lines**: 585-593  
**Severity**: PRISMA RUNTIME ERROR

```typescript
await prisma.atomicChatUnit.updateMany({
  where: { id: { in: acuIds } },
  data: {
    metadata: {
      path: ['librarianProcessed'],  // ❌ This is FILTER syntax, not UPDATE syntax
      value: true
    }
  }
});
```

The `path`/`value` syntax is for Prisma's `JsonFilter` (WHERE clause), not for updates. For updating a JSON field, you'd need `Prisma.DbNull` or raw SQL, or restructure to use `updateMany` with a computed JSON value.

---

### HIGH-05: `qdrant-vector-store.ts` — Typo in Date Property Access

**File**: `server/src/context/qdrant-vector-store.ts`  
**Line**: 207  
**Severity**: WRONG DATES IN SEARCH RESULTS

```typescript
// Line 207 — lowercase 'd' in 'createdat'
createdAt: r.payload?.createdAt ? new Date(r.payload.createdat as string) : new Date(),
//                     ^^^^^^^^ condition checks camelCase
//                                              ^^^^^^^^^ access uses lowercase 'd'
```

The ternary condition checks `r.payload?.createdAt` (camelCase) but then accesses `r.payload.createdat` (all lowercase). This will always produce `new Date(undefined)` = `Invalid Date` for the `createdAt` field, defaulting to `new Date()`.

---

## 🟡 TIER 3 — MEDIUM: Missing Systems & Performance Gaps

These represent architectural gaps or degraded functionality.

---

### MED-01: Profile Updater — THE Gap

**Status**: Confirmed NOT implemented  
**Ref**: `ASSESSMENT.md` line 300-304  

The design spec calls for a post-conversation **incremental profile updater** that:
1. After a conversation ends (IDLE state), extracts topic/entity profile deltas
2. Updates `TopicProfile.proficiencyLevel` and `proficiencySignals`
3. Refines `EntityProfile.facts` with confidence scores

Currently, the only profile builders are:
- `ProfileRollupService` — batch, keyword-based, low accuracy
- `LibrarianWorker` — LLM-based but operates on raw ACUs, not conversation arcs

**Opus Task**: Design `profile-updater.ts` that:
- Hooks into `ContextOrchestrator.invalidateOnConversationMessage` 
- Runs on conversation idle (debounced)
- Uses LLM to extract structured profile deltas
- Updates proficiency signals on TopicProfile
- Adds/refines facts on EntityProfile with confidence decay

---

### MED-02: PostgreSQL Fallback — No Actual Similarity Search

**File**: `server/src/context/hybrid-retrieval.ts`  
**Lines**: 129-167, 226-263  
**Severity**: DEGRADED FUNCTIONALITY

When Qdrant is unavailable, the "semantic search" falls back to PostgreSQL but assigns a **hardcoded `0.5 as similarity`**:

```sql
SELECT id, content, type, category, "createdAt",
  0.5 as similarity   -- ← NOT a real similarity score
FROM atomic_chat_units
WHERE ...
ORDER BY "createdAt" DESC  -- ← No similarity ranking at all
```

This means without Qdrant, JIT retrieval returns **the 20 most recent ACUs** regardless of relevance. The "semantic" search becomes a recency search.

**Opus Task**: Implement cosine similarity in PostgreSQL using the `embedding` Float[] field:
```sql
1 - (SUM(a.e * q.e) / (SQRT(SUM(a.e * a.e)) * SQRT(SUM(q.e * q.e))))
```
Or install pgvector extension and use `<=>` operator.

---

### MED-03: Budget Algorithm — Zero-Context Edge Case

**File**: `server/src/context/budget-algorithm.ts`  
**Lines**: 232-245  
**Severity**: EMPTY CONTEXT POSSIBLE

The `cutToFit()` method can reduce ALL elastic layers to 0 tokens if the deficit is large enough:

```typescript
private cutToFit(layers, elasticKeys, deficit) {
  const sorted = elasticKeys
    .sort((a, b) => a.layer.priority - b.layer.priority);  // lowest priority first

  let remaining = Math.abs(deficit);
  for (const { key, layer } of sorted) {
    if (remaining <= 0) break;
    const canCut = layer.allocated;
    const willCut = Math.min(remaining, canCut);
    layer.allocated -= willCut;   // ← can go to 0
    remaining -= willCut;
  }
}
```

If `L0_identity` (400t) + `L1_global_prefs` (600t) + `L7_user_message` (large) exceeds the total budget, ALL knowledge layers will be zeroed out.

**Fix**: Add a hard floor check: never cut below `minTokens`.

---

### MED-04: Bundle Compiler — Missing Post-Conversation Profile Update Trigger

**File**: `server/src/context/bundle-compiler.ts`  
**Line**: 255  

`compileConversationContext()` passes 5 args to `storeBundle()` but `storeBundle()` expects 8 (including `personaId`):

```typescript
// Line 255 — Missing arguments
return this.storeBundle(userId, 'conversation', compiled, {}, null, conversationId, null);
//                                                                                  ^^^^
// storeBundle signature: (userId, bundleType, compiled, composition, 
//                         topicProfileId, entityProfileId, conversationId, personaId)
//                                                          ^^^^^^^^^^^^^^
// The 6th arg is entityProfileId but `conversationId` is passed here
```

Arguments are positionally shifted: `entityProfileId` receives the conversationId, and `conversationId` receives `null`. This means conversation bundles are stored with the wrong foreign keys.

---

## 🔵 TIER 4 — LOW: Enhancements & Optimization Opportunities

---

### LOW-01: Conversation Context Engine — Placeholder Arc Generators

**File**: `server/src/context/conversation-context-engine.ts`  
**Lines**: 446-458

`generateLightArc`, `generateRichArc`, and `generateDenseArc` are all placeholder implementations:

```typescript
private async generateLightArc(messages, budget): Promise<string> {
  return `Conversation with ${messages.length} messages.`;  // ← placeholder
}

private async generateRichArc(messages, budget): Promise<string> {
  return `Conversation: ${messages.length} messages (${userMsgs} user, ${assistantMsgs} assistant)`;
}
```

These should use the LLM service (like `compactMessages` does) for actual arc generation.

---

### LOW-02: Prediction Engine — Navigation Pattern Detection is Basic

**File**: `server/src/context/prediction-engine.ts`  
**Lines**: 214-233

Signal 6 (Navigation Pattern Analysis) only checks for a single pattern:
```typescript
const isResearching = recentPaths.some(p => p.includes('/notebook')) && 
                      recentPaths.some(p => p.includes('/chat'));
```

This could be evolved to support:
- Frequency analysis (rapid switching = exploration mode)
- Dwell time patterns (long stays = deep work)
- Path sequence matching (settings → topic → new chat = configuration intent)

---

### LOW-03: Keyword Score Calculation — Not Accounting for Term Frequency

**File**: `server/src/context/hybrid-retrieval.ts`  
**Lines**: 474-484

The keyword score assigns weight by keyword position (`1/(i+1)`) rather than actual match density within the content:

```typescript
private calculateKeywordScore(keywords: string[]): Prisma.Sql {
  const cases = keywords.map((k, i) => 
    Prisma.sql`CASE WHEN LOWER(content) LIKE ... THEN ${1 / (i + 1)} ELSE 0 END`
  );
}
```

A TF-IDF approach would be more effective, especially for long keyword lists.

---

## 📋 Recommended Opus Task Queue

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

## 🧠 How to Feed This to Opus 4.6

### For Quick Fixes (Tasks 1-7):
```
You are working on the OpenScroll project. Here is a bug report:
[paste the specific CRIT/HIGH section]

Fix this bug. Here is the full file:
[paste the full file content]

Apply the fix and verify there are no other instances of this pattern.
```

### For Architectural Tasks (Tasks 8-9):
```
You are working on the OpenScroll project. Here are the relevant system files:

## Schema
[paste schema.prisma]

## Current Implementation
[paste all 3 sync files]

## Bug Analysis
[paste CRIT-02 section]

Design a unified sync protocol for this project. Requirements:
1. Single HLC-based ordering for all operations
2. Tombstone-based soft deletes with configurable retention
3. Bridge between Yjs CRDT docs and Prisma operation log
4. Persistent server node identity
5. Conflict resolution strategy beyond last-write-wins

Output: Complete implementation files with inline documentation.
```

### For Performance Tasks (Tasks 10-12):
```
You are optimizing the JIT retrieval system for OpenScroll.

Current implementation (PROBLEM: no real similarity without Qdrant):
[paste hybrid-retrieval.ts]

Available data:
- ACUs have a `Float[]` embedding field (1536 dimensions)
- Using PostgreSQL with Prisma
- Qdrant is optional but not always available

Design and implement a PostgreSQL-native cosine similarity fallback
that performs real vector search when Qdrant is unavailable.
```

---

## 🗂️ File Reference Index

| File | Lines | Role | Critical Issues |
|:-----|:------|:-----|:----------------|
| `context/context-assembler.ts` | 589 | Runtime assembly entry point | **CRIT-01** |
| `context/budget-algorithm.ts` | 248 | Token budget computation | MED-03 |
| `context/bundle-compiler.ts` | 454 | Bundle compilation + storage | MED-04 |
| `context/prediction-engine.ts` | 297 | Interaction prediction | LOW-02 |
| `context/context-orchestrator.ts` | 320 | Presence + warmup orchestration | Clean |
| `context/conversation-context-engine.ts` | 536 | 4-strategy compression | LOW-01 |
| `context/hybrid-retrieval.ts` | 489 | JIT knowledge retrieval | **HIGH-01**, MED-02, LOW-03 |
| `context/librarian-worker.ts` | 626 | LLM graph synthesis worker | **HIGH-04** |
| `context/qdrant-vector-store.ts` | 285 | Qdrant integration | **HIGH-05** |
| `context/types.ts` | 300 | Type definitions | Clean |
| `services/profile-rollup-service.ts` | 476 | Batch profile builder | **HIGH-02**, HIGH-03 |
| `services/sync-service.js` | 101 | HLC operation log | **CRIT-02** |
| `services/invalidation-service.ts` | 283 | Bundle invalidation | **CRIT-04** |
| `routes/sync.js` | 407 | REST sync endpoints | **CRIT-02** |
| `lib/hlc.js` | 94 | Hybrid Logical Clock | **CRIT-03** |
| `pwa/src/lib/sync-manager.ts` | 327 | Yjs CRDT sync | **CRIT-02** |
