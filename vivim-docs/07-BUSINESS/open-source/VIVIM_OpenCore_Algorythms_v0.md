VIVIM — Open Algorithms Section
## Website Addition: "Every Algorithm, Open Forever"

> **File purpose:** A standalone section that slots into vivim.live — either as a sub-section
> of the Open Core page OR as its own anchor `#open-algorithms`.
> It lists every algorithm VIVIM has built, grouped by what it does, 
> with design directives for scroll-reveal and interactive exploration.
> Written to be AI-implementable end-to-end.

---

## Design Philosophy for This Section

**The statement to make:**
Most AI companies treat their algorithms as crown jewels — locked, opaque, unauditable.
VIVIM treats algorithm openness as a non-negotiable part of its sovereignty promise.
If you can't read how your AI memory works, you don't own it.

**Tone:** Declarative. Confident without arrogance.
The headline should feel like a founding principle being carved into stone —
not a feature announcement.

**Visual identity for this section:**
- Background: a subtle dark-shifted version of the site's primary background
  (not fully inverted — just noticeably cooler and denser than surrounding sections)
- Accent color: a single neon-adjacent cool white or electric teal, used only for
  algorithm names in the interactive table — everything else stays in the site's
  existing palette
- Typography: algorithm names in monospace (`font-family: monospace`).
  Everything else inherits the site's type stack.
- No icons on individual algorithm rows — the names speak for themselves

**Unforgettable element:**
A live counter at the top of the section:
```
90+ algorithms. All open source. None hidden.
```
The number counts up from 0 on scroll-enter using a fast easing (600ms total).
This is the only animation in the section — everything else is static.
The counter is the visual punchline.

---

## Section Anchor

```
[VISUAL DIRECTIVE]
Section entry: thin 1px horizontal rule, same style as the Open Core entry divider.
Pill badge reading "Open Algorithms" in monospace, bordered, with a small 
code-bracket icon: `{ }` — reinforces the "read the code" thesis.
```

**Anchor ID:** `#open-algorithms`

---

## Section 1 — The Declaration

### Headline
```
Every algorithm.
Open source.
No exceptions.
```

### Sub-headline (secondary color, normal weight)
```
If you can't read how your AI memory works, 
you don't own it.
```

### Body paragraph
```
VIVIM has built 90+ algorithms across context assembly, memory retrieval,
decay modeling, cryptographic identity, data synchronization,
prediction, compression, network infrastructure, MCP server, skills system,
and PWA components.

Every single one is open source under AGPL v3.

Not "open to enterprise customers."
Not "available on request."
Not "documented but not published."

Open. In the repository. Right now.
```

```
[VISUAL DIRECTIVE]
Single column, max-width 680px, left-aligned.
The headline is large — 44-48px display weight, letter-spacing -0.02em.
Line breaks are intentional — respect them as written.

Below the body paragraph, a single CTA in monospace style:
  [ View the repository → github.com/owenservera/vivim ]

Then: the live counter in large type, centered, beneath a quiet horizontal rule:
  
  ┌──────────────────────────────────────────────────────┐
  │                                                      │
  │        90+ algorithms. All open source.              │
  │                                                      │
  └──────────────────────────────────────────────────────┘

Counter style: the number "90+" renders large (~64px), 
monospace, accent color.
"algorithms. All open source." is normal weight, secondary color, ~18px.
The entire counter block has a quiet thin border and generous padding.
It should feel like a stat card, not a callout box.
Animate the "90+" counting up from 0 on scroll-enter (600ms, ease-out).
```

---

## Section 2 — Algorithm Registry

### Sub-section label
```
The complete algorithm registry
```

### Intro line
```
Grouped by what they do. Every entry links to source.
```

---

### HOW TO RENDER THIS REGISTRY

```
[VISUAL DIRECTIVE — CRITICAL]

The registry is an interactive filterable table.
Default state: all groups visible, collapsed by group header.
Click a group header → expands to show algorithm rows.
All groups open on load for the "All" filter.

Filter pills at the top (horizontal row):
  [ All ]  [ Memory ]  [ Context ]  [ Retrieval ]  [ Cryptography ]  
  [ Sync ]  [ Prediction ]  [ Compression ]  [ Network ]  [ SDK ]

Active filter: pill fills with the accent color.
On filter select: non-matching group sections fade (opacity 0.3), 
matching groups stay full opacity. Smooth 200ms transition.

Table rows — each algorithm has exactly 4 columns:
  1. Name       — monospace, accent color, 14px
  2. What it does — normal weight, secondary color, 14px, max 1 line
  3. Source file  — monospace, muted (tertiary color), 12px
  4. Status      — pill chip: "Live" (teal) or "Planned" (amber)

Row hover: subtle background shift (secondary surface color).
Each row is a link — clicking opens the source file on GitHub in a new tab.
On mobile: collapse columns 3 and 4. Name + description only.
Tap to expand full row.

Group headers: 
  - Left-aligned, bold, 13px, all-caps, letter-spacing 0.08em
  - A count chip to the right: "12 algorithms"
  - A chevron (▶ collapsed / ▼ expanded)
  - Clicking toggles the group

Opening state: all groups expanded on desktop, all collapsed on mobile.
```

---

### GROUP 1 — Context Assembly

**Group label:** `CONTEXT ASSEMBLY`
**Count:** 12 algorithms
**One-line description:** *How VIVIM builds the right context window for every single message*

| Algorithm | What it does | Source file | Status |
|-----------|-------------|-------------|--------|
| `context-assembler` | Orchestrates the full 8-layer L0→L7 assembly pipeline | `server/src/context/context-assembler.ts` | Live |
| `budget-algorithm` | Distributes token budget across layers based on conversation state | `server/src/context/budget-algorithm.ts` | Live |
| `bundle-compiler` | Compiles optimised context bundles for delivery to the AI provider | `server/src/context/bundle-compiler.ts` | Live |
| `bundle-differ` | Detects the delta between two context bundles — sends only what changed | `server/src/context/bundle-differ.ts` | Live |
| `context-graph` | Maintains a live graph of relationships between ACUs and active entities | `server/src/context/context-graph.ts` | Live |
| `context-orchestrator` | Coordinates multiple context pipelines and resolves priority conflicts | `server/src/context/context-orchestrator.ts` | Live |
| `conversation-context-engine` | Generates context for specific conversation threads and message chains | `server/src/context/conversation-context-engine.ts` | Live |
| `context-pipeline` | Manages the end-to-end pipeline for context assembly and delivery | `server/src/context/context-pipeline.ts` | Live |
| `context-cache` | Caches compiled context bundles to avoid redundant assembly | `server/src/context/context-cache.ts` | Live |
| `adaptive-assembler` (Cortex) | Dynamically reassembles context based on detected conversational situation | `server/src/context/cortex/adaptive-assembler.ts` | Live |
| `situation-detector` (Cortex) | Classifies the current conversational situation to inform assembly strategy | `server/src/context/cortex/situation-detector.ts` | Live |
| `librarian-worker` | Background worker that continuously reorganises and optimises the ACU store | `server/src/context/librarian-worker.ts` | Live |

---

### GROUP 2 — Memory & Classification

**Group label:** `MEMORY & CLASSIFICATION`
**Count:** 10 algorithms
**One-line description:** *How raw conversation turns become structured, typed, searchable memory*

| Algorithm | What it does | Source file | Status |
|-----------|-------------|-------------|--------|
| `memory-extraction-engine` | Segments raw conversation turns into individually addressable ACUs | `server/src/context/memory/memory-extraction-engine.ts` | Live |
| `memory-types` classifier | Assigns each ACU to one of 9 memory types (Episodic, Semantic, Procedural, Factual, Preference, Identity, Relationship, Goal, Project) | `server/src/context/memory/memory-types.ts` | Live |
| `memory-service` | Core service for memory CRUD operations and lifecycle management | `server/src/context/memory/memory-service.ts` | Live |
| `memory-retrieval-service` | Handles memory lookup and retrieval based on query parameters | `server/src/context/memory/memory-retrieval-service.ts` | Live |
| `memory-consolidation-service` | Merges related memories and reduces redundancy in storage | `server/src/context/memory/memory-consolidation-service.ts` | Live |
| `acu-memory-pipeline` | End-to-end pipeline from raw import to stored, indexed, embedded ACU | `server/src/services/acu-memory-pipeline.ts` | Live |
| `memory-conflict-detection` | Detects and resolves conflicts when the same memory arrives from multiple providers | `server/src/services/memory-conflict-detection.ts` | Live |
| `acu-deduplication-service` | Deduplicates ACUs across providers — same memory, different source | `server/src/services/acu-deduplication-service.ts` | Live |
| `page-index-service` | Indexes imported content for fast full-text and semantic search | `server/src/services/page-index-service.ts` | Live |
| `profile-rollup-service` | Aggregates user profile data from multiple sources into unified identity | `server/src/services/profile-rollup-service.ts` | Live |

---

### GROUP 3 — Retrieval

**Group label:** `RETRIEVAL`
**Count:** 4 algorithms
**One-line description:** *How VIVIM finds exactly what's relevant — and nothing that isn't*

| Algorithm | What it does | Source file | Status |
|-----------|-------------|-------------|--------|
| `hybrid-retrieval` | Combines vector similarity search with keyword matching for JIT context assembly | `server/src/context/hybrid-retrieval.ts` | Live |
| `query-optimizer` | Rewrites and optimises retrieval queries for latency and relevance before execution | `server/src/context/query-optimizer.ts` | Live |
| `context-cache` | Caches retrieval results to avoid redundant database lookups | `server/src/context/context-cache.ts` | Live |
| `extraction/strategies` | Multiple extraction strategies for different conversation structures and provider formats | `server/src/services/extraction/strategies/base-strategy.ts` | Live |

---

### GROUP 4 — Memory Thermodynamics & Decay

**Group label:** `MEMORY THERMODYNAMICS`
**Count:** 4 algorithms
**One-line description:** *How memories age, strengthen, fade, and get reactivated over time*

| Algorithm | What it does | Source file | Status |
|-----------|-------------|-------------|--------|
| `context-thermodynamics` | Full thermodynamic model — memory temperature, entropy, decay rate, and reactivation triggers | `server/src/context/context-thermodynamics.ts` | Live |
| `memory-compression` (Cortex) | Compresses cold, low-decay memories without destroying their semantic content | `server/src/context/cortex/memory-compression.ts` | Live |
| `crdt-schema` | CRDT data schemas enabling conflict-free memory merges across devices and time | `sdk/src/core/crdt-schema.ts` | Live |
| `l0-storage` | Core L0 storage abstraction for immutable data persistence | `sdk/src/core/l0-storage.ts` | Live |

---

### GROUP 5 — Prediction & Prefetch

**Group label:** `PREDICTION & PREFETCH`
**Count:** 5 algorithms
**One-line description:** *How VIVIM anticipates what you'll need before you ask*

| Algorithm | What it does | Source file | Status |
|-----------|-------------|-------------|--------|
| `prefetch-engine` | Pre-assembles context for the predicted next queries before they're made | `server/src/context/prefetch-engine.ts` | Live |
| `prediction-engine` | Predicts next user interactions based on conversation patterns and presence | `server/src/context/prediction-engine.ts` | Live |
| `adaptive-prediction` | Self-improving prediction engine that learns from usage patterns and feedback | `server/src/context/adaptive-prediction.ts` | Live |
| `context-warmup-worker` | Background worker that pre-warms context cache based on predicted needs | `server/src/services/context-warmup-worker.ts` | Live |
| `tier-orchestrator` | Orchestrates data tier transitions (Hot→Warm→Cold→Archive) based on access patterns | `server/src/services/tier-orchestrator.ts` | Live |

---

### GROUP 6 — Cryptography & Identity

**Group label:** `CRYPTOGRAPHY & IDENTITY`
**Count:** 4 algorithms
**One-line description:** *How VIVIM secures identity and enables self-sovereign data ownership*

| Algorithm | What it does | Source file | Status |
|-----------|-------------|-------------|--------|
| `vivim-identity-service` | Manages VIVIM's self-sovereign identity system and system prompts | `server/src/context/vivim-identity-service.ts` | Live |
| `identity-service` | Handles user identity creation, authentication, and profile management | `server/src/services/identity-service.ts` | Live |
| `E2EEncryption` | End-to-end encryption for secure data transmission between peers | `network/src/security/E2EEncryption.ts` | Live |
| `KeyManager` | Manages cryptographic keys for identity and data encryption | `network/src/security/KeyManager.ts` | Live |

---

### GROUP 7 — Data Sync & CRDT

**Group label:** `DATA SYNC & CRDT`
**Count:** 8 algorithms
**One-line description:** *How VIVIM achieves conflict-free synchronization across devices*

| Algorithm | What it does | Source file | Status |
|-----------|-------------|-------------|--------|
| `CRDTSyncService` | Core service coordinating CRDT-based state synchronization | `network/src/crdt/CRDTSyncService.ts` | Live |
| `Libp2pYjsProvider` | Y.js CRDT provider over libp2p for peer-to-peer state sync | `network/src/crdt/Libp2pYjsProvider.ts` | Live |
| `ConversationCRDT` | CRDT implementation for conflict-free conversation state | `network/src/crdt/ConversationCRDT.ts` | Live |
| `CircleCRDT` | CRDT for circle/membership data with conflict resolution | `network/src/crdt/CircleCRDT.ts` | Live |
| `VectorClock` | Vector clock implementation for causal ordering in distributed systems | `network/src/crdt/VectorClock.ts` | Live |
| `GossipSync` | Gossip protocol implementation for efficient data propagation | `network/src/chain/GossipSync.ts` | Live |
| `ChainDHT` | Distributed hash table for peer lookup and content discovery | `network/src/chain/ChainDHT.ts` | Live |
| `EventStore` | Persistent event store for audit trails and state reconstruction | `network/src/chain/EventStore.ts` | Live |

---

### GROUP 8 — Network & P2P

**Group label:** `NETWORK & P2P`
**Count:** 5 algorithms
**One-line description:** *How VIVIM builds and maintains its decentralized peer-to-peer mesh*

| Algorithm | What it does | Source file | Status |
|-----------|-------------|-------------|--------|
| `NetworkNode` | Core P2P network node implementation for peer communication | `network/src/p2p/NetworkNode.ts` | Live |
| `PeerDiscovery` | Discovers and maintains list of available peers in the network | `network/src/p2p/PeerDiscovery.ts` | Live |
| `ConnectionManager` | Manages WebRTC and WebSocket connections to peers | `network/src/p2p/ConnectionManager.ts` | Live |
| `DHTService` | Distributed hash table service for content routing and lookup | `network/src/dht/DHTService.ts` | Live |
| `ContentRegistry` | Registry for discovering and advertising available content | `network/src/dht/ContentRegistry.ts` | Live |

---

### GROUP 9 — SDK Nodes & Apps

**Group label:** `SDK NODES & APPS`
**Count:** 14 algorithms
**One-line description:** *The building blocks for developers to extend and integrate with VIVIM*

| Algorithm | What it does | Source file | Status |
|-----------|-------------|-------------|--------|
| `ai-chat-node` | Node for AI-powered chat interactions and conversation handling | `sdk/src/nodes/ai-chat-node.ts` | Live |
| `identity-node` | Node for self-sovereign identity and authentication | `sdk/src/nodes/identity-node.ts` | Live |
| `storage-node` | Node for distributed storage operations and data management | `sdk/src/nodes/storage-node.ts` | Live |
| `memory-node` | Node for memory operations and ACU management | `sdk/src/nodes/memory-node.ts` | Live |
| `social-node` | Node for social graph and relationship management | `sdk/src/nodes/social-node.ts` | Live |
| `content-node` | Node for content ingestion and processing | `sdk/src/nodes/content-node.ts` | Live |
| `assistant-engine` | Engine for autonomous assistant behavior and tool execution | `sdk/src/apps/assistant-engine/index.ts` | Live |
| `circle-engine` | Engine for social circle management and collaboration | `sdk/src/apps/circle-engine/index.ts` | Live |
| `omni-feed` | Engine for aggregated feed generation from multiple sources | `sdk/src/apps/omni-feed/index.ts` | Live |
| `crypto-engine` | Engine for cryptographic operations and key management | `sdk/src/apps/crypto-engine/index.ts` | Live |
| `tool-engine` | Engine for tool registration, discovery, and execution | `sdk/src/apps/tool-engine/index.ts` | Live |
| `roadmap-engine` | Engine for project roadmap planning and tracking | `sdk/src/apps/roadmap-engine/index.ts` | Live |
| `publishing-agent` | Agent for content publishing and distribution | `sdk/src/apps/publishing-agent/index.ts` | Live |
| `ai-git` | AI-powered git assistant for version control operations | `sdk/src/apps/ai-git/index.ts` | Live |

---

### GROUP 10 — MCP Server & Tools

**Group label:** `MCP SERVER & TOOLS`
**Count:** 15 algorithms
**One-line description:** *Model Context Protocol implementation for VIVIM integration with external AI clients*

| Algorithm | What it does | Source file | Status |
|-----------|-------------|-------------|--------|
| `mcp-server` | Core MCP server implementation | `sdk/src/mcp/server.ts` | Live |
| `mcp-registry` | Tool registry for MCP | `sdk/src/mcp/registry.ts` | Live |
| `mcp-transport-stdio` | Standard I/O transport for MCP | `sdk/src/mcp/transports/stdio.ts` | Live |
| `mcp-transport-http` | HTTP transport for MCP | `sdk/src/mcp/transports/http.ts` | Live |
| `mcp-transport-websocket` | WebSocket transport for MCP | `sdk/src/mcp/transports/websocket.ts` | Live |
| `mcp-transport-libp2p` | LibP2P transport for MCP | `sdk/src/mcp/transports/libp2p-transport.ts` | Live |
| `mcp-transport-chunked` | Chunked transfer encoding | `sdk/src/mcp/transports/chunked-transfer.ts` | Live |
| `mcp-transport-streamable` | Streamable transport | `sdk/src/mcp/transports/streamable.ts` | Live |
| `mcp-tools-chat` | Chat-related MCP tools | `sdk/src/mcp/tools/chat.ts` | Live |
| `mcp-tools-memory` | Memory-related MCP tools | `sdk/src/mcp/tools/memory.ts` | Live |
| `mcp-tools-identity` | Identity-related MCP tools | `sdk/src/mcp/tools/identity.ts` | Live |
| `mcp-tools-content` | Content-related MCP tools | `sdk/src/mcp/tools/content.ts` | Live |
| `mcp-tools-storage` | Storage-related MCP tools | `sdk/src/mcp/tools/storage.ts` | Live |
| `mcp-tools-social` | Social-related MCP tools | `sdk/src/mcp/tools/social.ts` | Live |
| `mcp-base-transport` | Base transport abstraction | `sdk/src/mcp/transports/base-transport.ts` | Live |

---

### GROUP 11 — Skills System

**Group label:** `SKILLS SYSTEM`
**Count:** 5 algorithms
**One-line description:** *Extensible skill system for AI capabilities*

| Algorithm | What it does | Source file | Status |
|-----------|-------------|-------------|--------|
| `skills-registry` | Skill discovery and registration | `sdk/src/skills/registry.ts` | Live |
| `skills-types` | Type definitions for skills | `sdk/src/skills/types.ts` | Live |
| `skills-content` | Content processing skill | `sdk/src/skills/content/index.ts` | Live |
| `skills-memory` | Memory-related skills | `sdk/src/skills/memory/index.ts` | Live |
| `skills-research` | Research and analysis skills | `sdk/src/skills/research/index.ts` | Live |

---

### GROUP 12 — PWA Components

**Group label:** `PWA COMPONENTS`
**Count:** 12 algorithms
**One-line description:** *Frontend components for the VIVIM PWA*

| Algorithm | What it does | Source file | Status |
|-----------|-------------|-------------|--------|
| `KnowledgeGraph` | Knowledge graph visualization | `pwa/src/components/sovereignty/KnowledgeGraph.tsx` | Live |
| `Sentinel` | Sentinel monitoring system | `pwa/src/components/sovereignty/Sentinel.tsx` | Live |
| `TrustSeal` | Trust seal verification display | `pwa/src/components/sovereignty/TrustSeal.tsx` | Live |
| `DAGMaterializer` | DAG materialization engine | `pwa/src/components/sovereignty/DAGMaterializer.tsx` | Live |
| `Totem` | Totem identity system | `pwa/src/components/sovereignty/Totem.tsx` | Live |
| `option-list` | Option list UI component | `pwa/src/components/tool-ui/option-list/option-list.tsx` | Live |
| `approval-card` | Approval card UI component | `pwa/src/components/tool-ui/approval-card/approval-card.tsx` | Live |
| `data-table` | Data table UI component | `pwa/src/components/tool-ui/data-table/data-table.tsx` | Live |
| `link-preview` | Link preview UI component | `pwa/src/components/tool-ui/link-preview/link-preview.tsx` | Live |
| `recommendation-engine` | Content recommendation engine | `pwa/src/components/recommendation/RecommendationsList.tsx` | Live |
| `ShareMenu` | Sharing menu component | `pwa/src/components/ShareMenu.tsx` | Live |
| `ContextVisualizer` | Real-time context visualization | `pwa/src/components/ContextVisualizer.tsx` | Live |

---

## Summary

**Total:** 90+ algorithms across 12 functional groups

| Group | Count | Focus Area |
|-------|-------|------------|
| Context Assembly | 12 | Building context windows for AI |
| Memory & Classification | 10 | Turning raw data into memory |
| Retrieval | 4 | Finding relevant information |
| Memory Thermodynamics | 4 | Memory aging and compression |
| Prediction & Prefetch | 5 | Anticipating user needs |
| Cryptography & Identity | 4 | Security and identity |
| Data Sync & CRDT | 8 | Distributed data consistency |
| Network & P2P | 5 | Peer-to-peer infrastructure |
| SDK Nodes & Apps | 14 | Developer extensibility |
| MCP Server & Tools | 15 | Model Context Protocol integration |
| Skills System | 5 | Extensible AI capabilities |
| PWA Components | 12 | Frontend UI components |

Every algorithm is:
- ✅ Implemented in the repository
- ✅ Open source under AGPL v3
- ✅ Available for inspection and audit
- ✅ Documented with clear purpose

---

*Last updated: March 2026*
*Repository: github.com/owenservera/vivim*