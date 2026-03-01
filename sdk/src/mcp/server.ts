/**
 * VIVIM SDK - MCP Server
 * 
 * Main MCP server implementation
 */

import { EventEmitter } from 'events';
import type { 
  MCPConfig, 
  MCPContext, 
  MCPTransport, 
  JSONRPCRequest, 
  JSONRPCResponse,
  InitializeParams,
  InitializeResult,
  MCPToolDefinition,
} from './types.js';
import { ToolRegistry, globalToolRegistry } from './registry.js';
import { StdioTransport } from './transports/stdio.js';
import { HTTPTransport } from './transports/http.js';
import { StreamableTransport } from './transports/streamable.js';
import { LibP2PTransport } from './transports/libp2p-transport.js';
import { HTTPTransport } from './transports/http.js';
import { StreamableTransport } from './transports/streamable.js';
import { createToolRegistry } from './tools/index.js';
import { VivimSDK } from '../core/sdk.js';

/**
 * MCP Server Events
 */
export interface MCPServerEvents {
  initialized: [];
  toolCalled: [string, unknown];
  error: [Error];
}

/**
 * MCP Server - main class for handling MCP protocol
 */
export class MCPServer extends EventEmitter {
  private config: MCPConfig;
  private transport?: MCPTransport;
  private toolRegistry: ToolRegistry;
  private sdk?: VivimSDK;
  private initialized = false;
  private requestId = 0;

  constructor(config: Partial<MCPConfig> = {}) {
    super();
    this.config = {
      serverName: config.serverName || 'vivim-mcp',
      serverVersion: config.serverVersion || '1.0.0',
      transport: config.transport || 'stdio',
      port: config.port || 3000,
      host: config.host || 'localhost',
      allowedTools: config.allowedTools,
      deniedTools: config.deniedTools,
      readOnly: config.readOnly || false,
      logLevel: config.logLevel || 'info',
      sdkConfig: config.sdkConfig,
    };
    this.toolRegistry = createToolRegistry();
  }

  /**
   * Initialize the server and SDK
   */
  async initialize(): Promise<void> {
    // Initialize SDK
    this.sdk = new VivimSDK(this.config.sdkConfig);
    await this.sdk.initialize();

    // Create context
    const context = this.createContext();

    // Initialize transport
    switch (this.config.transport) {
      case 'stdio': {
        this.transport = new StdioTransport({
          onMessage: (msg) => this.handleMessage(msg),
          onClose: () => this.handleClose(),
          onError: (err) => this.emit('error', err),
        });
        await this.transport.start();
        break;
      }
      
      case 'http': {
        const httpTransport = new HTTPTransport({
          port: this.config.port,
          host: this.config.host,
        });
        httpTransport.onMessage((msg) => this.handleMessage(msg));
        this.transport = httpTransport;
        await this.transport.start();
        break;
      }
      
      case 'streamable': {
        const streamableTransport = new StreamableTransport({
          encoding: 'json',
          maxFrameSize: 1024 * 1024,
        });
        streamableTransport.onMessage((msg) => this.handleMessage(msg));
        this.transport = streamableTransport;
        await this.transport.start();
        break;
      }
      
      case 'libp2p': {
        const libp2pTransport = new LibP2PTransport({
          protocolPrefix: '/vivim/mcp',
          enableDHT: true,
          enableGossipsub: true,
        });
        libp2pTransport.onMessage((msg) => this.handleMessage(msg));
        this.transport = libp2pTransport;
        await this.transport.start();
        break;
      }
    }
        const streamableTransport = new StreamableTransport({
          encoding: 'json',
          maxFrameSize: 1024 * 1024,
        });
        streamableTransport.onMessage((msg) => this.handleMessage(msg));
        this.transport = streamableTransport;
        await this.transport.start();
        break;
      }
    }

    this.initialized = true;
    if (this.config.transport === 'stdio') {
      this.transport = new StdioTransport({
        onMessage: (msg) => this.handleMessage(msg),
        onClose: () => this.handleClose(),
        onError: (err) => this.emit('error', err),
      });
      await this.transport.start();
    }

    this.initialized = true;
    this.emit('initialized');
  }

  /**
   * Create MCP context
   */
  private createContext(): MCPContext {
    const identity = this.sdk?.getIdentity() || null;
    return {
      identity: {
        did: identity?.did || null,
        publicKey: identity?.publicKey || null,
      },
      sessionId: crypto.randomUUID(),
      config: this.config,
      sdk: this.sdk,
    };
  }

  /**
   * Handle incoming JSON-RPC message
   */
  private async handleMessage(request: JSONRPCRequest): Promise<void> {
    const id = request.id ?? this.requestId++;
    const method = request.method;

    try {
      let result: unknown;

      switch (method) {
        case 'initialize':
          result = await this.handleInitialize(request.params as InitializeParams);
          break;

        case 'tools/list':
          result = await this.handleListTools();
          break;

        case 'tools/call':
          result = await this.handleToolCall(request.params as {
            name: string;
            arguments?: Record<string, unknown>;
          });
          break;

        case 'ping':
          result = { pong: true };
          break;

        default:
          // Send error for unknown method
          this.sendResponse(id, {
            jsonrpc: '2.0',
            id,
            error: {
              code: -32601,
              message: `Method not found: ${method}`,
            },
          });
          return;
      }

      this.sendResponse(id, {
        jsonrpc: '2.0',
        id,
        result,
      });
    } catch (error) {
      this.sendResponse(id, {
        jsonrpc: '2.0',
        id,
        error: {
          code: -32603,
          message: 'Internal error',
          data: error instanceof Error ? error.message : String(error),
        },
      });
    }
  }

  /**
   * Handle initialize request
   */
  private handleInitialize(params?: InitializeParams): InitializeResult {
    return {
      protocolVersion: params?.protocolVersion || '2024-11-05',
      serverInfo: {
        name: this.config.serverName,
        version: this.config.serverVersion,
      },
      capabilities: {
        tools: {},
        resources: {},
        prompts: {},
      },
    };
  }

  /**
   * Handle tools/list request
   */
  private async handleListTools(): Promise<{ tools: MCPToolDefinition[] }> {
    const tools = this.toolRegistry.filterTools(
      this.config.allowedTools,
      this.config.deniedTools
    );

    return { tools };
  }

  /**
   * Handle tools/call request
   */
  private async handleToolCall(params: {
    name: string;
    arguments?: Record<string, unknown>;
  }): Promise<unknown> {
    // Check read-only mode
    if (this.config.readOnly) {
      const writeTools = ['identity_create', 'content_create', 'social_follow', 
        'social_circle_create', 'storage_pin', 'memory_create'];
      if (writeTools.includes(params.name)) {
        throw new Error('Server is in read-only mode');
      }
    }

    const context = this.createContext();
    const result = await this.toolRegistry.executeTool(
      params.name,
      params.arguments || {},
      context
    );

    this.emit('toolCalled', params.name, params.arguments);

    return result;
  }

  /**
   * Send JSON-RPC response
   */
  private sendResponse(id: string | number | null, response: JSONRPCResponse): void {
    if (this.transport) {
      this.transport.send(response);
    }
  }

  /**
   * Handle transport close
   */
  private handleClose(): void {
    this.log('info', 'Transport closed');
  }

  /**
   * Get the tool registry
   */
  getToolRegistry(): ToolRegistry {
    return this.toolRegistry;
  }

  /**
   * Register additional tools
   */
  registerTool(tool: MCPToolDefinition, handler: (params: Record<string, unknown>, context: MCPContext) => Promise<unknown>): void {
    this.toolRegistry.register(tool, handler);
  }

  /**
   * Get SDK instance
   */
  getSDK(): VivimSDK | undefined {
    return this.sdk;
  }

  /**
   * Check if initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Stop the server
   */
  async stop(): Promise<void> {
    if (this.transport) {
      await this.transport.stop();
    }
    if (this.sdk) {
      await this.sdk.destroy();
    }
    this.initialized = false;
  }

  /**
   * Log message
   */
  private log(level: string, message: string): void {
    if (this.config.logLevel === 'debug' || 
        (level === 'info' && this.config.logLevel !== 'debug')) {
      console.error(`[MCP:${level.toUpperCase()}] ${message}`);
    }
  }
}

/**
 * Create MCP server from environment
 */
export function createMCPServerFromEnv(): MCPServer {
  const config: Partial<MCPConfig> = {
    serverName: 'vivim-mcp',
    serverVersion: '1.0.0',
    transport: (process.env.VIVIM_MCP_TRANSPORT as 'stdio' | 'http' | 'streamable') || 'stdio',
    port: parseInt(process.env.VIVIM_MCP_PORT || '3000', 10),
    host: process.env.VIVIM_MCP_HOST || 'localhost',
    logLevel: (process.env.VIVIM_MCP_LOG_LEVEL as 'debug' | 'info' | 'warn' | 'error') || 'info',
    readOnly: process.env.VIVIM_MCP_READ_ONLY === 'true',
    allowedTools: process.env.VIVIM_MCP_ALLOWED_TOOLS?.split(','),
    deniedTools: process.env.VIVIM_MCP_DENIED_TOOLS?.split(','),
    sdkConfig: {
      identity: {
        did: process.env.VIVIM_DID,
        seed: process.env.VIVIM_SEED,
      },
      network: {
        enableP2P: process.env.VIVIM_P2P_ENABLED !== 'false',
      },
      storage: {
        encryption: process.env.VIVIM_ENCRYPTION !== 'false',
      },
    },
  };

  return new MCPServer(config);
}
