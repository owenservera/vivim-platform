import { generateContextBundles, getContextForChat } from '../src/services/context-generator.js';

async function main() {
  const conversationId = process.argv[2] || '6423fd34-a9f1-43e7-bd28-0e9b34811d76';

  console.log('=== Generating Context Bundles ===');
  const bundles = await generateContextBundles(conversationId);
  console.log('Generated bundles:', Object.keys(bundles));

  console.log('\n=== Getting Context for Chat ===');
  const context = await getContextForChat(conversationId);
  console.log('System prompt length:', context.systemPrompt.length, 'chars');
  console.log('Preview:');
  console.log(context.systemPrompt.substring(0, 500));
  console.log('...');
}

main().catch(console.error);
