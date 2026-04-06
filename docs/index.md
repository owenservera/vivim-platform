itle: "Introduction"
description: "VIVIM is sovereign, portable memory for every AI interaction. Open source, encrypted, and fully under your control."
---

# Introduction

Your AI conversations live in silos — ChatGPT, Claude, Gemini, Grok — disconnected, unsearchable, and lost forever. VIVIM fixes that.


## What is VIVIM?

VIVIM is an open-source AI memory platform that captures, connects, and encrypts every AI interaction across every provider. It gives you a single, unified memory layer for all your AI conversations — searchable, visualizable, and fully under your control.

### The problem

- **Fragmented memory** — Each AI provider stores your conversations in isolation
- **No search** — You can't find what you discussed months ago across providers
- **No ownership** — Your AI memory is locked in proprietary systems
- **No portability** — Switching providers means starting from scratch

### The solution

VIVIM sits between you and every AI provider, capturing every conversation and building a persistent, encrypted knowledge graph that you own completely.

| Capability | What VIVIM provides |
|---|---|
| **Capture** | Automatic extraction from 9+ AI providers |
| **Connect** | Knowledge graph linking 50,000+ memories |
| **Encrypt** | End-to-end, zero-knowledge, client-side keys |
| **Search** | Full-text and semantic search across all memories |
| **Share** | Granular, encrypted, revocable sharing with circles |
| **Export** | Open formats (JSON, SQLite, IPFS) — no lock-in |

## Architecture at a glance

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

VIVIM is a monorepo with five packages:

| Package | Purpose |
|---|---|
| **`pwa/`** | Progressive web app — the main interface |
| **`server/`** | API server — capture, extract, serve AI memories |
| **`network/`** | P2P engine — CRDT sync, federation |
| **`sdk/`** | Developer toolkit — build VIVIM apps |
| **`admin-panel/`** | Platform management dashboard |

## Core principles

| Principle | Meaning |
|---|---|
| Own Your AI | Your memories, your keys, your control. Always. |
| Share Your AI | Share memories with circles — encrypted, granular, revocable |
| Evolve Your AI | Auto-extraction learns from every conversation |
| Portable | Export everything. Switch providers. Keep your brain. |
| Sovereign | End-to-end encrypted. Zero-knowledge. No backdoors. |

## Open Core

VIVIM is open source under AGPL v3. Every component that touches user data is permanently free and auditable.

> The open core is the acquisition channel. The commercial layer is the business.

- **180+ implemented components** — permanently free
- **Self-hostable** — full stack via Docker Compose
- **Commercial layer** — SLAs, compliance, enterprise features


::: info
Ready to get started? Head to the [Quick Start guide](/quickstart) to have VIVIM running in under 2 minutes.
:::

