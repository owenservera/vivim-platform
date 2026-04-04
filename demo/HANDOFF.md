# VIVIM Investor Demo — Full Handoff Document

**Session Date:** March 18, 2026  
**Last Updated:** Session end  
**Status:** Seed fix partially applied; comprehensive data expansion needed; screenshots captured; slides generated

---

## Executive Summary

The VIVIM investor demo suite is 80% complete. The core infrastructure works: database seeded, slides generated, screenshots capturable. The remaining 20% is ensuring every demo page renders rich, impressive data when opened. This document covers everything done, what's broken, what's needed, and how to finish.

---

## What Was Completed

### 1. Database Seed (Partially Fixed)

**File:** `server/prisma/seed-investor.ts`

**What works:**
- User creation (Alex Chen, `alex@vivimdemo.io`, `did:key:demo-alex-chen`)
- 320 conversations across 6 providers (ChatGPT, Claude, Gemini, DeepSeek, Grok, Mistral)
- 2172 messages
- 2172 ACUs (atomic chat units)
- 745 ACU relationships (links)
- 10 topic profiles
- 5 entity profiles
- 8 memories
- 2 circles
- 3 notebooks
- 3 groups
- Seed runs in ~19 seconds

**CRITICAL BUG — FIX APPLIED:**
Conversations were being created with `ownerId: null` because the user object didn't exist at conversation generation time. This caused the API to return empty lists (the repository filters by `ownerId = userId`).

**Fix applied (lines ~565-567):**
```typescript
// Changed: const conversations: ConversationData[] = [];
let conversations: ConversationData[] = [];
let ownedConversations: (ConversationData & { ownerId: string })[] = [];

// After user is created, inject ownerId:
ownedConversations = conversations.map(conv => ({ ...conv, ownerId: user.id }));

// Update DB insert to use ownedConversations instead of conversations
await prisma.conversation.createMany({ data: batch }); // batch from ownedConversations
```

**PENDING FIX — Still needs to run:**
The seed script has been edited but not re-run. You must run:
```bash
cd server && bun run prisma:seed:investor
```
Then verify with:
```bash
curl http://localhost:3000/api/v1/conversations?limit=5 -H "Origin: http://localhost:5173"
# Should return conversations, not []
```

---

### 2. Auth Bypass (Complete)

**Files changed:**
- `server/.env` — Set `SKIP_AUTH_FOR_DEVELOPMENT=true` and `DEMO_USER_EMAIL=alex@vivimdemo.io`
- `server/src/middleware/dev-auth.js` — Rewritten to look up `alex@vivimdemo.io` from DB instead of always creating `dev@localhost`
- `server/src/config/index.js` — Added `demoUserEmail` config option

**How it works:**
- `devAuthBypass` middleware runs after `passport.session()` in `server.js`
- Sets `req.user = alexChen`, `req.userId = alex.id`, `req.isAuthenticated = () => true`
- Alex Chen has rich seeded data (320 conversations)
- PWA at `localhost:5173` now authenticates automatically

**Verification:**
```bash
curl http://localhost:3000/api/v1/auth/me -H "Origin: http://localhost:5173"
# Returns: {"success":true,"user":{"id":"...","did":"did:key:demo-alex-chen","email":"alex@vivimdemo.io",...}}
```

**To restart server:**
```bash
# Kill existing processes
taskkill //F //PID <server_pid>
# Start fresh
powershell -Command "Start-Process powershell -ArgumentList '-NoExit','-Command','cd C:\0-BlackBoxProject-0\vivim-app-og\vivim-app; bun run dev:server' -WindowStyle Normal"
```

---

### 3. Screenshots Captured (Partial)

**Output:** `demo/screenshots/investor/`
- `desktop-investor-home.png` ✅
- `desktop-investor-for-you.png` ✅
- `desktop-investor-graph.png` ✅
- `desktop-investor-conversation.png` ⚠️ (contains literal `:id` in URL — not a real conversation)

**Script fix applied:**
- `demo/scripts/capture-screenshots.js` — Written in CommonJS (Bun compat), uses full Chrome path, `domcontentloaded` instead of `networkidle`

**Browser configuration:**
```javascript
browserPath: 'C:/Users/VIVIM.inc/AppData/Local/ms-playwright/chromium-1208/chrome-win64/chrome.exe'
```
This is the only path that works reliably on this Windows machine. On other machines, install with:
```bash
npx playwright install chromium  # installs to ms-playwright cache
```

**Critical limitation:** `/conversation/:id` screenshot captured literally because no real conversation ID was substituted. Need to get a real ID from DB and update the flow.

---

### 4. Slides Generated (Complete)

**Output:** `demo/slides/`
- `investor-deck.html` — 6-slide standalone HTML presentation
- `investor-deck.mdx` — MDX source for the deck
- `highlights/knowledgeGraph/` — MDX + script
- `highlights/coreCapture/` — MDX + script
- `highlights/contextEngine/` — MDX + script
- `highlights/forYouFeed/` — MDX + script
- `highlights/identityStorage/` — MDX + script
- `highlights/socialSharing/` — MDX + script
- `highlights/aiNative/` — MDX + script
- `highlights/fullJourney/` — MDX + script

**Issue:** Slides reference screenshot paths that may not exist yet (`/screenshots/investor/desktop-investor-*.png`). These need to be verified.

---

## What Remains — Comprehensive Data Gap Analysis

### A. Fix Seed and Re-Run (HIGH PRIORITY — 5 min)

**Action:** Re-run the seed after the `ownerId` fix:
```bash
cd server
bun run prisma:seed:investor
```

**Then verify:**
```bash
curl -s http://localhost:3000/api/v1/conversations?limit=3 -H "Origin: http://localhost:5173"
```
Should return 3 conversations. If still empty, the fix needs a second look.

---

### B. Add Missing ACU Ownership (MEDIUM PRIORITY)

**Problem:** ACUs were created with `authorDid: DEMO_USER.did` but no `userId` field. The ACU model doesn't have a direct `userId` — ownership is through `conversationId` (which points to a conversation that now has `ownerId`). So ACUs should be accessible through the conversation chain.

**Check if needed:** Look at `pwa/src/pages/Canvas.tsx` — if it fetches ACUs by `conversationId` or through the conversation, they're already accessible. If it fetches ACUs directly by `userId`, add `userId: user.id` to all ACU records.

**Schema check:** The `AtomicChatUnit` model has `conversationId String?` — so ACUs reference conversations, conversations reference users. The chain is: User → Conversation → ACU. This should work.

---

### C. Add Missing `Message.authorId` / `Message.userId` (LOW PRIORITY)

**Problem:** Messages are created without `authorId`. If any page or API filters messages by `authorId`, they'll be empty.

**Fix:** Add `authorId: user.id` to all message records before `createMany`:
```typescript
// In seed-investor.ts, around line 579
await prisma.message.createMany({
  data: messages.map(m => ({ ...m, conversationId: convId, authorId: user.id })),
});
```
Check schema first: `grep -A 25 "model Message" server/prisma/schema.prisma | head -30`

---

### D. Fix Screenshot — Real Conversation ID (HIGH PRIORITY — 10 min)

**Problem:** `desktop-investor-conversation.png` captured literally `/conversation/:id`

**Solution:** Get a real conversation ID from the seeded data and update the screenshot flow:

```bash
# After re-seeding, get an ID:
curl -s http://localhost:3000/api/v1/conversations?limit=1 -H "Origin: http://localhost:5173" | jq '.[0].id'
```

Then edit `demo/scripts/capture-screenshots.js`, find the `investor` flow, replace:
```javascript
{ path: '/conversation/:id', name: 'investor-conversation', wait: 2000 },
```
With:
```javascript
{ path: '/conversation/[REAL_ID_HERE]', name: 'investor-conversation', wait: 2000 },
```

Or better — write a pre-flight script that fetches the first conversation ID and injects it.

---

### E. Feed/ForYou Page — Verify Data Source (HIGH PRIORITY)

The ForYou page likely fetches from `/api/v1/feed` or `/api/v1/context/feed`. Check what the PWA expects:

**Key questions:**
1. Does `/api/v1/feed` use conversations directly or through a feed scoring algorithm?
2. Does it require pre-computed `rediscoveryScore` on ACUs?
3. Does it need topic profile weights to rank content?

**If feed uses scores:**
```sql
-- Quick check: do any ACUs have rediscoveryScore set?
SELECT COUNT(*) FROM atomic_chat_units WHERE rediscovery_score > 0;
```
If 0, the feed will return empty or default order.

**If feed needs scores:** The seed should set `rediscoveryScore` on a subset of ACUs:
```typescript
acus = acus.map((acu, i) => ({
  ...acu,
  rediscoveryScore: i % 5 === 0 ? 0.7 + Math.random() * 0.3 : Math.random() * 0.5,
}));
```

---

### F. Knowledge Graph / Canvas — Verify ACU Graph Data (HIGH PRIORITY)

The Canvas page (`/canvas`) shows a knowledge graph. It likely:
1. Fetches ACUs from the API
2. Fetches ACU links (relationships)
3. Renders them as a force-directed graph

**What was seeded:**
- 2172 ACUs across conversations
- 745 ACU links

**Verification:** Open `/canvas` in browser and check if nodes appear. If the graph is empty, check:
1. What endpoint does Canvas use? (`grep -r "canvas\|graph\|acu" pwa/src/pages/`)
2. Does it filter by `conversationId` (which now has `ownerId`) or by direct `userId`?
3. Are embeddings required for the graph layout?

**If embeddings are needed:** The seed currently sets `embedding: []` (empty array) to bypass schema validation. For a real graph, embeddings should be computed. For a demo, the graph can render without embeddings — just positions based on link relationships.

---

### G. Circles Page — Verify Data (MEDIUM PRIORITY)

**What was seeded:**
- 2 circles: "Founders Circle" (private), "SF Engineering" (public)

**Check:** The Circles page likely fetches from `/api/v1/circles`. Verify it returns data. If circles show but are empty:
1. Check if circle members are needed (seed creates circle but no members)
2. Add circle members: `prisma.circleMember.createMany({ data: [...] })`

---

### H. Comprehensive Seed Data Expansion (MEDIUM-HIGH — 30-60 min)

For a truly impressive demo, add data that makes every page shine:

**Missing data for impressive demos:**

| Page | Missing | Impact | Fix Effort |
|------|---------|--------|------------|
| ForYou/Feed | `rediscoveryScore` on ACUs | Feed looks random | 10 min |
| Canvas | ACU `userId` ownership chain | Graph may not load | 15 min |
| Canvas | Pre-positioned graph camera | Graph starts zoomed out | 20 min |
| Home | Provider distribution icons | Provider badges missing | 10 min |
| Home | Search functionality | Search returns no results | 15 min |
| Circles | Circle members + activity | Circles look empty | 15 min |
| Profile | Trust score display | Score not shown | 5 min |
| Memories | Memory consolidation chain | Memories not surfaced | 15 min |

---

## How to Run the Full Demo Suite

### Prerequisites (Already Done)
- PostgreSQL running on `localhost:5432`
- Bun v1.3.9+
- Chromium at `C:/Users/VIVIM.inc/AppData/Local/ms-playwright/chromium-1208/chrome-win64/chrome.exe`

### Step 1: Start Servers
```powershell
# Terminal 1 — API Server
cd C:\0-BlackBoxProject-0\vivim-app-og\vivim-app
bun run dev:server

# Terminal 2 — PWA
cd C:\0-BlackBoxProject-0\vivim-app-og\vivim-app\pwa
bun run dev
```

### Step 2: Re-Seed (After Fix Applied)
```bash
cd server
bun run prisma:seed:investor

# Verify
curl http://localhost:3000/api/v1/conversations?limit=3 -H "Origin: http://localhost:5173"
# Should return 3 conversations
```

### Step 3: Fix Screenshot ID
```bash
# Get real conversation ID
curl -s http://localhost:3000/api/v1/conversations?limit=1 -H "Origin: http://localhost:5173"
# Extract id from response, e.g., "01336297-d3de-493c-acf6-395cba7f919f"

# Edit demo/scripts/capture-screenshots.js
# Update investor flow path:
# { path: '/conversation/01336297-d3de-493c-acf6-395cba7f919f', name: 'investor-conversation', wait: 2000 }
```

### Step 4: Re-run Screenshots
```bash
node demo/scripts/capture-screenshots.js --flow=investor
# Or for all flows:
node demo/scripts/capture-screenshots.js --flow=core-features
node demo/scripts/capture-screenshots.js --flow=knowledge-graph
```

### Step 5: Generate Slides with Screenshots
```bash
bun run demo/scripts/generate-slides.ts
bun run demo/scripts/generate-all-slides.ts
```

---

## File Change Summary

### Modified Files
| File | Change | Status |
|------|--------|--------|
| `server/.env` | `SKIP_AUTH_FOR_DEVELOPMENT=true`, `DEMO_USER_EMAIL=alex@vivimdemo.io` | ✅ Done |
| `server/src/middleware/dev-auth.js` | Use `alex@vivimdemo.io` from DB, set `userId`, log which user | ✅ Done |
| `server/src/config/index.js` | Added `demoUserEmail` env var | ✅ Done |
| `server/prisma/seed-investor.ts` | Added `ownerId` injection, `ownedConversations` array | ⚠️ Edit applied, not run |
| `demo/scripts/capture-screenshots.ts` | `domcontentloaded`, investor wait times | ✅ Done |
| `demo/scripts/capture-screenshots.js` | CommonJS rewrite, full Chrome path | ✅ Done |

### Created Files
| File | Purpose |
|------|---------|
| `demo/scripts/generate-all-slides.ts` | Generates MDX + txt for all 8 focus areas |
| `demo/scripts/db-check.js` | Quick DB state checker (rename to `.cjs`) |
| `server/db-check.cjs` | DB checker (use this one) |

### Scripts Available
```bash
bun run demo:seed          # Seed the database
bun run demo:capture       # Run screenshot capture (Bun — may hang)
node demo/scripts/capture-screenshots.js --flow=investor  # Use this instead
bun run demo:slides        # Generate investor deck
bun run demo:highlight     # Run highlights pipeline
bun run demo:reset         # Full reset + re-seed
```

---

## Known Pre-existing Issues (Not Related to This Work)

These LSP errors existed before this session and are unrelated:
- `pwa/Home.tsx` — hook dependency warnings
- `pwa/ForYou.tsx` — implicit `any` type, button type props
- `pwa/ACUGraph.tsx` — duplicate declaration, hook dependencies
- `pwa/vite.config.ts` — forEach callback return value
- `demo/plan/vivim_investor_demo_strategy.html` — button type attributes

---

## Debug Commands Reference

```bash
# Check who's on the database ports
netstat -ano | findstr ":5432 :3000 :5173"

# Kill process by PID
taskkill //F //PID <pid>

# Quick DB check (run from server/ dir)
node db-check.cjs

# Test auth endpoint
curl http://localhost:3000/api/v1/auth/me -H "Origin: http://localhost:5173"

# Test conversations endpoint
curl "http://localhost:3000/api/v1/conversations?limit=3" -H "Origin: http://localhost:5173"

# Test specific conversation
curl "http://localhost:3000/api/v1/conversations/<ID>" -H "Origin: http://localhost:5173"

# List screenshots
dir /s /b demo/screenshots/*.png

# Playwright version
node_modules/.bin/playwright --version
```

---

## Next Session Priorities

1. **Re-run seed** with `ownerId` fix and verify API returns conversations
2. **Get real conversation ID** and fix `/conversation/:id` screenshot
3. **Test all 4 investor pages** in browser — verify data renders
4. **Expand seed data** for impressive ForYou feed and Canvas graph
5. **Inject screenshots into MDX** slide decks
6. **Final output bundle** — HTML deck + MDX + scripts + screenshots
