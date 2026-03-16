import { chromium } from 'playwright';

const path = 'C:\\Users\\VIVIM.inc\\AppData\\Local\\ms-playwright\\chromium-1194\\chrome-win\\chrome.exe';
console.log('Testing chromium at:', path);

try {
  const browser = await chromium.launch({
    headless: true,
    executablePath: path,
    timeout: 15000,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  console.log('SUCCESS - Browser launched!');
  
  const page = await browser.newPage();
  await page.goto('https://example.com', { timeout: 10000 });
  console.log('Page title:', await page.title());
  
  await browser.close();
  console.log('All done!');
} catch(e) {
  console.log('FAILED:', e.message);
  process.exit(1);
}
