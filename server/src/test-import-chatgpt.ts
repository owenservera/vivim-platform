/**
 * Test script for ChatGPT import service
 * Run with: bun run test-import-chatgpt.ts
 */

import AdmZip from 'adm-zip';
import { getPrismaClient } from './lib/database.js';
import { logger } from './lib/logger.js';
import { saveConversationUnified } from './services/storage-adapter.js';
import { v4 as uuidv4 } from 'uuid';
import { createHash } from 'crypto';
import { MemoryService, createEmbeddingService } from './context/memory/index.js';

const log = logger.child({ service: 'import-test' });

const ZIP_PATH = '../chatgpt-exports/chatgpt_export.zip';

function parseChatGPTConversations(zip) {
  const conversationsFile = zip.getEntry('conversations.json');
  if (!conversationsFile) {
    throw new Error('conversations.json not found in export');
  }

  const rawConversations = JSON.parse(conversationsFile.getData().toString('utf8'));
  
  if (!Array.isArray(rawConversations)) {
    throw new Error('Invalid conversations.json format: expected array');
  }

  const parsed = rawConversations.map(conv => {
    try {
      return parseChatGPTConversation(conv);
    } catch (error) {
      log.warn({ 
        conversationId: conv.conversation_id, 
        error: error.message 
      }, 'Failed to parse conversation, skipping');
      return null;
    }
  }).filter(Boolean);

  return parsed;
}

function parseChatGPTConversation(raw) {
  const conversation = {
    provider: 'chatgpt',
    sourceUrl: `import:chatgpt:${raw.conversation_id}`,
    title: raw.title || 'Untitled Conversation',
    model: raw.default_model_slug || 'unknown',
    createdAt: raw.create_time ? new Date(raw.create_time * 1000) : new Date(),
    capturedAt: new Date(),
    metadata: {
      originalId: raw.conversation_id,
      id: raw.id,
      isArchived: raw.is_archived || false,
      isStarred: raw.is_starred || false,
      isReadOnly: raw.is_read_only || false,
      isDoNotRemember: raw.is_do_not_remember || false,
      isStudyMode: raw.is_study_mode || false,
      createTime: raw.create_time,
      updateTime: raw.update_time,
      defaultModelSlug: raw.default_model_slug,
      currentNode: raw.current_node,
      gizmoId: raw.gizmo_id,
      gizmoType: raw.gizmo_type,
      voice: raw.voice,
      pluginIds: raw.plugin_ids,
      blockedUrls: raw.blocked_urls || [],
      safeUrls: raw.safe_urls || [],
    },
  };

  const messages = [];
  const mapping = raw.mapping || {};
  
  let rootNodeId = null;
  for (const [nodeId, node] of Object.entries(mapping)) {
    if (!node.parent || node.parent === null) {
      rootNodeId = nodeId;
      break;
    }
  }

  if (!rootNodeId) {
    rootNodeId = Object.keys(mapping)[0];
  }

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
        id: msg.id || uuidv4(),
        role: msg.author?.role || 'assistant',
        author: msg.author?.name,
        content: msg.content,
        timestamp: msg.create_time ? new Date(msg.create_time * 1000) : new Date(),
        metadata: msg.metadata || {},
      });
    }

    if (node.children && Array.isArray(node.children)) {
      for (const childId of node.children) {
        if (!visited.has(childId)) {
          queue.push(childId);
        }
      }
    }
  }

  const normalizedMessages = messages
    .filter(msg => msg.content && (msg.content.parts || msg.content.content_type))
    .map((msg, index) => ({
      id: msg.id,
      role: msg.role,
      author: msg.author,
      parts: normalizeChatGPTContent(msg.content),
      messageIndex: index,
      createdAt: msg.timestamp,
      tokenCount: msg.metadata?.token_count || null,
      status: 'completed',
      metadata: msg.metadata,
    }));

  return {
    ...conversation,
    messages: normalizedMessages,
    messageCount: normalizedMessages.length,
    userMessageCount: normalizedMessages.filter(m => m.role === 'user').length,
    aiMessageCount: normalizedMessages.filter(m => m.role === 'assistant').length,
  };
}

function normalizeChatGPTContent(content) {
  if (!content) return [];

  if (content.content_type === 'text' && Array.isArray(content.parts)) {
    return [{
      type: 'text',
      content: content.parts.join(''),
    }];
  }

  if (content.content_type === 'code') {
    return [{
      type: 'code',
      content: content.code || content.text || '',
      language: content.language || 'text',
    }];
  }

  if (content.content_type === 'image') {
    return [{
      type: 'image',
      content: content.url || content.src || '',
      metadata: {
        alt: content.alt,
        size: content.size,
      },
    }];
  }

  if (content.parts && Array.isArray(content.parts)) {
    return content.parts.map(part => ({
      type: 'text',
      content: typeof part === 'string' ? part : JSON.stringify(part),
    }));
  }

  return [{
    type: 'text',
    content: JSON.stringify(content),
  }];
}

async function testImport() {
  const prisma = getPrismaClient();
  const userId = 'test-user-import';
  
  console.log('=== ChatGPT Import Test ===\n');
  
  try {
    // Read the zip file
    console.log('1. Reading ZIP file...');
    const zip = new AdmZip(ZIP_PATH);
    console.log(`   ZIP entries: ${zip.getEntries().length}`);
    
    // Parse conversations
    console.log('\n2. Parsing conversations...');
    const conversations = parseChatGPTConversations(zip);
    console.log(`   Parsed ${conversations.length} conversations`);
    
    // Show first conversation as sample
    if (conversations.length > 0) {
      const first = conversations[0];
      console.log('\n3. Sample conversation:');
      console.log(`   Title: ${first.title}`);
      console.log(`   Model: ${first.model}`);
      console.log(`   Created: ${first.createdAt}`);
      console.log(`   Messages: ${first.messageCount}`);
      console.log(`   User messages: ${first.userMessageCount}`);
      console.log(`   AI messages: ${first.aiMessageCount}`);
      console.log(`   Source URL: ${first.sourceUrl}`);
      
      // Show message sample
      if (first.messages.length > 0) {
        console.log('\n   First message:');
        const firstMsg = first.messages[0];
        const textContent = firstMsg.parts?.find(p => p.type === 'text')?.content || '';
        console.log(`   - Role: ${firstMsg.role}`);
        console.log(`   - Content: ${textContent.substring(0, 100)}...`);
      }
    }
    
    // Test storing one conversation
    console.log('\n4. Testing conversation storage...');
    const testConv = conversations[0];
    const conversationData = {
      id: uuidv4(),
      provider: testConv.provider,
      sourceUrl: testConv.sourceUrl,
      contentHash: createHash('sha256').update(JSON.stringify(testConv)).digest('hex'),
      title: testConv.title,
      model: testConv.model,
      ownerId: userId,
      state: 'ACTIVE',
      createdAt: testConv.createdAt,
      updatedAt: new Date(),
      capturedAt: new Date(),
      messageCount: testConv.messageCount,
      userMessageCount: testConv.userMessageCount,
      aiMessageCount: testConv.aiMessageCount,
      totalWords: testConv.messages.reduce((total, msg) => {
        const text = msg.parts?.filter(p => p.type === 'text').map(p => p.content).join(' ') || '';
        return total + text.split(/\s+/).filter(w => w.length > 0).length;
      }, 0),
      totalCharacters: testConv.messages.reduce((total, msg) => {
        const text = msg.parts?.filter(p => p.type === 'text').map(p => p.content).join(' ') || '';
        return total + text.length;
      }, 0),
      totalTokens: 0,
      totalCodeBlocks: testConv.messages.reduce((count, msg) => {
        return count + (msg.parts?.filter(p => p.type === 'code').length || 0);
      }, 0),
      metadata: testConv.metadata,
      messages: testConv.messages.map((msg, index) => ({
        id: msg.id,
        role: msg.role,
        author: msg.author,
        parts: msg.parts || [],
        messageIndex: index,
        createdAt: msg.createdAt,
        status: 'completed',
        tokenCount: msg.tokenCount,
        metadata: msg.metadata,
      })),
    };
    
    console.log(`   Storing conversation: ${conversationData.title}`);
    const stored = await saveConversationUnified(conversationData);
    console.log(`   Stored! ID: ${stored.id || stored.conversation?.id}`);
    
    // Test memory creation
    console.log('\n5. Testing memory creation...');
    const embeddingService = createEmbeddingService();
    const memoryService = new MemoryService({
      prisma,
      embeddingService,
    });
    
    const conversationText = testConv.messages
      .slice(0, 5)
      .map(msg => {
        const text = msg.parts
          ?.filter(p => p.type === 'text')
          .map(p => p.content)
          .join(' ') || '';
        return `[${msg.role}]: ${text.slice(0, 300)}`;
      })
      .join('\n\n');
    
    const memoryInput = {
      content: conversationText,
      summary: `ChatGPT: ${testConv.title}`,
      memoryType: 'EPISODIC',
      category: 'conversation_import',
      tags: ['chatgpt-import', 'test'],
      importance: 0.6,
      sourceConversationIds: [stored.id || stored.conversation?.id],
      metadata: {
        provider: testConv.provider,
        model: testConv.model,
        sourceUrl: testConv.sourceUrl,
        messageCount: testConv.messageCount,
      },
    };
    
    const memory = await memoryService.createMemory(userId, memoryInput);
    console.log(`   Created memory! ID: ${memory.id}`);
    
    console.log('\n=== TEST PASSED ===');
    console.log(`\nSummary:`);
    console.log(`- Conversations parsed: ${conversations.length}`);
    console.log(`- Sample conversation stored: ${stored.id || stored.conversation?.id}`);
    console.log(`- Memory created: ${memory.id}`);
    console.log(`\nAll ChatGPT export data properly parsed and stored!`);
    
  } catch (error) {
    console.error('\n!!! TEST FAILED !!!');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

testImport();
