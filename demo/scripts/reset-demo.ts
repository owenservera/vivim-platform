import { PrismaClient } from '@prisma/client';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const prisma = new PrismaClient();

const FOCUS_IDS = [
  'knowledgeGraph', 'coreCapture', 'contextEngine',
  'forYouFeed', 'identityStorage', 'socialSharing', 'aiNative', 'fullJourney',
];

function parseArgs() {
  const args = process.argv.slice(2);
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
VIVIM Demo Reset

Usage:
  bun run demo:reset              # Full seed (320 conversations)
  bun run demo:reset --focus=kg   # Seed for specific focus area
  bun run demo:reset --help       # Show this help

Available focus areas:
${FOCUS_IDS.map(id => `  ${id}`).join('\n')}

Examples:
  bun run demo:reset --focus=knowledgeGraph   # Knowledge graph demo
  bun run demo:reset --focus=contextEngine     # Context engine demo
`);
    process.exit(0);
  }
  const focusArg = args.find(a => a.startsWith('--focus='));
  return { focus: focusArg?.split('=')[1] || 'default' };
}

async function main() {
  const { focus } = parseArgs();
  const start = Date.now();

  console.log('🔄 VIVIM demo reset...\n');
  console.log(`   Focus: ${focus}\n`);

  try {
    console.log('📦 Step 1/2 — Clearing database...');
    await prisma.$executeRaw`TRUNCATE TABLE 
      atomic_chat_units, acu_links, messages, conversations,
      topic_conversations, topic_profiles, entity_profiles,
      context_bundles, memories, user_facts, memory_relationships,
      circles, circle_members, notebooks, notebook_entries,
      friends, follows, groups, group_members, group_posts,
      team_members, team_channels, channel_members, channel_messages,
      user_context_settings, client_presence, custom_instructions,
      sharing_policies, content_stakeholders, sharing_intents,
      analytics_events, insights, content_flags
    RESTART IDENTITY CASCADE`.catch(() => {});
    console.log('  ✅ Database cleared\n');

    console.log('🌱 Step 2/2 — Seeding investor data...');
    const seedCmd = focus === 'default'
      ? 'bun run prisma:seed:investor'
      : `bun run prisma:seed:investor -- --focus=${focus}`;
    try {
      await execAsync(seedCmd, { cwd: './server' });
      console.log('  ✅ Investor data seeded\n');
    } catch (seedErr: any) {
      if (seedErr.message?.includes('ENOENT')) {
        console.log('  ⚠️  Seed script not found — run manually: bun run demo:seed\n');
      } else {
        console.error('  ❌ Seed failed:', seedErr.message);
        console.log('  ⚠️  Continuing anyway — run "bun run demo:seed" to seed manually\n');
      }
    }

    const duration = Date.now() - start;
    console.log('═'.repeat(50));
    console.log('✅ Demo reset complete!');
    console.log('═'.repeat(50));
    console.log(`\n⏱️  Duration: ${duration}ms\n`);
    console.log('📋 Next steps:');
    console.log('   1. bun run dev');
    console.log('   2. Visit http://localhost:5173\n');

  } catch (err) {
    console.error('❌ Reset failed:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
