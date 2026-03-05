# OpenScroll Data & Context Flow: The "Implementation Gap"
**Date:** February 11, 2026
**Status:** Root Cause Analysis of Implementation Failures

## 1. The Core Conflict: Architecture vs. Reality
The deep inspection reveals a massive disconnect between the **Bespoke Context Engine** (located in `@server/src/context/*.ts`) and the **Active Production Services** (located in `@server/src/services/*.js`).

### 1.1 The Advanced Engine (The "Vision")
- **Status:** Inactive / Prototype.
- **Capabilities:** Budget-aware negotiation, multi-level compression, proactive warmup, topic/entity detection.
- **Files:** `context-assembler.ts`, `budget-algorithm.ts`, `prediction-engine.ts`.

### 1.2 The Current Services (The "Reality")
- **Status:** Active / Production.
- **Capabilities:** Naive 10-message windowing, primitive paragraph-splitting, hardcoded 'Owen' user ID.
- **Files:** `context-generator.js`, `acu-generator.js`.

---

## 2. Why it's Failing (The "Major Issues")

### 2.1 Fragmented Extraction (Low Signal-to-Noise)
The `acu-generator.js` (Prisma fallback) uses a naive paragraph-splitting strategy. This results in "Knowledge Shards" that are:
- **Too Granular:** A single sentence becomes an ACU.
- **Context-Light:** Without the Rust Core, ACUs lack the metadata needed to relate them back to broader concepts.
- **Low Quality:** The `calculateQualityScore` is a simple heuristic (length + special chars) that doesn't account for semantic value.

### 2.2 Ghost Profiles (The Empty Library)
The database contains tables for `TopicProfile` and `EntityProfile`, but **no service is currently populating them**.
- ACUs are created, but they aren't being "rolled up" into Topics or Entities.
- As a result, the "Knowledge Layers" (L2 and L3) of the context engine are always empty. The AI has "short-term memory" (the last 10 messages) but no "long-term knowledge" of the user's domains.

### 2.3 Stagnant Cache (The "Dirty" Problem)
While the schema supports `isDirty` flags, the simple `context-generator.js` doesn't implement a sophisticated invalidation logic.
- A bundle is created and cached.
- When new messages arrive, the cache is updated, but because the summarization is flat (last 10 messages), the AI loses context of anything that happened 11 messages ago.

### 2.4 Semantic Blindness (Mock Embeddings)
The `EmbeddingService` is currently set to return **mock vectors** if no API key is provided.
- **Impact:** Any `@queryRaw` semantic search (used in `context-assembler.ts`) is effectively performing a random search. 
- Even if the advanced engine were turned on, it would pull in irrelevant "Semantic Neighbors" because the embeddings don't actually represent the content.

---

## 3. Data Flow Path (Current)

1. **Capture:** Playwright/Worker captures raw HTML/JSON.
2. **Ingest:** `server.js` saves to `Conversation` and `Message` tables.
3. **Fragment:** `acu-generator.js` splits messages into hundreds of low-value `AtomicChatUnit` records.
4. **Assemble:** `context-generator.js` takes the last 10 messages, adds a title, and calls it "Context".
5. **Result:** The AI feels "stupid" because it only sees the immediate surface of the chat, despite the database being full of ACUs.

---

## 4. Opinionated POV: The "Repair Path"

### 4.1 Activate the Assembler
The most urgent task is to **bridge the gap**. The main server routes should be migrated from `context-generator.js` to `DynamicContextAssembler.ts`. This immediately enables the `BudgetAlgorithm` and better history management.

### 4.2 Implement the "Roll-up" Service
We need a `ProfileService` that periodically (or on-demand) scans ACUs and:
1. Clusters them into **Topics**.
2. Aggregates facts into **EntityProfiles**.
3. Updates the `relatedAcuIds` in `TopicProfile`.
*Without this, the Knowledge Layers remain empty.*

### 4.3 Semantic Realism
The system cannot function on mock embeddings. We must either:
- Ensure a local embedding model (e.g., Transformers.js or a local Ollama instance) is available.
- Force the use of an OpenAI/Gemini API for embeddings during the extraction phase.

### 4.4 The "Smart" ACU
Instead of splitting by paragraph, ACU generation must be **intent-based**. If a message contains a code block and an explanation, that should be *one* ACU with two parts, not two disconnected fragments.

---

## 5. Conclusion
OpenScroll currently has a **"Brain-Body Disconnect"**. The brain (Context Engine) is highly sophisticated but disconnected from the body (Data Services). The "major issues" are not a result of a bad design, but of an **incomplete integration**. 

The system is currently doing a lot of "busy work" (generating thousands of ACUs) that never actually makes it into the prompt in a meaningful way.
