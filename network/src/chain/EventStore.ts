import { EventEmitter } from 'events';
import { ChainEvent, EventType } from './types.js';
import { calculateCID, verifySignature } from './utils.js';
import { createModuleLogger } from '../utils/logger.js';

const log = createModuleLogger('chain:event-store');

export interface EventFilter {
  types?: EventType[];
  authors?: string[];
  entityIds?: string[];
  tags?: string[];
  since?: number;
  until?: number;
  limit?: number;
}

/**
 * Interface for Event Storage Backend.
 * Allows different implementations for PWA (IndexedDB) and Server (Prisma).
 */
export interface IEventStorage {
  saveEvent(event: ChainEvent): Promise<void>;
  getEvent(cid: string): Promise<ChainEvent | null>;
  queryEvents(filter: EventFilter): Promise<ChainEvent[]>;
  getLatestEvent(entityId: string): Promise<ChainEvent | null>;
}

/**
 * EventStore manages the lifecycle of ChainEvents.
 */
export class EventStore extends EventEmitter {
  private storage: IEventStorage;

  constructor(storage: IEventStorage) {
    super();
    this.storage = storage;
  }

  /**
   * Process an incoming event from the network or local creation.
   */
  async processEvent(event: ChainEvent): Promise<{ cid: string; accepted: boolean; error?: string }> {
    try {
      // 1. Verify CID matches content
      const computedCID = await calculateCID({
        ...event,
        id: undefined,
        signature: undefined
      });
      
      // We check the signature against the hash of the content excluding id and signature
      // Wait, usually the CID is the hash of the signed event, but we need to sign the content first.
      // Standard approach: 
      // content = { type, author, timestamp, payload, ... }
      // signature = sign(content)
      // id = CID(content + signature)
      
      const contentToVerify = { ...event };
      delete (contentToVerify as any).id;
      delete (contentToVerify as any).signature;
      
      // 2. Verify Signature
      const isValidSignature = await verifySignature(contentToVerify, event.signature, event.author);
      if (!isValidSignature) {
        return { cid: event.id, accepted: false, error: 'Invalid signature' };
      }

      // 3. Verify CID (if provided)
      if (event.id && event.id !== computedCID) {
        // Logically the ID should be the CID of the signed event
        // Let's re-calculate CID of content + signature
        const signedContent = { ...contentToVerify, signature: event.signature };
        const finalCID = await calculateCID(signedContent);
        if (event.id !== finalCID) {
          return { cid: event.id, accepted: false, error: 'CID mismatch' };
        }
      }

      // 4. Persistence
      await this.storage.saveEvent(event);
      
      log.info({ cid: event.id, type: event.type }, 'Event processed and saved');
      this.emit('event:processed', event);
      
      return { cid: event.id, accepted: true };
    } catch (error: any) {
      log.error({ error: error.message, cid: event.id }, 'Error processing event');
      return { cid: event.id, accepted: false, error: error.message };
    }
  }

  async getEvent(cid: string): Promise<ChainEvent | null> {
    return this.storage.getEvent(cid);
  }

  async queryEvents(filter: EventFilter): Promise<ChainEvent[]> {
    return this.storage.queryEvents(filter);
  }
}
