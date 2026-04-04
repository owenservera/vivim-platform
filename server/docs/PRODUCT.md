# VIVIM Core Services

## The Intelligent Memory Layer for AI Applications

---

## Product Overview

**VIVIM Core Services** is a model-agnostic infrastructure layer that provides intelligent context management, persistent memory, and semantic storage for AI applications. Think of it as "giving your AI a brain that never forgets."

### The Problem We Solve

Current AI applications suffer from:

- **Memory Loss**: Each conversation starts fresh with no context
- **Generic Responses**: No personalization or user understanding
- **Token Waste**: Repetitive context in every request
- **Disconnected Data**: User knowledge scattered across platforms

### The VIVIM Solution

VIVIM provides a unified memory layer that:

- Remembers everything across conversations
- Intelligently retrieves relevant context
- Optimizes token usage automatically
- Works with any LLM provider

---

## Product Tiers

### 🆓 Community Edition (B2C Free Open Source)

**Current Version**

A fully functional, self-hosted solution for individual developers and enthusiasts.

**Features:**

- Full 8-layer context engine
- Complete memory system with semantic search
- PostgreSQL storage with vector support
- Model-agnostic integration (any LLM)
- Self-hosted deployment
- Community support via GitHub

**Target Users:**

- Individual developers
- Hobbyists and AI enthusiasts
- Open source contributors
- Researchers

**Repository:** [github.com/vivim-inc/vivim](https://github.com/vivim-inc/vivim)

---

### 🚀 Enterprise Edition (B2B - Coming Soon)

A managed cloud service for teams and organizations.

**Features:**

- Everything in Community Edition, plus:
- Cloud-hosted (no infrastructure management)
- Team workspaces & collaboration
- Admin controls & user management
- Audit logs & compliance tools
- Priority support
- SLA guarantees
- Custom integrations

**Target Users:**

- Startups building AI products
- Enterprises with AI initiatives
- Agencies building client solutions
- SaaS companies adding AI features

---

## Product Features

### 1. Dynamic Context Engine

**What it does:**
Automatically assembles the perfect context for every AI interaction from 8 contextual layers.

**User Benefit:**
Every AI response is informed by the user's history, preferences, and relevant knowledge - without manual prompt engineering.

**How users interact:**

- Configure layer budgets via settings API
- View assembled contexts in debug mode
- Exclude/include layers per use case
- Set compression strategies

**Key Capabilities:**

| Feature                | Description                                                             |
| ---------------------- | ----------------------------------------------------------------------- |
| 8-Layer Context        | L0-L7 layers from identity to current message                           |
| Adaptive Compression   | Auto-selects compression strategy (full/windowed/compacted/multi-level) |
| Token Thermodynamics   | Physics-inspired budget optimization                                    |
| Bundle Caching         | Pre-compiled contexts for instant response                              |
| Just-in-Time Retrieval | On-demand knowledge fetching                                            |
| Context Prediction     | Preemptively loads likely needed context                                |

---

### 2. Memory Engine (Second Brain)

**What it does:**
A sophisticated memory system that stores, organizes, and retrieves user knowledge with human-like memory types.

**User Benefit:**
Your AI remembers everything important - preferences, conversations, facts, skills - and retrieves exactly what's relevant.

**How users interact:**

- Create memories manually or automatically extract from conversations
- Search memories via semantic query
- Set importance levels (0-1 scale)
- Pin critical memories for always-include
- View memory analytics and statistics
- Resolve conflicts between contradictory memories

**Memory Types:**

| Type         | Use Case           | Example                                 |
| ------------ | ------------------ | --------------------------------------- |
| EPISODIC     | Specific events    | "Last week we discussed..."             |
| SEMANTIC     | Facts & knowledge  | "Python is the user's primary language" |
| PROCEDURAL   | Skills & workflows | "User prefers TDD methodology"          |
| FACTUAL      | User facts         | "User works as a senior engineer"       |
| PREFERENCE   | Likes/dislikes     | "Prefers dark mode IDE"                 |
| IDENTITY     | Self-concept       | "User is a full-stack developer"        |
| RELATIONSHIP | People info        | "John is the user's tech lead"          |
| GOAL         | Plans & intentions | "User wants to launch MVP by Q2"        |
| PROJECT      | Project knowledge  | "E-commerce platform uses Next.js"      |

---

### 3. Storage Layer

**What it does:**
Enterprise-grade data persistence with PostgreSQL and vector search capabilities.

**User Benefit:**
Reliable, searchable, and scalable storage for all user data with built-in encryption and performance optimization.

**How users interact:**

- Configure database connections
- Set up backup strategies
- Monitor storage metrics
- Manage data retention policies

**Key Capabilities:**

| Feature       | Description                              |
| ------------- | ---------------------------------------- |
| Vector Search | pgvector for semantic similarity         |
| Encryption    | AES-256 encryption at rest               |
| Caching       | In-memory cache with TTL                 |
| Indexing      | Optimized indexes for all query patterns |
| Migration     | Prisma ORM for schema management         |

---

### 4. Model Agnostic Architecture

**What it does:**
Works with any LLM provider - OpenAI, Anthropic, Google, Meta, local models, and more.

**User Benefit:**
You're never locked into one provider. Switch models without rewriting your application logic.

**Supported Integrations:**

- OpenAI (GPT-4, GPT-3.5)
- Anthropic (Claude 3, Claude 2)
- Google (Gemini)
- Meta (Llama)
- Local models (Ollama, LM Studio)
- Custom LLM endpoints

---

## User Interactions & Workflows

### For Individual Users (B2C)

#### Setting Up VIVIM

```bash
# 1. Clone the repository
git clone https://github.com/vivim-inc/vivim.git

# 2. Install dependencies
npm install

# 3. Set up PostgreSQL with pgvector
docker run -d -e POSTGRES_PASSWORD=secret \
  -v pgdata:/var/lib/postgresql/data \
  postgres:15

# 4. Configure environment
cp .env.example .env
# Edit DATABASE_URL, API keys

# 5. Run migrations
npx prisma migrate dev

# 6. Start the server
npm run dev
```

#### Using VIVIM in Your App

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

console.log(response.content);
// "I'd be happy to help! I remember you prefer using
//  pytest for testing. What specific aspect of your
//  Python project needs attention?"
```

#### Managing Memories

```javascript
// Create a memory manually
await session.memory.create({
  content: 'User is building an e-commerce platform with Next.js',
  type: 'PROJECT',
  importance: 0.9,
  tags: ['nextjs', 'ecommerce'],
});

// Search memories
const results = await session.memory.search({
  query: 'project preferences',
  types: ['PREFERENCE', 'PROJECT'],
  minImportance: 0.5,
});

// Get context for AI
const context = await session.getContext({
  maxTokens: 2000,
});
```

#### Configuring Context Layers

```javascript
// Customize layer budgets
await session.settings.update({
  maxContextTokens: 16000,
  layerBudgets: {
    L0_identity: { min: 200, ideal: 400, max: 600 },
    L1_global_prefs: { min: 100, ideal: 300, max: 500 },
    L2_topic: { min: 500, ideal: 1500, max: 2500 },
    // ... other layers
  },
});
```

---

### For Teams (B2B - Coming Soon)

#### Team Workspaces

```javascript
// Create a team workspace
const team = await vivim.teams.create({
  name: 'Engineering Team',
  members: ['user-1', 'user-2', 'user-3'],
  roles: {
    'user-1': 'admin',
    'user-2': 'developer',
    'user-3': 'analyst',
  },
});

// Shared knowledge base
const sharedMemory = await team.memory.create({
  content: 'Our API uses REST with JSON responses',
  type: 'PROCEDURAL',
  visibility: 'team',
});
```

#### Admin Controls

```javascript
// Team admin manages settings
await team.settings.update({
  maxTeamMembers: 50,
  dataRetentionDays: 365,
  auditLogging: true,
  complianceMode: 'gdpr',
});

// View analytics
const analytics = await team.analytics.get({
  period: '30d',
  metrics: ['memory_usage', 'api_calls', 'user_activity'],
});
```

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         YOUR APPLICATION                             │
│                  (Web App, Mobile, API, etc.)                       │
└─────────────────────────────────┬───────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        VIVIM SDK                                     │
│              (JavaScript, Python, Go, Rust clients)                 │
└─────────────────────────────────┬───────────────────────────────────┘
                                  │
        ┌─────────────────────────┼─────────────────────────┐
        ▼                         ▼                         ▼
┌───────────────┐         ┌───────────────┐         ┌───────────────┐
│    Context    │         │    Memory     │         │   Storage     │
│    Engine     │◄───────►│    Engine     │◄───────►│    Layer      │
│               │         │ (Second Brain)│         │(PostgreSQL)   │
└───────────────┘         └───────────────┘         └───────────────┘
        │                         │                         │
        │    ┌────────────────────┼────────────────────┐   │
        ▼    ▼                    ▼                    ▼   ▼
   ┌─────────────────────────────────────────────────────────────┐
   │                    LAYERS (L0-L7)                           │
   │  ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐│
   │  │ L0 │ │ L1 │ │ L2 │ │ L3 │ │ L4 │ │ L5 │ │ L6 │ │ L7 ││
   │  │Idnt│ │Pref│ │Tpc │ │Ent │ │Arc │ │JIT │ │Msg │ │Usr ││
   │  └────┘ └────┘ └────┘ └────┘ └────┘ └────┘ └────┘ └────┘│
   └─────────────────────────────────────────────────────────────┘
        │                         │                         │
        └─────────────────────────┼─────────────────────────┘
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     ANY LLM PROVIDER                                │
│            OpenAI │ Anthropic │ Google │ Meta │ Local              │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Use Cases

### Personal AI Assistant

- Remember user preferences across all conversations
- Understand user's skill level and adapt explanations
- Know user's projects and their current state

### Customer Support Bot

- Recall previous support interactions
- Understand customer's product usage
- Maintain conversation context across sessions

### Developer Copilot

- Remember user's coding preferences
- Know the codebase and project structure
- Understand user's testing methodology

### Educational Tutor

- Track student's learning progress
- Remember concepts already covered
- Adapt to student's knowledge level

### Content Creation Assistant

- Know user's brand voice and style
- Remember previous content created
- Understand target audience preferences

---

## Getting Started

### Quick Start (Self-Hosted)

```bash
# Using Docker
docker run -d -p 3000:3000 \
  -e DATABASE_URL=postgres://user:pass@host:5432/vivim \
  -e OPENAI_API_KEY=sk-... \
  vivim/core:latest
```

### Cloud Beta (Coming Soon)

```bash
# Managed cloud service
npm install @vivim/cloud

const vivim = new VIVIM.Cloud({
  apiKey: 'vivim_sk_...',
  teamId: 'team_...'
});
```

---

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

### Phase 4: Platform (Q4 2025)

- [ ] Marketplace for memory plugins
- [ ] Multi-tenant architecture
- [ ] Advanced ML-powered insights
- [ ] White-label options

---

## Pricing (B2B)

| Feature       | Community   | Team ($49/mo) | Enterprise (Custom) |
| ------------- | ----------- | ------------- | ------------------- |
| Users         | 1           | Up to 50      | Unlimited           |
| API Calls     | Unlimited   | 100K/mo       | Unlimited           |
| Storage       | Self-hosted | 10GB          | Unlimited           |
| Support       | Community   | Email         | Dedicated CSM       |
| Hosting       | Self        | Cloud         | Cloud + Dedicated   |
| SLA           | -           | 99.5%         | 99.99%              |
| Audit Logs    | -           | ✓             | ✓                   |
| SSO/SAML      | -           | -             | ✓                   |
| Custom Models | -           | -             | ✓                   |

---

## Community & Support

- **GitHub**: [github.com/vivim-inc/vivim](https://github.com/vivim-inc/vivim)
- **Discord**: [discord.gg/vivim](https://discord.gg/vivim)
- **Documentation**: [docs.vivim.ai](https://docs.vivim.ai)
- **Blog**: [blog.vivim.ai](https://blog.vivim.ai)

---

## License

**Community Edition**: AGPL v3 (Open Source)

**Enterprise Edition**: Proprietary (Commercial license)

---

_VIVIM - Giving AI a memory that never forgets._
