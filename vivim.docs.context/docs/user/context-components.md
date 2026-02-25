---
title: Context Components (ACUs)
description: Understanding Active Context Units
---

# Context Components (ACUs)

ACUs (Active Context Units) are the building blocks of VIVIM's context system. They're small pieces of knowledge extracted from your conversations that VIVIM uses to personalize AI responses.

---

## What Are ACUs?

ACUs are **atomic pieces of knowledge** extracted from your conversations:

- A fact you mentioned
- A preference you've expressed
- A project you're working on
- A person you collaborate with
- A code snippet you discussed
- An idea you explored

---

## ACU Types

| Type | Description | Example |
|------|-------------|---------|
| fact | Factual information | "I prefer TypeScript" |
| preference | Your likes/dislikes | "I like detailed explanations" |
| project | Project-related | "Working on vivim-app" |
| person | People you know | "Collaborating with Alex" |
| code | Code discussions | "Using React hooks" |
| idea | Ideas and thoughts | "Consider using CRDTs" |

---

## Viewing Your ACUs

Navigate to **Context Components** at `/context-components`

Here you can:
- Browse all your ACUs
- See which conversations they came from
- View the context bundles they're part of

---

## Context Bundles

Bundles group ACUs together for AI context:

### Bundle Types

| Type | Description |
|------|-------------|
| identity_core | Your fundamental identity |
| global_prefs | Communication preferences |
| topic | Topic profiles |
| entity | People, projects, companies |
| conversation | Conversation summaries |

---

## How ACUs Are Used

When you chat with AI:

1. VIVIM detects relevant ACUs
2. Bundles them into context layers
3. Includes in AI prompt
4. AI responds with personalization

---

## ACU Quality

VIVIM tracks ACU quality:
- **Content richness** - How detailed
- **Uniqueness** - How novel
- **Overall score** - Composite quality metric

---

## LinkedIn Integration

VIVIM can import LinkedIn data as ACUs:

1. Go to **Context Components**
2. Tap **Integrate LinkedIn**
3. Enter your LinkedIn profile URL
4. Profile becomes part of your context

---

## Privacy

ACUs are:
- **Your data** - Extracted from your conversations
- **Encrypted** - Stored securely
- **You control** - Can be deleted anytime
- **Not shared** - Unless you explicitly share

---

## For Most Users

You don't need to manage ACUs manually:
- VIVIM automatically extracts them
- Context Recipes handle inclusion rules
- Context Cockpit shows usage

The Context Components page is mainly for:
- Understanding the system
- Debugging context issues
- Advanced exploration
