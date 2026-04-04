# VIVIM Features Documentation

## Overview

VIVIM is a comprehensive AI memory platform with capabilities spanning capture, organization, search, context, sharing, privacy, and developer extensibility. This document provides detailed feature specifications for each major area.

---

## 1. Conversation Capture

### 1.1 Multi-Provider Import

VIVIM captures conversations from every major AI provider through our automated extraction engine.

#### Supported Providers

| Provider | Status | Extraction Method | Auth Type |
|----------|--------|-------------------|-----------|
| ChatGPT | ✅ Production | Playwright + Stealth | Cookie-based |
| Claude | ✅ Production | Playwright + Stealth | Cookie-based |
| Gemini | ✅ Production | Playwright + Stealth | Cookie-based |
| DeepSeek | ✅ Production | Playwright + Stealth | Cookie-based |
| Grok | ✅ Production | Playwright + Stealth | Cookie-based |
| Kimi | ✅ Production | Playwright + Stealth | Cookie-based |
| Mistral | ✅ Production | Playwright + Stealth | Cookie-based |
| Qwen | ✅ Production | Playwright + Stealth | Cookie-based |
| Z.AI | ✅ Production | Playwright + Stealth | Cookie-based |

#### Extraction Capabilities

- **Full conversation history** — All messages including system prompts
- **Metadata capture** — Model, temperature, token counts, timestamps
- **Code preservation** — Syntax highlighting, formatting retained
- **Image/asset handling** — Screenshots, generated images captured
- **Retry logic** — Automatic re-attempt on failure

### 1.2 Capture Methods

#### One-Click OAuth
For providers supporting OAuth (ChatGPT, Claude, Gemini), users connect with a single click. Session tokens are securely stored.

#### API Key Import
For API-based usage, users provide their API keys. Conversations are fetched directly from provider APIs.

#### Bulk Import
Migration from other platforms supported:
- ChatGPT export JSON files
- Claude conversation exports
- Custom JSON in VIVIM schema
- CSV with conversation URLs

#### Manual URL Import
Single conversation import via URL — useful for specific conversations.

### 1.3 Capture Status Tracking

Every captured conversation has a processing status:

| Status | Description | Visual |
|--------|-------------|--------|
| `capturing` | Extraction in progress | Animated progress bar |
| `processing` | ACU segmentation + embedding | Spinning icon |
| `ready` | Fully indexed, searchable | Green checkmark |
| `partial` | Partial success, some messages failed | Yellow warning |
| `failed` | Complete failure | Red error with retry |
| `duplicate` | Already imported | Grey with link to original |

---

## 2. Archive & Organization

### 2.1 Unified Archive

All conversations — regardless of source — exist in a single unified archive. No more switching between providers to find past conversations.

#### Archive Zones

- **All Chats** — Complete conversation history, sorted by last activity
- **Imported** — External captures grouped by provider
- **Active** — In-progress conversations within VIVIM
- **Shared** — Inbox and outbox for social features
- **Collections** — User-organized groupings

### 2.2 Views

Four distinct view modes accommodate different workflows:

#### List View
- Maximum information density
- Compact cards in single column
- Best for power users with 100+ conversations
- Virtualized for performance

#### Grid View
- Responsive masonry layout
- 2-4 columns depending on viewport
- Best for browsing and rediscovery

#### Canvas View (Knowledge Graph)
- Zoomable canvas with React Flow
- Nodes sized by token count
- Color-coded by provider
- Edges show semantic similarity
- Best for visualizing knowledge connections

#### Timeline View
- Horizontal time axis
- Swimlanes per provider
- Grouped by day/week/month
- Best for understanding AI usage evolution

### 2.3 Organization Tools

#### Collections
- Named, ordered lists of conversations
- Multiple collections per conversation
- Private, circle-shared, or public visibility
- AI-suggested collections based on topic clustering

#### Tags & Labels
- Custom tagging system
- Auto-tagging based on topic detection
- Multi-tag filtering

#### Favorites & Pinned
- Pin important conversations
- Quick-access favorites list

---

## 3. Search & Discovery

### 3.1 Search Architecture

VIVIM supports four simultaneous search modes from a single input:

#### Lexical Search
- Full-text search against titles, messages, tags
- Runs client-side against IndexedDB
- Results in < 50ms
- Highlighted matches

#### Semantic Search
- AI-powered meaning-based search
- Embedding comparison against all ACUs
- Returns conceptually relevant results
- Shows relevance score

#### Temporal Search
- Natural language date parsing
- "last month," "when I was learning React"
- Powered by chrono-node
- Filter equivalent in search bar

#### Cross-Conversation Search
- Searches specific message exchanges
- Returns ACU-level results, not just conversations
- "7 specific messages across 3 conversations"

### 3.2 Filters

Composable filters available:

| Filter | Options |
|--------|---------|
| Provider | Multi-select chips |
| Model | Multi-select |
| Date Range | Calendar + presets |
| Status | Imported, Active, Shared, Archived |
| Token Count | Slider |
| Has Code | Toggle |
| Has Math | Toggle |
| Tags | Multi-select |
| Collections | Multi-select |
| Quality Score | Slider |

### 3.3 AI Synthesis

Search results include an AI-generated summary:
> "Across 4 conversations, you've explored HNSW from 3 angles: performance benchmarks, implementation tradeoffs, and memory footprint..."

---

## 4. Context Engine

### 4.1 The 8-Layer System

VIVIM's context engine personalizes AI responses by layering user-specific context:

| Layer | Source | Purpose |
|-------|--------|---------|
| **L0: Identity Core** | vivim-identity-context.json + User model | Stable user facts |
| **L1: Global Prefs** | User.settings JSON | Behavior preferences |
| **L2: Topics** | TopicProfile model | Detected topic interests |
| **L3: Entities** | EntityProfile model | Named entity tracking |
| **L4: Conversation** | Current messages | Active thread context |
| **L5: Composite** | BundleCompiler merge | Pre-merged bundles |
| **L6: JIT ACUs** | pgvector search | Semantically similar past ACUs |
| **L7: JIT Memories** | pgvector search | Relevant extracted memories |

### 4.2 Token Budget Algorithm

- **Default**: 12,000 tokens
- **Range**: 4,096 – 50,000 tokens (configurable)
- **Elasticity**: Each layer has an elasticity score
- **JIT Activation**: Only when budget permits

### 4.3 Context Cockpit

User-facing control panel for context settings:

- `maxContextTokens` — 4096–50000
- `topicSimilarityThreshold` — default 0.35
- `entitySimilarityThreshold` — default 0.40
- `acuSimilarityThreshold` — default 0.35
- `memorySimilarityThreshold` — default 0.40
- Toggle: predictions, JIT retrieval, compression

### 4.4 Context Recipes

Preset configurations for different use cases:
- **Default** — Balanced context
- **Code Review** — High relevance, recent focus
- **Research Mode** — Maximum background context
- **Creative Writing** — Preference-heavy

---

## 5. Atomic Chat Units (ACUs)

### 5.1 What Are ACUs?

ACUs are the fundamental unit of knowledge in VIVIM. Each conversation is decomposed into granular, meaningful chunks.

### 5.2 ACU Properties

| Property | Type | Description |
|----------|------|-------------|
| `id` | string | Unique identifier |
| `authorDid` | DID | Author's decentralized ID |
| `signature` | Ed25519 | Cryptographic authorship proof |
| `content` | text | The actual knowledge unit |
| `language` | string | Detected language |
| `type` | enum | code, explanation, tutorial, etc. |
| `category` | string | Topic category |
| `origin` | string | Source (extraction, creation, etc.) |
| `qualityOverall` | float (0-1) | Composite quality score |
| `contentRichness` | float | Depth and density |
| `structuralIntegrity` | float | Organization and coherence |
| `uniqueness` | float | Rarity vs. other ACUs |
| `rediscoveryScore` | float | Predicted future value |
| `embedding` | vector | Semantic representation |

### 5.3 ACU Generation Process

1. **Parse** — Message content broken into chunks
2. **Classify** — Type and category assigned
3. **Embed** — Vector embedding generated (384-1536 dim)
4. **Sign** — Ed25519 signature for authorship
5. **Score** — Quality metrics calculated
6. **Store** — Persisted with all metadata

---

## 6. Memory System

### 6.1 Memory Types

| Type | Description | Confidence |
|------|-------------|------------|
| **FACTUAL** | Verified facts about the user | High |
| **PREFERENCE** | Detected preferences | Medium |
| **EPISODIC** | Specific past events | Medium |
| **RELATIONSHIP** | Interpersonal context | Low |

### 6.2 Memory Extraction

- **Trigger**: Librarian Worker (30 min after conversation idle)
- **Process**: LLM analyzes → extracts memories → stores with confidence
- **Linking**: Auto-linked to source conversation/ACU

### 6.3 Memory Consolidation

- **Manual trigger**: User-initiated consolidation
- **Process**: Merge similar memories, update importance, prune low-value
- **Frequency**: Recommended monthly

---

## 7. Social Layer

### 7.1 Social Graph

| Feature | Description |
|---------|-------------|
| **Friends** | Bidirectional connections + block |
| **Follows** | One-way subscriptions + mute |
| **Groups** | Open/closed communities |
| **Teams** | Structured organizations |
| **Channels** | Team sub-channels |
| **Circles** | Trust-based inner circles |

### 7.2 Sharing System

#### Share Types
- **Link shares** — Unique code, optional password/expiry
- **Circle shares** — All circle members with roles
- **Direct shares** — Specific users by DID

#### Granular Permissions
- `canView` — Read access
- `canAnnotate` — Add comments
- `canRemix` — Fork and modify
- `canReshare` — Share further

#### Knowledge Pulses
Shareable packages containing:
- Conversation overview (without full content)
- AI-generated synthesis
- ACU highlights
- Link to request full access

### 7.3 Forking & Derivatives

- Fork any conversation at any point
- Forks inherit attribution
- Changes tracked in branch tree
- Merge capability for related conversations

---

## 8. Privacy & Security

### 8.1 Privacy States

| State | Description | Reversible |
|-------|-------------|------------|
| **Local** | Only on user's devices | Yes |
| **Shared** | Encrypted for specific recipients | Yes |
| **Public** | IPFS + on-chain anchor | No |

### 8.2 Encryption

- **At-rest**: XSalsa20-Poly1305 (TweetNaCl)
- **Key exchange**: ML-KEM-1024 (Kyber) quantum-resistant
- **Signatures**: Ed25519
- **Hashing**: SHA-256

### 8.3 Identity

- **DID-based**: Self-sovereign identity
- **No email required**: DID + keypair only
- **Device registration**: Multi-device support

### 8.4 Verification

Zero-trust verification:
1. Extract public key from DID
2. Recreate signed payload
3. Verify signature
4. Confirm content hash

Works anywhere: local, P2P, IPFS, blockchain.

---

## 9. Data Portability

### 9.1 Export Formats

| Format | Use Case |
|--------|----------|
| JSON | Machine-readable backup |
| Markdown | Human-readable archive |
| HTML | Offline viewing |
| ActivityPub | Fediverse sharing |
| ATProtocol | Bluesky ecosystem |

### 9.2 Import

- Import from competitor platforms
- Bulk import from exports
- Migration API for enterprises

---

## 10. Developer Platform

### 10.1 SDK Features

- `@vivim/sdk` — Bun-native TypeScript SDK
- P2P networking with LibP2P
- CRDT sync via Yjs
- DID identity management
- Local-first storage

### 10.2 API Access

- RESTful API
- Webhook support
- MCP (Model Context Protocol) compatible

### 10.3 Self-Hosting

- Docker Compose deployment
- PostgreSQL + Redis backend
- Custom domain support
- SSO integration ready

---

## 11. Admin & Enterprise

### 11.1 Admin Panel

- System health monitoring
- Database query runner (allowlist-secured)
- CRDT document management
- P2P node telemetry
- User management

### 11.2 Enterprise Features

- Self-hosted deployment
- SSO/SAML integration
- Audit logs
- Compliance reporting
- Dedicated support
- Custom integrations

---

## Feature Comparison Matrix

| Feature | Free | Pro | Team | Enterprise |
|---------|------|-----|------|------------|
| Provider captures | 1 | 9 | 9 | 9 |
| Conversations | 50 | Unlimited | Unlimited | Unlimited |
| Semantic search | Basic | Advanced | Advanced | Advanced |
| Context layers | 4 | 8 | 8 | 8 |
| Collections | 3 | Unlimited | Unlimited | Unlimited |
| Sharing | Limited | Full | Full | Full |
| API access | ❌ | ❌ | ✅ | ✅ |
| SSO | ❌ | ❌ | ❌ | ✅ |
| Self-host | ❌ | ❌ | ❌ | ✅ |
| Support | Community | Email | Priority | Dedicated |

---

*Document Version: 1.0*
*Last Updated: 2026-03-17*
