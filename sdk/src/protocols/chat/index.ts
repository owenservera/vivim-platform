/**
 * VIVIM Chat Protocol Module
 * 
 * @see https://github.com/owenservera/assistant-ui-VIVIM
 * @see https://github.com/owenservera/tool-ui-VIVIM
 */

// Re-export all types
export * from './types.js';

// Protocol utilities
export { createMessage, extractTextContent, extractToolCalls } from './types.js';
export { validateMessage, serializeMessage, deserializeMessage } from './types.js';
