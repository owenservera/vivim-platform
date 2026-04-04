# VIVIM Open Core — Website Section Specifications

## Overview

This document provides the visual and conceptual specifications for the Open Core section on vivim.live. Each section includes the narrative, the visual direction, and the animated interactions — without implementation details.

---

## Section Structure

```
Open Core Section
├── Section 0: Entry Anchor
├── Section 1: The Manifesto Header
├── Section 2: What's Free Forever (6 pillars)
├── Section 3: The Flywheel & Boundary Table
├── Section 4: Enterprise Tier Story
├── Section 5: The One Paragraph
└── Section 6: Closing Trust Signal
```

---

## Design Philosophy

### Tone
Principled. Architectural. Anti-hype.

### Color Palette
Inherit vivim.live's existing dark/light palette. Add a two-tone split motif:
- **Cool teal** — represents `free / open`
- **Warm amber** — represents `commercial / enterprise`

The contrast should feel like an ideological divide, not a pricing table.

### Typography
- Section headers feel like manifestos — left-aligned, large, confident
- Body text is precise and spare. No fluff.
- Code snippets use monospace

### Motion Philosophy
Reveal on scroll. Stagger. Nothing bounces. Nothing spins. Animations should feel like something becoming visible.

---

## Section 0 — Entry Anchor

### Visual
- Full-width horizontal rule, 1px, muted
- Centered pill badge: "Open Core" in monospace
- Open-lock icon to the left of the badge
- Badge recurs as sticky label at top-right during scroll

**Anchor:** `#open-core`

---

## Section 1 — The Manifesto Header

### Narrative
> **The tools that give you freedom**
> **should never cost you anything.**
> 
> *This isn't charity. It's architecture.*

Most AI platforms lock intelligence behind subscriptions. VIVIM inverts that.

The entire intelligence layer — every parser, every protocol, every line of context engine code — is permanently open source. Free to use, audit, fork, and build on. Forever.

We commercialize one thing only: the operational trust that enterprises require to run this infrastructure at scale.

**Open = the intelligence layer.**
**Commercial = the infrastructure layer.**

### Visual Direction

**Two-column layout (desktop):**
- Left (60%): The narrative copy, headline at 48-52px
- Right (40%): Animated stack diagram

**The Stack Diagram:**
- Two labeled blocks that slide in from opposite sides
- Top block: "Intelligence Layer" — cool teal accent, labeled "OPEN SOURCE · FREE FOREVER"
- Bottom block: "Infrastructure Layer" — warm amber accent, labeled "MANAGED · COMMERCIAL"
- A glowing line between them, 2px, pulsing softly at 3s interval
- The blocks meet at the line on scroll-enter

**This is THE visual metaphor.** It runs through every subsequent section.

---

## Section 2 — What's Free Forever

### Narrative

**Label:** `Free forever · No account required · AGPL v3`

**Headline:** The complete intelligence layer. Yours permanently.

**Sub-headline:** 90+ implemented components. All open source. This is not a trial. There is no expiry date.

---

### The Six Pillars

Each pillar is a card with:
- Geometric icon (no emoji)
- Bold name
- One-line purpose
- 2-3 sentences of explanation
- Code snippet or stat

#### Pillar 1: Escape Any Provider
> Your 3 years of ChatGPT conversations. Your Claude projects. Your Cursor sessions. All of it becomes portable VIVIM memory — in one command.

```
vivim import --provider openai --file conversations.json
```

#### Pillar 2: The Context Engine
> Not a chat history array. Not a vector dump. A precisely budgeted, 8-layer context stack that assembles the right memory for every single message — in real time.

```
L0 Identity Core    ~300 tokens   Who you are
L5 JIT Retrieval    ~2500 tokens  What's relevant
L7 Your message     Variable      What you just said
──────────────────────────────────────────
Total               ~12,300 tokens. Zero wasted.
```

#### Pillar 3: Atomic Memory Units
> AI has always stored conversations as monolithic blobs. We atomize them. Each thought, preference, and decision becomes its own searchable unit — connected but independent.

**9 memory types:** Episodic, Semantic, Procedural, Factual, Preference, Identity, Relationship, Goal, Project

#### Pillar 4: Self-Sovereign Identity
> W3C-compliant Decentralized Identifiers. Zero-knowledge key derivation. Encryption keys never leave your device. Your memory is readable by you — without us.

```
vivim export --format sqlite --output ./my-memory.db
```

#### Pillar 5: Self-Hosted Full Stack
> Server. Network. PWA. All open source. Docker Compose. Under 5 minutes. Full context engine, semantic search, provider sync.

```
git clone git@github.com:owenservera/vivim-server.git
docker-compose up -d
# You now own everything.
```

#### Pillar 6: Developer Ecosystem
> @vivim/sdk drops into any AI pipeline. The MCP server exposes your memory to Claude Desktop and Cursor without writing a line of code.

```typescript
import { ContextEngine, ACUStore } from '@vivim/sdk'
const context = await engine.assemble(userId, message)
```

### Visual Direction

**Grid:** 3-column desktop, 2-column tablet, 1-column mobile

**Cards:**
- Bordered, minimal background
- Left border: 2px teal accent
- Top-right corner: "FREE FOREVER" chip — small pill, monospace, border-only

**Animation:** Stagger-reveal on scroll. Each card slides up 20px and fades in (0ms, 80ms, 160ms, 240ms, 320ms, 400ms).

**Dividing Line:** Below the grid, a glowing horizontal line — "Everything above is permanently free. What follows is where enterprises pay for trust."

---

## Section 3 — The Flywheel & Boundary Table

### Narrative

**Label:** From open source → to enterprise trust

**Headline:** The open core isn't the free version. It's the enterprise roadmap.

**Body:**
Every enterprise customer VIVIM will ever sign was first a developer who read the source code, trusted what they found, and brought it into their organization.

The open intelligence layer builds that trust. The commercial infrastructure layer makes it deployable at institutional scale.

These are not the same product. They are a sequence.

---

### The Flywheel (Animated)

Seven stages that reveal one at a time as you scroll:

| Stage | Color | Label | Supporting Text |
|-------|-------|-------|-----------------|
| 1 | teal | Developer discovers open-source SDK | They read the code. They trust what they find. |
| 2 | teal | Developer builds with @vivim/sdk | VIVIM memory ships inside their product. |
| 3 | teal | End users encounter VIVIM through tools | The protocol reaches people before the brand does. |
| 4 | amber | Individual upgrades to VIVIM Cloud | Convenience. Not capability. |
| 5 | amber | Power user brings VIVIM into organization | The internal champion. |
| 6 | amber | Organization requires Teams/Enterprise | Compliance. Audit logs. RBAC. |
| 7 | teal | Enterprise revenue funds open source | The flywheel closes. |

**Visual:** A vertical spine down the center. Each stage is a node. At Stage 7, the line loops back to Stage 1 — a subtle dashed curved arrow.

---

### The Boundary Table

**Headline:** One question draws the line.

**Sub-headline:** Does this require VIVIM to operate, or does it require VIVIM to be trusted? Operation is open. Trust is commercial.

**Visual:** Two columns separated by a glowing vertical line — the same "dividing line" motif from Section 1.

**Left column — Always Open (teal tint):**
- All context intelligence
- All provider parsers
- All protocols
- All storage
- All identity primitives
- The entire self-hosted stack

**Right column — Commercial (amber tint):**
- Managed uptime
- Managed backup
- Managed compliance
- Managed identity integration
- Managed audit
- Organizational features

No pricing. No SKUs. This is about principle.

---

## Section 4 — Enterprise Tier Story

### Narrative

**Headline:** For organizations that can't afford to guess.

VIVIM Enterprise exists for one reason: regulated industries need sovereign AI memory with institutional accountability.

Healthcare teams running AI-assisted diagnosis. Legal teams with AI-assisted research. Financial services with AI-assisted analysis. Government contractors under data residency requirements.

They don't need more capability. They need someone to be responsible.

---

### Three Cards

**VIVIM Cloud**
> For individuals who want sovereignty without ops.
> "All the capability. None of the infrastructure."

**VIVIM Teams**
> For small organizations with individual sovereignty requirements.
> "Shared knowledge. Individual memory. By design."

**VIVIM Enterprise**
> For regulated industries that need institutional accountability.
> "Sovereign AI memory with compliance you can sign off on."

---

## Section 5 — The One Paragraph

### Narrative

> VIVIM is the open-source infrastructure for sovereign AI memory. We've built and open-sourced the complete intelligence stack: provider data import parsers for every major AI platform, the ACU context engine that powers persistent cross-provider memory, the DID identity layer, and the self-hostable server. Commercial revenue comes from VIVIM Cloud, Teams, and Enterprise — managed operational reliability on top of this open foundation. The open-source layer is the moat. It builds trust, drives adoption, and feeds a commercial funnel that no purely proprietary competitor can replicate — because they cannot make the same sovereignty promise we can.

**CTAs:**
- Open on GitHub →
- Read the ACU spec →
- Talk to the team →

### Visual

- Full-width, dark background (inverted from the rest)
- Single column, max-width 720px, centered
- Large body text with generous line-height (1.8)
- "In one paragraph" label above in monospace, muted

---

## Section 6 — Closing Trust Signal

### Three Columns

**90+**
implemented open-source components
across SDK, server, PWA, and network

**AGPL v3**
permanently and irrevocably free
not a trial, not a tier, not a hook

**Self-hostable**
100% feature parity with VIVIM Cloud
no dependency on us. ever.

---

## Visual Summary

### The Dividing Line (Recurring Motif)

This is the section's unifying visual element:

1. **Section 1**: Horizontal glowing line between Intelligence and Infrastructure blocks
2. **Section 2**: Horizontal glowing line between free pillars and commercial section
3. **Section 3**: Vertical glowing line between "Always Open" and "Commercial" columns

Same element, three manifestations. It is the visual anchor of the entire section.

### Animation Summary

| Element | Animation | Trigger |
|---------|-----------|---------|
| Stack diagram blocks | Slide in from sides, meet at line | Scroll-enter Section 1 |
| Pillar cards | Stagger slide-up + fade | Scroll into Section 2 |
| Flywheel stages | Step-by-step reveal | Scroll through Section 3 |
| Counter (90+) | Count up from 0 | Scroll-enter |
| Dividing line | Soft pulse (3s) | Continuous |

### Mobile Behavior

- Two-column boundary table stacks vertically
- Flywheel becomes horizontal swipe
- Stats become single column

---

*Document version: 1.0*
*Purpose: Visual and narrative specifications for vivim.live Open Core section*
*Last updated: March 2026*
