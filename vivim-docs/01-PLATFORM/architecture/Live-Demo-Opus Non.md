

# VIVIM Mock Demo — Implementation Plan v2.0

> **Objective**: Engineer a cinematic, state-of-the-art interactive demo of the VIVIM platform that delivers the complete user journey—from fragmented AI chaos to unified, context-powered intelligence—with production-grade visual fidelity, sub-second responsiveness, multi-persona narrative branching, accessibility compliance, offline resilience, analytics instrumentation, and bulletproof live-presentation capabilities suitable for investor due diligence, enterprise sales, trade shows, and self-serve product-led growth.

---

## 1. Executive Summary

This document specifies the architecture, tooling, data strategy, narrative design, accessibility requirements, analytics instrumentation, and phased implementation approach for building a **Mock Demo version of VIVIM** that:

- **Plays like a movie** — guiding viewers through a compelling, branching narrative of an AI power user across multiple personas and use cases
- **Withstands live fire** — robust enough for interactive demos with real-time audience participation, random navigation, and graceful degradation under any failure condition
- **Feels indistinguishable from production** — full mock data ecosystem that mirrors real-world usage patterns across all 9 supported providers with statistically realistic distributions
- **Achieves visual excellence** — 60fps choreographed animations, cinematic transitions, spatial audio cues, and responsive design from 4K displays to tablet kiosks
- **Drives measurable outcomes** — instrumented with analytics to track engagement, identify high-interest features, and feed insights back to product and sales teams
- **Ships accessible and internationalized** — WCAG 2.2 AA compliant, screen-reader tested, with i18n scaffolding for global go-to-market

---

## 2. Strategic Decisions

### 2.1 Branch & Deployment Strategy

| Option | Pros | Cons | Risk |
|--------|------|------|------|
| **A. Feature branch (`demo/mock-demo-v1`)** | Clean separation; easy to merge/discard; parallel dev | Branch drift over time | Medium |
| **B. Demo folder within monorepo** | Shared components; single CI pipeline | Clutters production; build size | Low |
| **C. Separate demo app (monorepo workspace)** | Complete isolation; independent deploy; own CI/CD | Component duplication risk | Low |
| **D. Feature-flagged within production build** | Single build artifact; instant toggle; A/B testable | Complexity in flag management; bundle size | Medium |

**Recommendation**: **Option C — Monorepo Workspace** (`apps/demo/`) using the existing monorepo tooling. This provides:

- Independent deployment pipeline (demo.vivim.app)
- Shared component library via workspace dependency (`@vivim/ui`, `@vivim/core`)
- Independent bundle optimization (tree-shake production-only code)
- Separate Vercel/Cloudflare Pages project for instant global edge deployment
- No risk of demo code shipping in production builds
- Independent versioning: `demo@1.0.0`, `demo@1.1.0`, etc.

```
vivim/
├── apps/
│   ├── web/              # Production application
│   └── demo/             # Demo application ← NEW
├── packages/
│   ├── ui/               # Shared component library
│   ├── core/             # Shared business logic
│   └── demo-engine/      # Demo-specific engine ← NEW
└── turbo.json
```

**Deployment topology**:

```
┌──────────────────────────────────────────────────────────────────────┐
│                     DEPLOYMENT ARCHITECTURE                          │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  demo.vivim.app ──► Cloudflare Pages (Edge, 300+ PoPs)             │
│       │                                                              │
│       ├── Static assets ──► R2 / CDN (Brotli compressed)            │
│       ├── Mock API ──► Service Worker (client-side, zero latency)   │
│       └── Analytics ──► PostHog / Mixpanel (event stream)           │
│                                                                      │
│  Offline: Full PWA with service worker cache                         │
│  Fallback: Pre-rendered static HTML for zero-JS environments        │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

---

### 2.2 Core Architecture: Demo Runtime

The demo operates as a **layered runtime** with clear separation between narrative orchestration, data simulation, visual presentation, and analytics.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          VIVIM DEMO RUNTIME                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  L4: PRESENTATION LAYER                                          │   │
│  │  ┌─────────┐ ┌────────────┐ ┌───────────┐ ┌──────────────────┐ │   │
│  │  │ Stage   │ │ Transition │ │ Animation │ │ Responsive       │ │   │
│  │  │ Views   │ │ Director   │ │ Orchestra │ │ Layout Engine    │ │   │
│  │  └─────────┘ └────────────┘ └───────────┘ └──────────────────┘ │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  L3: NARRATIVE ENGINE                                            │   │
│  │  ┌─────────┐ ┌────────────┐ ┌───────────┐ ┌──────────────────┐ │   │
│  │  │ Stage   │ │ Branch     │ │ Persona   │ │ Time Travel      │ │   │
│  │  │ Graph   │ │ Controller │ │ Selector  │ │ Controller       │ │   │
│  │  └─────────┘ └────────────┘ └───────────┘ └──────────────────┘ │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  L2: DATA SIMULATION LAYER                                       │   │
│  │  ┌─────────┐ ┌────────────┐ ┌───────────┐ ┌──────────────────┐ │   │
│  │  │ MSW     │ │ Faker      │ │ Latency   │ │ State Machine    │ │   │
│  │  │ Handler │ │ Generator  │ │ Simulator │ │ (XState)         │ │   │
│  │  └─────────┘ └────────────┘ └───────────┘ └──────────────────┘ │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  L1: INFRASTRUCTURE                                              │   │
│  │  ┌─────────┐ ┌────────────┐ ┌───────────┐ ┌──────────────────┐ │   │
│  │  │ Service │ │ IndexedDB  │ │ Analytics │ │ Error Boundary   │ │   │
│  │  │ Worker  │ │ Cache      │ │ Pipeline  │ │ + Recovery       │ │   │
│  │  └─────────┘ └────────────┘ └───────────┘ └──────────────────┘ │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Tooling & Technology Stack

### 3.1 Complete Technology Matrix

| Category | Tool | Version | Purpose | Rationale |
|----------|------|---------|---------|-----------|
| **Framework** | React 19 | ^19.0 | Core UI | Existing; Suspense + transitions for smooth loading |
| **Build** | Vite 6 | ^6.0 | Bundler | Existing; instant HMR; optimized chunks |
| **State (App)** | Zustand | ^5.0 | Global state | Existing; minimal boilerplate; devtools |
| **State (Complex)** | XState | ^5.0 | Demo state machine | Formal state machine for stage/mode transitions; prevents impossible states |
| **API Mocking** | MSW | ^2.7 | Service worker mocking | Intercepts at network level; identical to production API shape |
| **Animation** | Framer Motion | ^11.0 | Choreographed motion | Existing; layout animations; gesture support |
| **Animation (3D)** | Three.js / R3F | ^8.0 | Optional 3D hero elements | Knowledge graph 3D visualization; wow factor |
| **Data Viz** | React Flow | ^12.0 | Knowledge graph canvas | Existing; custom nodes; minimap |
| **Charts** | Recharts / Nivo | latest | Usage statistics | Dashboard analytics visualizations |
| **Styling** | TailwindCSS | ^4.0 | Utility-first CSS | Existing; JIT; custom theme tokens |
| **Components** | Radix UI + Custom | latest | Accessible primitives | Existing; full ARIA support |
| **Data Gen** | @faker-js/faker | ^9.0 | Realistic mock data | Locale-aware; deterministic seeding |
| **Dates** | date-fns | ^4.0 | Time formatting | Tree-shakeable; locale support |
| **Immutability** | Immer | ^10.0 | State updates | Predictable demo state mutations |
| **Hotkeys** | react-hotkeys-hook | ^5.0 | Keyboard control | Demo control panel shortcuts |
| **Markdown** | react-markdown + rehype | latest | Message rendering | Code highlighting; LaTeX; images |
| **Code Highlight** | Shiki | ^1.0 | Syntax highlighting | VS Code-quality; theme-aware |
| **Audio** | Howler.js | ^2.2 | Optional sound effects | Ambient audio; transition sounds |
| **PWA** | Workbox | ^7.0 | Offline capability | Precache all demo assets |
| **Analytics** | PostHog | latest | Event tracking | Self-hostable; feature flags; session replay |
| **Testing** | Playwright | ^1.50 | E2E demo validation | Cross-browser; visual regression |
| **i18n** | i18next | ^24.0 | Internationalization | Scaffolding for global demos |
| **A11y Testing** | axe-core + eslint-plugin-jsx-a11y | latest | Accessibility validation | Automated WCAG 2.2 AA checks |

### 3.2 Bundle Size Budget

| Chunk | Target | Contents |
|-------|--------|----------|
| **Critical path** | < 80 KB (gzipped) | React, router, demo shell |
| **Stage chunks** | < 40 KB each (gzipped) | Code-split per stage |
| **Mock data** | < 200 KB (gzipped) | Compressed JSON; lazy-loaded |
| **Animations** | < 30 KB (gzipped) | Framer Motion tree-shaken |
| **Total initial** | < 150 KB (gzipped) | First meaningful paint |
| **Total loaded** | < 800 KB (gzipped) | All stages + data |

---

## 4. Demo Narrative: Multi-Persona Branching Journey

### 4.1 Persona System

The demo supports **3 distinct personas** to match different audience contexts. Each persona shares the same 7-stage structure but with tailored data, emphasis, and pacing.

| Persona | Role | Pain Points | Emphasized Features | Demo Duration |
|---------|------|-------------|---------------------|---------------|
| **Alex (Developer)** | Senior full-stack engineer | Fragmented debugging across ChatGPT/Claude/DeepSeek; lost code solutions; repeated questions | Canvas view, semantic search, code-heavy conversations, context layers | 6 minutes |
| **Morgan (Researcher)** | AI/ML PhD researcher | Literature review across Gemini/Claude; connecting ideas across months; sharing with lab | Memory system, knowledge graph, social sharing, topic profiles | 7 minutes |
| **Jordan (Executive)** | VP of Product | Strategic planning across multiple AI tools; team knowledge sharing; privacy concerns | Dashboard metrics, sharing/permissions, encryption, team circles | 5 minutes |

### 4.2 Stage Architecture: Directed Acyclic Graph

Unlike a linear sequence, stages form a **DAG** allowing branching, optional deep-dives, and audience-responsive routing.

```
                    ┌─────────────┐
                    │  STAGE 0    │
                    │  Persona    │
                    │  Selection  │
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │  STAGE 1    │
                    │  THE        │
                    │  PROBLEM    │
                    │  (45s)      │
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │  STAGE 2    │
                    │  THE        │
                    │  CAPTURE    │
                    │  (60s)      │
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
       ┌──────▼──────┐    │     ┌──────▼──────┐
       │  STAGE 3a   │    │     │  STAGE 3b   │
       │  ARCHIVE    │    │     │  CANVAS     │
       │  VIEWS      │    │     │  DEEP DIVE  │
       │  (60s)      │    │     │  (90s)      │
       └──────┬──────┘    │     └──────┬──────┘
              │            │            │
              └────────────┼────────────┘
                           │
                    ┌──────▼──────┐
                    │  STAGE 4    │
                    │  DISCOVERY  │
                    │  & SEARCH   │
                    │  (45s)      │
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
       ┌──────▼──────┐    │     ┌──────▼──────┐
       │  STAGE 5a   │    │     │  STAGE 5b   │
       │  CONTEXT    │    │     │  CONTEXT    │
       │  OVERVIEW   │    │     │  DEEP DIVE  │
       │  (45s)      │    │     │  (120s)     │
       └──────┬──────┘    │     └──────┬──────┘
              │            │            │
              └────────────┼────────────┘
                           │
                    ┌──────▼──────┐
                    │  STAGE 6    │
                    │  MEMORIES   │
                    │  (45s)      │
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │  STAGE 7    │
                    │  SHARING    │
                    │  & SOCIAL   │
                    │  (45s)      │
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │  FINALE     │
                    │  CTA +      │
                    │  METRICS    │
                    └─────────────┘
```

### 4.3 Detailed Stage Specifications

---

#### STAGE 0: Persona Selection (15s)

**Purpose**: Set the narrative context; personalize the entire demo experience.

**Visual**: Full-screen split into 3 vertical panels. Each panel shows an avatar, name, role, and a 2-second looping animation of their "AI chaos." On hover, panel expands slightly with a parallax depth effect. On click, the selected panel expands to fill the screen while others slide away.

```tsx
// Interaction model
interface PersonaSelection {
  personas: ['alex-developer', 'morgan-researcher', 'jordan-executive'];
  autoSelect: 'alex-developer'; // Default for guided mode
  transitionOut: 'selected-panel-expands-to-fullscreen';
  duration: { guided: 3000, interactive: null }; // null = wait for click
}
```

**Accessibility**: Each persona is a focusable card with `role="radio"`, grouped in a `role="radiogroup"`. Arrow keys navigate between personas. Enter/Space selects.

---

#### STAGE 1: The Problem (45s)

**Purpose**: Establish emotional resonance with the pain of fragmented AI usage.

**Visual Composition**:

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐                │
│  │ GPT  │ │Claude│ │Gemini│ │Deep  │ │ Grok │  ← Tab bar     │
│  │  ●   │ │      │ │      │ │Seek  │ │      │    (animated    │
│  └──────┘ └──────┘ └──────┘ └──────┘ └──────┘     switching)  │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  "I know I solved this before... but WHERE?"            │   │
│  │                                                         │   │
│  │  ░░░░░░░░░░░░ ← Scrolling through 200+ conversations  │   │
│  │  ░░░░░░░░░░░░                                          │   │
│  │  ░░░░░░░░░░░░     😩 Frustration meter: ████████░░      │   │
│  │  ░░░░░░░░░░░░                                          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  STAT CALLOUTS (animated in):                                   │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐         │
│  │ 5 AI     │ │ 847      │ │ 12,400   │ │ 3.2 hrs  │         │
│  │ tools    │ │ convos   │ │ messages │ │ searching│         │
│  │ daily    │ │ this yr  │ │ lost     │ │ per week │         │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Animation Choreography**:
1. **T+0ms**: Browser-like frame appears with 5 provider tabs
2. **T+500ms**: Tabs animate switching (rapid, slightly chaotic)
3. **T+1500ms**: Scrolling animation shows endless conversation list
4. **T+2500ms**: Stat callouts stagger in from bottom (200ms each)
5. **T+4000ms**: Central text types out: "There has to be a better way..."

**Per-Persona Variations**:
| Persona | Pain Displayed | Key Stat |
|---------|---------------|----------|
| Alex | Debugging the same React error in 3 different tools | "Asked this same question 4 times across 3 tools" |
| Morgan | Literature notes scattered; can't connect papers | "147 research conversations. Zero connections." |
| Jordan | Strategic decisions lost in ChatGPT history | "Your team's AI knowledge: siloed and invisible" |

---

#### STAGE 2: The Capture (60s)

**Purpose**: Show the magic moment — VIVIM unifying all providers.

**Visual Composition**:

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│           "Connect once. Capture everything."                   │
│                                                                 │
│              ┌─────────────────────┐                            │
│              │                     │                            │
│  ┌───┐       │   ┌─────────────┐   │       ┌───┐              │
│  │GPT│──────►│   │   VIVIM     │   │◄──────│Qwn│              │
│  └───┘       │   │   BRAIN     │   │       └───┘              │
│              │   │   🧠        │   │                            │
│  ┌───┐       │   └─────────────┘   │       ┌───┐              │
│  │Cld│──────►│                     │◄──────│Mst│              │
│  └───┘       │                     │       └───┘              │
│              └─────────────────────┘                            │
│  ┌───┐                                      ┌───┐              │
│  │Gem│──────────────────────────────────────│Grk│              │
│  └───┘              ┌───┐                   └───┘              │
│                     │Kim│                                       │
│  ┌───┐              └───┘                   ┌───┐              │
│  │DSk│──────────────────────────────────────│ZAI│              │
│  └───┘                                      └───┘              │
│                                                                 │
│  CONNECTION STATUS:                                             │
│  ✅ ChatGPT (142 convos)  ✅ Claude (98 convos)               │
│  ✅ Gemini (67 convos)    🔄 DeepSeek (syncing...)            │
│  ⏳ Grok     ⏳ Kimi    ⏳ Mistral    ⏳ Qwen    ⏳ Z.AI     │
│                                                                 │
│  TOTAL: ████████████████░░░░ 307 / 847 conversations captured  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Animation Choreography**:
1. **T+0ms**: VIVIM brain icon appears center with subtle pulse
2. **T+400ms**: Provider icons orbit inward from edges (staggered, 150ms each)
3. **T+1200ms**: Connection lines draw from first provider to center (particle trail effect)
4. **T+1500ms**: Status changes to ✅ with conversation count counter animating up
5. **T+1500–4000ms**: Each subsequent provider connects (sequential, with satisfying "click" haptic)
6. **T+4500ms**: Progress bar fills; total count animates to final number
7. **T+5500ms**: Celebratory micro-animation — all provider icons pulse in unison

**Technical Demo Note**: In interactive mode, user can click each provider to "connect" it manually, triggering the animation per-provider.

---

#### STAGE 3a: The Organization — Archive Views (60s)

**Purpose**: Showcase VIVIM's powerful multi-view conversation archive.

**Visual**: Split screen. Left side shows view mode selector. Right side shows the active view. Transitions between views use morphing layout animations.

**View Mode Transitions**:

```
LIST VIEW          GRID VIEW          CANVAS VIEW        TIMELINE VIEW
┌────────────┐    ┌─────┬─────┐     ┌─────────────┐    ┌──────────────┐
│ ─────────  │    │ ┌─┐ │ ┌─┐ │     │  ○   ○      │    │ ●── Jan 2025 │
│ ─────────  │ ►  │ └─┘ │ └─┘ │ ►   │   \ / \     │ ►  │ ●── Feb 2025 │
│ ─────────  │    │ ┌─┐ │ ┌─┐ │     │    ○   ○    │    │ ●── Mar 2025 │
│ ─────────  │    │ └─┘ │ └─┘ │     │   / \       │    │ ●── Apr 2025 │
└────────────┘    └─────┴─────┘     │  ○   ○      │    └──────────────┘
                                     └─────────────┘
```

**Morphing Animation**: When switching views, each conversation card morphs from its position in the old view to its new position. Shared layout IDs (Framer Motion `layoutId`) enable seamless transitions.

---

#### STAGE 3b: Canvas Deep Dive (90s, optional branch)

**Purpose**: Show the knowledge graph — VIVIM's most visually impressive feature.

**Visual**: Full-screen React Flow canvas with:
- **Nodes**: Conversations as circles, sized by message count, colored by provider
- **Edges**: Semantic connections between related conversations
- **Clusters**: Auto-grouped by topic (React, ML, System Design, etc.)
- **Minimap**: Bottom-right corner
- **Interaction**: Zoom, pan, click to preview conversation

```
┌─────────────────────────────────────────────────────────────────┐
│  KNOWLEDGE GRAPH                                    ┌────────┐ │
│                                                     │minimap │ │
│       ●React                                        │        │ │
│      / | \              ●Python                     └────────┘ │
│     ●  ●  ●            / | \                                   │
│    Hooks State Router  ●  ●  ●                                 │
│         |             Async ML  Web                             │
│         ●                |                                      │
│     useEffect            ●                                      │
│         |            TensorFlow                                 │
│         ●                                                       │
│     Performance                          ●SystemDesign          │
│                                         / | \                   │
│                                        ●  ●  ●                 │
│                                     Scale DB  API               │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ PREVIEW: "Debugging useEffect infinite loop"            │   │
│  │ Provider: ChatGPT │ Messages: 23 │ Duration: 45min     │   │
│  │ Connected to: 4 other conversations │ 12 memories      │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

**Technical**: React Flow with custom node components. Force-directed layout computed on mock data load. Animated edge drawing on first render. Click-to-preview with slide-up panel.

---

#### STAGE 4: The Discovery (45s)

**Purpose**: Demonstrate semantic search and cross-conversation intelligence.

**Visual**: Search bar centered at top. User types (or auto-types in guided mode). Results appear below with semantic relevance scores, provider badges, and highlighted excerpts.

**Demo Interaction**: Typing "React hooks performance" triggers:
1. Instant fuzzy results (3 conversations)
2. Semantic results with embeddings (7 more conversations)
3. **AI Synthesis panel** slides in from right:

```
┌──────────────────────────────────────────────────────┐
│  🧠 AI SYNTHESIS                                      │
│                                                       │
│  Across 7 conversations spanning 4 months, you've    │
│  explored React hooks performance from 3 angles:     │
│                                                       │
│  1. useCallback/useMemo optimization (3 convos)      │
│  2. Custom hooks for data fetching (2 convos)        │
│  3. React Compiler auto-memoization (2 convos)       │
│                                                       │
│  KEY INSIGHT: Your approach shifted from manual       │
│  memoization → investigating React Compiler after    │
│  reading the RFC on Feb 14.                          │
│                                                       │
│  📊 Total: 847 relevant ACUs │ 12 extracted memories │
└──────────────────────────────────────────────────────┘
```

---

#### STAGE 5a: The Context Engine — Overview (45s)

**Purpose**: Show the 8-layer context compilation system at a high level.

**Visual**: Vertical stack of 8 context layers, each expanding on hover/click to show contents and token budget.

```
┌─────────────────────────────────────────────────────────────────┐
│  CONTEXT COCKPIT                           Total: 8,192 tokens │
│                                                                 │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ L7: SYSTEM PROMPT          ████░░░░  512 / 1024 tokens│    │
│  ├────────────────────────────────────────────────────────┤    │
│  │ L6: USER PROFILE           ██░░░░░░  256 / 512 tokens │    │
│  ├────────────────────────────────────────────────────────┤    │
│  │ L5: ACTIVE MEMORIES        ██████░░  768 / 1024 tokens│    │
│  ├────────────────────────────────────────────────────────┤    │
│  │ L4: RELEVANT ACUS          ████████  2048 / 2048 tkns │    │
│  ├────────────────────────────────────────────────────────┤    │
│  │ L3: TOPIC CONTEXT          ███░░░░░  384 / 512 tokens │    │
│  ├────────────────────────────────────────────────────────┤    │
│  │ L2: CONVERSATION HISTORY   ██████░░  1536 / 2048 tkns │    │
│  ├────────────────────────────────────────────────────────┤    │
│  │ L1: RECENT MESSAGES        ████░░░░  512 / 1024 tokens│    │
│  ├────────────────────────────────────────────────────────┤    │
│  │ L0: CURRENT MESSAGE        █░░░░░░░  128 / 512 tokens │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                 │
│  CONTEXT QUALITY: ████████████████████░░  87%                  │
│  COHERENCE SCORE: ████████████████████████  96%                │
└─────────────────────────────────────────────────────────────────┘
```

**Animation**: Layers build from bottom (L0) to top (L7), each expanding with a slight delay. Token bars animate like progress fills. Quality/coherence scores count up.

---

#### STAGE 5b: Context Deep Dive (120s, optional branch)

**Purpose**: For technical audiences — show exactly how context is compiled and injected.

**Visual**: Split screen. Left: conversation interface. Right: live context compilation panel. As user sends a message, the right panel shows each layer activating in real-time, with the final compiled context appearing as formatted text.

**Demo Interaction**: User sends "How should I handle error boundaries with the new React Compiler?" The right panel shows:

1. **L0 activates**: Current message parsed → intent: "error handling + React Compiler"
2. **L1 activates**: Last 5 messages from this conversation loaded
3. **L2 activates**: Full conversation history summarized
4. **L3 activates**: Topic "React" profile loaded (user's expertise level: advanced)
5. **L4 activates**: 3 relevant ACUs retrieved via semantic search
6. **L5 activates**: 2 memories: "Prefers TypeScript", "Uses Next.js 15"
7. **L6 activates**: User profile: Senior developer, 8 YOE
8. **L7 activates**: System prompt with VIVIM instructions

Each layer highlights with a glow effect and shows the tokens being added. Final compilation shows the full context payload.

---

#### STAGE 6: The Memories (45s)

**Purpose**: Show VIVIM's memory extraction and management.

**Visual**: 4-column dashboard of memory types with cards.

```
┌─────────────────────────────────────────────────────────────────┐
│  MEMORY DASHBOARD                          Total: 156 memories │
│                                                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐      │
│  │ FACTUAL  │  │PREFERENCE│  │ EPISODIC │  │RELATION- │      │
│  │          │  │          │  │          │  │  SHIP    │      │
│  │    47    │  │    38    │  │    52    │  │    19    │      │
│  │ memories │  │ memories │  │ memories │  │ memories │      │
│  ├──────────┤  ├──────────┤  ├──────────┤  ├──────────┤      │
│  │ "Uses    │  │ "Prefers │  │ "Debugged│  │ "Works   │      │
│  │  Next.js │  │  Tailwind│  │  prod    │  │  with    │      │
│  │  15 with │  │  over    │  │  outage  │  │  Sarah   │      │
│  │  App     │  │  styled- │  │  on Mar  │  │  on ML   │      │
│  │  Router" │  │  comps"  │  │  5th"    │  │  project"│      │
│  │          │  │          │  │          │  │          │      │
│  │ 🔒 0.94  │  │ 🔒 0.87  │  │ 🔒 0.91  │  │ 🔒 0.78  │      │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘      │
│                                                                 │
│  LIVE EXTRACTION:                                               │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  From latest conversation: "React Compiler migration"   │   │
│  │  ✨ Extracting... "User is migrating from Next.js 14   │   │
│  │     to 15" ✅ Confidence: 0.92                          │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

**Animation**: Memory cards fade in with stagger. Live extraction shows typing animation for the memory text, then checkmark confirmation. Confidence score animates from 0 to final value.

---

#### STAGE 7: The Sharing & Social Layer (45s)

**Purpose**: Show controlled knowledge sharing.

**Visual**: Shows creation of a shareable knowledge link with granular permissions.

```
┌─────────────────────────────────────────────────────────────────┐
│  SHARE KNOWLEDGE                                                │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  📤 CREATING KNOWLEDGE PULSE                            │   │
│  │                                                         │   │
│  │  Content: "React Performance Optimization Guide"        │   │
│  │  Sources: 7 conversations, 23 ACUs, 4 memories         │   │
│  │                                                         │   │
│  │  PERMISSIONS:                                           │   │
│  │  ┌─────────┬──────────────────────────────────┐        │   │
│  │  │ View    │ ████████████████████ Engineering │        │   │
│  │  │ Remix   │ ████████░░░░░░░░░░ Senior only  │        │   │
│  │  │ Export  │ ████░░░░░░░░░░░░░░ Admin only   │        │   │
│  │  └─────────┴──────────────────────────────────┘        │   │
│  │                                                         │   │
│  │  ENCRYPTION: AES-256-GCM ✅                            │   │
│  │  EXPIRY: 30 days                                        │   │
│  │  LINK: vivim.app/share/kp_7x9f... 📋                  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  CIRCLE ACTIVITY:                                               │
│  ┌──────┐ ┌──────┐ ┌──────┐                                   │
│  │ Eng  │ │ ML   │ │Design│                                   │
│  │Team  │ │ Lab  │ │ Team │                                   │
│  │ 12👤 │ │ 5👤  │ │ 8👤  │                                   │
│  │ 3 new│ │ 1 new│ │ 0 new│                                   │
│  └──────┘ └──────┘ └──────┘                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

#### FINALE: Call to Action + Impact Metrics (30s)

**Purpose**: Summarize value delivered; drive conversion.

**Visual**: Full-screen with animated impact metrics and CTA.

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│          YOUR AI MIND. UNIFIED. REMEMBERING. YOURS.            │
│                                                                 │
│       ┌──────────┐  ┌──────────┐  ┌──────────┐                │
│       │ 847      │  │ 5,200    │  │ 156      │                │
│       │ CONVOS   │  │ ACUs     │  │ MEMORIES │                │
│       │ unified  │  │ indexed  │  │ learned  │                │
│       └──────────┘  └──────────┘  └──────────┘                │
│                                                                 │
│       ┌──────────┐  ┌──────────┐  ┌──────────┐                │
│       │ 9        │  │ 3.2 hrs  │  │ 87%      │                │
│       │ PROVIDERS│  │ SAVED    │  │ CONTEXT  │                │
│       │ connected│  │ per week │  │ quality  │                │
│       └──────────┘  └──────────┘  └──────────┘                │
│                                                                 │
│              ┌──────────────────────────────┐                   │
│              │   START YOUR FREE TRIAL →    │                   │
│              └──────────────────────────────┘                   │
│                                                                 │
│              "Join 10,000+ AI power users"                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Animation**: Numbers count up from 0. Each metric card has a subtle floating animation. CTA button has a pulsing glow. Background has subtle particle effect.

---

### 4.4 Demo Modes (Enhanced)

| Mode | Behavior | Navigation | Controls | Use Case |
|------|----------|------------|----------|----------|
| **Guided (Movie)** | Auto-advances with timed transitions | Automatic; branching follows default path | Play/Pause only | Trade shows on loop, video recording |
| **Interactive** | User-paced; click to advance | Click/tap; branch choices presented | Next/Back/Branch | Website embed, self-serve PLG |
| **Presenter** | Presenter has full control via hidden panel | Keyboard shortcuts; jump anywhere | Full control panel | Sales calls, investor meetings, Q&A |
| **Sandbox** | All data loaded; no narrative; full app | Standard app navigation | None (standard app UI) | Free trial equivalent, evaluation |
| **Kiosk** | Loop mode with touch interaction; auto-reset after idle | Touch-optimized; large targets | Auto-reset timer | Trade show booths |

---

## 5. Mock Data Strategy (Enhanced)

### 5.1 Data Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                     MOCK DATA ARCHITECTURE                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  SEED LAYER (Hand-crafted, narrative-critical)              │   │
│  │  • 10 hero conversations (1 per stage highlight)            │   │
│  │  • 3 persona profiles with complete backstories             │   │
│  │  • Key memories that drive the narrative                    │   │
│  │  • Search results for demo queries                          │   │
│  └──────────────────────────┬──────────────────────────────────┘   │
│                              │                                      │
│  ┌──────────────────────────▼──────────────────────────────────┐   │
│  │  GENERATED LAYER (Faker.js, statistically realistic)        │   │
│  │  • 840+ filler conversations (realistic distribution)       │   │
│  │  • 5,000+ ACUs with quality scores                         │   │
│  │  • 150+ memories across 4 types                            │   │
│  │  • Topic/entity profiles with mention counts               │   │
│  │  • Social graph (friends, circles, shares)                 │   │
│  └──────────────────────────┬──────────────────────────────────┘   │
│                              │                                      │
│  ┌──────────────────────────▼──────────────────────────────────┐   │
│  │  DERIVED LAYER (Computed from seed + generated)             │   │
│  │  • Search indices (pre-computed relevance scores)           │   │
│  │  • Knowledge graph edges (pre-computed relationships)       │   │
│  │  • Context compilations (pre-computed for demo queries)     │   │
│  │  • Analytics/metrics (aggregated statistics)                │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 5.2 Conversation Distribution (Statistically Realistic)

| Provider | Conv Count | % of Total | Avg Messages | Content Focus |
|----------|-----------|------------|--------------|---------------|
| ChatGPT | 247 | 29% | 18 | Coding, writing, general Q&A |
| Claude | 178 | 21% | 24 | Analysis, writing, code review |
| Gemini | 124 | 15% | 14 | Research, summaries, planning |
| DeepSeek | 89 | 11% | 22 | Deep coding, algorithms |
| Grok | 56 | 7% | 12 | News, humor, quick questions |
| Kimi | 45 | 5% | 16 | Document analysis, reading |
| Mistral | 38 | 4% | 20 | Multilingual, code generation |
| Qwen | 35 | 4% | 15 | Translation, Chinese tech |
| Z.AI | 35 | 4% | 13 | Experimental, creative |
| **Total** | **847** | **100%** | **17 avg** | |

### 5.3 Temporal Distribution

Conversations span **6 months** (September 2025 – March 2026) with realistic patterns:

```
Conversations per week:
Mon ████████████████ 38
Tue ██████████████████ 42
Wed █████████████████ 40
Thu ████████████████████ 45
Fri ██████████████ 32
Sat ████████ 18
Sun ██████ 14

Time of day:
06-09 ██████ 12%
09-12 ████████████████████ 28%
12-14 ████████████ 16%
14-18 ██████████████████ 24%
18-21 ██████████ 14%
21-00 ██████ 8%
```

### 5.4 Seed Conversation Examples

#### Hero Conversation 1: "Debugging useEffect Infinite Loop" (ChatGPT)

```json
{
  "id": "conv_seed_001",
  "provider": "chatgpt",
  "title": "Debugging React useEffect infinite loop in production",
  "created_at": "2025-11-14T14:23:00Z",
  "updated_at": "2025-11-14T15:45:00Z",
  "message_count": 28,
  "total_tokens": 6840,
  "tags": ["react", "debugging", "production", "useEffect"],
  "quality_score": 0.92,
  "messages": [
    {
      "role": "user",
      "content": "I'm seeing an infinite re-render loop in production but not in development. The component uses useEffect with a dependency array that includes an object from context. Here's the code:\n\n```tsx\nconst UserDashboard = () => {\n  const { user } = useAuth();\n  const [data, setData] = useState(null);\n\n  useEffect(() => {\n    fetchDashboard(user.id).then(setData);\n  }, [user]); // 🔴 This causes infinite loop\n\n  return <Dashboard data={data} />;\n};\n```\n\nIn dev mode with StrictMode it re-renders twice (expected) but in production it just keeps going. CPU hits 100%.",
      "timestamp": "2025-11-14T14:23:00Z",
      "token_count": 142
    },
    {
      "role": "assistant",
      "content": "Great catch — this is a classic React gotcha. The issue is **referential instability** of the `user` object...",
      "timestamp": "2025-11-14T14:23:08Z",
      "token_count": 580
    }
  ]
}
```

#### Hero Conversation 2: "HNSW Index Design for Embeddings" (Claude)

```json
{
  "id": "conv_seed_002",
  "provider": "claude",
  "title": "Designing HNSW index for 100M embedding vectors",
  "created_at": "2025-12-02T10:15:00Z",
  "message_count": 34,
  "total_tokens": 12400,
  "tags": ["vector-search", "HNSW", "system-design", "embeddings"],
  "quality_score": 0.96
}
```

### 5.5 Mock Data File Structure

```
packages/demo-engine/
├── data/
│   ├── seed/
│   │   ├── personas/
│   │   │   ├── alex-developer.json
│   │   │   ├── morgan-researcher.json
│   │   │   └── jordan-executive.json
│   │   │
│   │   ├── conversations/
│   │   │   ├── hero-001-useeffect-debug.json
│   │   │   ├── hero-002-hnsw-design.json
│   │   │   ├── hero-003-python-async.json
│   │   │   ├── hero-004-system-design.json
│   │   │   ├── hero-005-ml-pipeline.json
│   │   │   ├── hero-006-react-compiler.json
│   │   │   ├── hero-007-team-retro.json
│   │   │   ├── hero-008-paper-review.json
│   │   │   ├── hero-009-api-design.json
│   │   │   └── hero-010-career-advice.json
│   │   │
│   │   ├── memories/
│   │   │   ├── factual.json       # 47 factual memories
│   │   │   ├── preference.json    # 38 preference memories
│   │   │   ├── episodic.json      # 52 episodic memories
│   │   │   └── relationship.json  # 19 relationship memories
│   │   │
│   │   ├── search-results/
│   │   │   ├── react-hooks-performance.json
│   │   │   ├── python-async-patterns.json
│   │   │   └── system-design-scaling.json
│   │   │
│   │   └── context-compilations/
│   │       ├── react-compiler-query.json
│   │       └── ml-pipeline-query.json
│   │
│   ├── generators/
│   │   ├── conversationGenerator.ts
│   │   ├── acuGenerator.ts
│   │   ├── memoryGenerator.ts
│   │   ├── topicGenerator.ts
│   │   ├── entityGenerator.ts
│   │   ├── socialGenerator.ts
│   │   └── index.ts               # Orchestrator
│   │
│   └── generated/                  # .gitignored; built at build time
│       ├── conversations.json
│       ├── acus.json
│       ├── topics.json
│       ├── entities.json
│       ├── social-graph.json
│       └── manifest.json           # Generation metadata
│
├── mocks/
│   ├── handlers/
│   │   ├── conversations.ts
│   │   ├── search.ts
│   │   ├── memories.ts
│   │   ├── context.ts
│   │   ├── social.ts
│   │   ├── providers.ts
│   │   └── analytics.ts
│   │
│   ├── middleware/
│   │   ├── latencySimulator.ts     # Configurable delays
│   │   ├── errorSimulator.ts       # Optional error injection
│   │   └── loggingMiddleware.ts    # Debug logging
│   │
│   └── browser.ts                  # MSW browser setup
│
└── engine/
    ├── DemoStateMachine.ts          # XState machine definition
    ├── useDemoStore.ts              # Zustand store
    ├── stageDefinitions.ts          # Stage metadata
    ├── personaManager.ts            # Persona switching logic
    ├── transitionDirector.ts        # Animation choreography
    └── analyticsAdapter.ts          # Demo event tracking
```

---

## 6. Visual Excellence Strategy (Enhanced)

### 6.1 Design System Tokens for Demo

```css
/* Demo-specific design tokens */
:root {
  /* Cinematic background */
  --demo-bg-primary: #0a0a0f;
  --demo-bg-secondary: #12121a;
  --demo-bg-elevated: #1a1a2e;
  --demo-bg-glass: rgba(255, 255, 255, 0.03);

  /* Accent gradient */
  --demo-gradient-primary: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  --demo-gradient-success: linear-gradient(135deg, #10b981 0%, #059669 100%);
  --demo-gradient-vivim: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%);

  /* Glow effects */
  --demo-glow-primary: 0 0 20px rgba(99, 102, 241, 0.3);
  --demo-glow-success: 0 0 20px rgba(16, 185, 129, 0.3);

  /* Typography (cinematic) */
  --demo-font-display: 'Cal Sans', 'Inter', system-ui;
  --demo-font-body: 'Inter', system-ui;
  --demo-font-mono: 'JetBrains Mono', 'Fira Code', monospace;

  /* Spacing (generous for presentations) */
  --demo-space-stage-padding: 4rem;

  /* Animation tokens */
  --demo-ease-cinematic: cubic-bezier(0.16, 1, 0.3, 1);
  --demo-ease-bounce: cubic-bezier(0.34, 1.56, 0.64, 1);
  --demo-duration-fast: 200ms;
  --demo-duration-normal: 400ms;
  --demo-duration-slow: 800ms;
  --demo-duration-cinematic: 1200ms;
}
```

### 6.2 Provider Visual Identity System

| Provider | Primary | Secondary | Icon | Gradient |
|----------|---------|-----------|------|----------|
| ChatGPT | `#10A37F` | `#0D8C6C` | OpenAI logo | `linear-gradient(135deg, #10A37F, #0D8C6C)` |
| Claude | `#D97757` | `#C4623E` | Anthropic mark | `linear-gradient(135deg, #D97757, #C4623E)` |
| Gemini | `#8E8EF4` | `#6B6BE0` | Google Gemini | `linear-gradient(135deg, #8E8EF4, #6B6BE0)` |
| DeepSeek | `#3B82F6` | `#2563EB` | DS logo | `linear-gradient(135deg, #3B82F6, #2563EB)` |
| Grok | `#E5E5E5` | `#A3A3A3` | X/Grok mark | `linear-gradient(135deg, #E5E5E5, #A3A3A3)` |
| Kimi | `#FF6B9D` | `#E84D88` | Moonshot mark | `linear-gradient(135deg, #FF6B9D, #E84D88)` |
| Mistral | `#CB8CFF` | `#A855F7` | Mistral mark | `linear-gradient(135deg, #CB8CFF, #A855F7)` |
| Qwen | `#FF7F00` | `#E56B00` | Alibaba Cloud | `linear-gradient(135deg, #FF7F00, #E56B00)` |
| Z.AI | `#06B6D4` | `#0891B2` | Z.AI mark | `linear-gradient(135deg, #06B6D4, #0891B2)` |

### 6.3 Animation Choreography System

The demo uses a **centralized animation director** that ensures consistent timing across all stages.

```typescript
// transitionDirector.ts
export const choreography = {
  stageTransitions: {
    type: 'crossfade-slide',
    duration: 800,
    ease: [0.16, 1, 0.3, 1], // cinematic ease
    stagger: {
      children: 60,        // ms between child animations
      direction: 'bottom-to-top',
    },
  },

  microInteractions: {
    buttonHover: { scale: 1.02, duration: 150 },
    buttonPress: { scale: 0.98, duration: 100 },
    cardHover: { y: -2, shadow: 'lg', duration: 200 },
    tooltipIn: { opacity: 1, y: 0, duration: 150, delay: 400 },
  },

  dataAnimations: {
    counterUp: {
      duration: 1500,
      ease: 'easeOut',
      format: (n: number) => n.toLocaleString(),
    },
    progressFill: { duration: 1200, ease: [0.16, 1, 0.3, 1] },
    listStagger: { delayPerItem: 50, maxDelay: 500 },
    graphNodeEntry: { duration: 600, scale: [0, 1.1, 1], opacity: [0, 1] },
    graphEdgeDraw: { duration: 400, pathLength: [0, 1] },
  },

  providerConnection: {
    orbitIn: { duration: 500, ease: 'backOut' },
    lineDrawWithParticles: { duration: 800, particleCount: 12 },
    statusConfirmation: { scale: [1, 1.2, 1], duration: 400 },
  },
} as const;
```

### 6.4 Responsive Design Strategy

| Viewport | Layout | Navigation | Optimizations |
|----------|--------|------------|---------------|
| **4K (3840px+)** | Full cinematic; generous spacing | Floating controls | Full particle effects; max node count |
| **Desktop (1280–3839px)** | Standard; 2-column where needed | Sidebar + keyboard | Standard effects |
| **Tablet (768–1279px)** | Stacked; touch-optimized | Bottom nav bar + swipe | Reduced particles; simplified graph |
| **Kiosk (1080x1920, portrait)** | Portrait-optimized; card stack | Touch + auto-advance | Large touch targets (min 48px) |

---

## 7. Demo Control Panel (Enhanced)

### 7.1 Presenter Control Interface

Activated via `Ctrl/Cmd + Shift + D` (changed from simple `Cmd+D` to prevent conflicts with browser bookmark).

```
┌──────────────────────────────────────────────────────────────────────┐
│  VIVIM DEMO CONTROL CENTER                              × CLOSE    │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  MODE: [● Guided] [ Interactive] [ Presenter] [ Sandbox] [ Kiosk] │
│                                                                      │
│  STAGE NAVIGATION:                                                   │
│  ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐              │
│  │PS│ │S1│ │S2│ │3a│ │3b│ │S4│ │5a│ │5b│ │S6│ │S7│ │FN│           │
│  └──┘ └──┘ └──┘ └──┘ └──┘ └──┘ └──┘ └──┘ └──┘ └──┘ └──┘           │
│   ↑ current                                                          │
│                                                                      │
│  PERSONA: [● Alex] [ Morgan] [ Jordan]                             │
│                                                                      │
│  PLAYBACK:  ⏮  ◀  ▶  ⏭   Speed: [0.5x] [● 1x] [1.5x] [2x]     │
│                                                                      │
│  TIMING:  Stage 2/9  │  02:15 / 06:30  │  ▶ Playing                │
│                                                                      │
│  DATA OVERRIDES:                                                     │
│  ├── Conversation count: [847___] (editable)                        │
│  ├── Provider count:     [9______] (editable)                       │
│  └── Memory count:       [156____] (editable)                       │
│                                                                      │
│  FEATURES:                                                           │
│  [✓] Latency simulation   [ ] Error injection                      │
│  [✓] Sound effects         [✓] Particle effects                    │
│  [✓] Analytics tracking    [ ] Debug overlay                       │
│                                                                      │
│  QUICK ACTIONS:                                                      │
│  [Reset All] [Export State] [Copy Share Link] [Fullscreen]          │
│                                                                      │
│  KEYBOARD SHORTCUTS:                                                 │
│  Space: Play/Pause  │  →/←: Next/Prev  │  1-9: Jump to stage      │
│  R: Reset  │  F: Fullscreen  │  P: Cycle persona  │  S: Toggle sound│
│  Ctrl+Shift+D: Toggle panel  │  Esc: Close panel                   │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

### 7.2 Presenter HUD (Floating, Minimal)

Always visible in Presenter mode — minimal, non-distracting bar at bottom of screen:

```
┌──────────────────────────────────────────────────────────────────┐
│ 🎬 VIVIM Demo │ Alex │ Stage 4: Discovery │ ▶ │ 03:15 │ 4/9 │  │
└──────────────────────────────────────────────────────────────────┘
```

Opacity: 40% → 100% on hover. Position: bottom-center, floating above content. Can be dragged to any screen edge.

### 7.3 Emergency Recovery

If anything goes wrong during a live demo:

| Situation | Recovery | Shortcut |
|-----------|----------|----------|
| App freezes | Hard reset to Stage 1 | `Ctrl+Shift+R` |
| Data looks wrong | Reload seed data | `Ctrl+Shift+L` |
| Wrong persona | Instant switch (state preserved) | `P` |
| Need to skip ahead | Jump to any stage | `1-9` number keys |
| Need to go offline | All assets precached; works offline | Automatic |
| Projector resolution weird | Force responsive mode | `Ctrl+Shift+V` |

---

## 8. Analytics & Instrumentation

### 8.1 Event Taxonomy

Every demo interaction is tracked for product insights:

```typescript
// Demo analytics events
interface DemoEvent {
  // Lifecycle
  'demo.started': { persona: string; mode: DemoMode; source: string };
  'demo.completed': { persona: string; duration_ms: number; stages_visited: string[] };
  'demo.abandoned': { persona: string; last_stage: string; duration_ms: number };

  // Navigation
  'stage.entered': { stage: string; from_stage: string; method: 'auto' | 'click' | 'keyboard' };
  'stage.exited': { stage: string; duration_ms: number; interactions: number };
  'stage.branch_selected': { stage: string; branch: string };

  // Engagement
  'feature.explored': { feature: string; stage: string; depth: 'glance' | 'interact' | 'deep_dive' };
  'search.performed': { query: string; results_count: number };
  'canvas.interacted': { action: 'zoom' | 'pan' | 'click_node' | 'click_edge'; node_id?: string };
  'context.layer_expanded': { layer: number; layer_name: string };

  // Conversion
  'cta.clicked': { cta_type: string; stage: string };
  'share.link_generated': { source: 'demo' };

  // Presenter
  'control.action': { action: string; presenter_id?: string };
}
```

### 8.2 Engagement Scoring

Each demo session receives an **engagement score** (0–100) based on:

| Factor | Weight | Measurement |
|--------|--------|-------------|
| Completion rate | 30% | Stages visited / total stages |
| Interaction depth | 25% | Deep-dive branches taken |
| Dwell time | 20% | Time per stage (vs. expected) |
| Feature exploration | 15% | Interactive elements engaged |
| CTA interaction | 10% | Final CTA clicked/hovered |

---

## 9. Accessibility (WCAG 2.2 AA)

### 9.1 Requirements Matrix

| Criterion | Implementation | Testing |
|-----------|----------------|---------|
| **Color contrast** | All text ≥ 4.5:1 ratio; large text ≥ 3:1 | axe-core automated |
| **Keyboard navigation** | Full demo navigable via keyboard; visible focus indicators | Manual + Playwright |
| **Screen reader** | ARIA labels on all interactive elements; live regions for dynamic content | VoiceOver + NVDA testing |
| **Motion sensitivity** | Respect `prefers-reduced-motion`; disable non-essential animations | CSS media query + Framer Motion |
| **Focus management** | Focus trapped in modals; logical tab order; skip-to-content link | Manual testing |
| **Alt text** | All images/icons have descriptive alt text | eslint-plugin-jsx-a11y |
| **Timing** | No time-limited content in interactive mode; pause available in guided | Implementation |
| **Touch targets** | Minimum 44x44px for all interactive elements | Visual inspection |

### 9.2 Reduced Motion Mode

```typescript
// All animations respect user preference
const prefersReducedMotion = useReducedMotion(); // Framer Motion hook

const stageTransition = prefersReducedMotion
  ? { opacity: 1, transition: { duration: 0 } }
  : { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } };
```

---

## 10. Offline & PWA Strategy

### 10.1 Service Worker Caching

```typescript
// workbox-config.ts
export default {
  precacheManifest: [
    // All demo shell + stage components
    { url: '/demo/', revision: BUILD_HASH },
    { url: '/demo/stage/*', revision: BUILD_HASH },

    // All mock data
    { url: '/demo/data/seed/**/*.json', revision: DATA_HASH },
    { url: '/demo/data/generated/**/*.json', revision: DATA_HASH },

    // Fonts, icons, images
    { url: '/demo/assets/**/*', revision: ASSET_HASH },
  ],

  runtimeCaching: [
    {
      urlPattern: /\/api\//,  // MSW handles these, but cache fallback
      handler: 'NetworkFirst',
      options: { cacheName: 'demo-api-cache' },
    },
  ],
};
```

### 10.2 Offline Indicators

When offline, show subtle indicator: `📶 Running in offline mode — all features available`

---

## 11. Testing Strategy

### 11.1 Test Matrix

| Test Type | Tool | Coverage Target | Run Frequency |
|-----------|------|-----------------|---------------|
| **Unit** | Vitest | Demo engine: 95%, Generators: 90% | Every commit |
| **Component** | Testing Library | All stage components: 85% | Every commit |
| **Integration** | Playwright | Full demo flow (all personas × all modes): 100% | Every PR |
| **Visual regression** | Playwright screenshots | All stages at 3 viewports: 100% | Every PR |
| **Accessibility** | axe-core + Playwright | All stages: 0 violations | Every PR |
| **Performance** | Lighthouse CI | LCP < 1.5s, CLS < 0.1, FID < 100ms | Every PR |
| **Cross-browser** | Playwright | Chrome, Firefox, Safari, Edge | Weekly |
| **Load testing** | N/A (client-side only) | N/A | N/A |

### 11.2 Demo Smoke Test (Pre-Presentation)

Automated script that runs through every stage in every mode and verifies:
- No console errors
- All mock data loads
- All animations complete
- All keyboard shortcuts work
- All analytics events fire

```bash
# Run before any live demo
pnpm demo:smoke-test
# Output: ✅ All 47 checks passed. Demo is ready.
```

---

## 12. Implementation Roadmap (Enhanced)

### Phase 0: Setup (Days 1-2)

| Task | Owner | Deliverable | Done Criteria |
|------|-------|-------------|---------------|
| Create monorepo workspace `apps/demo` | Eng | Running Vite dev server at localhost:3001 | `pnpm dev:demo` works |
| Create `packages/demo-engine` | Eng | Package with exports | Import works from `apps/demo` |
| Set up MSW in demo app | Eng | Service worker intercepting `/api/*` | Console shows MSW active |
| Configure Cloudflare Pages deployment | DevOps | `demo.vivim.app` deploys on push | Deployed and accessible |
| Set up PostHog for demo analytics | Eng | Events flowing to dashboard | Test event visible |

### Phase 1: Data Foundation (Days 3-7)

| Task | Owner | Deliverable | Done Criteria |
|------|-------|-------------|---------------|
| Write 3 persona profiles | Content + Eng | JSON files with full backstories | Reviewed and approved |
| Write 10 hero conversations | Content + Eng | Rich JSON with realistic messages | Code snippets render; markdown works |
| Build conversation generator | Eng | Script generating 840+ conversations | `pnpm generate:data` produces valid JSON |
| Build ACU generator | Eng | 5,000+ ACUs with quality scores | Linked to conversations; quality distribution realistic |
| Build memory generator | Eng | 156 memories across 4 types | Tied to conversations; confidence scores varied |
| Build topic/entity generators | Eng | 50 topics, 300 entities | Mention counts match conversation data |
| Build social graph generator | Eng | Friends, circles, shares | Consistent relationships |
| Build MSW handlers for all endpoints | Eng | Full API mock coverage | All production API routes handled |
| Implement latency simulator | Eng | Configurable delays | 300-800ms delays; P95 realistic |

### Phase 2: Demo Engine (Days 8-14)

| Task | Owner | Deliverable | Done Criteria |
|------|-------|-------------|---------------|
| Define XState machine for demo flow | Eng | State machine with all stages, modes, branches | Visualizable in XState inspector; no impossible states |
| Build Zustand demo store | Eng | `useDemoStore` with full state | Persona, stage, mode, data accessible |
| Build DemoPlayer shell component | Eng | Container with stage routing | Stage components mount/unmount correctly |
| Implement all 5 demo modes | Eng | Guided, Interactive, Presenter, Sandbox, Kiosk | Each mode behavior verified |
| Build stage transition system | Eng | Framer Motion transitions between stages | Smooth crossfade-slide; no jank |
| Build persona switching | Eng | Instant persona change with data swap | All data updates; UI reflects persona |
| Build time travel controller | Eng | Jump to any stage; state consistent | Forward and backward jumps work |

### Phase 3: Stage Implementation (Days 15-25)

| Task | Owner | Deliverable | Done Criteria |
|------|-------|-------------|---------------|
| Stage 0: Persona Selection | Eng + Design | Interactive persona picker | Click selects; keyboard works; auto-select in guided |
| Stage 1: The Problem | Eng + Design | Animated chaos visualization | Browser tabs; stat callouts; per-persona variations |
| Stage 2: The Capture | Eng + Design | Provider connection animation | Sequential connection; particle trails; progress bar |
| Stage 3a: Archive Views | Eng + Design | 4-view switcher with morphing transitions | List → Grid → Canvas → Timeline all work |
| Stage 3b: Canvas Deep Dive | Eng + Design | React Flow knowledge graph | Nodes, edges, clusters, minimap, click-to-preview |
| Stage 4: Discovery | Eng + Design | Search with auto-typing and AI synthesis | Results appear; synthesis panel slides in |
| Stage 5a: Context Overview | Eng + Design | 8-layer visualization | Animated layer build; token bars; quality scores |
| Stage 5b: Context Deep Dive | Eng + Design | Live context compilation | Split screen; layer-by-layer activation |
| Stage 6: Memories | Eng + Design | 4-type memory dashboard | Cards with stagger; live extraction animation |
| Stage 7: Sharing | Eng + Design | Knowledge pulse creation flow | Permission sliders; encryption badge; share link |
| Finale: CTA | Eng + Design | Impact metrics + conversion | Counter animations; CTA button glow |

### Phase 4: Control Panel & Polish (Days 26-32)

| Task | Owner | Deliverable | Done Criteria |
|------|-------|-------------|---------------|
| Build presenter control panel | Eng | Full control interface | All features functional; keyboard shortcuts work |
| Build presenter HUD | Eng | Floating minimal bar | Draggable; opacity control; non-distracting |
| Implement all keyboard shortcuts | Eng | 15+ shortcuts | Cheat sheet accessible; no conflicts |
| Add sound effects (optional) | Design + Eng | Ambient + transition sounds | Toggle-able; volume control; muted by default |
| Implement `prefers-reduced-motion` | Eng | All animations respect preference | Verified with system setting |
| Accessibility audit | QA | axe-core report with 0 violations | All stages pass |
| Performance optimization | Eng | Lighthouse scores: 95+ Performance | LCP < 1.5s, CLS < 0.1 |
| Cross-browser testing | QA | Chrome, Firefox, Safari, Edge verified | No visual regressions |

### Phase 5: Testing & Hardening (Days 33-37)

| Task | Owner | Deliverable | Done Criteria |
|------|-------|-------------|---------------|
| Write Playwright E2E tests | QA + Eng | Full flow coverage for all personas × modes | CI green |
| Visual regression baseline | QA | Screenshot snapshots for all stages × 3 viewports | Baseline committed |
| Build smoke test script | Eng | `pnpm demo:smoke-test` | 47+ checks pass |
| Internal demo walkthroughs (3 sessions) | Team | Feedback collected and addressed | 0 blockers remaining |
| Live demo rehearsals (2 sessions) | Presenter + Eng | Timing refined; recovery procedures tested | Presenter confident |
| Write presenter guide | Content | PDF/notion doc with stage notes, talking points, shortcuts | Reviewed and approved |
| Edge case hardening | Eng | Random click testing; resize testing; offline testing | No crashes |
| PWA verification | Eng | Offline mode fully functional | Airplane mode test passes |
| Final performance pass | Eng | No frame drops during transitions | DevTools Performance tab clean |

### Phase 6: Launch (Day 38-40)

| Task | Owner | Deliverable | Done Criteria |
|------|-------|-------------|---------------|
| Deploy to `demo.vivim.app` | DevOps | Production deployment | Accessible globally |
| Set up analytics dashboards | Eng | PostHog dashboard for demo metrics | Engagement scores visible |
| Create demo share links | Marketing | Unique links for different audiences | UTM tracking works |
| Record video walkthrough | Marketing + Eng | 5-minute video of guided demo | Uploaded to asset library |
| Team training | Eng + Sales | All presenters trained | Each presenter completes solo demo |

---

## 13. File Structure (Complete)

```
vivim/
├── apps/
│   ├── web/                          # Production app (unchanged)
│   │
│   └── demo/                         # Demo application ← NEW
│       ├── public/
│       │   ├── mockServiceWorker.js   # MSW service worker
│       │   ├── manifest.json          # PWA manifest
│       │   └── icons/                 # PWA icons
│       │
│       ├── src/
│       │   ├── main.tsx               # Entry point (demo mode bootstrap)
│       │   ├── App.tsx                # Root with demo provider
│       │   │
│       │   ├── stages/
│       │   │   ├── Stage0_PersonaSelect.tsx
│       │   │   ├── Stage1_TheProblem.tsx
│       │   │   ├── Stage2_TheCapture.tsx
│       │   │   ├── Stage3a_ArchiveViews.tsx
│       │   │   ├── Stage3b_CanvasDeepDive.tsx
│       │   │   ├── Stage4_Discovery.tsx
│       │   │   ├── Stage5a_ContextOverview.tsx
│       │   │   ├── Stage5b_ContextDeepDive.tsx
│       │   │   ├── Stage6_Memories.tsx
│       │   │   ├── Stage7_Sharing.tsx
│       │   │   ├── Finale_CTA.tsx
│       │   │   └── index.ts
│       │   │
│       │   ├── components/
│       │   │   ├── DemoPlayer.tsx          # Main orchestrator
│       │   │   ├── DemoControlPanel.tsx    # Presenter controls
│       │   │   ├── PresenterHUD.tsx        # Floating HUD
│       │   │   ├── StageTransition.tsx     # Transition wrapper
│       │   │   ├── PersonaCard.tsx         # Persona selection card
│       │   │   ├── ProviderIcon.tsx        # Provider with color
│       │   │   ├── AnimatedCounter.tsx     # Number count-up
│       │   │   ├── ContextLayerViz.tsx     # 8-layer diagram
│       │   │   ├── MemoryCard.tsx          # Memory type card
│       │   │   ├── SearchResultItem.tsx    # Search result
│       │   │   ├── KnowledgeGraph.tsx      # React Flow wrapper
│       │   │   ├── ParticleBackground.tsx  # Ambient particles
│       │   │   └── shared/
│       │   │       ├── GlowButton.tsx
│       │   │       ├── StatCallout.tsx
│       │   │       ├── ProgressBar.tsx
│       │   │       └── TypeWriter.tsx       # Typing animation
│       │   │
│       │   ├── hooks/
│       │   │   ├── useDemo.ts              # Core demo hook
│       │   │   ├── useDemoKeyboard.ts      # Keyboard shortcuts
│       │   │   ├── useDemoAnalytics.ts     # Analytics hook
│       │   │   ├── useStageTimer.ts        # Stage timing
│       │   │   ├── useAutoType.ts          # Auto-typing effect
│       │   │   └── usePresenterMode.ts     # Presenter features
│       │   │
│       │   ├── styles/
│       │   │   ├── demo-tokens.css         # Design tokens
│       │   │   ├── demo-animations.css     # Keyframes
│       │   │   └── demo-overrides.css      # Component overrides
│       │   │
│       │   └── utils/
│       │       ├── demoConfig.ts            # Environment config
│       │       └── shareLink.ts             # Demo share URL generation
│       │
│       ├── index.html
│       ├── vite.config.ts
│       ├── tailwind.config.ts
│       ├── tsconfig.json
│       └── package.json
│
├── packages/
│   ├── ui/                            # Shared (existing)
│   ├── core/                          # Shared (existing)
│   │
│   └── demo-engine/                   # Demo engine package ← NEW
│       ├── src/
│       │   ├── machine/
│       │   │   ├── demoMachine.ts         # XState state machine
│       │   │   ├── demoMachine.typegen.ts # Generated types
│       │   │   └── guards.ts              # State machine guards
│       │   │
│       │   ├── store/
│       │   │   ├── demoStore.ts           # Zustand store
│       │   │   └── types.ts              # Store types
│       │   │
│       │   ├── data/
│       │   │   ├── seed/                  # (as detailed in §5.5)
│       │   │   ├── generators/            # (as detailed in §5.5)
│       │   │   └── generated/             # .gitignored
│       │   │
│       │   ├── mocks/
│       │   │   ├── handlers/              # (as detailed in §5.5)
│       │   │   ├── middleware/             # (as detailed in §5.5)
│       │   │   └── browser.ts
│       │   │
│       │   ├── choreography/
│       │   │   ├── transitionDirector.ts   # Animation specs
│       │   │   ├── audioDirector.ts        # Sound cues
│       │   │   └── timingPresets.ts        # Timing configurations
│       │   │
│       │   ├── analytics/
│       │   │   ├── adapter.ts              # PostHog adapter
│       │   │   ├── events.ts              # Event type definitions
│       │   │   └── engagementScorer.ts    # Engagement calculation
│       │   │
│       │   └── index.ts                   # Public API
│       │
│       ├── scripts/
│       │   ├── generate-data.ts           # Data generation script
│       │   └── smoke-test.ts              # Pre-demo verification
│       │
│       ├── tsconfig.json
│       └── package.json
│
├── turbo.json                          # Updated with demo tasks
├── .github/
│   └── workflows/
│       └── demo-ci.yml                 # Demo-specific CI pipeline
│
└── docs/
    ├── demo-plan.md                    # This document
    └── presenter-guide.md              # Live demo guide
```

---

## 14. Key Risks & Mitigations (Enhanced)

| # | Risk | Likelihood | Impact | Mitigation | Owner |
|---|------|------------|--------|------------|-------|
| 1 | **Mock data feels fake** | Medium | High | Hand-craft seed data with real conversation patterns; use realistic code snippets from open-source repos; peer review | Content + Eng |
| 2 | **Demo drifts from product** | High | Medium | Automated sync check: CI job compares demo API contract with production API types; quarterly review | Eng |
| 3 | **Presenter forgets shortcuts** | Medium | Low | HUD always visible; printed quick-reference card; pre-demo smoke test | Presenter + Eng |
| 4 | **Performance issues with React Flow** | Medium | High | Virtualize nodes beyond viewport; limit visible nodes to 200; lazy-load edge data; test with 1000+ nodes | Eng |
| 5 | **Demo breaks during live presentation** | Low | Critical | PWA offline mode; emergency recovery shortcuts; fallback to video recording; presenter training | Eng + Presenter |
| 6 | **Analytics overwhelm with demo traffic** | Low | Low | Separate PostHog project for demo; filter demo events from product analytics | Eng |
| 7 | **Demo link shared publicly before ready** | Medium | Medium | Password protection option; `x-demo-token` header; private Cloudflare Access rules | DevOps |
| 8 | **Browser compatibility issues** | Medium | Medium | Playwright cross-browser tests in CI; progressive enhancement; graceful degradation | QA |
| 9 | **Accessibility failures in animations** | Medium | High | `prefers-reduced-motion` respected everywhere; automated axe-core in CI; manual screen reader testing | Eng + QA |
| 10 | **Demo too long for audience** | Medium | Medium | Branching DAG allows skipping; per-persona timing; presenter can jump stages | Content |

---

## 15. Success Metrics (Enhanced)

### 15.1 Technical Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Initial load (LCP)** | < 1.5s | Lighthouse CI |
| **Time to interactive** | < 2.0s | Lighthouse CI |
| **Stage transition** | < 16ms frame budget (60fps) | DevTools Performance |
| **Total bundle size** | < 800 KB gzipped | Build output |
| **Accessibility score** | 100 (axe-core) | CI check |
| **Cross-browser support** | Chrome, Firefox, Safari, Edge (last 2 versions) | Playwright |
| **Offline capability** | Full functionality | Manual test |

### 15.2 Demo Effectiveness Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Completion rate (guided)** | > 80% reach Finale | PostHog funnel |
| **Average engagement score** | > 65 / 100 | Engagement scorer |
| **Feature exploration depth** | > 3 deep-dives per session | PostHog events |
| **CTA click-through** | > 25% of completions | PostHog conversion |
| **Live demo success rate** | 100% (0 technical failures) | Presenter feedback |
| **Demo session duration** | 5-7 minutes (guided), 8-15 minutes (interactive) | PostHog timing |

### 15.3 Business Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Sales cycle influence** | Demo shown in > 80% of won deals | CRM tracking |
| **Investor engagement** | 3+ follow-up questions triggered by demo features | Meeting notes |
| **PLG activation** | > 15% of demo viewers start free trial | UTM tracking |
| **Share virality** | > 10% of demo viewers share demo link | Share tracking |

---

## 16. Maintenance & Versioning

### 16.1 Release Calendar

| Version | Release | Focus |
|---------|---------|-------|
| `demo@1.0.0` | Week 8 | Full 7-stage demo; Alex persona; 3 modes |
| `demo@1.1.0` | Week 10 | Morgan + Jordan personas; Kiosk mode |
| `demo@1.2.0` | Week 12 | Sound design; 3D knowledge graph option |
| `demo@2.0.0` | Quarter +1 | Sync with product v2 features; new stages |

### 16.2 Update Protocol

1. **Weekly**: Regenerate mock data if conversation patterns change
2. **Bi-weekly**: Sync demo API contract with production API types
3. **Monthly**: Review analytics; adjust stage timing based on engagement data
4. **Quarterly**: Major update; align with product roadmap

---

## 17. Appendix

### A. Keyboard Shortcut Reference Card

```
╔══════════════════════════════════════════════════╗
║            VIVIM DEMO — QUICK REFERENCE          ║
╠══════════════════════════════════════════════════╣
║                                                  ║
║  NAVIGATION                                      ║
║  Space ............ Play / Pause                 ║
║  → ................ Next stage                   ║
║  ← ................ Previous stage               ║
║  1-9 .............. Jump to stage                ║
║  Home ............. First stage                   ║
║  End .............. Finale                        ║
║                                                  ║
║  CONTROLS                                        ║
║  Ctrl+Shift+D ..... Toggle control panel         ║
║  R ................ Reset demo                   ║
║  F ................ Toggle fullscreen            ║
║  P ................ Cycle persona                ║
║  S ................ Toggle sound                 ║
║  M ................ Cycle mode                   ║
║  O ................ Toggle data override         ║
║                                                  ║
║  EMERGENCY                                       ║
║  Ctrl+Shift+R ..... Hard reset                   ║
║  Ctrl+Shift+L ..... Reload seed data             ║
║  Ctrl+Shift+V ..... Force responsive mode        ║
║  Esc .............. Close any overlay             ║
║                                                  ║
╚══════════════════════════════════════════════════╝
```

### B. Provider API Mock Contract

Each provider mock handler follows the production API shape:

```typescript
// Example: GET /api/conversations
interface ConversationListResponse {
  data: Conversation[];
  pagination: {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
  };
  meta: {
    provider_breakdown: Record<Provider, number>;
    date_range: { from: string; to: string };
  };
}
```

### C. XState Machine Definition (Simplified)

```typescript
import { createMachine } from 'xstate';

export const demoMachine = createMachine({
  id: 'vivimDemo',
  initial: 'idle',
  context: {
    persona: null,
    currentStage: null,
    mode: 'interactive',
    stagesVisited: [],
    startedAt: null,
    analytics: { engagementScore: 0, interactions: 0 },
  },
  states: {
    idle: {
      on: { START: 'personaSelection' },
    },
    personaSelection: {
      on: {
        SELECT_PERSONA: { target: 'stage1', actions: 'setPersona' },
        AUTO_SELECT: { target: 'stage1', actions: 'setDefaultPersona' },
      },
    },
    stage1: {
      entry: ['trackStageEntry', 'startStageTimer'],
      exit: ['trackStageExit'],
      on: {
        NEXT: 'stage2',
        JUMP: { target: '#vivimDemo.stage*', actions: 'jumpToStage' },
      },
    },
    stage2: {
      entry: ['trackStageEntry', 'startStageTimer'],
      exit: ['trackStageExit'],
      on: {
        NEXT: 'stage3',
        JUMP: { target: '#vivimDemo.stage*', actions: 'jumpToStage' },
      },
    },
    stage3: {
      initial: 'archiveViews',
      states: {
        archiveViews: {
          on: { DEEP_DIVE: 'canvasDeepDive', NEXT: '#vivimDemo.stage4' },
        },
        canvasDeepDive: {
          on: { BACK: 'archiveViews', NEXT: '#vivimDemo.stage4' },
        },
      },
    },
    stage4: { /* ... */ },
    stage5: {
      initial: 'overview',
      states: {
        overview: {
          on: { DEEP_DIVE: 'deepDive', NEXT: '#vivimDemo.stage6' },
        },
        deepDive: {
          on: { BACK: 'overview', NEXT: '#vivimDemo.stage6' },
        },
      },
    },
    stage6: { /* ... */ },
    stage7: { /* ... */ },
    finale: {
      entry: ['trackCompletion', 'calculateEngagementScore'],
      on: {
        RESTART: 'personaSelection',
        CTA_CLICK: { actions: 'trackConversion' },
      },
    },
  },
  on: {
    RESET: { target: 'idle', actions: 'resetContext' },
    CHANGE_PERSONA: { actions: 'switchPersona' },
    CHANGE_MODE: { actions: 'switchMode' },
  },
});
```

---

*Document Version: 2.0*
*Created: 2025-03-17*
*Last Updated: 2025-03-17*
*Owner: VIVIM Engineering*
*Status: Ready for Implementation Review*
*Next Review: Pre-Phase 0 kickoff*
