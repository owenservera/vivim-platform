/**
 * Test Setup
 *
 * Global test configuration and fixtures
 */

import { vi } from 'vitest';

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'error'; // Reduce noise in tests
process.env.LOG_FORMAT = 'json';

// Mock console methods to reduce noise
global.console = {
  ...console,
  log: vi.fn(),
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
};

// Mock database connection
vi.mock('../src/lib/database.js', () => ({
  getPrismaClient: vi.fn(() => ({
    conversation: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      groupBy: vi.fn(),
    },
    captureAttempt: {
      create: vi.fn(),
      update: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      findFirst: vi.fn(),
      aggregate: vi.fn(),
    },
    $disconnect: vi.fn(),
    $transaction: vi.fn(),
  })),
  disconnectPrisma: vi.fn(),
  checkDatabaseHealth: vi.fn(() => true),
  getDatabaseStats: vi.fn(() => ({
    conversations: 0,
    captureAttempts: 0,
  })),
  withTransaction: vi.fn(),
}));

// Test fixtures
export const fixtures = {
  validUrl: 'https://claude.ai/share/abc123',
  conversation: {
    id: '550e8400-e29b-41d4-a716-446655440000',
    provider: 'claude',
    sourceUrl: 'https://claude.ai/share/abc123',
    title: 'Test Conversation',
    createdAt: '2025-01-24T10:00:00Z',
    exportedAt: '2025-01-24T10:05:00Z',
    messageCount: 2,
    messages: [
      {
        id: '550e8400-e29b-41d4-a716-446655440001',
        role: 'user',
        content: 'Hello, how are you?',
        timestamp: '2025-01-24T10:00:00Z',
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440002',
        role: 'assistant',
        content: 'I am doing well, thank you!',
        timestamp: '2025-01-24T10:01:00Z',
      },
    ],
    metadata: {
      provider: 'claude',
      model: 'Claude-3.5-Sonnet',
    },
    stats: {
      totalMessages: 2,
      totalWords: 12,
      totalCharacters: 50,
      totalCodeBlocks: 0,
      totalMermaidDiagrams: 0,
      totalImages: 0,
    },
  },
};

// Cleanup after each test
afterEach(() => {
  vi.clearAllMocks();
});
