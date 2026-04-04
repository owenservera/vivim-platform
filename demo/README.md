# VIVIM Investor Demo Project

This directory contains everything needed for VIVIM investor demo presentations.

## 📁 Project Structure

```
demo/
├── README.md                   # You are here
├── plan/                      # Strategic planning documents
│   ├── vivim_investor_demo_strategy.html   # Main investor strategy (the 90-second demo)
│   └── SESSION_RESEARCH.md    # Research findings from this session
├── highlights/                # Focus area configs + highlights orchestration
│   ├── FOCUS_AREAS.ts        # Focus area definitions (narrative, flows, seed weights)
│   └── README.md             # Highlights system guide
├── seed/                      # Demo seed data
│   ├── INVESTOR_DEMO_SCHEMA.md # Data model for demo persona
│   └── README.md              # Seed data guide
├── scripts/                   # Automation scripts
│   ├── demo-highlights.ts    # Highlight orchestrator (run a specific focus area)
│   ├── capture-screenshots.ts  # Playwright screenshot capture
│   ├── reset-demo.ts          # Database reset & re-seed
│   ├── generate-slides.ts     # MDX slide generation
│   └── demo-reset.sh         # Quick reset command
├── screenshots/               # Captured screenshots
├── slides/                   # Generated presentations
│   └── investor-deck/         # MDX-based investor deck
└── assets/                   # Mockups, GIFs, device frames
```

## 🎯 Quick Start

### 1. Set up demo environment
```bash
cp .env.example .env.demo
echo "VIVIM_DEMO_MODE=true" >> .env.demo
```

### 2. Seed demo data
```bash
cd server
bun run prisma/seed-investor.ts
```

### 3. Capture screenshots
```bash
bun run demo:capture --flow=onboarding
```

### 4. Generate slides
```bash
bun run demo:slides --template=investor
```

## 🎯 Focus Areas (Recommended)

Customize the demo to your audience. Run one command, get narrative + screenshots + slides.

```bash
bun run demo:highlight --focus=knowledgeGraph   # Recommended default
bun run demo:highlight --focus=contextEngine   # For CTO/technical investors
bun run demo:highlight --focus=forYouFeed       # For product investors
bun run demo:highlight --focus=socialSharing   # For business investors
bun run demo:highlight --focus=fullJourney      # All features, 90-120s
```

See `highlights/README.md` for the full list and how to add custom focus areas.

## 📊 Demo Story Arc (90 seconds)

| Phase | Time | What to Show |
|-------|------|--------------|
| Hook | 0-15s | 3 browser tabs (ChatGPT, Claude, Gemini) — "where AI thinking goes to die" |
| Magic #1 | 15-35s | VIVIM archive — 9 providers, timeline view, weeks of organized AI work |
| **Magic #2** | 35-60s | **Knowledge graph canvas** — the money shot |
| Magic #3 | 60-80s | Context cockpit — AI that knows you |
| Close | 80-90s | "That's VIVIM. You own your AI brain." — stop, let them ask |

**The knowledge graph is the weapon.** Make it look incredible.

## 🔑 Key Principles

1. **Live demo only** — no recordings during the meeting
2. **Pre-logged in** — never type a password
3. **250-400 conversations** seeded across 5+ providers
4. **Scripted searches** that always return the right results
5. **Pre-positioned** graph camera, pre-run animations
6. **Backup Loom recording** ready in clipboard
7. **Mobile hotspot** as wifi backup

## 📋 Pre-Demo Checklist

See `plan/vivim_investor_demo_strategy.html` for the full interactive checklist.

**Night before:**
- [ ] Run seed reset, verify 250+ conversations
- [ ] Verify embeddings pre-computed
- [ ] Record 1080p screen capture backup
- [ ] Test all 3 demo search queries
- [ ] Practice script 5+ times (85-95 seconds)

**Day of:**
- [ ] Demo Chrome profile only, nothing else
- [ ] Pre-navigate to archive view
- [ ] Disable all notifications
- [ ] Loom backup URL in clipboard
- [ ] Mobile hotspot ready

## 🚫 What NOT to Do

- Live capture during demo (providers change, it will fail)
- Show empty states (pre-seed everything)
- Feature touring (tell a story, not a spec sheet)
- Explain the UI (if you need to, it's a UX problem)
- Go past 90 seconds before questions
- Wing any click (practice until muscle memory)

## 🛠️ Scripts

### Reset Demo
```bash
# Full reset: wipe DB + re-seed + clear cache
bun run demo:reset
```

### Capture Screenshots
```bash
# Capture key flows
bun run demo:screenshots --flow=onboarding
bun run demo:screenshots --flow=core-features
bun run demo:screenshots --flow=knowledge-graph
```

### Generate Slides
```bash
# Generate MDX investor deck
bun run demo:slides --template=investor
```

## 📁 Related Documentation

- [Investor Strategy](./plan/vivim_investor_demo_strategy.html) — Interactive HTML with full strategy
- [Seed Data Schema](./seed/INVESTOR_DEMO_SCHEMA.md) — Data model for Alex Chen persona
- [VIVIM README](../README.md) — Main project documentation
- [SDK README](../sdk/README.md) — SDK documentation
