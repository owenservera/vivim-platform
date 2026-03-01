/**
 * PageIndex Documentation Service
 * 
 * Vectorless, Reasoning-based RAG for VIVIM documentation
 * 
 * This service provides PageIndex-like functionality using VIVIM's
 * existing OpenAI infrastructure to create intelligent document search.
 */

import { logger } from '../lib/logger.js';
import OpenAI from 'openai';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as fsSync from 'fs';

export interface PageIndexNode {
  title: string;
  node_id: string;
  start_index: number;
  end_index: number;
  summary: string;
  level: number;
  nodes?: PageIndexNode[];
}

export interface DocSearchResult {
  content: string;
  page_reference: number;
  section_title: string;
  node_id: string;
  relevance_score?: number;
}

export interface SearchQuery {
  query: string;
  top_k?: number;
}

interface DocumentIndex {
  documentId: string;
  title: string;
  tree: PageIndexNode;
  sections: PageIndexNode[];
  indexedAt: string;
}

/**
 * PageIndex Service for VIVIM
 * Uses VIVIM's existing OpenAI integration
 */
export class PageIndexService {
  private openai: OpenAI | null = null;
  private docIndex: Map<string, DocumentIndex> = new Map();
  private indexCachePath: string;
  private initialized: boolean = false;

  constructor(private model: string = 'gpt-4o-mini') {
    // Get API key from environment
    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey) {
      this.openai = new OpenAI({ apiKey });
    }
    this.indexCachePath = path.join(process.cwd(), 'data', 'doc-indexes');
  }

  isConfigured(): boolean {
    return !!this.openai;
  }

  async init(): Promise<void> {
    if (this.initialized) return;
    if (!this.openai && process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    }
    await fs.mkdir(this.indexCachePath, { recursive: true });
    await this.loadIndexes();
    this.initialized = true;
    logger.info({ documentCount: this.docIndex.size }, 'PageIndex service initialized');
  }

  private async loadIndexes(): Promise<void> {
    try {
      const files = await fs.readdir(this.indexCachePath);
      for (const file of files) {
        if (file.endsWith('.json')) {
          const content = await fs.readFile(path.join(this.indexCachePath, file), 'utf-8');
          const index = JSON.parse(content) as DocumentIndex;
          this.docIndex.set(index.documentId, index);
        }
      }
    } catch (error) {
      logger.debug('No existing indexes found');
    }
  }

  private parseMarkdown(filePath: string): string[] {
    const content = fsSync.readFileSync(filePath, 'utf-8');
    const headings: string[] = [];
    const lines = content.split('\n');
    for (const line of lines) {
      const match = line.match(/^(#{1,6})\s+(.+)$/);
      if (match) {
        headings.push(match[2]);
      }
    }
    return headings;
  }

  private buildTree(title: string, sections: string[]): PageIndexNode {
    const rootNode: PageIndexNode = {
      title,
      node_id: '000',
      start_index: 0,
      end_index: sections.length,
      summary: `Documentation for ${title}`,
      level: 0,
      nodes: []
    };

    const headingStack: { node: PageIndexNode; level: number }[] = [
      { node: rootNode, level: 0 }
    ];

    let sectionIndex = 0;
    for (const section of sections) {
      const level = (section.match(/^#+/) || ['#'])[0].length;
      const nodeId = String(sectionIndex).padStart(3, '0');

      const node: PageIndexNode = {
        title: section.replace(/^#+\s+/, ''),
        node_id: nodeId,
        start_index: sectionIndex,
        end_index: sectionIndex + 1,
        summary: `Section about ${section.replace(/^#+\s+/, '')}`,
        level,
        nodes: []
      };

      while (headingStack.length > 1 && headingStack[headingStack.length - 1].level >= level) {
        headingStack.pop();
      }

      const parent = headingStack[headingStack.length - 1];
      if (parent.node.nodes) {
        parent.node.nodes.push(node);
      }

      headingStack.push({ node, level });
      sectionIndex++;
    }

    return rootNode;
  }

  private flattenTree(node: PageIndexNode, result: PageIndexNode[] = []): PageIndexNode[] {
    result.push(node);
    if (node.nodes) {
      for (const child of node.nodes) {
        this.flattenTree(child, result);
      }
    }
    return result;
  }

  async indexDocument(
    filePath: string,
    options: { documentId: string; title?: string }
  ): Promise<PageIndexNode> {
    const title = options.title || path.basename(filePath, '.md');
    const sections = this.parseMarkdown(filePath);
    const tree = this.buildTree(title, sections);

    // Generate LLM summaries if available
    if (this.openai && tree.nodes && tree.nodes.length > 0) {
      const topNodes = tree.nodes.slice(0, 5);
      for (const child of topNodes) {
        try {
          const response = await this.openai.chat.completions.create({
            model: this.model,
            messages: [
              { role: 'system', content: 'Generate a brief 1-2 sentence summary.' },
              { role: 'user', content: `Section: ${child.title}` }
            ],
            temperature: 0.3,
            max_tokens: 100
          });
          child.summary = response.choices[0]?.message?.content || child.summary;
        } catch (error) {
          logger.warn({ error, section: child.title }, 'Failed to generate summary');
        }
      }
    }

    const sectionsFlat = this.flattenTree(tree);
    const index: DocumentIndex = {
      documentId: options.documentId,
      title,
      tree,
      sections: sectionsFlat,
      indexedAt: new Date().toISOString()
    };

    this.docIndex.set(options.documentId, index);
    await fs.writeFile(
      path.join(this.indexCachePath, `${options.documentId}.json`),
      JSON.stringify(index, null, 2)
    );

    return tree;
  }

  async search(documentId: string, query: SearchQuery): Promise<DocSearchResult[]> {
    const index = this.docIndex.get(documentId);
    if (!index) return [];

    // Simple keyword search
    const queryLower = query.query.toLowerCase();
    const topK = query.top_k || 5;

    const scored = index.sections.map(section => {
      let score = 0;
      const titleLower = section.title.toLowerCase();
      const summaryLower = section.summary.toLowerCase();

      if (titleLower.includes(queryLower)) score += 10;
      if (summaryLower.includes(queryLower)) score += 5;

      const queryWords = queryLower.split(' ');
      for (const word of queryWords) {
        if (word.length > 2) {
          if (titleLower.includes(word)) score += 3;
          if (summaryLower.includes(word)) score += 1;
        }
      }
      return { section, score };
    });

    return scored
      .filter(s => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
      .map(s => ({
        content: s.section.summary,
        page_reference: s.section.start_index,
        section_title: s.section.title,
        node_id: s.section.node_id,
        relevance_score: s.score / 15
      }));
  }

  getDocumentTree(documentId: string): PageIndexNode | undefined {
    return this.docIndex.get(documentId)?.tree;
  }

  getIndexedDocuments() {
    return Array.from(this.docIndex.values()).map(idx => ({
      documentId: idx.documentId,
      title: idx.title,
      indexedAt: idx.indexedAt
    }));
  }

  async clearIndex(documentId?: string): Promise<void> {
    if (documentId) {
      this.docIndex.delete(documentId);
      try {
        await fs.unlink(path.join(this.indexCachePath, `${documentId}.json`));
      } catch (e) {}
    } else {
      this.docIndex.clear();
    }
  }
}

export const pageIndexService = new PageIndexService();

export async function indexAllVivimDocs(docsPath: string): Promise<void> {
  await pageIndexService.init();

  const files = await fs.readdir(docsPath, { recursive: true });
  const mdFiles = (files as string[]).filter(f =>
    typeof f === 'string' && f.endsWith('.md')
  );

  logger.info({ fileCount: mdFiles.length }, 'Starting documentation indexing');

  for (const file of mdFiles) {
    const fullPath = path.join(docsPath, file);
    const docId = String(file).replace(/[/\\]/g, '-').replace('.md', '');

    try {
      await pageIndexService.indexDocument(fullPath, {
        documentId: docId,
        title: docId
      });
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : error, file }, 'Failed to index file');
    }
  }

  logger.info('Documentation indexing complete');
}
