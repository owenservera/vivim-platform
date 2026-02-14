# OpenScroll Link Extraction & Rendering Improvement System

## Current State Analysis

### Supported Providers (9 total)
1. **ChatGPT** (`chatgpt.com/share/`) - Uses Playwright, robust multi-method extraction
2. **Claude** (`claude.ai/share/`) - Uses Playwright, DOM-based extraction
3. **Gemini** (`gemini.google.com/share/`) - Uses Playwright, consent handling
4. **Qwen** (`chat.qwen.ai/s/`) - Uses SingleFile, class-based extraction
5. **DeepSeek** (`chat.deepseek.com/share/`) - Uses SingleFile, `.ds-message` selector
6. **Kimi** (`www.kimi.com/share/`) - Uses SingleFile, markdown-content selector
7. **Z.ai** (`chat.z.ai/s/`) - Uses SingleFile, user-message/assistant classes
8. **Grok** (`grok.com/share/`) - Uses SingleFile, message-bubble selector
9. **Mistral** - Reference exists but needs verification

### Test URLs from chat-links.md
```
✅ ChatGPT: https://chatgpt.com/share/6972c61f-13a8-8006-a284-86d67852ae75
✅ ChatGPT: https://chatgpt.com/share/698a2bc3-7a70-8006-95b1-899a141372bc
✅ ChatGPT: https://chatgpt.com/share/698a2cf3-1c78-8006-8ce8-eb9f54a111e9
✅ Claude: https://claude.ai/share/d600b167-aae1-4985-8a64-aa3d3a9150df
✅ Claude: https://claude.ai/share/7302dc6b-aa69-4449-b9a4-d1cc0a81eddd
✅ Gemini: https://gemini.google.com/share/41c7c9113f61
✅ Gemini: https://gemini.google.com/share/38ad852b797b
✅ Gemini: https://gemini.google.com/share/d5b24f3671c5
✅ Qwen: https://chat.qwen.ai/s/635e4b63-44ec-4cf1-8310-721d69efac61?fev=0.1.40
✅ DeepSeek: https://chat.deepseek.com/share/rdhmeeeb6v3skpm5i3
✅ Kimi: https://www.kimi.com/share/19c43bc0-9c92-89f6-8000-00000d271f59
✅ Kimi: https://www.kimi.com/share/19c43bcc-c9e2-8d4b-8000-00009fdc625b
✅ Z.ai: https://chat.z.ai/s/984016de-58ab-43c0-ac45-168441eb59d0
✅ Z.ai: https://chat.z.ai/s/4908f5b8-d7c5-41f6-bfae-8d52418d7041
✅ Z.ai: https://chat.z.ai/s/d19008c6-8ed4-425e-aadb-ef8382392bfd
✅ Grok: https://grok.com/share/bGVnYWN5_ae10ced7-c418-4045-aa2c-01f8f4e86e6e
```

## Identified Issues

### 1. Link Parsing Issues
- **URL Parameter Handling**: Qwen URLs have `?fev=0.1.40` params that may affect detection
- **Trailing Whitespace**: Grok URL has trailing space in the markdown file
- **URL Validation**: No strict URL format validation before attempting extraction

### 2. Extraction Reliability Issues
- **Inconsistent Capture Methods**: Some use Playwright, others SingleFile - mixing strategies
- **Hardcoded Selectors**: DOM selectors may break when providers update their UI
- **No Fallback Chains**: Limited fallback methods when primary extraction fails
- **Missing Error Context**: Debug files saved but no structured error reporting

### 3. Content Structure Inconsistencies
- **Mixed Content Formats**: Some extractors return `content` string, others `parts` array
- **Metadata Variations**: Different providers include different metadata fields
- **Timestamp Handling**: Inconsistent timestamp extraction and formatting

### 4. Rendering Gaps
- **Missing Mermaid Rendering**: Mermaid diagrams shown as code blocks
- **Missing LaTeX Rendering**: Math shown as inline code
- **No Markdown Parsing**: Text parts rendered as plain text
- **Image Handling**: No proxy/caching for external images

## Iterative Improvement System Design

### Phase 1: Link Validation & Normalization Layer

```typescript
// src/services/link-validator.ts
interface LinkValidationResult {
  isValid: boolean;
  normalizedUrl: string;
  provider: string | null;
  errors: string[];
  warnings: string[];
}

class LinkValidator {
  // Strict URL pattern matching per provider
  private readonly URL_PATTERNS = {
    chatgpt: /^https:\/\/chatgpt\.com\/share\/[a-zA-Z0-9-]+$/,
    claude: /^https:\/\/claude\.ai\/share\/[a-zA-Z0-9-]+$/,
    gemini: /^https:\/\/gemini\.google\.com\/share\/[a-zA-Z0-9]+$/,
    // ... etc
  };

  validate(url: string): LinkValidationResult {
    // 1. Normalize URL (trim, remove fragments, clean params)
    // 2. Match against provider patterns
    // 3. Return detailed validation result
  }
}
```

### Phase 2: Extraction Strategy Pattern

```typescript
// src/services/extraction/extraction-strategy.ts
interface ExtractionStrategy {
  name: string;
  priority: number;
  canHandle(url: string, html: string): Promise<boolean>;
  extract(html: string, context: ExtractionContext): Promise<ExtractedConversation>;
}

interface ExtractionContext {
  url: string;
  provider: string;
  attempt: number;
  previousErrors: Error[];
}

// Implement strategies as chain of responsibility
class ReactStreamStrategy implements ExtractionStrategy {
  // For ChatGPT React Router stream extraction
}

class DOMSelectorStrategy implements ExtractionStrategy {
  // For standard DOM-based extraction
}

class AIAssistedStrategy implements ExtractionStrategy {
  // For using AI to parse when DOM fails
}
```

### Phase 3: Provider-Specific Extraction Config

```typescript
// src/config/extraction-profiles.ts
interface ExtractionProfile {
  provider: string;
  captureMethod: 'playwright' | 'singlefile' | 'hybrid';
  strategies: string[];
  selectors: {
    messageContainer: string[];
    userMessage: string[];
    assistantMessage: string[];
    codeBlock: string[];
    image: string[];
  };
  transformations: {
    normalizeContent: (content: any) => any;
    extractMetadata: (html: string) => any;
  };
}

const EXTRACTION_PROFILES: Record<string, ExtractionProfile> = {
  chatgpt: {
    captureMethod: 'playwright',
    strategies: ['react-stream', 'dom-selector', 'ai-assisted'],
    selectors: {
      messageContainer: ['article', '[data-message-author-role]'],
      // ... etc
    },
  },
  // ... etc
};
```

### Phase 4: Content Normalization Pipeline

```typescript
// src/services/content/normalizer.ts
interface ContentNormalizer {
  normalize(conversation: RawConversation): StandardizedConversation;
}

// Ensures all extracted content follows standard format
class StandardContentNormalizer implements ContentNormalizer {
  normalize(conv: RawConversation): StandardizedConversation {
    return {
      id: conv.id || generateUUID(),
      provider: conv.provider,
      sourceUrl: conv.sourceUrl,
      title: conv.title || 'Untitled Conversation',
      createdAt: this.normalizeTimestamp(conv.createdAt),
      exportedAt: new Date().toISOString(),
      messages: conv.messages.map(m => this.normalizeMessage(m)),
      stats: this.calculateStats(conv.messages),
      metadata: this.extractMetadata(conv),
      // New: Extraction provenance
      extraction: {
        version: '2.0',
        strategiesUsed: conv.strategiesUsed,
        extractionTime: conv.extractionTime,
        confidence: conv.confidence,
      },
    };
  }
}
```

### Phase 5: Enhanced Rendering Pipeline

```typescript
// pwa/src/components/content/EnhancedContentRenderer.tsx
interface RenderingCapability {
  type: ContentPart['type'];
  component: React.ComponentType<PartRendererProps>;
  capabilities: {
    interactive: boolean;
    lazyLoad: boolean;
    errorBoundary: boolean;
  };
}

// Capability-based renderer
class ContentRendererRegistry {
  private renderers = new Map<string, RenderingCapability>();

  register(capability: RenderingCapability) {
    this.renderers.set(capability.type, capability);
  }

  render(part: ContentPart) {
    const renderer = this.renderers.get(part.type);
    if (!renderer) return <UnknownPart part={part} />;
    
    const Component = renderer.component;
    if (renderer.capabilities.errorBoundary) {
      return (
        <ErrorBoundary fallback={<ErrorPart part={part} />}>
          <Component part={part} />
        </ErrorBoundary>
      );
    }
    return <Component part={part} />;
  }
}
```

### Phase 6: Iterative Testing Framework

```typescript
// src/testing/extraction-test-suite.ts
interface ExtractionTestCase {
  id: string;
  url: string;
  provider: string;
  expected: {
    minMessages: number;
    hasTitle: boolean;
    contentTypes: string[];
  };
  fixtures?: {
    html?: string;
    expectedOutput?: any;
  };
}

class ExtractionTestRunner {
  private testCases: ExtractionTestCase[] = [];

  async runTests(): Promise<TestResults> {
    // Run against all test URLs
    // Compare outputs
    // Generate improvement suggestions
  }

  async runRegressionTests(): Promise<void> {
    // Ensure new changes don't break existing extractions
  }
}
```

## Implementation Plan

### Step 1: Create Link Validator Service
- [ ] Implement URL pattern matching for all providers
- [ ] Add URL normalization (trim, params handling)
- [ ] Create validation error messages
- [ ] Add tests for all URL formats in chat-links.md

### Step 2: Refactor Extraction to Strategy Pattern
- [ ] Define ExtractionStrategy interface
- [ ] Migrate ChatGPT to ReactStreamStrategy
- [ ] Migrate others to DOMSelectorStrategy
- [ ] Add fallback chain logic
- [ ] Maintain backwards compatibility

### Step 3: Create Extraction Profiles
- [ ] Move hardcoded selectors to config files
- [ ] Add provider-specific transformations
- [ ] Enable hot-reloading of profiles for testing

### Step 4: Implement Content Normalizer
- [ ] Standardize all extractor outputs
- [ ] Add extraction provenance tracking
- [ ] Ensure backwards compatibility with existing data

### Step 5: Enhance Rendering
- [ ] Implement Mermaid diagram rendering
- [ ] Implement KaTeX/MathJax for LaTeX
- [ ] Add markdown parsing for text parts
- [ ] Add image proxy/caching

### Step 6: Build Testing Framework
- [ ] Create test cases for all chat-links.md URLs
- [ ] Add regression testing
- [ ] Create extraction quality scoring

## Backwards Compatibility Strategy

### Data Format Compatibility
```typescript
// Support both old and new formats
interface Message {
  id: string;
  role: 'user' | 'assistant';
  // Legacy support
  content?: string | ContentBlock[];
  // New standard
  parts?: ContentPart[];
  // Normalized access
  get normalizedContent(): ContentPart[];
}
```

### API Compatibility
- Keep existing extractor function signatures
- Add new options as optional parameters
- Use feature flags for new behavior

### Database Migration
- Add `extractionVersion` field to track format
- Support reading old formats indefinitely
- Gradual migration path

## Success Metrics

1. **Link Validation**: 100% of chat-links.md URLs validate correctly
2. **Extraction Success**: >95% success rate for all providers
3. **Content Fidelity**: All code blocks, images, diagrams extracted
4. **Rendering Accuracy**: Faithful representation of source content
5. **Performance**: <30s extraction time for typical conversations
6. **Error Recovery**: Automatic fallback to alternative strategies

## Files to Create/Modify

### New Files
```
server/src/services/link-validator.ts
server/src/services/extraction/strategies/
  ├── base-strategy.ts
  ├── react-stream-strategy.ts
  ├── dom-selector-strategy.ts
  └── ai-assisted-strategy.ts
server/src/config/extraction-profiles.ts
server/src/services/content/normalizer.ts
server/src/testing/extraction-test-suite.ts
server/src/services/extraction/orchestrator.ts
pwa/src/components/content/MermaidRenderer.tsx
pwa/src/components/content/LatexRenderer.tsx
pwa/src/components/content/MarkdownRenderer.tsx
```

### Modified Files
```
server/src/services/extractor.ts
server/src/extractors/extractor-*.js (refactor to use strategies)
pwa/src/components/content/ContentRenderer.tsx
```
