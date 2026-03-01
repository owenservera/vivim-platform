/**
 * VIVIM SDK - MultiTransport Composition
 * 
 * Composes multiple transports with automatic fallback and selection
 */

import { EventEmitter } from 'events';
import type {
  TransportProtocol,
  TransportType,
  TransportMessage,
  TransportConnection,
  TransportStream,
  PeerId,
  SendResult,
  MultiTransportConfig,
  TransportPreferences,
  ConnectionState,
} from './types.js';
import { BaseTransport, createPeerId, createTransportMessage } from './base-transport.js';

/**
 * MultiTransport - Transport Composition
 * 
 * Combines multiple transports with automatic fallback and selection.
 * Selects the best available transport based on preferences.
 */
export class MultiTransport extends BaseTransport {
  readonly type = 'multi' as const;
  
  private transports: Map<TransportType, TransportProtocol> = new Map();
  private preferenceOrder: TransportType[];
  private autoFallback: boolean;
  private fallbackTimeout: number;
  
  constructor(config: MultiTransportConfig) {
    super(config);
    this.preferenceOrder = config.preferenceOrder ?? ['websocket', 'webrtc', 'http', 'libp2p'];
    this.autoFallback = config.autoFallback ?? true;
    this.fallbackTimeout = config.fallbackTimeout ?? 5000;
    
    // Register provided transports
    for (const transport of config.transports) {
      this.transports.set(transport.type, transport);
      
      // Forward events from child transports
      transport.on('connection', (data: unknown) => this.emit('connection', data));
      transport.on('disconnection', (data: unknown) => this.emit('disconnection', data));
      transport.on('message', (data: unknown) => this.emit('message', data));
      transport.on('error', (data: unknown) => this.emit('error', data));
    }
  }
  
  /**
   * Add a transport to the composition
   */
  addTransport(transport: TransportProtocol): void {
    this.transports.set(transport.type, transport);
    
    // Forward events
    transport.on('connection', (data: unknown) => this.emit('connection', data));
    transport.on('disconnection', (data: unknown) => this.emit('disconnection', data));
    transport.on('message', (data: unknown) => this.emit('message', data));
    transport.on('error', (data: unknown) => this.emit('error', data));
  }
  
  /**
   * Remove a transport from the composition
   */
  removeTransport(type: TransportType): void {
    const transport = this.transports.get(type);
    if (transport) {
      transport.removeAllListeners();
      this.transports.delete(type);
    }
  }
  
  /**
   * Get a transport by type
   */
  getTransport(type: TransportType): TransportProtocol | undefined {
    return this.transports.get(type);
  }
  
  /**
   * Get all available transports
   */
  getTransports(): TransportProtocol[] {
    return Array.from(this.transports.values());
  }
  
  /**
   * Select the best available transport
   */
  selectTransport(preferences?: TransportPreferences): TransportProtocol {
    // If preferences specify protocols, try those first
    if (preferences?.protocols?.length) {
      for (const protocol of preferences.protocols) {
        const transport = this.transports.get(protocol);
        if (transport?.isActive) {
          return transport;
        }
      }
    }
    
    // Otherwise, use preference order
    for (const type of this.preferenceOrder) {
      const transport = this.transports.get(type);
      if (transport?.isActive) {
        return transport;
      }
    }
    
    // Fall back to any active transport
    for (const transport of this.transports.values()) {
      if (transport.isActive) {
        return transport;
      }
    }
    
    throw new Error('No active transports available');
  }
  
  /**
   * Create fallback chain
   */
  fallback(transports: TransportProtocol[]): FallbackTransportChain {
    return new FallbackTransportChain(transports, this.fallbackTimeout);
  }
  
  async start(): Promise<void> {
    // Start all transports
    const startPromises = Array.from(this.transports.values()).map(
      async (transport) => {
        try {
          await transport.start();
        } catch (error) {
          console.warn(`Failed to start transport ${transport.type}:`, error);
        }
      }
    );
    
    await Promise.all(startPromises);
    this._isActive = true;
    
    // Set local peer ID from first available transport
    for (const transport of this.transports.values()) {
      if (transport.localPeerId) {
        this._localPeerId = transport.localPeerId;
        break;
      }
    }
    
    this.log('MultiTransport started', { 
      transports: Array.from(this.transports.keys()) 
    });
  }
  
  async stop(): Promise<void> {
    // Stop all transports
    const stopPromises = Array.from(this.transports.values()).map(
      async (transport) => {
        try {
          await transport.stop();
        } catch (error) {
          console.warn(`Failed to stop transport ${transport.type}:`, error);
        }
      }
    );
    
    await Promise.all(stopPromises);
    this._isActive = false;
    
    this.log('MultiTransport stopped');
  }
  
  async connect(peerId: PeerId | string): Promise<TransportConnection> {
    const transport = this.selectTransport();
    return transport.connect(peerId);
  }
  
  async disconnect(peerId: PeerId | string): Promise<void> {
    const transport = this.selectTransport();
    return transport.disconnect(peerId);
  }
  
  getConnectionState(peerId: PeerId | string): ConnectionState {
    const transport = this.selectTransport();
    return transport.getConnectionState(peerId);
  }
  
  getConnections(): TransportConnection[] {
    const transport = this.selectTransport();
    return transport.getConnections();
  }
  
  async send(message: TransportMessage): Promise<SendResult> {
    const transport = this.selectTransport();
    return transport.send(message);
  }
  
  async sendWithFallback(message: TransportMessage): Promise<SendResult> {
    const errors: Error[] = [];
    
    for (const transport of this.transports.values()) {
      if (!transport.isActive) continue;
      
      try {
        return await transport.send(message);
      } catch (error) {
        errors.push(error as Error);
      }
    }
    
    return {
      success: false,
      messageId: message.id,
      error: new Error(`All transports failed. Errors: ${errors.map(e => e.message).join(', ')}`),
    };
  }
  
  async broadcast(topic: string, message: TransportMessage): Promise<void> {
    const broadcastPromises = Array.from(this.transports.values())
      .filter(t => t.isActive)
      .map(transport => transport.broadcast(topic, message).catch(() => {}));
    
    await Promise.allSettled(broadcastPromises);
  }
  
  async createStream(peerId: PeerId | string): Promise<TransportStream> {
    const transport = this.selectTransport();
    return transport.createStream(peerId);
  }
}

/**
 * Fallback Transport Chain
 * 
 * Tries transports in sequence until one succeeds.
 */
class FallbackTransportChain extends EventEmitter implements TransportProtocol {
  readonly type = 'fallback' as const;
  readonly isActive = true;
  readonly localPeerId?: { id: string };
  
  private transports: TransportProtocol[];
  private timeout: number;
  private currentIndex = 0;
  
  constructor(transports: TransportProtocol[], timeout: number) {
    super();
    this.transports = transports;
    this.timeout = timeout;
  }
  
  on(event: string, handler: (...args: unknown[]) => void): this {
    // Forward events from all transports
    for (const transport of this.transports) {
      transport.on(event, handler);
    }
    return this;
  }
  
  emit(event: string, ...args: unknown[]): boolean {
    let result = false;
    for (const transport of this.transports) {
      result = transport.emit(event, ...args) || result;
    }
    return result;
  }
  
  removeAllListeners(): void {
    for (const transport of this.transports) {
      transport.removeAllListeners();
    }
  }
  
  async connect(peerId: PeerId | string): Promise<TransportConnection> {
    for (let i = this.currentIndex; i < this.transports.length; i++) {
      const transport = this.transports[i];
      if (!transport.isActive) continue;
      
      try {
        const result = await Promise.race([
          transport.connect(peerId),
          new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error('Timeout')), this.timeout)
          ),
        ]);
        this.currentIndex = i;
        return result;
      } catch {
        continue;
      }
    }
    
    throw new Error('All transports in fallback chain failed');
  }
  
  async disconnect(peerId: PeerId | string): Promise<void> {
    await this.transports[this.currentIndex]?.disconnect(peerId);
  }
  
  getConnectionState(peerId: PeerId | string): ConnectionState {
    return this.transports[this.currentIndex]?.getConnectionState(peerId) ?? 'disconnected';
  }
  
  getConnections(): TransportConnection[] {
    return this.transports[this.currentIndex]?.getConnections() ?? [];
  }
  
  async send(message: TransportMessage): Promise<SendResult> {
    for (let i = this.currentIndex; i < this.transports.length; i++) {
      const transport = this.transports[i];
      if (!transport.isActive) continue;
      
      try {
        const result = await Promise.race([
          transport.send(message),
          new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error('Timeout')), this.timeout)
          ),
        ]);
        
        if (result.success) {
          this.currentIndex = i;
          return result;
        }
      } catch {
        continue;
      }
    }
    
    return {
      success: false,
      messageId: message.id,
      error: new Error('All transports in fallback chain failed'),
    };
  }
  
  async broadcast(topic: string, message: TransportMessage): Promise<void> {
    await this.transports[this.currentIndex]?.broadcast(topic, message);
  }
  
  async createStream(peerId: PeerId | string): Promise<TransportStream> {
    return this.transports[this.currentIndex]?.createStream(peerId) 
      ?? Promise.reject(new Error('No transports available'));
  }
  
  async start(): Promise<void> {
    // Already started via constructor
  }
  
  async stop(): Promise<void> {
    for (const transport of this.transports) {
      await transport.stop();
    }
  }
}

/**
 * Create MultiTransport with default configuration
 */
export function createMultiTransport(
  transports: TransportProtocol[],
  options?: Partial<MultiTransportConfig>
): MultiTransport {
  return new MultiTransport({
    transports,
    ...options,
  });
}
