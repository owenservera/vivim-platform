/**
 * Unified Logging Utility
 * Consistent logging across the recommendation system
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_PREFIXES = {
  '[Analytics]': 'Analytics',
  '[API]': 'API',
  '[Preferences]': 'Preferences',
  '[Bookmarks]': 'Bookmarks',
  '[KnowledgeMixer]': 'Knowledge Mixer',
  '[QualityScore]': 'Quality Score',
  '[HeavyRanker]': 'Heavy Ranker',
  '[LightRanker]': 'Light Ranker',
  '[Rediscovery]': 'Rediscovery',
  '[ForYou]': 'For You',
  '[Search]': 'Search',
  '[SimilarConversations]': 'Similar Conversations',
  '[getForYouFeed]': 'For You Feed',
  '[getSimilarConversations]': 'Similar Conversations',
  '[sendFeedback]': 'Feedback'
};

/**
 * Check if logging is enabled for the given level
 */
function shouldLog(level: LogLevel): boolean {
  if (typeof window === 'undefined') return false;

  const env = import.meta.env.MODE || 'development';
  if (env === 'production') {
    return level === 'error' || level === 'warn';
  }

  return true;
}

/**
 * Core logging function (internal)
 */
function logMessage(level: LogLevel, prefix: string, ...args: unknown[]): void {
  if (!shouldLog(level)) return;

  const timestamp = new Date().toISOString().split('T')[1].slice(0, 8);
  const message = `[${timestamp}] ${prefix}`;

  switch (level) {
    case 'debug':
    case 'info':
      console.log(message, ...args);
      break;
    case 'warn':
      console.warn(message, ...args);
      break;
    case 'error':
      console.error(message, ...args);
      break;
  }
}

/**
 * Debug level logging
 */
export function logger(prefix: string) {
  return {
    debug: (...args: unknown[]) => logMessage('debug', prefix, ...args),
    info: (...args: unknown[]) => logMessage('info', prefix, ...args),
    warn: (...args: unknown[]) => logMessage('warn', prefix, ...args),
    error: (...args: unknown[]) => logMessage('error', prefix, ...args)
  };
}

/**
 * Create a logger for a specific module
 */
export function createLogger(moduleName: string) {
  // Find matching prefix or use the module name
  const prefix = Object.entries(LOG_PREFIXES).find(([key]) =>
    moduleName.includes(key.replace(/\[|\]/g, ''))
  )?.[0] || `[${moduleName}]`;

  return logger(prefix);
}

/**
 * Quick log functions for common modules
 */
export const log = {
  analytics: logger('[Analytics]'),
  api: logger('[API]'),
  prefs: logger('[Preferences]'),
  bookmarks: logger('[Bookmarks]'),
  mixer: logger('[KnowledgeMixer]'),
  quality: logger('[QualityScore]'),
  heavy: logger('[HeavyRanker]'),
  light: logger('[LightRanker]'),
  rediscovery: logger('[Rediscovery]'),
  forYou: logger('[ForYou]')
};

/**
 * Log error with context
 */
export function logError(context: string, error: unknown, details?: Record<string, unknown>): void {
  logMessage('error', `[Error] ${context}`, error, details || '');
}

/**
 * Log warning with context
 */
export function logWarn(context: string, message: string, details?: Record<string, unknown>): void {
  logMessage('warn', `[Warning] ${context}`, message, details || '');
}
