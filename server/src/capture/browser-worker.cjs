
// Browser Worker - Uses stdin/stdout for JSON communication
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const os = require('os');

function findInstalledChromium() {
  const playwrightDir = path.join(os.homedir(), 'AppData', 'Local', 'ms-playwright');
  if (!fs.existsSync(playwrightDir)) return null;

  const entries = fs.readdirSync(playwrightDir, { withFileTypes: true });
  const chromiumFolders = entries
    .filter(e => e.isDirectory() && e.name.startsWith('chromium-'))
    .map(e => e.name)
    .sort()
    .reverse();

  for (const folder of chromiumFolders) {
    const chromePath = path.join(playwrightDir, folder, 'chrome-win', 'chrome.exe');
    if (fs.existsSync(chromePath)) return chromePath;
  }
  return null;
}

const windowsArgs = [
  '--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage',
  '--disable-gpu', '--no-zygote', '--disable-software-rasterizer',
  '--disable-extensions', '--disable-background-networking',
  '--disable-background-timer-throttling', '--disable-backgrounding-occluded-windows',
  '--disable-breakpad', '--disable-component-extensions-with-background-pages',
  '--disable-default-apps', '--disable-features=Translate,BlinkGenPropertyTrees',
  '--disable-hang-monitor', '--disable-prompt-on-repost',
  '--disable-renderer-backgrounding', '--disable-sync',
  '--force-color-profile=srgb', '--metrics-recording-only',
  '--no-first-run', '--password-store=basic', '--use-mock-keychain',
  '--enable-automation', '--disable-infobars', '--disable-popup-blocking',
  '--safebrowsing-disable-auto-update', '--disable-web-security',
  '--allow-running-insecure-content',
];

let browser = null;
let context = null;

function send(msg) {
  console.log('JSON:' + JSON.stringify(msg));
}

async function launchBrowser() {
  const executablePath = findInstalledChromium();
  if (executablePath) {
    console.log('Using chromium:', executablePath);
    browser = await chromium.launch({
      headless: true,
      executablePath: executablePath,
      timeout: 30000,
      args: windowsArgs,
    });
  } else {
    browser = await chromium.launch({
      headless: true,
      timeout: 30000,
      args: windowsArgs,
    });
  }
  
  context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    viewport: { width: 1920, height: 1080 },
    locale: 'en-US',
    deviceScaleFactor: 1,
  });
  
  send({ type: 'ready' });
}

process.stdin.setEncoding('utf8');
process.stdin.on('data', async (line) => {
  try {
    const msg = JSON.parse(line.trim());
    
    if (msg.type === 'launch') {
      await launchBrowser();
    }
    else if (msg.type === 'navigate') {
      if (!context) {
        send({ type: 'error', error: 'Browser not initialized' });
        return;
      }
      
      const page = await context.newPage();
      try {
        await page.goto(msg.url, { waitUntil: 'domcontentloaded', timeout: msg.timeout || 60000 });
        await page.waitForTimeout(2000);
        const html = await page.content();
        send({ type: 'success', html: html });
      } catch (e) {
        send({ type: 'error', error: e.message });
      } finally {
        await page.close();
      }
    }
    else if (msg.type === 'close') {
      if (context) await context.close();
      if (browser) await browser.close();
      send({ type: 'closed' });
      process.exit(0);
    }
  } catch (e) {
    send({ type: 'error', error: e.message });
  }
});
