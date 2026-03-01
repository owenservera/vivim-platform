/**
 * VIVIM SDK - HTTP Transport
 * 
 * HTTP transport for MCP server - ideal for web applications and remote processes
 */

import { randomUUID } from 'crypto';
import * as http from 'node:http';
import type {
  HTTPTransportConfig,
  TransportMessage,
  SendResult,
  TransportConnection,
  TransportStream,
  PeerId,
  ConnectionState,
} from './types.js';
import { BaseTransport, createPeerId, createTransportMessage, SimpleTransportStream } from './base-transport.js';
import type { JSONRPCRequest, JSONRPCResponse, JSONRPCNotification } from '../types.js';

/**
 * HTTP Transport for MCP
 * 
 * Implements HTTP-based transport for Model Context Protocol.
 * Supports both request-response and streaming modes.
 */
export class HTTPTransport extends BaseTransport {
  readonly type = 'http' as const;
  
  private server?: http.Server;
  private client?: http.Agent;
  private connections: Map<string, HTTPConnection> = new Map();
  private pendingRequests: Map<string, {
    resolve: (value: SendResult) => void;
    reject: (error: Error) => void;
    timeout: ReturnType<typeof setTimeout>;
  }> = new Map();
  private messageHandler?: (message: JSONRPCRequest) => void;
  
  private port: number;
  private host: string;
  private baseUrl?: string;
  private requestTimeout: number;
  
  constructor(config: HTTPTransportConfig = {}) {
    super(config);
    this.port = config.port ?? 3000;
    this.host = config.host ?? 'localhost';
    this.baseUrl = config.baseUrl;
    this.requestTimeout = config.requestTimeout ?? 30000;
  }
  
  /**
   * Set message handler for incoming requests
   */
  onMessage(handler: (message: JSONRPCRequest) => void): void {
    this.messageHandler = handler;
  }
  
  async start(): Promise<void> {
    if (this._isActive) return;
    
    this._localPeerId = { id: `http-${randomUUID()}` };
    this.client = new http.Agent({ 
      keepAlive: true,
      maxSockets: this.config.retryAttempts ?? 10,
    });
    
    // Create HTTP server if port is specified
    if (this.port > 0) {
      await this.startServer();
    }
    
    this._isActive = true;
    this.log('HTTP transport started', { host: this.host, port: this.port });
  }
  
  private async startServer(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.server = http.createServer(async (req, res) => {
        await this.handleRequest(req, res);
      });
      
      this.server.on('error', (error) => {
        this.emitError(error);
        reject(error);
      });
      
      this.server.listen(this.port, this.host, () => {
        this.log('HTTP server listening', { host: this.host, port: this.port });
        resolve();
      });
    });
  }
  
  private async handleRequest(
    req: http.IncomingMessage, 
    res: http.ServerResponse
  ): Promise<void> {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }
    
    // Only handle POST requests with JSON body
    if (req.method !== 'POST' || !req.url) {
      res.writeHead(404);
      res.end();
      return;
    }
    
    // Read body
    const chunks: Buffer[] = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    const body = Buffer.concat(chunks).toString('utf-8');
    
    // Parse JSON-RPC message
    let message: JSONRPCRequest | JSONRPCNotification;
    try {
      message = JSON.parse(body);
    } catch {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        jsonrpc: '2.0',
        id: null,
        error: { code: -32700, message: 'Parse error' }
      }));
      return;
    }
    
    // Handle the message
    if (this.messageHandler && 'method' in message) {
      try {
        this.messageHandler(message as JSONRPCRequest);
        
        // For notifications, just acknowledge
        if (message.id === null || message.id === undefined) {
          res.writeHead(202);
          res.end();
          return;
        }
        
        // For requests, we need to wait for response
        // In synchronous mode, send empty response (client will poll or use SSE)
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ jsonrpc: '2.0', id: message.id }));
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          jsonrpc: '2.0',
          id: message.id ?? null,
          error: { code: -32603, message: 'Internal error' }
        }));
      }
    } else {
      res.writeHead(400);
      res.end();
    }
  }
  
  async stop(): Promise<void> {
    if (!this._isActive) return;
    
    // Close all connections
    await this.cleanupConnections();
    
    // Close HTTP server
    if (this.server) {
      await new Promise<void>((resolve) => {
        this.server!.close(() => resolve());
      });
      this.server = undefined;
    }
    
    // Close HTTP agent
    if (this.client) {
      this.client.destroy();
      this.client = undefined;
    }
    
    this._isActive = false;
    this.log('HTTP transport stopped');
  }
  
  async connect(peerId: PeerId | string): Promise<TransportConnection> {
    const id = typeof peerId === 'string' ? peerId : peerId.id;
    
    let connection = this.connections.get(id);
    if (connection) {
      return connection;
    }
    
    connection = new HTTPConnection(
      { id },
      this.host,
      this.port,
      this.client
    );
    
    this.connections.set(id, connection);
    this.registerConnection(connection);
    
    return connection;
  }
  
  async disconnect(peerId: PeerId | string): Promise<void> {
    const id = typeof peerId === 'string' ? peerId : peerId.id;
    const connection = this.connections.get(id);
    
    if (connection) {
      await connection.close();
      this.connections.delete(id);
      this.unregisterConnection(id);
    }
  }
  
  async send(message: TransportMessage): Promise<SendResult> {
    try {
      // Convert transport message to JSON-RPC
      const jsonRpc = this.messageToJSONRPC(message);
      
      const response = await this.sendHTTPRequest(jsonRpc);
      
      return {
        success: true,
        messageId: message.id,
        deliveredAt: Date.now(),
      };
    } catch (error) {
      return {
        success: false,
        messageId: message.id,
        error: error as Error,
      };
    }
  }
  
  private async sendHTTPRequest(body: object): Promise<JSONRPCResponse | null> {
    return new Promise((resolve, reject) => {
      const url = this.baseUrl || `http://${this.host}:${this.port}/mcp`;
      
      const options: http.RequestOptions = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        agent: this.client,
        timeout: this.requestTimeout,
      };
      
      const req = http.request(url, options, (res) => {
        const chunks: Buffer[] = [];
        
        res.on('data', (chunk) => chunks.push(chunk));
        
        res.on('end', () => {
          const bodyStr = Buffer.concat(chunks).toString('utf-8');
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300 && bodyStr) {
            try {
              resolve(JSON.parse(bodyStr));
            } catch {
              resolve(null);
            }
          } else {
            resolve(null);
          }
        });
      });
      
      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });
      
      req.write(JSON.stringify(body));
      req.end();
    });
  }
  
  private messageToJSONRPC(message: TransportMessage): JSONRPCRequest | JSONRPCNotification {
    const payload = typeof message.payload === 'string' 
      ? JSON.parse(message.payload)
      : message.payload;
    
    if (message.metadata?.id) {
      return {
        jsonrpc: '2.0',
        id: message.metadata.id as string | number | null,
        method: message.type,
        params: payload as Record<string, unknown>,
      };
    }
    
    return {
      jsonrpc: '2.0',
      method: message.type,
      params: payload as Record<string, unknown>,
    };
  }
  
  async broadcast(topic: string, message: TransportMessage): Promise<void> {
    // HTTP broadcast - send to all connected peers
    const sendPromises = Array.from(this.connections.values()).map(
      conn => this.send(message)
    );
    
    await Promise.allSettled(sendPromises);
  }
  
  async createStream(peerId: PeerId | string): Promise<TransportStream> {
    const connection = await this.connect(peerId);
    return connection.createStream();
  }
  
  getConnections(): TransportConnection[] {
    return Array.from(this.connections.values());
  }
}

/**
 * HTTP Connection implementation
 */
class HTTPConnection implements TransportConnection {
  readonly peerId: PeerId;
  readonly remoteAddress: string;
  readonly localAddress: string;
  private _state: ConnectionState = 'connected';
  private stream?: TransportStream;
  private agent?: http.Agent;
  
  constructor(
    peerId: PeerId, 
    host: string, 
    port: number,
    agent?: http.Agent
  ) {
    this.peerId = peerId;
    this.remoteAddress = `http://${host}:${port}`;
    this.localAddress = `http://localhost:${port}`;
    this.agent = agent;
  }
  
  get state(): ConnectionState {
    return this._state;
  }
  
  async createStream(): Promise<TransportStream> {
    if (!this.stream) {
      this.stream = new SimpleTransportStream({
        id: `http-stream-${Date.now()}`,
        peerId: this.peerId,
      });
    }
    return this.stream;
  }
  
  async close(): Promise<void> {
    this._state = 'disconnected';
    this.stream?.close();
  }
  
  setState(state: ConnectionState): void {
    this._state = state;
  }
}

/**
 * Create HTTP transport
 */
export function createHTTPTransport(
  onMessage: (message: JSONRPCRequest) => void,
  options?: HTTPTransportConfig
): HTTPTransport {
  const transport = new HTTPTransport(options);
  transport.onMessage(onMessage);
  return transport;
}
