# VIVIM — Open Algorithms Section

## The Statement

Most AI companies treat their algorithms as crown jewels — locked, opaque, unauditable.
VIVIM treats algorithm openness as a non-negotiable part of its sovereignty promise.

**If you can't read how your AI memory works, you don't own it.**

---

## The Counter

On scroll into this section, a live counter animates from 0 to 90+ — counting up the algorithms we've built and opened.

**90+ algorithms. All open source. None hidden.**

---

## The Registry

A filterable, interactive table organized by what each algorithm does.

### Filter Categories

All · Memory · Context · Retrieval · Cryptography · Sync · Prediction · Network · SDK

### The Groups

**Context Assembly (12)**
How VIVIM builds the right context window for every single message.

- context-assembler — Orchestrates the 8-layer pipeline
- budget-algorithm — Distributes tokens across layers
- bundle-compiler — Compiles context for the AI provider
- adaptive-assembler — Dynamically adjusts based on conversation
- And 8 more...

**Memory & Classification (10)**
How raw conversation becomes structured, typed, searchable memory.

- memory-extraction — Segments conversations into ACUs
- memory-types — Classifies into 9 memory types
- consolidation — Merges related memories
- conflict-detection — Resolves duplicates across providers

**Retrieval (4)**
How VIVIM finds exactly what's relevant.

- hybrid-retrieval — Vector + keyword search
- query-optimizer — Rewrites queries for relevance

**Prediction & Prefetch (5)**
How VIVIM anticipates what you'll need.

- prediction-engine — Predicts next queries
- prefetch-engine — Pre-loads likely context

**Cryptography (4)**
How VIVIM secures identity and data.

- DID service — Decentralized identifiers
- E2E encryption — Peer-to-peer security

**Data Sync & CRDT (8)**
How VIVIM syncs across devices without conflicts.

- CRDT sync — Conflict-free merging
- Vector clocks — Causal ordering

**Network & P2P (5)**
How the peer-to-peer mesh operates.

- Peer discovery — Finding nodes
- DHT — Content routing

**SDK & Apps (14)**
The building blocks for developers.

- 14 specialized nodes and engines

**MCP Server (15)**
How VIVIM connects to AI tools.

- Multiple transports (stdio, HTTP, WebSocket, libp2p)
- Tool categories: Chat, Memory, Identity, Storage, Social

**Skills System (5)**
Extensible AI capabilities.

- Content, Memory, Research skills

**PWA Components (12)**
Frontend elements.

- Knowledge Graph, Context Visualizer, Trust Seals

---

## Visual Design

### The Counter
Large, animated number. Monospace font. Electric teal accent. Counts up from 0 on scroll.

### The Table
- Filter pills at top
- Group headers with algorithm counts
- Each row: Name (monospace, teal) | What it does | Source link | Status chip

### Animation
- Stagger reveals on scroll
- Filter transitions with opacity fades

---

## The Philosophy

Every algorithm listed here is:
- ✅ Implemented in the repository
- ✅ Open source under AGPL v3
- ✅ Available for inspection and audit

Not "open to enterprise customers." Not "available on request." Open. In the repository. Right now.

---

*Document version: 1.0*
*Purpose: Conceptual specification for Open Algorithms section*
*Last updated: March 2026*
