# VIVIM's Memory System Explained

> **For AI Context:** Use this when users ask about how VIVIM works under the hood. Keep it accessible - no jargon required.

---

## The Simple Version

Think of VIVIM's context system like a **helpful librarian** who:

1. **Knows who VIVIM is** (our identity)
2. **Knows who YOU are** (your profile)
3. **Knows how you like help** (your preferences)
4. **Remembers what you're discussing** (topic context)
5. **Pulls relevant books when you ask** (just-in-time knowledge)

This librarian picks the right books, in the right order, every time you ask a question.

---

## The Layer System (No Tech Jargon)

### Layer 0: VIVIM Identity
*"I am VIVIM, here's what I do"*

Before responding, VIVIM remembers:
- What VIVIM is and isn't
- Our capabilities and limitations
- Privacy promises we've made

### Layer 1: Your Profile  
*"Here's what I know about you"*

Who you are:
- Your background and role
- What projects matter to you
- Your expertise level

### Layer 2: Your Style
*"How you like to be helped"*

Preferences:
- Short answers or detailed?
- Code examples needed?
- Formal or casual?

### Layer 3: Current Topic
*"What this conversation is about"*

When discussing a topic:
- We recognize the subject
- We pull relevant knowledge
- We connect related ideas

### Layer 4: Specifics
*"Details you've mentioned"*

Entities you care about:
- Specific people
- Projects you're working on
- Tools you use

### Layer 5: Conversation Flow
*"What we've covered so far"*

Current chat:
- Previous messages
- What you asked before
- What's coming next

### Layer 6: Quick Search
*"Let me find what might help"*

When you ask something new:
- Searches your saved knowledge
- Finds relevant ACUs
- Connects ideas you forgot

---

## Why Layers Matter

### Problem: Information Overload

If VIVIM dumped everything it knows about you into every response:
- Answers would be too long
- You'd get overwhelmed
- Important stuff gets lost

### Solution: Layered Priority

```
Think of it like writing a response:

Dear [You],

Here's what you asked about [topic]:
- From your profile: [relevant background]
- From preferences: [how you like answers]
- From this conversation: [what we discussed]
- From your vault: [ACUs that match]

Hope this helps!
[Your Style]
```

---

## How It Works in Practice

### Scenario: Developer Asking About APIs

**Without layers:**
> "Here's everything about APIs. And here's everything you've ever saved. And here's everything I know about you. Good luck!"

**With layers:**
> "Since you're a developer working on API authentication, here's a code example from your saved React conversations, using the style you prefer."

**Result:** Focused, relevant, helpful.

---

## Where Your Data Lives

### On Your Device (Local First)
- Your vault lives in your browser
- Encrypted before leaving your device
- Works offline

### In The Cloud (Optional)
- Syncs across your devices
- Still encrypted - we can't read it
- Zero-knowledge architecture

### In Conversations
- When you chat, we build context
- After the chat, context can be cleared
- Your choice to save or not

---

## What Gets Remembered

### In Your Profile
- Background you shared
- Projects you've mentioned
- Preferences you've set

### In Conversations  
- What topics you discussed
- What ACUs you created
- What you searched for

### In Your Vault
- Captured conversations
- ACUs you saved
- Circles you share with

---

## What Gets Forgotten

We DON'T remember:
- Exact messages after you leave a conversation (unless you save)
- Things you chose to delete
- Private data you never shared
- Passwords, keys, or secrets

---

## Your Control

### View Your Context
Ask: "What do you know about me?"

### Edit Your Profile
Tell us changes: "I'm now working on machine learning"

### Clear Preferences
Reset how we respond: "Start fresh with my preferences"

### Delete Data
Your vault, your rules: Delete anything, anytime

---

## The Big Picture

```
┌─────────────────────────────────────────────┐
│          VIVIM's Memory System              │
├─────────────────────────────────────────────┤
│  Question Asked                             │
│         ↓                                   │
│  ┌─────────────────────────────────────┐   │
│  │ Layer 1: Your Profile                │   │
│  │ Layer 2: Your Preferences            │   │
│  │ Layer 3: Current Topic               │   │
│  │ Layer 4: Specific Details            │   │
│  │ Layer 5: Conversation History        │   │
│  │ Layer 6: Quick Knowledge Search      │   │
│  └─────────────────────────────────────┘   │
│         ↓                                   │
│  Personalized, Helpful Response             │
└─────────────────────────────────────────────┘
```

---

## Future: Network Memory

Coming soon:

**Layer 7: Friends Context**
- What friends have shared
- Circle knowledge
- Collaborative memories

**Layer 8: Network Context**  
- Trending topics across VIVIM
- Popular shared ACUs
- Community discoveries

---

*This is how VIVIM remembers - layer by layer, helping you more each time.*
