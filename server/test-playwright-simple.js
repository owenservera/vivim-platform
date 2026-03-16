import { chromium } from 'playwright';

console.log('🧪 Starting simple Playwright test...');

try {
  console.log('🔧 Launching chromium with Windows-compatible settings...');
  const browser = await chromium.launch({
    headless: true,
    timeout: 60000,
    args: [
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
    ],
  });
  console.log('✅ Browser launched successfully!');

  console.log('📄 Creating page...');
  const page = await browser.newPage();
  console.log('✅ Page created successfully!');

  console.log('🌐 Navigating to example.com...');
  await page.goto('https://example.com', {
    waitUntil: 'domcontentloaded',
    timeout: 30000,
  });
  console.log('✅ Navigation successful!');

  const title = await page.title();
  console.log(`📄 Page title: ${title}`);

  await page.close();
  await browser.close();
  console.log('✅ Browser closed successfully!');
  console.log('🎉 Test completed successfully!');
} catch (error) {
  console.error('❌ Test failed:', error.message);
  console.error('Stack:', error.stack);
  process.exit(1);
}