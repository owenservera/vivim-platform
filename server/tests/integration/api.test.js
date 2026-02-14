/**
 * API Integration Tests
 */

import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import cors from 'cors';
import { captureRouter } from '../../src/routes/capture.js';
import { healthRouter } from '../../src/routes/health.js';
import { conversationsRouter } from '../../src/routes/conversations.js';
import { errorHandler } from '../../src/middleware/errorHandler.js';

// Mock repositories
vi.mock('../../src/repositories/index.js', () => ({
  createConversation: vi.fn(() => Promise.resolve({ id: '123' })),
  findBySourceUrl: vi.fn(() => Promise.resolve(null)),
  listConversations: vi.fn(() => Promise.resolve({ conversations: [], pagination: { total: 0, limit: 20, offset: 0, hasMore: false } })),
  findConversationById: vi.fn(() => Promise.resolve(null)),
  deleteConversation: vi.fn(() => Promise.resolve({ id: '123' })),
  getStatsByProvider: vi.fn(() => Promise.resolve([])),
  getRecentConversations: vi.fn(() => Promise.resolve([])),
  searchByTitle: vi.fn(() => Promise.resolve([])),
  createCaptureAttempt: vi.fn(() => Promise.resolve({ id: 'attempt-123' })),
  completeCaptureAttempt: vi.fn(() => Promise.resolve()),
  findRecentSuccessfulAttempt: vi.fn(() => Promise.resolve(null)),
}));

// Mock extractor
vi.mock('../../src/services/extractor.js', () => ({
  detectProvider: vi.fn(() => 'claude'),
  extractConversation: vi.fn(() => Promise.resolve({
    id: '123',
    provider: 'claude',
    sourceUrl: 'https://claude.ai/share/abc',
    title: 'Test',
    createdAt: '2025-01-24T10:00:00Z',
    exportedAt: '2025-01-24T10:05:00Z',
    messages: [],
    metadata: { provider: 'claude' },
  })),
}));

// Mock database health check
vi.mock('../../src/lib/database.js', () => ({
  getPrismaClient: vi.fn(() => ({
    $queryRaw: vi.fn(() => Promise.resolve([{ 1: 1 }])),
  })),
  checkDatabaseHealth: vi.fn(() => Promise.resolve(true)),
  getDatabaseStats: vi.fn(() => Promise.resolve({
    conversations: 0,
    captureAttempts: 0,
  })),
  disconnectPrisma: vi.fn(() => Promise.resolve()),
}));

function createTestApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.use('/', healthRouter);
  app.use('/api/v1', captureRouter);
  app.use('/api/v1/conversations', conversationsRouter);

  app.use(errorHandler);

  return app;
}

describe('API Integration Tests', () => {
  let app;

  beforeAll(() => {
    app = createTestApp();
  });

  describe('GET /', () => {
    it('should return health status', async () => {
      const response = await request(app).get('/');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('service', 'OpenScroll Capture API');
      expect(response.body).toHaveProperty('version');
    });
  });

  describe('GET /health/detailed', () => {
    it('should return detailed health status', async () => {
      const response = await request(app).get('/health/detailed');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('system');
      expect(response.body).toHaveProperty('database');
    });
  });

  describe('GET /api/v1/providers', () => {
    it('should return list of supported providers', async () => {
      const response = await request(app).get('/api/v1/providers');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('providers');
      expect(response.body).toHaveProperty('count');
      expect(Array.isArray(response.body.providers)).toBe(true);
      expect(response.body.providers).toContain('claude');
      expect(response.body.providers).toContain('chatgpt');
    });
  });

  describe('GET /api/v1/detect-provider', () => {
    it('should detect provider from URL', async () => {
      const response = await request(app)
        .get('/api/v1/detect-provider')
        .query({ url: 'https://claude.ai/share/abc123' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('provider');
      expect(response.body).toHaveProperty('supported');
    });

    it('should return 400 for missing URL parameter', async () => {
      const response = await request(app).get('/api/v1/detect-provider');

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/v1/capture', () => {
    it('should capture conversation successfully', async () => {
      const response = await request(app)
        .post('/api/v1/capture')
        .send({
          url: 'https://claude.ai/share/abc123',
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'success');
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('provider');
    }, 10000);

    it('should validate URL is required', async () => {
      const response = await request(app)
        .post('/api/v1/capture')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should validate URL format', async () => {
      const response = await request(app)
        .post('/api/v1/capture')
        .send({
          url: 'not-a-valid-url',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
    });

    it('should accept capture options', async () => {
      const response = await request(app)
        .post('/api/v1/capture')
        .send({
          url: 'https://claude.ai/share/abc123',
          options: {
            timeout: 180000,
            richFormatting: true,
            metadataOnly: false,
          },
        });

      expect(response.status).toBe(200);
    });
  });

  describe('GET /api/v1/conversations', () => {
    it('should return conversations list', async () => {
      const response = await request(app).get('/api/v1/conversations');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('conversations');
      expect(response.body).toHaveProperty('pagination');
    });

    it('should accept query parameters', async () => {
      const response = await request(app)
        .get('/api/v1/conversations')
        .query({ limit: 10, offset: 0, provider: 'claude' });

      expect(response.status).toBe(200);
    });
  });

  describe('GET /api/v1/conversations/:id', () => {
    it('should return 404 for non-existent conversation', async () => {
      const response = await request(app).get('/api/v1/conversations/nonexistent-id');

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/v1/conversations/stats/summary', () => {
    it('should return statistics', async () => {
      const response = await request(app).get('/api/v1/conversations/stats/summary');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('stats');
    });
  });

  describe('GET /api/v1/conversations/recent', () => {
    it('should return recent conversations', async () => {
      const response = await request(app).get('/api/v1/conversations/recent');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('conversations');
    });

    it('should accept limit parameter', async () => {
      const response = await request(app)
        .get('/api/v1/conversations/recent')
        .query({ limit: 5 });

      expect(response.status).toBe(200);
    });
  });

  describe('404 Handler', () => {
    it('should return 404 for unknown routes', async () => {
      const response = await request(app).get('/api/v1/unknown-route');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
    });
  });
});
