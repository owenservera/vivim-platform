/**
 * Performance Utilities Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  calculateStatsOptimized,
  memoize,
  clearMemoCache,
  debounce,
  throttle,
  createTimer,
} from '../../src/utils/performance.js';

describe('calculateStatsOptimized', () => {
  it('should calculate stats for plain text messages', () => {
    const conversation = {
      id: '123',
      createdAt: '2025-01-24T10:00:00Z',
      messages: [
        {
          id: '1',
          role: 'user',
          content: 'Hello world',
          timestamp: '2025-01-24T10:00:00Z',
        },
        {
          id: '2',
          role: 'assistant',
          content: 'Hi there! How can I help you today?',
          timestamp: '2025-01-24T10:01:00Z',
        },
      ],
    };

    const stats = calculateStatsOptimized(conversation);

    expect(stats.totalMessages).toBe(2);
    expect(stats.totalWords).toBe(10); // "Hello world" (2) + "Hi there! How can I help you today?" (8)
    expect(stats.totalCharacters).toBe(45);
  });

  it('should calculate stats for rich content messages', () => {
    const conversation = {
      id: '123',
      createdAt: '2025-01-24T10:00:00Z',
      messages: [
        {
          id: '1',
          role: 'user',
          content: [
            { type: 'text', content: 'Here is some code:' },
            { type: 'code', content: 'console.log("Hello");', language: 'javascript' },
          ],
          timestamp: '2025-01-24T10:00:00Z',
        },
      ],
    };

    const stats = calculateStatsOptimized(conversation);

    expect(stats.totalMessages).toBe(1);
    expect(stats.totalWords).toBe(4); // "Here is some code:"
    expect(stats.totalCodeBlocks).toBe(1);
  });

  it('should handle empty message array', () => {
    const conversation = {
      id: '123',
      createdAt: '2025-01-24T10:00:00Z',
      messages: [],
    };

    const stats = calculateStatsOptimized(conversation);

    expect(stats.totalMessages).toBe(0);
    expect(stats.totalWords).toBe(0);
  });

  it('should include first and last message timestamps', () => {
    const conversation = {
      id: '123',
      createdAt: '2025-01-24T09:00:00Z',
      messages: [
        {
          id: '1',
          role: 'user',
          content: 'First',
          timestamp: '2025-01-24T10:00:00Z',
        },
        {
          id: '2',
          role: 'assistant',
          content: 'Last',
          timestamp: '2025-01-24T11:00:00Z',
        },
      ],
    };

    const stats = calculateStatsOptimized(conversation);

    expect(stats.firstMessageAt).toBe('2025-01-24T10:00:00Z');
    expect(stats.lastMessageAt).toBe('2025-01-24T11:00:00Z');
  });

  it('should use conversation createdAt when messages have no timestamps', () => {
    const conversation = {
      id: '123',
      createdAt: '2025-01-24T09:00:00Z',
      messages: [
        {
          id: '1',
          role: 'user',
          content: 'Test',
          timestamp: null,
        },
      ],
    };

    const stats = calculateStatsOptimized(conversation);

    expect(stats.firstMessageAt).toBe('2025-01-24T09:00:00Z');
  });
});

describe('memoize', () => {
  beforeEach(() => {
    clearMemoCache();
  });

  it('should cache function results', () => {
    let callCount = 0;
    const expensiveFn = (x) => {
      callCount++;
      return x * 2;
    };

    const memoized = memoize(expensiveFn);

    expect(memoized(5)).toBe(10);
    expect(callCount).toBe(1);

    expect(memoized(5)).toBe(10);
    expect(callCount).toBe(1); // Should not increase
  });

  it('should use custom key generator', () => {
    let callCount = 0;
    const fn = (a, b) => {
      callCount++;
      return a + b;
    };

    const memoized = memoize(fn, (a, b) => `${a}-${b}`);

    memoized(1, 2);
    memoized(1, 2);
    expect(callCount).toBe(1);
  });

  it('should limit cache size', () => {
    const fn = (x) => x;
    const memoized = memoize(fn);

    // Fill cache beyond limit
    for (let i = 0; i < 1100; i++) {
      memoized(i);
    }

    // Cache should be limited to 1000 entries
    const cacheSize = (memoized.toString().match(/cache/g) || []).length;
    expect(cacheSize).toBeLessThanOrEqual(1000);
  });
});

describe('debounce', () => {
  vi.useFakeTimers();

  it('should delay function execution', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 100);

    debounced();

    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(100);

    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should cancel previous calls', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 100);

    debounced();
    debounced();
    debounced();

    vi.advanceTimersByTime(100);

    expect(fn).toHaveBeenCalledTimes(1);
  });
});

describe('throttle', () => {
  vi.useFakeTimers();

  it('should limit function execution rate', () => {
    const fn = vi.fn();
    const throttled = throttle(fn, 100);

    throttled();
    throttled();
    throttled();

    expect(fn).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(100);

    throttled();
    expect(fn).toHaveBeenCalledTimes(2);
  });
});

describe('createTimer', () => {
  it('should measure elapsed time', () => {
    const timer = createTimer();

    // Simulate some work
    const start = Date.now();
    while (Date.now() - start < 50) {
      // Wait 50ms
    }

    const duration = timer.end();

    expect(duration).toBeGreaterThanOrEqual(50);
  });

  it('should log timer with label', () => {
    const consoleSpy = vi.spyOn(console, 'log');
    const timer = createTimer();

    timer.log('Test operation');

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('[Test operation]'));
  });
});
