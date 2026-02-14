/**
 * Storage Adapter Service
 *
 * Uses Prisma/Postgres for all data persistence.
 * Handles post-processing pipelines like ACU generation and semantic analysis.
 */

import { createConversation as prismaCreate, findRecentSuccessfulAttempt } from '../repositories/index.js';
import { logger } from '../lib/logger.js';
import { generateAndSaveACUs } from './acu-generator.js';

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Save a conversation using Prisma/Postgres
 * @param {Object} conversation - The conversation object
 * @returns {Promise<Object>} Result with engine used info
 */
export async function saveConversationUnified(conversation) {
    const startTime = Date.now();
    const log = logger.child({ conversationId: conversation.id });

    try {
        log.debug('Saving via Prisma...');
        const savedConversation = await prismaCreate(conversation);

        // Generate ACUs from the saved conversation
        (async () => {
            try {
                const acuResult = await generateAndSaveACUs(savedConversation);
                if (acuResult.success && acuResult.count > 0) {
                    log.info({ acuCount: acuResult.count }, 'ACUs generated');
                }
            } catch (acuError) {
                log.warn({ error: acuError.message }, 'ACU generation failed (non-critical)');
            }
        })();

        log.info({ duration: Date.now() - startTime, engine: 'prisma' }, 'Conversation saved');
        return {
            success: true,
            engine: 'prisma',
            id: conversation.id,
        };
    } catch (error) {
        log.error({ error: error.message }, 'Storage failed');
        throw error;
    }
}

/**
 * Find recent successful capture for cache check
 * Uses Prisma
 */
export async function findRecentSuccessfulUnified(url, minutes = 60) {
    return findRecentSuccessfulAttempt(url, minutes);
}

export default {
    saveConversationUnified,
    findRecentSuccessfulUnified,
};
