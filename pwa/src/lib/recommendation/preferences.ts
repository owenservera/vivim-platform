/**
 * User Preferences Persistence
 * Save/load user recommendation preferences
 */

import { DEFAULT_USER_PREFERENCES, STORAGE_KEYS } from './config';
import type { UserPreferences } from './types';

/**
 * Load user preferences from localStorage
 */
export function loadUserPreferences(): UserPreferences {
  if (typeof window === 'undefined') {
    return { ...DEFAULT_USER_PREFERENCES };
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEYS.USER_PREFERENCES);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...DEFAULT_USER_PREFERENCES, ...parsed };
    }
  } catch (error) {
    console.error('[Preferences] Failed to load:', error);
  }

  return { ...DEFAULT_USER_PREFERENCES };
}

/**
 * Save user preferences to localStorage
 */
export function saveUserPreferences(prefs: UserPreferences): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.setItem(STORAGE_KEYS.USER_PREFERENCES, JSON.stringify(prefs));
  } catch (error) {
    console.error('[Preferences] Failed to save:', error);
  }
}

/**
 * Reset preferences to defaults
 */
export function resetUserPreferences(): void {
  saveUserPreferences({ ...DEFAULT_USER_PREFERENCES });
}

/**
 * Update specific preference
 */
export function updatePreference<K extends keyof UserPreferences>(
  key: K,
  value: UserPreferences[K]
): void {
  const current = loadUserPreferences();
  const updated = { ...current, [key]: value };
  saveUserPreferences(updated);
}

/**
 * Add conversation to dismissed list
 */
export function dismissConversation(conversationId: string): void {
  const prefs = loadUserPreferences();
  prefs.dismissed = [...new Set([...prefs.dismissed, conversationId])];
  saveUserPreferences(prefs);
}

/**
 * Remove conversation from dismissed list
 */
export function undismissConversation(conversationId: string): void {
  const prefs = loadUserPreferences();
  prefs.dismissed = prefs.dismissed.filter(id => id !== conversationId);
  saveUserPreferences(prefs);
}

/**
 * Add topic to disliked list
 */
export function dislikeTopic(topic: string): void {
  const prefs = loadUserPreferences();
  prefs.dislikedTopics = [...new Set([...prefs.dislikedTopics, topic])];
  saveUserPreferences(prefs);
}

/**
 * Remove topic from disliked list
 */
export function undislikeTopic(topic: string): void {
  const prefs = loadUserPreferences();
  prefs.dislikedTopics = prefs.dislikedTopics.filter(t => t !== topic);
  saveUserPreferences(prefs);
}

/**
 * Export preferences (for backup)
 */
export function exportPreferences(): string {
  const prefs = loadUserPreferences();
  return JSON.stringify(prefs, null, 2);
}

/**
 * Import preferences (from backup)
 */
export function importPreferences(json: string): boolean {
  try {
    const parsed = JSON.parse(json);
    if (parsed.rankWeights && parsed.providerBoost) {
      saveUserPreferences(parsed);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

// Re-export for convenience
export { DEFAULT_USER_PREFERENCES as DEFAULT_PREFERENCES };
