/**
 * Profile Rollup Service
 *
 * Periodically scans ACUs and clusters them into TopicProfiles and EntityProfiles.
 * This solves the "Ghost Profile" problem where TopicProfile and EntityProfile
 * tables are empty despite having many ACUs.
 */

import { getPrismaClient } from '../lib/database.js';
import { logger } from '../lib/logger.js';
import { EmbeddingService } from '../context/utils/embedding-service.js';

const prisma = getPrismaClient();

export interface ProfileRollupConfig {
  batchSize?: number;
  minACUsForTopic?: number;
  minACUsForEntity?: number;
  embeddingService?: any;
}

export class ProfileRollupService {
  private config: ProfileRollupConfig;
  private embeddingService: EmbeddingService;

  constructor(config: ProfileRollupConfig = {}) {
    this.config = {
      batchSize: 50,
      minACUsForTopic: 3,
      minACUsForEntity: 5,
      ...config
    };

    // Initialize embedding service
    this.embeddingService = new EmbeddingService();
  }

  /**
   * Main rollup method - processes unprocessed ACUs and updates profiles
   */
  async rollupProfiles(userId: string, limit?: number): Promise<{
    topicsCreated: number;
    topicsUpdated: number;
    entitiesCreated: number;
    entitiesUpdated: number;
    acusProcessed: number;
  }> {
    const log = logger.child({ userId });
    log.info({ limit }, 'Starting profile rollup');

    // Get unprocessed ACUs (those without embeddings, indicating they haven't been rolled up)
    const unprocessedACUs = await prisma.atomicChatUnit.findMany({
      where: {
        authorDid: userId,
        embedding: { isEmpty: true },
        state: 'ACTIVE'
      },
      orderBy: { createdAt: 'asc' },
      take: limit || this.config.batchSize
    });

    if (unprocessedACUs.length === 0) {
      log.info('No unprocessed ACUs found');
      return {
        topicsCreated: 0,
        topicsUpdated: 0,
        entitiesCreated: 0,
        entitiesUpdated: 0,
        acusProcessed: 0
      };
    }

    // Extract potential topics and entities from ACU content
    const { potentialTopics, potentialEntities } = await this.extractTopicsAndEntities(unprocessedACUs);

    // Generate embeddings in batch
    const embeddings = await this.generateEmbeddings(
      unprocessedACUs.map(acu => acu.content)
    );

    // Cluster ACUs into topics
    const { topicUpdates, entityUpdates } = await this.clusterACUs(
      unprocessedACUs,
      embeddings,
      potentialTopics,
      potentialEntities,
      userId
    );

    // Update ACUs with embeddings
    await this.updateACUsWithEmbeddings(unprocessedACUs, embeddings);

    log.info({
      topicsCreated: topicUpdates.created,
      topicsUpdated: topicUpdates.updated,
      entitiesCreated: entityUpdates.created,
      entitiesUpdated: entityUpdates.updated,
      acusProcessed: unprocessedACUs.length
    }, 'Profile rollup complete');

    return {
      topicsCreated: topicUpdates.created,
      topicsUpdated: topicUpdates.updated,
      entitiesCreated: entityUpdates.created,
      entitiesUpdated: entityUpdates.updated,
      acusProcessed: unprocessedACUs.length
    };
  }

  /**
   * Extract potential topics and entities from ACU content using simple heuristics
   * This is a lightweight approach - full semantic clustering would use GLMT-4.7
   */
  private async extractTopicsAndEntities(acus: any[]): Promise<{
    potentialTopics: Set<string>;
    potentialEntities: Set<{ name: string; type: string }>;
  }> {
    const potentialTopics = new Set<string>();
    const potentialEntities = new Set<{ name: string; type: string }>();

    // Simple keyword/topic detection
    const topicKeywords = [
      'react', 'vue', 'angular', 'typescript', 'javascript', 'python', 'rust', 'go',
      'node', 'express', 'next', 'nuxt', 'prisma', 'postgres', 'mongodb',
      'database', 'api', 'rest', 'graphql', 'grpc', 'microservices',
      'docker', 'kubernetes', 'aws', 'gcp', 'azure', 'vercel', 'netlify',
      'css', 'tailwind', 'styled-components', 'sass', 'less',
      'testing', 'jest', 'vitest', 'cypress', 'playwright',
      'security', 'auth', 'jwt', 'oauth', 'web3', 'blockchain',
      'machine learning', 'ai', 'llm', 'nlp', 'ml', 'deep learning'
    ];

    for (const acu of acus) {
      const content = acu.content.toLowerCase();

      // Detect topics from keywords
      for (const keyword of topicKeywords) {
        if (content.includes(keyword)) {
          potentialTopics.add(keyword);
        }
      }

      // Extract entities (capitalized words that might be names)
      const words = content.split(/\s+/);
      for (const word of words) {
        if (word.length > 2 && /^[A-Z]/.test(word)) {
          // Check if it's a known type
          const type = this.inferEntityType(word, content);
          potentialEntities.add({ name: word, type });
        }
      }
    }

    return { potentialTopics, potentialEntities };
  }

  /**
   * Infer entity type from context
   */
  private inferEntityType(word: string, content: string): string {
    const context = content.toLowerCase();

    if (context.includes('github') || context.includes('repository')) return 'tool';
    if (context.includes('framework') || context.includes('library')) return 'tool';
    if (context.includes('company') || context.includes('business')) return 'organization';
    if (context.includes('said') || context.includes('asked') || context.includes('told')) return 'person';

    return 'concept';
  }

  /**
   * Generate embeddings for ACU content
   */
  private async generateEmbeddings(texts: string[]): Promise<number[][]> {
    try {
      return await this.embeddingService.embedBatch(texts);
    } catch (error) {
      logger.error({ error: error.message }, 'Failed to generate embeddings');
      return texts.map(() => new Array(1536).fill(0));
    }
  }

  /**
   * Cluster ACUs into topics and entities, update profiles
   */
  private async clusterACUs(
    acus: any[],
    embeddings: number[][],
    potentialTopics: Set<string>,
    potentialEntities: Set<{ name: string; type: string }>,
    userId: string
  ): Promise<{
    topicUpdates: { created: number; updated: number };
    entityUpdates: { created: number; updated: number };
  }> {
    const topicUpdates = { created: 0, updated: 0 };
    const entityUpdates = { created: 0, updated: 0 };

    // Group ACUs by detected topics
    const topicACUs = new Map<string, any[]>();
    const entityACUs = new Map<string, any[]>();

    for (let i = 0; i < acus.length; i++) {
      const acu = acus[i];
      const topic = this.detectTopicForACU(acu, potentialTopics);
      const entity = this.detectEntityForACU(acu, potentialEntities);

      if (topic) {
        topicACUs.set(topic.slug, [...(topicACUs.get(topic.slug) || []), acu]);
      }

      if (entity) {
        entityACUs.set(entity.key, [...(entityACUs.get(entity.key) || []), acu]);
      }
    }

    // Create or update topic profiles
    for (const [slug, relatedACUs] of topicACUs.entries()) {
      if (relatedACUs.length < this.config.minACUsForTopic) {
        continue; // Not enough ACUs to create a topic
      }

      const existing = await prisma.topicProfile.findUnique({
        where: { userId_slug: { userId, slug } }
      });

      if (existing) {
        // Update existing topic
        await prisma.topicProfile.update({
          where: { id: existing.id },
          data: {
            totalAcus: { increment: relatedACUs.length },
            lastEngagedAt: new Date(),
            relatedAcuIds: [...(existing.relatedAcuIds || []), ...relatedACUs.map(acu => acu.id)],
            engagementStreak: existing.engagementStreak + 1
          }
        });
        topicUpdates.updated++;
      } else {
        // Create new topic
        const label = this.formatTopicLabel(slug);
        await prisma.topicProfile.create({
          data: {
            userId,
            slug,
            label,
            domain: this.inferTopicDomain(slug),
            totalAcus: relatedACUs.length,
            totalConversations: 1, // Will be incremented when linked to conversation
            totalMessages: relatedACUs.length,
            firstEngagedAt: new Date(),
            lastEngagedAt: new Date(),
            engagementStreak: 1,
            importanceScore: this.calculateTopicImportance(relatedACUs),
            isDirty: true
          }
        });
        topicUpdates.created++;
      }
    }

    // Create or update entity profiles
    for (const [key, relatedACUs] of entityACUs.entries()) {
      if (relatedACUs.length < this.config.minACUsForEntity) {
        continue;
      }

      const [name, type] = key.split(':');

      const existing = await prisma.entityProfile.findUnique({
        where: { userId_name_type: { userId, name, type } }
      });

      if (existing) {
        // Update existing entity
        await prisma.entityProfile.update({
          where: { id: existing.id },
          data: {
            mentionCount: { increment: relatedACUs.length },
            lastMentionedAt: new Date()
          }
        });
        entityUpdates.updated++;
      } else {
        // Create new entity
        const relationship = this.inferEntityRelationship(name, relatedACUs);
        await prisma.entityProfile.create({
          data: {
            userId,
            name,
            type,
            relationship,
            mentionCount: relatedACUs.length,
            firstMentionedAt: new Date(),
            lastMentionedAt: new Date(),
            importanceScore: this.calculateEntityImportance(relatedACUs),
            isDirty: true
          }
        });
        entityUpdates.created++;
      }
    }

    return { topicUpdates, entityUpdates };
  }

  /**
   * Detect which topic an ACU relates to
   */
  private detectTopicForACU(acu: any, potentialTopics: Set<string>): { slug: string | null } {
    const content = acu.content.toLowerCase();

    for (const topic of potentialTopics) {
      if (content.includes(topic)) {
        return { slug: topic.toLowerCase() };
      }
    }

    // Check existing topic tags on ACU
    if (acu.tags && acu.tags.length > 0) {
      return { slug: acu.tags[0].toLowerCase() };
    }

    return null;
  }

  /**
   * Detect which entity an ACU relates to
   */
  private detectEntityForACU(acu: any, potentialEntities: Set<{ name: string; type: string }>): { key: string | null } {
    const content = acu.content.toLowerCase();

    for (const entity of potentialEntities) {
      if (content.includes(entity.name.toLowerCase())) {
        return { key: `${entity.name}:${entity.type}` };
      }
    }

    return null;
  }

  /**
   * Update ACUs with embeddings
   */
  private async updateACUsWithEmbeddings(acus: any[], embeddings: number[][]): Promise<void> {
    for (let i = 0; i < acus.length; i++) {
      await prisma.atomicChatUnit.update({
        where: { id: acus[i].id },
        data: {
          embedding: embeddings[i],
          state: 'ACTIVE'
        }
      });
    }
  }

  /**
   * Format topic label from slug
   */
  private formatTopicLabel(slug: string): string {
    return slug
      .split(/[-_]/g)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Infer topic domain
   */
  private inferTopicDomain(slug: string): string {
    const techDomains = ['react', 'vue', 'angular', 'typescript', 'javascript', 'python', 'rust', 'go', 'node', 'prisma', 'postgres'];
    const businessDomains = ['finance', 'marketing', 'sales', 'hr', 'operations'];

    const lowerSlug = slug.toLowerCase();
    if (techDomains.some(d => lowerSlug.includes(d))) return 'engineering';
    if (businessDomains.some(d => lowerSlug.includes(d))) return 'business';
    return 'personal';
  }

  /**
   * Calculate topic importance score
   */
  private calculateTopicImportance(acus: any[]): number {
    if (acus.length === 0) return 0.5;

    const recentness = Date.now() - new Date(acus[acus.length - 1].createdAt).getTime();
    const ageHours = recentness / (1000 * 60 * 60);

    // Base score from quantity
    let score = Math.min(1.0, 0.1 + (acus.length * 0.05));

    // Boost for recency (more recent = higher importance)
    if (ageHours < 24) score += 0.3;
    else if (ageHours < 168) score += 0.1;

    // Normalize to 0-1
    return Math.min(1.0, score);
  }

  /**
   * Calculate entity importance score
   */
  private calculateEntityImportance(acus: any[]): number {
    if (acus.length === 0) return 0.5;

    const recentness = Date.now() - new Date(acus[acus.length - 1].createdAt).getTime();
    const ageHours = recentness / (1000 * 60 * 60);

    // Base score from quantity and content length
    const avgLength = acus.reduce((sum, acu) => sum + (acu.content?.length || 0), 0) / acus.length;
    let score = Math.min(1.0, 0.05 + (acus.length * 0.03) + (avgLength / 1000));

    // Boost for recency and type
    if (ageHours < 24) score += 0.2;
    if (acus[0].type === 'code') score += 0.2;

    return Math.min(1.0, score);
  }

  /**
   * Infer entity relationship
   */
  private inferEntityRelationship(name: string, acus: any[]): string | null {
    const content = acus.map(acu => acu.content).join(' ').toLowerCase();

    if (content.includes(`${name.toLowerCase()} is my`) || content.includes(`i work with ${name.toLowerCase()}`)) {
      return 'colleague';
    }
    if (content.includes(`${name.toLowerCase()} is`) || content.includes(`at ${name.toLowerCase()}`)) {
      return 'client';
    }
    if (content.includes('manager') || content.includes('director')) {
      return 'manager';
    }
    if (content.includes('friend') || content.includes('partner')) {
      return 'friend';
    }

    return null;
  }

  /**
   * Manually trigger rollup for a specific user
   */
  async triggerRollupForUser(userId: string): Promise<void> {
    await this.rollupProfiles(userId, 100);
  }

  /**
   * Get stats on profile state
   */
  async getProfileStats(userId: string): Promise<{
    topicProfiles: number;
    entityProfiles: number;
    acusWithoutEmbedding: number;
    acusWithEmbedding: number;
  }> {
    const [topicCount, entityCount, noEmbeddingCount, withEmbeddingCount] = await Promise.all([
      prisma.topicProfile.count({ where: { userId } }),
      prisma.entityProfile.count({ where: { userId } }),
      prisma.atomicChatUnit.count({ where: { authorDid: userId, embedding: { isEmpty: true } } }),
      prisma.atomicChatUnit.count({ where: { authorDid: userId, embedding: { isEmpty: false } } })
    ]);

    return {
      topicProfiles: topicCount,
      entityProfiles: entityCount,
      acusWithoutEmbedding: noEmbeddingCount,
      acusWithEmbedding: withEmbeddingCount
    };
  }
}

export const profileRollupService = new ProfileRollupService();
