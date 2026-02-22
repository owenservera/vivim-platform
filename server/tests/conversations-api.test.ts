
import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import request from 'supertest';
import { app, server } from '../src/server.js';
import { getPrismaClient } from '../src/lib/database.js';

describe('Conversations API Integration', () => {
  const prisma = getPrismaClient();

  afterAll(async () => {
    server.close();
    await prisma.$disconnect();
  });

  it('GET /api/v1/conversations should return 200 and a list', async () => {
    const response = await request(app)
      .get('/api/v1/conversations')
      .expect(200);

    expect(response.body).toHaveProperty('conversations');
    expect(Array.isArray(response.body.conversations)).toBe(true);
  });

  it('GET /api/v1/conversations should support pagination', async () => {
    const response = await request(app)
      .get('/api/v1/conversations?limit=5&offset=0')
      .expect(200);

    expect(response.body.pagination).toBeDefined();
    expect(response.body.pagination.limit).toBe(5);
  });
  
  it('GET /api/v1/conversations with cache-busting should return 200', async () => {
    const response = await request(app)
      .get(`/api/v1/conversations?_t=${Date.now()}`)
      .set('Cache-Control', 'no-cache')
      .expect(200);
      
    expect(response.body).toHaveProperty('conversations');
  });
});
