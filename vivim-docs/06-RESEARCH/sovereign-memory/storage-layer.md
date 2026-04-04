# Storage Layer

## Overview

The Storage Layer is the foundation of Sovereign Memory, providing content-addressed, cryptographically-secure storage with multi-tier optimization for performance and cost.

```
┌─────────────────────────────────────────────────────────────────┐
│                    Storage Layer Architecture                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                   Storage Interface                      │   │
│  │         (Unified API for all storage backends)           │   │
│  └────────────────────┬────────────────────────────────────┘   │
│                       │                                         │
│       ┌───────────────┼───────────────┐                        │
│       │               │               │                         │
│       ▼               ▼               ▼                         │
│  ┌─────────┐    ┌─────────┐    ┌─────────┐                    │
│  │   DAG   │    │ Vector  │    │ Crypto  │                    │
│  │ Storage │    │  Store  │    │ Engine  │                    │
│  └────┬────┘    └────┬────┘    └────┬────┘                    │
│       │               │               │                         │
│       │               │               │                         │
│       ▼               ▼               ▼                         │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                  Storage Backends                        │   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │  IndexedDB  │  PostgreSQL  │  IPFS  │  File System     │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 1. DAG Storage Engine

### Content-Addressed Storage

The DAG (Directed Acyclic Graph) storage engine uses content-addressed storage, where each piece of data is identified by its cryptographic hash.

**Key Principles:**

| Principle | Description |
|-----------|-------------|
| **Immutability** | Content never changes; updates create new nodes |
| **Deduplication** | Identical content shares the same address |
| **Integrity** | Hash verification ensures data hasn't been tampered |
| **Linking** | Nodes reference each other via hashes |

**Node Structure:**

```typescript
interface MemoryNode {
  // Content address (immutable identifier)
  id: Hash;                    // Format: sovereign:sha3-256:abc123...

  // Node metadata
  type: 'memory' | 'note' | 'conversation' | 'context';
  version: number;

  // Content (encrypted or plaintext)
  content: ContentBlock[];

  // DAG pointers (parent references)
  parents: Hash[];
  children?: Hash[];

  // Provenance
  timestamp: ISO8601;
  author: DID;                 // did:key:z...
  signature: Signature;        // Ed25519 signature

  // Privacy settings
  visibility: 'local' | 'shared' | 'public';
  encrypted: boolean;

  // Search optimization
  embeddings?: number[];       // Vector embedding
  keywords?: string[];

  // Relationships
  linksFrom?: AcuLink[];
  linksTo?: AcuLink[];

  // Storage metadata
  storageTier: 'hot' | 'warm' | 'cold' | 'archive';
  createdAt: ISO8601;
  lastAccessedAt?: ISO8601;
}

interface ContentBlock {
  type: 'text' | 'code' | 'image' | 'file' | 'structured';
  mimeType: string;
  data: string | Uint8Array;
  size: number;

  // Encryption metadata
  encryption?: {
    algorithm: 'AES-256-GCM' | 'ChaCha20-Poly1305';
    iv: string;
    keyId?: string;
  };

  // Compression
  compression?: 'gzip' | 'brotli' | 'none';
}
```

### Merkle Tree Structure

Each memory node is part of a Merkle tree, providing cryptographic proof of data integrity:

```
                    ┌─────────────────┐
                    │  Root Hash      │  ← Stored on-chain (optional)
                    │  (Merkle Root)  │
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
        ┌─────▼─────┐  ┌────▼────┐  ┌─────▼─────┐
        │ Branch 1  │  │ Branch 2│  │ Branch 3  │
        │  Hash     │  │  Hash   │  │  Hash     │
        └─────┬─────┘  └────┬────┘  └─────┬─────┘
              │              │              │
        ┌─────┴─────┐  ┌────┴────┐  ┌─────┴─────┐
        │ Leaf 1    │  │ Leaf 2  │  │ Leaf 3    │
        │ (Memory)  │  │(Memory) │  │ (Memory)  │
        └───────────┘  └─────────┘  └───────────┘
```

**Benefits:**
- **Efficient Verification**: Prove a memory exists without downloading everything
- **Incremental Sync**: Only transfer changed branches
- **Tamper Evidence**: Any modification changes the root hash

### Storage Tiers

Sovereign Memory implements 4-tier storage optimization:

| Tier | Storage Medium | Access Time | Cost | Use Case |
|------|----------------|-------------|------|----------|
| **Hot** | Memory (RAM) | < 1ms | High | Active memories, current session |
| **Warm** | SSD/Local Disk | < 10ms | Medium | Recent memories (last 7 days) |
| **Cold** | Cloud Storage | < 1s | Low | Older memories (7-90 days) |
| **Archive** | Cold Storage | Hours | Very Low | Historical (> 90 days) |

**Automatic Tier Management:**

```typescript
interface TierConfig {
  // Hot tier: Always in memory
  hot: {
    maxSize: number;           // e.g., 100MB
    evictionPolicy: 'LRU' | 'LFU';
  };

  // Warm tier: Local SSD
  warm: {
    maxSize: number;           // e.g., 10GB
    maxAge: number;            // e.g., 7 days
  };

  // Cold tier: Cloud storage
  cold: {
    provider: 's3' | 'gcs' | 'azure' | 'ipfs';
    bucket: string;
    maxAge: number;            // e.g., 90 days
  };

  // Archive tier: Long-term storage
  archive: {
    provider: 'glacier' | 'archive' | 'filecoin';
    minAge: number;            // e.g., 90 days
  };
}

// Automatic tier promotion/demotion
function assignTier(node: MemoryNode, config: TierConfig): StorageTier {
  const age = Date.now() - new Date(node.timestamp).getTime();
  const accessRecency = node.lastAccessedAt
    ? Date.now() - new Date(node.lastAccessedAt).getTime()
    : Infinity;

  if (accessRecency < 60 * 60 * 1000) return 'hot';  // Accessed in last hour
  if (age < 7 * 24 * 60 * 60 * 1000) return 'warm';  // Less than 7 days old
  if (age < 90 * 24 * 60 * 60 * 1000) return 'cold'; // Less than 90 days old
  return 'archive';
}
```

### Fork and Merge

Like Git, the DAG storage supports branching and merging:

```typescript
interface ForkOperation {
  sourceNodeId: Hash;
  forkId: Hash;
  reason: 'edit' | 'experiment' | 'collaboration';
  timestamp: ISO8601;
}

interface MergeOperation {
  sourceNodeId: Hash;
  targetNodeId: Hash;
  resultNodeId: Hash;
  strategy: 'fast-forward' | 'three-way' | 'manual';
  conflicts?: Conflict[];
}

interface Conflict {
  type: 'content' | 'metadata' | 'structure';
  path: string;
  base: any;
  ours: any;
  theirs: any;
}
```

**Fork/Merge Flow:**

```
         ┌───────────┐
         │  Main     │
         │  (A)      │
         └─────┬─────┘
               │
       ┌───────┴───────┐
       │               │
  ┌────▼────┐     ┌────▼────┐
  │ Fork 1  │     │ Fork 2  │
  │  (B)    │     │  (C)    │
  └────┬────┘     └────┬────┘
       │               │
       └───────┬───────┘
               │
         ┌─────▼─────┐
         │   Merge   │
         │  (D)      │
         └───────────┘
```

---

## 2. Vector Store

### Semantic Search

The Vector Store enables semantic search capabilities, allowing users to find memories by meaning rather than just keywords.

**Architecture:**

```typescript
interface VectorStoreConfig {
  // Embedding model configuration
  model: {
    provider: 'openai' | 'anthropic' | 'local';
    name: 'text-embedding-3-small' | 'text-embedding-3-large';
    dimension: 1536 | 3072;
  };

  // Index configuration
  index: {
    type: 'hnsw' | 'ivf' | 'flat';
    
    // HNSW parameters
    efConstruction?: number;  // 100-2000 (default: 200)
    m?: number;               // 4-64 (default: 16)
    
    // IVF parameters
    nlist?: number;           // Number of clusters
  };

  // Similarity metric
  metric: 'cosine' | 'euclidean' | 'dot_product';

  // Performance
  cache: {
    enabled: boolean;
    maxSize: number;
  };
}
```

**Storage Schema (PostgreSQL with pgvector):**

```sql
CREATE TABLE memory_embeddings (
    id UUID PRIMARY KEY,
    memory_id UUID REFERENCES memories(id),
    embedding vector(1536),  -- OpenAI embedding dimension
    model_version VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Index for fast similarity search
    CONSTRAINT valid_embedding CHECK (vector_dims(embedding) = 1536)
);

-- HNSW index for approximate nearest neighbor search
CREATE INDEX memory_embeddings_idx 
ON memory_embeddings 
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 200);
```

**Hybrid Search:**

Combines semantic and keyword search for optimal results:

```typescript
interface HybridSearchQuery {
  // Semantic component
  semantic?: {
    query: string;
    topK: number;
    threshold: number;      // Minimum similarity (0-1)
  };

  // Keyword component
  keyword?: {
    query: string;
    fields: string[];       // ['content', 'tags', 'category']
    operator: 'AND' | 'OR';
  };

  // Filters
  filters?: {
    memoryTypes?: string[];
    categories?: string[];
    dateRange?: {
      from: ISO8601;
      to: ISO8601;
    };
    visibility?: ('local' | 'shared' | 'public')[];
  };

  // Ranking
  ranking?: {
    semanticWeight: number;   // 0-1 (default: 0.7)
    keywordWeight: number;    // 0-1 (default: 0.3)
    recencyBoost: boolean;    // Boost recent memories
  };
}

interface HybridSearchResult {
  memoryId: string;
  score: number;
  semanticScore?: number;
  keywordScore?: number;
  recencyScore?: number;
  memory: MemoryNode;
}
```

**Search Pipeline:**

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   User      │────►│   Embed     │────►│   Vector    │
│   Query     │     │   Query     │     │   Search    │
└─────────────┘     └─────────────┘     └──────┬──────┘
                                               │
┌─────────────┐     ┌─────────────┐            │
│   Results   │◄────│   Rank &    │◄───────────┘
│   (Top K)   │     │   Combine   │
└─────────────┘     └──────┬──────┘
                           │
                     ┌─────▼──────┐
                     │  Keyword   │
                     │   Filter   │
                     └────────────┘
```

---

## 3. Crypto Engine

### Cryptographic Operations

The Crypto Engine provides all cryptographic primitives needed for secure storage.

**Supported Algorithms:**

| Algorithm | Purpose | Key Size | Status |
|-----------|---------|----------|--------|
| **Ed25519** | Digital signatures | 256 bits | ✅ Production |
| **X25519** | Key exchange (ECDH) | 256 bits | ✅ Production |
| **AES-256-GCM** | Symmetric encryption | 256 bits | ✅ Production |
| **ChaCha20-Poly1305** | Symmetric encryption (mobile) | 256 bits | ✅ Production |
| **SHA-3 (Keccak-256)** | Content hashing | 256 bits | ✅ Production |
| **BLAKE3** | Fast content hashing | 256 bits | ✅ Production |
| **PBKDF2-HMAC-SHA256** | Key derivation | Variable | ✅ Production |
| **Argon2id** | Password hashing | Variable | ✅ Production |

**Crypto Interface:**

```typescript
interface CryptoEngine {
  // Key generation
  generateKeyPair(): Promise<KeyPair>;
  deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey>;

  // Signing
  sign(data: Uint8Array, privateKey: CryptoKey): Promise<Signature>;
  verify(data: Uint8Array, signature: Signature, publicKey: CryptoKey): Promise<boolean>;

  // Encryption
  encrypt(plaintext: Uint8Array, key: CryptoKey): Promise<Ciphertext>;
  decrypt(ciphertext: Ciphertext, key: CryptoKey): Promise<Uint8Array>;

  // Key exchange
  keyExchange(privateKey: CryptoKey, publicKey: CryptoKey): Promise<SharedSecret>;

  // Hashing
  hash(data: Uint8Array): Promise<Hash>;
}
```

### Content Addressing

**Hash Format:**

```
sovereign:<algorithm>:<base32-encoded-hash>
```

**Examples:**

```
sovereign:sha3-256:1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t
sovereign:blake3:xyz123abc456def789ghi012jkl345mno678pqrs90
sovereign:sha2-256:abc123def456ghi789jkl012mno345pqr678stu901
```

**Hash Calculation:**

```typescript
async function calculateContentAddress(
  content: Uint8Array,
  algorithm: HashAlgorithm = 'sha3-256'
): Promise<string> {
  const hash = await crypto.subtle.digest(algorithm, content);
  const base32 = base32Encode(hash);
  return `sovereign:${algorithm}:${base32}`;
}
```

---

## 4. Storage Backends

### 4.1 IndexedDB (Browser)

**Use Case**: Local-first browser storage

```typescript
interface IndexedDBConfig {
  dbName: string;
  version: number;
  stores: {
    memories: {
      keyPath: 'id';
      indices: ['type', 'category', 'visibility', 'createdAt'];
    };
    embeddings: {
      keyPath: 'id';
      indices: ['memoryId'];
    };
    keys: {
      keyPath: 'keyId';
      indices: ['type'];
    };
  };
}

// Implementation using Dexie.js
class IndexedDBStorage implements StorageBackend {
  private db: Dexie;

  constructor(config: IndexedDBConfig) {
    this.db = new Dexie(config.dbName);
    this.db.version(config.version).stores(config.stores);
  }

  async get<T>(key: string): Promise<T | null> {
    return await this.db.table('memories').get(key);
  }

  async put<T>(key: string, value: T): Promise<void> {
    await this.db.table('memories').put({ id: key, ...value });
  }

  async delete(key: string): Promise<void> {
    await this.db.table('memories').delete(key);
  }

  async query(query: StorageQuery): Promise<StorageResult[]> {
    // Implementation with index-based filtering
  }
}
```

### 4.2 PostgreSQL (Server)

**Use Case**: Centralized server storage with vector search

```typescript
interface PostgreSQLConfig {
  connectionString: string;
  schema: string;
  poolSize: number;
  vectorExtension: boolean;
}

class PostgreSQLStorage implements StorageBackend {
  private pool: Pool;

  constructor(config: PostgreSQLConfig) {
    this.pool = new Pool({
      connectionString: config.connectionString,
      max: config.poolSize,
    });

    if (config.vectorExtension) {
      this.enableVectorExtension();
    }
  }

  private async enableVectorExtension(): Promise<void> {
    await this.pool.query('CREATE EXTENSION IF NOT EXISTS vector');
  }

  async get<T>(key: string): Promise<T | null> {
    const result = await this.pool.query(
      'SELECT data FROM memories WHERE id = $1',
      [key]
    );
    return result.rows[0]?.data || null;
  }

  async put<T>(key: string, value: T): Promise<void> {
    await this.pool.query(
      `INSERT INTO memories (id, data, updated_at) 
       VALUES ($1, $2, NOW())
       ON CONFLICT (id) DO UPDATE SET data = $2, updated_at = NOW()`,
      [key, JSON.stringify(value)]
    );
  }

  async vectorSearch(
    embedding: number[],
    topK: number,
    threshold: number
  ): Promise<VectorSearchResult[]> {
    const query = `
      SELECT memory_id, 1 - (embedding <=> $1::vector) AS similarity
      FROM memory_embeddings
      WHERE 1 - (embedding <=> $1::vector) > $2
      ORDER BY similarity DESC
      LIMIT $3
    `;

    const result = await this.pool.query(query, [
      `[${embedding.join(',')}]`,
      threshold,
      topK,
    ]);

    return result.rows.map((row) => ({
      memoryId: row.memory_id,
      similarity: row.similarity,
    }));
  }
}
```

### 4.3 IPFS (Decentralized)

**Use Case**: Public, decentralized storage

```typescript
interface IPFSConfig {
  nodes: string[];           // IPFS node URLs
  pinning: 'local' | 'remote' | 'both';
  remotePinService?: string; // e.g., Pinata, Infura
}

class IPFSStorage implements StorageBackend {
  private ipfs: IPFSHTTPClient;

  constructor(config: IPFSConfig) {
    this.ipfs = create({ url: config.nodes[0] });
  }

  async put<T>(key: string, value: T): Promise<string> {
    const data = JSON.stringify(value);
    const result = await this.ipfs.add(data);
    
    // Pin to ensure persistence
    await this.ipfs.pin.add(result.path);
    
    return result.cid.toString();
  }

  async get<T>(cid: string): Promise<T | null> {
    try {
      const chunks: Uint8Array[] = [];
      for await (const chunk of this.ipfs.cat(cid)) {
        chunks.push(chunk);
      }
      const data = Buffer.concat(chunks).toString();
      return JSON.parse(data);
    } catch (error) {
      return null;
    }
  }
}
```

### 4.4 File System (Desktop/CLI)

**Use Case**: Local file storage for desktop/CLI applications

```typescript
interface FileSystemConfig {
  basePath: string;
  encryption: boolean;
  compression: boolean;
}

class FileSystemStorage implements StorageBackend {
  private basePath: string;
  private crypto?: CryptoEngine;

  constructor(config: FileSystemConfig) {
    this.basePath = config.basePath;
    if (config.encryption) {
      this.crypto = new CryptoEngine();
    }
  }

  private getPath(key: string): string {
    // Use first 2 chars as directory for better performance
    const dir = key.substring(0, 2);
    return path.join(this.basePath, dir, key + '.json');
  }

  async put<T>(key: string, value: T): Promise<void> {
    const filePath = this.getPath(key);
    const dir = path.dirname(filePath);

    // Create directory if needed
    await fs.mkdir(dir, { recursive: true });

    // Serialize and optionally encrypt
    let data = JSON.stringify(value);
    if (this.crypto) {
      data = await this.crypto.encrypt(data, this.getKey());
    }

    // Write atomically
    const tempPath = filePath + '.tmp';
    await fs.writeFile(tempPath, data);
    await fs.rename(tempPath, filePath);
  }

  async get<T>(key: string): Promise<T | null> {
    const filePath = this.getPath(key);

    try {
      let data = await fs.readFile(filePath, 'utf-8');

      if (this.crypto) {
        data = await this.crypto.decrypt(data, this.getKey());
      }

      return JSON.parse(data);
    } catch (error) {
      return null;
    }
  }
}
```

---

## 5. Sync Protocol

### CRDT-Based Synchronization

Sovereign Memory uses Conflict-free Replicated Data Types (CRDTs) for seamless multi-device sync.

**Data Model:**

```typescript
interface CRDTMemory {
  // Unique identifier
  id: string;

  // Logical clock for ordering
  clock: HybridLogicalClock;

  // Content as CRDT
  content: LWWRegister<string>;

  // Metadata as CRDT
  metadata: {
    tags: GSet<string>;
    category: LWWRegister<string>;
    importance: LWWRegister<number>;
  };

  // Relationships
  parents: GSet<string>;
  children: GSet<string>;
}

interface HybridLogicalClock {
  wallTime: number;      // Physical time (ms since epoch)
  logicalCounter: number; // Logical counter for same-wall-time events
  nodeId: string;        // Unique node identifier
}
```

**Sync Protocol:**

```typescript
interface SyncMessage {
  // Sender identification
  nodeId: string;
  clock: HybridLogicalClock;

  // Data being synced
  operations: CRDTOperation[];

  // Vector clock for causality tracking
  vectorClock: VectorClock;
}

interface CRDTOperation {
  type: 'create' | 'update' | 'delete';
  targetId: string;
  payload: any;
  timestamp: HybridLogicalClock;
}
```

**Sync Flow:**

```
Device A                          Device B
   │                                │
   │──── Hello (clock_A) ──────────►│
   │                                │
   │                                │ Compare clocks
   │                                │ Determine delta
   │                                │
   │◄──── Delta (ops, clock_B) ─────│
   │                                │
   │ Apply operations               │
   │ Update vector clock            │
   │                                │
   │──── Ack (new_clock_A) ────────►│
   │                                │
```

### Offline-First Design

**Principles:**

1. **Always Available**: Full functionality without network
2. **Automatic Sync**: Sync when connectivity restored
3. **Conflict-Free**: CRDTs guarantee eventual consistency
4. **Incremental**: Only transfer changes, not full state

**Offline Queue:**

```typescript
interface OfflineQueue {
  // Pending operations
  pending: QueuedOperation[];

  // Add operation to queue
  enqueue(operation: CRDTOperation): void;

  // Process queue when online
  processQueue(syncTarget: SyncTarget): Promise<void>;

  // Handle conflicts
  resolveConflicts(conflicts: Conflict[]): Promise<void>;
}

interface QueuedOperation {
  id: string;
  operation: CRDTOperation;
  createdAt: ISO8601;
  retryCount: number;
  maxRetries: number;
}
```

---

## 6. Performance Optimization

### Caching Strategy

**Multi-Layer Cache:**

```typescript
interface CacheConfig {
  // L1: In-memory cache (fastest)
  l1: {
    enabled: boolean;
    maxSize: number;        // e.g., 100MB
    ttl?: number;           // Optional TTL
  };

  // L2: Redis cache (fast)
  l2: {
    enabled: boolean;
    connectionString: string;
    ttl: number;            // e.g., 5 minutes
  };

  // L3: Database cache (slower)
  l3: {
    enabled: boolean;
    ttl: number;            // e.g., 1 hour
  };
}
```

**Cache Invalidation:**

```typescript
// Event-driven invalidation
eventBus.subscribe('MEMORY_UPDATED', (event) => {
  // Invalidate cache for this memory
  cache.invalidate(`memory:${event.memoryId}`);

  // Invalidate related queries
  cache.invalidatePattern(`search:*:${event.memoryId}`);
});

eventBus.subscribe('USER_UPDATED', (event) => {
  // Invalidate all user-related cache
  cache.invalidatePattern(`user:${event.userId}:*`);
});
```

### Compression

**Compression Tiers:**

| Tier | Algorithm | Ratio | Speed | Use Case |
|------|-----------|-------|-------|----------|
| Fast | LZ4 | 2:1 | Very Fast | Hot storage |
| Balanced | Gzip | 3:1 | Fast | Warm storage |
| High | Brotli | 4:1 | Medium | Cold storage |
| Maximum | Zstandard | 5:1 | Slow | Archive storage |

```typescript
async function compressContent(
  content: Uint8Array,
  tier: StorageTier
): Promise<Uint8Array> {
  switch (tier) {
    case 'hot':
      return content;  // No compression for hot tier
    case 'warm':
      return await gzip(content);
    case 'cold':
      return await brotli(content);
    case 'archive':
      return await zstd(content);
  }
}
```

---

## 7. Backup and Recovery

### Backup Strategies

**Local Backup:**

```typescript
interface LocalBackupConfig {
  destination: string;     // External drive path
  schedule: 'daily' | 'weekly' | 'manual';
  encryption: boolean;
  compression: boolean;
}

async function createLocalBackup(
  storage: StorageBackend,
  config: LocalBackupConfig
): Promise<void> {
  const backup = await storage.exportAll();
  
  let data = JSON.stringify(backup);
  
  if (config.compression) {
    data = await gzip(data);
  }
  
  if (config.encryption) {
    data = await encryptWithPassword(data, config.password);
  }
  
  const timestamp = new Date().toISOString().split('T')[0];
  const backupPath = path.join(config.destination, `backup-${timestamp}.zip`);
  
  await fs.writeFile(backupPath, data);
}
```

**Cloud Backup:**

```typescript
interface CloudBackupConfig {
  provider: 's3' | 'gcs' | 'azure';
  bucket: string;
  region: string;
  encryption: boolean;
  versioning: boolean;
}
```

### Recovery Process

```typescript
async function recoverFromBackup(
  backupPath: string,
  options: RecoveryOptions
): Promise<RecoveryResult> {
  // 1. Load backup
  const backup = await loadBackup(backupPath);

  // 2. Verify integrity
  const valid = await verifyBackupIntegrity(backup);
  if (!valid) {
    throw new Error('Backup integrity check failed');
  }

  // 3. Decrypt if needed
  if (backup.encrypted) {
    await decryptBackup(backup, options.password);
  }

  // 4. Decompress if needed
  if (backup.compressed) {
    await decompressBackup(backup);
  }

  // 5. Import to storage
  const result = await storage.importAll(backup.data, {
    onConflict: options.onConflict,  // 'overwrite' | 'skip' | 'merge'
    dryRun: options.dryRun,
  });

  return result;
}
```

---

## Implementation Reference

For implementation details, see the source code:

- **DAG Storage**: `pwa/src/lib/storage-v2/dag-storage.ts`
- **Vector Store**: `server/src/lib/vector-store.ts`
- **Crypto Engine**: `server/src/lib/crypto.ts`
- **Sync Protocol**: `network/src/sync/crdt-sync.ts`
