# VIVIM Open Core Strategy
## The Sovereign AI Memory Infrastructure

---

## The Dual Development Philosophy

VIVIM is built on a belief most infrastructure companies are afraid to commit to:
**the tools that give users freedom should never be locked behind a paywall.**

This isn't charity. It's architecture.

We open-source everything that touches your data — the protocols, the parsers, the context engine, the memory formats. These are the building blocks of sovereignty. They become more valuable the more people use, contribute to, and build on them.

We commercialize managed infrastructure — the layer that requires operational expertise, uptime guarantees, compliance certifications, and organizational trust. This is the layer where enterprises pay not for capability, but for reliability and accountability.

**Open = the intelligence layer. Commercial = the infrastructure layer.**

---

## The Open Toolkit — What's Permanently Free

### 1. The Provider Data Import & Mapping Library

Every AI provider traps your conversation history in proprietary export formats. We are building — and permanently open-sourcing — the most complete library of AI data parsers ever assembled.

**What's included:**
- **OpenAI** — ChatGPT conversation JSON parser, GPT API message history normalizer, custom instructions extractor
- **Anthropic** — Claude.ai export parser, Projects context mapper, system prompt extractor
- **Google** — Gemini conversation importer, Workspace AI history parser
- **Mistral / Groq / Perplexity / Cohere** — API log normalizers
- **Ollama / LM Studio / Jan** — Local model conversation importers (JSON, GGUF metadata)
- **Cursor / Windsurf / Continue** — IDE assistant history extractors
- **Notion AI / Linear Asks / Intercom Fin** — Product tool memory importers
- **Universal format** — Any OpenAI-compatible API output → VIVIM ACU pipeline

Every parser outputs to the same canonical ACU format. Your 3 years of ChatGPT history becomes sovereign VIVIM memory in one command.

```bash
vivim import --provider openai --file conversations.json
vivim import --provider claude --file claude_export.zip
vivim import --provider cursor --dir ~/.cursor/history
```

**Why this is open:** Data portability is a civil right in the AI era. Locking import tooling contradicts everything VIVIM stands for. An open, community-maintained parser library becomes the de facto standard — which drives SDK adoption and VIVIM Cloud onboarding.

---

### 2. The Core Dynamic Context Engine

The 8-layer context assembly system is the intellectual heart of VIVIM. It is, and will always be, open source.

**What's included:**
- **ACU (Atomic Chat Unit) specification** — the canonical format for individually addressable AI memory units. An open standard anyone can implement.
- **ACU segmentation engine** — the algorithm that breaks raw conversation turns into individually searchable, recomposable units with preserved context chains
- **8-layer assembly pipeline** — the L0–L7 context stack builder: Identity Core, Global Preferences, Topic Context, Entity Context, Conversation Arc, JIT Retrieval, Message History, Live Input
- **Semantic retrieval engine** — the vector similarity + keyword hybrid search that powers JIT context assembly
- **Memory type classifier** — the 9-type taxonomy (Episodic, Semantic, Procedural, Factual, Preference, Identity, Relationship, Goal, Project) with automatic classification
- **Context budgeting system** — token allocation logic across the 8 layers, configurable by provider and use case
- **Decay and refresh algorithms** — how memories age, get reinforced, or get promoted between layers
- **Provider-agnostic adapter interface** — the abstraction layer that lets the same context engine serve GPT-4, Claude, Gemini, or any local model

```typescript
import { ContextEngine, ACUStore, MemoryClassifier } from '@vivim/sdk'

const engine = new ContextEngine({
  store: new ACUStore({ adapter: 'sqlite', path: './memory.db' }),
  layers: defaultLayerConfig,
  budget: 12300 // tokens
})

const context = await engine.assemble(userId, currentMessage)
```

**Why this is open:** The context engine *is* the moat, but not because it's secret — because it's *trusted*. Developers building production AI applications need to understand what's happening inside their memory layer. Auditability is a feature. Security researchers, compliance teams, and enterprise architects all need to read the code. Open-sourcing it builds more trust than any whitepaper.

---

### 3. Identity & Portability Primitives

- **DID (Decentralized Identifier) toolkit** — W3C-compliant DID generation, resolution, and key management. Your AI identity, cryptographically yours.
- **Key management library** — zero-knowledge key derivation; encryption keys never leave the user's device
- **Memory export tools** — full ACU database export to JSON, SQLite, or IPFS in documented, open formats. Your memory, readable by humans and machines without VIVIM.
- **Cross-device sync protocol** — the open P2P sync spec used by vivim-network. Anyone can implement a compatible node.
- **Storage adapters** — Local filesystem, SQLite, IPFS, and S3-compatible (self-hosted MinIO, Backblaze B2, etc.)

---

### 4. The Self-Hosted Full Stack

The entire production stack — server, network, PWA — is open and self-hostable.

```bash
# Full sovereign deployment in under 5 minutes
git clone https://github.com/owenservera/vivim-server
docker-compose up -d

# You now have:
# - Full context engine
# - ACU storage with semantic search
# - Provider sync adapters
# - P2P network node
# - PWA frontend
```

**What you get self-hosting:** Everything. 100% feature parity with VIVIM Cloud except managed uptime, automatic backups, and compliance certifications.

---

### 5. Community-Built Integrations Layer

Open-source plugin architecture for extending VIVIM into any AI application:

- **MCP server** (Model Context Protocol) — expose VIVIM memory as an MCP tool for Claude Desktop, Cursor, and any MCP-compatible client
- **LangChain / LlamaIndex memory adapters** — drop-in VIVIM memory for existing AI pipelines
- **n8n / Make / Zapier connectors** — low-code memory automation
- **Browser extension SDK** — capture AI conversations from any web interface
- **Obsidian / Notion / Logseq plugins** — personal knowledge base ↔ AI memory sync

---

## The Commercial Layer — What VIVIM Sells

Commercial features exist for one reason: **not everyone wants to run infrastructure**. Sovereignty without operational burden is a product, not just a philosophy.

### VIVIM Cloud — for individuals and developers
*"All the sovereignty. None of the ops."*

- Managed hosting of the full VIVIM stack
- Automatic encrypted backups (3-2-1 architecture)
- Sub-100ms context assembly SLA
- One-click provider import (ChatGPT, Claude, Gemini history)
- Memory sync across unlimited devices
- Web + mobile PWA access
- Priority support

**What's NOT included in self-hosted:** Managed TLS, auto-scaling, uptime SLA, offsite backup, push notifications, one-click provider OAuth flows

**Pricing signal:** $9–19/month individual. $0 tier with storage cap to drive free → paid conversion.

---

### VIVIM Teams — for small organizations
*"Shared AI memory with individual sovereignty."*

- Per-seat memory for every team member (individual sovereignty preserved)
- Selective memory sharing across team members (opt-in, not surveillance)
- Shared knowledge bases — project context, company glossary, decision logs
- Admin dashboard — seat management, usage analytics
- SSO (Google Workspace, Microsoft 365)
- Priority support + onboarding call

**Pricing signal:** $25–40/seat/month. 5-seat minimum.

---

### VIVIM Enterprise — for regulated industries
*"Sovereign AI memory with enterprise accountability."*

- Private cloud deployment (VPC, on-premise, air-gapped)
- HIPAA Business Associate Agreement (BAA)
- SOC 2 Type II compliance report
- SAML 2.0 / SCIM provisioning
- Full audit logs — who accessed what memory, when
- Role-based access control (RBAC) on memory collections
- Custom data retention and deletion policies
- Legal hold / eDiscovery support
- Custom SLA (99.99% uptime)
- Dedicated customer success manager
- Quarterly business review

**Target verticals:** Healthcare AI assistants, legal tech, financial services, government contractors, HR tech

**Pricing signal:** $5,000–50,000+ ACV. Land on a single team, expand org-wide.

---

## 0 → 1 Commercial Roadmap

### Days 1–90: Credibility Sprint

**Goal:** Be findable, be real, start the clock on revenue.

**Open source milestones:**
- [ ] Ship the OpenAI + Claude import parsers as the headline open-source launch
- [ ] Publish the ACU specification as a standalone document (positions VIVIM as a standards body, not just a product)
- [ ] MCP server adapter — gets VIVIM into Claude Desktop and Cursor immediately; high-visibility, zero sales effort
- [ ] 500 GitHub stars across repos (social proof threshold for VCs)
- [ ] 1,000 npm installs of `@vivim/sdk`

**Commercial milestones:**
- [ ] Launch vivim.cloud waitlist with pricing page live (even if product isn't ready — every signup is a conversion signal)
- [ ] First 25 paid beta users on VIVIM Cloud ($9/month) — revenue: ~$225 MRR
- [ ] First 3 Teams pilot conversations started (warm intros or Discord power users)
- [ ] One enterprise discovery call from a healthcare or legal contact

**Website/narrative milestones:**
- [ ] Investor page live with team bios, deck, and Calendly
- [ ] Traction bar on homepage with real numbers
- [ ] "Open Core" section explaining the model clearly

**Key metric at 90 days:** $500–1,000 MRR. Not meaningful revenue — meaningful *proof* that someone will pay.

---

### Days 91–180: Traction Loop

**Goal:** Find the repeatable acquisition motion. At least one paying enterprise pilot.

**Open source milestones:**
- [ ] Full provider import library (5+ providers): this becomes the headline PR story — "VIVIM can import your entire AI history from anywhere"
- [ ] LangChain + LlamaIndex adapters shipped — pulls in the Python/AI-builder community
- [ ] vivim-network v1 stable — enables decentralized sync (the purest expression of the philosophy)
- [ ] 2,000 GitHub stars, 5,000 SDK installs
- [ ] First community-contributed parser (someone outside the team adds a new provider)

**Commercial milestones:**
- [ ] VIVIM Cloud out of beta — billing live, onboarding automated
- [ ] 150 paying Cloud subscribers → $1,500–2,500 MRR
- [ ] First paid Teams account (5+ seats) → $1,500+/month
- [ ] Enterprise pilot #1 signed — even at a deep discount, this gives you a logo, a case study, and a reference call
- [ ] Begin SOC 2 Type II audit process (takes ~6 months; starting now means you can claim "audit in progress" to enterprise prospects)

**Key metric at 6 months:** $5,000–10,000 MRR. One enterprise logo. SOC 2 in progress.

---

### Days 181–365: Series A Setup

**Goal:** Demonstrate the open-core flywheel is real. Show that open adoption converts to commercial revenue.

**Open source milestones:**
- [ ] 5,000+ GitHub stars — enough for organic developer press coverage
- [ ] 25,000+ SDK installs — demonstrates ecosystem pull
- [ ] ACU spec adopted or referenced by at least one other project outside VIVIM — validates it as a standard
- [ ] Obsidian + Notion plugins shipped — expands the knowledge worker persona beyond developers
- [ ] Contributor community active — PRs from 10+ external contributors

**Commercial milestones:**
- [ ] VIVIM Cloud: 500+ paying users → $5,000–9,500 MRR
- [ ] VIVIM Teams: 10+ accounts → $15,000–25,000 MRR
- [ ] VIVIM Enterprise: 2–3 signed customers → $15,000–50,000 ACV each
- [ ] SOC 2 Type II certification complete — unlocks enterprise procurement
- [ ] Total ARR: $400,000–600,000
- [ ] NRR (Net Revenue Retention) > 110% — enterprise expansion is happening
- [ ] Series A fundraise: target $5–8M at $25–35M valuation

**The story for Series A:**
> "We built the open-source standard for sovereign AI memory. 5,000 developers have adopted it. The commercial layer — Cloud, Teams, Enterprise — is converting at X% from open-source users with $500K ARR and growing 25% month-over-month. We're using the raise to accelerate the Enterprise tier into healthcare and legal, and to fund the compliance infrastructure (HIPAA, FedRAMP) that makes us the only sovereign AI memory vendor those verticals can actually buy."

---

## The Flywheel in One Diagram

```
Open source adoption
        ↓
Developer trust & ecosystem integrations
        ↓
End users discover VIVIM through developer tools
        ↓
Individuals upgrade to VIVIM Cloud (convenience)
        ↓
Power users bring VIVIM into their organizations
        ↓
Organizations need Teams/Enterprise (compliance, scale)
        ↓
Enterprise revenue funds open source development
        ↓
Richer open source → more developer adoption
        ↑___________________________________|
```

The open source isn't a cost center. It's the acquisition channel.

---

## The One Investor Paragraph

> VIVIM is the open-source infrastructure for sovereign AI memory. We've built and open-sourced the complete stack: provider data import parsers for every major AI platform, the ACU context engine that powers persistent cross-provider AI memory, the DID identity layer, and the self-hostable server. Commercial revenue comes from VIVIM Cloud (managed hosting), Teams (shared organizational memory with individual sovereignty), and Enterprise (compliance, audit, private deployment). The open-source layer is the moat — it builds trust, drives adoption, and feeds a commercial funnel that no purely proprietary competitor can replicate, because they can't make the same sovereignty promise we can.
