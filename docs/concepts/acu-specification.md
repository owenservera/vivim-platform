itle: "ACU Specification"
description: "Atomic Context Units are the canonical building blocks of VIVIM's memory system. Learn the spec, states, and extraction process."
---

# ACU Specification

Atomic Context Units (ACUs) are the canonical building blocks of VIVIM's memory system. Every AI conversation is decomposed into ACUs for storage, retrieval, and context assembly.

## What is an ACU?

An ACU is the smallest unit of context that retains standalone meaning. Think of it as an atomic fact, preference, goal, or piece of knowledge extracted from a conversation.

### ACU structure

Each ACU contains:

| Field | Type | Description |
|---|---|---|
| `id` | `string` | Unique identifier (UUID) |
| `content` | `string` | The extracted memory content |
| `type` | `enum` | One of 9 memory types |
| `confidence` | `number` | Extraction confidence (0-1) |
| `source` | `object` | Reference to the original conversation |
| `metadata` | `object` | Timestamps, provider, user context |
| `embeddings` | `float[]` | Vector representation for semantic search |

## ACU lifecycle



1. **Extraction**
   When you converse with an AI provider, VIVIM's extraction pipeline analyzes the conversation and identifies candidate ACUs — facts, preferences, conventions, goals, and identity markers.

  
2. **Classification**
   Each ACU is classified into one of 9 memory types (episodic, semantic, procedural, factual, preference, identity, relationship, goal, project).

  
3. **Embedding**
   ACUs are embedded into vector space using configurable embedding models, enabling semantic similarity search.

  
4. **Storage**
   ACUs are stored encrypted in the memory database with full-text search indexes and graph relationships.

  
5. **Retrieval**
   During context assembly, ACUs are retrieved via hybrid search (BM25 + vector similarity + graph traversal) and assembled into layered context bundles.


## ACU actions

ACUs support a registry of actions that can be performed on them:

| Action | Purpose |
|---|---|
| `create` | Store a new ACU |
| `read` | Retrieve an ACU by ID |
| `update` | Modify ACU content or metadata |
| `delete` | Remove an ACU (soft delete with retention) |
| `link` | Create graph edges between ACUs |
| `search` | Full-text and semantic search |
| `export` | Serialize ACU to open format |
| `share` | Encrypted sharing with specific circles |

## ACU hierarchy states

ACUs exist in a three-tier hierarchy:

```
┌─────────────────────────────────┐
│       Project Memory            │  Scoped to a workspace
│    ┌──────────────────────┐     │
│    │     User Memory      │     │  Cross-project, personal
│    │  ┌──────────────┐    │     │
│    │  │ Team Memory  │    │     │  Shared, CRDT-synced
│    │  └──────────────┘    │     │
│    └──────────────────────┘     │
└─────────────────────────────────┘
```

| Level | Scope | Sync | Example |
|---|---|---|---|
| **Project** | Workspace-specific | Local | "This project uses TypeScript 5" |
| **User** | Cross-project, personal | Global | "Prefers functional components" |
| **Team** | Shared within circles | CRDT | "Team ships on Tuesdays" |

## ACU gap analysis

Current coverage across the ACU specification:

| Component | Status | Notes |
|---|---|---|
| Extraction pipeline | Live | Supports 9 providers |
| Classification engine | Live | 9 memory types |
| Embedding system | Live | Configurable models |
| Hybrid retrieval | Live | BM25 + vector + graph |
| CRDT sync | In progress | Team memory layer |
| Federation protocol | Planned | Cross-instance sharing |


::: info
ACUs are inspired by patterns from vCode (Anthropic's Claude Code architecture), adapted for web and P2P environments. See the [full ACU master specification](https://github.com/owenservera/vivim-platform/tree/main/vivim-docs/01-PLATFORM/architecture) for exhaustive details.
:::

