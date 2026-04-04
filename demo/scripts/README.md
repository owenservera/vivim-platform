# Demo Scripts

This directory contains automation scripts for the investor demo.

## Scripts

### `reset-demo.ts`
Full demo reset: wipes DB, re-seeds, pre-computes embeddings, clears cache.

### `capture-screenshots.ts`
Playwright-based screenshot capture for key demo flows.

### `generate-slides.ts`
MDX slide generation from screenshots.

### `demo-reset.sh`
Quick shell command for reset.

## Usage

```bash
# Reset demo
bun run demo:reset

# Capture screenshots  
bun run demo:capture --flow=onboarding

# Generate slides
bun run demo:slides --template=investor
```

## Requirements

- Playwright installed (`npx playwright install`)
- Demo environment configured
- VIVIM_DEMO_MODE=true
