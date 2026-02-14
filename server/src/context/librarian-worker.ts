/**
 * GLMT-4.7 Autonomous Librarian Worker
 * 
 * This worker implements the "Cold Loop" that solves the "Ghost Table" problem
 * by using glm-4.7-flash as a background worker to review unprocessed ACUs
 * and perform Graph Synthesis.
 * 
 * Key responsibilities:
 * 1. Topic Promotion - Detects patterns in ACUs and creates/updates TopicProfiles
 * 2. Entity Fact Discovery - Extracts and stores entity facts from conversations
 * 3. Identity Distillation - Updates L0 Identity Core based on user behavior patterns
 * 4. Dynamic Bundle Compilation - Marks profiles as dirty for recompilation
 */

import { getPrismaClient } from '../lib/database.js';
import { ZAILLMService, ZAIEmbeddingService, createEmbeddingService } from './utils/zai-service.js';
import { logger } from '../lib/logger.js';
import type { TopicProfile, EntityProfile, AtomicChatUnit } from '@prisma/client';

const prisma = getPrismaClient();

interface LibrarianConfig {
  enabled?: boolean;
  batchSize?: number;
  cooldownMinutes?: number;
  llmService?: ZAILLMService;
  embeddingService?: ZAIEmbeddingService;
}

interface ACUAnalysis {
  acuId: string;
  suggestedTopics: string[];
  suggestedEntities: Array<{ name: string; type: string; facts: string[] }>;
  identityInsights: string[];
  confidence: number;
}

interface GraphSynthesisResult {
  topicsCreated: number;
  topicsUpdated: number;
  entitiesCreated: number;
  entitiesUpdated: number;
  identityUpdates: number;
  bundlesMarkedDirty: number;
}

export class LibrarianWorker {
  private config: Required<LibrarianConfig>;
  private llmService: ZAILLMService;
  private embeddingService: ZAIEmbeddingService;
  private lastRunTime: Date | null = null;

  constructor(config: LibrarianConfig = {}) {
    this.config = {
      enabled: config.enabled ?? process.env.LIBRARIAN_ENABLED === 'true',
      batchSize: config.batchSize ?? parseInt(process.env.LIBRARIAN_BATCH_SIZE || '20', 10),
      cooldownMinutes: config.cooldownMinutes ?? parseInt(process.env.LIBRARIAN_COOLDOWN_MINUTES || '30', 10),
      llmService: config.llmService ?? new ZAILLMService(),
      embeddingService: config.embeddingService ?? createEmbeddingService()
    };

    logger.info({
      enabled: this.config.enabled,
      batchSize: this.config.batchSize,
      cooldownMinutes: this.config.cooldownMinutes
    }, 'Librarian Worker initialized');
  }

  /**
   * Main entry point - trigger the librarian loop for a user
   */
  async processUser(userId: string): Promise<GraphSynthesisResult> {
    if (!this.config.enabled) {
      logger.debug('Librarian worker is disabled');
      return this.getEmptyResult();
    }

    // Check cooldown to prevent too frequent runs
    if (this.lastRunTime && this.isInCooldown()) {
      logger.debug('Librarian worker is in cooldown');
      return this.getEmptyResult();
    }

    logger.info({ userId }, 'Librarian Worker processing user');

    try {
      // Step 1: Get unprocessed ACUs
      const unprocessedACUs = await this.getUnprocessedACUs(userId);
      
      if (unprocessedACUs.length === 0) {
        logger.info({ userId }, 'No unprocessed ACUs found');
        return this.getEmptyResult();
      }

      logger.info({ userId, acuCount: unprocessedACUs.length }, 'Processing ACUs');

      // Step 2: Analyze ACUs using GLM-4.7
      const analyses = await this.analyzeACUs(unprocessedACUs);

      // Step 3: Perform graph synthesis
      const result = await this.performGraphSynthesis(userId, analyses);

      // Step 4: Mark bundles as dirty for recompilation
      await this.markBundlesDirty(userId, analyses);

      // Step 5: Mark ACUs as processed
      await this.markACUsProcessed(userId, analyses);

      this.lastRunTime = new Date();

      logger.info({
        userId,
        ...result,
        processingTime: Date.now()
      }, 'Librarian Worker completed');

      return result;
    } catch (error) {
      logger.error({ userId, error: (error as Error).message }, 'Librarian Worker failed');
      throw error;
    }
  }

  /**
   * Triggered when conversation moves to IDLE state
   */
  async onConversationIdle(conversationId: string): Promise<void> {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      select: { ownerId: true }
    });

    if (!conversation?.ownerId) {
      logger.warn({ conversationId }, 'Conversation has no owner');
      return;
    }

    await this.processUser(conversation.ownerId);
  }

  /**
   * Get unprocessed ACUs that need librarian analysis
   */
  private async getUnprocessedACUs(userId: string): Promise<AtomicChatUnit[]> {
    return prisma.atomicChatUnit.findMany({
      where: {
        authorDid: userId,
        metadata: {
          path: ['librarianProcessed'],
          not: true
        }
      },
      take: this.config.batchSize,
      orderBy: { createdAt: 'asc' }
    });
  }

  /**
   * Analyze ACUs using GLM-4.7 for topic, entity, and identity insights
   */
  private async analyzeACUs(acus: AtomicChatUnit[]): Promise<ACUAnalysis[]> {
    const contents = acu => {
      // Handle both string and object content formats
      if (typeof acu.content === 'string') {
        return acu.content;
      }
      if (acu.content && typeof acu.content === 'object') {
        return JSON.stringify(acu.content);
      }
      return String(acu.content || '');
    };

    const contentBatch = acus.map(a => contents(a)).join('\n---\n');

    const prompt = `You are the GLMT-4.7 Autonomous Librarian. Analyze the following Atomic Chat Units (ACUs) and extract:

1. **Topics**: recurring themes or subjects (e.g., "rust-lang", "react-hooks", "database-design")
2. **Entities**: people, places, products, or organizations mentioned with facts about them
3. **Identity Insights**: patterns about the user's preferences, expertise level, or working style

ACUs to analyze:
${contentBatch}

Respond with a JSON array of analyses, one per ACU:
[
  {
    "acuId": "...",
    "suggestedTopics": ["topic1", "topic2"],
    "suggestedEntities": [{"name": "...", "type": "person|product|organization|place", "facts": ["fact1", "fact2"]}],
    "identityInsights": ["insight1", "insight2"],
    "confidence": 0.0-1.0
  }
]

Only include topics with confidence > 0.7.`;

    try {
      const response = await this.config.llmService.chat({
        messages: [
          {
            role: 'system',
            content: 'You are an expert librarian AI that synthesizes knowledge from conversational fragments. Be thorough but precise.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        maxTokens: 4000
      });

      // Parse the JSON response
      const jsonMatch = response.content.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        logger.warn({ responsePreview: response.content.slice(200) }, 'Failed to parse librarian response');
        // Return empty analyses for all ACUs
        return acus.map(acu => ({
          acuId: acu.id,
          suggestedTopics: [],
          suggestedEntities: [],
          identityInsights: [],
          confidence: 0
        }));
      }

      const analyses: ACUAnalysis[] = JSON.parse(jsonMatch[0]);
      
      // Validate and normalize analyses
      return analyses.map(a => ({
        acuId: a.acuId || '',
        suggestedTopics: a.suggestedTopics || [],
        suggestedEntities: (a.suggestedEntities || []).map(e => ({
          name: e.name || '',
          type: e.type || 'unknown',
          facts: e.facts || []
        })),
        identityInsights: a.identityInsights || [],
        confidence: Math.max(0, Math.min(1, a.confidence || 0))
      }));
    } catch (error) {
      logger.error({ error: (error as Error).message }, 'Failed to analyze ACUs with GLM-4.7');
      // Return empty analyses on failure
      return acus.map(acu => ({
        acuId: acu.id,
        suggestedTopics: [],
        suggestedEntities: [],
        identityInsights: [],
        confidence: 0
      }));
    }
  }

  /**
   * Perform graph synthesis - create/update topics, entities, and identity
   */
  private async performGraphSynthesis(userId: string, analyses: ACUAnalysis[]): Promise<GraphSynthesisResult> {
    const result: GraphSynthesisResult = {
      topicsCreated: 0,
      topicsUpdated: 0,
      entitiesCreated: 0,
      entitiesUpdated: 0,
      identityUpdates: 0,
      bundlesMarkedDirty: 0
    };

    // Collect all topics and entities from analyses
    const topicMap = new Map<string, ACUAnalysis[]>();
    const entityMap = new Map<string, { analysis: ACUAnalysis; entity: ACUAnalysis['suggestedEntities'][0] }[]>();

    for (const analysis of analyses) {
      for (const topic of analysis.suggestedTopics) {
        if (!topicMap.has(topic)) {
          topicMap.set(topic, []);
        }
        topicMap.get(topic)!.push(analysis);
      }

      for (const entity of analysis.suggestedEntities) {
        const key = entity.name.toLowerCase();
        if (!entityMap.has(key)) {
          entityMap.set(key, []);
        }
        entityMap.get(key)!.push({ analysis, entity });
      }
    }

    // Process topics
    for (const [topicSlug, analysesWithTopic] of topicMap) {
      const existingTopic = await this.findOrCreateTopicProfile(userId, topicSlug);
      
      if (existingTopic.createdAt.getTime() === existingTopic.updatedAt.getTime()) {
        result.topicsCreated++;
      } else {
        result.topicsUpdated++;
      }

      // Update topic with aggregated insights
      await this.updateTopicProfile(existingTopic, analysesWithTopic);
    }

    // Process entities
    for (const [entityName, entityData] of entityMap) {
      const entity = entityData[0].entity;
      const existingEntity = await this.findOrCreateEntityProfile(userId, entity.name, entity.type);
      
      if (existingEntity.createdAt.getTime() === existingEntity.updatedAt.getTime()) {
        result.entitiesCreated++;
      } else {
        result.entitiesUpdated++;
      }

      // Update entity with aggregated facts
      await this.updateEntityProfile(existingEntity, entityData);
    }

    // Process identity insights
    const identityInsights = analyses
      .flatMap(a => a.identityInsights)
      .filter(i => i.length > 0);

    if (identityInsights.length > 0) {
      result.identityUpdates = await this.updateIdentityCore(userId, identityInsights);
    }

    return result;
  }

  /**
   * Find existing topic or create new one
   */
  private async findOrCreateTopicProfile(userId: string, slug: string): Promise<TopicProfile & { createdAt: Date; updatedAt: Date }> {
    const normalizedSlug = slug.toLowerCase().replace(/\s+/g, '-');

    // Check if topic exists
    const existing = await prisma.topicProfile.findFirst({
      where: { userId, slug: normalizedSlug }
    });

    if (existing) {
      return existing as TopicProfile & { createdAt: Date; updatedAt: Date };
    }

    // Create new topic profile
    const embedding = await this.config.embeddingService.embed(normalizedSlug);
    const label = slug.split(/[-_]/g).map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

    return prisma.topicProfile.create({
      data: {
        userId,
        slug: normalizedSlug,
        label,
        domain: 'personal',
        totalAcus: 0,
        totalConversations: 0,
        totalMessages: 0,
        totalTokensSpent: 0,
        avgSessionDepth: 0,
        firstEngagedAt: new Date(),
        lastEngagedAt: new Date(),
        engagementStreak: 1,
        importanceScore: 0.5,
        isDirty: true,
        embedding,
        metadata: { source: 'librarian', confidence: 'high' }
      }
    }) as Promise<TopicProfile & { createdAt: Date; updatedAt: Date }>;
  }

  /**
   * Update topic profile with aggregated insights from ACUs
   */
  private async updateTopicProfile(topic: TopicProfile, analyses: ACUAnalysis[]): Promise<void> {
    const insights = analyses.map(a => ({
      acuId: a.acuId,
      insight: `Confidence: ${a.confidence.toFixed(2)}`
    }));

    await prisma.topicProfile.update({
      where: { id: topic.id },
      data: {
        totalAcus: { increment: analyses.length },
        lastEngagedAt: new Date(),
        engagementStreak: { increment: 1 },
        relatedAcuIds: [...((topic.relatedAcuIds || []) as string[]), ...analyses.map(a => a.acuId)],
        metadata: {
          ...((topic.metadata as object) || {}),
          librarianInsights: insights,
          lastLibrarianUpdate: new Date().toISOString()
        }
      }
    });
  }

  /**
   * Find existing entity or create new one
   */
  private async findOrCreateEntityProfile(userId: string, name: string, type: string): Promise<EntityProfile & { createdAt: Date; updatedAt: Date }> {
    const normalizedName = name.trim();
    const normalizedType = type.toLowerCase();

    // Check if entity exists
    const existing = await prisma.entityProfile.findFirst({
      where: { userId, name: normalizedName, type: normalizedType }
    });

    if (existing) {
      return existing as EntityProfile & { createdAt: Date; updatedAt: Date };
    }

    // Create new entity profile
    const embedding = await this.config.embeddingService.embed(normalizedName);

    return prisma.entityProfile.create({
      data: {
        userId,
        name: normalizedName,
        type: normalizedType,
        relationship: null,
        sentiment: 0,
        facts: [],
        mentionCount: 0,
        conversationCount: 0,
        firstMentionedAt: new Date(),
        lastMentionedAt: new Date(),
        importanceScore: 0.5,
        isDirty: true,
        embedding,
        metadata: { source: 'librarian' }
      }
    }) as Promise<EntityProfile & { createdAt: Date; updatedAt: Date }>;
  }

  /**
   * Update entity profile with aggregated facts
   */
  private async updateEntityProfile(entity: EntityProfile, data: { analysis: ACUAnalysis; entity: ACUAnalysis['suggestedEntities'][0] }[]): Promise<void> {
    const existingFacts = ((entity.facts || []) as Array<{ text: string; sourceAcuId?: string }>)
      .map(f => f.text);

    const newFacts = data.flatMap(d => 
      d.entity.facts.map(fact => ({
        text: fact,
        sourceAcuId: d.analysis.acuId
      }))
    );

    const uniqueFacts = [...new Set([...existingFacts, ...newFacts.map(f => f.text)])];

    await prisma.entityProfile.update({
      where: { id: entity.id },
      data: {
        mentionCount: { increment: data.length },
        conversationCount: { increment: 1 },
        lastMentionedAt: new Date(),
        facts: uniqueFacts.map(text => ({ 
          text, 
          sourceAcuId: data.find(d => d.entity.facts.includes(text))?.analysis.acuId 
        })),
        metadata: {
          ...((entity.metadata as object) || {}),
          lastLibrarianUpdate: new Date().toISOString()
        }
      }
    });
  }

  /**
   * Update L0 Identity Core with user insights
   */
  private async updateIdentityCore(userId: string, insights: string[]): Promise<number> {
    // Find or create identity memory
    const identityMemory = await prisma.memory.findFirst({
      where: {
        userId,
        category: 'identity_core'
      }
    });

    if (!identityMemory) {
      await prisma.memory.create({
        data: {
          userId,
          content: `# Identity Core\n\n${insights.join('\n\n')}`,
          category: 'identity_core',
          importance: 0.9,
          metadata: {
            source: 'librarian',
            insightCount: insights.length
          }
        }
      });
      return 1;
    }

    // Update existing identity memory
    const existingContent = typeof identityMemory.content === 'string' 
      ? identityMemory.content 
      : JSON.stringify(identityMemory.content);

    const newContent = `${existingContent}\n\n## Librarian Insights (${new Date().toISOString()})\n\n${insights.join('\n\n')}`;

    await prisma.memory.update({
      where: { id: identityMemory.id },
      data: {
        content: newContent,
        importance: 0.9,
        metadata: {
          ...((identityMemory.metadata as object) || {}),
          lastLibrarianUpdate: new Date().toISOString(),
          insightCount: (insights.length)
        }
      }
    });

    return 1;
  }

  /**
   * Mark context bundles as dirty for recompilation
   */
  private async markBundlesDirty(userId: string, analyses: ACUAnalysis[]): Promise<number> {
    const topicIds = new Set<string>();
    const entityIds = new Set<string>();

    for (const analysis of analyses) {
      // Get topic IDs from analyses
      for (const topic of analysis.suggestedTopics) {
        const topicProfile = await prisma.topicProfile.findFirst({
          where: { userId, slug: topic.toLowerCase().replace(/\s+/g, '-') },
          select: { id: true }
        });
        if (topicProfile) {
          topicIds.add(topicProfile.id);
        }
      }

      // Get entity IDs from analyses
      for (const entity of analysis.suggestedEntities) {
        const entityProfile = await prisma.entityProfile.findFirst({
          where: { userId, name: entity.name, type: entity.type.toLowerCase() },
          select: { id: true }
        });
        if (entityProfile) {
          entityIds.add(entityProfile.id);
        }
      }
    }

    let markedCount = 0;

    // Mark topic bundles dirty
    for (const topicId of topicIds) {
      const result = await prisma.contextBundle.updateMany({
        where: { userId, bundleType: 'topic', topicProfileId: topicId },
        data: { isDirty: true }
      });
      markedCount += result.count;
    }

    // Mark entity bundles dirty
    for (const entityId of entityIds) {
      const result = await prisma.contextBundle.updateMany({
        where: { userId, bundleType: 'entity', entityProfileId: entityId },
        data: { isDirty: true }
      });
      markedCount += result.count;
    }

    // Mark identity core dirty
    await prisma.contextBundle.updateMany({
      where: { userId, bundleType: 'identity_core' },
      data: { isDirty: true }
    });

    return markedCount;
  }

  /**
   * Mark ACUs as processed by the librarian
   */
  private async markACUsProcessed(userId: string, analyses: ACUAnalysis[]): Promise<void> {
    const acuIds = analyses.map(a => a.acuId).filter(id => id.length > 0);

    if (acuIds.length === 0) return;

    // Update metadata to mark as processed by librarian using raw SQL
    await prisma.$executeRaw`
      UPDATE atomic_chat_units 
      SET metadata = jsonb_set(metadata, '{librarianProcessed}', 'true'::jsonb)
      WHERE id = ANY(${acuIds}::text[])
    `;
  }

  private isInCooldown(): boolean {
    const now = new Date();
    const cooldownEnd = new Date(this.lastRunTime!.getTime() + this.config.cooldownMinutes * 60 * 1000);
    return now < cooldownEnd;
  }

  private getEmptyResult(): GraphSynthesisResult {
    return {
      topicsCreated: 0,
      topicsUpdated: 0,
      entitiesCreated: 0,
      entitiesUpdated: 0,
      identityUpdates: 0,
      bundlesMarkedDirty: 0
    };
  }

  /**
   * Get worker status for monitoring
   */
  getStatus(): { enabled: boolean; lastRunTime: Date | null; cooldownMinutes: number } {
    return {
      enabled: this.config.enabled,
      lastRunTime: this.lastRunTime,
      cooldownMinutes: this.config.cooldownMinutes
    };
  }
}

export const librarianWorker = new LibrarianWorker();
