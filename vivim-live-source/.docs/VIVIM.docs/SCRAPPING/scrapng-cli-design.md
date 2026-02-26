I'll create a comprehensive guide for your Playwright-based AI chat scraper CLI tool. This covers the key challenges and best practices you'll encounter.

# AI Chat Scraper - Gotchas, Design Hints & Automation Tricks

## 🎭 Playwright-Specific Gotchas

### Dynamic Content Loading
- **Lazy Loading**: AI chat UIs often load messages as you scroll. Use `page.evaluate()` to scroll to bottom repeatedly until all content loads
- **Streaming Responses**: Messages may still be "typing" when you first load. Wait for streaming indicators to disappear
- **Network Idle**: `page.waitForLoadState('networkidle')` isn't always reliable for SPAs. Better to wait for specific selectors
- **Hydration Delays**: React/Vue apps may render skeleton content first. Wait for actual content selectors, not just DOM presence

```javascript
// Don't just wait for selector to exist
await page.waitForSelector('.message'); // ❌ May catch skeleton

// Wait for actual content
await page.waitForSelector('.message:has-text("")', { timeout: 5000 }); // ✅
```

### Rate Limiting & Politeness
- **Add delays**: Even for your own content, add 1-3s delays between requests
-
- **Session limits**: some  may have rate limits on public link access
- **User-Agent**: Use a Microsoft Edge UA (find full proper)

### Browser State Management
- **Cookie persistence**: Save cookies between runs to maintain any session state
- **Cache strategy**: Decide if you want browser cache (faster) or clean state (reliable)
- **Headless quirks**: Some sites detect headless mode. Test both `headless: true` and `headless: false`
- **Viewport size**: Set a consistent viewport. Mobile vs desktop may render differently

## 🔍 Scraping AI Chat Interfaces

### Content Extraction Challenges

**Message Boundaries**
- AI chats have turn-taking structure (user/assistant)
- Look for role attributes: `data-role="user"` or `data-message-author="human"`
- Preserve threading if conversations have branching

**Formatting Preservation**
- Code blocks: Extract language and syntax highlighting
- Markdown: Preserve inline formatting (bold, italic, links)
- LaTeX/Math: May be rendered as images or special components
- Tables: May be HTML tables or markdown
- Artifacts: Special embedded content (charts, code) needs special handling

**Special Elements**
```javascript
// Capture different content types
const messages = await page.$$eval('.message', msgs => msgs.map(m => ({
  role: m.dataset.role,
  text: m.querySelector('.text')?.innerText,
  code: Array.from(m.querySelectorAll('pre code')).map(c => ({
    lang: c.className.match(/language-(\w+)/)?.[1],
    content: c.textContent
  })),
  images: Array.from(m.querySelectorAll('img')).map(i => i.src),
  citations: Array.from(m.querySelectorAll('[data-citation]')).map(c => c.href)
})));
```

### Image Handling
- **Base64 embedded**: Some images are data URIs
- **External URLs**: May expire or require auth
- **Download strategy**: Download immediately vs store URLs
- **Alt text**: Preserve for context

### Metadata Extraction
- Conversation title
- Creation/share timestamp
- Model used (Claude 3.5, GPT-4, etc)
- Share URL/ID
- Total message count
- Token usage (if visible)

## 💾 Data Storage Strategy

### Schema Design
```json
{
  "conversation_id": "unique_id_from_url",
  "url": "original_share_url",
  "scraped_at": "2025-02-11T...",
  "metadata": {
    "title": "",
    "created_at": "",
    "model": "",
    "share_id": ""
  },
  "messages": [
    {
      "index": 0,
      "role": "user|assistant",
      "content": "",
      "content_type": "text|code|mixed",
      "attachments": [],
      "timestamp": ""
    }
  ],
  "raw_html": "optional_archive"
}
```

### Gotchas
- **Deduplication**: Use share URL as primary key, check before scraping
- **Updates**: Shared conversations might be updated. Track versions
- **Partial failures**: Save what you scraped even if errors occur
- **Character encoding**: Ensure UTF-8 everywhere (emojis, unicode math symbols)

## 🖥️ CLI Design Best Practices

### Command Structure
```bash
# Good: Clear, hierarchical commands
chat-scraper scrape <url>
chat-scraper scrape --batch urls.txt
chat-scraper list
chat-scraper export <id> --format json|md|html
chat-scraper stats

# Not: Flat command soup
chat-scraper --scrape --url <url>
```

### Essential Flags
- `--dry-run`: Show what would happen without doing it
- `--verbose` / `-v`: Increase logging detail
- `--quiet` / `-q`: Suppress non-error output
- `--force`: Skip confirmation prompts
- `--resume`: Continue from last checkpoint
- `--headless / --headed`: Toggle browser visibility
- `--slow`: Add extra delays for debugging
- `--output-dir`: Where to save results

### Progress Feedback
```javascript
// Use a progress library (cli-progress, ora)
import { SingleBar } from 'cli-progress';

const bar = new SingleBar({
  format: 'Scraping |{bar}| {percentage}% | {value}/{total} Messages | {status}'
});

bar.start(totalMessages, 0);
// Update as you scrape
bar.increment({ status: 'Processing message 5' });
```

### Configuration Management
```javascript
// Layered config: CLI args > .env > config.json > defaults
import { cosmiconfig } from 'cosmiconfig';

const explorer = cosmiconfig('chat-scraper');
const config = await explorer.search();

// Support multiple formats
// .chat-scraperrc
// .chat-scraperrc.json
// chat-scraper.config.js
```

### Output Formats
- **Machine-readable**: NDJSON for streaming, JSON for final
- **Human-readable**: Pretty tables (cli-table3), colored diffs
- **Logs**: Structured logging (pino, winston) with levels

## ⚙️ Automation & Reliability

### Retry Logic
```javascript
async function scrapeWithRetry(url, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await scrapePage(url);
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      
      const delay = Math.min(1000 * Math.pow(2, i), 10000); // Exponential backoff
      console.log(`Retry ${i + 1}/${maxRetries} after ${delay}ms`);
      await new Promise(r => setTimeout(r, delay));
    }
  }
}
```

### Idempotency & Resume
```javascript
// Track progress in a state file
const state = {
  urls: {
    'url1': { status: 'complete', scraped_at: '...' },
    'url2': { status: 'failed', error: '...', attempts: 3 },
    'url3': { status: 'pending' }
  }
};

// Skip already-completed
if (state.urls[url]?.status === 'complete') {
  console.log('Already scraped, skipping...');
  return;
}
```

### Error Handling
- **Categorize errors**: Network, parsing, storage, validation
- **Partial saves**: Save what you got before failing
- **Error log**: Separate file for failures to review later
- **Screenshots on error**: Playwright can screenshot when things fail

```javascript
try {
  await scrapePage(url);
} catch (error) {
  await page.screenshot({ 
    path: `errors/${url.replace(/\W/g, '_')}.png` 
  });
  throw error;
}
```

### Testing Strategy
- **Unit tests**: Parser functions with fixture HTML
- **Integration tests**: Real scraping in test mode (use VCR pattern)
- **Snapshot tests**: Compare parsed output against known-good
- **Mock browser**: Use Playwright's mock API for CI

## 🚀 Performance Optimizations

### Parallel Processing
```javascript
// Process multiple URLs concurrently (but not too many)
import pLimit from 'p-limit';

const limit = pLimit(3); // Max 3 concurrent browsers
const promises = urls.map(url => 
  limit(() => scrapeUrl(url))
);
await Promise.all(promises);
```

### Browser Reuse
```javascript
// Don't launch new browser for each URL
const browser = await playwright.chromium.launch();
const context = await browser.newContext();

for (const url of urls) {
  const page = await context.newPage();
  await scrape(page, url);
  await page.close(); // Close page, not browser
}

await browser.close();
```

### Selective Scraping
- Only scrape new conversations (check database first)
- Skip unchanged conversations (checksum the URL content)
- Incremental scraping (new messages only if supported)

## 🔒 Security & Privacy

### Environment Variables
```bash
# .env file
DATABASE_URL=postgresql://...
SCRAPER_USER_AGENT=MyArchiver/1.0
MAX_CONCURRENT=3
```

### Secrets Management
- Never hardcode API keys or credentials
- Use keyring for sensitive data
- `.gitignore` your database file and `.env`

### Data Sanitization
- Strip any accidentally scraped PII if shared links expose it
- Redact sensitive patterns (emails, phone numbers) if needed
- Audit what you're storing vs what you need

## 📋 CLI UX Tips

### Interactive Mode
```javascript
import prompts from 'prompts';

const response = await prompts([
  {
    type: 'text',
    name: 'url',
    message: 'Enter share URL to scrape:'
  },
  {
    type: 'confirm',
    name: 'download_images',
    message: 'Download embedded images?',
    initial: true
  }
]);
```

### Color & Formatting
```javascript
import chalk from 'chalk';

console.log(chalk.green('✓') + ' Successfully scraped 42 messages');
console.log(chalk.yellow('⚠') + ' Warning: 3 images failed to download');
console.log(chalk.red('✗') + ' Error: Rate limited');
```

### Confirmation for Destructive Actions
```javascript
if (!flags.force) {
  const confirm = await prompts({
    type: 'confirm',
    name: 'value',
    message: `Delete ${count} conversations?`,
    initial: false
  });
  if (!confirm.value) process.exit(0);
}
```

## 🐛 Debugging Tips

### Verbose Mode Tiers
```
Level 0 (quiet):    Errors only
Level 1 (default):  Errors + summary
Level 2 (-v):       + progress updates
Level 3 (-vv):      + each action
Level 4 (-vvv):     + full Playwright logs
```

### Development Helpers
- `--no-headless`: See browser for debugging
- `--slow-mo=100`: Slow down Playwright actions
- `--pause-on-error`: Open devtools when error occurs
- `--save-har`: Save network traffic for analysis

### Trace Files
```javascript
await context.tracing.start({ screenshots: true, snapshots: true });
// ... scrape ...
await context.tracing.stop({ path: 'trace.zip' });
// View at trace.playwright.dev
```

## 📦 Recommended Dependencies

```json
{
  "dependencies": {
    "playwright": "^1.40.0",
    "commander": "^11.1.0",         // CLI framework
    "chalk": "^5.3.0",              // Colors
    "ora": "^7.0.1",                // Spinners
    "cli-progress": "^3.12.0",      // Progress bars
    "pino": "^8.16.2",              // Logging
    "dotenv": "^16.3.1",            // Environment
    "zod": "^3.22.4",               // Schema validation
    "better-sqlite3": "^9.2.2",     // Local DB
    "turndown": "^7.1.2",           // HTML to Markdown
    "p-limit": "^5.0.0",            // Concurrency control
    "prompts": "^2.4.2"             // Interactive prompts
  }
}
```

## 🎯 Quick Wins

1. **Start simple**: Get one URL working perfectly before batching
2. **Test on variety**: Different conversation lengths, content types
3. **Version your scrapers**: Site HTML changes, keep old parsers
4. **Document selectors**: Comment why each CSS selector is chosen
5. **Build incrementally**: CLI → scraper → parser → storage
6. **Use fixtures**: Save example HTML for testing offline

Good luck with your project! The key is handling failures gracefully and making the tool resumable and idempotent.
