import { Database } from 'bun:sqlite';
import { EventEmitter } from 'events';

export interface BunSQLiteStoreOptions {
  /** Database file path. Defaults to vivim.db in current dir */
  dbPath?: string;
}

/**
 * High-performance RecordKeeper storage adapter utilizing Bun's native SQLite binding.
 * Offers magnitudes faster read/write times compared to File System defaults.
 */
export class BunSQLiteStore extends EventEmitter {
  private db: Database;
  
  constructor(options: BunSQLiteStoreOptions = {}) {
    super();
    this.db = new Database(options.dbPath || 'vivim.db', { create: true });
    this.init();
  }

  private init() {
    this.db.query(`
      CREATE TABLE IF NOT EXISTS records (
        id TEXT PRIMARY KEY,
        data TEXT NOT NULL,
        timestamp INTEGER NOT NULL
      )
    `).run();
  }

  /**
   * Puts a record object dynamically into the SQLite store
   */
  async put(id: string, data: any): Promise<void> {
    const query = this.db.query('INSERT OR REPLACE INTO records (id, data, timestamp) VALUES ($id, $data, $ts)');
    query.run({
      $id: id,
      $data: JSON.stringify(data),
      $ts: Date.now()
    });
  }

  /**
   * Fetches a record by ID from the localized SQLite store
   */
  async get(id: string): Promise<any | null> {
    const query = this.db.query('SELECT data FROM records WHERE id = $id');
    const result = query.get({ $id: id }) as { data: string } | undefined;
    
    if (result && result.data) {
      try {
        return JSON.parse(result.data);
      } catch (err) {
        return null;
      }
    }
    return null;
  }
}
