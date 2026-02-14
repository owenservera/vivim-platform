/**
 * BYOK Provider Configurations
 * 
 * Defines supported providers, models, pricing, and configuration
 */

import type { ProviderConfig, ProviderModel } from './types';

// ============================================================================
// Model Definitions
// ============================================================================

const OPENAI_MODELS: ProviderModel[] = [
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    contextWindow: 128000,
    maxOutputTokens: 16384,
    inputCostPer1k: 0.0025,
    outputCostPer1k: 0.01,
  },
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini',
    contextWindow: 128000,
    maxOutputTokens: 16384,
    inputCostPer1k: 0.00015,
    outputCostPer1k: 0.0006,
  },
  {
    id: 'gpt-4-turbo',
    name: 'GPT-4 Turbo',
    contextWindow: 128000,
    maxOutputTokens: 4096,
    inputCostPer1k: 0.01,
    outputCostPer1k: 0.03,
  },
  {
    id: 'gpt-3.5-turbo',
    name: 'GPT-3.5 Turbo',
    contextWindow: 16385,
    maxOutputTokens: 4096,
    inputCostPer1k: 0.0005,
    outputCostPer1k: 0.0015,
  },
];

const ANTHROPIC_MODELS: ProviderModel[] = [
  {
    id: 'claude-sonnet-4-20250514',
    name: 'Claude Sonnet 4',
    contextWindow: 200000,
    maxOutputTokens: 8192,
    inputCostPer1k: 0.003,
    outputCostPer1k: 0.015,
  },
  {
    id: 'claude-opus-4',
    name: 'Claude Opus 4',
    contextWindow: 200000,
    maxOutputTokens: 4096,
    inputCostPer1k: 0.015,
    outputCostPer1k: 0.075,
  },
  {
    id: 'claude-haiku-3',
    name: 'Claude Haiku 3',
    contextWindow: 200000,
    maxOutputTokens: 4096,
    inputCostPer1k: 0.00025,
    outputCostPer1k: 0.00125,
  },
];

const GOOGLE_MODELS: ProviderModel[] = [
  {
    id: 'gemini-1.5-pro',
    name: 'Gemini 1.5 Pro',
    contextWindow: 2000000,
    maxOutputTokens: 8192,
    inputCostPer1k: 0.00125,
    outputCostPer1k: 0.00375,
  },
  {
    id: 'gemini-1.5-flash',
    name: 'Gemini 1.5 Flash',
    contextWindow: 1000000,
    maxOutputTokens: 8192,
    inputCostPer1k: 0.000075,
    outputCostPer1k: 0.0003,
  },
  {
    id: 'gemini-1.0-pro',
    name: 'Gemini 1.0 Pro',
    contextWindow: 32768,
    maxOutputTokens: 8192,
    inputCostPer1k: 0.000125,
    outputCostPer1k: 0.0005,
  },
];

const XAI_MODELS: ProviderModel[] = [
  {
    id: 'grok-2',
    name: 'Grok 2',
    contextWindow: 131072,
    maxOutputTokens: 8192,
    inputCostPer1k: 0.002,
    outputCostPer1k: 0.01,
  },
  {
    id: 'grok-2-vision-1212',
    name: 'Grok 2 Vision',
    contextWindow: 131072,
    maxOutputTokens: 8192,
    inputCostPer1k: 0.002,
    outputCostPer1k: 0.01,
  },
];

const MISTRAL_MODELS: ProviderModel[] = [
  {
    id: 'mistral-large-2411',
    name: 'Mistral Large',
    contextWindow: 128000,
    maxOutputTokens: 65536,
    inputCostPer1k: 0.002,
    outputCostPer1k: 0.006,
  },
  {
    id: 'mistral-small-2501',
    name: 'Mistral Small',
    contextWindow: 131072,
    maxOutputTokens: 8192,
    inputCostPer1k: 0.0002,
    outputCostPer1k: 0.0006,
  },
  {
    id: 'open-mistral-7b',
    name: 'Mistral 7B',
    contextWindow: 32768,
    maxOutputTokens: 8192,
    inputCostPer1k: 0.00025,
    outputCostPer1k: 0.00025,
  },
];

// ============================================================================
// Provider Configurations
// ============================================================================

export const PROVIDER_CONFIGS: Record<string, ProviderConfig> = {
  openai: {
    id: 'openai',
    name: 'openai',
    displayName: 'OpenAI',
    models: OPENAI_MODELS,
    baseUrl: 'https://api.openai.com/v1',
    docsUrl: 'https://platform.openai.com/api-keys',
    keyFormat: {
      pattern: /^sk-(?:proj-)?[a-zA-Z0-9]{20,}$/,
      placeholder: 'sk-...',
      example: 'sk-proj-abc123def456ghi789jkl012',
    },
    features: {
      streaming: true,
      functionCalling: true,
      vision: true,
    },
    color: '#10a37f',
    logo: '/providers/openai.svg',
  },
  anthropic: {
    id: 'anthropic',
    name: 'anthropic',
    displayName: 'Anthropic Claude',
    models: ANTHROPIC_MODELS,
    baseUrl: 'https://api.anthropic.com/v1',
    docsUrl: 'https://console.anthropic.com/settings/keys',
    keyFormat: {
      pattern: /^sk-ant-api03-[a-zA-Z0-9_-]{50,}$/,
      placeholder: 'sk-ant-api03-...',
      example: 'sk-ant-api03-abc123...',
    },
    features: {
      streaming: true,
      functionCalling: true,
      vision: true,
    },
    color: '#d4a574',
    logo: '/providers/anthropic.svg',
  },
  google: {
    id: 'google',
    name: 'google',
    displayName: 'Google Gemini',
    models: GOOGLE_MODELS,
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    docsUrl: 'https://aistudio.google.com/app/apikey',
    keyFormat: {
      pattern: /^AIza[0-9A-Za-z\-_]{35}$/,
      placeholder: 'AIza...',
      example: 'AIzaSyAbCdeFgHijKlMnoPqrStUvWxYzaBcDeFg',
    },
    features: {
      streaming: true,
      functionCalling: true,
      vision: true,
    },
    color: '#4285f4',
    logo: '/providers/google.svg',
  },
  xai: {
    id: 'xai',
    name: 'xai',
    displayName: 'xAI Grok',
    models: XAI_MODELS,
    baseUrl: 'https://api.x.ai/v1',
    docsUrl: 'https://console.x.ai/',
    keyFormat: {
      pattern: /^xai-[a-zA-Z0-9_-]{40,}$/,
      placeholder: 'xai-...',
      example: 'xai-abc123def456ghi789jkl012mno345pqr678',
    },
    features: {
      streaming: true,
      functionCalling: false,
      vision: true,
    },
    color: '#000000',
    logo: '/providers/xai.svg',
  },
  mistral: {
    id: 'mistral',
    name: 'mistral',
    displayName: 'Mistral AI',
    models: MISTRAL_MODELS,
    baseUrl: 'https://api.mistral.ai/v1',
    docsUrl: 'https://console.mistral.ai/api-keys',
    keyFormat: {
      pattern: /^[a-zA-Z0-9_-]{20,}$/,
      placeholder: 'Enter your API key',
      example: 'abc123def456ghi789jkl012mno345pqr678stu901',
    },
    features: {
      streaming: true,
      functionCalling: true,
      vision: true,
    },
    color: '#af52de',
    logo: '/providers/mistral.svg',
  },
};

// ============================================================================
// Helper Functions
// ============================================================================

export function getProviderConfig(provider: string): ProviderConfig | undefined {
  return PROVIDER_CONFIGS[provider.toLowerCase()];
}

export function getAllProviders(): ProviderConfig[] {
  return Object.values(PROVIDER_CONFIGS);
}

export function getProviderModels(provider: string): ProviderModel[] {
  const config = getProviderConfig(provider);
  return config?.models || [];
}

export function getDefaultModel(provider: string): string {
  const config = getProviderConfig(provider);
  if (!config || config.models.length === 0) return '';
  
  // Return the first (usually most capable) model
  return config.models[0].id;
}

export function calculateCost(
  provider: string,
  model: string,
  promptTokens: number,
  completionTokens: number
): number {
  const models = getProviderModels(provider);
  const modelConfig = models.find(m => m.id === model);
  
  if (!modelConfig) return 0;
  
  const inputCost = (promptTokens / 1000) * modelConfig.inputCostPer1k;
  const outputCost = (completionTokens / 1000) * modelConfig.outputCostPer1k;
  
  return inputCost + outputCost;
}

export function formatCost(cost: number): string {
  if (cost < 0.01) {
    return `$${(cost * 100).toFixed(4)}¢`;
  }
  return `$${cost.toFixed(4)}`;
}

export function formatKeyDisplay(key: string): string {
  if (key.length <= 8) return '••••••••';
  return `${key.slice(0, 4)}••••••••${key.slice(-4)}`;
}
