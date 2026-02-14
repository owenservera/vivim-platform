/**
 * Central Configuration for Recommendation System
 * Single source of truth for all default values and constants
 */

export const DEFAULT_RANK_WEIGHTS = {
  quality: 0.35,
  recency: 0.20,
  topicMatch: 0.30,
  interaction: 0.15
} as const;

export const DEFAULT_PROVIDER_BOOSTS = {
  claude: 1.1,
  chatgpt: 1.0,
  gemini: 0.9,
  grok: 0.8,
  deepseek: 0.8,
  qwen: 0.8,
  kimi: 0.8
} as const;

export const DEFAULT_USER_PREFERENCES = {
  rankWeights: DEFAULT_RANK_WEIGHTS,
  providerBoost: DEFAULT_PROVIDER_BOOSTS,
  codeBoost: true,
  longFormBoost: false,
  recentBoost: true,
  dismissed: [] as string[],
  dislikedTopics: [] as string[]
} as const;

export const RECOMMENDATION_LIMITS = {
  DEFAULT: 20,
  MAX_CANDIDATES: 100,
  HOME_PREVIEW: 3,
  SIMILAR_CONVERSATIONS: 5,
  SEARCH_RESULTS: 20
} as const;

export const QUALITY_THRESHOLDS = {
  HIGH: 75,
  MEDIUM: 50,
  LOW: 25
} as const;

export const RECENCY_INTERVALS = [
  'P1D',  // 1 day
  'P1W',  // 1 week
  'P1M',  // 1 month
  'P3M',  // 3 months
  'P1Y'   // 1 year
] as const;

export const ANALYTICS_EVENTS = {
  FEED_GENERATED: 'feed_generated',
  IMPRESSION: 'recommendation_impression',
  CLICKED: 'clicked',
  DISMISSED: 'dismissed'
} as const;

export const STORAGE_KEYS = {
  USER_PREFERENCES: 'openscroll_recommendation_prefs',
  BOOKMARKS: 'openscroll_bookmarks',
  ANALYTICS: 'recommendation_analytics'
} as const;
