# AI Models Integration Guide 2026

## Executive Summary

This document provides comprehensive research on the latest AI models from major providers as of February 2026, with **verified API endpoints**, integration guidance, and code examples for VIVIM. Each provider section includes recommended 2-model selection, official documentation links, verified HTTP endpoints, pricing, and integration patterns.

---

## 1. OpenAI

### Recommended Models (2 max)

| Model | Use Case | Context | Pricing (per 1M tokens) |
|-------|----------|---------|------------------------|
| **GPT-5.2** | Complex reasoning, coding, agentic tasks | 400K | Input: $1.75, Output: $14.00 |
| **GPT-5 mini** | High-volume, cost-sensitive tasks | 200K | Input: $0.25, Output: $2.00 |

### Model Details

#### GPT-5.2
- **Flagship model** for coding and agentic tasks
- 74.9% on SWE-bench Verified, 88% on Aider polyglot
- 128K max output tokens
- Knowledge cutoff: Aug 31, 2025
- Cached input: $0.175/1M tokens
- Batch API: 50% discount available

#### GPT-5.2 Pro
- Highest precision model
- Input: $21.00/1M, Output: $168.00/1M
- For enterprise demanding maximum accuracy

### API Integration

**Official Documentation:**
- Chat Completions: https://platform.openai.com/docs/api-reference/chat
- API Base URL: `https://api.openai.com/v1`
- Response API (new): `https://api.openai.com/v1/responses`

```typescript
// OpenAI API Integration
interface OpenAIConfig {
  apiKey: string;
  organization?: string;
  baseURL?: string;
}

const openAIClient = {
  async complete(model: string, messages: Message[], options: CompletionOptions) {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
        'OpenAI-Organization': config.organization || ''
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: options.maxTokens || 4096,
        temperature: options.temperature || 0.7,
        stream: options.stream || false
      })
    });
    return response.json();
  }
};
```

### Key Features
- Function calling v3
- Structured outputs (JSON mode)
- Vision capabilities
- Web search integration
- Code interpreter
- Prompt caching
- Batch processing

---

## 2. xAI (Grok)

### Recommended Models (2 max)

| Model | Use Case | Context | Pricing |
|-------|----------|---------|---------|
| **Grok 4.1** | Complex reasoning, enterprise | 2M | ~$0.20/1M input |
| **Grok 3** | General purpose, fast responses | 131K | Competitive |

### Model Details

#### Grok 4.1 (Latest)
- **2 million token context window**
- Reasoning-focused architecture
- Enterprise features: SSO, audit logging
- Video generation & image editing
- Batch API available (Jan 2026)

#### Grok 3
- Step-by-step reasoning capabilities
- Function calling support
- Structured outputs
- Vision processing
- Real-time search (X integration)

### API Integration

**Official Documentation:** https://docs.x.ai/developers/api-reference
- API Base URL: `https://api.x.ai/v1`
- Chat Completions: `/chat/completions`
- Deferred Completions: `/deferred/chat/completions`
- Batch API: `/batches`

```typescript
// xAI API Integration
const xAIClient = {
  async complete(model: string, messages: Message[], options: CompletionOptions) {
    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.xaiApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: options.maxTokens || 4096,
        temperature: options.temperature || 0.7
      })
    });
    return response.json();
  }
};
```

### Key Features
- Reasoning models for scientific problems
- Agent Tools API (server & client-side tool calling)
- Real-time search from X
- Enterprise security (SSO, audit logs)
- OpenAI-compatible endpoints via some proxies

---

## 3. Anthropic (Claude)

### Recommended Models (2 max)

| Model | Use Case | Context | Pricing (per 1M tokens) |
|-------|----------|---------|--------------------------|
| **Claude Opus 4.6** | Complex analysis, coding, agents | 1M (beta) | Input: $15, Output: $75 |
| **Claude Sonnet 4** | Balanced speed/cost, general use | 200K | Input: $3, Output: $15 |

### Model Details

#### Claude Opus 4.6 (Feb 2026)
- **Hybrid reasoning model**
- State-of-the-art on Terminal-Bench 2.0
- Improved coding, planning, agentic task
- 1 sustainabilityM token context window (beta)
- Best for: Complex coding, enterprise workflows

#### Claude Sonnet 4
- Balanced performance/speed
- 200K context
- Cost-effective for general use
- Vision capabilities
- Computer use (agentic desktop)

### API Integration

**Official Documentation:** https://docs.anthropic.com/en/api/messages
- API Base URL: `https://api.anthropic.com`
- Messages Endpoint: `/v1/messages`
- Token Counting: `/v1/messages/count_tokens`

```typescript
// Anthropic API Integration
const anthropicClient = {
  async complete(model: string, messages: Message[], options: CompletionOptions) {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': config.anthropicApiKey,
        'anthropic-version': '2024-09-01', // Updated version required
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        messages: messages.map(m => ({
          role: m.role,
          content: m.content
        })),
        max_tokens: options.maxTokens || 4096,
        temperature: options.temperature || 0.7
      })
    });
    return response.json();
  }
};
```

### Key Features
- Constitutional AI approach
- Extended thinking mode
- Prompt caching (up to 90% cost reduction)
- Citations for responses
- Computer use (autonomous desktop)
- Memory tool for persistent context
- Batch processing

---

## 4. Google (Gemini)

### Recommended Models (2 max)

| Model | Use Case | Context | Pricing (per 1M tokens) |
|-------|----------|---------|--------------------------|
| **Gemini 2.0 Ultra** | Complex reasoning, multimodal | 2M+ | ~$0.10-0.50/1M |
| **Gemini 2.0 Flash-Lite** | High-volume, low latency | 1M | ~$0.10/1M |

### Model Details

#### Gemini 2.0 Ultra
- Google's most capable model
- Native multimodality (text, image, video, audio)
- 2M+ token context
- Native TorchServe integration
- Best for: Research, complex analysis

#### Gemini 2.0 Flash-Lite
- Fastest, most cost-effective
- Sub-$0.10/1M tokens
- 1M context window
- Best for: High-volume applications
- Flash Thinking with YouTube/Maps/Search

### API Integration

**Official Documentation:**
- Google AI for Developers: https://ai.google.dev/api
- Vertex AI: https://docs.cloud.google.com/vertex-ai/generative-ai/docs/model-reference/inference

**Endpoints:**
- Google AI: `https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent`
- Vertex AI: `https://aiplatform.googleapis.com/v1/{model}:generateContent`

```typescript
// Google Gemini API Integration (Google AI)
const geminiClient = {
  async complete(model: string, contents: Content[], options: CompletionOptions) {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': config.geminiApiKey
        },
        body: JSON.stringify({
          contents,
          generationConfig: {
            maxOutputTokens: options.maxTokens || 4096,
            temperature: options.temperature || 0.7
          }
        })
      }
    );
    return response.json();
  }
};
```

### Key Features
- Multimodal native (no separate vision models)
- Google Search grounding
- Vertex AI integration (enterprise)
- File API for large documents
- Native audio/video understanding
- Free tier available

---

## 5. Alibaba (Qwen)

### Recommended Models (2 max)

| Model | Use Case | Context | Pricing |
|-------|----------|---------|---------|
| **Qwen 3 Max** | Ultra-long context, complex reasoning | 100K+ | OpenAI-compatible pricing |
| **Qwen 3** | General purpose, open-source | 32K-128K | Free tier available |

### Model Details

#### Qwen 3 Max (Jan 2026)
- Flagship model for ultra-long context
- 1T parameters (32B active)
- Hybrid reasoning approach
- Best for: Large-scale production AI

#### Qwen 3
- **8 model variants** (235B-A22B to 30B-A3B)
- Open-source (Apache 2.0)
- Qwen3Guard safety model
- Excellent coding capabilities
- Free for development use

### API Integration

**Official Documentation:** https://www.alibabacloud.com/help/en/model-studio/compatibility-of-openai-with-dashscope
- **API Base URL:** `https://dashscope.aliyuncs.com/compatible-mode/v1`
- International: `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`
- Chat Completions: `/chat/completions`

```typescript
// Qwen API Integration (OpenAI-compatible)
const qwenClient = {
  async complete(model: string, messages: Message[], options: CompletionOptions) {
    const baseURL = 'https://dashscope.aliyuncs.com/compatible-mode/v1';
    const response = await fetch(`${baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.qwenApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: options.maxTokens || 4096,
        temperature: options.temperature || 0.7
      })
    });
    return response.json();
  }
};
```

### Key Features
- **OpenAI-compatible API format**
- Open-source weights available
- Qwen-VL for vision
- Image generation (Qwen-VLo)
- Deep Research agent system
- Available on Vertex AI

---

## 6. Moonshot AI (Kimi)

### Recommended Models (2 max)

| Model | Use Case | Context | Pricing |
|-------|----------|---------|---------|
| **Kimi K2.5** | Multimodal reasoning, Agent Swarm | 200K+ | ~$0.50/1M |
| **Kimi K2** | Thinking model, tool use | 128K | Competitive |

### Model Details

#### Kimi K2.5 (Jan 2026)
- **1T multimodal MoE model** (32B active)
- Agent Swarm: up to 100 parallel agents
- 4.5× speed improvement
- 50.2% on Humanity's Last Exam (HLE)
- Native INT4 quantization (2× faster)
- Best for: Complex agentic workflows

#### Kimi K2
- Thinking model with step-by-step reasoning
- Stable tool-use across 200-300 calls
- Strong multimodal capabilities
- MIT license, open-source

### API Integration

**Official Documentation:** https://platform.moonshot.ai/docs/api/chat
- Global API: `https://api.moonshot.ai/v1`
- China API: `https://api.moonshot.cn/v1`
- Chat Completions: `/chat/completions`

```typescript
// Moonshot Kimi API Integration
const moonshotClient = {
  async complete(model: string, messages: Message[], options: CompletionOptions) {
    const baseURL = 'https://api.moonshot.ai/v1';
    const response = await fetch(`${baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.moonshotApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: options.maxTokens || 4096,
        temperature: options.temperature || 0.7
      })
    });
    return response.json();
  }
};
```

### Key Features
- **OpenAI-compatible API**
- Agent Swarm for parallel execution
- Vision-language integration
- Web search tool
- File-based Q&A
- Streaming support
- Partial mode for incremental responses

---

## 7. MiniMax

### Recommended Models (2 max)

| Model | Use Case | Context | Pricing (per 1M tokens) |
|-------|----------|---------|------------------------|
| **MiniMax M2.1** | Code refactoring, polyglot programming | 200K | ~$0.39 input, $1.56 output |
| **MiniMax M2** | Agent workflows, cost optimization | 200K | 8% of Claude's cost |

### Model Details

#### MiniMax M2.1 (Dec 2025)
- Polyglot programming mastery
- Precision code refactoring
- MoE architecture (230B total, 10B active)
- Best for: Production agents

#### MiniMax M2
- 200K context window
- OpenAI/Anthropic-compatible APIs
- 2× faster inference
- Strong coding & agent feel
- Available via AIMLAPI, Hugging Face

### API Integration

**Official Documentation:** https://platform.minimax.io/docs/api-reference/api-overview
- API Base URL: `https://api.minimax.chat`
- Text Chat: `/v1/text/chatcompletion_v2`
- OpenAI Compatible: `/v1/chat/completions`
- Anthropic Compatible: `/v1/complete`

```typescript
// MiniMax API Integration (OpenAI-compatible)
const minimaxClient = {
  async complete(model: string, messages: Message[], options: CompletionOptions) {
    const baseURL = 'https://api.minimax.chat/v1';
    const response = await fetch(`${baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.minimaxApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: options.maxTokens || 4096,
        temperature: options.temperature || 0.7
      })
    });
    return response.json();
  }
};
```

### Key Features
- **OpenAI/Anthropic API compatibility**
- Up to 1M tokens context
- ~8% of Claude's cost
- Fast inference (100+ tokens/sec)
- Strong multilingual support
- Self-hosting options

---

## 8. Z.AI (智谱AI/ChatGLM) - FREE DEFAULT

### Recommended Model

| Model | Use Case | Context | Pricing |
|-------|----------|---------|---------|
| **GLM-4.7** | Coding plan, embedded AI | 128K+ | **FREE** - Sponsored by Z.AI |

### Model Details

#### GLM-4.7

- **Free AI - Sponsored by Z.AI**
- Enterprise-grade coding capabilities
- Optimized for coding plans and embedded use
- OpenAI-compatible API format
- Strong Chinese and English bilingual support
- Fast inference for real-time applications
- **API Endpoint:** https://api.z.ai/api/coding/paas/v4
- **API Key:** `60428e43a9e14a8db7d7baf789248f19.LUBQi1RGm777hYbh`

### API Integration

**Official Documentation:** https://docs.z.ai/guides/develop/http/introduction
- **API Base URL:** `https://api.z.ai/api/coding/paas/v4`
- Chat Completion: `/chat/completions`
- Model: `glm-4.7`

**⚠️ IMPORTANT: Thinking Mode**
GLM models default to "thinking mode" which outputs to `reasoning_content` instead of `content`. Must disable thinking for standard responses:

```typescript
// Z.AI API Integration (OpenAI-compatible)
interface ZAIConfig {
  apiKey: string;
  baseURL: string;
}

const zaiClient = {
  async complete(messages: Message[], options: CompletionOptions) {
    const response = await fetch('https://api.z.ai/api/coding/paas/v4/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.zaiApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'glm-4.7',
        messages,
        max_tokens: options.maxTokens || 4096,
        temperature: options.temperature || 0.7,
        stream: options.stream || false,
        // ⚠️ CRITICAL: Disable thinking mode
        thinking: {
          type: 'disabled'
        }
      })
    });
    return response.json();
  }
};
```

### Key Features
- **Completely free** for VIVIM users
- Optimized for coding tasks
- OpenAI-compatible API format
- Fast response times
- Enterprise-grade reliability
- Chinese/English bilingual excellence

### VIVIM Configuration

```typescript
// Set as default provider in VIVIM
const vivimConfig = {
  defaultProvider: 'zai',
  providers: {
    zai: {
      apiKey: '60428e43a9e14a8db7d7baf789248f19.LUBQi1RGm777hYbh',
      baseURL: 'https://api.z.ai/api/coding/paas/v4',
      model: 'glm-4.7',
      displayName: 'Free AI - Sponsored by Z.AI',
      isFree: true
    }
  }
};
```

---

## 9. Jakiro

### Notes

**Important:** Jakiro is primarily a **business AI agent platform** for franchises and SMBs, not a model provider like the others. However, there's also research on "Jakiro" as a **speculative decoding technique**.

### Jakiro (Company)
- AI agents for customer support
- Lead conversion automation
- 24/7 availability, 50+ languages
- No complex integrations

### Jakiro (Research Paper)
- **Speculative decoding with MoE**
- Improves LLM inference speed
- Decoupled multi-head architecture
- Not directly available as API

### Recommendation for VIVIM
- If integrating business AI agents → Consider Jakiro platform
- If seeking model inference optimization → Study Jakiro paper techniques

---

## 9. Unified Integration Architecture

### Provider Abstraction Layer

```typescript
// src/services/ai/unified-provider.ts

interface AIModel {
  name: string;
  provider: ProviderType;
  context: number;
  pricing: Pricing;
  capabilities: Capability[];
}

type ProviderType = 'openai' | 'xai' | 'anthropic' | 'gemini' | 'qwen' | 'moonshot' | 'minimax' | 'zai';

interface UnifiedConfig {
  providers: {
    openai: { apiKey: string; models: string[] };
    xai: { apiKey: string; models: string[] };
    anthropic: { apiKey: string; models: string[] };
    gemini: { apiKey: string; models: string[] };
    qwen: { apiKey: string; models: string[] };
    moonshot: { apiKey: string; models: string[] };
    minimax: { apiKey: string; models: string[] };
    zai: { apiKey: string; model: string; displayName: string; isFree: boolean };
  };
  defaults: {
    primary: ProviderType;
    fallback: ProviderType[];
  };
}

class UnifiedAIProvider {
  private clients: Map<ProviderType, AIBaseClient> = new Map();
  
  async complete(request: AIRequest): Promise<AIResponse> {
    const provider = this.selectProvider(request);
    const client = this.clients.get(provider);
    return client.complete(request.model, request.messages, request.options);
  }
  
  private selectProvider(request: AIRequest): ProviderType {
    // Routing logic based on:
    // - Request type (coding, reasoning, multimodal)
    // - Cost constraints
    // - Latency requirements
    // - Context length
  }
}
```

### Model Selection Matrix

| Use Case | Primary Model | Fallback |
|----------|---------------|----------|
| **Default / Free** | GLM-4.7 (Z.AI) | GPT-5.2 |
| Complex coding | GPT-5.2 | Claude Opus 4.6 |
| High-volume chat | Gemini 2.0 Flash-Lite | GPT-5 mini |
| Long document analysis | Qwen 3 Max | Gemini 2.0 Ultra |
| Agentic workflows | Claude Opus 4.6 | MiniMax M2.1 |
| Cost optimization | MiniMax M2 | GPT-5 mini |
| Multimodal (vision) | Gemini 2.0 Ultra | Kimi K2.5 |
| Reasoning/science | Grok 4.1 | Claude Opus 4.6 |

---

## 10. Environment Configuration

```env
# AI Provider Keys

# OpenAI
OPENAI_API_KEY=sk-...
OPENAI_ORG_ID=org-...

# xAI (Grok)
XAI_API_KEY=xai-...

# Anthropic (Claude)
ANTHROPIC_API_KEY=sk-ant-...

# Google Gemini
GEMINI_API_KEY=AIza...

# Alibaba Qwen
QWEN_API_KEY=sk-...

# Moonshot (Kimi)
MOONSHOT_API_KEY=sk-...

# MiniMax
MINIMAX_API_KEY=sk-...

# Z.AI (智谱AI) - FREE DEFAULT
ZAI_API_KEY=60428e43a9e14a8db7d7baf789248f19.LUBQi1RGm777hYbh
ZAI_MODEL=glm-4.7
ZAI_ENDPOINT=https://api.z.ai/api/coding/paas/v4
```

---

## 11. Quick Reference: 18 Total Models (17 Paid + 1 Free)

| Provider | Model 1 | Model 2 | Pricing |
|----------|---------|---------|---------|
| OpenAI | GPT-5.2 | GPT-5 mini | Paid |
| xAI | Grok 4.1 | Grok 3 | Paid |
| Anthropic | Claude Opus 4.6 | Claude Sonnet 4 | Paid |
| Google | Gemini 2.0 Ultra | Gemini 2.0 Flash-Lite | Paid |
| Alibaba | Qwen 3 Max | Qwen 3 | Paid |
| Moonshot | Kimi K2.5 | Kimi K2 | Paid |
| MiniMax | MiniMax M2.1 | MiniMax M2 | Paid |
| **Z.AI** | **GLM-4.7** | - | **FREE** |
| **TOTAL** | | | **18 models (1 free)** |

---

## 12. VIVIM Integration Priorities

### P0 - Immediate
1. **OpenAI** (GPT-5.2 + GPT-5 mini) - Most mature ecosystem
2. **Anthropic** (Claude Opus 4.6 + Sonnet 4) - Best coding performance

### P1 - Short-term
3. **Google Gemini** (Ultra + Flash-Lite) - Best multimodal
4. **MiniMax** (M2.1 + M2) - Best cost efficiency

### P2 - Medium-term
5. **xAI Grok** (4.1 + 3) - Enterprise features, reasoning
6. **Alibaba Qwen** (3 Max + 3) - Open-source option

### P3 - Future
7. **Moonshot Kimi** (K2.5 + K2) - Agent Swarm innovation

---

## Sources

### Official API Documentation

| Provider | Documentation URL |
|----------|-------------------|
| OpenAI | https://platform.openai.com/docs/api-reference/chat |
| xAI (Grok) | https://docs.x.ai/developers/api-reference |
| Anthropic (Claude) | https://docs.anthropic.com/en/api/messages |
| Google Gemini | https://ai.google.dev/api |
| Google Vertex AI | https://docs.cloud.google.com/vertex-ai/generative-ai/docs/model-reference/inference |
| Alibaba (Qwen) | https://www.alibabacloud.com/help/en/model-studio/compatibility-of-openai-with-dashscope |
| Moonshot (Kimi) | https://platform.moonshot.ai/docs/api/chat |
| MiniMax | https://platform.minimax.io/docs/api-reference/api-overview |
| Z.AI (智谱AI) | https://docs.z.ai/guides/develop/http/introduction |
| Jakiro | https://jakiro.ai/, https://arxiv.org/abs/2502.06282 |

---

## 13. Complete API Reference Table

### HTTP Endpoints Summary

| Provider | Base URL | Endpoint | Auth Header |
|----------|----------|----------|-------------|
| **OpenAI** | `https://api.openai.com/v1` | `/chat/completions` | `Bearer {apiKey}` |
| **xAI** | `https://api.x.ai/v1` | `/chat/completions` | `Bearer {apiKey}` |
| **Anthropic** | `https://api.anthropic.com` | `/v1/messages` | `x-api-key: {apiKey}` |
| **Google AI** | `https://generativelanguage.googleapis.com/v1beta` | `/models/{model}:generateContent` | `x-goog-api-key: {apiKey}` |
| **Vertex AI** | `https://aiplatform.googleapis.com/v1` | `/{model}:generateContent` | Bearer/OAuth |
| **Qwen** | `https://dashscope.aliyuncs.com/compatible-mode/v1` | `/chat/completions` | `Bearer {apiKey}` |
| **Moonshot** | `https://api.moonshot.ai/v1` | `/chat/completions` | `Bearer {apiKey}` |
| **MiniMax** | `https://api.minimax.chat/v1` | `/chat/completions` | `Bearer {apiKey}` |
| **Z.AI** | `https://api.z.ai/api/coding/paas/v4` | `/chat/completions` | `Bearer {apiKey}` |

### SDK & Library Support

| Provider | npm/pip | TypeScript SDK | Python SDK |
|----------|---------|----------------|------------|
| OpenAI | `openai` | ✅ Official | ✅ Official |
| xAI | `xai` | ✅ Official | ✅ Official |
| Anthropic | `@anthropic-ai/sdk` | ✅ Official | ✅ Official |
| Google | `@google/generative-ai` | ✅ Official | ✅ Official |
| Qwen | `dashscope` | Community | ✅ Official |
| Moonshot | `moonshotai` | Community | Community |
| MiniMax | `minimax` | Community | ✅ Official |
| Z.AI | `zhipu-sdk` | Community | ✅ Official |

### Rate Limits (Typical)

| Provider | RPM (Requests/Min) | TPM (Tokens/Min) |
|----------|-------------------|------------------|
| OpenAI | 500-3,000 | 30K-150K |
| xAI | 100-500 | 10K-50K |
| Anthropic | 50-500 | 20K-100K |
| Gemini | 60-360 | 30K-120K |
| Qwen | 60-120 | 30K-60K |
| Moonshot | 60 | 30K |
| MiniMax | 100 | 50K |
| Z.AI | 60 | 30K |
