import type { PrismaClient } from '@prisma/client';
import type {
  UserContextConfiguration,
  ResponseStyle,
  MemoryThreshold,
  FocusMode,
  CompressionStrategy,
  PredictionAggressiveness,
  LayerBudgetOverride,
  TTLMultipliers,
  EnabledSignals,
} from './settings-types';
import {
  DEFAULT_SETTINGS,
  SETTINGS_CONSTRAINTS,
  SETTINGS_PRESETS,
  validateSettings,
  mergeWithDefaults,
  clampValue,
} from './settings-types';

export interface SettingsServiceConfig {
  prisma: PrismaClient;
}

export interface SettingsUpdateResult {
  success: boolean;
  settings?: UserContextConfiguration;
  errors?: string[];
}

export class ContextSettingsService {
  private prisma: PrismaClient;

  constructor(config: SettingsServiceConfig) {
    this.prisma = config.prisma;
  }

  /**
   * Get or create settings for a user
   */
  async getSettings(userId: string): Promise<UserContextConfiguration> {
    const dbSettings = await this.prisma.userContextSettings.findUnique({
      where: { userId },
    });

    if (!dbSettings) {
      // Return defaults if no settings exist
      return DEFAULT_SETTINGS;
    }

    return this.dbToConfig(dbSettings);
  }

  /**
   * Get settings with metadata for UI display
   */
  async getSettingsWithMetadata(userId: string): Promise<{
    settings: UserContextConfiguration;
    metadata: {
      lastUpdated: Date;
      isDefault: boolean;
      activePreset?: string;
    };
  }> {
    const dbSettings = await this.prisma.userContextSettings.findUnique({
      where: { userId },
    });

    if (!dbSettings) {
      return {
        settings: DEFAULT_SETTINGS,
        metadata: {
          lastUpdated: new Date(),
          isDefault: true,
        },
      };
    }

    // Detect if settings match a preset
    const config = this.dbToConfig(dbSettings);
    const activePreset = this.detectPreset(config);

    return {
      settings: config,
      metadata: {
        lastUpdated: dbSettings.updatedAt,
        isDefault: this.isDefaultConfig(config),
        activePreset,
      },
    };
  }

  /**
   * Update settings with validation
   */
  async updateSettings(
    userId: string,
    partial: Partial<UserContextConfiguration>
  ): Promise<SettingsUpdateResult> {
    // Validate input
    const validation = validateSettings(partial);
    if (!validation.valid) {
      return { success: false, errors: validation.errors };
    }

    // Get current settings and merge
    const current = await this.getSettings(userId);
    const merged = this.mergeSettings(current, partial);

    // Convert to DB format and upsert
    const dbData = this.configToDb(merged);

    await this.prisma.userContextSettings.upsert({
      where: { userId },
      update: dbData,
      create: { ...dbData, userId },
    });

    return { success: true, settings: merged };
  }

  /**
   * Apply a preset configuration
   */
  async applyPreset(
    userId: string,
    presetName: keyof typeof SETTINGS_PRESETS
  ): Promise<SettingsUpdateResult> {
    const preset = SETTINGS_PRESETS[presetName];
    if (!preset) {
      return { success: false, errors: [`Unknown preset: ${presetName}`] };
    }

    return this.updateSettings(userId, preset);
  }

  /**
   * Reset settings to defaults
   */
  async resetToDefaults(userId: string): Promise<UserContextConfiguration> {
    await this.prisma.userContextSettings.deleteMany({
      where: { userId },
    });

    return DEFAULT_SETTINGS;
  }

  /**
   * Update a specific setting by path
   */
  async updateSetting(userId: string, path: string, value: unknown): Promise<SettingsUpdateResult> {
    const current = await this.getSettings(userId);
    const updated = this.setByPath(current, path, value);
    return this.updateSettings(userId, updated);
  }

  /**
   * Get available presets with descriptions
   */
  getPresets(): Array<{
    name: string;
    label: string;
    description: string;
    icon?: string;
    config: Partial<UserContextConfiguration>;
  }> {
    return [
      {
        name: 'minimal',
        label: 'Minimal',
        description: 'Low resource usage, fast responses, minimal context',
        icon: 'zap',
        config: SETTINGS_PRESETS.minimal,
      },
      {
        name: 'balanced',
        label: 'Balanced',
        description: 'Good balance of context and performance',
        icon: 'scale',
        config: SETTINGS_PRESETS.balanced,
      },
      {
        name: 'knowledge',
        label: 'Knowledge Heavy',
        description: 'Maximum context and knowledge retention',
        icon: 'brain',
        config: SETTINGS_PRESETS.knowledge,
      },
      {
        name: 'developer',
        label: 'Developer',
        description: 'Optimized for coding and technical discussions',
        icon: 'code',
        config: SETTINGS_PRESETS.developer,
      },
      {
        name: 'privacy',
        label: 'Privacy Focused',
        description: 'Minimal data retention and prediction',
        icon: 'shield',
        config: SETTINGS_PRESETS.privacy,
      },
    ];
  }

  /**
   * Get settings schema for UI generation
   */
  getSettingsSchema(): Array<{
    id: string;
    category: 'essential' | 'advanced' | 'expert';
    type: string;
    label: string;
    description: string;
    default: unknown;
    constraints?: {
      min?: number;
      max?: number;
      step?: number;
      options?: Array<{ value: string; label: string }>;
    };
  }> {
    return [
      // Tier 1: Essential
      {
        id: 'maxContextTokens',
        category: 'essential',
        type: 'slider',
        label: 'Context Window Size',
        description: 'Maximum tokens available for context (affects cost and quality)',
        default: DEFAULT_SETTINGS.maxContextTokens,
        constraints: SETTINGS_CONSTRAINTS.maxContextTokens,
      },
      {
        id: 'responseStyle',
        category: 'essential',
        type: 'select',
        label: 'Response Style',
        description: 'How detailed should AI responses be',
        default: DEFAULT_SETTINGS.responseStyle,
        constraints: {
          options: [
            { value: 'concise', label: 'Concise - Short, to-the-point responses' },
            { value: 'balanced', label: 'Balanced - Moderate detail' },
            { value: 'detailed', label: 'Detailed - In-depth explanations' },
          ],
        },
      },
      {
        id: 'memoryThreshold',
        category: 'essential',
        type: 'select',
        label: 'Memory Sensitivity',
        description: 'How selective should the system be when including memories',
        default: DEFAULT_SETTINGS.memoryThreshold,
        constraints: {
          options: [
            { value: 'strict', label: 'Strict - Only highly relevant memories' },
            { value: 'moderate', label: 'Moderate - Balance relevance and breadth' },
            { value: 'permissive', label: 'Permissive - Include more memories' },
          ],
        },
      },
      {
        id: 'focusMode',
        category: 'essential',
        type: 'select',
        label: 'Focus Mode',
        description: 'Prioritize conversation history or general knowledge',
        default: DEFAULT_SETTINGS.focusMode,
        constraints: {
          options: [
            { value: 'chat-first', label: 'Chat First - Prioritize this conversation' },
            { value: 'balanced', label: 'Balanced - Equal weight to chat and knowledge' },
            { value: 'knowledge-first', label: 'Knowledge First - Prioritize your knowledge base' },
          ],
        },
      },

      // Tier 2: Advanced
      {
        id: 'compressionStrategy',
        category: 'advanced',
        type: 'select',
        label: 'Conversation Compression',
        description: 'How to handle long conversations',
        default: DEFAULT_SETTINGS.compressionStrategy,
        constraints: {
          options: [
            { value: 'auto', label: 'Auto - Choose based on conversation length' },
            { value: 'full', label: 'Full - Include everything (short conversations only)' },
            { value: 'windowed', label: 'Windowed - Recent messages in full, summarize older' },
            { value: 'compacted', label: 'Compacted - Multi-zone progressive compression' },
            {
              value: 'multi_level',
              label: 'Multi-Level - Hierarchical compression for very long chats',
            },
            { value: 'none', label: 'None - No compression (may fail for long chats)' },
          ],
        },
      },
      {
        id: 'predictionAggressiveness',
        category: 'advanced',
        type: 'select',
        label: 'Prediction Aggressiveness',
        description: 'How aggressively to pre-load context for predicted topics',
        default: DEFAULT_SETTINGS.predictionAggressiveness,
        constraints: {
          options: [
            { value: 'conservative', label: 'Conservative - Only highly likely predictions' },
            { value: 'balanced', label: 'Balanced - Moderate prediction threshold' },
            { value: 'aggressive', label: 'Aggressive - Pre-load more speculative contexts' },
          ],
        },
      },
      {
        id: 'enablePredictions',
        category: 'advanced',
        type: 'boolean',
        label: 'Enable Predictions',
        description: 'Pre-load context based on predicted next interactions',
        default: DEFAULT_SETTINGS.enablePredictions,
      },
      {
        id: 'enableJitRetrieval',
        category: 'advanced',
        type: 'boolean',
        label: 'Enable Just-In-Time Retrieval',
        description: 'Fetch relevant memories in real-time during conversations',
        default: DEFAULT_SETTINGS.enableJitRetrieval,
      },

      // Tier 3: Expert
      {
        id: 'topicSimilarityThreshold',
        category: 'expert',
        type: 'slider',
        label: 'Topic Match Threshold',
        description: 'Minimum similarity score to match a topic (0-1)',
        default: DEFAULT_SETTINGS.topicSimilarityThreshold,
        constraints: SETTINGS_CONSTRAINTS.similarityThresholds,
      },
      {
        id: 'entitySimilarityThreshold',
        category: 'expert',
        type: 'slider',
        label: 'Entity Match Threshold',
        description: 'Minimum similarity score to match an entity (0-1)',
        default: DEFAULT_SETTINGS.entitySimilarityThreshold,
        constraints: SETTINGS_CONSTRAINTS.similarityThresholds,
      },
      {
        id: 'prioritizeLatency',
        category: 'expert',
        type: 'boolean',
        label: 'Prioritize Latency',
        description: 'Skip expensive operations to reduce response time',
        default: DEFAULT_SETTINGS.prioritizeLatency,
      },
    ];
  }

  /**
   * Convert database record to configuration object
   */
  private dbToConfig(db: any): UserContextConfiguration {
    return {
      maxContextTokens: db.maxContextTokens,
      responseStyle: db.responseStyle as ResponseStyle,
      memoryThreshold: db.memoryThreshold as MemoryThreshold,
      focusMode: db.focusMode as FocusMode,
      layerBudgetOverrides: (db.layerBudgetOverrides as Record<string, LayerBudgetOverride>) || {},
      compressionStrategy: db.compressionStrategy as CompressionStrategy,
      predictionAggressiveness: db.predictionAggressiveness as PredictionAggressiveness,
      ttlMultipliers: (db.ttlMultipliers as TTLMultipliers) || {},
      enabledSignals: (db.enabledSignals as EnabledSignals) || {},
      topicSimilarityThreshold: db.topicSimilarityThreshold,
      entitySimilarityThreshold: db.entitySimilarityThreshold,
      acuSimilarityThreshold: db.acuSimilarityThreshold,
      memorySimilarityThreshold: db.memorySimilarityThreshold,
      elasticityOverrides: (db.elasticityOverrides as Record<string, number>) || {},
      customBudgetFormulas: (db.customBudgetFormulas as Record<string, string>) || {},
      excludedTopicSlugs: db.excludedTopicSlugs || [],
      excludedEntityIds: db.excludedEntityIds || [],
      excludedMemoryIds: db.excludedMemoryIds || [],
      excludedConversationIds: db.excludedConversationIds || [],
      enablePredictions: db.enablePredictions,
      enableJitRetrieval: db.enableJitRetrieval,
      enableCompression: db.enableCompression,
      enableEntityContext: db.enableEntityContext,
      enableTopicContext: db.enableTopicContext,
      prioritizeLatency: db.prioritizeLatency,
      cacheAggressively: db.cacheAggressively,
    };
  }

  /**
   * Convert configuration object to database format
   */
  private configToDb(config: UserContextConfiguration): any {
    return {
      maxContextTokens: config.maxContextTokens,
      responseStyle: config.responseStyle,
      memoryThreshold: config.memoryThreshold,
      focusMode: config.focusMode,
      layerBudgetOverrides: config.layerBudgetOverrides,
      compressionStrategy: config.compressionStrategy,
      predictionAggressiveness: config.predictionAggressiveness,
      ttlMultipliers: config.ttlMultipliers,
      enabledSignals: config.enabledSignals,
      topicSimilarityThreshold: config.topicSimilarityThreshold,
      entitySimilarityThreshold: config.entitySimilarityThreshold,
      acuSimilarityThreshold: config.acuSimilarityThreshold,
      memorySimilarityThreshold: config.memorySimilarityThreshold,
      elasticityOverrides: config.elasticityOverrides,
      customBudgetFormulas: config.customBudgetFormulas,
      excludedTopicSlugs: config.excludedTopicSlugs,
      excludedEntityIds: config.excludedEntityIds,
      excludedMemoryIds: config.excludedMemoryIds,
      excludedConversationIds: config.excludedConversationIds,
      enablePredictions: config.enablePredictions,
      enableJitRetrieval: config.enableJitRetrieval,
      enableCompression: config.enableCompression,
      enableEntityContext: config.enableEntityContext,
      enableTopicContext: config.enableTopicContext,
      prioritizeLatency: config.prioritizeLatency,
      cacheAggressively: config.cacheAggressively,
    };
  }

  /**
   * Merge partial settings with current settings
   */
  private mergeSettings(
    current: UserContextConfiguration,
    partial: Partial<UserContextConfiguration>
  ): UserContextConfiguration {
    return {
      ...current,
      ...partial,
      // Deep merge nested objects
      layerBudgetOverrides:
        partial.layerBudgetOverrides !== undefined
          ? { ...current.layerBudgetOverrides, ...partial.layerBudgetOverrides }
          : current.layerBudgetOverrides,
      ttlMultipliers:
        partial.ttlMultipliers !== undefined
          ? { ...current.ttlMultipliers, ...partial.ttlMultipliers }
          : current.ttlMultipliers,
      enabledSignals:
        partial.enabledSignals !== undefined
          ? { ...current.enabledSignals, ...partial.enabledSignals }
          : current.enabledSignals,
      elasticityOverrides:
        partial.elasticityOverrides !== undefined
          ? { ...current.elasticityOverrides, ...partial.elasticityOverrides }
          : current.elasticityOverrides,
      customBudgetFormulas:
        partial.customBudgetFormulas !== undefined
          ? { ...current.customBudgetFormulas, ...partial.customBudgetFormulas }
          : current.customBudgetFormulas,
      excludedTopicSlugs:
        partial.excludedTopicSlugs !== undefined
          ? partial.excludedTopicSlugs
          : current.excludedTopicSlugs,
      excludedEntityIds:
        partial.excludedEntityIds !== undefined
          ? partial.excludedEntityIds
          : current.excludedEntityIds,
      excludedMemoryIds:
        partial.excludedMemoryIds !== undefined
          ? partial.excludedMemoryIds
          : current.excludedMemoryIds,
      excludedConversationIds:
        partial.excludedConversationIds !== undefined
          ? partial.excludedConversationIds
          : current.excludedConversationIds,
    };
  }

  /**
   * Detect which preset a configuration matches (if any)
   */
  private detectPreset(config: UserContextConfiguration): string | undefined {
    for (const [name, preset] of Object.entries(SETTINGS_PRESETS)) {
      if (this.matchesPreset(config, preset)) {
        return name;
      }
    }
    return undefined;
  }

  /**
   * Check if config matches a preset (loose matching)
   */
  private matchesPreset(
    config: UserContextConfiguration,
    preset: Partial<UserContextConfiguration>
  ): boolean {
    for (const [key, value] of Object.entries(preset)) {
      if ((config as any)[key] !== value) {
        return false;
      }
    }
    return true;
  }

  /**
   * Check if config is default
   */
  private isDefaultConfig(config: UserContextConfiguration): boolean {
    return this.matchesPreset(config, DEFAULT_SETTINGS);
  }

  /**
   * Set a value by path (e.g., "enabledSignals.timeOfDay")
   */
  private setByPath(
    obj: UserContextConfiguration,
    path: string,
    value: unknown
  ): Partial<UserContextConfiguration> {
    const parts = path.split('.');
    const result: any = {};
    let current = result;

    for (let i = 0; i < parts.length - 1; i++) {
      current[parts[i]] = {};
      current = current[parts[i]];
    }

    current[parts[parts.length - 1]] = value;
    return result;
  }
}
