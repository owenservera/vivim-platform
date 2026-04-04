# VIVIM Open Core — Website Section
## Implementation Brief for AI Web Integration

> **File purpose:** Full content + visual direction for a new "Open Core" section on vivim.live.
> Every block below includes the copy, the layout directive, the interaction note, and the design intent.
> Your AI can implement this end-to-end. Sections are in page-order.

---

## Design Philosophy for This Section

**Tone:** Principled. Architectural. Anti-hype.
**Palette:** Inherit vivim.live's existing dark/light palette. Add a two-tone split motif — `free / open` uses a cool teal-adjacent accent; `commercial / enterprise` uses a warm amber accent. The contrast between the two should feel like a deliberate ideological divide, not a pricing table.
**Typography:** Section headers feel like manifestos — left-aligned, large, slightly uncomfortable in their confidence. Body text is precise and spare. No fluff.
**Motion philosophy:** Reveal on scroll. Stagger. Nothing bounces. Nothing spins. The animations should feel like something becoming visible, not performing.
**One unforgettable thing:** The "boundary line" — a visual element that runs through the section as a persistent metaphor for the open/commercial divide. Everything above it is free forever. Everything below it is where VIVIM earns trust commercially. The line moves. It breathes.

---

## Section 0 — Entry Anchor

```
[VISUAL DIRECTIVE]
Full-width section break above this content.
A single horizontal rule — thin, 1px, the same muted border color used elsewhere on the site.
Centered above it: a small pill badge reading "Open Core" in monospace font, 
bordered not filled, with a tiny open-lock icon to the left.
This pill is the section's identity marker. It recurs as a sticky label 
at top-right during scroll through this section.
```

**Anchor ID:** `#open-core`

---

## Section 1 — The Manifesto Header

### Copy

```
The tools that give you freedom
should never cost you anything.
```

*Sub-line (smaller, secondary color, italic):*
```
This isn't charity. It's architecture.
```

**Body paragraph:**
```
Most AI platforms lock intelligence behind subscriptions.
VIVIM inverts that.

The entire intelligence layer — every parser, every protocol, every line of 
context engine code — is permanently open source. Free to use, audit, fork, 
and build on. Forever.

We commercialize one thing only: the operational trust that enterprises 
require to run this infrastructure at scale.

Open = the intelligence layer.
Commercial = the infrastructure layer.
```

```
[VISUAL DIRECTIVE]
Layout: Two-column on desktop, stacked on mobile.
Left column (60%): The copy above, large display text ~48-52px for the headline.
Right column (40%): An animated "stack" diagram — two labeled blocks.
  - Top block (teal/cool): "Intelligence Layer" — labeled OPEN SOURCE · FREE FOREVER
  - Bottom block (amber/warm): "Infrastructure Layer" — labeled MANAGED · COMMERCIAL
  - A glowing line between them, 2px, pulsing softly at 3s interval.
  - On scroll-enter, the two blocks slide in from their respective sides 
    and meet at the dividing line.
  - This is THE visual metaphor. It runs through every subsequent section.

Do NOT use a traditional pricing table aesthetic here. 
This should feel like an architecture diagram, not a product page.
```

---

## Section 2 — "What's Free. Forever." (The Open Core Grid)

### Section Label
```
Free forever · No account required · AGPL v3
```

### Section Headline
```
The complete intelligence layer.
Yours permanently.
```

### Section Sub-headline
```
90+ implemented components. All open source. 
This is not a trial. There is no expiry date.
```

---

### Feature Grid — 6 Core Free Pillars

Each card follows the same structure:
- **Icon** (simple geometric, no emoji)
- **Pillar name** (bold, short)
- **One-line purpose** (secondary color)
- **What it means for you** (2–3 lines, human voice)
- **A code snippet OR a stat** (monospace, muted background)

---

#### Card 1 — Escape Any Provider

**Icon:** Two arrows forming an exit, outward-pointing
**Pillar:** Import your entire AI history
**Purpose:** Parser library for every major AI platform

```
Your 3 years of ChatGPT conversations.
Your Claude projects. Your Cursor sessions.
All of it becomes portable VIVIM memory — in one command.
```

```bash
vivim import --provider openai --file conversations.json
vivim import --provider claude --file claude_export.zip
vivim import --provider cursor --dir ~/.cursor/history
```

**Label chip:** `OpenAI · Claude · Gemini · Ollama · Cursor · +more`

---

#### Card 2 — The Context Engine

**Icon:** Eight horizontal lines of varying opacity, stacked (representing layers)
**Pillar:** 8-layer dynamic context assembly
**Purpose:** The most sophisticated open-source AI memory engine ever built

```
Not a chat history array. Not a vector dump.
A precisely budgeted, 8-layer context stack that assembles 
the right memory for every single message — in real time.
```

```
L0 Identity Core    ~300 tokens   Who you are
L5 JIT Retrieval    ~2500 tokens  What's relevant right now
L7 Your message     Variable      What you just said
─────────────────────────────────
Total               ~12,300 tokens. Zero wasted.
```

---

#### Card 3 — Atomic Memory Units

**Icon:** A small grid of distinct squares — some connected, some isolated
**Pillar:** ACU — the open standard for AI memory
**Purpose:** Every memory is individually addressable, searchable, and yours

```
AI has always stored conversations as monolithic blobs.
We atomize them. Each thought, preference, and decision 
becomes its own searchable unit — connected but independent.
```

**Stat display:**
```
9 memory types  ·  Episodic, Semantic, Procedural, 
Factual, Preference, Identity, Relationship, Goal, Project
```

---

#### Card 4 — Self-Sovereign Identity

**Icon:** A key shape, clean lines
**Pillar:** DID-based identity & key management
**Purpose:** Your AI identity, cryptographically yours — no VIVIM required

```
W3C-compliant Decentralized Identifiers.
Zero-knowledge key derivation.
Encryption keys never leave your device.
Your memory is readable by you — without us.
```

```bash
# Your memory. Legible forever.
vivim export --format sqlite --output ./my-memory.db
vivim export --format json --output ./my-memory.json
```

---

#### Card 5 — Self-Hosted Full Stack

**Icon:** A server/box outline, simple
**Pillar:** Run the entire stack yourself
**Purpose:** 100% feature parity with VIVIM Cloud — zero dependency on us

```
Server. Network. PWA. All open source.
Docker Compose. Under 5 minutes.
Full context engine, semantic search, provider sync.
```

```bash
git clone https://github.com/owenservera/vivim-server
docker-compose up -d
# You now own everything.
```

---

#### Card 6 — Developer Ecosystem

**Icon:** A node graph — dots connected with lines
**Pillar:** SDK, MCP server & integrations
**Purpose:** VIVIM memory in any AI tool — LangChain, Cursor, Claude Desktop, n8n

```
@vivim/sdk drops into any AI pipeline.
The MCP server exposes your memory to Claude Desktop
and Cursor without writing a line of code.
```

```typescript
import { ContextEngine, ACUStore } from '@vivim/sdk'

const engine = new ContextEngine({ 
  store: new ACUStore({ adapter: 'sqlite' }),
  budget: 12300
})
const context = await engine.assemble(userId, message)
```

---

```
[VISUAL DIRECTIVE]
Layout: 3-column grid on desktop, 2-column on tablet, 1-column on mobile.
Cards: Bordered, minimal background (secondary surface). No shadows.
  - Left border accent: 2px teal-adjacent color (matching "Open" block from Section 1)
  - Small "FREE FOREVER" chip in top-right corner of each card — pill shape, 
    monospace font, no fill, just border. Very small. 10-11px.
  
Animation: Cards stagger-reveal on scroll. Each card slides up 20px and fades in.
Delay increments: 0ms, 80ms, 160ms, 240ms, 320ms, 400ms.

The code/stat blocks inside each card should use a slightly darker surface,
monospace font, and a subtle left border — they feel like terminal windows,
not decorative boxes.

At the bottom of the grid: a quiet line of text reading
"Everything above is permanently free. What follows is where enterprises 
pay for trust — not capability."
Then: THE DIVIDING LINE — full-width, 2px, glowing (the same line from Section 1).
This line is the visual hinge between Sections 2 and 3.
It should feel significant. Give it breathing room: 40px above and below.
```

---

## Section 3 — The Open Core as Enterprise Roadmap

### Section Label
```
From open source → to enterprise trust
```

### Section Headline
```
The open core isn't the free version.
It's the enterprise roadmap.
```

### Body
```
Every enterprise customer VIVIM will ever sign was first 
a developer who read the source code, trusted what they found, 
and brought it into their organization.

The open intelligence layer builds that trust.
The commercial infrastructure layer makes it deployable 
at institutional scale.

These are not the same product. They are a sequence.
```

---

### The Flywheel — Narrative Reveal

```
[VISUAL DIRECTIVE]
This is a STEPPED REVEAL sequence — not a static diagram.

Seven stages. Each stage appears one at a time as the user scrolls
(or via a "Next" button on mobile). 

The visual is a vertical spine — a single line running down the center of the 
section. Each stage is a node on that line. As each node activates:
  1. The node circle fills (teal for open-source stages, amber for commercial stages)
  2. A short label appears to the right
  3. A supporting line of text fades in below

The stages:

STAGE 1 (teal) ──  Developer discovers open-source SDK
                   "They read the code. They trust what they find."

STAGE 2 (teal) ──  Developer builds with @vivim/sdk
                   "VIVIM memory ships inside their product."

STAGE 3 (teal) ──  End users encounter VIVIM through developer tools
                   "The protocol reaches people before the brand does."

STAGE 4 (amber) ── Individual upgrades to VIVIM Cloud
                   "Convenience. Not capability — they already had that."

STAGE 5 (amber) ── Power user brings VIVIM into their organization
                   "The internal champion. Every enterprise sale has one."

STAGE 6 (amber) ── Organization requires Teams or Enterprise tier
                   "Compliance. Audit logs. RBAC. The things institutions need."

STAGE 7 (teal) ──  Enterprise revenue funds deeper open source
                   "The flywheel closes. Open source wins because 
                    the commercial layer sustains it."

At Stage 7, the line loops back and connects to Stage 1 — a visual circle.
The loop should be subtle: a dashed curved arrow, not a thick ring.
```

---

### The Boundary Table — Open vs Commercial

**Headline:**
```
One question draws the line.
```

**Sub-headline:**
```
Does this require VIVIM to operate, 
or does it require VIVIM to be trusted?

Operation is open. Trust is commercial.
```

```
[VISUAL DIRECTIVE]
Two-column layout. NOT a traditional pricing table.
The two columns are separated by THE DIVIDING LINE — 
now rendered vertically between them.

Left column — "Always Open" (cool teal accent):
  - Background: slightly tinted with teal at 3-4% opacity
  - Header: "Open forever" with open-lock icon
  - Items listed below (see content)

Right column — "Commercial Layer" (warm amber accent):
  - Background: slightly tinted with amber at 3-4% opacity  
  - Header: "Managed by VIVIM" with shield icon
  - Items listed below (see content)

The vertical dividing line between columns should glow.
At the top of it: a small badge reading "THE LINE"
At the bottom: a small arrow pointing down.

No pricing shown in this table. This is about principle, not SKUs.
```

**Left column content — Always Open:**

```
✦  All context intelligence
   ACU processing, 8-layer assembly, memory classification, 
   JIT retrieval, context thermodynamics

✦  All provider parsers
   Every import library — OpenAI, Claude, Gemini, Ollama, 
   Cursor, and every future platform

✦  All protocols
   ACU specification, DID identity, ActivityPub federation, 
   MCP server, P2P sync

✦  All storage
   DAG engine, Merkle trees, secure storage, IPFS adapter, 
   SQLite adapter, S3-compatible

✦  All identity primitives
   W3C DID toolkit, zero-knowledge key management, 
   full memory export in open formats

✦  The entire self-hosted stack
   Server, PWA, network node, admin panel — 
   everything you need to run VIVIM without us
```

**Right column content — Managed by VIVIM:**

```
✦  Managed uptime
   SLAs, auto-scaling, TLS, CDN, 
   zero-ops hosting

✦  Managed backup
   3-2-1 architecture, point-in-time recovery, 
   geo-redundancy

✦  Managed compliance
   SOC 2 Type II, HIPAA BAA, 
   FedRAMP (roadmap)

✦  Managed identity integration
   SAML 2.0, SCIM, enterprise SSO — 
   Google Workspace, Microsoft 365

✦  Managed audit
   Compliance-grade audit log delivery, 
   legal hold, eDiscovery support

✦  Organizational features
   RBAC on memory collections, 
   shared knowledge bases, seat management, 
   admin dashboard, usage analytics
```

---

## Section 4 — Enterprise Tier Story (The Destination)

### Section Headline
```
For organizations that can't afford to guess.
```

### Body
```
VIVIM Enterprise exists for one reason:
regulated industries need sovereign AI memory 
with institutional accountability.

Healthcare teams running AI-assisted diagnosis.
Legal teams with AI-assisted research.
Financial services with AI-assisted analysis.
Government contractors under data residency requirements.

They don't need more capability.
They need someone to be responsible.
```

---

### Three Enterprise Tiers — Minimal Cards

```
[VISUAL DIRECTIVE]
Three cards in a horizontal row. Minimal. Almost sparse.
No feature lists. Just the positioning line and a "Learn more" CTA.
These cards are intentionally less detailed than Section 2's feature grid.
The open core section did the heavy lifting. These are destinations.

Card style: White/light surface, thin border (amber-adjacent for enterprise feel),
large tier name, one positioning sentence, one CTA.

The progression should feel like a journey — Cloud → Teams → Enterprise —
with the visual weight increasing left to right.
```

**Card 1 — VIVIM Cloud**
```
For individuals who want sovereignty without ops.

"All the capability. None of the infrastructure."

[Join waitlist →]
```

**Card 2 — VIVIM Teams**
```
For small organizations with individual sovereignty requirements.

"Shared knowledge. Individual memory. By design."

[Start a pilot →]
```

**Card 3 — VIVIM Enterprise**
```
For regulated industries that need institutional accountability.

"Sovereign AI memory with compliance you can sign off on."

[Talk to us →]
```

---

## Section 5 — The One Paragraph (Investor / Partner Signal)

```
[VISUAL DIRECTIVE]
Full-width. Dark background (inverted from the rest of the section — 
the only section with an inverted background).
Single column, max-width 720px, centered.
Large pull-quote treatment — no quotation marks, just 
beautiful large body text with generous line height.
Small "In one paragraph" label above it in monospace, muted.
```

```
VIVIM is the open-source infrastructure for sovereign AI memory.
We've built and open-sourced the complete intelligence stack:
provider data import parsers for every major AI platform,
the ACU context engine that powers persistent cross-provider memory,
the DID identity layer, and the self-hostable server.
Commercial revenue comes from VIVIM Cloud, Teams, and Enterprise —
managed operational reliability on top of this open foundation.
The open-source layer is the moat.
It builds trust, drives adoption, and feeds a commercial funnel
that no purely proprietary competitor can replicate —
because they cannot make the same sovereignty promise we can.
```

**Below the paragraph, centered:**
```
[Open on GitHub →]   [Read the ACU spec →]   [Talk to the team →]
```

---

## Section 6 — Closing Trust Signal

```
[VISUAL DIRECTIVE]
Minimal footer to this section only (not the page footer).
Three columns of quiet stats/facts.
No animation. Just type.
```

**Column 1:**
```
90+
implemented open-source components
across SDK, server, PWA, and network
```

**Column 2:**
```
AGPL v3
permanently and irrevocably free
not a trial, not a tier, not a hook
```

**Column 3:**
```
Self-hostable
100% feature parity with VIVIM Cloud
no dependency on us. ever.
```

---

## Implementation Notes for the AI

### Scroll Behavior
- Sections 1–3 should scroll as a cohesive narrative unit. Consider a subtle sticky progress indicator on the right edge — a thin vertical track with a dot that moves as the user scrolls through this section.
- The "dividing line" motif (the visual separator between open and commercial) should appear in Section 1, reappear as the horizontal divider between Sections 2 and 3, and then appear vertically in the two-column boundary table. Same element, three manifestations.

### The "FREE FOREVER" Chip
- Small pill badge, monospace, borderonly. Appears on every open-core feature card in Section 2.
- Must feel like a guarantee stamp, not a marketing label.
- Color: use the cool teal/open accent — NOT green (green feels like "success" not "principle").

### Typography Decisions
- Section 1 headline: display weight, `letter-spacing: -0.02em`. The manifesto needs to feel carved, not printed.
- All code blocks: monospace, 13px, slightly lower contrast (secondary text color), no syntax highlighting needed — this is demonstration, not documentation.
- The "one paragraph" in Section 5: `line-height: 1.8`, `font-size: 1.25rem`. Let it breathe.

### Accessibility
- The dividing line animation must respect `prefers-reduced-motion`. Offer a static version.
- All code blocks need `role="code"` and `aria-label` descriptions.
- The flywheel stepper (Section 3) must be keyboard-navigable.

### Mobile Behavior
- The two-column boundary table (Section 3) stacks vertically on mobile. The "Always Open" column comes first.
- The flywheel stepper becomes a swipeable horizontal sequence on mobile.
- The three-column stats in Section 6 become a 3-row single column on mobile.

### Existing Site Integration
- This section slots between the current "Solution" section and the "ACUs" section, OR after "ACUs" — designer's call based on narrative flow.
- Inherit all existing CSS variables from vivim.live. Do not introduce new color values.
- The two accent colors (teal-open, amber-commercial) should map to the closest existing site variables, or be defined as `--color-open-accent` and `--color-commercial-accent` in the section's scoped styles.

### What to NOT Add
- No "Compare plans" pricing table in this section. That belongs on a dedicated `/pricing` page.
- No testimonials. The code speaks.
- No feature checklists with ✓ marks. The boundary table uses ✦ deliberately — it's neutral, not a checkmark race.
- No countdown timers, "limited offer," or urgency language. This is a philosophy section. Urgency poisons it.

---

## Content Hierarchy Summary

```
Section 0 — Entry badge + anchor
Section 1 — The manifesto (headline + architecture metaphor)
Section 2 — 6 free feature pillars (the open core grid)
            ↓  [THE DIVIDING LINE]  ↓
Section 3 — The flywheel narrative + open vs commercial boundary table
Section 4 — Three tier destination cards (Cloud / Teams / Enterprise)
Section 5 — The one paragraph (pull quote, dark bg)
Section 6 — Closing trust stats
```

**The emotional arc:**
```
"This is free forever" 
→ "Here's everything you actually get"
→ "Here's why this model works — and where enterprise fits"
→ "Here's where we earn revenue"
→ "Here's the whole picture in one breath"
→ "Here are the numbers that prove it's real"
```

---

*Document version: 1.0*
*Purpose: AI-implementable web section spec*
*Source documents: VIVIM_OpenCore_Blueprint.md, VIVIM_OpenCore_Product_Roadmap.md, vivim_opencore_strategy_DRAFT_v0.md, vivim.live*
