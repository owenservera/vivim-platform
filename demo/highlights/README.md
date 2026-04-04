# Demo Highlights System

Customizable investor demo flows keyed to specific focus areas.

## How It Works

Each focus area is a self-contained demo configuration:

```
focus area ID → narrative + seed weights + click script + screenshots + slides
```

The system generates:
1. **Narrative script** (hook, body bullets, close) — what you say
2. **Click script** (pages + wait times + notes) — what you click
3. **Search queries** — pre-verified searches that return results
4. **Screenshots** — Playwright captures of every page in the flow
5. **Slide deck** — MDX + printable script for post-demo materials

## Focus Areas

| ID | Name | Investor | Time |
|----|------|---------|------|
| `knowledgeGraph` | Knowledge Graph | all | 30-40s |
| `coreCapture` | Core Capture | all | 20-25s |
| `contextEngine` | Context Engine | technical | 25-30s |
| `forYouFeed` | For You Feed | product | 20-25s |
| `identityStorage` | Identity & Storage | technical | 20-25s |
| `socialSharing` | Social & Sharing | business | 20-25s |
| `aiNative` | AI Native | product | 25-30s |
| `fullJourney` | Full Journey | all | 90-120s |

## Usage

### Run a specific focus area
```bash
bun run demo:highlight --focus=knowledgeGraph
```

### Available focus areas
```bash
bun run demo:highlight --focus=help
```

### Skip seed / screenshots / slides
```bash
bun run demo:highlight --focus=knowledgeGraph --skip-seed --skip-slides
```

### Seed only (no capture)
```bash
bun run demo:highlight --focus=knowledgeGraph --seed-only
```

### Quick start: full pipeline
```bash
bun run demo:reset          # Clear + seed
bun run dev                  # Start servers
bun run demo:highlight --focus=knowledgeGraph   # Capture + slides
```

## Output

All output goes into:
```
demo/screenshots/highlights/<focus-id>/
demo/slides/highlights/<focus-id>/
```

Each run produces:
- `N-screenshot-label.png` — one per page in each flow
- `<focus-id>-slides.md` — MDX slide content with screenshot references
- `<focus-id>-script.txt` — printable demo script with checklist

## Adding a New Focus Area

Edit `FOCUS_AREAS.ts`:

```typescript
myNewFocus: {
  id: 'myNewFocus',
  name: 'My Feature',
  tagline: 'One sentence pitch',
  investorType: 'technical' | 'product' | 'business' | 'all',
  demoTime: '25s',
  narrative: {
    hook: 'First line they hear...',
    body: ['Point 1...', 'Point 2...'],
    close: 'Last line before Q&A...'
  },
  flows: [
    {
      name: 'Flow Name',
      pages: [
        { path: '/some-page', label: 'UI Label', wait: 2000, notes: 'Pre-position camera' }
      ]
    }
  ],
  seedWeights: { /* see SeedWeights interface */ },
  slideSlugs: ['slide-1', 'slide-2'],
  searchQueries: ['query that returns results'],
  screenshots: ['screenshot-name'],
}
```

## Investor Type Routing

| Investor Type | Recommended Focus Areas |
|--------------|------------------------|
| **Technical / CTO** | `contextEngine`, `identityStorage`, `knowledgeGraph` |
| **Product / PM** | `forYouFeed`, `aiNative`, `knowledgeGraph` |
| **Business / Growth** | `socialSharing`, `coreCapture`, `forYouFeed` |
| **Unknown / General** | `knowledgeGraph` (weapon) or `fullJourney` |

## Seed Weight System

Each focus area drives the seed script to generate tailored data:

```bash
bun run demo:reset --focus=knowledgeGraph     # Heavy on react/typescript/architecture topics
bun run demo:reset --focus=socialSharing     # Heavy on circles, groups, friendships
bun run demo:reset --focus=identityStorage  # Light seed, focus on identity features
```

### How it works

`FOCUS_SEED_CONFIGS` in `seed-investor.ts` defines per-focus:
- **Provider distribution** — which AI providers get more conversations
- **Topic slugs** — which subject areas dominate the seed data
- **Conversation multiplier** — scales total count (0.5x–1.0x)

When `demo:highlight` runs, it passes `--focus` + `--conversations=N` to the seed script, which:
1. Clears the database
2. Generates N conversations weighted by focus area
3. Creates ~3x messages per conversation
4. Creates ~3x ACUs extracted from messages
5. Creates ~0.5x ACU relationships (explains, follows_up, related_to, etc.)
6. Seeds topic profiles, entity profiles, memories, circles, notebooks, groups

### Override seed manually
```bash
bun run prisma:seed:investor -- --focus=knowledgeGraph --conversations=200
bun run prisma:seed:investor -- --help
```
