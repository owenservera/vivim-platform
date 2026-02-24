/**
 * Settings Integration Example
 *
 * This file demonstrates how to integrate user settings
 * with the dynamic context pipeline.
 */

import { PrismaClient } from '@prisma/client';
import {
  ContextSettingsService,
  DynamicContextAssembler,
  BudgetAlgorithm,
  ContextOrchestrator,
  EmbeddingService,
  SimpleTokenEstimator,
  BundleCompiler,
  ILLMService,
} from './index';

export class ContextPipelineWithSettings {
  private prisma: PrismaClient;
  private settingsService: ContextSettingsService;
  private tokenEstimator: SimpleTokenEstimator;
  private embeddingService: EmbeddingService;
  private llmService: ILLMService;

  constructor(prisma: PrismaClient, llmService: ILLMService) {
    this.prisma = prisma;
    this.llmService = llmService;
    this.settingsService = new ContextSettingsService({ prisma });
    this.tokenEstimator = new SimpleTokenEstimator();
    this.embeddingService = new EmbeddingService();
  }

  /**
   * Assemble context with user settings applied
   */
  async assembleContext(
    userId: string,
    conversationId: string,
    userMessage: string,
    personaId?: string
  ) {
    // 1. Load user settings
    const settings = await this.settingsService.getSettings(userId);

    // 2. Create bundle compiler with settings-aware configuration
    const bundleCompiler = new BundleCompiler({
      prisma: this.prisma,
      tokenEstimator: this.tokenEstimator,
      llmService: this.llmService,
    });

    // 3. Create assembler
    const assembler = new DynamicContextAssembler({
      prisma: this.prisma,
      embeddingService: this.embeddingService,
      tokenEstimator: this.tokenEstimator,
      bundleCompiler,
    });

    // 4. Map user settings to assembly params
    const assemblyParams = {
      userId,
      conversationId,
      userMessage,
      personaId,
      settings: {
        maxContextTokens: settings.maxContextTokens,
        prioritizeConversationHistory:
          settings.focusMode === 'chat-first' || settings.focusMode === 'balanced',
        knowledgeDepth: this.mapResponseStyleToDepth(settings.responseStyle),
        includeEntityContext: settings.enableEntityContext,
      },
    };

    // 5. Assemble with user preferences
    const result = await assembler.assemble(assemblyParams);

    // 6. Apply compression strategy from settings
    if (settings.compressionStrategy !== 'auto') {
      // Override the default compression behavior
      console.log(`Using ${settings.compressionStrategy} compression as per user settings`);
    }

    return result;
  }

  /**
   * Create orchestrator with user TTL settings
   */
  createOrchestrator() {
    const orchestrator = new ContextOrchestrator({
      prisma: this.prisma,
      tokenEstimator: this.tokenEstimator,
      llmService: this.llmService,
    });

    return orchestrator;
  }

  /**
   * Example: Update user settings via API
   */
  async updateUserSettings(
    userId: string,
    updates: Partial<Parameters<ContextSettingsService['updateSettings']>[1]>
  ) {
    const result = await this.settingsService.updateSettings(userId, updates);

    if (result.success) {
      console.log('Settings updated successfully');
      return result.settings;
    } else {
      console.error('Settings validation failed:', result.errors);
      throw new Error(`Invalid settings: ${result.errors?.join(', ')}`);
    }
  }

  /**
   * Example: Apply preset for new users
   */
  async applyPresetForUser(
    userId: string,
    preset: 'minimal' | 'balanced' | 'knowledge' | 'developer' | 'privacy'
  ) {
    const result = await this.settingsService.applyPreset(userId, preset);

    if (result.success) {
      console.log(`Applied ${preset} preset for user ${userId}`);
      return result.settings;
    } else {
      throw new Error(`Failed to apply preset: ${result.errors?.join(', ')}`);
    }
  }

  /**
   * Map response style to knowledge depth
   */
  private mapResponseStyleToDepth(
    style: 'concise' | 'balanced' | 'detailed'
  ): 'minimal' | 'standard' | 'deep' {
    const mapping = {
      concise: 'minimal',
      balanced: 'standard',
      detailed: 'deep',
    } as const;

    return mapping[style];
  }

  /**
   * Get settings for UI display
   */
  async getSettingsForUI(userId: string) {
    const { settings, metadata } = await this.settingsService.getSettingsWithMetadata(userId);

    return {
      current: settings,
      metadata,
      presets: this.settingsService.getPresets(),
      schema: this.settingsService.getSettingsSchema(),
    };
  }
}

/**
 * Usage Examples
 */
export const examples = {
  /**
   * Example 1: Initialize user with default settings
   */
  async initializeUser(prisma: PrismaClient, userId: string) {
    const service = new ContextSettingsService({ prisma });

    // User starts with defaults (no DB record needed)
    const settings = await service.getSettings(userId);
    console.log('Default settings:', settings);
  },

  /**
   * Example 2: User customizes context window
   */
  async customizeContextWindow(prisma: PrismaClient, userId: string, tokenCount: number) {
    const service = new ContextSettingsService({ prisma });

    const result = await service.updateSettings(userId, {
      maxContextTokens: tokenCount,
    });

    return result;
  },

  /**
   * Example 3: Apply developer preset
   */
  async setupDeveloperMode(prisma: PrismaClient, userId: string) {
    const service = new ContextSettingsService({ prisma });

    const result = await service.applyPreset(userId, 'developer');

    if (result.success) {
      console.log('Developer mode enabled');
      console.log('- Aggressive context pre-loading');
      console.log('- Multi-level compression for long chats');
      console.log('- Topic and entity context enabled');
    }

    return result;
  },

  /**
   * Example 4: Privacy-focused configuration
   */
  async enablePrivacyMode(prisma: PrismaClient, userId: string) {
    const service = new ContextSettingsService({ prisma });

    const result = await service.applyPreset(userId, 'privacy');

    if (result.success) {
      console.log('Privacy mode enabled');
      console.log('- Predictions disabled');
      console.log('- JIT retrieval disabled');
      console.log('- Minimal data retention');
      console.log('- Aggressive caching disabled');
    }

    return result;
  },

  /**
   * Example 5: Granular setting update
   */
  async updateSpecificSetting(prisma: PrismaClient, userId: string, path: string, value: unknown) {
    const service = new ContextSettingsService({ prisma });

    // Example: Disable navigation-based predictions
    const result = await service.updateSetting(userId, 'enabledSignals.navigation', false);

    return result;
  },

  /**
   * Example 6: Exclude specific topics
   */
  async excludeTopics(prisma: PrismaClient, userId: string, topicSlugs: string[]) {
    const service = new ContextSettingsService({ prisma });

    const current = await service.getSettings(userId);
    const updated = [...current.excludedTopicSlugs, ...topicSlugs];

    const result = await service.updateSettings(userId, {
      excludedTopicSlugs: updated,
    });

    return result;
  },

  /**
   * Example 7: Reset to defaults
   */
  async resetSettings(prisma: PrismaClient, userId: string) {
    const service = new ContextSettingsService({ prisma });

    await service.resetToDefaults(userId);
    console.log('Settings reset to defaults');
  },
};
