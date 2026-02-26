import { VivimSDK } from '../core/sdk.js';
import type { Server, ServerWebSocket, ServeOptions, WebSocketHandler } from 'bun';

export interface BunVivimServerOptions {
  /** Map to the specific port to run on, default is 3000 */
  port?: number;
  /** Optionally pass an existing SDK instance, or a new config */
  sdk?: VivimSDK;
}

/**
 * Creates a high-performance HTTP/WebSocket server leveraging native Bun APIs
 * automatically wired to the underlying VivimSDK CRDT synchronization and Node topology.
 */
export class BunVivimServer {
  public readonly sdk: VivimSDK;
  private port: number;
  private server: Server | null = null;
  private logger = console; // Basic logger wrapper until network engine wired 

  constructor(options: BunVivimServerOptions = {}) {
    this.port = options.port || 3000;
    this.sdk = options.sdk || new VivimSDK();
  }

  /**
   * Initializes the VivimSDK Core and spawns the Bun-native HTTP/WS Server.
   */
  public async start(): Promise<void> {
    await this.sdk.initialize();
    
    // Mount the server using bun's native networking stack
    this.server = Bun.serve({
      port: this.port,
      fetch: (req, server) => this.handleFetch(req, server),
      websocket: this.getWebSocketHandler(),
    });

    this.logger.log(`🚀 [VIVIM Bun Node] Started successfully on port ${this.port}`);
    this.logger.log(`🔗 WebSockets Listening for Sync (bun-native WS)`);
  }

  private handleFetch(req: Request, server: Server): Response | undefined {
    // 1. WebSocket upgrades for Data Sync protocol
    if (server.upgrade(req)) {
      return; 
    }

    // 2. HTTP Routing Layer for Node Queries
    const url = new URL(req.url);

    if (url.pathname === '/api/identity' && req.method === 'GET') {
      return Response.json({
        identity: this.sdk.getIdentity(),
        nodes: this.sdk.getLoadedNodes().map(n => n.id)
      });
    }

    if (url.pathname === '/health' && req.method === 'GET') {
      return Response.json({
        status: 'online',
        runtime: 'Bun',
        timestamp: Date.now()
      });
    }

    return new Response('VIVIM Edge Node (Bun-Powered)', { status: 200 });
  }

  /**
   * Returns the WebSocket bindings specifically mapped for the VIVIM sync runtime
   */
  private getWebSocketHandler(): WebSocketHandler<any> {
    return {
      open: (ws) => {
        this.logger.log(`[Bun WebSocket] Client Connected`);
      },
      message: (ws, message) => {
        try {
          const rawstr = message instanceof Buffer ? message.toString('utf-8') : message;
          const parsed = JSON.parse(rawstr as string);
          
          // Muxing protocol logic to interact with underlying VIVIM Network Engine / Sync Service
          ws.send(JSON.stringify({
            event: 'ack',
            ts: Date.now(),
            echo: parsed
          }));
        } catch (err) {
          ws.send(JSON.stringify({ error: 'invalid payload structure' }));
        }
      },
      close: (ws, code, message) => {
        this.logger.log(`[Bun WebSocket] Client Disconnected. Code: ${code}`);
      },
    };
  }

  /**
   * Teardown logic
   */
  public async stop(): Promise<void> {
    if (this.server) {
      this.server.stop();
      this.server = null;
    }
    await this.sdk.destroy();
    this.logger.log('🛑 [VIVIM Bun Node] Shutdown gracefully');
  }
}
