
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
 * Capture Queue Service
 * 
 * Logic to store links when server is offline and handle background re-sycn.
 */
export const captureQueue = {
  /**
   * Add a link to the offline queue
   */
  enqueue(url: string, errorMsg?: string) {
    const queue = this.getQueue();
    const provider = detectProvider(url);
    
    // If it exists, update it with newest error/retry
    const existingIdx = queue.findIndex(item => item.url === url);
    if (existingIdx !== -1) {
      queue[existingIdx] = {
        ...queue[existingIdx],
        lastRetry: new Date().toISOString(),
        retryCount: queue[existingIdx].retryCount + 1,
        lastError: errorMsg || queue[existingIdx].lastError
      };
    } else {
      queue.push({
        url,
        provider,
        timestamp: new Date().toISOString(),
        retryCount: 0,
        lastError: errorMsg
      });
    }
    
    localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue));
    log.capture.info('Intelligence link queued/updated in storage', { url, provider });
  },

  /**
   * Record a retry attempt
   */
  markRetry(url: string, error?: string) {
    this.enqueue(url, error);
  },

  /**
   * Get all queued links
   */
  getQueue(): QueuedLink[] {
    try {
      const data = localStorage.getItem(QUEUE_STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      log.capture.error('Failed to parse capture queue', e as Error);
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
  }
};
