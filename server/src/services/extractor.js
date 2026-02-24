/**
 * Conversation Extraction Service
 *
 * Routes extraction requests to provider-specific extractors
 * Optimized for 2025+ best practices with ES modules
 */

import { extractClaudeConversation } from '../extractors/extractor-claude.js';
import { extractChatgptConversation } from '../extractors/extractor-chatgpt.js';
import { extractGeminiConversation } from '../extractors/extractor-gemini.js';
import { extractGrokConversation } from '../extractors/extractor-grok.js';
import { extractKimiConversation } from '../extractors/extractor-kimi.js';
import { extractDeepseekConversation } from '../extractors/extractor-deepseek.js';
import { extractQwenConversation } from '../extractors/extractor-qwen.js';
import { extractZaiConversation } from '../extractors/extractor-zai.js';
import { extractMistralConversation } from '../extractors/extractor-mistral.js';
import { logger } from '../lib/logger.js';
import { ValidationError } from '../middleware/errorHandler.js';
import { calculateMessageHash } from '../lib/crypto.js';
import { ExtractionValidator } from './extraction-validator.js';

// ============================================================================
// PROVIDER PATTERN MATCHING (Optimized O(1) lookup)
// ============================================================================

const PROVIDER_PATTERNS = new Map([
  [/z\.ai|chat\.z\.ai/i, 'zai'],
  [/qwen\.ai|chat\.qwen\.ai/i, 'qwen'],
  [/mistral\.ai|chat\.mistral\.ai/i, 'mistral'],
  [/chatgpt|chat\.openai/i, 'chatgpt'],
  [/claude|anthropic/i, 'claude'],
  [/gemini|bard\.google/i, 'gemini'],
  [/grok/i, 'grok'],
  [/deepseek/i, 'deepseek'],
  [/kimi/i, 'kimi'],
]);

// Provider-specific extractors
const EXTRACTORS = {
  claude: extractClaudeConversation,
  chatgpt: extractChatgptConversation,
  gemini: extractGeminiConversation,
  grok: extractGrokConversation,
  kimi: extractKimiConversation,
  deepseek: extractDeepseekConversation,
  qwen: extractQwenConversation,
  zai: extractZaiConversation,
  mistral: extractMistralConversation,
};

// ============================================================================
// PROVIDER DETECTION
// ============================================================================

/**
 * Detect the AI provider from a URL
 * @param {string} url - The URL to analyze
 * @returns {string|null} The detected provider or null if unknown
 */
export function detectProvider(url) {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase();
    const pathname = parsed.pathname.toLowerCase();

    // Fast O(1) lookup using Map
    for (const [pattern, provider] of PROVIDER_PATTERNS) {
      if (pattern.test(hostname) || pattern.test(pathname)) {
        return provider;
      }
    }

    // Fallback: check for share path patterns
    if (pathname.includes('/share') || pathname.includes('/s/') || pathname.includes('/chat/')) {
      return 'other';
    }

    return null;
  } catch (error) {
    logger.warn({ error: error.message, url }, 'Provider detection failed');
    return null;
  }
}

// ============================================================================
// MAIN EXTRACTION FUNCTION
// ============================================================================

/**
 * Extract conversation from AI provider URL
 * @param {string} url - The share URL to extract from
 * @param {Object} options - Extraction options
 * @returns {Promise<Object>} The extracted conversation object
 */
export async function extractConversation(url, options = {}) {
  const {
    provider: forcedProvider,
    timeout = 60000,
    richFormatting = true,
    metadataOnly = false,
    headless = true,
    onProgress = () => {},
  } = options;

  const log = logger.child({ url, options: { timeout, richFormatting, metadataOnly } });

  onProgress({ phase: 'DETECTION', percent: 10, message: 'Detecting AI source fingerprints...' });
  log.info('Starting extraction');

  // Detect provider from URL if not explicitly provided
  const provider = forcedProvider || detectProvider(url);

  if (!provider) {
    onProgress({ phase: 'ERROR', percent: 0, message: 'Unknown intelligence source' });
    throw new ValidationError(
      `Unable to detect provider from URL. Supported providers: ${Object.keys(EXTRACTORS).join(', ')}`
    );
  }

  onProgress({
    phase: 'DETECTION',
    percent: 25,
    message: `Connected to ${provider.toUpperCase()}`,
  });
  log.info({ provider }, 'Provider detected');
  process.stdout.write(
    ` \x1b[33m[EXTRACT]\x1b[0m Provider: \x1b[1m${provider.toUpperCase()}\x1b[0m\n`
  );

  // Check if provider is supported
  const extractor = EXTRACTORS[provider];
  if (!extractor) {
    onProgress({ phase: 'ERROR', percent: 0, message: 'Provider protocol not supported' });
    throw new ValidationError(`Provider not supported: ${provider}`);
  }

  // Execute extraction
  try {
    onProgress({
      phase: 'FETCHING',
      percent: 40,
      message: 'Downloading neural knowledge graph...',
    });
    process.stdout.write(' \x1b[33m[EXTRACT]\x1b[0m Fetching content...\n');

    const rawConversation = await extractor(url, {
      timeout,
      richFormatting,
      metadataOnly,
      headless,
      onStep: (stepMsg) => onProgress({ phase: 'EXTRACTION', percent: 65, message: stepMsg }),
    });

    // Validate extraction result
    onProgress({ phase: 'VALIDATION', percent: 75, message: 'Validating extraction integrity...' });
    const validation = ExtractionValidator.validate(rawConversation, provider);

    if (!validation.valid) {
      log.error({ errors: validation.errors }, 'Extraction validation failed');
      throw new ValidationError(
        `Extraction produced invalid result: ${validation.errors.join(', ')}`
      );
    }

    // Normalize to standard format
    onProgress({
      phase: 'NORMALIZATION',
      percent: 80,
      message: 'Normalizing conversation structure...',
    });
    const conversation = ExtractionValidator.normalize(rawConversation, provider);

    // ----------------------------------------------------------------------
    // QUANTUM HARDENING (Zero-Trust Witness)
    // ----------------------------------------------------------------------
    onProgress({
      phase: 'SIGNING',
      percent: 90,
      message: 'Generating Quantum-Resistant signatures...',
    });

    if (conversation.messages && Array.isArray(conversation.messages)) {
      conversation.messages.forEach((msg) => {
        // Ensure timestamp exists for hashing
        if (!msg.timestamp) {
          msg.timestamp = new Date().toISOString();
        }
        // Calculate SHA-3 hash so PWA can verify integrity
        msg.contentHash = calculateMessageHash(msg.role, msg.content, msg.timestamp, msg.parts);
      });
      process.stdout.write(
        ' \x1b[33m[EXTRACT]\x1b[0m \x1b[36mQuantum signatures generated (SHA-3)\x1b[0m\n'
      );
    }
    // ----------------------------------------------------------------------

    const msgCount = conversation.messages?.length || 0;
    onProgress({
      phase: 'COMPLETED',
      percent: 100,
      message: `Captured ${msgCount} blocks successfully`,
    });
    process.stdout.write(
      ` \x1b[33m[EXTRACT]\x1b[0m Complete: \x1b[32m${msgCount} messages\x1b[0m (\x1b[1m${conversation.title?.slice(0, 30)}...\x1b[0m)\n`
    );

    log.info(
      {
        conversationId: conversation.id,
        provider: conversation.provider,
        messageCount: msgCount,
        warnings: validation.warnings,
      },
      'Extraction completed successfully'
    );

    return conversation;
  } catch (error) {
    onProgress({ phase: 'ERROR', percent: 0, message: error.message });
    log.error({ error: error.message, provider }, 'Extraction failed');
    throw error;
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export { EXTRACTORS };
