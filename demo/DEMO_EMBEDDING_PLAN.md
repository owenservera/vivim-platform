# VIVIM Demo Embedding Plan

## Executive Summary

This document outlines a comprehensive plan to embed the VIVIM demo system into the `github-frontend` Next.js application, enabling:

- Interactive demo journey viewer
- Live screenshot gallery
- API endpoints for demo data
- Embeddable demo components

---

## Current State

### Existing Demo Infrastructure

| Component           | Location                              | Status               |
| ------------------- | ------------------------------------- | -------------------- |
| Journey Scripts     | `demo/journeys/*.md`                  | ✅ 6 complete        |
| Screenshot Capture  | `demo/scripts/capture-screenshots.ts` | ✅ Playwright-based  |
| Journey Runner      | `demo/scripts/journey-runner.ts`      | ✅ CLI tool          |
| Pre-flight Resolver | `demo/scripts/preflight.ts`           | ✅ ID resolution     |
| Screenshots Output  | `demo/screenshots/journeys/*/`        | 📋 Mock reports only |

### Frontend Targets

| App               | Framework             | Routes                                                                   |
| ----------------- | --------------------- | ------------------------------------------------------------------------ |
| `github-frontend` | Next.js 15 + React 19 | `/repository`, `/docs`, `/issues`, `/pull-requests`, `/releases`, `/sdk` |
| `pwa`             | Vite + React          | Full app at `/archive`, `/canvas`, `/context-cockpit`                    |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        GITHUB FRONTEND (Next.js)                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │ /demo       │  │ /demo/journey│  │ /demo/live  │  │ /demo/api   │     │
│  │ (landing)   │  │ (viewer)     │  │ (interactive)│ │ (endpoints) │     │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘     │
└──────────────────────────────────┬──────────────────────────────────────┘
                                   │
                    ┌──────────────┴──────────────┐
                    │         VIVIM SERVER          │
                    │  ┌─────────────────────────┐ │
                    │  │ /api/demo/* routes     │ │
                    │  │ - /journeys            │ │
                    │  │ - /screenshots         │ │
                    │  │ - /run-journey         │ │
                    │  │ - /status              │ │
                    │  └─────────────────────────┘ │
                    └──────────────────────────────┘
                                   │
                    ┌──────────────┴──────────────┐
                    │       PLAYWRIGHT ENGINE       │
                    │  ┌─────────────────────────┐ │
                    │  │ Background capture      │ │
                    │  │ Live demo recording     │ │
                    │  └─────────────────────────┘ │
                    └──────────────────────────────┘
```

---

## Phase 1: Server API Layer

### 1.1 Create Demo Routes

**File:** `server/src/routes/demo.js`

```javascript
// GET /api/demo/journeys - List all journeys
// GET /api/demo/journeys/:name - Get journey details
// GET /api/demo/screenshots/:journey - Get screenshots for journey
// POST /api/demo/run/:journey - Run a journey (trigger capture)
// GET /api/demo/status - Demo system health
```

### 1.2 Demo Service Module

**File:** `server/src/services/demo-service.js`

| Method                    | Purpose                                |
| ------------------------- | -------------------------------------- |
| `getJourneys()`           | Parse all journey markdown files       |
| `getJourney(name)`        | Parse single journey with resolved IDs |
| `getScreenshots(journey)` | List captured screenshots              |
| `runJourney(name)`        | Execute journey via Playwright         |
| `getStatus()`             | System health + last capture times     |

### 1.3 Journey Parser Utility

**File:** `server/src/lib/journey-parser.js`

```javascript
// Parse markdown journey files
// Extract frontmatter (title, duration, target)
// Parse step tables (action, URL, wait, screenshot)
// Resolve :id, :acu-id tokens
// Generate screenshot filenames
```

---

## Phase 2: GitHub Frontend Pages

### 2.1 Demo Landing Page

**File:** `github-frontend/src/app/demo/page.tsx`

```tsx
// Features:
// - Hero section with demo video/preview
// - Journey cards grid (6 journeys)
// - Quick stats (conversations captured, providers supported)
// - "Run Live Demo" CTA button
// - Recent screenshots carousel
```

### 2.2 Journey Detail Page

**File:** `github-frontend/src/app/demo/[journey]/page.tsx`

```tsx
// Features:
// - Journey title, duration, target audience
// - Step-by-step timeline with screenshots
// - Narration script viewer
// - "Watch Live" button
// - Download screenshots button
// - Pre-conditions checklist
```

### 2.3 Interactive Demo Page

**File:** `github-frontend/src/app/demo/live/page.tsx`

```tsx
// Features:
// - Select journey from dropdown
// - "Start Demo" button triggers server-side capture
// - Real-time progress indicator
// - Live preview as screenshots come in
// - Auto-refresh until complete
```

---

## Phase 3: UI Components

### 3.1 Journey Card Component

**File:** `github-frontend/src/components/demo/JourneyCard.tsx`

```tsx
interface Props {
  journey: Journey;
  screenshotUrl?: string;
}

export function JourneyCard({ journey, screenshotUrl }) {
  // - Thumbnail (first screenshot or placeholder)
  // - Title, duration badge
  // - Step count
  // - Target audience tag
  // - Hover: Show preview animation
}
```

### 3.2 Screenshot Gallery Component

**File:** `github-frontend/src/components/demo/ScreenshotGallery.tsx`

```tsx
interface Props {
  screenshots: Screenshot[];
  fullscreen?: boolean;
}

export function ScreenshotGallery({ screenshots, fullscreen }) {
  // - Grid view (thumbnails)
  // - Lightbox on click
  // - Navigation arrows
  // - Step labels
  // - Download individual/all
}
```

### 3.3 Timeline Component

**File:** `github-frontend/src/components/demo/JourneyTimeline.tsx`

```tsx
interface Props {
  steps: Step[];
  currentStep?: number;
}

export function JourneyTimeline({ steps, currentStep }) {
  // - Vertical timeline
  // - Step numbers with icons
  // - Action labels (Navigate, Click, Scroll)
  // - URL/path display
  // - Screenshot thumbnails
  // - Active step highlighting
}
```

### 3.4 Demo Stats Component

**File:** `github-frontend/src/components/demo/DemoStats.tsx`

```tsx
// Display:
// - Total journeys: 6
// - Total steps: 44
// - Providers supported: 9
// - Screenshots captured: 30+
// - Demo time range: 45s - 120s
```

---

## Phase 4: Data Models

### 4.1 Journey Type

```typescript
interface Journey {
  slug: string;
  title: string;
  description: string;
  duration: string; // "90s"
  target: string; // "VCs, angel investors"
  preConditions: string[];
  steps: JourneyStep[];
  narration: NarrationSection[];
  backupPlan: BackupItem[];
  expectedQuestions: QAItem[];
  successCriteria: string[];
}

interface JourneyStep {
  step: number;
  action: "Navigate" | "Click" | "Scroll" | "Type" | "Wait";
  url: string;
  wait: number; // milliseconds
  screenshot: boolean;
  notes: string;
}
```

### 4.2 Screenshot Type

```typescript
interface Screenshot {
  id: string;
  journeySlug: string;
  stepNumber: number;
  filename: string;
  url: string; // API URL to serve file
  thumbnailUrl: string;
  fullPage: boolean;
  viewport: { width: number; height: number };
  capturedAt: Date;
  fileSize: number;
}
```

### 4.3 Demo Status Type

```typescript
interface DemoStatus {
  server: "healthy" | "degraded" | "down";
  pwa: "healthy" | "degraded" | "down";
  lastCapture: Record<string, Date>;
  journeys: {
    total: number;
    captured: number;
    pending: number;
  };
  screenshots: {
    total: number;
    latest: string;
  };
}
```

---

## Phase 5: Server API Endpoints

### 5.1 Endpoints Reference

| Method | Path                                   | Description           |
| ------ | -------------------------------------- | --------------------- |
| GET    | `/api/demo`                            | Demo system info      |
| GET    | `/api/demo/journeys`                   | List all journeys     |
| GET    | `/api/demo/journeys/:slug`             | Get journey details   |
| GET    | `/api/demo/journeys/:slug/screenshots` | List screenshots      |
| GET    | `/api/demo/screenshots/:id`            | Serve screenshot file |
| POST   | `/api/demo/run/:slug`                  | Run journey capture   |
| GET    | `/api/demo/status`                     | System health         |
| GET    | `/api/demo/config`                     | Demo configuration    |

### 5.2 Response Examples

```json
// GET /api/demo/journeys
{
  "journeys": [
    {
      "slug": "investor-pitch",
      "title": "Investor Pitch Demo",
      "description": "The 90-second investor pitch - the money demo",
      "duration": "90s",
      "target": "VCs, angel investors",
      "stepCount": 5,
      "hasScreenshots": true,
      "thumbnailUrl": "/api/demo/screenshots/investor-pitch-thumb"
    }
  ],
  "total": 6
}
```

```json
// GET /api/demo/journeys/investor-pitch
{
  "slug": "investor-pitch",
  "title": "Investor Pitch Demo",
  "duration": "90s",
  "steps": [
    {
      "step": 1,
      "action": "Navigate",
      "url": "/archive",
      "wait": 2000,
      "screenshot": true,
      "notes": "Archive timeline - starting position"
    }
  ],
  "narration": [
    {
      "phase": "Hook",
      "time": "0-15s",
      "script": "Every AI power user lives here. [Show tabs] This is where their most valuable thinking goes to die."
    }
  ]
}
```

---

## Phase 6: Implementation Tasks

### Week 1: Backend Foundation

- [ ] Create `server/src/lib/journey-parser.js`
- [ ] Create `server/src/services/demo-service.js`
- [ ] Create `server/src/routes/demo.js`
- [ ] Register demo routes in `server.js`
- [ ] Test all endpoints with curl/postman

### Week 2: Frontend Core

- [ ] Create `github-frontend/src/app/demo/page.tsx` (landing)
- [ ] Create `github-frontend/src/app/demo/[journey]/page.tsx` (detail)
- [ ] Build `JourneyCard` component
- [ ] Build `DemoStats` component
- [ ] Integrate API calls with TanStack Query

### Week 3: Gallery & Timeline

- [ ] Build `ScreenshotGallery` component
- [ ] Build `JourneyTimeline` component
- [ ] Implement lightbox viewer
- [ ] Add download functionality
- [ ] Mobile responsive styling

### Week 4: Live Features

- [ ] Create `github-frontend/src/app/demo/live/page.tsx`
- [ ] Implement run-journey API integration
- [ ] Add progress polling
- [ ] Real-time screenshot loading
- [ ] Error handling & retry logic

### Week 5: Polish & Integration

- [ ] Add animations (Framer Motion)
- [ ] Theme integration (dark/light)
- [ ] SEO metadata
- [ ] Loading states & skeletons
- [ ] End-to-end testing

---

## Phase 7: Configuration

### 7.1 Environment Variables

```bash
# .env.demo
DEMO_BASE_URL=http://localhost:5173
DEMO_OUTPUT_DIR=./demo/screenshots/journeys
DEMO_PLAYWRIGHT_HEADLESS=true
DEMO_VIEWPORT_WIDTH=1920
DEMO_VIEWPORT_HEIGHT=1080
DEMO_JOURNEY_TIMEOUT=120000
```

### 7.2 Package.json Scripts

```json
{
  "demo:api": "node server/src/routes/demo.js",
  "demo:serve": "next dev && node server/src/routes/demo.js",
  "demo:journey:run": "curl -X POST http://localhost:3000/api/demo/run/investor-pitch",
  "demo:screenshots:list": "curl http://localhost:3000/api/demo/journeys/investor-pitch/screenshots"
}
```

---

## Phase 8: File Structure

```
vivim-app/
├── demo/
│   ├── journeys/                    # Journey markdown files
│   │   ├── investor-pitch.md
│   │   ├── onboarding.md
│   │   └── ...
│   ├── screenshots/                 # Generated screenshots
│   │   ├── journeys/
│   │   │   ├── investor-pitch/
│   │   │   │   ├── 01-archive.png
│   │   │   │   ├── 02-canvas.png
│   │   │   │   └── ...
│   │   └── highlights/
│   └── scripts/                     # Capture scripts
│
├── github-frontend/
│   └── src/
│       ├── app/
│       │   ├── demo/
│       │   │   ├── page.tsx              # /demo - Landing
│       │   │   ├── [journey]/
│       │   │   │   └── page.tsx          # /demo/investor-pitch
│       │   │   └── live/
│       │   │       └── page.tsx          # /demo/live - Interactive
│       │   └── layout.tsx
│       └── components/
│           └── demo/
│               ├── JourneyCard.tsx
│               ├── ScreenshotGallery.tsx
│               ├── JourneyTimeline.tsx
│               └── DemoStats.tsx
│
└── server/
    └── src/
        ├── routes/
        │   └── demo.js                   # API endpoints
        ├── services/
        │   └── demo-service.js           # Business logic
        └── lib/
            └── journey-parser.js         # Markdown parsing
```

---

## Phase 9: Acceptance Criteria

### Functional Requirements

- [ ] All 6 journeys load from `/api/demo/journeys`
- [ ] Journey detail page shows all steps with narration
- [ ] Screenshots display in gallery with lightbox
- [ ] Timeline component highlights current step
- [ ] Live demo runner triggers server capture
- [ ] Progress indicator shows capture status

### Non-Functional Requirements

- [ ] Page load < 2s for journey list
- [ ] Screenshot thumbnails lazy load
- [ ] Lightbox transitions smooth (60fps)
- [ ] Mobile responsive at 375px width
- [ ] Dark/light theme fully supported

### Demo Quality

- [ ] Investor pitch journey has 5+ screenshots
- [ ] All screenshots are 1920x1080 PNG
- [ ] Screenshots optimized (< 500KB each)
- [ ] Alt text on all images
- [ ] ARIA labels on interactive elements

---

## Phase 10: Future Enhancements

### Post-MVP

1. **Video Recording** - Capture MP4 instead of PNG
2. **Live Streaming** - WebSocket real-time demo
3. **Multi-language** - i18n support for narration
4. **Custom Journeys** - User-defined journey builder
5. **A/B Testing** - Compare journey variants
6. **Analytics** - Track demo views & completions

---

## Appendix: Example Screenshots Configuration

```typescript
// For investor-pitch journey
const INVESTOR_PITCH_SCREENSHOTS = [
  {
    step: 1,
    name: "archive-timeline",
    url: "/archive",
    wait: 2000,
    label: "Archive timeline - starting position",
  },
  {
    step: 2,
    name: "canvas-graph",
    url: "/archive?view=canvas",
    wait: 5000,
    label: "Canvas graph - the money shot",
  },
  {
    step: 3,
    name: "scroll-graph",
    action: "scroll",
    wait: 2000,
    label: "Zoom into largest cluster",
  },
  {
    step: 4,
    name: "context-cockpit",
    url: "/context-cockpit",
    wait: 3000,
    label: "Context cockpit - 8 layers",
  },
  {
    step: 5,
    name: "archive-close",
    url: "/archive",
    wait: 2000,
    label: "Return to archive - close",
  },
];
```

---

**Document Version:** 1.0  
**Created:** March 19, 2026  
**Status:** Ready for Implementation
