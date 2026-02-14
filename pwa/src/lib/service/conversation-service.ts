import { getStorage } from '../storage-v2';
import { log } from '../logger';
import { asHash } from '../storage-v2/types';
import type { Conversation, Message, ContentBlock, ConversationStats } from '../../types/conversation';
import type { MessageNode, ConversationRoot } from '../storage-v2/types';

export class ConversationService {
  private storage = getStorage();

  /**
   * Get all conversations formatted for the UI
   */
  async getAllConversations(): Promise<Conversation[]> {
    log.storage.debug('Service: Fetching all conversations...');
    const list = await this.storage.listConversations();
    log.storage.debug(`Service: Found ${list.length} conversations in index.`);
    
    return list.map(({ root, messageCount, lastMessageAt }) => ({
      id: root.conversationId,
      title: root.title,
      // Default to 'other' if provider is missing or invalid type
      provider: (root.metadata?.provider as Conversation['provider']) || 'other',
      sourceUrl: (root.metadata?.sourceUrl as string) || '',
      createdAt: root.metadata.createdAt as string || root.timestamp,
      exportedAt: root.timestamp, // Using timestamp as export time for now
      messages: [], // List doesn't return messages to save bandwidth
      stats: {
        totalMessages: messageCount,
        totalWords: 0, // Would need full scan
        totalCharacters: 0,
        firstMessageAt: root.metadata.createdAt as string || root.timestamp,
        lastMessageAt: lastMessageAt || root.timestamp
      },
      metadata: root.metadata
    }));
  }

  /**
   * Get a full conversation with messages
   */
  async getConversation(id: string): Promise<Conversation | null> {
    log.storage.debug(`Service: Requesting conversation ${id.slice(0, 10)}...`);
    const root = await this.storage.getConversation(asHash(id));

    if (!root) {
      log.storage.warn(`Service: Conversation ${id.slice(0, 10)} root not found in storage.`);
      return null;
    }

    log.storage.debug(`Service: Found root for "${root.title}". Fetching messages...`);
    const dagMessages = await this.storage.getMessages(asHash(id));
    log.storage.debug(`Service: Retrieved ${dagMessages.length} DAG messages.`);

    const messages = this.adaptMessages(dagMessages);
    const stats = this.calculateStats(messages, root);

    log.storage.info(`Service: Successfully adapted conversation "${root.title}"`);
    return {
      id: root.conversationId,
      title: root.title,
      provider: (root.metadata?.provider as Conversation['provider']) || 'other',
      sourceUrl: (root.metadata?.sourceUrl as string) || '',
      createdAt: root.metadata.createdAt as string || root.timestamp,
      exportedAt: root.timestamp,
      metadata: root.metadata,
      messages,
      stats
    };
  }

  /**
   * Add a user message
   */
  async addUserMessage(conversationId: string, text: string): Promise<Message> {
    const node = await this.storage.appendMessage(asHash(conversationId), 'user', text);
    return this.adaptMessage(node);
  }

  /**
   * Delete a conversation
   */
  async deleteConversation(id: string): Promise<void> {
    await this.storage.deleteConversation(asHash(id));
  }

  // ===========================================================================
  // Adapters
  // ===========================================================================

  private adaptMessages(nodes: MessageNode[]): Message[] {
    return nodes.map(node => this.adaptMessage(node));
  }

  private adaptMessage(node: MessageNode): Message {
    return {
      id: node.id,
      role: node.role,
      content: this.adaptContent(node.content),
      timestamp: node.timestamp
    };
  }

  private adaptContent(content: unknown): string | ContentBlock[] {
    // If it's already in the right format, return it
    if (typeof content === 'string') return content;
    if (Array.isArray(content)) return content as ContentBlock[];
    return String(content);
  }

  private calculateStats(messages: Message[], root: ConversationRoot): ConversationStats {
    // Basic stats calculation matching Prisma schema
    let words = 0;
    let chars = 0;
    let codeBlocks = 0;
    let mermaidDiagrams = 0;
    let images = 0;
    let tables = 0;
    let latexBlocks = 0;
    let toolCalls = 0;

    messages.forEach(msg => {
      if (typeof msg.content === 'string') {
        words += msg.content.split(/\s+/).length;
        chars += msg.content.length;
      } else if (Array.isArray(msg.content)) {
        msg.content.forEach(block => {
          // Get content as string for word/char counting
          let blockContent = '';
          if (typeof block.content === 'string') {
            blockContent = block.content;
          } else if (typeof block.content === 'object' && block.content !== null) {
            // Handle object content (tables, tool calls, etc.)
            blockContent = JSON.stringify(block.content);
          } else {
            blockContent = String(block.content ?? '');
          }

          words += blockContent.split(/\s+/).length;
          chars += blockContent.length;

          // Count rich content types
          switch (block.type) {
            case 'code':
              codeBlocks++;
              break;
            case 'mermaid':
              mermaidDiagrams++;
              break;
            case 'image':
              images++;
              break;
            case 'table':
              tables++;
              break;
            case 'math':
            case 'latex':
              latexBlocks++;
              break;
            case 'tool_call':
              toolCalls++;
              break;
          }
        });
      }
    });

    return {
      totalMessages: messages.length,
      totalWords: words,
      totalCharacters: chars,
      totalCodeBlocks: codeBlocks,
      totalMermaidDiagrams: mermaidDiagrams,
      totalImages: images,
      totalTables: tables,
      totalLatexBlocks: latexBlocks,
      totalToolCalls: toolCalls,
      firstMessageAt: root.metadata.createdAt as string || root.timestamp,
      lastMessageAt: messages.length > 0
        ? messages[messages.length - 1].timestamp || root.timestamp
        : root.timestamp
    };
  }
}

export const conversationService = new ConversationService();
