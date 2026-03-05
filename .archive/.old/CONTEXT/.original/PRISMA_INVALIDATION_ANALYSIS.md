# OpenScroll Context Engine: Prisma Invalidation Analysis
**Date:** February 11, 2026
**Status:** Bug Investigation (Issue: Invalid `upsert` invocation)

## 1. Problem Definition
A critical validation error occurs during the context assembly process, specifically when the `BundleCompiler` attempts to store a compiled "Identity Core" bundle.

**The Error:**
```json
Invalid `prisma.contextBundle.upsert()` invocation:
{
  where: {
    userId_bundleType_topicProfileId_entityProfileId_conversationId_personaId: {
      userId: "dev-user-001",
      bundleType: "identity_core",
      entityProfileId: null,
      conversationId: null,
      personaId: null,
+     topicProfileId: String
    }
  },
  ...
}
```

---

## 2. Root Cause Analysis

### 2.1 Unique Constraint Mismatch
The error `+ topicProfileId: String` in a Prisma `upsert` validation indicates that the field `topicProfileId` is **missing** from the unique filter object, even though it is part of the compound unique index `userId_bundleType_topicProfileId_entityProfileId_conversationId_personaId`.

### 2.2 Code-Level Failure
In `server/src/context/bundle-compiler.ts`, the `storeBundle` method attempts to normalize optional IDs to `null` to ensure the unique constraint is met:

```typescript
const normalizedTopicProfileId = topicProfileId === undefined ? null : topicProfileId;
```

However, the logic in `compileIdentityCore` was found to be passing `null` explicitly for some fields but `undefined` for others in different versions/executions, leading to inconsistent normalization.

### 2.3 The "Prisma Null Unique" Trap
Standard SQL unique constraints treat `NULL` values as distinct (i.e., `NULL != NULL`). To allow a unique constraint on multiple nullable columns where some are `null`, the database needs to support `NULLS NOT DISTINCT` (PostgreSQL 15+) or the application must ensure all fields are explicitly provided as `null` to the Prisma `upsert` call.

The validation error suggests that Prisma Client's generated types for the compound unique index strictly require all 6 fields to be present in the `where` object, even if their value is `null`.

---

## 3. Impact Assessment
1. **Context Assembly Failure:** The system crashes before it can even send a prompt to the LLM.
2. **Identity Blindness:** Since the "Identity Core" (L0) is the first layer fetched, its failure prevents the entire context pipeline from completing.
3. **Data Duplication:** If the `upsert` logic is bypassed, the system might create duplicate bundles for the same user/type, leading to "Context Bloat" where the AI sees multiple conflicting versions of the user's identity.

---

## 4. Technical Findings

### 4.1 Inconsistent `storeBundle` Calls
The `compileIdentityCore` method was explicitly passing `null` for some parameters:
```typescript
return this.storeBundle(userId, 'identity_core', compiled, {
  memoryIds: coreMemories.map(m => m.id)
}, null, null, null, null);
```
While `compileGlobalPrefs` used `undefined` (implicit):
```typescript
}, undefined, undefined, undefined, undefined);
```

### 4.2 Normalization Logic Flaw
The normalization logic:
```typescript
const normalizedTopicProfileId = topicProfileId === undefined ? null : topicProfileId;
```
...is safe for `undefined`, but the Prisma validation error indicates that the key itself might be getting stripped or the Prisma Client expects a very specific structure that is being violated by the way `storeBundle` is typed or called.

---

## 5. Repair Plan (The "Fix")

### 5.1 Enforce Explicit Nulls
Refactor `storeBundle` and all calling methods to use a unified `ContextIdentifier` interface that forces explicit definition of all 6 unique constraint components.

### 5.2 Strengthening the Normalization
Update `storeBundle` to ensure that every field in the unique index is explicitly assigned a value (either a string ID or `null`), leaving nothing to implicit `undefined` behavior.

```typescript
// Proposed fix in storeBundle
const where = {
  userId_bundleType_topicProfileId_entityProfileId_conversationId_personaId: {
    userId,
    bundleType,
    topicProfileId: topicProfileId ?? null,
    entityProfileId: entityProfileId ?? null,
    conversationId: conversationId ?? null,
    personaId: personaId ?? null
  }
};
```

### 5.3 Database Integrity
Add a check to verify that the PostgreSQL version supports `NULLS NOT DISTINCT` for the `context_bundles` unique index, or consider a "Composite Key" field (a string hash of the 6 IDs) to simplify lookups and avoid nullable unique constraint headaches.

---

## 6. Conclusion
The "major issues" reported with the context implementation are primarily due to **Prisma Type-Strictness** around compound unique indexes. By ensuring explicit `null` values for all optional ID fields, we can resolve the validation crashes and allow the context pipeline to resume operation.
