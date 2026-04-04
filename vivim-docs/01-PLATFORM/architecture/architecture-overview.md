# System Architecture Overview

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Sovereign Memory System                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                │
│  ┌──────────────────┐         ┌──────────────────┐          │
│  │   Client Layer   │         │   Server Layer   │          │
│  │  (Browser/Mobile)│         │   (Optional)      │          │
│  └──────────────────┘         └──────────────────┘          │
│           │                           │                       │
│           │ REST/GraphQL/WebSocket    │                       │
│           v                           v                       │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │         Storage & Sync Protocol Layer                  │  │
│  ├──────────────────────────────────────────────────────────┤  │
│  │                                                          │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐      │
│  │  │ DAG Storage│  │Vector Store│  │Crypto Engine│      │
│  │  │(IndexedDB) │  │(pgvector)  │  │(Web Crypto) │      │
│  │  └────────────┘  └────────────┘  └────────────┘      │
│  │                                                          │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐      │
│  │  │Context Eng. │  │Prediction  │  │Portability │      │
│  │  │ Compiler   │  │  Engine    │  │  Service   │      │
│  │  └────────────┘  └────────────┘  └────────────┘      │
│  │                                                          │
│  └──────────────────────────────────────────────────────────┘  │
│                           │                                  │
│                           v                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              External Integrations                      │  │
│  ├──────────────────────────────────────────────────────────┤  │
│  │  AI SDKs │ P2P Sync │Cloud Backup│Identity Provider │  │
│  └─────────┬───────┬────────┬───────────┬──────────────┘  │
└────────────┼───────┼────────┼───────────┼─────────────────┘
             │       │        │           │
        ChatGPT Claude   IPFS    did:key
        GitHub  Copilot  WebRTC  SAML/OIDC
```

## Component Breakdown

### 1. Client Layer

The client layer runs on user devices (browser, mobile, desktop) and provides:

**Responsibilities:**
- User interface and interactions
- Local data storage (IndexedDB)
- Cryptographic key management
- Offline capability
- P2P sync coordination

**Technologies:**
- React 18+ with TypeScript
- PWA with service workers
- Web Crypto API
- IndexedDB with Dexie
- WebSocket/WebRTC for real-time sync

### 2. Server Layer (Optional)

The server layer provides optional cloud services for:

**Responsibilities:**
- Multi-user coordination
- Centralized storage (optional)
- Backup and recovery
- Team collaboration features
- Enterprise authentication

**Technologies:**
- Node.js 20+ with TypeScript
- PostgreSQL 16+ with pgvector
- Redis 7+ for caching
- WebSocket server for real-time sync
- Express.js REST API

### 3. Storage Layer

#### DAG Storage Engine
- **Content-addressed storage**: IPFS-style CIDs for deduplication
- **Merkle trees**: Cryptographic proof of data integrity
- **Fork/Merge**: Branching and merging like version control
- **Compression**: 4-tier storage optimization (hot/warm/cold/archive)

**Key Features:**
```typescript
interface MemoryNode {
  id: Hash;                    // Content-addressed (sovereign:sha3-256:...)
  type: 'memory' | 'note' | 'conversation';
  content: ContentBlock[];
  parents: Hash[];             // DAG pointers
  timestamp: ISO8601;
  author: DID;                 // did:key:z...
  signature: Signature;        // Ed25519
  encrypted: boolean;
  embeddings?: number[];       // Vector embedding
}
```

#### Vector Store
- **Semantic search**: pgvector for similarity search
- **Hybrid search**: Combines semantic and keyword search
- **Approximate matching**: HNSW indexes for performance
- **Multi-model**: Supports different embedding models

### 4. Context Engine

#### Context Compiler
- **Multi-source compilation**: Combines identity, preferences, topics, entities, conversations
- **Thermodynamic optimization**: Optimizes token allocation
- **Caching**: Pre-computed bundles for prediction
- **Dynamic budgets**: Adaptive token allocation based on situation

**Bundle Types:**
- `IDENTITY_CORE`: User identity and preferences (~200 tokens)
- `GLOBAL_PREFS`: Global settings and preferences (~150 tokens)
- `TOPIC`: Topic-specific context (~500 tokens)
- `ENTITY`: Entity-specific context (~400 tokens)
- `CONVERSATION`: Recent conversation history (~300 tokens)

#### Prediction Engine
- **Context pre-warming**: Pre-compiles likely bundles
- **Usage patterns**: Learns from user behavior
- **Cross-device sync**: Shares predictions across devices
- **Presence tracking**: Real-time activity detection

### 5. Cortex (Intelligent Adaptation)

#### Situation Detector
- **Pattern classification**: Detects working patterns (coding, research, casual, etc.)
- **Context switching**: Identifies transitions between work modes
- **12 Archetypes**: Pre-defined working patterns
- **State machine**: Maintains user activity state

#### Adaptive Context Assembler
- **Budget reshaping**: Adjusts token allocation based on detected situation
- **Priority adjustment**: Prioritizes relevant context types
- **Dynamic layers**: Implements 4-layer context composition
- **Learning**: Improves accuracy from user corrections

#### Memory Compression Service
- **4-tier storage**: Hot/warm/cold/archive optimization
- **Vector quantization**: Int8, binary, and sparse representations
- **SimHash**: Approximate retrieval for large collections
- **Importance scoring**: 0-1 score for retention policy

### 6. Sync Protocol

#### CRDT-Based Sync
- **Conflict-free replication**: No data conflicts in normal operation
- **Convergence**: All devices eventually reach same state
- **Offline-first**: Works without network connection
- **P2P capable**: Direct device-to-device sync

#### HLC Timestamps
- **Hybrid Logical Clocks**: Combines physical and logical time
- **Ordering**: Causal ordering across devices
- **Tolerance**: Configurable clock skew tolerance
- **Idempotence**: No duplicate operations

#### Conflict Resolution
- **Last-Write-Wins (LWW)**: For non-critical data
- **Semantic Merge**: For text content
- **User Prompt**: For critical conflicts
- **Manual Resolution**: UI-driven merge editor

### 7. Security Layer

#### Cryptographic Primitives
- **Ed25519**: Digital signatures for all operations
- **X25519**: Key exchange for encryption
- **SHA-3 (Keccak-256)**: Quantum-resistant content hashing
- **AES-256-GCM**: Content encryption

#### Key Management
- **PBKDF2**: Password-derived key encryption (100k iterations)
- **Device keys**: Derived per-device encryption keys
- **Recovery keys**: Social recovery with Shamir's Secret Sharing
- **Key rotation**: Forward-compatible key rotation

#### Privacy Model
- **Privacy states**: LOCAL, SHARED, PUBLIC
- **Access control**: Fine-grained permissions
- **Audit logging**: Immutable audit trail
- **Selective disclosure**: Share only what you choose

### 8. Portability Layer

#### Export Formats
- **sovereign-v1**: Native format with cryptographic proofs
- **JSON**: Simple export for compatibility
- **ActivityPub**: Fediverse-compatible
- **AT Protocol**: Bluesky-compatible
- **Markdown**: Human-readable export

#### Import Capabilities
- **ChatGPT exports**: ZIP file parsing
- **Claude exports**: Conversation import
- **Generic JSON**: Standard format support
- **Conflict resolution**: Merge strategies for imports

## Data Flow

### Memory Creation Flow

```
User Input
    │
    ├─► Content Analysis
    │      ├─► Text extraction
    │      ├─► Entity recognition
    │      └─► Topic classification
    │
    ├─► Content Addressing
    │      ├─► SHA-3 hashing
    │      └─► CID generation
    │
    ├─► Cryptographic Signing
    │      ├─► Ed25519 signature
    │      └─► DID verification
    │
    ├─► Vector Embedding
    │      ├─► LLM embedding generation
    │      └─► pgvector indexing
    │
    └─► DAG Storage
           ├─► Merkle tree construction
           ├─► IndexedDB storage
           └─► Sync queue
```

### Context Compilation Flow

```
Context Request
    │
    ├─► Situation Detection
    │      └─► Cortex pattern recognition
    │
    ├─► Budget Allocation
    │      ├─► Token thermodynamics
    │      └─► Adaptive layering
    │
    ├─► Source Selection
    │      ├─► Identity core
    │      ├─► Global preferences
    │      ├─► Topics/Entities
    │      └─► Conversation history
    │
    ├─► Semantic Retrieval
    │      ├─► Vector search
    │      └─► Keyword search
    │
    ├─► Bundle Assembly
    │      ├─► Prompt construction
    │      ├─► Token counting
    │      └─► Cryptographic signing
    │
    └─► Cache Storage
           ├─► Bundle validation
           └─► Pre-warming
```

### Sync Flow

```
Sync Operation
    │
    ├─► Operation Logging
    │      ├─► HLC timestamp
    │      ├─► CRDT operation
    │      └─► Queue
    │
    ├─► Network Coordination
    │      ├─► Handshake (P2P or Server)
    │      ├─► Delta exchange
    │      └─► Ordering
    │
    ├─► Conflict Detection
    │      ├─► Vector clock comparison
    │      └─► Merge analysis
    │
    ├─► Resolution
    │      ├─► Automatic (LWW, semantic)
    │      └─► Manual (UI prompt)
    │
    └─► Application
           ├─► DAG update
           ├─► Merkle verification
           └─► Index update
```

## Deployment Models

### Local-First Mode
```
User Device
    │
    ├─► IndexedDB (DAG + Vectors)
    ├─► Web Crypto (Keys)
    └─► Local LLM (Optional)

No cloud dependency
```

### Self-Hosted Mode
```
User Device
    │
    └─► Sync (WebRTC/WebSocket)
           │
           v
Self-Hosted Server
    │
    ├─► PostgreSQL + pgvector
    ├─► S3/MinIO (Storage)
    └─► Optional LLM APIs
```

### Managed Cloud Mode
```
User Device
    │
    └─► HTTPS + WebSocket
           │
           v
Sovereign Cloud
    │
    ├─► Managed PDS
    ├─► Sync Service
    └─► Backup
```

## Security Architecture

### Encryption Layers
1. **Content Encryption**: AES-256-GCM with device keys
2. **Transport Encryption**: TLS 1.3 for network communication
3. **Key Exchange**: X25519 ephemeral keys with forward secrecy
4. **Post-Quantum**: Kyber-1024 KEM (planned)

### Identity Model
- **DID-based**: Decentralized identifiers (did:key:z...)
- **Self-sovereign**: User controls identity keys
- **Recoverable**: Social recovery with trusted contacts
- **Portable**: Export identity to any deployment

### Access Control
- **Fine-grained permissions**: Read, write, share, admin
- **Resource-based policies**: Per-memory and per-bundle access
- **Time-bound access**: Expire permissions
- **Audit logging**: Immutable access records

## Performance Characteristics

### Local-First Performance
- **Memory CRUD**: <100ms (local IndexedDB)
- **Context compilation**: <500ms (cached bundles)
- **Search**: <200ms (10K memories, local vector search)
- **Sync**: <2s (between devices, P2P)

### Cloud Performance
- **Memory CRUD**: <200ms (network round-trip)
- **Context compilation**: <500ms (cached on server)
- **Search**: <300ms (10K memories, pgvector)
- **Sync**: <1s (cloud relay)

### Scalability
- **Personal**: 1 user, <100K memories
- **Team**: 10-100 users, <10M memories
- **Enterprise**: 100-10,000 users, <1B memories

---

**Document Version**: 1.0.0
**Last Updated**: 2026-03-09
**Related Documents**:
- [Storage Architecture](../technical/storage/overview.md)
- [Context Engine](../technical/context/overview.md)
- [Security Model](../security/overview.md)
- [Deployment Guide](../deployment/overview.md)
