import { getPrismaClient } from '../src/lib/database.js';

const prisma = getPrismaClient();

async function main() {
  console.log('=== CONVERSATIONS ===');
  const conversations = await prisma.conversation.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' }
  });
  console.log(JSON.stringify(conversations, null, 2));

  console.log('\n=== MESSAGES (last conversation) ===');
  if (conversations.length > 0) {
    const lastConv = conversations[0];
    const messages = await prisma.message.findMany({
      where: { conversationId: lastConv.id },
      orderBy: { messageIndex: 'asc' },
      take: 10
    });
    console.log(`Conversation: ${lastConv.title} (${lastConv.id})`);
    console.log(`Message count: ${lastConv.messageCount}`);
    messages.forEach((m, i) => {
      const content = Array.isArray(m.parts) 
        ? m.parts.map(p => p.text || p.content || '').join('').substring(0, 200)
        : 'empty';
      console.log(`[${i}] ${m.role}: ${content}...`);
    });
  }

  console.log('\n=== CONTEXT BUNDLES ===');
  const bundles = await prisma.contextBundle.findMany({
    take: 10,
    orderBy: { compiledAt: 'desc' }
  });
  console.log(`Total bundles: ${bundles.length}`);
  bundles.forEach(b => {
    console.log(`- ${b.bundleType}: ${b.tokenCount}tokens, dirty=${b.isDirty}`);
  });

  console.log('\n=== TOPIC PROFILES ===');
  const topics = await prisma.topicProfile.findMany({ take: 10 });
  console.log(`Total topics: ${topics.length}`);
  topics.forEach(t => {
    console.log(`- ${t.slug}: ${t.label}`);
  });
}

main().catch(console.error);
