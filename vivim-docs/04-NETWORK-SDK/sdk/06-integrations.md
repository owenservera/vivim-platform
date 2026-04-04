# VIVIM AI Provider Integrations

## Overview

VIVIM is provider-agnostic, supporting multiple AI providers through a unified abstraction layer. This enables users to leverage their preferred AI while benefiting from VIVIM's memory and context capabilities.

---

## Supported Providers

| Provider | Status | Models | Documentation |
|----------|--------|--------|---------------|
| **OpenAI** | Live | GPT-4, GPT-4 Turbo, GPT-3.5 | ✅ |
| **Anthropic** | Live | Claude 3.5, Claude 3, Claude 2 | ✅ |
| **Google Gemini** | Live | Gemini Pro, Gemini Ultra | ✅ |
| **DeepSeek** | Live | DeepSeek Chat | ✅ |
| **xAI Grok** | Live | Grok Beta | ✅ |
| **Mistral** | Live | Mistral Large, Mistral Medium | ✅ |
| **Cohere** | Beta | Command R+ | ✅ |
| **Meta Llama** | Beta | Llama 3, Llama 2 | ✅ |
| **Local Models** | Beta | Ollama, LM Studio | ✅ |

---

## Provider Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     VIVIM AI Layer                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │              Unified AI Interface                    │  │
│  │         (server/src/services/ai-service.js)        │  │
│  └─────────────────────────────────────────────────────┘  │
│                           │                                │
│         ┌─────────────────┼─────────────────┐             │
│         │                 │                 │             │
│         ▼                 ▼                 ▼             │
│  ┌───────────┐    ┌───────────┐    ┌───────────┐        │
│  │  OpenAI   │    │ Anthropic │    │  Gemini   │        │
│  │  Adapter  │    │  Adapter  │    │  Adapter  │        │
│  └───────────┘    └───────────┘    └───────────┘        │
│                           │                                │
│                           ▼                                │
│                    ┌─────────────┐                         │
│                    │ AI Provider │                         │
│                    │   (REST)    │                         │
│                    └─────────────┘                         │
└─────────────────────────────────────────────────────────────┘
```

---

## Integration Pattern

### Provider Adapter Interface

```typescript
interface AIProviderAdapter {
  // Provider identification
  name: string;
  version: string;
  
  // Model listing
  listModels(): Promise<Model[]>;
  
  // Chat completion
  chatCompletion(params: ChatCompletionParams): Promise<ChatCompletionResponse>;
  
  // Streaming chat completion
  streamChatCompletion(params: ChatCompletionParams): AsyncIterable<Chunk>;
  
  // Embeddings
  createEmbeddings(input: string | string[]): Promise<number[][]>;
  
  // Token counting
  countTokens(text: string): Promise<number>;
}

interface ChatCompletionParams {
  model: string;
  messages: Message[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
  tools?: Tool[];
}
```

---

## Provider Configuration

### Environment Variables

```bash
# OpenAI
OPENAI_API_KEY=sk-...

# Anthropic
ANTHROPIC_API_KEY=sk-ant-...

# Google Gemini
GEMINI_API_KEY=AI...

# DeepSeek
DEEPSEEK_API_KEY=sk-...

# xAI Grok
XAI_API_KEY=xai-...

# Mistral
MISTRAL_API_KEY=...
```

### Provider Settings UI

**Location**: `/settings/providers`

**Features**:
- Add/remove API keys
- Set default provider
- Configure per-conversation provider
- View usage statistics
- Set spending limits

---

## BYOK (Bring Your Own Key)

VIVIM supports BYOK - users bring their own API keys:

```typescript
// User configuration
interface BYOKConfig {
  provider: 'openai' | 'anthropic' | 'gemini';
  apiKey: string;           // Encrypted storage
  defaultModel: string;
  budgetLimit?: number;     // Monthly spending cap
  webhookUrl?: string;      // For usage notifications
}
```

**Flow**:
1. User adds their API key in settings
2. Key encrypted and stored securely
3. VIVIM uses key for AI calls
4. User pays provider directly
5. VIVIM never sees or stores raw key

---

## Unified Interface

### Request Format

```typescript
// All providers use same request format
interface UnifiedRequest {
  provider: string;           // 'openai' | 'anthropic' | 'gemini' | ...
  model: string;             // Model identifier
  messages: UnifiedMessage[];
  context?: ContextBundle;   // VIVIM context from L0-L7
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

interface UnifiedMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}
```

### Response Format

```typescript
interface UnifiedResponse {
  id: string;
  provider: string;
  model: string;
  choices: Choice[];
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  created: number;
}
```

---

## Context Integration

Each AI call includes assembled context:

```typescript
// Context is injected as system message
const messagesWithContext = [
  {
    role: 'system',
    content: assembleContext(userId, conversationId)
  },
  ...userMessages
];

// Context includes:
// - L0: VIVIM Identity
// - L1: User Identity
// - L2: Preferences
// - L3-L7: Topic, Entity, Conversation, JIT, History
```

---

## Streaming Support

All providers support streaming:

```typescript
// Server-side streaming
async function* streamChat(request: UnifiedRequest) {
  const adapter = getProviderAdapter(request.provider);
  
  for await (const chunk of adapter.streamChatCompletion(request)) {
    yield formatChunk(chunk);  // Normalize format
  }
}

// Client receives:
// {"choices":[{"delta":{"content":"Hello"}}]}
// {"choices":[{"delta":{"content":" world"}}]}
// ...
```

---

## Embeddings

### Supported Models

| Provider | Model | Dimensions | Use Case |
|----------|-------|------------|----------|
| OpenAI | text-embedding-3-small | 1536 | General |
| OpenAI | text-embedding-3-large | 3072 | High precision |
| Anthropic | (via API) | - | Via OpenAI compat |
| Gemini | embedding-001 | 768 | General |
| Cohere | embed-multilingual-v3.0 | 1024 | Multi-language |

### Usage

```typescript
// Create embeddings for ACU
const embedding = await embeddings.create({
  provider: 'openai',
  model: 'text-embedding-3-small',
  input: 'React useEffect cleanup pattern'
});

// Result: [0.023, -0.089, 0.034, ...]
```

---

## Error Handling

### Provider Errors

```typescript
// Unified error handling
interface ProviderError {
  code: 'rate_limit' | 'invalid_key' | 'insufficient_quota' | 'provider_down';
  message: string;
  provider: string;
  retryable: boolean;
  retryAfter?: number;  // seconds
}

// Automatic retry with exponential backoff
async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (!error.retryable) throw error;
      await sleep(error.retryAfter * 1000);
    }
  }
}
```

---

## Fallback Strategy

If primary provider fails:

```typescript
// Automatic fallback chain
const fallbackChain = ['openai', 'anthropic', 'gemini'];

async function chatWithFallback(request: UnifiedRequest) {
  for (const provider of fallbackChain) {
    try {
      request.provider = provider;
      return await chat(request);
    } catch (error) {
      if (!error.retryable) throw error;
      continue;
    }
  }
  throw new Error('All providers failed');
}
```

---

## Usage Tracking

```typescript
interface UsageRecord {
  userId: string;
  provider: string;
  model: string;
  tokensUsed: number;
  cost: number;
  timestamp: Date;
}

// Stored in database for analytics
// User can view in /settings/providers
```

---

## Provider Switching Demo

### UI Location

`/settings/providers`

### Features

- Toggle between providers per conversation
- Compare responses across providers
- Set default provider for new chats
- View cost breakdown by provider

---

## Landing Page Demo Ideas

1. **Provider Grid**: Show all 9 providers with logos
2. **Switching Demo**: Toggle provider mid-conversation
3. **Context Comparison**: Show response difference with/without context
4. **BYOK Flow**: Walk through adding your own key
5. **Cost Calculator**: Show potential savings with BYOK
