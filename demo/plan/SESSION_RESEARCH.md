# Session Research — Investor Demo Implementation

*Research conducted: March 18, 2026*

---

## What I Found

### Your App: VIVIM — Decentralized AI Memory Platform

**Core Value Prop:** Capture, organize, and surface AI conversations from ChatGPT, Claude, Gemini, and other providers into a personal knowledge graph you own and control.

**Tech Stack:**
- **Frontend:** React 19 + TypeScript + Vite + TailwindCSS + Framer Motion + Zustand + TanStack Query
- **Backend:** Bun + Express + Prisma ORM + PostgreSQL + Redis
- **Network:** LibP2P + Yjs CRDT + WebRTC + WebSockets
- **Auth:** Self-sovereign identity (DID-based) with cryptographic keys

**Key Features (for Demo):**
1. **Capture** — Import conversations from multiple AI providers via URL
2. **Memory Extraction** — ACUs (Atomic Chat Units) auto-extracted and scored
3. **For You Feed** — AI-powered personalized recommendations (X-algorithm)
4. **Knowledge Graph** — Visual connections between memories (Canvas view)
5. **Circles** — Secure sharing groups
6. **Context Cockpit** — AI context management with 8-layer system
7. **Social Features** — Friends, Groups, Teams, Follows

### Existing Seed Infrastructure
- ✅ `server/prisma/seed.ts` — Basic 3 conversations + ACUs
- ✅ `server/prisma/seed-real-data.ts` — 10 conversations with full messages
- ✅ `pwa/src/lib/recommendation/demo.ts` — Recommendation system demo
- ✅ 10 existing screenshots in `/screenshots`

---

## Demo Strategy (from plan/vivim_investor_demo_strategy.html)

The 90-second investor demo has a precise structure:

1. **0-15s — The Pain Hook**: Show 3 browser tabs (ChatGPT, Claude, Gemini). "Every AI power user lives here. This is where their most valuable thinking goes to die." Close all tabs.

2. **15-35s — Magic #1 (Capture)**: Open VIVIM. Show archive with 9 providers. Timeline view. No narration — let them absorb the scale.

3. **35-60s — Magic #2 (Knowledge Graph)**: Switch to Canvas view. Graph animates into place. Type one search query. Watch nodes glow. **This is the money shot.**

4. **60-80s — Magic #3 (Context)**: Open new chat. Ask a question. Show context cockpit — 8 layers loading, ACUs surfacing. "It knows you. Because it's been watching you think."

5. **80-90s — Close**: "That's VIVIM. You own your AI brain. Fully." Stop. Silence. Let them ask.

---

## Implementation Recommendations

### 1. Seed Data (Priority: HIGH)

Create `scripts/demo/seed-investor.ts` with "Alex Chen" persona:

```
Alex Chen — Senior Full-Stack Developer + Startup Founder

Conversations: 250-400 across 5+ providers
├── ChatGPT (90) — code reviews, architecture, debugging
├── Claude (80) — writing, strategy, long-form thinking  
├── Gemini (50) — research, data analysis
├── DeepSeek (40) — low-level, Rust, performance
├── Grok (30) — tech news, opinions
└── Mistral (30) — European market research

Scripted Searches (must return correct results):
├── "vector database performance" → 8+ conversations
├── "hiring senior engineers" → strategy + drafting mix
└── "last month" → recognizable project arc
```

**Use AI to generate realistic fake conversations:**
```
Prompt: "Write a realistic ChatGPT conversation where a senior engineer 
debugs a Postgres query planner issue. Include user questions and 
detailed AI responses with code examples. 300 like this."
```

### 2. Demo Mode Infrastructure (Priority: HIGH)

```bash
# .env.demo
VIVIM_DEMO_MODE=true
VIVIM_DEMO_USER_ID=did:key:demo-alex-chen
DEMO_SESSION_TIMEOUT=7200000
DEMO_AUTO_RESET=true
```

```typescript
// middleware/demoMode.ts
export const demoModeMiddleware = (req, res, next) => {
  if (process.env.VIVIM_DEMO_MODE === 'true') {
    // Block destructive operations
    if (['DELETE'].includes(req.method)) {
      return res.json({ error: 'Demo mode — read only' })
    }
    res.setHeader('X-Demo-Mode', 'active')
  }
  next()
}
```

### 3. Screenshot Capture Pipeline (Priority: HIGH)

Use Playwright (playwright-cli skill already available):

```typescript
// scripts/demo/capture-flows.ts
const FLOWS = {
  onboarding: ['/welcome', '/connect-chatgpt', '/first-capture', '/feed-ready'],
  coreFeatures: ['/home', '/for-you', '/conversation/123', '/knowledge-graph'],
  sharing: ['/circles', '/circle/team', '/share/preview'],
  knowledgeGraph: ['/canvas', '/graph-full', '/search-results']
}

export async function captureFlow(flow: string) {
  const pages = FLOWS[flow]
  for (const path of pages) {
    await page.goto(`${BASE_URL}${path}`)
    await page.waitForLoadState('networkidle')
    await page.screenshot({ 
      path: `screenshots/${flow}/${path}.png`,
      fullPage: true 
    })
  }
}
```

### 4. Slide/Mockup Generation (Priority: MEDIUM)

| Purpose | Tool | Why |
|---------|------|-----|
| Screenshot capture | Playwright | Programmatic, repeatable |
| Device framing | appshots | CLI, 26 device presets |
| Slide creation | MDX Deck | React-based, code-friendly |
| AI slides | DexCode | Terminal-native |

```bash
# Capture + Frame workflow
npx playwright screenshot http://demo.vivim.app/home --full-page
npx appshots frame home.png --device macbook-13 --background "#0a0a0f"
```

### 5. Demo Reset Script (Priority: MEDIUM)

```typescript
// scripts/demo/reset.ts
export const resetInvestorDemo = async () => {
  console.log('🔄 Resetting demo environment...')
  
  // 1. Clear database
  await prisma.$executeRaw`TRUNCATE TABLE conversations, messages, 
    acu_links RESTART IDENTITY CASCADE`
  
  // 2. Re-seed
  await seedInvestorDemo()
  
  // 3. Pre-compute embeddings
  await precomputeEmbeddings()
  
  // 4. Clear caches
  await redis.flushall()
  
  console.log(`✅ Demo reset complete`)
}
```

---

## Implementation Roadmap

```
Week 1: Foundation
├── Create demo seed generator (Alex Chen persona)
├── Set up environment variables
└── Test demo mode toggle

Week 2: Screenshots  
├── Define key demo flows
├── Set up Playwright capture script
├── Install appshots
└── Generate first screenshot set

Week 3: Slides
├── Set up MDX Deck
├── Create slide templates
└── Import screenshots

Week 4: Polish
├── Add demo wizard (first-time flow)
├── Create demo-specific UI callouts
└── Test with actual investor meeting
```

---

## Key Files to Create

1. `demo/scripts/seed-investor.ts` — Main investor demo seed (250+ conversations)
2. `demo/scripts/reset-demo.ts` — Reset + re-seed script
3. `demo/scripts/capture-screenshots.ts` — Playwright capture flows
4. `demo/scripts/generate-slides.ts` — MDX slide generator
5. `demo/seed/INVESTOR_DEMO_SCHEMA.md` — Data model specification
6. `demo/scripts/demo-reset.sh` — Quick command alias

---

## Performance Targets

| Metric | Target | Why |
|--------|--------|-----|
| Search latency | <300ms | Investors notice lag |
| Graph load | <3s | Pre-compute embeddings |
| Context load | <1s | Cache demo context bundle |
| Demo reset | <30s | Quick recovery |
| Cold start | 0 | Keep instance warm |

---

## References

- [Investor Strategy HTML](./plan/vivim_investor_demo_strategy.html) — Interactive strategy document
- [VIVIM README](../README.md) — Main project
- [Seed Real Data](../server/prisma/seed-real-data.ts) — Existing seed reference
- [Recommendation Demo](../pwa/src/lib/recommendation/demo.ts) — Existing demo reference
