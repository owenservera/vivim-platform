import fs from 'fs';

const html = fs.readFileSync('debug-chatgpt-1772892416081.html', 'utf8');

console.log('=== DEEP CHATGPT ANALYSIS ===\n');

// 1. Look for conversation content patterns
const patterns = [
  /streamController\.enqueue\(\"(.*?)\"\)/g,
  /__reactRouterContext\.streamController\.enqueue/g,
  /loaderData/g,
  /conversation/g,
  /message/g,
  /chat/g
];

patterns.forEach(pattern => {
  const matches = html.match(pattern);
  console.log(`${pattern}: ${matches ? matches.length : 0} matches`);
});

// 2. Extract all stream data
console.log('\n=== STREAM DATA ===');
const streamMatches = html.match(/streamController\.enqueue\(\"(.*?)\"\)/g);
if (streamMatches) {
  streamMatches.forEach((match, i) => {
    const data = match.match(/streamController\.enqueue\(\"(.*?)\"\)/)[1];
    console.log(`\n--- Stream ${i+1} ---`);
    try {
      const unescaped = JSON.parse('\"' + data + '\"');
      console.log('Length:', unescaped.length);
      console.log('Content preview:', unescaped.substring(0, 500));
      
      // Look for conversation data in the stream
      if (unescaped.includes('conversation') || unescaped.includes('message') || unescaped.includes('chat')) {
        console.log('>>> POTENTIAL CONVERSATION DATA FOUND <<<');
      }
    } catch (e) {
      console.log('Parse error:', e.message);
    }
  });
}

// 3. Look for actual message content in HTML
console.log('\n=== HTML CONTENT SEARCH ===');
const contentSelectors = [
  'data-message-author-role',
  'article',
  '.markdown',
  '.prose',
  '[data-testid]',
  '.whitespace-pre-wrap'
];

contentSelectors.forEach(selector => {
  const regex = new RegExp(selector, 'gi');
  const matches = html.match(regex);
  console.log(`${selector}: ${matches ? matches.length : 0} matches`);
});

// 4. Look for any JSON data in script tags
console.log('\n=== SCRIPT DATA ===');
const scriptMatches = html.match(/<script[^>]*>(.*?)<\/script>/gi);
if (scriptMatches) {
  console.log(`Found ${scriptMatches.length} script tags`);
  scriptMatches.forEach((script, i) => {
    const content = script.replace(/<\/?script[^>]*>/g, '');
    if (content.includes('conversation') || content.includes('message') || content.includes('chat')) {
      console.log(`\n--- Script ${i+1} with conversation data ---`);
      console.log(content.substring(0, 300) + '...');
    }
  });
}

// 5. Check if this is a share URL with no content
console.log('\n=== URL ANALYSIS ===');
if (html.includes('share') && html.includes('ChatGPT') && !html.includes('data-message-author-role')) {
  console.log('>>> This appears to be a share URL that requires authentication <<<');
}

console.log('\n=== END ANALYSIS ===');
