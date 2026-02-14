// apps/server/src/ai/providers/zai-provider.js
// ═══════════════════════════════════════════════════════════════════════════
// Z.AI Provider - OpenAI-compatible interface for GLM-4.7
// ═══════════════════════════════════════════════════════════════════════════
//
// API key loaded from environment: ZAI_API_KEY
// NEVER hardcode API keys in source code.

import { createOpenAICompatible } from '@ai-sdk/openai-compatible';

export const zai = createOpenAICompatible({
  name: 'zai',
  apiKey: process.env.ZAI_API_KEY || '',
  baseURL: process.env.ZAI_BASE_URL || 'https://api.z.ai/api/coding/paas/v4',
  headers: () => ({
    'Accept': 'application/json',
  }),
});