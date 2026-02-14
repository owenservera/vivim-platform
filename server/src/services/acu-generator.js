/**
 * ACU Generation Service
 *
 * Generates Atomic Chat Units from conversation messages.
 */

import { getPrismaClient } from '../lib/database.js';
import { logger } from '../lib/logger.js';
import crypto from 'crypto';

// ============================================================================
// ACU GENERATION
// ============================================================================

/**
 * Generate ACUs from a conversation's messages
 * @param {Object} conversation - The conversation object
 * @returns {Promise<Array>} Generated ACUs
 */
export async function generateACUsFromConversation(conversation) {
  const log = logger.child({ conversationId: conversation.id });
  const acus = [];

  try {
    // Get conversation ID
    const conversationId = conversation.id;
    
    // Get messages from conversation (they should already be saved)
    const savedConversation = await getPrismaClient().conversation.findUnique({
      where: { id: conversationId },
      include: { messages: true },
    });

    if (!savedConversation || !savedConversation.messages) {
      log.warn('Conversation or messages not found for ACU generation');
      return [];
    }

    // Generate ACU for each non-system message
    for (const message of savedConversation.messages) {
      // Skip system messages
      if (message.role === 'system') {
continue;
}

      // Extract content from parts
      const content = extractContent(message.parts);
      if (!content || content.trim().length === 0) {
continue;
}

      // Calculate quality score
      const qualityOverall = calculateQualityScore(content);

      // Classify ACU type
      const type = classifyACUType(content);

      // Create ACU ID based on content hash
      const acuId = generateACUId(conversationId, message.id, content);

      // Check if ACU already exists
      const existingACU = await getPrismaClient().atomicChatUnit.findUnique({
        where: { id: acuId },
      });

      if (existingACU) {
        log.debug({ acuId }, 'ACU already exists, skipping');
        continue;
      }

      // Create ACU record
      const authorDid = conversation.ownerId ? `user:${conversation.ownerId}` : 'did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK';
      
      const acu = {
        id: acuId,
        authorDid: authorDid,
        signature: Buffer.from('prisma-generated'), // Placeholder signature
        content: content.substring(0, 10000), // Limit content length
        language: detectLanguage(content),
        type: type,
        category: categorizeACU(content, type),
        origin: 'extraction',
        conversationId: conversationId,
        messageId: message.id,
        messageIndex: message.messageIndex || 0,
        provider: conversation.provider || 'unknown',
        model: conversation.model || null,
        sourceTimestamp: message.createdAt || new Date(),
        extractorVersion: 'prisma-fallback-v1',
        parserVersion: '1.0.0',
        qualityOverall: qualityOverall,
        contentRichness: calculateContentRichness(content),
        structuralIntegrity: calculateStructuralIntegrity(content),
        uniqueness: 50, // Default uniqueness score
        viewCount: 0,
        shareCount: 0,
        quoteCount: 0,
        rediscoveryScore: null,
        sharingPolicy: 'self',
        sharingCircles: [],
        canView: true,
        canAnnotate: false,
        canRemix: false,
        canReshare: false,
        metadata: {
          generatedBy: 'prisma-fallback',
          messageRole: message.role,
          originalLength: content.length,
        },
      };

      acus.push(acu);
    }

    log.info({ acuCount: acus.length }, 'Generated ACUs from conversation');
    return acus;
  } catch (error) {
    log.error({ error: error.message }, 'Failed to generate ACUs');
    throw error;
  }
}

/**
 * Save ACUs to database
 * @param {Array} acus - Array of ACU objects
 * @returns {Promise<number>} Number of ACUs saved
 */
export async function saveACUs(acus) {
  if (!acus || acus.length === 0) {
return 0;
}

  let savedCount = 0;
  
  for (const acu of acus) {
    try {
      await getPrismaClient().atomicChatUnit.create({
        data: acu,
      });
      savedCount++;
    } catch (error) {
      // Ignore unique constraint violations (ACU already exists)
      if (error.code === 'P2002') {
        logger.debug({ acuId: acu.id }, 'ACU already exists, skipping');
      } else {
        logger.error({ error: error.message, acuId: acu.id }, 'Failed to save ACU');
      }
    }
  }

  logger.info({ savedCount, total: acus.length }, 'Saved ACUs to database');
  return savedCount;
}

/**
 * Generate and save ACUs for a conversation
 * @param {Object} conversation - The conversation object
 * @returns {Promise<Object>} Result with count of ACUs created
 */
export async function generateAndSaveACUs(conversation) {
  const log = logger.child({ conversationId: conversation.id });
  
  try {
    const prisma = getPrismaClient();

    // Delete existing ACUs for this conversation to prevent duplicates/stale data on update
    await prisma.atomicChatUnit.deleteMany({
      where: { conversationId: conversation.id },
    });
    log.info('Deleted existing ACUs for conversation update');

    // Generate ACUs
    const acus = await generateACUsFromConversation(conversation);
    
    if (acus.length === 0) {
      log.info('No ACUs generated for conversation');
      return { success: true, count: 0 };
    }

    // Save ACUs
    const savedCount = await saveACUs(acus);
    
    log.info({ generated: acus.length, saved: savedCount }, 'ACU generation complete');
    
    return {
      success: true,
      count: savedCount,
      acus: acus.map(a => a.id),
    };
  } catch (error) {
    log.error({ error: error.message }, 'ACU generation failed');
    return { success: false, error: error.message, count: 0 };
  }
}

// ============================================================================
// CONTENT EXTRACTION
// ============================================================================

/**
 * Extract text content from message parts
 * @param {Array|Object} parts - Message parts (JSONB)
 * @returns {string} Extracted text content
 */
function extractContent(parts) {
  if (!parts) {
return '';
}
  
  // If parts is a string, return it directly
  if (typeof parts === 'string') {
return parts;
}
  
  // If parts is an array, process each part
  if (Array.isArray(parts)) {
    return parts.map(part => {
      if (typeof part === 'string') {
return part;
}
      if (part.content) {
return part.content;
}
      if (part.text) {
return part.text;
}
      return '';
    }).join('\n');
  }
  
  // If parts is an object
  if (parts.content) {
return parts.content;
}
  if (parts.text) {
return parts.text;
}
  
  return '';
}

// ============================================================================
// QUALITY SCORING
// ============================================================================

/**
 * Calculate quality score for content
 * @param {string} content - The content to score
 * @returns {number} Quality score (0-100)
 */
function calculateQualityScore(content) {
  let score = 50; // Base score
  
  const wordCount = content.split(/\s+/).filter(w => w.length > 0).length;
  
  // Length bonus (up to 20 points)
  score += Math.min(wordCount / 10, 20);
  
  // Code content bonus (up to 15 points)
  if (content.includes('```') || /(function|class|def |const|let|var)\s+\w+/.test(content)) {
    score += 15;
  }
  
  // Question bonus (up to 10 points)
  if (content.includes('?')) {
    score += 10;
  }
  
  // Length quality bonus (up to 10 points)
  if (content.length > 200) {
    score += 10;
  } else if (content.length > 100) {
    score += 5;
  }
  
  // Rich content bonus
  if (content.includes('```')) {
score += 5;
}
  if (/\$\$.*?\$\$/.test(content)) {
score += 5;
} // LaTeX
  if (/\|.*\|/.test(content) && content.includes('\n')) {
score += 5;
} // Tables
  
  // Cap at 100
  return Math.min(Math.round(score), 100);
}

/**
 * Calculate content richness score
 * @param {string} content - The content
 * @returns {number} Richness score (0-100)
 */
function calculateContentRichness(content) {
  let score = 30; // Base score
  
  const wordCount = content.split(/\s+/).filter(w => w.length > 0).length;
  
  // Length factor
  if (wordCount > 50) {
score += 20;
}
  if (wordCount > 100) {
score += 15;
}
  if (wordCount > 200) {
score += 10;
}
  
  // Format diversity
  if (content.includes('```')) {
score += 10;
}
  if (content.includes('**') || content.includes('__')) {
score += 5;
}
  if (content.includes('`')) {
score += 5;
}
  if (content.includes('[') && content.includes('](')) {
score += 5;
}
  
  return Math.min(score, 100);
}

/**
 * Calculate structural integrity score
 * @param {string} content - The content
 * @returns {number} Integrity score (0-100)
 */
function calculateStructuralIntegrity(content) {
  let score = 70; // Base score
  
  // Penalize very short content
  if (content.length < 20) {
score -= 20;
}
  
  // Penalize content with many special characters (might be garbled)
  const specialCharRatio = (content.match(/[^\w\s.,!?;:'"()-]/g) || []).length / content.length;
  if (specialCharRatio > 0.3) {
score -= 15;
}
  
  // Bonus for proper sentence structure
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
  if (sentences.length > 2) {
score += 10;
}
  
  return Math.min(Math.max(score, 0), 100);
}

// ============================================================================
// CLASSIFICATION
// ============================================================================

/**
 * Classify ACU type based on content
 * @param {string} content - The content
 * @returns {string} ACU type
 */
function classifyACUType(content) {
  const lowerContent = content.toLowerCase();
  
  // Code detection
  if (content.includes('```') || /^(function|class|def |const|let|var|import|from)\s+/m.test(content)) {
    return 'code_snippet';
  }
  
  // Question detection
  if (content.includes('?') && (/\b(what|how|why|when|where|who|which|can|could|would|will)\b/i.test(lowerContent))) {
    return 'question';
  }
  
  // Answer detection
  if (/\b(the answer|therefore|in conclusion|to summarize|in summary)\b/i.test(lowerContent)) {
    return 'answer';
  }
  
  // Formula detection
  if (/\$\$.*?\$\$/.test(content) || /\\\[.*?\\\]/.test(content)) {
    return 'formula';
  }
  
  // Table detection
  if (/\|.*\|/.test(content) && content.includes('\n')) {
    return 'table';
  }
  
  // Image reference detection
  if (/!\[.*?\]\(.*?\)/.test(content) || /\b(image|picture|screenshot|diagram)\b/i.test(lowerContent)) {
    return 'image_reference';
  }
  
  // Tool use detection
  if (/\b(tool|function call|api call|execute)\b/i.test(lowerContent) && content.includes('`')) {
    return 'tool_use';
  }
  
  // Short thought (less than 140 chars, no question)
  if (content.length < 140 && !content.includes('?')) {
    return 'thought';
  }
  
  // Default to note for longer content
  return 'statement';
}

/**
 * Categorize ACU into high-level category
 * @param {string} content - The content
 * @param {string} type - The ACU type
 * @returns {string} Category
 */
function categorizeACU(content, type) {
  const lowerContent = content.toLowerCase();
  
  // Technical content
  if (type === 'code_snippet' || 
      /\b(code|programming|developer|software|api|database|server|function|class)\b/i.test(lowerContent)) {
    return 'technical';
  }
  
  // Procedural content
  if (type === 'question' || 
      /\b(step|guide|tutorial|how to|instruction|process|procedure)\b/i.test(lowerContent)) {
    return 'procedural';
  }
  
  // Personal content
  if (/\b(I think|I feel|my experience|in my opinion|personally)\b/i.test(lowerContent)) {
    return 'personal';
  }
  
  // Creative content (poetry, stories, metaphors)
  if (type === 'thought' || 
      /\b(poem|story|metaphor|imagine|dream|create|artistic)\b/i.test(lowerContent)) {
    return 'creative';
  }
  
  return 'conceptual';
}

/**
 * Detect programming language from content
 * @param {string} content - The content
 * @returns {string|null} Language or null
 */
function detectLanguage(content) {
  if (!content.includes('```')) {
return null;
}
  
  const codeBlockMatch = content.match(/```(\w+)/);
  if (codeBlockMatch) {
    const lang = codeBlockMatch[1].toLowerCase();
    const validLangs = ['javascript', 'typescript', 'python', 'java', 'cpp', 'c', 'go', 'rust', 'ruby', 'php', 'swift', 'kotlin', 'sql', 'html', 'css', 'json', 'yaml', 'xml', 'bash', 'shell', 'powershell'];
    if (validLangs.includes(lang)) {
return lang;
}
  }
  
  return null;
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Generate unique ACU ID based on content
 * @param {string} conversationId - Conversation ID
 * @param {string} messageId - Message ID
 * @param {string} content - Content
 * @returns {string} Unique ACU ID
 */
function generateACUId(conversationId, messageId, content) {
  const hash = crypto.createHash('sha256')
    .update(`${conversationId}:${messageId}:${content.substring(0, 500)}`)
    .digest('hex')
    .substring(0, 32);
  return `acu-${hash}`;
}

export default {
  generateACUsFromConversation,
  saveACUs,
  generateAndSaveACUs,
};
