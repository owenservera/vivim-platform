/**
 * AI Types for VIVIM Integration
 * Aligned with backend AI integration design
 */

/**
 * Supported AI Providers
 */
export type AIProviderType =
  | 'openai'
  | 'xai'
  | 'anthropic'
  | 'gemini'
  | 'qwen'
  | 'moonshot'
  | 'minimax'
  | 'zai'; // FREE DEFAULT

/**
 * AI Message Role
 */
export type AIMessageRole = 'user' | 'assistant' | 'system' | 'tool';

/**
 * AI Message
 */
export interface AIMessage {
  role: AIMessageRole;
  content: string;
}

/**
 * AI Completion Options
 */
export interface AICompletionOptions {
  maxTokens?: number;
  temperature?: number;
  stream?: boolean;
}

/**
 * AI Completion Request
 */
export interface AICompletionRequest {
  messages: AIMessage[];
  provider?: AIProviderType;
  model?: string;
  conversationId?: string;
  options?: AICompletionOptions;
}

/**
 * AI Usage Statistics
 */
export interface AIUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

/**
 * AI Tool Call Result
 */
export interface ToolCallResult {
  name: string;
  args?: Record<string, any>;
  result?: any;
}

/**
 * Agent Step Information
 */
export interface AgentStepInfo {
  type: string;
  toolCalls?: ToolCallResult[];
  text?: string;
  tokens?: number;
}

/**
 * AI Completion Response
 */
export interface AICompletionResponse {
  content: string;
  model: string;
  usage: AIUsage;
  finishReason: string;
  provider: AIProviderType;
  conversationId?: string;
  toolCalls?: ToolCallResult[];
  steps?: AgentStepInfo[];
  metadata?: {
    mode?: string;
    personaId?: string;
    duration?: number;
    toolsUsed?: string[];
  };
}

/**
 * AI Provider Information
 */
export interface AIProviderInfo {
  id: AIProviderType;
  displayName: string;
  isFree: boolean;
  isAvailable: boolean;
  models: string[];
  defaultModel: string;
  description?: string;
  capabilities?: string[];
}

/**
 * AI Provider Configuration (from backend)
 */
export interface AIProviderConfig {
  displayName?: string;
  defaultModel: string;
  models: Array<{
    id: string;
    context: number;
    capabilities: string[];
    pricing: { input: number; output: number };
    recommendedUse?: string;
  }>;
}

/**
 * AI Models Response
 */
export interface AIModelsResponse {
  [provider: string]: AIProviderConfig;
}

/**
 * AI Providers Response
 */
export interface AIProvidersResponse {
  providers: AIProviderInfo[];
  defaultProvider: AIProviderType;
}

/**
 * AI Stream Chunk
 */
export interface AIStreamChunk {
  content: string;
  done: boolean;
}

/**
 * AI Provider Capabilities
 */
export const AIProviderCapabilities = {
  openai: {
    displayName: 'OpenAI',
    isFree: false,
    description: 'GPT-5.2 for complex coding, GPT-5 mini for high-volume',
    capabilities: ['coding', 'reasoning', 'function_calling'],
  },
  xai: {
    displayName: 'xAI (Grok)',
    isFree: false,
    description: 'Grok 4.1 with 2M context window, reasoning-focused',
    capabilities: ['reasoning', 'long_context'],
  },
  anthropic: {
    displayName: 'Anthropic (Claude)',
    isFree: false,
    description: 'Claude Opus 4.6 for enterprise, Sonnet 4 for balance',
    capabilities: ['coding', 'reasoning', 'long_context'],
  },
  gemini: {
    displayName: 'Google Gemini',
    isFree: false,
    description: 'Gemini 2.0 Ultra for multimodal, Flash-Lite for speed',
    capabilities: ['multimodal', 'fast_response'],
  },
  qwen: {
    displayName: 'Alibaba Qwen',
    isFree: false,
    description: 'Qwen 3 Max for ultra-long context, open-source option',
    capabilities: ['coding', 'long_context', 'open_source'],
  },
  moonshot: {
    displayName: 'Moonshot (Kimi)',
    isFree: false,
    description: 'Kimi K2.5 with Agent Swarm for parallel execution',
    capabilities: ['multimodal', 'agent_swarm'],
  },
  minimax: {
    displayName: 'MiniMax',
    isFree: false,
    description: 'M2.1 for polyglot programming, 8% of Claude cost',
    capabilities: ['coding', 'cost_optimized'],
  },
  zai: {
    displayName: 'Z.AI (智谱AI)',
    isFree: true,
    description: 'GLM-4.7 - Completely free, sponsored by Z.AI',
    capabilities: ['coding', 'fast_response'],
  },
} as const;

/**
 * Model recommendations based on use case
 */
export const AIModelRecommendations = {
  default: 'zai' as AIProviderType,
  freeOnly: 'zai' as AIProviderType,
  complexCoding: 'openai' as AIProviderType,
  highVolumeChat: 'openai' as AIProviderType,
  enterpriseWorkflows: 'anthropic' as AIProviderType,
  multimodal: 'gemini' as AIProviderType,
  costOptimized: 'minimax' as AIProviderType,
  longDocuments: 'anthropic' as AIProviderType,
} as const;

/**
 * Provider display names for UI
 */
export const AIProviderDisplayNames: Record<AIProviderType, string> = {
  openai: 'OpenAI',
  xai: 'xAI (Grok)',
  anthropic: 'Anthropic (Claude)',
  gemini: 'Google Gemini',
  qwen: 'Alibaba Qwen',
  moonshot: 'Moonshot (Kimi)',
  minimax: 'MiniMax',
  zai: 'Z.AI (Free)',
};

/**
 * Model info per provider
 */
export const AIProviderModels: Record<AIProviderType, string[]> = {
  openai: ['gpt-5.2', 'gpt-5-mini'],
  xai: ['grok-4.1', 'grok-3'],
  anthropic: ['claude-opus-4.6', 'claude-sonnet-4'],
  gemini: ['gemini-2.0-ultra', 'gemini-2.0-flash-lite'],
  qwen: ['qwen-3-max', 'qwen-3'],
  moonshot: ['kimi-k2.5', 'kimi-k2'],
  minimax: ['minimax-m2.1', 'minimax-m2'],
  zai: ['glm-4.7'],
};

/**
 * Cost per 1M tokens (USD)
 */
export const AIProviderPricing: Record<AIProviderType, { input: number; output: number }> = {
  openai: { input: 1.75, output: 14.00 },
  xai: { input: 0.20, output: 1.00 },
  anthropic: { input: 15.00, output: 75.00 },
  gemini: { input: 0.10, output: 0.50 },
  qwen: { input: 0.10, output: 0.50 },
  moonshot: { input: 0.50, output: 2.50 },
  minimax: { input: 0.39, output: 1.56 },
  zai: { input: 0, output: 0 }, // FREE
};
