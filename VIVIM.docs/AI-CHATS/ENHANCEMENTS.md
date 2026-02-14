# VIVIM AI Chat - Top 20 Enhancements
**Focus: UX High-Impact | PWA + Backend | Auto-Model + Dynamic Persona ACU**

---

## Tier 1: High-Impact UX & Integration (1-5)

### 1. Main Feed AI Integration Panel
**Priority: 🔴 Critical**

Create a persistent "AI Conversations" panel integrated into the main feed showing:
- Active conversations with last message preview
- Quick-access to pinned/frequent chats
- Collapsible widget in the main interface
- Unread indicator with message count

**Files affected**: `pwa/src/components/`, `mobile/src/components/`

```
┌─────────────────────────────────────────────────────────┐
│  🤖 AI Conversations                          [Expand] │
├─────────────────────────────────────────────────────────┤
│  📌 Recent                                           │
│  ┌─────────────────────────────────────────────────┐  │
│  │ 💬 "Gravitational Lensing Discussion"           │  │
│  │    Last: "Can you explain the math behind..."   │  │
│  │    2m ago  •  glm-4.7                          │  │
│  └─────────────────────────────────────────────────┘  │
│  ┌─────────────────────────────────────────────────┐  │
│  │ 💬 "React Component Architecture"              │  │
│  │    Last: "Here's the pattern I mentioned..."    │  │
│  │    1h ago  •  gpt-5.2                          │  │
│  └─────────────────────────────────────────────────┘  │
│                                                       │
│  [View All Conversations]                             │
└─────────────────────────────────────────────────────────┘
```

### 2. Seamless Trigger System (OmniComposer Enhancement)
**Priority: 🔴 Critical**

Expand OmniComposer triggers with visual indicators and inline help:

| Trigger | Symbol | Visual | Action |
|---------|--------|--------|--------|
| `/ai` | `/ai` | 🤖 | Switch to AI chat context |
| `@ctx` | `@` | 📎 | Attach current page context |
| `!remix` | `!remix` | �混 | Remix content with AI |
| `#topic` | `#` | 🏷️ | Tag conversation topic |
| `/model:auto` | `/model:auto` | ⚡ | Enable auto-model selection |

**Implementation**: Add visual chips for active triggers, inline suggestion cards

### 3. Conversation Remuxing (Novel Feature)
**Priority: 🔴 Critical - Novel Value**

"Remux" = Reuse + Mix existing conversations into new contexts:

**Features**:
- Select messages from existing conversations
- Combine into new conversation with AI context
- Tag remuxed sources for traceability
- Smart suggestions based on current context

```
User types: /remux
    ↓
Shows modal:
┌─────────────────────────────────────────────────────┐
│  🔀 Remux Conversation                              │
├─────────────────────────────────────────────────────┤
│  Select source messages:                            │
│  ☐ [Physics Chat] "Einstein's field equations..."  │
│  ☐ [Math Chat] "Calculus optimization techniques"   │
│  ☐ [Code Chat] "Pattern matching algorithms"       │
│                                                     │
│  New conversation title: [Auto-generated ▾]        │
│  Target model: [Auto-select ▾]                    │
│                                                     │
│  [Cancel]  [Create Remuxed Conversation]            │
└─────────────────────────────────────────────────────┘
```

### 4. Streaming Stability & Reconnection
**Priority: 🔴 Critical - Pain Point**

Fix streaming issues with robust handling:

```typescript
// Enhanced streaming with reconnection
interface StreamConfig {
  maxRetries: 3;
  retryDelay: 1000; // ms
  backoffMultiplier: 2;
  heartbeatInterval: 30000; // detect dead connections
  reconnectWindow: 60000; // allow reconnect within 60s
}

async function resilientStream(request: AICompletionRequest): Promise<void> {
  // 1. Detect stream death via heartbeat
  // 2. Auto-retry with exponential backoff
  // 3. Resume from last message if possible
  // 4. User notification with "Reconnecting..." state
}
```

**Features**:
- Visual "Reconnecting..." indicator
- Automatic retry with progress bar
- Manual "Retry from scratch" option
- Connection quality indicator

### 5. Unified Data Structures (Backend Standardization)
**Priority: 🔴 Critical - Platform Foundation**

Standardize all AI-related data structures:

```typescript
// New unified types file: server/src/types/ai-chat.ts

interface AIFeedback {
  id: string;
  conversationId: string;
  messageId: string;
  type: 'thumbs-up' | 'thumbs-down' | 'regenerate' | 'copy';
  timestamp: number;
  metadata?: {
    responseTime?: number;
    tokenCount?: number;
    provider?: string;
  };
}

interface ConversationContext {
  // For auto-model selection
  topics: string[]; // ['physics', 'coding', 'react']
  complexity: 'low' | 'medium' | 'high';
  urgency: 'casual' | 'focused' | 'critical';
  language: string; // 'en', 'zh', 'es', etc.
  
  // For dynamic persona ACU
  personaScore: number; // 0-100
  acus: ACUReference[]; // Linked ACUs
  expertiseLevel: 'beginner' | 'intermediate' | 'expert';
}

interface ModelRecommendation {
  provider: AIProviderType;
  model: string;
  confidence: number; // 0-1
  reasoning: string; // "High complexity + coding context → GPT-5.2"
  estimatedCost: number;
  contextWindow: number;
}
```

---

## Tier 2: Auto-Model Intelligence (6-10)

### 6. Auto-Model Selector Engine
**Priority: 🟠 High - Novel Feature**

Dynamic model selection based on conversation context:

```typescript
// server/src/services/auto-model-service.js

class AutoModelSelector {
  async selectModel(context: ConversationContext): Promise<ModelRecommendation> {
    const factors = {
      complexity: this.assessComplexity(context),
      topicMatch: this.getTopicModelMapping(context.topics),
      urgency: context.urgency,
      costSensitivity: await this.getUserCostPreference(context.userId),
      availableProviders: await this.getActiveProviders(),
    };

    // Scoring rubric
    const scores = this.calculateScores(factors);
    
    return {
      provider: scores.best.provider,
      model: scores.best.model,
      confidence: scores.confidence,
      reasoning: scores.explanation,
    };
  }

  assessComplexity(context: ConversationContext): 'low' | 'medium' | 'high' {
    // Analyze:
    // - Message length trends
    // - Technical vocabulary density
    // - Task type (coding vs creative vs QA)
    // - Historical pattern from ACUs
  }
}
```

**Selection Rubric**:

| Context Factor | Low Complexity | Medium Complexity | High Complexity |
|---------------|---------------|-------------------|-----------------|
| **Topic** | Daily chat | Analysis | Code review |
| **Language** | Simple English | Mixed | Technical jargon |
| **Urgency** | Casual | Focused | Critical |
| **Recommended** | glm-4.7 (free) | gpt-5-mini | gpt-5.2 / Claude |

### 7. Conversation Context Analyzer
**Priority: 🟠 High**

Extract and track context from conversations:

```typescript
// Analyzes conversation and updates context in real-time
class ContextAnalyzer {
  async analyzeConversation(conversationId: string): Promise<ConversationContext> {
    const messages = await this.getMessages(conversationId);
    
    return {
      topics: this.extractTopics(messages),
      complexity: this.assessComplexity(messages),
      urgency: this.detectUrgency(messages),
      language: this.detectLanguage(messages),
      personaScore: await this.calculatePersonaScore(messages),
    };
  }

  private extractTopics(messages: Message[]): string[] {
    // NLP-based topic extraction
    // Link to ACU taxonomy
    // Return ranked topics: ['physics', 'relativity', 'math']
  }
}
```

### 8. Dynamic Persona ACU Aggregator (Novel Feature)
**Priority: 🟠 High - Core Innovation**

Build user persona from aggregated ACUs:

```typescript
// server/src/services/persona-aggregator.js

interface PersonaACU {
  acuId: string;
  score: number; // 0-100 relevance to current conversation
  category: string; // 'physics', 'coding', 'writing'
  recency: number; // how recently engaged
  strength: number; // depth of engagement
  evolution: number; // how much the persona has grown
}

class PersonaACUAggregator {
  // Build persona hierarchy from ACU interactions
  async buildPersona(userId: string, context?: ConversationContext): Promise<PersonaProfile> {
    const userACUs = await this.getUserACUs(userId);
    
    // Scoring algorithm
    const scoredACUs = userACUs.map(acu => ({
      ...acu,
      score: this.calculateACUScore(acu, context),
    }));

    // Hierarchical grouping
    const hierarchy = this.buildHierarchy(scoredACUs);
    
    return {
      primaryExpertise: hierarchy[0], // e.g., 'physics'
      secondaryExpertise: hierarchy[1], // e.g., 'math'
      recentFocus: hierarchy.slice(0, 3),
      expertiseLevel: this.determineExpertiseLevel(hierarchy),
      confidenceScore: this.calculateConfidence(hierarchy),
    };
  }
}
```

**Persona Hierarchy Visualization**:
```
User Persona Profile
├── 🌟 Physics (Score: 92)
│   ├── Quantum Mechanics (87)
│   ├── Relativity (81)
│   └── Astrophysics (75)
├── 💻 Coding (Score: 78)
│   ├── React (85)
│   ├── TypeScript (72)
│   └── Architecture (68)
├── 📝 Writing (Score: 45)
│   ├── Technical Docs (52)
│   └── Creative (38)
└── 🎯 Learning: Data Science (Score: 61, growing)
```

### 9. Dynamic System Prompt Generator
**Priority: 🟠 High - Core Innovation**

Generate context-aware system prompts:

```typescript
// server/src/services/dynamic-system-prompt.js

class DynamicSystemPrompt {
  async generatePrompt(
    persona: PersonaProfile,
    context: ConversationContext
  ): Promise<string> {
    const basePrompt = this.getBasePrompt();
    const personaContext = this.buildPersonaContext(persona);
    const taskContext = this.buildTaskContext(context);
    const styleAdaptation = this.getStyleAdaptation(persona);

    return `
${basePrompt}

## User Context
${personaContext}

## Current Task
${taskContext}

## Communication Style
${styleAdaptation}

---
Current date: ${new Date().toISOString()}
User expertise level: ${persona.expertiseLevel}
Confidence: ${persona.confidenceScore}%
    `.trim();
  }

  private buildPersonaContext(persona: PersonaProfile): string {
    return `
The user has demonstrated expertise in:
${persona.recentFocus.map(e => `- ${e.category} (${e.score}/100)`).join('\n')}

Primary domain: ${persona.primaryExpertise.category}
Expertise level: ${persona.primaryExpertise.expertiseLevel}
    `.trim();
  }
}
```

**Example Output**:
```
You are a helpful AI assistant. The user has demonstrated expertise in:
- Physics (92/100)
- React (85/100)
- TypeScript (72/100)

Primary domain: Physics (Expert level)
Communication style: Technical, concise, uses domain terminology.

Tailor responses accordingly while remaining accessible.
```

### 10. Model Suggestion UI
**Priority: 🟠 Medium**

Visual indicator when auto-model activates:

```
┌─────────────────────────────────────────────────────┐
│  💬 Physics Discussion                     [⚡ Auto] │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌─ Auto-Model Suggestion ─────────────────────┐  │
│  │  ⚡ Smart Selection Active                   │  │
│  │                                              │  │
│  │  Selected: Claude Opus 4.6                  │  │
│  │  Reasoning: High complexity physics +       │  │
│  │  coding context detected                    │  │
│  │                                              │  │
│  │  [Keep Claude]  [Switch Model]  [Why?]       │  │
│  └──────────────────────────────────────────────┘  │
│                                                     │
│  User: Can you derive the Schwarzschild metric?    │
└─────────────────────────────────────────────────────┘
```

---

## Tier 3: Rich Features (11-15)

### 11. Rich Text Rendering (Markdown + Code)
**Priority: 🟡 Medium**

Implement comprehensive message rendering:

```typescript
// Dependencies: react-markdown, rehype-highlight, remark-gfm
// Features:
// - Full markdown support
// - Syntax highlighting for 50+ languages
// - Math equations (KaTeX)
// - Tables with styling
// - Image rendering
// - Copy code block button
// - Expandable code blocks

interface RichMessageProps {
  content: string; // Markdown content
  onCodeCopy?: (code: string) => void;
  onImageClick?: (url: string) => void;
  maxCodeHeight?: number; // Expandable
}
```

**Supported Formats**:
- GitHub Flavored Markdown
- Code blocks with syntax highlighting
- Math: `$$E = mc^2$$`
- Mermaid diagrams (future)
- LaTeX equations

### 12. Voice I/O (Speech-to-Text + Text-to-Speech)
**Priority: 🟡 Medium - High Impact**

```typescript
// pwa/src/hooks/useVoiceAI.ts

interface VoiceAIConfig {
  sttEngine: 'web-speech' | 'whisper' | 'deepgram';
  ttsEngine: 'web-speech' | 'openai-tts' | 'elevenlabs';
  language: string;
  voiceId?: string; // For TTS
  sttInterimResults: boolean;
}

class VoiceAIController {
  // Speech-to-Text
  async startListening(): Promise<void>;
  stopListening(): void;
  onTranscript(callback: (text: string, interim: boolean) => void): void;

  // Text-to-Speech
  speak(text: string, options?: TTSOptions): Promise<void>;
  stopSpeaking(): void;
  setVoice(voiceId: string): void;

  // State
  isListening: boolean;
  isSpeaking: boolean;
  transcript: string;
}
```

**UI Controls**:
```
┌─────────────────────────────────────────┐
│  [🎤] Listening...                      │
│  "Explain quantum entanglement..."      │
│                                         │
│  [⏸️ Pause]  [🛑 Stop]                │
└─────────────────────────────────────────┘

AI Response:
┌─────────────────────────────────────────┐
│  "Quantum entanglement is a phenomenon..."│
│                                         │
│  [🔊 Play]  [⏸️ Pause]  [🛑 Stop]     │
│  [Speed: 1x ▾]  [Voice: Sarah ▾]      │
└─────────────────────────────────────────┘
```

### 13. Chat Persistence & Export
**Priority: 🟡 Medium**

Comprehensive conversation management:

```typescript
interface ChatExport {
  version: '1.0';
  exportedAt: ISO8601;
  conversation: {
    id: string;
    title: string;
    createdAt: ISO8601;
    provider: string;
    model: string;
    messages: ExportedMessage[];
  };
  context?: {
    personaSnapshot?: PersonaProfile;
    relatedACUs?: string[];
  };
}

class ChatPersistenceService {
  async exportConversation(id: string, format: 'json' | 'markdown' | 'pdf'): Promise<Blob> {
    // json: Full data with metadata
    // markdown: Readable conversation log
    // pdf: Print-ready formatted
  }

  async importConversation(data: ChatExport): Promise<string> {
    // Returns new conversation ID
    // Validates structure
    // Optional: Map to persona if ACUs referenced
  }

  async archiveConversation(id: string): Promise<void> {
    // Move to archived state
    // Keep for history, exclude from feed
  }
}
```

**Export Formats**:
```
📄 conversation.json (Full data)
📄 conversation.md (Readable log)
📄 conversation.pdf (Print-ready)
📄 conversation.txt (Plain text)
```

### 14. Tool Calling Infrastructure
**Priority: 🟡 Medium**

Implement function calling for AI providers:

```typescript
// server/src/ai/tools/base.js

abstract class AITool {
  name: string;
  description: string;
  parameters: ToolParameter[];
  
  async execute(args: Record<string, any>): Promise<ToolResult>;
  validate(args: Record<string, any>): boolean;
}

// Example tools
class WebSearchTool extends AITool {
  name = 'web_search';
  description = 'Search the web for current information';
  
  async execute({ query, numResults = 5 }) {
    // Call search API
    return { results: [...], cited: true };
  }
}

class CalculatorTool extends AITool {
  name = 'calculate';
  description = 'Perform mathematical calculations';
  
  async execute({ expression }) {
    // Safe math evaluation
    return { result: eval(expression), steps: [...] };
  }
}

class ACULookupTool extends AITool {
  name = 'acu_lookup';
  description = 'Find relevant ACUs from user library';
  
  async execute({ topic, limit = 10 }) {
    // Query ACU database
    return { acus: [...], relevanceScores: [...] };
  }
}

// Tool registry
const toolRegistry = {
  web_search: new WebSearchTool(),
  calculate: new CalculatorTool(),
  acu_lookup: new ACULookupTool(),
  // ...
};
```

### 15. Conversation Search & Discovery
**Priority: 🟡 Medium**

Full-text search across conversations:

```typescript
interface ConversationSearch {
  query: string;
  filters?: {
    dateRange?: { start: ISO8601; end: ISO8601 };
    providers?: string[];
    models?: string[];
    topics?: string[];
  };
  sort?: 'relevance' | 'date' | 'activity';
  highlight?: boolean;
}

class ConversationSearchService {
  async search(search: ConversationSearch): Promise<SearchResult[]> {
    // Full-text search in:
    // - Message content
    // - Titles
    // - ACU references
    // - Persona context
    
    return results.map(r => ({
      conversationId: r.id,
      title: r.title,
      snippet: r.highlightedContent,
      relevanceScore: r.score,
      matchedIn: r.matchedFields, // ['content', 'title']
      topicTags: r.topics,
    }));
  }
}
```

---

## Tier 4: Backend Optimizations (16-20)

### 16. Streaming Performance Optimization
**Priority: 🟢 Low-Medium**

```typescript
// server/src/ai/optimized-stream.js

class OptimizedStreamHandler {
  // Chunk buffering for smoother UI
  readonly MIN_CHUNK_DELAY = 20; // ms between chunks
  readonly MAX_BUFFER_SIZE = 1024; // bytes
  
  // Priority chunk handling
  // Send important content first (code, headers)
  // Delay less important content (filler, transitions)
  
  // Compression for large responses
  readonly USE_COMPRESSION_THRESHOLD = 5000; // bytes
}

interface StreamMetrics {
  bytesSent: number;
  chunksDelivered: number;
  avgChunkDelay: number;
  totalLatency: number;
  userPerceivedSpeed: number; // weighted score
}
```

### 17. Message Deduplication & Idempotency
**Priority: 🟢 Low-Medium**

```typescript
// Prevent duplicate messages from streaming glitches
class MessageIdempotencyService {
  private seenIds = new Set<string>();
  private readonly WINDOW_MS = 60000;

  async processMessage(message: AIResponse): Promise<AIResponse> {
    const id = this.generateMessageId(message);
    
    if (this.seenIds.has(id)) {
      // Skip duplicate
      return null;
    }
    
    this.seenIds.add(id);
    this.cleanupOldIds(this.WINDOW_MS);
    return message;
  }
}
```

### 18. Conversation Analytics Dashboard
**Priority: 🟢 Low**

```typescript
interface AIAnalytics {
  userId: string;
  period: 'day' | 'week' | 'month';
  
  metrics: {
    totalConversations: number;
    totalMessages: number;
    totalTokens: {
      prompt: number;
      completion: number;
    };
    providerUsage: Record<string, number>; // count per provider
    avgResponseTime: number;
    costBreakdown: Record<string, number>; // cost per provider
    topTopics: { topic: string; count: number }[];
  };
}
```

### 19. Conversation Forking Improvements
**Priority: 🟢 Low**

Better fork UX with visual diff:

```
┌─────────────────────────────────────────────────────────┐
│  🔀 Fork Conversation                                    │
├─────────────────────────────────────────────────────────┤
│  Source: "Physics Discussion - Relativity"              │
│                                                         │
│  Fork Options:                                          │
│  ┌─────────────────────────────────────────────────┐  │
│  │ ⭕ Full Fork                                       │  │
│  │    All messages + context                         │  │
│  └─────────────────────────────────────────────────┘  │
│  ┌─────────────────────────────────────────────────┐  │
│  │ ⭕ Selective Fork                                 │  │
│  │    [Select messages to include ▾]                │  │
│  │    [x] Include persona context                   │  │
│  │    [ ] Include ACU references                    │  │
│  └─────────────────────────────────────────────────┘  │
│  ┌─────────────────────────────────────────────────┐  │
│  │ ⭕ Branch from Point                              │  │
│  │    Continue from message #15                      │  │
│  │    New context: [Fork + New Topic ▾]            │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
│  [Cancel]  [Create Fork]                                │
└─────────────────────────────────────────────────────────┘
```

### 20. Offline Support & Queueing
**Priority: 🟢 Low**

```typescript
// pwa/src/lib/ai-queue.ts

interface QueuedAIRequest {
  id: string;
  messages: AIMessage[];
  options: AICompletionOptions;
  createdAt: number;
  priority: 'low' | 'normal' | 'high';
}

class AIRequestQueue {
  private queue: QueuedAIRequest[] = [];
  private readonly MAX_QUEUE_SIZE = 50;
  private readonly OFFLINE_STORAGE = 'ai-request-queue';

  async queueRequest(request: QueuedAIRequest): Promise<void> {
    if (navigator.onLine) {
      // Process immediately
      await this.processRequest(request);
    } else {
      // Queue for later
      this.queue.push(request);
      await this.persistQueue();
      this.showOfflineIndicator();
    }
  }

  async processQueue(): Promise<void> {
    // Process queued requests when online
    // Handle failures with retry
    // Notify user of completion
  }
}
```

---

## Implementation Priority Matrix

| # | Enhancement | Impact | Effort | Complexity | Priority |
|---|-------------|--------|--------|------------|----------|
| 1 | Main Feed AI Panel | 🔴 High | 🟡 Medium | 🟡 Medium | **Now** |
| 2 | Enhanced OmniComposer | 🔴 High | 🟢 Low | 🟢 Low | **Now** |
| 3 | Conversation Remuxing | 🔴 High | 🔴 High | 🔴 High | **Soon** |
| 4 | Streaming Stability | 🔴 High | 🟡 Medium | 🟡 Medium | **Now** |
| 5 | Data Structures | 🔴 High | 🟢 Low | 🟢 Low | **Foundation** |
| 6 | Auto-Model Engine | 🟠 High | 🔴 High | 🔴 High | **Core** |
| 7 | Context Analyzer | 🟠 High | 🔴 High | 🟡 Medium | **Core** |
| 8 | Persona ACU Aggregator | 🟠 High | 🔴 High | 🔴 High | **Innovation** |
| 9 | Dynamic System Prompt | 🟠 High | 🟡 Medium | 🔴 High | **Innovation** |
| 10 | Model Suggestion UI | 🟡 Medium | 🟢 Low | 🟢 Low | **After 6-9** |
| 11 | Rich Text Rendering | 🟡 Medium | 🟡 Medium | 🟡 Medium | **Soon** |
| 12 | Voice I/O | 🟡 Medium | 🔴 High | 🔴 High | **Later** |
| 13 | Chat Persistence | 🟡 Medium | 🟡 Medium | 🟡 Medium | **Soon** |
| 14 | Tool Calling | 🟡 Medium | 🔴 High | 🔴 High | **Later** |
| 15 | Search & Discovery | 🟡 Medium | 🟡 Medium | 🟡 Medium | **Later** |
| 16-20 | Backend Optimizations | 🟢 Low | 🟢 Low | 🟢 Low | **Ongoing** |

---

## Quick Wins (Can Implement This Sprint)

1. **Streaming stability fixes** - Immediate UX impact
2. **Data structure standardization** - Enables all other features
3. **Enhanced OmniComposer UI** - Visual triggers, inline help
4. **Export to Markdown** - Low effort, high value
5. **Connection indicator** - Shows reconnection state

## Core Architecture Work

1. **Auto-Model Selector** - Decision engine
2. **Persona ACU Aggregator** - User understanding layer
3. **Dynamic System Prompt** - Context injection

## Long-Term Vision

The combination of:
- **Auto-Model** + **Persona ACU** + **Dynamic Prompts**

Creates a truly intelligent AI assistant that:
- Knows your expertise level
- Adapts communication style
- Selects optimal models automatically
- Evolves with your conversations

---

**Generated**: February 11, 2026
**Focus**: UX High-Impact | PWA + Backend | Novel AI Features
