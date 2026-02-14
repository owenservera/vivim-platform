/**
 * Utility Functions for Recommendation System
 * Common operations used across multiple modules
 */

import type { Conversation } from './types';

/**
 * Extract topics from conversations
 */
export function extractTopics(conversations: Conversation[]): { name: string; count: number }[] {
  const topicCounts: Record<string, number> = {};

  conversations.forEach(conv => {
    if (conv.metadata?.tags) {
      conv.metadata.tags.forEach((tag: string) => {
        const normalized = tag.trim();
        if (normalized) {
          topicCounts[normalized] = (topicCounts[normalized] || 0) + 1;
        }
      });
    }
  });

  return Object.entries(topicCounts).map(([name, count]) => ({
    name,
    count
  }));
}

/**
 * Calculate days since a given date
 */
export function daysSince(date: string | Date): number {
  const timestamp = typeof date === 'string' ? new Date(date).getTime() : date.getTime();
  return Math.floor((Date.now() - timestamp) / (1000 * 60 * 60 * 24));
}

/**
 * Calculate recency score (0-1) based on days since
 * Uses exponential decay with half-life of 30 days
 */
export function calculateRecencyScore(daysAgo: number, halfLifeDays = 30): number {
  return Math.max(0, Math.exp(-daysAgo * Math.LN2 / halfLifeDays));
}

/**
 * Format timestamp for display
 */
export function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

/**
 * Get time display object with icon and text
 */
export function getTimeDisplay(daysAgo: number): { icon: string; text: string } {
  if (daysAgo === 0) return { icon: 'clock', text: 'Today' };
  if (daysAgo === 1) return { icon: 'clock', text: 'Yesterday' };
  if (daysAgo < 7) return { icon: 'calendar', text: `${daysAgo} days ago` };
  if (daysAgo < 30) return { icon: 'calendar', text: `${Math.floor(daysAgo / 7)} weeks ago` };
  return { icon: 'archive', text: `${Math.floor(daysAgo / 30)} months ago` };
}

/**
 * Normalize text for comparison
 */
export function normalizeText(text: string): string {
  return text.toLowerCase().trim();
}

/**
 * Calculate overlap between two arrays
 */
export function calculateOverlap<T>(arr1: T[], arr2: T[]): number {
  const set1 = new Set(arr1);
  const set2 = new Set(arr2);
  const intersection = [...set1].filter(x => set2.has(x));
  const union = new Set([...set1, ...set2]);
  return union.size > 0 ? intersection.length / union.size : 0;
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;

  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Safe JSON parse with fallback
 */
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
}

/**
 * Capitalize first letter
 */
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Format number with suffix (k, M, B)
 */
export function formatNumber(num: number): string {
  if (num >= 1000000000) return `${(num / 1000000000).toFixed(1)}B`;
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
  return num.toString();
}

/**
 * Check if code is running in browser
 */
export const isBrowser = typeof window !== 'undefined';

/**
 * Check if code is running in SSR
 */
export const isServer = !isBrowser;
