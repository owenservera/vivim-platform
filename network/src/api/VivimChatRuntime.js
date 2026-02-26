import { EventEmitter } from 'events';
import { createModuleLogger } from '../utils/logger.js';
const log = createModuleLogger('api:chat-runtime');
/**
 * VivimChatRuntime bridges assistant-ui with blockchain-stored conversations.
 */
export class VivimChatRuntime extends EventEmitter {
    chainClient;
    contentClient;
    conversationId = null;
    constructor(chainClient, contentClient) {
        super();
        this.chainClient = chainClient;
        this.contentClient = contentClient;
    }
    async newThread() {
        const { entityId } = await this.chainClient.createEntity('conversation', {
            title: 'New Conversation',
            createdAt: Date.now(),
        });
        this.conversationId = entityId;
        return entityId;
    }
    async sendMessage(content) {
        if (!this.conversationId)
            await this.newThread();
        // 1. Create message entity on-chain
        await this.chainClient.createEntity('message', {
            conversationId: this.conversationId,
            role: 'user',
            content,
            createdAt: Date.now(),
        });
        log.info({ conversationId: this.conversationId }, 'Message sent to chain');
        // In a real app, this would trigger the AI model provider
        this.emit('message:sent', { content, role: 'user' });
    }
    setConversationId(id) {
        this.conversationId = id;
    }
    getConversationId() {
        return this.conversationId;
    }
}
//# sourceMappingURL=VivimChatRuntime.js.map