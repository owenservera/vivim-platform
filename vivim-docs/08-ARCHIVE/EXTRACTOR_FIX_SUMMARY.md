# Provider Extractor Fixes

**Date:** 2026-03-17  
**Issue:** qwen, kimi, and grok extractors were not capturing all messages from shared links

## Problem Analysis

The extractors for **qwen**, **kimi**, and **grok** were using overly specific CSS selectors that didn't match the actual HTML structure of the captured pages. This resulted in:

- **0-2 messages extracted** when conversations should have **4+ messages**
- Missing conversation content
- Incomplete data capture

## Root Causes

### 1. Qwen Extractor
**Before:**
```javascript
// Too specific - class names didn't match actual DOM
if (className.includes('qwen-chat-message-user')) {
  role = 'user';
} else if (className.includes('qwen-chat-message-assistant')) {
  role = 'assistant';
}
```

**Issues:**
- Single selector strategy
- Assumed specific class naming convention
- No fallback mechanisms

### 2. Kimi Extractor
**Before:**
```javascript
// Limited selectors
$('[class*="chat-item"], [class*="message-item"], .chat-turn').each(...)
```

**Issues:**
- Only 3 selector patterns
- Assumed markdown-content structure
- Weak role detection

### 3. Grok Extractor
**Before:**
```javascript
// Limited selectors
const selectors = [
  '.message-bubble',
  '[data-testid="message"]',
  '.message',
  '[class*="message"]',
  '.prose',
];
```

**Issues:**
- Only 5 selector patterns
- Weak role detection heuristics
- No aggressive fallback

## Solutions Implemented

### Common Strategy Applied to All Three

1. **Multiple Selector Strategies** - Try 8-10 different selector patterns
2. **Progressive Fallback** - Three levels of fallback if initial selectors fail
3. **Enhanced Role Detection** - Multiple heuristics for determining user vs assistant
4. **UI Chrome Filtering** - Skip headers, footers, navs, buttons
5. **Duplicate Prevention** - Filter exact duplicates
6. **Content Validation** - Skip too short/long content, UI patterns

### Qwen Extractor Improvements

**New selector strategy:**
```javascript
const messageSelectors = [
  '[class*="message"]',
  '[class*="chat-item"]',
  '[class*="conversation-item"]',
  '[data-role]',
  'article',
  'section',
];
```

**Role detection:**
1. Check `data-role` attribute
2. Check class name patterns (user, assistant, ai, bot, model)
3. Fallback to position-based (alternating)

**Fallback strategies:**
1. Try generic message selectors
2. Look for content containers
3. Aggressive fallback: any substantial text blocks

### Kimi Extractor Improvements

**New selector strategy:**
```javascript
const messageSelectors = [
  '[class*="message"]',
  '[class*="chat-item"]',
  '[class*="message-item"]',
  '[class*="chat-turn"]',
  '[class*="bubble"]',
  '[class*="dialog"]',
  'article',
  'section',
];
```

**Role detection:**
1. Class name patterns (user, human, customer vs assistant, ai, bot, model, kimi)
2. Avatar indicators (user-avatar, ai-avatar, bot-icon)
3. Position-based alternating

**Fallback strategies:**
1. Try message container selectors
2. Look for content/text containers
3. Aggressive fallback: any substantial paragraphs

### Grok Extractor Improvements

**New selector strategy:**
```javascript
const selectors = [
  '[class*="message"]',
  '[class*="bubble"]',
  '[class*="chat-item"]',
  '[class*="conversation-item"]',
  '[class*="prose"]',
  '[class*="content"]',
  '[data-testid*="message"]',
  'article',
  'section',
];
```

**Role detection:**
1. Class name patterns (user, human, customer, bg-surface-l1, border-border-l1)
2. Avatar indicators (img[src*="user"], user-avatar)
3. Position-based (first message defaults to user)

**Fallback strategies:**
1. Try message container selectors
2. Look for text content containers
3. Aggressive fallback: any substantial text (p, div, span)

## Files Modified

1. **`server/src/extractors/extractor-qwen.js`**
   - Replaced `extractQwenData()` function
   - Added multi-strategy selector approach
   - Enhanced role detection
   - Added 3-level fallback

2. **`server/src/extractors/extractor-kimi.js`**
   - Replaced `extractKimiData()` function
   - Replaced 2-method approach with 3-strategy approach
   - Enhanced role detection with avatar heuristics
   - Added aggressive fallback

3. **`server/src/extractors/extractor-grok.js`**
   - Replaced `extractGrokData()` function
   - Expanded from 5 to 9 selector patterns
   - Enhanced role detection
   - Added 3-level fallback strategy

## Testing

### Test Links (from chat-links.md)

**Qwen:**
- `https://chat.qwen.ai/s/635e4b63-44ec-4cf1-8310-721d69efac61?fev=0.1.40`
- Expected: 4+ messages

**Kimi:**
- `https://www.kimi.com/share/19c43bc0-9c92-89f6-8000-00000d271f59`
- `https://www.kimi.com/share/19c43bcc-c9e2-8d4b-8000-00009fdc625b`
- Expected: 4+ messages each

**Grok:**
- `https://grok.com/share/bGVnYWN5_ae10ced7-c418-4045-aa2c-01f8f4e86e6e`
- Expected: 4+ messages

### Test Script

A test script was created at `test-provider-extractors.js` but requires SingleFile CLI to be installed.

**To test when infrastructure is ready:**
```bash
bun test-provider-extractors.js
```

## Expected Improvements

| Provider | Before | After | Improvement |
|----------|--------|-------|-------------|
| qwen | 0-2 msgs | 4+ msgs | **+200%+** |
| kimi | 0-2 msgs | 4+ msgs | **+200%+** |
| grok | 0-2 msgs | 4+ msgs | **+200%+** |

## Next Steps

1. **Install SingleFile CLI** - Required for full end-to-end testing
2. **Run live tests** - Test against actual share links
3. **Verify message counts** - Confirm 4+ messages per conversation
4. **Check content quality** - Ensure rich formatting works correctly
5. **Monitor production** - Watch for any edge cases not covered

## Technical Notes

### Selector Strategy Design

The new selectors are designed to be:
- **Generic enough** to match various DOM structures
- **Specific enough** to avoid UI chrome
- **Progressive** - try specific first, then generic
- **Resilient** - multiple fallback levels

### Role Detection Heuristics

1. **Explicit indicators** (data attributes, specific classes)
2. **Semantic indicators** (class names containing role keywords)
3. **Visual indicators** (avatar presence)
4. **Positional indicators** (alternating pattern)

### Content Filtering

- Minimum length: 3-30 characters (provider dependent)
- Maximum length: 10,000-50,000 characters
- Skip UI patterns: "Share", "Copy", "Export", "Send", "Like", etc.
- Skip emoji-only messages: 🔍🤖💬📎

## Related Files

- `server/src/services/extractor.js` - Main extraction service router
- `server/src/services/extraction/strategies/base-strategy.ts` - Base extraction strategy
- `server/src/extractors/types.ts` - Common types for extractors
- `server/src/capture.js` - SingleFile capture integration
