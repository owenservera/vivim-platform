# Bridge Document 2: Progressive Assembly Roadmap
**Focus:** Migrating from `context-generator.js` (Naive) to `DynamicContextAssembler.ts` (Bespoke).

## 1. The Migration Path
We cannot flip the switch instantly. We will use a **"Dual-Driver"** approach.

### Step A: The Wrapper Service
Create a `UnifiedContextService` that tries to call the `DynamicContextAssembler` (TS). If it fails (due to missing bundles or errors), it falls back to the `context-generator.js` (JS) to ensure the UI doesn't break.

### Step B: Layer Negotiation Logic
The `BudgetAlgorithm` from `dynamic-context-design-algo.md` must be the primary controller. 
*   **The Problem:** Currently, `context-generator.js` just takes 10 messages. 
*   **The Fix:** Implement the `elasticity` logic where if a user has a massive "Topic" context (L2), we shrink the "History" (L6) slightly to maintain the 12k token limit.

---

## 2. Implementing "Progressive Compaction"
Instead of a simple window, we implement the `ConversationContextEngine`.

1.  **Zone A (Ancient):** Messages 1 to (N-20). Compress using `glmt-4.7` into a 500-token summary.
2.  **Zone B (Recent):** Messages (N-20) to N. Keep as raw ACUs.
3.  **Result:** The AI retains "Contextual Gravity" for the start of the chat without wasting tokens.

## 3. The Token Estimator Upgrade
**Priority 1:** Replace the `SimpleTokenEstimator` (words * 1.3) with `js-tiktoken`. Accurate budgeting is the only way to prevent the "Context Overflow" errors currently plaguing the logs.
