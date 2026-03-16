import { chromium } from 'playwright';
import path from 'path';
import os from 'os';

console.log('🧪 Starting system Chrome NON-headless test...');

try {
  // Find system Chrome
  const chromePaths = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    path.join(os.homedir(), 'AppData', 'Local', 'Google', 'Chrome', 'Application', 'chrome.exe'),
  ];

  let chromePath = null;
  for (const path of chromePaths) {
    try {
      const fs = await import('fs');
      if (fs.existsSync(path)) {
        console.log(`🔍 Found Chrome at: ${path}`);
        chromePath = path;
        break;
      }
    } catch (e) {
      // Try next path
    }
  }

  if (!chromePath) {
    console.log('❌ System Chrome not found!');
    process.exit(1);
  }

  const windowsArgs = [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-gpu',
    '--no-zygote',
    '--disable-software-rasterizer',
    '--disable-extensions',
    '--disable-background-networking',
    '--disable-background-timer-throttling',
    '--disable-backgrounding-occluded-windows',
    '--disable-breakpad',
    '--disable-component-extensions-with-background-pages',
    '--disable-default-apps',
    '--disable-features=Translate,BlinkGenPropertyTrees',
    '--disable-hang-monitor',
    '--disable-prompt-on-repost',
    '--disable-renderer-backgrounding',
    '--disable-sync',
    '--force-color-profile=srgb',
    '--metrics-recording-only',
    '--no-first-run',
    '--password-store=basic',
    '--use-mock-keychain',
    '--enable-automation',
    '--disable-infobars',
    '--disable-popup-blocking',
    '--safebrowsing-disable-auto-update',
    '--disable-web-security',
    '--allow-running-insecure-content',
  ];

  console.log('🔧 Launching system Chrome in NON-headless mode...');
  const browser = await chromium.launch({
    headless: false,
    channel: 'chrome',
    executablePath: chromePath,
    timeout: 10000,
    args: windowsArgs,
  });
  console.log('✅ Browser launched successfully!');

  console.log('📄 Creating page...');
  const page = await browser.newPage();
  console.log('✅ Page created successfully!');

  console.log('🌐 Navigating to example.com...');
  await page.goto('https://example.com', {
    waitUntil: 'domcontentloaded',
    timeout: 10000,
  });
  console.log('✅ Navigation successful!');

  const title = await page.title();
  console.log(`📄 Page title: ${title}`);

  console.log('⏸️  Keeping browser open for 2 seconds...');
  await new Promise(resolve => setTimeout(resolve, 2000));

  await page.close();
  await browser.close();
  console.log('✅ Browser closed successfully!');
  console.log('🎉 Test completed successfully!');
} catch (error) {
  console.error('❌ Test failed:', error.message);
  console.error('Stack:', error.stack);
  process.exit(1);
}