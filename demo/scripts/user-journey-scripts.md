# User Journey Demo Scripts

**Generated:** March 19, 2026  
**Persona:** Alex Chen — Senior Full-Stack Developer + Startup Founder  
**Demo User:** alex@vivimdemo.io | `did:key:demo-alex-chen`

---

## Table of Contents

1. [First-Time User Onboarding](#1-first-time-user-onboarding) — 45 seconds
2. [Daily Knowledge Worker](#2-daily-knowledge-worker) — 60 seconds
3. [Problem Solver Journey](#3-problem-solver-journey) — 90 seconds
4. [Team Collaboration Flow](#4-team-collaboration-flow) — 75 seconds
5. [Deep Research Session](#5-deep-research-session) — 120 seconds
6. [Investor Pitch Demo](#6-investor-pitch-demo) — 90 seconds

---

## 1. First-Time User Onboarding

**Target Audience:** New users, trial signups  
**Demo Time:** 45 seconds  
**Goal:** Show immediate value and setup flow

### Pre-Conditions
- [ ] Fresh account (or demo reset complete)
- [ ] Browser on login page
- [ ] No prior conversations

### Journey Script

| Step | Time | Action | Screen | Narration |
|------|------|--------|--------|-----------|
| 1 | 0-5s | Show login page | `/login` | "Welcome to VIVIM. Let's get you set up in 30 seconds." |
| 2 | 5-10s | Click "Sign in with Google" (demo auto-login) | → `/home` | "One click — you're in. Your AI brain, ready." |
| 3 | 10-20s | Show empty archive with provider cards | `/home` | "This is your archive. Connect your AI providers — ChatGPT, Claude, Gemini, and 6 more." |
| 4 | 20-30s | Navigate to capture page | `/capture` | "One URL paste captures everything. No more scattered tabs." |
| 5 | 30-40s | Show import options | `/import` | "Import from 9 providers. One tap — your entire AI history, archived." |
| 6 | 40-45s | Return home, show populated feed | `/for-you` | "You're done. Your AI thinking, organized forever." |

### Key Screenshots
```
1-login-screen.png
2-home-empty.png
3-capture-page.png
4-import-options.png
5-for-you-populated.png
```

### Success Criteria
- Login completes in <3s
- Provider cards visible
- Capture page loads instantly
- Import shows all 9 providers

---

## 2. Daily Knowledge Worker

**Target Audience:** Individual contributors, developers, researchers  
**Demo Time:** 60 seconds  
**Goal:** Show daily workflow and knowledge resurfacing

### Pre-Conditions
- [ ] 250+ conversations seeded
- [ ] 6+ months of activity
- [ ] Multiple providers connected

### Journey Script

| Step | Time | Action | Screen | Narration |
|------|------|--------|--------|-----------|
| 1 | 0-5s | Open For You feed | `/for-you` | "Every morning, your For You feed surfaces what matters today." |
| 2 | 5-15s | Scroll through 3-4 cards | `/for-you` | "Three months ago, you solved this exact Postgres problem. Here's the solution." |
| 3 | 15-25s | Click React topic filter | `/for-you?topic=react` | "Zoom in by topic. React patterns from the past 6 weeks." |
| 4 | 25-35s | Open a conversation | `/conversation/:id` | "Full context preserved. Every message, every code snippet." |
| 5 | 35-45s | Navigate to Archive timeline | `/archive` | "Your entire AI history. 320 conversations. Fully searchable." |
| 6 | 45-55s | Switch to Canvas view | `/archive?view=canvas` | "See connections. This cluster is your React architecture thinking." |
| 7 | 55-60s | Return to For You | `/for-you` | "Stop asking the same questions. Start finding answers you already have." |

### Key Screenshots
```
1-for-you-feed.png
2-topic-filter-react.png
3-conversation-detail.png
4-archive-timeline.png
5-canvas-cluster.png
```

### Search Queries to Demo
- "react hooks architecture"
- "postgres indexing"
- "startup advice"

### Success Criteria
- Feed shows 10+ relevant cards
- Topic filter returns 20+ conversations
- Conversation loads in <1s
- Canvas shows 50+ nodes

---

## 3. Problem Solver Journey

**Target Audience:** Engineers debugging complex issues  
**Demo Time:** 90 seconds  
**Goal:** Show knowledge graph and cross-conversation discovery

### Pre-Conditions
- [ ] Knowledge graph seeded with 700+ ACU links
- [ ] Multiple related conversations exist
- [ ] Search indexed

### Journey Script

| Step | Time | Action | Screen | Narration |
|------|------|--------|--------|-----------|
| 1 | 0-10s | Start at Archive home | `/archive` | "You're debugging a Postgres query planner issue. Let's find what you've learned before." |
| 2 | 10-20s | Search "vector database performance" | `/archive/search?q=vector+database` | "Semantic search across all providers. 8 conversations match." |
| 3 | 20-30s | Open top result | `/conversation/:id` | "This Claude conversation from 4 months ago has the exact answer." |
| 4 | 30-45s | Navigate to Canvas view | `/archive?view=canvas` | "Switch to graph view. Watch how concepts connect." |
| 5 | 45-60s | Zoom into largest cluster | `/archive?view=canvas#cluster-1` | "This cluster is your database optimization thinking. 47 conversations, 312 insights." |
| 6 | 60-75s | Click a node to see ACU detail | `/conversation/:acu-id` | "This atomic unit links to 3 other conversations. Your knowledge, networked." |
| 7 | 75-85s | Show relationship edges | Canvas zoomed | "Explains, follows_up, contradicts — VIVIM maps how your thinking evolves." |
| 8 | 85-90s | Return to search results | `/archive/search` | "That's VIVIM. Your AI brain, visible and connected." |

### Key Screenshots
```
1-archive-search.png
2-search-results.png
3-conversation-acu-detail.png
4-canvas-full-graph.png
5-canvas-zoomed-cluster.png
6-acu-relationships.png
```

### Search Queries to Demo
1. "vector database performance" → 8+ results
2. "react hooks architecture" → 12+ results
3. "hiring senior engineers" → 6+ results

### Success Criteria
- Search returns in <300ms
- Graph renders in <3s
- 50+ nodes visible
- ACU links display correctly

---

## 4. Team Collaboration Flow

**Target Audience:** Startup founders, team leads  
**Demo Time:** 75 seconds  
**Goal:** Show social features and knowledge sharing

### Pre-Conditions
- [ ] 2 circles seeded (Founders Circle, SF Engineering)
- [ ] 20 circle memberships
- [ ] 24 group posts
- [ ] 16 friendships

### Journey Script

| Step | Time | Action | Screen | Narration |
|------|------|--------|--------|-----------|
| 1 | 0-10s | Open Circles page | `/circles` | "Your startup's best AI learnings shouldn't die in one person's head." |
| 2 | 10-20s | Click "Founders Circle" | `/circles/founders` | "Private circle for stealth founders. 12 members sharing curated knowledge." |
| 3 | 20-30s | Show shared conversations | `/circles/founders/shared` | "Jordan shared this architecture review. Full attribution, one click to adopt." |
| 4 | 30-45s | Navigate to Groups | `/groups` | "Public communities. 567 PGVector users. 234 Build In Public founders." |
| 5 | 45-60s | Open group feed | `/groups/pgvector-users` | "Real-time knowledge sharing. Questions, solutions, war stories." |
| 6 | 60-70s | Show sharing settings | `/settings/advanced` | "Control what's shared. Private by default, share with attribution." |
| 7 | 70-75s | Return to circles | `/circles` | "Network effects for AI knowledge. The more your team shares, the smarter everyone gets." |

### Key Screenshots
```
1-circles-list.png
2-founders-circle-detail.png
3-shared-conversations.png
4-groups-list.png
5-group-feed.png
6-sharing-settings.png
```

### Social Proof Metrics to Show
- Founders Circle: 12 members, 47 shared conversations
- SF Engineering: 45 members, 156 posts
- Total shared knowledge: 203 conversations

### Success Criteria
- Circles show member counts
- Shared conversations display with attribution
- Group feed shows recent activity
- Sharing settings clearly visible

---

## 5. Deep Research Session

**Target Audience:** Researchers, analysts, students  
**Demo Time:** 120 seconds  
**Goal:** Show comprehensive knowledge management

### Pre-Conditions
- [ ] 3 notebooks with 15 entries
- [ ] 10 topic profiles
- [ ] 5 entity profiles
- [ ] 8 memories with relationships

### Journey Script

| Step | Time | Action | Screen | Narration |
|------|------|--------|--------|-----------|
| 1 | 0-10s | Open Notebooks | `/notebooks` | "You're researching microservices vs monoliths. Let's organize your findings." |
| 2 | 10-25s | Open "Architecture Patterns" notebook | `/notebooks/architecture` | "15 curated ACUs. System design references, decision records, code snippets." |
| 3 | 25-40s | Show Context Cockpit | `/context-cockpit` | "Before you start a new chat, VIVIM assembles context. 8 layers loading..." |
| 4 | 40-55s | Review memories panel | `/context-cockpit` | "8 memories loaded. You prefer TypeScript. You're skeptical of microservices for early-stage." |
| 5 | 55-70s | Open VIVIM AI chat | `/chat` | "Ask a question. VIVIM AI uses your archive, not just the prompt." |
| 6 | 70-85s | Type "Should I use microservices?" | `/chat` (typing) | "It knows your context. Answers grounded in your past thinking." |
| 7 | 85-100s | Show AI response with citations | `/chat` (response) | "Cites 3 past conversations. Your monolith discussion from February. Jordan's architecture review." |
| 8 | 100-110s | Navigate to Analytics | `/analytics` | "Track your AI usage. 320 conversations. 2161 insights extracted." |
| 9 | 110-120s | Show topic distribution | `/analytics` | "React: 30 conversations. System Design: 20. This is your knowledge footprint." |

### Key Screenshots
```
1-notebooks-list.png
2-architecture-notebook-detail.png
3-context-cockpit-full.png
4-memories-panel.png
5-vivim-ai-chat.png
6-ai-response-citations.png
7-analytics-dashboard.png
8-topic-distribution.png
```

### Context Layers to Highlight
1. **User Facts** — 10 loaded
2. **Memories** — 8 retrieved
3. **Topic Profiles** — React, TypeScript active
4. **Entity Profiles** — Stripe, Jordan Lee referenced
5. **Past Conversations** — 3 cited

### Success Criteria
- Notebook shows 15 entries
- Context cockpit loads in <1s
- AI response includes citations
- Analytics shows real metrics

---

## 6. Investor Pitch Demo

**Target Audience:** VCs, angel investors  
**Demo Time:** 90 seconds  
**Goal:** Show the 90-second investor pitch (the money demo)

### Pre-Conditions
- [ ] Full seed (320 conversations, 2161 ACUs)
- [ ] Knowledge graph rendered
- [ ] All pages load instantly
- [ ] Loom backup recorded

### The 90-Second Script

| Phase | Time | Action | Screen | Exact Narration |
|-------|------|--------|--------|-----------------|
| **Hook** | 0-15s | Show 3 browser tabs (ChatGPT, Claude, Gemini), then close all | External | "Every AI power user lives here. [Show tabs] This is where their most valuable thinking goes to die." |
| **Magic #1** | 15-35s | Open VIVIM Archive | `/archive` | "VIVIM captures from 9 providers. One tap. [Show timeline] 320 conversations. Weeks of work. Fully organized." |
| **Magic #2** | 35-60s | Switch to Canvas | `/archive?view=canvas` | "This is the money shot. [Graph animates] Every conversation decomposed into atomic insights. Mapped. Connected. This isn't a search tool. It's a second brain." |
| **Magic #3** | 60-80s | Open Context Cockpit | `/context-cockpit` | "New chat. [Open cockpit] 8 layers loading. Memories. Topics. Entities. It knows you. Not because you told it. Because it's been watching you think." |
| **Close** | 80-90s | Return to Archive home | `/archive` | "That's VIVIM. You own your AI brain. Fully. [Stop. Silence. Let them ask.]" |

### Key Screenshots
```
1-three-ai-tabs.png (external - browser tabs)
2-archive-timeline.png
3-canvas-full-graph.png
4-context-cockpit-full.png
5-archive-home-close.png
```

### Backup Plan
- **If graph fails:** Show pre-recorded Loom (1080p, in clipboard)
- **If search fails:** Use pre-verified queries only
- **If server lags:** Blame "demo gods", laugh, refresh

### Investor Questions to Expect
1. "How is this different from [competitor]?" → **Graph + Context Engine**
2. "What's the moat?" → **Compound intelligence from user's own data**
3. "Business model?" → **Freemium + team tiers**
4. "Traction?" → **[Insert real metrics]**

### Success Criteria
- Demo completes in 85-95 seconds
- Graph renders in <3s
- No errors visible
- Investor asks questions (good sign!)

---

## Appendix A: URL Quick Reference

| Screen | URL | Notes |
|--------|-----|-------|
| Login | `/login` | Auto-login for demo user |
| Home/Archive | `/archive` or `/home` | Timeline view default |
| Canvas | `/archive?view=canvas` | Force-directed graph |
| For You Feed | `/for-you` | Ranked recommendations |
| Conversation | `/conversation/:id` | Replace with real ID |
| Context Cockpit | `/context-cockpit` | 8-layer context view |
| VIVIM AI Chat | `/chat` | Memory-grounded AI |
| Circles | `/circles` | Private groups |
| Groups | `/groups` | Public communities |
| Notebooks | `/notebooks` | Curated collections |
| Analytics | `/analytics` | Usage metrics |
| Settings | `/settings` | Account + preferences |
| Capture | `/capture` | Import conversations |
| Import | `/import` | Provider selection |

---

## Appendix B: Pre-Demo Checklist

### Night Before
- [ ] Run `bun run demo:reset`
- [ ] Verify 320 conversations in DB
- [ ] Record 1080p Loom backup
- [ ] Test all 3 search queries
- [ ] Practice script 5+ times (target: 85-95s)

### Day Of
- [ ] Demo Chrome profile only (no personal tabs)
- [ ] Pre-navigate to archive view
- [ ] Disable all notifications (Focus Mode)
- [ ] Loom backup URL in clipboard
- [ ] Mobile hotspot ready (backup wifi)
- [ ] Water nearby (don't cough during demo)

### 5 Minutes Before
- [ ] Refresh page (clear any stale state)
- [ ] Verify graph renders
- [ ] Test one search query
- [ ] Close all other tabs
- [ ] Set phone to silent

---

## Appendix C: Troubleshooting

| Problem | Solution |
|---------|----------|
| Graph doesn't render | Refresh page. If still broken, use Loom backup |
| Search returns 0 results | Re-run seed: `cd server && bun run prisma:seed:investor` |
| Page loads slowly | Blame "demo gods", laugh, wait 2s |
| Wrong conversation ID | Run pre-flight: `bun run demo/scripts/preflight.ts` |
| Auth fails | Check `server/.env` has `SKIP_AUTH_FOR_DEVELOPMENT=true` |
| Screenshot blank | Increase wait time in capture script |

---

**Last Updated:** March 19, 2026  
**Next Review:** After next investor meeting
