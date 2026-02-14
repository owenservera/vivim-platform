/**
 * Capture Routes
 *
 * API endpoints for capturing AI conversations with database persistence
 * Uses storage-adapter.js with Prisma/Postgres
 */

import { Router } from 'express';
import { createRequestLogger } from '../lib/logger.js';
import { ValidationError } from '../middleware/errorHandler.js';
import { validateRequest, captureRequestSchema, syncInitSchema } from '../validators/schemas.js';
import { extractConversation } from '../services/extractor.js';
import { getServerPqcPublicKey, kyberDecapsulate, symmetricDecrypt, symmetricEncrypt } from '../lib/crypto.js';
import {
  createCaptureAttempt,
  completeCaptureAttempt,
  findBySourceUrl,
} from '../repositories/index.js';
import { saveConversationUnified, findRecentSuccessfulUnified } from '../services/storage-adapter.js';
import { requireApiKey } from '../middleware/auth.js';
import { ticketStore } from '../services/ticketStore.js';
import { calculateMessageHash } from '../lib/crypto.js';

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

  const messages = (conversation.messages || []).map(msg => {
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
 */
router.post('/capture', requireApiKey(), async (req, res, next) => {
  const log = createRequestLogger(req);
  let attemptId = null;
  const startTime = Date.now();

  try {
    let requestBody = req.body;
    let sharedSecret = null;

    // ---------------------------------------------------------------------- 
    // QUANTUM TUNNEL DECRYPTION
    // ---------------------------------------------------------------------- 
    if (req.body.pqcCiphertext && req.body.pqcPayload) {
        log.info('Secure Quantum Tunnel detected');
        sharedSecret = await kyberDecapsulate(req.body.pqcCiphertext);

        const decryptedStr = symmetricDecrypt(
            req.body.pqcPayload,
            req.body.pqcNonce,
            sharedSecret,
        );

        if (!decryptedStr) {
throw new Error('Quantum Tunnel Decryption Failed');
}
        requestBody = JSON.parse(decryptedStr);
        console.log('\n🔐 [QUANTUM TUNNEL] Decrypted secure payload for extraction\n');
    } else {
        // Plaintext fallback for Dev Mode / POC
        requestBody = req.body;
    }
    // ---------------------------------------------------------------------- 

    // Validate request body (original or decrypted)
    const { url, options } = validateRequest(requestBody, captureRequestSchema);
    
    // Import dynamic
    const { detectProvider } = await import('../services/extractor.js');

    console.log(`\n🔍 [EXTRACTION STARTED] Processing request for: ${url}`);
    console.log(`   Provider: ${detectProvider(url) || 'Unknown'}`);
    console.log(`   Options: ${JSON.stringify(options || {})}\n`);

    log.info({ url, options, authenticated: req.auth?.isAuthenticated }, 'Capture request validated');

    // DB: Check cache (fail-safe) - UNIFIED
    const useCache = options?.cache !== false;
    if (useCache) {
      try {
        const recentAttempt = await findRecentSuccessfulUnified(url, options?.cacheMinutes || 60);
        if (recentAttempt && recentAttempt.conversationId) {
          log.info({ conversationId: recentAttempt.conversationId, engine: recentAttempt.engine }, 'Returning cached conversation');
          console.log(`💾 [CACHE HIT] Returning cached data for: ${url}\n`);
          return res.json({
            status: 'success',
            cached: true,
            authenticated: req.auth?.isAuthenticated || false,
            data: await findBySourceUrl(url),
          });
        }
      } catch (dbError) {
        log.warn({ error: dbError.message }, 'Failed to check cache (DB might be down), proceeding anyway');
        console.log('⚠️  [CACHE MISS] Cache unavailable, proceeding with fresh extraction\n');
      }
    }

    // DB: Create capture attempt
    const provider = detectProvider(url);
    try {
      const attempt = await createCaptureAttempt({
        sourceUrl: url,
        provider,
        status: 'pending',
        startedAt: new Date(),
        ipAddress: req.ip,
      });
      attemptId = attempt.id;
      console.log(`📋 [ATTEMPT LOGGED] Capture attempt ID: ${attemptId}\n`);
    } catch (dbError) {
      log.warn({ error: dbError.message }, 'Failed to create capture attempt record (DB might be down)');
    }

    // Execute extraction
    console.log(`🚀 [EXTRACTION] Starting content extraction from: ${url}`);
    const conversation = await extractConversation(url, options);

    log.info(
      {
        conversationId: conversation.id,
        provider: conversation.provider,
        messageCount: conversation.messages?.length || 0,
      },
      'Conversation captured successfully',
    );

    console.log(`✅ [EXTRACTION COMPLETE] Retrieved ${conversation.messages?.length || 0} messages`);

    // DB: Save to database (fail-safe + UNIFIED STORAGE)
    try {
      const saveResult = await saveConversationUnified(conversation);
      console.log(`💾 [DATABASE] Conversation saved to ${saveResult.engine}`);

      if (attemptId) {
        await completeCaptureAttempt(attemptId, {
          status: 'success',
          duration: Date.now() - startTime,
          conversationId: conversation.id,
        });
        console.log(`✅ [ATTEMPT COMPLETED] Capture attempt ${attemptId} marked as successful\n`);
      }
    } catch (dbError) {
      log.warn({ error: dbError.message }, 'Failed to save conversation to DB (returning result anyway)');
      console.log(`⚠️  [DATABASE ERROR] Failed to save to database: ${dbError.message}\n`);
    }

    const responseData = {
      status: 'success',
      cached: false,
      authenticated: req.auth?.isAuthenticated || false,
      data: prepareConversationForClient(conversation),
    };

    console.log(`🎯 [RESPONSE READY] Sending ${conversation.messages?.length || 0} messages to client\n`);

    // ---------------------------------------------------------------------- 
    // QUANTUM TUNNEL ENCRYPTION
    // ---------------------------------------------------------------------- 
    if (sharedSecret) {
        const encrypted = symmetricEncrypt(JSON.stringify(responseData), sharedSecret);
        console.log('🔐 [QUANTUM ENCRYPT] Response encrypted for secure transmission\n');
        return res.json({
            status: 'success',
            pqcPayload: encrypted.ciphertext,
            pqcNonce: encrypted.nonce,
            quantumHardened: true,
            authenticated: req.auth?.isAuthenticated || false,
        });
    }
    // ---------------------------------------------------------------------- 

    // Return success response
    res.json(responseData);
  } catch (error) {
    console.log(`❌ [EXTRACTION FAILED] Error processing request: ${error.message}\n`);

    // Complete capture attempt with failure (fail-safe)
    if (attemptId) {
      try {
        await completeCaptureAttempt(attemptId, {
          status: 'failed',
          duration: Date.now() - startTime,
          errorCode: error.code,
          errorMessage: error.message,
        });
      } catch (dbError) {
        log.warn({ error: dbError.message }, 'Failed to update capture attempt');
      }
    }

    // Pass to error handler
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
    'Connection': 'keep-alive',
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

  const { pqcCiphertext, pqcPayload, pqcNonce, url: rawUrl } = ticketData;
  let targetUrl = rawUrl;
  let sharedSecret = null;

  // Setup heartbeat
  const heartbeat = setInterval(() => {
    res.write(': heartbeat\n\n');
  }, 15000);

  // Encrypted Sender
  const sendEncryptedEvent = (event, data) => {
    let payload = data;
    if (sharedSecret) {
        const encrypted = symmetricEncrypt(JSON.stringify(data), sharedSecret);
        payload = {
            pqcPayload: encrypted.ciphertext,
            pqcNonce: encrypted.nonce,
            quantumHardened: true,
        };
    }
    res.write(`event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`);
  };

  req.on('close', () => {
    clearInterval(heartbeat);
  });

  try {
    // ---------------------------------------------------------------------- 
    // QUANTUM TUNNEL DECRYPTION (Ticket version)
    // ---------------------------------------------------------------------- 
    if (pqcCiphertext && pqcPayload) {
        try {
          sharedSecret = await kyberDecapsulate(pqcCiphertext);
        } catch (kemError) {
          console.error(`❌ [SYNC FAILED] KEM Decapsulation error: ${kemError.message}`);
          throw new Error('Quantum Tunnel Handshake Failed');
        }

        const decryptedUrl = symmetricDecrypt(pqcPayload, pqcNonce, sharedSecret);
        if (!decryptedUrl) {
          console.error('❌ [SYNC FAILED] Symmetric decryption failed for payload');
          throw new Error('Quantum Tunnel Decryption Failed');
        }

        try {
          targetUrl = JSON.parse(decryptedUrl).url;
        } catch (jsonError) {
          console.error('❌ [SYNC FAILED] Invalid JSON in decrypted payload');
          throw new Error('Quantum Tunnel Payload Corrupt');
        }

        console.log('\n🔐 [QUANTUM TUNNEL] Streaming via Post-Quantum Secure Channel\n');
    }
    // ---------------------------------------------------------------------- 

    if (!targetUrl) {
throw new Error('Missing target URL');
}

    console.log(`\n🔄 [SYNC STARTED] Beginning real-time sync for: ${targetUrl}\n`);

    const conversation = await extractConversation(targetUrl, {
      onProgress: (update) => {
        sendEncryptedEvent('progress', update);
      },
    });

    console.log(`\n✅ [SYNC COMPLETE] Successfully extracted ${conversation.messages?.length || 0} messages\n`);

    // DB Persistence in background (UNIFIED)
    saveConversationUnified(conversation)
      .then(res => console.log(`💾 [BG SAVE] Saved to ${res.engine}`))
      .catch(err => console.error('💾 [BG SAVE ERROR]:', err.message));

    // Send complete
    sendEncryptedEvent('complete', {
      ...prepareConversationForClient(conversation),
      authenticated: true, // If they got a ticket, they passed auth in /init
    });
    
    console.log('📤 [STREAMING] Sent complete conversation to client\n');
    clearInterval(heartbeat);
    res.end();
  } catch (error) {
    clearInterval(heartbeat);
    console.log(`❌ [SYNC FAILED] Error in sync: ${error.message}\n`);
    sendEncryptedEvent('sync-error', {
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
  const providers = ['claude', 'chatgpt', 'gemini', 'grok', 'deepseek', 'kimi', 'qwen', 'zai', 'mistral'];
  log.info({ providers }, 'Supported providers list');
  res.json({ providers, count: providers.length });
});

export { router as captureRouter };