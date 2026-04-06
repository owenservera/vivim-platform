---
title: "Storage"
description: "VIVIM's multi-backend storage architecture: PostgreSQL, SQLite, IPFS, and S3-compatible storage with encryption at rest."
---

# Storage

VIVIM uses a multi-backend storage architecture that abstracts over multiple storage engines while maintaining encryption guarantees across all of them.

## Storage backends

| Backend | Type | Use Case | Encryption |
|---|---|---|---|
| **PostgreSQL** | Relational database | Primary data store (multi-node) | AES-256-GCM (client-side) |
| **SQLite** | Embedded database | Single-node, self-hosted | AES-256-GCM (client-side) |
| **IPFS/Helia** | Distributed filesystem | Decentralized storage, exports | Encrypted content |
| **S3-compatible** | Object storage | Blob storage, backups | Encrypted blobs |

## Storage abstraction

VIVIM provides a unified storage interface that works across all backends:

```
┌─────────────────────────────────────────┐
│           Storage Abstraction            │
├─────────────────────────────────────────┤
│                                          │
│  ┌────────────────────────────┐         │
│  │      Storage Interface     │         │
│  │  read() write() delete()   │         │
│  │  search() export() sync()  │         │
│  └──────────────┬─────────────┘         │
│                 │                        │
│    ┌────────────┼────────────┐          │
│    │            │            │          │
│    ▼            ▼            ▼          │
│  ┌──────┐  ┌──────┐  ┌──────────┐      │
│  │  PG  │  │SQLite│  │ IPFS/S3  │      │
│  └──────┘  └──────┘  └──────────┘      │
│                                          │
└─────────────────────────────────────────┘
```

## Data model

### Primary entities

| Entity | Description | Stored in |
|---|---|---|
| **ACU** | Atomic Context Unit — the smallest unit of memory | Database |
| **Conversation** | Raw AI conversation log | Database |
| **User** | User profile and preferences | Database |
| **Circle** | Sharing group with encrypted access | Database |
| **MemoryLink** | Graph edge between two ACUs | Database |
| **Export** | Serialized memory export | IPFS / S3 |

### ACU storage format

Each ACU is stored as an encrypted record:

| Field | Encrypted | Description |
|---|---|---|
| `id` | No | Public identifier |
| `encrypted_content` | Yes | AES-256-GCM encrypted content |
| `encrypted_type` | Yes | Memory type (encrypted) |
| `encrypted_metadata` | Yes | Metadata (encrypted) |
| `embedding` | No | Vector embedding (non-sensitive) |
| `owner_did` | No | Owner's decentralized identifier |
| `created_at` | No | Creation timestamp |
| `updated_at` | No | Last modification timestamp |


::: info
Only the owner holds the decryption keys. The database stores encrypted blobs that are meaningless without the corresponding key.
:::


## Full-text search

VIVIM maintains full-text search indexes on encrypted content through a technique called **encrypted index with searchable metadata**:

| Index Type | Scope | Encrypted |
|---|---|---|
| **BM25** | Full-text keyword search | Yes (client-side index) |
| **Vector** | Semantic similarity | Yes (encrypted embeddings) |
| **Graph** | Relationship traversal | Yes (encrypted edges) |

## DAG engine and Merkle trees

For integrity verification and efficient synchronization, VIVIM uses a Directed Acyclic Graph (DAG) engine with Merkle trees:

| Feature | Purpose |
|---|---|
| **Merkle trees** | Cryptographic integrity verification of memory collections |
| **DAG structure** | Efficient synchronization of only changed records |
| **Content addressing** | Deduplication via IPFS content identifiers |

## Encryption at rest

All data is encrypted before it hits any storage backend:

```
┌──────────────────────────────────────────┐
│          Encryption at Rest               │
├──────────────────────────────────────────┤
│                                           │
│  Plaintext ACU                           │
│       │                                  │
│       ▼                                  │
│  ┌──────────────┐                       │
│  │ AES-256-GCM  │                       │
│  │  Encrypt     │                       │
│  └──────┬───────┘                       │
│         │                                │
│         ▼                                │
│  ┌──────────────┐                       │
│  │ Encrypted    │                       │
│  │ Blob         │────▶ Storage Backend  │
│  └──────────────┘                       │
│                                           │
└──────────────────────────────────────────┘
```

## Storage selection guide

| Scenario | Recommended Backend | Why |
|---|---|---|
| **Development** | SQLite | Zero setup, embedded |
| **Production (single node)** | PostgreSQL | Full features, reliable |
| **Production (distributed)** | PostgreSQL + IPFS | Scalability + decentralization |
| **Backup/Archive** | S3-compatible | Durability, cost |
| **Self-hosted minimal** | SQLite only | Single binary, no dependencies |


::: warning
When self-hosting with SQLite, you lose multi-node capabilities and P2P synchronization. Use PostgreSQL for any deployment that needs sync or federation.
:::



::: tip
Storage backends are configurable at runtime. You can migrate between backends using the migration tools documented in [Self-Hosting: Migration](/self-hosting/migration).
:::

