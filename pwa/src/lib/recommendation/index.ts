/**
 * VIVIM Recommendation System
 * X-Algorithm Based Personalization
 *
 * Phase 1: Light Algorithm
 * - Quality scoring
 * - Rediscovery source
 * - Light ranker
 * - Heavy ranker
 * - Knowledge mixer
 * - Analytics tracking
 * - Bookmarks
 * - Test data generation
 */

// ============================================================================
// Core Types
// ============================================================================

export * from './types';

// ============================================================================
// Configuration
// ============================================================================

export {
  DEFAULT_RANK_WEIGHTS,
  DEFAULT_PROVIDER_BOOSTS,
  DEFAULT_USER_PREFERENCES,
  RECOMMENDATION_LIMITS,
  QUALITY_THRESHOLDS,
  RECENCY_INTERVALS,
  ANALYTICS_EVENTS,
  STORAGE_KEYS
} from './config';

// ============================================================================
// Utilities
// ============================================================================

export {
  daysSince,
  calculateRecencyScore,
  formatTimestamp,
  getTimeDisplay,
  normalizeText,
  calculateOverlap,
  debounce,
  safeJsonParse,
  capitalize,
  formatNumber,
  isBrowser,
  isServer,
  extractTopics
} from './utils';

// ============================================================================
// Logging
// ============================================================================

export { logger, createLogger, log, logError, logWarn } from './logger';

// ============================================================================
// Storage Adapter
// ============================================================================

export {
  listConversationsForRecommendation,
  getConversationForRecommendation
} from './storage-adapter';

// ============================================================================
// Preferences
// ============================================================================

export {
  loadUserPreferences,
  saveUserPreferences,
  resetUserPreferences,
  updatePreference,
  dismissConversation,
  undismissConversation,
  dislikeTopic,
  undislikeTopic,
  exportPreferences,
  importPreferences
} from './preferences';

// ============================================================================
// Bookmarks
// ============================================================================

export {
  loadBookmarks,
  saveBookmarks,
  isBookmarked,
  addBookmark,
  removeBookmark,
  toggleBookmark,
  getBookmarkedIds,
  getSortedBookmarks,
  clearBookmarks
} from './bookmarks';
export type { Bookmark } from './bookmarks';

// ============================================================================
// Test Data
// ============================================================================

export {
  generateTestConversations,
  generateHighQualityConversations,
  generateLowQualityConversations,
  generateConversationsByTimePeriod,
  loadTestDataIntoStorage
} from './test-data-generator';

// ============================================================================
// Analytics
// ============================================================================

export {
  analytics,
  useRecommendationAnalytics,
  calculateMetrics
} from './analytics';

// ============================================================================
// Scoring
// ============================================================================

export { QualityScoreCalculator, qualityCalculator } from './scoring/QualityScore';

// ============================================================================
// Sources
// ============================================================================

export { RediscoverySource, rediscoverySource } from './sources/RediscoverySource';

// ============================================================================
// Ranking
// ============================================================================

export { LightRanker, lightRanker } from './ranking/LightRanker';
export { HeavyRanker, heavyRanker } from './ranking/HeavyRanker';

// ============================================================================
// Filters
// ============================================================================

export { VisibilityFilters, visibilityFilters } from './filters/VisibilityFilters';

// ============================================================================
// Mixer (Orchestrator)
// ============================================================================

export { KnowledgeMixer, knowledgeMixer } from './mixer/KnowledgeMixer';

// ============================================================================
// API
// ============================================================================

export * from './api';
