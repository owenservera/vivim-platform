// apps/server/src/types/ai.js
// ═══════════════════════════════════════════════════════════════════════════
// AI TYPE DEFINITIONS & PROVIDER REGISTRY
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Supported AI Providers
 */
export const ProviderType = {
  OPENAI: 'openai',
  XAI: 'xai',
  ANTHROPIC: 'anthropic',
  GEMINI: 'gemini',
  QWEN: 'qwen',
  MOONSHOT: 'moonshot',
  MINIMAX: 'minimax',
  ZAI: 'zai',  // FREE DEFAULT
};

/**
 * Provider Configuration
 * NOTE: API keys are loaded from environment variables only — NEVER hardcoded.
 */
export const ProviderConfig = {
  [ProviderType.OPENAI]: {
    displayName: 'OpenAI',
    models: ['gpt-5.2', 'gpt-5-mini'],
    defaultModel: 'gpt-5.2',
    baseURL: 'https://api.openai.com/v1',
    priority: 0,
    isFree: false,
    capabilities: ['coding', 'reasoning', 'function_calling', 'structured_output'],
    description: 'GPT-5.2 for complex coding and agentic tasks',
  },
  [ProviderType.XAI]: {
    displayName: 'xAI (Grok)',
    models: ['grok-4.1', 'grok-3'],
    defaultModel: 'grok-4.1',
    baseURL: 'https://api.x.ai/v1',
    priority: 5,
    isFree: false,
    capabilities: ['reasoning', 'long_context'],
    description: 'Grok 4.1 with 2M context, reasoning-focused',
  },
  [ProviderType.ANTHROPIC]: {
    displayName: 'Anthropic (Claude)',
    models: ['claude-opus-4.6', 'claude-sonnet-4'],
    defaultModel: 'claude-opus-4.6',
    baseURL: 'https://api.anthropic.com',
    priority: 0,
    isFree: false,
    capabilities: ['coding', 'reasoning', 'long_context', 'function_calling', 'structured_output'],
    description: 'Claude Opus 4.6 for enterprise, Sonnet 4 for balance',
  },
  [ProviderType.GEMINI]: {
    displayName: 'Google Gemini',
    models: ['gemini-2.0-ultra', 'gemini-2.0-flash-lite'],
    defaultModel: 'gemini-2.0-ultra',
    baseURL: 'https://generativelanguage.googleapis.com/v1beta',
    priority: 3,
    isFree: false,
    capabilities: ['multimodal', 'fast_response', 'structured_output'],
    description: 'Gemini 2.0 Ultra for multimodal, Flash-Lite for speed',
  },
  [ProviderType.QWEN]: {
    displayName: 'Alibaba Qwen',
    models: ['qwen-3-max', 'qwen-3'],
    defaultModel: 'qwen-3-max',
    baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    priority: 5,
    isFree: false,
    capabilities: ['coding', 'long_context'],
    description: 'Qwen 3 Max for ultra-long context',
  },
  [ProviderType.MOONSHOT]: {
    displayName: 'Moonshot (Kimi)',
    models: ['kimi-k2.5', 'kimi-k2'],
    defaultModel: 'kimi-k2.5',
    baseURL: 'https://api.moonshot.ai/v1',
    priority: 7,
    isFree: false,
    capabilities: ['multimodal', 'agent_swarm'],
    description: 'Kimi K2.5 with Agent Swarm',
  },
  [ProviderType.MINIMAX]: {
    displayName: 'MiniMax',
    models: ['minimax-m2.1', 'minimax-m2'],
    defaultModel: 'minimax-m2.1',
    baseURL: 'https://api.minimax.chat/v1',
    priority: 3,
    isFree: false,
    capabilities: ['coding', 'cost_optimized'],
    description: 'M2.1 polyglot programming, 8% of Claude cost',
  },
  [ProviderType.ZAI]: {
    displayName: 'Z.AI (智谱AI)',
    models: ['glm-4.7-flash'],
    defaultModel: 'glm-4.7-flash',
    baseURL: process.env.ZAI_BASE_URL || 'https://api.z.ai/api/coding/paas/v4',
    priority: -1, // HIGHEST PRIORITY (FREE DEFAULT)
    isFree: true,
    capabilities: ['coding', 'fast_response'],
    description: 'GLM-4.7-Flash — Completely free, sponsored by Z.AI',
  },
};

/**
 * Model Capabilities
 */
export const ModelCapabilities = {
  CODING: 'coding',
  REASONING: 'reasoning',
  MULTIMODAL: 'multimodal',
  LONG_CONTEXT: 'long_context',
  FAST_RESPONSE: 'fast_response',
  COST_OPTIMIZED: 'cost_optimized',
  FUNCTION_CALLING: 'function_calling',
  STRUCTURED_OUTPUT: 'structured_output',
  AGENT: 'agent',
};

/**
 * Provider Models with Capabilities
 */
export const ProviderModels = {
  [ProviderType.OPENAI]: {
    'gpt-5.2': {
      context: 400_000,
      capabilities: [ModelCapabilities.CODING, ModelCapabilities.REASONING, ModelCapabilities.FUNCTION_CALLING, ModelCapabilities.STRUCTURED_OUTPUT, ModelCapabilities.AGENT],
      pricing: { input: 1.75, output: 14.00 },
      recommendedUse: 'Complex coding, agentic tasks, multi-step reasoning',
    },
    'gpt-5-mini': {
      context: 200_000,
      capabilities: [ModelCapabilities.FAST_RESPONSE, ModelCapabilities.COST_OPTIMIZED, ModelCapabilities.FUNCTION_CALLING],
      pricing: { input: 0.25, output: 2.00 },
      recommendedUse: 'High-volume, cost-sensitive, quick responses',
    },
  },
  [ProviderType.ANTHROPIC]: {
    'claude-opus-4.6': {
      context: 1_000_000,
      capabilities: [ModelCapabilities.CODING, ModelCapabilities.LONG_CONTEXT, ModelCapabilities.FUNCTION_CALLING, ModelCapabilities.STRUCTURED_OUTPUT, ModelCapabilities.AGENT],
      pricing: { input: 15.00, output: 75.00 },
      recommendedUse: 'Complex coding, enterprise workflows, deep analysis',
    },
    'claude-sonnet-4': {
      context: 200_000,
      capabilities: [ModelCapabilities.FAST_RESPONSE, ModelCapabilities.COST_OPTIMIZED, ModelCapabilities.FUNCTION_CALLING],
      pricing: { input: 3.00, output: 15.00 },
      recommendedUse: 'Balanced speed/cost, general use',
    },
  },
  [ProviderType.XAI]: {
    'grok-4.1': {
      context: 2_000_000,
      capabilities: [ModelCapabilities.REASONING, ModelCapabilities.LONG_CONTEXT, ModelCapabilities.FUNCTION_CALLING],
      pricing: { input: 0.20, output: 1.00 },
      recommendedUse: 'Ultra-long context, reasoning tasks',
    },
    'grok-3': {
      context: 200_000,
      capabilities: [ModelCapabilities.FAST_RESPONSE, ModelCapabilities.REASONING],
      pricing: { input: 0.10, output: 0.50 },
      recommendedUse: 'Fast reasoning, general chat',
    },
  },
  [ProviderType.GEMINI]: {
    'gemini-2.0-ultra': {
      context: 2_000_000,
      capabilities: [ModelCapabilities.MULTIMODAL, ModelCapabilities.LONG_CONTEXT, ModelCapabilities.STRUCTURED_OUTPUT],
      pricing: { input: 0.10, output: 0.50 },
      recommendedUse: 'Multimodal tasks, document analysis',
    },
    'gemini-2.0-flash-lite': {
      context: 128_000,
      capabilities: [ModelCapabilities.FAST_RESPONSE, ModelCapabilities.COST_OPTIMIZED],
      pricing: { input: 0.02, output: 0.10 },
      recommendedUse: 'Ultra-fast responses, high-volume',
    },
  },
  [ProviderType.ZAI]: {
    'glm-4.7-flash': {
      context: 128_000,
      capabilities: [ModelCapabilities.CODING, ModelCapabilities.FAST_RESPONSE],
      pricing: { input: 0, output: 0 },
      recommendedUse: 'Default coding, embedded AI (FREE)',
      isFree: true,
    },
  },
};

/**
 * AI Request Types
 */
export const RequestType = {
  CHAT: 'chat',
  COMPLETION: 'completion',
  STREAM: 'stream',
  AGENT: 'agent',
  STRUCTURED: 'structured',
};

/**
 * Agent Modes
 */
export const AgentMode = {
  SINGLE_SHOT: 'single-shot',
  MULTI_STEP: 'multi-step',
  RESEARCHER: 'researcher',
  CONVERSATIONAL: 'conversational',
};

/**
 * Tool Sets
 */
export const ToolSet = {
  FULL: 'full',
  SECOND_BRAIN: 'second-brain',
  SOCIAL: 'social',
  MINIMAL: 'minimal',
  NONE: 'none',
};

/**
 * Get the list of all provider IDs
 */
export function getAllProviders() {
  return Object.values(ProviderType);
}

/**
 * Get provider config, returning null if not found
 */
export function getProviderConfig(providerId) {
  return ProviderConfig[providerId] || null;
}

/**
 * Get model info for a specific provider and model
 */
export function getModelInfo(providerId, modelId) {
  const providerModels = ProviderModels[providerId];
  if (!providerModels) return null;
  return providerModels[modelId] || null;
}

/**
 * Get the default (free) provider
 */
export function getDefaultProvider() {
  return ProviderType.ZAI;
}

/**
 * Check if a model supports a capability
 */
export function modelSupports(providerId, modelId, capability) {
  const model = getModelInfo(providerId, modelId);
  return model?.capabilities?.includes(capability) || false;
}
