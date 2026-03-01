/**
 * VIVIM SDK - STDIO Transport
 * 
 * STDIO transport for MCP server - ideal for CLI tools and local processes
 */

import type { 
  MCPTransport, 
  JSONRPCRequest, 
  JSONRPCResponse, 
  JSONRPCNotification 
} from './types.js';

/**
 * STDIO Transport Options
 */
export interface StdioTransportOptions {
  onMessage: (message: JSONRPCRequest) => void;
  onError?: (error: Error) => void;
  onClose?: () => void;
}

/**
 * STDIO Transport implementation
 */
export class StdioTransport implements MCPTransport {
  private options: StdioTransportOptions;
  private running = false;

  constructor(options: StdioTransportOptions) {
    this.options = options;
  }

  /**
   * Start the STDIO transport
   */
  async start(): Promise<void> {
    this.running = true;

    // Read from stdin
    let buffer = '';

    process.stdin.setEncoding('utf8');
    
    process.stdin.on('data', (chunk: string) => {
      buffer += chunk;

      // Process complete JSON objects (newline-separated)
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // Keep incomplete line in buffer

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        try {
          const message = JSON.parse(trimed) as JSONRPCRequest;
          this.options.onMessage(message);
        } catch (error) {
          // Send parse error response
          this.send({
            jsonrpc: '2.0',
            id: null,
            error: {
              code: -32700,
              message: 'Parse error',
              data: error instanceof Error ? error.message : String(error),
            },
          });
        }
      }
    });

    process.stdin.on('end', () => {
      // Process any remaining buffer
      if (buffer.trim()) {
        try {
          const message = JSON.parse(buffer) as JSONRPCRequest;
          this.options.onMessage(message);
        } catch {
          // Ignore final parse errors
        }
      }
      this.running = false;
      this.options.onClose?.();
    });

    process.stdin.on('error', (error) => {
      this.options.onError?.(error);
    });

    // Handle process termination
    process.on('SIGINT', () => this.stop());
    process.on('SIGTERM', () => this.stop());
  }

  /**
   * Stop the STDIO transport
   */
  async stop(): Promise<void> {
    this.running = false;
    process.stdin.pause();
    this.options.onClose?.();
  }

  /**
   * Send a JSON-RPC message to stdout
   */
  send(message: JSONRPCResponse | JSONRPCNotification): void {
    if (!this.running) return;

    const json = JSON.stringify(message);
    process.stdout.write(json + '\n');
  }
}

/**
 * Create STDIO transport from environment or args
 */
export function createStdioTransport(
  onMessage: (message: JSONRPCRequest) => void,
  options?: {
    onError?: (error: Error) => void;
    onClose?: () => void;
  }
): StdioTransport {
  return new StdioTransport({
    onMessage,
    ...options,
  });
}
