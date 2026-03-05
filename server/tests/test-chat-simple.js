import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

console.log('Testing http://localhost:5173/chat...');

try {
  await page.goto('http://localhost:5173/chat', { timeout: 15000 });
  console.log('Page loaded!');
  
  const content = await page.content();
  const hasAIChat = content.includes('AI Assistant') || content.includes('ai-chat');
  console.log('AI Chat content found:', hasAIChat);
  
} catch (e) {
  console.error('Error:', e.message);
}

await browser.close();
console.log('Done');
