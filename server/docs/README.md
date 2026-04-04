# VIVIM Core Services Documentation

This directory contains comprehensive technical documentation for the VIVIM Core Services - a model-agnostic system for managing AI context, memory, and storage.

## Documentation Structure

```
docs/
├── PRODUCT.md              # Product overview, features, pricing
├── CORE-SERVICES.md        # Main overview and integration guide
├── CONTEXT-ENGINE.md       # Dynamic Context Engine deep dive
├── MEMORY-ENGINE.md        # Memory Engine (Second Brain) deep dive
├── STORAGE.md              # Storage Layer (Prisma/PostgreSQL) deep dive
├── API-REFERENCE.md        # API endpoints and interfaces
├── APPENDIX-DESIGN.md     # Design philosophy for non-technical audiences
├── USER-FEATURES.md       # User-facing features & control panel guide
├── ATOMIC-CHAT-UNITS.md   # ACUs - the core innovation enabling persistent context
├── SDK.md                 # VIVIM SDK - full developer guide and API reference
└── README.md               # This file
```

## Quick Links

- **[Product Overview](./PRODUCT.md)** - Product features, pricing, and roadmap
- **[Core Services](./CORE-SERVICES.md)** - Main documentation with architecture, features, and integration guide
- **[Context Engine](./CONTEXT-ENGINE.md)** - Technical details on the dynamic context assembly system (8 layers)
- **[Memory Engine](./MEMORY-ENGINE.md)** - Memory types, extraction, retrieval, and consolidation
- **[Storage](./STORAGE.md)** - Database schema, vector search, and performance tuning
- **[API Reference](./API-REFERENCE.md)** - Complete API endpoints and TypeScript interfaces
- **[Atomic Chat Units](./ATOMIC-CHAT-UNITS.md)** - The core innovation powering persistent multi-scenario context
- **[SDK Documentation](./SDK.md)** - Complete developer guide for building with the VIVIM SDK

## Product Overview

### What is VIVIM?

VIVIM is the intelligent memory layer for AI applications. It provides:

- **Dynamic Context Engine**: 8-layer context system that intelligently assembles the perfect context for every AI interaction
- **Memory Engine**: A "Second Brain" system with 9 memory types and semantic search
- **Storage Layer**: Enterprise-grade PostgreSQL storage with vector search capabilities

### Product Tiers

| Tier           | Target                 | Deployment      | Price       |
| -------------- | ---------------------- | --------------- | ----------- |
| **Community**  | Individual developers  | Self-hosted     | Free (AGPL) |
| **Team**       | Small teams (up to 50) | Cloud           | $49/mo      |
| **Enterprise** | Large organizations    | Cloud/Dedicated | Custom      |

## Core Concepts

### 1. Dynamic Context Engine

The system that intelligently assembles context prompts from 8 layers:

- L0: Identity Core
- L1: Global Preferences
- L2: Topic Context
- L3: Entity Context
- L4: Conversation Arc
- L5: JIT Knowledge
- L6: Message History
- L7: User Message

### 2. Memory Engine

A "Second Brain" system for persistent memory:

- 9 memory types (episodic, semantic, procedural, factual, preference, identity, relationship, goal, project)
- Automatic extraction from conversations
- Semantic search with vector embeddings
- Conflict detection and consolidation

### 3. Storage Layer

PostgreSQL with Prisma ORM:

- Vector storage (pgvector) for semantic search
- Comprehensive data models
- Encryption at rest
- Performance-optimized indexes

## Getting Started

### Quick Start (Self-Hosted)

```bash
# Clone the repository
git clone https://github.com/vivim-inc/vivim.git

# Install dependencies
npm install

# Set up PostgreSQL with pgvector
docker run -d -e POSTGRES_PASSWORD=secret \
  -v pgdata:/var/lib/postgresql/data \
  postgres:15

# Configure environment
cp .env.example .env

# Run migrations
npx prisma migrate dev

# Start the server
npm run dev
```

### Using VIVIM in Your App

```javascript
import { VIVIM } from '@vivim/core';

const vivim = new VIVIM({
  databaseUrl: process.env.DATABASE_URL,
  embeddingProvider: 'openai',
  llmProvider: 'anthropic',
});

// Start a session
const session = await vivim.createSession({
  userId: 'user-123',
});

// Chat with memory
const response = await session.chat({
  message: 'Help me with my Python project',
  model: 'claude-3-opus',
});
```

## Requirements

- Node.js 18+
- PostgreSQL 15+ with pgvector extension
- Prisma CLI

## Environment Variables

```env
DATABASE_URL=postgresql://user:pass@localhost:5432/vivim
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
```

## Key Features

| Feature                | Description                                                   |
| ---------------------- | ------------------------------------------------------------- |
| 8-Layer Context        | Intelligent context assembly from identity to current message |
| Memory Types           | 9 distinct memory types for organized knowledge               |
| Vector Search          | pgvector-powered semantic similarity                          |
| Model Agnostic         | Works with any LLM provider                                   |
| Adaptive Compression   | Auto-selects optimal compression strategy                     |
| Token Thermodynamics   | Physics-inspired budget optimization                          |
| Bundle Caching         | Pre-compiled contexts for instant response                    |
| Just-in-Time Retrieval | On-demand knowledge fetching                                  |

## Use Cases

- Personal AI Assistant
- Customer Support Bot
- Developer Copilot
- Educational Tutor
- Content Creation Assistant

## Roadmap

### Phase 1: Community Edition ✓ (Current)

- [x] Core context engine (8 layers)
- [x] Memory system with 9 memory types
- [x] PostgreSQL + pgvector storage
- [x] Model-agnostic architecture
- [x] Self-hosted deployment
- [x] Open source release

### Phase 2: Cloud Beta (Q2 2025)

- [ ] Managed cloud hosting
- [ ] Team workspaces
- [ ] Basic analytics
- [ ] Email support

### Phase 3: Enterprise (Q3 2025)

- [ ] Advanced admin controls
- [ ] Audit logging
- [ ] Compliance tools (SOC2, HIPAA)
- [ ] Custom integrations
- [ ] Priority support + SLA

## Community & Support

- **GitHub**: [github.com/vivim-inc/vivim](https://github.com/vivim-inc/vivim)
- **Discord**: [discord.gg/vivim](https://discord.gg/vivim)
- **Documentation**: [docs.vivim.ai](https://docs.vivim.ai)

## License

**Community Edition**: AGPL v3 (Open Source)

**Enterprise Edition**: Proprietary (Commercial license)

---

_VIVIM - Giving AI a memory that never forgets._
