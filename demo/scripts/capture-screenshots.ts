import { chromium, Browser, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const CONFIG = {
  baseUrl: process.env.DEMO_URL || 'http://localhost:5173',
  outputDir: path.join(__dirname, '../screenshots'),
  viewport: { width: 1920, height: 1080 },
  mobileViewport: { width: 375, height: 812 },
  waitTimeout: 10000,
};

const FLOWS = {
  onboarding: {
    name: 'Onboarding Flow',
    description: 'First-time user experience',
    pages: [
      { path: '/login', name: 'login-screen', wait: 2000 },
      { path: '/home', name: 'home-empty', wait: 3000 },
      { path: '/capture', name: 'capture-page', wait: 2000 },
      { path: '/for-you', name: 'for-you-feed', wait: 3000 },
    ],
  },
  'core-features': {
    name: 'Core Features',
    description: 'Main app features',
    pages: [
      { path: '/home', name: 'home-archive', wait: 2000 },
      { path: '/archive', name: 'archive-all', wait: 2000 },
      { path: '/for-you', name: 'for-you', wait: 3000 },
      { path: '/conversation/:id', name: 'conversation-view', wait: 3000 },
    ],
  },
  'knowledge-graph': {
    name: 'Knowledge Graph',
    description: 'Canvas and graph visualization',
    pages: [
      { path: '/canvas', name: 'canvas-view', wait: 5000 },
      { path: '/search?q=react', name: 'search-results', wait: 3000 },
    ],
  },
  sharing: {
    name: 'Sharing',
    description: 'Circles and sharing features',
    pages: [
      { path: '/circles', name: 'circles-list', wait: 2000 },
      { path: '/circles/founders', name: 'circle-detail', wait: 2000 },
    ],
  },
  social: {
    name: 'Social',
    description: 'Friends, groups, profile',
    pages: [
      { path: '/friends', name: 'friends-list', wait: 2000 },
      { path: '/groups', name: 'groups-list', wait: 2000 },
      { path: '/profile', name: 'profile-page', wait: 2000 },
    ],
  },
  investor: {
    name: 'Investor Demo',
    description: 'Key screenshots for investor deck',
    pages: [
      { path: '/home', name: 'investor-home', wait: 2000 },
      { path: '/for-you', name: 'investor-for-you', wait: 2000 },
      { path: '/canvas', name: 'investor-graph', wait: 3000 },
      { path: '/conversation/:id', name: 'investor-conversation', wait: 2000 },
    ],
  },
};

interface CaptureOptions {
  flow?: string;
  device?: 'desktop' | 'mobile';
  skipExisting?: boolean;
}

async function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

async function capturePage(
  browser: Browser,
  url: string,
  outputPath: string,
  viewport: { width: number; height: number },
  waitTime: number
): Promise<boolean> {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();

  try {
    console.log(`  📸 Capturing: ${url}`);
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(waitTime);
    await page.screenshot({ path: outputPath, fullPage: true });
    await context.close();
    return true;
  } catch (err) {
    console.error(`  ❌ Failed: ${err instanceof Error ? err.message : err}`);
    await context.close();
    return false;
  }
}

async function runCapture(options: CaptureOptions = {}) {
  const { flow = 'investor', device = 'desktop', skipExisting = true } = options;
  const viewport = device === 'mobile' ? CONFIG.mobileViewport : CONFIG.viewport;
  const deviceName = device === 'mobile' ? 'mobile' : 'desktop';

  console.log('\n📸 VIVIM Screenshot Capture Tool\n');
  console.log('═'.repeat(50));
  console.log(`Flow: ${FLOWS[flow as keyof typeof FLOWS]?.name || flow}`);
  console.log(`Device: ${deviceName} (${viewport.width}x${viewport.height})`);
  console.log(`Output: ${CONFIG.outputDir}`);
  console.log('═'.repeat(50) + '\n');

  const flowConfig = FLOWS[flow as keyof typeof FLOWS];
  if (!flowConfig) {
    console.error(`❌ Unknown flow: ${flow}`);
    console.log(`Available flows: ${Object.keys(FLOWS).join(', ')}`);
    process.exit(1);
  }

  await ensureDir(CONFIG.outputDir);
  await ensureDir(path.join(CONFIG.outputDir, flow));

  const browser = await chromium.launch({
    headless: true,
    executablePath: 'C:/Users/VIVIM.inc/AppData/Local/ms-playwright/chromium-1208/chrome-win64/chrome.exe',
    timeout: 15000,
  });
  let successCount = 0;
  let skipCount = 0;

  for (const pageConfig of flowConfig.pages) {
    const filename = `${deviceName}-${pageConfig.name}.png`;
    const outputPath = path.join(CONFIG.outputDir, flow, filename);
    const fullUrl = pageConfig.path.startsWith('http')
      ? pageConfig.path
      : `${CONFIG.baseUrl}${pageConfig.path}`;

    if (skipExisting && fs.existsSync(outputPath)) {
      console.log(`  ⏭️  Skipping existing: ${filename}`);
      skipCount++;
      continue;
    }

    const success = await capturePage(browser, fullUrl, outputPath, viewport, pageConfig.wait);
    if (success) {
      successCount++;
      console.log(`  ✅ Saved: ${outputPath}`);
    }
  }

  await browser.close();

  console.log('\n' + '═'.repeat(50));
  console.log(`✅ Capture complete!`);
  console.log(`   Success: ${successCount} | Skipped: ${skipCount} | Total: ${flowConfig.pages.length}`);
  console.log('═'.repeat(50) + '\n');

  return { successCount, skipCount };
}

const args = process.argv.slice(2);
const flowArg = args.find(a => a.startsWith('--flow='));
const deviceArg = args.find(a => a.startsWith('--device='));
const flow = flowArg?.split('=')[1] || 'investor';
const device = (deviceArg?.split('=')[1] as 'desktop' | 'mobile') || 'desktop';

runCapture({ flow, device }).catch(err => {
  console.error('❌ Capture failed:', err);
  process.exit(1);
});

export {};
