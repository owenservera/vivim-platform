# VIVIM SOTA Implementation Plan — Atomic Task List

This file tracks the progress of advanced coding and algorithm implementations for the VIVIM Context Engine, Memory Layer, and ACU System.

## 🟢 1. Infrastructure: Vector Search & Performance
- [ ] **Database Indexing**
  - [x] Add HNSW index with `VectorCosineOps` to `atomic_chat_units(embedding)` in Prisma schema
  - [x] Add HNSW index with `VectorCosineOps` to `memories(embedding)` in Prisma schema
  - [x] Add HNSW index with `VectorCosineOps` to `topic_profiles(embedding)` in Prisma schema
  - [x] Add HNSW index with `VectorCosineOps` to `entity_profiles(embedding)` in Prisma schema
  - [ ] Run migration to apply indexes to database
- [ ] **Hybrid Search Optimization**
  - [ ] Extract RRF (Reciprocal Rank Fusion) parameters (k, weights) to environment variables
  - [ ] Implement tunable similarity thresholds per retrieval layer

## 🔵 2. Core: Precise Tokenization & Budgeting
- [x] **Server-side Tokenization**
  - [x] Integrate `js-tiktoken` library into `DynamicContextAssembler`
  - [x] Replace `length / 4` character-based estimation with actual token counts
  - [x] Verified with unit tests
- [ ] **Client-side Tokenization**
  - [ ] Implement WASM-based `tiktoken` in PWA for real-time UI feedback
  - [ ] Update `ContextVisualizer` to use precise counts
- [ ] **Budget Algorithm Refinement**
  - [ ] Implement non-linear layer "elasticity" in `BudgetAlgorithm`
  - [ ] Add "information density" weighting to truncation logic

## 🟡 3. Intelligence: ACU & Memory Quality
- [x] **ACU Quality Scorer**
  - [x] Implement `ACUQualityScorer` service (Richness, Integrity, Uniqueness)
  - [x] Integrate scorer into the extraction pipeline in `MemoryExtractionEngine`
  - [x] Fixed bug in `MemoryExtractionEngine` where memories were not being saved to DB
- [ ] **Deduplication & Conflict Resolution**
  - [ ] Implement ACU deduplication check during extraction (using embedding similarity)
  - [ ] Create `MemoryConflictService` to detect contradictory memories during consolidation
- [ ] **Advanced Extraction**
  - [ ] Replace LLM-only segmentation with hybrid rule-based (Regex/NLP) + LLM approach

## 🔴 4. Resilience: Circuit Breakers & Reliability
- [ ] **Fault Tolerance**
  - [x] Integrate `opossum` circuit breakers for all `EmbeddingService` calls
  - [ ] Wrap LLM provider calls in `unified-context-service.ts` with circuit breakers
- [ ] **Retry Mechanisms**
  - [ ] Implement exponential backoff retries for transient API failures
  - [ ] Add "Dead Letter" queue logic for memories that fail embedding generation

## 🟣 5. Consistency: Event-Driven Invalidation
- [x] **Robust Invalidation**
  - [x] Fully integrate `InvalidationService` with `ContextEventBus`
  - [x] Link `wireDefaultInvalidation` to DB dirty flags
  - [x] Fix missing emitter for `acu:processed` in `LibrarianWorker`
  - [ ] Implement versioned cache keys for `ContextBundle` to prevent race conditions
  - [ ] Fix missing emitters for `instruction:*` and `settings:updated`

## 🟠 6. Features: Context Recipes (The "Missing" System)
- [x] **Recipe Infrastructure**
  - [x] Add `ContextRecipe` model to Prisma schema
  - [ ] Implement CRUD API for Context Recipes
- [x] **Pipeline Integration**
  - [x] Update `DynamicContextAssembler` to read and apply active Recipe weights
  - [x] Implement Recipe-based layer exclusion
  - [x] Support for Recipe-based total budget overrides

---
*Last Updated: 2026-03-05*
