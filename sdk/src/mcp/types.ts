import type { VivimSDKConfig } from '../core/types.js';

/**
 * MCP Server Configuration
 */
export interface MCPConfig {
  serverName: string;
  serverVersion: string;
  transport: 'stdio' | 'http' | 'streamable' | 'libp2p';
  port?: number;
  host?: string;
  allowedTools?: string[];
  deniedTools?: string[];
  readOnly?: boolean;
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
  sdkConfig?: VivimSDKConfig;
}

/**
 * Default MCP configuration
 */
export const DEFAULT_MCP_CONFIG: Partial<MCPConfig> = {
  serverName: 'vivim-mcp',
  serverVersion: '1.0.0',
  transport: 'stdio',
  port: 3000,
  host: 'localhost',
  logLevel: 'info',
  readOnly: false,
};

/**
 * Tool definition for MCP
 */
export interface MCPToolDefinition {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

/**
 * Tool handler function
 */
export type MCPToolHandler = (
  params: Record<string, unknown>,
  context: MCPContext
) => Promise<MCPResponse>;

/**
 * MCP Response
 */
export interface MCPResponse {
  content: Array<{
    type: 'text' | 'image' | 'resource';
    text?: string;
    data?: string;
    mimeType?: string;
  }>;
  isError?: boolean;
}

/**
 * MCP Context - passed to all tool handlers
 */
export interface MCPContext {
  identity: {
    did: string | null;
    publicKey: string | null;
  };
  sessionId: string;
  config: MCPConfig;
  // SDK instance will be added at runtime
  sdk?: any;
}

/**
 * MCP Error codes
 */
export const MCP_ERROR_CODES = {
  PARSE_ERROR: -32700,
  INVALID_REQUEST: -32600,
  METHOD_NOT_FOUND: -32601,
  INVALID_PARAMS: -32602,
  INTERNAL_ERROR: -32603,
} as const;

/**
 * MCP JSON-RPC message types
 */
export interface JSONRPCRequest {
  jsonrpc: '2.0';
  id: string | number | null;
  method: string;
  params?: Record<string, unknown>;
}

export interface JSONRPCResponse {
  jsonrpc: '2.0';
  id: string | number | null;
  result?: unknown;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
}

export interface JSONRPCNotification {
  jsonrpc: '2.0';
  method: string;
  params?: Record<string, unknown>;
}

/**
 * MCP Transport interface
 */
export interface MCPTransport {
  start(): Promise<void>;
  stop(): Promise<void>;
  send(message: JSONRPCResponse | JSONRPCNotification): void;
  onMessage(handler: (message: JSONRPCRequest) => void): void;
}

/**
 * Initialize request parameters
 */
export interface InitializeParams {
  protocolVersion?: string;
  capabilities?: {
    tools?: boolean;
    resources?: boolean;
    prompts?: boolean;
  };
  clientInfo?: {
    name: string;
    version: string;
  };
}

/**
 * Initialize result
 */
export interface InitializeResult {
  protocolVersion: string;
  serverInfo: {
    name: string;
    version: string;
  };
  capabilities: {
    tools?: Record<string, unknown>;
    resources?: Record<string, unknown>;
    prompts?: Record<string, unknown>;
  };
}

/**
 * Transport configuration
 */
export interface TransportConfig {
  /** Enable debugging */
  debug?: boolean;
  /** Message timeout in ms */
  timeout?: number;
  /** Retry attempts */
  retryAttempts?: number;
  /** Retry delay in ms */
  retryDelay?: number;
}
