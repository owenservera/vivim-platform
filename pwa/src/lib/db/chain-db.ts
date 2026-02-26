import { openDB, type IDBPDatabase } from 'idb';
import { IEventStorage, ChainEvent, EventFilter } from '@vivim/network-engine';

const DB_NAME = 'VivimChainDB';
const DB_VERSION = 1;

export class ChainEventStorage implements IEventStorage {
  private db: IDBPDatabase | null = null;

  async ready(): Promise<IDBPDatabase> {
    if (this.db) return this.db;
    this.db = await openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('chainEvents')) {
          const store = db.createObjectStore('chainEvents', { keyPath: 'id' });
          store.createIndex('by-entityId', 'entityId');
          store.createIndex('by-author', 'author');
          store.createIndex('by-type', 'type');
          store.createIndex('by-timestamp', 'timestamp');
        }
      },
    });
    return this.db;
  }

  async saveEvent(event: ChainEvent): Promise<void> {
    const db = await this.ready();
    await db.put('chainEvents', event);
  }

  async getEvent(cid: string): Promise<ChainEvent | null> {
    const db = await this.ready();
    return (await db.get('chainEvents', cid)) || null;
  }

  async queryEvents(filter: EventFilter): Promise<ChainEvent[]> {
    const db = await this.ready();
    let events = await db.getAll('chainEvents');

    if (filter.types) {
      events = events.filter(e => filter.types!.includes(e.type));
    }
    if (filter.authors) {
      events = events.filter(e => filter.authors!.includes(e.author));
    }
    if (filter.entityIds) {
      events = events.filter(e => e.entityId && filter.entityIds!.includes(e.entityId));
    }
    if (filter.since) {
      events = events.filter(e => {
        const physicalMs = parseInt(e.timestamp.split(':')[0], 10);
        return physicalMs >= filter.since!;
      });
    }
    if (filter.until) {
      events = events.filter(e => {
        const physicalMs = parseInt(e.timestamp.split(':')[0], 10);
        return physicalMs <= filter.until!;
      });
    }

    // Sort by timestamp
    events.sort((a, b) => a.timestamp.localeCompare(b.timestamp));

    if (filter.limit) {
      events = events.slice(0, filter.limit);
    }

    return events;
  }

  async getLatestEvent(entityId: string): Promise<ChainEvent | null> {
    const db = await this.ready();
    const index = db.transaction('chainEvents').store.index('by-entityId');
    let cursor = await index.openCursor(IDBKeyRange.only(entityId), 'prev');
    return cursor ? cursor.value : null;
  }
}
