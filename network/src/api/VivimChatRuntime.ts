import { EventEmitter } from 'events';
import { VivimChainClient } from '../chain/ChainClient.js';
import { DistributedContentClient, ContentType } from '../storage/DistributedContentClient.js';
import { createModuleLogger } from '../utils/logger.js';

const log = createModuleLogger('api:chat-runtime');

/**
 * VivimChatRuntime bridges assistant-ui with blockchain-stored conversations.
 */
export class VivimChatRuntime extends EventEmitter {
  private chainClient: VivimChainClient;
  private contentClient: DistributedContentClient;
  private conversationId: string | null = null;

  constructor(chainClient: VivimChainClient, contentClient: DistributedContentClient) {
    super();
    this.chainClient = chainClient;
    this.contentClient = contentClient;
  }

  async newThread(): Promise<string> {
    const { entityId } = await this.chainClient.createEntity('conversation' as any, {
      title: 'New Conversation',
      createdAt: Date.now(),
    });
    this.conversationId = entityId;
    return entityId;
  }

  async sendMessage(content: string): Promise<void> {
    if (!this.conversationId) await this.newThread();

    // 1. Create message entity on-chain
    await this.chainClient.createEntity('message' as any, {
      conversationId: this.conversationId,
      role: 'user',
      content,
      createdAt: Date.now(),
    });

    log.info({ conversationId: this.conversationId }, 'Message sent to chain');
    
    // In a real app, this would trigger the AI model provider
    this.emit('message:sent', { content, role: 'user' });
  }

  setConversationId(id: string) {
    this.conversationId = id;
  }

  getConversationId() {
    return this.conversationId;
  }
}
