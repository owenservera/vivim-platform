/**
 * Capture Routes
 *
 * API endpoints for capturing AI conversations with database persistence
 * Uses storage-adapter.js with Prisma/Postgres
 */

import { Router } from 'express';
import PQueue from 'p-queue';
import { createRequestLogger } from '../lib/logger.js';
import { ValidationError } from '../middleware/errorHandler.js';
import { validateRequest, captureRequestSchema, bulkCaptureRequestSchema, syncInitSchema } from '../validators/schemas.js';
import { extractConversation, detectProvider } from '../services/extractor.js';
import {
  getServerPqcPublicKey,
  kyberDecapsulate,
  symmetricDecrypt,
  symmetricEncrypt,
} from '../lib/crypto.js';
import {
  createCaptureAttempt,
  completeCaptureAttempt,
  findBySourceUrl,
} from '../repositories/index.js';
import {
  saveConversationUnified,
  findRecentSuccessfulUnified,
} from '../services/storage-adapter.js';
import { requireApiKey, authenticateDID, optionalAuth } from '../middleware/auth.js';
import { ticketStore } from '../services/ticketStore.js';
import { calculateMessageHash } from '../lib/crypto.js';
import { debugReporter } from '../services/debug-reporter.js';

const router = Router();

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Sanitize and format conversation for PWA ingestion
 * Ensures 'parts' are mapped to 'content' and hashes are valid for the final payload
 */
function prepareConversationForClient(conversation) {
  if (!conversation) {
    return null;
  }

  const messages = (conversation.messages || []).map((msg) => {
    const role = msg.role || 'assistant';
    const content = msg.content || msg.parts || [];
    const timestamp = msg.timestamp || msg.createdAt || new Date().toISOString();

    return {
      ...msg,
      role,
      content,
      timestamp,
      // Re-calculate hash on the FINAL content being sent to the witness
      contentHash: calculateMessageHash(role, content, timestamp),
    };
  });

  return {
    ...conversation,
    messages,
    metadata: {
      ...conversation.metadata,
      exportedAt: new Date().toISOString(),
      serverVersion: '2.0.0',
    },
  };
}

// ============================================================================
// QUANTUM HANDSHAKE
// ============================================================================

/**
 * POST /api/v1/handshake
 * Initiate Quantum-Resistant Zero-Moment Tunnel
 * NOTE: This endpoint does not require authentication to allow initial connection
 */
router.post('/handshake', (req, res) => {
  // CORS handled by global middleware or specific setup if needed
  res.json({
    status: 'success',
    publicKey: getServerPqcPublicKey(),
    algorithm: 'ML-KEM-1024 (Kyber)',
    timestamp: new Date().toISOString(),
  });
});

// ============================================================================
// HEALTH CHECK (VERSIONED)
// ============================================================================

/**
 * GET /api/v1/
 * Simple reachability check for versioned API
 */
router.get('/', (req, res) => {
  res.json({ status: 'ok', service: 'OpenScroll Capture API (v1)' });
});

// ============================================================================
// CAPTURE ENDPOINT
// ============================================================================

/**
 * POST /api/v1/capture
 *
 * Capture a conversation from an AI provider URL
 * Uses DID auth for user isolation, falls back to API key for dev
 */
router.post('/capture', async (req, res, next) => {
  const log = createRequestLogger(req);
  let attemptId = null;
  const startTime = Date.now();

  // Check if DID auth is available
  const hasDidAuth = req.headers['x-did'] || (req.headers['authorization'] || '').includes('did:');

  try {
    if (hasDidAuth) {
      // Use DID authentication
      await authenticateDID()(req, res, (err) => {
        if (err) {
          log.warn({ error: err.message }, 'DID auth failed');
        }
      });
    } else {
      // Fallback to API key for development
      try {
        await requireApiKey()(req, res, (err) => {
          if (err) {
            log.warn({ error: err.message }, 'API key auth failed');
          }
        });
      } catch (apiKeyErr) {
        // Continue without auth for dev mode
      }
    }
  } catch (authErr) {
    log.warn({ error: authErr.message }, 'Auth error, continuing...');
  }

  const userClient = req.user?.userClient;

  try {
    let requestBody = req.body;
    let sharedSecret = null;
    let url, options;

    // ----------------------------------------------------------------------
    // QUANTUM TUNNEL DECRYPTION
    // ----------------------------------------------------------------------
    if (req.body.pqcCiphertext && req.body.pqcPayload) {
      log.info('Secure Quantum Tunnel detected');
      sharedSecret = await kyberDecapsulate(req.body.pqcCiphertext);

      const decryptedStr = symmetricDecrypt(req.body.pqcPayload, req.body.pqcNonce, sharedSecret);

      if (!decryptedStr) {
        throw new Error('Quantum Tunnel Decryption Failed');
      }
      requestBody = JSON.parse(decryptedStr);
      console.log('\n🔐 [QUANTUM TUNNEL] Decrypted secure payload for extraction\n');
    } else {
      requestBody = req.body;
    }
    // ----------------------------------------------------------------------

    const validated = validateRequest(requestBody, captureRequestSchema);
    url = validated.url;
    options = validated.options;

    const { detectProvider } = await import('../services/extractor.js');

    console.log(`\n🔍 [EXTRACTION STARTED] Processing request for: ${url}`);
    console.log(`   Provider: ${detectProvider(url) || 'Unknown'}`);
    console.log(`   Options: ${JSON.stringify(options || {})}\n`);

    log.info({ url, options, userDid: req.user?.did }, 'Capture request validated');

    const useCache = options?.cache !== false;
    if (useCache) {
      try {
        const recentAttempt = await findRecentSuccessfulUnified(
          url,
          options?.cacheMinutes || 60,
          userClient
        );
        if (recentAttempt && recentAttempt.conversationId) {
          log.info(
            { conversationId: recentAttempt.conversationId },
            'Returning cached conversation'
          );
          console.log(`💾 [CACHE HIT] Returning cached data for: ${url}\n`);
          return res.json({
            status: 'success',
            cached: true,
            authenticated: true,
            userDid: req.user?.did,
            data: await findBySourceUrl(url, userClient),
          });
        }
      } catch (dbError) {
        log.warn({ error: dbError.message }, 'Failed to check cache, proceeding anyway');
        console.log('⚠️  [CACHE MISS] Cache unavailable, proceeding with fresh extraction\n');
      }
    }

    const provider = detectProvider(url);

    const extractionStartTime = Date.now();
    let conversation;
    try {
      conversation = await extractConversation(url, options);

      debugReporter.trackExtraction(
        provider,
        url,
        Date.now() - extractionStartTime,
        conversation?.messages?.length || 0,
        { userDid: req.user?.did, requestId: req.id }
      );

      log.info(
        {
          conversationId: conversation.id,
          provider: conversation.provider,
          messageCount: conversation.messages?.length || 0,
          userDid: req.user?.did,
        },
        'Conversation captured successfully'
      );
    } catch (dbError) {
      log.warn({ error: dbError.message }, 'Failed during extraction');
      throw dbError;
    }

    console.log(
      `✅ [EXTRACTION COMPLETE] Retrieved ${conversation?.messages?.length || 0} messages`
    );

    const saveStartTime = Date.now();
    try {
      // Stamp ownerId so this conversation is scoped to the authenticated user
      const validUserId = req.userId || req.user?.userId;
      if (validUserId) {
        conversation.ownerId = validUserId;
      }
      const saveResult = await saveConversationUnified(conversation, userClient);
      debugReporter.trackInfo(
        {
          category: 'save',
          message: `Conversation saved to ${saveResult.engine}`,
        },
        {
          engine: saveResult.engine,
          duration: Date.now() - saveStartTime,
          conversationId: conversation.id,
          userDid: req.user?.did,
        }
      );
      console.log(
        `💾 [DATABASE] Conversation saved to ${saveResult.engine} for user ${req.user?.did}`
      );

      if (attemptId) {
        await completeCaptureAttempt(
          attemptId,
          {
            status: 'success',
            duration: Date.now() - startTime,
            conversationId: conversation.id,
          },
          userClient
        );
        console.log(`✅ [ATTEMPT COMPLETED] Capture attempt ${attemptId} marked as successful\n`);
      }
    } catch (dbError) {
      debugReporter.trackError(dbError, {
        operation: 'saveConversationUnified',
        conversationId: conversation.id,
        userDid: req.user?.did,
        requestId: req.id,
      });
      log.warn({ error: dbError.message }, 'Failed to save conversation to DB');
      console.log(`⚠️  [DATABASE ERROR] Failed to save to database: ${dbError.message}\n`);
    }

    const responseData = {
      status: 'success',
      cached: false,
      authenticated: true,
      userDid: req.user?.did,
      data: prepareConversationForClient(conversation),
    };

    console.log(
      `🎯 [RESPONSE READY] Sending ${conversation.messages?.length || 0} messages to client\n`
    );

    if (sharedSecret) {
      const encrypted = symmetricEncrypt(JSON.stringify(responseData), sharedSecret);
      console.log('🔐 [QUANTUM ENCRYPT] Response encrypted for secure transmission\n');
      return res.json({
        status: 'success',
        pqcPayload: encrypted.ciphertext,
        pqcNonce: encrypted.nonce,
        quantumHardened: true,
        authenticated: true,
        userDid: req.user?.did,
      });
    }

    res.json(responseData);
  } catch (error) {
    debugReporter.trackError(error, {
      operation: 'extractConversation',
      provider: detectProvider(url),
      url,
      duration: Date.now() - startTime,
      userDid: req.user?.did,
      requestId: req.id,
    });

    console.log(`❌ [EXTRACTION FAILED] Error processing request: ${error.message}\n`);

    if (attemptId) {
      try {
        await completeCaptureAttempt(
          attemptId,
          {
            status: 'failed',
            duration: Date.now() - startTime,
            errorCode: error.code,
            errorMessage: error.message,
          },
          userClient
        );
      } catch (dbError) {
        log.warn({ error: dbError.message }, 'Failed to update capture attempt');
      }
    }
    next(error);
  }
});

/**
 * POST /api/v1/capture/bulk
 *
 * Capture multiple conversations from an AI provider URL efficiently
 * Limits parallel processing and ensures quantum safety is retained.
 */
router.post('/capture/bulk', optionalAuth, async (req, res, next) => {
  const log = createRequestLogger(req);
  const startTime = Date.now();

  const hasDidAuth = req.headers['x-did'] || (req.headers['authorization'] || '').includes('did:');
  try {
    if (hasDidAuth) {
      await authenticateDID()(req, res, (err) => {
        if (err) log.warn({ error: err.message }, 'DID auth failed');
      });
    } else {
      try {
        await requireApiKey()(req, res, (err) => {
          if (err) log.warn({ error: err.message }, 'API key auth failed');
        });
      } catch (authErr) {
        // Fallback for dev mode
      }
    }
  } catch (authErr) {
    log.warn({ error: authErr.message }, 'Auth error, continuing...');
  }

  const userClient = req.user?.userClient;

  try {
    let requestBody = req.body;
    let sharedSecret = null;

    if (req.body.pqcCiphertext && req.body.pqcPayload) {
      log.info('Secure Quantum Tunnel detected for bulk capture');
      sharedSecret = await kyberDecapsulate(req.body.pqcCiphertext);

      const decryptedStr = symmetricDecrypt(req.body.pqcPayload, req.body.pqcNonce, sharedSecret);

      if (!decryptedStr) {
        throw new Error('Quantum Tunnel Decryption Failed');
      }
      requestBody = JSON.parse(decryptedStr);
    }

    const validated = validateRequest(requestBody, bulkCaptureRequestSchema);
    const { urls, options } = validated;

    log.info({ count: urls.length, options, userDid: req.user?.did }, 'Bulk capture request validated');

    // Process queue with concurrency limit to prevent resource exhaustion (max 3 concurrent Playwright contexts)
    const queue = new PQueue({ concurrency: 3 });
    const { detectProvider, extractConversation } = await import('../services/extractor.js');

    const results = [];

    urls.forEach((url) => {
      queue.add(async () => {
        const itemResult = { url, status: 'pending', data: null, error: null };
        try {
          const useCache = options?.cache !== false;
          let cachedResult = null;
          if (useCache) {
            try {
              const recentAttempt = await findRecentSuccessfulUnified(url, options?.cacheMinutes || 60, userClient);
              if (recentAttempt && recentAttempt.conversationId) {
                console.log(`💾 [CACHE HIT] Returning cached data for bulk: ${url}`);
                cachedResult = await findBySourceUrl(url, userClient);
                if (cachedResult) {
                  itemResult.status = 'success';
                  itemResult.cached = true;
                  itemResult.data = prepareConversationForClient(cachedResult);
                  results.push(itemResult);
                  return;
                }
              }
            } catch (dbError) {
              log.warn({ error: dbError.message, url }, 'Failed to check cache for bulk item');
            }
          }

          const provider = detectProvider(url);
          console.log(`\n🔍 [BULK EXTRACTION] Processing: ${url}`);
          const extractionStartTime = Date.now();
          const conversation = await extractConversation(url, options);

          debugReporter.trackExtraction(provider, url, Date.now() - extractionStartTime, conversation?.messages?.length || 0, { userDid: req.user?.did });

          // Stamp ownerId so this conversation is scoped to the authenticated user
          const validUserId = req.userId || req.user?.userId;
          if (validUserId) {
            conversation.ownerId = validUserId;
          }

          await saveConversationUnified(conversation, userClient);

          console.log(`✅ [BULK COMPLETE] Retrieved ${conversation?.messages?.length || 0} messages for ${url}`);
          
          itemResult.status = 'success';
          itemResult.cached = false;
          itemResult.data = prepareConversationForClient(conversation);
        } catch (error) {
          console.log(`❌ [BULK FAILED] Error on ${url}: ${error.message}`);
          itemResult.status = 'error';
          itemResult.error = error.message;
        }
        results.push(itemResult);
      });
    });

    await queue.onIdle();

    const responseData = {
      status: 'success',
      authenticated: true,
      userDid: req.user?.did,
      duration: Date.now() - startTime,
      summary: {
        total: urls.length,
        successful: results.filter(r => r.status === 'success' && !r.cached).length,
        cached: results.filter(r => r.status === 'success' && r.cached).length,
        failed: results.filter(r => r.status === 'error').length
      },
      results,
    };

    if (sharedSecret) {
      const encrypted = symmetricEncrypt(JSON.stringify(responseData), sharedSecret);
      return res.json({
        status: 'success',
        pqcPayload: encrypted.ciphertext,
        pqcNonce: encrypted.nonce,
        quantumHardened: true,
        authenticated: true,
        userDid: req.user?.did,
      });
    }

    res.json(responseData);
  } catch (error) {
    log.error({ error: error.message }, 'Bulk capture failed entirely');
    next(error);
  }
});


/**
 * POST /api/v1/capture-sync/init
 *
 * Initialize a secure sync session.
 * Accepts PQC/Auth data and returns a short-lived ticket for the SSE connection.
 */
router.post('/capture-sync/init', requireApiKey(), async (req, res, next) => {
  try {
    const data = validateRequest(req.body, syncInitSchema);

    // Store the payload (url, crypto keys) in the ticket store
    const ticket = ticketStore.create(data);

    res.json({
      status: 'success',
      ticket,
      expiresIn: 30, // seconds
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/capture-sync
 *
 * High-fidelity real-time capture via Server-Sent Events (SSE)
 * Uses a ticket obtained from /capture-sync/init
 */
router.get('/capture-sync', async (req, res) => {
  const { ticket } = req.query;

  // Set SSE Headers immediately
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'Access-Control-Allow-Origin': '*', // Required for SSE to work across domains (e.g. PWA)
  });

  const sendEvent = (event, data) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  // Validate Ticket
  const ticketData = ticketStore.consume(ticket);

  if (!ticketData) {
    sendEvent('error', { message: 'Invalid or expired ticket' });
    res.end();
    return;
  }

  const { url: rawUrl } = ticketData;
  const targetUrl = rawUrl;


  // Setup heartbeat
  const heartbeat = setInterval(() => {
    res.write(': heartbeat\n\n');
  }, 15000);

  req.on('close', () => {
    clearInterval(heartbeat);
  });

  try {
    if (!targetUrl) {
      throw new Error('Missing target URL');
    }

    console.log(`\n🔄 [SYNC STARTED] Beginning real-time sync for: ${targetUrl}\n`);
    const conversation = await extractConversation(targetUrl, {
      onProgress: (update) => {
        sendEvent('progress', update);
      },
    });
    console.log(
      `\n✅ [SYNC COMPLETE] Successfully extracted ${conversation.messages?.length || 0} messages\n`
    );
    // DB Persistence in background (UNIFIED)
    saveConversationUnified(conversation)
      .then((res) => console.log(`💾 [BG SAVE] Saved to ${res.engine}`))
      .catch((err) => console.error('💾 [BG SAVE ERROR]:', err.message));
    sendEvent('complete', {
      ...prepareConversationForClient(conversation),
      authenticated: true,
    });
    console.log('📤 [STREAMING] Sent complete conversation to client\n');
    clearInterval(heartbeat);
    res.end();
  } catch (error) {
    clearInterval(heartbeat);
    console.log(`❌ [SYNC FAILED] Error in sync: ${error.message}\n`);
    sendEvent('sync-error', {
      message: error.message,
    });
    res.end();
  }
});

// ============================================================================
// PROVIDER DETECTION
// ============================================================================

router.get('/detect-provider', requireApiKey(), (req, res, next) => {
  const log = createRequestLogger(req);
  try {
    const { url } = req.query;
    if (!url || typeof url !== 'string') {
      throw new ValidationError('URL query parameter is required');
    }
    import('../services/extractor.js').then(({ detectProvider }) => {
      const provider = detectProvider(url);
      log.info({ url, provider }, 'Provider detection');
      res.json({ provider, supported: provider !== null });
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// SUPPORTED PROVIDERS
// ============================================================================

router.get('/providers', requireApiKey(), (req, res) => {
  const log = createRequestLogger(req);
  const providers = [
    'claude',
    'chatgpt',
    'gemini',
    'grok',
    'deepseek',
    'kimi',
    'qwen',
    'zai',
    'mistral',
  ];
  log.info({ providers }, 'Supported providers list');
  res.json({ providers, count: providers.length });
});

export { router as captureRouter };
