import { EventEmitter } from 'events';
import { createModuleLogger } from '../utils/logger.js';
import type { Message } from '../types.js';

const log = createModuleLogger('pubsub');

export interface PubSubConfig {
  heartbeatInterval?: number;
  fanoutTTL?: number;
  gossipInterval?: number;
  cacheSize?: number;
}

export interface TopicSubscription {
  topic: string;
  peerId: string;
  subscribedAt: number;
}

export class PubSubService extends EventEmitter {
  private subscriptions: Map<string, Set<string>> = new Map();
  private pendingMessages: Map<string, Message[]> = new Map();
  private config: PubSubConfig;
  private gossipsub: any = null;
  private libp2p: any = null;

  constructor(config: PubSubConfig = {}) {
    super();
    this.config = {
      heartbeatInterval: 1000,
      fanoutTTL: 60000,
      gossipInterval: 5000,
      cacheSize: 100,
      ...config,
    };
  }

  async initialize(libp2pNode: any): Promise<void> {
    this.libp2p = libp2pNode;

    if (libp2pNode.services?.gossipsub) {
      this.gossipsub = libp2pNode.services.gossipsub;
      this.setupGossipsubHandlers();
      log.info('Gossipsub service initialized');
    } else {
      log.warn('Gossipsub not available, using in-memory pubsub');
    }
  }

  private setupGossipsubHandlers(): void {
    if (!this.gossipsub) return;

    this.gossipsub.on('message', (event: any) => {
      const { topic, message } = event.detail;
      const msg: Message = {
        id: message.id,
        from: message.from,
        topic,
        type: 'pubsub',
        payload: message.data,
        timestamp: new Date(message.seqno ? Number(message.seqno) : Date.now()),
        priority: 5,
      };
      this.emit('message', msg);
    });

    this.gossipsub.on('subscriptionChange', (event: any) => {
      const { peerId, subscriptions } = event.detail;
      this.emit('subscription:change', { peerId, subscriptions });
    });
  }

  async subscribe(topic: string, peerId?: string): Promise<void> {
    const topicPath = this.normalizeTopic(topic);

    if (this.gossipsub) {
      try {
        await this.gossipsub.subscribe(topicPath);
        log.debug({ topic: topicPath }, 'Subscribed to topic via gossipsub');
      } catch (error) {
        log.error({ topic: topicPath, error: (error as Error).message }, 'Failed to subscribe');
      }
    }

    const peer = peerId || 'local';
    const subs = this.subscriptions.get(topicPath) || new Set();
    subs.add(peer);
    this.subscriptions.set(topicPath, subs);

    this.emit('subscribed', { topic: topicPath, peerId: peer });
  }

  async unsubscribe(topic: string, peerId?: string): Promise<void> {
    const topicPath = this.normalizeTopic(topic);

    if (this.gossipsub) {
      try {
        await this.gossipsub.unsubscribe(topicPath);
        log.debug({ topic: topicPath }, 'Unsubscribed from topic via gossipsub');
      } catch (error) {
        log.error({ topic: topicPath, error: (error as Error).message }, 'Failed to unsubscribe');
      }
    }

    const peer = peerId || 'local';
    const subs = this.subscriptions.get(topicPath);
    subs?.delete(peer);

    this.emit('unsubscribed', { topic: topicPath, peerId: peer });
  }

  async publish(topic: string, message: Message): Promise<void> {
    const topicPath = this.normalizeTopic(topic);

    if (this.gossipsub) {
      try {
        await this.gossipsub.publish(topicPath, message.payload);
        log.debug({ topic: topicPath, messageId: message.id }, 'Published via gossipsub');
      } catch (error) {
        log.error({ topic: topicPath, error: (error as Error).message }, 'Failed to publish');
      }
    } else {
      const pending = this.pendingMessages.get(topicPath) || [];
      pending.push(message);
      if (pending.length > (this.config.cacheSize || 100)) {
        pending.shift();
      }
      this.pendingMessages.set(topicPath, pending);
    }

    this.emit('published', { topic: topicPath, message });
  }

  async publishToTopic(topic: string, data: Uint8Array | string): Promise<void> {
    const message: Message = {
      id: crypto.randomUUID(),
      from: this.libp2p?.peerId || 'unknown',
      topic,
      type: 'pubsub',
      payload: typeof data === 'string' ? new TextEncoder().encode(data) : data,
      timestamp: new Date(),
      priority: 2,
    };
    await this.publish(topic, message);
  }

  private normalizeTopic(topic: string): string {
    if (topic.startsWith('/vivim/')) return topic;
    return `/vivim/${topic}`;
  }

  getSubscriptions(peerId?: string): string[] {
    if (peerId) {
      const subs: string[] = [];
      for (const [topic, peers] of this.subscriptions) {
        if (peers.has(peerId)) {
          subs.push(topic);
        }
      }
      return subs;
    }
    return Array.from(this.subscriptions.keys());
  }

  getSubscriberCount(topic: string): number {
    const topicPath = this.normalizeTopic(topic);
    return this.subscriptions.get(topicPath)?.size || 0;
  }

  getTopics(): string[] {
    return Array.from(this.subscriptions.keys());
  }

  getMeshPeers(topic: string): string[] {
    if (!this.gossipsub) return [];
    try {
      return this.gossipsub.mesh.get(topic) || [];
    } catch {
      return [];
    }
  }

  async getTopicStats(topic: string): Promise<{
    subscribers: number;
    meshPeers: number;
    pendingMessages: number;
  }> {
    const topicPath = this.normalizeTopic(topic);
    return {
      subscribers: this.getSubscriberCount(topicPath),
      meshPeers: this.getMeshPeers(topicPath).length,
      pendingMessages: this.pendingMessages.get(topicPath)?.length || 0,
    };
  }

  destroy(): void {
    this.subscriptions.clear();
    this.pendingMessages.clear();
    this.gossipsub = null;
    this.libp2p = null;
  }
}

export const pubSubService = new PubSubService();
