import { chromium } from 'playwright';

(async () => {
  console.log('Starting Playwright launch test...');
  try {
    const browser = await chromium.launch({ headless: true });
    console.log('Browser launched successfully!');
    const page = await browser.newPage();
    await page.goto('https://example.com');
    console.log('Page title:', await page.title());
    await browser.close();
    console.log('Test completed successfully.');
  } catch (error) {
    console.error('Launch failed:', error);
  }
})();
