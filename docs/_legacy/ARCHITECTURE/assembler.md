---
sidebar_position: 2
title: Dynamic Context Assembler
---

# Dynamic Context Assembler

The `DynamicContextAssembler` acts as the neural coordinator. While the Pipeline controls *how* data flows, the Assembler controls *what* flows. 

## The Context Aggregator

The Assembler fetches information based on parameters passed down from `ParallelContextPipeline`.

### Hybrid Retrieval
Using the `HybridRetrievalService`, VIVIM fetches:
1. **Semantic Topic Matches**: Comparing message vectors against configured/known topics.
2. **Entity Match Links**: Identifying mentions of specific User or App entities (e.g., explicit matching).
3. **Recent Memories**: Scanning recent user ACUs and logs.
4. **Current Conversation Context**: Ensuring continuity.

### Token Budget Protocol
A problem in Large Language Models is the rigid window size limit. Over-fetching crashes the query; under-fetching neuters the intelligence.

`DynamicContextAssembler.computeBudget` manages this systematically:
- Truncates individual strings dynamically using `truncateToTokens`.
- Calculates prompt boundaries based on Model capacities.
- Drops properties that have lower semantic relevance priority.

---

### Implementation Example

The underlying code flow:
1. **Detect Context:** `detectMessageContext` identifies relevant Topics and Entities based on the user's latest message vector.
2. **Gather Bundles:** `gatherBundles` iteratively fetches (or retrieves compiled cache of) all `CompiledBundle` slices corresponding to the identities.
3. **Compile Final Prompt:** Combines all bundles and just-in-time (`jitRetrieve`) data sequentially under budget limits.
