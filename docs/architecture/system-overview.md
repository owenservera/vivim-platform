---
title: "System Overview"
description: "VIVIM's 6-layer architecture: presentation, API, service, intelligence, storage, identity, and network layers."
---

# System Overview

VIVIM is built on a 6-layer architecture that separates concerns, enables provider agnosticism, and guarantees sovereignty through design.

## Architecture layers

```
┌──────────────────────────────────────────────────────────┐
│  Layer 1: Presentation                                   │
│  PWA  │  SDK  │  MCP Server  │  Admin Panel             │
├──────────────────────────────────────────────────────────┤
│  Layer 2: API                                            │
│  REST  │  WebSocket  │  MCP                              │
├──────────────────────────────────────────────────────────┤
│  Layer 3: Service                                        │
│  Context Engine  │  Memory Engine  │  Identity  │  Sync  │
├──────────────────────────────────────────────────────────┤
│  Layer 4: Intelligence                                   │
│  8-Layer Context Assembly  │  ACU Processing Pipeline    │
├──────────────────────────────────────────────────────────┤
│  Layer 5: Storage                                        │
│  SQLite  │  PostgreSQL  │  IPFS  │  S3-compatible        │
├──────────────────────────────────────────────────────────┤
│  Layer 6: Identity & Network                             │
│  DID  │  Zero-Knowledge  │  libp2p  │  CRDT  │  ActivityPub │
└──────────────────────────────────────────────────────────┘
```

## Layer details

### Layer 1: Presentation

The user-facing layer provides multiple interaction surfaces:

| Component | Purpose | Tech |
|---|---|---|
| **PWA** | Main web application | React 19, TypeScript, TailwindCSS, Vite 7 |
| **SDK** | Developer toolkit | TypeScript, Bun, assistant-ui |
| **MCP Server** | Claude Desktop, Cursor integration | Model Context Protocol |
| **Admin Panel** | Platform management | React, Vite |

### Layer 2: API

The API layer exposes three transport protocols:

| Protocol | Use Case | Endpoint |
|---|---|---|
| **REST** | CRUD operations, queries | `/api/v1/*` |
| **WebSocket** | Real-time sync, live conversations | `:3001` |
| **MCP** | AI tool integration | Model Context Protocol |

### Layer 3: Service

Core business logic lives here:

| Service | Responsibility |
|---|---|
| **Context Engine** | 8-layer context assembly, budget allocation, retrieval |
| **Memory Engine** | ACU lifecycle, classification, embedding, search |
| **Identity Service** | DID management, zero-knowledge encryption, key derivation |
| **Sync Service** | CRDT synchronization, P2P state reconciliation |

### Layer 4: Intelligence

The intelligence layer contains the algorithms that make VIVIM smart:

| Component | Function |
|---|---|
| **8-Layer Context Assembly** | L0-L7 context bundling for AI providers |
| **ACU Processing Pipeline** | Extraction, classification, embedding |
| **Hybrid Retrieval** | BM25 + vector similarity + graph traversal |
| **Prediction Engine** | Query anticipation, context prefetch |
| **Thermodynamics** | Memory decay, promotion, reinforcement |

### Layer 5: Storage

Multi-backend storage abstraction:

| Backend | Use Case | Properties |
|---|---|---|
| **PostgreSQL** | Primary data store | ACUs, users, relationships |
| **SQLite** | Local/embedded mode | Self-hosted, single-node |
| **IPFS/Helia** | Decentralized storage | Content-addressed, distributed |
| **S3-compatible** | Object storage | Encrypted blobs, exports |

### Layer 6: Identity & Network

The foundation layer ensures sovereignty and connectivity:

| Component | Protocol | Purpose |
|---|---|---|
| **DID** | W3C DID | Decentralized identity |
| **Zero-Knowledge** | AES-256-GCM | Client-side encryption |
| **libp2p** | P2P networking | Peer discovery, transport |
| **CRDT** | Yjs | Conflict-free replication |
| **ActivityPub** | Federation | Cross-instance communication |

## Core principles

| Principle | Description |
|---|---|
| **Layered isolation** | Each layer has a single responsibility and clean interfaces |
| **Provider agnosticism** | Works with any AI provider through the extraction pipeline |
| **ACU as canonical unit** | All memory flows through the ACU specification |

## API structure

The REST API at `/api/v1/` exposes these resource groups:

| Resource Group | Endpoints |
|---|---|
| **Auth** | Authentication, session management |
| **Memory** | ACU CRUD, search, classification |
| **Context** | Context assembly, budget queries |
| **Conversations** | Import, export, search |
| **Sync** | CRDT state synchronization |
| **Federation** | Cross-instance sharing |
| **Admin** | Platform management, observability |


::: tip
For detailed endpoint documentation, see the [API Reference](/api-reference) page.
:::

