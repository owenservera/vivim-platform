/**
 * AI API Client
 * Full-featured API client for the VIVIM AI system
 * Supports: completion, streaming, agent pipeline, structured output, settings
 */

import type {
  AIProviderType,
  AICompletionRequest,
  AICompletionResponse,
  AIProvidersResponse,
  AIModelsResponse,
  AIStreamChunk,
  AIMessage,
} from '../types/ai';

import { useAIStore } from './ai-store';
import type { PersonaId, AgentMode, ToolSet } from './ai-store';

// Re-export for convenience
export type {
  AIProviderType,
  AICompletionRequest,
  AICompletionResponse,
  AIStreamChunk,
  AIMessage,
} from '../types/ai';

// ============================================================================
// CONFIGURATION
// ============================================================================

const getApiBaseUrl = () => {
  const override = typeof localStorage !== 'undefined' ? localStorage.getItem('OPENSCROLL_API_OVERRIDE') : null;
  const baseUrl = override || import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';
  const root = baseUrl.replace(/\/api\/v1\/?$/, '').replace(/\/api\/?$/, '').replace(/\/$/, '');
  return `${root}/api/v1`;
};

const getApiKey = () => {
  const storedApiKey = typeof localStorage !== 'undefined' ? localStorage.getItem('OPENSCROLL_API_KEY') : null;
  if (storedApiKey) return storedApiKey;
  const envApiKey = import.meta.env.VITE_API_KEY || import.meta.env.REACT_APP_API_KEY;
  if (envApiKey) return envApiKey;
  return null;
};

const getHeaders = (extraHeaders: Record<string, string> = {}) => {
  const apiKey = getApiKey();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-User-Id': 'dev-user',
    ...extraHeaders,
  };
  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }
  return headers;
};

// ============================================================================
// CORE AI COMPLETION
// ============================================================================

/**
 * Get AI completion from server (non-streaming)
 */
export async function getAICompletion(
  request: AICompletionRequest,
  signal?: AbortSignal
): Promise<AICompletionResponse> {
  const apiBaseUrl = getApiBaseUrl();
  const { apiKeys } = useAIStore.getState();
  const providerKey = request.provider ? apiKeys[request.provider] : null;

  const response = await fetch(`${apiBaseUrl}/ai/complete`, {
    method: 'POST',
    headers: {
      ...getHeaders(),
      ...(providerKey ? { 'X-Provider-Key': providerKey } : {}),
    },
    body: JSON.stringify(request),
    signal,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `Request failed with status ${response.status}`);
  }

  const data = await response.json();
  return data.data;
}

/**
 * Stream AI completion from server
 */
export async function streamAICompletion(
  request: AICompletionRequest,
  onChunk: (chunk: AIStreamChunk) => void,
  signal?: AbortSignal
): Promise<void> {
  const apiBaseUrl = getApiBaseUrl();
  const { apiKeys } = useAIStore.getState();
  const providerKey = request.provider ? apiKeys[request.provider] : null;

  const response = await fetch(`${apiBaseUrl}/ai/stream`, {
    method: 'POST',
    headers: {
      ...getHeaders(),
      ...(providerKey ? { 'X-Provider-Key': providerKey } : {}),
    },
    body: JSON.stringify(request),
    signal,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `Request failed with status ${response.status}`);
  }

  await processSSEStream(response, onChunk);
}

// ============================================================================
// AGENT PIPELINE
// ============================================================================

/**
 * Agent request options
 */
export interface AgentRequest {
  messages: { role: string; content: string }[];
  provider?: AIProviderType;
  model?: string;
  conversationId?: string;
  mode?: AgentMode;
  personaId?: PersonaId;
  toolSet?: ToolSet;
  maxSteps?: number;
  enableSocial?: boolean;
  customInstructions?: string;
  options?: { maxTokens?: number; temperature?: number };
}

/**
 * Agent response with step details
 */
export interface AgentResponse {
  content: string;
  usage: { promptTokens: number; completionTokens: number; totalTokens: number };
  finishReason: string;
  steps: Array<{
    type: string;
    toolCalls?: Array<{ name: string; args: any; result: any }>;
    text: string;
    tokens: number;
  }>;
  metadata: {
    mode: string;
    personaId: string;
    duration: number;
    toolsAvailable: string[];
    toolsUsed: string[];
  };
  provider: string;
  conversationId?: string;
}

/**
 * Execute agent pipeline (non-streaming)
 */
export async function executeAgent(
  request: AgentRequest,
  signal?: AbortSignal
): Promise<AgentResponse> {
  const apiBaseUrl = getApiBaseUrl();

  const response = await fetch(`${apiBaseUrl}/ai/agent`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(request),
    signal,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `Agent request failed with status ${response.status}`);
  }

  const data = await response.json();
  return data.data;
}

/**
 * Execute agent pipeline with streaming
 */
export async function streamAgent(
  request: AgentRequest,
  onChunk: (chunk: AIStreamChunk) => void,
  signal?: AbortSignal
): Promise<void> {
  const apiBaseUrl = getApiBaseUrl();

  const response = await fetch(`${apiBaseUrl}/ai/agent/stream`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(request),
    signal,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `Agent stream failed with status ${response.status}`);
  }

  await processSSEStream(response, onChunk);
}

// ============================================================================
// FRESH CHAT
// ============================================================================

/**
 * Stream AI completion for fresh chat (no context)
 */
export async function streamFreshChatCompletion(
  message: string,
  onChunk: (chunk: AIStreamChunk) => void,
  signal?: AbortSignal,
  options?: { personaId?: PersonaId; provider?: AIProviderType; model?: string }
): Promise<void> {
  const apiBaseUrl = getApiBaseUrl();

  const response = await fetch(`${apiBaseUrl}/ai/chat/stream`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      message,
      personaId: options?.personaId || useAIStore.getState().defaultPersona,
      provider: options?.provider,
      model: options?.model,
    }),
    signal,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `Request failed with status ${response.status}`);
  }

  await processSSEStream(response, onChunk);
}

/**
 * Start AI conversation on server
 */
export async function startAIConversation(request: {
  provider?: AIProviderType;
  model?: string;
  title?: string;
  personaId?: PersonaId;
  messages?: AIMessage[];
}): Promise<any> {
  const apiBaseUrl = getApiBaseUrl();

  const response = await fetch(`${apiBaseUrl}/ai/chat/start`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `Request failed with status ${response.status}`);
  }

  const data = await response.json();
  return data.data;
}

/**
 * Fork conversation on server
 */
export async function forkAIConversation(request: {
  sourceId: string;
  prompt: string;
  provider?: string;
  model?: string;
}): Promise<any> {
  const apiBaseUrl = getApiBaseUrl();

  const response = await fetch(`${apiBaseUrl}/ai/chat/fork`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `Request failed with status ${response.status}`);
  }

  const data = await response.json();
  return data.data;
}

// ============================================================================
// STRUCTURED OUTPUT
// ============================================================================

/**
 * Generate structured output (JSON matching a schema)
 */
export async function generateStructuredOutput(request: {
  prompt?: string;
  messages?: { role: string; content: string }[];
  provider?: AIProviderType;
  model?: string;
  schema: Record<string, any>;
  toolSet?: ToolSet;
  maxSteps?: number;
}): Promise<{ output: any; usage: any }> {
  const apiBaseUrl = getApiBaseUrl();

  const response = await fetch(`${apiBaseUrl}/ai/structured`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `Structured output failed with status ${response.status}`);
  }

  const data = await response.json();
  return data.data;
}

// ============================================================================
// SETTINGS & CAPABILITIES
// ============================================================================

/**
 * Get available AI providers with status
 */
export async function getAIProviders(): Promise<AIProvidersResponse> {
  const apiBaseUrl = getApiBaseUrl();

  const response = await fetch(`${apiBaseUrl}/ai/settings/providers`, {
    headers: getHeaders(),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `Request failed with status ${response.status}`);
  }

  const data = await response.json();
  return data.data;
}

/**
 * Get available AI models per provider
 */
export async function getAIModels(): Promise<AIModelsResponse> {
  const apiBaseUrl = getApiBaseUrl();

  const response = await fetch(`${apiBaseUrl}/ai/settings/models`, {
    headers: getHeaders(),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `Request failed with status ${response.status}`);
  }

  const data = await response.json();
  return data.data;
}

/**
 * Get available AI personas
 */
export async function getAIPersonas(): Promise<any[]> {
  const apiBaseUrl = getApiBaseUrl();

  const response = await fetch(`${apiBaseUrl}/ai/settings/personas`, {
    headers: getHeaders(),
  });

  if (!response.ok) return [];

  const data = await response.json();
  return data.data?.personas || [];
}

/**
 * Get full AI system capabilities
 */
export async function getAICapabilities(): Promise<any> {
  const apiBaseUrl = getApiBaseUrl();

  const response = await fetch(`${apiBaseUrl}/ai/settings/capabilities`, {
    headers: getHeaders(),
  });

  if (!response.ok) return null;

  const data = await response.json();
  return data.data;
}

/**
 * Get AI telemetry/usage metrics
 */
export async function getAITelemetry(): Promise<any> {
  const apiBaseUrl = getApiBaseUrl();

  const response = await fetch(`${apiBaseUrl}/ai/settings/telemetry`, {
    headers: getHeaders(),
  });

  if (!response.ok) return null;

  const data = await response.json();
  return data.data;
}

/**
 * Get user-specific AI usage metrics
 */
export async function getUserAITelemetry(): Promise<any> {
  const apiBaseUrl = getApiBaseUrl();

  const response = await fetch(`${apiBaseUrl}/ai/settings/telemetry/user`, {
    headers: getHeaders(),
  });

  if (!response.ok) return null;

  const data = await response.json();
  return data.data;
}

/**
 * Estimate cost for a completion
 */
export function estimateCompletionCost(
  provider: AIProviderType,
  promptTokens: number,
  completionTokens: number
): number {
  const pricing: Record<string, { input: number; output: number }> = {
    openai: { input: 0.00000175, output: 0.000014 },
    xai: { input: 0.00000020, output: 0.000001 },
    anthropic: { input: 0.000015, output: 0.000075 },
    gemini: { input: 0.00000010, output: 0.00000050 },
    qwen: { input: 0.00000010, output: 0.00000050 },
    moonshot: { input: 0.00000050, output: 0.00000250 },
    minimax: { input: 0.00000039, output: 0.00000156 },
    zai: { input: 0, output: 0 },
  };

  const rates = pricing[provider] || pricing.zai;
  return (promptTokens * rates.input) + (completionTokens * rates.output);
}

// ============================================================================
// SSE STREAM PROCESSOR
// ============================================================================

/**
 * Process Server-Sent Events stream
 * Handles both Vercel AI SDK data stream and legacy SSE formats
 */
async function processSSEStream(
  response: Response,
  onChunk: (chunk: AIStreamChunk) => void,
): Promise<void> {
  const reader = response.body?.getReader();
  if (!reader) throw new Error('No response body');

  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        // Vercel AI SDK data stream format
        if (line.startsWith('0:')) {
          // Text part
          try {
            const content = JSON.parse(line.slice(2));
            if (typeof content === 'string') {
              onChunk({ content, done: false });
            }
          } catch {
            // Skip malformed lines
          }
        } else if (line.startsWith('d:')) {
          // Done signal
          onChunk({ content: '', done: true });
          return;
        } else if (line.startsWith('e:')) {
          // Finish step
          // Could parse step info here
        }
        // Legacy SSE format (data: prefix)
        else if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') {
            onChunk({ content: '', done: true });
            return;
          }

          try {
            const parsed = JSON.parse(data);
            if (parsed.content !== undefined) {
              onChunk({ content: parsed.content, done: false });
            } else if (parsed.error) {
              throw new Error(parsed.error);
            }
          } catch (e) {
            // Skip parse errors for non-JSON data lines
          }
        }
      }
    }

    // If we exited the loop without a done signal
    onChunk({ content: '', done: true });
  } finally {
    reader.releaseLock();
  }
}
