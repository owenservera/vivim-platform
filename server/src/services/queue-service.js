/**
 * Background Queue Service
 * 
 * Handles long-running tasks asynchronously.
 * Uses 'p-queue' for concurrency control.
 */

import PQueue from 'p-queue';
import { logger } from '../lib/logger.js';
import { v4 as uuidv4 } from 'uuid';
import { serverErrorReporter } from '../utils/server-error-reporting.js';

class QueueService {
  constructor() {
    this.queues = new Map();
    this.maxConcurrent = 3; // Max tasks per queue
  }

  /**
   * Get or create a queue for a specific task type
   * @param {string} taskType 'consolidation', 'extraction', etc.
   */
  getQueue(taskType) {
    if (!this.queues.has(taskType)) {
      const queue = new PQueue({ concurrency: this.maxConcurrent });
      queue.on('active', () => {
        logger.debug(`Working on item #${queue.pending} in queue: ${taskType}`);
      });
      this.queues.set(taskType, queue);
    }
    return this.queues.get(taskType);
  }

  /**
   * Add a task to the queue
   * @param {string} taskType 
   * @param {Function} taskFunction 
   */
  async add(taskType, taskFunction) {
    const queue = this.getQueue(taskType);
    const taskId = uuidv4();
    
    return queue.add(async () => {
      try {
        await taskFunction();
        logger.info({ taskId, taskType }, 'Task completed');
      } catch (error) {
        logger.error({ taskId, taskType, error: error.message }, 'Task failed');
        serverErrorReporter.reportServerError(`Background task failed: ${taskType}`, error, { taskId, taskType }, 'medium');
      }
    });
  }

  /**
   * Get stats for a queue
   */
  getStats(taskType) {
    const queue = this.queues.get(taskType);
    if (!queue) return { size: 0, pending: 0 };
    return { size: queue.size, pending: queue.pending };
  }
}

export const queueService = new QueueService();
