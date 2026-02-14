/**
 * Bookmarks / Favorites Management
 * localStorage-based persistence for bookmarked conversations
 */

import { STORAGE_KEYS } from './config';

export interface Bookmark {
  conversationId: string;
  timestamp: number;
  note?: string;
}

/**
 * Load all bookmarks from localStorage
 */
export function loadBookmarks(): Bookmark[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.BOOKMARKS);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('[bookmarks] Failed to load:', error);
    return [];
  }
}

/**
 * Save bookmarks to localStorage
 */
export function saveBookmarks(bookmarks: Bookmark[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.BOOKMARKS, JSON.stringify(bookmarks));
  } catch (error) {
    console.error('[bookmarks] Failed to save:', error);
  }
}

/**
 * Check if a conversation is bookmarked
 */
export function isBookmarked(conversationId: string): boolean {
  const bookmarks = loadBookmarks();
  return bookmarks.some(b => b.conversationId === conversationId);
}

/**
 * Add a conversation to bookmarks
 */
export function addBookmark(conversationId: string, note?: string): void {
  const bookmarks = loadBookmarks();

  // Check if already bookmarked
  if (bookmarks.some(b => b.conversationId === conversationId)) {
    return; // Already bookmarked
  }

  bookmarks.push({
    conversationId,
    timestamp: Date.now(),
    note
  });

  saveBookmarks(bookmarks);
}

/**
 * Remove a conversation from bookmarks
 */
export function removeBookmark(conversationId: string): void {
  const bookmarks = loadBookmarks();
  const filtered = bookmarks.filter(b => b.conversationId !== conversationId);
  saveBookmarks(filtered);
}

/**
 * Toggle bookmark status
 */
export function toggleBookmark(conversationId: string, note?: string): boolean {
  if (isBookmarked(conversationId)) {
    removeBookmark(conversationId);
    return false;
  } else {
    addBookmark(conversationId, note);
    return true;
  }
}

/**
 * Get all bookmarked conversation IDs
 */
export function getBookmarkedIds(): string[] {
  return loadBookmarks().map(b => b.conversationId);
}

/**
 * Get bookmarks sorted by timestamp (newest first)
 */
export function getSortedBookmarks(): Bookmark[] {
  return loadBookmarks().sort((a, b) => b.timestamp - a.timestamp);
}

/**
 * Clear all bookmarks
 */
export function clearBookmarks(): void {
  localStorage.removeItem(STORAGE_KEYS.BOOKMARKS);
}
