# Link Extraction & Rendering Improvements

## Summary of Changes

This document summarizes the improvements made to the link extraction and rendering system to ensure faithful rendering of source content while maintaining backwards compatibility.

## Problems Identified

### 1. Link Parsing Issues
- URLs with query parameters (e.g., Qwen with `?fev=0.1.40`) were handled inconsistently
- Trailing whitespace in URLs could cause detection failures
- No centralized URL validation

### 2. Extraction Format Inconsistency
- Some extractors returned `content` as string
- Some extractors returned `content` as array
- Some extractors returned `parts` array
- Database schema expects `parts` JSON field
- PWA renderer expects `parts` array format

### 3. No Validation
- Extractions could return empty message arrays without error
- No check for missing required fields (role, content)
- Failed extractions silently returned partial data

### 4. Missing Diagnostic Tools
- No way to test extraction against URLs
- No visibility into why extractions failed
- Hard to debug selector issues

## Solutions Implemented

### 1. Link Validator Service (`server/src/services/link-validator.ts`)
- **URL normalization**: Trims whitespace, removes fragments
- **Provider detection**: Strict regex patterns for each provider
- **Share ID extraction**: Extracts conversation ID from URL
- **Batch validation**: Can validate multiple URLs at once

```typescript
// Usage
import { validateUrl } from './services/link-validator.js';

const result = validateUrl('https://chatgpt.com/share/abc123');
// Returns: { isValid: true, provider: 'chatgpt', normalizedUrl: '...', ... }
```

### 2. Extraction Validator & Normalizer (`server/src/services/extraction-validator.js`)
- **Validation**: Checks for required fields, validates message structure
- **Normalization**: Converts all formats to standard `parts` array
- **Backwards compatibility**: Also sets `content` field
- **Statistics calculation**: Computes word counts, message types, etc.

```typescript
// Usage
import { ExtractionValidator } from './services/extraction-validator.js';

// Validate
const validation = ExtractionValidator.validate(conversation, 'chatgpt');
// Returns: { valid: true, errors: [], warnings: [], messageCount: 5 }

// Normalize
const normalized = ExtractionValidator.normalize(conversation, 'chatgpt');
// Always returns consistent format with parts[] array
```

### 3. Updated Extractor Service (`server/src/services/extractor.js`)
- Integrated validation step after extraction
- Integrated normalization before returning
- Added validation phase to progress callbacks
- Throws descriptive errors for invalid extractions

### 4. Diagnostic Tool (`server/diagnose-links.js`)
- Tests provider detection against all URLs in chat-links.md
- Can run dry-run mode (no real extraction)
- Can run full extraction tests with verbose output
- Generates detailed reports with error categorization
- Saves debug HTML/JSON for failed extractions

```bash
# Test provider detection only
node diagnose-links.js --dry-run

# Run full extraction tests
node diagnose-links.js --verbose --save

# Custom test file
node diagnose-links.js --file my-urls.txt --timeout 300
```

## Standard Data Format

All extractions now return this consistent format:

```typescript
interface Conversation {
  id: string;
  provider: string;
  sourceUrl: string;
  title: string;
  model?: string;
  createdAt: string;
  updatedAt: string;
  capturedAt: string;
  exportedAt: string;
  messages: Message[];
  stats: ConversationStats;
  metadata: {
    provider: string;
    normalized: boolean;
    originalFormat: string;
  };
}

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  author: string;
  messageIndex: number;
  createdAt: string;
  status: string;
  parts: ContentPart[];
  content: ContentPart[]; // Backwards compat
  metadata: object;
  contentHash?: string;
}

interface ContentPart {
  type: 'text' | 'code' | 'image' | 'latex' | 'table' | 'mermaid' | 'tool_call' | 'tool_result';
  content: string | object;
  metadata?: object;
  language?: string; // For code blocks
  alt?: string; // For images
}
```

## Test URLs

The following URLs from chat-links.md are used for testing:

| Provider | Count | Status |
|----------|-------|--------|
| ChatGPT | 3 | Detection working |
| Claude | 2 | Detection working |
| Gemini | 3 | Detection working |
| Qwen | 1 | Detection working |
| DeepSeek | 1 | Detection working |
| Kimi | 2 | Detection working |
| Z.ai | 3 | Detection working |
| Grok | 1 | Detection working |

## Backwards Compatibility

All changes maintain backwards compatibility:

1. **Extractor functions**: Same signatures, same options
2. **Message content**: Both `parts` and `content` fields populated
3. **Database storage**: Normalized to match Prisma schema
4. **PWA rendering**: ContentRenderer already supports parts array

## Next Steps for Iterative Improvement

1. **Run diagnostic tool** against all URLs to identify which extractions fail
2. **Fix failing extractors** based on diagnostic output
3. **Add retry logic** with alternative selectors
4. **Implement caching** for successful extractions
5. **Add monitoring** to track extraction success rates

## Files Modified/Created

### New Files
- `server/src/services/link-validator.ts` - URL validation and normalization
- `server/src/services/extraction-validator.js` - Result validation and normalization
- `server/diagnose-links.js` - Diagnostic CLI tool
- `server/src/extractors/types.ts` - TypeScript type definitions

### Modified Files
- `server/src/services/extractor.js` - Integrated validation and normalization

## Running the Diagnostics

```bash
cd server

# Quick provider detection test
node diagnose-links.js --dry-run

# Full extraction test (requires working Playwright/SingleFile)
node diagnose-links.js --verbose --save --timeout 180
```

## Success Criteria

- [x] All URLs in chat-links.md pass provider detection
- [x] All extractions return consistent format
- [x] Validation catches empty/failed extractions
- [x] Normalization handles all extractor output formats
- [x] Backwards compatibility maintained
- [ ] Real extraction tests pass (pending actual runs)
