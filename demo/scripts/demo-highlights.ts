import { chromium, Browser } from '@playwright/test';
import { FOCUS_AREAS, FOCUS_AREA_IDS, type FocusArea } from '../highlights/FOCUS_AREAS';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';

const execAsync = promisify(exec);

const CONFIG = {
  baseUrl: process.env.DEMO_URL || 'http://localhost:5173',
  screenshotsDir: path.join(__dirname, '../screenshots'),
  slidesDir: path.join(__dirname, '../slides'),
};

interface HighlightOptions {
  focus?: string;
  skipSeed?: boolean;
  skipScreenshots?: boolean;
  skipSlides?: boolean;
  seedOnly?: boolean;
  recordVideo?: boolean;
}

async function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

async function printBanner(area: FocusArea) {
  console.log('\n' + '═'.repeat(60));
  console.log(`🎯 VIVIM Demo Highlight: ${area.name}`);
  console.log('═'.repeat(60));
  console.log(`   Investor Type: ${area.investorType}`);
  console.log(`   Demo Time:    ${area.demoTime}`);
  console.log(`   Tagline:      "${area.tagline}"`);
  console.log('═'.repeat(60) + '\n');
}

async function printNarrative(area: FocusArea) {
  console.log('📣 NARRATIVE');
  console.log('-'.repeat(40));
  console.log(`Hook: "${area.narrative.hook}"\n`);
  for (const b of area.narrative.body) {
    const idx = area.narrative.body.indexOf(b) + 1;
    console.log(`  ${idx}. ${b}`);
  }
  console.log(`\nClose: "${area.narrative.close}"\n`);
}

async function printScript(area: FocusArea) {
  console.log('📋 CLICK SCRIPT');
  console.log('-'.repeat(40));
  area.flows.forEach((flow, fi) => {
    console.log(`  [${fi + 1}] ${flow.name}`);
    flow.pages.forEach((page, pi) => {
      const note = page.notes ? ` ← ${page.notes}` : '';
      console.log(`      ${pi + 1}. ${page.label} → ${page.path}${note}`);
    });
  });
  console.log();
}

async function printSearchQueries(area: FocusArea) {
  if (!area.searchQueries.length) return;
  console.log('🔍 DEMO SEARCH QUERIES (pre-verify these return results)');
  console.log('-'.repeat(40));
  for (const q of area.searchQueries) console.log(`   "${q}"`);
  console.log();
}

async function captureFlow(
  browser: Browser,
  area: FocusArea,
  flowIndex: number,
  flowName: string,
  baseOutputDir: string,
  recordVideo: boolean = false
): Promise<{ screenshots: string[], video?: string }> {
  const flowDir = path.join(baseOutputDir, `${area.id}-${flowIndex}`);
  await ensureDir(flowDir);

  const flow = area.flows[flowIndex];
  const captured: string[] = [];
  
  const contextOptions: any = { viewport: { width: 1920, height: 1080 } };
  if (recordVideo) {
    contextOptions.recordVideo = { dir: flowDir, size: { width: 1920, height: 1080 } };
  }
  
  const context = await browser.newContext(contextOptions);
  const p = await context.newPage();

  for (const page of flow.pages) {
    const safeLabel = page.label.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const filename = `${flowIndex + 1}-${safeLabel}.png`;
    const outputPath = path.join(flowDir, filename);
    const fullUrl = page.path.startsWith('http') ? page.path : `${CONFIG.baseUrl}${page.path}`;

    try {
      console.log(`  📸 ${flowName}: ${page.label}`);
      await p.goto(fullUrl, { waitUntil: 'networkidle', timeout: 30000 });
      await p.waitForTimeout(page.wait || 2000);
      await p.screenshot({ path: outputPath, fullPage: true });
      captured.push(outputPath);
    } catch (err) {
      console.log(`  ⚠️  Skipped: ${page.label} (${(err as Error).message})`);
    }
  }

  let videoPath: string | undefined;
  if (recordVideo) {
    const safeFlowName = flowName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const outputVideoPath = path.join(baseOutputDir, `${area.id}-${flowIndex}-video-${safeFlowName}.webm`);
    try {
      await p.close();
      const video = p.video();
      if (video) {
        await video.saveAs(outputVideoPath);
        await video.delete();
        videoPath = outputVideoPath;
      }
    } catch (err) {
      console.log(`  ⚠️  Failed to save video: ${(err as Error).message}`);
    }
  }

  await context.close();

  return { screenshots: captured, video: videoPath };
}

async function generateSlidesFromScreenshots(
  area: FocusArea,
  captured: string[],
  videos: string[],
  outputDir: string
) {
  await ensureDir(outputDir);
  const slideIndexPath = path.join(outputDir, `${area.id}-slides.md`);

  let md = `# ${area.name} — Investor Highlight\n\n`;
  md += `> ${area.tagline}\n\n`;
  md += `**Investor Type:** ${area.investorType} · **Demo Time:** ${area.demoTime}\n\n---\n\n`;
  md += `## Hook\n\n${area.narrative.hook}\n\n---\n\n`;
  md += `## Demo Flow\n\n`;

  area.flows.forEach((flow, fi) => {
    md += `### ${fi + 1}. ${flow.name}\n\n`;
    const videoMatch = videos.find(v => v.includes(`${area.id}-${fi}-video-`));
    if (videoMatch) {
      md += `<video controls width="100%" src="${path.relative(outputDir, videoMatch)}"></video>\n\n`;
    }

    flow.pages.forEach((page, pi) => {
      const screenshotMatch = captured.find(c =>
        c.includes(`${fi + 1}-`) && c.includes(page.label.toLowerCase().split(' ')[0])
      );
      md += `${pi + 1}. **${page.label}** — \`${page.path}\`\n`;
      if (page.notes) md += `   - _${page.notes}_\n`;
      if (screenshotMatch) md += `   - ![screenshot](${path.relative(outputDir, screenshotMatch)})\n`;
      md += '\n';
    });
  });

  md += `---\n\n## Narrative Close\n\n${area.narrative.close}\n\n---\n\n## Search Queries to Verify\n\n`;
  area.searchQueries.forEach(q => { md += `- \`${q}\`\n`; });
  md += '\n';

  fs.writeFileSync(slideIndexPath, md);
  console.log(`  📝 Slides written: ${slideIndexPath}`);
}

async function generatePrintableScript(
  area: FocusArea,
  outputDir: string
) {
  ensureDir(outputDir);
  const scriptPath = path.join(outputDir, `${area.id}-script.txt`);

  let text = `${'='.repeat(60)}\n`;
  text += `VIVIM DEMO SCRIPT: ${area.name.toUpperCase()}\n`;
  text += `${'='.repeat(60)}\n\n`;
  text += `Tagline: ${area.tagline}\n`;
  text += `Investor Type: ${area.investorType}\n`;
  text += `Target Time: ${area.demoTime}\n\n`;

  text += `${'-'.repeat(60)}\n`;
  text += `NARRATIVE\n`;
  text += `${'-'.repeat(60)}\n\n`;
  text += `[HOOK] ${area.narrative.hook}\n\n`;
  area.narrative.body.forEach((b, i) => { text += `[${i + 1}] ${b}\n\n`; });
  text += `[CLOSE] ${area.narrative.close}\n\n`;

  text += `${'-'.repeat(60)}\n`;
  text += `CLICK SCRIPT (read time between steps)\n`;
  text += `${'-'.repeat(60)}\n\n`;

  area.flows.forEach((flow, fi) => {
    text += `[${fi + 1}] ${flow.name}\n`;
    flow.pages.forEach((page, pi) => {
      const note = page.notes ? ` → ${page.notes}` : '';
      text += `  ${pi + 1}. ${page.label.padEnd(30)} ${page.path}${note}\n`;
    });
    text += '\n';
  });

  text += `${'-'.repeat(60)}\n`;
  text += `SEARCH QUERIES TO VERIFY\n`;
  text += `${'-'.repeat(60)}\n`;
  area.searchQueries.forEach(q => { text += `  "${q}"\n`; });
  text += '\n';

  text += `${'-'.repeat(60)}\n`;
  text += `PRE-DEMO CHECKLIST\n`;
  text += `${'-'.repeat(60)}\n`;
  text += `[ ] Seed reset complete\n`;
  text += `[ ] Embeddings pre-computed\n`;
  text += `[ ] All pages load without errors\n`;
  text += `[ ] Search queries verified\n`;
  text += `[ ] Loom backup recorded\n`;
  text += `[ ] Practiced 3+ times\n\n`;

  fs.writeFileSync(scriptPath, text);
  console.log(`  📄 Script written: ${scriptPath}`);
}

export async function runHighlight(options: HighlightOptions = {}) {
  const {
    focus = 'knowledgeGraph',
    skipSeed = false,
    skipScreenshots = false,
    skipSlides = false,
    seedOnly = false,
    recordVideo = false,
  } = options;

  const area = FOCUS_AREAS[focus];
  if (!area) {
    console.error(`❌ Unknown focus area: "${focus}"`);
    console.log(`Available: ${FOCUS_AREA_IDS.join(', ')}`);
    process.exit(1);
  }

  const startTime = Date.now();
  await printBanner(area);
  await printNarrative(area);
  await printScript(area);
  await printSearchQueries(area);

  const screenshotsDir = path.join(CONFIG.screenshotsDir, 'highlights', area.id);
  const slidesDir = path.join(CONFIG.slidesDir, 'highlights', area.id);

  if (!skipSeed) {
    console.log('🌱 SEEDING (focus-aware)');
    console.log('-'.repeat(40));
    const convCount = area.seedWeights.conversations;
    const seedArgs = `--conversations=${convCount}`;
    const seedCmd = `bun run prisma:seed:investor -- --focus=${focus} --conversations=${convCount}`;
    console.log(`  Running: ${seedCmd}`);
    try {
      await execAsync(seedCmd, { cwd: './server' });
      console.log('  ✅ Seeded\n');
    } catch (seedErr: any) {
      console.log(`  ⚠️  Seed skipped: ${seedErr.message?.split('\n')[0] || seedErr.message}\n`);
    }
  } else {
    console.log('🌱 SEEDING (skipped by --skip-seed)\n');
  }

  if (seedOnly) {
    console.log('🧬 Seed-only mode — skipping capture and slides\n');
    const duration = Date.now() - startTime;
    console.log(`✅ Done in ${duration}ms`);
    return;
  }

  if (!skipScreenshots) {
    console.log('📸 SCREENSHOT CAPTURE');
    console.log('-'.repeat(40));
    await ensureDir(screenshotsDir);
    const browser = await chromium.launch({ headless: true });
    const allCaptured: string[] = [];
    const allVideos: string[] = [];

    for (let fi = 0; fi < area.flows.length; fi++) {
      const flow = area.flows[fi];
      const result = await captureFlow(browser, area, fi, flow.name, screenshotsDir, recordVideo);
      allCaptured.push(...result.screenshots);
      if (result.video) allVideos.push(result.video);
    }

    await browser.close();
    console.log(`  ✅ ${allCaptured.length} screenshots captured`);
    if (recordVideo) console.log(`  ✅ ${allVideos.length} videos recorded\n`);
    else console.log('\n');

    if (!skipSlides) {
      console.log('📝 SLIDE GENERATION');
      console.log('-'.repeat(40));
      await generateSlidesFromScreenshots(area, allCaptured, allVideos, slidesDir);
      await generatePrintableScript(area, slidesDir);
      console.log();
    }
  }

  const duration = Date.now() - startTime;
  console.log('═'.repeat(60));
  console.log(`✅ Highlight complete: ${area.name}`);
  console.log(`   Duration: ${duration}ms`);
  console.log(`   Screenshots: ${screenshotsDir}`);
  console.log(`   Slides: ${slidesDir}`);
  console.log('═'.repeat(60) + '\n');
}

const args = process.argv.slice(2);
const focusArg = args.find(a => a.startsWith('--focus='));
const skipSeed = args.includes('--skip-seed');
const skipScreenshots = args.includes('--skip-screenshots');
const skipSlides = args.includes('--skip-slides');
const seedOnly = args.includes('--seed-only');
const recordVideo = args.includes('--record-video');
const focus = focusArg?.split('=')[1] || 'knowledgeGraph';

runHighlight({ focus, skipSeed, skipScreenshots, skipSlides, seedOnly, recordVideo }).catch(err => {
  console.error('❌ Highlight failed:', err);
  process.exit(1);
});
