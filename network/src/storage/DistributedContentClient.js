import { EventEmitter } from 'events';
import { createModuleLogger } from '../utils/logger.js';
const log = createModuleLogger('storage:content-client');
export var ContentType;
(function (ContentType) {
    ContentType["POST"] = "post";
    ContentType["IMAGE"] = "image";
    ContentType["VIDEO"] = "video";
    ContentType["AUDIO"] = "audio";
    ContentType["GALLERY"] = "gallery";
    ContentType["ARTICLE"] = "article";
    ContentType["ACU"] = "acu";
    ContentType["MEMORY"] = "memory";
    ContentType["CONVERSATION"] = "conversation";
})(ContentType || (ContentType = {}));
/**
 * DistributedContentClient manages high-level content storage and retrieval.
 */
export class DistributedContentClient extends EventEmitter {
    chainClient;
    dhtService;
    constructor(chainClient, dhtService) {
        super();
        this.chainClient = chainClient;
        this.dhtService = dhtService;
    }
    /**
     * Create and store content on the distributed network.
     */
    async createContent(options) {
        const did = this.chainClient.getDID();
        if (!did) {
            throw new Error('Identity not initialized in ChainClient');
        }
        log.info({ type: options.type }, 'Creating distributed content');
        // 1. Create the base entity on the chain
        const { entityId, eventCid } = await this.chainClient.createEntity(this.mapContentTypeToEntityType(options.type), {
            text: options.text,
            media: options.media,
            visibility: options.visibility,
            tags: options.tags || [],
        }, {
            scope: options.visibility,
            tags: options.tags
        });
        // 2. Wrap as ContentObject
        const content = {
            cid: eventCid,
            id: entityId,
            type: options.type,
            author: this.chainClient.getDID(),
            signature: '', // Would be the event signature
            timestamp: Date.now(),
            visibility: options.visibility,
            text: options.text,
            media: options.media,
            tags: options.tags || [],
        };
        return content;
    }
    /**
     * Resolve content by CID.
     */
    async getContent(cid) {
        const event = await this.chainClient.getEventStore().getEvent(cid);
        if (!event)
            return null;
        return {
            cid: event.id,
            id: event.entityId || '',
            type: this.mapEntityTypeToContentType(event.type),
            author: event.author,
            signature: event.signature,
            timestamp: parseInt(event.timestamp.split(':')[0], 10),
            visibility: event.scope,
            text: event.payload.text,
            media: event.payload.media,
            tags: event.tags || [],
        };
    }
    mapContentTypeToEntityType(type) {
        switch (type) {
            case ContentType.CONVERSATION: return 'conversation';
            case ContentType.ACU: return 'acu';
            case ContentType.MEMORY: return 'memory';
            default: return 'post';
        }
    }
    mapEntityTypeToContentType(type) {
        // Basic mapping
        return ContentType.POST;
    }
}
//# sourceMappingURL=DistributedContentClient.js.map