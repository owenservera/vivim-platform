itle: "Context Engine"
description: "VIVIM's 8-layer context assembly engine builds intelligent context bundles for AI providers. Learn how each layer contributes to smarter AI responses."
---

# Context Engine

The Context Engine is VIVIM's core innovation — an 8-layer assembly pipeline that builds intelligent context bundles for every AI interaction.

## Overview

When you ask an AI a question, VIVIM doesn't just send your query. It assembles a rich context bundle from your entire memory graph, optimized for relevance and token efficiency.

```
Query → Budget Algorithm → 8-Layer Assembly (L0-L7) → Context Bundle → Provider API
```

## The 8 layers

| Layer | Name | Purpose | Token Budget |
|---|---|---|---|
| **L0** | Core Identity | Who you are — name, role, expertise | ~200 tokens |
| **L1** | Active Goals | Current objectives and tasks | ~400 tokens |
| **L2** | Relevant Memories | Most pertinent facts and preferences | ~2,000 tokens |
| **L3** | Project Context | Current project state and conventions | ~1,500 tokens |
| **L4** | Relationship Context | Social dynamics and team patterns | ~800 tokens |
| **L5** | Procedural Knowledge | How you work — tools, workflows, habits | ~1,000 tokens |
| **L6** | Episodic Context | Recent conversation history | ~3,000 tokens |
| **L7** | Strategic Context | Long-term patterns and meta-knowledge | ~1,000 tokens |

## How assembly works



1. **Query understanding**
   The engine analyzes your query to determine intent, required context types, and relevance scopes.

  
2. **Budget allocation**
   A budget algorithm distributes the available context window across layers based on query type and provider limits.

  
3. **Hybrid retrieval**
   Each layer queries its relevant ACUs using BM25 (keyword), vector similarity (semantic), and graph traversal (relational) search.

  
4. **Thermodynamic scoring**
   Retrieved memories are scored using decay and promotion algorithms — recent, frequently used memories rank higher.

  
5. **Layer assembly**
   Selected memories are assembled into their respective layers, respecting token budgets and relevance thresholds.

  
6. **Context bundle**
   The complete bundle is serialized and sent to the AI provider as enriched system context.


## Prediction and prefetch

The engine includes a prediction subsystem that anticipates likely next queries and prefetches relevant context:

| Feature | Description |
|---|---|
| **Pattern recognition** | Identifies recurring query patterns and session flows |
| **Prefetch cache** | Warms likely-needed ACUs before they're requested |
| **JIT retrieval** | Just-in-time loading for unpredictable queries |
| **Staleness detection** | Invalidates cached context when underlying data changes |

## Thermodynamics

VIVIM uses a thermodynamic model for memory relevance:

- **Decay** — Memories naturally fade if unused over time
- **Promotion** — Frequently accessed memories gain prominence
- **Reinforcement** — Repeated similar memories merge into stronger signals
- **Revival** — Dormant memories can be reactivated by relevant queries


::: warning
The context engine operates within provider token limits. The budget algorithm optimizes for maximum relevance within these constraints. Overfilling layers causes truncation.
:::


## Algorithm details

The context engine pipeline:

```
┌─────────────────────────────────────────────────────┐
│              Context Engine Pipeline                 │
├─────────────────────────────────────────────────────┤
│                                                      │
│  Query Input                                         │
│       │                                              │
│       ▼                                              │
│  ┌──────────────────┐                               │
│  │ Budget Algorithm │ ← Provider limits, query type │
│  └────────┬─────────┘                               │
│           │                                          │
│           ▼                                          │
│  ┌──────────────────┐                               │
│  │  Assemble L0-L7  │ ← Hybrid retrieval per layer  │
│  └────────┬─────────┘                               │
│           │                                          │
│           ▼                                          │
│  ┌──────────────────┐                               │
│  │ JIT Retrieval    │ ← On-demand loading           │
│  └────────┬─────────┘                               │
│           │                                          │
│           ▼                                          │
│  ┌──────────────────┐                               │
│  │ Predict/Prefetch │ ← Anticipate next queries     │
│  └────────┬─────────┘                               │
│           │                                          │
│           ▼                                          │
│  ┌──────────────────┐                               │
│  │ Thermodynamics   │ ← Decay, promote, reinforce   │
│  └────────┬─────────┘                               │
│           │                                          │
│           ▼                                          │
│  Context Bundle → Provider API                       │
│                                                      │
└─────────────────────────────────────────────────────┘
```


::: tip
For implementation details, see the [Context Engine Algorithms](https://github.com/owenservera/vivim-platform/tree/main/vivim-docs/01-PLATFORM/architecture) documentation in the repository.
:::

