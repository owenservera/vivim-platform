#!/usr/bin/env bun
/**
 * VIVIM Journey Runner
 * 
 * Automated screenshot capture for user journey scripts.
 * Reads markdown journey definitions and captures full-page screenshots.
 * 
 * Usage:
 *   bun run demo/scripts/journey-runner.ts --script=problem-solver
 *   bun run demo/scripts/journey-runner.ts --script=all
 *   bun run demo/scripts/journey-runner.ts --help
 */

import { chromium, type Browser, type Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// ============================================================================
// Configuration
// ============================================================================

const CONFIG = {
  baseUrl: process.env.PWA_URL || 'http://localhost:5173',
  apiBase: process.env.API_URL || 'http://localhost:3000',
  outputDir: process.env.SCREENSHOT_OUTPUT_DIR || path.join(__dirname, '../screenshots/journeys'),
  browserPath: process.env.PLAYWRIGHT_BROWSERS_PATH || 'C:/Users/VIVIM.inc/AppData/Local/ms-playwright/chromium-1208/chrome-win64/chrome.exe',
  viewport: {
    width: parseInt(process.env.DEMO_VIEWPORT_WIDTH || '1920'),
    height: parseInt(process.env.DEMO_VIEWPORT_HEIGHT || '1080'),
  },
  headless: process.env.DEMO_HEADLESS !== 'false',
  deviceScaleFactor: 1,
};

// ============================================================================
// Types
// ============================================================================

interface JourneyStep {
  step: number;
  action: string;
  url: string;
  wait?: number;
  screenshot?: boolean;
  notes?: string;
}

interface JourneyScript {
  title: string;
  description: string;
  duration: string;
  target: string;
  preConditions: string[];
  steps: JourneyStep[];
}

interface ResolvedIds {
  conversationId: string;
  acuId: string;
  graphSeedId: string;
}

interface JourneyResult {
  scriptTitle: string;
  duration: number;
  screenshots: string[];
  success: boolean;
  error?: string;
}

// ============================================================================
// ID Resolver - Fetches real IDs from API
// ============================================================================

class IdResolver {
  private apiBase: string;
  private pwaUrl: string;
  private cache: Partial<ResolvedIds> = {};

  constructor(apiBase: string, pwaUrl: string) {
    this.apiBase = apiBase;
    this.pwaUrl = pwaUrl;
  }

  async resolveAll(): Promise<ResolvedIds> {
    if (this.cache.conversationId && this.cache.acuId && this.cache.graphSeedId) {
      return this.cache as ResolvedIds;
    }

    console.log('  📡 Fetching IDs from API...');
    
    try {
      const [conversation, graphSeed] = await Promise.all([
        this.fetchConversation(),
        this.fetchGraphSeed(),
      ]);

      this.cache = {
        conversationId: conversation.id,
        acuId: conversation.id, // Use conversation ID as fallback
        graphSeedId: graphSeed.id,
      };

      console.log(`    ✅ Conversation: ${conversation.id.slice(0, 8)}...`);
      console.log(`    ✅ Graph Seed: ${graphSeed.id.slice(0, 8)}...`);

      return this.cache as ResolvedIds;
    } catch (error) {
      console.error('  ❌ Failed to fetch IDs:', error instanceof Error ? error.message : error);
      throw error;
    }
  }

  private async fetchConversation(): Promise<{ id: string; title?: string }> {
    const response = await fetch(`${this.apiBase}/api/v1/conversations?limit=1`, {
      headers: { Origin: this.pwaUrl },
    });
    
    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }
    
    const conversations = await response.json();
    if (conversations.length === 0) {
      throw new Error('No conversations found');
    }
    
    return conversations[0];
  }

  private async fetchGraphSeed(): Promise<{ id: string }> {
    // Fetch a conversation with many ACUs for graph demo
    const response = await fetch(`${this.apiBase}/api/v1/conversations?limit=10`, {
      headers: { Origin: this.pwaUrl },
    });
    
    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }
    
    const conversations = await response.json();
    // Return the one with most messages (likely best for graph)
    return conversations.reduce((max, conv) => 
      conv.messageCount > max.messageCount ? conv : max
    );
  }

  async resolveUrl(url: string): Promise<string> {
    const ids = await this.resolveAll();
    
    return url
      .replace(':id', ids.conversationId)
      .replace(':acu-id', ids.acuId)
      .replace(':graph-seed-id', ids.graphSeedId);
  }
}

// ============================================================================
// Journey Parser - Parses markdown scripts
// ============================================================================

class JourneyParser {
  parse(content: string): JourneyScript {
    const lines = content.split('\n');
    const script: Partial<JourneyScript> = {
      steps: [],
      preConditions: [],
    };

    let inSteps = false;
    let inPreConditions = false;

    for (const line of lines) {
      // Parse frontmatter
      if (line.startsWith('title:')) {
        script.title = line.replace('title:', '').trim();
      } else if (line.startsWith('description:')) {
        script.description = line.replace('description:', '').trim();
      } else if (line.startsWith('duration:')) {
        script.duration = line.replace('duration:', '').trim();
      } else if (line.startsWith('target:')) {
        script.target = line.replace('target:', '').trim();
      }
      // Parse pre-conditions
      else if (line.includes('## Pre-Conditions')) {
        inPreConditions = true;
        inSteps = false;
      } else if (line.includes('## Steps')) {
        inSteps = true;
        inPreConditions = false;
      } else if (line.startsWith('## ') && !line.includes('Pre-Conditions') && !line.includes('Steps')) {
        inSteps = false;
        inPreConditions = false;
      }
      // Parse pre-condition items
      else if (inPreConditions && line.trim().startsWith('- [ ]')) {
        script.preConditions?.push(line.trim().replace('- [ ]', '').trim());
      }
      // Parse step table
      else if (inSteps && line.trim().startsWith('|')) {
        const step = this.parseStepLine(line);
        if (step && step.step > 0) {
          script.steps?.push(step);
        }
      }
    }

    if (!script.title) {
      script.title = 'Untitled Journey';
    }

    return script as JourneyScript;
  }

  private parseStepLine(line: string): JourneyStep | null {
    const parts = line.split('|').map(p => p.trim()).filter(p => p);
    
    if (parts.length < 3) return null;
    
    const stepNum = parseInt(parts[0], 10);
    if (isNaN(stepNum)) return null;

    return {
      step: stepNum,
      action: parts[1] || 'Navigate',
      url: parts[2] || '/',
      wait: parseInt(parts[3]) || 2000,
      screenshot: parts[4] !== '❌',
      notes: parts[5] || '',
    };
  }
}

// ============================================================================
// Browser Orchestrator - Playwright wrapper
// ============================================================================

class BrowserOrchestrator {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private outputDir: string;

  constructor(outputDir: string) {
    this.outputDir = outputDir;
  }

  async launch() {
    console.log('  🚀 Launching browser...');
    
    this.browser = await chromium.launch({
      headless: CONFIG.headless,
      executablePath: CONFIG.browserPath,
      timeout: 30000,
    });

    this.page = await this.browser.newPage({
      viewport: CONFIG.viewport,
      deviceScaleFactor: CONFIG.deviceScaleFactor,
    });

    console.log('  ✅ Browser launched');
  }

  async navigate(url: string): Promise<boolean> {
    if (!this.page) throw new Error('Browser not launched');

    try {
      const fullUrl = url.startsWith('http') ? url : `${CONFIG.baseUrl}${url}`;
      console.log(`    📍 Navigating: ${fullUrl}`);
      
      await this.page.goto(fullUrl, { 
        waitUntil: 'networkidle',
        timeout: 30000 
      });
      
      return true;
    } catch (error) {
      console.error(`    ❌ Navigation failed:`, error instanceof Error ? error.message : error);
      return false;
    }
  }

  async wait(ms: number) {
    if (!this.page) throw new Error('Browser not launched');
    await this.page.waitForTimeout(ms);
  }

  async performAction(action: string) {
    if (!this.page) throw new Error('Browser not launched');

    const [actionType, ...args] = action.split(' ');

    switch (actionType.toLowerCase()) {
      case 'click':
        await this.page.click(args[0]);
        console.log(`    👆 Clicked: ${args[0]}`);
        break;
      case 'type':
        await this.page.type(args[0], args[1]);
        console.log(`    ⌨️  Typed: ${args[1]} into ${args[0]}`);
        break;
      case 'scroll':
        await this.page.evaluate(() => window.scrollBy(0, 1000));
        console.log('    📜 Scrolled down');
        break;
      case 'scroll-up':
        await this.page.evaluate(() => window.scrollBy(0, -1000));
        console.log('    📜 Scrolled up');
        break;
      case 'wait-for':
        await this.page.waitForSelector(args[0]);
        console.log(`    ⏳ Waited for: ${args[0]}`);
        break;
      case 'navigate':
      case 'go-to':
        await this.navigate(args[0]);
        break;
      default:
        console.log(`    ℹ️  Action: ${action} (no-op)`);
    }
  }

  async captureScreenshot(stepNumber: number, label: string): Promise<string> {
    if (!this.page) throw new Error('Browser not launched');

    const slug = label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const filename = `${stepNumber.toString().padStart(2, '0')}-${slug}.png`;
    const outputPath = path.join(this.outputDir, filename);

    await this.page.screenshot({
      path: outputPath,
      fullPage: true,
      type: 'png',
    });

    console.log(`    📸 Captured: ${filename}`);
    return outputPath;
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      console.log('  🏁 Browser closed');
    }
  }
}

// ============================================================================
// Output Generator - Creates markdown and HTML reports
// ============================================================================

class OutputGenerator {
  generateMarkdown(result: JourneyResult, script: JourneyScript): string {
    let md = `# ${script.title}\n\n`;
    md += `**Captured:** ${new Date().toISOString()}\n`;
    md += `**Duration:** ${result.duration}ms\n`;
    md += `**Target:** ${script.target}\n\n`;
    
    if (script.description) {
      md += `${script.description}\n\n`;
    }
    
    md += `---\n\n`;

    if (script.preConditions.length > 0) {
      md += `## Pre-Conditions\n\n`;
      for (const cond of script.preConditions) {
        md += `- [ ] ${cond}\n`;
      }
      md += `\n`;
    }

    md += `## Screenshots\n\n`;
    
    result.screenshots.forEach((screenshot, i) => {
      const relativePath = path.relative(process.cwd(), screenshot);
      const step = script.steps[i];
      
      md += `### Step ${i + 1}: ${step?.action || 'Unknown'}\n\n`;
      if (step?.notes) {
        md += `> ${step.notes}\n\n`;
      }
      md += `![Screenshot](${relativePath})\n\n`;
    });

    return md;
  }

  generateHtml(result: JourneyResult, script: JourneyScript): string {
    const screenshotHtml = result.screenshots.map((s, i) => {
      const step = script.steps[i];
      const relativePath = path.relative(process.cwd(), s);
      
      return `
        <div class="screenshot">
          <div class="step-header">
            <span class="step-number">Step ${i + 1}</span>
            <span class="step-action">${step?.action || 'Unknown'}</span>
          </div>
          ${step?.notes ? `<p class="notes">${step.notes}</p>` : ''}
          <img src="${relativePath}" alt="Step ${i + 1}" />
        </div>
      `;
    }).join('');

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${script.title} - VIVIM Journey</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; 
      background: #0a0a0f; 
      color: #fff; 
      padding: 40px;
      line-height: 1.6;
    }
    .container { max-width: 1400px; margin: 0 auto; }
    h1 { font-size: 2.5em; margin-bottom: 16px; color: #EF9F27; }
    .meta { color: #888; margin-bottom: 40px; }
    .meta span { margin-right: 24px; }
    .screenshot { 
      margin: 60px 0; 
      background: #1a1a2e;
      border-radius: 12px;
      overflow: hidden;
    }
    .step-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 24px;
      background: #2a2a3e;
      border-bottom: 1px solid #3a3a4e;
    }
    .step-number { 
      font-size: 14px; 
      color: #EF9F27;
      font-weight: 600;
    }
    .step-action {
      font-size: 16px;
      font-weight: 500;
    }
    .notes {
      padding: 12px 24px;
      color: #888;
      font-style: italic;
      border-bottom: 1px solid #3a3a4e;
    }
    .screenshot img { 
      max-width: 100%; 
      display: block;
    }
    .success { color: #10b981; }
    .error { color: #ef4444; }
  </style>
</head>
<body>
  <div class="container">
    <h1>${script.title}</h1>
    <div class="meta">
      <span>⏱️  ${result.duration}ms</span>
      <span>🎯 ${script.target}</span>
      <span class="${result.success ? 'success' : 'error'}">
        ${result.success ? '✅ Success' : '❌ Failed'}
      </span>
    </div>
    
    ${screenshotHtml}
  </div>
</body>
</html>
    `.trim();
  }
}

// ============================================================================
// Journey Runner - Main orchestrator
// ============================================================================

class JourneyRunner {
  private parser: JourneyParser;
  private idResolver: IdResolver;
  private orchestrator: BrowserOrchestrator | null = null;
  private outputGenerator: OutputGenerator;
  private outputDir: string;

  constructor() {
    this.parser = new JourneyParser();
    this.idResolver = new IdResolver(CONFIG.apiBase, CONFIG.baseUrl);
    this.outputGenerator = new OutputGenerator();
    this.outputDir = CONFIG.outputDir;
  }

  async run(scriptPath: string): Promise<JourneyResult> {
    const startTime = Date.now();
    
    console.log('\n' + '═'.repeat(60));
    console.log(`🎯 Running Journey: ${path.basename(scriptPath, '.md')}`);
    console.log('═'.repeat(60) + '\n');

    // 1. Parse script
    console.log('📄 Parsing script...');
    const content = fs.readFileSync(scriptPath, 'utf-8');
    const script = this.parser.parse(content);
    console.log(`   Title: ${script.title}`);
    console.log(`   Steps: ${script.steps.length}`);
    console.log(`   Target: ${script.target}\n`);

    // 2. Setup output directory
    const journeyName = path.basename(scriptPath, '.md');
    const journeyOutputDir = path.join(this.outputDir, journeyName);
    this.ensureDir(journeyOutputDir);
    this.orchestrator = new BrowserOrchestrator(journeyOutputDir);

    // 3. Resolve IDs
    console.log('🔑 Resolving IDs...');
    await this.idResolver.resolveAll();
    console.log();

    // 4. Launch browser
    await this.orchestrator.launch();
    console.log();

    // 5. Execute steps
    const screenshots: string[] = [];
    let success = true;
    let error: string | undefined;

    console.log('▶️  Executing steps...\n');
    
    for (const step of script.steps) {
      try {
        console.log(`  Step ${step.step}/${script.steps.length}: ${step.action}`);
        
        // Resolve URL
        const url = await this.idResolver.resolveUrl(step.url);
        
        // Navigate
        await this.orchestrator!.navigate(url);
        
        // Wait
        if (step.wait) {
          await this.orchestrator!.wait(step.wait);
        }
        
        // Perform action
        if (step.action.toLowerCase() !== 'navigate') {
          await this.orchestrator!.performAction(step.action);
        }
        
        // Capture screenshot
        if (step.screenshot !== false) {
          const screenshotPath = await this.orchestrator!.captureScreenshot(
            step.step,
            step.notes || step.action
          );
          screenshots.push(screenshotPath);
        }
        
        console.log();
      } catch (stepError) {
        console.error(`  ❌ Step ${step.step} failed:`, stepError instanceof Error ? stepError.message : stepError);
        error = stepError instanceof Error ? stepError.message : String(stepError);
        // Continue with next step
      }
    }

    // 6. Close browser
    await this.orchestrator!.close();

    // 7. Generate output
    console.log('📝 Generating output...');
    
    const result: JourneyResult = {
      scriptTitle: script.title,
      duration: Date.now() - startTime,
      screenshots,
      success,
      error,
    };

    // Write markdown report
    const mdContent = this.outputGenerator.generateMarkdown(result, script);
    const mdPath = path.join(journeyOutputDir, `${journeyName}-report.md`);
    fs.writeFileSync(mdPath, mdContent);
    console.log(`   ✅ Markdown: ${mdPath}`);

    // Write HTML preview
    const htmlContent = this.outputGenerator.generateHtml(result, script);
    const htmlPath = path.join(journeyOutputDir, `${journeyName}-preview.html`);
    fs.writeFileSync(htmlPath, htmlContent);
    console.log(`   ✅ HTML: ${htmlPath}`);

    console.log();
    console.log('═'.repeat(60));
    console.log(`✅ Journey complete: ${script.title}`);
    console.log(`   Duration: ${result.duration}ms`);
    console.log(`   Screenshots: ${screenshots.length}`);
    console.log(`   Output: ${journeyOutputDir}`);
    console.log('═'.repeat(60) + '\n');

    return result;
  }

  private ensureDir(dir: string) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
}

// ============================================================================
// CLI Entry Point
// ============================================================================

async function printHelp() {
  console.log(`
VIVIM Journey Runner

Usage:
  bun run demo/scripts/journey-runner.ts [options]

Options:
  --script=<name>     Journey script to run (without .md extension)
                      Available: onboarding, daily-worker, problem-solver,
                      team-collab, deep-research, investor-pitch
  --output=<dir>      Output directory for screenshots
  --headless          Run browser in headless mode (default: true)
  --help, -h          Show this help message

Examples:
  bun run demo/scripts/journey-runner.ts --script=problem-solver
  bun run demo/scripts/journey-runner.ts --script=all
  bun run demo/scripts/journey-runner.ts --script=investor-pitch --headless=false

Environment Variables:
  PWA_URL                  PWA base URL (default: http://localhost:5173)
  API_URL                  API base URL (default: http://localhost:3000)
  SCREENSHOT_OUTPUT_DIR    Output directory
  PLAYWRIGHT_BROWSERS_PATH Chrome executable path
  DEMO_HEADLESS            Headless mode (true/false)
`);
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    await printHelp();
    process.exit(0);
  }

  const scriptArg = args.find(a => a.startsWith('--script='));
  if (!scriptArg) {
    console.error('❌ Missing --script argument');
    await printHelp();
    process.exit(1);
  }

  const scriptName = scriptArg.split('=')[1];
  const runner = new JourneyRunner();

  if (scriptName === 'all') {
    // Run all journeys
    const journeys = [
      'onboarding',
      'daily-worker',
      'problem-solver',
      'team-collab',
      'deep-research',
      'investor-pitch',
    ];

    for (const journey of journeys) {
      const scriptPath = path.join(__dirname, `../journeys/${journey}.md`);
      if (fs.existsSync(scriptPath)) {
        await runner.run(scriptPath);
      } else {
        console.error(`⚠️  Journey not found: ${journey}`);
      }
    }
  } else {
    // Run single journey
    const scriptPath = path.join(__dirname, `../journeys/${scriptName}.md`);
    
    if (!fs.existsSync(scriptPath)) {
      console.error(`❌ Journey script not found: ${scriptPath}`);
      console.error('\nAvailable journeys:');
      console.error('  onboarding, daily-worker, problem-solver, team-collab, deep-research, investor-pitch');
      process.exit(1);
    }

    await runner.run(scriptPath);
  }
}

main().catch(error => {
  console.error('❌ Journey failed:', error instanceof Error ? error.message : error);
  process.exit(1);
});
