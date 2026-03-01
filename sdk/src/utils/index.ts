/**
 * VIVIM SDK Utilities Module Exports
 */

export {
  generateKeyPair,
  publicKeyToDID,
  didToPublicKey,
  signData,
  verifySignature,
  calculateCID,
  generateId,
  sleep,
  isBrowser,
  isNode,
  deepClone,
  debounce,
  throttle,
} from './crypto.js';

export {
  Logger,
  getLogger,
  setLogger,
  createModuleLogger,
  type LogLevel,
  type LoggerConfig,
} from './logger.js';

// Performance Utilities
export {
  Cache,
  BatchProcessor,
  CircularBuffer,
  Lazy,
  ObjectPool,
  createCache,
  createBatchProcessor,
  createCircularBuffer,
  createObjectPool,
  debounce as perfDebounce,
  throttle as perfThrottle,
  type CacheConfig,
  type CacheEntry,
} from './performance.js';
