/**
 * VIVIM SDK - Enhanced Assistant-UI Adapter
 * 
 * Provides a standardized bridge for @assistant-ui/react to consume
 * the VIVIM SDK core directly with full protocol support.
 * 
 * @see https://github.com/owenservera/assistant-ui-VIVIM
 */

import { 
  VivimMessage, 
  ContentBlock, 
  ToolCallContentBlock,
  createTextBlock,
  createToolCallBlock,
  createToolResultBlock,
  MessageRole,
  VivimMessageSchema,
  extractTextContent
} from '../chat/types.js';

/**
 * Stream parameters from assistant-ui
 */
export interface StreamParams {
  messages: AssistantUIMessage[];
  headers?: Record<string, string>;
}

/**
 * Assistant UI message format
 */
export interface AssistantUIMessage {
  role: 'system' | 'user' | 'assistant';
  content: AssistantUIContent[];
  id?: string;
  createdAt?: number;
}

/**
 * Assistant UI content block format
 */
export type AssistantUIContent = 
  | { type: 'text'; text: string }
  | { type: 'image'; image: string }
  | { type: 'tool-call'; toolCall: AssistantUIToolCall }
  | { type: 'tool-result'; toolResult: AssistantUIToolResult };

/**
 * Assistant UI tool call
 */
export interface AssistantUIToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

/**
 * Assistant UI tool result
 */
export interface AssistantUIToolResult {
  toolCallId: string;
  result: unknown;
  isError?: boolean;
}

/**
 * Stream chunk from VIVIM to assistant-ui
 */
export interface StreamChunk {
  id?: string;
  role?: 'assistant' | 'tool';
  content: AssistantUIContent[];
  finishReason?: 'stop' | 'length' | 'tool_calls' | 'content_filter';
}

/**
 * Configuration for VivimSDKTransport
 */
export interface VivimSDKTransportConfig {
  threadId: string;
  enableToolUI: boolean;
  enableStreaming: boolean;
  humanApprovalEnabled: boolean;
  autoApproveTools?: boolean;
}

/**
 * VivimSDKTransport
 * 
 * Implements the ChatModelAdapter interface from assistant-ui
 * Converts between assistant-ui message format and VIVIM protocol format
 */
export class VivimSDKTransport {
  private pendingToolCalls: Map<string, ToolCallContentBlock> = new Map();
  
  constructor(
    private config: VivimSDKTransportConfig
  ) {}

  /**
   * Main entry point for assistant-ui to send messages
   * Handles streaming, tool calls, and approval workflows
   */
  async *stream(params: StreamParams): AsyncIterable<StreamChunk> {
    const { messages } = params;
    
    // Convert assistant-ui messages to VIVIM format
    const lastMessage = messages[messages.length - 1];
    const vivimContent = this.convertToVivimContent(lastMessage.content);
    
    // Extract text content
    const textContent = this.extractTextFromContent(vivimContent);
    
    // Check for tool calls in the message
    const toolCalls = this.extractToolCalls(vivimContent);
    
    if (toolCalls.length > 0) {
      // Handle tool calls with approval workflow
      yield* this.handleToolCalls(toolCalls);
    } else {
      // Regular message - yield to assistant
      yield* this.streamAssistantResponse(textContent);
    }
  }

  /**
   * Handle tool calls with approval workflow
   */
  private async *handleToolCalls(
    toolCalls: ToolCallContentBlock[]
  ): AsyncIterable<StreamChunk> {
    const toolCallIds: string[] = [];
    
    for (const toolCall of toolCalls) {
      // Store pending tool call
      this.pendingToolCalls.set(toolCall.id, toolCall);
      toolCallIds.push(toolCall.id);
      
      if (this.config.humanApprovalEnabled && !this.config.autoApproveTools) {
        // Yield pending approval request
        yield {
          content: [{
            type: 'tool-call' as const,
            toolCall: {
              id: toolCall.id,
              name: toolCall.name,
              arguments: toolCall.input,
            }
          }],
          finishReason: 'tool_calls'
        };
        
        // Wait for approval (implementation depends on runtime)
        // For now, auto-approve if not enabled
      }
    }
  }

  /**
   * Stream assistant response
   */
  private async *streamAssistantResponse(text: string): AsyncIterable<StreamChunk> {
    // Start of stream
    yield {
      role: 'assistant',
      content: [],
      finishReason: undefined
    };

    // Stream each character/token
    const chunkSize = this.config.enableStreaming ? 1 : text.length;
    for (let i = 0; i < text.length; i += chunkSize) {
      const chunk = text.slice(i, i + chunkSize);
      yield {
        content: [{ type: 'text' as const, text: chunk }],
        finishReason: undefined
      };
      
      if (this.config.enableStreaming) {
        await this.delay(20);
      }
    }

    // End of stream
    yield {
      role: 'assistant',
      content: [],
      finishReason: 'stop'
    };
  }

  /**
   * Convert assistant-ui content to VIVIM content blocks
   */
  private convertToVivimContent(content: AssistantUIContent[]): ContentBlock[] {
    return content.map(block => {
      switch (block.type) {
        case 'text':
          return createTextBlock(block.text);
        case 'tool-call':
          return createToolCallBlock(
            block.toolCall.id,
            block.toolCall.name,
            block.toolCall.arguments
          );
        case 'tool-result':
          return createToolResultBlock(
            block.toolResult.toolCallId,
            block.toolResult.result,
            block.toolResult.isError
          );
        case 'image':
          return {
            type: 'image' as const,
            source: {
              type: 'url' as const,
              media_type: 'image/*',
              data: block.image
            }
          };
        default:
          return createTextBlock(JSON.stringify(block));
      }
    });
  }

  /**
   * Extract text from content blocks
   */
  private extractTextFromContent(content: ContentBlock[]): string {
    return content
      .filter(b => b.type === 'text')
      .map(b => (b as { text: string }).text)
      .join('');
  }

  /**
   * Extract tool calls from content blocks
   */
  private extractToolCalls(content: ContentBlock[]): ToolCallContentBlock[] {
    return content.filter(
      (b): b is ToolCallContentBlock => b.type === 'tool_call'
    );
  }

  /**
   * Approve a tool call
   */
  approveToolCall(toolCallId: string, modifiedInput?: Record<string, unknown>): boolean {
    const toolCall = this.pendingToolCalls.get(toolCallId);
    if (toolCall) {
      toolCall.approved = 'approved';
      if (modifiedInput) {
        toolCall.modified_input = modifiedInput;
      }
      return true;
    }
    return false;
  }

  /**
   * Deny a tool call
   */
  denyToolCall(toolCallId: string): boolean {
    const toolCall = this.pendingToolCalls.get(toolCallId);
    if (toolCall) {
      toolCall.approved = 'denied';
      return true;
    }
    return false;
  }

  /**
   * Get pending tool calls
   */
  getPendingToolCalls(): ToolCallContentBlock[] {
    return Array.from(this.pendingToolCalls.values());
  }

  /**
   * Clear pending tool calls
   */
  clearPendingToolCalls(): void {
    this.pendingToolCalls.clear();
  }

  /**
   * Validate incoming message
   */
  validateMessage(message: unknown): { valid: boolean; errors: string[] } {
    const result = VivimMessageSchema.safeParse(message);
    if (result.success) {
      return { valid: true, errors: [] };
    }
    return {
      valid: false,
      errors: result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
    };
  }

  /**
   * Delay utility for streaming
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Helper to create a standardized runtime config for assistant-ui
 */
export function createAssistantRuntimeConfig(
  threadId: string,
  options: Partial<VivimSDKTransportConfig> = {}
): { transport: VivimSDKTransport } {
  const config: VivimSDKTransportConfig = {
    threadId,
    enableToolUI: options.enableToolUI ?? true,
    enableStreaming: options.enableStreaming ?? true,
    humanApprovalEnabled: options.humanApprovalEnabled ?? false,
    autoApproveTools: options.autoApproveTools ?? false,
  };
  
  return {
    transport: new VivimSDKTransport(config),
  };
}

/**
 * Convert VIVIM message to assistant-ui format
 */
export function toAssistantUIMessage(message: VivimMessage): AssistantUIMessage {
  const content: AssistantUIMessage['content'] = message.content.map(block => {
    switch (block.type) {
      case 'text':
        return { type: 'text', text: block.text };
      case 'tool_call':
        return {
          type: 'tool-call',
          toolCall: {
            id: block.id,
            name: block.name,
            arguments: block.input,
          }
        };
      case 'tool_result':
        return {
          type: 'tool-result',
          toolResult: {
            toolCallId: block.tool_call_id,
            result: block.result,
            isError: block.is_error,
          }
        };
      case 'image':
        return { type: 'image', image: block.source.data || '' };
      default:
        return { type: 'text', text: JSON.stringify(block) };
    }
  });
  
  return {
    role: message.role as 'system' | 'user' | 'assistant',
    content,
    id: message.id,
    createdAt: message.created_at,
  };
}

/**
 * Convert assistant-ui message to VIVIM format
 */
export function fromAssistantUIMessage(message: AssistantUIMessage, threadId?: string): VivimMessage {
  return {
    id: message.id || `msg_${Date.now()}`,
    type: `vivim.${message.role}.message`,
    role: message.role as MessageRole,
    content: message.content.map(block => {
      switch (block.type) {
        case 'text':
          return createTextBlock(block.text);
        case 'tool-call':
          return createToolCallBlock(
            block.toolCall.id,
            block.toolCall.name,
            block.toolCall.arguments
          );
        case 'tool-result':
          return createToolResultBlock(
            block.toolResult.toolCallId,
            block.toolResult.result,
            block.toolResult.isError
          );
        case 'image':
          return {
            type: 'image' as const,
            source: {
              type: 'url' as const,
              media_type: 'image/*',
              data: block.image
            }
          };
        default:
          return createTextBlock(JSON.stringify(block));
      }
    }),
    thread_id: threadId,
    created_at: message.createdAt || Date.now(),
  };
}
