---
title: BYOK Chat - Bring Your Own Key
description: Use your own API keys for AI chat
---

# BYOK Chat - Bring Your Own Key

BYOK (Bring Your Own Key) lets you chat with AI using your own API keys from OpenAI, Anthropic, Google, and other providers. This gives you more control over costs, privacy, and model selection.

---

## Why Use BYOK?

- **Cost control** - Pay directly to AI providers
- **Privacy** - Conversations don't go through VIVIM's servers
- **Model choice** - Access any model the provider offers
- **Higher limits** - Bypass VIVIM's rate limits

---

## Supported Providers

| Provider | Models | API Key Location |
|----------|--------|------------------|
| OpenAI | GPT-4o, GPT-4, GPT-3.5 | platform.openai.com |
| Anthropic | Claude 3.5, Claude 3 | console.anthropic.com |
| Google | Gemini Pro, Flash | aistudio.google.com |
| DeepSeek | DeepSeek Chat | platform.deepseek.com |
| More | Coming soon | - |

---

## Setting Up BYOK

### Step 1: Get an API Key

1. Go to your AI provider's platform
2. Create an account (if needed)
3. Navigate to API keys section
4. Create a new API key
5. Copy the key (won't be shown again!)

### Step 2: Add Key to VIVIM

1. Navigate to **BYOK Chat**
2. Tap **Add Key** for your provider
3. Paste your API key
4. Tap **Save**

### Step 3: Start Chatting

1. Select provider and model
2. Type your message
3. Get responses directly from the provider

---

## Managing API Keys

### Viewing Keys
- Keys are shown as `sk-...abc` (first few + last 4)
- Full key never displayed after saving

### Removing Keys
1. Go to BYOK Chat settings
2. Tap remove next to key
3. Confirm removal

### Key Security
- Stored securely on your device
- Never sent to VIVIM servers
- Only used for direct API calls

---

## Costs

When using BYOK:
- You pay the AI provider directly
- VIVIM doesn't add fees
- Check provider pricing pages for rates

### Estimated Costs (approximate)

| Model | Input | Output |
|-------|-------|--------|
| GPT-4o | $2.50/1M | $10.00/1M |
| GPT-4 | $15.00/1M | $60.00/1M |
| Claude 3.5 | $3.00/1M | $15.00/1M |
| Gemini Flash | $0.35/1M | $0.35/1M |

---

## Chat Settings

Customize each chat:

### Temperature
- **0-1** range
- Lower = more focused/deterministic
- Higher = more creative/variable

### Max Tokens
- Limit response length
- Affects cost and response time

---

## Troubleshooting

### "Invalid API Key"
- Check key is correct
- Ensure key has permissions
- Verify provider account is active

### "Rate Limited"
- Provider's limits hit
- Wait and try again
- Check provider dashboard

### "Network Error"
- Check internet connection
- Some providers blocked in certain regions
- Try VPN if needed

---

## Privacy Notes

When using BYOK:
- Messages go directly from your device to the AI provider
- VIVIM doesn't see message content
- Provider sees messages per their privacy policy

---

## Context with BYOK

You can combine BYOK with VIVIM's context system:
- Include relevant ACUs in prompts
- Use Context Recipes
- Get personalized responses

See [Context Recipes](/docs/user/context-recipes) for details.
