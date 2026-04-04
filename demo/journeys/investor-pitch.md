---
title: Investor Pitch Demo
description: The 90-second investor pitch - the money demo
duration: 90s
target: VCs, angel investors, strategic investors
---

## Pre-Conditions

- [ ] Full seed (320 conversations, 2161 ACUs)
- [ ] Knowledge graph rendered
- [ ] All pages load instantly
- [ ] Loom backup recorded (1080p)
- [ ] Server and PWA running
- [ ] Demo Chrome profile ready

## Steps

| Step | Action | URL | Wait | Screenshot | Notes |
|------|--------|-----|------|------------|-------|
| 1 | Navigate | /archive | 2000 | ✅ | Archive timeline - starting position |
| 2 | Navigate | /archive?view=canvas | 5000 | ✅ | Canvas graph - the money shot |
| 3 | Scroll | scroll | 2000 | ✅ | Zoom into largest cluster |
| 4 | Navigate | /context-cockpit | 3000 | ✅ | Context cockpit - 8 layers |
| 5 | Navigate | /archive | 2000 | ✅ | Return to archive - close |

## The 90-Second Script

### Phase 1: Hook (0-15s)

**Action:** Show 3 browser tabs externally (ChatGPT, Claude, Gemini), then close all

**Narration:** "Every AI power user lives here. [Show tabs] This is where their most valuable thinking goes to die."

**Screenshot:** `01-three-ai-tabs.png` (external - capture manually)

---

### Phase 2: Magic #1 - Capture (15-35s)

**Action:** Open VIVIM Archive

**URL:** `/archive`

**Narration:** "VIVIM captures from 9 providers. One tap. [Show timeline] 320 conversations. Weeks of work. Fully organized."

**Screenshot:** `02-archive-timeline.png`

---

### Phase 3: Magic #2 - Knowledge Graph (35-60s) ⭐

**Action:** Switch to Canvas

**URL:** `/archive?view=canvas`

**Wait:** 5000ms (let graph animate)

**Narration:** "This is the money shot. [Graph animates] Every conversation decomposed into atomic insights. Mapped. Connected. This isn't a search tool. It's a second brain."

**Screenshot:** `03-canvas-full-graph.png`

**Notes:** THIS IS THE MONEY SHOT. Let it render fully.

---

### Phase 4: Magic #3 - Context Engine (60-80s)

**Action:** Open Context Cockpit

**URL:** `/context-cockpit`

**Narration:** "New chat. [Open cockpit] 8 layers loading. Memories. Topics. Entities. It knows you. Not because you told it. Because it's been watching you think."

**Screenshot:** `04-context-cockpit-full.png`

---

### Phase 5: Close (80-90s)

**Action:** Return to Archive home

**URL:** `/archive`

**Narration:** "That's VIVIM. You own your AI brain. Fully. [Stop. Silence. Let them ask.]"

**Screenshot:** `05-archive-home-close.png`

---

## Backup Plan

| Failure | Solution |
|---------|----------|
| Graph doesn't render | Use Loom backup (in clipboard) |
| Search returns 0 results | Use pre-verified queries only |
| Server lags | Blame "demo gods", laugh, refresh |
| Auth fails | Check `server/.env` |

## Expected Investor Questions

1. **"How is this different from [competitor]?"**
   - Answer: "Graph + Context Engine. Compound intelligence."

2. **"What's the moat?"**
   - Answer: "User's own data. The more they use it, the smarter it gets."

3. **"Business model?"**
   - Answer: "Freemium + team tiers. $12/mo pro, $49/mo team."

4. **"Traction?"**
   - Answer: "[Insert real metrics]"

## Success Criteria

- Demo completes in 85-95 seconds
- Graph renders in <3s
- No errors visible
- Investor asks questions (good sign!)
- Loom backup ready but not needed

## Technical Checklist

### Night Before
- [ ] Run `bun run demo:reset`
- [ ] Verify 320 conversations in DB
- [ ] Record 1080p Loom backup
- [ ] Test all 3 search queries
- [ ] Practice script 5+ times (target: 85-95s)

### Day Of
- [ ] Demo Chrome profile only
- [ ] Pre-navigate to archive view
- [ ] Disable all notifications
- [ ] Loom backup URL in clipboard
- [ ] Mobile hotspot ready

### 5 Minutes Before
- [ ] Refresh page
- [ ] Verify graph renders
- [ ] Test one search query
- [ ] Close all other tabs
- [ ] Set phone to silent

## Key Metrics to Display

| Metric | Value |
|--------|-------|
| Conversations | 320 |
| ACUs | 2161 |
| ACU Links | 734 |
| Topic Profiles | 10 |
| Memories | 8 |
| Demo Time | 90s |
