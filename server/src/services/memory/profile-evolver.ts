/**
 * Profile Evolver
 * 
 * Evolves user profile over time based on accumulated memories and conversations.
 * Called periodically (after every N conversations) or on significant events.
 * 
 * @created March 27, 2026
 */

import { PrismaClient } from '@prisma/client';
import {
  UserProfileSnapshot,
  UserAvatar,
  UserIdentity,
  UserPreferences,
  TopicExpertise,
  UserBehavior,
  ActiveConcerns,
} from '../../types/corpus';
import { logger } from '../../../lib/logger';

interface LLMService {
  chat: (params: { model: string; messages: any[] }) => Promise<{ content: string }>;
}

export class ProfileEvolver {
  private prisma: PrismaClient;
  private llmService: LLMService;

  constructor(prisma: PrismaClient, llmService: LLMService) {
    this.prisma = prisma;
    this.llmService = llmService;
  }

  /**
   * Evolve user profile
   */
  async evolve(virtualUserId: string): Promise<UserProfileSnapshot> {
    logger.info({ virtualUserId }, 'Evolving user profile');

    try {
      // Get current profile
      const current = await this.getCurrentProfile(virtualUserId);

      // Get all memories
      const memories = await this.prisma.virtualMemory.findMany({
        where: { virtualUserId, isActive: true },
        orderBy: [{ importance: 'desc' }, { createdAt: 'desc' }],
        take: 200,
      });

      // Get recent conversation indices
      const recentConversations = await this.prisma.conversationIndex.findMany({
        where: { virtualUserId },
        orderBy: { startedAt: 'desc' },
        take: 10,
      });

      // Use LLM to synthesize profile update
      const synthesis = await this.synthesizeProfileUpdate(
        current,
        memories,
        recentConversations
      );

      // Apply updates
      const evolved = this.applyUpdates(current, synthesis);

      // Reclassify avatar
      evolved.avatar = await this.classifyAvatar(virtualUserId, evolved);

      // Store new snapshot
      await this.saveProfile(virtualUserId, evolved);

      // Update virtual user record
      await this.prisma.virtualUser.update({
        where: { id: virtualUserId },
        data: {
          currentAvatar: evolved.avatar,
          profileVersion: { increment: 1 },
          topicInterests: Object.keys(evolved.topicExpertise),
        },
      });

      logger.info(
        { virtualUserId, avatar: evolved.avatar, version: evolved.version },
        'Profile evolved successfully'
      );

      return evolved;
    } catch (error) {
      logger.error({ error: (error as Error).message }, 'Profile evolution failed');
      throw error;
    }
  }

  /**
   * Get current profile
   */
  private async getCurrentProfile(virtualUserId: string): Promise<UserProfileSnapshot> {
    const latest = await this.prisma.userProfileSnapshot.findFirst({
      where: { virtualUserId },
      orderBy: { version: 'desc' },
    });

    if (latest) {
      return this.mapToProfile(latest);
    }

    // Return default profile
    return this.createDefaultProfile(virtualUserId);
  }

  /**
   * Synthesize profile update with LLM
   */
  private async synthesizeProfileUpdate(
    current: UserProfileSnapshot,
    memories: any[],
    conversations: any[]
  ): Promise<Partial<UserProfileSnapshot>> {
    try {
      const response = await this.llmService.chat({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Update the user profile based on accumulated memories and conversations.

Current profile:
${JSON.stringify(current, null, 2)}

Recent memories:
${memories.map((m) => `[${m.memoryType}] ${m.content} (importance: ${m.importance})`).join('\n')}

Recent conversations:
${conversations.map((c) => `- ${c.summary} (topics: ${c.topics.join(', ')})`).join('\n')}

Return ONLY fields that should CHANGE. Return empty object {} if no changes needed.

Format as JSON with these optional fields:
{
  identity: { displayName, role, company, teamSize, plan, expertise },
  preferences: { communicationStyle, technicalLevel, responseFormat, timezone, language },
  topicExpertise: { "topic-slug": { level, questionsAsked, lastInteraction } },
  behavior: { avgSessionLength, returnFrequency, escalationRate, satisfactionTrend },
  activeConcerns: { unresolvedIssues, featureRequests, actionItems },
  evolutionLog: [{ timestamp, changes: string[] }]
}`,
          },
        ],
      });

      return JSON.parse(response.content);
    } catch (error) {
      logger.warn({ error: (error as Error).message }, 'Profile synthesis failed');
      return {};
    }
  }

  /**
   * Apply updates to profile
   */
  private applyUpdates(
    current: UserProfileSnapshot,
    updates: Partial<UserProfileSnapshot>
  ): UserProfileSnapshot {
    const evolved: UserProfileSnapshot = {
      ...current,
      version: current.version + 1,
      identity: { ...current.identity, ...(updates.identity || {}) },
      preferences: { ...current.preferences, ...(updates.preferences || {}) },
      topicExpertise: { ...current.topicExpertise, ...(updates.topicExpertise || {}) },
      behavior: { ...current.behavior, ...(updates.behavior || {}) },
      activeConcerns: { ...current.activeConcerns, ...(updates.activeConcerns || {}) },
      evolutionLog: updates.evolutionLog
        ? [...current.evolutionLog, ...updates.evolutionLog]
        : current.evolutionLog,
      lastEvolvedAt: new Date(),
    };

    return evolved;
  }

  /**
   * Classify avatar based on profile
   */
  private async classifyAvatar(
    virtualUserId: string,
    profile: UserProfileSnapshot
  ): Promise<UserAvatar> {
    const [conversationCount, memoryCount] = await Promise.all([
      this.prisma.virtualConversation.count({ where: { virtualUserId } }),
      this.prisma.virtualMemory.count({ where: { virtualUserId, isActive: true } }),
    ]);

    if (conversationCount === 0) return 'STRANGER';
    if (conversationCount <= 5 && memoryCount <= 10) return 'ACQUAINTANCE';
    if (conversationCount <= 20 && memoryCount <= 50) return 'FAMILIAR';
    return 'KNOWN';
  }

  /**
   * Save profile snapshot
   */
  private async saveProfile(
    virtualUserId: string,
    profile: UserProfileSnapshot
  ): Promise<void> {
    await this.prisma.userProfileSnapshot.create({
      data: {
        virtualUserId,
        avatar: profile.avatar,
        version: profile.version,
        identity: profile.identity as any,
        preferences: profile.preferences as any,
        topicExpertise: profile.topicExpertise as any,
        behavior: profile.behavior as any,
        activeConcerns: profile.activeConcerns as any,
        evolutionLog: profile.evolutionLog as any,
      },
    });
  }

  /**
   * Create default profile
   */
  private createDefaultProfile(virtualUserId: string): UserProfileSnapshot {
    return {
      id: '',
      virtualUserId,
      avatar: 'STRANGER',
      version: 1,
      identity: {
        displayName: null,
        role: null,
        company: null,
        teamSize: null,
        plan: null,
        expertise: null,
      },
      preferences: {
        communicationStyle: null,
        technicalLevel: null,
        responseFormat: null,
        timezone: null,
        language: null,
      },
      topicExpertise: {},
      behavior: {
        avgSessionLength: 0,
        avgMessagesPerSession: 0,
        peakActivityHours: [],
        returnFrequency: 0,
        escalationRate: 0,
        satisfactionTrend: 'stable',
      },
      activeConcerns: {
        unresolvedIssues: [],
        pendingFeatureRequests: [],
        openActionItems: [],
      },
      evolutionLog: [],
      createdAt: new Date(),
      lastEvolvedAt: new Date(),
    };
  }

  /**
   * Map database record to profile
   */
  private mapToProfile(record: any): UserProfileSnapshot {
    return {
      id: record.id,
      virtualUserId: record.virtualUserId,
      avatar: record.avatar,
      version: record.version,
      identity: record.identity,
      preferences: record.preferences,
      topicExpertise: record.topicExpertise,
      behavior: record.behavior,
      activeConcerns: record.activeConcerns,
      evolutionLog: record.evolutionLog,
      createdAt: record.createdAt,
      lastEvolvedAt: record.lastEvolvedAt,
    };
  }
}
