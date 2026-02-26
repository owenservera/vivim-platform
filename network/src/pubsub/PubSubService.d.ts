import { EventEmitter } from 'events';
import type { Message } from '../types.js';
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
export declare class PubSubService extends EventEmitter {
    private subscriptions;
    private pendingMessages;
    private config;
    private gossipsub;
    private libp2p;
    constructor(config?: PubSubConfig);
    initialize(libp2pNode: any): Promise<void>;
    private setupGossipsubHandlers;
    subscribe(topic: string, peerId?: string): Promise<void>;
    unsubscribe(topic: string, peerId?: string): Promise<void>;
    publish(topic: string, message: Message): Promise<void>;
    publishToTopic(topic: string, data: Uint8Array | string): Promise<void>;
    private normalizeTopic;
    getSubscriptions(peerId?: string): string[];
    getSubscriberCount(topic: string): number;
    getTopics(): string[];
    getMeshPeers(topic: string): string[];
    getTopicStats(topic: string): Promise<{
        subscribers: number;
        meshPeers: number;
        pendingMessages: number;
    }>;
    destroy(): void;
}
export declare const pubSubService: PubSubService;
//# sourceMappingURL=PubSubService.d.ts.map