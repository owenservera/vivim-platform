/**
 * Test Setup
 *
 * Global test configuration and fixtures
 */

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'error'; // Reduce noise in tests
process.env.LOG_FORMAT = 'json';

// Mock database connection
import { mockDatabase } from './test-helpers.js';
mockDatabase();

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

