import { readFileSync } from 'fs';
import AdmZip from 'adm-zip';

const ZIP_PATH = '../chatgpt-exports/50f21fc0eefd1bdbb9eda7bf5e7145d7f92921dcd853ac96c49096eaeeec95b5-2026-03-05-06-36-32-d5be5ff9b0fe4d368479fb705cd03a9d.zip';

console.log('🧪 Testing ChatGPT Export Parsing...\n');

try {
  const fileBuffer = readFileSync(ZIP_PATH);
  console.log(`📦 ZIP Size: ${(fileBuffer.length / 1024 / 1024).toFixed(2)} MB`);

  const zip = new AdmZip(fileBuffer);
  const convEntry = zip.getEntry('conversations.json');
  
  if (!convEntry) {
    throw new Error('conversations.json not found');
  }

  const conversations = JSON.parse(convEntry.getData().toString('utf8'));
  console.log(`📄 Conversations: ${conversations.length}`);

  if (conversations.length > 0) {
    const first = conversations[0];
    console.log(`\n🔍 First conversation:`);
    console.log(`   ID: ${first.conversation_id}`);
    console.log(`   Title: ${first.title || 'Untitled'}`);
    
    // Count messages in mapping
    const messageNodes = Object.values(first.mapping || {}).filter((n: any) => n.message);
    console.log(`   Messages in tree: ${messageNodes.length}`);

    // Test tree traversal
    const mapping = first.mapping || {};
    let rootNodeId = null;
    for (const [nodeId, node] of Object.entries(mapping)) {
      if (!node.parent) {
        rootNodeId = nodeId;
        break;
      }
    }

    const messages: any[] = [];
    const queue = [rootNodeId];
    const visited = new Set();
    
    while (queue.length > 0) {
      const nodeId = queue.shift();
      if (visited.has(nodeId)) continue;
      visited.add(nodeId);
      
      const node = mapping[nodeId];
      if (!node) continue;
      
      if (node.message) {
        const msg = node.message;
        messages.push({
          id: msg.id,
          role: msg.author?.role || 'unknown',
          content: msg.content?.parts?.join('') || '',
        });
      }
      
      if (node.children?.length) {
        for (const childId of node.children) {
          if (!visited.has(childId)) queue.push(childId);
        }
      }
    }

    console.log(`   Extracted messages: ${messages.length}`);
    
    if (messages.length > 0) {
      console.log(`\n💬 First message:`);
      console.log(`   Role: ${messages[0].role}`);
      console.log(`   Content: ${messages[0].content.substring(0, 80)}...`);
    }
  }

  console.log('\n✅ Parsing test PASSED!\n');
} catch (error: any) {
  console.error('❌ Test FAILED:', error.message);
  console.error(error);
  process.exit(1);
}
