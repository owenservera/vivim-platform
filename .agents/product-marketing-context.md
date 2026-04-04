# Product Marketing Context

*Last updated: 2026-03-17*

---

## Product Overview

**One-liner:**
VIVIM is the open-source, decentralized AI memory platform — your personal knowledge graph that captures, connects, and amplifies every conversation you've ever had with AI.

**What it does:**
VIVIM imports your conversations from every major AI provider (ChatGPT, Claude, Gemini, DeepSeek, Grok, Kimi, Mistral, Qwen, Z.AI), breaks them into atomic knowledge units, and connects them into a searchable, shareable intelligence graph. It learns who you are through an 8-layer context engine and lets you share, fork, and build on AI conversations with anyone.

**Product category:**
Personal AI Knowledge Management / AI Memory Platform

**Product type:**
Consumer + Developer SaaS (freemium model with open-source core)

**Business model:**
- Open-source core (MIT licensed)
- Managed cloud service (free tier + paid tiers)
- Enterprise/self-hosted options
- SDK licensing for developers

---

## Target Audience

**Target companies:**
- Individual AI power users (developers, researchers, creators)
- Small to medium teams using AI collaboratively
- Enterprises wanting private AI memory infrastructure

**Target decision-makers:**
- Individual users (self-serve)
- Technical leads / CTOs (enterprise)
- Developers building AI-powered products (SDK users)

**Primary use case:**
"I'm tired of losing valuable insights from my AI conversations. I want one place where all my ChatGPT, Claude, and Gemini chats live — searchable, connected, and mine forever."

**Jobs to be done:**
1. **Capture** — Get every AI conversation into one place, automatically
2. **Organize** — Find anything instantly with semantic search across all chats
3. **Connect** — See how ideas across conversations relate to each other
4. **Share** — Share specific insights or full conversations with colleagues
5. **Persist** — Never lose valuable AI-generated knowledge again

**Use cases:**
- Developer researching a technical problem across multiple AI chats
- Researcher building a knowledge base from AI-assisted exploration
- Team lead sharing AI insights with collaborators
- Content creator organizing AI-generated ideas
- Student capturing learning journeys through AI tutoring

---

## Personas

| Persona | Cares about | Challenge | Value we promise |
|---------|-------------|-----------|------------------|
| **The AI Power User** | Efficiency, depth of knowledge, control | Losing track of insights across 100+ conversations | One unified archive that gets smarter with every chat |
| **The Developer** | Integration, extensibility, data portability | Vendor lock-in, can't build on top of AI outputs | Open SDK, full data ownership, programmable |
| **The Team Lead** | Collaboration, knowledge sharing, visibility | Siloed AI usage across team members | Share and collaborate on AI conversations |
| **The Privacy-First User** | Security, ownership, encryption | Tech companies owning their AI interactions | End-to-end encryption, DID identity, self-hostable |
| **The Enterprise Buyer** | Compliance, control, scalability | No enterprise options in consumer AI tools | Self-hosted, audit trails, SSO |

---

## Problems & Pain Points

**Core problem:**
Users interact with AI constantly but lose the knowledge created. Each AI provider is a walled garden — conversations disappear, can't be searched across platforms, and can't be shared meaningfully. The average power user has hundreds of valuable conversations scattered across ChatGPT, Claude, Gemini, and others. They lose track of insights, repeat questions, and can't build on their AI-augmented thinking.

**Why alternatives fall short:**
- **Provider-native history** — Locked to single platform, limited search, no sharing
- **Bookmarking tools** — Don't capture the conversation, just URLs
- **Note-taking apps** — Manual effort, no AI conversation integration
- **Existing "AI memory" tools** — Single-provider only, no social layer, proprietary

**What it costs them:**
- **Time:** 15+ minutes/week re-finding past conversations
- **Money:** Paying for AI queries they already got answers to
- **Knowledge:** Valuable insights lost forever
- **Collaboration:** Can't share AI insights with team

**Emotional tension:**
- Frustration: "I know I asked this before..."
- Anxiety: "What if ChatGPT deletes my data?"
- FOMO: Missing insights from conversations they forgot they had
- Powerlessness: Tech companies controlling their AI interactions

---

## Competitive Landscape

**Direct competitors:**
- **Mem** — AI notes, but not focused on AI conversations, no multi-provider import
- **Mycroft AI** — Personal AI assistant, not memory/archival
- **Recall** — Browser extension for saving content, not deep AI conversation integration

**Secondary competitors:**
- **ChatGPT Plus/GPTs** — Walled garden, no export, no true ownership
- **Claude.ai** — Same limitations as ChatGPT
- **Notion AI** — General notes, not purpose-built for AI conversations
- **Obsidian** — Manual organization required, no AI integration

**Indirect competitors:**
- **Manual copy-pasting** — What most people do today
- **Browser bookmarks** — Surface-level, loses conversation context

**How each falls short:**
- None offer true multi-provider conversation capture (9 providers)
- None have the 8-layer context engine
- None combine social sharing with granular permissions
- None offer quantum-resistant encryption + DID identity
- None are truly decentralized/open-source with full data portability

---

## Differentiation

**Key differentiators:**
1. **9-Provider Import** — Only solution that captures from all major AI providers
2. **Atomic Chat Units (ACUs)** — Granular, cryptographically signed knowledge pieces
3. **8-Layer Context Engine** — System that learns and personalizes over time
4. **Social AI Layer** — Share, fork, remix AI conversations with permissions
5. **Quantum-Resistant Crypto** — ML-KEM-1024 key exchange, Ed25519 signatures
6. **DID Identity** — Self-sovereign identity, no email required
7. **True Data Portability** — Export to JSON, Markdown, ActivityPub, ATProtocol
8. **Open Source** — MIT licensed, self-hostable, community-auditable

**How we do it differently:**
- Capture happens via Playwright automation (headless browser scraping with user authentication)
- Conversations are decomposed into ACUs with embeddings for semantic search
- Context engine layers user identity, preferences, topic interests, entity tracking, and JIT retrieval
- Sharing uses cryptographic signatures + permission policies, not just links
- P2P network enables decentralized sync via CRDTs (Yjs)

**Why that's better:**
- Users aren't locked into any AI provider
- Knowledge compounds over time (context engine)
- Teams can collaborate without sharing raw data
- Privacy-first users get enterprise-grade security
- Developers can build on top (SDK available)

**Why customers choose us:**
- "Finally, all my AI chats in one place"
- "I can share specific insights without giving access to everything"
- "It's like having a second brain that actually understands my AI usage"
- "I own my data — no vendor lock-in"

---

## Objections

| Objection | Response |
|-----------|----------|
| "I just use one AI, why do I need this?" | Even single-provider users lose conversations over time. VIVIM ensures you never lose insights, can search across chats, and prepares you for multi-provider future. |
| "This seems complex, I'm not technical" | The core experience is simple: connect your accounts, we do the rest. Advanced features are optional. |
| "Why not just use ChatGPT's memory?" | ChatGPT memory is limited, provider-specific, and you don't truly own it. VIVIM gives you portability and control. |
| "How is this different from a notes app?" | Notes apps require manual effort. VIVIM automatically captures and structures your AI conversations. |
| "Is my data really secure?" | End-to-end encryption, quantum-resistant key exchange, and you can self-host. Your data, your keys. |
| "What if the company shuts down?" | Open-source, self-hostable, full export capability. You're never locked in. |

**Anti-persona:**
- Users who only use AI casually (once a month)
- Users strongly opposed to any form of account/authentication
- Users who prefer complete manual control over automation

---

## Switching Dynamics

**Push (frustrations with current solution):**
- Lost conversations when switching AI providers
- Can't search across all AI chats
- No way to share AI insights with team
- Vendor lock-in anxiety
- Privacy concerns about AI companies

**Pull (what attracts to VIVIM):**
- All AI conversations unified
- Semantic search across everything
- Built-in sharing and collaboration
- True data ownership
- Privacy-first architecture

**Habit (what keeps them stuck):**
- Already paying for ChatGPT Plus/Claude Pro
- Don't want to change workflow
- "I can just bookmark important chats"
- Skepticism about new platforms

**Anxiety (worries about switching):**
- Migration effort
- Security of connecting accounts
- Learning curve
- Whether it will actually work

---

## Customer Language

**How they describe the problem:**
- "I asked Claude the same thing I asked ChatGPT three weeks ago"
- "I know I had this conversation but I can't find it"
- "I wish my team could see these insights"
- "I'm tired of starting from scratch with every new AI"
- "What happens if OpenAI deletes my data?"

**How they describe us:**
- "My second brain for AI"
- "The bridge between all my AIs"
- "Finally, my AI conversations are searchable"
- "It's like Spotify for my AI chats"

**Words to use:**
- Own, control, portable, unified, connected, compound, persistent
- Knowledge graph, context, insights, atomic units
- Decentralized, self-sovereign, encrypted

**Words to avoid:**
- Archive (sounds like dead data)
- Store ( transactional)
- Sync (generic)
- "AI history" (boring)
- Jargon without explanation

**Glossary:**

| Term | Meaning |
|------|---------|
| ACU | Atomic Chat Unit — granular, signed knowledge piece extracted from conversations |
| Context Engine | 8-layer system that personalizes AI responses based on user history |
| DID | Decentralized Identifier — self-sovereign identity system |
| CRDT | Conflict-free Replicated Data Type — enables P2P sync |
| Knowledge Graph | Visual representation of connected conversations and insights |
| Knowledge Pulse | Shareable package of AI insights with context |

---

## Brand Voice

**Tone:**
Confident but not arrogant. We're building something genuinely new — we can be bold. But we're helpful, not preachy. We speak to power users who appreciate precision.

**Style:**
Technical enough to be credible, but accessible enough to not alienate. We explain our innovations but don't drown in jargon. We're direct — we say what we mean.

**Personality:**
- Innovative
- Empowering
- Privacy-first
- Technically credible
- User-aligned (on the user's side, not AI companies')

---

## Proof Points

**Key metrics to cite:**
- 9 AI providers supported (most comprehensive)
- 60+ database models (enterprise-grade architecture)
- 100% data portability (export to any format)
- Working conversation capture from all major platforms

**Notable differentiators:**
- First platform with 8-layer context engine for AI conversations
- Only solution with quantum-resistant encryption for AI memory
- Only open-source option with full multi-provider capture

**Value themes:**

| Theme | Proof |
|-------|-------|
| True ownership | Full export, self-hosting, open-source |
| Knowledge compounding | 8-layer context engine |
| Universal capture | 9 providers, more coming |
| Privacy-first | E2E encryption, DID identity |
| Collaboration | Share, fork, remix with permissions |

---

## Goals

**Business goal:**
Become the default platform for AI-powered knowledge management. Capture the emerging market of AI power users who need to organize, search, and share their AI interactions.

**Primary conversion action:**
Sign up and connect first AI provider (Google OAuth or DID-based account)

**Secondary conversion actions:**
- Import first conversation
- Create first collection
- Share first insight

**Current metrics (if known):**
- GitHub stars (for open-source credibility)
- Active users on self-hosted demo
- Feature completion: 25+ features working, 2 major (P2P, onboarding) in progress

---

## Key Investor Messaging Angles

**Market Opportunity:**
Every knowledge worker using AI needs this. 100M+ ChatGPT users, 10M+ Claude users, and growing. They're all losing knowledge daily.

**Traction:**
Working product with 9 providers, full feature set for core use cases, active development (recent sessions show continuous progress).

**Differentiation:**
No other platform offers this combination: multi-provider capture + context engine + social layer + privacy-first architecture + open source.

**Technology:**
Advanced engineering (CRDTs, DID, quantum-resistant crypto, LibP2P) — not a simple wrapper, real infrastructure.

**Team:**
Building something meaningful with technical depth. Open-source community signals genuine product love.
