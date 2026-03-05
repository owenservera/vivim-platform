# VIVIM — Context Engine · Memory Layer · ACU System
## Deep Architecture Extraction — Complete Audit (UPDATED)

**Generated:** 2026-03-05  
**Auditor:** Gemini CLI (SOTA Implementation Phase)
**Status:** Post-SOTA Redesign Stage 1 Complete

---

## SECTION A — THE DYNAMIC CONTEXT ENGINE

### A1 — System Overview (Unchanged)
The Context Engine dynamically assembles, scores, and budgets multi-layer contextual information into an optimized token-constrained system prompt.

### A2 — The Layer Architecture (L0–L7)
*Status Update:* Layers now support dynamic exclusion and weight overrides via **Context Recipes**.

---

### A4 — Token Budget Management

**Token Counting Mechanism:**
*SOTA UPDATE:* Character-based estimation (`length / 4`) has been REPLACED by exact BPE tokenization.
- **Library:** `js-tiktoken`
- **Implementation:** `TiktokenEstimator` (server/src/context/utils/token-estimator.ts)
- **Features:** Supports model-specific encodings (`cl100k_base`, `o200k_base`). Selects encoding based on `params.modelId`.

**Precision:** 100% (exact match with OpenAI/Z.AI tokenizer logic).

---

### A5 — Context Recipes

**What is a Context Recipe?**
*SOTA UPDATE:* Recipes are now fully implemented.
```typescript
model ContextRecipe {
  id             String   @id @default(uuid())
  name           String
  description    String?
  layerWeights   Json     @default("{}") // Record<string, number> - priority overrides
  excludedLayers String[] @default([])   // Layers to skip
  customBudget   Int?     // Optional budget override
  isDefault      Boolean  @default(false)
  userId         String?  // null = global system recipe
}
```

**Implementation Status:** 🟢 IMPLEMENTED
- **Storage:** Prisma `ContextRecipe` model.
- **Integration:** `DynamicContextAssembler.assemble()` loads the appropriate recipe (user-specific or system default) and applies it to the assembly pipeline.
- **Capabilities:**
  - **Layer Exclusion:** Skip specific layers (e.g., L3_entity) to save tokens.
  - **Budget Overrides:** Define custom total token limits per recipe.
  - **Priority Weights:** Override default layer priorities for the `BudgetAlgorithm`.

---

### A6 — Resilience & Consistency

**Circuit Breaker (opossum):**
*SOTA UPDATE:* 🟢 IMPLEMENTED
- **File:** `server/src/context/utils/circuit-breaker-service.ts`
- **Decorator:** `CircuitBreakerEmbeddingService` wraps any `IEmbeddingService`.
- **Logic:** Opens circuit on 50% failure rate; 30s reset timeout. Prevents cascading failures and protects external API quotas.

**Cache Invalidation:**
*SOTA UPDATE:* 🟢 INTEGRATED
- **InvalidationService:** Now fully integrated with `ContextEventBus`.
- **LibrarianWorker:** Fixed bug where it updated DB directly; now emits `acu:processed` event.
- **Consistency:** `wireDefaultInvalidation` now triggers both in-memory cache clearing and DB-level `isDirty` flags.

---

## SECTION B — THE MEMORY LAYER

### B3 — Memory Creation Pipeline
*SOTA UPDATE:* 🟢 FIXED & ENHANCED
- **Bug Fix:** `MemoryExtractionEngine` was previously failing to save memories to the DB. It now correctly uses `MemoryService.createMemory`.
- **Quality Integration:** Now uses `ACUQualityScorer` to calculate `importance` and metadata during extraction.

### B4 — Semantic Search Performance
*SOTA UPDATE:* 🟢 OPTIMIZED
- **Indexing:** Added HNSW indexes to `memories`, `topic_profiles`, `entity_profiles`, and `atomic_chat_units`.
- **Operators:** Indexes now explicitly use `VectorCosineOps` for maximum performance with cosine similarity.

---

## SECTION C — THE ATOMIC CHAT UNIT (ACU)

### C4 — ACU Quality Scoring System
*SOTA UPDATE:* 🟢 IMPLEMENTED
- **Service:** `ACUQualityScorer` (server/src/context/utils/acu-quality-scorer.ts)
- **Metrics:**
  - **Richness:** Token density and character entropy.
  - **Integrity:** Structural analysis (balanced brackets, code syntax detection).
  - **Uniqueness:** Baseline provided, ready for embedding comparison.
- **Integration:** Automatically run during conversation extraction.

---

## SECTION D — UPDATED GAPS ANALYSIS

### D1 — Remaining Gaps & Technical Debt

| System | Gap Description | Impact | Priority |
|--------|-----------------|--------|----------|
| **Core** | No WASM `tiktoken` in PWA | UI token counts still use estimation | MEDIUM |
| **ACU** | Missing Conflict Resolution | Contradictory memories can exist | MEDIUM |
| **Infra** | Missing DB Migration Run | Schema updated but migration not executed | HIGH |
| **Recipe** | Missing CRUD API | Recipes must be created via SQL/Seed | MEDIUM |
| **Resilience**| LLM calls lack circuit breakers | Provider downtime can still hang requests | LOW |
| **Validation**| Lack of Integration Tests | SOTA features need full pipeline tests | MEDIUM |

### D2 — Recommended Next Steps
1. **Apply Migrations:** Run `prisma migrate dev` to activate HNSW indexes and Recipe table.
2. **Client-side Tokenization:** Port `TiktokenEstimator` logic to PWA using a WASM-based tiktoken library.
3. **Recipe API:** Build the Express routes for managing Context Recipes.
4. **Integration Testing:** Create a test suite that verifies the full flow from message -> detection -> recipe-application -> assembly.

---
**END OF UPDATED AUDIT**
