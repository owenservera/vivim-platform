# VIVIM Interactive Demo Patterns

## Overview

This document outlines the interactive demonstration patterns used in VIVIM's investor demos and provides guidance for creating new cinematic demos.

---

## Demo Focus Areas

Based on `FOCUS_AREAS.ts`, there are 8 proven demo flows:

| Focus Area | Demo Time | Pages in Flow |
|------------|-----------|---------------|
| Knowledge Graph | 30-40s | 5 |
| Core Capture | 20-25s | 5 |
| Context Engine | 25-30s | 3 |
| For You Feed | 20-25s | 3 |
| Identity & Storage | 20-25s | 3 |
| Social Sharing | 20-25s | 2 |
| AI Native | 25-30s | 3 |
| Full Journey | 90-120s | 8+ |

---

## Demo Inventory

### 1. Archive Overview

**Pages**:
- `/archive` - Archive timeline view
- `/archive?view=grid` - Grid by provider
- `/archive/imported` - Imported sources

**Seed Data**:
- 320 conversations across 6 providers
- Topics: react, typescript, architecture, postgres

**Search Queries that work**:
- `react hooks architecture`
- `postgres indexing`
- `typescript generics`

---

### 2. Canvas Graph (Money Shot)

**Pages**:
- `/archive` - Archive timeline
- `/archive?view=canvas` - Force-directed canvas
- `/conversation/:graph-seed-id` - ACU Graph detail

**Key Features**:
- Pre-position camera on largest cluster
- Show force-directed animation
- Highlight node connections

**Notes**: "Pre-position camera on largest cluster"

---

### 3. Capture Flow

**Pages**:
- `/capture` - Capture page
- `/import` - Import options

**Features**:
- One-tap capture UI
- Multi-provider selection
- Import status indicators

---

### 4. Context Cockpit

**Pages**:
- `/context-cockpit` - Full context view
- `/chat` - VIVIM AI with context
- `/settings/context` - Context recipes

**Key Metrics to Show**:
- Token budget allocation (12,300 tokens)
- Memory retrieval breakdown
- Topic detection
- Entity extraction

---

### 5. For You Feed

**Pages**:
- `/for-you` - Personalized feed
- `/for-you?topic=react` - Filtered by topic
- `/analytics` - Usage analytics

**Features**:
- AI-curated content
- Topic filters
- Usage patterns

---

### 6. Social Features

**Pages**:
- `/archive/shared` - Shared conversations
- `/settings/advanced` - Sharing settings
- `/circles` - Team circles

**Features**:
- One-tap sharing
- Attribution display
- Circle management

---

## Demo Implementation Patterns

### Seed Data Structure

```typescript
interface SeedWeights {
  conversations: number;      // 320 default
  topics: string[];          // ['react', 'typescript', ...]
  providers: string[];       // ['chatgpt', 'claude', ...]
  memoryDepth: 'light' | 'medium' | 'heavy';
  circles: number;
  groups: number;
  friendships: number;
  notebooks: number;
}

// Example: knowledgeGraph focus
{
  conversations: 320,
  topics: ['react', 'typescript', 'architecture', 'postgres', 'system_design'],
  providers: ['chatgpt', 'claude', 'gemini', 'deepseek'],
  memoryDepth: 'heavy',
  circles: 2,
  groups: 2,
  friendships: 3,
  notebooks: 3
}
```

---

### Demo Script Structure

```typescript
interface HighlightFlow {
  name: string;
  pages: Array<{
    path: string;
    label: string;
    wait?: number;      // ms to wait after load
    notes?: string;    // special instructions
  }>;
  seedOverrides?: Partial<SeedWeights>;
}
```

---

### Run Commands

```bash
# Full demo pipeline
bun run demo:reset          # Clear + seed
bun run dev                  # Start servers
bun run demo:highlight --focus=knowledgeGraph   # Capture + slides

# Run specific focus area
bun run demo:highlight --focus=knowledgeGraph

# Skip seed / screenshots / slides
bun run demo:highlight --focus=knowledgeGraph --skip-seed --skip-slides

# Seed only
bun run demo:highlight --focus=knowledgeGraph --seed-only
```

---

## Demo Screenshots

### Captured Screenshots Location

```
demo/screenshots/highlights/<focus-id>/
```

### Screenshot Naming

```
<N>-<page-label>.png
```

Example:
```
1-archive-canvas-full.png
2-acu-graph-detail.png
3-search-results-graph.png
```

---

## Demo Slides Generation

### Location

```
demo/slides/highlights/<focus-id>/
```

### Output Files

- `<focus-id>-slides.md` - MDX slide content
- `<focus-id>-script.txt` - Printable demo script

---

## Pre-Demo Checklist

### Night Before
- [ ] Run seed reset, verify 250+ conversations
- [ ] Verify embeddings pre-computed
- [ ] Record 1080p screen capture backup
- [ ] Test all 3 demo search queries
- [ ] Practice script 5+ times (85-95 seconds)

### Day Of
- [ ] Demo Chrome profile only, nothing else
- [ ] Pre-navigate to archive view
- [ ] Disable all notifications
- [ ] Loom backup URL in clipboard
- [ ] Mobile hotspot ready

---

## Key Demo Principles

1. **Live demo only** — no recordings during meeting
2. **Pre-logged in** — never type password
3. **250-400 conversations** seeded across 5+ providers
4. **Scripted searches** that always return right results
5. **Pre-positioned** graph camera
6. **Pre-run animations**
7. **Backup recording** ready in clipboard

---

## What NOT to Do

- Live capture during demo (providers change, will fail)
- Show empty states (pre-seed everything)
- Feature touring (tell a story, not spec sheet)
- Explain the UI (if you need to, it's UX problem)
- Go past 90 seconds before questions
- Wing any click (practice until muscle memory)

---

## Demo Story Arc (90 seconds)

| Phase | Time | What to Show |
|-------|------|--------------|
| Hook | 0-15s | 3 browser tabs (ChatGPT, Claude, Gemini) — "where AI thinking goes to die" |
| Magic #1 | 15-35s | VIVIM archive — 9 providers, timeline view, weeks of organized AI work |
| **Magic #2** | 35-60s | **Knowledge graph canvas** — the money shot |
| Magic #3 | 60-80s | Context cockpit — AI that knows you |
| Close | 80-90s | "That's VIVIM. You own your AI brain." — stop, let them ask |

---

## Investor Type Routing

| Investor | Recommended Focus Areas |
|----------|------------------------|
| **Technical / CTO** | contextEngine, identityStorage, knowledgeGraph |
| **Product / PM** | forYouFeed, aiNative, knowledgeGraph |
| **Business / Growth** | socialSharing, coreCapture, forYouFeed |
| **Unknown / General** | knowledgeGraph (weapon) or fullJourney |

---

## API Routes for Demos

| Route | Purpose |
|-------|---------|
| `/api/acus/search` | Search ACUs |
| `/api/conversations` | List conversations |
| `/api/context/generate` | Generate context |
| `/api/feed/for-you` | Get personalized feed |
| `/api/sharing/share` | Share content |
| `/api/identity/profile` | Get user profile |

---

## Demo Service

```typescript
// server/src/services/demo-service.js
class DemoService {
  // Seed demo data
  async seedDemoData(weights: SeedWeights): Promise<void>
  
  // Reset to clean state
  async resetDemo(): Promise<void>
  
  // Capture screenshot
  async capturePage(path: string): Promise<string>
  
  // Generate slides
  async generateSlides(focusId: string): Promise<void>
}
```
