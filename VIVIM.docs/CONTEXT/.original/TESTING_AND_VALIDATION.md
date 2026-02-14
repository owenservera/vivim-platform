# Testing and Validation Procedures

**Document Version:** 1.0.0
**Date:** February 11, 2026
**Related:** `IMPLEMENTATION_GUIDE_MASTER.md`

---

## Table of Contents

1. [Testing Strategy](#testing-strategy)
2. [Unit Tests](#unit-tests)
3. [Integration Tests](#integration-tests)
4. [End-to-End Tests](#end-to-end-tests)
5. [Load Testing](#load-testing)
6. [Validation Procedures](#validation-procedures)
7. [Test Environment Setup](#test-environment-setup)

---

## Testing Strategy

### Testing Pyramid

```
                ┌─────────────────────┐
                │                     │
                │    End-to-End       │  ← Slowest, most comprehensive
                │                     │
                │    Load Tests        │  ← Performance under stress
                │                     │
                │   Integration Tests    │  ← Component interaction
                │                     │
                │      Unit Tests        │  ← Fastest, focused
                │                     │
                └─────────────────────┘
```

### Coverage Goals

| Layer | Target Coverage | Tools |
|--------|-----------------|--------|
| Services | 80%+ | Jest + Supertest |
| Algorithms | 90%+ | Jest (math-heavy) |
| Database | Prisma + Custom SQL | Jest + Testcontainers |
| API Routes | All endpoints + error cases | Supertest |
| Performance | Latency < 150ms @ 100 concurrent | Artillery + k6 |

---

## Unit Tests

### Test Organization

```
server/tests/
├── unit/
│   ├── services/
│   │   ├── unified-context-service.test.ts
│   │   ├── profile-rollup-service.test.ts
│   │   ├── invalidation-service.test.ts
│   │   ├── context-warmup-worker.test.ts
│   │   └── bundle-compiler.test.ts
│   ├── context/
│   │   ├── budget-algorithm.test.ts
│   │   ├── dynamic-context-assembler.test.ts
│   │   └── conversation-context-engine.test.ts
│   └── utils/
│       ├── token-estimator.test.ts
│       └── embedding-service.test.ts
├── integration/
└── e2e/
```

### Service Layer Tests

#### UnifiedContextService Tests

```typescript
// server/tests/unit/services/unified-context-service.test.ts

import UnifiedContextService from '../../../src/services/unified-context-service';
import { MockPrisma } from '../mocks/mock-prisma';
import { MockEmbeddingService } from '../mocks/mock-embedding-service';
import { mockLLMResponse } from '../mocks/mock-llm';

describe('UnifiedContextService', () => {

  describe('generateContextForChat', () => {

    it('should use new engine when enabled and succeeds', async () => {
      const service = new UnifiedContextService({ enableNewContextEngine: true });
      service.dynamicAssembler = {
        assemble: jest.fn().mockResolvedValue({
          systemPrompt: '## System Prompt\n\nContent...',
          budget: { totalAvailable: 12000, totalUsed: 3000 },
          bundlesUsed: []
        })
      };

      const result = await service.generateContextForChat({
        conversationId: 'conv-123',
        userId: 'user-123',
        includeHistory: true
      });

      expect(result.engineUsed).toBe('dynamic');
      expect(result.systemPrompt).toContain('System Prompt');
      expect(service.dynamicAssembler.assemble).toHaveBeenCalled();
    });

    it('should fallback to legacy when new engine fails', async () => {
      const service = new UnifiedContextService({
        enableNewContextEngine: true,
        fallbackOnError: true
      });
      service.dynamicAssembler = {
        assemble: jest.fn().mockRejectedValue(new Error('Context engine failed'))
      };

      const result = await service.generateContextForChat({
        conversationId: 'conv-456',
        userId: 'user-456',
        includeHistory: true
      });

      expect(result.engineUsed).toBe('legacy');
      expect(result.systemPrompt).toContain('Legacy context');
    });

    it('should fallback to legacy when new engine disabled', async () => {
      const service = new UnifiedContextService({ enableNewContextEngine: false });
      service.dynamicAssembler = null;

      const result = await service.generateContextForChat({
        conversationId: 'conv-789',
        userId: 'user-789',
        includeHistory: true
      });

      expect(result.engineUsed).toBe('legacy');
      expect(result.systemPrompt).toContain('Legacy context');
    });

    it('should respect feature flag header', async () => {
      const service = new UnifiedContextService();
      const req: any = { headers: { 'x-use-dynamic-context': 'true' } };

      const options = service._parseOptions(req);
      expect(options.useDynamicContext).toBe(true);
    });

    it('should calculate cache hit rate correctly', async () => {
      const service = new UnifiedContextService();
      service.dynamicAssembler = {
        assemble: jest.fn().mockResolvedValue({
          systemPrompt: 'Test prompt',
          budget: { totalAvailable: 12000, totalUsed: 4000 },
          bundlesUsed: [
            { bundleType: 'identity_core', hitCount: 5, missCount: 0 },
            { bundleType: 'topic', hitCount: 3, missCount: 1 },
            { bundleType: 'conversation', hitCount: 10, missCount: 2 }
          ]
        })
      };

      const result = await service.generateContextForChat({
        conversationId: 'test-conv',
        userId: 'test-user',
        includeHistory: true
      });

      expect(result.stats?.cacheHitRate).toBe(0.8);  // (5 + 3 + 10) / 5 = 4/5 = 0.8
    });
  });

  describe('healthCheck', () => {

    it('should return healthy when both engines available', async () => {
      const service = new UnifiedContextService({
        enableNewContextEngine: true
      });
      service.dynamicAssembler = {
        getStats: jest.fn().mockResolvedValue({
          topicProfiles: 15,
          entityProfiles: 8,
          contextBundles: 42
        })
      };

      const health = await service.healthCheck();

      expect(health.status).toBe('healthy');
      expect(health.newEngineAvailable).toBe(true);
      expect(health.oldEngineAvailable).toBe(true);
      expect(health.stats?.topicProfiles).toBe(15);
    });

    it('should return degraded when new engine unavailable', async () => {
      const service = new UnifiedContextService({
        enableNewContextEngine: false
      });

      const health = await service.healthCheck();

      expect(health.status).toBe('degraded');
      expect(health.newEngineAvailable).toBe(false);
      expect(health.oldEngineAvailable).toBe(true);
    });
  });
});
```

#### ProfileRollupService Tests

```typescript
// server/tests/unit/services/profile-rollup-service.test.ts

import ProfileRollupService from '../../../src/services/profile-rollup-service';
import { MockPrisma } from '../mocks/mock-prisma';
import { MockEmbeddingService } from '../mocks/mock-embedding-service';

describe('ProfileRollupService', () => {

  describe('rollupProfiles', () => {

    it('should process unprocessed ACUs and create profiles', async () => {
      const service = new ProfileRollupService();
      const mockACUs = [
        { id: 'acu-1', content: 'React is great', authorDid: 'user-did', state: 'ACTIVE' },
        { id: 'acu-2', content: 'TypeScript is good', authorDid: 'user-did', state: 'ACTIVE' },
        { id: 'acu-3', content: 'Prisma is useful', authorDid: 'user-did', state: 'ACTIVE' }
      ];

      MockPrisma.atomicChatUnit.findMany.mockResolvedValue(mockACUs);
      MockEmbeddingService.generateEmbeddingsBatch.mockResolvedValue([
        Array(1536).fill(0.1),
        Array(1536).fill(0.2),
        Array(1536).fill(0.3)
      ]);

      MockPrisma.topicProfile.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ id: 'topic-1', userId: 'user-123' });

      MockPrisma.entityProfile.findUnique
        .mockResolvedValueOnce(null);

      const result = await service.rollupProfiles('user-123');

      expect(result.topicsCreated).toBeGreaterThan(0);
      expect(result.entitiesCreated).toBeGreaterThan(0);
      expect(result.acusProcessed).toBe(3);
    });

    it('should update existing topic profiles', async () => {
      const service = new ProfileRollupService();
      const mockACUs = [{ id: 'acu-new', content: 'React hooks', authorDid: 'user-did', state: 'ACTIVE' }];

      MockPrisma.atomicChatUnit.findMany.mockResolvedValue(mockACUs);
      MockEmbeddingService.generateEmbeddingsBatch.mockResolvedValue([Array(1536).fill(0.5)]);
      MockPrisma.topicProfile.findUnique
        .mockResolvedValueOnce({
          id: 'topic-react',
          userId: 'user-123',
          totalAcus: 50,
          importanceScore: 0.7
        });

      const result = await service.rollupProfiles('user-123');

      expect(result.topicsUpdated).toBeGreaterThan(0);
      expect(result.topicsCreated).toBe(0);
    });

    it('should skip topics with insufficient ACUs', async () => {
      const service = new ProfileRollupService();
      const mockACUs = [{ id: 'acu-1', content: 'Hi', authorDid: 'user-did', state: 'ACTIVE' }];

      MockPrisma.atomicChatUnit.findMany.mockResolvedValue(mockACUs);
      MockEmbeddingService.generateEmbeddingsBatch.mockResolvedValue([Array(1536).fill(0.1)]);

      const result = await service.rollupProfiles('user-123');

      expect(result.topicsCreated).toBe(0);
      expect(result.topicsUpdated).toBe(0);
      expect(result.acusProcessed).toBe(1);
    });

    it('should handle embedding generation errors gracefully', async () => {
      const service = new ProfileRollupService();
      const mockACUs = [{ id: 'acu-1', content: 'Test', authorDid: 'user-did', state: 'ACTIVE' }];

      MockPrisma.atomicChatUnit.findMany.mockResolvedValue(mockACUs);
      MockEmbeddingService.generateEmbeddingsBatch.mockRejectedValue(new Error('API limit exceeded'));

      const result = await service.rollupProfiles('user-123');

      // Should still process with mock vectors and complete
      expect(result.acusProcessed).toBe(1);
    });
  });
});
```

---

## Integration Tests

### Context Routes Integration Tests

```typescript
// server/tests/integration/context.routes.test.ts

import request from 'supertest';
import app from '../../app';
import { MockPrisma } from '../mocks/mock-prisma';

describe('Context Routes Integration', () => {

  let authToken: string;

  beforeAll(async () => {
    // Setup test database and get auth token
    await setupTestDatabase();
    authToken = await getTestAuthToken();
  });

  afterAll(async () => {
    await cleanupTestDatabase();
  });

  describe('POST /api/v1/context/presence/:userId', () => {

    it('should create or update client presence', async () => {
      const response = await request(app)
        .post(`/api/v1/context/presence/user-123`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          deviceId: 'test-device',
          localTime: '2026-02-11T12:30:00Z',
          activeConversationId: 'conv-456',
          visibleConversationIds: ['conv-456', 'conv-789']
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify database state
      const presence = await MockPrisma.clientPresence.findUnique({
        where: { userId_deviceId: { userId: 'user-123', deviceId: 'test-device' } }
      });

      expect(presence).activeConversationId).toBe('conv-456');
      expect(presence.visibleConversationIds).toEqual(['conv-456', 'conv-789']);
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post(`/api/v1/context/presence/user-123`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          localTime: '2026-02-11T12:30:00Z'
          // Missing deviceId
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('INVALID_REQUEST');
    });
  });

  describe('POST /api/v1/context/rollup/:userId', () => {

    it('should trigger profile rollup', async () => {
      const response = await request(app)
        .post(`/api/v1/context/rollup/user-123`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ limit: 10 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.topicsCreated).toBeGreaterThanOrEqual(0);
    });

    it('should handle rollup in progress', async () => {
      // Simulate rollup already running
      await MockPrisma.systemAction.create({
        data: {
          trigger: 'profile-rollup',
          status: 'processing',
          metadata: JSON.stringify({ userId: 'user-123' })
        }
      });

      const response = await request(app)
        .post(`/api/v1/context/rollup/user-123`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect(response.status).toBe(409);
      expect(response.body.error).toBe('ROLLUP_ALREADY_IN_PROGRESS');
    });
  });

  describe('GET /api/v1/context/health', () => {

    it('should return health status', async () => {
      const response = await request(app)
        .get('/api/v1/context/health');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('healthy');
      expect(response.body).hasOwnProperty('topicProfiles')).toBe(true);
      expect(response.body).hasOwnProperty('entityProfiles')).toBe(true);
    });
  });
});
```

### AI Route Integration Tests

```typescript
// server/tests/integration/ai.routes.test.ts

import request from 'supertest';
import app from '../../app';
import { MockPrisma } from '../mocks/mock-prisma';
import { mockLLMResponse } from '../mocks/mock-llm';

describe('AI Chat Integration', () => {

  let authToken: string;
  let testConversationId: string;

  beforeAll(async () => {
    await setupTestDatabase();
    authToken = await getTestAuthToken();

    // Create test conversation
    testConversationId = await MockPrisma.conversation.create({
      data: {
        id: 'conv-test',
        userId: 'user-123',
        title: 'Test Conversation'
      }
    });

    // Add test messages
    await MockPrisma.message.createMany({
      data: [
        {
          conversationId: 'conv-test',
          role: 'user',
          content: 'Hello AI',
          messageIndex: 0,
          parts: [{ type: 'text', text: { value: 'Hello AI' } }]
        },
        {
          conversationId: 'conv-test',
          role: 'assistant',
          content: 'Hello! How can I help?',
          messageIndex: 1,
          parts: [{ type: 'text', text: { value: 'Hello! How can I help?' } }]
        }
      ]
    });
  });

  afterAll(async () => {
    await cleanupTestDatabase();
  });

  describe('POST /api/v1/ai/chat with new engine', () => {

    it('should use dynamic context engine when feature flag is true', async () => {
      process.env.USE_DYNAMIC_CONTEXT = 'true';

      const response = await request(app)
        .post('/api/v1/ai/chat')
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-use-dynamic-context', 'true')
        .send({
          messages: [{ role: 'user', content: 'Test message' }],
          conversationId: testConversationId,
          userId: 'user-123'
        });

      expect(response.status).toBe(200);
      expect(response.body.data.engine).toBe('dynamic');
      expect(response.body.data.contextStats).toHaveProperty('bundlesUsed');
    });

    it('should fallback to legacy when feature flag is false', async () => {
      process.env.USE_DYNAMIC_CONTEXT = 'false';

      const response = await request(app)
        .post('/api/v1/ai/chat')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          messages: [{ role: 'user', content: 'Test message' }],
          conversationId: testConversationId,
          userId: 'user-123'
        });

      expect(response.status).toBe(200);
      expect(response.body.data.engine).toBe('legacy');
    });

    it('should include system prompt in contextual messages', async () => {
      process.env.USE_DYNAMIC_CONTEXT = 'true';

      const response = await request(app)
        .post('/api/v1/ai/chat')
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-use-dynamic-context', 'true')
        .send({
          messages: [{ role: 'user', content: 'Tell me about React' }],
          conversationId: testConversationId,
          userId: 'user-123'
        });

      expect(response.status).toBe(200);

      // The actual LLM call would be mocked, so we check the context structure
      expect(response.body.data).toHaveProperty('systemPrompt');
      expect(response.body.data.systemPrompt).toContain('System Prompt');
    });

    it('should handle invalid request errors', async () => {
      const response = await request(app)
        .post('/api/v1/ai/chat')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          // Missing required fields
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('INVALID_REQUEST');
    });

    it('should handle conversation not found', async () => {
      const response = await request(app)
        .post('/api/v1/ai/chat')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          messages: [{ role: 'user', content: 'Test' }],
          conversationId: 'nonexistent-conv',
          userId: 'user-123'
        });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('not found');
    });
  });
});
```

---

## End-to-End Tests

### Test Scenarios

```typescript
// server/tests/e2e/context-engine.e2e.test.ts

import { chromium } from 'playwright';
import { test } from '@playwright/test';

test.describe('Context Engine End-to-End', () => {

  test.beforeEach(async ({ page }) => {
    // Login and navigate to chat
    await page.goto('http://localhost:3000/login');
    await page.fill('input[name="username"]', 'test-user');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/chat');
  });

  test('should render chat interface with context indicators', async ({ page }) => {
    // Check for context health indicator
    const contextIndicator = page.locator('[data-testid="context-health-indicator"]');
    await expect(contextIndicator).toBeVisible({ timeout: 5000 });

    // Check for bundle usage indicator
    const bundleUsage = page.locator('[data-testid="bundle-usage"]');
    await expect(bundleUsage).toBeVisible({ timeout: 5000 });

    // Verify context indicator shows healthy status
    await expect(contextIndicator).toHaveText(/healthy|ready/i);
  });

  test('should pre-warm context bundles on page load', async ({ page }) => {
    // Check for presence update
    const pageEvents: string[] = [];

    page.on('console', msg => {
      pageEvents.push(msg.text());

      // Look for context warmup API call
      if (msg.text().includes('/context/warmup/user-')) {
        const presenceUpdate = JSON.parse(msg.text().match(/\{[^}]+\}/)?.[0]);
        expect(presenceUpdate.deviceId).toBeDefined();
      }
    });

    // Wait for initial warmup
    await page.waitForTimeout(2000);

    // Verify context bundles were created
    const bundleCount = pageEvents.filter(e =>
      e.text().includes('/api/v1/context/health') &&
      e.text().includes('"topicProfiles"')
    ).length;

    expect(bundleCount).toBeGreaterThan(0);
  });

  test('should send context updates on message send', async ({ page }) => {
    await page.fill('textarea[name="message"]', 'Tell me about TypeScript');
    await page.click('button[type="submit"]');

    // Wait for invalidation call
    await page.waitForTimeout(500);

    // Verify invalidation was triggered
    const invalidateCalls = pageEvents.filter(e =>
      e.text().includes('/context/invalidate/user-')
    ).length;

    expect(invalidateCalls).toBeGreaterThan(0);
  });

  test('should display context bundle stats in debug mode', async ({ page }) => {
    // Enable debug mode
    await page.click('button[data-testid="enable-debug-mode"]');

    // Wait for stats to load
    await page.waitForSelector('[data-testid="context-stats"]');

    // Verify stats are displayed
    const stats = await page.locator('[data-testid="context-stats"]').textContent();
    expect(stats).toContain('cacheHitRate');
    expect(stats).toContain('assemblyTimeMs');
  });

  test('should fallback to legacy if new engine errors occur', async ({ page }) => {
    // Mock new engine failure
    await page.evaluate(() => {
      // Override fetch to simulate error
      window.fetch = new Proxy(window.fetch, {
        get: (url) => {
          if (url.includes('/api/v1/ai/chat')) {
            return Promise.reject(new Error('Simulated engine failure'));
          }
          return Reflect.apply(window.fetch, arguments);
        }
      });
    });

    await page.fill('textarea[name="message"]', 'Test message after engine error');
    await page.click('button[type="submit"]');

    // Wait for response
    await page.waitForSelector('[data-testid="ai-response"]');

    const responseText = await page.locator('[data-testid="ai-response"]').textContent();
    const response = JSON.parse(responseText);

    // Verify fallback to legacy
    expect(response.data.engine).toBe('legacy');
  });
});
```

### Test Data Setup

```typescript
// server/tests/e2e/setup.ts

import { chromium } from 'playwright';

export async function setupTestDatabase(): Promise<void> {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Login to admin
  await page.goto('http://localhost:3000/admin');
  await page.fill('input[name="username"]', 'admin');
  await page.fill('input[name="password"]', 'admin123');
  await page.click('button[type="submit"]');

  // Create test user
  await page.goto('http://localhost:3000/admin/users');
  await page.click('button[data-action="create-test-user"]');
  await page.fill('input[name="userId"]', 'test-user-e2e');
  await page.click('button[data-action="create-user"]');

  await browser.close();
}

export async function getTestAuthToken(): Promise<string> {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  await page.goto('http://localhost:3000/login');
  await page.fill('input[name="username"]', 'test-user');
  await page.fill('input[name="password"]', 'test-pass');
  await page.click('button[type="submit"]');

  const token = await page.evaluate(() => {
    return localStorage.getItem('authToken');
  });

  await browser.close();
  return token;
}

export async function cleanupTestDatabase(): Promise<void> {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  await page.goto('http://localhost:3000/login');
  await page.fill('input[name="username"]', 'admin');
  await page.fill('input[name="password"]', 'admin123');
  await page.click('button[type="submit"]');

  // Cleanup test data
  await page.goto('http://localhost:3000/admin/e2e/cleanup');
  await page.click('button[data-action="cleanup"]');

  await browser.close();
}
```

---

## Load Testing

### Load Test Scenarios

```yaml
# server/artillery/tests/context-engine.yml

config:
  target: "http://localhost:3000"
  phases:
    - duration: 60
      name: "Warmup Load Test"
      arrivalRate: 5
    - duration: 60
      name: "AI Chat Load Test - New Engine"
      arrivalRate: 10
    - duration: 60
      name: "AI Chat Load Test - Legacy Engine"
      arrivalRate: 10

scenarios:
  - name: "Context Assembly - Happy Path"
    flow:
      - post:
          - url: "/api/v1/context/health"
      - name: "Check health"
      - headers:
              Authorization: "Bearer $TOKEN"
      - name: "Profile Rollup Warmup"
      - post:
          - url: "/api/v1/context/warmup/$USER_ID"
          - headers:
              Authorization: "Bearer $TOKEN"
          - name: "Send Chat Message"
      - post:
          - url: "/api/v1/ai/chat"
          - headers:
              x-use-dynamic-context: "true"
              Authorization: "Bearer $TOKEN"
          - json:
              messages: [{"role": "user", "content": "Test message"}]
              conversationId: "$CONVERSATION_ID"
              userId: "$USER_ID"

  - name: "Context Assembly - Cache Miss Path"
    flow:
      - post:
          - url: "/api/v1/context/health"
      - name: "Check health (no bundles)"
      - post:
          - url: "/api/v1/ai/chat"
          - headers:
              x-use-dynamic-context: "true"
              Authorization: "Bearer $TOKEN"
          - json:
              messages: [{"role": "user", "content": "Test about new topic"}]
              conversationId: "NEW_CONVERSATION_ID"
              userId: "$USER_ID"

  - name: "Context Assembly - Invalidation Storm"
    flow:
      - loop:
          count: 20
      - post:
          - url: "/api/v1/context/invalidate/$USER_ID"
          - headers:
              Authorization: "Bearer $TOKEN"
          - json:
              eventType: "message_created"
              relatedIds:
                conversationId: "$CONVERSATION_ID"

  - name: "Context Assembly - High Concurrency"
    flow:
      - name: "Mixed Load Test"
      - flow:
          - post:
              url: "/api/v1/ai/chat"
              - headers:
              x-use-dynamic-context: "true"
              Authorization: "Bearer $TOKEN"
              json:
                  messages: [{"role": "user", "content": "Message $I"}]
                  conversationId: "$CONVERSATION_$I"
                  userId: "$USER_ID"
          - parallel: true
          count: 100

  - name: "Context Assembly - Legacy Fallback"
    flow:
      - post:
          - url: "/api/v1/ai/chat"
          - headers:
              x-use-dynamic-context: "false"
              Authorization: "Bearer $TOKEN"
          - json:
              messages: [{"role": "user", "content": "Legacy test"}]
              conversationId: "$CONVERSATION_ID"
              userId: "$USER_ID"
```

### Performance Targets

| Metric | Target | Critical |
|--------|---------|----------|
| P95 Context Assembly Time | < 100ms | Critical |
| P99 Context Assembly Time | < 150ms | High |
| Error Rate | < 0.1% | Critical |
| Cache Hit Rate | > 85% | High |
| Throughput | > 100 req/s | High |

### Load Test Execution

```bash
# Run load tests
npx artillery run tests/context-engine.yml

# Generate report
npx artillery report context-engine-report.json

# View results
npx artillery report context-engine-report.json --output html > context-engine-report.html
```

---

## Validation Procedures

### Pre-Deployment Validation

#### Database Schema Validation

```bash
#!/bin/bash
# validate-schema.sh

echo "Validating Prisma schema..."

# Check all required tables exist
REQUIRED_TABLES=("topic_profiles" "entity_profiles" "context_bundles" "client_presence")

for table in "${REQUIRED_TABLES[@]}"; do
  echo -n "Checking table: $table"
  TABLE_EXISTS=$(psql $DATABASE_URL -c "SELECT EXISTS FROM information_schema.tables WHERE table_name = '$table';")

  if [ "$TABLE_EXISTS" != "t" ]; then
    echo -e "❌ FAILED: Table $table does not exist"
    exit 1
  else
    echo "✓ Table $table exists"
  fi

  # Check required indexes
  echo "Validating indexes for $table..."
  psql $DATABASE_URL -c "\di $table" | grep -E "idx|key"

done

echo "✓ Schema validation complete"
```

#### API Validation

```bash
#!/bin/bash
# validate-api.sh

echo "Validating API endpoints..."

BASE_URL="http://localhost:3000"
TOKEN="test-token-$(date +%s)"

# Test health endpoint
echo "Testing GET /api/v1/context/health"
HEALTH_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" "$BASE_URL/api/v1/context/health")
HEALTH_STATUS=$(echo "$HEALTH_RESPONSE" | jq -r '.status')

if [ "$HEALTH_STATUS" == "healthy" ]; then
  echo "✓ Health check passed"
else
  echo "❌ Health check failed: $HEALTH_STATUS"
  exit 1
fi

# Test presence update
echo "Testing POST /api/v1/context/presence/user-123"
PRESENCE_RESPONSE=$(curl -s \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "deviceId": "validation-device",
    "localTime": "2026-02-11T12:30:00Z"
  }' \
  "$BASE_URL/api/v1/context/presence/user-123")

PRESENCE_STATUS=$(echo "$PRESENCE_RESPONSE" | jq -r '.success')

if [ "$PRESENCE_STATUS" == "true" ]; then
  echo "✓ Presence update passed"
else
  echo "❌ Presence update failed"
  exit 1
fi

echo "✓ API validation complete"
```

#### Service Validation

```bash
#!/bin/bash
# validate-services.sh

echo "Validating context engine services..."

# Import services and test their initialization
node << 'EOF'
const { UnifiedContextService } = require('./src/services/unified-context-service');
const service = new UnifiedContextService();
const health = await service.healthCheck();
console.log('UnifiedContextService health:', JSON.stringify(health, null, 2));
EOF

# Validate health check output
HEALTH_OUTPUT=$(node -e "
const { UnifiedContextService } = require('./src/services/unified-context-service');
const service = new UnifiedContextService();
service.healthCheck().then(health => console.log(JSON.stringify(health, null, 2));
")

if echo "$HEALTH_OUTPUT" | grep -q '"status":"healthy"'; then
  echo "✓ Service initialization validated"
else
  echo "❌ Service health check failed"
  exit 1
fi

echo "✓ Service validation complete"
```

---

## Test Environment Setup

### Local Development Setup

```bash
# Setup script
#!/bin/bash

echo "Setting up test environment..."

# 1. Install dependencies
cd server
npm install

# 2. Setup test database
npm run db:setup

# 3. Run database migrations
npm run db:migrate

# 4. Seed test data
npm run db:seed

# 5. Set environment variables
export DATABASE_URL="postgresql://testuser:testpass@localhost:5432/testdb"
export USE_DYNAMIC_CONTEXT="true"
export OPENAI_API_KEY="sk-test-key-for-testing"

# 6. Start test server
npm run dev &

# 7. Wait for server to be ready
sleep 10

# 8. Run health check
curl -s http://localhost:3000/api/v1/context/health

echo "✓ Test environment ready"
```

### CI/CD Pipeline

```yaml
# .github/workflows/test.yml

name: Context Engine Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    services:
      - postgres:16
    steps:
      - uses: actions/checkout@v3
      - name: Install dependencies
        run: |
          cd server
          npm ci
      - name: Run unit tests
        run: |
          cd server
          npm run test:unit

  integration-tests:
    runs-on: ubuntu-latest
    needs: [unit-tests]
    services:
      - postgres:16
    steps:
      - name: Run integration tests
        run: |
          cd server
          npm run test:integration

  e2e-tests:
    runs-on: ubuntu-latest
    needs: [unit-tests]
    services:
      - postgres:16
    steps:
      - name: Install Playwright
        run: npm install -g @playwright/test
      - name: Run E2E tests
        run: |
          cd server
          npm run test:e2e
      - name: Upload report
        if: failure()
          uses: actions/upload-artifact@v3
```

---

## Validation Checklists

### Pre-Production Checklist

- [ ] All unit tests passing (80%+ coverage)
- [ ] All integration tests passing
- [ ] E2E tests passing (5/5 scenarios)
- [ ] Load tests meet performance targets:
  - [ ] P95 < 100ms
  - [ ] Error rate < 0.1%
  - [ ] Cache hit rate > 85%
- [ ] Database migrations verified on staging
- [ ] API endpoints validated
- [ ] Rollback procedure tested and documented
- [ ] Monitoring alerts configured
- [ ] Runbook created and team briefed

### Production Deployment Checklist

- [ ] Feature flags set correctly (USE_DYNAMIC_CONTEXT=false initially)
- [ ] Database migrations applied successfully
- [ ] All services healthy (health check passes)
- [ ] Rollup jobs completed for existing users
- [ ] Monitoring dashboards receiving metrics
- [ ] Alert thresholds configured and tested
- [ ] Load tests passed at target metrics
- [ ] Rollback procedure ready (environment variable switch)
- [ ] On-call team notified of deployment window
- [ ] Gradual rollout plan communicated to stakeholders

### Post-Deployment Validation

- [ ] Health checks passing on all instances
- [ ] Cache hit rate > 80% within 1 hour
- [ ] Context assembly time < 150ms (p95)
- [ ] Error rate < 0.5%
- [ ] No critical errors in logs
- [ ] User feedback: no complaints about context quality

---

**Document End**

Refer to `IMPLEMENTATION_GUIDE_MASTER.md` for overview and other implementation documents.
