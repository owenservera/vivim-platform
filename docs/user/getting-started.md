---
sidebar_position: 1
title: Quick Start Guide
description: Get up and running with VIVIM in 5 minutes
---

# Welcome to VIVIM - Quick Start Guide

VIVIM is your personal AI memory platform. It captures your conversations from ChatGPT, Claude, Gemini, and other AI providers, so you can search, organize, and reuse the knowledge you've built up with AI.

This guide will help you get started in 5 minutes.

---

## What Can VIVIM Do?

- **Capture** conversations from any AI chatbot (ChatGPT, Claude, Gemini, etc.)
- **Search** through all your past conversations instantly
- **Organize** conversations into Collections
- **Share** knowledge with friends or colleagues
- **Chat** with AI using your own API keys (BYOK)
- **Get recommendations** for relevant past conversations

---

## Step 1: Sign In

1. Open VIVIM in your browser
2. Tap **Sign in with Google**
3. Complete the Google authentication

> **Note:** If you don't sign in, you can still use VIVIM, but your data will only be stored locally on your device.

---

## Step 2: Capture Your First Conversation

The most important thing about VIVIM is capturing your AI conversations so they're searchable.

### How to Capture:

1. Tap the **+** button or navigate to **Capture**
2. Paste the URL of your AI conversation
   - **ChatGPT:** `chat.openai.com/c/...`
   - **Claude:** `claude.ai/c/...`
   - **Gemini:** `gemini.google.com/c/...`
   - **Perplexity:** `perplexity.ai/p/...`
3. Tap **Capture**

VIVIM will:
- Extract all messages from the conversation
- Save them to your personal library
- Make them searchable

### Supported Providers:

| Provider | URL Pattern | Status |
|----------|-------------|--------|
| ChatGPT | chat.openai.com/c/* | ✅ Supported |
| Claude | claude.ai/c/* | ✅ Supported |
| Gemini | gemini.google.com/c/* | ✅ Supported |
| Perplexity | perplexity.ai/p/* | ✅ Supported |
| Grok | grok.com/c/* | ✅ Supported |
| DeepSeek | chat.deepseek.com/* | ✅ Supported |
| Kimi | kimi.moonshot.cn/* | ✅ Supported |
| Qwen | qwen.alibaba.com/* | ✅ Supported |

---

## Step 3: Explore Your Library

After capturing a few conversations, check out your library:

### Home Screen
Your home screen shows all captured conversations organized by:
- **Recent** - Most recently updated
- **Pinned** - Conversations you've pinned
- **Archived** - Conversations you've archived

### Using Search
Tap the **Search** icon to find any conversation:
- Search by title
- Search by content keywords
- Switch between **Local** (on-device) and **Server** search

---

## Step 4: Try These Features

### Collections
Organize related conversations into Collections:
1. Go to **Collections**
2. Tap **+** to create a new collection
3. Give it a name and choose a color
4. Add conversations to your collection

### Bookmarks
Quick-save important conversations:
- Tap the **bookmark icon** on any conversation
- Access all bookmarks from the **Bookmarks** tab

### For You
Get AI-powered recommendations:
- Go to **For You** 
- VIVIM recommends relevant past conversations based on your activity
- Swipe left to dismiss, tap to open

### Share with Others
Share knowledge with friends:
1. Open any conversation
2. Tap **Share**
3. Choose how to share (link, QR code)
4. Set expiration (optional): 1 hour, 24 hours, 7 days, 30 days, or never

---

## Understanding Context Layers

VIVIM uses a sophisticated **Context Layer** system when you chat with AI. This determines what information VIVIM provides to the AI about you:

| Layer | Name | What It Includes |
|-------|------|-----------------|
| L0 | Identity Core | Your role, experience, background |
| L1 | Global Preferences | Communication style, tone preferences |
| L2 | Topic Context | Current topic profile |
| L3 | Entity Context | People, projects, companies mentioned |
| L4 | Conversation Arc | Summary of conversation flow |
| L5 | JIT Retrieval | On-demand memories |
| L6 | Message History | Recent dialogue |
| L7 | User Message | Your current input |

You can customize these in **Settings → AI Settings (Context Recipes)**.

---

## Pro Tips

### Use the Context Cockpit
For advanced users: Visit **Context Cockpit** to see exactly what context is being sent to AI and how tokens are allocated.

### BYOK - Bring Your Own Key
Don't want to use VIVIM's AI? Use your own API keys:
1. Go to **BYOK Chat**
2. Add your API key from OpenAI, Anthropic, Google, etc.
3. Chat directly with your own keys

### Context Recipes
Customize how VIVIM builds context for AI:
1. Go to **Settings → AI Settings**
2. Adjust token budgets per layer
3. Enable/disable specific context types

---

## What's Next?

- **[Capturing Conversations](/docs/user/capturing-conversations)** - Detailed capture guide
- **[Searching & Finding](/docs/user/searching-finding)** - Master the search feature
- **[Organizing with Collections](/docs/user/collections)** - Organize your library
- **[Sharing Knowledge](/docs/user/sharing)** - Share with others
- **[BYOK Chat](/docs/user/byok-chat)** - Use your own API keys

---

## Troubleshooting

### Capture Not Working?
- Make sure the conversation URL is public (not private)
- Some providers may require you to be logged in
- Try the simple capture interface at `/simple-capture`

### Can't Find Conversations?
- Use the search feature with keywords
- Check if conversation is in Collections
- Try both Local and Server search

### Sync Issues?
- Check your internet connection
- Visit the Error Dashboard at `/errors`
- Try force-syncing from Settings
