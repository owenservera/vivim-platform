# VIVIM Open Core Blueprint
## The Sovereign AI Memory Infrastructure

> **Version**: 1.0 — March 2026
> **Status**: Living document — updated as implementation progresses
> **Repository**: [github.com/owenservera/vivim](https://github.com/owenservera/vivim)

---

## Preamble: Why Open Core Is the Moat

Most infrastructure companies treat open source as marketing. VIVIM treats it as architecture.

The open core is not a free tier. It is not a demo. It is not a loss leader. It is the entire intelligence layer — the protocols, the parsers, the context engine, the memory formats, the identity primitives — permanently and irrevocably free. These components become more valuable the more people use them, audit them, build on them, and trust them.

The commercial layer sells something different: **operational reliability and institutional accountability**. Managed uptime. Compliance certifications. Audit logs. Enterprise SLAs. These are services, not secrets. No amount of open-sourcing threatens them.

The strategic logic is tight:

```
Open source builds developer trust
  → Developers build on VIVIM
    → End users encounter VIVIM through developer tools
      → Individuals upgrade to VIVIM Cloud for convenience
        → Power users bring VIVIM into organizations
          → Organizations need Teams/Enterprise for compliance and scale
            → Enterprise revenue funds open source development
              → Richer open source attracts more developer adoption
```

**The open core is the acquisition channel. The commercial layer is the business.**

---

## Open Core Architecture: The Seven Pillars

The VIVIM open core is organized across seven pillars. Each pillar is permanently open source. Together they constitute a complete, self-sovereign AI memory infrastructure that any individual, developer, or organization can run independently.

---

## Pillar 1 — The ACU Specification & Context Engine

**The intellectual heart of VIVIM. Open forever because trust requires auditability.**

### 1.1 The ACU Standard

The **Atomic Chat Unit (ACU)** is VIVIM's canonical format for individually addressable AI memory. It is an open standard — anyone can implement it, any storage backend can adopt it, and any AI provider can emit or consume it.

An ACU is not a message. It is the smallest independently meaningful unit of AI memory: segmented, classified, embedded, and addressable. A single conversation may produce dozens of ACUs across multiple memory types.

**ACU Schema (canonical format):**

```typescript
interface ACU {
  id: string                    // Globally unique identifier (DID-anchored)
  userId: string                // Owner DID
  content: string               // The memory content
  type: MemoryType              // 9-type taxonomy (see below)
  source: string                // Origin provider / conversation ID
  timestamp: Date               // Creation time
  embedding: number[]           // Semantic vector (model-agnostic)
  keywords: string[]            // Extracted key terms
  entities: Entity[]            // Named entities (people, projects, concepts)
  chainId?: string              // Parent ACU for context chains
  confidence: number            // Classifier confidence (0-1)
  decayScore: number            // Current decay weight (0-1)
  metadata: Record<string, any> // Extensible
}

type MemoryType =
  | 'episodic'      // Specific interactions: "User debugged a memory leak on Tuesday"
  | 'semantic'      // Concepts and knowledge: "User prefers TypeScript over JavaScript"
  | 'procedural'    // How-to patterns: "User's debugging sequence: logs → repro → isolate"
  | 'factual'       // Hard facts: "User is Sarah Chen, works at Acme Corp"
  | 'preference'    // Style and taste: "User wants concise responses with code examples"
  | 'identity'      // Core identity: "Senior frontend engineer, 8 years experience"
  | 'relationship'  // Interpersonal: "Collaborates with Alex on side projects"
  | 'goal'          // Objectives: "Building a SaaS for task management"
  | 'project'       // Active work: "Currently migrating from CRA to Vite"
```

### 1.2 The 8-Layer Context Assembly Pipeline

The context engine assembles a precisely budgeted context window for every AI interaction, drawing from the full ACU store. The eight layers are processed bottom-up:

```
L7: Live Input         ← Current user message (reserved budget: ~500 tokens)
L6: Message History    ← Recent turns in this conversation thread
L5: JIT Retrieval      ← Dynamically retrieved ACUs most relevant to this message
L4: Conversation Arc   ← Long-term thread understanding, recurring patterns
L3: Entity Context     ← People, projects, technologies currently active
L2: Topic Context      ← Subject matter domain and active knowledge areas
L1: Global Preferences ← User settings, communication style, output preferences
L0: Identity Core      ← Who is this? (DID, profile, role, foundational facts)
```

Each layer has a configurable token budget. The budget algorithm distributes the provider's available context window across layers based on conversation state, topic relevance, and entity activity. When the total budget is exceeded, lower-priority layers are compressed before higher-priority ones.

**Key components (all open source):**

| Component | Source Location | What It Does |
|-----------|----------------|--------------|
| `context-assembler` | `server/src/context/context-assembler.ts` | Orchestrates the 8-layer assembly |
| `budget-algorithm` | `server/src/context/budget-algorithm.ts` | Token allocation across layers |
| `hybrid-retrieval` | `server/src/context/hybrid-retrieval.ts` | Vector similarity + keyword search for JIT |
| `memory-extraction-engine` | `server/src/context/memory/memory-extraction-engine.ts` | ACU segmentation from raw conversations |
| `memory-types` | `server/src/context/memory/memory-types.ts` | 9-type classifier |
| `context-thermodynamics` | `server/src/context/context-thermodynamics.ts` | Decay, refresh, and promotion algorithms |
| `unified-context-service` | `server/src/services/unified-context-service.ts` | Provider-agnostic adapter interface |

### 1.3 Advanced Context Systems (Implemented, Roadmap-Gap)

The following context infrastructure components are implemented but not yet represented in external roadmap documentation. They are part of the open core:

| Component | What It Does |
|-----------|--------------|
| `context-prefetch-engine` | Pre-assembles context for predicted next queries |
| `context-prediction-engine` | Predicts what context will be needed before the user asks |
| `adaptive-prediction` | Learns per-user prediction patterns |
| `query-optimizer` | Optimizes retrieval queries for latency and relevance |
| `cortex/` (adaptive-assembler, memory-compression, situation-detector) | Adaptive brain system — compresses, situates, and assembles context dynamically |
| `context-thermodynamics` | Full thermodynamics model for memory temperature, decay, and reactivation |
| `context-graph` | Graph of relationships between ACUs and entities |
| `context-bundle-differ` | Detects what changed between context bundles |
| `context-bundle-compiler` | Compiles optimized context bundles for delivery |
| `librarian-worker` | Background worker for continuous memory organization |

### Additional Context Components (Verified Implementation)

The following components were discovered in the codebase but are not yet documented in the roadmap:

| Component | What It Does | Source File |
|-----------|--------------|-------------|
| `context-orchestrator` | Coordinates multiple context pipelines and resolves priority conflicts | `server/src/context/context-orchestrator.ts` |
| `conversation-context-engine` | Generates context for specific conversation threads and message chains | `server/src/context/conversation-context-engine.ts` |
| `context-pipeline` | Manages the end-to-end pipeline for context assembly and delivery | `server/src/context/context-pipeline.ts` |
| `context-cache` | Caches compiled context bundles to avoid redundant assembly | `server/src/context/context-cache.ts` |
| `context-telemetry` | Collects and reports context performance metrics | `server/src/context/context-telemetry.ts` |
| `context-event-bus` | Event distribution system for context updates | `server/src/context/context-event-bus.ts` |
| `vivim-identity-service` | Self-sovereign identity system and system prompts | `server/src/context/vivim-identity-service.ts` |
| `settings-service` | User preferences and settings management | `server/src/context/settings-service.ts` |
| `settings-types` | Type definitions for settings | `server/src/context/settings-types.ts` |
| `settings-integration` | Settings integration with context system | `server/src/context/settings-integration.ts` |
| `token-estimator` | Accurate token estimation for context budget calculation | `server/src/context/utils/token-estimator.ts` |
| `zai-service` | ZAI integration for advanced context processing | `server/src/context/utils/zai-service.ts` |
| `circuit-breaker-service` | Circuit breaker pattern for resilient context retrieval | `server/src/context/utils/circuit-breaker-service.ts` |
| `acu-quality-scorer` | Scores ACU quality for memory prioritization | `server/src/context/utils/acu-quality-scorer.ts` |
| `embedding-service` | Generates semantic embeddings for ACUs | `server/src/context/utils/embedding-service.ts` |

### 1.4 SDK Interface

```typescript
import { ContextEngine, ACUStore, MemoryClassifier } from '@vivim/sdk'

const engine = new ContextEngine({
  store: new ACUStore({ adapter: 'sqlite', path: './memory.db' }),
  layers: defaultLayerConfig,
  budget: 12300 // tokens — set per provider
})

// Assemble context for a message
const context = await engine.assemble(userId, currentMessage)

// Access individual layers
const identity = await engine.getLayer('identity', userId)
const jitContext = await engine.retrieveJIT(userId, currentMessage)

// Store a new ACU
await engine.store({
  userId,
  content: "User prefers async/await over Promise chains",
  type: 'preference',
  source: 'conversation:abc123'
})
```

---

## Pillar 2 — Provider Data Import & Mapping Library

**The most complete library of AI data parsers ever assembled. Permanently free because data portability is a civil right.**

### 2.1 Rationale

Every major AI provider traps user conversation history in a proprietary export format. VIVIM builds — and open-sources — parsers for all of them. The parsers normalize any provider's export into the canonical ACU format. Three years of ChatGPT history becomes sovereign VIVIM memory in one command.

This is not just a convenience tool. It is a statement: your AI memory belongs to you, regardless of which providers you've used or will use.

### 2.2 Parser Coverage

| Provider | Export Format | Parser Status | Priority |
|----------|--------------|---------------|----------|
| **OpenAI (ChatGPT)** | `conversations.json` | ✅ Implemented | P0 |
| **Anthropic (Claude)** | `claude_export.zip` | 🔄 Q2 2025 | P0 |
| **Google (Gemini)** | Takeout JSON | 🔄 Q2 2025 | P1 |
| **Universal OpenAI-compatible** | Any OpenAI-format API log | 🔄 Q2 2025 | P1 |
| **Mistral / Groq / Perplexity / Cohere** | API log formats | 🔄 Q3 2025 | P2 |
| **Ollama / LM Studio / Jan** | Local model conversation JSON | 🔄 Q3 2025 | P2 |
| **Cursor / Windsurf / Continue** | IDE assistant history | 🔄 Q3 2025 | P2 |
| **Notion AI / Linear Asks / Intercom Fin** | Product tool exports | 🔄 Q4 2025 | P3 |

### 2.3 CLI Interface

```bash
# Single-provider import
vivim import --provider openai --file conversations.json
vivim import --provider claude --file claude_export.zip
vivim import --provider cursor --dir ~/.cursor/history

# Batch import from multiple providers
vivim import --providers openai,claude,gemini --dir ./exports/

# Preview what would be imported without committing
vivim import --provider openai --file conversations.json --dry-run
```

### 2.4 Pipeline Architecture

Every parser outputs to the same ACU normalizer. The normalizer runs segmentation, classification, embedding, and storage. The provider-specific logic is entirely upstream of this pipeline — adding a new parser does not touch the core engine.

```
Provider Export
    │
    ▼
Provider-Specific Parser
    │  (extracts: turns, timestamps, system prompts, metadata)
    ▼
ACU Normalizer
    │  (segments, classifies, embeds)
    ▼
ACU Store
    │  (SQLite / IPFS / filesystem)
    ▼
Context Engine
```

### 2.5 Data Services (Implemented, Roadmap-Gap)

| Component | What It Does |
|-----------|--------------|
| `acu-memory-pipeline` | Full pipeline from raw import to stored ACUs |
| `memory-conflict-detection` | Detects and resolves conflicts when merging imports from multiple providers |
| `acu-deduplication-service` | Deduplicates ACUs across providers (same memory, different source) |
| `page-index-service` | Indexes imported content for fast search |
| `extraction/strategies/` | Multiple extraction strategies for different conversation structures |

### Additional Data Services (Verified Implementation)

The following service components were discovered in the codebase:

| Component | What It Does | Source File |
|-----------|--------------|-------------|
| `streaming-import-service` | Handles streaming imports for large conversation datasets | `server/src/services/streaming-import-service.ts` |
| `invalidation-service` | Cache invalidation and memory refresh management | `server/src/services/invalidation-service.ts` |
| `streaming-context-service` | Streaming context delivery for real-time response | `server/src/services/streaming-context-service.ts` |
| `social-service` | Social features and relationship management | `server/src/services/social-service.ts` |
| `link-validator` | URL validation for external links | `server/src/services/link-validator.ts` |
| `feed-context-integration` | Feed integration with context system | `server/src/services/feed-context-integration.ts` |
| `conversation-rendering-service` | Renders conversations for various output formats | `server/src/services/conversation-rendering-service.ts` |
| `context-ws` | WebSocket-based context delivery | `server/src/services/context-ws.ts` |

---

## Pillar 3 — Identity & Portability Primitives

**Your AI identity, cryptographically yours. Your memory, readable without VIVIM.**

### 3.1 Decentralized Identity (DID) Toolkit

VIVIM implements W3C-compliant Decentralized Identifiers as the root of every user's AI identity. The DID is not an account on VIVIM's servers. It is a cryptographic identifier that the user controls — portably, across any deployment.

**Implementation**: `server/src/context/vivim-identity-service.ts`

```typescript
import { DIDService } from '@vivim/sdk'

// Create a new sovereign AI identity
const did = await DIDService.create({
  method: 'vivim',
  keyType: 'ed25519'
})
// Returns: "did:vivim:z6Mkf5Rua8KeVShCPXanWZaVcnk..."

// Resolve any VIVIM DID
const document = await DIDService.resolve('did:vivim:z6Mkf5...')

// Verify a DID signature
const valid = await DIDService.verify(signature, did)
```

### 3.2 Zero-Knowledge Key Management

Encryption keys are derived locally and never leave the user's device. The server never sees plaintext keys. This is not a policy — it is enforced by architecture.

**Implementation**: `sdk/src/utils/crypto.ts`

- Key derivation: Argon2 (memory-hard, GPU-resistant)
- Encryption: AES-256-GCM
- Signing: Ed25519
- Key rotation: deterministic re-derivation without server involvement

### 3.3 Memory Export & Portability

A user's complete ACU store can be exported at any time to open, documented formats. The export is readable by humans and processable by machines without VIVIM.

```typescript
import { MemoryExporter } from '@vivim/sdk'

await MemoryExporter.export({
  userId: 'did:vivim:z6Mkf5...',
  format: 'json',      // or 'sqlite', 'ipfs'
  output: './my-ai-memory.json',
  includeEmbeddings: true
})
```

**Export formats:**
- `json` — human-readable, fully documented schema
- `sqlite` — single-file database, queryable with any SQLite client
- `ipfs` — content-addressed, distributed, cryptographically verifiable

### 3.4 Storage Adapters

| Adapter | Status | Use Case |
|---------|--------|----------|
| Local Filesystem | ✅ Implemented | Development, air-gapped |
| SQLite | ✅ Implemented | Self-hosted, embedded |
| IPFS | ✅ Implemented | Decentralized, verifiable |
| S3-compatible (MinIO, Backblaze B2) | 🔄 Q2 2025 | Cloud self-hosting |

### 3.5 Storage-V2 Architecture (Implemented, Roadmap-Gap)

The next-generation storage layer is implemented and part of the open core:

| Component | What It Does |
|-----------|--------------|
| `storage-v2/dag-engine` | DAG-based content-addressed storage |
| `storage-v2/secure-storage` | Encrypted at-rest storage with user-controlled keys |
| `storage-v2/merkle` | Merkle tree for verifiable data integrity |
| `storage-v2/object-store` | Object storage abstraction layer |
| `storage-v2/db-manager` | Database lifecycle management |
| `user-conversation-db` | Local conversation database |
| `secure-capture-queue` | Secure queue for ingesting new conversations |
| `l0-storage` (SDK Core) | Base storage layer |

---

## Pillar 4 — Network, Federation & P2P

**A sovereign deployment can connect to others. The protocol is open. No VIVIM infrastructure required.**

### 4.1 The VIVIM Network

The network layer enables decentralized sync, federation between independent VIVIM instances, and P2P data distribution. It is built on libp2p and CRDTs — no central server required.

**Implementation**: `network/src/`

### 4.2 Components

| Component | Status | What It Does |
|-----------|--------|--------------|
| `federation` (client + server) | ✅ Implemented | Federation protocol between independent instances |
| `instance-discovery` | ✅ Implemented | Service discovery across the VIVIM network |
| `distributed-content-client` | ✅ Implemented | Distributed content retrieval |
| `cross-device sync protocol` | ✅ Implemented | P2P sync spec (open, any node can implement) |

### 4.3 Protocols (Implemented, Roadmap-Gap)

| Protocol | What It Does |
|----------|--------------|
| `activitypub` | ActivityPub implementation — federated social and sharing |
| `exit-node` | Exit node protocol for network routing |
| `chat protocol` | Chat protocol types and handlers |

### Additional Network Protocols (Verified Implementation)

| Protocol | What It Does | Source File |
|----------|--------------|-------------|
| `chat protocol` | Full chat protocol implementation with types and handlers | `sdk/src/protocols/chat/index.ts` |
| `sync` | Synchronization protocol for state management | `sdk/src/protocols/sync.ts` |
| `storage` | Storage protocol with IPFS, distributed storage support | `sdk/src/protocols/storage/index.ts` |

### 4.4 SDK Nodes (Implemented, Roadmap-Gap)

The SDK ships with a node system for constructing federated VIVIM deployments. These are open core:

| Node | What It Does |
|------|--------------|
| `chatlink-nexus-node` | Chat linking and nexus management |
| `sovereign-permissions-node` | Sovereign permission enforcement |
| `sharing-policy-node` | Sharing policy management |
| `chatvault-archiver-node` | Chat vault archival |
| `federation-server-node` | Federation server node |
| `health-monitoring-node` | Health monitoring and metrics |
| `social-node` | Social features and interactions |
| `storage-node` | Storage management |
| `ai-chat-node` | AI chat orchestration |
| `network-monitoring-node` | Network monitoring and diagnostics |
| `identity-node` | Identity management |
| `memory-node` | Memory management |
| `content-node` | Content management |
| `instance-discovery` | Service discovery |

### Additional SDK Nodes (Verified Implementation)

| Node | What It Does | Source File |
|------|--------------|-------------|
| `federation-client-node` | Federation client node for connecting to federation servers | `sdk/src/nodes/federation-client-node.ts` |
| `instance-discovery` | Service discovery across the VIVIM network | `sdk/src/nodes/instance-discovery.ts` |

### Network Infrastructure (Verified Implementation)

| Component | What It Does | Source File |
|-----------|--------------|-------------|
| `CapabilityManager` | Capability-based access control | `network/src/security/CapabilityManager.ts` |
| `PubSubService` | Publish/subscribe messaging service | `network/src/pubsub/PubSubService.ts` |
| `TopicManager` | Topic management for pubsub | `network/src/pubsub/TopicManager.ts` |
| `DistributedContentClient` | Distributed content retrieval | `network/src/storage/DistributedContentClient.ts` |
| `ChainClient` | Chain client for blockchain interaction | `network/src/chain/ChainClient.ts` |
| `EventHandler` | Event handling for chain events | `network/src/chain/EventHandler.ts` |
| `StateMachine` | State machine for state management | `network/src/chain/StateMachine.ts` |
| `HLClock` | Hybrid logical clock for ordering | `network/src/chain/HLClock.ts` |

### Extended CRDT Implementations (Verified Implementation)

| CRDT | What It Does | Source File |
|------|--------------|-------------|
| `TeamCRDT` | CRDT for team/multi-user data | `network/src/crdt/TeamCRDT.ts` |
| `GroupCRDT` | CRDT for group data | `network/src/crdt/GroupCRDT.ts` |
| `FriendCRDT` | CRDT for friend relationship data | `network/src/crdt/FriendCRDT.ts` |
| `FollowCRDT` | CRDT for follow/follower data | `network/src/crdt/FollowCRDT.ts` |

---

## Pillar 5 — The SDK & Developer Toolkit

**The layer developers build on. Open so it can become the default, not just an option.**

### 5.1 Core SDK

The `@vivim/sdk` is the primary developer interface. It exposes the entire open core as a composable TypeScript/Node.js library.

```bash
npm install @vivim/sdk
```

**Package structure:**
```
@vivim/sdk
├── /core           — ContextEngine, ACUStore, MemoryClassifier
├── /identity       — DIDService, KeyManager
├── /import         — ProviderImportService, parsers
├── /mcp            — MCPServer, MCPTools
├── /network        — Federation, sync, P2P
├── /protocols      — ActivityPub, storage, chat
├── /tokens         — Token standards, wallet, registry
└── /extensions     — Plugin system, UI adapters
```

### 5.2 SDK Core Components (Implemented, Roadmap-Gap)

| Component | What It Does |
|-----------|--------------|
| `assistant` | Core assistant implementation |
| `assistant-runtime` | Assistant runtime environment |
| `self-design` | Self-design and customization primitives |
| `anchor` | Anchor protocol for cryptographic data anchoring |
| `crdt-schema` | CRDT data schemas for conflict-free sync |
| `recordkeeper` | Immutable record keeping |
| `graph` | Graph database operations for entity relationships |
| `registry` | Service and component registry |

### Additional SDK Core Components (Verified Implementation)

| Component | What It Does | Source File |
|-----------|--------------|-------------|
| `wallet-service` | Wallet service for token management | `sdk/src/core/wallet-service.ts` |
| `database` | Database abstraction and management | `sdk/src/core/database.ts` |
| `communication` | Communication protocols and handling | `sdk/src/core/communication.ts` |
| `constants` | SDK constants and configurations | `sdk/src/core/constants.ts` |
| `performance` | Performance monitoring and metrics | `sdk/src/utils/performance.ts` |
| `graph` | Graph database operations for entity relationships | `sdk/src/graph/graph.ts` |

### 5.3 SDK Apps (Implemented, Roadmap-Gap)

Higher-level orchestration engines included in the SDK:

| App | What It Does |
|-----|--------------|
| `acu-processor` | ACU processing engine (the pipeline runner) |
| `assistant-engine` | AI assistant orchestration |
| `roadmap-engine` | Project roadmap planning engine |
| `publishing-agent` | Content publishing agent |
| `public-dashboard` | Public analytics dashboard |
| `tool-engine` | Tool execution engine |
| `circle-engine` | Circle/community management |
| `omni-feed` | Omni-directional feed aggregation |
| `crypto-engine` | Cryptographic operations engine |
| `ai-git` | AI-powered git operations |
| `ai-documentation` | AI documentation generation |

### 5.3a MCP Server & Tools (Implemented)

The Model Context Protocol server exposes VIVIM memory as tools callable by any MCP-compatible client.

| Component | What It Does | Source File |
|-----------|--------------|-------------|
| `mcp-server` | MCP server implementation | `sdk/src/mcp/server.ts` |
| `mcp-registry` | MCP tool registry | `sdk/src/mcp/registry.ts` |
| `mcp-types` | MCP type definitions | `sdk/src/mcp/types.ts` |

#### MCP Tools

| Category | Tools |
|----------|-------|
| Chat | `send_message`, `get_conversations`, `search_messages` |
| Memory | `store_memory`, `retrieve_memory`, `list_memories` |
| Content | `create_content`, `share_content`, `export_content` |
| Identity | `get_identity`, `verify_did`, `manage_keys` |
| Storage | `save_data`, `load_data`, `sync_data` |
| Social | `follow_user`, `share_memory`, `collaborate` |

#### MCP Transports

| Transport | What It Does | Source File |
|-----------|--------------|-------------|
| `stdio` | Standard I/O transport | `sdk/src/mcp/transports/stdio.ts` |
| `http` | HTTP transport | `sdk/src/mcp/transports/http.ts` |
| `websocket` | WebSocket transport | `sdk/src/mcp/transports/websocket.ts` |
| `libp2p` | LibP2P transport | `sdk/src/mcp/transports/libp2p-transport.ts` |
| `chunked-transfer` | Chunked transfer encoding | `sdk/src/mcp/transports/chunked-transfer.ts` |
| `streamable` | Streamable transport | `sdk/src/mcp/transports/streamable.ts` |
| `social-transport` | Social transport layer | `sdk/src/mcp/transports/social-transport.ts` |
| `multi-transport` | Multi-transport coordinator | `sdk/src/mcp/transports/multi-transport.ts` |

### 5.3b Skills System (Implemented)

The SDK includes a skill system for extensible AI capabilities:

| Skill | What It Does | Source File |
|-------|--------------|-------------|
| `skills/registry` | Skill registry and discovery | `sdk/src/skills/registry.ts` |
| `skills/types` | Skill type definitions | `sdk/src/skills/types.ts` |
| `skills/content` | Content processing skills | `sdk/src/skills/content/index.ts` |
| `skills/memory` | Memory-related skills | `sdk/src/skills/memory/index.ts` |
| `skills/research` | Research and analysis skills | `sdk/src/skills/research/index.ts` |

### 5.4 Token Standards (Implemented, Roadmap-Gap)

VIVIM implements open token standards for access control, storage rights, and identity anchoring. All token contracts and standards are open source:

| Standard | What It Does |
|----------|--------------|
| `erc1155` | ERC-1155 multi-token standard |
| `soulbound-token` | Non-transferable identity token |
| `access-token` | Access control token standard |
| `storage-token` | Storage rights token |
| `token-wallet` | Token wallet management |
| `token-registry` | Token registry and discovery |
| `token-factory` | Token creation factory |

### 5.5 Services (Implemented, Roadmap-Gap)

Open-source service infrastructure included in the SDK:

| Service | What It Does |
|---------|--------------|
| `audit-logging-service` | Comprehensive audit logging (open implementation; enterprise gets managed compliance version) |
| `sharing-encryption-service` | Encrypted sharing services |
| `sso-service` | Single sign-on (open implementation; enterprise gets SAML/SCIM managed version) |
| `error-reporting-service` | Error reporting and tracking |
| `access-grant-manager` | Access control and grants |

### Additional SDK Services (Verified Implementation)

| Service | What It Does | Source File |
|---------|--------------|-------------|
| `graph` | Graph database and operations service | `sdk/src/graph/index.ts` |
| `extension-system` | Plugin extension system | `sdk/src/extension/extension-system.ts` |

### 5.6 Extensions System

| Extension | What It Does |
|-----------|--------------|
| `tool-ui-adapter` | Tool UI integration adapter |
| `assistant-ui-adapter` | Assistant UI integration |
| `extension-system` | Plugin extension system (anyone can build and publish VIVIM extensions) |

### 5.7 Error Handling & Analytics (SDK)

| Component | What It Does | Source File |
|-----------|--------------|-------------|
| `error-reporting` | Error reporting infrastructure | `sdk/src/utils/performance.ts` |
| `logger` | SDK logging utility | `sdk/src/utils/logger.ts` |

---

## Pillar 6 — The Self-Hosted Full Stack

**Everything you need to run VIVIM completely independently. 100% feature parity with VIVIM Cloud except managed ops.**

### 6.1 Components

| Component | Tech Stack | Status |
|-----------|-----------|--------|
| `server` | Bun + Express, TypeScript | ✅ Implemented |
| `network` | libp2p, CRDT | ✅ Implemented |
| `pwa` | React 19, TypeScript | ✅ Implemented |
| `sdk` | TypeScript/Node.js | ✅ Implemented |
| `admin-panel` | Platform management UI | ✅ Implemented |

### 6.2 Quick Start

```bash
# Full sovereign deployment
git clone https://github.com/owenservera/vivim-server
docker-compose up -d

# You now have:
# ✓ Full 8-layer context engine
# ✓ ACU storage with semantic search
# ✓ Provider sync adapters
# ✓ P2P network node
# ✓ PWA frontend
# ✓ Admin panel
# ✓ MCP server (connect to Claude Desktop, Cursor, etc.)
```

### 6.3 Feature Parity Matrix

| Capability | Self-Hosted | VIVIM Cloud |
|-----------|-------------|-------------|
| Full context engine | ✅ | ✅ |
| ACU storage + semantic search | ✅ | ✅ |
| All provider parsers | ✅ | ✅ |
| DID identity + key management | ✅ | ✅ |
| P2P network node | ✅ | ✅ |
| PWA frontend | ✅ | ✅ |
| MCP server | ✅ | ✅ |
| Memory export | ✅ | ✅ |
| Managed TLS | ❌ | ✅ |
| Auto-scaling | ❌ | ✅ |
| Uptime SLA | ❌ | ✅ |
| Offsite backup (3-2-1) | ❌ | ✅ |
| Push notifications | ❌ | ✅ |
| One-click OAuth import | ❌ | ✅ |

### 6.4 PWA Components (Implemented, Roadmap-Gap)

Frontend components included in the open-source PWA:

**Sovereignty Components:**
| Component | What It Does |
|-----------|--------------|
| `KnowledgeGraph` | Knowledge graph visualization |
| `Sentinel` | Sentinel monitoring system |
| `TrustSeal` | Trust seal verification display |
| `DAGMaterializer` | DAG materialization engine |
| `Totem` | Totem identity system |

**Tool UI Components:**
| Component | What It Does |
|-----------|--------------|
| `option-list` | Option list component |
| `approval-card` | Approval card component |
| `data-table` | Data table component |
| `link-preview` | Link preview component |

**Recommendation System:**
| Component | What It Does |
|-----------|--------------|
| `recommendation-engine` | Content recommendation |
| `KnowledgeMixer` | Knowledge mixing and blending |
| `analytics` | Recommendation analytics |
| `storage-adapter` | Recommendation storage |

**Social & Features:**
| Component | What It Does |
|-----------|--------------|
| `social-hooks` | Social functionality hooks |
| `ShareMenu` | Sharing menu component |
| `feature-hooks` | Feature flag system |
| `features/types` | Feature type definitions |

### Additional PWA Components (Verified Implementation)

**Visualization & Context:**
| Component | What It Does | Source File |
|-----------|--------------|-------------|
| `ContextVisualizer` | Real-time context visualization | `pwa/src/components/ContextVisualizer.tsx` |
| `ACUGraph` | ACU relationship graph display | `pwa/src/components/ACUGraph.tsx` |
| `ACUSearch` | ACU search interface | `pwa/src/components/ACUSearch.tsx` |
| `ACUViewer` | Detailed ACU viewer | `pwa/src/components/ACUViewer.tsx` |
| `PhysicsVisualizations` | Physics-based data visualizations | `pwa/src/components/PhysicsVisualizations.tsx` |
| `ContextCockpit` | Context management cockpit | `pwa/src/components/ContextCockpit.tsx` |

**Admin Panel:**
| Component | What It Does | Source File |
|-----------|--------------|-------------|
| `SystemOverviewPanel` | System overview dashboard | `pwa/src/components/admin/SystemOverviewPanel.tsx` |
| `RealTimeLogsPanel` | Real-time log viewer | `pwa/src/components/admin/RealTimeLogsPanel.tsx` |
| `NetworkPanel` | Network status and metrics | `pwa/src/components/admin/NetworkPanel.tsx` |
| `LogsPanel` | Log management interface | `pwa/src/components/admin/LogsPanel.tsx` |
| `DataFlowPanel` | Data flow visualization | `pwa/src/components/admin/DataFlowPanel.tsx` |
| `DatabasePanel` | Database management interface | `pwa/src/components/admin/DatabasePanel.tsx` |
| `CRDTManagementPanel` | CRDT state management | `pwa/src/components/admin/CRDTManagementPanel.tsx` |
| `ActionsPanel` | Admin action controls | `pwa/src/components/admin/ActionsPanel.tsx` |

**Recommendation System:**
| Component | What It Does | Source File |
|-----------|--------------|-------------|
| `RecommendationsList` | Personalized recommendations list | `pwa/src/components/recommendation/RecommendationsList.tsx` |
| `ConversationCard` | Conversation recommendation card | `pwa/src/components/recommendation/ConversationCard.tsx` |
| `SettingsPanel` | Recommendation settings | `pwa/src/components/recommendation/SettingsPanel.tsx` |
| `SimilarConversations` | Similar conversation finder | `pwa/src/components/recommendation/SimilarConversations.tsx` |
| `TopicFilter` | Topic-based filtering | `pwa/src/components/recommendation/TopicFilter.tsx` |
| `ConversationCardSkeleton` | Loading skeleton for cards | `pwa/src/components/recommendation/ConversationCardSkeleton.tsx` |

**AI & Chat:**
| Component | What It Does | Source File |
|-----------|--------------|-------------|
| `OmniComposer` | Multi-modal input composer | `pwa/src/components/OmniComposer.tsx` |
| `BlockchainAIChat` | Blockchain-integrated chat | `pwa/src/components/BlockchainAIChat.tsx` |
| `GlobalSocketListener` | Real-time socket event handling | `pwa/src/components/GlobalSocketListener.tsx` |
| `ConversationChatView` | Conversation display view | `pwa/src/components/ConversationChatView.tsx` |
| `VIVIMThread` | Thread display component | `pwa/src/components/ai/VIVIMThread.tsx` |
| `VIVIMComposer` | Composer component | `pwa/src/components/ai/VIVIMComposer.tsx` |
| `ACUExtractionUI` | ACU extraction interface | `pwa/src/components/ai/tools/ACUExtractionUI.tsx` |
| `MemoryRetrievalUI` | Memory retrieval interface | `pwa/src/components/ai/tools/MemoryRetrievalUI.tsx` |

**iOS Components:**
| Component | What It Does | Source File |
|-----------|--------------|-------------|
| iOS-specific components | Full iOS UI kit | `pwa/src/components/ios/` |

---

## Pillar 7 — Community Integrations Layer

**VIVIM memory, everywhere AI is used.**

### 7.1 MCP Server (Shipped)

The Model Context Protocol (MCP) server exposes VIVIM memory as a tool callable by any MCP-compatible client — Claude Desktop, Cursor, VS Code Copilot, and any future client.

```typescript
import { MCPServer } from '@vivim/sdk/mcp'

const server = new MCPServer({
  transport: 'stdio',
  tools: { memory: MemoryTools, context: ContextTools, identity: IdentityTools }
})

await server.start()
```

**Available MCP tool categories:**

| Category | Tools |
|----------|-------|
| Chat | `send_message`, `get_conversations`, `search_messages` |
| Memory | `store_memory`, `retrieve_memory`, `list_memories` |
| Content | `create_content`, `share_content`, `export_content` |
| Identity | `get_identity`, `verify_did`, `manage_keys` |
| Storage | `save_data`, `load_data`, `sync_data` |
| Social | `follow_user`, `share_memory`, `collaborate` |

### 7.2 Integration Roadmap

| Integration | Target | What It Enables |
|-------------|--------|-----------------|
| LangChain memory adapter | Q2 2025 | Drop-in VIVIM memory for Python AI pipelines |
| LlamaIndex adapter | Q2 2025 | RAG pipelines with sovereign memory |
| n8n / Make / Zapier | Q3 2025 | Low-code memory automation |
| Browser Extension SDK | Q3 2025 | Capture AI conversations from any web UI |
| Obsidian plugin | Q3 2025 | PKM ↔ AI memory sync |
| Notion plugin | Q4 2025 | Notion ↔ AI memory sync |
| Logseq plugin | Q4 2025 | Logseq ↔ AI memory sync |

### 7.3 LangChain Interface (Planned)

```typescript
import { VIVIMMemory } from '@vivim/sdk/langchain'
import { ConversationChain } from 'langchain/chains'

const memory = new VIVIMMemory({
  userId: 'did:vivim:z6Mkf5...',
  returnMessages: true
})

const chain = new ConversationChain({
  llm: new ChatOpenAI(),
  memory  // VIVIM drops in as a LangChain memory backend
})
```

---

## Open Core Completeness: The Gap Resolution Plan

The Gap List analysis identified **90+ implemented components** that are part of the open core but not yet represented in public roadmap documentation or developer-facing communication. This section formally incorporates them.

### Summary of Absorbed Gaps

| Category | Count | Resolution |
|----------|-------|------------|
| SDK Nodes | 16 | Incorporated into Pillar 4 |
| SDK Apps | 11 | Incorporated into Pillar 5 |
| SDK Protocols | 6 | Incorporated into Pillar 4 |
| SDK Tokens | 7 | Incorporated into Pillar 5 |
| SDK Services | 7 | Incorporated into Pillar 5 |
| SDK Core | 14 | Incorporated into Pillar 5 |
| SDK MCP & Skills | 25+ | Incorporated into Pillar 5 |
| SDK Extensions | 3 | Incorporated into Pillar 5 |
| PWA Components | 30+ | Incorporated into Pillar 6 |
| PWA Recommendation | 6 | Incorporated into Pillar 6 |
| PWA Admin | 8 | Incorporated into Pillar 6 |
| PWA Visualization | 6 | Incorporated into Pillar 6 |
| Server Context | 15+ | Incorporated into Pillar 1 |
| Server Services | 8+ | Incorporated into Pillar 2 |
| Network Components | 20+ | Incorporated into Pillar 4 |
| Network CRDTs | 4 | Incorporated into Pillar 4 |

### Updated Component Count

**Total Open Core Components: 180+**

This represents a significant expansion from the initial 90 documented components, reflecting the mature state of the VIVIM implementation.

### Documentation Debt Priority

**P0 — Document immediately (these are core selling points):**
- `cortex/` system — the adaptive-assembler, memory-compression, situation-detector are compelling and belong on the website
- `storage-v2/` — DAG, Merkle, secure storage differentiate VIVIM from trivial memory wrappers
- Token standards — soulbound + access tokens are a unique sovereignty story

**P1 — Document before Series A:**
- All SDK nodes (the node graph architecture is a meaningful differentiator)
- `activitypub` — positions VIVIM in the fediverse/open social narrative
- `acu-deduplication` and `memory-conflict-detection` — demonstrates production-grade thinking

**P2 — Developer docs (before community launch):**
- All SDK apps and engines
- Extension system
- PWA component library

---

## The Open Core / Commercial Boundary

The boundary is defined by a single question: **does this require VIVIM to operate, or does it require VIVIM to be trusted?**

### What is always open:

- All intelligence: context assembly, ACU processing, memory classification, retrieval
- All protocols: ACU spec, DID, ActivityPub, federation, MCP
- All parsers: every provider import library
- All storage: adapters, DAG engine, Merkle, secure storage
- All identity: DID, key management, portability
- All SDKs, nodes, apps, engines
- All self-hosting infrastructure: server, PWA, network, admin

### What is commercial:

- **Managed uptime**: SLAs, auto-scaling, TLS termination, CDN
- **Managed backup**: 3-2-1 architecture, point-in-time recovery, geo-redundancy
- **Managed compliance**: SOC 2 Type II report, HIPAA BAA, FedRAMP (future)
- **Managed identity integration**: SAML 2.0, SCIM, enterprise SSO
- **Managed audit**: compliance-grade audit log delivery, legal hold, eDiscovery
- **Managed support**: SLA-backed support, dedicated CSM, QBR
- **Convenience features**: one-click OAuth imports, push notifications, mobile sync
- **Organizational features**: seat management, shared knowledge bases, RBAC administration

The commercial layer sells **operational trust**. The open core builds **technical trust**. Both are essential. Neither cannibalizes the other.

---

## Open Core Roadmap

### Now (Q1–Q2 2025): Establish the standard

- [ ] Publish ACU specification as a standalone versioned document at `spec.vivim.live`
- [ ] Ship OpenAI + Claude import parsers as the headline open-source release
- [ ] Release `@vivim/sdk` v1.0 on npm with full documentation
- [ ] Publish MCP server — get VIVIM into Claude Desktop and Cursor immediately
- [ ] Docker Compose one-click self-hosted deployment
- [ ] Write developer documentation for all 7 pillars
- [ ] Resolve P0 documentation debt from gap list

### Q3 2025: Build the ecosystem

- [ ] Full provider import library (5+ providers)
- [ ] LangChain + LlamaIndex adapters
- [ ] n8n / Make / Zapier connectors
- [ ] Browser extension SDK
- [ ] Kubernetes Helm chart for enterprise self-hosting
- [ ] `vivim-network` v1 stable (decentralized sync)
- [ ] Resolve P1 documentation debt from gap list

### Q4 2025 – Q1 2026: Grow the community

- [ ] Obsidian + Notion + Logseq plugins
- [ ] Community parser framework (external contribution guide + CI validation)
- [ ] First external community-contributed parser merged
- [ ] S3-compatible storage adapter (MinIO, Backblaze B2)
- [ ] Key rotation and recovery tools
- [ ] Resolve P2 documentation debt from gap list
- [ ] 10+ external contributors active

---

## Success Metrics

### Open Core Health

| Metric | Q2 2025 | Q4 2025 | Q2 2026 |
|--------|---------|---------|---------|
| GitHub stars | 500 | 2,000 | 5,000 |
| npm installs (`@vivim/sdk`) | 1,000 | 5,000 | 25,000 |
| Provider parsers available | 5 | 8 | 12+ |
| External contributors | 1 | 5 | 10+ |
| Community integrations | 3 | 6 | 10+ |
| ACU spec external adoptions | 0 | 1 | 3+ |

### Commercial Conversion

*Commercial metrics TBD — Pre-MVP mode. Focus is on validating the open core.*

---

## The One-Paragraph Summary

VIVIM open-sources the complete intelligence layer for sovereign AI memory: the ACU specification (the open standard for addressable AI memory units), the 8-layer context assembly engine, provider import parsers for every major AI platform, the DID-based identity and key management system, the P2P federation network, and the full self-hosted stack. These components — **180+ implemented components**, permanently free — are the moat: they build the developer trust and ecosystem adoption that no proprietary competitor can replicate, because a proprietary vendor cannot make the same sovereignty promise. The commercial layer is under development — focusing on managed infrastructure for those who want sovereignty without operational burden.

*Status: Pre-MVP*

---

*Blueprint Version: 1.0*
*Last Updated: March 2026*
*Maintainer: VIVIM Core Team*
*Feedback: [vivim.live](https://vivim.live)*
