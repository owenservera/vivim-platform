---
title: Context Cockpit
description: Visual dashboard for AI context
---

# Context Cockpit

The Context Cockpit is an advanced dashboard that shows you exactly what's happening when VIVIM builds context for AI. It's like looking under the hood to see how your AI conversations get personalized.

---

## What It Shows

### Token Allocation
See how tokens are distributed across context layers:
- Each layer shows allocated tokens
- Visual bars show relative sizes
- Total vs. available comparison

### Layer Contents
What's actually in each layer:
- **Identity Core** - Your role, experience
- **Global Preferences** - Your communication style
- **Topic Context** - Current topic details
- **Entity Context** - People, projects mentioned
- **Conversation Arc** - Summary of flow
- **JIT Retrieval** - On-demand memories
- **Message History** - Recent messages

---

## How to Access

Navigate to **Context Cockpit** at `/context-cockpit`

---

## Demo Mode

When not in an active chat, the cockpit shows **demo data**:
- Sample token allocations
- Example layer contents
- Simulated assembly process

---

## Real-Time Data

During an active chat, you'll see:
- **Live token counts** - As context assembles
- **Assembly time** - How fast context builds
- **Cache performance** - What's being reused
- **Coverage score** - How complete the context is

---

## Metrics Explained

### Token Efficiency
Percentage of budget used effectively:
- Higher = more context packed in
- Lower = room for more content

### Cache Hit Rate
How much context was cached:
- Higher = faster responses
- Lower = more fresh retrieval

### Freshness Score
How current the context is:
- Based on when items were last updated
- Higher = more up-to-date

---

## Use Cases

### Debugging
- Understand why AI responses feel off
- Check if correct context included
- Verify layers are working

### Optimization
- See where tokens go
- Adjust Context Recipes
- Balance depth vs. speed

### Learning
- Understand VIVIM's architecture
- See how ACUs are used
- Explore knowledge retrieval

---

## Advanced: LinkedIn Integration

The Context Cockpit can pull LinkedIn data:
1. Click **Integrate LinkedIn**
2. Enter your LinkedIn profile URL
3. VIVIM imports profile data into context

This adds professional context to your AI conversations.

---

## For Most Users

If this seems complex, don't worry! The Context Cockpit is **optional**. 

For most users:
- **Context Recipes** handles customization
- **Default settings** work well
- Cockpit is for debugging/optimization

---

## Related

- [Context Recipes](/docs/user/context-recipes) - Customize settings
- [Context Components](/docs/user/context-components) - Browse ACUs
