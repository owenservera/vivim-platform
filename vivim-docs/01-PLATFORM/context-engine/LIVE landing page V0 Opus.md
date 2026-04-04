

# VIVIM Website Strategy: The Complete Playbook

## Applying Every 2026 Trend to Your Specific Product, Audience, and Technical Story

---

## Part 0: Why This Document Exists

You have an extraordinarily ambitious product. An 8-layer context engine, quantum-resistant cryptography, per-user isolated databases, CRDT sync, universal extraction across 9 providers, a novel ACU segmentation system. The technical depth is real.

**The problem:** None of that matters if your website can't communicate it in 8 seconds.

Your current position creates a specific tension. You have deep infrastructure and zero public traction. You have genuine IP and no social proof. You have a category-defining vision and an audience that's never heard of "AI memory platforms." Your website must resolve all of these tensions simultaneously, converting five radically different visitor types through a single scrollable experience.

This document translates every trend from the 2026 playbook into VIVIM-specific decisions, with concrete copy, interaction designs, technical implementation guidance, and anti-patterns calibrated to your exact situation.

---

## Part 1: VIVIM's Attention Architecture

### Your Visitor Profiles (Ordered by Priority for Pre-Seed)

| Visitor | How They Arrive | What They Need in 8 Seconds | What Converts Them | Biggest Objection |
|---|---|---|---|---|
| **AI Power User** (primary) | Product Hunt, Hacker News, Twitter/X thread | "I can finally search my old ChatGPT conversations" | Live demo of import + search | "Is this safe? Will it read my private conversations?" |
| **Developer** | GitHub repo, HN comments, dev Twitter | "The architecture is real, the API is clean" | Docs quality, open-source repo link, SDK preview | "Is this vaporware? Show me the code." |
| **VC / Angel** | Cold outreach, referral, Twitter profile link | "This is a real category with a real moat" | Vision narrative + technical depth + market size | "Why won't ChatGPT/Anthropic just build this?" |
| **Potential Hire** | LinkedIn, AngelList, founder's network | "These people are building something I want to work on" | Technical ambition, design taste, founder story | "Is this funded? Will it survive 18 months?" |
| **Enterprise Buyer** (later) | Google search, analyst report, referral | "Self-hosted, compliant, secure" | Architecture diagram, security page, compliance badges | "Can we control our data completely?" |

### The Critical Insight for VIVIM

Your **AI Power User** is your growth engine. They're the person who has 400+ ChatGPT conversations, uses Claude for code review, tries Gemini for research, and has never been able to search across all of them. They don't know they need VIVIM until they *see* it working.

This means your website's #1 job is **instant product recognition**: the visitor must see their own pain reflected back at them within 3 seconds, and see the solution demonstrated within 15 seconds.

Your #2 job is **developer trust**: because your audience skews technical, the quality of your docs, your open-source posture, and the visible sophistication of your architecture are all conversion signals.

Your #3 job is **investor narrative**: the scrollytelling must build a case for why this is a $10B+ category that a well-funded incumbent can't simply copy.

### The Attention Curve for VIVIM Specifically

```
0-3 sec:   "Oh — this is about owning my AI conversations"
           (Hero headline + visual of scattered provider logos → unified archive)

3-8 sec:   "Wait, it works across ChatGPT AND Claude AND Gemini?"
           (Provider logo bar animates, import flow previewed)

8-30 sec:  "Let me try this" OR "Show me the architecture"
           (Two paths diverge: Demo for users, Docs/GitHub for developers)

30-90 sec: User is inside the demo, searching their mock archive
           OR developer is scanning your API reference
           OR investor is scrolling through the vision narrative

90+ sec:   Deep engagement — they're on the waitlist, starring the repo,
           or bookmarking the docs
```

---

## Part 2: The Hero Section — Your 3-Second Pitch

### The Concept: Scattered → Unified

Your hero must visualize the **core pain** and the **core solution** in a single animated moment.

**The animation:**

```
State 1 (page load):
  9 provider logos (ChatGPT, Claude, Gemini, Perplexity, etc.)
  scattered randomly across the hero area, slightly transparent,
  with faint conversation snippets floating near each one.
  Feels: chaotic, fragmented, lost.

State 2 (0.8s after load, auto-triggered):
  Logos and conversations smoothly converge toward center,
  morphing into a unified VIVIM archive interface —
  a clean, searchable, organized knowledge base.
  Feels: relief, control, power.

State 3 (settled):
  The unified archive is now interactive.
  A search bar pulses subtly. A cursor appears and types
  "that React pattern from last month" — results appear instantly.
  Feels: "I need this."
```

### The Copy

```
HEADLINE (Display, 72-96px):
Own every conversation you've ever had with AI.

SUBHEADLINE (Body, 20px, 60% opacity):
Import from ChatGPT, Claude, Gemini, and 6 more.
Search, organize, and share — your intelligence, your rules.

CTA PRIMARY:
Try the Demo ↓

CTA SECONDARY:
View on GitHub →
```

**Why this copy works for VIVIM specifically:**
- "Own" is your philosophical anchor and your product differentiator
- "every conversation you've ever had with AI" scopes the product clearly — this isn't a notes app, it's a conversation archive
- The provider names create instant recognition ("I use those!")
- "your intelligence, your rules" reinforces the ownership thesis without being preachy
- Two CTAs serve two audiences: demo for users, GitHub for developers

### Alternative Headlines (A/B Test These)

```
Option B: "Your AI conversations are scattered across 9 apps. We fix that."
  (Problem-first, more concrete, slightly less aspirational)

Option C: "Search every AI conversation you've ever had. From any provider."
  (Feature-first, very clear, appeals to the power user pain)

Option D: "The home for your AI intelligence."
  (Category-defining, short, works if you have enough visual context)

Option E: "Stop losing your best AI conversations."
  (Loss-aversion framing, emotional, punchy)
```

**Recommendation:** Start with Option A or E for emotional resonance, A/B test against C for clarity.

### Technical Implementation of the Hero

**Tier 2 approach (recommended for launch):**

```typescript
// Hero animation using Framer Motion + React
// Provider logos scatter → converge → reveal archive UI

const heroVariants = {
  scattered: (i: number) => ({
    x: scatterPositions[i].x,
    y: scatterPositions[i].y,
    opacity: 0.4,
    scale: 0.8,
    rotate: Math.random() * 20 - 10,
  }),
  converged: {
    x: 0,
    y: 0,
    opacity: 0,
    scale: 0.3,
    rotate: 0,
    transition: {
      duration: 0.8,
      ease: [0.33, 1, 0.68, 1], // ease-out
    },
  },
};

// After convergence, reveal the archive UI with a clip-path expand
const archiveVariants = {
  hidden: {
    clipPath: 'circle(0% at 50% 50%)',
    opacity: 0,
  },
  revealed: {
    clipPath: 'circle(75% at 50% 50%)',
    opacity: 1,
    transition: {
      duration: 1,
      delay: 0.8, // After logos converge
      ease: [0.33, 1, 0.68, 1],
    },
  },
};
```

**Performance budget for the hero:**
- Provider logo SVGs: ~30KB total (inline SVG, not images)
- Animation: Framer Motion only, no Three.js needed here
- Archive UI: Static image or CSS mockup initially, not a real app embed
- Total hero payload: <100KB
- Time to first visual: <500ms
- Time to animation complete: <2s

**Why NOT Three.js for the hero:** Your product is a 2D interface (archive, search, conversations). A 3D hero would look impressive but signal the wrong product type. Save 3D for the knowledge graph visualization (see Section 4). Your hero should look like your product feels: clean, organized, fast.

### Mobile Hero

```
Mobile adaptation:
- Provider logos in a 3×3 grid (no scatter animation — too chaotic on small screens)
- Grid fades out, archive UI fades in (simpler transition)
- Headline drops to 36px, subheadline to 16px
- Single CTA: "Try the Demo ↓" (GitHub link moves to nav)
- Total hero height: ~85vh (leave room for scroll affordance)
```

---

## Part 3: The Interactive Demo — Your Highest-Leverage Section

### Why This Is Make-or-Break for VIVIM

VIVIM's core value proposition is invisible until you experience it. "Search all your AI conversations" means nothing until you actually search and feel the instant, cross-provider results. The demo transforms abstract benefit into visceral "I need this."

**Your demo conversion thesis:**

```
Visitor sees hero → "Interesting concept"
Visitor tries demo → "Holy shit, I have 300 ChatGPT conversations I can't search"
Visitor hits waitlist → "I need this yesterday"
```

### The Demo Design: "Search Your AI Archive"

**Demo Type:** Level 2 (Sandboxed Prototype) escalating to Level 3 (Live Product Slice) post-launch.

**The Experience:**

```
┌─────────────────────────────────────────────────────────────┐
│  🔍 Search your AI conversations...                          │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  "that React pattern from last month"                    │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                               │
│  Try these:  [debug postgres]  [startup pricing]  [ML paper] │
│                                                               │
│  ─── Results (247ms) ──────────────────────────────────────  │
│                                                               │
│  ┌───────────────────────────────────────────────────────┐   │
│  │ 🟢 ChatGPT · Mar 12                                    │   │
│  │ "Here's the compound component pattern with context..." │   │
│  │ Quality: ████████░░ 8.2  │  Type: Code Pattern         │   │
│  └───────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌───────────────────────────────────────────────────────┐   │
│  │ 🟣 Claude · Feb 28                                      │   │
│  │ "The render props approach vs. hooks for this case..."  │   │
│  └───────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌───────────────────────────────────────────────────────┐   │
│  │ 🔵 Gemini · Feb 15                                      │   │
│  │ "Comparing composition patterns across frameworks..."   │   │
│  └───────────────────────────────────────────────────────┘   │
│                                                               │
│  ──────────────────────────────────────────────────────────  │
│                                                               │
│  This archive contains 847 conversations from 5 providers.  │
│  Yours could too.  [Import Your Conversations →]             │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Demo Implementation Details

**Phase 1 (Pre-launch, build in 3-5 days):**

```typescript
// Pre-populated demo archive with realistic sample data
const DEMO_ARCHIVE = {
  stats: {
    totalConversations: 847,
    providers: ['ChatGPT', 'Claude', 'Gemini', 'Perplexity', 'Copilot'],
    totalACUs: 3241,
    dateRange: { from: '2024-01-15', to: '2026-03-15' },
  },
  
  // Pre-computed search results for common queries
  // User can also type freely — use client-side fuzzy search
  searchIndex: [
    {
      query: 'react pattern',
      results: [
        {
          provider: 'chatgpt',
          date: '2026-03-12',
          title: 'Compound Component Pattern',
          snippet: 'Here\'s the compound component pattern with context...',
          acuQuality: 8.2,
          acuType: 'Code Pattern',
          fullContent: '...', // Expandable
        },
        // ... more results
      ],
    },
    // ... more pre-computed queries
  ],
};

// Client-side search for free-form queries
import Fuse from 'fuse.js';

const fuse = new Fuse(allACUs, {
  keys: ['content', 'title', 'tags'],
  threshold: 0.4,
  includeScore: true,
});
```

**Phase 2 (Post-launch, 1-2 weeks):**
- Connect to a real VIVIM backend with sample data
- Semantic search via pgvector (not just fuzzy matching)
- Show actual ACU quality scores
- Let users click into a full conversation view
- Add a "connected provider" simulation (show OAuth flow mockup)

**The "Aha Moment" Map for VIVIM's Demo:**

```
1. SETUP (3 sec):
   User sees search bar with pre-filled query suggestion chips

2. ACTION (5 sec):
   User types a query or clicks a suggestion chip

3. PAYOFF (instant):
   Results appear from MULTIPLE providers, sorted by relevance
   Quality scores visible. Provider color-coded.
   → The cross-provider search is the aha moment

4. IMPLICATION (5 sec):
   Footer text: "This archive contains 847 conversations from
   5 providers. Yours could too."

5. CTA (always visible):
   "Import Your Conversations →" button, sticky at bottom of demo
```

### Demo Anti-Patterns Specific to VIVIM

- **Don't show the import flow in the demo.** Import is multi-step, requires auth, and is boring to watch. Show the *result* of importing — the searchable archive. Save the import experience for post-signup onboarding.
- **Don't show every feature.** No context engine demo, no memory extraction, no CRDT sync. Those are power features that create retention. The demo sells the core: "all your AI conversations, searchable."
- **Don't use obviously fake data.** The sample conversations should read like real AI interactions — code snippets, explanations, back-and-forth refinement. If the demo content feels fake, the product promise feels fake.
- **Don't require any account creation.** The demo runs entirely in the browser on pre-loaded data. Zero friction.

### Mobile Demo Adaptation

```
Mobile:
- Full-width search bar (no sidebar)
- Suggestion chips scroll horizontally
- Results stack vertically (full width cards)
- Provider icon + date on one line, snippet below
- "Import →" CTA is a sticky bottom bar
- Performance: Same client-side search, no additional network requests
```

---

## Part 4: Scrollytelling — The VIVIM Narrative

### The Story Structure

Your scroll narrative must serve three audiences simultaneously. The trick is **progressive depth**: the surface level tells the user story, the details satisfy developers, and the arc convinces investors.

```
SCROLL MAP (approximate viewport positions):

0vh    ┌─── HERO ───────────────────────────────────────────────┐
       │ "Own every conversation you've ever had with AI."      │
100vh  └────────────────────────────────────────────────────────┘

100vh  ┌─── THE PROBLEM ───────────────────────────────────────┐
       │ Animated: 9 provider windows scatter, conversations   │
       │ disappear, search fails across silos                  │
200vh  └────────────────────────────────────────────────────────┘

200vh  ┌─── THE DEMO ──────────────────────────────────────────┐
       │ Interactive search demo (sticky section)              │
       │ This section stays pinned for ~2 viewport heights     │
400vh  └────────────────────────────────────────────────────────┘

400vh  ┌─── HOW IT WORKS ──────────────────────────────────────┐
       │ 3 steps: Import → Organize → Search                  │
       │ Each step revealed on scroll with animation           │
500vh  └────────────────────────────────────────────────────────┘

500vh  ┌─── THE SUPERPOWERS ───────────────────────────────────┐
       │ ACU quality scoring, Context engine, Memory extraction│
       │ Expandable cards — surface benefit, expand for depth  │
650vh  └────────────────────────────────────────────────────────┘

650vh  ┌─── KNOWLEDGE GRAPH (3D) ──────────────────────────────┐
       │ Interactive: rotate, zoom into conversation clusters  │
       │ This is your "wow" moment for investors               │
800vh  └────────────────────────────────────────────────────────┘

800vh  ┌─── TRUST & SECURITY ──────────────────────────────────┐
       │ Open source, E2E encryption, DID identity, self-host  │
       │ Architecture diagram (simplified, beautiful)          │
900vh  └────────────────────────────────────────────────────────┘

900vh  ┌─── SOCIAL PROOF / TRACTION ───────────────────────────┐
       │ GitHub stars, beta users, testimonials (when available)│
950vh  └────────────────────────────────────────────────────────┘

950vh  ┌─── CTA ───────────────────────────────────────────────┐
       │ "Your AI conversations deserve a home."               │
       │ [Join the Waitlist]  [Star on GitHub]  [Read the Docs]│
1000vh └────────────────────────────────────────────────────────┘
```

### Section-by-Section Design

#### Section: THE PROBLEM (100vh–200vh)

**Concept:** Make the visitor *feel* the fragmentation.

**Scroll-triggered animation:**

```
Scroll 0%:   9 browser windows arranged in a grid, each showing
             a different AI provider with conversation snippets

Scroll 25%:  Windows start drifting apart, opacity decreasing
             A search query appears: "that database optimization trick"

Scroll 50%:  Search bar shows "No results" across each provider
             (because the conversation was in a DIFFERENT provider)
             Red emphasis, slight shake animation

Scroll 75%:  Windows fade to outlines, conversations literally
             disappear (deletion policy visualization)
             Counter: "2.3M conversations deleted this month"

Scroll 100%: Transition — everything converges into the demo section
```

**Copy for this section:**

```
HEADLINE: Your best thinking is trapped in 9 different apps.

BODY (revealed progressively on scroll):
"That debugging technique from February? It's in ChatGPT.
The architecture decision from last quarter? Somewhere in Claude.
The pricing strategy your AI helped you build? Maybe Gemini. Maybe deleted.

95% of AI conversations are never revisited.
Not because they're not valuable — because they're unfindable."
```

**Implementation:**

```typescript
// Using GSAP ScrollTrigger for the problem section
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// Provider windows scatter animation
gsap.to('.provider-window', {
  scrollTrigger: {
    trigger: '.problem-section',
    start: 'top center',
    end: 'bottom center',
    scrub: 1, // Tied to scroll position
  },
  x: (i) => scatterX[i],
  y: (i) => scatterY[i],
  opacity: 0.2,
  scale: 0.8,
  stagger: 0.1,
});

// "No results" shake effect
gsap.to('.search-fail', {
  scrollTrigger: {
    trigger: '.problem-section',
    start: '50% center',
    toggleActions: 'play none none reverse',
  },
  x: [0, -8, 8, -4, 4, 0],
  duration: 0.4,
  ease: 'power2.inOut',
});
```

#### Section: HOW IT WORKS (400vh–500vh)

**Concept:** 3 steps, dead simple, each animated on scroll.

```
STEP 1: IMPORT
Visual: Provider logos slide into a funnel → VIVIM logo
Copy: "Connect your providers. We capture every conversation
       automatically — ChatGPT, Claude, Gemini, and 6 more."
Detail (expandable): "Playwright-based extraction preserves full
       context, timestamps, and model information."

STEP 2: ORGANIZE
Visual: Raw conversations transform into ACU cards with
        quality scores, tags, and embeddings visualized as dots
Copy: "We break conversations into Atomic Chat Units — searchable,
       scoreable, shareable knowledge fragments."
Detail (expandable): "Each ACU is scored across 5 quality dimensions
       and embedded for semantic search."

STEP 3: SEARCH & SHARE
Visual: Search bar types, results from multiple providers appear;
        one result gets shared (envelope icon, lock icon)
Copy: "Find anything instantly across every provider.
       Share specific insights with end-to-end encryption."
Detail (expandable): "Hybrid search combines keyword matching with
       semantic similarity for 94% recall."
```

**Implementation pattern: Sticky section with content swap**

```typescript
// Sticky container with step transitions
const steps = [
  { id: 'import', visual: <ImportAnimation />, copy: importCopy },
  { id: 'organize', visual: <OrganizeAnimation />, copy: organizeCopy },
  { id: 'search', visual: <SearchAnimation />, copy: searchCopy },
];

// CSS: .how-it-works-container { position: sticky; top: 0; height: 100vh; }
// Each step occupies 100vh of scroll space, but the container stays pinned
// Content inside transitions based on scroll position
```

#### Section: THE SUPERPOWERS (500vh–650vh)

**Concept:** Feature cards that show benefits on the surface and reveal technical depth on expansion. This is where developers and investors diverge — devs expand the cards, investors scan the headlines.

```
┌─────────────────────────────────────────┐
│ 🧠 8-Layer Context Engine               │
│                                          │
│ Your AI remembers everything about you.  │
│ Preferences, projects, expertise — all   │
│ compiled into personalized context.      │
│                                          │
│ [Show Architecture ↓]                    │
│ ─────────────────────────────────────── │
│ (expanded: layer diagram, token budget   │
│  visualization, technical details)       │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ 🔐 Quantum-Resistant Encryption          │
│                                          │
│ Your conversations are yours. Period.    │
│ End-to-end encrypted with ML-KEM-1024   │
│ — secure against tomorrow's threats.     │
│                                          │
│ [Show Crypto Stack ↓]                    │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ 🌐 Decentralized Identity                │
│                                          │
│ No email required. Your identity is a    │
│ cryptographic keypair that you control.  │
│ Export it. Take it anywhere.             │
│                                          │
│ [Show DID Architecture ↓]               │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ 🔄 Offline-First Sync                    │
│                                          │
│ Works without internet. Syncs without    │
│ conflicts. CRDT-powered — no "last       │
│ write wins" surprises.                   │
│                                          │
│ [Show Sync Protocol ↓]                  │
└─────────────────────────────────────────┘
```

**Design note:** These cards should have VIVIM's signature color on hover (a subtle glow or border accent). The expanded sections should feel like mini-documentation — monospace font for technical terms, syntax-highlighted code where relevant, architecture diagrams. This is where your site *becomes* your docs.

#### Section: KNOWLEDGE GRAPH — Your 3D Moment (650vh–800vh)

**This is where you use Three.js.** Not the hero. Here.

**Concept:** A beautiful, interactive visualization of a sample user's knowledge graph. Conversation nodes clustered by topic, colored by provider, sized by value. The user can rotate, zoom, and click nodes to see conversation previews.

**Why this works for VIVIM:**
- It makes the "compound value" thesis tangible — you can *see* how knowledge connects
- It's genuinely novel (no competitor has this)
- It creates the "investor screenshot" — the image that ends up in pitch deck recaps
- It demonstrates technical sophistication without explaining it

**Implementation:**

```typescript
// Knowledge graph with React Three Fiber
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Float } from '@react-three/drei';
import { forceSimulation, forceManyBody, forceLink, forceCenter }
  from 'd3-force-3d';

function KnowledgeGraph({ nodes, edges }) {
  // Run force simulation for layout
  const simulation = useMemo(() => {
    return forceSimulation(nodes)
      .force('charge', forceManyBody().strength(-50))
      .force('link', forceLink(edges).distance(30))
      .force('center', forceCenter())
      .stop();
  }, [nodes, edges]);

  // Pre-compute positions (don't animate simulation — too expensive)
  useMemo(() => {
    for (let i = 0; i < 300; i++) simulation.tick();
  }, [simulation]);

  return (
    <Canvas camera={{ position: [0, 0, 100], fov: 60 }}>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      
      {nodes.map((node) => (
        <ConversationNode
          key={node.id}
          position={[node.x, node.y, node.z]}
          provider={node.provider}
          quality={node.acuQuality}
          onClick={() => setSelectedNode(node)}
        />
      ))}
      
      {edges.map((edge) => (
        <ConnectionLine
          key={edge.id}
          start={edge.source}
          end={edge.target}
          strength={edge.semanticSimilarity}
        />
      ))}
      
      <OrbitControls
        enableZoom={true}
        enablePan={false}
        autoRotate={true}
        autoRotateSpeed={0.5}
      />
    </Canvas>
  );
}
```

**Performance constraints:**
- Max 500 nodes in the demo (optimize with instanced meshes for more)
- Pre-compute force layout (don't animate it in real-time)
- Use LOD (level of detail): far away = simple spheres, close up = detailed cards
- Lazy load the entire Three.js bundle (it's ~500KB) — only when section scrolls into proximity
- Fallback: 2D graph visualization using React Flow for mobile and low-power devices
- Total 3D budget: <800KB compressed, loaded on idle/proximity

**The annotation layer:**

```
When the user hovers/clicks a node cluster:
┌──────────────────────────────────┐
│ 📁 Machine Learning              │
│ 47 conversations · 3 providers   │
│ Top ACUs: "Transformer attention │
│ explained", "Fine-tuning BERT"   │
│                                   │
│ [Explore Cluster →]              │
└──────────────────────────────────┘
```

#### Section: TRUST & SECURITY (800vh–900vh)

**Concept:** An architecture diagram that's beautiful enough to be your brand image, clear enough for a CTO, and confidence-building for everyone.

**Not** a standard AWS architecture diagram. A VIVIM-branded, simplified diagram that emphasizes the trust properties.

```
Visual layout (horizontal flow):

[Your Devices]  ──E2E Encrypted──>  [VIVIM Cloud]  ──Isolated──>  [Your Database]
     │                                    │                            │
     │                                    │                            │
  DID Identity                      Open Source                   Per-User SQLite
  Ed25519 Keys                      MIT Licensed                  Complete Isolation
  Local-First                       Auditable                     Easy Export
     │                                    │                            │
     └────── OR self-host everything ─────┘                            │
                                                                       │
                                                              [You Own This]
```

**Copy:**

```
HEADLINE: Privacy by architecture, not by policy.

BODY:
"We don't promise to protect your data — we make it
mathematically impossible for us to read it.

End-to-end encryption with ML-KEM-1024 (quantum-resistant).
Per-user isolated databases (not shared tables with row filters).
Self-sovereign identity (your keys, your identity, your rules).
Fully open source (MIT license, audit every line)."

BADGES: [Open Source] [E2E Encrypted] [Self-Hostable] [GDPR Ready]
```

**For investors, add this line (subtle, perhaps in smaller text):**
*"Our architecture is enterprise-ready by design — not retrofitted. Per-user isolation makes compliance trivial."*

---

## Part 5: Typography & Visual Identity Recommendations

### Font System for VIVIM

| Level | Font | Weight | Use |
|---|---|---|---|
| **Display** | Satoshi or General Sans | Black (900) | Hero headline, section titles |
| **Body** | Inter | Regular (400), Medium (500) | All body text, descriptions |
| **Mono** | Berkeley Mono or JetBrains Mono | Regular (400) | Code blocks, technical terms, ACU IDs, DID strings |

**Why this combination:**
- Satoshi/General Sans signals modern and human (not cold, not corporate) — matches VIVIM's "your intelligence" positioning
- Inter is the most readable sans-serif at body sizes — your docs will be extensive, readability is paramount
- Berkeley Mono is the developer's monospace of choice in 2026 — signals you're part of their world

**Font budget:**
```
Satoshi Black (subset: uppercase + digits): ~25KB
Inter Regular + Medium (Latin subset): ~45KB
Berkeley Mono Regular (Latin subset): ~30KB
Total: ~100KB (well within budget)
```

### Color System for VIVIM

**The "1-2-6" architecture applied:**

```
SIGNATURE COLOR:
  Electric indigo: #6366F1
  (Signals: intelligence, innovation, premium)
  (Works in both light and dark mode)
  (Distinct from ChatGPT green, Claude orange, Gemini blue)

SUPPORTING COLORS:
  Warm amber: #F59E0B (for warnings, highlights, "human" accents)
  Teal: #14B8A6 (for success states, positive metrics, growth)

PROVIDER COLORS (for identification, not brand):
  ChatGPT: #10A37F
  Claude: #D97706
  Gemini: #4285F4
  Perplexity: #22D3EE
  Copilot: #6366F1 (use accent variant to differentiate from brand)

NEUTRALS (dark mode primary):
  Background:     #09090B (zinc-950)
  Surface:        #18181B (zinc-900)
  Surface raised: #27272A (zinc-800)
  Border:         #3F3F46 (zinc-700)
  Text primary:   #FAFAFA (zinc-50)
  Text secondary: #A1A1AA (zinc-400)
  Text tertiary:  #71717A (zinc-500)
```

**Design dark-first.** Your audience (AI power users, developers) overwhelmingly prefers dark mode. Design in dark, then create a light mode variant.

**The provider color system is critical for VIVIM.** Your demo and archive views need to instantly communicate which AI provider a conversation came from. Use the provider colors as left-border accents on conversation cards, small dot indicators, or background tints at very low opacity.

### Texture & Atmosphere

```
GRAIN:
  2% noise overlay on dark backgrounds (prevents banding on gradients)
  CSS: background-image: url('/noise.svg'); opacity: 0.02;

GLOW:
  Your signature indigo as a subtle glow behind interactive elements
  box-shadow: 0 0 60px rgba(99, 102, 241, 0.15);
  Use on: demo section, CTA buttons, knowledge graph container

GLASSMORPHISM:
  Cards and overlays use backdrop-filter: blur(12px)
  with semi-transparent surface color
  Use sparingly: modal overlays, floating annotations on the knowledge graph

GRADIENT:
  Signature gradient for hero background (very subtle):
  background: radial-gradient(ellipse at 50% 0%,
    rgba(99, 102, 241, 0.15) 0%,
    transparent 60%);
```

---

## Part 6: Documentation Strategy

### Why Docs Are Existential for VIVIM

Your product is:
1. Open source (developers will judge you by your docs)
2. Developer-facing (SDK, API, self-hosting)
3. Novel (new category — people need to *learn* what an ACU is)
4. Trust-dependent (users need to understand your encryption to trust it)

Bad docs = no developer adoption = no community = no moat. This is not optional.

### VIVIM Docs Information Architecture

```
docs.vivim.dev (or vivim.dev/docs)

├── 🚀 Quick Start (< 5 min to first import)
│   ├── Install the browser extension
│   ├── Connect your first provider (ChatGPT walkthrough)
│   ├── Run your first search
│   └── "What just happened?" (ACU explanation)
│
├── 📖 Guides
│   ├── Importing Conversations
│   │   ├── ChatGPT
│   │   ├── Claude
│   │   ├── Gemini
│   │   └── ... (one guide per provider)
│   ├── Understanding ACUs
│   │   ├── What is an ACU?
│   │   ├── Quality Scoring Explained
│   │   └── Working with ACU Embeddings
│   ├── Sharing & Collaboration
│   │   ├── Sharing a Conversation
│   │   ├── Creating Collections
│   │   ├── Permission Levels
│   │   └── Encryption Deep Dive
│   ├── Self-Hosting
│   │   ├── Docker Compose Setup
│   │   ├── Configuration Reference
│   │   ├── Scaling Guide
│   │   └── Backup & Recovery
│   └── Migration Guides
│       ├── From ChatGPT Export
│       ├── From other tools
│       └── Bulk Import API
│
├── 🔌 API Reference
│   ├── Authentication (DID + OAuth)
│   ├── Conversations API
│   ├── ACU API
│   ├── Search API
│   ├── Context API
│   ├── Sharing API
│   ├── Memory API
│   ├── Portability API
│   └── WebSocket Events
│
├── 🧠 Concepts
│   ├── Architecture Overview
│   ├── The 8-Layer Context Engine
│   ├── ACU Segmentation Algorithm
│   ├── Hybrid Retrieval System
│   ├── Cryptographic Stack
│   ├── DID Identity System
│   ├── CRDT Sync Protocol
│   └── Per-User Database Isolation
│
├── 🛠 SDK & Tools
│   ├── JavaScript SDK
│   ├── Python SDK (when available)
│   ├── CLI Reference
│   └── Browser Extension API
│
├── 📋 Examples & Recipes
│   ├── Building a Personal Knowledge Base
│   ├── Team Knowledge Sharing Workflow
│   ├── Custom ACU Scoring
│   ├── Integrating VIVIM Context into Your AI App
│   └── GitHub repo links
│
└── 📝 Changelog
    ├── Latest Release
    ├── Version History
    └── Deprecation Notices
```

### Docs Design Decisions

**Tool: Fumadocs (recommended)**

Why Fumadocs over Mintlify for VIVIM:
- Next.js native (matches your likely stack)
- Full customization (you need custom components for ACU cards, architecture diagrams, interactive code)
- Free and open source (aligns with your values)
- MDX-based (developers contribute via GitHub PRs)
- You can embed interactive examples (live API explorer, ACU quality calculator)

**Alternative: Mintlify** if you want polish faster and can accept less customization.

**Docs design system alignment:**

```
docs.vivim.dev should share:
  ✓ Same dark/light mode implementation
  ✓ Same font stack (Satoshi/Inter/Berkeley Mono)
  ✓ Same color palette (indigo signature, zinc neutrals)
  ✓ Same code block styling
  ✓ Same provider color system
  ✓ Same noise texture and glow effects

docs.vivim.dev should differ:
  ✓ Higher information density (narrower margins)
  ✓ Persistent sidebar navigation
  ✓ On-page table of contents
  ✓ More compact spacing
  ✓ Breadcrumb navigation
```

### Content Priorities (Write These First)

```
Week 1: Quick Start guide (this is your highest-traffic docs page)
Week 2: API Reference for Conversations + Search (developers test these first)
Week 3: Architecture Overview + Concepts (builds deep trust)
Week 4: Self-Hosting guide (shows you're serious about ownership)
Ongoing: Provider-specific import guides (add as you support each one)
```

### Interactive Docs Elements Specific to VIVIM

**1. Live ACU Explorer:**
Embed a component that shows a real conversation → its ACU decomposition → quality scores. Users can click between views.

**2. API Playground:**
In-page API calls with pre-filled examples. "Try it" button executes against a sandbox backend and shows the response.

**3. Architecture Diagram (Interactive):**
The 8-layer context engine as a clickable diagram. Click a layer → see its inputs, processing, and outputs.

**4. Encryption Verifier:**
A tool that lets users paste an encrypted ACU and verify its signature, demonstrating the zero-trust model.

---

## Part 7: Trust Architecture for VIVIM (Pre-Traction)

### Your Trust Problem

You have zero customers, zero testimonials, zero logos, and you're asking people to give you access to their most private AI conversations. This is the hardest trust sell in startups.

### Your Trust Stack (Ordered by What You Can Build Now)

**Tier 1 — Immediate Credibility (build this week):**

```
┌─────────────────────────────────────────────────────────────┐
│                    TRUST SIGNALS (above the fold)            │
│                                                              │
│  [⭐ Open Source · MIT Licensed]                             │
│  [🔒 End-to-End Encrypted]                                  │
│  [🏠 Self-Hostable]                                         │
│  [🔑 No Email Required]                                     │
│                                                              │
│  github.com/vivim/vivim  ·  ⭐ [live star count]            │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

These badges communicate your values instantly. "Open source" + "self-hostable" + "no email required" is a trust trifecta for technical audiences.

**Tier 2 — Experiential Trust (the demo):**
Your demo IS your trust signal. When users can search a realistic archive without signing up, entering an email, or granting any permissions, you've demonstrated respect for their time and data.

**Tier 3 — Technical Trust (docs and code):**

```
FOR DEVELOPERS:
- Public GitHub repo with clean code, good README, CI/CD badges
- Architecture documentation (your technical docs ARE marketing)
- Security whitepaper (your crypto stack deserves a dedicated page)
- Dependency audit (show you're not shipping vulnerable deps)

FOR INVESTORS:
- Team section with real photos, LinkedIn links, relevant backgrounds
- "Why now" section citing the enabling technologies
- Market sizing with bottoms-up logic
- Differentiation from ChatGPT's built-in history (your #1 objection)
```

**Tier 4 — Social Trust (build over time):**

```
PRE-LAUNCH:
- "Building in public" Twitter thread embeds
- GitHub commit activity graph (shows active development)
- Waitlist count (if meaningful: "2,400+ on the waitlist")
- YC/accelerator badge (if applicable)

POST-LAUNCH:
- Product Hunt badge and ranking
- Hacker News thread embed (if well-received)
- Developer testimonials (even 2-3 are powerful)
- GitHub stars as social proof
- Discord community member count
```

### Handling the #1 Objection: "Why Won't ChatGPT Just Build This?"

This needs to be addressed on your site — proactively, not defensively.

**Placement:** In the "Superpowers" or "Trust" section, as an FAQ or expandable block.

**Copy:**

```
Q: "Won't ChatGPT/Claude just add better search?"

A: They might. And you'd still need VIVIM.

Here's why: you don't use just one AI. You use ChatGPT for coding,
Claude for writing, Gemini for research, and three others for
different tasks. No single provider will index your conversations
across their competitors.

VIVIM is the cross-provider layer. It's the home for ALL your
AI intelligence, regardless of where it originated.

We're also open source, end-to-end encrypted, and self-hostable.
No AI provider will offer all three.
```

---

## Part 8: AI-Adaptive Personalization for VIVIM

### Referrer-Based Emphasis

```javascript
const getVivimVisitorIntent = () => {
  const ref = document.referrer.toLowerCase();
  const params = new URLSearchParams(window.location.search);

  // Developer signals
  if (ref.includes('news.ycombinator') || ref.includes('github') ||
      ref.includes('lobste.rs') || ref.includes('dev.to')) {
    return 'developer';
  }

  // Investor signals
  if (ref.includes('linkedin') || ref.includes('crunchbase') ||
      params.get('ref') === 'pitch' || params.get('ref') === 'deck') {
    return 'investor';
  }

  // Product Hunt
  if (ref.includes('producthunt')) {
    return 'product-hunt';
  }

  // Docs-first
  if (params.get('ref') === 'docs' || ref.includes('stackoverflow')) {
    return 'documentation';
  }

  // Returning visitor
  if (localStorage.getItem('vivim-returning')) {
    return 'returning';
  }

  return 'default'; // AI power user assumption
};

document.documentElement.dataset.visitorIntent = getVivimVisitorIntent();
localStorage.setItem('vivim-returning', Date.now().toString());
```

```css
/* Developer visitors: show GitHub stars prominently, lead with architecture */
[data-visitor-intent="developer"] .github-badge { display: flex; order: -1; }
[data-visitor-intent="developer"] .architecture-section { order: -1; }
[data-visitor-intent="developer"] .vision-narrative { order: 2; }

/* Investor visitors: show traction, team, market size */
[data-visitor-intent="investor"] .traction-metrics { display: flex; }
[data-visitor-intent="investor"] .team-section { order: -1; }
[data-visitor-intent="investor"] .technical-depth { max-height: 0; overflow: hidden; }

/* Product Hunt visitors: show demo immediately, social proof */
[data-visitor-intent="product-hunt"] .demo-section { order: -1; }
[data-visitor-intent="product-hunt"] .ph-badge { display: flex; }

/* Returning visitors: show what's new */
[data-visitor-intent="returning"] .whats-new-banner { display: flex; }
[data-visitor-intent="returning"] .hero-explainer { display: none; }
```

---

## Part 9: Performance Strategy for VIVIM's Heavy Stack

### The Challenge

VIVIM's website wants to include: scattered-to-unified hero animation, interactive search demo, scroll-triggered narrative animations, 3D knowledge graph, glassmorphism effects, and code-highlighted documentation. That's a lot of JavaScript.

### The Loading Waterfall

```
Priority 0 — Critical (inline, blocks render):
  ├── Critical CSS (hero layout, above-fold styles): ~15KB inline
  ├── System font renders headline immediately
  └── No JavaScript needed for first paint

Priority 1 — High (preloaded, loads in parallel):
  ├── Web fonts (Satoshi Black, Inter, Berkeley Mono): ~100KB
  ├── Hero animation script (Framer Motion subset): ~30KB
  ├── Provider logo SVGs (inline in HTML): ~25KB
  └── App shell CSS: ~20KB

Priority 2 — Medium (loaded after first paint):
  ├── Demo section code (Fuse.js + sample data): ~150KB
  ├── GSAP ScrollTrigger (for scrollytelling): ~40KB
  ├── Rest of React app bundle: ~120KB
  └── Images below fold (AVIF, lazy loaded): variable

Priority 3 — Low (loaded on scroll proximity or idle):
  ├── Three.js + React Three Fiber (knowledge graph): ~500KB
  ├── D3-force-3d (graph layout): ~50KB
  ├── Syntax highlighting (for expanded code blocks): ~80KB
  └── Analytics, error tracking: ~20KB

Priority 4 — Deferred (after load event):
  ├── Service worker registration (PWA)
  ├── Prefetch docs pages
  └── Chat widget (if any)

TOTAL INITIAL LOAD: ~360KB (Priority 0 + 1 + 2)
TOTAL LAZY LOAD: ~650KB (Priority 3 + 4)
GRAND TOTAL: ~1MB (well within 2MB budget)
```

### Specific Optimizations

```typescript
// Dynamic import for heavy sections
const KnowledgeGraph = dynamic(
  () => import('./components/KnowledgeGraph'),
  {
    loading: () => <KnowledgeGraphSkeleton />,
    ssr: false, // No server-side render for Three.js
  }
);

// Load Three.js only when graph section is near viewport
const graphRef = useRef(null);
const isNearViewport = useIntersectionObserver(graphRef, {
  rootMargin: '500px', // Start loading 500px before visible
});

return (
  <section ref={graphRef}>
    {isNearViewport ? <KnowledgeGraph /> : <KnowledgeGraphSkeleton />}
  </section>
);
```

```typescript
// Demo search with debounced, client-side execution
const DEMO_DATA_URL = '/demo-archive.json'; // ~80KB compressed

// Prefetch demo data when user scrolls near demo section
const prefetchDemoData = () => {
  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.href = DEMO_DATA_URL;
  document.head.appendChild(link);
};

// Initialize search index lazily
let searchIndex: Fuse<ACU> | null = null;

const initSearch = async () => {
  if (searchIndex) return searchIndex;
  const data = await fetch(DEMO_DATA_URL).then(r => r.json());
  searchIndex = new Fuse(data.acus, {
    keys: ['content', 'title', 'tags'],
    threshold: 0.4,
  });
  return searchIndex;
};
```

### Performance Targets for VIVIM

| Metric | Target | Justification |
|---|---|---|
| LCP | <1.2s | Hero headline + animation must be visible fast |
| INP | <80ms | Demo search input must feel instant |
| CLS | <0.03 | No layout shifts when fonts/images load |
| TTI | <2.5s on 4G | Demo must be interactive quickly |
| 3D scene load | <1.5s from scroll trigger | Knowledge graph loads lazily |
| Demo search response | <50ms | Client-side search must feel like local |
| Lighthouse | >95 all categories | Non-negotiable |

---

## Part 10: Micro-Interactions Specific to VIVIM

### Interaction Design Language

VIVIM's interactions should feel **precise and intelligent** — like the product itself. Not bouncy or playful (that's for consumer social). Not stiff or corporate (that's for enterprise SaaS). Precise, responsive, slightly magnetic.

**The VIVIM interaction personality:**

```
BUTTON HOVER:
  - Subtle scale (1.02x), background lightens
  - Indigo glow appears: box-shadow: 0 0 20px rgba(99, 102, 241, 0.2)
  - Transition: 150ms ease-out
  
CARD HOVER:
  - Lift (translateY: -2px), border brightens
  - Provider accent color appears as left border
  - Transition: 200ms ease-out

SEARCH INPUT FOCUS:
  - Border transitions to indigo
  - Subtle expand (width: calc(100% + 8px))
  - Placeholder text fades out
  - Transition: 200ms ease-out

RESULT APPEAR:
  - Stagger from top: each card fades up with 50ms delay
  - Timing: 300ms per card, ease-out
  - Quality score bar animates from 0 to value

ACU CARD EXPAND:
  - Height animates with spring physics
  - Content fades in with 100ms delay after height settles
  - Spring: stiffness 300, damping 30

PROVIDER BADGE:
  - On hover: scale 1.1, provider color intensifies
  - Tooltip appears with provider name + conversation count
  - Transition: 150ms

SCROLL PROGRESS:
  - Thin indigo line at top of viewport
  - Width tracks scroll percentage
  - CSS only: position: fixed; width: var(--scroll-progress);

SECTION TRANSITIONS:
  - Elements fade up (20px offset) on intersection
  - Stagger: 80ms between siblings
  - Once-only: don't re-animate on scroll back up
```

### Reduced Motion Implementation

```css
@media (prefers-reduced-motion: reduce) {
  /* Remove all decorative animations */
  .hero-animation,
  .scroll-reveal,
  .knowledge-graph-rotate,
  .provider-scatter {
    animation: none !important;
    transition: opacity 0.01ms !important;
  }

  /* Keep functional transitions (hover feedback, focus states) */
  /* but make them instant */
  button, a, .card {
    transition-duration: 0.01ms !important;
  }

  /* Show static version of knowledge graph */
  .knowledge-graph-3d { display: none; }
  .knowledge-graph-static { display: block; }

  /* Show all scroll-hidden content immediately */
  .scroll-reveal {
    opacity: 1 !important;
    transform: none !important;
  }
}
```

---

## Part 11: The CTA Strategy

### VIVIM Has Multiple CTAs for Multiple Audiences

**Primary CTA (for AI power users):**
```
Pre-launch:  "Join the Waitlist" → email/DID capture
Post-launch: "Import Your Conversations" → onboarding
```

**Secondary CTA (for developers):**
```
"Star on GitHub" → github.com/vivim/vivim
"Read the Docs" → docs.vivim.dev
```

**Tertiary CTA (for investors):**
```
"Read the Vision" → /vision (or anchor to vision section)
"Contact Founders" → email/calendly (NOT on the main page — in footer or /about)
```

### CTA Placement Strategy

```
HERO:           [Import Your Conversations]  [View on GitHub →]
AFTER DEMO:     [Import Your Conversations]  (sticky during demo scroll)
AFTER FEATURES: [Read the Docs]  [Self-Host Guide →]
AFTER GRAPH:    [Join the Waitlist — see your own knowledge graph]
FOOTER:         [Import] [GitHub] [Docs] [Discord] [Twitter] [Contact]
```

### The Final CTA Section (Bottom of Page)

```
HEADLINE (Display):
"Your AI conversations deserve a home."

SUBHEADLINE:
Stop losing your best thinking. Import from any provider.
Search everything. Own your intelligence.

[Import Your Conversations →]     (primary, large, indigo)
[Star on GitHub]                  (secondary, outline)
[Read the Docs]                   (tertiary, text link)

BELOW CTAs:
"Open source · End-to-end encrypted · Self-hostable
No credit card required. No email required."
```

**Why "no email required" is a superpower CTA:** Most waitlists ask for email. VIVIM's DID-based identity means you can potentially let users create an account with just a keypair. This is a massive trust signal and a genuine differentiator. Lean into it.

---

## Part 12: The Implementation Roadmap

### Your Specific Build Sequence

```
WEEK 1: Ship the Core (Day 1-5)
├── Day 1: Brand system (finalize colors, fonts, install Tailwind config)
├── Day 2: Hero section (headline + scatter-to-converge animation)
│          Use Framer Motion, keep it 2D, provider logos as SVGs
├── Day 3: Demo section (search interface + Fuse.js on sample data)
│          Pre-populate with 50 realistic AI conversations
│          Build 5 pre-computed query suggestions
├── Day 4: Trust section (badges, GitHub link, architecture diagram SVG)
│          Write the "Why won't ChatGPT build this?" FAQ
├── Day 5: CTA + mobile responsive pass + deploy to Vercel
│          Install Plausible analytics
│          Test on iPhone SE and Pixel 4a (real devices if possible)
└── SHIP IT. Share with 10-20 people. Collect feedback.

WEEK 2: Add Depth (Day 6-10)
├── Day 6-7: Scrollytelling sections (Problem + How It Works)
│            GSAP ScrollTrigger for scroll-linked animations
│            Write the narrative copy
├── Day 8: Superpowers section (expandable feature cards)
│          Each card: benefit headline + expand for technical depth
├── Day 9: Performance optimization pass
│          Run Lighthouse, fix all issues, verify <1.5s LCP
│          Lazy load everything below the demo
├── Day 10: Accessibility audit
│           Keyboard navigation through entire page
│           Screen reader test (VoiceOver or NVDA)
│           Contrast check on all text
└── Deploy v2. Share on Twitter/X, dev communities.

WEEK 3: Premium Elements (Day 11-15)
├── Day 11-12: Knowledge Graph (Three.js / React Three Fiber)
│              Pre-computed force layout, interactive rotate/zoom
│              Fallback static image for mobile
├── Day 13: Documentation (Quick Start + API Reference skeleton)
│           Fumadocs or Mintlify setup with VIVIM branding
├── Day 14: Personalization (visitor intent detection, CSS-driven)
│           Referrer-based emphasis shifting
├── Day 15: Final polish, micro-interactions, OG image, meta tags
│           Social sharing preview (critical for PH and HN)
└── Deploy v3. Prepare for Product Hunt / HN launch.

WEEK 4+: Iterate Based on Data
├── Analyze: time on demo, scroll depth, waitlist conversion
├── A/B test: headlines (rotate through Options A-E)
├── Add: content based on feedback (more docs, blog posts)
├── Expand: demo with real backend when product is ready
└── Optimize: continuously based on metrics
```

### Technical Stack Decision for VIVIM

**Recommended: Next.js 15 + Tailwind CSS + Framer Motion (primary) + GSAP (scroll) + React Three Fiber (graph)**

```
Why Next.js (not Framer the tool):
  ✓ You need custom interactive components (demo, graph) that exceed no-code limits
  ✓ Docs integration is easier with Next.js (Fumadocs is Next.js native)
  ✓ Your team is technical — code-first is faster for you
  ✓ SSG for the marketing page + SSR for docs = optimal performance
  ✓ Same stack as your eventual app (shared components)

Why not Framer (the tool):
  ✗ Custom search demo would be hacky in Framer
  ✗ Three.js integration is limited
  ✗ Can't embed real docs
  ✗ Lock-in risk for a startup that values openness

Project structure:
vivim-web/
├── app/
│   ├── page.tsx                    # Main marketing page
│   ├── layout.tsx                  # Root layout (fonts, meta)
│   ├── docs/                       # Fumadocs pages
│   │   └── [[...slug]]/page.tsx
│   └── vision/page.tsx             # Vision document (for investors)
├── components/
│   ├── hero/
│   │   ├── HeroSection.tsx
│   │   ├── ProviderScatter.tsx
│   │   └── ArchiveReveal.tsx
│   ├── demo/
│   │   ├── DemoSection.tsx
│   │   ├── SearchBar.tsx
│   │   ├── SearchResults.tsx
│   │   └── ACUCard.tsx
│   ├── narrative/
│   │   ├── ProblemSection.tsx
│   │   ├── HowItWorks.tsx
│   │   └── Superpowers.tsx
│   ├── graph/
│   │   ├── KnowledgeGraph.tsx
│   │   ├── GraphNode.tsx
│   │   └── GraphSkeleton.tsx
│   ├── trust/
│   │   ├── TrustSection.tsx
│   │   ├── ArchitectureDiagram.tsx
│   │   └── SecurityBadges.tsx
│   └── shared/
│       ├── Button.tsx
│       ├── Card.tsx
│       ├── ProviderBadge.tsx
│       └── ScrollProgress.tsx
├── lib/
│   ├── demo-data.ts               # Sample archive data
│   ├── visitor-intent.ts           # Personalization logic
│   └── animations.ts              # Shared animation configs
├── public/
│   ├── providers/                  # Provider logo SVGs
│   ├── noise.svg                   # Texture overlay
│   ├── demo-archive.json           # Demo search data
│   └── og-image.png               # Social sharing image
├── styles/
│   ├── globals.css                 # Tailwind + custom properties
│   └── fonts.css                   # Font-face declarations
├── tailwind.config.ts
├── next.config.ts
└── package.json
```

### Metrics Dashboard for VIVIM

```
PRIMARY METRICS (check daily during launch week):

┌─────────────────────────────────────────────────┐
│  VIVIM Website Analytics                         │
│                                                   │
│  Visitors today:        [###]                    │
│  Bounce rate:           [##%]    (target: <40%)  │
│  Demo engagement:       [##%]    (target: >30%)  │
│  Avg time on demo:      [##s]    (target: >45s)  │
│  Scroll to graph:       [##%]    (target: >25%)  │
│  Docs click-through:    [##%]    (target: >10%)  │
│  GitHub click-through:  [##%]    (target: >15%)  │
│  Waitlist conversion:   [##%]    (target: >5%)   │
│  LCP:                   [#.##s]  (target: <1.2s) │
│                                                   │
│  Top referrers:                                  │
│  1. [source] - [##] visitors                     │
│  2. [source] - [##] visitors                     │
│  3. [source] - [##] visitors                     │
│                                                   │
│  Demo search queries (what are people looking for?)│
│  1. "[query]" - [##] searches                    │
│  2. "[query]" - [##] searches                    │
│  3. "[query]" - [##] searches                    │
└─────────────────────────────────────────────────┘
```

**Critical insight:** Track what people TYPE into the demo search bar. This tells you what your users care about, what examples to pre-populate, and what use cases to highlight in marketing.

```typescript
// Track demo search queries (anonymized, for product insight)
const trackDemoSearch = (query: string) => {
  if (query.length < 3) return; // Skip partial queries
  
  // Send to Plausible as custom event
  if (window.plausible) {
    window.plausible('Demo Search', {
      props: {
        query_category: categorizeQuery(query), // 'code', 'writing', 'research', etc.
        query_length: query.length,
      }
    });
  }
};
```

---

## Part 13: Pre-Launch Content Strategy

### The "Building in Public" Feed

Embed a live feed on your site (footer or sidebar) showing recent development activity.

```
RECENT ACTIVITY:
├── 🟢 3 hours ago: "Shipped Claude conversation import"
├── 🟢 Yesterday: "ACU quality scoring v2 — 40% more accurate"
├── 🟢 3 days ago: "Per-user database isolation complete"
├── 🟢 1 week ago: "Semantic search with pgvector working"
└── [Follow our progress on Twitter →]
```

**Why this works for VIVIM:** You have no customers to show as social proof. Active development *is* your social proof. It signals "this is real, it's moving fast, and you should get in early."

### Blog Posts to Write (SEO + Authority)

```
Priority 1 (pre-launch):
  "Why You Should Own Your AI Conversations"
    → Category-defining thought piece, SEO for "AI conversation ownership"
  
  "How We Built Cross-Provider AI Conversation Capture"
    → Technical deep dive, HN-bait, establishes engineering credibility

Priority 2 (launch week):
  "Introducing VIVIM: The Home for Your AI Intelligence"
    → Launch announcement, PH/HN submission companion

Priority 3 (post-launch):
  "The Architecture of Per-User Database Isolation"
  "Building Quantum-Resistant Encryption for AI Memories"
  "How ACU Quality Scoring Works (and Why It Matters)"
    → Each is a standalone HN/dev Twitter post
```

### The OG Image (Critical for Social Sharing)

```
Design:
  Dark background (#09090B)
  VIVIM logo (top left, small)
  Headline: "Own every conversation you've ever had with AI."
  Visual: Simplified version of the scatter-to-unified concept
  Provider logos at bottom (small, grayscale)
  
  Size: 1200×630px (OG standard)
  Format: PNG (not JPEG — text needs crisp edges)
```

This image will appear on every Twitter share, every Slack paste, every Product Hunt listing. It's one of your highest-leverage assets. Spend 2 hours making it perfect.

---

## Part 14: What NOT to Build (Anti-Scope for Website v1)

```
DO NOT BUILD FOR V1:
  ✗ Blog (write posts, host on your site later)
  ✗ Careers page (you're pre-seed — link to your email)
  ✗ Pricing page (too early — include pricing in the FAQ or skip)
  ✗ Multi-page navigation (one scroll page + docs is enough)
  ✗ Login/signup on the marketing site (separate app domain)
  ✗ Community features on the site (link to Discord)
  ✗ Investor deck download (send it manually, track who opens it)
  ✗ Comparison pages ("VIVIM vs X") — too early, invites scrutiny
  ✗ Enterprise features page (when you have enterprise interest)
  ✗ Press page (when press writes about you)
  ✗ Animated page transitions between routes (you have one page)s
  ✗ Chat widget / support bot (you have <100 users)
```

Every item you don't build saves 1-3 days and keeps your site focused. You can add all of these in weeks 4-12 based on actual need.

---

## Closing: The VIVIM Website as Competitive Weapon

Your website is the first place anyone will experience VIVIM. Before they import a single conversation, before they run a single search, before they read a single doc — they'll land on your homepage and make a judgment in 3 seconds.

That judgment needs to be: *"Finally. Someone built this."*

The scattered-to-unified hero makes them *feel* the problem and solution. The interactive demo makes them *experience* the value. The scrollytelling makes them *believe* in the vision. The docs make them *trust* the engineering. The knowledge graph makes them *see* the potential. And the open-source, encrypted, self-hostable trust stack makes them *confident* enough to hand over their most private AI conversations.

Ship the hero + demo + trust signals in week 1. Everything else is enhancement.

**Your website should make visitors think:** *"I need to get my conversations into this. Right now."*

Build it. Ship it. Measure it. Iterate.
