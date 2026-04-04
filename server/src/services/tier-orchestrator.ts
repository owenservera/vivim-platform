import { getPrismaClient } from '../lib/database.js';
import { logger } from '../lib/logger.js';
import { streamingImportService } from './streaming-import-service.js';
import { generateACUsFromConversation } from './acu-generator.js';
import { createHash } from 'crypto';
import { createReadStream } from 'fs';
import {
  DEFAULT_TIER_CONFIG,
  DEFAULT_INTELLIGENT_OPTIONS,
  type ImportTierConfig,
  type IntelligentOptions,
  type ImportTier,
  type TierProgress,
  type ImportJobProgress,
} from './import-types.js';

const log = logger.child({ service: 'tier-orchestrator' });

const TIER_ORDER: ImportTier[] = [
  'TIER_0_CORE',
  'TIER_1_ACU',
  'TIER_2_MEMORY',
  'TIER_3_CONTEXT',
  'TIER_4_INDEX',
];

export class TierOrchestrator {
  private prisma = getPrismaClient();

  private async calculateFileHash(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const hash = createHash('sha256');
      const stream = createReadStream(filePath);
      
      stream.on('data', data => hash.update(data));
      stream.on('end', () => resolve(hash.digest('hex')));
      stream.on('error', reject);
    });
  }

  async startImportWithTiers(
    userId: string,
    filePath: string,
    tierConfig: ImportTierConfig = DEFAULT_TIER_CONFIG,
    intelligentOptions: IntelligentOptions = DEFAULT_INTELLIGENT_OPTIONS
  ): Promise<ImportJobProgress> {
    const { v4: uuidv4 } = await import('uuid');
    const jobId = uuidv4();

    const scanResult = await streamingImportService.scanImportFile(filePath);
    const fileHash = await this.calculateFileHash(filePath);

    const importJob = await this.prisma.importJob.create({
      data: {
        id: jobId,
        userId,
        status: 'PROCESSING',
        tierConfig: tierConfig as any,
        currentTier: 'TIER_0_CORE',
        tierProgress: this.initializeTierProgress() as any,
        sourceProvider: scanResult.providers[0] || 'chatgpt',
        format: 'chatgpt-export',
        fileHash,
        fileName: filePath.split('/').pop() || 'import.zip',
        filePath,
        fileSize: scanResult.estimatedSize,
        totalConversations: scanResult.totalConversations,
        startedAt: new Date(),
        metadata: {
          scanResult,
          intelligentOptions,
        } as any,
      },
    });

    this.runImportAsync(jobId, tierConfig, intelligentOptions);

    return this.getJobProgress(jobId);
  }

  private async runImportAsync(
    jobId: string,
    config: ImportTierConfig,
    options: IntelligentOptions
  ): Promise<void> {
    try {
      const job = await this.prisma.importJob.findUnique({ where: { id: jobId } });
      if (!job || !job.filePath) {
        throw new Error('Job or file path not found');
      }

      let conversations: any[] = [];

      for (const tier of TIER_ORDER) {
        const tierConfig = this.getTierConfig(tier, config);
        
        if (!tierConfig?.enabled) {
          continue;
        }

        await this.updateJobStatus(jobId, 'PROCESSING', tier);

        switch (tier) {
          case 'TIER_0_CORE':
            conversations = await this.runTier0(job, tierConfig);
            break;
          case 'TIER_1_ACU':
            await this.runTier1(conversations, tierConfig, jobId);
            break;
          case 'TIER_2_MEMORY':
            await this.runTier2(conversations, tierConfig, jobId);
            break;
          case 'TIER_3_CONTEXT':
            await this.runTier3(conversations, tierConfig, jobId);
            break;
          case 'TIER_4_INDEX':
            await this.runTier4(conversations, tierConfig, jobId);
            break;
        }

        await this.markTierComplete(jobId, tier);

        const currentJob = await this.prisma.importJob.findUnique({ where: { id: jobId } });
        if (currentJob?.status === 'PAUSED') {
          log.info({ jobId, tier }, 'Import paused by user');
          break;
        }
      }

      const finalJob = await this.prisma.importJob.findUnique({ where: { id: jobId } });
      if (finalJob?.status !== 'PAUSED') {
        await this.prisma.importJob.update({
          where: { id: jobId },
          data: {
            status: 'COMPLETED',
            completedAt: new Date(),
          },
        });
      }
    } catch (error) {
      log.error({ jobId, error: error instanceof Error ? error.message : 'Unknown' }, 'Import failed');
      
      await this.prisma.importJob.update({
        where: { id: jobId },
        data: {
          status: 'FAILED',
          completedAt: new Date(),
          errors: {
            push: {
              stage: 'orchestrator',
              message: error instanceof Error ? error.message : 'Unknown error',
              timestamp: new Date().toISOString(),
            },
          } as any,
        },
      });
    }
  }

  private async runTier0(job: any, config: any): Promise<any[]> {
    const stored: any[] = [];
    const prisma = getPrismaClient();
    let processedCount = 0;

    for await (const result of streamingImportService.streamProcessConversations(
      job.filePath,
      { tier0: config } as ImportTierConfig,
      job.id
    )) {
      if (result.success && result.conversationId) {
        const conversation = await prisma.conversation.findUnique({
          where: { id: result.conversationId },
          select: { id: true, ownerId: true },
        });
        if (conversation) {
          stored.push(conversation);
        }
        processedCount++;
      }

      await prisma.importJob.update({
        where: { id: job.id },
        data: {
          processedConversations: { increment: 1 },
        },
      });

      // Update tier progress every 10 conversations
      if (processedCount % 10 === 0) {
        await this.updateTierProgress(job.id, 'TIER_0_CORE', {
          progress: Math.round((processedCount / job.totalConversations) * 100),
          conversationsProcessed: processedCount,
          totalConversations: job.totalConversations,
        });
      }
    }

    // Final progress update
    await this.updateTierProgress(job.id, 'TIER_0_CORE', {
      progress: 100,
      conversationsProcessed: processedCount,
      totalConversations: job.totalConversations,
    });

    return stored;
  }

  private async runTier1(conversations: any[], config: any, jobId: string): Promise<void> {
    const prisma = getPrismaClient();
    let acuGenerated = 0;
    const totalConversations = conversations.length;

    log.info({ jobId, conversationCount: totalConversations }, 'Starting Tier 1 ACU generation');

    for (let i = 0; i < conversations.length; i++) {
      const conv = conversations[i];
      
      try {
        const conversation = await prisma.conversation.findUnique({
          where: { id: conv.id },
          include: { messages: true },
        });

        if (!conversation) {
          log.warn({ conversationId: conv.id }, 'Conversation not found');
          continue;
        }

        const acus = await generateACUsFromConversation(conversation, prisma);
        acuGenerated += acus.length;

        await prisma.importedConversation.updateMany({
          where: { conversationId: conv.id },
          data: { state: 'ACU_GENERATED' as any },
        });

        if ((i + 1) % 10 === 0 || i === conversations.length - 1) {
          await this.updateTierProgress(jobId, 'TIER_1_ACU', {
            progress: Math.round(((i + 1) / totalConversations) * 100),
            conversationsProcessed: i + 1,
            tierSpecificProgress: acuGenerated,
          });

          await prisma.importJob.update({
            where: { id: jobId },
            data: { acuGenerated },
          });
        }
      } catch (error) {
        log.error({ 
          conversationId: conv.id, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        }, 'Failed to generate ACUs for conversation');
      }
    }

    log.info({ jobId, acuGenerated }, 'Tier 1 ACU generation completed');
  }

  private async runTier2(conversations: any[], config: any, jobId: string): Promise<void> {
    const prisma = getPrismaClient();
    let memoriesExtracted = 0;
    const totalConversations = conversations.length;

    log.info({ jobId, conversationCount: totalConversations }, 'Starting Tier 2 Memory extraction');

    for (let i = 0; i < conversations.length; i++) {
      const conv = conversations[i];
      
      try {
        const acus = await prisma.atomicChatUnit.findMany({
          where: { conversationId: conv.id },
        });

        for (const acu of acus) {
          const extractedFacts = this.extractFactsFromACU(acu);
          
          if (extractedFacts.length > 0) {
            await prisma.memory.createMany({
              data: extractedFacts.map(fact => ({
                userId: conv.ownerId,
                content: fact.content,
                summary: fact.summary,
                memoryType: 'SEMANTIC' as any,
                category: fact.category,
                importance: fact.importance,
                tags: ['imported', 'auto-extracted', acu.type],
                metadata: {
                  sourceAcuId: acu.id,
                  sourceConversationId: conv.id,
                  extractedAt: new Date().toISOString(),
                },
              })),
            });
            memoriesExtracted += extractedFacts.length;
          }
        }

        await prisma.importedConversation.updateMany({
          where: { conversationId: conv.id },
          data: { state: 'MEMORY_EXTRACTED' as any },
        });

        if ((i + 1) % 10 === 0 || i === conversations.length - 1) {
          await this.updateTierProgress(jobId, 'TIER_2_MEMORY', {
            progress: Math.round(((i + 1) / totalConversations) * 100),
            conversationsProcessed: i + 1,
            tierSpecificProgress: memoriesExtracted,
          });

          await prisma.importJob.update({
            where: { id: jobId },
            data: { memoriesExtracted },
          });
        }
      } catch (error) {
        log.error({ 
          conversationId: conv.id, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        }, 'Failed to extract memories for conversation');
      }
    }

    log.info({ jobId, memoriesExtracted }, 'Tier 2 Memory extraction completed');
  }

  private extractFactsFromACU(acu: any): Array<{content: string; summary: string; category: string; importance: number}> {
    const facts: Array<{content: string; summary: string; category: string; importance: number}> = [];
    const content = acu.content || '';
    
    if (content.length < 20) return facts;

    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10);
    
    for (const sentence of sentences.slice(0, 3)) {
      const trimmed = sentence.trim();
      if (trimmed.length > 20) {
        facts.push({
          content: trimmed,
          summary: trimmed.substring(0, 100) + (trimmed.length > 100 ? '...' : ''),
          category: this.categorizeContent(trimmed),
          importance: 0.5,
        });
      }
    }

    return facts;
  }

  private categorizeContent(content: string): string {
    const lower = content.toLowerCase();
    if (lower.includes('prefer') || lower.includes('like') || lower.includes('hate') || lower.includes('want')) {
      return 'preference';
    }
    if (lower.includes('name') || lower.includes('email') || lower.includes('phone') || lower.includes('address')) {
      return 'fact';
    }
    if (lower.includes('goal') || lower.includes('want to') || lower.includes('plan to') || lower.includes('will')) {
      return 'goal';
    }
    return 'knowledge';
  }

  private async runTier3(conversations: any[], config: any, jobId: string): Promise<void> {
    const prisma = getPrismaClient();
    let contextEnriched = 0;
    const totalConversations = conversations.length;
    const mergeStrategy = config.mergeStrategy || 'conservative';

    log.info({ jobId, conversationCount: totalConversations, mergeStrategy }, 'Starting Tier 3 Context Enrichment');

    for (let i = 0; i < conversations.length; i++) {
      const conv = conversations[i];
      
      try {
        const memories = await prisma.memory.findMany({
          where: { 
            metadata: { path: ['sourceConversationId'], equals: conv.id } 
          },
        });

        const topics = this.extractTopicsFromMemories(memories);
        const entities = this.extractEntitiesFromMemories(memories);

        if (config.updateTopics && topics.length > 0) {
          for (const topic of topics) {
            await prisma.topicProfile.upsert({
              where: { userId_topic: { userId: conv.ownerId, topic: topic.name } },
              create: {
                userId: conv.ownerId,
                topic: topic.name,
                frequency: topic.count,
                lastMentioned: new Date(),
                metadata: {
                  sourceConversationIds: [conv.id],
                  imported: true,
                },
              },
              update: {
                frequency: mergeStrategy === 'aggressive' 
                  ? { increment: topic.count }
                  : undefined,
                lastMentioned: new Date(),
                metadata: {
                  path: ['sourceConversationIds'],
                  array_union: [conv.id],
                },
              },
            });
          }
          contextEnriched += topics.length;
        }

        if (config.updateEntities && entities.length > 0) {
          for (const entity of entities) {
            await prisma.entityProfile.upsert({
              where: { userId_entity: { userId: conv.ownerId, entity: entity.name } },
              create: {
                userId: conv.ownerId,
                entity: entity.name,
                entityType: entity.type,
                mentionCount: entity.count,
                lastMentioned: new Date(),
                metadata: {
                  sourceConversationIds: [conv.id],
                  imported: true,
                },
              },
              update: {
                mentionCount: mergeStrategy === 'aggressive'
                  ? { increment: entity.count }
                  : undefined,
                lastMentioned: new Date(),
              },
            });
          }
          contextEnriched += entities.length;
        }

        await prisma.importedConversation.updateMany({
          where: { conversationId: conv.id },
          data: { state: 'CONTEXT_ENRICHED' as any },
        });

        if ((i + 1) % 10 === 0 || i === conversations.length - 1) {
          await this.updateTierProgress(jobId, 'TIER_3_CONTEXT', {
            progress: Math.round(((i + 1) / totalConversations) * 100),
            conversationsProcessed: i + 1,
            tierSpecificProgress: contextEnriched,
          });

          await prisma.importJob.update({
            where: { id: jobId },
            data: { contextEnriched },
          });
        }
      } catch (error) {
        log.error({ 
          conversationId: conv.id, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        }, 'Failed to enrich context for conversation');
      }
    }

    log.info({ jobId, contextEnriched }, 'Tier 3 Context Enrichment completed');
  }

  private extractTopicsFromMemories(memories: any[]): Array<{name: string; count: number}> {
    const topicMap = new Map<string, number>();

    // Configurable topic keywords - can be moved to environment variables or config file
    const topicKeywords = [
      // Programming languages
      ...this.getConfiguredTopics('languages', [
        'javascript', 'typescript', 'python', 'java', 'cpp', 'go', 'rust', 'ruby', 'php', 'swift', 'kotlin'
      ]),
      // Frameworks & libraries
      ...this.getConfiguredTopics('frameworks', [
        'react', 'angular', 'vue', 'svelte', 'nextjs', 'nuxt', 'express', 'fastapi', 'django', 'flask'
      ]),
      // Infrastructure
      ...this.getConfiguredTopics('infrastructure', [
        'docker', 'kubernetes', 'aws', 'gcp', 'azure', 'terraform', 'ansible', 'jenkins', 'gitlab', 'github'
      ]),
      // Databases
      ...this.getConfiguredTopics('databases', [
        'postgresql', 'mysql', 'mongodb', 'redis', 'elasticsearch', 'sqlite', 'prisma', 'sequelize', 'typeorm'
      ]),
      // General tech topics
      ...this.getConfiguredTopics('topics', [
        'api', 'rest', 'graphql', 'webhook', 'authentication', 'authorization', 'oauth', 'jwt', 'testing',
        'deployment', 'architecture', 'microservices', 'serverless', 'security', 'performance', 'optimization'
      ])
    ];

    for (const memory of memories) {
      const content = (memory.content || '').toLowerCase();
      for (const keyword of topicKeywords) {
        if (content.includes(keyword)) {
          topicMap.set(keyword, (topicMap.get(keyword) || 0) + 1);
        }
      }
    }

    return Array.from(topicMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  private getConfiguredTopics(category: string, defaultTopics: string[]): string[] {
    // Allow override via environment variables
    const envKey = `IMPORT_TOPICS_${category.toUpperCase()}`;
    const envValue = process.env[envKey];

    if (envValue) {
      try {
        return JSON.parse(envValue);
      } catch (error) {
        log.warn({ envKey, error: error.message }, 'Failed to parse topics from environment, using defaults');
        return defaultTopics;
      }
    }

    return defaultTopics;
  }

  private extractEntitiesFromMemories(memories: any[]): Array<{name: string; type: string; count: number}> {
    const entityMap = new Map<string, {type: string; count: number}>();
    const emailRegex = /[\w.-]+@[\w.-]+\.\w+/g;
    const urlRegex = /https?:\/\/[^\s]+/g;
    
    for (const memory of memories) {
      const content = memory.content || '';
      
      const emails = content.match(emailRegex) || [];
      for (const email of emails) {
        const existing = entityMap.get(email) || { type: 'email', count: 0 };
        existing.count++;
        entityMap.set(email, existing);
      }

      const urls = content.match(urlRegex) || [];
      for (const url of urls) {
        const existing = entityMap.get(url) || { type: 'url', count: 0 };
        existing.count++;
        entityMap.set(url, existing);
      }
    }

    return Array.from(entityMap.entries())
      .map(([name, { type, count }]) => ({ name, type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);
  }

  private async runTier4(conversations: any[], config: any, jobId: string): Promise<void> {
    const prisma = getPrismaClient();
    const totalConversations = conversations.length;
    const isAsync = config.async ?? true;
    const priority = config.priority || 'low';

    log.info({ jobId, conversationCount: totalConversations, isAsync, priority }, 'Starting Tier 4 Index Building');

    if (isAsync) {
      this.buildIndexesAsync(jobId, conversations, config);
      await this.updateTierProgress(jobId, 'TIER_4_INDEX', {
        progress: 100,
        conversationsProcessed: totalConversations,
        tierSpecificProgress: totalConversations,
        stats: { status: 'queued' },
      });
      log.info({ jobId }, 'Tier 4 Index Building queued for async processing');
      return;
    }

    for (let i = 0; i < conversations.length; i++) {
      const conv = conversations[i];
      
      try {
        await this.buildConversationIndex(conv, prisma);

        await prisma.importedConversation.updateMany({
          where: { conversationId: conv.id },
          data: { state: 'INDEXED' as any },
        });

        if ((i + 1) % 20 === 0 || i === conversations.length - 1) {
          await this.updateTierProgress(jobId, 'TIER_4_INDEX', {
            progress: Math.round(((i + 1) / totalConversations) * 100),
            conversationsProcessed: i + 1,
            tierSpecificProgress: i + 1,
          });
        }
      } catch (error) {
        log.error({ 
          conversationId: conv.id, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        }, 'Failed to build index for conversation');
      }
    }

    log.info({ jobId, indexed: totalConversations }, 'Tier 4 Index Building completed');
  }

  private async buildConversationIndex(conversation: any, prisma: any): Promise<void> {
    const searchIndex = {
      conversationId: conversation.id,
      title: conversation.title,
      provider: conversation.provider,
      messageCount: conversation.messageCount,
      createdAt: conversation.createdAt?.toISOString(),
      searchableText: await this.generateSearchableText(conversation.id, prisma),
      indexedAt: new Date().toISOString(),
    };

    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { 
        metadata: {
          path: ['searchIndex'],
          ...searchIndex,
        },
      },
    });
  }

  private async generateSearchableText(conversationId: string, prisma: any): Promise<string> {
    const messages = await prisma.message.findMany({
      where: { conversationId },
      select: { parts: true },
    });

    return messages
      .flatMap(m => m.parts || [])
      .filter(p => p.type === 'text')
      .map(p => p.content)
      .join(' ')
      .substring(0, 10000);
  }

  private async buildIndexesAsync(jobId: string, conversations: any[], config: any): Promise<void> {
    setTimeout(async () => {
      const prisma = getPrismaClient();
      
      try {
        for (const conv of conversations) {
          await this.buildConversationIndex(conv, prisma);
        }

        await prisma.importJob.update({
          where: { id: jobId },
          data: { 
            tierProgress: {
              TIER_4_INDEX: {
                status: 'COMPLETED',
                progress: 100,
              },
            } as any,
          },
        });
        
        log.info({ jobId }, 'Async index building completed');
      } catch (error) {
        log.error({ jobId, error: error instanceof Error ? error.message : 'Unknown' }, 'Async index building failed');
      }
    }, 1000);
  }

  private getTierConfig(tier: ImportTier, config: ImportTierConfig): any {
    switch (tier) {
      case 'TIER_0_CORE': return config.tier0;
      case 'TIER_1_ACU': return config.tier1;
      case 'TIER_2_MEMORY': return config.tier2;
      case 'TIER_3_CONTEXT': return config.tier3;
      case 'TIER_4_INDEX': return config.tier4;
    }
  }

  private initializeTierProgress(): Record<ImportTier, TierProgress> {
    const progress: Partial<Record<ImportTier, TierProgress>> = {};
    
    for (const tier of TIER_ORDER) {
      progress[tier] = {
        status: 'PENDING',
        progress: 0,
        conversationsProcessed: 0,
        totalConversations: 0,
      };
    }

    return progress as Record<ImportTier, TierProgress>;
  }

  async updateJobStatus(jobId: string, status: string, currentTier: ImportTier): Promise<void> {
    await this.prisma.importJob.update({
      where: { id: jobId },
      data: {
        status: status as any,
        currentTier,
      },
    });
  }

  async markTierComplete(jobId: string, tier: ImportTier): Promise<void> {
    const job = await this.prisma.importJob.findUnique({ where: { id: jobId } });
    if (!job) return;

    const tierProgress = (job.tierProgress as Record<string, any>) || {};
    tierProgress[tier] = {
      ...tierProgress[tier],
      status: 'COMPLETED',
      progress: 100,
    };

    const currentTierIndex = TIER_ORDER.indexOf(tier);
    const nextTier = TIER_ORDER[currentTierIndex + 1];

    await this.prisma.importJob.update({
      where: { id: jobId },
      data: {
        tierProgress: tierProgress as any,
        currentTier: nextTier || null,
        status: nextTier ? 'TIER_COMPLETE' : 'COMPLETED',
      },
    });
  }

  async updateTierProgress(jobId: string, tier: ImportTier, progress: Partial<TierProgress>): Promise<void> {
    const job = await this.prisma.importJob.findUnique({ where: { id: jobId } });
    if (!job) return;

    const tierProgress = (job.tierProgress as Record<string, any>) || {};
    tierProgress[tier] = {
      ...tierProgress[tier],
      ...progress,
      status: 'PROCESSING',
    };

    await this.prisma.importJob.update({
      where: { id: jobId },
      data: {
        tierProgress: tierProgress as any,
      },
    });
  }

  async getJobProgress(jobId: string): Promise<ImportJobProgress | null> {
    const job = await this.prisma.importJob.findUnique({ where: { id: jobId } });
    if (!job) return null;

    const tierProgress = (job.tierProgress as Record<ImportTier, TierProgress>) || 
      this.initializeTierProgress();

    return {
      id: job.id,
      status: job.status as any,
      currentTier: job.currentTier as ImportTier | null,
      tiers: tierProgress,
      fileName: job.fileName,
      totalConversations: job.totalConversations,
      processedConversations: job.processedConversations,
      failedConversations: job.failedConversations,
      acuGenerated: job.acuGenerated,
      memoriesExtracted: job.memoriesExtracted,
      contextEnriched: job.contextEnriched,
      startedAt: job.startedAt,
      completedAt: job.completedAt,
      createdAt: job.createdAt,
      errors: (job.errors as any[]) || [],
    };
  }

  async pauseImportJob(jobId: string): Promise<void> {
    await this.prisma.importJob.update({
      where: { id: jobId },
      data: { status: 'PAUSED' },
    });
  }

  async resumeImportJob(jobId: string): Promise<void> {
    const job = await this.prisma.importJob.findUnique({ where: { id: jobId } });
    if (!job) throw new Error('Job not found');
    if (job.status !== 'PAUSED') {
      throw new Error('Job is not paused');
    }

    const config = (job.tierConfig as ImportTierConfig) || DEFAULT_TIER_CONFIG;
    const options = ((job.metadata as any)?.intelligentOptions) || DEFAULT_INTELLIGENT_OPTIONS;

    await this.prisma.importJob.update({
      where: { id: jobId },
      data: { status: 'PROCESSING' },
    });

    this.runImportAsync(jobId, config, options);
  }

  async runSpecificTier(jobId: string, tier: ImportTier): Promise<void> {
    const job = await this.prisma.importJob.findUnique({ where: { id: jobId } });
    if (!job) throw new Error('Job not found');

    const config = (job.tierConfig as ImportTierConfig) || DEFAULT_TIER_CONFIG;
    const tierConfig = this.getTierConfig(tier, config);
    
    if (!tierConfig) {
      throw new Error(`Tier ${tier} is not enabled`);
    }

    await this.updateJobStatus(jobId, 'PROCESSING', tier);

    const conversations = await this.prisma.conversation.findMany({
      where: {
        metadata: {
          path: ['importJobId'],
          equals: jobId,
        },
      },
      select: { id: true },
    });

    switch (tier) {
      case 'TIER_1_ACU':
        await this.runTier1(conversations, tierConfig, jobId);
        break;
      case 'TIER_2_MEMORY':
        await this.runTier2(conversations, tierConfig, jobId);
        break;
      case 'TIER_3_CONTEXT':
        await this.runTier3(conversations, tierConfig, jobId);
        break;
      case 'TIER_4_INDEX':
        await this.runTier4(conversations, tierConfig, jobId);
        break;
      default:
        throw new Error(`Tier ${tier} cannot be run independently`);
    }

    await this.markTierComplete(jobId, tier);
  }
}

export const tierOrchestrator = new TierOrchestrator();
export default tierOrchestrator;
