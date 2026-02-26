import { EventEmitter } from 'events';
import { VivimChainClient } from '../chain/ChainClient.js';
import { DistributedContentClient } from '../storage/DistributedContentClient.js';
/**
 * VivimChatRuntime bridges assistant-ui with blockchain-stored conversations.
 */
export declare class VivimChatRuntime extends EventEmitter {
    private chainClient;
    private contentClient;
    private conversationId;
    constructor(chainClient: VivimChainClient, contentClient: DistributedContentClient);
    newThread(): Promise<string>;
    sendMessage(content: string): Promise<void>;
    setConversationId(id: string): void;
    getConversationId(): string | null;
}
//# sourceMappingURL=VivimChatRuntime.d.ts.map