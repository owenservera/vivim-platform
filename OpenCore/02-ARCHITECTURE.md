# VIVIM Open Core — Architecture

## System Overview

This document describes the high-level architecture of the VIVIM open core. It provides a comprehensive view of how the system is organized, how data flows through it, and how the various components interact.

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           VIVIM Open Core Architecture                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         PRESENTATION LAYER                           │   │
│  │                                                                      │   │
│  │   ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────────────────┐   │   │
│  │   │   PWA  │  │   SDK   │  │   MCP  │  │    Admin Panel      │   │   │
│  │   │  (Web) │  │(Client) │  │ Server │  │    (Management)     │   │   │
│  │   └────┬────┘  └────┬────┘  └────┬────┘  └──────────┬──────────┘   │   │
│  └─────────┼───────────┼─────────────┼─────────────────┼───────────────┘   │
│            │           │             │                 │                     │
│  ┌─────────┴───────────┴─────────────┴─────────────────┴───────────────┐   │
│  │                            API LAYER                                 │   │
│  │                                                                      │   │
│  │   ┌──────────────────────────────────────────────────────────────┐  │   │
│  │   │                    REST / WebSocket / MCP                    │  │   │
│  │   └──────────────────────────────────────────────────────────────┘  │   │
│  └────────────────────────────────┬───────────────────────────────────────┘   │
│                                   │                                          │
│  ┌────────────────────────────────┴───────────────────────────────────────┐   │
│  │                          SERVICE LAYER                                │   │
│  │                                                                       │   │
│  │   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │   │
│  │   │   Context   │  │   Memory    │  │   Identity  │  │    Sync     │ │   │
│  │   │   Service   │  │   Service   │  │   Service   │  │   Service   │ │   │
│  │   └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘ │   │
│  │          │                  │                  │                 │        │   │
│  │          └──────────────────┼──────────────────┼────────────────┘        │   │
│  │                             ▼                                         │   │
│  │                  ┌─────────────────────┐                             │   │
│  │                  │   Unified Context   │                             │   │
│  │                  │      Pipeline        │                             │   │
│  │                  └──────────┬──────────┘                             │   │
│  └─────────────────────────────┼────────────────────────────────────────┘   │
│                                 │                                           │
│  ┌─────────────────────────────┼────────────────────────────────────────┐   │
│  │                    INTELLIGENCE LAYER                               │   │
│  │                                                                      │   │
│  │   ┌──────────────────────────────────────────────────────────────┐  │   │
│  │   │                   8-Layer Context Assembly                    │  │   │
│  │   │                                                              │  │   │
│  │   │  L7: Live Input    L6: Message History   L5: JIT Retrieval  │  │   │
│  │   │  L4: Conv Arc     L3: Entity Context    L2: Topic Context   │  │   │
│  │   │  L1: Preferences  L0: Identity Core                        │  │   │
│  │   └──────────────────────────────────────────────────────────────┘  │   │
│  │                              │                                        │   │
│  │   ┌──────────────────────────┴───────────────────────────────┐    │   │
│  │   │                   ACU Processing                          │    │   │
│  │   │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────────┐   │    │   │
│  │   │  │Extract  │ │Classify │ │ Embed   │ │   Store     │   │    │   │
│  │   │  └─────────┘ └─────────┘ └─────────┘ └─────────────┘   │    │   │
│  │   └───────────────────────────────────────────────────────────┘    │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      STORAGE LAYER                                   │   │
│  │                                                                       │   │
│  │   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │   │
│  │   │   SQLite    │  │    IPFS     │  │  S3-Compatible│              │   │
│  │   │  (Primary)  │  │ (Decentral) │  │   (Cloud)    │              │   │
│  │   └─────────────┘  └─────────────┘  └─────────────┘              │   │
│  │                                                                       │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      IDENTITY LAYER                                 │   │
│  │                                                                       │   │
│  │   ┌──────────────────────────────────────────────────────────────┐  │   │
│  │   │              DID (W3C Compliant) + Key Management           │  │   │
│  │   │         Zero-Knowledge / Keys Never Leave Device            │  │   │
│  │   └──────────────────────────────────────────────────────────────┘  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      NETWORK LAYER                                   │   │
│  │                                                                       │   │
│  │   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │   │
│  │   │   libp2p   │  │   CRDT      │  │  ActivityPub │              │   │
│  │   │   (P2P)    │  │   (Sync)    │  │  (Federation)│              │   │
│  │   └─────────────┘  └─────────────┘  └─────────────┘              │   │
│  │                                                                       │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                           │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Core Architectural Principles

### 1. Layered Isolation

Each layer in the VIVIM architecture is designed to be independent and replaceable:

- **Presentation Layer**: Web (PWA), Client (SDK), Tools (MCP)
- **API Layer**: Unified REST/WebSocket/MCP interface
- **Service Layer**: Business logic orchestration
- **Intelligence Layer**: Context assembly and memory processing
- **Storage Layer**: Pluggable storage backends
- **Identity Layer**: Self-sovereign identity primitives
- **Network Layer**: P2P and federation protocols

### 2. Provider Agnosticism

The entire stack is designed to work with any AI provider:

```
┌─────────────────────────────────────────────┐
│         Provider Abstraction                │
├─────────────────────────────────────────────┤
│                                              │
│  ┌────────┐  ┌────────┐  ┌────────┐       │
│  │ OpenAI │  │ Claude │  │ Gemini │       │
│  │   GPT  │  │   claude │  │  gemini │       │
│  └────┬───┘  └────┬───┘  └────┬───┘       │
│       │            │            │            │
│       └────────────┼────────────┘            │
│                    ▼                         │
│           ┌──────────────┐                  │
│           │   Unified    │                  │
│           │   Context    │                  │
│           │   Service    │                  │
│           └──────────────┘                  │
│                    │                         │
│                    ▼                         │
│           ┌──────────────┐                  │
│           │    Context   │                  │
│           │    Engine    │                  │
│           └──────────────┘                  │
│                                              │
└─────────────────────────────────────────────┘
```

### 3. ACU as the Canonical Unit

Every piece of memory in VIVIM is represented as an **Atomic Chat Unit (ACU)** — the fundamental, individually addressable unit of AI memory. This design enables:

- Fine-grained retrieval and search
- Independent classification and decay
- Graph-based relationship mapping
- Portable export in open formats

---

## Data Flow Architecture

### Ingestion Flow

```
User Message
     │
     ▼
┌─────────────────────────────┐
│   Provider API Adapter      │
│  (OpenAI/Claude/Gemini/    │
│   Ollama/Local)            │
└─────────────┬───────────────┘
              │
              ▼
┌─────────────────────────────┐
│   Message Normalization     │
│  (Convert to ACU format)   │
└─────────────┬───────────────┘
              │
              ▼
┌─────────────────────────────┐
│   Memory Extraction Engine  │
│  (Segment into ACUs)       │
└─────────────┬───────────────┘
              │
     ┌────────┴────────┐
     ▼                 ▼
┌─────────────┐  ┌─────────────┐
│  Classifier │  │   Embedder  │
│ (9 types)   │  │  (Vectors)  │
└──────┬──────┘  └──────┬──────┘
       │                 │
       └────────┬────────┘
                ▼
┌─────────────────────────────┐
│     ACU Store              │
│  (SQLite/IPFS/S3)         │
└─────────────────────────────┘
```

### Retrieval Flow

```
User Query
     │
     ▼
┌─────────────────────────────┐
│   Query Understanding       │
│  (Parse intent + entities)  │
└─────────────┬───────────────┘
              │
              ▼
┌─────────────────────────────┐
│   Hybrid Retrieval         │
│  (Vector + Keyword)        │
└─────────────┬───────────────┘
              │
              ▼
┌─────────────────────────────┐
│   Context Budget Algorithm │
│  (Token allocation)        │
└─────────────┬───────────────┘
              │
              ▼
┌─────────────────────────────┐
│   8-Layer Assembly         │
│  (L0-L7 context stack)     │
└─────────────┬───────────────┘
              │
              ▼
┌─────────────────────────────┐
│   Context Bundle           │
│  (Compiled for provider)  │
└─────────────┬───────────────┘
              │
              ▼
┌─────────────────────────────┐
│   Provider API Call        │
│  (With context attached)   │
└─────────────────────────────┘
```

---

## Component Interactions

### Context Engine Pipeline

The context engine is the heart of VIVIM's intelligence. It orchestrates the flow from user query to assembled context:

```
┌─────────────────────────────────────────────────────────────────┐
│                    Context Engine Pipeline                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐  │
│  │    Query     │────▶│    Budget    │────▶│   Assemble   │  │
│  │  Input       │     │  Algorithm   │     │   (L0-L7)    │  │
│  └──────────────┘     └──────────────┘     └──────┬───────┘  │
│                                                        │          │
│  ┌──────────────┐     ┌──────────────┐               │          │
│  │   Retrieve   │◀────│   JIT        │◀──────────────┘          │
│  │   (Hybrid)   │     │   Search     │                          │
│  └──────────────┘     └──────────────┘                          │
│                                                                  │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐  │
│  │   Predict    │────▶│   Prefetch    │────▶│    Cache     │  │
│  │   (What next)│     │  (Warm up)    │     │   (Store)    │  │
│  └──────────────┘     └──────────────┘     └──────────────┘  │
│                                                                  │
│  ┌──────────────┐     ┌──────────────┐                          │
│  │   Thermos    │────▶│   Decay/     │                          │
│  │  (Dynamics)  │     │   Promote     │                          │
│  └──────────────┘     └──────────────┘                          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Identity & Authentication Flow

```
┌─────────────────────────────────────────────────────────────────┐
│              Identity & Authentication Flow                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐                                               │
│  │    User      │                                               │
│  │  Registration│                                               │
│  └──────┬───────┘                                               │
│         │                                                        │
│         ▼                                                        │
│  ┌──────────────┐     ┌──────────────┐                         │
│  │ Generate DID │────▶│ Derive Keys  │                         │
│  │  (W3C)       │     │ (Zero-Know)  │                         │
│  └──────────────┘     └──────┬───────┘                         │
│                                │                                  │
│                                ▼                                  │
│  ┌──────────────┐     ┌──────────────┐                         │
│  │   Encrypt   │────▶│  Store ACU   │                         │
│  │  (AES-256)  │     │   Locally    │                         │
│  └──────────────┘     └──────────────┘                         │
│                                                                  │
│  ┌──────────────┐     ┌──────────────┐                         │
│  │  Export      │────▶│   Verify     │                         │
│  │  (JSON/SQL) │     │  (Did:VIVIM) │                         │
│  └──────────────┘     └──────────────┘                         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Storage Architecture

### Multi-Backend Support

VIVIM supports multiple storage backends, allowing users to choose their preferred level of centralization:

| Backend | Use Case | Decentralization |
|---------|----------|------------------|
| **SQLite** | Self-hosted, embedded | High |
| **IPFS** | Decentralized, verifiable | Highest |
| **S3-compatible** | Cloud self-hosting | Medium |
| **Local Filesystem** | Development, air-gapped | N/A |

### Storage V2 Architecture

The Storage V2 system implements:

- **DAG Engine**: Content-addressed storage with directed acyclic graph structure
- **Merkle Trees**: Cryptographic verification of data integrity
- **Secure Storage**: Encryption at rest with user-controlled keys
- **Object Store**: Unified interface across all backends

---

## Network Architecture

### P2P Mesh

VIVIM's network layer uses libp2p to create a decentralized peer-to-peer mesh:

```
┌─────────────────────────────────────────────────────────────┐
│                    P2P Network Mesh                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│        ┌────────┐                                         │
│        │ Node A │◀────────┐                                │
│        └────────┘         │                                │
│            │              │         ┌────────┐             │
│            │         ┌────▼────┐    │ Node D │             │
│        ┌───▼───┐    │ Node B  │────┘────────┘             │
│        │Node C │    └────────┘         │                  │
│        └───────┘         │              │                  │
│            │             │         ┌────▼────┐             │
│            └─────────────┴────────▶│ Node E  │             │
│                                     └─────────┘             │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │           DHT (Distributed Hash Table)              │    │
│  │   Peer Discovery / Content Routing                  │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │        CRDT Sync (Conflict-free Replicated Data)   │    │
│  │        State synchronization across peers           │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Federation

VIVIM supports ActivityPub-based federation, allowing independent VIVIM instances to interoperate:

- **Instance Discovery**: Find other VIVIM instances on the network
- **Content Federation**: Share memories across instances
- **Identity Federation**: Cross-instance authentication

---

## Security Architecture

### Zero-Knowledge Design

A fundamental principle of VIVIM's architecture is that the server never sees plaintext user data:

```
┌─────────────────────────────────────────────────────────────────┐
│              Zero-Knowledge Architecture                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────┐          ┌─────────────────┐              │
│  │   Client       │          │    Server       │              │
│  │  (Browser/SDK)│          │   (VIVIM Host)  │              │
│  └───────┬────────┘          └────────┬────────┘              │
│          │                             │                        │
│          │  1. Generate keys           │                        │
│          │◀────────────────────────────│                        │
│          │                             │                        │
│          │  2. Derive encryption key  │                        │
│          │  (Argon2, never sent)       │                        │
│          │                             │                        │
│          │  3. Encrypt data           │                        │
│          │  (AES-256-GCM)             │                        │
│          │────────────────────────────▶│                        │
│          │                             │                        │
│          │     Encrypted Data Only     │                        │
│          │                             │                        │
│          │  4. Request data            │                        │
│          │◀────────────────────────────│                        │
│          │                             │                        │
│          │  5. Decrypt locally         │                        │
│          │  (Key never left device)    │                        │
│          │                             │                        │
│  ┌───────┴────────┐          ┌────────┴────────┐              │
│  │ Keys: Local   │          │ Keys: Never Seen│              │
│  │ Device Only   │          │ Encrypted Blob  │              │
│  └───────────────┘          └─────────────────┘              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## API Architecture

### Unified Interface

VIVIM exposes a unified API that supports multiple protocols:

| Protocol | Use Case | Transport |
|----------|----------|----------|
| **REST** | Standard web API | HTTP |
| **WebSocket** | Real-time updates | WS |
| **MCP** | AI tool integration | STDIO/HTTP/WS |

### Endpoint Structure

```
/api/v1/
├── /auth              # Authentication & identity
├── /memory            # ACU operations
├── /context           # Context assembly
├── /conversations     # Conversation management
├── /sync              # P2P sync operations
├── /federation        # Cross-instance operations
└── /admin             # Management endpoints
```

---

## Summary

The VIVIM architecture is designed around four core principles:

1. **Layered Isolation**: Each layer is independent and replaceable
2. **Provider Agnosticism**: Works with any AI provider
3. **ACU as Canonical Unit**: Every piece of memory is individually addressable
4. **Zero-Knowledge**: Server never sees plaintext user data

This architecture enables VIVIM to deliver on its sovereignty promise while maintaining the flexibility to serve individual developers, small teams, and enterprise organizations.

---

*Document version: 1.0*
*Purpose: High-level system architecture for the VIVIM Open Core*
*Last updated: March 2026*
