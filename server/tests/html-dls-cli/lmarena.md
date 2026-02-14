# LMArena | Benchmark & Compare the Best AI Models

Side by Side

[](/)

Anthropicclaude-opus-4-5-20251101-thinking-32k

gpt-5.2-high

Side by Side

Anthropicclaude-opus-4-5-20251101-thinking-32k

gpt-5.2-high

Anthropicclaude-opus-4-5-20251101-thinking-32k

Something went wrong with this response, please try again.

## Message from claude-opus-4-5-20251101-thinking-32k

gpt-5.2-high

# Community-Owned AI Knowledge Graph System — Production Technical Design Specification (Zero→Full)

This specification is written as a **buildable, deployable** design for a mobile-first system with:

-   **Two-layer storage** (immutable CAS + mutable derived artifacts),
-   **Perfect provenance**,
-   **Offline-first CRDT collaboration**,
-   **Knowledge graph + full-text search**,
-   **P2P sync** (personal + community),
-   **Ownership-transfer semantics** and a **credit/reputation access economy**.

---

## DOCUMENT 1 — System Architecture & Technology Stack Design

### 1.0 High-Level Architecture

#### Core concepts

-   **Layer A (Immutable CAS)**: conversations/messages/raw captures stored as **content-addressed objects** (hash → bytes). Append-only.
-   **Layer B (Mutable Artifacts)**: views/slices/annotations/redactions/weaves/summaries/tasks stored as **CRDT documents**, referencing Layer A via **anchors**.
-   **Provenance graph**: every artifact and transformation records dependencies (source hashes + parent artifact IDs).
-   **Two operating modes**:
    -   **Personal Vault**: encrypted, private, multi-device sync (P2P).
    -   **Community Mode**: shared objects + derivatives governed by community license and **credit economy**; discovery via federated index + P2P retrieval.

#### Architecture diagram (Mermaid)

mermaid

```
flowchart TB
  subgraph Mobile Client
    UI[Flutter UI]
    Core[Rust Core SDK\nCAS+CRDT+Sync+Crypto+Parsers]
    DB[(SQLCipher SQLite)]
    FS[(Blob Store\nFiles by hash)]
    UI --> Core
    Core --> DB
    Core --> FS
  end

  subgraph P2P Network (libp2p)
    DHT[Kademlia DHT]
    PUB[GossipSub\nmetadata/announcements]
    RELAY[Relay + Hole Punch]
  end

  subgraph Community Federation (optional but recommended)
    IDX[Discovery/Index API\n(OpenSearch + graph jobs)]
    LEDGER[Credit Ledger Cluster\n(Raft replicated log)]
    MOD[Moderation/Abuse service]
    BOOT[Bootstrap Nodes\n(libp2p)]
  end

  Core <--> DHT
  Core <--> PUB
  Core <--> RELAY
  Core <--> BOOT
  Core <--> LEDGER
  Core <--> IDX
  Core <--> MOD
```

---

## 1A. Platform & Language Selection

### Mobile framework evaluation (cross-platform)

Option

Pros

Cons

Decision

Native (Swift+Kotlin)

best platform integration

duplicate logic; hard CRDT/P2P parity

Not selected

React Native

fast UI iteration

heavy bridge, JS perf, complex crypto/P2P

Not selected

Flutter

consistent UI, strong mobile perf, good offline patterns

FFI needed for Rust core

**Selected**

Kotlin Multiplatform

shared logic + native UI

iOS UI build cost; Rust libp2p ecosystem stronger

Not selected

### Selected stack

-   **UI**: Flutter (Dart)
-   **Core engine** (shared): **Rust** library via FFI:
    -   CAS, hashing, compression
    -   CRDT (Automerge)
    -   libp2p networking
    -   parsing/import adapters
    -   encryption/key management wrappers
-   **Platform glue**: minimal native Swift/Kotlin only for:
    -   Keychain/Keystore
    -   background fetch / push notifications
    -   file system paths, sharing intents

### Build & deployment pipeline

-   Repo layout (monorepo):
    -   `/mobile/flutter_app`
    -   `/core/rust_sdk` (cdylib for iOS/Android)
    -   `/federation/services/*` (ledger/index/moderation/bootstrap)
-   CI/CD:
    -   GitHub Actions:
        -   lint/test (Dart + Rust)
        -   build Rust SDK for iOS (xcframework) + Android (aar/jniLibs)
        -   integration tests using device farm
        -   store signing keys in CI secret manager
-   Release:
    -   Android: Play App Signing, staged rollout
    -   iOS: TestFlight + phased release
-   Observability:
    -   client: structured logs + local crash reports (Sentry)
    -   federation: Prometheus + Grafana + Loki

---

## 1B. Storage Architecture

### Local DB selection

-   **SQLCipher (SQLite + full DB encryption)**  
    Justification: mobile reliability, transactions, FTS5 support, mature tooling, encrypted at rest.

### Two-layer storage implementation

#### Layer A: Content-addressed object store (CAS)

-   **Address**: `CIDv1` (multiformats) with multihash:
    -   default hash: **BLAKE3-256** for speed on-device
    -   optional: SHA2-256 for interoperability
-   **Dedup**: automatic by hash; refcounts maintained.
-   **Storage**:
    -   Small objects (< 256KB): stored in DB table `cas_object.data` (BLOB) for locality.
    -   Large objects: stored as files under:
        -   `blobs/<algo>/<aa>/<bb>/<hash>.blob`
    -   Metadata always in DB.

#### Layer B: Mutable artifacts

-   Stored as **CRDT docs** (Automerge) whose changes are logged and compacted.
-   Artifact “current state” can be materialized for rendering/search indexing.

### Cache layers & memory management

-   In-memory LRU cache:
    -   decoded CRDT doc states (cap: 32–128MB configurable)
    -   hot CAS blobs (cap: 16–64MB)
-   On-disk cache:
    -   rendered HTML/markdown previews (evictable)
    -   thumbnail images (evictable)

### Mobile storage constraints

-   Storage budget policy:
    -   default max on-disk: **2GB** personal, **1GB** community cache
    -   user-adjustable
-   Eviction strategy:
    -   community cache: LRU + “cost per byte” weighted by re-fetch cost
    -   never evict:
        -   user-owned private originals
        -   user annotations/CRDT logs unless compacted
-   Integrity:
    -   periodic hash verification for blobs
    -   automatic repair by re-fetching from peers if corruption detected

### Backup & recovery

-   Encrypted export bundle (see Document 3E):
    -   full vault export or selective
-   Optional cloud backup (user-controlled):
    -   upload encrypted bundle to iCloud Drive / Google Drive
    -   key never leaves device unless user exports it

---

## 1C. Cryptographic Primitives

### Hashing (content addressing)

-   Default: **BLAKE3-256**
    -   fast; good for mobile; supports incremental hashing
-   Compatibility option: SHA2-256
-   CID uses multihash code to disambiguate.

### Encryption (private content)

-   DB encryption: SQLCipher AES-256 (transparent)
-   Blob encryption (defense-in-depth + selective sharing support):
    -   **XChaCha20-Poly1305** (libsodium)
    -   Per-object random nonce
    -   Key hierarchy:
        -   `MasterKey` (32 bytes) stored wrapped in OS secure storage
        -   `ObjectKey = HKDF(MasterKey, "cas-object", object_hash)`

### Key derivation & management

-   If user sets passcode:
    -   `PassKey = Argon2id(passcode, salt, mem=64MB, iters=3, parallel=2)`
    -   wraps `MasterKey`
-   Else:
    -   `MasterKey` generated and wrapped directly by Keychain/Keystore

### Signatures (ownership proofs, receipts)

-   **Ed25519** per-device identity keypair
-   User identity:
    -   either single-device (simpler) or multi-device “user key” derived from a recovered seed phrase
-   Signed objects:
    -   Share declarations
    -   Credit transactions
    -   Vote attestations

### RNG

-   OS CSPRNG via Rust `getrandom` (backs onto SecureRandom / SecRandomCopyBytes)

### Hardware security

-   iOS Secure Enclave / Android StrongBox used when available to store wrapping keys (via Keychain/Keystore APIs)

---

## 1D. CRDT Implementation

### Selection

-   **Automerge (operation-based with compact change encoding)** via Rust `automerge` crate.
-   Why:
    -   strong mobile suitability
    -   supports rich JSON-like documents
    -   sync protocol already defined; good offline merging
    -   mature compaction tooling

### Conflict resolution semantics

-   Automerge standard:
    -   concurrent inserts preserve intent (list CRDT)
    -   maps resolve via multi-values; app resolves by last-writer-wins _per field_ where needed
-   For derived docs:
    -   blocks are list elements with stable IDs (UUIDv7)
    -   edits merge naturally

### Garbage collection / compaction

-   Change log compaction:
    -   checkpoint full doc state every N changes (default 2000) or 5MB changes
    -   keep last 2 checkpoints + incremental changes since last checkpoint
-   Tombstoning:
    -   artifact deletions are CRDT “tombstone markers” (not physical deletion)

### Library vs custom

-   Use Automerge as-is; custom wrappers:
    -   deterministic serialization for hashing derived snapshots
    -   patch extraction for search indexing

---

## 1E. Network & Sync Stack

### P2P implementation

-   **libp2p (Rust)** with:
    -   Transport: **QUIC** (preferred), fallback TCP+Noise
    -   Encryption: Noise (XX handshake)
    -   Multiplexing: Yamux (TCP), QUIC streams (QUIC)
    -   Discovery: Kademlia DHT + local peer discovery (mDNS on Wi-Fi)
    -   PubSub: GossipSub for announcements
    -   NAT traversal: hole punching + relay nodes

### Sync protocols (two namespaces)

1.  **Personal namespace** (private multi-device):
    -   peers authenticated as same user (shared user key)
    -   encrypted replication of CAS + CRDT changes
2.  **Community namespace**:
    -   CAS objects are public (post-redaction)
    -   artifacts are public CRDT docs (community-owned)
    -   credit ledger interactions go through federation ledger nodes

### Bandwidth optimization

-   CAS fetch:
    -   request by CID; if missing, fetch from multiple peers
    -   range requests for large blobs
-   CRDT sync:
    -   Automerge sync protocol with bloom-filter-like “have” sets
-   Mobile constraints:
    -   sync only on Wi-Fi/charging by default (configurable)
    -   background sync uses OS background task APIs with strict quotas

---

## 1F. Parsing & Import Pipeline

### Import inputs

-   Shared conversation links (public share URLs)
-   Raw HTML capture from share sheet (preferred when providers block scraping)
-   JSON exports (some providers offer)

### Adapter architecture

-   `Importer` interface:
    -   `detect(input) -> Provider`
    -   `fetch(input, auth_ctx) -> RawCapture`
    -   `parse(raw) -> SourceConversation + SourceMessages + assets`
-   Providers:
    -   ChatGPT (share links + export JSON)
    -   Claude (shared conversation URLs where possible; else HTML capture)
    -   Gemini (HTML capture)
    -   Perplexity (public URL + HTML)
    -   Generic “markdown transcript” fallback

### HTTP & parsing

-   HTTP client: Rust `reqwest` (HTTP/2 + retries)
-   HTML parsing: `scraper` crate + provider-specific selectors
-   JSON parsing: `serde_json`
-   Rate limiting:
    -   per-provider token bucket (default 1 req/sec, burst 3)
-   Retry:
    -   exponential backoff with jitter; max 5 tries
-   Auth handling:
    -   Prefer “public share links” (no auth)
    -   For private pages: in-app WebView capture with user consent; import uses captured HTML only (no credential extraction)

### Asset handling (images/files)

-   Download referenced assets; store as CAS blobs
-   Generate thumbnails (mobile-friendly sizes)
-   EXIF stripping for privacy

---

## 1G. Search & Indexing

### On-device full-text search

-   SQLite **FTS5** virtual tables
-   Tokenization:
    -   `unicode61` + custom stopwords
    -   optional trigram for fuzzy match
-   Indexed fields:
    -   source messages (private + shared)
    -   derived docs (materialized text)
    -   tags, titles, entity labels

### Ranking

-   Default: BM25 (FTS5 built-in)
-   Boost:
    -   recency
    -   user “pinned” artifacts
    -   community quality score (in community mode)

### Real-time updates

-   On import:
    -   insert source message text → FTS
-   On CRDT change:
    -   debounce (500ms) and update materialized text + FTS rows

---

## 1H. Graph Database (Knowledge Graph)

### On-device graph storage

-   SQLite tables `graph_node` / `graph_edge`
-   Traversals:
    -   adjacency queries with indexes
    -   recursive CTE for bounded-depth traversals (depth ≤ 5 typical)
-   Materialized views:
    -   “concept co-occurrence” edges computed incrementally
    -   “artifact derives-from” provenance edges stored explicitly

### Federation-side graph (optional but recommended for discovery)

-   Periodic ingestion of shared metadata into:
    -   OpenSearch for text discovery
    -   Graph engine (Neo4j or PostgreSQL+AGE)
-   Clients still operate offline with local graph.

### Scalability notes (targets)

-   Personal vault: 10k–200k messages per user over years.
-   SQLite with proper indexes + FTS5 is sufficient on-device.
-   CAS dedupe prevents repeated imports.

### Performance benchmarks (practical expectations)

-   BLAKE3 on modern phones: ~500MB/s–1.5GB/s
-   SQLCipher overhead: ~5–15% slower than plaintext SQLite
-   FTS5 query (10k docs): typically <50ms
-   Automerge merge cost: linear in change size; compact regularly

---

# DOCUMENT 2 — Complete Database Schema Design (SQLite/SQLCipher)

**Dialect**: SQLite 3.45+ with `STRICT` tables where possible.  
**Encryption**: SQLCipher enabled at open.

## 2A. Schema Definition (DDL)

> Notes:
> 
> -   Hashes stored as **BLOB** (32 bytes for BLAKE3-256).
> -   UUIDs stored as **TEXT** (UUIDv7 recommended).
> -   Times stored as **INTEGER** unix ms.

### Meta / configuration

SQL

```
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
) STRICT;

INSERT OR IGNORE INTO meta(key,value) VALUES ('schema_version','1');
```

### Users, devices, identities

SQL

```
CREATE TABLE IF NOT EXISTS user_account (
  user_id TEXT PRIMARY KEY,                 -- UUIDv7
  display_name TEXT,
  created_at_ms INTEGER NOT NULL,
  community_pubkey_ed25519 BLOB,            -- 32 bytes, optional until community enabled
  reputation_score REAL NOT NULL DEFAULT 0.0,
  CHECK (reputation_score >= -1000.0 AND reputation_score <= 1000000.0)
) STRICT;

CREATE TABLE IF NOT EXISTS device_identity (
  device_id TEXT PRIMARY KEY,               -- UUIDv7
  user_id TEXT NOT NULL REFERENCES user_account(user_id) ON DELETE CASCADE,
  device_name TEXT,
  pubkey_ed25519 BLOB NOT NULL UNIQUE,      -- 32 bytes
  created_at_ms INTEGER NOT NULL,
  last_seen_ms INTEGER,
  CHECK (length(pubkey_ed25519) = 32)
) STRICT;

CREATE INDEX IF NOT EXISTS idx_device_user ON device_identity(user_id);
```

### CAS object store (Layer A)

SQL

```
CREATE TABLE IF NOT EXISTS cas_object (
  hash BLOB NOT NULL,
  hash_alg INTEGER NOT NULL,                 -- 1=BLAKE3_256, 2=SHA2_256
  cid TEXT NOT NULL,                         -- canonical CIDv1 string
  byte_len INTEGER NOT NULL,
  mime TEXT,
  created_at_ms INTEGER NOT NULL,
  is_encrypted INTEGER NOT NULL DEFAULT 1,   -- 0/1
  enc_alg INTEGER,                           -- 1=XCHACHA20P1305
  compression_alg INTEGER NOT NULL DEFAULT 0, -- 0=none, 1=zstd
  inline_data BLOB,                          -- if small
  external_path TEXT,                        -- if stored as file
  ref_count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (hash, hash_alg),
  UNIQUE (cid),
  CHECK (byte_len >= 0),
  CHECK (is_encrypted IN (0,1)),
  CHECK ((inline_data IS NULL) != (external_path IS NULL)) -- exactly one
) STRICT;

CREATE INDEX IF NOT EXISTS idx_cas_created ON cas_object(created_at_ms);
CREATE INDEX IF NOT EXISTS idx_cas_refcount ON cas_object(ref_count);
```

#### CAS references (provenance link convenience)

SQL

```
CREATE TABLE IF NOT EXISTS cas_ref (
  referrer_type INTEGER NOT NULL,            -- 1=artifact,2=raw_capture,3=source_message,etc
  referrer_id TEXT NOT NULL,
  hash BLOB NOT NULL,
  hash_alg INTEGER NOT NULL,
  created_at_ms INTEGER NOT NULL,
  PRIMARY KEY (referrer_type, referrer_id, hash, hash_alg),
  FOREIGN KEY (hash, hash_alg) REFERENCES cas_object(hash, hash_alg) ON DELETE RESTRICT
) STRICT;

CREATE INDEX IF NOT EXISTS idx_casref_hash ON cas_ref(hash, hash_alg);
```

### Source objects catalog (typed pointers into CAS)

We store canonical JSON for `SourceConversation`, `SourceMessage`, `RawCapture` as CAS objects, but also keep indexed metadata.

SQL

```
CREATE TABLE IF NOT EXISTS source_conversation (
  conv_id TEXT PRIMARY KEY,                  -- UUIDv7 local
  cas_hash BLOB NOT NULL,
  cas_hash_alg INTEGER NOT NULL,
  provider INTEGER NOT NULL,                 -- enum
  provider_conv_id TEXT,                     -- provider native id if available
  title TEXT,
  started_at_ms INTEGER,
  imported_at_ms INTEGER NOT NULL,
  owner_user_id TEXT NOT NULL REFERENCES user_account(user_id) ON DELETE CASCADE,
  ownership_state INTEGER NOT NULL DEFAULT 1, -- see Document 4
  CHECK (ownership_state IN (1,2,3,4,5))
) STRICT;

CREATE INDEX IF NOT EXISTS idx_sourceconv_owner ON source_conversation(owner_user_id, imported_at_ms DESC);
CREATE INDEX IF NOT EXISTS idx_sourceconv_cas ON source_conversation(cas_hash, cas_hash_alg);

CREATE TABLE IF NOT EXISTS source_message (
  msg_id TEXT PRIMARY KEY,                   -- UUIDv7 local
  conv_id TEXT NOT NULL REFERENCES source_conversation(conv_id) ON DELETE CASCADE,
  cas_hash BLOB NOT NULL,
  cas_hash_alg INTEGER NOT NULL,
  provider_msg_id TEXT,
  role INTEGER NOT NULL,                     -- 1=user,2=assistant,3=system,4=tool
  created_at_ms INTEGER,
  order_index INTEGER NOT NULL,              -- stable order within conversation
  CHECK (order_index >= 0)
) STRICT;

CREATE INDEX IF NOT EXISTS idx_msg_conv_order ON source_message(conv_id, order_index);
CREATE INDEX IF NOT EXISTS idx_msg_cas ON source_message(cas_hash, cas_hash_alg);

CREATE TABLE IF NOT EXISTS raw_capture (
  capture_id TEXT PRIMARY KEY,
  cas_hash BLOB NOT NULL,
  cas_hash_alg INTEGER NOT NULL,
  source_url TEXT,
  captured_at_ms INTEGER NOT NULL,
  capture_type INTEGER NOT NULL,             -- 1=html,2=json,3=pdf,4=txt
  owner_user_id TEXT NOT NULL REFERENCES user_account(user_id) ON DELETE CASCADE
) STRICT;

CREATE INDEX IF NOT EXISTS idx_capture_owner ON raw_capture(owner_user_id, captured_at_ms DESC);
```

### Derived artifacts (Layer B) + provenance

SQL

```
CREATE TABLE IF NOT EXISTS artifact (
  artifact_id TEXT PRIMARY KEY,              -- UUIDv7
  artifact_type INTEGER NOT NULL,            -- 1=view,2=slice,3=annotation_layer,4=redaction_layer,5=weave,6=thread,7=summary,8=taskdoc
  owner_user_id TEXT NOT NULL REFERENCES user_account(user_id) ON DELETE CASCADE,
  title TEXT,
  created_at_ms INTEGER NOT NULL,
  updated_at_ms INTEGER NOT NULL,
  ownership_state INTEGER NOT NULL,          -- state machine
  community_object_id TEXT,                  -- when shared, server/federation id
  root_doc_id TEXT NOT NULL,                 -- CRDT doc id
  CHECK (artifact_type BETWEEN 1 AND 8),
  CHECK (ownership_state IN (1,2,3,4,5))
) STRICT;

CREATE INDEX IF NOT EXISTS idx_artifact_owner_updated ON artifact(owner_user_id, updated_at_ms DESC);
CREATE INDEX IF NOT EXISTS idx_artifact_state ON artifact(ownership_state, updated_at_ms DESC);
CREATE INDEX IF NOT EXISTS idx_artifact_rootdoc ON artifact(root_doc_id);

-- Provenance dependencies: artifact depends on sources and/or other artifacts
CREATE TABLE IF NOT EXISTS artifact_dep (
  artifact_id TEXT NOT NULL REFERENCES artifact(artifact_id) ON DELETE CASCADE,
  dep_kind INTEGER NOT NULL,                 -- 1=cas_object,2=source_conversation,3=source_message,4=artifact
  dep_id TEXT,                               -- for dep_kind 2/3/4
  dep_hash BLOB,                             -- for dep_kind 1
  dep_hash_alg INTEGER,
  created_at_ms INTEGER NOT NULL,
  PRIMARY KEY (artifact_id, dep_kind, dep_id, dep_hash, dep_hash_alg),
  CHECK (
    (dep_kind=1 AND dep_hash IS NOT NULL AND dep_hash_alg IS NOT NULL AND dep_id IS NULL) OR
    (dep_kind IN (2,3,4) AND dep_id IS NOT NULL AND dep_hash IS NULL AND dep_hash_alg IS NULL)
  )
) STRICT;

CREATE INDEX IF NOT EXISTS idx_artdep_artifact ON artifact_dep(artifact_id);
CREATE INDEX IF NOT EXISTS idx_artdep_hash ON artifact_dep(dep_hash, dep_hash_alg);
CREATE INDEX IF NOT EXISTS idx_artdep_depid ON artifact_dep(dep_kind, dep_id);
```

### Anchors (stable pointers into immutable sources)

SQL

```
CREATE TABLE IF NOT EXISTS anchor (
  anchor_id TEXT PRIMARY KEY,                -- UUIDv7
  anchor_type INTEGER NOT NULL,              -- 1=message,2=part,3=range,4=semantic
  conv_id TEXT REFERENCES source_conversation(conv_id) ON DELETE CASCADE,
  msg_id TEXT REFERENCES source_message(msg_id) ON DELETE CASCADE,
  part_index INTEGER,                        -- for part/range
  start_offset INTEGER,                      -- for range
  end_offset INTEGER,                        -- for range
  quote TEXT,                                -- captured text snippet for drift handling
  cas_hash BLOB,                             -- optional direct reference
  cas_hash_alg INTEGER,
  created_at_ms INTEGER NOT NULL,
  CHECK (anchor_type BETWEEN 1 AND 4),
  CHECK (start_offset IS NULL OR start_offset >= 0),
  CHECK (end_offset IS NULL OR end_offset >= 0),
  CHECK (end_offset IS NULL OR start_offset IS NULL OR end_offset >= start_offset)
) STRICT;

CREATE INDEX IF NOT EXISTS idx_anchor_msg ON anchor(msg_id, part_index, start_offset);
CREATE INDEX IF NOT EXISTS idx_anchor_conv ON anchor(conv_id);
```

### CRDT storage (Automerge)

SQL

```
CREATE TABLE IF NOT EXISTS crdt_doc (
  doc_id TEXT PRIMARY KEY,                   -- UUIDv7
  doc_type INTEGER NOT NULL,                 -- aligns with artifact_type or internal docs
  created_at_ms INTEGER NOT NULL,
  last_compacted_at_ms INTEGER,
  head_hash BLOB,                            -- hash of current heads for quick compare
  head_hash_alg INTEGER,
  CHECK (doc_type >= 1)
) STRICT;

CREATE TABLE IF NOT EXISTS crdt_change (
  doc_id TEXT NOT NULL REFERENCES crdt_doc(doc_id) ON DELETE CASCADE,
  seq INTEGER NOT NULL,                      -- monotonic locally
  actor_id BLOB NOT NULL,                    -- Automerge actor (bytes)
  change_hash BLOB NOT NULL,                 -- Automerge change hash bytes
  deps_hash BLOB,                            -- optional
  time_ms INTEGER NOT NULL,
  bytes BLOB NOT NULL,                       -- encoded change (possibly zstd)
  is_checkpoint INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (doc_id, seq),
  UNIQUE (doc_id, change_hash),
  CHECK (is_checkpoint IN (0,1))
) STRICT;

CREATE INDEX IF NOT EXISTS idx_change_doc_time ON crdt_change(doc_id, time_ms);
```

### Graph storage

SQL

```
CREATE TABLE IF NOT EXISTS graph_node (
  node_id TEXT PRIMARY KEY,                  -- UUIDv7
  node_kind INTEGER NOT NULL,                -- 1=source_conv,2=source_msg,3=artifact,4=tag,5=concept,6=entity
  ref_id TEXT,                               -- conv_id/msg_id/artifact_id/tag text
  label TEXT,
  created_at_ms INTEGER NOT NULL,
  UNIQUE(node_kind, ref_id)
) STRICT;

CREATE TABLE IF NOT EXISTS graph_edge (
  edge_id TEXT PRIMARY KEY,                  -- UUIDv7
  from_node TEXT NOT NULL REFERENCES graph_node(node_id) ON DELETE CASCADE,
  to_node TEXT NOT NULL REFERENCES graph_node(node_id) ON DELETE CASCADE,
  edge_kind INTEGER NOT NULL,                -- 1=derives,2=references,3=tagged,4=mentions,5=similar_to,6=replies_to
  weight REAL NOT NULL DEFAULT 1.0,
  created_at_ms INTEGER NOT NULL,
  CHECK (weight >= 0.0)
) STRICT;

CREATE INDEX IF NOT EXISTS idx_edge_from_kind ON graph_edge(from_node, edge_kind);
CREATE INDEX IF NOT EXISTS idx_edge_to_kind ON graph_edge(to_node, edge_kind);
CREATE INDEX IF NOT EXISTS idx_edge_kind_weight ON graph_edge(edge_kind, weight DESC);
```

### Full-text search (FTS5)

We index a unified “search document” table that points to either source\_message or artifact.

SQL

```
CREATE TABLE IF NOT EXISTS search_doc (
  doc_key TEXT PRIMARY KEY,                  -- e.g. "msg:<msg_id>" or "art:<artifact_id>"
  doc_type INTEGER NOT NULL,                 -- 1=source_msg,2=artifact
  ref_id TEXT NOT NULL,
  title TEXT,
  body TEXT NOT NULL,
  updated_at_ms INTEGER NOT NULL
) STRICT;

CREATE VIRTUAL TABLE IF NOT EXISTS search_fts USING fts5(
  title, body,
  content='search_doc',
  content_rowid='rowid',
  tokenize = 'unicode61'
);

-- Keep FTS in sync
CREATE TRIGGER IF NOT EXISTS trg_search_doc_ai AFTER INSERT ON search_doc BEGIN
  INSERT INTO search_fts(rowid, title, body) VALUES (new.rowid, new.title, new.body);
END;

CREATE TRIGGER IF NOT EXISTS trg_search_doc_ad AFTER DELETE ON search_doc BEGIN
  INSERT INTO search_fts(search_fts, rowid, title, body) VALUES('delete', old.rowid, old.title, old.body);
END;

CREATE TRIGGER IF NOT EXISTS trg_search_doc_au AFTER UPDATE ON search_doc BEGIN
  INSERT INTO search_fts(search_fts, rowid, title, body) VALUES('delete', old.rowid, old.title, old.body);
  INSERT INTO search_fts(rowid, title, body) VALUES (new.rowid, new.title, new.body);
END;

CREATE INDEX IF NOT EXISTS idx_search_updated ON search_doc(updated_at_ms DESC);
```

### Sharing, permissions, moderation flags

SQL

```
CREATE TABLE IF NOT EXISTS share_record (
  share_id TEXT PRIMARY KEY,                 -- UUIDv7
  owner_user_id TEXT NOT NULL REFERENCES user_account(user_id) ON DELETE CASCADE,
  artifact_id TEXT REFERENCES artifact(artifact_id) ON DELETE SET NULL,
  conv_id TEXT REFERENCES source_conversation(conv_id) ON DELETE SET NULL,
  created_at_ms INTEGER NOT NULL,
  share_kind INTEGER NOT NULL,               -- 1=conversation,2=slice,3=artifact
  redaction_artifact_id TEXT,                -- points to a RedactionLayer artifact used
  share_sig_ed25519 BLOB NOT NULL,           -- signature by device/user key
  CHECK (share_kind BETWEEN 1 AND 3)
) STRICT;

CREATE INDEX IF NOT EXISTS idx_share_owner_time ON share_record(owner_user_id, created_at_ms DESC);
CREATE INDEX IF NOT EXISTS idx_share_conv ON share_record(conv_id);
```

### Credit ledger (local cache + receipts)

**Authoritative ledger lives in federation nodes**, but client keeps:

-   local cached balances,
-   append-only history,
-   signed receipts for audits.

SQL

```
CREATE TABLE IF NOT EXISTS credit_account (
  account_id TEXT PRIMARY KEY,               -- usually user_id
  balance INTEGER NOT NULL DEFAULT 0,
  updated_at_ms INTEGER NOT NULL,
  CHECK (balance >= -100000000)              -- allow temporary negative only if policy permits
) STRICT;

CREATE TABLE IF NOT EXISTS credit_txn (
  txn_id TEXT PRIMARY KEY,                   -- UUIDv7
  account_id TEXT NOT NULL REFERENCES credit_account(account_id) ON DELETE CASCADE,
  direction INTEGER NOT NULL,                -- 1=credit,2=debit
  amount INTEGER NOT NULL,
  reason INTEGER NOT NULL,                   -- enums: share_reward, access_spend, stake_lock, stake_slash, etc.
  related_object_id TEXT,                    -- share_id or community_object_id
  created_at_ms INTEGER NOT NULL,
  federation_receipt BLOB,                   -- signed receipt from ledger cluster (when online)
  CHECK (direction IN (1,2)),
  CHECK (amount > 0)
) STRICT;

CREATE INDEX IF NOT EXISTS idx_txn_account_time ON credit_txn(account_id, created_at_ms DESC);
```

### Votes / quality scoring (community)

SQL

```
CREATE TABLE IF NOT EXISTS community_object (
  object_id TEXT PRIMARY KEY,                -- federation id or CID string
  object_kind INTEGER NOT NULL,              -- 1=shared_conv,2=shared_artifact
  created_at_ms INTEGER NOT NULL,
  quality_score REAL NOT NULL DEFAULT 0.0
) STRICT;

CREATE TABLE IF NOT EXISTS vote (
  vote_id TEXT PRIMARY KEY,
  object_id TEXT NOT NULL REFERENCES community_object(object_id) ON DELETE CASCADE,
  voter_user_id TEXT NOT NULL REFERENCES user_account(user_id) ON DELETE CASCADE,
  value INTEGER NOT NULL,                    -- -1, +1
  created_at_ms INTEGER NOT NULL,
  sig_ed25519 BLOB NOT NULL,
  UNIQUE(object_id, voter_user_id),
  CHECK (value IN (-1,1))
) STRICT;

CREATE INDEX IF NOT EXISTS idx_vote_object ON vote(object_id);
```

### Sync state (P2P + federation)

SQL

```
CREATE TABLE IF NOT EXISTS peer (
  peer_id TEXT PRIMARY KEY,                  -- libp2p PeerId string
  last_seen_ms INTEGER,
  addresses_json TEXT,                       -- multiaddrs
  is_bootstrap INTEGER NOT NULL DEFAULT 0,
  CHECK (is_bootstrap IN (0,1))
) STRICT;

CREATE TABLE IF NOT EXISTS sync_cursor (
  namespace INTEGER NOT NULL,                -- 1=personal,2=community
  peer_id TEXT NOT NULL REFERENCES peer(peer_id) ON DELETE CASCADE,
  cursor_key TEXT NOT NULL,                  -- e.g. "cas", "crdt:<doc_id>"
  cursor_value TEXT NOT NULL,
  updated_at_ms INTEGER NOT NULL,
  PRIMARY KEY (namespace, peer_id, cursor_key)
) STRICT;

CREATE INDEX IF NOT EXISTS idx_cursor_peer ON sync_cursor(peer_id, updated_at_ms DESC);
```

### Invariants: ref\_count maintenance (CAS)

When a CAS object is referenced/unreferenced, update `ref_count`.

SQL

```
CREATE TRIGGER IF NOT EXISTS trg_cas_ref_ai AFTER INSERT ON cas_ref BEGIN
  UPDATE cas_object SET ref_count = ref_count + 1
  WHERE hash = new.hash AND hash_alg = new.hash_alg;
END;

CREATE TRIGGER IF NOT EXISTS trg_cas_ref_ad AFTER DELETE ON cas_ref BEGIN
  UPDATE cas_object SET ref_count = MAX(ref_count - 1, 0)
  WHERE hash = old.hash AND hash_alg = old.hash_alg;
END;
```

### Common views

SQL

```
CREATE VIEW IF NOT EXISTS v_artifact_with_balance AS
SELECT a.*, ca.balance
FROM artifact a
LEFT JOIN credit_account ca ON ca.account_id = a.owner_user_id;
```

---

## 2B. Database Configuration (PRAGMAs)

Set at open:

SQL

```
PRAGMA journal_mode = WAL;
PRAGMA synchronous = NORMAL;
PRAGMA temp_store = MEMORY;
PRAGMA foreign_keys = ON;
PRAGMA cache_size = -20000;          -- ~20MB (negative = KB)
PRAGMA wal_autocheckpoint = 1000;    -- tune by write volume
PRAGMA mmap_size = 268435456;        -- 256MB if supported
PRAGMA auto_vacuum = INCREMENTAL;
PRAGMA incremental_vacuum = 2000;
```

SQLCipher:

-   `PRAGMA cipher_page_size = 4096;`
-   `PRAGMA kdf_iter = 256000;` (tune by device class)

Maintenance schedule:

-   weekly incremental vacuum
-   monthly `ANALYZE;`
-   on-demand compaction of CRDT logs

---

## 2C. Query Patterns (critical SQL)

### Import conversation list

SQL

```
SELECT conv_id, title, provider, imported_at_ms
FROM source_conversation
WHERE owner_user_id = ?
ORDER BY imported_at_ms DESC
LIMIT ? OFFSET ?;
```

Indexes: `idx_sourceconv_owner`.

### Fetch messages in order

SQL

```
SELECT msg_id, cas_hash, cas_hash_alg, role, created_at_ms
FROM source_message
WHERE conv_id = ?
ORDER BY order_index ASC;
```

Indexes: `idx_msg_conv_order`.

### Full text search (messages + artifacts)

SQL

```
SELECT sd.doc_key, sd.doc_type, sd.ref_id, bm25(search_fts) AS rank
FROM search_fts
JOIN search_doc sd ON sd.rowid = search_fts.rowid
WHERE search_fts MATCH ?
ORDER BY rank
LIMIT 50;
```

### Provenance: list dependencies

SQL

```
SELECT dep_kind, dep_id, dep_hash, dep_hash_alg
FROM artifact_dep
WHERE artifact_id = ?;
```

### Graph traversal (1 hop)

SQL

```
SELECT ge.edge_kind, gn2.node_kind, gn2.ref_id, gn2.label
FROM graph_edge ge
JOIN graph_node gn1 ON gn1.node_id = ge.from_node
JOIN graph_node gn2 ON gn2.node_id = ge.to_node
WHERE gn1.node_kind = ? AND gn1.ref_id = ?;
```

### CRDT sync: fetch changes since seq

SQL

```
SELECT seq, actor_id, change_hash, time_ms, bytes, is_checkpoint
FROM crdt_change
WHERE doc_id = ? AND seq > ?
ORDER BY seq ASC
LIMIT 500;
```

---

## 2D. Migration Strategy

-   `meta.schema_version` increments monotonically.
-   Rust migrator:
    -   runs inside a single transaction
    -   writes a row to `migration_log` (add this table in v2 if needed)
-   Backward compatibility:
    -   add columns as nullable with defaults
    -   avoid destructive changes; when unavoidable:
        -   create new table, copy data, swap, keep old table until successful verification

---

# DOCUMENT 3 — Object & Document Schema Specifications

All canonical objects are stored as **canonical JSON bytes** in CAS (deterministic serialization: sorted keys, UTF-8, no trailing whitespace). JSON Schema Draft 2020-12.

## 3A. Immutable Source Object Schemas

### Common `$defs`

JSON

```
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "kg://schemas/common.json",
  "$defs": {
    "CID": { "type": "string", "minLength": 10 },
    "UUID": { "type": "string", "minLength": 16 },
    "UnixMs": { "type": "integer", "minimum": 0 },
    "Provider": { "type": "string", "enum": ["chatgpt","claude","gemini","perplexity","generic"] },
    "Role": { "type": "string", "enum": ["user","assistant","system","tool"] }
  }
}
```

### `RawCapture`

JSON

```
{
  "$schema":"https://json-schema.org/draft/2020-12/schema",
  "$id":"kg://schemas/raw_capture.json",
  "type":"object",
  "required":["type","capturedAtMs","source","payload"],
  "properties":{
    "type":{"enum":["html","json","pdf","txt"]},
    "capturedAtMs":{"$ref":"kg://schemas/common.json#/$defs/UnixMs"},
    "source":{
      "type":"object",
      "required":["url","provider"],
      "properties":{
        "url":{"type":"string"},
        "provider":{"$ref":"kg://schemas/common.json#/$defs/Provider"}
      },
      "additionalProperties":false
    },
    "payload":{
      "type":"object",
      "required":["mime","bytesCid"],
      "properties":{
        "mime":{"type":"string"},
        "bytesCid":{"$ref":"kg://schemas/common.json#/$defs/CID"}
      },
      "additionalProperties":false
    }
  },
  "additionalProperties":false
}
```

### `SourceConversation`

JSON

```
{
  "$schema":"https://json-schema.org/draft/2020-12/schema",
  "$id":"kg://schemas/source_conversation.json",
  "type":"object",
  "required":["schemaVersion","provider","conversationId","importedAtMs","messages"],
  "properties":{
    "schemaVersion":{"type":"integer","const":1},
    "provider":{"$ref":"kg://schemas/common.json#/$defs/Provider"},
    "conversationId":{"type":"string"},
    "title":{"type":"string"},
    "startedAtMs":{"$ref":"kg://schemas/common.json#/$defs/UnixMs"},
    "importedAtMs":{"$ref":"kg://schemas/common.json#/$defs/UnixMs"},
    "sourceUrl":{"type":"string"},
    "messages":{
      "type":"array",
      "items":{"$ref":"kg://schemas/source_message.json"},
      "minItems":1
    },
    "assets":{
      "type":"array",
      "items":{"$ref":"kg://schemas/common.json#/$defs/CID"},
      "default":[]
    }
  },
  "additionalProperties":false
}
```

### `SourceMessage` and content parts

JSON

```
{
  "$schema":"https://json-schema.org/draft/2020-12/schema",
  "$id":"kg://schemas/source_message.json",
  "type":"object",
  "required":["messageId","role","parts","orderIndex"],
  "properties":{
    "messageId":{"type":"string"},
    "providerMessageId":{"type":"string"},
    "role":{"$ref":"kg://schemas/common.json#/$defs/Role"},
    "createdAtMs":{"$ref":"kg://schemas/common.json#/$defs/UnixMs"},
    "orderIndex":{"type":"integer","minimum":0},
    "parts":{
      "type":"array",
      "items":{"$ref":"kg://schemas/source_part.json"},
      "minItems":1
    },
    "metadata":{
      "type":"object",
      "properties":{
        "model":{"type":"string"},
        "temperature":{"type":"number"},
        "tokensIn":{"type":"integer","minimum":0},
        "tokensOut":{"type":"integer","minimum":0}
      },
      "additionalProperties":true
    }
  },
  "additionalProperties":false
}
```

`SourcePart` union:

JSON

```
{
  "$schema":"https://json-schema.org/draft/2020-12/schema",
  "$id":"kg://schemas/source_part.json",
  "oneOf":[
    {"$ref":"kg://schemas/parts/markdown.json"},
    {"$ref":"kg://schemas/parts/code.json"},
    {"$ref":"kg://schemas/parts/latex.json"},
    {"$ref":"kg://schemas/parts/tool_call.json"},
    {"$ref":"kg://schemas/parts/image.json"},
    {"$ref":"kg://schemas/parts/file.json"}
  ]
}
```

Example `markdown` part:

JSON

```
{
  "$schema":"https://json-schema.org/draft/2020-12/schema",
  "$id":"kg://schemas/parts/markdown.json",
  "type":"object",
  "required":["type","text"],
  "properties":{
    "type":{"const":"markdown"},
    "text":{"type":"string"}
  },
  "additionalProperties":false
}
```

Example `code` part:

JSON

```
{
  "$schema":"https://json-schema.org/draft/2020-12/schema",
  "$id":"kg://schemas/parts/code.json",
  "type":"object",
  "required":["type","code"],
  "properties":{
    "type":{"const":"code"},
    "language":{"type":"string"},
    "code":{"type":"string"}
  },
  "additionalProperties":false
}
```

Example `image` part:

JSON

```
{
  "$schema":"https://json-schema.org/draft/2020-12/schema",
  "$id":"kg://schemas/parts/image.json",
  "type":"object",
  "required":["type","bytesCid"],
  "properties":{
    "type":{"const":"image"},
    "bytesCid":{"$ref":"kg://schemas/common.json#/$defs/CID"},
    "mime":{"type":"string"},
    "width":{"type":"integer","minimum":0},
    "height":{"type":"integer","minimum":0},
    "alt":{"type":"string"}
  },
  "additionalProperties":false
}
```

---

## 3B. Derived Artifact Schemas (CRDT document payload models)

All derived docs are stored as Automerge docs. Canonical “export snapshot” JSON conforms to schemas below.

### Base DerivedDoc

JSON

```
{
  "$schema":"https://json-schema.org/draft/2020-12/schema",
  "$id":"kg://schemas/derived_base.json",
  "type":"object",
  "required":["schemaVersion","type","title","blocks","provenance"],
  "properties":{
    "schemaVersion":{"type":"integer","const":1},
    "type":{"type":"string"},
    "title":{"type":"string"},
    "blocks":{"type":"array","items":{"$ref":"kg://schemas/block.json"}},
    "provenance":{
      "type":"object",
      "required":["createdAtMs","createdBy","dependsOn"],
      "properties":{
        "createdAtMs":{"$ref":"kg://schemas/common.json#/$defs/UnixMs"},
        "createdBy":{"type":"object","required":["userId","devicePubKey"],"properties":{
          "userId":{"$ref":"kg://schemas/common.json#/$defs/UUID"},
          "devicePubKey":{"type":"string"}
        }},
        "dependsOn":{"type":"array","items":{"type":"string"}}  // list of CIDs and/or artifact IDs
      },
      "additionalProperties":false
    }
  },
  "additionalProperties":false
}
```

### `ViewDoc`

-   curated reading order, headings, callouts; mostly references + notes

JSON

```
{
  "$schema":"https://json-schema.org/draft/2020-12/schema",
  "$id":"kg://schemas/view_doc.json",
  "allOf":[
    {"$ref":"kg://schemas/derived_base.json"},
    {"properties":{"type":{"const":"view"}}}
  ]
}
```

### `Slice`

-   shareable chunk with context rules

JSON

```
{
  "$schema":"https://json-schema.org/draft/2020-12/schema",
  "$id":"kg://schemas/slice.json",
  "allOf":[
    {"$ref":"kg://schemas/derived_base.json"},
    {"properties":{
      "type":{"const":"slice"},
      "context":{
        "type":"object",
        "properties":{
          "includePrev":{"type":"integer","minimum":0,"default":0},
          "includeNext":{"type":"integer","minimum":0,"default":0}
        },
        "additionalProperties":false
      }
    }}
  ]
}
```

### `AnnotationLayer`

JSON

```
{
  "$schema":"https://json-schema.org/draft/2020-12/schema",
  "$id":"kg://schemas/annotation_layer.json",
  "allOf":[
    {"$ref":"kg://schemas/derived_base.json"},
    {"properties":{"type":{"const":"annotation_layer"}}}
  ]
}
```

### `RedactionLayer`

JSON

```
{
  "$schema":"https://json-schema.org/draft/2020-12/schema",
  "$id":"kg://schemas/redaction_layer.json",
  "allOf":[
    {"$ref":"kg://schemas/derived_base.json"},
    {"properties":{"type":{"const":"redaction_layer"}}}
  ]
}
```

### `WeaveDoc`, `ThreadDoc`, `SummaryDoc`, `TaskDoc`

They reuse the same block system but apply different UI renderers and validators (e.g., `SummaryDoc` blocks must be note-like; `TaskDoc` blocks must include task fields).

---

## 3C. Block Type System (for derived documents)

`Block` union:

JSON

```
{
  "$schema":"https://json-schema.org/draft/2020-12/schema",
  "$id":"kg://schemas/block.json",
  "oneOf":[
    {"$ref":"kg://schemas/blocks/ref_block.json"},
    {"$ref":"kg://schemas/blocks/note_block.json"},
    {"$ref":"kg://schemas/blocks/annotation_block.json"},
    {"$ref":"kg://schemas/blocks/redaction_block.json"},
    {"$ref":"kg://schemas/blocks/group_block.json"},
    {"$ref":"kg://schemas/blocks/task_block.json"}
  ]
}
```

`RefBlock` (points into immutable sources via anchor):

JSON

```
{
  "$schema":"https://json-schema.org/draft/2020-12/schema",
  "$id":"kg://schemas/blocks/ref_block.json",
  "type":"object",
  "required":["blockId","type","anchor","render"],
  "properties":{
    "blockId":{"type":"string"},
    "type":{"const":"ref"},
    "anchor":{"$ref":"kg://schemas/anchor.json"},
    "render":{
      "type":"object",
      "properties":{
        "as":{"enum":["quote","embed","code","message"]},
        "maxChars":{"type":"integer","minimum":0}
      },
      "additionalProperties":false
    }
  },
  "additionalProperties":false
}
```

`NoteBlock`:

JSON

```
{
  "$schema":"https://json-schema.org/draft/2020-12/schema",
  "$id":"kg://schemas/blocks/note_block.json",
  "type":"object",
  "required":["blockId","type","markdown"],
  "properties":{
    "blockId":{"type":"string"},
    "type":{"const":"note"},
    "markdown":{"type":"string"}
  },
  "additionalProperties":false
}
```

`RedactionBlock`:

JSON

```
{
  "$schema":"https://json-schema.org/draft/2020-12/schema",
  "$id":"kg://schemas/blocks/redaction_block.json",
  "type":"object",
  "required":["blockId","type","anchor","mode"],
  "properties":{
    "blockId":{"type":"string"},
    "type":{"const":"redaction"},
    "anchor":{"$ref":"kg://schemas/anchor.json"},
    "mode":{"enum":["mask","remove"]},
    "replacementText":{"type":"string"}
  },
  "additionalProperties":false
}
```

---

## 3D. Anchor Specifications

### Anchor object schema

JSON

```
{
  "$schema":"https://json-schema.org/draft/2020-12/schema",
  "$id":"kg://schemas/anchor.json",
  "type":"object",
  "required":["anchorType","target"],
  "properties":{
    "anchorType":{"enum":["message","part","range","semantic"]},
    "target":{
      "type":"object",
      "required":["conversationId","messageId"],
      "properties":{
        "conversationId":{"type":"string"},
        "messageId":{"type":"string"},
        "partIndex":{"type":"integer","minimum":0},
        "start":{"type":"integer","minimum":0},
        "end":{"type":"integer","minimum":0},
        "quote":{"type":"string"},
        "casCid":{"type":"string"}
      },
      "additionalProperties":false
    },
    "fallback":{
      "type":"object",
      "properties":{
        "hashOfNormalizedText":{"type":"string"},
        "searchWindow":{"type":"integer","minimum":0,"default":2000}
      },
      "additionalProperties":false
    }
  },
  "additionalProperties":false
}
```

### Anchor resolution algorithm (deterministic)

Given (conversationId, messageId, partIndex?, start/end?, quote?):

1.  Load `SourceMessage` by `messageId`.
2.  If `casCid` provided, verify message CAS matches expected.
3.  Resolve:
    -   `message`: returns whole message parts concatenated (or structured rendering)
    -   `part`: select partIndex
    -   `range`: slice within selected part text (UTF-16 code unit offsets stored for UI parity; convert as needed)
4.  Drift handling:
    -   if offsets invalid, search for `quote` within `searchWindow` around expected area
    -   else search whole part for `quote`
    -   else fallback to `hashOfNormalizedText` match
5.  If still missing:
    -   return “unresolved anchor” placeholder; keep artifact valid but visually flagged

---

## 3E. Bundle / Export Format

### Format

-   Container: `.kgpack`
-   Encoding: **CAR v1-like** (Content Addressed Archive) + manifest
-   Compression: `zstd` (level 3 default)
-   Encryption: optional (XChaCha20-Poly1305), key derived from user passphrase

### Manifest schema (top-level JSON)

JSON

```
{
  "schemaVersion": 1,
  "createdAtMs": 0,
  "bundleId": "uuid",
  "includes": {
    "casCids": ["cid1","cid2"],
    "artifacts": ["artifactId1"],
    "crdtDocs": ["docId1"]
  },
  "roots": ["cid-or-artifact-id"],
  "dependencies": [
    {"from":"artifact:...","to":"cid:...","kind":"dependsOn"}
  ],
  "signatures": [
    {"byDevicePubKey":"...","sig":"...","over":"manifestSha256"}
  ]
}
```

Import rules:

-   verify manifest signatures (if present)
-   ensure all referenced dependencies exist or are included
-   insert CAS first, then artifacts, then CRDT logs

---

# DOCUMENT 4 — Ownership, Credit & Access Control System Design

## 4A. Ownership State Machine

### States

-   **PRIVATE (1)**: visible only to owner devices; encrypted; not announced.
-   **PREPARING\_SHARE (2)**: user is redacting/reviewing; generates share declaration.
-   **SHARED (3)**: shared to community; **ownership transferred to community** for the shared object’s “community instance”.
-   **DERIVATIVE (4)**: any community-created artifact that depends on SHARED content; owned by community.
-   **TOMBSTONE (5)**: withdrawn from discovery; object remains in history for provenance/audit.

### Transitions

From → To

Event

Required artifacts

PRIVATE → PREPARING\_SHARE

user taps “Share”

create/attach RedactionLayer (optional)

PREPARING\_SHARE → SHARED

user confirms + signs ShareDeclaration + ledger accepts

ShareRecord + signed receipt

SHARED → TOMBSTONE

user requests withdrawal + moderation/ledger accepts

Tombstone record + receipt

SHARED → DERIVATIVE

community creates artifact referencing shared roots

provenance edges + community license

PRIVATE → TOMBSTONE

user deletes locally (optional)

local-only tombstone; CAS remains if referenced

### Invariants

-   Immutable CAS objects are **never modified**.
-   Every SHARED object has:
    -   a ShareDeclaration signature,
    -   a redaction layer hash (possibly “empty redaction”),
    -   an authoritative ledger receipt.
-   DERIVATIVE objects must reference at least one SHARED root in provenance.

### Persistence

-   `ownership_state` columns in `source_conversation` and `artifact`
-   `share_record` stores signatures and redaction artifact linkage
-   Community nodes store authoritative mapping: (community\_object\_id → roots, license, quality score)

---

## 4B. Credit Economy Design

### Goals

-   Gate community access to contributors
-   Resist spam/sybil
-   Reward useful content and curation

### Units

-   Credits are integer “points”.
-   No conversion to fiat in base design (keeps regulation simpler). If later added, treat as separate token.

### Credit accrual (earning)

When a user shares content that is accepted:

-   **Base share reward**:
    -   `base = ceil( 10 * sqrt(size_kb) )` capped at 500
-   **Quality multiplier** `Q` (0.5 to 2.0):
    -   computed daily from votes + engagement
    -   `Q = clamp(0.5, 2.0, 0.5 + 1.5 * wilson(up, down))`
-   **Curation bonuses**:
    -   If user also shares a `SummaryDoc` or `WeaveDoc` referencing SHARED roots and gets positive score:
        -   `bonus = 25 * wilson(up,down)` capped 50
-   Total minted:
    -   `earned = floor(base * Q) + bonus`

Minting happens in ledger cluster and is recorded as `credit_txn(reason=share_reward)`.

### Credit spending (access)

To access a community object:

-   `cost = max(1, ceil(size_kb / 50)) * rarityFactor * qualityFactor`
    -   `rarityFactor = 1.0` initially (reserved for later scarcity tuning)
    -   `qualityFactor = clamp(0.8, 1.5, 1.2 - 0.4 * wilson(up,down))`
        -   high-quality content is slightly cheaper (encourages reading good content)

Bulk pricing:

-   daily “community pass” (optional):
    -   debit fixed 50 credits for 24h unlimited reads (anti-scrape throttles still apply)

### Credit storage & double-spend prevention

-   **Authoritative ledger is federated but centralized-for-consensus**:
    -   5–9 community-run nodes
    -   Raft replicated append-only log
    -   each txn references previous account nonce (prevents replay)
-   Client:
    -   submits signed txn intent
    -   receives signed receipt (quorum signature)
    -   caches receipts in `credit_txn.federation_receipt`

Atomicity:

-   Ledger applies: `debit(access)` and `grant(read_receipt)` in one transaction.

### Anti-gaming measures

-   Share stake:
    -   user must lock `stake = min(20, ceil(size_kb/200))` credits for 7 days
    -   returned if not flagged; slashed if spam/PII violation confirmed
-   Sybil mitigation:
    -   new accounts: low daily spend caps until reputation grows
    -   require verified channel (phone/email/passkey) to lift caps
-   Vote manipulation:
    -   votes weighted by voter reputation (bounded)
    -   anomaly detection: sudden correlated voting rings → downweight
-   Spam detection:
    -   on-device PII scan warnings (Document 4E)
    -   federation-side similarity clustering (near-duplicate spam)
    -   rate limits by identity age + stake requirements

---

## 4C. Permission Resolution Algorithm

**Input**: `(user_id, object_id_or_hash, operation)`  
**Output**: `ALLOW | DENY | INSUFFICIENT_CREDITS`

Algorithm:

1.  Resolve object type:
    -   CAS object (source) or artifact
2.  Load ownership state.
3.  If `PRIVATE`:
    -   allow only if `owner_user_id == user_id`
4.  If `PREPARING_SHARE`:
    -   allow only owner; deny others
5.  If `SHARED`:
    -   if user already has valid read receipt → ALLOW
    -   else check credit balance:
        -   if balance < cost → INSUFFICIENT\_CREDITS
        -   else create ledger debit txn; on receipt → ALLOW
6.  If `DERIVATIVE`:
    -   recursively ensure all SHARED roots are permitted (or charge once per “bundle root”)
7.  Apply redaction:
    -   if redaction layers exist, render with masks/removals applied
8.  Return decision.

---

## 4D. Community Ownership Semantics (transfer on share)

When user shares:

-   User retains their **private original** in personal vault.
-   A **community instance** is created:
    -   points to the same immutable CAS roots _post-redaction_ (or to a new redacted CAS snapshot if redaction requires content rewrite)
    -   licensed under community license:
        -   recommended: **CC BY-SA 4.0** (attribution + share-alike), or CC0 if community prefers
-   Derivatives:
    -   any artifact created in Community Mode is marked `DERIVATIVE` and governed by the same license.
-   Attribution:
    -   share declaration includes optional attribution name; default is pseudonymous user id.
-   Deletion:
    -   user can request **TOMBSTONE** (withdraw from discovery)
    -   provenance remains; existing derivatives remain but must respect tombstones in UI (e.g., “source withdrawn” marker)

---

## 4E. Privacy & Redaction

### Redaction flow

1.  User selects conversation/slice to share.
2.  App runs **local PII detection**:
    -   regex + heuristics for:
        -   emails, phone numbers, addresses (limited), API keys, SSNs (region-specific), secrets (high-entropy tokens)
3.  UI highlights suspected PII; user confirms redaction.
4.  Redaction stored as **RedactionLayer artifact** (Layer B) using `RedactionBlock`s anchored to immutable sources.
5.  Share declaration includes:
    -   root IDs
    -   redaction layer ID/hash
    -   signature

### Irreversibility policy

-   Community content should be treated as **public and permanent**.
-   Redactions are enforced at render time, but:
    -   if user shares without redacting, it is effectively irreversible once replicated.
-   Federation policy:
    -   can enforce minimum redaction checks (e.g., block obvious secrets)

---

## Appendix — Minimal Federation Deployment (Production)

Even with P2P, you want federation services for:

-   credit ledger consensus,
-   abuse handling,
-   discovery/search.

Recommended deployment:

-   Kubernetes (or Nomad) with:
    -   `ledger-service` (Raft group, persistent volumes)
    -   `index-service` (OpenSearch)
    -   `bootstrap-libp2p` nodes (stateless)
    -   `moderation-service` + queue
-   Backups:
    -   ledger log snapshots daily
    -   OpenSearch snapshots daily

---

If you want, I can produce **(a)** the federation service APIs (OpenAPI), **(b)** the libp2p protocol message definitions, and **(c)** the exact ShareDeclaration / LedgerReceipt signed payload formats as an additional “Document 5”.

## Message from gpt-5.2-high

Previous slideNext slide

# Complete Technical Design Specification Request

## Community-Owned AI Knowledge Graph System

You are tasked with creating a **complete, production-ready technical design specification** for a novel system. This must be a **zero-to-full design spec series** covering every technical decision needed to build and deploy this system. You will design the entire technology stack from first principles.

---

## System Requirements

### Core Functionality

**Platform:** Mobile application (cross-platform considerations required)

**Primary User Journey:**

1.  User shares AI chat conversation links (from any provider: ChatGPT, Claude, Gemini, Perplexity, etc.) into the app
2.  App fetches, parses, and stores conversations as immutable content-addressed objects
3.  System builds a knowledge graph across all imported conversations over time
4.  User can annotate, organize, search, and manipulate their personal conversation vault
5.  User can selectively share portions or entire conversations to the community
6.  **Upon sharing: content ownership transfers to community** (original remains with user, but all derivatives become communal property)
7.  Access control via contribution economy: users must either contribute content OR spend accumulated credits to access community-shared content

**Two Primary Operating Modes:**

-   **Personal Vault Mode:** Private import, storage, organization, annotation, search of user's own conversations
-   **Community Mode:** Share content, discover/access shared content, collaborate on community derivatives

---

## Architectural Constraints from Reference Document

Based on the attached architecture document, the system must implement:

### 1\. Two-Layer Storage Model

-   **Layer A:** Immutable, content-addressed source objects (conversations, messages, raw captures)
-   **Layer B:** Mutable derived artifacts (views, slices, annotations, redactions, weaves, threads, summaries) that reference immutable sources

### 2\. Ownership & Provenance Model

-   Perfect provenance tracking (every object traceable to origin)
-   Clear ownership states: PRIVATE → SHARED → DERIVATIVE
-   Immutable originals persist forever (append-only)
-   All transformations stored as separate artifacts

### 3\. Key Technical Capabilities Required

-   Content-addressed storage with automatic deduplication
-   Stable anchoring system (message-level, block-level, range-level)
-   CRDT-based collaboration for offline-first multi-device sync
-   Graph database for knowledge graph and relationships
-   Full-text search across all content
-   Bundle export/import preserving structure and dependencies
-   P2P sync for both personal (multi-device) and community (shared content) modes

### 4\. Novel Requirements Beyond Reference

-   **Credit/reputation system** for access control (not mentioned in reference doc)
-   **Ownership transfer semantics** (private → community transition)
-   **Quality scoring** to prevent spam and incentivize valuable contributions
-   **Mobile-specific constraints** (battery, storage, network, sandboxing)
-   **AI chat link parsing** for multiple providers (ChatGPT, Claude, etc.)
-   **Privacy controls** (selective sharing, redaction before sharing)

---

## Required Deliverables: Complete Design Specification Suite

You must produce a comprehensive technical specification covering all aspects of system design, implementation, deployment, and operation. For each section, provide **concrete, actionable specifications** - not abstract principles.

---

### DOCUMENT 1: System Architecture & Technology Stack Design

Design the complete technology stack from scratch. Evaluate all options and justify your choices.

#### 1A. Platform & Language Selection

-   Mobile framework choice (evaluate: native, cross-platform frameworks, hybrid approaches)
-   Primary implementation language(s)
-   Justification based on: performance, developer ecosystem, native API access, cross-platform needs, long-term maintenance
-   Build and deployment pipeline

#### 1B. Storage Architecture

-   Local database system selection and justification
-   Content-addressed object store design
-   Blob storage strategy
-   Cache layers and memory management
-   Mobile storage constraints handling (size limits, eviction policies)
-   Backup and recovery mechanisms

#### 1C. Cryptographic Primitives

-   Hash function selection for content addressing
-   Encryption algorithms for private content
-   Key derivation and management
-   Digital signature scheme for ownership proofs
-   Random number generation
-   Hardware security module integration (if applicable)

#### 1D. CRDT Implementation

-   CRDT type selection (evaluate: operation-based, state-based, delta-based)
-   Conflict resolution semantics
-   Garbage collection strategy
-   Memory and performance characteristics
-   Library vs custom implementation

#### 1E. Network & Sync Stack

-   P2P protocol design or selection
-   Transport layer (evaluate all options)
-   NAT traversal approach
-   Discovery mechanisms
-   Connection pooling and management
-   Bandwidth optimization for mobile

#### 1F. Parsing & Import Pipeline

-   HTML/JSON parsing approach
-   HTTP client library
-   Rate limiting and retry logic
-   Authentication handling for various AI platforms
-   Blob/image download and processing

#### 1G. Search & Indexing

-   Full-text search implementation
-   Indexing strategy
-   Query language design
-   Ranking algorithm
-   Real-time index updates

#### 1H. Graph Database

-   Graph storage and query approach
-   Traversal algorithms
-   Materialized views vs dynamic queries
-   Index optimization for common patterns

**Provide:** Architecture diagrams, technology comparison matrices, performance benchmarks, scalability analysis

---

### DOCUMENT 2: Complete Database Schema Design

Design the entire database schema in executable form.

#### 2A. Schema Definition

Provide complete CREATE TABLE statements for every table:

-   Immutable object store
-   Derived artifact metadata
-   CRDT change log
-   Graph edges
-   Anchors
-   Search indexes
-   Credit ledger
-   User accounts and reputation
-   Ownership tracking
-   Sharing permissions
-   Sync state
-   Configuration

**Requirements for each table:**

-   All columns with exact types, constraints, defaults
-   Primary keys, foreign keys, unique constraints
-   CHECK constraints for data integrity
-   Indexes for all query patterns (specify covering vs non-covering)
-   Triggers for maintaining invariants
-   Views for common access patterns

#### 2B. Database Configuration

-   PRAGMA settings and optimization
-   Journal mode selection
-   Write-ahead log configuration
-   Cache size tuning
-   Auto-vacuum settings
-   Analysis and maintenance schedules

#### 2C. Query Patterns

Document all critical queries with:

-   Exact SQL for each operation
-   Expected query plan (EXPLAIN QUERY PLAN)
-   Performance characteristics
-   Index utilization

#### 2D. Migration Strategy

-   Schema versioning approach
-   Migration execution framework
-   Backward compatibility handling
-   Data migration for breaking changes

**Provide:** Complete SQL DDL, query catalog, performance analysis, migration tooling design

---

### DOCUMENT 3: Object & Document Schema Specifications

Design all data structures stored in the database.

#### 3A. Immutable Source Object Schemas

Provide complete schemas (JSON Schema or equivalent) for:

-   `SourceConversation`
-   `SourceMessage`
-   `RawCapture`
-   Content part types (markdown, code, latex, tool calls, images, etc.)
-   Metadata structures

#### 3B. Derived Artifact Schemas

Complete specifications for:

-   `ViewDoc` - curated reading view
-   `Slice` - shareable chunk with context
-   `AnnotationLayer` - comments, highlights, tags
-   `RedactionLayer` - selective hiding
-   `WeaveDoc` - multi-source interleaving
-   `ThreadDoc` - alternate organization
-   `SummaryDoc` - condensed form
-   `TaskDoc` - extracted action items

#### 3C. Block Type System

Define all block types that can appear in derived documents:

-   Reference blocks (pointing to source content)
-   Note blocks (user-written content)
-   Annotation blocks
-   Redaction blocks
-   Composite/nested blocks

Include: type discriminators, required/optional fields, validation rules, rendering hints

#### 3D. Anchor Specifications

Detailed anchor format for:

-   Message-level anchors
-   Block-level anchors (with part index)
-   Range anchors (with offsets)
-   Semantic anchors for code
-   Anchor resolution algorithm
-   Handling drift and missing targets

#### 3E. Bundle/Export Format

Complete specification for export bundles:

-   Manifest structure
-   Dependency graph representation
-   Object inclusion rules
-   Compression strategy
-   Versioning and compatibility

**Provide:** Complete formal schemas, validation code, serialization/deserialization specs, examples

---

### DOCUMENT 4: Ownership, Credit & Access Control System Design

Design the complete economic and permission model.

#### 4A. Ownership State Machine

Define exact ownership states and transitions:

text

```
States: PRIVATE, PREPARING_SHARE, SHARED, DERIVATIVE, TOMBSTONE
Transitions: Events that trigger state changes
Invariants: Rules that must always hold
Storage: Where/how state is persisted
```

#### 4B. Credit Economy Design

Complete economic model:

-   **Credit Accrual Rules**
    -   Formula for credits earned per content shared
    -   Quality multipliers (votes, forks, views)
    -   Time decay (if any)
    -   Bonus structures
-   **Credit Spending Rules**
    -   Cost to access shared content (formula based on quality, size, age)
    -   Bulk access pricing
    -   Subscription alternatives
-   **Credit Storage**
    -   Ledger design (centralized vs distributed)
    -   Double-spend prevention
    -   Atomic transaction guarantees
    -   Audit trail requirements
-   **Anti-Gaming Measures**
    -   Spam detection and prevention
    -   Sybil attack mitigation
    -   Quality scoring algorithm
    -   Vote manipulation prevention
    -   Reputation decay for bad actors

#### 4C. Permission Resolution

Access control algorithm:

text

```
Input: (user_id, object_hash, operation)
Output: ALLOW | DENY | INSUFFICIENT_CREDITS

Steps:
1. Check ownership state
2. If PRIVATE: check if user is owner
3. If SHARED: check credits or contribution
4. If DERIVATIVE: recurse to original + check credits
5. Apply redaction layers
6. Return decision
```

#### 4D. Community Ownership Semantics

Define exactly what happens when content is shared:

-   Original retention (user keeps copy)
-   Community rights (who can do what)
-   Derivative tracking (provenance graph)
-   Attribution requirements
-   Revenue sharing (if applicable)
-   Deletion/tombstone handling

#### 4E. Privacy & Redaction

-   Redaction layer application before sharing
-   PII detection and warning
-   User consent flows
-   Irrevers

A is betterLeft is BetterIt's a tieBoth are badB is betterRight is Better

A is betterLeft is BetterIt's a tieBoth are badB is betterRight is Better

Inputs are processed by third-party AI and responses may be inaccurate.

Your conversations and certain other personal information will be disclosed to the relevant AI providers and may otherwise be disclosed publicly to help support our community and advance AI research.

Do not submit to our Services any personal information or other sensitive information that you would not want to be shared publicly. By continuing to use our Services, you acknowledge and direct us to engage in such sharing.

## Embedded Content

---