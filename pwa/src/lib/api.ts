import type { Conversation } from '../types/conversation';
import { log } from './logger';
import { kyberEncapsulate, symmetricEncrypt, symmetricDecrypt, sha256 } from './storage-v2/crypto';

// Basic configuration from Meta environment variables
// Supports dynamic override via localStorage to avoid "stone age" rebuild cycles
const getApiBaseUrl = () => {
  const override = typeof localStorage !== 'undefined' ? localStorage.getItem('OPENSCROLL_API_OVERRIDE') : null;
  const baseUrl = override || import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';
  // Standardize: strip any trailing slashes and version prefixes, then re-add /api/v1
  const root = baseUrl.replace(/\/api\/v1\/?$/, '').replace(/\/api\/?$/, '').replace(/\/$/, '');
  return `${root}/api/v1`;
};

// Get API key from environment or localStorage
const getApiKey = () => {
  // Check localStorage first for user-defined API key
  const storedApiKey = typeof localStorage !== 'undefined' ? localStorage.getItem('OPENSCROLL_API_KEY') : null;
  if (storedApiKey) {
    return storedApiKey;
  }

  // Then check environment variable
  const envApiKey = import.meta.env.VITE_API_KEY || import.meta.env.REACT_APP_API_KEY;
  if (envApiKey) {
    return envApiKey;
  }

  return null; // No default key for production safety
};

const API_BASE_URL = getApiBaseUrl();

/**
 * Perform Post-Quantum Handshake with server
 * Returns shared secret and encapsulated ciphertext
 */
async function performHandshake() {
    log.api.info('Initiating Post-Quantum Handshake...');
    const apiKey = getApiKey();
    if (!apiKey) throw new Error('API Key required for handshake');

    const response = await fetch(`${API_BASE_URL}/handshake`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'X-API-Key': apiKey
        },
        mode: 'cors'
    });
    
    if (!response.ok) {
        throw new Error(`Handshake failed: ${response.status}`);
    }
    
    const { publicKey } = await response.json();

    log.api.debug('Server PQC Public Key received, encapsulating...');
    return kyberEncapsulate(publicKey);
}

/**
 * Capture a conversation from a share URL (Quantum Hardened)
 * @param url - The share URL to extract from
 * @returns Schema-compliant conversation data
 * @throws Error if capture fails
 */
export async function captureUrl(url: string): Promise<Conversation> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('Authentication required: Please configure your API Key');
  }

  const apiBaseUrl = getApiBaseUrl();
  // Try multiple endpoints for resilience
  const endpoints = [
    apiBaseUrl,
    'http://localhost:3000/api/v1',
    'http://127.0.0.1:3000/api/v1'
  ];

  let lastError: Error | null = null;

  for (const baseUrl of endpoints) {
    const endpoint = `${baseUrl.replace(/\/$/, '')}/capture`;
    log.api.info(`Attempting Quantum Tunnel for: ${endpoint}`);

    try {
      // 1. Establish Zero-Moment Tunnel
      const { sharedSecret, ciphertext: pqcCiphertext } = await performHandshake();

      // 2. Encrypt Payload & Generate Integrity Hash
      const contentHash = await sha256(url);
      const payload = JSON.stringify({ url, contentHash, timestamp: new Date().toISOString() });
      const encrypted = symmetricEncrypt(payload, sharedSecret);

      // 3. Send Encrypted Request with API key
      const response = await fetch(`${baseUrl}/capture`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'X-API-Key': apiKey,
          'X-Content-Hash': contentHash
        },
        mode: 'cors',
        body: JSON.stringify({
          pqcCiphertext,
          pqcPayload: encrypted.ciphertext,
          pqcNonce: encrypted.nonce
        }),
      });

      log.api.debug(`Response status: ${response.status} (Quantum Tunnel)`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const error = new Error(errorData.message || `Capture failed with status ${response.status}`);
        log.api.error('HTTP error', error, { status: response.status, errorData });
        throw error;
      }

      const result = await response.json();

      // 4. Decrypt Response
      let data;
      if (result.pqcPayload) {
          log.api.debug('Decrypting Quantum-Resistant result...');
          const decrypted = symmetricDecrypt(result.pqcPayload, result.pqcNonce, sharedSecret);
          if (!decrypted) throw new Error('Failed to decrypt server response');

          // Uint8Array to string
          const jsonStr = new TextDecoder().decode(decrypted);
          const decryptedResult = JSON.parse(jsonStr);
          data = decryptedResult.data;
      } else {
          data = result.data;
      }

      log.api.debug('Response received', { status: result.status, hasData: !!data });

      if (!data) {
        const error = new Error(result.message || 'Invalid response format from server');
        log.api.error('Invalid response format', error, result);
        throw error;
      }

      // Verify server-side content hash if provided
      if (result.contentHash && result.contentHash !== data.contentHash) {
        log.api.error('Data integrity check failed: Content hash mismatch');
        throw new Error('Data integrity violation: The received data was corrupted or tampered with.');
      }

      // Adapter: Transform server response to match PWA schema
      data.messages = data.messages.map((msg: Record<string, unknown>) => {
        let content = msg.content || msg.parts || [];

        // Normalize parts if it's an array
        if (Array.isArray(content)) {
          content = content.map((part: any) => ({
            ...part,
            language: part.metadata?.language || part.language,
            alt: part.metadata?.alt || part.alt,
            caption: part.metadata?.caption || part.metadata?.title,
            diagramType: part.metadata?.diagramType
          }));
        }

        return {
          ...msg,
          content,
          role: msg.role || ((msg.author as Record<string, unknown>)?.role === 'user' ? 'user' : 'assistant'),
        };
      });

      // Validate required fields
      const missing = [];
      if (!data.id) missing.push('id');
      if (!data.provider) missing.push('provider');
      if (!data.sourceUrl) missing.push('sourceUrl');
      if (!data.title) missing.push('title');
      if (!data.messages) missing.push('messages');

      if (missing.length > 0) {
        log.api.warn(`Server response missing fields: ${missing.join(', ')}`);
      }

      // Ensure stats exists
      if (!data.stats) {
        log.api.info('Stats missing, computing from messages');
        data.stats = {
          totalMessages: data.messages.length,
          totalWords: 0,
          totalCharacters: 0,
          firstMessageAt: data.createdAt,
          lastMessageAt: data.exportedAt
        };
      }

      log.api.info('Capture successful (Quantum Hardened)', {
        id: data.id,
        provider: data.provider,
        title: data.title,
        messageCount: data.messages.length
      });

      return data;
    } catch (error: unknown) {
      const err = error as Error;
      lastError = err;

      log.api.warn(`Failed to connect to ${baseUrl}: ${err.message}`);

      // Don't try other endpoints if it's not a network error
      if (err.message !== 'Failed to fetch' && !err.message.includes('Network')) {
        throw error;
      }

      // Continue to next endpoint
      continue;
    }
  }

  // If we got here, all endpoints failed
  if (lastError) {
    log.api.error('All endpoints failed. Network Request Failed. Possible causes:', lastError, {
      endpoints: endpoints,
      configuredBaseUrl: API_BASE_URL,
      suggestion: '1. Is Server Running? 2. Is VITE_API_BASE_URL correct? 3. Are you blocked by CORS? 4. Are you on the same Wifi?'
    });
    throw lastError;
  } else {
    const error = new Error('All endpoints failed - no server connection available');
    log.api.error('All endpoints failed', error, {
      endpoints: endpoints,
      suggestion: '1. Is Server Running? 2. Is VITE_API_BASE_URL correct? 3. Are you blocked by CORS? 4. Are you on the same Wifi?'
    });
    throw error;
  }
}


/**
 * Health check for the capture API
 */
export async function healthCheck(): Promise<{ status: string; service: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/`, {
      headers: {
        'Authorization': `Bearer ${getApiKey()}`,
        'X-API-Key': getApiKey()
      }
    });
    const result = await response.json();
    log.api.debug('Health check result', result);
    return result;
  } catch (error) {
    log.api.error('Health check failed', error as Error);
    throw error;
  }
}

/**
 * Capture a conversation with real-time "Full Sync" updates (Quantum Hardened)
 * @param url - Target URL
 * @param onProgress - Callback for granular server steps
 */
export async function captureUrlStream(
  url: string,
  onProgress: (update: { percent: number; message: string; phase: string }) => void
): Promise<Conversation> {
  const apiBaseUrl = getApiBaseUrl();
  const endpoints = [
    apiBaseUrl,
    'http://localhost:3000/api/v1',
    'http://127.0.0.1:3000/api/v1'
  ];

  // 1. Establish Zero-Moment Tunnel
  const { sharedSecret, ciphertext: pqcCiphertext } = await performHandshake();

  // 2. Encrypt URL for the tunnel
  const payload = JSON.stringify({ url });
  const encrypted = symmetricEncrypt(payload, sharedSecret);

  // 3. Get a ticket from the server (required for SSE)
  const initData = {
    pqcCiphertext,
    pqcPayload: encrypted.ciphertext,
    pqcNonce: encrypted.nonce,
    url
  };

  return new Promise((resolve, reject) => {
    let connected = false;
    let currentIndex = 0;

    const attemptConnection = async () => {
      if (currentIndex >= endpoints.length) {
        reject(new Error('All endpoints failed - no server connection available'));
        return;
      }

      const baseUrl = endpoints[currentIndex];

      try {
        // Step 3a: Get ticket from init endpoint
        log.api.info(`Getting ticket from ${baseUrl}/capture-sync/init`);
        
        const initResponse = await fetch(`${baseUrl}/capture-sync/init`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${getApiKey()}`,
            'X-API-Key': getApiKey()
          },
          body: JSON.stringify(initData)
        });

        if (!initResponse.ok) {
          const err = await initResponse.json();
          throw new Error(err.message || 'Failed to get capture ticket');
        }

        const { ticket } = await initResponse.json();
        log.api.info(`Got ticket: ${ticket.substring(0, 8)}...`);

        // Step 3b: Connect to stream with ticket
        const streamUrl = `${baseUrl}/capture-sync?ticket=${ticket}`;
        log.api.info(`Connecting to stream: ${streamUrl}`);

        const eventSource = new EventSource(streamUrl);

      const decryptData = (raw: string) => {
          const result = JSON.parse(raw);
          if (result.pqcPayload) {
              const decrypted = symmetricDecrypt(result.pqcPayload, result.pqcNonce, sharedSecret);
              if (!decrypted) throw new Error('Failed to decrypt stream event');
              return JSON.parse(new TextDecoder().decode(decrypted));
          }
          return result;
      };

      eventSource.addEventListener('progress', (event: MessageEvent) => {
        connected = true;
        try {
          const data = decryptData(event.data);
          onProgress(data);
        } catch (e) {
          log.api.error('Failed to parse progress event', e as Error);
        }
      });

      eventSource.addEventListener('complete', (event: MessageEvent) => {
        connected = true;
        try {
          const data = decryptData(event.data);
          log.api.info('Stream Complete', { id: data.id, authenticated: data.authenticated });
          eventSource.close();
          resolve(data);
        } catch (e) {
          reject(new Error('Failed to parse completion data'));
        }
      });

      eventSource.addEventListener('sync-error', (event: MessageEvent) => {
        connected = true;
        try {
          const data = decryptData(event.data);
          log.api.error('Server sync error', new Error(data.message), data);
          eventSource.close();
          reject(new Error(data.message || 'Server-side capture error'));
        } catch (e) {
          reject(new Error('Server reported an error but payload was unreadable'));
        }
      });

      eventSource.addEventListener('error', (event: Event) => {
        const errorState = (event.target as EventSource).readyState;
        const stateLabels: Record<number, string> = {
          0: 'CONNECTING',
          1: 'OPEN',
          2: 'CLOSED'
        };
        
        log.api.warn(`Stream error on ${baseUrl}. State: ${stateLabels[errorState] || errorState}`, event);

        // Close the current connection
        eventSource.close();

        // If we never connected successfully, try the next endpoint
        if (!connected) {
          currentIndex++;
          const nextUrl = endpoints[currentIndex];
          log.api.info(`Trying next endpoint (${currentIndex + 1}/${endpoints.length}): ${nextUrl || 'none left'}`);
          setTimeout(attemptConnection, 1000); // Wait a bit before trying next
        } else {
          // If we were connected and then lost connection, it's a real error
          log.api.error('Stream disconnected unexpectedly', new Error('Intelligence engine connection lost'));
          reject(new Error('The intelligence engine disconnected unexpectedly. Check server dashboard.'));
        }
      });
    } catch (err: unknown) {
      log.api.warn(`Failed to initialize sync on ${baseUrl}: ${err instanceof Error ? err.message : 'Unknown error'}`);
      currentIndex++;
      setTimeout(() => {
        attemptConnection().catch(e => log.api.error('Failed to retry connection', e));
      }, 1000);
    }
  };

    // Start with the first endpoint
    attemptConnection();
  });
}



/**
 * Simple API Client for General HTTP Requests
 * Mimics axios interface for get/post
 */
export const apiClient = {
  get: async (endpoint: string, config: { params?: Record<string, any>, headers?: Record<string, string> } = {}) => {
    const apiBaseUrl = getApiBaseUrl();
    // Handle endpoint starting with / or not
    const slash = endpoint.startsWith('/') ? '' : '/';
    const url = new URL(`${apiBaseUrl}${slash}${endpoint}`);
    
    if (config.params) {
      Object.entries(config.params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    url.searchParams.append('_t', String(Date.now()));

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getApiKey()}`,
        'X-API-Key': getApiKey(),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        ...config.headers
      }
    });

    if (response.status === 304) {
      return { data: { conversations: [], pagination: { total: 0, limit: 0, offset: 0, hasMore: false } }, status: 304 };
    }

    if (!response.ok) {
       const errorBody = await response.json().catch(() => ({}));
       throw new Error(errorBody.message || `Request failed with status ${response.status}`);
    }

    const data = await response.json();
    return { data, status: response.status };
  },

  post: async (endpoint: string, body: any, config: { headers?: Record<string, string> } = {}) => {
    const apiBaseUrl = getApiBaseUrl();
    const slash = endpoint.startsWith('/') ? '' : '/';
    const url = `${apiBaseUrl}${slash}${endpoint}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getApiKey()}`,
        'X-API-Key': getApiKey(),
        ...config.headers
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
       const errorBody = await response.json().catch(() => ({}));
       throw new Error(errorBody.message || `Request failed with status ${response.status}`);
    }

    const data = await response.json();
    return { data, status: response.status };
  }
};
