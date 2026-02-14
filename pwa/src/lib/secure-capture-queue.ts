/**
 * Secure Capture Queue Service
 *
 * Enhanced queue with size limits, aging policies, and security improvements
 */

import { log } from './logger';

export interface QueuedLink {
  url: string;
  provider: string;
  timestamp: string;
  lastRetry?: string;
  retryCount: number;
  lastError?: string;
}

const QUEUE_STORAGE_KEY = 'openscroll_capture_queue';
const MAX_QUEUE_SIZE = 100; // Maximum number of items in queue
const MAX_ITEM_AGE_HOURS = 24; // Maximum age of queue items in hours
const MAX_RETRY_ATTEMPTS = 5; // Maximum number of retry attempts

/**
 * Detect intelligence provider from URL (client-side shim)
 */
const detectProvider = (url: string): string => {
  const p = url.toLowerCase();
  if (p.includes('chatgpt') || p.includes('openai')) return 'ChatGPT';
  if (p.includes('claude') || p.includes('anthropic')) return 'Claude';
  if (p.includes('gemini') || p.includes('google')) return 'Gemini';
  return 'AI Source';
};

/**
 * Secure Capture Queue Service
 *
 * Enhanced logic to store links when server is offline with proper limits and security
 */
export const secureCaptureQueue = {
  /**
   * Add a link to the offline queue with validation
   */
  enqueue(url: string, errorMsg?: string) {
    // Validate URL format
    try {
      new URL(url);
    } catch (e) {
      log.capture.warn('Invalid URL rejected from queue', { url, error: e });
      return false;
    }

    // Check if URL is already in queue
    const queue = this.getQueue();
    const existingIdx = queue.findIndex(item => item.url === url);
    
    if (existingIdx !== -1) {
      // Update existing item
      queue[existingIdx] = {
        ...queue[existingIdx],
        lastRetry: new Date().toISOString(),
        retryCount: Math.min(queue[existingIdx].retryCount + 1, MAX_RETRY_ATTEMPTS),
        lastError: errorMsg || queue[existingIdx].lastError
      };
    } else {
      // Add new item
      queue.push({
        url,
        provider: detectProvider(url),
        timestamp: new Date().toISOString(),
        retryCount: 0,
        lastError: errorMsg
      });
    }

    // Apply queue size limit
    const limitedQueue = this.applySizeLimit(queue);
    
    // Apply age limit
    const agedQueue = this.applyAgeLimit(limitedQueue);
    
    localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(agedQueue));
    log.capture.info('Intelligence link queued/updated in storage', { url, provider: detectProvider(url) });
    
    return true;
  },

  /**
   * Apply size limit to queue
   */
  applySizeLimit(queue: QueuedLink[]): QueuedLink[] {
    if (queue.length <= MAX_QUEUE_SIZE) {
      return queue;
    }
    
    // Keep the most recent items
    return queue.slice(-MAX_QUEUE_SIZE);
  },

  /**
   * Apply age limit to queue
   */
  applyAgeLimit(queue: QueuedLink[]): QueuedLink[] {
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - MAX_ITEM_AGE_HOURS);
    
    return queue.filter(item => {
      const itemTime = new Date(item.timestamp);
      return itemTime > cutoffTime;
    });
  },

  /**
   * Record a retry attempt with validation
   */
  markRetry(url: string, error?: string) {
    // Validate URL before processing
    try {
      new URL(url);
    } catch (e) {
      log.capture.warn('Invalid URL in retry attempt', { url, error: e });
      return;
    }
    
    this.enqueue(url, error);
  },

  /**
   * Get all queued links with cleanup
   */
  getQueue(): QueuedLink[] {
    try {
      const data = localStorage.getItem(QUEUE_STORAGE_KEY);
      if (!data) return [];
      
      let queue: QueuedLink[] = JSON.parse(data);
      
      // Clean up invalid entries
      queue = queue.filter(item => {
        if (!item.url) {
          log.capture.warn('Invalid queue item removed', { item });
          return false;
        }
        
        try {
          new URL(item.url);
          return true;
        } catch (e) {
          log.capture.warn('Invalid URL in queue item removed', { url: item.url, error: e });
          return false;
        }
      });
      
      // Apply limits
      queue = this.applySizeLimit(queue);
      queue = this.applyAgeLimit(queue);
      
      // Update storage if cleanup occurred
      if (queue.length !== JSON.parse(data).length) {
        localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue));
      }
      
      return queue;
    } catch (e) {
      log.capture.error('Failed to parse capture queue', e as Error);
      // Clear corrupted queue
      localStorage.removeItem(QUEUE_STORAGE_KEY);
      return [];
    }
  },

  /**
   * Remove a link from the queue
   */
  dequeue(url: string) {
    const queue = this.getQueue();
    const filtered = queue.filter(item => item.url !== url);
    localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(filtered));
  },

  /**
   * Clear the entire queue
   */
  clear() {
    localStorage.removeItem(QUEUE_STORAGE_KEY);
  },

  /**
   * Get queue statistics
   */
  getStats() {
    const queue = this.getQueue();
    return {
      totalItems: queue.length,
      maxSize: MAX_QUEUE_SIZE,
      maxAgeHours: MAX_ITEM_AGE_HOURS,
      maxRetries: MAX_RETRY_ATTEMPTS,
      oldestItem: queue.length > 0 ? new Date(queue[0].timestamp) : null,
      newestItem: queue.length > 0 ? new Date(queue[queue.length - 1].timestamp) : null
    };
  },

  /**
   * Remove items that have exceeded retry attempts
   */
  removeFailedItems() {
    const queue = this.getQueue();
    const remaining = queue.filter(item => item.retryCount < MAX_RETRY_ATTEMPTS);
    
    if (remaining.length !== queue.length) {
      localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(remaining));
      const removedCount = queue.length - remaining.length;
      log.capture.info(`Removed ${removedCount} failed items from queue`, { 
        removedCount, 
        remainingCount: remaining.length 
      });
    }
    
    return remaining;
  }
};

// Export original name for backward compatibility
export { secureCaptureQueue as captureQueue };