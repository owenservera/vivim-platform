import PQueue from 'p-queue';
import { logger } from '../lib/logger.js';

/**
 * Intelligent Queue System for managing capture requests.
 * Uses priority queues, dynamic concurrency, and tracks queue health.
 */
class IntelligentQueue {
  constructor(initialConcurrency = 2) {
    this.queue = new PQueue({ 
      concurrency: initialConcurrency,
      autoStart: true 
    });
    
    // Hook into queue events for monitoring
    this.queue.on('active', () => {
      logger.debug({ 
        size: this.queue.size, 
        pending: this.queue.pending 
      }, 'Queue item active');
      this.adjustConcurrency();
    });

    this.queue.on('idle', () => {
      logger.info('Intelligent capture queue is now idle');
    });
  }

  /**
   * Adjusts concurrency based on queue size and system health
   */
  adjustConcurrency() {
    const queueLength = this.queue.size;
    
    // Simple dynamic scaling logic:
    // If queue is backing up, increase concurrency up to a safe limit
    const MAX_SAFE_CONCURRENCY = parseInt(process.env.MAX_CONCURRENT_CAPTURES || '10', 10);
    
    if (queueLength > 20 && this.queue.concurrency < MAX_SAFE_CONCURRENCY) {
      const newLimit = Math.min(this.queue.concurrency + 2, MAX_SAFE_CONCURRENCY);
      logger.info(`Scaling up queue concurrency to ${newLimit} (Queue size: ${queueLength})`);
      this.queue.concurrency = newLimit;
    } else if (queueLength < 5 && this.queue.concurrency > 2) {
      // Scale down gently when load decreases
      const newLimit = Math.max(this.queue.concurrency - 1, 2);
      if (this.queue.concurrency !== newLimit) {
        logger.info(`Scaling down queue concurrency to ${newLimit} (Queue size: ${queueLength})`);
        this.queue.concurrency = newLimit;
      }
    }
  }

  /**
   * Add a task to the intelligent queue
   * @param {Function} taskFn - The async function to execute
   * @param {Object} options - Options including priority (0=normal, higher=priority)
   */
  add(taskFn, options = {}) {
    const priority = options.priority || 0;
    return this.queue.add(taskFn, { priority });
  }

  getStatus() {
    return {
      size: this.queue.size,
      pending: this.queue.pending,
      isPaused: this.queue.isPaused,
      concurrency: this.queue.concurrency
    };
  }
}

export const captureQueue = new IntelligentQueue(
  process.env.INITIAL_CONCURRENT_CAPTURES ? parseInt(process.env.INITIAL_CONCURRENT_CAPTURES, 10) : 2
);
