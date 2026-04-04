/**
 * Corpus Ingestion Service
 * 
 * Handles document ingestion pipeline:
 * 1. Parse document (Markdown, HTML, etc.)
 * 2. Chunk into semantic sections
 * 3. Generate embeddings
 * 4. Generate Q&A pairs
 * 5. Store in database
 * 
 * @created March 27, 2026
 */

import { PrismaClient } from '@prisma/client';
import {
  DocumentIngestionParams,
  IngestionResult,
  ParsedDocument,
  ChunkResult,
  QAPair,
  CorpusChunk,
  CorpusFAQ,
} from '../../types/corpus';
import { getParser } from './parsers/parser-factory';
import { SemanticChunker } from './chunker/semantic-chunker';
import { logger } from '../../lib/logger';

interface CorpusIngestionServiceConfig {
  prisma: PrismaClient;
  embeddingService: {
    embed: (text: string) => Promise<number[]>;
    embedBatch: (texts: string[]) => Promise<number[][]>;
  };
  llmService: {
    chat: (params: { model: string; messages: any[] }) => Promise<{ content: string }>;
  };
  qaGenerator?: {
    generateQAPairs: (chunk: CorpusChunk) => Promise<QAPair[]>;
  };
}

export class CorpusIngestionService {
  private prisma: PrismaClient;
  private embeddingService: CorpusIngestionServiceConfig['embeddingService'];
  private llmService: CorpusIngestionServiceConfig['llmService'];
  private chunker: SemanticChunker;

  constructor(config: CorpusIngestionServiceConfig) {
    this.prisma = config.prisma;
    this.embeddingService = config.embeddingService;
    this.llmService = config.llmService;
    this.chunker = new SemanticChunker();
  }

  /**
   * Ingest a new document into the corpus
   */
  async ingest(params: DocumentIngestionParams): Promise<IngestionResult> {
    const startTime = Date.now();
    logger.info({ title: params.title, format: params.format }, 'Starting document ingestion');

    try {
      // Step 1: Parse document
      const parsed = await this.parseDocument(params.content, params.format);
      logger.debug({ sections: parsed.sections.length }, 'Document parsed');

      // Step 2: Create document record
      const document = await this.createDocument(params, parsed);
      logger.info({ documentId: document.id }, 'Document record created');

      // Step 3: Chunk document
      const chunkResult = await this.chunkDocument(parsed);
      logger.info({ chunks: chunkResult.chunks.length }, 'Document chunked');

      // Step 4: Generate embeddings for chunks
      await this.generateChunkEmbeddings(chunkResult.chunks);
      logger.debug('Embeddings generated');

      // Step 5: Generate Q&A pairs
      const faqPairs = await this.generateFAQs(chunkResult.chunks, document.tenantId);
      logger.info({ faqs: faqPairs.length }, 'FAQ pairs generated');

      // Step 6: Store chunks
      const storedChunks = await this.storeChunks(chunkResult.chunks, document.id);
      logger.info({ stored: storedChunks.length }, 'Chunks stored');

      // Step 7: Update topic statistics
      if (params.topicSlug) {
        await this.updateTopicStats(params.topicSlug, document.tenantId, chunkResult.chunks.length);
      }

      const duration = Date.now() - startTime;
      logger.info({ documentId: document.id, duration, chunks: storedChunks.length }, 'Ingestion complete');

      return {
        documentId: document.id,
        chunks: storedChunks,
        faqPairs,
        topicsUpdated: params.topicSlug ? [params.topicSlug] : [],
        addedChunks: storedChunks.length,
        modifiedChunks: 0,
        removedChunks: 0,
      };
    } catch (error) {
      logger.error({ error: (error as Error).message }, 'Ingestion failed');
      throw error;
    }
  }

  /**
   * Re-ingest an updated document (with change detection)
   */
  async reingest(
    documentId: string,
    updates: { content: string; version?: string }
  ): Promise<IngestionResult> {
    const startTime = Date.now();
    logger.info({ documentId }, 'Starting document re-ingestion');

    try {
      // Get existing document
      const existing = await this.prisma.corpusDocument.findUnique({
        where: { id: documentId },
        include: { chunks: true, topic: true },
      });

      if (!existing) {
        throw new Error(`Document ${documentId} not found`);
      }

      // Check if content actually changed
      const newHash = this.hashContent(updates.content);
      if (newHash === existing.contentHash) {
        logger.info({ documentId }, 'Content unchanged, skipping re-ingestion');
        return {
          documentId: existing.id,
          chunks: existing.chunks,
          faqPairs: [],
          topicsUpdated: [],
          addedChunks: 0,
          modifiedChunks: 0,
          removedChunks: 0,
          changelog: 'No changes detected',
        };
      }

      // Parse new content
      const parsed = await this.parseDocument(updates.content, existing.format);

      // Chunk new content
      const chunkResult = await this.chunkDocument(parsed);

      // Generate embeddings
      await this.generateChunkEmbeddings(chunkResult.chunks);

      // Compare chunks to find changes
      const changes = await this.detectChunkChanges(existing.chunks, chunkResult.chunks);

      // Store updated chunks
      const storedChunks = await this.storeChunks(chunkResult.chunks, documentId);

      // Create version record
      await this.createDocumentVersion(documentId, {
        version: updates.version || this.incrementVersion(existing.version),
        contentHash: newHash,
        changeType: this.classifyChangeType(changes),
        changelog: await this.generateChangelog(changes),
        changedSections: changes.changedSections,
        addedChunkIds: changes.added.map(c => c.id),
        modifiedChunkIds: changes.modified.map(c => c.id),
        removedChunkIds: changes.removed.map(c => c.id),
      });

      // Generate new FAQs
      const faqPairs = await this.generateFAQs(chunkResult.chunks, existing.tenantId);

      const duration = Date.now() - startTime;
      logger.info({ documentId, duration, changes }, 'Re-ingestion complete');

      return {
        documentId: existing.id,
        chunks: storedChunks,
        faqPairs,
        topicsUpdated: existing.topic ? [existing.topic.slug] : [],
        addedChunks: changes.added.length,
        modifiedChunks: changes.modified.length,
        removedChunks: changes.removed.length,
        changelog: await this.generateChangelog(changes),
      };
    } catch (error) {
      logger.error({ error: (error as Error).message }, 'Re-ingestion failed');
      throw error;
    }
  }

  /**
   * Parse document based on format
   */
  private async parseDocument(content: string, format: string): Promise<ParsedDocument> {
    const parser = getParser(format);
    return parser.parse(content);
  }

  /**
   * Create document record in database
   */
  private async createDocument(
    params: DocumentIngestionParams,
    parsed: ParsedDocument
  ): Promise<any> {
    return this.prisma.corpusDocument.create({
      data: {
        tenantId: params.tenantId,
        title: params.title,
        description: params.category === 'api_reference' ? 'API Documentation' : undefined,
        sourceUrl: params.sourceUrl,
        rawContent: params.content,
        contentHash: this.hashContent(params.content),
        format: params.format,
        category: params.category,
        topicId: undefined, // Will be linked if topicSlug provided
        version: params.version || '1.0.0',
        authors: params.authors || [],
        lastPublishedAt: new Date(),
        wordCount: parsed.metadata.wordCount,
      },
    });
  }

  /**
   * Chunk document into semantic sections
   */
  private async chunkDocument(parsed: ParsedDocument): Promise<ChunkResult> {
    return this.chunker.chunk(parsed, {
      targetChunkSize: 400,
      maxChunkSize: 600,
      minChunkSize: 100,
      overlapSize: 75,
      respectHeadings: true,
      preserveCodeBlocks: true,
      preserveTables: true,
      preserveLists: true,
      generateParentChunks: true,
      maxHierarchyDepth: 3,
    });
  }

  /**
   * Generate embeddings for all chunks
   */
  private async generateChunkEmbeddings(chunks: CorpusChunk[]): Promise<void> {
    const texts = chunks.map(c => `${c.summary || ''}\n\n${c.content}`);
    const embeddings = await this.embeddingService.embedBatch(texts);

    chunks.forEach((chunk, i) => {
      chunk.embedding = embeddings[i];
    });
  }

  /**
   * Generate FAQ pairs from chunks
   */
  private async generateFAQs(chunks: CorpusChunk[], tenantId: string): Promise<CorpusFAQ[]> {
    const faqs: CorpusFAQ[] = [];

    for (const chunk of chunks) {
      // Generate Q&A pairs using LLM
      const qaPairs = await this.generateQAPairs(chunk);

      for (const qa of qaPairs) {
        // Generate question embedding
        const questionEmbedding = await this.embeddingService.embed(qa.question);

        const faq = await this.prisma.corpusFAQ.create({
          data: {
            tenantId,
            question: qa.question,
            answer: qa.answer,
            sourceChunkId: chunk.id,
            isManual: false,
            questionEmbedding,
            topicSlug: chunk.topicSlug,
            category: chunk.contentType,
            confidence: qa.confidence,
          },
        });

        faqs.push(faq);
      }
    }

    return faqs;
  }

  /**
   * Generate Q&A pairs for a chunk
   */
  private async generateQAPairs(chunk: CorpusChunk): Promise<QAPair[]> {
    try {
      const response = await this.llmService.chat({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Given the following documentation chunk, generate 3-5 natural
                      questions that a user might ask that this content answers.
                      Also generate a concise standalone answer for each question.

                      Format: JSON array of { question, answer, confidence }`,
          },
          {
            role: 'user',
            content: `Section: ${chunk.sectionPath.join(' > ')}\nContent: ${chunk.content}`,
          },
        ],
      });

      return JSON.parse(response.content);
    } catch (error) {
      logger.warn({ error: (error as Error).message, chunkId: chunk.id }, 'Q&A generation failed');
      return [];
    }
  }

  /**
   * Store chunks in database
   */
  private async storeChunks(chunks: ChunkResult['chunks'], documentId: string): Promise<CorpusChunk[]> {
    const stored: CorpusChunk[] = [];

    for (const chunk of chunks) {
      const storedChunk = await this.prisma.corpusChunk.create({
        data: {
          tenantId: chunk.tenantId,
          documentId,
          content: chunk.content,
          summary: chunk.summary,
          parentChunkId: chunk.parentChunkId,
          chunkIndex: chunk.chunkIndex,
          totalChunks: chunk.totalChunks,
          sectionPath: chunk.sectionPath,
          headingLevel: chunk.headingLevel,
          contentType: chunk.contentType,
          embedding: chunk.embedding,
          embeddingModel: 'text-embedding-3-small',
          keywords: chunk.keywords,
          topicSlug: chunk.topicSlug,
          difficulty: chunk.difficulty,
          generatedQuestions: chunk.generatedQuestions,
          generatedAnswer: chunk.generatedAnswer,
          sourceUpdatedAt: new Date(),
          freshnessScore: 1.0,
          qualityScore: 0.8,
        },
      });

      stored.push(storedChunk);
    }

    return stored;
  }

  /**
   * Detect changes between old and new chunks
   */
  private async detectChunkChanges(
    oldChunks: CorpusChunk[],
    newChunks: CorpusChunk[]
  ): Promise<{
    added: CorpusChunk[];
    modified: CorpusChunk[];
    removed: CorpusChunk[];
    unchanged: CorpusChunk[];
    changedSections: string[];
  }> {
    const oldMap = new Map(oldChunks.map(c => [c.chunkIndex, c]));
    const newMap = new Map(newChunks.map(c => [c.chunkIndex, c]));

    const added: CorpusChunk[] = [];
    const modified: CorpusChunk[] = [];
    const removed: CorpusChunk[] = [];
    const unchanged: CorpusChunk[] = [];
    const changedSections = new Set<string>();

    // Find added and modified chunks
    for (const [index, newChunk] of newMap) {
      const oldChunk = oldMap.get(index);

      if (!oldChunk) {
        added.push(newChunk);
        changedSections.add(newChunk.sectionPath.join(' > '));
      } else if (this.hashContent(newChunk.content) !== this.hashContent(oldChunk.content)) {
        modified.push(newChunk);
        changedSections.add(newChunk.sectionPath.join(' > '));
      } else {
        unchanged.push(newChunk);
      }
    }

    // Find removed chunks
    for (const [index, oldChunk] of oldMap) {
      if (!newMap.has(index)) {
        removed.push(oldChunk);
        changedSections.add(oldChunk.sectionPath.join(' > '));
      }
    }

    return { added, modified, removed, unchanged, changedSections: Array.from(changedSections) };
  }

  /**
   * Create document version record
   */
  private async createDocumentVersion(
    documentId: string,
    versionData: {
      version: string;
      contentHash: string;
      changeType: string;
      changelog: string;
      changedSections: string[];
      addedChunkIds: string[];
      modifiedChunkIds: string[];
      removedChunkIds: string[];
    }
  ): Promise<void> {
    await this.prisma.corpusDocumentVersion.create({
      data: {
        documentId,
        ...versionData,
      },
    });
  }

  /**
   * Update topic statistics
   */
  private async updateTopicStats(
    topicSlug: string,
    tenantId: string,
    chunkCount: number
  ): Promise<void> {
    await this.prisma.corpusTopic.update({
      where: {
        tenantId_slug: {
          tenantId,
          slug: topicSlug,
        },
      },
      data: {
        documentCount: { increment: 1 },
        chunkCount: { increment: chunkCount },
        lastUpdatedAt: new Date(),
      },
    });
  }

  /**
   * Hash content for change detection
   */
  private hashContent(content: string): string {
    // Simple hash - in production use crypto.createHash('sha256')
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(36);
  }

  /**
   * Increment version string
   */
  private incrementVersion(version: string): string {
    const parts = version.split('.').map(Number);
    parts[2] = (parts[2] || 0) + 1;
    return parts.join('.');
  }

  /**
   * Classify change type based on changes detected
   */
  private classifyChangeType(changes: any): 'major' | 'minor' | 'patch' {
    if (changes.removed.length > 5 || changes.changedSections.length > 10) {
      return 'major';
    }
    if (changes.modified.length > 10 || changes.added.length > 5) {
      return 'minor';
    }
    return 'patch';
  }

  /**
   * Generate changelog from changes
   */
  private async generateChangelog(changes: any): Promise<string> {
    try {
      const response = await this.llmService.chat({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Generate a concise changelog summarizing the documentation changes.',
          },
          {
            role: 'user',
            content: `Added: ${changes.added.length} chunks\nModified: ${changes.modified.length} chunks\nRemoved: ${changes.removed.length} chunks\nSections: ${changes.changedSections.join(', ')}`,
          },
        ],
      });
      return response.content;
    } catch {
      return `Updated ${changes.modified.length} chunks, added ${changes.added.length}, removed ${changes.removed.length}`;
    }
  }
}
