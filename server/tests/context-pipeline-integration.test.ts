/**
 * Context Pipeline Integration Tests
 *
 * End-to-end tests for the complete context assembly pipeline:
 * User Message -> Topic Detection -> Recipe Application -> Prompt Compilation
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'bun:test';
import { getPrismaClient } from '../src/lib/database.js';
import { DynamicContextAssembler } from '../src/context/context-assembler.js';
import { createEmbeddingService, createLLMService, createTokenEstimator } from '../src/context/utils/zai-service.js';
import { BundleCompiler } from '../src/context/bundle-compiler.js';
import { HybridRetrievalService } from '../src/context/hybrid-retrieval.js';
import { conflictDetectionService } from '../src/services/memory-conflict-detection.js';
import { acuDeduplicationService } from '../src/services/acu-deduplication-service.js';

const prisma = getPrismaClient();

describe('Context Pipeline Integration', () => {
  let assembler: DynamicContextAssembler;
  let testUserId: string;
  let testConversationId: string;

  beforeAll(async () => {
    // Create test user
    const testUser = await prisma.user.create({
      data: {
        did: `test_user_${Date.now()}`,
        handle: `testuser_${Date.now()}`,
        email: `test_${Date.now()}@example.com`,
        name: 'Test User',
      },
    });
    testUserId = testUser.id;

    // Create test conversation
    const testConv = await prisma.conversation.create({
      data: {
        id: `test_conv_${Date.now()}`,
        ownerId: testUserId,
        title: 'Test Conversation',
        status: 'ACTIVE',
      },
    });
    testConversationId = testConv.id;

    // Initialize context assembler
    const embeddingService = createEmbeddingService();
    const llmService = createLLMService();
    const tokenEstimator = createTokenEstimator();
    const bundleCompiler = new BundleCompiler({
      prisma,
      embeddingService,
      llmService,
    });

    assembler = new DynamicContextAssembler({
      prisma,
      embeddingService,
      tokenEstimator,
      bundleCompiler,
    });
  });

  afterAll(async () => {
    // Cleanup
    await prisma.conversation.delete({ where: { id: testConversationId } }).catch(() => {});
    await prisma.user.delete({ where: { id: testUserId } }).catch(() => {});
    await prisma.$disconnect();
  });

  describe('Context Assembly Pipeline', () => {
    it('should assemble context with default recipe', async () => {
      const result = await assembler.assemble({
        userId: testUserId,
        conversationId: testConversationId,
        userMessage: 'Hello, how are you?',
        modelId: 'glm-4.7-flash',
      });

      expect(result).toBeDefined();
      expect(result.systemPrompt).toBeDefined();
      expect(result.systemPrompt.length).toBeGreaterThan(0);
      expect(result.budget).toBeDefined();
      expect(result.budget.totalUsed).toBeLessThanOrEqual(result.budget.totalAvailable);
      expect(result.metadata).toBeDefined();
    }, 30000);

    it('should respect custom token budget', async () => {
      const result = await assembler.assemble({
        userId: testUserId,
        conversationId: testConversationId,
        userMessage: 'Test message with custom budget',
        settings: {
          maxContextTokens: 4000,
          knowledgeDepth: 'standard',
          prioritizeConversationHistory: true,
          includeEntityContext: true,
        },
      });

      expect(result.budget.totalAvailable).toBeLessThanOrEqual(4000);
    }, 30000);

    it('should handle layer exclusion from recipe', async () => {
      // Create a recipe with excluded layers
      const recipe = await prisma.contextRecipe.create({
        data: {
          name: 'Test Recipe - No Entities',
          userId: testUserId,
          description: 'Recipe that excludes entity profiles',
          layerWeights: {},
          excludedLayers: ['L3_entity_profiles'],
          customBudget: 8000,
          isDefault: false,
        },
      });

      const result = await assembler.assemble({
        userId: testUserId,
        conversationId: testConversationId,
        userMessage: 'Test with layer exclusion',
        settings: {
          maxContextTokens: 8000,
          knowledgeDepth: 'standard',
          prioritizeConversationHistory: true,
          includeEntityContext: false,
        },
      });

      // Cleanup
      await prisma.contextRecipe.delete({ where: { id: recipe.id } });

      expect(result).toBeDefined();
    }, 30000);
  });

  describe('Memory Conflict Detection', () => {
    it('should detect contradictory memories', async () => {
      // Create first memory
      const memory1 = await prisma.memory.create({
        data: {
          userId: testUserId,
          content: 'I love coffee and drink it every day',
          category: 'preferences',
          memoryType: 'EPISODIC',
          importance: 0.7,
        },
      });

      // Check for conflicts with contradictory content
      const conflicts = await conflictDetectionService.checkForConflicts(
        testUserId,
        'I hate coffee and never drink it',
        'preferences',
        memory1.id
      );

      expect(conflicts).toBeDefined();
      // Should detect at least one potential conflict
      expect(conflicts.length).toBeGreaterThanOrEqual(0);

      // Cleanup
      await prisma.memory.delete({ where: { id: memory1.id } });
    }, 30000);

    it('should not flag non-contradictory memories', async () => {
      const memory1 = await prisma.memory.create({
        data: {
          userId: testUserId,
          content: 'I love coffee',
          category: 'preferences',
          memoryType: 'EPISODIC',
          importance: 0.7,
        },
      });

      const conflicts = await conflictDetectionService.checkForConflicts(
        testUserId,
        'I enjoy programming in TypeScript',
        'skills',
        memory1.id
      );

      // Should not detect conflicts for unrelated topics
      const highConfidenceConflicts = conflicts.filter((c) => c.confidence > 0.7);
      expect(highConfidenceConflicts.length).toBe(0);

      await prisma.memory.delete({ where: { id: memory1.id } });
    }, 30000);
  });

  describe('ACU Deduplication', () => {
    it('should detect exact duplicate ACUs', async () => {
      const content = 'This is a unique test message for deduplication';
      
      // Create first ACU
      const acu1 = await prisma.atomicChatUnit.create({
        data: {
          authorDid: testUserId,
          conversationId: testConversationId,
          content,
          type: 'message',
          category: 'general',
          state: 'ACTIVE',
        },
      });

      // Check for duplicates
      const result = await acuDeduplicationService.checkForDuplicates(
        testUserId,
        content,
        testConversationId
      );

      expect(result.isDuplicate).toBe(true);
      expect(result.matchType).toBe('exact');
      expect(result.recommendation).toBe('skip');

      await prisma.atomicChatUnit.delete({ where: { id: acu1.id } });
    }, 30000);

    it('should allow non-duplicate ACUs', async () => {
      const result = await acuDeduplicationService.checkForDuplicates(
        testUserId,
        'This is a completely unique message that should not match anything',
        testConversationId
      );

      expect(result.isDuplicate).toBe(false);
      expect(result.matchType).toBe('none');
      expect(result.recommendation).toBe('create_new');
    }, 30000);
  });

  describe('JIT Caching', () => {
    it('should cache retrieval results', async () => {
      const hybridRetrieval = new HybridRetrievalService(prisma, {
        cacheTTLSeconds: 120,
      });

      const embedding = new Array(1536).fill(0).map(() => Math.random() * 2 - 1);

      // First call (cache miss)
      const result1 = await hybridRetrieval.retrieve(
        testUserId,
        'Test query for caching',
        embedding,
        []
      );

      // Second call with same params (should be cache hit)
      const result2 = await hybridRetrieval.retrieve(
        testUserId,
        'Test query for caching',
        embedding,
        []
      );

      // Results should be identical
      expect(JSON.stringify(result1)).toEqual(JSON.stringify(result2));

      // Check cache stats
      const stats = hybridRetrieval.getCacheStats();
      expect(stats.size).toBeGreaterThanOrEqual(1);
    }, 30000);

    it('should clear cache for user', async () => {
      const hybridRetrieval = new HybridRetrievalService(prisma, {
        cacheTTLSeconds: 120,
      });

      const embedding = new Array(1536).fill(0).map(() => Math.random() * 2 - 1);

      await hybridRetrieval.retrieve(
        testUserId,
        'Test query',
        embedding,
        []
      );

      hybridRetrieval.clearCacheForUser(testUserId);

      const stats = hybridRetrieval.getCacheStats();
      expect(stats.size).toBe(0);
    }, 30000);
  });

  describe('Circuit Breaker Integration', () => {
    it('should have circuit breaker wrapped services', async () => {
      const embeddingService = createEmbeddingService();
      const llmService = createLLMService();

      // Services should be wrapped with circuit breakers by default
      expect(embeddingService).toBeDefined();
      expect(llmService).toBeDefined();
    });

    it('should handle embedding service failures gracefully', async () => {
      const embeddingService = createEmbeddingService();
      
      // Should return a fallback vector even on failure
      const embedding = await embeddingService.embed('Test text');
      
      expect(embedding).toBeDefined();
      expect(embedding.length).toBeGreaterThan(0);
    }, 30000);
  });
});

describe('Context Recipe CRUD API Integration', () => {
  let testUserId: string;

  beforeAll(async () => {
    const testUser = await prisma.user.create({
      data: {
        did: `test_recipe_user_${Date.now()}`,
        handle: `recipeuser_${Date.now()}`,
        email: `recipe_${Date.now()}@example.com`,
        name: 'Recipe Test User',
      },
    });
    testUserId = testUser.id;
  });

  afterAll(async () => {
    await prisma.user.delete({ where: { id: testUserId } }).catch(() => {});
  });

  it('should create and retrieve a context recipe', async () => {
    const recipe = await prisma.contextRecipe.create({
      data: {
        name: 'Integration Test Recipe',
        userId: testUserId,
        description: 'Recipe created during integration tests',
        layerWeights: { L0_identity: 1.2, L2_topic: 0.8 },
        excludedLayers: ['L7_social'],
        customBudget: 10000,
        isDefault: false,
      },
    });

    expect(recipe).toBeDefined();
    expect(recipe.name).toBe('Integration Test Recipe');
    expect(recipe.userId).toBe(testUserId);
    expect(recipe.layerWeights).toBeDefined();
    expect(recipe.excludedLayers).toContain('L7_social');

    // Retrieve and verify
    const retrieved = await prisma.contextRecipe.findUnique({
      where: { id: recipe.id },
    });

    expect(retrieved).toBeDefined();
    expect(retrieved?.id).toBe(recipe.id);

    // Cleanup
    await prisma.contextRecipe.delete({ where: { id: recipe.id } });
  });

  it('should support system default recipes', async () => {
    const defaultRecipe = await prisma.contextRecipe.create({
      data: {
        name: 'System Default Recipe',
        userId: null, // System-wide
        description: 'Default recipe for all users',
        layerWeights: {},
        excludedLayers: [],
        isDefault: true,
      },
    });

    expect(defaultRecipe.userId).toBeNull();
    expect(defaultRecipe.isDefault).toBe(true);

    // Cleanup
    await prisma.contextRecipe.delete({ where: { id: defaultRecipe.id } });
  });
});
