import { DHTService } from '../dht/DHTService.js';
import { ChainEvent, EntityState, EventType } from './types.js';
import { createModuleLogger } from '../utils/logger.js';
import { canonicalStringify } from './utils.js';

const log = createModuleLogger('chain:dht');

/**
 * DHT Key Schema for VIVIM Chain
 */
export const CHAIN_DHT_KEYS = {
  // Content by CID: /vivim/c/
  content: (cid: string) => `/vivim/c/${cid}`,
  
  // Entity State by entityId: /vivim/e/
  entity: (entityId: string) => `/vivim/e/${entityId}`,
  
  // Author's Content Index: /vivim/a/<did>/c
  authorContent: (did: string) => `/vivim/a/${did}/c`,
  
  // Tag Index: /vivim/t/<tag>
  tag: (tag: string) => `/vivim/t/${tag}`,
  
  // DID to PeerID Mapping (if needed): /vivim/did/
  did: (did: string) => `/vivim/did/${did}`,
};

/**
 * ChainDHT provides blockchain-specific DHT operations.
 */
export class ChainDHT {
  private dhtService: DHTService;

  constructor(dhtService: DHTService) {
    this.dhtService = dhtService;
  }

  /**
   * Announce an event to the DHT.
   */
  async announceEvent(event: ChainEvent): Promise<void> {
    try {
      // 1. Store event content in DHT by CID
      const cidKey = CHAIN_DHT_KEYS.content(event.id);
      const eventData = canonicalStringify(event);
      await this.putValue(cidKey, eventData);

      // 2. Update author index (appends to a list of CIDs)
      // NOTE: DHT put usually overwrites. For indices, we might need a more complex strategy 
      // or use DHT 'provide' for discovery and another layer for actual indexing.
      // For now, we'll use simple PUT for proof of concept.
      const authorKey = CHAIN_DHT_KEYS.authorContent(event.author);
      await this.appendToIndex(authorKey, event.id);

      // 3. Update tag indices
      if (event.tags) {
        for (const tag of event.tags) {
          const tagKey = CHAIN_DHT_KEYS.tag(tag);
          await this.appendToIndex(tagKey, event.id);
        }
      }

      log.info({ cid: event.id }, 'Event announced to DHT');
    } catch (error: any) {
      log.error({ cid: event.id, error: error.message }, 'Failed to announce event to DHT');
    }
  }

  /**
   * Announce entity state to the DHT.
   */
  async announceEntityState(state: EntityState): Promise<void> {
    const key = CHAIN_DHT_KEYS.entity(state.id);
    const data = canonicalStringify(state);
    await this.putValue(key, data);
  }

  /**
   * Resolve an event by CID.
   */
  async resolveEvent(cid: string): Promise<ChainEvent | null> {
    const key = CHAIN_DHT_KEYS.content(cid);
    const value = await this.getValue(key);
    return value ? JSON.parse(value) : null;
  }

  /**
   * Resolve entity state by ID.
   */
  async resolveEntityState(entityId: string): Promise<EntityState | null> {
    const key = CHAIN_DHT_KEYS.entity(entityId);
    const value = await this.getValue(key);
    return value ? JSON.parse(value) : null;
  }

  /**
   * Query CIDs by tag.
   */
  async queryByTag(tag: string): Promise<string[]> {
    const key = CHAIN_DHT_KEYS.tag(tag);
    const value = await this.getValue(key);
    return value ? JSON.parse(value) : [];
  }

  // --- Internal DHT Wrappers ---

  private async putValue(key: string, value: string): Promise<void> {
    // DHT put is available if dhtService.dht exists
    const dht = (this.dhtService as any).dht;
    if (dht) {
      await dht.put(key, new TextEncoder().encode(value));
    } else {
      // Fallback to local cache in dhtService
      await this.dhtService.publishContent(key, 'chain-data', {
        type: 'p2p',
        url: value // Storing value in "url" for local mock
      });
    }
  }

  private async getValue(key: string): Promise<string | null> {
    const dht = (this.dhtService as any).dht;
    if (dht) {
      try {
        const bytes = await dht.get(key);
        return new TextDecoder().decode(bytes);
      } catch (e) {
        return null;
      }
    } else {
      const locations = await this.dhtService.findContent(key);
      return locations[0]?.url || null;
    }
  }

  private async appendToIndex(key: string, cid: string): Promise<void> {
    const current = await this.getValue(key);
    let list: string[] = current ? JSON.parse(current) : [];
    if (!list.includes(cid)) {
      list.push(cid);
      // Limit list size for DHT performance
      if (list.length > 100) list.shift();
      await this.putValue(key, JSON.stringify(list));
    }
  }
}
