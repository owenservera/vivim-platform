/**
 * VIVIM SDK - Assistant & Tool UI Standard Schema
 * 
 * Standardizes the integration between the decentralized core and AI UIs
 * like assistant-ui and tool-ui.
 */

/**
 * Standard message roles
 */
export type MessageRole = 'system' | 'user' | 'assistant' | 'tool' | 'data';

/**
 * Standard content part types
 */
export type ContentPartType = 
  | 'text' 
  | 'image' 
  | 'tool_call' 
  | 'tool_result' 
  | 'data' 
  | 'ui';

/**
 * Text content part
 */
export interface TextContentPart {
  type: 'text';
  text: string;
  metadata?: Record<string, unknown>;
}

/**
 * Image content part
 */
export interface ImageContentPart {
  type: 'image';
  image: string; // URL or base64
  metadata?: {
    alt?: string;
    mimeType?: string;
  };
}

/**
 * Tool call content part
 */
export interface ToolCallContentPart {
  type: 'tool_call';
  toolCallId: string;
  toolName: string;
  args: Record<string, unknown>;
}

/**
 * Tool result content part
 */
export interface ToolResultContentPart {
  type: 'tool_result';
  toolCallId: string;
  toolName: string;
  result: unknown;
  isError?: boolean;
}

/**
 * UI content part (for tool-ui integration)
 */
export interface UIContentPart {
  type: 'ui';
  component: string; // Component name in tool-ui registry
  props: Record<string, unknown>;
  state?: 'loading' | 'complete' | 'error';
}

/**
 * Data content part
 */
export interface DataContentPart {
  type: 'data';
  data: unknown;
}

/**
 * Union of all content part types
 */
export type SDKContentPart = 
  | TextContentPart 
  | ImageContentPart 
  | ToolCallContentPart 
  | ToolResultContentPart 
  | UIContentPart 
  | DataContentPart;

/**
 * Standard SDK Message
 */
export interface SDKMessage {
  id: string;
  role: MessageRole;
  content: SDKContentPart[];
  createdAt: number;
  authorDid?: string;
  threadId?: string;
  metadata?: MessageMetadata;
}

/**
 * Message metadata for UI/SDK coordination
 */
export interface MessageMetadata {
  model?: string;
  finishReason?: string;
  tokens?: number;
  tags?: string[];
  [key: string]: unknown;
}

/**
 * Standard SDK Thread
 */
export interface SDKThread {
  id: string;
  title?: string;
  messages: SDKMessage[];
  createdAt: number;
  updatedAt: number;
  metadata?: Record<string, unknown>;
}

/**
 * Tool definition for UI discovery
 */
export interface SDKToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, unknown>; // JSON Schema
  ui?: {
    component: string;
    defaultProps?: Record<string, unknown>;
  };
}

/**
 * Constants for event mapping
 */
export const ASSISTANT_EVENTS = {
  MESSAGE_CREATE: 'assistant:message:create',
  MESSAGE_UPDATE: 'assistant:message:update',
  THREAD_CREATE: 'assistant:thread:create',
  TOOL_CALL: 'assistant:tool:call',
  TOOL_RESULT: 'assistant:tool:result',
  STREAM_START: 'assistant:stream:start',
  STREAM_CHUNK: 'assistant:stream:chunk',
  STREAM_END: 'assistant:stream:end',
} as const;

/**
 * Standard parameters for Assistant-UI integration
 */
export interface AssistantUIParams {
  threadId: string;
  userId: string;
  model: string;
  stream: boolean;
  maxTokens?: number;
  temperature?: number;
  tools?: string[]; // IDs of tools to enable
}

/**
 * VivimAssistantRuntime
 * 
 * Bridges the VivimSDK with Assistant-UI runtimes.
 * Maps decentralized events to UI-friendly message formats.
 */
export class VivimAssistantRuntime {
  constructor(private sdk: any) {}

  /**
   * Maps an SDKMessage to the format expected by Assistant-UI
   */
  mapToUIMessage(message: SDKMessage): any {
    return {
      id: message.id,
      role: message.role,
      content: message.content.map(part => {
        if (part.type === 'text') return { type: 'text', text: part.text };
        if (part.type === 'image') return { type: 'image', image: part.image };
        if (part.type === 'tool_call') return { 
          type: 'tool-call', 
          toolCallId: part.toolCallId,
          toolName: part.toolName,
          args: part.args 
        };
        if (part.type === 'tool_result') return {
          type: 'tool-result',
          toolCallId: part.toolCallId,
          result: part.result
        };
        return part;
      }),
      createdAt: new Date(message.createdAt)
    };
  }

  /**
   * Standardizes tool-ui component mapping
   */
  getToolUIComponent(toolName: string): string {
    const mapping: Record<string, string> = {
      'acu_generate': 'LinkPreview',
      'git_commit': 'DataTable',
      'request_approval': 'ApprovalCard',
      'select_option': 'OptionList'
    };
    return mapping[toolName] || 'DefaultToolUI';
  }
}
