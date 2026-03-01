---
title: Capturing Conversations
description: How to import your AI conversations into VIVIM
---

# Capturing Conversations

Capturing is the foundation of VIVIM. When you capture a conversation, VIVIM imports it into your personal library where it becomes searchable, organizable, and reusable.

---

## Two Ways to Capture

### Standard Capture

1. Navigate to **Capture** (or tap the **+** button)
2. Paste the conversation URL
3. Tap **Capture**

### Simple Capture

For a cleaner interface, use **Simple Capture** at `/simple-capture`:
- Bulk capture multiple URLs at once
- See capture progress and logs
- Copy-paste multiple links

---

## Supported Providers

### ChatGPT
```
URL Pattern: https://chat.openai.com/c/[conversation-id]
Example: https://chat.openai.com/c/abc123-def456-ghi789
```

### Claude (Anthropic)
```
URL Pattern: https://claude.ai/c/[conversation-id]
Example: https://claude.ai/c/abc123def456
```

### Gemini (Google)
```
URL Pattern: https://gemini.google.com/c/[conversation-id]
```

### Perplexity
```
URL Pattern: https://www.perplexity.ai/p/[conversation-id]
```

### Grok (xAI)
```
URL Pattern: https://grok.com/c/[conversation-id]
```

### DeepSeek
```
URL Pattern: https://chat.deepseek.com/c/[conversation-id]
```

### Kimi (Moonshot)
```
URL Pattern: https://kimi.moonshot.cn/c/[conversation-id]
```

### Qwen (Alibaba)
```
URL Pattern: https://qwen.alibaba.com/c/[conversation-id]
```

---

## What Happens During Capture?

When you capture a conversation, VIVIM:

1. **Validates** the URL and provider
2. **Extracts** all messages (user and AI)
3. **Parses** code blocks, images, and formatted content
4. **Stores** the conversation in your library
5. **Indexes** content for search
6. **Generates** embeddings for semantic search

---

## Capture Requirements

### URL Must Be:
- **Publicly accessible** - No private/shared links
- **Valid format** - Must match the provider's URL pattern
- **Complete** - Include the full conversation ID

### Common Issues

| Problem | Solution |
|---------|----------|
| "Unsupported Provider" | Check the URL matches a supported provider |
| "Access Denied" | Make sure the conversation is public |
| "Not Found" | Verify the conversation ID is correct |
| Capture hangs | Try Simple Capture for better error visibility |

---

## Bulk Capture

Need to capture multiple conversations at once?

1. Go to **Simple Capture** (`/simple-capture`)
2. Paste multiple URLs (one per line or space-separated)
3. Tap **Capture All**
4. Watch progress for each URL

---

## After Capture

Once captured, you can:

- **View** - Open the conversation anytime
- **Search** - Find it by keywords
- **Organize** - Add to Collections
- **Bookmark** - Save for quick access
- **Share** - Send to others
- **Chat** - Continue the conversation with AI context

---

## Tips for Effective Capturing

1. **Capture early** - Save conversations right after important sessions
2. **Capture regularly** - Make it a habit after AI sessions
3. **Name clearly** - Rename conversations for easier search
4. **Use Collections** - Group related conversations

---

## Privacy Note

When you capture a conversation:
- Content is stored in your personal VIVIM library
- You control who can see it
- You can delete at any time
- Your data is encrypted

See [Security Overview](/docs/security/overview) for more details.
