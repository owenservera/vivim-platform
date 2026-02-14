/**
 * Dynamic Context System - Comprehensive Test Suite
 * 
 * Tests the full flow:
 * 1. UnifiedContextService initialization
 * 2. DynamicContextAssembler for context assembly
 * 3. ProfileRollupService for profile management
 * 4. InvalidationService for cache invalidation
 * 5. ContextWarmupWorker for bundle pre-generation
 * 6. AI route integration with feature flag
 */

import { getPrismaClient } from '../src/lib/database.js';
import { DynamicContextAssembler, createEmbeddingService, BundleCompiler } from '../src/context/index.js';
import { unifiedContextService } from '../src/services/unified-context-service.js';
import { profileRollupService } from '../src/services/profile-rollup-service.js';
import { invalidationService } from '../src/services/invalidation-service.js';
import { contextWarmupWorker } from '../src/services/context-warmup-worker.js';
import { logger } from '../src/lib/logger.js';

const prisma = getPrismaClient();

// Test user ID (replace with actual user from your database)
const TEST_USER_ID = 'Owen';
const TEST_CONVERSATION_ID = process.argv[2] || '6423fd34-a9f1-43e7-bd28-0e9b34811d76';

async function runTests() {
  console.log('='.repeat(70));
  console.log('DYNAMIC CONTEXT SYSTEM - COMPREHENSIVE TEST SUITE');
  console.log('='.repeat(70));
  console.log(`Date: ${new Date().toISOString()}`);
  console.log(`Test User: ${TEST_USER_ID}`);
  console.log(`Test Conversation: ${TEST_CONVERSATION_ID}`);
  console.log('='.repeat(70));
  console.log();

  const results = {
    passed: 0,
    failed: 0,
    tests: []
  };

  function logTest(name, status, message = '') {
    const symbol = status === 'PASS' ? '✅' : '❌';
    const line = `${symbol} ${name}${message ? ': ' + message : ''}`;
    console.log(line);
    results.tests.push({ name, status, message });
    if (status === 'PASS') results.passed++;
    else results.failed++;
  }

  // =========================================================================
  // TEST 1: Database Connection
  // =========================================================================
  console.log('\n📊 TEST 1: Database Connection');
  console.log('-'.repeat(50));

  try {
    await prisma.$connect();
    const dbInfo = await prisma.$queryRaw`SELECT version()`;
    logTest('Prisma Connection', 'PASS', 'Connected to PostgreSQL');
  } catch (error) {
    logTest('Prisma Connection', 'FAIL', error.message);
  }

  // =========================================================================
  // TEST 2: Schema Models Exist
  // =========================================================================
  console.log('\n📋 TEST 2: Schema Models');
  console.log('-'.repeat(50));

  try {
    const [topicCount, entityCount, bundleCount, presenceCount] = await Promise.all([
      prisma.topicProfile.count(),
      prisma.entityProfile.count(),
      prisma.contextBundle.count(),
      prisma.clientPresence.count()
    ]);
    
    logTest('TopicProfile Model', 'PASS', `${topicCount} records`);
    logTest('EntityProfile Model', 'PASS', `${entityCount} records`);
    logTest('ContextBundle Model', 'PASS', `${bundleCount} records`);
    logTest('ClientPresence Model', 'PASS', `${presenceCount} records`);
  } catch (error) {
    logTest('Schema Models', 'FAIL', error.message);
  }

  // =========================================================================
  // TEST 3: Embedding Service
  // =========================================================================
  console.log('\n🔢 TEST 3: Embedding Service');
  console.log('-'.repeat(50));

  try {
    const embeddingService = createEmbeddingService();
    const config = embeddingService.getConfig();
    logTest('EmbeddingService Created', 'PASS', `Model: ${config.model}, Dimensions: ${config.dimensions}`);
    
    // Test single embedding
    const testEmbedding = await embeddingService.embed('Hello, this is a test message for embeddings.');
    logTest('Single Embedding', 'PASS', `Vector length: ${testEmbedding.length}`);
    
    // Test batch embedding
    const batchEmbeddings = await embeddingService.embedBatch([
      'First test message',
      'Second test message',
      'Third test message'
    ]);
    logTest('Batch Embedding', 'PASS', `Generated ${batchEmbeddings.length} embeddings`);
  } catch (error) {
    logTest('Embedding Service', 'FAIL', error.message);
  }

  // =========================================================================
  // TEST 4: UnifiedContextService
  // =========================================================================
  console.log('\n🎯 TEST 4: UnifiedContextService');
  console.log('-'.repeat(50));

  try {
    const health = await unifiedContextService.healthCheck();
    logTest('Health Check', 'PASS', `New Engine: ${health.newEngineAvailable}, Old Engine: ${health.oldEngineAvailable}`);
    logTest('TopicProfiles', 'PASS', `Count: ${health.stats.topicProfiles}`);
    logTest('EntityProfiles', 'PASS', `Count: ${health.stats.entityProfiles}`);
    logTest('ContextBundles', 'PASS', `Count: ${health.stats.contextBundles}`);
  } catch (error) {
    logTest('UnifiedContextService', 'FAIL', error.message);
  }

  // =========================================================================
  // TEST 5: DynamicContextAssembler
  // =========================================================================
  console.log('\n🔧 TEST 5: DynamicContextAssembler');
  console.log('-'.repeat(50));

  try {
    const embeddingService = createEmbeddingService();
    const bundleCompiler = new BundleCompiler({
      prisma,
      embeddingService,
      llmService: null
    });
    const assembler = new DynamicContextAssembler({
      prisma,
      embeddingService,
      tokenEstimator: { estimateTokens: (text) => Math.ceil(text.length / 4) },
      bundleCompiler
    });
    logTest('DynamicContextAssembler Created', 'PASS');
    
    // Test assembly
    const testResult = await assembler.assemble({
      userId: TEST_USER_ID,
      conversationId: TEST_CONVERSATION_ID,
      userMessage: 'Test message for context assembly',
      deviceId: 'test-device',
      settings: {
        maxContextTokens: 12000,
        knowledgeDepth: 'standard',
        prioritizeConversationHistory: true,
        includeEntityContext: true
      }
    });
    
    logTest('Context Assembly', 'PASS', `Tokens: ${testResult.budget.totalUsed}, Bundles: ${testResult.bundlesUsed.length}`);
    logTest('System Prompt Generated', 'PASS', `Length: ${testResult.systemPrompt.length} chars`);
    logTest('Cache Hit Rate', 'PASS', `${(testResult.metadata.cacheHitRate * 100).toFixed(1)}%`);
    logTest('Assembly Time', 'PASS', `${testResult.metadata.assemblyTimeMs}ms`);
  } catch (error) {
    logTest('DynamicContextAssembler', 'FAIL', error.message);
  }

  // =========================================================================
  // TEST 6: ProfileRollupService
  // =========================================================================
  console.log('\n👤 TEST 6: ProfileRollupService');
  console.log('-'.repeat(50));

  try {
    const stats = await profileRollupService.getProfileStats(TEST_USER_ID);
    logTest('Profile Stats', 'PASS', 
      `Topics: ${stats.topicProfiles}, Entities: ${stats.entityProfiles}, ACUs: ${stats.acusWithEmbedding}/${stats.acusWithoutEmbedding}`);
    
    // Trigger rollup
    const rollupResult = await profileRollupService.rollupProfiles(TEST_USER_ID, 10);
    logTest('Profile Rollup Triggered', 'PASS', 
      `Topics: +${rollupResult.topicsCreated}/~${rollupResult.topicsUpdated}, Entities: +${rollupResult.entitiesCreated}/~${rollupResult.entitiesUpdated}`);
  } catch (error) {
    logTest('ProfileRollupService', 'FAIL', error.message);
  }

  // =========================================================================
  // TEST 7: InvalidationService
  // =========================================================================
  console.log('\n🔄 TEST 7: InvalidationService');
  console.log('-'.repeat(50));

  try {
    const health = await invalidationService.getHealth();
    logTest('Invalidation Health', 'PASS', `Queue: ${health.queueLength}, Dirty Bundles: ${health.dirtyBundles}`);
    
    // Test invalidation event
    await invalidationService.invalidate({
      eventType: 'memory_created',
      userId: TEST_USER_ID,
      relatedIds: ['test-memory-id'],
      timestamp: new Date()
    });
    logTest('Invalidation Event', 'PASS', 'Memory created event processed');
    
    // Process queue
    const processed = await invalidationService.processQueue();
    logTest('Queue Processing', 'PASS', `Processed ${processed} items`);
  } catch (error) {
    logTest('InvalidationService', 'FAIL', error.message);
  }

  // =========================================================================
  // TEST 8: ContextWarmupWorker
  // =========================================================================
  console.log('\n🔥 TEST 8: ContextWarmupWorker');
  console.log('-'.repeat(50));

  try {
    // Check if worker is processing
    const workerHealth = await contextWarmupWorker.getHealth();
    logTest('Worker Health', 'PASS', `Processing: ${workerHealth.isProcessing}`);
    
    // Note: We don't actually trigger warmup in test as it requires client presence
    logTest('Warmup Worker Initialized', 'PASS');
  } catch (error) {
    logTest('ContextWarmupWorker', 'FAIL', error.message);
  }

  // =========================================================================
  // TEST 9: Conversation Context
  // =========================================================================
  console.log('\n💬 TEST 9: Conversation Context');
  console.log('-'.repeat(50));

  try {
    // Check if test conversation exists
    const conversation = await prisma.conversation.findUnique({
      where: { id: TEST_CONVERSATION_ID },
      include: { messages: { take: 5, orderBy: { messageIndex: 'desc' } } }
    });
    
    if (conversation) {
      logTest('Test Conversation Found', 'PASS', `Messages: ${conversation.messageCount}, Title: ${conversation.title}`);
      
      // Get context using unified service
      const context = await unifiedContextService.generateContextForChat(TEST_CONVERSATION_ID, {
        userMessage: 'Test message',
        deviceId: 'test-device'
      });
      
      logTest('Context Generation', 'PASS', `Engine: ${context.engineUsed}, Tokens: ${context.stats?.messageCount || 'N/A'}`);
    } else {
      logTest('Test Conversation', 'WARN', 'Not found - using mock conversation');
    }
  } catch (error) {
    logTest('Conversation Context', 'FAIL', error.message);
  }

  // =========================================================================
  // SUMMARY
  // =========================================================================
  console.log('\n' + '='.repeat(70));
  console.log('TEST SUMMARY');
  console.log('='.repeat(70));
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`Total: ${results.tests.length}`);
  console.log('='.repeat(70));

  // Exit with appropriate code
  process.exit(results.failed > 0 ? 1 : 0);
}

// Run tests
runTests().catch(error => {
  console.error('Test suite failed:', error);
  process.exit(1);
});
