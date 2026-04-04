# VIVIM Open Core Blueprint
## The Sovereign AI Memory Infrastructure

> **Version**: 1.1 — March 2026
> **Status**: Living document — updated as implementation progresses
> **Repository**: [github.com/owenservera/vivim](https://github.com/owenservera/vivim)
> **Note**: This version (1.1) incorporates audit findings from codebase verification

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

## Open Core Architecture: The Eight Pillars

The VIVIM open core is organized across eight pillars. Each pillar is permanently open source. Together they constitute a complete, self-sovereign AI memory infrastructure that any individual, developer, or organization can run independently.

> **AUDIT NOTE**: This version corrects the pillar count from 7 to 8, incorporating the Import Pipeline as a distinct pillar based on codebase verification.

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

| Component | Source Location | What It Does | Status |
|-----------|----------------|--------------|--------|
| `context-assembler` | `server/src/context/context-assembler.ts` | Orchestrates the 8-layer assembly | ✅ Verified |
| `budget-algorithm` | `server/src/context/budget-algorithm.ts` | Token allocation across layers | ✅ Verified |
| `hybrid-retrieval` | `server/src/context/hybrid-retrieval.ts` | Vector similarity + keyword search for JIT | ✅ Verified |
| `memory-extraction-engine` | `server/src/context/memory/memory-extraction-engine.ts` | ACU segmentation from raw conversations | ✅ Verified |
| `memory-types` | `server/src/context/memory/memory-types.ts` | 9-type classifier | ✅ Verified |
| `context-thermodynamics` | `server/src/context/context-thermodynamics.ts` | Decay, refresh, and promotion algorithms | ✅ Verified |
| `unified-context-service` | `server/src/services/unified-context-service.ts` | Provider-agnostic adapter interface | ✅ Verified |

### 1.3 Advanced Context Systems (Implemented, Verified)

> **AUDIT NOTE**: Section renamed from "Roadmap-Gap" to "Verified" — these components exist in the codebase.

The following context infrastructure components are implemented:

| Component | Source Location | What It Does |
|-----------|----------------|--------------|
| `context-prefetch-engine` | `server/src/context/prefetch-engine.ts` | Pre-assembles context for predicted next queries |
| `context-prediction-engine` | `server/src/context/prediction-engine.ts` | Predicts what context will be needed before the user asks |
| `adaptive-prediction` | `server/src/context/adaptive-prediction.ts` | Learns per-user prediction patterns |
| `query-optimizer` | `server/src/context/query-optimizer.ts` | Optimizes retrieval queries for latency and relevance |
| `cortex/adaptive-assembler` | `server/src/context/cortex/adaptive-assembler.ts` | Adaptive brain system — assembles context dynamically |
| `cortex/memory-compression` | `server/src/context/cortex/memory-compression.ts` | Memory compression for context optimization |
| `cortex/situation-detector` | `server/src/context/cortex/situation-detector.ts` | Situation detection for context assembly |
| `context-thermodynamics` | `server/src/context/context-thermodynamics.ts` | Full thermodynamics model for memory temperature, decay, and reactivation |
| `context-graph` | `server/src/context/context-graph.ts` | Graph of relationships between ACUs and entities |
| `context-bundle-differ` | `server/src/context/bundle-differ.ts` | Detects what changed between context bundles |
| `context-bundle-compiler` | `server/src/context/bundle-compiler.ts` | Compiles optimized context bundles for delivery |
| `librarian-worker` | `server/src/context/librarian-worker.ts` | Background worker for continuous memory organization |

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

> **AUDIT NOTE**: MAJOR CORRECTION. The blueprint significantly underestimated implemented parsers. 9 provider extractors exist in `server/src/extractors/`:
> - ChatGPT, Claude, DeepSeek, Gemini, Grok, Kimi, Mistral, Qwen, Zai
> - Plus: adaptive-extraction-engine.js

| Provider | Export Format | Parser Status | Priority |
|----------|--------------|---------------|----------|
| **OpenAI (ChatGPT)** | `conversations.json` | ✅ Implemented | P0 |
| **Anthropic (Claude)** | `claude_export.zip` | ✅ Implemented | P0 |
| **Google (Gemini)** | Takeout JSON | ✅ Implemented | P0 |
| **DeepSeek** | DeepSeek export format | ✅ Implemented | P0 |
| **Grok** | Grok export format | ✅ Implemented | P1 |
| **Kimi** | Kimi export format | ✅ Implemented | P1 |
| **Mistral** | Mistral export format | ✅ Implemented | P1 |
| **Qwen** | Qwen export format | ✅ Implemented | P1 |
| **Zai** | Zai export format | ✅ Implemented | P1 |
| **Universal OpenAI-compatible** | Any OpenAI-format API log | 🔄 Q2 2025 | P1 |
| **Ollama / LM Studio / Jan** | Local model conversation JSON | 🔄 Q3 2025 | P2 |
| **Cursor / Windsurf / Continue** | IDE assistant history | 🔄 Q3 2025 | P2 |
| **Notion AI / Linear Asks / Intercom Fin** | Product tool exports | 🔄 Q4 2025 | P3 |

### 2.3 CLI Interface

```bash
# Single-provider import
vivim import --provider openai --file conversations.json
vivim import --provider claude --file claude_export.zip
vivim import --provider gemini --file takeout.json
vivim import --provider deepseek --file deepseek_export.json

# Batch import from multiple providers
vivim import --providers openai,claude,gemini,deepseek --dir ./exports/

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

### 2.5 Import Service Infrastructure

> **AUDIT NOTE**: This section adds the verified import service components.

| Component | Source Location | What It Does |
|-----------|----------------|--------------|
| `import-service` | `server/src/services/import-service.js` | Full ChatGPT import pipeline with ZIP parsing, deduplication |
| `streaming-import-service` | `server/src/services/streaming-import-service.ts` | Streaming import for large exports |
| `import-types` | `server/src/services/import-types.ts` | Type definitions for import operations |
| `acu-memory-pipeline` | — | Full pipeline from raw import to stored ACUs |
| `memory-conflict-detection` | — | Detects and resolves conflicts when merging imports from multiple providers |
| `acu-deduplication-service` | — | Deduplicates ACUs across providers (same memory, different source) |
| `page-index-service` | — | Indexes imported content for fast search |
| `extraction/strategies/` | — | Multiple extraction strategies for different conversation structures |

### 2.6 Adaptive Extraction Engine

> **AUDIT NOTE**: NEW SECTION — discovered in codebase audit.

The `adaptive-extraction-engine.js` provides dynamic extraction strategy selection based on conversation structure analysis.

```javascript
// Adaptive extraction automatically detects format and selects optimal parser
const extractor = new AdaptiveExtractionEngine()
const result = await extractor.extract(rawExport, {
  autoDetect: true,        // Automatically detect provider format
  parallel: true,          // Parallel extraction for speed
  validate: true           // Validate output ACUs
})
```

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

### 3.5 Storage Architecture

> **AUDIT NOTE**: Section renamed from "Storage-V2 Architecture" — actual implementation uses different structure than documented.

| Component | Status | What It Does |
|-----------|--------|--------------|
| User conversation DB | ✅ Implemented | Local conversation database |
| Secure capture queue | ✅ Implemented | Secure queue for ingesting new conversations |
| L0 storage (SDK Core) | ✅ Implemented | Base storage layer |
| DAG-based storage | 🔄 Planned | Content-addressed storage |
| Merkle tree verification | 🔄 Planned | Verifiable data integrity |
| Object storage abstraction | 🔄 Planned | Object storage abstraction layer |

---

## Pillar 4 — Network, Federation & P2P

**A sovereign deployment can connect to others. The protocol is open. No VIVIM infrastructure required.**

### 4.1 The VIVIM Network

The network layer enables decentralized sync, federation between independent VIVIM instances, and P2P data distribution. It is built on libp2p and CRDTs — no central server required.

**Implementation**: `network/src/`

### 4.2 Components (Verified)

| Component | Source Location | Status | What It Does |
|-----------|----------------|--------|--------------|
| `federation` (client) | `network/src/federation/FederationClient.ts` | ✅ Implemented | Federation client for connecting to other instances |
| `federation` (server) | `network/src/federation/FederationServer.ts` | ✅ Implemented | Federation server for accepting connections |
| `instance-discovery` | `network/src/federation/InstanceDiscovery.ts` | ✅ Implemented | Service discovery across the VIVIM network |
| `distributed-content-client` | `network/src/storage/DistributedContentClient.ts` | ✅ Implemented | Distributed content retrieval |
| `cross-device sync protocol` | — | ✅ Implemented | P2P sync spec (open, any node can implement) |

### 4.3 CRDT Components (Verified)

> **AUDIT NOTE**: NEW SECTION — verified network CRDT implementations.

| Component | Source Location | What It Does |
|-----------|----------------|--------------|
| `ConversationCRDT` | `network/src/crdt/ConversationCRDT.ts` | Conflict-free conversation data |
| `CircleCRDT` | `network/src/crdt/CircleCRDT.ts` | Circle/community CRDT |
| `GroupCRDT` | `network/src/crdt/GroupCRDT.ts` | Group CRDT |
| `TeamCRDT` | `network/src/crdt/TeamCRDT.ts` | Team CRDT |
| `FriendCRDT` | `network/src/crdt/FriendCRDT.ts` | Friend relationship CRDT |
| `FollowCRDT` | `network/src/crdt/FollowCRDT.ts` | Follow system CRDT |
| `CRDTSyncService` | `network/src/crdt/CRDTSyncService.ts` | CRDT synchronization service |
| `VectorClock` | `network/src/crdt/VectorClock.ts` | Vector clock for causality |

### 4.4 DHT & Security

| Component | Source Location | What It Does |
|-----------|----------------|--------------|
| `DHTService` | `network/src/dht/DHTService.ts` | Distributed hash table service |
| `ContentRegistry` | `network/src/dht/ContentRegistry.ts` | Content registration and discovery |
| `E2EEncryption` | `network/src/security/E2EEncryption.ts` | End-to-end encryption |
| `KeyManager` | `network/src/security/KeyManager.ts` | Key management for network |

### 4.5 Protocols (Roadmap)

| Protocol | What It Does | Target |
|----------|--------------|--------|
| `activitypub` | ActivityPub implementation — federated social and sharing | Q3 2025 |
| `exit-node` | Exit node protocol for network routing | Q4 2025 |
| `chat protocol` | Chat protocol types and handlers | Q2 2025 |

### 4.6 SDK Nodes (Implemented, Roadmap-Gap)

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

### 5.2 SDK Core Components

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

### 5.3 SDK Apps

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

### 5.4 Token Standards

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

### 5.5 Services

Open-source service infrastructure included in the SDK:

| Service | What It Does |
|---------|--------------|
| `audit-logging-service` | Comprehensive audit logging (open implementation; enterprise gets managed compliance version) |
| `sharing-encryption-service` | Encrypted sharing services |
| `sso-service` | Single sign-on (open implementation; enterprise gets SAML/SCIM managed version) |
| `error-reporting-service` | Error reporting and tracking |
| `access-grant-manager` | Access control and grants |

### 5.6 Extensions System

| Extension | What It Does |
|-----------|--------------|
| `tool-ui-adapter` | Tool UI integration adapter |
| `assistant-ui-adapter` | Assistant UI integration |
| `extension-system` | Plugin extension system (anyone can build and publish VIVIM extensions) |

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
# ✓ 9+ provider import parsers (ChatGPT, Claude, DeepSeek, Gemini, Grok, Kimi, Mistral, Qwen, Zai)
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
| All provider parsers (9+) | ✅ | ✅ |
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

### 6.4 PWA Components

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

### 7.3 LangChain Interface

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

## Pillar 8 — Self-Hosted Infrastructure Services

> **AUDIT NOTE**: NEW PILLAR — Infrastructure services that enable full self-hosted deployment.

### 8.1 Context Services (Verified)

| Service | Source Location | What It Does |
|---------|----------------|--------------|
| `context-orchestrator` | `server/src/context/context-orchestrator.ts` | Orchestrates context assembly pipeline |
| `conversation-context-engine` | `server/src/context/conversation-context-engine.ts` | Conversation-level context management |
| `context-pipeline` | `server/src/context/context-pipeline.ts` | Context processing pipeline |
| `context-cache` | `server/src/context/context-cache.ts` | Context caching layer |
| `context-event-bus` | `server/src/context/context-event-bus.ts` | Event bus for context events |
| `context-telemetry` | `server/src/context/context-telemetry.ts` | Telemetry and metrics |

### 8.2 Memory Services (Verified)

| Service | Source Location | What It Does |
|---------|----------------|--------------|
| `memory-service` | `server/src/context/memory/memory-service.ts` | Core memory operations |
| `memory-retrieval-service` | `server/src/context/memory/memory-retrieval-service.ts` | Memory retrieval and search |
| `memory-consolidation-service` | `server/src/context/memory/memory-consolidation-service.ts` | Memory consolidation and cleanup |

### 8.3 Utility Services (Verified)

| Service | Source Location | What It Does |
|---------|----------------|--------------|
| `embedding-service` | `server/src/context/utils/embedding-service.ts` | Embedding generation |
| `token-estimator` | `server/src/context/utils/token-estimator.ts` | Token estimation |
| `acu-quality-scorer` | `server/src/context/utils/acu-quality-scorer.ts` | ACU quality scoring |
| `circuit-breaker-service` | `server/src/context/utils/circuit-breaker-service.ts` | Circuit breaker for external calls |
| `zai-service` | `server/src/context/utils/zai-service.ts` | ZAI integration |
| `settings-service` | `server/src/context/settings-service.ts` | User settings management |
| `settings-integration` | `server/src/context/settings-integration.ts` | Settings integration |

---

## The Open Core / Commercial Boundary

The boundary is defined by a single question: **does this require VIVIM to operate, or does it require VIVIM to be trusted?**

### What is always open:

- All intelligence: context assembly, ACU processing, memory classification, retrieval
- All protocols: ACU spec, DID, ActivityPub, federation, MCP
- All parsers: every provider import library (9+ providers)
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

- [x] Publish ACU specification as a standalone versioned document at `spec.vivim.live`
- [x] Ship OpenAI + Claude + DeepSeek + Gemini + 5 more import parsers as the headline open-source release
- [ ] Release `@vivim/sdk` v1.0 on npm with full documentation
- [x] Publish MCP server — get VIVIM into Claude Desktop and Cursor immediately
- [ ] Docker Compose one-click self-hosted deployment
- [ ] Write developer documentation for all 8 pillars
- [x] Resolve P0 documentation debt from gap list (this document)

### Q3 2025: Build the ecosystem

- [ ] Full provider import library (12+ providers)
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
| Provider parsers available | 9 | 12 | 15+ |
| External contributors | 1 | 5 | 10+ |
| Community integrations | 3 | 6 | 10+ |
| ACU spec external adoptions | 0 | 1 | 3+ |

### Commercial Conversion

*Commercial metrics TBD — Pre-MVP mode. Focus is on validating the open core.*

---

## Audit Summary

### Changes from v1.0 to v1.1

| Category | Change | Impact |
|----------|--------|--------|
| **Pillar Count** | 7 → 8 | Added Pillar 8 (Infrastructure Services) |
| **Parser Coverage** | 1 implemented → 9 implemented | Major expansion of documented providers |
| **Import Service** | Not documented → Documented | Added import-service.js and streaming-import-service |
| **Storage-V2** | Listed as implemented → Needs verification | Some components marked as Roadmap |
| **Network Components** | Generic → Verified with file paths | Added CRDT components, DHT, security |
| **Context Components** | 15+ generic → 39 verified files | Complete inventory with source locations |

### Key Findings

1. **Parser count was significantly underestimated**: The codebase contains 9 provider extractors, not 1
2. **Import service infrastructure exists but undocumented**: import-service.js (850 lines) provides full import pipeline
3. **Context engine is more complete than documented**: 39 context-related TypeScript files exist
4. **Network layer has extensive CRDT support**: 8+ CRDT implementations for various data types

---

## The One-Paragraph Summary

VIVIM open-sources the complete intelligence layer for sovereign AI memory: the ACU specification (the open standard for addressable AI memory units), the 8-layer context assembly engine, provider import parsers for every major AI platform (9 providers implemented: ChatGPT, Claude, DeepSeek, Gemini, Grok, Kimi, Mistral, Qwen, Zai), the DID-based identity and key management system, the P2P federation network with CRDT-based sync, and the full self-hosted stack. These components — 100+ implemented, permanently free — are the moat: they build the developer trust and ecosystem adoption that no proprietary competitor can replicate, because a proprietary vendor cannot make the same sovereignty promise. The commercial layer — VIVIM Cloud, Teams, and Enterprise — sells managed operational reliability on top of this open foundation. The open core is not the cost of doing business. It is the business.

---

*Blueprint Version: 1.1*
*Last Updated: March 2026*
*Maintainer: VIVIM Core Team*
*Feedback: [vivim.live](https://vivim.live)*
*Audit conducted: March 2026*
