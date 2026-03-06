import { logger } from './lib/logger.js';
console.log('Imported logger');
import { config } from './config/index.js';
console.log('Imported config');
import terminalIntelligence from './lib/terminal-intelligence.js';
console.log('Imported terminalIntelligence');
import { errorHandler } from './middleware/errorHandler.js';
console.log('Imported errorHandler');
import { disconnectPrisma, getPrismaClient } from './lib/database.js';
console.log('Imported database');

async function testImports() {
  const modulesToTest = [
    './routes/capture.js',
    './routes/health.js',
    './routes/conversations.js',
    './routes/logs.js',
    './routes/identity.js',
    './routes/acus.js',
    './routes/sync.js',
    './routes/feed.js',
    './routes/ai.js',
    './routes/ai-chat.js',
    './routes/ai-settings.js',
    './routes/omni.js',
    './routes/zai-mcp.js',
    './routes/context-settings.ts',
    './routes/errors.js',
    './docs/swagger.js',
    './lib/logBroadcaster.js',
    './routes/identity-v2.js',
    './routes/circles.js',
    './routes/sharing.js',
    './routes/feed-v2.js',
    './routes/feed-analytics.ts',
    './routes/unified-api.js',
    './routes/portability.js',
    './routes/auth.js',
    './routes/account.js',
    './routes/context-v2.js',
    './routes/memory.js',
    './routes/memory-search.js',
    './routes/context-recipes.js',
    './routes/debug.js',
    './routes/collections.js',
    './routes/social.js',
    './routes/moderation.js',
    './routes/integrations.ts',
    './routes/admin/network.js',
    './routes/admin/database.js',
    './routes/admin/system.js',
    './routes/admin/crdt.js',
    './routes/admin/pubsub.js',
    './routes/admin/dataflow.js',
    './routes/context-engine.ts',
    './routes/doc-search.ts',
    './services/context-startup.ts'
  ];

  for (const mod of modulesToTest) {
    try {
      console.log(`\nImporting ${mod}...`);
      
      await import(mod);
      console.log(`Success: ${mod} loaded ok`);
    } catch (err) {
      console.error(`FAILED to import ${mod}:`, err.message);
      process.exit(1);
    }
  }
  
  console.log('\nAll dynamic imports finished successfully.');
  process.exit(0);
}

testImports();
