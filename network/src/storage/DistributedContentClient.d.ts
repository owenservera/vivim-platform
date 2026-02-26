import { EventEmitter } from 'events';
import { VivimChainClient } from '../chain/ChainClient.js';
import { DHTService } from '../dht/DHTService.js';
export declare enum ContentType {
    POST = "post",
    IMAGE = "image",
    VIDEO = "video",
    AUDIO = "audio",
    GALLERY = "gallery",
    ARTICLE = "article",
    ACU = "acu",
    MEMORY = "memory",
    CONVERSATION = "conversation"
}
export interface ContentObject {
    cid: string;
    id: string;
    type: ContentType;
    author: string;
    signature: string;
    timestamp: number;
    visibility: 'public' | 'circle' | 'friends' | 'private';
    text?: string;
    media?: any;
    tags: string[];
}
/**
 * DistributedContentClient manages high-level content storage and retrieval.
 */
export declare class DistributedContentClient extends EventEmitter {
    private chainClient;
    private dhtService;
    constructor(chainClient: VivimChainClient, dhtService: DHTService);
    /**
     * Create and store content on the distributed network.
     */
    createContent(options: {
        type: ContentType;
        text?: string;
        media?: any;
        visibility: 'public' | 'circle' | 'friends' | 'private';
        tags?: string[];
    }): Promise<ContentObject>;
    /**
     * Resolve content by CID.
     */
    getContent(cid: string): Promise<ContentObject | null>;
    private mapContentTypeToEntityType;
    private mapEntityTypeToContentType;
}
//# sourceMappingURL=DistributedContentClient.d.ts.map