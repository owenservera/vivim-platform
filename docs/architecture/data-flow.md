---
title: "Data Flow"
description: "How data moves through VIVIM: ingestion from AI providers, context assembly for retrieval, and the complete query lifecycle."
---

# Data Flow

Understanding how data moves through VIVIM is key to using it effectively. This page covers the two primary data flows: ingestion and retrieval.

## Ingestion flow

When you converse with an AI provider through VIVIM, your conversation flows through a multi-stage pipeline:

```
User Message → Provider API → Response → Normalization → ACU Extraction
     → Classification → Embedding → Graph Linking → Store
```



1. **Provider API call**
   Your query is sent to the AI provider (OpenAI, Anthropic, Google, etc.) through VIVIM's proxy layer. The provider never sees VIVIM — it sees a standard API call.

  
2. **Response capture**
   The full conversation — your message and the AI's response — is captured and normalized into VIVIM's internal format.

  
3. **Normalization**
   Provider-specific response formats are normalized into a unified conversation structure with consistent metadata (timestamps, model, token counts).

  
4. **ACU extraction**
   The extraction pipeline analyzes the conversation and identifies Atomic Context Units — facts, preferences, goals, identity markers, and conventions.

  
5. **Classification**
   Each ACU is classified into one of 9 memory types (episodic, semantic, procedural, factual, preference, identity, relationship, goal, project).

  
6. **Embedding**
   ACUs are embedded into vector space using configurable embedding models, enabling semantic similarity search across all memories.

  
7. **Graph linking**
   New ACUs are linked to existing memories in the knowledge graph based on semantic similarity, temporal proximity, and shared context.

  
8. **Encrypted storage**
   All data — raw conversations and extracted ACUs — is encrypted client-side and stored in the memory database.


## Retrieval flow

When you ask an AI a question through VIVIM, the retrieval flow assembles a rich context bundle:

```
Query → Understanding → Budget Algorithm → Hybrid Retrieval
     → 8-Layer Assembly → Context Bundle → Provider API
```



9. **Query understanding**
   The context engine analyzes your query to determine intent, required context types, and relevant memory scopes.

  
10. **Budget allocation**
   The budget algorithm distributes the available context window across the 8 layers (L0-L7) based on query type and provider token limits.

  
11. **Hybrid retrieval**
   For each layer, ACUs are retrieved using three complementary strategies:
    - **BM25** — Keyword-based full-text search
    - **Vector similarity** — Semantic search via embeddings
    - **Graph traversal** — Related memories via knowledge graph edges

  
12. **Thermodynamic scoring**
   Retrieved memories are scored using decay and promotion algorithms. Recent, frequently used memories rank higher; stale memories fade.

  
13. **Layer assembly**
   The top-scoring memories for each layer are assembled into the context bundle, respecting per-layer token budgets.

  
14. **Context injection**
   The assembled context bundle is injected as system context into the provider API call, giving the AI a rich understanding of who you are and what you need.

  
15. **Response**
   The AI responds with full context, producing more relevant, personalized, and consistent answers.


## Context engine pipeline

The complete pipeline in detail:

```
┌─────────────────────────────────────────────────────┐
│              Data Flow Pipeline                      │
├─────────────────────────────────────────────────────┤
│                                                      │
│  INGESTION                                          │
│  User → Provider → Capture → Normalize → Extract    │
│       → Classify → Embed → Link → Store             │
│                                                      │
│  RETRIEVAL                                          │
│  Query → Understand → Budget → Retrieve → Score     │
│        → Assemble → Inject → Respond                │
│                                                      │
│  THERMODYNAMICS (continuous)                        │
│  Decay → Promote → Reinforce → Revive               │
│                                                      │
└─────────────────────────────────────────────────────┘
```

## Provider import

VIVIM can also import existing conversations from providers without going through the live proxy:

| Provider | Import Method | Parser |
|---|---|---|
| **ChatGPT** | Data export ZIP | HTML + JSON parser |
| **Claude** | Conversation export | JSON parser |
| **Gemini** | Google Takeout | Activity parser |
| **Grok** | Export API | JSON parser |
| **DeepSeek** | Export | Conversation parser |


::: info
Imported conversations go through the same extraction, classification, and embedding pipeline as live conversations. The quality of extracted memories depends on conversation content, not import method.
:::



::: tip
For the complete data context flow specification, see the [DATA_CONTEXT_FLOW.md](https://github.com/owenservera/vivim-platform/tree/main/vivim-docs/01-PLATFORM/architecture) in the repository.
:::

