/**
 * Import Schema Validators
 *
 * Comprehensive validation for imported conversations and messages
 */

import { logger } from '../lib/logger.js';

const log = logger.child({ service: 'import-validators' });

// Constants
const MAX_CONVERSATION_SIZE = 10000; // Maximum messages per conversation
const MAX_MESSAGE_SIZE = 100000; // Maximum characters per message
const MAX_TITLE_LENGTH = 500;
const MIN_TITLE_LENGTH = 1;

/**
 * Validation result
 */
class ValidationResult {
  constructor(valid = true, errors = [], warnings = []) {
    this.valid = valid;
    this.errors = errors;
    this.warnings = warnings;
  }

  addError(error) {
    this.errors.push(error);
    this.valid = false;
  }

  addWarning(warning) {
    this.warnings.push(warning);
  }

  merge(other) {
    this.valid = this.valid && other.valid;
    this.errors.push(...other.errors);
    this.warnings.push(...other.warnings);
  }
}

/**
 * Validate a complete conversation
 */
export function validateConversation(conversation) {
  const result = new ValidationResult();

  // Validate title
  if (!conversation.title) {
    result.addError('Conversation title is required');
  } else if (typeof conversation.title !== 'string') {
    result.addError('Conversation title must be a string');
  } else if (conversation.title.length < MIN_TITLE_LENGTH) {
    result.addError(`Conversation title must be at least ${MIN_TITLE_LENGTH} character`);
  } else if (conversation.title.length > MAX_TITLE_LENGTH) {
    result.addWarning(`Conversation title is very long (${conversation.title.length} characters)`);
  }

  // Validate provider
  if (!conversation.provider) {
    result.addError('Conversation provider is required');
  } else if (
!['chatgpt', 'claude', 'gemini', 'anthropic', 'openai'].includes(conversation.provider.toLowerCase())
) {
    result.addWarning(`Unknown provider: ${conversation.provider}`);
  }

  // Validate source URL
  if (!conversation.sourceUrl) {
    result.addError('Conversation sourceUrl is required');
  } else if (typeof conversation.sourceUrl !== 'string') {
    result.addError('Conversation sourceUrl must be a string');
  }

  // Validate createdAt
  if (!conversation.createdAt) {
    result.addError('Conversation createdAt is required');
  } else if (!(conversation.createdAt instanceof Date) && typeof conversation.createdAt !== 'string') {
    result.addError('Conversation createdAt must be a Date or ISO string');
  }

  // Validate messages array
  if (!Array.isArray(conversation.messages)) {
    result.addError('Conversation messages must be an array');
  } else if (conversation.messages.length === 0) {
    result.addError('Conversation must have at least one message');
  } else if (conversation.messages.length > MAX_CONVERSATION_SIZE) {
    result.addError(`Conversation exceeds maximum size of ${MAX_CONVERSATION_SIZE} messages`);
  } else {
    // Validate each message
    conversation.messages.forEach((msg, index) => {
      const msgResult = validateMessage(msg);
      result.merge(msgResult);
    });
  }

  // Validate message counts
  if (conversation.messageCount !== undefined && conversation.messageCount !== conversation.messages.length) {
    result.addWarning(`messageCount (${conversation.messageCount}) does not match actual messages (${conversation.messages.length})`);
  }

  if (conversation.userMessageCount !== undefined && conversation.userMessageCount !== conversation.messages.filter(m => m.role === 'user').length) {
    result.addWarning(`userMessageCount does not match actual user messages`);
  }

  if (conversation.aiMessageCount !== undefined && conversation.aiMessageCount !== conversation.messages.filter(m => m.role === 'assistant').length) {
    result.addWarning(`aiMessageCount does not match actual assistant messages`);
  }

  return result;
}

/**
 * Validate a single message
 */
export function validateMessage(message) {
  const result = new ValidationResult();

  // Validate role
  if (!message.role) {
    result.addError('Message role is required');
  } else if (
!['user', 'assistant', 'system', 'tool'].includes(message.role.toLowerCase())
) {
    result.addWarning(`Unknown message role: ${message.role}`);
  }

  // Validate createdAt
  if (!message.createdAt) {
    result.addError('Message createdAt is required');
  } else if (!(message.createdAt instanceof Date) && typeof message.createdAt !== 'string') {
    result.addError('Message createdAt must be a Date or ISO string');
  }

  // Validate parts
  if (!Array.isArray(message.parts)) {
    result.addError('Message parts must be an array');
  } else if (message.parts.length === 0) {
    result.addError('Message must have at least one part');
  } else {
    message.parts.forEach((part, index) => {
      const partResult = validateMessagePart(part);
      result.merge(partResult);
    });
  }

  // Validate messageIndex
  if (message.messageIndex !== undefined && typeof message.messageIndex !== 'number') {
    result.addError('Message messageIndex must be a number');
  }

  // Validate status
  if (message.status !== undefined &&
!['completed', 'pending', 'failed', 'processing'].includes(message.status.toLowerCase())
) {
    result.addWarning(`Unknown message status: ${message.status}`);
  }

  return result;
}

/**
 * Validate a message part
 */
export function validateMessagePart(part) {
  const result = new ValidationResult();

  // Validate type
  if (!part.type) {
    result.addError('Message part type is required');
  } else if (
!['text', 'code', 'image', 'tool_use', 'tool_result', 'thinking'].includes(part.type.toLowerCase())
) {
    result.addWarning(`Unknown message part type: ${part.type}`);
  }

  // Validate content
  if (!part.content && part.type !== 'tool_result') {
    result.addError('Message part content is required');
  } else if (part.content && typeof part.content !== 'string') {
    result.addError('Message part content must be a string');
  } else if (part.content && part.content.length > MAX_MESSAGE_SIZE) {
    result.addError(`Message part content exceeds maximum size of ${MAX_MESSAGE_SIZE} characters`);
  }

  // Validate code-specific fields
  if (part.type === 'code' && !part.language) {
    result.addWarning('Code part should specify a language');
  }

  // Validate image-specific fields
  if (part.type === 'image' && !part.content) {
    result.addError('Image part must have content (URL)');
  }

  return result;
}

/**
 * Validate ChatGPT export structure
 */
export function validateChatGPTExport(exportData) {
  const result = new ValidationResult();

  // Check if it's an array
  if (!Array.isArray(exportData)) {
    result.addError('ChatGPT export must be an array of conversations');
    return result;
  }

  if (exportData.length === 0) {
    result.addError('ChatGPT export is empty');
    return result;
  }

  // Validate each conversation
  exportData.forEach((conv, index) => {
    const convResult = validateChatGPTConversation(conv);
    result.merge(convResult);

    if (convResult.errors.length > 0) {
      log.warn({
        conversationIndex: index,
        conversationId: conv.conversation_id,
        errors: convResult.errors
      }, 'ChatGPT conversation validation failed');
    }
  });

  return result;
}

/**
 * Validate a single ChatGPT conversation
 */
function validateChatGPTConversation(conversation) {
  const result = new ValidationResult();

  // Validate required fields
  if (!conversation.conversation_id) {
    result.addError('ChatGPT conversation must have conversation_id');
  }

  if (!conversation.title) {
    result.addError('ChatGPT conversation must have title');
  }

  if (!conversation.create_time) {
    result.addError('ChatGPT conversation must have create_time');
  } else if (typeof conversation.create_time !== 'number') {
    result.addError('ChatGPT create_time must be a number (Unix timestamp)');
  }

  // Validate mapping
  if (!conversation.mapping) {
    result.addError('ChatGPT conversation must have mapping');
  } else if (typeof conversation.mapping !== 'object') {
    result.addError('ChatGPT mapping must be an object');
  }

  return result;
}

/**
 * Check for duplicate conversations using content hash
 */
export function checkForDuplicates(conversations, existingHashes = new Set()) {
  const duplicates = [];
  const newHashes = new Set();

  conversations.forEach(conv => {
    const hash = conv.contentHash || generateSimpleHash(conv);

    if (existingHashes.has(hash)) {
      duplicates.push({
        conversationId: conv.id,
        sourceUrl: conv.sourceUrl,
        title: conv.title,
        hash,
      });
    }

    newHashes.add(hash);
  });

  return { duplicates, allHashes: new Set([...existingHashes, ...newHashes]) };
}

/**
 * Generate a simple content hash for duplicate detection
 */
function generateSimpleHash(conversation) {
  const { createHash } = await import('crypto');

  const canonical = JSON.stringify({
    title: conversation.title,
    messageCount: conversation.messages?.length,
    firstMessage: conversation.messages?.[0]?.content?.substring(0, 100),
    lastMessage: conversation.messages?.[conversation.messages.length - 1]?.content?.substring(0, 100),
  });

  return createHash('sha256').update(canonical).digest('hex').substring(0, 32);
}

/**
 * Sanitize conversation data before storage
 */
export function sanitizeConversation(conversation) {
  const sanitized = {
    ...conversation,
  };

  // Sanitize title
  if (sanitized.title) {
    sanitized.title = sanitized.title.trim().substring(0, MAX_TITLE_LENGTH);
  }

  // Sanitize messages
  if (Array.isArray(sanitized.messages)) {
    sanitized.messages = sanitized.messages.map(msg => ({
      ...msg,
      parts: msg.parts?.map(part => ({
        ...part,
        content: part.content ? part.content.trim().substring(0, MAX_MESSAGE_SIZE) : null,
      })),
    }));
  }

  // Remove sensitive metadata
  delete sanitized.password;
  delete sanitized.token;
  delete sanitized.apiKey;
  delete sanitized.secret;

  return sanitized;
}

/**
 * Validate and sanitize conversation
 */
export function validateAndSanitize(conversation) {
  const validationResult = validateConversation(conversation);

  if (!validationResult.valid) {
    return {
      valid: false,
      errors: validationResult.errors,
      warnings: validationResult.warnings,
      conversation: null,
    };
  }

  const sanitized = sanitizeConversation(conversation);

  return {
    valid: true,
    errors: [],
    warnings: validationResult.warnings,
    conversation: sanitized,
  };
}

/**
 * Validate import configuration
 */
export function validateImportConfig(config) {
  const result = new ValidationResult();

  // Validate tierConfig
  if (!config.tierConfig) {
    result.addError('tierConfig is required');
  } else {
    if (!config.tierConfig.tier0) {
      result.addError('tierConfig.tier0 is required');
    }

    // Validate enabled flags are booleans
    ['tier0', 'tier1', 'tier2', 'tier3', 'tier4'].forEach(tier => {
      if (config.tierConfig[tier] && typeof config.tierConfig[tier].enabled !== 'boolean') {
        result.addError(`${tier}.enabled must be a boolean`);
      }
    });
  }

  // Validate intelligentOptions
  if (config.intelligentOptions) {
    if (typeof config.intelligentOptions.prioritizeRecent !== 'boolean') {
      result.addError('intelligentOptions.prioritizeRecent must be a boolean');
    }

    if (typeof config.intelligentOptions.parallelProcessing !== 'boolean') {
      result.addError('intelligentOptions.parallelProcessing must be a boolean');
    }

    if (config.intelligentOptions.maxConcurrency !== undefined &&
        typeof config.intelligentOptions.maxConcurrency !== 'number') {
      result.addError('intelligentOptions.maxConcurrency must be a number');
    }
  }

  return result;
}

export {
  ValidationResult,
};
export default {
  validateConversation,
  validateMessage,
  validateMessagePart,
  validateChatGPTExport,
  checkForDuplicates,
  sanitizeConversation,
  validateAndSanitize,
  validateImportConfig,
};
