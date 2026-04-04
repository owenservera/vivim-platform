# Automated Demo Screenshot Capture System

**Design Document**  
**Version:** 1.0  
**Date:** March 19, 2026

---

## Executive Summary

This document describes the design for automatically generating full-page screenshots of user journey scripts running live in the demo app. The system uses Playwright to automate browser navigation, captures screenshots at each step, and generates markdown documentation with embedded images.

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Journey Runner CLI                        │
│  (bun run demo:journey --script=problem-solver)             │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                   Journey Parser                             │
│  - Reads markdown script                                     │
│  - Extracts steps (URL, action, narration)                   │
│  - Validates sequence                                        │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                 Browser Orchestrator                         │
│  - Launches Chromium (headless)                              │
│  - Manages page context                                      │
│  - Handles navigation & waits                                │
└─────────────────────┬───────────────────────────────────────┘
                      │
         ┌────────────┼────────────┐
         │            │            │
         ▼            ▼            ▼
┌─────────────┐ ┌──────────┐ ┌──────────┐
│  Screenshot │ │  Action  │ │  Wait    │
│  Capture    │ │  Executor│ │  Manager │
└──────┬──────┘ └────┬─────┘ └────┬─────┘
       │             │             │
       └─────────────┼─────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                  Output Generator                            │
│  - Saves screenshots (PNG)                                   │
│  - Generates markdown report                                 │
│  - Creates HTML preview                                      │
└─────────────────────────────────────────────────────────────┘
```

---

## Component Design

### 1. Journey Script Format (Markdown)

Journey scripts are written in markdown with structured tables:

```markdown
# Journey: Problem Solver

| Step | Action | URL | Wait | Notes |
|------|--------|-----|------|-------|
| 1 | Navigate | /archive | 2000 | Home base |
| 2 | Search | /archive/search?q=react | 3000 | Wait for results |
| 3 | Click | /conversation/:id | 2000 | Real ID injected |
```

**Special Tokens:**
- `:id` — Replaced with real conversation ID from API
- `:acu-id` — Replaced with real ACU ID
- `:graph-seed-id` — Replaced with graph seed conversation
- `{{searchQuery}}` — Replaced with scripted search

---

### 2. Journey Runner CLI

**File:** `demo/scripts/journey-runner.ts`

```typescript
interface JourneyStep {
  step: number;
  action: string;
  url: string;
  wait?: number;
  notes?: string;
  screenshot?: boolean;
}

interface JourneyScript {
  title: string;
  description: string;
  preConditions: string[];
  steps: JourneyStep[];
}

class JourneyRunner {
  private browser: Browser;
  private page: Page;
  private script: JourneyScript;
  private outputDir: string;
  private capturedScreenshots: string[];
  
  async run(scriptPath: string): Promise<JourneyResult> {
    // 1. Parse markdown script
    this.script = await this.parseScript(scriptPath);
    
    // 2. Launch browser
    await this.launchBrowser();
    
    // 3. Execute steps
    for (const step of this.script.steps) {
      await this.executeStep(step);
    }
    
    // 4. Generate output
    return this.generateOutput();
  }
  
  private async executeStep(step: JourneyStep) {
    // Replace dynamic IDs
    const url = await this.resolveUrl(step.url);
    
    // Navigate
    await this.page.goto(url, { waitUntil: 'networkidle' });
    
    // Wait for specified time
    await this.page.waitForTimeout(step.wait || 2000);
    
    // Perform action (click, type, etc.)
    await this.performAction(step.action);
    
    // Capture screenshot
    if (step.screenshot !== false) {
      const screenshotPath = await this.captureScreenshot(step.step);
      this.capturedScreenshots.push(screenshotPath);
    }
  }
}
```

---

### 3. Browser Orchestrator

**File:** `demo/scripts/browser-orchestrator.ts`

```typescript
interface BrowserConfig {
  headless: boolean;
  viewport: { width: number; height: number };
  deviceScaleFactor: number;
  browserPath?: string; // Custom Chrome path
}

const DEFAULT_CONFIG: BrowserConfig = {
  headless: true,
  viewport: { width: 1920, height: 1080 },
  deviceScaleFactor: 1,
  browserPath: process.env.PLAYWRIGHT_BROWSERS_PATH || undefined,
};

class BrowserOrchestrator {
  private browser: Browser;
  private page: Page;
  private config: BrowserConfig;
  
  async launch(config: BrowserConfig = DEFAULT_CONFIG) {
    this.browser = await chromium.launch({
      headless: config.headless,
      executablePath: config.browserPath,
      timeout: 30000,
    });
    
    this.page = await this.browser.newPage({
      viewport: config.viewport,
      deviceScaleFactor: config.deviceScaleFactor,
    });
    
    // Enable performance tracing
    await this.page.tracing.start({ screenshots: true });
  }
  
  async navigate(url: string, options: NavigationOptions = {}) {
    const { waitUntil = 'networkidle', timeout = 30000 } = options;
    
    try {
      await this.page.goto(url, { waitUntil, timeout });
      return true;
    } catch (error) {
      console.error(`Navigation failed: ${url}`, error);
      return false;
    }
  }
  
  async captureScreenshot(stepNumber: number, label: string): Promise<string> {
    const filename = `${stepNumber.toString().padStart(2, '0')}-${this.slugify(label)}.png`;
    const outputPath = path.join(this.outputDir, filename);
    
    await this.page.screenshot({
      path: outputPath,
      fullPage: true,
      type: 'png',
    });
    
    return outputPath;
  }
  
  async performAction(action: string) {
    const [actionType, ...args] = action.split(' ');
    
    switch (actionType) {
      case 'click':
        await this.page.click(args[0]);
        break;
      case 'type':
        await this.page.type(args[0], args[1]);
        break;
      case 'scroll':
        await this.page.evaluate(() => window.scrollBy(0, 1000));
        break;
      case 'wait-for':
        await this.page.waitForSelector(args[0]);
        break;
    }
  }
}
```

---

### 4. ID Resolver

**File:** `demo/scripts/id-resolver.ts`

```typescript
interface ResolvedIds {
  conversationId: string;
  acuId: string;
  graphSeedId: string;
  searchQueries: string[];
}

class IdResolver {
  private apiBase: string;
  private pwaUrl: string;
  private cache: Partial<ResolvedIds> = {};
  
  async resolveAll(): Promise<ResolvedIds> {
    // Fetch from API in parallel
    const [conversation, acus, graphSeed] = await Promise.all([
      this.fetchConversation(),
      this.fetchAcus(),
      this.fetchGraphSeed(),
    ]);
    
    return {
      conversationId: conversation.id,
      acuId: acus[0].id,
      graphSeedId: graphSeed.id,
      searchQueries: ['react hooks', 'postgres indexing', 'typescript generics'],
    };
  }
  
  private async fetchConversation(): Promise<{ id: string }> {
    const response = await fetch(`${this.apiBase}/api/v1/conversations?limit=1`, {
      headers: { Origin: this.pwaUrl },
    });
    const conversations = await response.json();
    return conversations[0];
  }
  
  async resolveUrl(url: string): Promise<string> {
    const ids = await this.resolveAll();
    
    return url
      .replace(':id', ids.conversationId)
      .replace(':acu-id', ids.acuId)
      .replace(':graph-seed-id', ids.graphSeedId);
  }
}
```

---

### 5. Output Generator

**File:** `demo/scripts/output-generator.ts`

```typescript
interface JourneyResult {
  scriptTitle: string;
  duration: number;
  screenshots: string[];
  markdownReport: string;
  htmlPreview: string;
}

class OutputGenerator {
  generateMarkdown(result: JourneyResult): string {
    let md = `# ${result.scriptTitle}\n\n`;
    md += `**Captured:** ${new Date().toISOString()}\n`;
    md += `**Duration:** ${result.duration}ms\n\n`;
    md += `---\n\n`;
    
    result.screenshots.forEach((screenshot, i) => {
      const relativePath = path.relative(process.cwd(), screenshot);
      md += `## Step ${i + 1}\n\n`;
      md += `![Screenshot](${relativePath})\n\n`;
    });
    
    return md;
  }
  
  generateHtmlPreview(result: JourneyResult): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <title>${result.scriptTitle}</title>
  <style>
    body { font-family: system-ui; max-width: 1200px; margin: 0 auto; padding: 40px; }
    .screenshot { margin: 40px 0; }
    .screenshot img { max-width: 100%; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
    .step-number { font-size: 14px; color: #666; margin-bottom: 8px; }
  </style>
</head>
<body>
  <h1>${result.scriptTitle}</h1>
  <p><strong>Duration:</strong> ${result.duration}ms</p>
  ${result.screenshots.map((s, i) => `
    <div class="screenshot">
      <div class="step-number">Step ${i + 1}</div>
      <img src="${path.relative(process.cwd(), s)}" />
    </div>
  `).join('')}
</body>
</html>
    `.trim();
  }
}
```

---

## Usage Examples

### Example 1: Run Problem Solver Journey

```bash
bun run demo/scripts/journey-runner.ts \
  --script=problem-solver \
  --output=demo/screenshots/journeys/problem-solver \
  --format=markdown,html
```

### Example 2: Run with Custom IDs

```bash
DEMO_CONVERSATION_ID=abc123 \
DEMO_ACU_ID=xyz789 \
bun run demo/scripts/journey-runner.ts \
  --script=daily-worker \
  --headless=false
```

### Example 3: Run All Journeys

```bash
bun run demo/scripts/journey-runner.ts \
  --script=all \
  --parallel=3 \
  --output=demo/screenshots/journeys/batch-$(date +%Y%m%d)
```

---

## File Structure

```
demo/
├── scripts/
│   ├── journey-runner.ts          # Main CLI
│   ├── journey-parser.ts          # Markdown parser
│   ├── browser-orchestrator.ts    # Playwright wrapper
│   ├── id-resolver.ts             # API ID fetcher
│   ├── output-generator.ts        # MD/HTML generator
│   └── user-journey-scripts.md    # Script definitions
├── journeys/                       # Individual journey scripts
│   ├── onboarding.md
│   ├── daily-worker.md
│   ├── problem-solver.md
│   ├── team-collab.md
│   ├── deep-research.md
│   └── investor-pitch.md
├── screenshots/
│   └── journeys/
│       ├── problem-solver/
│       │   ├── 01-archive.png
│       │   ├── 02-search.png
│       │   └── problem-solver-report.md
│       └── daily-worker/
│           └── ...
└── output/
    └── journey-reports/
        └── latest/
```

---

## Journey Script Examples

### Journey: Problem Solver (`journeys/problem-solver.md`)

```markdown
---
title: Problem Solver Journey
description: Debugging complex issues with knowledge graph
duration: 90s
target: Engineers, developers
---

## Pre-Conditions
- [ ] 700+ ACU links seeded
- [ ] Search indexed
- [ ] Graph pre-computed

## Steps

| Step | Action | URL | Wait | Screenshot | Notes |
|------|--------|-----|------|------------|-------|
| 1 | Navigate | /archive | 2000 | ✅ | Starting point |
| 2 | Type search | /archive/search?q=vector+database | 3000 | ✅ | Semantic search |
| 3 | Click first result | /conversation/:id | 2000 | ✅ | Full context |
| 4 | Switch view | /archive?view=canvas | 5000 | ✅ | Graph animation |
| 5 | Zoom cluster | /archive?view=canvas#cluster-1 | 3000 | ✅ | Largest cluster |
| 6 | Click node | /conversation/:acu-id | 2000 | ✅ | ACU detail |
| 7 | Show edges | (scroll) | 2000 | ✅ | Relationships |
| 8 | Return | /archive/search | 1000 | ✅ | Close loop |
```

---

## Advanced Features

### 1. Visual Regression Testing

```typescript
class VisualRegressionTester {
  async compareWithBaseline(screenshot: string): Promise<RegressionResult> {
    const baseline = await this.loadBaseline(screenshot);
    const current = await this.page.screenshot();
    
    const diff = await this.pixelDiff(baseline, current);
    
    return {
      passed: diff.percentage < 0.01,
      diffPercentage: diff.percentage,
      diffImage: diff.output,
    };
  }
}
```

### 2. Performance Metrics

```typescript
interface PerformanceMetrics {
  loadTime: number;
  firstContentfulPaint: number;
  timeToInteractive: number;
  domContentLoaded: number;
}

async function captureMetrics(page: Page): Promise<PerformanceMetrics> {
  const metrics = await page.metrics();
  const performance = await page.evaluate(() => {
    const timing = performance.timing;
    return {
      loadTime: timing.loadEventEnd - timing.navigationStart,
      firstContentfulPaint: performance.getEntriesByType('paint')[0]?.startTime || 0,
    };
  });
  
  return { ...metrics, ...performance };
}
```

### 3. Error Recovery

```typescript
class JourneyRunner {
  async executeStepWithRetry(step: JourneyStep, maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
      try {
        await this.executeStep(step);
        return;
      } catch (error) {
        if (i === maxRetries - 1) throw error;
        console.log(`Step ${step.step} failed, retrying (${i + 1}/${maxRetries})`);
        await this.page.reload({ waitUntil: 'networkidle' });
      }
    }
  }
}
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

# Demo Data
DEMO_CONVERSATION_ID=auto  # "auto" fetches from API
DEMO_ACU_ID=auto
DEMO_USER_EMAIL=alex@vivimdemo.io

# Output Configuration
SCREENSHOT_OUTPUT_DIR=demo/screenshots/journeys
GENERATE_MARKDOWN=true
GENERATE_HTML=true
```

### Package.json Scripts

```json
{
  "scripts": {
    "demo:journey": "bun run demo/scripts/journey-runner.ts",
    "demo:journey:all": "bun run demo/scripts/journey-runner.ts --script=all",
    "demo:journey:watch": "bun run demo/scripts/journey-runner.ts --watch",
    "demo:journey:regression": "bun run demo/scripts/journey-runner.ts --regression"
  }
}
```

---

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Screenshot capture rate | >95% | Steps captured / Total steps |
| Journey completion rate | >90% | Successful runs / Total runs |
| Average journey time | <2x manual | Automated time / Manual time |
| Image quality | 1080p, full-page | Resolution check |
| ID resolution success | 100% | API fetch success rate |

---

## Future Enhancements

1. **Video Recording** — Capture full journey as MP4
2. **GIF Generation** — Create animated GIFs for key flows
3. **Multi-device** — Capture mobile + tablet views
4. **A/B Testing** — Compare UI variants
5. **CI Integration** — Run on every PR
6. **Hot Reload** — Watch for script changes
7. **Interactive Mode** — Step-through debugging

---

**Last Updated:** March 19, 2026  
**Status:** Design Complete — Ready for Implementation
