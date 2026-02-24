// apps/server/src/ai/providers/zai.js
// Z.AI (智谱AI) Provider - FREE DEFAULT using centralized config

import { BaseAIProvider } from './base.js';
import { logger } from '../../lib/logger.js';
import { ProviderConfig } from '../../types/ai.js';

const ZAI = ProviderConfig.zai;

export class ZAIProvider extends BaseAIProvider {
  constructor() {
    super('zai', {
      baseURL: ZAI.baseURL,
      apiKey: ZAI.apiKey,
      defaultModel: ZAI.defaultModel,
    });
  }

  getHeaders() {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.apiKey}`,
      'Accept-Language': 'en-US,en',
    };
  }

  transformMessages(messages) {
    return messages.map((msg) => ({ role: msg.role, content: msg.content }));
  }

  async complete(messages, options = {}) {
    const {
      model = this.defaultModel,
      max_tokens = 4096,
      temperature = 0.7,
      thinking_type = 'disabled',
    } = options;

    logger.info({ model, messageCount: messages.length }, 'ZAI request');

    const response = await fetch(`${this.baseURL}/chat/completions`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        model,
        messages: this.transformMessages(messages),
        max_tokens,
        temperature,
        thinking: { type: thinking_type },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`ZAI ${response.status}: ${error}`);
    }

    const data = await response.json();
    return this.parseResponse(data);
  }

  async stream(messages, options = {}, onChunk) {
    const {
      model = this.defaultModel,
      max_tokens = 4096,
      temperature = 0.7,
      thinking_type = 'disabled',
    } = options;

    const response = await fetch(`${this.baseURL}/chat/completions`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        model,
        messages: this.transformMessages(messages),
        max_tokens,
        temperature,
        stream: true,
        thinking: { type: thinking_type },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`ZAI ${response.status}: ${error}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      buffer += decoder.decode(value, { stream: true });
      for (const line of buffer.split('\n')) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data !== '[DONE]') {
            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                onChunk({ content, done: false });
              }
            } catch (e) {
              // ignore JSON parse errors in stream
            }
          }
        }
      }
    }
    onChunk({ done: true });
  }

  parseResponse(data) {
    const choice = data.choices?.[0];
    return {
      content: choice?.message?.content || '',
      model: data.model,
      usage: {
        promptTokens: data.usage?.prompt_tokens || 0,
        completionTokens: data.usage?.completion_tokens || 0,
        totalTokens: data.usage?.total_tokens || 0,
      },
      finishReason: choice?.finish_reason || 'unknown',
    };
  }
}
