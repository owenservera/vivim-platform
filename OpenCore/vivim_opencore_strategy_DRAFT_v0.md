# VIVIM Open Core Strategy
## The Sovereign AI Memory Infrastructure

---

## The Dual Development Philosophy

VIVIM is built on a belief most infrastructure companies are afraid to commit to:
**the tools that give users freedom should never be locked behind a paywall.**

This isn't charity. It's architecture.

We open-source everything that touches your data — the protocols, the parsers, the context engine, the memory formats. These are the building blocks of sovereignty. They become more valuable the more people use, contribute to, and build on them.

We commercialize managed infrastructure — the layer that requires operational expertise, uptime guarantees, compliance certifications, and organizational trust. This is the layer where enterprises pay not for capability, but for reliability and accountability.

**Open = the intelligence layer. Commercial = the infrastructure layer.**

---

## The Open Toolkit — What's Permanently Free

### 1. The Provider Data Import & Mapping Library

Every AI provider traps your conversation history in proprietary export formats. We are building — and permanently open-sourcing — the most complete library of AI data parsers ever assembled.

**What's included:**
- **OpenAI** — ChatGPT conversation JSON parser, GPT API message history normalizer, custom instructions extractor
- **Anthropic** — Claude.ai export parser, Projects context mapper, system prompt extractor
- **Google** — Gemini conversation importer, Workspace AI history parser
- **Mistral / Groq / Perplexity / Cohere** — API log normalizers
- **Ollama / LM Studio / Jan** — Local model conversation importers (JSON, GGUF metadata)
- **Cursor / Windsurf / Continue** — IDE assistant history extractors
- **Notion AI / Linear Asks / Intercom Fin** — Product tool memory importers
- **Universal format** — Any OpenAI-compatible API output → VIVIM ACU pipeline

Every parser outputs to the same canonical ACU format. Your 3 years of ChatGPT history becomes sovereign VIVIM memory in one command.

```bash
vivim import --provider openai --file conversations.json
vivim import --provider claude --file claude_export.zip
vivim import --provider cursor --dir ~/.cursor/history
```

**Why this is open:** Data portability is a civil right in the AI era. Locking import tooling contradicts everything VIVIM stands for. An open, community-maintained parser library becomes the de facto standard — which drives SDK adoption and VIVIM Cloud onboarding.

---

### 2. The Core Dynamic Context Engine

The 8-layer context assembly system is the intellectual heart of VIVIM. It is, and will always be, open source.

**What's included:**
- **ACU (Atomic Chat Unit) specification** — the canonical format for individually addressable AI memory units. An open standard anyone can implement.
- **ACU segmentation engine** — the algorithm that breaks raw conversation turns into individually searchable, recomposable units with preserved context chains
- **8-layer assembly pipeline** — the L0–L7 context stack builder: Identity Core, Global Preferences, Topic Context, Entity Context, Conversation Arc, JIT Retrieval, Message History, Live Input
- **Semantic retrieval engine** — the vector similarity + keyword hybrid search that powers JIT context assembly
- **Memory type classifier** — the 9-type taxonomy (Episodic, Semantic, Procedural, Factual, Preference, Identity, Relationship, Goal, Project) with automatic classification
- **Context budgeting system** — token allocation logic across the 8 layers, configurable by provider and use case
- **Decay and refresh algorithms** — how memories age, get reinforced, or get promoted between layers
- **Provider-agnostic adapter interface** — the abstraction layer that lets the same context engine serve GPT-4, Claude, Gemini, or any local model

```typescript
import { ContextEngine, ACUStore, MemoryClassifier } from '@vivim/sdk'

const engine = new ContextEngine({
  store: new ACUStore({ adapter: 'sqlite', path: './memory.db' }),
  layers: defaultLayerConfig,
  budget: 12300 // tokens
})

const context = await engine.assemble(userId, currentMessage)
```

**Why this is open:** The context engine *is* the moat, but not because it's secret — because it's *trusted*. Developers building production AI applications need to understand what's happening inside their memory layer. Auditability is a feature. Security researchers, compliance teams, and enterprise architects all need to read the code. Open-sourcing it builds more trust than any whitepaper.

---

### 3. Identity & Portability Primitives

- **DID (Decentralized Identifier) toolkit** — W3C-compliant DID generation, resolution, and key management. Your AI identity, cryptographically yours.
- **Key management library** — zero-knowledge key derivation; encryption keys never leave the user's device
- **Memory export tools** — full ACU database export to JSON, SQLite, or IPFS in documented, open formats. Your memory, readable by humans and machines without VIVIM.
- **Cross-device sync protocol** — the open P2P sync spec used by vivim-network. Anyone can implement a compatible node.
- **Storage adapters** — Local filesystem, SQLite, IPFS, and S3-compatible (self-hosted MinIO, Backblaze B2, etc.)

---

### 4. The Self-Hosted Full Stack

The entire production stack — server, network, PWA — is open and self-hostable.

```bash
# Full sovereign deployment in under 5 minutes
git clone https://github.com/owenservera/vivim-server
docker-compose up -d

# You now have:
# - Full context engine
# - ACU storage with semantic search
# - Provider sync adapters
# - P2P network node
# - PWA frontend
```

**What you get self-hosting:** Everything. 100% feature parity with VIVIM Cloud except managed uptime, automatic backups, and compliance certifications.

---

### 5. Community-Built Integrations Layer

Open-source plugin architecture for extending VIVIM into any AI application:

- **MCP server** (Model Context Protocol) — expose VIVIM memory as an MCP tool for Claude Desktop, Cursor, and any MCP-compatible client
- **LangChain / LlamaIndex memory adapters** — drop-in VIVIM memory for existing AI pipelines
- **n8n / Make / Zapier connectors** — low-code memory automation
- **Browser extension SDK** — capture AI conversations from any web interface
- **Obsidian / Notion / Logseq plugins** — personal knowledge base ↔ AI memory sync

---

## Implementation Status — What's Built Today

The following components are currently implemented in the VIVIM codebase:

### Context Engine (In Production)

| Component | Status | Location |
|------------|--------|-----------|
| ACU Specification | ✅ Implemented | `server/src/context/types.ts` |
| 8-Layer Assembly Pipeline | ✅ Implemented | `server/src/context/context-assembler.ts` |
| Semantic Retrieval Engine | ✅ Implemented | `server/src/context/hybrid-retrieval.ts` |
| Memory Type Classifier (9 types) | ✅ Implemented | `server/src/context/memory/memory-types.ts` |
| Context Budgeting System | ✅ Implemented | `server/src/context/budget-algorithm.ts` |
| Decay & Refresh Algorithms | ✅ Implemented | `server/src/context/context-thermodynamics.ts` |
| Provider-Agnostic Interface | ✅ Implemented | `server/src/services/unified-context-service.ts` |
| Context Prefetch Engine | ✅ Implemented | `server/src/context/context-prefetch-engine.ts` |
| Context Prediction Engine | ✅ Implemented | `server/src/context/context-prediction-engine.ts` |
| Cortex System | ✅ Implemented | `server/src/context/cortex/` |

### Identity & Portability (In Production)

| Component | Status | Location |
|------------|--------|-----------|
| DID Toolkit (W3C Compliant) | ✅ Implemented | `server/src/context/vivim-identity-service.ts` |
| Key Management (Zero-Knowledge) | ✅ Implemented | `sdk/src/utils/crypto.ts` |
| Memory Export Tools | 🔄 In Progress | `server/src/routes/memory.ts` |
| Cross-Device Sync Protocol | ✅ Implemented | `network/src/` |
| Storage Adapters | ✅ Implemented | `sdk/src/protocols/storage/` |

### Storage Infrastructure (In Production)

| Component | Status | Location |
|------------|--------|-----------|
| Storage V2 | ✅ Implemented | `pwa/src/storage/storage-v2.ts` |
| DAG Engine | ✅ Implemented | `pwa/src/storage/storage-v2/dag-engine.ts` |
| Secure Storage | ✅ Implemented | `pwa/src/storage/storage-v2/secure-storage.ts` |
| Merkle Tree | ✅ Implemented | `pwa/src/storage/storage-v2/merkle.ts` |
| L0 Storage | ✅ Implemented | `sdk/src/core/l0-storage.ts` |

### SDK Components (In Production)

| Category | Count | Status |
|----------|-------|--------|
| SDK Nodes | 14 | ✅ Implemented |
| SDK Apps | 11 | ✅ Implemented |
| SDK Protocols | 3 | ✅ Implemented |
| SDK Token Standards | 4 | ✅ Implemented |
| SDK Services | 5 | ✅ Implemented |
| SDK Core | 9 | ✅ Implemented |

### Network & Federation (In Production)

| Component | Status | Location |
|------------|--------|-----------|
| P2P Network Node | ✅ Implemented | `network/` |
| ActivityPub Protocol | ✅ Implemented | `sdk/src/protocols/activitypub/` |
| Federation Server | ✅ Implemented | `network/src/federation/server.ts` |
| Instance Discovery | ✅ Implemented | `sdk/src/nodes/instance-discovery.ts` |

---

## Roadmap — What's Next

### Near-term (Q2 2025)

- OpenAI + Claude import parsers (public launch)
- Google Gemini parser
- Universal OpenAI-compatible API parser
- Memory export to JSON/SQLite/IPFS
- Docker Compose one-click deployment

### Mid-term (Q3 2025)

- Full provider import library (5+ providers)
- LangChain + LlamaIndex adapters
- n8n/Make/Zapier connectors
- Helm chart for Kubernetes

### Long-term (Q4 2025)

- Community-contributed parser framework
- Obsidian + Notion + Logseq plugins
- Browser extension SDK

---

*Last updated: March 2025*
*Status: Pre-MVP — Core infrastructure implemented, commercial layer TBD*
