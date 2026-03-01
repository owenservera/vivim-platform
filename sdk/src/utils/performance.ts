/**
 * Performance Optimization Utilities - Core SDK performance enhancements
 * Caching, batching, debouncing, and memory optimization
 */

/**
 * Cache entry with TTL
 */
export interface CacheEntry<T> {
  /** Cached value */
  value: T;
  /** Created timestamp */
  createdAt: number;
  /** TTL in milliseconds */
  ttl: number;
  /** Access count */
  accessCount: number;
  /** Last accessed timestamp */
  lastAccessed: number;
}

/**
 * Cache configuration
 */
export interface CacheConfig {
  /** Default TTL (ms) */
  defaultTtl: number;
  /** Max cache size */
  maxSize: number;
  /** Eviction policy */
  evictionPolicy: 'lru' | 'lfu' | 'fifo';
}

/**
 * LRU Cache with TTL support
 */
export class Cache<T> {
  private entries: Map<string, CacheEntry<T>> = new Map();
  private config: CacheConfig;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      defaultTtl: 300000, // 5 minutes
      maxSize: 1000,
      evictionPolicy: 'lru',
      ...config,
    };
  }

  /**
   * Get value from cache
   */
  get(key: string): T | null {
    const entry = this.entries.get(key);
    if (!entry) return null;

    // Check TTL
    if (Date.now() - entry.createdAt > entry.ttl) {
      this.entries.delete(key);
      return null;
    }

    // Update access info
    entry.accessCount++;
    entry.lastAccessed = Date.now();
    this.entries.set(key, entry);

    return entry.value;
  }

  /**
   * Set value in cache
   */
  set(key: string, value: T, ttl?: number): void {
    // Check size limit
    if (this.entries.size >= this.config.maxSize) {
      this.evict();
    }

    this.entries.set(key, {
      value,
      createdAt: Date.now(),
      ttl: ttl ?? this.config.defaultTtl,
      accessCount: 0,
      lastAccessed: Date.now(),
    });
  }

  /**
   * Delete from cache
   */
  delete(key: string): boolean {
    return this.entries.delete(key);
  }

  /**
   * Check if key exists
   */
  has(key: string): boolean {
    const entry = this.entries.get(key);
    if (!entry) return false;

    if (Date.now() - entry.createdAt > entry.ttl) {
      this.entries.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Clear cache
   */
  clear(): void {
    this.entries.clear();
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.entries.size;
  }

  /**
   * Get cache stats
   */
  getStats(): {
    size: number;
    maxSize: number;
    hits: number;
    misses: number;
    evictions: number;
  } {
    return {
      size: this.entries.size,
      maxSize: this.config.maxSize,
      hits: 0, // Would need tracking
      misses: 0,
      evictions: 0,
    };
  }

  /**
   * Evict entries based on policy
   */
  private evict(): void {
    switch (this.config.evictionPolicy) {
      case 'lru':
        this.evictLRU();
        break;
      case 'lfu':
        this.evictLFU();
        break;
      case 'fifo':
        this.evictFIFO();
        break;
    }
  }

  private evictLRU(): void {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    for (const [key, entry] of this.entries.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.entries.delete(oldestKey);
    }
  }

  private evictLFU(): void {
    let leastFreqKey: string | null = null;
    let leastFreqCount = Infinity;

    for (const [key, entry] of this.entries.entries()) {
      if (entry.accessCount < leastFreqCount) {
        leastFreqCount = entry.accessCount;
        leastFreqKey = key;
      }
    }

    if (leastFreqKey) {
      this.entries.delete(leastFreqKey);
    }
  }

  private evictFIFO(): void {
    const firstKey = this.entries.keys().next().value;
    if (firstKey) {
      this.entries.delete(firstKey);
    }
  }
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return function (this: unknown, ...args: Parameters<T>) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      fn.apply(this, args);
      timeoutId = null;
    }, delay);
  };
}

/**
 * Throttle function
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  fn: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  let lastResult: ReturnType<T> | null = null;

  return function (this: unknown, ...args: Parameters<T>): ReturnType<T> | void {
    if (inThrottle) {
      return lastResult;
    }

    inThrottle = true;
    lastResult = fn.apply(this, args);

    setTimeout(() => {
      inThrottle = false;
    }, limit);

    return lastResult;
  };
}

/**
 * Batch processor for grouping operations
 */
export class BatchProcessor<T, R> {
  private queue: T[] = [];
  private processor: (items: T[]) => Promise<R[]>;
  private maxSize: number;
  private maxDelay: number;
  private timer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    processor: (items: T[]) => Promise<R[]>,
    options: { maxSize?: number; maxDelay?: number } = {}
  ) {
    this.processor = processor;
    this.maxSize = options.maxSize ?? 100;
    this.maxDelay = options.maxDelay ?? 1000;
  }

  /**
   * Add item to batch
   */
  async add(item: T): Promise<R> {
    return new Promise((resolve, reject) => {
      this.queue.push(item);

      // Process if batch is full
      if (this.queue.length >= this.maxSize) {
        this.process().then(resolve).catch(reject);
        return;
      }

      // Set timer for delayed processing
      if (!this.timer) {
        this.timer = setTimeout(() => {
          this.process().then(resolve).catch(reject);
        }, this.maxDelay);
      }
    });
  }

  /**
   * Process batch
   */
  private async process(): Promise<R> {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    const items = [...this.queue];
    this.queue = [];

    try {
      const results = await this.processor(items);
      return results[0];
    } catch (error) {
      console.error('[BatchProcessor] Processing failed:', error);
      throw error;
    }
  }

  /**
   * Flush pending items
   */
  async flush(): Promise<void> {
    if (this.queue.length > 0) {
      await this.process();
    }
  }

  /**
   * Get queue size
   */
  size(): number {
    return this.queue.length;
  }
}

/**
 * Memory-efficient buffer for streaming data
 */
export class CircularBuffer<T> {
  private buffer: (T | null)[];
  private head: number;
  private tail: number;
  private size: number;
  private capacity: number;

  constructor(capacity: number) {
    this.capacity = capacity;
    this.buffer = new Array(capacity).fill(null);
    this.head = 0;
    this.tail = 0;
    this.size = 0;
  }

  /**
   * Add item to buffer
   */
  push(item: T): T | null {
    let evicted: T | null = null;

    if (this.size === this.capacity) {
      // Buffer full, evict oldest
      evicted = this.buffer[this.head] as T;
      this.head = (this.head + 1) % this.capacity;
      this.size--;
    }

    this.buffer[this.tail] = item;
    this.tail = (this.tail + 1) % this.capacity;
    this.size++;

    return evicted;
  }

  /**
   * Remove and return oldest item
   */
  shift(): T | null {
    if (this.size === 0) return null;

    const item = this.buffer[this.head] as T;
    this.buffer[this.head] = null;
    this.head = (this.head + 1) % this.capacity;
    this.size--;

    return item;
  }

  /**
   * Get item at index
   */
  get(index: number): T | null {
    if (index < 0 || index >= this.size) return null;
    return this.buffer[(this.head + index) % this.capacity] as T;
  }

  /**
   * Get all items
   */
  toArray(): T[] {
    const result: T[] = [];
    for (let i = 0; i < this.size; i++) {
      const item = this.get(i);
      if (item !== null) result.push(item);
    }
    return result;
  }

  /**
   * Clear buffer
   */
  clear(): void {
    this.buffer.fill(null);
    this.head = 0;
    this.tail = 0;
    this.size = 0;
  }

  /**
   * Get buffer size
   */
  length(): number {
    return this.size;
  }

  /**
   * Check if buffer is full
   */
  isFull(): boolean {
    return this.size === this.capacity;
  }

  /**
   * Check if buffer is empty
   */
  isEmpty(): boolean {
    return this.size === 0;
  }
}

/**
 * Lazy evaluation wrapper
 */
export class Lazy<T> {
  private factory: () => T;
  private value: T | null = null;
  private evaluated = false;

  constructor(factory: () => T) {
    this.factory = factory;
  }

  /**
   * Get value (evaluates on first access)
   */
  get(): T {
    if (!this.evaluated) {
      this.value = this.factory();
      this.evaluated = true;
    }
    return this.value as T;
  }

  /**
   * Check if evaluated
   */
  isEvaluated(): boolean {
    return this.evaluated;
  }

  /**
   * Reset lazy evaluation
   */
  reset(): void {
    this.value = null;
    this.evaluated = false;
  }
}

/**
 * Object pool for memory-efficient object reuse
 */
export class ObjectPool<T> {
  private pool: T[] = [];
  private factory: () => T;
  private resetter: (obj: T) => void;
  private maxSize: number;
  private createdCount = 0;

  constructor(
    factory: () => T,
    resetter: (obj: T) => void,
    maxSize: number = 100
  ) {
    this.factory = factory;
    this.resetter = resetter;
    this.maxSize = maxSize;
  }

  /**
   * Acquire object from pool
   */
  acquire(): T {
    if (this.pool.length > 0) {
      return this.pool.pop()!;
    }

    this.createdCount++;
    return this.factory();
  }

  /**
   * Return object to pool
   */
  release(obj: T): void {
    if (this.pool.length < this.maxSize) {
      this.resetter(obj);
      this.pool.push(obj);
    }
  }

  /**
   * Get pool stats
   */
  getStats(): {
    poolSize: number;
    maxSize: number;
    createdCount: number;
    reuseRate: number;
  } {
    const reuseRate =
      this.createdCount > 0
        ? (this.createdCount - this.pool.length) / this.createdCount
        : 0;

    return {
      poolSize: this.pool.length,
      maxSize: this.maxSize,
      createdCount: this.createdCount,
      reuseRate,
    };
  }

  /**
   * Clear pool
   */
  clear(): void {
    this.pool = [];
  }
}

/**
 * Create optimized cache instance
 */
export function createCache<T>(config?: Partial<CacheConfig>): Cache<T> {
  return new Cache<T>(config);
}

/**
 * Create batch processor instance
 */
export function createBatchProcessor<T, R>(
  processor: (items: T[]) => Promise<R[]>,
  options?: { maxSize?: number; maxDelay?: number }
): BatchProcessor<T, R> {
  return new BatchProcessor(processor, options);
}

/**
 * Create circular buffer instance
 */
export function createCircularBuffer<T>(capacity: number): CircularBuffer<T> {
  return new CircularBuffer<T>(capacity);
}

/**
 * Create object pool instance
 */
export function createObjectPool<T>(
  factory: () => T,
  resetter: (obj: T) => void,
  maxSize?: number
): ObjectPool<T> {
  return new ObjectPool(factory, resetter, maxSize);
}
