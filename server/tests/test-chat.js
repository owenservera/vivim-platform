import { chromium } from 'playwright';

async function testAIChat() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  const errors = [];
  const networkCalls = [];
  
  // Listen for console errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });
  
  // Listen for network calls to AI endpoints
  page.on('response', response => {
    if (response.url().includes('/ai/')) {
      networkCalls.push({ url: response.url(), status: response.status() });
    }
  });
  
  console.log('Navigating to http://localhost:5173/chat...');
  await page.goto('http://localhost:5173/chat', { waitUntil: 'networkidle', timeout: 30000 });
  
  // Check if page loaded
  const title = await page.title();
  console.log('Page title:', title);
  
  // Check for AI Chat elements
  const aiHeader = await page.locator('text=AI Assistant').count();
  const inputBox = await page.locator('textarea, input[type="text"]').count();
  const sendButton = await page.locator('button:has-text("Send")').count();
  
  console.log('AI Assistant header found:', aiHeader > 0);
  console.log('Input box found:', inputBox > 0);
  console.log('Send button found:', sendButton > 0);
  
  // Wait a moment for any API calls
  await page.waitForTimeout(2000);
  
  console.log('\n--- Network Calls to AI endpoints ---');
  networkCalls.forEach(call => {
    console.log(`${call.status}: ${call.url}`);
  });
  
  console.log('\n--- Console Errors ---');
  if (errors.length === 0) {
    console.log('No console errors!');
  } else {
    errors.forEach(err => console.log('ERROR:', err));
  }
  
  await browser.close();
  
  // Summary
  console.log('\n=== TEST SUMMARY ===');
  console.log('Page loaded:', aiHeader > 0 ? 'YES' : 'NO');
  console.log('AI Chat UI visible:', (aiHeader > 0 && inputBox > 0) ? 'YES' : 'NO');
  console.log('AI API calls made:', networkCalls.length > 0 ? 'YES' : 'NO');
  console.log('Console errors:', errors.length);
  
  return { success: aiHeader > 0 && inputBox > 0, errors, networkCalls };
}

testAIChat().then(result => {
  console.log('\nTest result:', result.success ? 'PASSED' : 'FAILED');
  process.exit(result.success ? 0 : 1);
}).catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
