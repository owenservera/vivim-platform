import { chromium } from 'playwright';

console.log('🧪 Starting Playwright test in NON-headless mode...');

try {
  console.log('🔧 Launching chromium in non-headless mode...');
  const browser = await chromium.launch({
    headless: false,
    executablePath: 'C:\\Users\\VIVIM.inc\\AppData\\Local\\ms-playwright\\chromium-1208\\chrome-win64\\chrome.exe',
    timeout: 10000,
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
    timeout: 10000,
  });
  console.log('✅ Navigation successful!');

  const title = await page.title();
  console.log(`📄 Page title: ${title}`);

  console.log('⏸️  Keeping browser open for 2 seconds to verify it works...');
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