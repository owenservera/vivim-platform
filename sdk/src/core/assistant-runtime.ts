/**
 * VIVIM Assistant Runtime
 * 
 * A specialized runtime bridge for assistant-ui and tool-ui.
 * This class maps SDK core events and node methods to the standardized
 * parameters expected by AI UI libraries.
 */

import { EventEmitter } from 'events';
import type { VivimSDK } from './sdk.js';
import { 
  SDKMessage, 
  SDKContentPart, 
  SDKThread,
  ASSISTANT_EVENTS
} from './assistant.js';
import { SDK_EVENTS } from './constants.js';

export interface RuntimeState {
  messages: SDKMessage[];
  threadId: string | null;
  isLoading: boolean;
  error: Error | null;
}

/**
 * VivimAssistantRuntime
 * 
 * Embedded core runtime that standardizes communication between the
 * decentralized SDK and the React/Vue/Svelte frontend UI.
 */
export class VivimAssistantRuntime extends EventEmitter {
  private state: RuntimeState = {
    messages: [],
    threadId: null,
    isLoading: false,
    error: null,
  };

  constructor(private sdk: VivimSDK) {
    super();
    this.setupListeners();
  }

  private setupListeners() {
    // Listen for network events to update status
    this.sdk.on('network:connected', (peerId) => {
      this.emit('status:change', { peerId, connected: true });
    });

    // Listen for incoming messages from the mesh
    this.sdk.on(SDK_EVENTS.NODE_LOADED as any, ({ node }: any) => {
      if (node.id === 'ai-chat-node') {
        // Handle AI node specific events
      }
    });
  }

  /**
   * Initialize a new conversation thread
   */
  async createThread(title?: string): Promise<string> {
    const chatNode = await this.sdk.getAIChatNode();
    const conversation = await chatNode.createConversation({ title });
    this.state.threadId = conversation.id;
    this.state.messages = [];
    this.emit('state:change', this.state);
    return conversation.id;
  }

  /**
   * Send a message to the assistant
   * Standardizes the input to SDKContentPart format
   */
  async sendMessage(content: string | SDKContentPart[]): Promise<void> {
    if (!this.state.threadId) {
      await this.createThread();
    }

    const threadId = this.state.threadId!;
    const parts: SDKContentPart[] = typeof content === 'string' 
      ? [{ type: 'text', text: content }] 
      : content;

    // Create optimistic user message
    const userMsg: SDKMessage = {
      id: Math.random().toString(36).slice(2, 11),
      role: 'user',
      content: parts,
      createdAt: Date.now(),
      threadId
    };

    this.state.messages.push(userMsg);
    this.state.isLoading = true;
    this.emit('state:change', this.state);

    try {
      const chatNode = await this.sdk.getAIChatNode();
      
      // Execute stream
      const stream = chatNode.streamMessage(threadId, typeof content === 'string' ? content : JSON.stringify(content));
      
      let assistantMsg: SDKMessage | null = null;

      for await (const chunk of stream) {
        if (chunk.type === 'text' && chunk.text) {
          if (!assistantMsg) {
            assistantMsg = {
              id: Math.random().toString(36).slice(2, 11),
              role: 'assistant',
              content: [{ type: 'text', text: '' }],
              createdAt: Date.now(),
              threadId
            };
            this.state.messages.push(assistantMsg);
          }

          const textPart = assistantMsg.content[0] as any;
          textPart.text += chunk.text;
          this.emit('state:change', this.state);
        }
      }
    } catch (error) {
      this.state.error = error as Error;
      this.emit('error', error);
    } finally {
      this.state.isLoading = false;
      this.emit('state:change', this.state);
    }
  }

  /**
   * Map standard Tool-UI endpoints to SDK core nodes
   */
  async executeTool(toolName: string, args: Record<string, any>): Promise<any> {
    this.emit('tool:call', { toolName, args });
    
    // In a fully embedded core, we route this to the ToolEngine
    // or specific specialized nodes (ACU, Git, etc.)
    try {
      if (toolName === 'acu_generate') {
        const contentNode = await this.sdk.getContentNode();
        return await (contentNode as any).processUrl(args.targetUrl);
      }
      
      // Default fallback to ToolEngineApp via network events
      this.sdk.emit('tool:call' as any, { toolName, args });
    } catch (error) {
      this.emit('tool:error', { toolName, error });
      throw error;
    }
  }

  getState(): RuntimeState {
    return { ...this.state };
  }
}
