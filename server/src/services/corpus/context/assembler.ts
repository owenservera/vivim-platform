/**
 * Corpus Context Assembler
 * 
 * Assembles corpus context from 5 layers (C0-C4):
 * - C0: Company Identity Core
 * - C1: Topic Framework
 * - C2: Retrieved Knowledge (primary)
 * - C3: Supporting Context
 * - C4: Freshness & Changelog
 * 
 * @created March 27, 2026
 */

import { PrismaClient } from '@prisma/client';
import {
  CorpusAssemblyParams,
  AssembledCorpusContext,
  CompiledLayer,
  Citation,
  UserAvatar,
} from '../../../types/corpus';
import { CorpusRetrievalService } from '../retrieval-service';
import { logger } from '../../../lib/logger';

interface CorpusContextAssemblerConfig {
  prisma: PrismaClient;
  retrievalService: CorpusRetrievalService;
  embeddingService: {
    embed: (text: string) => Promise<number[]>;
  };
}

export class CorpusContextAssembler {
  private prisma: PrismaClient;
  private retrievalService: CorpusRetrievalService;
  private embeddingService: CorpusContextAssemblerConfig['embeddingService'];

  constructor(config: CorpusContextAssemblerConfig) {
    this.prisma = config.prisma;
    this.retrievalService = config.retrievalService;
    this.embeddingService = config.embeddingService;
  }

  /**
   * Assemble corpus context from all layers
   */
  async assemble(params: CorpusAssemblyParams): Promise<AssembledCorpusContext> {
    const startTime = Date.now();
    logger.info({ query: params.query.substring(0, 50) }, 'Assembling corpus context');

    try {
      // Generate query embedding
      const queryEmbedding = await this.embeddingService.embed(params.query);

      // Assemble each layer
      const [C0, C1, C2, C3, C4] = await Promise.all([
        this.assembleC0(params.tenantId),
        this.assembleC1(params.tenantId, queryEmbedding),
        this.assembleC2(params, queryEmbedding),
        this.assembleC3(params, queryEmbedding, C2),
        this.assembleC4(params.tenantId, C2),
      ]);

      // Compile final prompt
      const compiledPrompt = this.compilePrompt({ C0, C1, C2, C3, C4 });

      // Calculate total tokens
      const totalTokens = this.estimateTokens(compiledPrompt);

      // Generate citations
      const citations = C2.citations || [];

      const metadata = {
        retrievalTimeMs: Date.now() - startTime,
        chunksConsidered: C2.metadata?.chunksConsidered || 0,
        chunksUsed: C2.metadata?.chunksUsed || 0,
        topicsCovered: this.extractTopicsCovered(C1, C2),
        freshnessInfo: C4.content ? 'Recent updates available' : null,
      };

      logger.info(
        { totalTokens, chunksUsed: metadata.chunksUsed, retrievalTimeMs: metadata.retrievalTimeMs },
        'Corpus context assembled'
      );

      return {
        compiledPrompt,
        layers: { C0, C1, C2, C3, C4 },
        totalTokens,
        citations,
        confidence: C2.confidence,
        metadata,
      };
    } catch (error) {
      logger.error({ error: (error as Error).message }, 'Corpus context assembly failed');
      throw error;
    }
  }

  /**
   * C0: Company Identity Core
   * Fixed identity information for the company
   */
  async assembleC0(tenantId: string): Promise<CompiledLayer> {
    try {
      const tenant = await this.prisma.tenant.findUnique({
        where: { id: tenantId },
        select: {
          name: true,
          chatbotConfig: true,
          brandVoice: true,
          guardrails: true,
        },
      });

      if (!tenant) {
        return this.getDefaultC0();
      }

      const config = tenant.chatbotConfig as any;
      const brandVoice = tenant.brandVoice as any;

      const content = this.formatCompanyIdentity({
        companyName: config?.companyName || tenant.name,
        productName: config?.productName || tenant.name + ' Platform',
        productDescription: config?.productDescription || 'Our platform',
        brandVoice: brandVoice || { tone: 'professional', formality: 'neutral', personality: ['helpful'] },
        guardrails: tenant.guardrails || [],
        escalationInstructions: config?.escalationInstructions || '',
        answerStyle: config?.answerStyle || 'concise',
        citeSources: config?.citeSources ?? true,
        suggestRelated: config?.suggestRelated ?? true,
        proactiveHelp: config?.proactiveHelp ?? true,
      });

      return {
        content,
        tokens: this.estimateTokens(content),
      };
    } catch (error) {
      logger.warn({ error: (error as Error).message }, 'C0 assembly failed, using default');
      return this.getDefaultC0();
    }
  }

  /**
   * C1: Topic Framework
   * Relevant topic taxonomy and navigation hints
   */
  async assembleC1(tenantId: string, queryEmbedding: number[]): Promise<CompiledLayer> {
    try {
      // Find relevant topics via semantic search
      const topics = await this.prisma.$queryRaw<any[]>`
        SELECT id, slug, name, path, depth,
          1 - (embedding <=> ${queryEmbedding}::vector) as similarity
        FROM "corpus_topics"
        WHERE "tenantId" = ${tenantId}
          AND "isActive" = true
          AND embedding IS NOT NULL
        ORDER BY embedding <=> ${queryEmbedding}::vector
        LIMIT 3
      `;

      if (topics.length === 0) {
        return this.getDefaultC1();
      }

      const content = this.formatTopicFramework(topics);

      return {
        content,
        tokens: this.estimateTokens(content),
      };
    } catch (error) {
      logger.warn({ error: (error as Error).message }, 'C1 assembly failed, using default');
      return this.getDefaultC1();
    }
  }

  /**
   * C2: Retrieved Knowledge (Primary)
   * Top-ranked corpus chunks from retrieval
   */
  async assembleC2(
    params: CorpusAssemblyParams,
    queryEmbedding: number[]
  ): Promise<CompiledLayer> {
    try {
      const retrievalResult = await this.retrievalService.retrieve({
        tenantId: params.tenantId,
        query: params.query,
        queryEmbedding,
        topicSlugs: params.topicSlugs,
        maxResults: 10,
        finalResults: 5,
      });

      const content = this.formatRetrievedKnowledge(retrievalResult.chunks);
      const citations = retrievalResult.citations;

      return {
        content,
        tokens: this.estimateTokens(content),
        citations,
        metadata: {
          chunksConsidered: retrievalResult.totalCandidates,
          chunksUsed: retrievalResult.chunks.length,
        },
        confidence: retrievalResult.confidence,
      };
    } catch (error) {
      logger.warn({ error: (error as Error).message }, 'C2 assembly failed');
      return {
        content: '',
        tokens: 0,
        citations: [],
        confidence: 0,
      };
    }
  }

  /**
   * C3: Supporting Context
   * Related chunks and cross-references
   */
  async assembleC3(
    params: CorpusAssemblyParams,
    queryEmbedding: number[],
    C2: CompiledLayer
  ): Promise<CompiledLayer> {
    try {
      // Get additional supporting chunks (lower ranked but still relevant)
      const retrievalResult = await this.retrievalService.retrieve({
        tenantId: params.tenantId,
        query: params.query,
        queryEmbedding,
        maxResults: 15,
        finalResults: 3,
      });

      // Filter out chunks already in C2
      const c2ChunkIds = new Set(C2.metadata?.chunksUsed || []);
      const supportingChunks = retrievalResult.chunks.filter(
        c => !c2ChunkIds.has(c.chunk.id)
      ).slice(0, 3);

      if (supportingChunks.length === 0) {
        return { content: '', tokens: 0 };
      }

      const content = this.formatSupportingContext(supportingChunks);

      return {
        content,
        tokens: this.estimateTokens(content),
      };
    } catch (error) {
      logger.warn({ error: (error as Error).message }, 'C3 assembly failed');
      return { content: '', tokens: 0 };
    }
  }

  /**
   * C4: Freshness & Changelog
   * Recent updates and version changes
   */
  async assembleC4(tenantId: string, C2: CompiledLayer): Promise<CompiledLayer> {
    try {
      // Get recent document updates
      const recentUpdates = await this.prisma.corpusDocumentVersion.findMany({
        where: {
          document: {
            tenantId,
            isActive: true,
          },
          isActive: true,
          publishedAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
          },
        },
        include: {
          document: {
            select: {
              title: true,
              topic: {
                select: { slug: true, name: true },
              },
            },
          },
        },
        orderBy: { publishedAt: 'desc' },
        take: 5,
      });

      if (recentUpdates.length === 0) {
        return { content: '', tokens: 0 };
      }

      const content = this.formatFreshnessInfo(recentUpdates);

      return {
        content,
        tokens: this.estimateTokens(content),
      };
    } catch (error) {
      logger.warn({ error: (error as Error).message }, 'C4 assembly failed');
      return { content: '', tokens: 0 };
    }
  }

  /**
   * Compile final prompt from layers
   */
  private compilePrompt(layers: {
    C0: CompiledLayer;
    C1: CompiledLayer;
    C2: CompiledLayer;
    C3: CompiledLayer;
    C4: CompiledLayer;
  }): string {
    const sections: string[] = [];

    // C0: Company Identity (always included)
    if (layers.C0.content) {
      sections.push(layers.C0.content);
    }

    // C1: Topic Framework
    if (layers.C1.content) {
      sections.push(`## Topic Context\n${layers.C1.content}`);
    }

    // C2: Retrieved Knowledge (primary)
    if (layers.C2.content) {
      sections.push(`## Relevant Documentation\n${layers.C2.content}`);
    }

    // C3: Supporting Context
    if (layers.C3.content) {
      sections.push(`## Additional Reference\n${layers.C3.content}`);
    }

    // C4: Freshness & Changelog
    if (layers.C4.content) {
      sections.push(`## Recent Updates\n${layers.C4.content}`);
    }

    return sections.join('\n\n---\n\n');
  }

  /**
   * Format company identity
   */
  private formatCompanyIdentity(config: {
    companyName: string;
    productName: string;
    productDescription: string;
    brandVoice: any;
    guardrails: string[];
    escalationInstructions: string;
    answerStyle: string;
    citeSources: boolean;
    suggestRelated: boolean;
    proactiveHelp: boolean;
  }): string {
    return `You are the ${config.companyName} support assistant for ${config.productName}.

Product Description: ${config.productDescription}

Voice & Tone:
- Tone: ${config.brandVoice.tone}
- Formality: ${config.brandVoice.formality}
- Personality: ${config.brandVoice.personality.join(', ')}

Response Style:
- Answer style: ${config.answerStyle}
- Cite sources: ${config.citeSources ? 'Yes' : 'No'}
- Suggest related topics: ${config.suggestRelated ? 'Yes' : 'No'}
- Proactive help: ${config.proactiveHelp ? 'Yes' : 'No'}

Rules & Guardrails:
${config.guardrails.map(g => `- ${g}`).join('\n')}

${config.escalationInstructions ? `Escalation: ${config.escalationInstructions}` : ''}`;
  }

  /**
   * Format topic framework
   */
  private formatTopicFramework(topics: any[]): string {
    if (topics.length === 0) return 'No specific topics detected.';

    const primaryTopic = topics[0];
    const relatedTopics = topics.slice(1);

    let content = `Primary Topic: ${primaryTopic.name}`;
    content += `\nPath: ${primaryTopic.path.join(' > ')}`;

    if (relatedTopics.length > 0) {
      content += '\n\nRelated Topics:';
      for (const topic of relatedTopics) {
        content += `\n- ${topic.name} (${(topic.similarity * 100).toFixed(0)}% relevant)`;
      }
    }

    return content;
  }

  /**
   * Format retrieved knowledge
   */
  private formatRetrievedKnowledge(chunks: any[]): string {
    if (chunks.length === 0) return 'No relevant documentation found.';

    const formatted = chunks.map((chunk, i) => {
      let text = `### Source ${i + 1}: ${chunk.chunk.sectionPath.join(' > ')}\n\n`;
      
      if (chunk.parentContext) {
        text += `[Context: ${chunk.parentContext}]\n\n`;
      }
      
      text += chunk.chunk.content;
      
      if (chunk.chunk.generatedAnswer) {
        text += `\n\nQuick Answer: ${chunk.chunk.generatedAnswer}`;
      }
      
      return text;
    });

    return formatted.join('\n\n---\n\n');
  }

  /**
   * Format supporting context
   */
  private formatSupportingContext(chunks: any[]): string {
    const summaries = chunks
      .map(c => `- ${c.chunk.summary || c.chunk.content.substring(0, 100)}...`)
      .join('\n');

    return `Additional relevant information:\n${summaries}`;
  }

  /**
   * Format freshness info
   */
  private formatFreshnessInfo(updates: any[]): string {
    const items = updates.map(u => {
      const date = new Date(u.publishedAt).toLocaleDateString();
      const topic = u.document.topic?.name || 'General';
      return `- [${date}] ${u.document.title} (${topic}): ${u.changelog || 'Updated'}`;
    });

    return `Recent documentation updates:\n${items.join('\n')}`;
  }

  /**
   * Get default C0
   */
  private getDefaultC0(): CompiledLayer {
    const content = `You are a helpful support assistant. Answer questions accurately and professionally.`;
    return {
      content,
      tokens: this.estimateTokens(content),
    };
  }

  /**
   * Get default C1
   */
  private getDefaultC1(): CompiledLayer {
    const content = 'No specific topic context available.';
    return {
      content,
      tokens: this.estimateTokens(content),
    };
  }

  /**
   * Extract topics covered
   */
  private extractTopicsCovered(C1: CompiledLayer, C2: CompiledLayer): string[] {
    const topics: string[] = [];
    
    // Extract from C1
    const topicMatch = C1.content.match(/Primary Topic: (.+)/);
    if (topicMatch) {
      topics.push(topicMatch[1]);
    }

    return topics;
  }

  /**
   * Estimate token count
   */
  private estimateTokens(text: string): number {
    // Simple estimation: ~4 characters per token
    return Math.ceil(text.length / 4);
  }
}
