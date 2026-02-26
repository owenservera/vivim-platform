import { EventEmitter } from 'events';
import type { ContentLocation } from '../types.js';
export interface DHTConfig {
    kBucketSize?: number;
    alpha?: number;
    refreshInterval?: number;
    enabled?: boolean;
}
export interface ContentRecord {
    contentId: string;
    contentType: string;
    providers: ContentLocation[];
    timestamp: number;
    expiresAt?: number;
}
export declare class DHTService extends EventEmitter {
    private contentCache;
    private providerCache;
    private localProvider;
    private config;
    private dht;
    private libp2p;
    constructor(config?: DHTConfig);
    initialize(libp2pNode: any): Promise<void>;
    publishContent(contentId: string, contentType: string, location?: ContentLocation): Promise<void>;
    findContent(contentId: string): Promise<ContentLocation[]>;
    provideContent(contentId: string, location: ContentLocation): Promise<void>;
    findProviders(contentId: string, limit?: number): Promise<ContentLocation[]>;
    setLocalProvider(location: ContentLocation): void;
    removeContent(contentId: string): void;
    getLocalContent(): ContentRecord[];
    refreshRoutingTable(): Promise<void>;
    getStats(): {
        cachedContent: number;
        providers: number;
        dhtEnabled: boolean;
    };
    destroy(): void;
}
export declare const dhtService: DHTService;
//# sourceMappingURL=DHTService.d.ts.map