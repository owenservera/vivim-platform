# VIVIM â€” Observability Layer Implementation Guide

**Date**: April 5, 2026
**Purpose**: Investor POC observability â€” make the invisible visible
**Status**: âœ… Complete

---

## What Was Built

### 1. Telemetry Hub (`sdk/src/telemetry/hub.ts`)
In-memory metrics collection with 4 metric types:

| Type | Purpose | Example |
|------|---------|---------|
| Counter | Monotonically increasing count | `memory_create` = 50,000 |
| Gauge | Current value with min/max tracking | `memory_total` = 2,847 |
| Histogram | Distribution with percentiles | `api_latency` p50=45ms, p95=120ms |
| Event Log | Timestamped events with levels | `memory_extract` info/warn/error |

**Key APIs:**
```ts
telemetry.increment('memory_create');
telemetry.gauge('memory_total', 50000);
telemetry.record('api_latency', 45);
telemetry.event({ type: 'magic_moment', level: 'info', message: 'âœ¨ Graph rendered' });
```

### 2. SDK Instrumentation (`sdk/src/telemetry/instrumentation.ts`)
Automatic telemetry wrappers for every SDK module:

| Module | Metrics Collected |
|--------|------------------|
| MemoryCommands | create/get/search/delete/list latency, errors, counts |
| ToolRegistry | execute latency, success/error rates, active tool count |
| AgentSpawner | spawn count, execution latency, success/failure rates |
| TaskManager | create/execute/stop counts, latency, state transitions |
| MemoryExtractor | candidates found, extracted, rejected, accuracy |
| CompressionService | compression ratio, token savings, latency |
| PluginLoader | discover/install/load/error events |

**One-liner to instrument everything:**
```ts
import { instrumentSDK, TelemetryHub } from '@vivim/sdk';

const telemetry = new TelemetryHub();
instrumentSDK(telemetry, { memoryCommands, toolRegistry, agentSpawner, taskManager });
```

### 3. Demo Engine (`sdk/src/telemetry/demo-engine.ts`)
Scripted investor demo journeys with:

- **`DemoEventBus`** â€” Pub/sub for cross-component coordination
- **`JourneyRunner`** â€” Step-by-step execution with narration, screenshot markers, magic moment triggers
- **`createInvestorPitchJourney()`** â€” 90-second cinematic demo (6 steps, 3 magic moments)
- **`createOnboardingJourney()`** â€” 45-second quick start demo (3 steps)

**Magic Moment System:**
```ts
runner.triggerMagicMoment({
  name: 'The Knowledge Graph',
  metric: 'graph_nodes',
  value: '1,547',
  story: 'Your AI brain â€” every conversation, connected.',
});
```

### 4. Server Metrics (`server/src/metrics.ts`)
Prometheus-compatible metrics endpoint:

| Endpoint | Format | Auth |
|----------|--------|------|
| `GET /api/health` | JSON health check | Public |
| `GET /api/metrics` | Prometheus text | API key |
| `GET /api/metrics/json` | JSON metrics | API key |

**Auto-middleware** records every request:
```ts
app.use(metricsMiddleware(collector));
```

### 5. Demo API Routes (`server/src/routes/demo-api.ts`)
Full demo journey management:

| Endpoint | Purpose |
|----------|---------|
| `GET /api/demo` | Demo API info |
| `GET /api/demo/journeys` | List all journeys |
| `GET /api/demo/journeys/:slug` | Journey details + FAQ |
| `POST /api/demo/run/:slug` | Start a journey |
| `DELETE /api/demo/run` | Cancel running journey |
| `GET /api/demo/status` | System + demo status |
| `GET /api/demo/config` | Feature flags, providers, viewport |
| `POST /api/demo/seed` | Seed database for demo |
| `GET /api/demo/metrics` | Demo-specific metrics |

### 6. PWA Demo Components (`pwa/src/components/demo/`)
Investor-facing visualization components:

| Component | Purpose | Animation |
|-----------|---------|-----------|
| `MetricCard` | Animated metric with trend | Counter animation, fade-in |
| `LiveEventFeed` | Real-time terminal-style event stream | Slide-in, auto-scroll |
| `SystemHealthDashboard` | 5-component health status | Status dots |
| `DemoStatusBadge` | Current demo state with progress bar | Spring animation |
| `MagicMomentBanner` | Floating wow moment overlay | Spring bounce, auto-dismiss |
| `JourneyProgressBar` | Cinematic progress + narration | Fade narration transitions |

---

## Architecture

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚                    OBSERVABILITY STACK                           â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚                                                                  â”‚
â”‚  SDK Layer              Server Layer           PWA Layer        â”‚
â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”       â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”      â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”  â”‚
â”‚  â”‚TelemetryHub â”‚â”€â”€â”€â”€â”€â”€â–¶â”‚MetricsCollectâ”‚â”€â”€â”€â”€â”€â–¶â”‚MetricCard    â”‚  â”‚
â”‚  â”‚             â”‚       â”‚              â”‚      â”‚LiveEventFeed â”‚  â”‚
â”‚  â”‚Instrument   â”‚       â”‚Demo API      â”‚      â”‚HealthDash    â”‚  â”‚
â”‚  â”‚  Memory     â”‚       â”‚  /journeys   â”‚      â”‚MagicMoment   â”‚  â”‚
â”‚  â”‚  Tools      â”‚       â”‚  /run/:slug  â”‚      â”‚JourneyBar    â”‚  â”‚
â”‚  â”‚  Agents     â”‚       â”‚  /seed       â”‚      â”‚StatusBadge   â”‚  â”‚
â”‚  â”‚  Tasks      â”‚       â”‚  /metrics    â”‚      â”‚              â”‚  â”‚
â”‚  â”‚  Extract    â”‚       â”‚  /status     â”‚      â”‚              â”‚  â”‚
â”‚  â”‚  Compress   â”‚       â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜      â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜  â”‚
â”‚  â”‚  Plugins    â”‚                                    â”‚           â”‚
â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜       â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”             â”‚           â”‚
â”‚                        â”‚Demo Engine   â”‚â—€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜           â”‚
â”‚                        â”‚JourneyRunner â”‚  Events + Metrics       â”‚
â”‚                        â”‚DemoEventBus  â”‚                         â”‚
â”‚                        â”‚Magic Moments â”‚                         â”‚
â”‚                        â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜                         â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

---

## Quick Start: Run the Investor Pitch Demo

### 1. Seed the Database
```bash
curl -X POST http://localhost:3000/api/demo/seed
```

### 2. Start the Journey
```bash
curl -X POST http://localhost:3000/api/demo/run/investor-pitch
```

### 3. Watch Metrics
```bash
curl http://localhost:3000/api/demo/metrics
```

### 4. View the Dashboard
Open `http://localhost:5173/demo/investor-pitch` to see:
- Live MetricCards with animated counters
- Real-time event feed
- System health dashboard
- Magic moment banners

---

## The Three Magic Moments

### Magic Moment #1: The Archive (0-15s)
```ts
runner.triggerMagicMoment({
  name: 'The Archive',
  metric: 'sessions',
  value: '609',
  story: 'Where AI thinking goes to die â€” until now.',
});
```
**Visual**: Massive timeline scroll of imported conversations from 6+ providers.
**Metrics shown**: Session count, provider count, message count.

### Magic Moment #2: The Knowledge Graph (35-60s)
```ts
runner.triggerMagicMoment({
  name: 'Knowledge Graph',
  metric: 'graph_nodes',
  value: '1,547',
  story: 'Your AI brain â€” every conversation, connected.',
});
```
**Visual**: Canvas-based force-directed graph with 1,500+ nodes.
**Metrics shown**: Node count, edge count, graph density.

### Magic Moment #3: The Context Cockpit (60-80s)
```ts
runner.triggerMagicMoment({
  name: 'Context Cockpit',
  metric: 'memories',
  value: '2,847',
  story: 'AI that knows you â€” because it remembers everything.',
});
```
**Visual**: 7-layer context stack with live token budgets.
**Metrics shown**: Memory count, token budget, relevance score.

---

## Investor Demo Checklist

### Pre-Demo (30 min before)
- [ ] Reset database: `POST /api/demo/seed` (creates 320 conversations, 2,000+ memories)
- [ ] Verify health: `GET /api/demo/status` (all green)
- [ ] Check metrics: `GET /api/metrics/json` (baseline values)
- [ ] Test journey: `POST /api/demo/run/investor-pitch` (dry run)
- [ ] Screen: 1080p, dark mode, notifications off
- [ ] Backup: Record Loom of dry run

### During Demo
- [ ] Start with `/api/demo/status` â€” show system health
- [ ] Run seed â€” "Watch as we populate 320 conversations..."
- [ ] Run journey â€” investor-pitch (90 seconds)
- [ ] Point to MetricCards â€” "50,000+ memories captured"
- [ ] Trigger Magic Moment #2 â€” "This is the money shot"
- [ ] Show LiveEventFeed â€” "Every operation, visible"
- [ ] Close with `/api/demo/metrics` â€” concrete numbers

### Post-Demo
- [ ] Export metrics: `GET /api/metrics/json` â†’ save as JSON
- [ ] Show cost analysis from exported data
- [ ] Answer FAQ from journey definitions
- [ ] Send follow-up with recorded Loom

---

## File Summary

### New Files (12)
| File | Lines | Purpose |
|------|-------|---------|
| `docs/OBSERVABILITY_STRATEGY.md` | 180 | Design doc with architecture, principles, metrics |
| `sdk/src/telemetry/hub.ts` | 310 | TelemetryHub with counters, gauges, histograms, events |
| `sdk/src/telemetry/instrumentation.ts` | 220 | Auto-instrumentation wrappers for all SDK modules |
| `sdk/src/telemetry/demo-engine.ts` | 499 | JourneyRunner, DemoEventBus, built-in journeys |
| `sdk/src/telemetry/index.ts` | 35 | Barrel exports for telemetry module |
| `server/src/metrics.ts` | 240 | Prometheus-compatible metrics + middleware |
| `server/src/routes/demo-api.ts` | 200 | Demo journey API routes |
| `pwa/src/components/demo/investor-demo.tsx` | 400 | 6 React components with Framer Motion animations |
| `pwa/src/components/demo/index.ts` | 25 | Barrel exports for demo components |

### Modified Files (2)
| File | Change |
|------|--------|
| `sdk/src/index.ts` | Added telemetry, services, plugins exports |

### Total: ~2,100 lines of observability code

---

## Next Steps (Post-POC)

1. **Persistent metrics** â€” Replace in-memory TelemetryHub with SQLite/Turso for long-term tracking
2. **Grafana dashboard** â€” Connect Prometheus endpoint to Grafana for investor dashboard
3. **Screenshot capture** â€” Integrate Playwright to auto-capture journey screenshots
4. **Session replay** â€” Record full demo sessions for async investor review
5. **A/B test narratives** â€” Test different narration scripts for different investor types
6. **Real-time WebSocket** â€” Push metrics to PWA via WebSocket for live updates
7. **Investor-specific URLs** â€” `/vivim-pitch/sequoia` vs `/vivim-pitch/a16z` personalization
