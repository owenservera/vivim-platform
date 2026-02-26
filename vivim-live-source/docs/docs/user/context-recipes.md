---
title: Context Recipes
description: Customize how VIVIM builds context for AI
---

# Context Recipes

Context Recipes let you customize how VIVIM builds the "context" it provides to AI. Think of context as everything the AI knows about you when you start a chat.

---

## What Are Context Layers?

VIVIM organizes context into layers, each serving a different purpose:

| Layer | Name | Description |
|-------|------|-------------|
| L0 | Identity Core | Your fundamental identity, role, experience |
| L1 | Global Preferences | Communication style, tone preferences |
| L2 | Topic Context | Current topic profile and domain knowledge |
| L3 | Entity Context | People, projects, entities mentioned |
| L4 | Conversation Arc | Summary of conversation flow |
| L5 | JIT Retrieval | On-demand memories and knowledge units |
| L6 | Message History | Recent dialogue in context window |
| L7 | User Message | Your current input |

---

## Accessing Context Recipes

1. Go to **Settings**
2. Tap **AI Settings** (or navigate to `/settings/ai`)

---

## Customizing Layers

### Enable/Disable
Toggle each layer on or off:
- Turn off layers you don't need
- Reduces token usage
- Faster responses

### Token Budget
Allocate tokens to each layer:
- **Min tokens** - Guaranteed minimum
- **Max tokens** - Maximum allowed
- **Priority** - Which layers get priority when space is limited

### Manual Content
Add custom content to any layer:
- Override automatic detection
- Add specific instructions
- Include manual notes

---

## Knowledge Depth

Adjust how much context VIVIM includes:

### Minimal
- Quick, focused responses
- Less context, faster responses
- Good for simple questions

### Standard
- Balanced context
- Good for most conversations

### Deep
- Maximum context
- Richer, more personalized responses
- Uses more tokens

---

## Preserving History

### Prioritize History
Toggle whether recent conversation history takes priority in context allocation.

### Entity Context
Toggle whether VIVIM includes information about people, projects, and entities.

---

## Preview Budget

As you adjust settings, watch the **token budget preview**:
- Shows total tokens allocated
- Updates in real-time
- Helps you stay within limits

---

## Use Cases

### Technical Discussions
- High L0 (Identity) - Tell AI about your expertise
- High L2 (Topics) - Focus on technical domains
- Lower L6 (History) - Less conversational

### Creative Writing
- Lower L0 - Less personal context
- Higher L4 (Conversation Arc) - Maintain narrative flow
- Standard L6 - Moderate history

### Learning
- High L3 (Entities) - Include people/concepts to learn
- High L5 (JIT) - Pull in relevant memories
- Standard across others

---

## Best Practices

1. **Start simple** - Default settings work for most
2. **Adjust incrementally** - Change one thing at a time
3. **Test with purpose** - Have a specific use case in mind
4. **Monitor usage** - Watch token consumption

---

## Context Cockpit

For even more detail, visit **Context Cockpit** to see:
- Exactly what's in each layer
- Token allocation in real-time
- Assembly performance metrics

See [Context Cockpit](/docs/user/context-cockpit) for details.
