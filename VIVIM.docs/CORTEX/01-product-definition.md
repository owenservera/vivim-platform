# VIVIM Cortex — Product Definition

> **Your AI Memory, Everywhere.**
> The world's first sovereign, portable, multi-provider memory and intelligent context engine.

---

## 1. The Problem

Every AI interaction today is **ephemeral and siloed**.

| Pain Point | Who Suffers | Scale |
|---|---|---|
| Switch from ChatGPT to Claude → lose all context | Individuals | 500M+ AI users globally |
| Company knowledge scattered across 5+ AI tools | Teams / SMBs | 80% of orgs use 2+ AI providers |
| Institutional expertise walks out the door with employees | Enterprises | $31B/yr knowledge loss |
| AI assistants re-learn the same user preferences daily | Everyone | Billions of wasted tokens/year |
| Users have zero ownership over their AI-generated insights | Everyone | 100% vendor lock-in |

**The core insight**: AI memory should not belong to the provider. It should belong to the user — portable, encrypted, intelligent, and sovereign.

---

## 2. The Product: VIVIM Cortex

VIVIM Cortex is a **persistent intelligence layer** that sits between users and *any* AI provider. It continuously learns from every AI interaction, builds a structured knowledge graph of the user's expertise, preferences, and work context, and injects the most relevant memories back into future conversations — regardless of which AI model or provider is being used.

### One-Liner
> "Cortex makes every AI you use smarter about *you*, permanently."

### How It Works (User Perspective)
1. **Connect** your AI providers (ChatGPT, Claude, Gemini, local models, etc.)
2. **Import** your existing chat history (thousands of conversations, instantly)
3. **Cortex learns** — automatically extracting facts, preferences, decisions, and expertise
4. **Every future AI interaction** is enriched with your personal context
5. **Switch providers freely** — your intelligence travels with you

---

## 3. Technical Foundation (Already Built)

VIVIM Cortex is powered by production-grade subsystems already implemented in the VIVIM codebase:

### 3.1 Memory Extraction Engine
- **LLM-powered auto-extraction** from conversations (`MemoryExtractionEngine`)
- Categorizes memories by type: `EPISODIC`, `SEMANTIC`, `PROCEDURAL`, `BIOGRAPHICAL`
- Confidence scoring with configurable thresholds
- Background job queue for async batch processing (`MemoryExtractionJob`)
- Auto-pins critical memories (importance ≥ 0.9)

### 3.2 Dynamic Context Pipeline
- **6-layer token-budgeted context assembly**:
  - L0: Identity Core (who is the user)
  - L1: Global Preferences (how they like to interact)
  - L2: Topic Profiles (what subjects they know)
  - L3: Entity Profiles (people, projects, tools they reference)
  - L4: Conversation Arc (compressed history)
  - L6: Active Messages (current thread)
- Each layer has `minTokens`, `idealTokens`, `maxTokens`, `elasticity`
- Adaptive allocation algorithm resolves budget conflicts in real-time

### 3.3 Progressive Conversation Compaction
- 4-tier compression strategy: Full → Windowed → Compacted → Multi-Level
- LLM-generated summaries cached in Postgres for zero-cost re-use
- Message importance scoring (code blocks, decisions, errors weighted higher)
- Supports infinite conversation history within fixed token windows

### 3.4 Sovereign Architecture
- **Per-user database isolation** — each user's intelligence is cryptographically separated
- **Ed25519 DID identity** — no email/password, pure cryptographic ownership
- **Local-first** with optional encrypted P2P sync via CRDTs (Yjs)
- **SovereignPermissionsNode** — granular delegation of memory access to agents/apps

### 3.5 Provider Import Pipeline
- **ChatVault Archiver**: Bulk import from ChatGPT, Claude, Gemini export files
- **ChatLink Nexus**: Real-time shared chat link ingestion
- **MCP Bridge**: Tool-use interoperability across AI systems

---

## 4. Product Tiers

### 4.1 Cortex Free (Open Source Core)
**Target**: Individual AI power users
- Local-only memory engine (SQLite + pgvector)
- Single-provider import (ChatGPT export)
- Up to 10,000 memories
- Basic context assembly (3 layers)
- CLI + browser extension
- **Price**: $0 (MIT licensed core)

### 4.2 Cortex Pro
**Target**: Professionals, creators, developers
- Multi-provider import & real-time sync (ChatGPT, Claude, Gemini, Ollama)
- Unlimited memories with intelligent consolidation
- Full 6-layer dynamic context pipeline
- Multi-device encrypted sync (P2P, no central server)
- Memory analytics dashboard
- Priority extraction (faster background processing)
- Custom memory categories and tagging
- **Price**: $15/month or $144/year

### 4.3 Cortex Team
**Target**: Teams & SMBs (5–100 seats)
- Everything in Pro
- **Shared organizational memory** — team knowledge graph
- Role-based memory access (via SovereignPermissions)
- Onboarding acceleration (new hires inherit team context)
- Admin dashboard with usage analytics
- SSO integration (Google Workspace, Microsoft 365)
- Compliance audit trail
- **Price**: $29/seat/month

### 4.4 Cortex Enterprise
**Target**: Organizations (100+ seats)
- Everything in Team
- Self-hosted / VPC deployment option
- SAML/SCIM provisioning
- Custom retention & data residency policies
- Dedicated support & SLA
- Custom integrations & API access
- Institutional knowledge graph with executive dashboards
- **Price**: Custom (starting $15K/year)

### 4.5 Cortex API (Developer Platform)
**Target**: AI app builders, SaaS companies
- Embed Cortex memory & context engine into any product
- Full `@vivim/sdk` with commercial license
- MCP server for agent tool integration
- Webhooks for memory events
- White-label option
- **Price**: Usage-based ($0.001 per context assembly, first 10K free/month)

---

## 5. Competitive Landscape

| Feature | VIVIM Cortex | Mem0 | Personal AI | Rewind | Notion AI |
|---|---|---|---|---|---|
| Multi-provider memory | ✅ | ❌ (single) | ❌ | ❌ | ❌ |
| User owns data | ✅ (local-first) | ❌ (cloud) | ❌ (cloud) | ⚠️ (local) | ❌ (cloud) |
| Token-budgeted context | ✅ (6-layer) | ❌ (basic RAG) | ❌ | ❌ | ❌ |
| Progressive compaction | ✅ (4-tier) | ❌ | ❌ | ❌ | ❌ |
| Import existing history | ✅ (bulk + link) | ❌ | ❌ | ❌ | ❌ |
| Open source core | ✅ | ✅ | ❌ | ❌ | ❌ |
| On-chain identity | ✅ (DID) | ❌ | ❌ | ❌ | ❌ |
| Team/Org shared memory | ✅ | ❌ | ❌ | ❌ | ⚠️ |
| P2P sync (no server) | ✅ (CRDTs) | ❌ | ❌ | ❌ | ❌ |
| Embeddable SDK | ✅ | ✅ | ❌ | ❌ | ❌ |

### Unique Moat
1. **Sovereign-first**: No central server ever sees user data. Cryptographic proof of ownership.
2. **Production-grade context engine**: Not just retrieval — a full 6-layer, token-economic, LLM-compacted pipeline.
3. **Network effects**: Shared team memory creates organizational lock-in (positive).
4. **Protocol-level interop**: ActivityPub + MCP + CRDT sync = works with everything.

---

## 6. Go-To-Market Strategy

### Phase 1: Developer Adoption (Months 1–6)
- Open-source the core memory engine + SDK under MIT
- Launch on Product Hunt, Hacker News, GitHub trending
- Publish "escape your AI silo" narrative content
- Build browser extension for Chrome/Firefox (intercepts AI chats)
- Developer documentation + example integrations
- **Target**: 5,000 GitHub stars, 500 active developers

### Phase 2: Consumer Product (Months 4–9)
- Launch Cortex Pro with polished PWA
- ChatGPT/Claude import wizard (one-click)
- Memory visualization dashboard (knowledge graph view)
- Referral system (invite = 1 month free Pro)
- Influencer partnerships with AI power users
- **Target**: 10,000 Pro users, $150K MRR

### Phase 3: Team & Enterprise (Months 8–14)
- Launch Cortex Team with shared org memory
- Enterprise pilot programs (3 marquee logos)
- SOC 2 Type II certification
- Salesforce/HubSpot integration for sales teams
- Case studies: "How Team X reduced AI onboarding from 2 weeks to 2 hours"
- **Target**: 50 team accounts, 5 enterprise contracts, $500K ARR

### Phase 4: Platform & API (Months 12–18)
- Launch Cortex API for third-party embedding
- Marketplace for memory plugins (custom extractors)
- Token-based storage incentives (StorageToken)
- Strategic partnerships with AI providers
- **Target**: 100 API customers, $2M ARR

---

## 7. Revenue Projections (Conservative)

| Metric | Year 1 | Year 2 | Year 3 |
|---|---|---|---|
| Free Users | 25,000 | 150,000 | 500,000 |
| Pro Users | 2,500 | 15,000 | 50,000 |
| Team Seats | 500 | 5,000 | 25,000 |
| Enterprise Contracts | 3 | 15 | 40 |
| API Customers | — | 50 | 200 |
| **ARR** | **$750K** | **$5.5M** | **$22M** |

### Unit Economics
- **CAC (Pro)**: ~$35 (content marketing + PLG)
- **LTV (Pro)**: ~$432 (30-month avg lifespan × $14.40 ARPU)
- **LTV:CAC Ratio**: 12.3:1
- **Gross Margin**: 85%+ (infrastructure costs minimal due to local-first)

---

## 8. Team Requirements (Initial)

| Role | Priority | Why |
|---|---|---|
| CEO / Product Lead | P0 | Vision, fundraising, product direction |
| CTO / Lead Engineer | P0 | Architecture ownership (existing codebase) |
| Full-Stack Engineer | P0 | PWA, browser extension, onboarding flows |
| AI/ML Engineer | P1 | Memory extraction quality, embedding optimization |
| DevRel / Community | P1 | Open-source community, content, developer adoption |
| Designer | P1 | Product UX, knowledge graph visualization |
| Sales (Enterprise) | P2 | Enterprise pilots (Phase 3) |

---

## 9. Funding Strategy

### Pre-Seed / Seed ($1.5M–$3M)
- **Use of funds**: 18 months runway for 5-person team
- **Milestones**: Open-source launch, 5K stars, Pro product, 1K paying users
- **Target investors**: AI-focused funds (a16z, Sequoia Scout, Y Combinator, Betaworks)
- **Pitch angle**: "We're building the memory layer for the AI era — open source, sovereign, multi-provider"

### Series A ($8M–$12M — Month 14–18)
- **Trigger**: $500K+ ARR, strong enterprise pipeline
- **Use of funds**: Scale team to 20, enterprise sales, SOC 2, international expansion

---

## 10. Key Risks & Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| AI providers build native memory | High | Open-source moat + multi-provider portability (they can't all agree) |
| Low consumer willingness to pay | Medium | Enterprise-first revenue; free tier drives adoption |
| Privacy/compliance concerns | Medium | Local-first architecture eliminates most concerns by design |
| Technical complexity of context pipeline | Medium | Already built and production-tested |
| Scaling P2P sync for enterprise | Medium | Hybrid mode (P2P + optional relay) already in protocol design |

---

## 11. Success Metrics (North Stars)

1. **Memory Density**: Avg memories extracted per conversation (target: 3.5+)
2. **Context Hit Rate**: % of context assemblies that include relevant recalled memories (target: 70%+)
3. **Provider Coverage**: Number of AI providers users have connected (target: avg 2.3+)
4. **Time-to-Value**: Minutes from signup to first enriched AI conversation (target: < 5 min)
5. **Retention**: 30-day retention for Pro users (target: 75%+)

---

*Document Version: 1.0 — March 2026*
*Based on production codebase analysis of `@vivim/sdk`, `server/src/context/`, and `server/src/context/memory/`*
