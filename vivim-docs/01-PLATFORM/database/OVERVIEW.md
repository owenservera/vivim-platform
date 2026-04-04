# VIVIM Database Architecture: Overview

The VIVIM database is the backbone of the OpenScroll knowledge ecosystem. It is designed to move beyond simple chat history, transforming transient AI interactions into a durable, structured, and searchable knowledge graph.

## 1. Technology Stack

- **Engine:** PostgreSQL
- **ORM:** Prisma 7 (using `@prisma/adapter-pg`)
- **Runtime:** Bun
- **Strategy:** Hybrid Storage (Relational for metadata, JSONB for content parts, and Vector-ready for semantic search).

## 2. Core Architectural Pillars

### 2.1 Conversations & Messages (Source Layer)
Captures raw data from providers (ChatGPT, Claude, Gemini, etc.) exactly as it appeared. 
- **Conversations:** Metadata, provider info, and comprehensive statistics.
- **Messages:** Sequential dialogue blocks with multi-part content support (text, code, tables).

### 2.2 Atomic Chat Units (ACU Layer)
The "Knowledge Nugget" layer. Decomposes large conversations into standalone, content-addressed units.
- **ACUs:** Single insights, snippets, or answers.
- **Scoring:** Built-in quality, richness, and integrity metrics.
- **Hashing:** SHA3-256 content addressing for P2P deduplication.

### 2.3 Knowledge Graph (Relationship Layer)
Maps the "connective tissue" between different pieces of information.
- **ACU Links:** Defines semantic relations (Explains, Answers, Similar To).

### 2.4 P2P Identity & Sharing (Network Layer)
Future-proof infrastructure for decentralization.
- **Users & Devices:** DID-based identity management.
- **Circles:** Cryptographically secure sharing groups.
- **Reciprocity:** Tracking contributions and consumptions across the network.

---
*Next: See [SCHEMA_PRISMA.md](./SCHEMA_PRISMA.md) for the raw technical definition.*
