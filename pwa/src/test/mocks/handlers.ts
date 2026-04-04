/**
 * MSW Handlers - Mock API endpoints for testing
 * Covers common VIVIM API endpoints
 */

import { http, HttpResponse, delay } from 'msw';

export const handlers = [
  // Auth endpoints
  http.post('/api/v1/auth/login', async () => {
    await delay(100);
    return HttpResponse.json({
      success: true,
      token: 'mock-jwt-token',
      user: {
        id: 'user-1',
        email: 'test@vivim.app',
        name: 'Test User',
        avatarUrl: null,
      }
    });
  }),

  http.post('/api/v1/auth/logout', async () => {
    await delay(50);
    return HttpResponse.json({ success: true });
  }),

  http.get('/api/v1/auth/me', async () => {
    await delay(50);
    return HttpResponse.json({
      id: 'user-1',
      email: 'test@vivim.app',
      name: 'Test User',
      avatarUrl: null,
      createdAt: '2024-01-01T00:00:00.000Z',
    });
  }),

  // Conversation endpoints
  http.get('/api/v1/conversations', async ({ request }) => {
    await delay(100);
    const url = new URL(request.url);
    const limit = url.searchParams.get('limit') || '20';
    const offset = url.searchParams.get('offset') || '0';
    
    return HttpResponse.json({
      conversations: [
        {
          id: 'conv-1',
          title: 'Test Conversation',
          provider: 'claude',
          sourceUrl: 'https://claude.ai/share/test',
          createdAt: new Date().toISOString(),
          exportedAt: new Date().toISOString(),
          messages: [],
          metadata: {},
          stats: {
            totalMessages: 5,
            totalWords: 500,
            totalCharacters: 3000,
            totalCodeBlocks: 0,
            totalMermaidDiagrams: 0,
            totalImages: 0,
            timesViewed: 0,
            wasExported: false,
            wasShared: false,
            hasUserNotes: false
          },
          privacy: { level: 'local', updatedAt: new Date().toISOString() }
        }
      ],
      total: 1,
      limit: parseInt(limit),
      offset: parseInt(offset),
    });
  }),

  http.get('/api/v1/conversations/:id', async ({ params }) => {
    await delay(50);
    const { id } = params;
    
    return HttpResponse.json({
      id,
      title: 'Test Conversation',
      provider: 'claude',
      sourceUrl: 'https://claude.ai/share/test',
      createdAt: new Date().toISOString(),
      exportedAt: new Date().toISOString(),
      messages: [
        {
          id: 'msg-1',
          role: 'user',
          content: 'Hello',
          timestamp: new Date().toISOString(),
        },
        {
          id: 'msg-2',
          role: 'assistant',
          content: 'Hi there! How can I help?',
          timestamp: new Date().toISOString(),
        }
      ],
      metadata: {},
      stats: {
        totalMessages: 2,
        totalWords: 10,
        totalCharacters: 50,
        totalCodeBlocks: 0,
        totalMermaidDiagrams: 0,
        totalImages: 0,
        timesViewed: 0,
        wasExported: false,
        wasShared: false,
        hasUserNotes: false
      },
      privacy: { level: 'local', updatedAt: new Date().toISOString() }
    });
  }),

  http.post('/api/v1/conversations', async ({ request }) => {
    await delay(100);
    const body = await request.json() as Record<string, unknown>;
    
    return HttpResponse.json({
      id: `conv-${Date.now()}`,
      ...body,
      createdAt: new Date().toISOString(),
    }, { status: 201 });
  }),

  http.delete('/api/v1/conversations/:id', async () => {
    await delay(50);
    return HttpResponse.json({ success: true });
  }),

  // Feed endpoints
  http.get('/api/v1/feed', async () => {
    await delay(100);
    return HttpResponse.json({
      items: [],
      total: 0,
    });
  }),

  // Sharing endpoints
  http.post('/api/v1/share', async ({ request }) => {
    await delay(100);
    const body = await request.json() as Record<string, unknown>;
    
    return HttpResponse.json({
      id: `share-${Date.now()}`,
      conversationId: body.conversationId,
      shareUrl: `https://vivim.app/shared/${Date.now()}`,
      createdAt: new Date().toISOString(),
    }, { status: 201 });
  }),

  http.get('/api/v1/share/:id', async ({ params }) => {
    await delay(50);
    const { id } = params;
    
    return HttpResponse.json({
      id,
      conversation: {
        id: 'conv-1',
        title: 'Shared Conversation',
        provider: 'claude',
        messages: [],
      },
      createdAt: new Date().toISOString(),
    });
  }),

  // Settings endpoints
  http.get('/api/v1/settings', async () => {
    await delay(50);
    return HttpResponse.json({
      theme: 'dark',
      notifications: true,
      privacy: {
        level: 'local',
      },
    });
  }),

  http.patch('/api/v1/settings', async ({ request }) => {
    await delay(50);
    const body = await request.json() as Record<string, unknown>;
    
    return HttpResponse.json({
      success: true,
      settings: body,
    });
  }),

  // Handshake for encryption
  http.post('/api/v1/handshake', async () => {
    await delay(100);
    return HttpResponse.json({
      publicKey: 'mock-public-key',
    });
  }),

  // Health check
  http.get('/api/v1/health', async () => {
    await delay(20);
    return HttpResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
    });
  }),

  // Import endpoint
  http.post('/api/v1/import', async () => {
    await delay(200);
    return HttpResponse.json({
      id: `import-${Date.now()}`,
      status: 'processing',
      progress: 0,
    }, { status: 202 });
  }),

  // Export endpoint
  http.post('/api/v1/export', async ({ request }) => {
    await delay(150);
    const body = await request.json() as Record<string, unknown>;
    
    return HttpResponse.json({
      id: `export-${Date.now()}`,
      conversationIds: body.conversationIds,
      format: body.format || 'json',
      status: 'ready',
      downloadUrl: `https://vivim.app/exports/${Date.now()}.zip`,
    }, { status: 201 });
  }),

  // User endpoints
  http.get('/api/v1/user/profile', async () => {
    await delay(50);
    return HttpResponse.json({
      id: 'user-1',
      email: 'test@vivim.app',
      name: 'Test User',
      avatarUrl: null,
      stats: {
        totalConversations: 10,
        totalShares: 2,
        storageUsed: 1024 * 1024 * 5,
      }
    });
  }),

  // Collections endpoints
  http.get('/api/v1/collections', async () => {
    await delay(100);
    return HttpResponse.json({
      collections: [
        {
          id: 'col-1',
          name: 'Work',
          color: '#3b82f6',
          conversationCount: 5,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'col-2',
          name: 'Personal',
          color: '#10b981',
          conversationCount: 3,
          createdAt: new Date().toISOString(),
        }
      ],
    });
  }),

  http.post('/api/v1/collections', async ({ request }) => {
    await delay(100);
    const body = await request.json() as Record<string, unknown>;
    
    return HttpResponse.json({
      id: `col-${Date.now()}`,
      ...body,
      conversationCount: 0,
      createdAt: new Date().toISOString(),
    }, { status: 201 });
  }),
];
