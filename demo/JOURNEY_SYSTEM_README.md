# VIVIM Demo Journey System

**Automated user journey capture for investor demos and documentation**

---

## Quick Start

```bash
# 1. Start servers
bun run dev

# 2. Seed demo data
bun run demo:seed

# 3. Run pre-flight check (fetches real IDs)
bun run demo:preflight

# 4. Capture a journey
bun run demo:journey --script=problem-solver

# 5. View output
open demo/screenshots/journeys/problem-solver/problem-solver-preview.html
```

---

## What Is This?

The Journey System automatically captures full-page screenshots of user flows in the VIVIM app. It:

1. **Reads markdown scripts** that define user journeys
2. **Launches a headless browser** (Playwright/Chromium)
3. **Navigates through pages** capturing screenshots at each step
4. **Generates reports** in markdown and HTML format

Perfect for:
- Investor demo preparation
- Documentation screenshots
- Visual regression testing
- Onboarding materials

---

## Available Journeys

| Journey | Time | Description | Command |
|---------|------|-------------|---------|
| **Onboarding** | 45s | First-time user setup | `--script=onboarding` |
| **Daily Worker** | 60s | Daily knowledge workflow | `--script=daily-worker` |
| **Problem Solver** | 90s | Debugging with graph | `--script=problem-solver` |
| **Team Collab** | 75s | Social features | `--script=team-collab` |
| **Deep Research** | 120s | Comprehensive research | `--script=deep-research` |
| **Investor Pitch** | 90s | The money demo | `--script=investor-pitch` |

---

## Usage

### Run a Single Journey

```bash
bun run demo:journey --script=problem-solver
```

### Run All Journeys

```bash
bun run demo:journey:all
```

### Run with Custom Output

```bash
SCREENSHOT_OUTPUT_DIR=demo/screenshots/custom \
bun run demo:journey --script=investor-pitch
```

### Run in Visible Mode (Debug)

```bash
DEMO_HEADLESS=false bun run demo:journey --script=daily-worker
```

---

## Journey Script Format

Journey scripts are markdown files with structured tables:

```markdown
---
title: My Journey
description: What this journey demonstrates
duration: 60s
target: Who this is for
---

## Pre-Conditions

- [ ] Server running
- [ ] 320 conversations seeded

## Steps

| Step | Action | URL | Wait | Screenshot | Notes |
|------|--------|-----|------|------------|-------|
| 1 | Navigate | /archive | 2000 | ✅ | Starting point |
| 2 | Navigate | /archive/search?q=react | 3000 | ✅ | Search demo |
| 3 | Scroll | scroll | 1000 | ✅ | Show results |
```

### Special Tokens

- `:id` — Replaced with real conversation ID from API
- `:acu-id` — Replaced with real ACU ID
- `:graph-seed-id` — Replaced with graph seed conversation

### Actions

- `Navigate` — Go to URL
- `Click` — Click selector
- `Type` — Type text
- `Scroll` — Scroll down
- `Scroll-Up` — Scroll up
- `Wait-For` — Wait for selector

---

## Output Structure

```
demo/screenshots/journeys/
└── problem-solver/
    ├── 01-archive-home.png
    ├── 02-search-results.png
    ├── 03-conversation-detail.png
    ├── 04-canvas-graph.png
    ├── 05-canvas-zoomed.png
    ├── problem-solver-report.md    # Markdown report
    └── problem-solver-preview.html # HTML preview
```

---

## Pre-Flight Check

Before running journeys, run the pre-flight check to fetch real conversation IDs:

```bash
bun run demo:preflight
```

This:
1. Checks server health
2. Checks PWA health
3. Fetches a real conversation ID
4. Updates screenshot scripts automatically

**Output:**
```
✅ Pre-flight check complete!
   Found conversation: 01336297-d3de-493c-acf6-395cba7f919f
   Updated screenshot script
```

---

## Configuration

### Environment Variables

```bash
# API Configuration
API_URL=http://localhost:3000
PWA_URL=http://localhost:5173

# Browser Configuration
PLAYWRIGHT_BROWSERS_PATH=/path/to/chromium
DEMO_HEADLESS=true
DEMO_VIEWPORT_WIDTH=1920
DEMO_VIEWPORT_HEIGHT=1080

# Output Configuration
SCREENSHOT_OUTPUT_DIR=demo/screenshots/journeys
```

### .env.demo Example

```bash
VIVIM_DEMO_MODE=true
API_URL=http://localhost:3000
PWA_URL=http://localhost:5173
DEMO_HEADLESS=true
DEMO_VIEWPORT_WIDTH=1920
DEMO_VIEWPORT_HEIGHT=1080
SCREENSHOT_OUTPUT_DIR=demo/screenshots/journeys
```

---

## Troubleshooting

### "API not responding"

**Problem:** Server not running on port 3000

**Solution:**
```bash
cd server && bun run dev
```

### "No conversations found"

**Problem:** Database empty

**Solution:**
```bash
bun run demo:seed
```

### "Screenshot blank"

**Problem:** Page didn't load in time

**Solution:** Increase wait time in journey script:
```markdown
| 2 | Navigate | /archive | 5000 | ✅ | Increased wait |
```

### "Graph doesn't render"

**Problem:** Embeddings not computed or graph too large

**Solution:**
1. Refresh page before capture
2. Use smaller seed: `--conversations=100`
3. Fall back to Loom backup

---

## Advanced Usage

### Custom Journey Scripts

Create a new journey in `demo/journeys/my-custom.md`:

```markdown
---
title: My Custom Journey
duration: 30s
target: Specific audience
---

## Steps

| Step | Action | URL | Wait | Screenshot | Notes |
|------|--------|-----|------|------------|-------|
| 1 | Navigate | /archive | 2000 | ✅ | Start |
| 2 | Navigate | /for-you | 3000 | ✅ | Feed |
```

Run it:
```bash
bun run demo:journey --script=my-custom
```

### Batch Capture

Run multiple journeys in sequence:

```bash
for journey in onboarding daily-worker problem-solver; do
  bun run demo:journey --script=$journey
done
```

### Visual Regression

Compare screenshots against baseline:

```bash
# Capture baseline
bun run demo:journey --script=problem-solver
cp -r demo/screenshots/journeys/problem-solver baseline/

# After changes, capture again and diff
bun run demo:journey --script=problem-solver
diff -r baseline/ demo/screenshots/journeys/problem-solver/
```

---

## Integration with Other Demo Tools

### With Highlights System

```bash
# Run highlight (captures focus-area screenshots)
bun run demo:highlight --focus=knowledgeGraph

# Run journey (captures user flow)
bun run demo:journey --script=problem-solver

# Generate slides from both
bun run demo:slides
```

### With Screenshot Capture

```bash
# Legacy capture (specific flows)
node demo/scripts/capture-screenshots.js --flow=investor

# Journey capture (full user flows)
bun run demo:journey --script=investor-pitch
```

---

## File Reference

| File | Purpose |
|------|---------|
| `demo/scripts/journey-runner.ts` | Main CLI runner |
| `demo/scripts/preflight.ts` | Pre-flight ID fetcher |
| `demo/journeys/*.md` | Journey script definitions |
| `demo/screenshots/journeys/` | Output directory |
| `demo/AUTOMATED_CAPTURE_SYSTEM_DESIGN.md` | System design doc |
| `demo/scripts/user-journey-scripts.md` | Narration scripts |

---

## Performance Benchmarks

| Metric | Target | Actual |
|--------|--------|--------|
| Journey capture rate | >95% | - |
| Screenshot quality | 1080p | 1920x1080 |
| ID resolution | 100% | - |
| Average journey time | <2x manual | - |

---

## Future Enhancements

- [ ] Video recording (MP4)
- [ ] GIF generation
- [ ] Multi-device capture (mobile, tablet)
- [ ] CI integration
- [ ] Hot reload for script changes
- [ ] Interactive step-through mode

---

## Related Documentation

- [User Journey Scripts](./scripts/user-journey-scripts.md) — Narration and timing
- [Automated Capture Design](./AUTOMATED_CAPTURE_SYSTEM_DESIGN.md) — Technical design
- [Focus Areas](./highlights/README.md) — Investor-focused demos
- [Bridge the Gap Progress](./BRIDGE_THE_GAP_PROGRESS.md) — Implementation status

---

**Last Updated:** March 19, 2026  
**Status:** Implementation Complete — Ready for Use
