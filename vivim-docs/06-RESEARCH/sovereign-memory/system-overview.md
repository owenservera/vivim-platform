# System Architecture Overview

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Sovereign Memory System                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────┐         ┌──────────────────┐              │
│  │   Client Layer   │         │   Server Layer   │              │
│  │  (Browser/Mobile)│         │   (Optional)     │              │
│  └──────────────────┘         └──────────────────┘              │
│           │                           │                           │
│           │ REST/GraphQL/WebSocket    │                           │
│           v                           v                           │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │         Storage & Sync Protocol Layer                    │    │
│  ├──────────────────────────────────────────────────────────┤    │
│  │                                                          │    │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐         │    │
│  │  │ DAG Storage│  │Vector Store│  │Crypto Engine│         │    │
│  │  │(IndexedDB) │  │(pgvector)  │  │(Web Crypto) │         │    │
│  │  └────────────┘  └────────────┘  └────────────┘         │    │
│  │                                                          │    │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐         │    │
│  │  │Context Eng. │  │Prediction  │  │Portability │         │    │
│  │  │ Compiler   │  │  Engine    │  │  Service   │         │    │
│  │  └────────────┘  └────────────┘  └────────────┘         │    │
│  │                                                          │    │
│  └──────────────────────────────────────────────────────────┘    │
│                           │                                      │
│                           v                                      │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │              Intelligence Layer                           │    │
│  ├──────────────────────────────────────────────────────────┤    │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐        │    │
│  │  │   Cortex   │  │  Memory    │  │   Context  │        │    │
│  │  │(Situation)│  │ Extraction │  │ Assembler  │        │    │
│  │  └────────────┘  └────────────┘  └────────────┘        │    │
│  └──────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                 External Integrations                    │    │
│  │     AI Providers │ P2P Network │Cloud Backup│ Identity │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Component Breakdown

### 1. Client Layer

The client layer runs on user devices (browser, mobile, desktop) and provides the interface for interacting with Sovereign Memory.

#### Responsibilities

- **User Interface**: React-based web app, native mobile apps, desktop applications
- **Local Storage**: IndexedDB for local-first data persistence
- **Key Management**: Web Crypto API for secure key generation and operations
- **Offline Capability**: Full functionality without network connectivity
- **P2P Coordination**: WebRTC/WebSocket for peer-to-peer synchronization

#### Technology Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| Frontend | React 18+ with TypeScript | UI Framework |
| Mobile | React Native | Cross-platform mobile |
| Desktop | Electron/Tauri | Native desktop apps |
| Storage | IndexedDB with Dexie.js | Local database |
| Crypto | Web Crypto API | Cryptographic operations |
| Real-time | WebSocket/WebRTC | Live sync |

#### Client Architecture

```
┌─────────────────────────────────────────────┐
│              Client Application              │
├─────────────────────────────────────────────┤
│                                             │
│  ┌──────────────────────────────────────┐  │
│  │          UI Components                │  │
│  │  Memory View │ Context Panel │ Search │  │
│  └──────────────────┬───────────────────┘  │
│                     │                      │
│  ┌──────────────────▼───────────────────┐  │
│  │         State Management             │  │
│  │    (Zustand / TanStack Query)       │  │
│  └──────────────────┬───────────────────┘  │
│                     │                      │
│  ┌──────────────────▼───────────────────┐  │
│  │        SDK / Core Layer              │  │
│  │  Memory Service │ Context Service    │  │
│  └──────────────────┬───────────────────┘  │
│                     │                      │
│  ┌──────────────────▼───────────────────┐  │
│  │       Storage & Sync Layer           │  │
│  │  DAG Store │ Vector Store │ Crypto   │  │
│  └──────────────────────────────────────┘  │
│                                             │
└─────────────────────────────────────────────┘
```

---

### 2. Server Layer (Optional)

The server layer provides optional cloud services for multi-device coordination and enterprise features.

#### Responsibilities

- **Multi-user Coordination**: User authentication and authorization
- **Centralized Storage**: Optional cloud backup and restore
- **Team Collaboration**: Shared knowledge bases and circles
- **Enterprise Features**: SSO, audit logs, compliance reporting

#### Deployment Models

| Model | Description | Use Case |
|-------|-------------|----------|
| **Local-Only** | No server required | Personal use, privacy-first |
| **Self-Hosted** | Your own server | Teams, privacy requirements |
| **Managed Cloud** | SaaS deployment | Enterprise, ease of use |

#### Technology Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| Runtime | Node.js 20+ / Bun | JavaScript runtime |
| Database | PostgreSQL 16+ | Primary data store |
| Vector DB | pgvector | Semantic search |
| Cache | Redis 7+ | Caching layer |
| API | Express.js / Hono | REST API |
| Real-time | Socket.IO | WebSocket server |

---

### 3. Storage Layer

#### 3.1 DAG Storage Engine

The Directed Acyclic Graph (DAG) storage engine provides content-addressed storage with cryptographic integrity.

**Key Features:**

- **Content Addressing**: IPFS-style CIDs for deduplication
- **Merkle Trees**: Cryptographic proof of data integrity
- **Fork/Merge**: Branching and merging like version control
- **4-Tier Storage**: Hot/Warm/Cold/Archive optimization

**Data Structure:**

```typescript
interface MemoryNode {
  // Content address (immutable identifier)
  id: Hash;                    // Format: sovereign:sha3-256:...
  
  // Node type
  type: 'memory' | 'note' | 'conversation' | 'context';
  
  // Content blocks
  content: ContentBlock[];
  
  // DAG pointers (supports branching)
  parents: Hash[];
  children?: Hash[];
  
  // Provenance
  timestamp: ISO8601;
  author: DID;                 // did:key:z...
  signature: Signature;        // Ed25519 signature
  
  // Privacy
  encrypted: boolean;
  visibility: 'local' | 'shared' | 'public';
  
  // Search
  embeddings?: number[];       // Vector embedding
  keywords?: string[];         // For keyword search
  
  // Relationships
  linksFrom?: AcuLink[];
  linksTo?: AcuLink[];
}

interface ContentBlock {
  type: 'text' | 'code' | 'image' | 'file';
  mimeType: string;
  data: string | Uint8Array;
  encryption?: {
    algorithm: 'AES-256-GCM';
    iv: string;
  };
}
```

**Storage Tiers:**

| Tier | Storage | Access Time | Use Case |
|------|---------|-------------|----------|
| Hot | Memory | < 1ms | Active memories |
| Warm | SSD/Local | < 10ms | Recent memories |
| Cold | Cloud Storage | < 1s | Older memories |
| Archive | Cold Storage | Hours | Archived/Historical |

#### 3.2 Vector Store

Provides semantic search capabilities for intelligent memory retrieval.

**Features:**

- **Semantic Search**: pgvector for similarity search
- **Hybrid Search**: Combines semantic and keyword search
- **HNSW Indexes**: Approximate nearest neighbor for performance
- **Multi-Model**: Supports different embedding models

**Configuration:**

```typescript
interface VectorStoreConfig {
  // Embedding model
  model: 'text-embedding-3-small' | 'text-embedding-3-large' | 'custom';
  dimension: 1536 | 3072;
  
  // Index configuration
  index: {
    type: 'hnsw' | 'ivf';
    efConstruction: number;  // For HNSW
    m: number;              // For HNSW
  };
  
  // Similarity metrics
  metric: 'cosine' | 'euclidean' | 'dot_product';
}
```

---

### 4. Context Engine

The Context Engine transforms raw memories into intelligent context for AI interactions.

#### 4.1 Context Compiler

Compiles multiple data sources into optimized context bundles for AI prompts.

**Bundle Types:**

| Bundle | Tokens | Content | Refresh TTL |
|--------|--------|---------|-------------|
| IDENTITY_CORE | ~200 | User identity, role, background | 24 hours |
| GLOBAL_PREFS | ~150 | Preferences, style, requirements | 12 hours |
| TOPIC | ~500 | Topic-specific knowledge | 4 hours |
| ENTITY | ~400 | Entity-specific context | 6 hours |
| CONVERSATION | ~300 | Recent messages | 30 minutes |

**Compilation Process:**

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Sources   │────►│  Fetch &    │────►│  Priority   │
│             │     │   Rank      │     │   Apply     │
└─────────────┘     └─────────────┘     └─────────────┘
                                               │
                                               ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Output    │◄────│   Format    │◄────│   Budget    │
│   Context   │     │   for LLM   │     │   Apply     │
└─────────────┘     └─────────────┘     └─────────────┘
```

**Token Budget Algorithm:**

```typescript
interface TokenBudget {
  total: number;
  allocation: {
    system: number;      // System prompt
    identity: number;   // User identity
    memories: number;   // Relevant memories
    entities: number;   // Entity context
    topics: number;     // Topic context
    history: number;    // Conversation history
    padding: number;    // Response buffer
  };
}

// Dynamic adjustment based on query type
const budget = calculateBudget({
  queryType: 'factual' | 'creative' | 'debugging' | 'casual',
  urgency: 'high' | 'normal' | 'low',
  userPreferences: user.preferences,
  availableTokens: 8000,
});
```

#### 4.2 Prediction Engine

Predicts what context will be needed and pre-compiles bundles.

**Features:**

- **Context Pre-warming**: Pre-compiles likely bundles
- **Usage Pattern Learning**: Learns from user behavior
- **Cross-Device Sync**: Shares predictions across devices
- **Presence Tracking**: Real-time activity detection

**Prediction Flow:**

```
User Activity
     │
     ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Analyze   │────►│  Predict    │────►│ Pre-compile │
│   Context   │     │  Needs      │     │   Bundles   │
└─────────────┘     └─────────────┘     └─────────────┘
                                               │
                                               ▼
                                        ┌─────────────┐
                                        │    Cache    │
                                        │   Ready     │
                                        └─────────────┘
```

---

### 5. Intelligence Layer

#### 5.1 Cortex (Situation Detection)

Cortex analyzes user behavior to detect their current working context.

**Capabilities:**

- **Pattern Classification**: Detects working patterns (coding, research, casual)
- **Context Switching**: Identifies transitions between work modes
- **12 Archetypes**: Pre-defined working patterns
- **State Machine**: Maintains user activity state

**Working Archetypes:**

| Archetype | Description | Context Priority |
|-----------|-------------|------------------|
| Deep Work | Focused coding/research | Minimal interruptions |
| Casual Chat | General conversation | Personal context |
| Learning | Acquiring new knowledge | Educational, patient |
| Debugging | Problem-solving | Technical, detailed |
| Planning | Strategic thinking | Project context |
| Creative | Brainstorming | Open, expansive |
| Review | Code/project review | Critical, thorough |
| Communication | Team coordination | Relationship context |
| Admin | Routine tasks | Efficiency focus |
| Teaching | Explaining concepts | Clear, educational |
| Writing | Content creation | Contextual reference |
| Meeting | Synchronous discussion | Summarized history |

**Adaptive Context Assembly:**

Based on detected archetype, Cortex adjusts:

- Token allocation percentages
- Memory type priorities
- Conversation history depth
- Entity/topic focus

#### 5.2 Memory Extraction

Automatically extracts meaningful memories from conversations and interactions.

**Extraction Process:**

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Analyze    │────►│   Extract   │────►│   Validate  │
│  Content    │     │   Memories  │     │   & Score   │
└─────────────┘     └─────────────┘     └─────────────┘
                                               │
                                               ▼
                                        ┌─────────────┐
                                        │   Store &   │
                                        │   Index     │
                                        └─────────────┘
```

**Extraction Categories:**

| Category | Example |
|----------|---------|
| Identity | User's role, skills, background |
| Preferences | Communication style, technical preferences |
| Goals | Stated intentions, aspirations |
| Knowledge | Factual information shared |
| Relationships | People, teams, organizations |
| Projects | Current/past projects, tasks |
| Procedures | How-to knowledge, workflows |
| Events | Significant conversations, milestones |

#### 5.3 Memory Consolidation

Intelligently merges similar memories to prevent duplication.

**Consolidation Triggers:**

- High similarity (> 0.85) between memories
- Contradictory information detected
- Time-based aging (30+ days)
- Explicit user merge request

**Merge Strategy:**

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Identify │────►│   Resolve   │────►│   Create    │
│   Similar  │     │ Contradic-  │     │   Merged    │
│   Memories  │     │   tions     │     │   Memory    │
└─────────────┘     └─────────────┘     └─────────────┘
       │                                       │
       ▼                                       ▼
┌─────────────┐                         ┌─────────────┐
│   Archive   │                         │   Update    │
│  Originals  │                         │   Index     │
└─────────────┘                         └─────────────┘
```

---

### 6. Integration Layer

#### 6.1 AI Provider Integration

Connects with major AI providers while maintaining privacy.

**Supported Providers:**

| Provider | Status | Features |
|----------|--------|----------|
| OpenAI | ✅ | GPT-4, GPT-4 Turbo |
| Anthropic | ✅ | Claude 3 Opus, Sonnet |
| Google | ✅ | Gemini Pro, Ultra |
| Open Source | 🔄 | Llama, Mistral |
| Local | 📋 | Ollama, LM Studio |

**Privacy-Preserving Integration:**

- All context processing happens locally
- Only compiled context sent to AI providers
- No training data shared with providers
- Ephemeral API calls (no persistence)

#### 6.2 P2P Network

Enables device-to-device sync without central servers.

**Protocol Stack:**

| Layer | Technology |
|-------|------------|
| Transport | WebRTC, WebSocket |
| Discovery | LibP2P, mDNS |
| Messaging | GossipSub |
| Sync | CRDT, HLC |

#### 6.3 Identity Providers

Supports multiple authentication methods.

| Provider | Use Case |
|----------|----------|
| did:key | Self-sovereign identity |
| Google OAuth | Social login |
| GitHub OAuth | Developer login |
| SAML/OIDC | Enterprise SSO |

---

## Data Flow

### Memory Creation Flow

```
User Action
     │
     ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Create    │────►│  Encrypt   │────►│   Sign     │
│   Memory    │     │  Content   │     │   Author   │
└─────────────┘     └─────────────┘     └─────────────┘
                                            │
                                            ▼
                                    ┌─────────────┐
                                    │   Create    │
                                    │  Merkle     │
                                    │   Proof     │
                                    └─────────────┘
                                            │
                                            ▼
                                    ┌─────────────┐
                                    │    Store    │
                                    │  to DAG     │
                                    └─────────────┘
                                            │
                     ┌──────────────────────┴──────────────────────┐
                     │                                             │
                     ▼                                             ▼
              ┌─────────────┐                               ┌─────────────┐
              │   Index to  │                               │   Sync to  │
              │   Vector    │                               │   Peers    │
              │   Store     │                               │   (P2P)    │
              └─────────────┘                               └─────────────┘
```

### Context Retrieval Flow

```
User Query
     │
     ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Analyze   │────►│   Hybrid   │────►│   Rank &   │
│   Intent    │     │   Search   │     │   Filter   │
└─────────────┘     └─────────────┘     └─────────────┘
                                             │
                                             ▼
                                    ┌─────────────┐
                                    │   Compile   │
                                    │   Context   │
                                    │   Bundle    │
                                    └─────────────┘
                                             │
                                             ▼
                                    ┌─────────────┐
                                    │   Send to   │
                                    │     AI      │
                                    └─────────────┘
```

---

## Security Architecture

### Encryption Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   User's   │────►│   Device   │────►│  Content   │
│   Master   │     │   Key      │     │   Key      │
│   Key      │     │  (X25519)  │     │ (AES-256)  │
└─────────────┘     └─────────────┘     └─────────────┘
                                               │
                                               ▼
                                    ┌─────────────┐
                                    │   Encrypt  │
                                    │   Memory   │
                                    │   Content  │
                                    └─────────────┘
```

### Key Hierarchy

```
Master Key (User Password + PBKDF2, 100k iterations)
    │
    ├─► Device Key 1 (Derived, encrypted with Master)
    ├─► Device Key 2 (Derived, encrypted with Master)
    ├─► Device Key N (Derived, encrypted with Master)
    │
    └─► Recovery Key (Derived, encrypted with Master)
            │
            ├─► Recovery Phrase (BIP-39)
            └─► Social Recovery (Shamir's Secret Sharing)
```

---

## Scalability

### Performance Characteristics

| Operation | Latency | Throughput |
|-----------|---------|------------|
| Memory Create | < 50ms | 1000/sec |
| Memory Search | < 100ms | 500/sec |
| Context Compile | < 200ms | 100/sec |
| Sync (P2P) | < 500ms | 10MB/sec |

### Scaling Strategies

1. **Horizontal Scaling**: Add more storage nodes
2. **Caching**: Multi-layer cache (L1 memory, L2 Redis, L3 DB)
3. **Indexing**: Optimize vector and keyword indexes
4. **Compression**: Reduce storage and transfer size
5. **Sharding**: Partition by user/organization
