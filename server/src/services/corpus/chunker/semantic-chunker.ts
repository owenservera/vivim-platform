/**
 * Semantic Chunker
 * 
 * Chunks documents into semantic sections while preserving structure.
 * Respects heading hierarchy, code blocks, and tables.
 * 
 * @created March 27, 2026
 */

import {
  ParsedDocument,
  ChunkResult,
  CorpusChunk,
  ChunkingConfig,
} from '../../../types/corpus';
import { logger } from '../../../lib/logger';

interface TokenEstimator {
  estimateTokens: (text: string) => number;
}

export class SemanticChunker {
  private tokenEstimator: TokenEstimator;

  constructor(tokenEstimator?: TokenEstimator) {
    // Simple token estimation: ~4 characters per token
    this.tokenEstimator = tokenEstimator || {
      estimateTokens: (text: string) => Math.ceil(text.length / 4),
    };
  }

  /**
   * Chunk a parsed document into semantic sections
   */
  chunk(document: ParsedDocument, config: ChunkingConfig): ChunkResult {
    logger.debug(
      { title: document.title, sections: document.sections.length },
      'Starting semantic chunking'
    );

    const chunks: CorpusChunk[] = [];
    const parentChunks: CorpusChunk[] = [];

    // Process each top-level section
    for (const section of document.sections) {
      const sectionChunks = this.chunkSection(section, config, [], 1);
      chunks.push(...sectionChunks);

      // Create parent chunk for section if enabled
      if (config.generateParentChunks && sectionChunks.length > 1) {
        const parentChunk = this.createParentChunk(section, sectionChunks, config);
        parentChunks.push(parentChunk);
      }
    }

    // Create root chunk (document-level summary)
    const rootChunk = this.createRootChunk(document, chunks, config);

    // Assign parent-child relationships
    this.assignParentChildRelationships(chunks, parentChunks, rootChunk);

    const result: ChunkResult = {
      chunks,
      parentChunks,
      rootChunk,
      metadata: {
        totalChunks: chunks.length,
        avgChunkSize: this.calculateAvgChunkSize(chunks),
        preservedStructures: this.countPreservedStructures(document, chunks),
      },
    };

    logger.info(
      { totalChunks: chunks.length, parentChunks: parentChunks.length },
      'Chunking complete'
    );

    return result;
  }

  /**
   * Chunk a single section recursively
   */
  private chunkSection(
    section: Section,
    config: ChunkingConfig,
    path: string[],
    depth: number
  ): CorpusChunk[] {
    const chunks: CorpusChunk[] = [];
    const currentPath = [...path, section.heading];

    // Check if section content fits in a single chunk
    const contentTokens = this.tokenEstimator.estimateTokens(section.content);

    if (contentTokens <= config.targetChunkSize) {
      // Section fits - create single chunk
      const chunk = this.createChunk(section, currentPath, config);
      chunks.push(chunk);
    } else {
      // Section too large - split into multiple chunks
      const splitChunks = this.splitSection(section, currentPath, config);
      chunks.push(...splitChunks);
    }

    // Process subsections
    for (const subsection of section.subsections) {
      const subChunks = this.chunkSection(subsection, config, currentPath, depth + 1);
      chunks.push(...subChunks);
    }

    return chunks;
  }

  /**
   * Create a chunk from a section
   */
  private createChunk(
    section: Section,
    path: string[],
    config: ChunkingConfig
  ): CorpusChunk {
    const content = this.formatChunkContent(section, config);
    const tokens = this.tokenEstimator.estimateTokens(content);

    return {
      id: '', // Will be assigned by database
      tenantId: '',
      documentId: '',
      content,
      summary: this.generateSummary(content),
      parentChunkId: null,
      childChunks: [],
      chunkIndex: 0, // Will be assigned later
      totalChunks: 0, // Will be assigned later
      sectionPath: path,
      headingLevel: section.level,
      contentType: this.detectContentType(section),
      embedding: null,
      embeddingModel: null,
      keywords: this.extractKeywords(section.content),
      topicSlug: this.generateTopicSlug(path),
      difficulty: this.assessDifficulty(section.content),
      generatedQuestions: [],
      generatedAnswer: null,
      sourceUpdatedAt: new Date(),
      freshnessScore: 1.0,
      qualityScore: this.calculateQualityScore(section, content),
      retrievalCount: 0,
      avgRelevanceScore: 0,
      lastRetrievedAt: null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  /**
   * Split a large section into multiple chunks
   */
  private splitSection(
    section: Section,
    path: string[],
    config: ChunkingConfig
  ): CorpusChunk[] {
    const chunks: CorpusChunk[] = [];
    const content = section.content;

    // Split by paragraphs
    const paragraphs = content.split(/\n\n+/);
    let currentChunkContent = '';
    let chunkIndex = 0;

    for (const paragraph of paragraphs) {
      const paragraphTokens = this.tokenEstimator.estimateTokens(paragraph);

      // Check if adding this paragraph would exceed max size
      const potentialContent = currentChunkContent + '\n\n' + paragraph;
      const potentialTokens = this.tokenEstimator.estimateTokens(potentialContent);

      if (potentialTokens > config.maxChunkSize && currentChunkContent) {
        // Create chunk with current content
        const chunk = this.createChunkFromContent(
          currentChunkContent,
          section,
          path,
          chunkIndex++,
          config
        );
        chunks.push(chunk);
        currentChunkContent = paragraph;
      } else {
        currentChunkContent += (currentChunkContent ? '\n\n' : '') + paragraph;
      }
    }

    // Don't forget the last chunk
    if (currentChunkContent) {
      const chunk = this.createChunkFromContent(
        currentChunkContent,
        section,
        path,
        chunkIndex,
        config
      );
      chunks.push(chunk);
    }

    return chunks;
  }

  /**
   * Create chunk from raw content
   */
  private createChunkFromContent(
    content: string,
    section: Section,
    path: string[],
    index: number,
    config: ChunkingConfig
  ): CorpusChunk {
    const tokens = this.tokenEstimator.estimateTokens(content);

    return {
      id: '',
      tenantId: '',
      documentId: '',
      content,
      summary: this.generateSummary(content),
      parentChunkId: null,
      childChunks: [],
      chunkIndex: index,
      totalChunks: 0,
      sectionPath: path,
      headingLevel: section.level,
      contentType: this.detectContentTypeFromText(content),
      embedding: null,
      embeddingModel: null,
      keywords: this.extractKeywords(content),
      topicSlug: this.generateTopicSlug(path),
      difficulty: this.assessDifficulty(content),
      generatedQuestions: [],
      generatedAnswer: null,
      sourceUpdatedAt: new Date(),
      freshnessScore: 1.0,
      qualityScore: 0.7,
      retrievalCount: 0,
      avgRelevanceScore: 0,
      lastRetrievedAt: null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  /**
   * Create parent chunk (section-level summary)
   */
  private createParentChunk(
    section: Section,
    childChunks: CorpusChunk[],
    config: ChunkingConfig
  ): CorpusChunk {
    // Generate summary from child chunks
    const childContents = childChunks.map(c => c.summary || c.content).join('\n\n');
    const summary = this.generateSummary(childContents, 100);

    return {
      id: '',
      tenantId: '',
      documentId: '',
      content: section.content,
      summary,
      parentChunkId: null,
      childChunks: [],
      chunkIndex: 0,
      totalChunks: childChunks.length,
      sectionPath: section.subsections.length > 0 
        ? [section.heading, ...section.subsections.map(s => s.heading)]
        : [section.heading],
      headingLevel: section.level,
      contentType: 'mixed',
      embedding: null,
      embeddingModel: null,
      keywords: this.extractKeywords(section.content),
      topicSlug: this.generateTopicSlug([section.heading]),
      difficulty: this.assessDifficulty(section.content),
      generatedQuestions: [],
      generatedAnswer: null,
      sourceUpdatedAt: new Date(),
      freshnessScore: 1.0,
      qualityScore: 0.8,
      retrievalCount: 0,
      avgRelevanceScore: 0,
      lastRetrievedAt: null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  /**
   * Create root chunk (document-level summary)
   */
  private createRootChunk(
    document: ParsedDocument,
    chunks: CorpusChunk[],
    config: ChunkingConfig
  ): CorpusChunk {
    // Generate document-level summary
    const allContent = chunks.map(c => c.summary || c.content).join('\n\n');
    const summary = this.generateSummary(allContent, 150);

    return {
      id: '',
      tenantId: '',
      documentId: '',
      content: document.metadata.wordCount > 500 
        ? `Document: ${document.title}\n\n${summary}`
        : document.sections[0]?.content || '',
      summary: `${document.title} - ${document.metadata.wordCount} words, ${chunks.length} chunks`,
      parentChunkId: null,
      childChunks: [],
      chunkIndex: 0,
      totalChunks: chunks.length,
      sectionPath: [document.title],
      headingLevel: 0,
      contentType: 'mixed',
      embedding: null,
      embeddingModel: null,
      keywords: this.extractKeywords(document.sections.map(s => s.content).join('\n\n')),
      topicSlug: this.generateTopicSlug([document.title]),
      difficulty: 'intermediate',
      generatedQuestions: [],
      generatedAnswer: null,
      sourceUpdatedAt: new Date(),
      freshnessScore: 1.0,
      qualityScore: 0.8,
      retrievalCount: 0,
      avgRelevanceScore: 0,
      lastRetrievedAt: null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  /**
   * Assign parent-child relationships
   */
  private assignParentChildRelationships(
    chunks: CorpusChunk[],
    parentChunks: CorpusChunk[],
    rootChunk: CorpusChunk
  ): void {
    // Assign chunk indices
    chunks.forEach((chunk, i) => {
      chunk.chunkIndex = i;
      chunk.totalChunks = chunks.length;
    });
  }

  /**
   * Format chunk content with structure preservation
   */
  private formatChunkContent(section: Section, config: ChunkingConfig): string {
    let content = '';

    // Add heading context
    content += `## ${section.heading}\n\n`;

    // Add content
    content += section.content;

    return content.trim();
  }

  /**
   * Generate summary from content
   */
  private generateSummary(content: string, maxLength: number = 50): string {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    if (sentences.length === 0) {
      return content.substring(0, maxLength);
    }

    // Take first 1-2 sentences as summary
    let summary = sentences[0].trim();
    if (sentences.length > 1 && summary.length < maxLength) {
      summary += '. ' + sentences[1].trim();
    }

    // Truncate if still too long
    if (summary.length > maxLength) {
      summary = summary.substring(0, maxLength - 3) + '...';
    }

    return summary;
  }

  /**
   * Extract keywords from content
   */
  private extractKeywords(content: string): string[] {
    // Simple keyword extraction
    const words = content
      .toLowerCase()
      .split(/\s+/)
      .filter(w => w.length > 4 && /^[a-z]+$/.test(w));

    // Count word frequency
    const frequency: Record<string, number> = {};
    for (const word of words) {
      frequency[word] = (frequency[word] || 0) + 1;
    }

    // Return top 5 keywords
    return Object.entries(frequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([word]) => word);
  }

  /**
   * Generate topic slug from path
   */
  private generateTopicSlug(path: string[]): string {
    return path
      .map(p => p.toLowerCase().replace(/[^a-z0-9]+/g, '-'))
      .join('-');
  }

  /**
   * Detect content type from section
   */
  private detectContentType(section: Section): string {
    const content = section.content;

    if (content.includes('```')) return 'code';
    if (content.includes('|') && content.includes('\n|')) return 'table';
    if (content.match(/^[-*•]\s/m)) return 'list';

    return 'prose';
  }

  /**
   * Detect content type from text
   */
  private detectContentTypeFromText(content: string): string {
    if (content.includes('```')) return 'code';
    if (content.match(/^\|.*\|$/m)) return 'table';
    if (content.match(/^[-*•]\s/m)) return 'list';

    return 'prose';
  }

  /**
   * Assess difficulty level
   */
  private assessDifficulty(content: string): string {
    const words = content.split(/\s+/);
    const avgWordLength = words.reduce((sum, w) => sum + w.length, 0) / words.length;

    if (avgWordLength > 7) return 'advanced';
    if (avgWordLength > 5) return 'intermediate';
    return 'beginner';
  }

  /**
   * Calculate quality score
   */
  private calculateQualityScore(section: Section, content: string): number {
    let score = 0.5;

    // Bonus for having content
    if (content.length > 100) score += 0.1;
    if (content.length > 500) score += 0.1;

    // Bonus for having subsections
    if (section.subsections.length > 0) score += 0.1;

    // Bonus for good structure
    if (section.heading.length > 5) score += 0.1;

    return Math.min(1.0, score);
  }

  /**
   * Calculate average chunk size
   */
  private calculateAvgChunkSize(chunks: CorpusChunk[]): number {
    if (chunks.length === 0) return 0;
    const total = chunks.reduce((sum, c) => sum + c.content.length, 0);
    return Math.round(total / chunks.length);
  }

  /**
   * Count preserved structures
   */
  private countPreservedStructures(document: ParsedDocument, chunks: CorpusChunk[]): number {
    let preserved = 0;

    // Count preserved code blocks
    const originalCodeBlocks = document.codeBlocks.length;
    const chunksWithCode = chunks.filter(c => c.contentType === 'code').length;
    preserved += Math.min(originalCodeBlocks, chunksWithCode);

    // Count preserved tables
    const originalTables = document.tables.length;
    const chunksWithTables = chunks.filter(c => c.contentType === 'table').length;
    preserved += Math.min(originalTables, chunksWithTables);

    return preserved;
  }
}
