/**
 * Vitest Test Setup
 * Global configuration for tests
 */

import { afterEach, vi, beforeAll, afterAll } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';
import { server } from './mocks/server';

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

afterEach(() => {
  cleanup();
});

declare global {
  var indexedDB: IDBFactory;
  var localStorage: Storage;
  var ResizeObserver: typeof ResizeObserver;
  var IntersectionObserver: typeof IntersectionObserver;
  var requestAnimationFrame: typeof requestAnimationFrame;
  var cancelAnimationFrame: typeof cancelAnimationFrame;
}

// Use plain functions, not vi.fn() - vi.fn() requires test context
const createMock = () => function() {};

globalThis.indexedDB = {
  open: createMock()
} as unknown as IDBFactory;

globalThis.localStorage = {
  getItem: createMock(),
  setItem: createMock(),
  removeItem: createMock(),
  clear: createMock(),
  key: createMock(),
  get length() { return 0; }
} as unknown as Storage;

global.ResizeObserver = createMock();

global.IntersectionObserver = createMock();

global.requestAnimationFrame = (callback: FrameRequestCallback) => {
  return setTimeout(callback, 0) as number;
};

global.cancelAnimationFrame = (id: number) => {
  clearTimeout(id);
};
