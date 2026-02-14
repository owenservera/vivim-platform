/**
 * ACU Processor Service
 * 
 * Converts captured conversations into Atomic Chat Units (ACUs)
 * using the Rust core parser and stores them in the knowledge graph.
 * 
 * Flow:
 * 1. Fetch conversation + messages from database
 * 2. Call Rust core to decompose into ACUs
 * 3. Generate embeddings (optional)
 * 4. Calculate quality scores
 * 5. Detect relationships (ACU links)
 * 6. Save to database
 */

import { getPrismaClient } from '../lib/database.js';
import { logger } from '../lib/logger.js';
import crypto from 'crypto';

// Import Rust core (will be available after UniFFI bindings are set up)
// For now, we'll create a mock implementation
const rustCore = null;
try {
  // This will work once Rust core is compiled with UniFFI
  // rustCore = await import('../../openscroll-core/index.js');
} catch (error) {
  logger.warn('Rust core not available, using mock implementation');
}

/**
 * Process a single conversation into ACUs
 * @param {string} conversationId - UUID of the conversation
 * @param {object} options - Processing options
 * @returns {Promise<object>} Processing result
 */
export async function processConversationToACUs(conversationId, options = {}) {
  const {
    generateEmbeddings = false,
    calculateQuality = true,
    detectLinks = true,
    authorDid = null, // If null, will use default or create anonymous DID
  } = options;

  const startTime = Date.now();
  
  try {
    logger.info(`Processing conversation ${conversationId} to ACUs`);

    // 1. Fetch conversation with messages
    const conversation = await getPrismaClient().conversation.findUnique({
      where: { id: conversationId },
      include: {
        messages: {
          orderBy: { messageIndex: 'asc' },
        },
      },
    });

    if (!conversation) {
      throw new Error(`Conversation ${conversationId} not found`);
    }

    logger.info(`Found conversation with ${conversation.messages.length} messages`);

    // 2. Convert to format expected by Rust core
    const extractedData = {
      id: conversation.id,
      provider: conversation.provider,
      title: conversation.title,
      model: conversation.model,
      created_at: conversation.createdAt.toISOString(),
      updated_at: conversation.updatedAt.toISOString(),
      messages: conversation.messages.map(msg => ({
        id: msg.id,
        role: msg.role,
        author: msg.author,
        content: convertPartsToContent(msg.parts),
        created_at: msg.createdAt.toISOString(),
        message_index: msg.messageIndex,
        metadata: msg.metadata,
      })),
    };

    // 3. Call Rust core to decompose into ACUs
    let acus;
    if (rustCore) {
      // Real implementation with Rust core
      const rawJson = JSON.stringify(extractedData);
      acus = await rustCore.process_capture_async(rawJson);
    } else {
      // Mock implementation for testing
      acus = await mockProcessCapture(extractedData);
    }

    logger.info(`Generated ${acus.length} ACUs from conversation`);

    // 4. Determine author DID
    const finalAuthorDid = authorDid || await getOrCreateAnonymousDid(conversation.ownerId);

    // 5. Generate embeddings if requested
    if (generateEmbeddings && rustCore) {
      logger.info('Generating embeddings for ACUs');
      acus = await rustCore.enrich_acus_with_embeddings(acus);
    }

    // 6. Save ACUs to database
    const savedAcus = [];
    for (const acu of acus) {
      try {
        const savedAcu = await saveAcuToDatabase(acu, {
          conversationId,
          authorDid: finalAuthorDid,
          provider: conversation.provider,
          model: conversation.model,
          calculateQuality,
        });
        savedAcus.push(savedAcu);
      } catch (error) {
        logger.error(`Failed to save ACU: ${error.message}`, { acu, error });
        // Continue processing other ACUs
      }
    }

    // 7. Detect and create relationships between ACUs
    if (detectLinks && savedAcus.length > 1) {
      logger.info('Detecting ACU relationships');
      await createAcuLinks(savedAcus);
    }

    const duration = Date.now() - startTime;
    
    logger.info(`Successfully processed conversation ${conversationId}`, {
      acuCount: savedAcus.length,
      duration: `${duration}ms`,
    });

    return {
      success: true,
      conversationId,
      acuCount: savedAcus.length,
      duration,
      acus: savedAcus,
    };

  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error(`Failed to process conversation ${conversationId}`, {
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`,
    });

    return {
      success: false,
      conversationId,
      error: error.message,
      duration,
    };
  }
}

/**
 * Convert message parts (JSONB) to plain text content
 * @param {Array|string} parts - Message parts from database
 * @returns {string} Plain text content
 */
function convertPartsToContent(parts) {
  if (typeof parts === 'string') {
    return parts;
  }

  if (!Array.isArray(parts)) {
    return JSON.stringify(parts);
  }

  return parts.map(part => {
    if (typeof part === 'string') {
      return part;
    }

    if (part.type === 'text') {
      return part.content;
    }

    if (part.type === 'code') {
      const lang = part.metadata?.language || '';
      return `\`\`\`${lang}\n${part.content}\n\`\`\``;
    }

    if (part.type === 'latex') {
      return `$$${part.content}$$`;
    }

    if (part.type === 'table') {
      // Convert table to markdown
      if (part.content?.headers && part.content?.rows) {
        const headers = part.content.headers.join(' | ');
        const separator = part.content.headers.map(() => '---').join(' | ');
        const rows = part.content.rows.map(row => row.join(' | ')).join('\n');
        return `${headers}\n${separator}\n${rows}`;
      }
      return JSON.stringify(part.content);
    }

    // For other types, return content as-is or stringify
    return part.content || JSON.stringify(part);
  }).join('\n\n');
}

/**
 * Mock implementation of Rust core processing
 * Used when Rust core is not available
 */
async function mockProcessCapture(extractedData) {
  const acus = [];

  for (const message of extractedData.messages) {
    // Simple decomposition: split by paragraphs
    const {content} = message;
    const paragraphs = content.split(/\n\n+/).filter(p => p.trim().length > 0);

    for (let i = 0; i < paragraphs.length; i++) {
      const paragraph = paragraphs[i].trim();
      
      // Skip very short paragraphs
      if (paragraph.length < 10) {
continue;
}

      // Determine type based on content
      let type = 'statement';
      let category = 'general';
      let language = null;

      if (paragraph.includes('```')) {
        type = 'code_snippet';
        category = 'technical';
        const langMatch = paragraph.match(/```(\w+)/);
        language = langMatch ? langMatch[1] : 'plaintext';
      } else if (paragraph.endsWith('?')) {
        type = 'question';
      } else if (paragraph.startsWith('Answer:') || paragraph.startsWith('Response:')) {
        type = 'answer';
      } else if (paragraph.includes('$$')) {
        type = 'formula';
        category = 'technical';
      }

      // Generate content hash as ID
      const id = generateContentHash(paragraph);

      acus.push({
        id,
        content: paragraph,
        language,
        type,
        category,
        provenance: {
          conversation_id: extractedData.id,
          message_id: message.id,
          message_index: message.message_index,
          source_timestamp: message.created_at,
        },
        embedding: null, // Will be filled by embedding service
        metadata: {
          mock: true,
          paragraph_index: i,
        },
      });
    }
  }

  return acus;
}

/**
 * Generate SHA3-256 hash of content (ACU ID)
 */
function generateContentHash(content) {
  return crypto
    .createHash('sha256')
    .update(content.trim())
    .digest('hex');
}

/**
 * Get or create anonymous DID for user
 */
async function getOrCreateAnonymousDid(userId) {
  if (!userId) {
    // Return a default anonymous DID
    return 'did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK';
  }

  // Check if user exists
  const user = await getPrismaClient().user.findUnique({
    where: { id: userId },
  });

  if (user) {
    return user.did;
  }

  // Create anonymous user
  // In production, this would use proper DID generation
  const anonymousDid = `did:key:anon_${userId}`;
  
  try {
    const newUser = await getPrismaClient().user.create({
      data: {
        id: userId,
        did: anonymousDid,
        displayName: 'Anonymous User',
        publicKey: 'placeholder_public_key', // Would be real key in production
        settings: {},
      },
    });
    return newUser.did;
  } catch (error) {
    // User might have been created by another process
    logger.warn(`Failed to create user ${userId}: ${error.message}`);
    return anonymousDid;
  }
}

/**
 * Save ACU to database
 */
async function saveAcuToDatabase(acu, context) {
  const {
    conversationId,
    authorDid,
    provider,
    model,
    calculateQuality,
  } = context;

  // Calculate quality scores if requested
  let qualityScores = null;
  if (calculateQuality) {
    qualityScores = calculateAcuQuality(acu);
  }

  // Prepare ACU data
  const acuData = {
    id: acu.id,
    authorDid,
    signature: Buffer.from([]), // Placeholder - would be real signature in production
    content: acu.content,
    language: acu.language,
    type: acu.type,
    category: acu.category,
    embedding: acu.embedding ? acu.embedding : null,
    embeddingModel: acu.embedding ? 'mock-model' : null,
    conversationId,
    messageId: acu.provenance.message_id,
    messageIndex: acu.provenance.message_index,
    provider,
    model,
    sourceTimestamp: new Date(acu.provenance.source_timestamp),
    extractorVersion: '1.0.0',
    parserVersion: '1.0.0',
    qualityOverall: qualityScores?.overall,
    contentRichness: qualityScores?.richness,
    structuralIntegrity: qualityScores?.integrity,
    uniqueness: qualityScores?.uniqueness,
    sharingPolicy: 'self', // Default to private
    sharingCircles: [],
    metadata: acu.metadata || {},
  };

  // Upsert ACU (in case it already exists)
  const savedAcu = await getPrismaClient().atomicChatUnit.upsert({
    where: { id: acu.id },
    update: acuData,
    create: acuData,
  });

  return savedAcu;
}

/**
 * Calculate quality scores for an ACU
 */
function calculateAcuQuality(acu) {
  const {content} = acu;
  const {length} = content;

  // Content richness: based on length and structure
  let richness = 0;
  if (length > 500) {
richness = 90;
} else if (length > 200) {
richness = 70;
} else if (length > 50) {
richness = 50;
} else {
richness = 30;
}

  // Bonus for code, formulas, etc.
  if (acu.type === 'code_snippet') {
richness += 10;
}
  if (acu.type === 'formula') {
richness += 10;
}

  // Structural integrity: based on type classification
  const integrity = acu.type !== 'unknown' ? 80 : 50;

  // Uniqueness: simple heuristic (would use embeddings in production)
  const uniqueness = Math.min(100, length / 10);

  // Overall score: weighted average
  const overall = (richness * 0.4 + integrity * 0.3 + uniqueness * 0.3);

  return {
    overall: Math.round(overall),
    richness: Math.round(richness),
    integrity: Math.round(integrity),
    uniqueness: Math.round(uniqueness),
  };
}

/**
 * Create relationships (links) between ACUs
 */
async function createAcuLinks(acus) {
  const links = [];

  // Create sequential links (next/previous)
  for (let i = 0; i < acus.length - 1; i++) {
    const source = acus[i];
    const target = acus[i + 1];

    // Check if they're from the same message
    if (source.messageId === target.messageId) {
      links.push({
        sourceId: source.id,
        targetId: target.id,
        relation: 'next',
        weight: 1.0,
        metadata: { type: 'sequential' },
      });
    }
  }

  // Detect semantic relationships (simple heuristics for now)
  for (let i = 0; i < acus.length; i++) {
    const source = acus[i];
    
    // If this is a question, look for answers
    if (source.type === 'question') {
      for (let j = i + 1; j < Math.min(i + 5, acus.length); j++) {
        const target = acus[j];
        if (target.type === 'answer' || target.type === 'statement') {
          links.push({
            sourceId: source.id,
            targetId: target.id,
            relation: 'answered_by',
            weight: 0.8,
            metadata: { type: 'semantic' },
          });
          break; // Only link to first answer
        }
      }
    }

    // If this is a statement followed by code, create "explains" link
    if (source.type === 'statement') {
      for (let j = i + 1; j < Math.min(i + 3, acus.length); j++) {
        const target = acus[j];
        if (target.type === 'code_snippet') {
          links.push({
            sourceId: source.id,
            targetId: target.id,
            relation: 'explains',
            weight: 0.9,
            metadata: { type: 'semantic' },
          });
          break;
        }
      }
    }
  }

  // Save links to database
  for (const link of links) {
    try {
      await getPrismaClient().acuLink.create({
        data: link,
      });
    } catch (error) {
      // Link might already exist
      if (!error.message.includes('Unique constraint')) {
        logger.error(`Failed to create ACU link: ${error.message}`, { link });
      }
    }
  }

  logger.info(`Created ${links.length} ACU links`);
  return links;
}

/**
 * Process all conversations in database
 * Useful for backfilling ACUs from existing data
 */
export async function processAllConversations(options = {}) {
  const {
    batchSize = 10,
    delayMs = 1000,
    ...processingOptions
  } = options;

  logger.info('Starting batch processing of all conversations');

  // Get all conversation IDs
  const conversations = await getPrismaClient().conversation.findMany({
    select: { id: true },
    orderBy: { capturedAt: 'desc' },
  });

  logger.info(`Found ${conversations.length} conversations to process`);

  const results = {
    total: conversations.length,
    successful: 0,
    failed: 0,
    errors: [],
  };

  // Process in batches
  for (let i = 0; i < conversations.length; i += batchSize) {
    const batch = conversations.slice(i, i + batchSize);
    
    logger.info(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(conversations.length / batchSize)}`);

    // Process batch in parallel
    const batchResults = await Promise.allSettled(
      batch.map(conv => processConversationToACUs(conv.id, processingOptions)),
    );

    // Collect results
    for (const result of batchResults) {
      if (result.status === 'fulfilled' && result.value.success) {
        results.successful++;
      } else {
        results.failed++;
        results.errors.push({
          conversationId: result.value?.conversationId,
          error: result.reason?.message || result.value?.error,
        });
      }
    }

    // Delay between batches to avoid overwhelming the system
    if (i + batchSize < conversations.length) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  logger.info('Batch processing complete', results);
  return results;
}

export default {
  processConversationToACUs,
  processAllConversations,
};
