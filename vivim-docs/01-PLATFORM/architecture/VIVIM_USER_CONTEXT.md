# How VIVIM Understands You

> **For AI Context:** This document explains VIVIM's user understanding system in plain terms. Use this when explaining personalization or when users ask about "how VIVIM knows about me."

---

## The Short Answer

VIVIM builds a **mental model** of each user to provide personalized, helpful responses. Think of it like how a good assistant remembers:

- What you're working on
- How you prefer to be helped
- What matters to you
- Your background and goals

---

## The Context Layers (How We Remember)

### L0: VIVIM's Identity
**"Who am I?"**

Before anything else, VIVIM knows *itself*:
- We're your AI conversation manager
- We believe in your data ownership
- We support 9+ AI providers
- Privacy is our foundation

### L1: Who You Are
**"What should I know about you?"**

This is your **User Identity** - facts you've told VIVIM:
- Your name, role, background
- What you do for work
- Your interests and goals
- Things you've taught VIVIM about yourself

### L2: Your Preferences
**"How do you like to be helped?"**

How VIVIM responds to you:
- Detailed explanations vs. brief answers
- Code examples preferred?
- Formal or casual tone?
- How much context you want

### L3: What You're Talking About
**"What's this conversation about?"**

When you chat about a topic, VIVIM:
- Recognizes the subject area
- Pulls relevant knowledge you've saved
- Connects to related conversations
- Finds ACUs that might help

### L4: The Specific Details
**"Who or what is this?"**

When you mention specific things:
- People you've defined
- Projects you're working on
- Companies, tools, concepts
- Anything you've labeled as important

### L5: The Conversation History
**"What have we talked about?"**

Current chat context:
- Previous messages in this conversation
- What you've already covered
- What you're building toward

### L6: Just-In-Time Knowledge
**"What might help right now?"**

When you ask something, VIVIM searches:
- Your saved conversations
- ACUs that match your question
- Knowledge other users shared
- Related topics you might want

---

## What VIVIM Remembers

### Explicit Memory (Things You Tell Us)
```
✓ Your name and how to address you
✓ Your role or profession  
✓ Projects you're working on
✓ Tools and technologies you use
✓ Goals you're pursuing
✓ Preferences for responses
```

### Implicit Memory (Things We Learn)
```
✓ Topics you ask about most
✓ How you structure questions
✓ What kind of answers you bookmark
✓ When you share with circles
✓ How you organize your vault
```

### What We NEVER Remember
```
✗ Passwords or login credentials
✗ Payment information
✗ Private conversations not saved
✗ Anything you delete
```

---

## How Context Gets Used

### Example: You Ask a Question

```
You: "How do I authenticate users?"

VIVIM's Brain:
1. Checks L0: "I'm VIVIM, an AI conversation manager"
2. Checks L1: "User is a developer, works on web apps"
3. Checks L2: "They prefer code examples"
4. Checks L3: "They're in a coding conversation"
5. Checks L4: "Authentication was mentioned before"
6. Checks L5: "We were talking about React apps"
7. Checks L6: "Let me search their vault for auth ACUs"

Response: Personalized with their code examples, relevant to their stack
```

### Example: First Time User

```
You: "Hi, what is VIVIM?"

VIVIM's Brain:
1. Checks L0: "I know who I am"
2. Checks L1: "No user profile yet"
3. Returns: Friendly explanation of what VIVIM is
   (doesn't try to personalize - no data yet)
```

---

## Your Control

### See What We Know
You can always ask: "What do you know about me?"

### Update Your Profile
Tell us changes: "I started a new job as a data scientist"

### Clear Preferences
Reset how we respond to you

### Delete Everything
Your data, your choice. Delete anytime.

---

## Why This Matters

Without context, VIVIM would be:
- 🤖 A dumb chatbot repeating answers
- 📝 Missing your previous conversations  
- ❌ Unaware of what matters to you
- 🔗 Not connecting your ideas together

With context, VIVIM becomes:
- 👤 Someone who knows your background
- 🔗 Connecting ideas across your knowledge
- 💡 Finding relevant things you forgot
- 📈 Building on what you already know

---

## The Privacy Guarantee

All this personalization happens **locally** or with **strong encryption**:

- User profiles are encrypted
- Preferences are your choice to share
- We can't read your context
- You control what's stored

---

*This is how VIVIM gets to know you - one conversation at a time.*
