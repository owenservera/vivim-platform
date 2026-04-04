import AdmZip from 'adm-zip';
import { createHash } from 'crypto';
import { existsSync, mkdirSync } from 'fs';
import { createReadStream, createWriteStream, statSync } from 'fs';
import { pipeline } from 'stream/promises';
import { v4 as uuidv4 } from 'uuid';
import { getPrismaClient } from '../lib/database.js';
import { logger } from '../lib/logger.js';
import type {
  ImportScanResult,
  StreamingUploadResult,
  ConversationProcessResult,
  ImportTierConfig,
  IntelligentOptions,
  TierProgress,
} from './import-types.js';

const log = logger.child({ service: 'streaming-import' });

const UPLOAD_DIR = './uploads/imports';

function ensureUploadDir() {
  if (!existsSync(UPLOAD_DIR)) {
    mkdirSync(UPLOAD_DIR, { recursive: true });
  }
}

export class StreamingImportService {
  ensureUploadDir = ensureUploadDir;

  async streamUpload(
    userId: string,
    file: Express.Multer.File
  ): Promise<StreamingUploadResult> {
    ensureUploadDir();
    const jobId = uuidv4();
    const uploadPath = `${UPLOAD_DIR}/${jobId}-${file.originalname}`;
    
    await pipeline(
      createReadStream(file.path),
      createWriteStream(uploadPath)
    );

    const scanResult = await this.scanImportFile(uploadPath);

    return {
      jobId,
      filePath: uploadPath,
      scanResult,
    };
  }

  async scanImportFile(filePath: string): Promise<ImportScanResult> {
    const zip = new AdmZip(filePath);
    const conversationsEntry = zip.getEntry('conversations.json');
    
    if (!conversationsEntry) {
      throw new Error('No conversations.json found in export');
    }

    const rawConversations = JSON.parse(
      conversationsEntry.getData().toString('utf8')
    );

    const stats = statSync(filePath);
    const dateRange = this.detectDateRange(rawConversations);
    const distribution = this.analyzeSizeDistribution(rawConversations);
    
    const totalMessages = rawConversations.reduce(
      (sum: number, c: any) => sum + (c.mapping ? Object.keys(c.mapping).length : 0),
      0
    );

    return {
      totalConversations: rawConversations.length,
      totalMessages,
      estimatedSize: stats.size,
      providers: this.detectProviders(rawConversations),
      dateRange,
      conversationSizeDistribution: distribution,
      estimatedProcessingTime: this.estimateTime(rawConversations.length),
    };
  }

  private detectProviders(conversations: any[]): string[] {
    const providers = new Set<string>();
    providers.add('chatgpt');
    return Array.from(providers);
  }

  private detectDateRange(conversations: any[]): { earliest: string; latest: string } {
    let earliest = Date.now();
    let latest = 0;

    for (const conv of conversations) {
      if (conv.create_time) {
        const ts = conv.create_time * 1000;
        earliest = Math.min(earliest, ts);
        latest = Math.max(latest, ts);
      }
    }

    return {
      earliest: new Date(earliest).toISOString(),
      latest: new Date(latest).toISOString(),
    };
  }

  private analyzeSizeDistribution(conversations: any[]): {
    small: number;
    medium: number;
    large: number;
    xlarge: number;
  } {
    const distribution = { small: 0, medium: 0, large: 0, xlarge: 0 };

    for (const conv of conversations) {
      const msgCount = conv.mapping ? Object.keys(conv.mapping).length : 0;
      if (msgCount < 5) distribution.small++;
      else if (msgCount < 20) distribution.medium++;
      else if (msgCount < 100) distribution.large++;
      else distribution.xlarge++;
    }

    return distribution;
  }

  private estimateTime(conversationCount: number): Record<string, string> {
    const tier0Ms = conversationCount * 100;
    const tier1Ms = conversationCount * 400;
    const tier2Ms = conversationCount * 600;
    const tier3Ms = conversationCount * 800;
    const tier4Ms = conversationCount * 200;

    return {
      tier0: this.formatDuration(tier0Ms),
      tier1: this.formatDuration(tier1Ms),
      tier2: this.formatDuration(tier2Ms),
      tier3: this.formatDuration(tier3Ms),
      tier4: this.formatDuration(tier4Ms),
    };
  }

  private formatDuration(ms: number): string {
    if (ms < 60000) return `${Math.round(ms / 1000)}s`;
    if (ms < 3600000) return `${Math.round(ms / 60000)}m`;
    return `${Math.round(ms / 3600000)}h`;
  }

  async *streamProcessConversations(
    filePath: string,
    config: ImportTierConfig,
    jobId: string
  ): AsyncGenerator<ConversationProcessResult> {
    const zip = new AdmZip(filePath);
    const rawConversations = JSON.parse(
      zip.getEntry('conversations.json')!.getData().toString('utf8')
    );

    for (const raw of rawConversations) {
      try {
        const parsed = this.parseConversation(raw);
        
        if (!this.validateConversation(parsed)) {
          yield {
            success: false,
            error: 'Invalid conversation format',
            sourceId: raw.conversation_id,
          };
          continue;
        }

        const conversation = await this.storeConversation(parsed, jobId);

        yield {
          success: true,
          conversationId: conversation.id,
          stats: {
            messages: conversation.messageCount,
          },
        };
      } catch (error) {
        yield {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          sourceId: raw.conversation_id,
        };
      }
    }
  }

  private parseConversation(raw: any): any {
    const conversation = {
      provider: 'chatgpt',
      sourceUrl: `import:chatgpt:${raw.conversation_id}`,
      title: raw.title || 'Untitled Conversation',
      model: raw.default_model_slug || 'unknown',
      createdAt: raw.create_time ? new Date(raw.create_time * 1000) : new Date(),
      capturedAt: new Date(),
      metadata: {
        originalId: raw.conversation_id,
        id: raw.id,
        isArchived: raw.is_archived || false,
        isStarred: raw.is_starred || false,
        createTime: raw.create_time,
        updateTime: raw.update_time,
      },
    };

    const messages: any[] = [];
    const mapping = raw.mapping || {};
    
    let rootNodeId: string | null = null;
    for (const [nodeId, node] of Object.entries(mapping)) {
      if (!node.parent || node.parent === null) {
        rootNodeId = nodeId;
        break;
      }
    }

    if (!rootNodeId) {
      rootNodeId = Object.keys(mapping)[0];
    }

    const queue = [rootNodeId];
    const visited = new Set<string>();

    while (queue.length > 0) {
      const nodeId = queue.shift()!;
      if (visited.has(nodeId)) continue;
      visited.add(nodeId);

      const node = mapping[nodeId];
      if (!node) continue;

      if (node.message) {
        const msg = node.message;
        if (msg.content && (msg.content.parts || msg.content.content_type)) {
          messages.push({
            id: msg.id || uuidv4(),
            role: msg.author?.role || 'assistant',
            author: msg.author?.name,
            content: msg.content,
            timestamp: msg.create_time ? new Date(msg.create_time * 1000) : new Date(),
          });
        }
      }

      if (node.children && Array.isArray(node.children)) {
        for (const childId of node.children) {
          if (!visited.has(childId)) {
            queue.push(childId);
          }
        }
      }
    }

    const normalizedMessages = messages
      .filter(msg => msg.content && (msg.content.parts || msg.content.content_type))
      .map((msg, index) => ({
        id: msg.id,
        role: msg.role,
        author: msg.author,
        parts: this.normalizeContent(msg.content),
        messageIndex: index,
        createdAt: msg.timestamp,
        tokenCount: msg.metadata?.token_count || null,
        status: 'completed',
        metadata: msg.metadata || {},
      }));

    return {
      ...conversation,
      messages: normalizedMessages,
      messageCount: normalizedMessages.length,
      userMessageCount: normalizedMessages.filter((m: any) => m.role === 'user').length,
      aiMessageCount: normalizedMessages.filter((m: any) => m.role === 'assistant').length,
    };
  }

  private normalizeContent(content: any): any[] {
    if (!content) return [];

    if (content.content_type === 'text' && Array.isArray(content.parts)) {
      return [{ type: 'text', content: content.parts.join('') }];
    }

    if (content.content_type === 'code') {
      return [{
        type: 'code',
        content: content.code || content.text || '',
        language: content.language || 'text',
      }];
    }

    if (content.content_type === 'image') {
      return [{
        type: 'image',
        content: content.url || content.src || '',
        metadata: { alt: content.alt },
      }];
    }

    if (content.parts && Array.isArray(content.parts)) {
      return content.parts.map((part: any) => ({
        type: 'text',
        content: typeof part === 'string' ? part : JSON.stringify(part),
      }));
    }

    return [{ type: 'text', content: JSON.stringify(content) }];
  }

  private validateConversation(conversation: any): boolean {
    return !!(
      conversation.provider &&
      conversation.title &&
      Array.isArray(conversation.messages)
    );
  }

  private async storeConversation(
    parsed: any,
    jobId: string
  ): Promise<any> {
    const prisma = getPrismaClient();
    const { v4: uuidv4 } = await import('uuid');

    const contentHash = this.generateContentHash(parsed);
    const conversationId = uuidv4();

    const conversation = await prisma.conversation.create({
      data: {
        id: conversationId,
        provider: parsed.provider,
        sourceUrl: parsed.sourceUrl,
        contentHash,
        title: parsed.title,
        model: parsed.model,
        ownerId: (await this.getJobUserId(jobId)) || 'unknown',
        state: 'ACTIVE',
        createdAt: parsed.createdAt,
        updatedAt: new Date(),
        capturedAt: parsed.capturedAt,
        messageCount: parsed.messageCount,
        userMessageCount: parsed.userMessageCount,
        aiMessageCount: parsed.aiMessageCount,
        totalWords: this.calculateTotalWords(parsed.messages),
        totalCharacters: this.calculateTotalCharacters(parsed.messages),
        totalCodeBlocks: this.countCodeBlocks(parsed.messages),
        metadata: {
          ...parsed.metadata,
          imported: true,
          importedAt: new Date().toISOString(),
          importJobId: jobId,
        },
        messages: {
          create: parsed.messages.map((msg: any, index: number) => ({
            id: msg.id || uuidv4(),
            role: msg.role,
            author: msg.author,
            parts: msg.parts || [],
            messageIndex: index,
            createdAt: msg.createdAt || new Date(),
            status: 'completed',
            tokenCount: msg.tokenCount,
            metadata: msg.metadata || {},
          })),
        },
      },
    });

    await prisma.importedConversation.create({
      data: {
        importJobId: jobId,
        sourceId: parsed.metadata.originalId,
        sourceUrl: parsed.sourceUrl,
        title: parsed.title,
        provider: parsed.provider,
        state: 'STORED',
        messageCount: parsed.messageCount,
        conversationId: conversation.id,
        importedAt: new Date(),
        metadata: parsed,
      },
    });

    return conversation;
  }

  private async getJobUserId(jobId: string): Promise<string | null> {
    const prisma = getPrismaClient();
    const job = await prisma.importJob.findUnique({ where: { id: jobId } });
    return job?.userId || null;
  }

  private generateContentHash(conversation: any): string {
    const canonical = JSON.stringify({
      provider: conversation.provider,
      sourceUrl: conversation.sourceUrl,
      messages: conversation.messages.map((m: any) => ({
        role: m.role,
        content: JSON.stringify(m.parts),
        timestamp: m.createdAt?.toISOString(),
      })),
    });

    return createHash('sha256').update(canonical).digest('hex');
  }

  private calculateTotalWords(messages: any[]): number {
    return messages.reduce((total, msg) => {
      const text = this.extractTextFromParts(msg.parts || []);
      return total + (text.split(/\s+/).filter((w: string) => w.length > 0).length);
    }, 0);
  }

  private calculateTotalCharacters(messages: any[]): number {
    return messages.reduce((total, msg) => {
      const text = this.extractTextFromParts(msg.parts || []);
      return total + text.length;
    }, 0);
  }

  private countCodeBlocks(messages: any[]): number {
    return messages.reduce((count, msg) => {
      const parts = msg.parts || [];
      return count + parts.filter((p: any) => p.type === 'code').length;
    }, 0);
  }

  private extractTextFromParts(parts: any[]): string {
    return parts
      .filter((p: any) => p.type === 'text')
      .map((p: any) => p.content || '')
      .join(' ');
  }
}

export const streamingImportService = new StreamingImportService();
export default streamingImportService;
