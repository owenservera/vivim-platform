# VIVIM

### Your AI remembers **everything**. You own it.

Sovereign, portable memory for every AI interaction. Any provider. Every context. Your data.

---

## What is VIVIM?

Your AI conversations live in silos — ChatGPT, Claude, Gemini, Grok, DeepSeek — disconnected, unsearchable, lost forever.

**VIVIM fixes that.**

It's a personal AI memory platform that captures, connects, and owns every AI interaction across every provider. Built on open protocols with end-to-end encryption. Your data never leaves your control.

```
┌────────────────────────────────────────────────────────────┐
│  Your AI Brain                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                 │
│  │ ChatGPT  │  │  Claude  │  │  Gemini  │                 │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘                 │
│       └──────────────┼──────────────┘                       │
│                      ▼                                      │
│          ┌──────────────────────┐                           │
│          │    VIVIM Memory      │                           │
│          │  50,000+ memories    │                           │
│          │  1,500+ connections  │                           │
│          │  100% encrypted      │                           │
│          └──────────────────────┘                           │
└────────────────────────────────────────────────────────────┘
```

## See It Live

**[▶ Watch the 90-second demo](https://vivim-platform.vercel.app/demo/investor-pitch)**

Three magic moments:
1. **The Archive** — 609 sessions across 6 providers, all searchable
2. **The Knowledge Graph** — 1,547 connected memories, visualized
3. **The Context Cockpit** — AI that knows you because it remembers everything

---

## The Numbers

| Metric | Value | What It Means |
|--------|-------|---------------|
| Memories Captured | 50,000+ | Every AI thought, preserved |
| Knowledge Graph Nodes | 1,547 | Your AI brain, connected |
| Providers Supported | 9 | Any AI, one memory |
| Encryption Coverage | 100% | End-to-end, zero-knowledge |
| Token Compression | 3:1 | More intelligence, less context |
| API Latency (p95) | <200ms | Blazing fast, full memory |

---

## Quick Start

```bash
# Clone
git clone https://github.com/owenservera/vivim-platform.git
cd vivim-platform

# Install + setup
bun run setup:deps
bun run setup:db

# Run everything
bun run dev

# Open the demo
open http://localhost:5173/demo/investor-pitch
```

That's it. Full platform in 4 commands.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, TypeScript, TailwindCSS, Vite 7, Framer Motion |
| **Backend** | Bun, Express 5, Prisma, PostgreSQL, Redis |
| **Network** | LibP2P, Yjs CRDT, WebRTC, WebSockets |
| **Crypto** | Ed25519, @noble/crypto, multiformats |
| **AI** | Vercel AI SDK (OpenAI, Anthropic, Google, xAI, Qwen) |
| **SDK** | TypeScript, Bun, IPFS/Helia, assistant-ui |

---

## Architecture

VIVIM is a monorepo with 5 interconnected packages:

| Package | What It Does |
|---------|-------------|
| **`pwa/`** | Progressive web app — the main interface |
| **`server/`** | API server — capture, extract, serve AI memories |
| **`network/`** | P2P engine — CRDT sync, federation |
| **`sdk/`** | Developer toolkit — build VIVIM apps |
| **`admin-panel/`** | Platform management dashboard |

---

## Core Principles

| Principle | What It Means |
|-----------|---------------|
| 🔐 **Own Your AI** | Your memories, your keys, your control. Always. |
| 🔗 **Share Your AI** | Share memories with circles — encrypted, granular, revocable |
| 📈 **Evolve Your AI** | Auto-extraction learns from every conversation |
| 🌐 **Portable** | Export everything. Switch providers. Keep your brain |
| 🛡️ **Sovereign** | End-to-end encrypted. Zero-knowledge. No backdoors |

---

## The Memory System

Built on patterns from vCode (Anthropic's Claude Code), adapted for web/P2P:

### Three-Tier Hierarchy
- **Project Memory** — Scoped to a workspace
- **User Memory** — Cross-project, yours alone
- **Team Memory** — Shared, synced via CRDT

### Auto-Extraction
VIVIM watches your conversations and automatically extracts:
- **Facts** — "We use Bun as the runtime"
- **Preferences** — "Prefers TypeScript with strict mode"
- **Conventions** — "Always uses functional components"
- **Goals** — "Building decentralized AI memory"
- **Identity** — "Full-stack developer with blockchain experience"

### Knowledge Graph
Every memory is connected. VIVIM builds a living graph of your AI brain — searchable, visualizable, explorable.

---

## vCode Integration

This codebase integrates patterns from **vCode** (github.com/owenservera/vicode) — a 512K+ LOC agentic coding system. We ported the architecture, never the code:

- **Tool System** — Zod-validated, permission-checked, timed execution
- **Permission System** — 4 modes (default/plan/auto/bypass) with wildcard rules
- **Plugin Architecture** — Discover → install → load → execute lifecycle
- **Skill System** — 16 bundled skills (memory, context, session, cost, diagnostics...)
- **Agent Orchestration** — Spawn agents with scoped tool access
- **Task Management** — 6-tool lifecycle (create/get/list/update/output/stop)
- **Context Compression** — Snip, summary, hybrid strategies

Full integration guide: [`VCODE_INTEGRATION.md`](VCODE_INTEGRATION.md)

---

## Observability

Every operation is tracked. Every metric tells a story:

- **Telemetry Hub** — Counters, gauges, histograms, event log
- **Auto-Instrumentation** — All SDK modules wrapped automatically
- **Prometheus Metrics** — `/api/v1/observability/metrics`
- **Demo Engine** — Scripted investor journeys with magic moments

Full strategy: [`docs/OBSERVABILITY_STRATEGY.md`](docs/OBSERVABILITY_STRATEGY.md)

---

## For Investors

### The Problem
AI context dies in provider silos. Users can't search, share, or own their AI memories.

### The Solution
VIVIM captures, connects, and encrypts every AI interaction. One brain, all providers, fully sovereign.

### The Moat
- CRDT sync at scale (18 months of engineering to replicate)
- Multi-provider extraction pipeline
- Knowledge graph construction
- Zero-knowledge architecture
- Network effects: more users → richer shared memory

### The Ask
We're raising to build the AI memory layer that every AI user needs.

---

## License

MIT. Open source. Your data stays yours.

---

<div align="center">

**Built for the generation that grew up with AI — and demands ownership of it.**

[VIVIM](https://vivim.app) · [Docs](docs/) · [Demo](https://vivim-platform.vercel.app/demo/investor-pitch)

</div>
