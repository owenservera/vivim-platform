# VIVIM Open Core — Components Overview

## The Component Landscape

VIVIM comprises 180+ open-source components organized into functional domains. This document provides a conceptual map of what each domain does — not where the code lives.

---

## The Context Engine

The heart of VIVIM. It decides what memory to include for every single message.

### What It Does

When you send a message to an AI, the context engine assembles the right context window from your stored memories. It doesn't dump everything — it precisely budgets tokens across 8 layers to maximize relevance.

### The 8 Layers (L0-L7)

| Layer | Purpose | What It Holds |
|-------|---------|----------------|
| **L7** | Live Input | Your current message |
| **L6** | Message History | Recent conversation turns |
| **L5** | JIT Retrieval | Memories specifically relevant to this query |
| **L4** | Conversation Arc | Long-term thread understanding |
| **L3** | Entity Context | People, projects, technologies active now |
| **L2** | Topic Context | Subject matter domain |
| **L1** | Global Preferences | Your communication style |
| **L0** | Identity Core | Who you are (DID, profile) |

### Key Subsystems

**ACU Extraction**
Turns raw conversation into atomic memory units — individually addressable, classified, and searchable.

**Memory Classification**
Every memory gets typed into one of 9 categories: Episodic, Semantic, Procedural, Factual, Preference, Identity, Relationship, Goal, Project.

**Hybrid Retrieval**
Combines vector similarity search with keyword matching to find exactly what's relevant.

**Prediction Engine**
Anticipates what context you'll need next and pre-fetches it.

**Thermodynamics**
Memories decay, strengthen, and get promoted between layers over time — like biological memory.

---

## The SDK

The developer toolkit for building with VIVIM.

### What It Provides

- **Context Engine** — Programmatic access to memory assembly
- **MCP Server** — Exposes VIVIM as tools for Claude Desktop, Cursor, etc.
- **CLI** — Import/export commands
- **Identity Primitives** — DID creation, key management

### Integration Points

- LangChain / LlamaIndex adapters
- n8n / Make / Zapier connectors
- Browser extension SDK
- Obsidian / Notion / Logseq plugins

---

## Identity & Sovereignty

The systems that make the data truly yours.

### Decentralized Identifiers (DID)

W3C-compliant identifiers that you control. Not an account — a cryptographic identity you own.

### Zero-Knowledge Architecture

Encryption keys never leave your device. The server only ever sees encrypted data. We literally cannot read your memories.

### Memory Export

Your data in your format: JSON, SQLite, or IPFS. Portable. Readable. Yours.

---

## The Network Layer

Decentralization infrastructure.

### P2P Mesh

Run VIVIM without any central server. Connect directly to other nodes.

### CRDT Sync

Conflict-free data synchronization across all your devices. No merge conflicts. No data loss.

### ActivityPub Federation

Connect with other VIVIM instances. Share memories across the federated network.

---

## The PWA

The user-facing interface.

### Key Interfaces

- **Conversation View** — Chat with memory
- **Knowledge Graph** — Visualize memory relationships
- **Context Cockpit** — See what context assembled for each message
- **Sovereignty Dashboard** — Manage identity, export data

---

## Summary by Repository

| Repository | Components | What It Powers |
|------------|------------|----------------|
| **vivim-server** | Context Engine, ACU Processing, Retrieval, Prediction | AI memory intelligence |
| **vivim-sdk** | MCP Server, CLI, Identity, SDK Nodes | Developer integration |
| **vivim-network** | P2P, CRDT, ActivityPub, Federation | Decentralization |
| **vivim-pwa** | UI Components, Visualization, Admin | User experience |

---

## The Boundary

All 180+ components above the line are permanently open. Below the line is where we earn revenue:

**Above (Open):** Every algorithm, every protocol, every storage mechanism, every identity primitive

**Below (Commercial):** Running it for you — uptime SLAs, compliance certifications, enterprise support

---

*Document version: 1.0*
*Purpose: Conceptual overview of VIVIM's component landscape*
*Last updated: March 2026*
