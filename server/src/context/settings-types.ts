/**
 * User Context Settings Types and Validation
 *
 * Type definitions and validation schemas for user-configurable
 * dynamic context pipeline boundaries.
 */

// ═══════════════════════════════════════════════════════════════════════════
// TIER 1: ESSENTIAL SETTINGS
// ═══════════════════════════════════════════════════════════════════════════

export type ResponseStyle = 'concise' | 'balanced' | 'detailed';
export type MemoryThreshold = 'strict' | 'moderate' | 'permissive';
export type FocusMode = 'chat-first' | 'knowledge-first' | 'balanced';

// ═══════════════════════════════════════════════════════════════════════════
// TIER 2: ADVANCED SETTINGS
// ═══════════════════════════════════════════════════════════════════════════

export type CompressionStrategy =
  | 'auto'
  | 'full'
  | 'windowed'
  | 'compacted'
  | 'multi_level'
  | 'none';
export type PredictionAggressiveness = 'conservative' | 'balanced' | 'aggressive';

export interface LayerBudgetOverride {
  min?: number;
  ideal?: number;
  max?: number;
}

export interface TTLMultipliers {
  identity_core?: number;
  global_prefs?: number;
  topic?: number;
  entity?: number;
  conversation?: number;
}

export interface EnabledSignals {
  activeConversation?: boolean;
  visibleConversations?: boolean;
  timeOfDay?: boolean;
  hotTopics?: boolean;
  entities?: boolean;
  navigation?: boolean;
  coldStart?: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPLETE SETTINGS INTERFACE
// ═══════════════════════════════════════════════════════════════════════════

export interface UserContextConfiguration {
  // Tier 1: Essential
  maxContextTokens: number;
  responseStyle: ResponseStyle;
  memoryThreshold: MemoryThreshold;
  focusMode: FocusMode;

  // Tier 2: Advanced
  layerBudgetOverrides: Partial<Record<string, LayerBudgetOverride>>;
  compressionStrategy: CompressionStrategy;
  predictionAggressiveness: PredictionAggressiveness;
  ttlMultipliers: TTLMultipliers;
  enabledSignals: EnabledSignals;

  // Tier 3: Expert
  topicSimilarityThreshold: number;
  entitySimilarityThreshold: number;
  acuSimilarityThreshold: number;
  memorySimilarityThreshold: number;
  elasticityOverrides: Partial<Record<string, number>>;
  customBudgetFormulas: Record<string, string>;

  // Exclusions
  excludedTopicSlugs: string[];
  excludedEntityIds: string[];
  excludedMemoryIds: string[];
  excludedConversationIds: string[];

  // System Flags
  enablePredictions: boolean;
  enableJitRetrieval: boolean;
  enableCompression: boolean;
  enableEntityContext: boolean;
  enableTopicContext: boolean;
  prioritizeLatency: boolean;
  cacheAggressively: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════
// DEFAULT VALUES
// ═══════════════════════════════════════════════════════════════════════════

export const DEFAULT_SETTINGS: UserContextConfiguration = {
  // Tier 1: Essential
  maxContextTokens: 12000,
  responseStyle: 'balanced',
  memoryThreshold: 'moderate',
  focusMode: 'balanced',

  // Tier 2: Advanced
  layerBudgetOverrides: {},
  compressionStrategy: 'auto',
  predictionAggressiveness: 'balanced',
  ttlMultipliers: {},
  enabledSignals: {
    activeConversation: true,
    visibleConversations: true,
    timeOfDay: true,
    hotTopics: true,
    entities: true,
    navigation: true,
    coldStart: true,
  },

  // Tier 3: Expert
  topicSimilarityThreshold: 0.35,
  entitySimilarityThreshold: 0.4,
  acuSimilarityThreshold: 0.35,
  memorySimilarityThreshold: 0.4,
  elasticityOverrides: {},
  customBudgetFormulas: {},

  // Exclusions
  excludedTopicSlugs: [],
  excludedEntityIds: [],
  excludedMemoryIds: [],
  excludedConversationIds: [],

  // System Flags
  enablePredictions: true,
  enableJitRetrieval: true,
  enableCompression: true,
  enableEntityContext: true,
  enableTopicContext: true,
  prioritizeLatency: false,
  cacheAggressively: true,
};

// ═══════════════════════════════════════════════════════════════════════════
// VALIDATION CONSTRAINTS
// ═══════════════════════════════════════════════════════════════════════════

export const SETTINGS_CONSTRAINTS = {
  maxContextTokens: { min: 4096, max: 50000, step: 1024 },
  similarityThresholds: { min: 0.0, max: 1.0, step: 0.05 },
  elasticity: { min: 0.0, max: 1.0, step: 0.1 },
  ttlMultiplier: { min: 0.1, max: 5.0, step: 0.1 },
};

// ═══════════════════════════════════════════════════════════════════════════
// PRESET CONFIGURATIONS
// ═══════════════════════════════════════════════════════════════════════════

export const SETTINGS_PRESETS: Record<string, Partial<UserContextConfiguration>> = {
  // Minimal resource usage
  minimal: {
    maxContextTokens: 4096,
    responseStyle: 'concise',
    memoryThreshold: 'strict',
    focusMode: 'chat-first',
    compressionStrategy: 'compacted',
    enableEntityContext: false,
    enableTopicContext: false,
    prioritizeLatency: true,
  },

  // Balanced default
  balanced: {
    maxContextTokens: 12000,
    responseStyle: 'balanced',
    memoryThreshold: 'moderate',
    focusMode: 'balanced',
    compressionStrategy: 'auto',
    enableEntityContext: true,
    enableTopicContext: true,
    prioritizeLatency: false,
  },

  // Maximum context/knowledge
  knowledge: {
    maxContextTokens: 32000,
    responseStyle: 'detailed',
    memoryThreshold: 'permissive',
    focusMode: 'knowledge-first',
    compressionStrategy: 'windowed',
    enableEntityContext: true,
    enableTopicContext: true,
    prioritizeLatency: false,
    cacheAggressively: true,
  },

  // Developer/Coding focus
  developer: {
    maxContextTokens: 16000,
    responseStyle: 'balanced',
    memoryThreshold: 'moderate',
    focusMode: 'balanced',
    compressionStrategy: 'multi_level',
    enableEntityContext: true,
    enableTopicContext: true,
    predictionAggressiveness: 'aggressive',
  },

  // Privacy-focused
  privacy: {
    maxContextTokens: 8192,
    responseStyle: 'concise',
    memoryThreshold: 'strict',
    focusMode: 'chat-first',
    enablePredictions: false,
    enableJitRetrieval: false,
    cacheAggressively: false,
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════

export function applyPreset(
  presetName: keyof typeof SETTINGS_PRESETS
): Partial<UserContextConfiguration> {
  return SETTINGS_PRESETS[presetName] || SETTINGS_PRESETS.balanced;
}

export function mergeWithDefaults(
  partial: Partial<UserContextConfiguration>
): UserContextConfiguration {
  return {
    ...DEFAULT_SETTINGS,
    ...partial,
    // Deep merge for nested objects
    layerBudgetOverrides: {
      ...DEFAULT_SETTINGS.layerBudgetOverrides,
      ...partial.layerBudgetOverrides,
    },
    ttlMultipliers: {
      ...DEFAULT_SETTINGS.ttlMultipliers,
      ...partial.ttlMultipliers,
    },
    enabledSignals: {
      ...DEFAULT_SETTINGS.enabledSignals,
      ...partial.enabledSignals,
    },
    elasticityOverrides: {
      ...DEFAULT_SETTINGS.elasticityOverrides,
      ...partial.elasticityOverrides,
    },
    customBudgetFormulas: {
      ...DEFAULT_SETTINGS.customBudgetFormulas,
      ...partial.customBudgetFormulas,
    },
  };
}

export function clampValue(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function validateSettings(settings: Partial<UserContextConfiguration>): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Validate maxContextTokens
  if (settings.maxContextTokens !== undefined) {
    const { min, max } = SETTINGS_CONSTRAINTS.maxContextTokens;
    if (settings.maxContextTokens < min || settings.maxContextTokens > max) {
      errors.push(`maxContextTokens must be between ${min} and ${max}`);
    }
  }

  // Validate similarity thresholds
  const thresholds = [
    'topicSimilarityThreshold',
    'entitySimilarityThreshold',
    'acuSimilarityThreshold',
    'memorySimilarityThreshold',
  ] as const;

  for (const key of thresholds) {
    const value = settings[key];
    if (value !== undefined) {
      const { min, max } = SETTINGS_CONSTRAINTS.similarityThresholds;
      if (value < min || value > max) {
        errors.push(`${key} must be between ${min} and ${max}`);
      }
    }
  }

  // Validate TTL multipliers
  if (settings.ttlMultipliers) {
    const { min, max } = SETTINGS_CONSTRAINTS.ttlMultiplier;
    for (const [key, value] of Object.entries(settings.ttlMultipliers)) {
      if (value < min || value > max) {
        errors.push(`ttlMultipliers.${key} must be between ${min} and ${max}`);
      }
    }
  }

  return { valid: errors.length === 0, errors };
}
