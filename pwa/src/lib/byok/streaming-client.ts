/**
 * BYOK Streaming Client
 * 
 * Handles streaming chat responses from AI providers
 */

import type { BYOKMessage, ChatSettings, StreamingChunk } from './types';
import { getDecryptedKey } from './api-key-manager';
import { getProviderConfig, calculateCost } from './provider-config';

// ============================================================================
// Types
// ============================================================================

export interface ChatRequest {
  provider: string;
  model: string;
  messages: { role: string; content: string }[];
  settings?: Partial<ChatSettings>;
}

export interface ChatResult {
  message: BYOKMessage;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    cost: number;
  };
}

// ============================================================================
// Streaming Generator
// ============================================================================

/**
 * Stream chat responses from an AI provider
 */
export async function* streamChat(
  request: ChatRequest,
  abortSignal?: AbortSignal
): AsyncGenerator<StreamingChunk> {
  const { provider, model, messages, settings } = request;
  const config = getProviderConfig(provider);
  
  if (!config) {
    throw new Error(`Unknown provider: ${provider}`);
  }

  const apiKey = await getDecryptedKey(provider);
  if (!apiKey) {
    throw new Error(`No API key for provider: ${provider}`);
  }

  const endpoint = `${config.baseUrl}/chat/completions`;
  
  const body: any = {
    model,
    messages: messages.map(m => ({
      role: m.role,
      content: m.content,
    })),
    stream: true,
    stream_options: {
      include_usage: true,
    },
  };

  // Apply settings
  if (settings) {
    if (settings.temperature !== undefined) body.temperature = settings.temperature;
    if (settings.maxTokens) body.max_tokens = settings.maxTokens;
    if (settings.topP !== undefined) body.top_p = settings.topP;
    if (settings.presencePenalty !== undefined) body.presence_penalty = settings.presencePenalty;
    if (settings.frequencyPenalty !== undefined) body.frequency_penalty = settings.frequencyPenalty;
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      // Provider-specific headers
      ...(provider === 'anthropic' && { 'anthropic-version': '2023-06-01' }),
      ...(provider === 'google' && { 'x-goog-api-key': apiKey }),
    },
    body: JSON.stringify(body),
    signal: abortSignal,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || `API error: ${response.status}`);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('No response body');
  }

  const decoder = new TextDecoder();
  let buffer = '';
  let id = crypto.randomUUID();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    buffer += chunk;

    // Process complete SSE messages
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6);
        
        if (data === '[DONE]') {
          yield { id, type: 'done', done: true };
          return;
        }

        try {
          const parsed = JSON.parse(data);
          const content = parsed.choices?.[0]?.delta?.content;
          
          if (content) {
            yield {
              id,
              type: 'content',
              delta: content,
            };
            id = parsed.id || id;
          }

          const finishReason = parsed.choices?.[0]?.finish_reason;
          if (finishReason) {
            yield { id, type: 'done', done: true };
          }

          // Handle usage in stream
          if (parsed.usage) {
            // Usage is available after stream completes
          }
        } catch {
          // Ignore parse errors for partial chunks
        }
      }
    }
  }
}

/**
 * Send a chat request and get a complete response (non-streaming)
 */
export async function sendChat(request: ChatRequest, abortSignal?: AbortSignal): Promise<ChatResult> {
  const { provider, model, messages, settings } = request;
  const config = getProviderConfig(provider);
  
  if (!config) {
    throw new Error(`Unknown provider: ${provider}`);
  }

  const apiKey = await getDecryptedKey(provider);
  if (!apiKey) {
    throw new Error(`No API key for provider: ${provider}`);
  }

  const endpoint = `${config.baseUrl}/chat/completions`;
  
  const body: any = {
    model,
    messages: messages.map(m => ({
      role: m.role,
      content: m.content,
    })),
  };

  // Apply settings
  if (settings) {
    if (settings.temperature !== undefined) body.temperature = settings.temperature;
    if (settings.maxTokens) body.max_tokens = settings.maxTokens;
    if (settings.topP !== undefined) body.top_p = settings.topP;
    if (settings.presencePenalty !== undefined) body.presence_penalty = settings.presencePenalty;
    if (settings.frequencyPenalty !== undefined) body.frequency_penalty = settings.frequencyPenalty;
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      ...(provider === 'anthropic' && { 'anthropic-version': '2023-06-01' }),
      ...(provider === 'google' && { 'x-goog-api-key': apiKey }),
    },
    body: JSON.stringify(body),
    signal: abortSignal,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || `API error: ${response.status}`);
  }

  const data = await response.json();
  
  const message: BYOKMessage = {
    id: data.id,
    role: 'assistant',
    content: data.choices?.[0]?.message?.content || '',
    createdAt: new Date(),
  };

  const usage = data.usage || {};
  const promptTokens = usage.prompt_tokens || 0;
  const completionTokens = usage.completion_tokens || 0;
  const totalTokens = usage.total_tokens || promptTokens + completionTokens;
  const cost = calculateCost(provider, model, promptTokens, completionTokens);

  return { message, usage: { promptTokens, completionTokens, totalTokens, cost } };
}

/**
 * Collect streaming chunks into a complete message
 */
export async function collectStream(
  request: ChatRequest,
  onChunk?: (chunk: StreamingChunk) => void,
  abortSignal?: AbortSignal
): Promise<ChatResult> {
  let content = '';
  let messageId = '';

  for await (const chunk of streamChat(request, abortSignal)) {
    if (chunk.type === 'content' && chunk.delta) {
      content += chunk.delta;
      messageId = chunk.id;
    }
    onChunk?.(chunk);
  }

  const message: BYOKMessage = {
    id: messageId || crypto.randomUUID(),
    role: 'assistant',
    content,
    createdAt: new Date(),
  };

  // Calculate approximate usage from message
  const promptTokens = countTokens(request.messages.map(m => m.content).join('\n'));
  const completionTokens = countTokens(content);
  const cost = calculateCost(request.provider, request.model, promptTokens, completionTokens);

  return {
    message,
    usage: { promptTokens, completionTokens, totalTokens: promptTokens + completionTokens, cost },
  };
}

/**
 * Simple token counter (approximate)
 */
function countTokens(text: string): number {
  // Rough approximation: 4 characters per token on average
  return Math.ceil(text.length / 4);
}

/**
 * Create an abort controller for streaming
 */
export function createBYOKAbortController(): AbortController {
  return new AbortController();
}

/**
 * Abort a streaming request
 */
export function abortBYOKChat(abortSignal?: AbortSignal): void {
  if (abortSignal?.aborted) return;
  
  // Signal will be handled by the fetch API
  if (abortSignal instanceof AbortSignal) {
    // Already an AbortSignal, nothing to do
  }
}
