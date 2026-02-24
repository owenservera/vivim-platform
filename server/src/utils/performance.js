import { logger } from '../lib/logger.js';

/**
 * Performance-optimized utilities
 *
 * Optimized algorithms for message processing and statistics calculation
 */

/**
 * Calculate conversation statistics - Optimized O(n) implementation
 * @param {Object} conversation - Conversation object with messages
 * @returns {Object} Statistics object
 */
export function calculateStatsOptimized(conversation) {
  const messages = conversation.messages || [];

  // Single-pass processing - O(n) where n = total messages
  const stats = messages.reduce(
    (acc, message) => {
      const contentStats = analyzeContent(message.content);

      return {
        totalMessages: acc.totalMessages + 1,
        totalWords: acc.totalWords + contentStats.words,
        totalCharacters: acc.totalCharacters + contentStats.characters,
        totalCodeBlocks: acc.totalCodeBlocks + contentStats.codeBlocks,
        totalMermaidDiagrams: acc.totalMermaidDiagrams + contentStats.mermaidDiagrams,
        totalImages: acc.totalImages + contentStats.images,
      };
    },
    {
      totalMessages: 0,
      totalWords: 0,
      totalCharacters: 0,
      totalCodeBlocks: 0,
      totalMermaidDiagrams: 0,
      totalImages: 0,
    }
  );

  return {
    ...stats,
    firstMessageAt: messages[0]?.timestamp || conversation.createdAt,
    lastMessageAt: messages[messages.length - 1]?.timestamp || new Date().toISOString(),
  };
}

/**
 * Analyze content blocks - O(m) where m = content blocks in message
 * @param {any} content - Message content (string or array)
 * @returns {Object} Content statistics
 */
function analyzeContent(content) {
  const stats = {
    words: 0,
    characters: 0,
    codeBlocks: 0,
    mermaidDiagrams: 0,
    images: 0,
  };

  if (typeof content === 'string') {
    // String content - fast word count using regex
    stats.words = (content.match(/\S+/g) || []).length;
    stats.characters = content.length;
  } else if (Array.isArray(content)) {
    // Array content blocks - single pass processing
    for (const block of content) {
      switch (block.type) {
        case 'text':
          stats.words += (block.content?.match(/\S+/g) || []).length;
          stats.characters += block.content?.length || 0;
          break;
        case 'code':
          stats.codeBlocks++;
          stats.characters += block.content?.length || 0;
          break;
        case 'mermaid':
          stats.mermaidDiagrams++;
          stats.characters += block.content?.length || 0;
          break;
        case 'image':
          stats.images++;
          break;
      }
    }
  }

  return stats;
}

/**
 * Memoization cache for expensive operations
 */
const memoCache = new Map();

/**
 * Create a memoized version of a function
 * @param {Function} fn - Function to memoize
 * @param {Function} keyGenerator - Function to generate cache key
 * @returns {Function} Memoized function
 */
export function memoize(fn, keyGenerator = (...args) => JSON.stringify(args)) {
  return function (...args) {
    const key = keyGenerator(...args);

    if (memoCache.has(key)) {
      return memoCache.get(key);
    }

    const result = fn(...args);
    memoCache.set(key, result);

    // Limit cache size to prevent memory issues
    if (memoCache.size > 1000) {
      const firstKey = memoCache.keys().next().value;
      memoCache.delete(firstKey);
    }

    return result;
  };
}

/**
 * Clear memoization cache
 */
export function clearMemoCache() {
  memoCache.clear();
}

/**
 * Batch processing utility for large datasets
 * @param {Array} items - Items to process
 * @param {Function} processor - Processing function
 * @param {number} batchSize - Size of each batch
 * @returns {Promise<Array>} Processed results
 */
export async function processBatch(items, processor, batchSize = 100) {
  const results = [];

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(processor));
    results.push(...batchResults);
  }

  return results;
}

/**
 * Debounce function for rate limiting
 * @param {Function} fn - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Debounced function
 */
export function debounce(fn, delay) {
  let timeoutId;

  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Throttle function for rate limiting
 * @param {Function} fn - Function to throttle
 * @param {number} interval - Interval in milliseconds
 * @returns {Function} Throttled function
 */
export function throttle(fn, interval) {
  let lastCall = 0;

  return function (...args) {
    const now = Date.now();

    if (now - lastCall >= interval) {
      lastCall = now;
      return fn(...args);
    }
  };
}

/**
 * Performance timer for benchmarking
 * @returns {Function} Timer function
 */
export function createTimer() {
  const start = Date.now();

  return {
    end: () => Date.now() - start,
    log: (label) => {
      const duration = Date.now() - start;
      logger.info({ label, duration }, `[${label}] ${duration}ms`);
      return duration;
    },
  };
}

/**
 * Lazy evaluation wrapper
 * @param {Function} fn - Function to lazy evaluate
 * @returns {Function} Lazy function
 */
export function lazy(fn) {
  let cached = false;
  let result;

  return function () {
    if (!cached) {
      result = fn();
      cached = true;
    }
    return result;
  };
}

export default {
  calculateStatsOptimized,
  memoize,
  clearMemoCache,
  processBatch,
  debounce,
  throttle,
  createTimer,
  lazy,
};
