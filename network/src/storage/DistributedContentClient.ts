import { EventEmitter } from 'events';
import { VivimChainClient } from '../chain/ChainClient.js';
import { DHTService } from '../dht/DHTService.js';
import { createModuleLogger } from '../utils/logger.js';

const log = createModuleLogger('storage:content-client');

export enum ContentType {
  POST = 'post',
  IMAGE = 'image',
  VIDEO = 'video',
  AUDIO = 'audio',
  GALLERY = 'gallery',
  ARTICLE = 'article',
  ACU = 'acu',
  MEMORY = 'memory',
  CONVERSATION = 'conversation',
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
export class DistributedContentClient extends EventEmitter {
  private chainClient: VivimChainClient;
  private dhtService: DHTService;

  constructor(chainClient: VivimChainClient, dhtService: DHTService) {
    super();
    this.chainClient = chainClient;
    this.dhtService = dhtService;
  }

  /**
   * Create and store content on the distributed network.
   */
  async createContent(options: {
    type: ContentType;
    text?: string;
    media?: any;
    visibility: 'public' | 'circle' | 'friends' | 'private';
    tags?: string[];
  }): Promise<ContentObject> {
    const did = this.chainClient.getDID();
    if (!did) {
      throw new Error('Identity not initialized in ChainClient');
    }

    log.info({ type: options.type }, 'Creating distributed content');

    // 1. Create the base entity on the chain
    const { entityId, eventCid } = await this.chainClient.createEntity(
      this.mapContentTypeToEntityType(options.type) as any,
      {
        text: options.text,
        media: options.media,
        visibility: options.visibility,
        tags: options.tags || [],
      },
      {
        scope: options.visibility as any,
        tags: options.tags
      }
    );

    // 2. Wrap as ContentObject
    const content: ContentObject = {
      cid: eventCid,
      id: entityId,
      type: options.type,
      author: this.chainClient.getDID()!,
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
  async getContent(cid: string): Promise<ContentObject | null> {
    const event = await this.chainClient.getEventStore().getEvent(cid);
    if (!event) return null;

    return {
      cid: event.id,
      id: event.entityId || '',
      type: this.mapEntityTypeToContentType(event.type as any),
      author: event.author,
      signature: event.signature,
      timestamp: parseInt(event.timestamp.split(':')[0], 10),
      visibility: event.scope as any,
      text: event.payload.text,
      media: event.payload.media,
      tags: event.tags || [],
    };
  }

  private mapContentTypeToEntityType(type: ContentType): string {
    switch (type) {
      case ContentType.CONVERSATION: return 'conversation';
      case ContentType.ACU: return 'acu';
      case ContentType.MEMORY: return 'memory';
      default: return 'post';
    }
  }

  private mapEntityTypeToContentType(type: string): ContentType {
    // Basic mapping
    return ContentType.POST;
  }
}
