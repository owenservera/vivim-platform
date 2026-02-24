import type { PrismaClient } from '@prisma/client';
import type { ClientPresenceState, NavigationEvent } from './types';
import { PredictionEngine } from './prediction-engine';
import { BundleCompiler } from './bundle-compiler';
import type { ITokenEstimator, ILLMService } from './types';

interface ContextOrchestratorConfig {
  prisma: PrismaClient;
  tokenEstimator: ITokenEstimator;
  llmService: ILLMService;
}

export class ContextOrchestrator {
  private prisma: PrismaClient;
  private predictionEngine: PredictionEngine;
  private bundleCompiler: BundleCompiler;

  constructor(config: ContextOrchestratorConfig) {
    this.prisma = config.prisma;
    this.predictionEngine = new PredictionEngine({ prisma: config.prisma });
    this.bundleCompiler = new BundleCompiler({
      prisma: config.prisma,
      tokenEstimator: config.tokenEstimator,
      llmService: config.llmService,
    });
  }

  async ingestPresence(userId: string, presence: ClientPresenceState): Promise<void> {
    await this.upsertClientPresence(userId, presence);
    await this.triggerPredictionAndWarmup(userId, presence);
  }

  private async upsertClientPresence(userId: string, presence: ClientPresenceState): Promise<void> {
    await this.prisma.clientPresence.upsert({
      where: {
        userId_deviceId: {
          userId,
          deviceId: presence.deviceId,
        },
      },
      update: {
        activeConversationId: presence.activeConversationId,
        visibleConversationIds: presence.visibleConversationIds,
        activeNotebookId: presence.activeNotebookId,
        activePersonaId: presence.activePersonaId,
        lastNavigationPath: presence.lastNavigationPath,
        navigationHistory: presence.navigationHistory as any,
        localTime: presence.localTime,
        idleSince: presence.idleSince,
        isOnline: presence.isOnline,
        lastHeartbeatAt: new Date(),
      },
      create: {
        userId,
        deviceId: presence.deviceId,
        activeConversationId: presence.activeConversationId,
        visibleConversationIds: presence.visibleConversationIds,
        activeNotebookId: presence.activeNotebookId,
        activePersonaId: presence.activePersonaId,
        lastNavigationPath: presence.lastNavigationPath,
        navigationHistory: presence.navigationHistory as any,
        localTime: presence.localTime,
        sessionStartedAt: presence.sessionStartedAt,
        idleSince: presence.idleSince,
        predictedTopics: [],
        predictedEntities: [],
        isOnline: presence.isOnline,
        lastHeartbeatAt: new Date(),
      },
    });
  }

  private async triggerPredictionAndWarmup(
    userId: string,
    presence: ClientPresenceState
  ): Promise<void> {
    const predictions = await this.predictionEngine.predictNextInteractions(userId, presence);

    await this.ensureFresh(userId, 'identity_core', () =>
      this.bundleCompiler.compileIdentityCore(userId)
    );

    await this.ensureFresh(userId, 'global_prefs', () =>
      this.bundleCompiler.compileGlobalPrefs(userId)
    );

    for (const prediction of predictions) {
      if (prediction.probability < 0.1) continue;

      try {
        if (prediction.conversationId) {
          await this.ensureFreshWithId(userId, 'conversation', prediction.conversationId, () =>
            this.bundleCompiler.compileConversationContext(userId, prediction.conversationId!)
          );
        }

        if (prediction.topicSlug) {
          await this.ensureFreshWithId(userId, 'topic', prediction.topicSlug, () =>
            this.bundleCompiler.compileTopicContext(userId, prediction.topicSlug!)
          );
        }

        if (prediction.entityId) {
          await this.ensureFreshWithId(userId, 'entity', prediction.entityId, () =>
            this.bundleCompiler.compileEntityContext(userId, prediction.entityId!)
          );
        }
      } catch (error) {
        console.error('Failed to pre-build bundle for prediction', prediction, error);
      }
    }

    await this.prisma.clientPresence.update({
      where: {
        userId_deviceId: {
          userId,
          deviceId: presence.deviceId,
        },
      },
      data: {
        predictedTopics: predictions.filter((p) => p.topicSlug).map((p) => p.topicSlug!),
        predictedEntities: predictions.filter((p) => p.entityId).map((p) => p.entityId!),
      },
    });
  }

  private async ensureFresh(
    userId: string,
    bundleType: string,
    compileFn: () => Promise<any>,
    personaId?: string
  ): Promise<void> {
    const existing = await this.prisma.contextBundle.findFirst({
      where: {
        userId,
        bundleType,
        topicProfileId: null,
        entityProfileId: null,
        conversationId: null,
        personaId: personaId ?? null,
      },
    });

    const needsRecompile =
      !existing ||
      existing.isDirty ||
      (existing.expiresAt && existing.expiresAt < new Date()) ||
      Date.now() - existing.compiledAt.getTime() > this.getTTL(bundleType);

    if (needsRecompile) {
      await compileFn();
    }
  }

  private async ensureFreshWithId(
    userId: string,
    bundleType: string,
    referenceId: string,
    compileFn: () => Promise<any>
  ): Promise<void> {
    const existing = await this.prisma.contextBundle.findFirst({
      where: {
        userId,
        bundleType,
        OR: [
          { topicProfileId: referenceId },
          { entityProfileId: referenceId },
          { conversationId: referenceId },
        ],
      },
    });

    const needsRecompile =
      !existing ||
      existing.isDirty ||
      (existing.expiresAt && existing.expiresAt < new Date()) ||
      Date.now() - existing.compiledAt.getTime() > this.getTTL(bundleType);

    if (needsRecompile) {
      await compileFn();
    }
  }

  private getTTL(bundleType: string): number {
    const ttls: Record<string, number> = {
      identity_core: 24 * 60 * 60 * 1000,
      global_prefs: 12 * 60 * 60 * 1000,
      topic: 4 * 60 * 60 * 1000,
      entity: 6 * 60 * 60 * 1000,
      conversation: 30 * 60 * 1000,
    };
    return ttls[bundleType] ?? 60 * 60 * 1000;
  }

  async invalidateOnMemoryCreated(
    userId: string,
    memory: {
      id: string;
      category: string;
      importance: number;
    }
  ): Promise<void> {
    if (['biography', 'identity', 'role'].includes(memory.category) && memory.importance >= 0.8) {
      await this.markDirty(userId, 'identity_core');
    }

    if (memory.category === 'preference' && memory.importance >= 0.6) {
      await this.markDirty(userId, 'global_prefs');
    }

    const affectedTopics = await this.prisma.topicProfile.findMany({
      where: {
        userId,
        relatedMemoryIds: { has: memory.id },
      },
    });

    for (const topic of affectedTopics) {
      await this.markDirtyWithId(userId, 'topic', topic.id);
    }
  }

  async invalidateOnConversationMessage(userId: string, conversationId: string): Promise<void> {
    await this.prisma.contextBundle.updateMany({
      where: {
        userId,
        bundleType: 'conversation',
        conversationId,
      },
      data: { isDirty: true },
    });
  }

  async invalidateOnInstructionChanged(userId: string): Promise<void> {
    await this.markDirty(userId, 'global_prefs');
  }

  async invalidateOnACUCreated(userId: string, topicId: string): Promise<void> {
    if (topicId) {
      await this.markDirtyWithId(userId, 'topic', topicId);
    }
  }

  async invalidateOnACUDeletedOrChanged(userId: string): Promise<void> {
    const topicProfiles = await this.prisma.topicProfile.findMany({
      where: { userId, isDirty: false },
      select: { id: true, relatedAcuIds: true },
    });

    for (const topic of topicProfiles) {
      if (topic.relatedAcuIds.length > 0) {
        await this.markDirtyWithId(userId, 'topic', topic.id);
      }
    }
  }

  async cleanupExpiredBundles(): Promise<number> {
    const result = await this.prisma.contextBundle.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });

    return result.count;
  }

  async getPresence(userId: string, deviceId: string): Promise<ClientPresenceState | null> {
    const presence = await this.prisma.clientPresence.findUnique({
      where: {
        userId_deviceId: { userId, deviceId },
      },
    });

    if (!presence) return null;

    return {
      userId: presence.userId,
      deviceId: presence.deviceId,
      activeConversationId: presence.activeConversationId ?? undefined,
      visibleConversationIds: presence.visibleConversationIds,
      activeNotebookId: presence.activeNotebookId ?? undefined,
      activePersonaId: presence.activePersonaId ?? undefined,
      lastNavigationPath: presence.lastNavigationPath ?? undefined,
      navigationHistory: (presence.navigationHistory as NavigationEvent[]) ?? [],
      localTime: presence.localTime ?? undefined,
      sessionStartedAt: presence.sessionStartedAt,
      idleSince: presence.idleSince ?? undefined,
      predictedTopics: presence.predictedTopics,
      predictedEntities: presence.predictedEntities,
      lastHeartbeatAt: presence.lastHeartbeatAt,
      isOnline: presence.isOnline,
    };
  }
}
