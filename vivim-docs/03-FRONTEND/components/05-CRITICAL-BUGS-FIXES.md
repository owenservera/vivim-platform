# VIVIM Critical Bugs & Technical Debt

> **Generated:** March 23, 2026
> **Severity:** 🔴 CRITICAL - Blocks Launch
> **Source:** VIVIM.docs/.archive deep code inspection (Opus 4.6 analysis)
> **Action Required:** Fix before MVP launch

---

## Executive Summary

Deep code inspection reveals **12 critical and high-priority bugs** in the VIVIM codebase. Four issues are **runtime-crashing blockers** that will cause immediate failures on launch. Two issues represent **data loss vectors** that could corrupt user data.

### Bug Summary by Severity

| Severity | Count | Description | Must Fix Before Launch |
|:---------|:------|:------------|:----------------------|
| 🔴 **CRITICAL** | 4 | Runtime crashes, data loss vectors | **YES** |
| 🟠 **HIGH** | 5 | Silent failures, schema mismatches | **YES** |
| 🟡 **MEDIUM** | 4 | Missing systems, degraded functionality | Recommended |
| 🔵 **LOW** | 3 | Enhancements, typos | Post-launch |

---

## 🔴 CRITICAL Issues (Fix Immediately)

### CRIT-01: Undefined Variable Reference in Context Assembler

**File:** `server/src/context/context-assembler.ts`
**Line:** 461
**Severity:** RUNTIME CRASH - **EVERY CHAT WILL CRASH**
**Impact:** 100% of chat messages will fail

**Problem:**
```typescript
// Line 461 — references `context` which does NOT exist in this scope
detectedTopicCount: context.topics.length,    // ❌ CRASH: `context` is undefined
detectedEntityCount: context.entities.length, // ❌ CRASH: `context` is undefined
```

The `computeBudget()` method is a `private` method that receives `bundles`, `jit`, `params`, and `conversationStats` as arguments. The detected context object is stored in `detectedContext` (line 100-105) in the `assemble()` method, but `computeBudget` has no access to it.

**Fix:**
```typescript
// Option A: Pass detectedContext to computeBudget (RECOMMENDED)
private computeBudget(
  bundles: CompiledBundle[],
  jit: JITKnowledge,
  params: AssemblyParams,
  conversationStats: { ... },
  detectedContext: DetectedContext  // ← ADD THIS PARAMETER
): TokenBudget {
  // ...
  return {
    // ...
    detectedTopicCount: detectedContext.topics.length,
    detectedEntityCount: detectedContext.entities.length,
  };
}

// Update call site in assemble() method:
const budget = this.computeBudget(
  bundles,
  jit,
  params,
  conversationStats,
  detectedContext  // ← PASS THIS
);
```

**Estimated Fix Time:** 30 minutes
**Testing:** Run any chat message assembly - should not crash

---

### CRIT-02: Sync System — Dual Architecture Contradiction

**Files:**
- `server/src/services/sync-service.js` (HLC-based operation log)
- `server/src/routes/sync.js` (REST timestamp-based push/pull)
- `pwa/src/lib/sync-manager.ts` (Yjs CRDT)

**Severity:** DATA LOSS - **SILENT CORRUPTION**
**Impact:** User data loss in multi-device scenarios

**Problem:** There are **three separate, incompatible sync mechanisms** that do not integrate:

| System | Location | Protocol | Status |
|:-------|:---------|:---------|:-------|
| HLC Operation Log | `sync-service.js` | Hybrid Logical Clock | ⚠️ Partially implemented, never consumed |
| REST Push/Pull | `routes/sync.js` | Wall clock (ISO timestamp) | ⚠️ Active but flawed |
| Yjs CRDT | `pwa/sync-manager.ts` | Binary CRDT via WebSocket | ⚠️ Active, isolated |

**Specific Issues:**

1. **`sync-service.js` vector clock is NEVER populated:**
```javascript
// recordOperation() creates SyncOperations but vectorClock is always {}
const vectorClock = {}; // ← Never populated
```

2. **`SERVER_NODE_ID` is regenerated on every restart:**
```javascript
// Line 8 — random each restart, breaks clock continuity
const SERVER_NODE_ID = `server_${crypto.randomBytes(4).toString('hex')}`;
```

3. **`routes/sync.js` uses wall clock for conflict detection — not HLC:**
```javascript
// Line 319 — simple wall clock comparison, NOT HLC
if (serverTime > clientTime) {
  return { conflict: true, reason: 'Server version is newer' };
}
```
Clock skew between devices will cause arbitrary data loss.

4. **Deletes have NO tombstone mechanism:**
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

**Recommended Fix (Architectural Redesign):**

```javascript
// 1. Persist SERVER_NODE_ID across restarts
const SERVER_NODE_ID = await getOrCreateServerNodeId();

// 2. Use HLC as single source of truth
function detectConflict(op1, op2) {
  return compareHLC(op1.hlc, op2.hlc) === 'concurrent';
}

// 3. Implement tombstone-based soft deletes
await prisma.conversation.update({
  where: { id: data.id },
  data: {
    deletedAt: new Date(),
    deletedBy: userId,
    // Keep data for reconciliation
  }
});

// 4. Bridge Yjs CRDT with operation log
yjsDoc.on('update', async (update, origin) => {
  await syncService.recordOperation({
    type: 'yjs_update',
    hlc: generateHLC(),
    data: update
  });
});
```

**Estimated Fix Time:** 1-2 weeks (architectural redesign)
**Interim Mitigation:** Disable multi-device sync for MVP, use local-only storage

---

### CRIT-03: HLC Parser — Fragile Hyphen-Based Parsing

**File:** `server/src/lib/hlc.js`
**Lines:** 19-43
**Severity:** SILENT CORRUPTION
**Impact:** Date corruption when nodeIds contain hyphens

**Problem:**
The HLC format is `ISO-COUNTER-NODEID` (e.g., `2024-01-15T10:30:00.000Z-0001-node123`).

The parser uses `lastIndexOf('-')` twice to split the string. But **ISO 8601 dates contain hyphens** (`2024-01-15`), and `nodeId` could also contain hyphens (e.g., `device-phone-001` would break).

```javascript
// Line 28-29 — all it takes is one hyphen in nodeId to corrupt parsing
const lastHyphen = timestamp.lastIndexOf('-');
const secondLastHyphen = timestamp.lastIndexOf('-', lastHyphen - 1);

// Example of corruption:
// Input:  "2024-01-15T10:30:00.000Z-0001-server-abc"
//                                          ^--- lastHyphen
//                                    ^--- secondLastHyphen
// Result: wallTime = "2024-01-15T10:30:00.000Z-0001-server"  ← INVALID DATE
//           counter = NaN
//           nodeId = "abc"
```

**Fix:**
```javascript
// Option A: Use safer delimiter (RECOMMENDED)
// Format: ISO#COUNTER#NODEID
const parts = timestamp.split('#');
if (parts.length !== 3) {
  throw new Error('Invalid HLC format');
}
const [wallTime, counter, nodeId] = parts;

// Option B: Validate nodeId format (allow only alphanumeric + underscore)
if (!/^[a-zA-Z0-9_]+$/.test(nodeId)) {
  throw new Error('Invalid nodeId format');
}

// Option C: Parse by known ISO structure
const isoMatch = timestamp.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z)-(\d+)-(.+)$/);
if (!isoMatch) {
  throw new Error('Invalid HLC format');
}
const [, wallTime, counter, nodeId] = isoMatch;
```

**Estimated Fix Time:** 2-4 hours
**Testing:** Test with nodeIds containing hyphens

---

### CRIT-04: Invalidation Service — Schema Mismatch & Undefined Variables

**File:** `server/src/services/invalidation-service.ts`
**Severity:** RUNTIME CRASH + SCHEMA MISMATCH
**Impact:** Bundle invalidation crashes

**Issue 1 — Undefined `log` variable (lines 159, 183):**
```typescript
// Line 159 — `log` is defined inside invalidate() with logger.child(),
// but triggerRecompilation() is a separate private method
log.info({ userId, conversations: conversations.length }, ...);  // ❌ CRASH
```

**Issue 2 — `SystemAction` model has no `metadata` field (lines 188-189, 226-234):**
```typescript
// Lines 188-189 — accessing .metadata on SystemAction
const userId = (item.metadata as any)?.userId;  // ❌ metadata doesn't exist

// Line 226-234 — creating SystemAction with metadata field
await prisma.systemAction.create({
  data: {
    ...
    metadata: { ... }  // ❌ SystemAction has no metadata field in schema
  }
});
```

The `SystemAction` model in `schema.prisma` has: `id`, `trigger`, `label`, `subLabel`, `description`, `actionCode`, `icon`. No `metadata` field. No `createdAt` either (referenced in `cleanupQueue`, line 273).

**Fix:**
```prisma
// Add to SystemAction model in schema.prisma
model SystemAction {
  // ... existing fields ...
  metadata   Json     @default("{}")
  createdAt  DateTime @default(now())
}
```

```typescript
// Fix undefined log - pass logger as parameter
private async triggerRecompilation(
  conversations: Conversation[],
  logger: Logger  // ← ADD THIS
): Promise<void> {
  logger.info({ userId, conversations: conversations.length }, '...');
}
```

**Estimated Fix Time:** 2 hours
**Testing:** Trigger bundle invalidation, verify no crashes

---

## 🟠 HIGH Issues (Fix Before Scale)

### HIGH-01: Duplicate Method Declaration in Hybrid Retrieval

**File:** `server/src/context/hybrid-retrieval.ts`
**Lines:** 204-221 AND 316-354
**Severity:** SHADOWING / COMPILATION ERROR
**Impact:** Qdrant path is dead code

**Problem:**
The class `HybridRetrievalService` has **TWO declarations** of `semanticSearchMemories()`:

1. Lines 204-221: Used when Qdrant is available (calls `this.qdrant.search`)
2. Lines 316-354: Postgres raw SQL fallback

TypeScript will only keep the second declaration (it shadows the first), which means the Qdrant path is **dead code** — `semanticSearchMemories` will always use the Postgres fallback regardless of Qdrant availability.

**Fix:**
```typescript
// Merge into single method with branching logic
async semanticSearchMemories(
  embedding: number[],
  userId: string,
  options: SearchOptions
): Promise<Memory[]> {
  if (this.qdrantAvailable) {
    // Qdrant vector search
    return this.qdrant.search('memories', embedding, {
      userId,
      similarityThreshold: 0.4,
      limit: 10
    });
  } else {
    // PostgreSQL fallback with raw SQL
    return prisma.$queryRaw`...`;
  }
}
```

**Estimated Fix Time:** 1 hour
**Testing:** Test with and without Qdrant

---

### HIGH-02: EntityProfile Schema Mismatch

**File:** `server/src/services/profile-rollup-service.ts`
**Line:** 281
**Severity:** PRISMA RUNTIME ERROR
**Impact:** Entity profile updates fail

**Problem:**
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

**Fix:**
```typescript
// Remove the line or add field to schema
// Option A: Remove (RECOMMENDED for MVP)
// Just delete this line - not critical for MVP

// Option B: Add field to schema
model EntityProfile {
  // ... existing fields ...
  totalTokensSpent Int @default(0)
}
```

**Estimated Fix Time:** 30 minutes
**Testing:** Run profile rollup service

---

### HIGH-03: Set<Object> Deduplication Failure

**File:** `server/src/services/profile-rollup-service.ts`
**Line:** 119
**Severity:** DUPLICATE PROCESSING
**Impact:** N² duplicate entity processing

**Problem:**
```typescript
const potentialEntities = new Set<{ name: string; type: string }>();
// ...
potentialEntities.add({ name: word, type });  // ← ALWAYS unique (object reference)
```

JavaScript `Set` compares objects by reference. `{ name: "React", type: "tool" } !== { name: "React", type: "tool" }`. Every iteration adds a new object even if name+type are identical, causing N² duplicate processing.

**Fix:**
```typescript
// Use Map keyed by string
const potentialEntities = new Map<string, { name: string; type: string }>();
// ...
const key = `${name}:${type}`;
if (!potentialEntities.has(key)) {
  potentialEntities.set(key, { name, type });
}
```

**Estimated Fix Time:** 1 hour
**Testing:** Run profile rollup with duplicate entities

---

### HIGH-04: Invalid Prisma JSON Update Syntax

**File:** `server/src/context/librarian-worker.ts`
**Lines:** 585-593
**Severity:** PRISMA RUNTIME ERROR
**Impact:** Librarian worker fails to update ACUs

**Problem:**
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

The `path`/`value` syntax is for Prisma's `JsonFilter` (WHERE clause), not for updates.

**Fix:**
```typescript
// Option A: Use Prisma JSON update syntax
await prisma.atomicChatUnit.updateMany({
  where: { id: { in: acuIds } },
  data: {
    metadata: {
      librarianProcessed: true
    }
  }
});

// Option B: Use raw SQL for complex updates
await prisma.$executeRaw`
  UPDATE atomic_chat_units
  SET metadata = metadata || '{"librarianProcessed": true}'::jsonb
  WHERE id IN (${Prisma.join(acuIds)})
`;
```

**Estimated Fix Time:** 2 hours
**Testing:** Run librarian worker

---

### HIGH-05: Typo in Date Property Access

**File:** `server/src/context/qdrant-vector-store.ts`
**Line:** 207
**Severity:** WRONG DATES IN SEARCH RESULTS
**Impact:** All `createdAt` fields show wrong dates

**Problem:**
```typescript
// Line 207 — lowercase 'd' in 'createdat'
createdAt: r.payload?.createdAt ? new Date(r.payload.createdat as string) : new Date(),
//                     ^^^^^^^^ condition checks camelCase
//                                              ^^^^^^^^^ access uses lowercase 'd'
```

The ternary condition checks `r.payload?.createdAt` (camelCase) but then accesses `r.payload.createdat` (all lowercase). This will always produce `new Date(undefined)` = `Invalid Date`.

**Fix:**
```typescript
// Fix the typo
createdAt: r.payload?.createdAt ? new Date(r.payload.createdAt as string) : new Date(),
```

**Estimated Fix Time:** 5 minutes
**Testing:** Search ACUs, verify dates are correct

---

## 🟡 MEDIUM Issues (Fix for Quality)

### MED-01: Profile Updater — THE Gap

**Status:** NOT IMPLEMENTED
**Severity:** MISSING FUNCTIONALITY
**Impact:** No post-conversation learning

**Problem:**
The design spec calls for a post-conversation **incremental profile updater** that:
1. After a conversation ends (IDLE state), extracts topic/entity profile deltas
2. Updates `TopicProfile.proficiencyLevel` and `proficiencySignals`
3. Refines `EntityProfile.facts` with confidence scores

Currently, the only profile builders are:
- `ProfileRollupService` — batch, keyword-based, low accuracy
- `LibrarianWorker` — LLM-based but operates on raw ACUs, not conversation arcs

**Recommended Implementation:**
```typescript
// Create new file: server/src/context/profile-updater.ts
export class ProfileUpdater {
  async updateOnConversationIdle(
    userId: string,
    conversationId: string
  ): Promise<void> {
    // 1. Fetch conversation arc
    const arc = await this.getConversationArc(conversationId);
    
    // 2. Extract topic deltas using LLM
    const topicDeltas = await this.llm.extractTopicDeltas(arc);
    
    // 3. Update TopicProfile.proficiencyLevel
    for (const delta of topicDeltas) {
      await prisma.topicProfile.update({
        where: { id: delta.topicId },
        data: {
          proficiencyLevel: delta.newLevel,
          proficiencySignals: {
            push: { type: 'conversation', value: delta.score }
          }
        }
      });
    }
    
    // 4. Refine EntityProfile.facts with confidence decay
    const entityFacts = await this.llm.extractEntityFacts(arc);
    for (const fact of entityFacts) {
      await prisma.entityFact.upsert({
        where: { entityId_content: { entityId: fact.entityId, content: fact.content } },
        create: { ...fact, confidence: 0.8 },
        update: { confidence: { increment: 0.1 } }
      });
    }
  }
}
```

**Estimated Fix Time:** 1 week (new module)
**Priority:** Post-MVP (can defer)

---

### MED-02: PostgreSQL Fallback — No Actual Similarity Search

**File:** `server/src/context/hybrid-retrieval.ts`
**Lines:** 129-167, 226-263
**Severity:** DEGRADED FUNCTIONALITY
**Impact:** Without Qdrant, "semantic search" returns most recent ACUs, not most relevant

**Problem:**
When Qdrant is unavailable, the "semantic search" falls back to PostgreSQL but assigns a **hardcoded `0.5 as similarity`**:

```sql
SELECT id, content, type, category, "createdAt",
  0.5 as similarity   -- ← NOT a real similarity score
FROM atomic_chat_units
WHERE ...
ORDER BY "createdAt" DESC  -- ← No similarity ranking at all
```

This means without Qdrant, JIT retrieval returns **the 20 most recent ACUs** regardless of relevance.

**Fix:**
```typescript
// Implement cosine similarity in PostgreSQL
async semanticSearchACUs(
  embedding: number[],
  userId: string,
  options: SearchOptions
): Promise<AtomicChatUnit[]> {
  if (this.qdrantAvailable) {
    return this.qdrant.search('acus', embedding, options);
  } else {
    // PostgreSQL with cosine similarity
    return prisma.$queryRaw`
      SELECT 
        acu.id,
        acu.content,
        acu.type,
        acu.category,
        acu."createdAt",
        1 - (
          SELECT SUM(a.e * q.e) / (SQRT(SUM(a.e * a.e)) * SQRT(SUM(q.e * q.e)))
          FROM (SELECT unnest(acu.embedding::real[]) as e) a,
               (SELECT unnest(${embedding}::real[]) as e) q
        ) as similarity
      FROM atomic_chat_units acu
      WHERE acu."userId" = ${userId}
      HAVING similarity > 0.35  -- similarity threshold
      ORDER BY similarity DESC
      LIMIT 20
    `;
  }
}
```

**Estimated Fix Time:** 4-6 hours
**Testing:** Test semantic search without Qdrant

---

### MED-03: Budget Algorithm — Zero-Context Edge Case

**File:** `server/src/context/budget-algorithm.ts`
**Lines:** 232-245
**Severity:** EMPTY CONTEXT POSSIBLE
**Impact:** Can produce empty context if deficit is large

**Problem:**
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

**Fix:**
```typescript
private cutToFit(layers, elasticKeys, deficit) {
  const sorted = elasticKeys
    .sort((a, b) => a.layer.priority - b.layer.priority);

  let remaining = Math.abs(deficit);
  for (const { key, layer } of sorted) {
    if (remaining <= 0) break;
    const canCut = layer.allocated - layer.minTokens;  // ← RESPECT MINIMUM
    if (canCut <= 0) continue;  // ← SKIP IF AT MINIMUM
    const willCut = Math.min(remaining, canCut);
    layer.allocated -= willCut;
    remaining -= willCut;
  }
}
```

**Estimated Fix Time:** 1 hour
**Testing:** Test with very small context budgets

---

### MED-04: Bundle Compiler — Wrong storeBundle Argument Order

**File:** `server/src/context/bundle-compiler.ts`
**Line:** 255
**Severity:** WRONG FOREIGN KEYS
**Impact:** Conversation bundles stored with incorrect foreign keys

**Problem:**
```typescript
// Line 255 — Missing arguments
return this.storeBundle(userId, 'conversation', compiled, {}, null, conversationId, null);
//                                                                                  ^^^^
// storeBundle signature: (userId, bundleType, compiled, composition,
//                         topicProfileId, entityProfileId, conversationId, personaId)
//                                                          ^^^^^^^^^^^^^^
// The 6th arg is entityProfileId but `conversationId` is passed here
```

Arguments are positionally shifted: `entityProfileId` receives the conversationId, and `conversationId` receives `null`.

**Fix:**
```typescript
// Correct argument order
return this.storeBundle(
  userId,
  'conversation',
  compiled,
  {},
  null,              // topicProfileId
  null,              // entityProfileId
  conversationId,    // conversationId
  null               // personaId
);
```

**Estimated Fix Time:** 30 minutes
**Testing:** Verify conversation bundles have correct foreign keys

---

## 🔵 LOW Issues (Enhancements)

### LOW-01: Conversation Context Engine — Placeholder Arc Generators

**File:** `server/src/context/conversation-context-engine.ts`
**Lines:** 446-458
**Severity:** PLACEHOLDER IMPLEMENTATIONS
**Impact:** Arc generation uses trivial summaries instead of LLM

**Problem:**
```typescript
private async generateLightArc(messages, budget): Promise<string> {
  return `Conversation with ${messages.length} messages.`;  // ← placeholder
}

private async generateRichArc(messages, budget): Promise<string> {
  return `Conversation: ${messages.length} messages (${userMsgs} user, ${assistantMsgs} assistant)`;
}
```

**Fix:** Use LLM service for actual arc generation (like `compactMessages` does)

**Estimated Fix Time:** 2-3 hours
**Priority:** Post-MVP

---

### LOW-02: Prediction Engine — Navigation Pattern Detection is Basic

**File:** `server/src/context/prediction-engine.ts`
**Lines:** 214-233
**Severity:** BASIC IMPLEMENTATION
**Impact:** Misses complex navigation patterns

**Problem:**
Signal 6 (Navigation Pattern Analysis) only checks for a single pattern:
```typescript
const isResearching = recentPaths.some(p => p.includes('/notebook')) &&
                      recentPaths.some(p => p.includes('/chat'));
```

**Enhancement:** Support frequency analysis, dwell time patterns, path sequence matching

**Estimated Fix Time:** 4-6 hours
**Priority:** Post-MVP

---

### LOW-03: Keyword Score Calculation — Not Accounting for Term Frequency

**File:** `server/src/context/hybrid-retrieval.ts`
**Lines:** 474-484
**Severity:** SUBOPTIMAL SCORING
**Impact:** Keyword search less accurate

**Problem:**
The keyword score assigns weight by keyword position (`1/(i+1)`) rather than actual match density.

**Enhancement:** Implement TF-IDF approach

**Estimated Fix Time:** 4-6 hours
**Priority:** Post-MVP

---

## Bug Fix Priority Queue

### Immediate (Before Next Commit)
1. **CRIT-01**: Pass `detectedContext` to `computeBudget()` - 30 min
2. **CRIT-04**: Fix `SystemAction` schema + undefined `log` - 2 hours
3. **HIGH-05**: Fix typo in `qdrant-vector-store.ts` - 5 min

### Before MVP Launch
4. **CRIT-03**: Fix HLC parser - 2-4 hours
5. **HIGH-01**: Merge duplicate `semanticSearchMemories` - 1 hour
6. **HIGH-02**: Remove `totalTokensSpent` reference - 30 min
7. **HIGH-04**: Fix Prisma JSON update syntax - 2 hours
8. **MED-04**: Fix `storeBundle` argument order - 30 min

### Before Scale (Post-MVP)
9. **CRIT-02**: Unified sync protocol redesign - 1-2 weeks
10. **MED-01**: Implement `profile-updater.ts` - 1 week
11. **MED-02**: PostgreSQL cosine similarity - 4-6 hours
12. **MED-03**: Add minTokens floor to `cutToFit` - 1 hour

### Enhancements (v1.1)
13. **LOW-01**: Real LLM-powered arc generators - 2-3 hours
14. **LOW-02**: Enhanced navigation pattern detection - 4-6 hours
15. **LOW-03**: TF-IDF keyword scoring - 4-6 hours

---

## Testing Checklist

After fixing each bug, verify:

### CRIT-01 Fix
- [ ] Send a chat message
- [ ] Verify context assembly completes without crash
- [ ] Check `detectedTopicCount` and `detectedEntityCount` in metrics

### CRIT-03 Fix
- [ ] Create HLC with nodeId containing hyphens (e.g., `device-phone-001`)
- [ ] Parse the HLC
- [ ] Verify wallTime, counter, and nodeId are correct

### CRIT-04 Fix
- [ ] Trigger bundle invalidation
- [ ] Verify no crashes in logs
- [ ] Check `SystemAction` records in database

### HIGH-01 Fix
- [ ] Enable Qdrant
- [ ] Run semantic search for memories
- [ ] Verify Qdrant is being used (check logs)

### HIGH-02 Fix
- [ ] Run profile rollup service
- [ ] Verify no Prisma errors
- [ ] Check entity profiles are updated

### HIGH-04 Fix
- [ ] Run librarian worker
- [ ] Verify ACUs are updated
- [ ] Check `librarianProcessed` in metadata

### MED-02 Fix
- [ ] Disable Qdrant
- [ ] Run semantic search
- [ ] Verify results are ranked by similarity, not recency

### MED-03 Fix
- [ ] Set very small context budget (e.g., 2000 tokens)
- [ ] Verify all layers have at least `minTokens`

### MED-04 Fix
- [ ] Create conversation bundle
- [ ] Verify `conversationId` foreign key is set correctly

---

**Document Version:** 1.0
**Generated:** March 23, 2026
**Next Review:** After all CRITICAL and HIGH bugs are fixed
