/**
 * Vitest Test Setup
 * Global configuration for tests
 */

import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock IndexedDB
const indexedDB = {
  open: vi.fn(() => ({
    createObjectStore: vi.fn(),
    transaction: vi.fn(() => ({
      objectStore: vi.fn(() => ({
        add: vi.fn(),
        get: vi.fn(),
        put: vi.fn(),
        delete: vi.fn(),
        getAll: vi.fn(() => Promise.resolve([]))
      }))
    })),
    close: vi.fn()
  }))
};

declare global {
  var indexedDB: IDBFactory;
  var ResizeObserver: typeof ResizeObserver;
  var IntersectionObserver: typeof IntersectionObserver;
  var requestAnimationFrame: typeof requestAnimationFrame;
  var cancelAnimationFrame: typeof cancelAnimationFrame;
}

globalThis.indexedDB = indexedDB as unknown as IDBFactory;

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn()
}));

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn()
}));

// Mock requestAnimationFrame
global.requestAnimationFrame = (callback: FrameRequestCallback) => {
  return setTimeout(callback, 0) as number;
};

global.cancelAnimationFrame = (id: number) => {
  clearTimeout(id);
};

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: vi.fn(),
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn()
};
