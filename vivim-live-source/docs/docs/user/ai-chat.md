---
title: AI Chat
description: Chat with AI using your captured context
---

# AI Chat

The AI Chat feature lets you have conversations with AI while VIVIM automatically includes relevant context from your captured conversations. This makes your AI interactions more personalized and informed.

---

## How It Works

When you chat with AI:

1. **VIVIM analyzes** your message
2. **Retrieves relevant** context from your library
3. **Builds a context bundle** with relevant ACUs, memories, and conversation history
4. **Sends to AI** with your prompt
5. **AI responds** with personalized context

---

## Accessing AI Chat

Navigate to **Chat** at `/chat`

---

## Features

### Model Selection
- Choose from multiple providers
- Switch models mid-conversation
- See available models for each provider

### Context Integration
- Automatic context retrieval
- See what's being included (via Context Cockpit)
- Customize with Context Recipes

### Message Controls
- **Copy** - Copy AI responses to clipboard
- **Regenerate** - Regenerate last response
- **Clear** - Clear conversation history

### Commands
- Type `/settings` to access Context Recipes

---

## Context in Action

When you ask a question like "What did I learn about React performance?", VIVIM:

1. Searches your conversations for React content
2. Finds relevant ACUs
3. Includes conversation history
4. Sends to AI with your question

The AI then responds with personalized, context-aware answers.

---

## Settings

Access chat settings:
- **Default model** - Your preferred AI model
- **Context Recipes** - Customize context behavior
- **Provider settings** - Manage API configuration

---

## AI Chat vs BYOK Chat

| Feature | AI Chat | BYOK Chat |
|---------|---------|-----------|
| Context | ✅ Automatic | ❌ None |
| API Keys | VIVIM-provided | Your own |
| Cost | Included | Pay directly |
| Customization | Context Recipes | Full control |

---

## Tips

1. **Ask about your content** - "What projects have I discussed?"
2. **Reference past conversations** - "Find that ChatGPT conversation about APIs"
3. **Use Context Cockpit** - See what context is included
4. **Adjust Context Recipes** - Fine-tune what AI knows about you

---

## Privacy

When using AI Chat:
- Your messages are sent to AI providers
- Context from your library is included
- VIVIM doesn't store conversations (unless you capture them)

See [Security & Privacy](/docs/security/overview) for details.
