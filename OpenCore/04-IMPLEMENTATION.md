# VIVIM Open Core — Implementation Guide

## The Four Repositories

The VIVIM Open Core spans four specialized repositories, each handling a distinct part of the system:

| Repository | Domain | What It Provides |
|------------|--------|-----------------|
| **vivim-sdk** | Developer Toolkit | TypeScript SDK, MCP Server, CLI tools |
| **vivim-server** | Backend | Context Engine, ACU processing, REST API |
| **vivim-pwa** | Frontend | Progressive Web App, Admin Panel |
| **vivim-network** | Infrastructure | P2P mesh, CRDT sync, ActivityPub federation |

---

## Repository Relationships

```
                    ┌─────────────────────────────────────────────┐
                    │              vivim-pwa                     │
                    │         (Frontend / Admin UI)             │
                    └────────────────────┬──────────────────────┘
                                         │ HTTP/WebSocket
                    ┌────────────────────┴──────────────────────┐
                    │              vivim-server                 │
                    │     (Context Engine / ACU Processing)      │
                    └────────────────────┬──────────────────────┘
                                         │
           ┌─────────────────────────────┼─────────────────────────────┐
           │                             │                             │
           ▼                             ▼                             ▼
┌─────────────────────┐     ┌─────────────────────┐     ┌─────────────────────┐
│      vivim-sdk      │     │    vivim-network    │     │   External AI      │
│  (Developer Tools)  │     │   (P2P / Sync)     │     │   Providers        │
└─────────────────────┘     └─────────────────────┘     └─────────────────────┘
```

---

## What Each Repository Powers

### vivim-sdk — The Developer Interface

The SDK is how developers interact with VIVIM. It provides:

- **Context Engine** — Programmatic access to 8-layer context assembly
- **MCP Server** — Integration with Claude Desktop, Cursor, and other MCP clients
- **CLI Tools** — Import/export commands for data portability
- **Identity Primitives** — DID creation, key management, memory export

### vivim-server — The Intelligence Layer

The server handles all AI memory processing:

- **ACU Pipeline** — Converts conversations into atomic, addressable memory units
- **8-Layer Context Assembly** — Builds the context window for every message
- **Hybrid Retrieval** — Vector + keyword search for JIT memory
- **Prediction Engine** — Anticipates what context you'll need next
- **Thermodynamics** — Memory decay, reinforcement, and promotion between layers

### vivim-pwa — The User Interface

The PWA provides the user-facing experience:

- **Conversation Interface** — Chat UI with memory visualization
- **Knowledge Graph** — Visual representation of memory relationships
- **Context Cockpit** — Real-time view of assembled context
- **Admin Panel** — System monitoring, logs, network status
- **Sovereignty Tools** — Trust seals, identity management, export

### vivim-network — The Decentralization Layer

The network enables sovereign, peer-to-peer operation:

- **P2P Mesh** — Direct peer connections without central servers
- **CRDT Sync** — Conflict-free data synchronization across devices
- **ActivityPub** — Federation with other VIVIM instances
- **Instance Discovery** — Finding other nodes on the network

---

## The Data Flow

```
┌────────────────────────────────────────────────────────────────────┐
│                         USER INTERACTION                             │
│  User sends message through PWA                                     │
└────────────────────────────────┬───────────────────────────────────┘
                                 │
                                 ▼
┌────────────────────────────────────────────────────────────────────┐
│                         vivim-server                                │
│                                                                       │
│  1. Query Understanding — What is the user asking?                 │
│  2. JIT Retrieval — What memories are relevant?                    │
│  3. Context Assembly — Build the 8-layer context window           │
│  4. Provider Call — Send to OpenAI/Claude/Gemini with context     │
│  5. Memory Extraction — Extract ACUs from the response            │
│  6. Classification — Assign memory types (9 types)                │
│  7. Storage — Store in SQLite/IPFS/S3                              │
│                                                                       │
└────────────────────────────────┬───────────────────────────────────┘
                                 │
                                 ▼
┌────────────────────────────────────────────────────────────────────┐
│                         vivim-network                               │
│                                                                       │
│  • Sync ACUs to other devices via CRDT                             │
│  • Federate with other VIVIM instances                              │
│  • Maintain peer connections for P2P operation                      │
└────────────────────────────────────────────────────────────────────┘
```

---

## Key Capabilities by Repository

### What vivim-sdk Gives Developers

- Build custom AI applications with VIVIM memory
- Integrate VIVIM into existing products via MCP
- Import data from any AI provider
- Export memory in portable formats (JSON, SQLite, IPFS)

### What vivim-server Provides

- The most sophisticated open-source context engine
- 8-layer memory assembly with token budgeting
- ACU extraction and classification
- Semantic and keyword hybrid search

### What vivim-pwa Offers Users

- Beautiful, functional interface for managing AI memory
- Visual exploration of knowledge graphs
- Real-time context visualization
- Full sovereignty over their data

### What vivim-network Enables

- Run VIVIM without any central infrastructure
- Sync across unlimited devices
- Connect with other VIVIM users
- Participate in the federated network

---

## The Open Core Boundary

Everything in these four repositories is open source under AGPL v3. The commercial layer adds:

- **Managed Hosting** — We run it so you don't have to
- **Compliance** — SOC 2, HIPAA, audit logs
- **Enterprise Features** — SSO, RBAC, shared workspaces
- **Support** — SLA-backed assistance

---

*Document version: 1.0*
*Purpose: Conceptual guide to VIVIM's repository structure*
*Last updated: March 2026*
