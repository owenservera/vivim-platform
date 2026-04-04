/**
 * Import Service
 *
 * Handles ZIP file parsing, validation, and conversation import processing
 */

import AdmZip from 'adm-zip';
import { getPrismaClient } from '../lib/database.js';
import { logger } from '../lib/logger.js';
import { saveConversationUnified } from './storage-adapter.js';
import { v4 as uuidv4 } from 'uuid';
import { createHash } from 'crypto';
// import { MemoryService, createEmbeddingService } from '../context/memory/index.js';

const log = logger.child({ service: 'import' });

/**
 * Parse ChatGPT conversations.json format
 * ChatGPT uses a tree structure in the mapping field
 */
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

/**
 * Parse a single ChatGPT conversation from tree structure to flat format
 */
function parseChatGPTConversation(raw) {
  // Extract conversation metadata
  const conversation = {
    provider: 'chatgpt',
    sourceUrl: `import:chatgpt:${raw.conversation_id}`,
    title: raw.title || 'Untitled Conversation',
    model: raw.default_model_slug || 'unknown',
    createdAt: raw.create_time ? new Date(raw.create_time * 1000) : new Date(),
    capturedAt: new Date(),
    metadata: {
      // Core identity
      originalId: raw.conversation_id,
      id: raw.id,
      // Status flags
      isArchived: raw.is_archived || false,
      isStarred: raw.is_starred || false,
      isReadOnly: raw.is_read_only || false,
      isDoNotRemember: raw.is_do_not_remember || false,
      isStudyMode: raw.is_study_mode || false,
      // Timing
      createTime: raw.create_time,
      updateTime: raw.update_time,
      // Model & features
      defaultModelSlug: raw.default_model_slug,
      currentNode: raw.current_node,
      // Advanced features
      gizmoId: raw.gizmo_id,
      gizmoType: raw.gizmo_type,
      voice: raw.voice,
      pluginIds: raw.plugin_ids,
      // Safety
      blockedUrls: raw.blocked_urls || [],
      safeUrls: raw.safe_urls || [],
    },
  };

  // Traverse mapping tree to extract messages in order
  const messages = [];
  const mapping = raw.mapping || {};
  
  // Find root node (node with no parent or parent is null)
  let rootNodeId = null;
  for (const [nodeId, node] of Object.entries(mapping)) {
    if (!node.parent || node.parent === null) {
      rootNodeId = nodeId;
      break;
    }
  }

  if (!rootNodeId) {
    // Fallback: use first node
    rootNodeId = Object.keys(mapping)[0];
  }

  // BFS traversal to maintain order
  const queue = [rootNodeId];
  const visited = new Set();

  while (queue.length > 0) {
    const nodeId = queue.shift();
    if (visited.has(nodeId)) continue;
    visited.add(nodeId);

    const node = mapping[nodeId];
    if (!node) continue;

    // Extract message if present
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

    // Add children to queue
    if (node.children && Array.isArray(node.children)) {
      for (const childId of node.children) {
        if (!visited.has(childId)) {
          queue.push(childId);
        }
      }
    }
  }

  // Normalize messages
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

/**
 * Normalize ChatGPT content format to VIVIM message parts
 */
function normalizeChatGPTContent(content) {
  if (!content) return [];

  // Text content
  if (content.content_type === 'text' && Array.isArray(content.parts)) {
    return [{
      type: 'text',
      content: content.parts.join(''),
    }];
  }

  // Code content
  if (content.content_type === 'code') {
    return [{
      type: 'code',
      content: content.code || content.text || '',
      language: content.language || 'text',
    }];
  }

  // Image content
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

  // Fallback: try to extract any text
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

/**
 * Generate content hash for deduplication
 */
function generateContentHash(conversation) {
  const canonical = JSON.stringify({
    provider: conversation.provider,
    sourceUrl: conversation.sourceUrl,
    messages: conversation.messages.map(m => ({
      role: m.role,
      content: JSON.stringify(m.parts),
      timestamp: m.createdAt?.toISOString(),
    })),
  });

  return createHash('sha256').update(canonical).digest('hex');
}

/**
 * Create and process an import job
 */
export async function createImportJob(userId, fileBuffer, fileName) {
  const prisma = getPrismaClient();
  const jobId = uuidv4();

  log.info({ jobId, fileName, userId, bufferLength: fileBuffer?.length }, '=== IMPORT JOB START ===');

  try {
    // Step 1: Validate input
    log.info({ jobId, step: 1 }, 'Validating input...');
    if (!userId) {
      throw new Error('userId is required');
    }
    if (!fileBuffer || fileBuffer.length === 0) {
      throw new Error('fileBuffer is empty or invalid');
    }
    log.info({ jobId, step: 1, success: true }, 'Input validation passed');

    // Step 2: Parse ZIP file
    log.info({ jobId, step: 2 }, 'Parsing ZIP file...');
    let zip;
    try {
      zip = new AdmZip(fileBuffer);
      log.info({ jobId, zipEntries: zip.getEntries().length }, 'ZIP file opened');
    } catch (zipError) {
      log.error({ jobId, error: zipError.message }, 'Failed to parse ZIP file');
      throw new Error(`Invalid ZIP file: ${zipError.message}`);
    }

    let conversations;
    try {
      conversations = parseChatGPTConversations(zip);
      log.info({ jobId, conversationCount: conversations.length }, 'Parsed conversations from ZIP');
    } catch (parseError) {
      log.error({ jobId, error: parseError.message }, 'Failed to parse conversations');
      throw new Error(`Failed to parse conversations: ${parseError.message}`);
    }

    if (conversations.length === 0) {
      log.error({ jobId }, 'No valid conversations found');
      throw new Error('No valid conversations found in export file');
    }

    // Step 3: Generate file hash
    log.info({ jobId, step: 3 }, 'Generating file hash...');
    const fileHash = createHash('sha256').update(fileBuffer).digest('hex');
    log.info({ jobId, fileHash: fileHash.substring(0, 16) + '...' }, 'File hash generated');

    // Step 4: Check for duplicate import
    log.info({ jobId, step: 4 }, 'Checking for duplicate imports...');
    const existingImport = await prisma.importJob.findFirst({
      where: {
        userId,
        fileHash,
        status: {
          in: ['PROCESSING', 'QUEUED'],
        },
      },
    });

    if (existingImport) {
      log.warn({ existingJobId: existingImport.id }, 'Duplicate import detected, returning existing');
      return existingImport;
    }
    log.info({ jobId, step: 4, success: true }, 'No duplicate found');

    // Step 5: Create import job record
    log.info({ jobId, step: 5, userId, fileName, totalConversations: conversations.length }, 'Creating ImportJob record...');
    let importJob;
    try {
      importJob = await prisma.importJob.create({
        data: {
          id: jobId,
          userId,
          status: 'QUEUED',
          sourceProvider: 'chatgpt',
          format: 'chatgpt-export',
          fileHash,
          fileName,
          fileSize: fileBuffer.length,
          totalConversations: conversations.length,
          processedConversations: 0,
          failedConversations: 0,
          metadata: {
            parsedAt: new Date().toISOString(),
            conversationCount: conversations.length,
          },
        },
      });
      log.info({ jobId, importJobId: importJob.id }, 'ImportJob created successfully');
    } catch (dbError) {
      log.error({ jobId, error: dbError.message, code: dbError.code }, 'Failed to create ImportJob record');
      throw new Error(`Database error creating job: ${dbError.message}`);
    }

    // Step 6: Create imported conversation records
    log.info({ jobId, step: 6 }, 'Creating imported conversation records...');
    const importedConversations = conversations.map(conv => ({
      importJobId: jobId,
      sourceId: conv.metadata.originalId,
      title: conv.title,
      provider: 'chatgpt',
      messageCount: conv.messageCount,
      metadata: conv,
    }));

    try {
      await prisma.importedConversation.createMany({
        data: importedConversations,
      });
      log.info({ jobId, count: importedConversations.length }, 'ImportedConversation records created');
    } catch (dbError) {
      log.error({ jobId, error: dbError.message, code: dbError.code }, 'Failed to create imported conversation records');
      throw new Error(`Database error creating conversation records: ${dbError.message}`);
    }

    // Step 7: Queue processing
    log.info({ jobId, step: 7 }, 'Queuing background processing...');
    setTimeout(() => {
      processImportQueue(jobId, userId).catch(err => {
        log.error({ jobId, error: err.message }, 'Background processing failed');
      });
    }, 100);

    log.info({ jobId, importJobId: importJob.id }, '=== IMPORT JOB COMPLETED SUCCESSFULLY ===');
    return importJob;
  } catch (error) {
    log.error({ jobId, error: error.message, stack: error.stack }, '=== IMPORT JOB FAILED ===');
    
    try {
      await prisma.importJob.update({
        where: { id: jobId },
        data: {
          status: 'FAILED',
          errors: {
            push: {
              stage: 'upload',
              message: error.message,
              timestamp: new Date().toISOString(),
            },
          },
        },
      });
    } catch (updateError) {
      log.error({ jobId, error: updateError.message }, 'Failed to update job status to FAILED');
    }
    
    throw error;
  }
}

/**
 * Process import queue - converts imported conversations to actual conversations
 */
async function processImportQueue(jobId, userId) {
  const prisma = getPrismaClient();

  try {
    await prisma.importJob.update({
      where: { id: jobId },
      data: {
        status: 'PROCESSING',
        startedAt: new Date(),
      },
    });

    // Get pending imported conversations
    const pending = await prisma.importedConversation.findMany({
      where: {
        importJobId: jobId,
        state: 'PENDING',
      },
    });

    log.info({ jobId, count: pending.length }, 'Processing import queue');

    let processed = 0;
    let failed = 0;

    for (const imported of pending) {
      try {
        await processImportedConversation(imported, userId);
        processed++;

        await prisma.importJob.update({
          where: { id: jobId },
          data: {
            processedConversations: { increment: 1 },
          },
        });
      } catch (error) {
        failed++;
        log.error({ 
          importedId: imported.id, 
          error: error.message 
        }, 'Failed to process imported conversation');

        await prisma.importedConversation.update({
          where: { id: imported.id },
          data: {
            state: 'FAILED',
            errors: {
              push: {
                message: error.message,
                timestamp: new Date().toISOString(),
              },
            },
          },
        });

        await prisma.importJob.update({
          where: { id: jobId },
          data: {
            failedConversations: { increment: 1 },
            errors: {
              push: {
                stage: 'processing',
                conversationId: imported.id,
                message: error.message,
                timestamp: new Date().toISOString(),
              },
            },
          },
        });
      }
    }

    // Mark job as completed
    await prisma.importJob.update({
      where: { id: jobId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
      },
    });

    log.info({ jobId, processed, failed }, 'Import job completed');
  } catch (error) {
    log.error({ jobId, error: error.message }, 'Import queue processing failed');
    
    await prisma.importJob.update({
      where: { id: jobId },
      data: {
        status: 'FAILED',
        completedAt: new Date(),
        errors: {
          push: {
            stage: 'queue_processing',
            message: error.message,
            timestamp: new Date().toISOString(),
          },
        },
      },
    });

    throw error;
  }
}

/**
 * Process a single imported conversation - creates actual conversation record
 */
async function processImportedConversation(imported, userId) {
  const prisma = getPrismaClient();
  const metadata = imported.metadata || {};

  try {
    // Check for duplicate conversation
    const existing = await prisma.conversation.findUnique({
      where: {
        sourceUrl: `import:chatgpt:${imported.sourceId}`,
      },
    });

    if (existing) {
      log.warn({ 
        importedId: imported.id, 
        existingId: existing.id 
      }, 'Conversation already exists, skipping');

      await prisma.importedConversation.update({
        where: { id: imported.id },
        data: {
          state: 'COMPLETED',
          conversationId: existing.id,
          importedAt: new Date(),
        },
      });

      return existing;
    }

    // Generate content hash
    const contentHash = generateContentHash(metadata);

    // Prepare conversation data
    const conversationData = {
      id: uuidv4(),
      provider: 'chatgpt',
      sourceUrl: `import:chatgpt:${imported.sourceId}`,
      contentHash,
      title: imported.title || 'Imported Conversation',
      model: metadata.model || 'unknown',
      ownerId: userId,
      state: 'ACTIVE',
      createdAt: metadata.createdAt || new Date(),
      updatedAt: new Date(),
      capturedAt: new Date(),
      messageCount: imported.messageCount || 0,
      userMessageCount: metadata.userMessageCount || 0,
      aiMessageCount: metadata.aiMessageCount || 0,
      totalWords: calculateTotalWords(metadata.messages || []),
      totalCharacters: calculateTotalCharacters(metadata.messages || []),
      totalTokens: calculateTotalTokens(metadata.messages || []),
      totalCodeBlocks: countCodeBlocks(metadata.messages || []),
      metadata: {
        ...metadata.metadata,
        imported: true,
        importedAt: new Date().toISOString(),
        importJobId: imported.importJobId,
      },
      messages: (metadata.messages || []).map((msg, index) => ({
        id: msg.id || uuidv4(),
        role: msg.role,
        author: msg.author,
        parts: msg.parts || [],
        messageIndex: index,
        createdAt: msg.createdAt || new Date(),
        status: 'completed',
        tokenCount: msg.tokenCount,
        metadata: msg.metadata || {},
      })),
    };

    // Save conversation using unified storage
    await saveConversationUnified(conversationData);
    
    // Create sovereign memory for the imported conversation (disabled temporarily)
    // try {
    //   await createMemoryFromConversation(userId, conversationData);
    //   log.info({ 
    //     conversationId: conversationData.id 
    //   }, 'Created sovereign memory for imported conversation');
    // } catch (memError) {
    //   log.warn({ 
    //     conversationId: conversationData.id,
    //     error: memError.message 
    //   }, 'Failed to create memory for conversation, continuing anyway');
    // }

    // Update imported conversation record
    await prisma.importedConversation.update({
      where: { id: imported.id },
      data: {
        state: 'STORED',
        conversationId: conversationData.id,
        importedAt: new Date(),
      },
    });

    log.info({ 
      importedId: imported.id, 
      conversationId: conversationData.id 
    }, 'Imported conversation stored');

    return conversationData;
  } catch (error) {
    log.error({ 
      importedId: imported.id, 
      error: error.message 
    }, 'Failed to process imported conversation');
    throw error;
  }
}

/**
 * Create sovereign memory entries from imported conversation
 * This enables the conversation to be used in the context engine
 */
async function createMemoryFromConversation(userId, conversation) {
  const prisma = getPrismaClient();
  const embeddingService = createEmbeddingService();
  
  const memoryService = new MemoryService({
    prisma,
    embeddingService,
  });

  // Generate conversation summary from messages
  const conversationText = conversation.messages
    .slice(0, 10) // First 10 messages for summary
    .map(msg => {
      const text = msg.parts
        ?.filter(p => p.type === 'text')
        .map(p => p.content)
        .join(' ') || '';
      return `[${msg.role}]: ${text.slice(0, 500)}`; // Limit each message
    })
    .join('\n\n');

  // Create a memory for this conversation
  const memoryInput = {
    content: conversationText,
    summary: `ChatGPT conversation: ${conversation.title}`,
    memoryType: 'EPISODIC',
    category: 'conversation_import',
    tags: ['chatgpt-import', 'imported-conversation', conversation.model || 'unknown'],
    importance: 0.6,
    sourceConversationIds: [conversation.id],
    metadata: {
      provider: conversation.provider,
      model: conversation.model,
      sourceUrl: conversation.sourceUrl,
      messageCount: conversation.messageCount,
      importedAt: new Date().toISOString(),
    },
  };

  const memory = await memoryService.createMemory(userId, memoryInput);
  
  log.info({ 
    memoryId: memory.id, 
    conversationId: conversation.id 
  }, 'Created episodic memory from imported conversation');

  // Also create additional memories for key information
  // Extract and store AI-generated content as semantic memories
  const aiMessages = conversation.messages
    .filter(msg => msg.role === 'assistant' && msg.parts)
    .flatMap(msg => msg.parts.filter(p => p.type === 'text').map(p => p.content))
    .slice(0, 5); // Take first 5 AI responses

  for (let i = 0; i < aiMessages.length; i++) {
    try {
      const content = aiMessages[i].slice(0, 2000); // Limit content size
      
      const semanticMemoryInput = {
        content: content,
        summary: `AI response from: ${conversation.title}`,
        memoryType: 'SEMANTIC',
        category: 'knowledge',
        tags: ['chatgpt-import', 'ai-knowledge'],
        importance: 0.4,
        sourceConversationIds: [conversation.id],
        metadata: {
          provider: conversation.provider,
          messageIndex: i,
          importedAt: new Date().toISOString(),
        },
      };

      await memoryService.createMemory(userId, semanticMemoryInput);
    } catch (err) {
      log.warn({ error: err.message, messageIndex: i }, 'Failed to create semantic memory');
    }
  }

  log.info({ 
    conversationId: conversation.id,
    memoriesCreated: aiMessages.length + 1 
  }, 'Created memories for imported conversation');

  return memory;
}

// Helper functions for stats calculation
function calculateTotalWords(messages) {
  return messages.reduce((total, msg) => {
    const text = extractTextFromParts(msg.parts || []);
    return total + (text.split(/\s+/).filter(w => w.length > 0).length);
  }, 0);
}

function calculateTotalCharacters(messages) {
  return messages.reduce((total, msg) => {
    const text = extractTextFromParts(msg.parts || []);
    return total + text.length;
  }, 0);
}

function calculateTotalTokens(messages) {
  // Rough estimate: 1 token ≈ 4 characters
  return Math.round(calculateTotalCharacters(messages) / 4);
}

function countCodeBlocks(messages) {
  return messages.reduce((count, msg) => {
    const parts = msg.parts || [];
    return count + parts.filter(p => p.type === 'code').length;
  }, 0);
}

function extractTextFromParts(parts) {
  return parts
    .filter(p => p.type === 'text')
    .map(p => p.content || '')
    .join(' ');
}

/**
 * Get import job by ID
 */
export async function getImportJob(jobId, userId) {
  const prisma = getPrismaClient();

  return prisma.importJob.findFirst({
    where: {
      id: jobId,
      userId,
    },
  });
}

/**
 * List import jobs for user
 */
export async function listImportJobs(userId, limit = 20) {
  const prisma = getPrismaClient();

  return prisma.importJob.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}

/**
 * Cancel import job
 */
export async function cancelImportJob(jobId, userId) {
  const prisma = getPrismaClient();

  const job = await prisma.importJob.findFirst({
    where: {
      id: jobId,
      userId,
    },
  });

  if (!job) {
    throw new Error('Import job not found');
  }

  if (['COMPLETED', 'FAILED', 'CANCELLED'].includes(job.status)) {
    throw new Error(`Cannot cancel job with status: ${job.status}`);
  }

  return prisma.importJob.update({
    where: { id: jobId },
    data: {
      status: 'CANCELLED',
      completedAt: new Date(),
    },
  });
}

/**
 * Retry failed import job
 */
export async function retryImportJob(jobId, userId) {
  const prisma = getPrismaClient();

  const job = await prisma.importJob.findFirst({
    where: {
      id: jobId,
      userId,
    },
  });

  if (!job) {
    throw new Error('Import job not found');
  }

  if (job.status !== 'FAILED') {
    throw new Error('Can only retry failed jobs');
  }

  // Reset job status
  await prisma.importJob.update({
    where: { id: jobId },
    data: {
      status: 'QUEUED',
      startedAt: null,
      completedAt: null,
      processedConversations: 0,
      failedConversations: 0,
      errors: [],
    },
  });

  // Reset imported conversations
  await prisma.importedConversation.updateMany({
    where: { importJobId: jobId },
    data: {
      state: 'PENDING',
      conversationId: null,
      errors: [],
    },
  });

  // Restart processing
  processImportQueue(jobId, userId).catch(err => {
    log.error({ jobId, error: err.message }, 'Retry processing failed');
  });

  return prisma.importJob.findUnique({
    where: { id: jobId },
  });
}

export const importService = {
  createImportJob,
  getImportJob,
  listImportJobs,
  cancelImportJob,
  retryImportJob,
};

export default importService;
