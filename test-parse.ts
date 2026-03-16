/**
 * Quick Import Test
 */
import { readFileSync } from 'fs';
import AdmZip from 'adm-zip';

const ZIP_PATH = './chatgpt-exports/50f21fc0eefd1bdbb9eda7bf5e7145d7f92921dcd853ac96c49096eaeeec95b5-2026-03-05-06-36-32-d5be5ff9b0fe4d368479fb705cd03a9d.zip';

console.log('🧪 Testing ChatGPT Export Parsing...\n');

try {
  // Read ZIP
  console.log('📦 Reading ZIP file...');
  const fileBuffer = readFileSync(ZIP_PATH);
  console.log(`   Size: ${(fileBuffer.length / 1024 / 1024).toFixed(2)} MB\n`);

  // Parse ZIP
  console.log('📂 Extracting ZIP...');
  const zip = new AdmZip(fileBuffer);
  const entries = zip.getEntries();
  console.log(`   Entries: ${entries.length}`);
  entries.forEach(e => console.log(`      - ${e.entryName}`));
  console.log();

  // Find conversations.json
  const convEntry = zip.getEntry('conversations.json');
  if (!convEntry) {
    console.log('❌ conversations.json not found!');
    process.exit(1);
  }

  console.log('📄 Parsing conversations.json...');
  const conversations = JSON.parse(convEntry.getData().toString('utf8'));
  console.log(`   Total conversations: ${conversations.length}\n`);

  // Parse first conversation
  if (conversations.length > 0) {
    console.log('🔍 Analyzing first conversation...');
    const first = conversations[0];
    console.log(`   ID: ${first.conversation_id}`);
    console.log(`   Title: ${first.title || 'Untitled'}`);
    console.log(`   Create Time: ${new Date(first.create_time * 1000).toISOString()}`);
    console.log(`   Mapping nodes: ${Object.keys(first.mapping || {}).length}`);
    
    // Count messages
    let messageCount = 0;
    if (first.mapping) {
      for (const nodeId in first.mapping) {
        if (first.mapping[nodeId].message) {
          messageCount++;
        }
      }
    }
    console.log(`   Messages: ${messageCount}`);
    console.log();

    // Test tree traversal
    console.log('🌳 Testing tree traversal...');
    const mapping = first.mapping || {};
    let rootNodeId = null;
    for (const [nodeId, node] of Object.entries(mapping)) {
      if (!node.parent) {
        rootNodeId = nodeId;
        break;
      }
    }
    console.log(`   Root node: ${rootNodeId}`);
    
    // BFS to extract messages
    const messages = [];
    const queue = [rootNodeId];
    const visited = new Set();
    
    while (queue.length > 0) {
      const nodeId = queue.shift();
      if (visited.has(nodeId)) continue;
      visited.add(nodeId);
      
      const node = mapping[nodeId];
      if (!node) continue;
      
      if (node.message) {
        messages.push({
          id: node.message.id,
          role: node.message.author?.role || 'unknown',
          content: node.message.content?.parts?.join('') || '(no content)',
        });
      }
      
      if (node.children && Array.isArray(node.children)) {
        for (const childId of node.children) {
          if (!visited.has(childId)) queue.push(childId);
        }
      }
    }
    
    console.log(`   Extracted messages: ${messages.length}\n`);
    
    // Show first 3 messages
    console.log('💬 Sample messages:');
    messages.slice(0, 3).forEach((msg, i) => {
      const preview = msg.content.substring(0, 60).replace(/\n/g, ' ');
      console.log(`   ${i+1}. [${msg.role}] ${preview}...`);
    });
  }

  console.log('\n✅ Parsing test PASSED!\n');
} catch (error: any) {
  console.error('❌ Test FAILED:', error.message);
  console.error(error);
  process.exit(1);
}
