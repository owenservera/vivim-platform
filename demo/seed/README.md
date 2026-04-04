# Demo Seed Data Guide

## Overview

This directory contains seed data and scripts for the VIVIM investor demo environment.

## Quick Start

```bash
# From project root
cd server
bun run prisma/seed-investor.ts

# Or use the reset script
bun run demo:reset
```

## Seed Scripts

### `seed-investor.ts`
Main seed script that creates the "Alex Chen" demo persona with:
- 250-400 conversations across 5+ AI providers
- 1000+ ACUs with pre-computed embeddings
- Memory pre-loads
- Social connections (circles, friends, groups)

### `reset-demo.ts`
One-command reset that:
1. Truncates all demo tables
2. Re-runs seed-investor.ts
3. Pre-computes embeddings
4. Clears Redis cache

## Data Model

See [INVESTOR_DEMO_SCHEMA.md](./INVESTOR_DEMO_SCHEMA.md) for the full specification.

## Requirements

- PostgreSQL running
- Redis running
- `VIVIM_DEMO_MODE=true` in environment
- Node.js 20+ or Bun

## Troubleshooting

### "Table not found"
```bash
cd server
bun run prisma:generate
bun run prisma:migrate
```

### Embeddings slow
Pre-compute embeddings are batched. First load may be slower.

### "Demo mode not enabled"
```bash
export VIVIM_DEMO_MODE=true
```
