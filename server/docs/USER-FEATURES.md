# VIVIM User Features & Control Panel

## A Visual Guide to Your AI Memory System

---

## Welcome to VIVIM

VIVIM gives your AI assistant a memory that never forgets. This guide shows you everything you can do with your personal AI memory system.

---

## Your Control Panel at a Glance

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  VIVIM                                                                    │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐            │
│  │ 🏠 Home │  │ 🧠 Memory│  │ 💬 Chat │  │ ⚙️ Settings│  │ 👤 Profile│  │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘            │
└─────────────────────────────────────────────────────────────────────────────┘

  ┌──────────────────────────────────────────────────────────────────────┐   │
  │  YOUR MEMORY STATS                                                   │   │
  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐               │   │
  │  │  247    │  │   89    │  │  12     │  │  85%    │               │   │
  │  │Memories │  │ Topics  │  │ Pinned  │  │ Relevant│               │   │
  │  └─────────┘  └─────────┘  └─────────┘  └─────────┘               │   │
  └──────────────────────────────────────────────────────────────────────┘
```

---

## Feature 1: Memory Management

### What Are Memories?

Memories are pieces of information VIVIM remembers about you. Think of them like notes you'd give to a new assistant who just started working with you.

### Types of Memories

| Icon | Memory Type      | Example                                             |
| ---- | ---------------- | --------------------------------------------------- |
| 📖   | **Episodic**     | "Last week we worked on the login feature"          |
| 💡   | **Semantic**     | "Python is the user's primary programming language" |
| ⚙️   | **Procedural**   | "User prefers Test-Driven Development"              |
| 👤   | **Factual**      | "User works as a Senior Engineer at Acme"           |
| ❤️   | **Preference**   | "User prefers dark mode IDE"                        |
| 🎯   | **Identity**     | "User is a full-stack developer"                    |
| 👥   | **Relationship** | "Sarah is the user's tech lead"                     |
| 🚀   | **Goal**         | "User wants to launch MVP by Q2"                    |
| 📁   | **Project**      | "Building an e-commerce platform with Next.js"      |

### Creating Memories

```
┌─────────────────────────────────────────────────────────────────┐
│  CREATE NEW MEMORY                                              │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ What should VIVIM remember?                              │  │
│  │                                                           │  │
│  │ I prefer receiving feedback in writing rather than       │  │
│  │ in person, as it gives me time to process it.           │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  Type: [Preference        ▼]  Category: [Communication ▼]     │
│                                                                 │
│  Importance: ████████░░░░░░░░░░░  80%                         │
│                                                                 │
│  Tags: [communication] [feedback] [+ Add Tag]                   │
│                                                                 │
│  [Cancel]                                    [Save Memory]     │
└─────────────────────────────────────────────────────────────────┘
```

### Memory Search

```
┌─────────────────────────────────────────────────────────────────┐
│  SEARCH YOUR MEMORIES                                           │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ 🔍 Search memories...                                     │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  Filter by Type: [All ▼]  Sort by: [Relevance ▼]              │
│                                                                 │
│  RESULTS:                                                       │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 💡 User is a Python developer                            │   │
│  │    Type: Identity  | Importance: 90% | 2 days ago      │   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │ ❤️ User prefers dark mode                                │   │
│  │    Type: Preference | Importance: 85% | 1 week ago     │   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │ ⚙️ User follows TDD methodology                          │   │
│  │    Type: Procedural | Importance: 80% | 3 days ago     │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Feature 2: Context Control

### What is Context?

Context is what VIVIM tells your AI about you before each conversation. It's like giving your AI a brief briefing before a meeting.

### Your Context Layers

```
┌─────────────────────────────────────────────────────────────────┐
│  CONTEXT LAYERS                                                 │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ L0: IDENTITY CORE         [██████████] 450t  Always   │   │
│  │     "Senior TS dev building OpenScroll"               │   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │ L1: PREFERENCES          [██████] 300t   Always     │   │
│  │     "Concise, code-first, no hand-holding"           │   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │ L2: TOPICS               [████████████] 1500t  When │   │
│  │     Prisma, React, System Design                     │   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │ L3: ENTITIES             [████████] 800t    When     │   │
│  │     Sarah (cofounder), OpenScroll (project)          │   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │ L4: CONVERSATION         [███████] 600t    When     │   │
│  │     Debugging OAuth flows                             │   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │ L5: JUST-IN-TIME         [████████████] 1200t Always │   │
│  │     Retrieved from memories                           │   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │ L6: MESSAGE HISTORY      [████████████████] 3000t    │   │
│  │     Recent conversation messages                       │   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │ L7: YOUR MESSAGE         [███] 150t     Exact       │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Total Budget: 8,000 / 12,000 tokens used                       │
└─────────────────────────────────────────────────────────────────┘
```

### Adjusting Context Settings

```
┌─────────────────────────────────────────────────────────────────┐
│  CONTEXT SETTINGS                                               │
│                                                                 │
│  Maximum Context Tokens:                                         │
│  [──────────────●────────] 12,000 tokens                         │
│                                                                 │
│  Response Style:                                                │
│  ○ Concise    ● Balanced    ○ Detailed                          │
│                                                                 │
│  Memory Threshold:                                              │
│  ○ Minimal    ● Moderate    ○ Aggressive                         │
│                                                                 │
│  Focus Mode:                                                    │
│  ○ Balanced    ● Focused    ○ Exploratory                        │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  ADVANCED OPTIONS                                       │   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │  [✓] Enable predictions       Predict what I need      │   │
│  │  [✓] Enable JIT retrieval    Find relevant knowledge   │   │
│  │  [✓] Enable compression     Optimize long convos      │   │
│  │  [✓] Include entity context Show relevant people      │   │
│  │  [✓] Include topic context   Show relevant topics      │   │
│  │  [ ] Prioritize latency     Faster responses          │   │
│  │  [✓] Cache aggressively     Remember compiled context  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  [Reset to Defaults]                        [Save Settings]    │
└─────────────────────────────────────────────────────────────────┘
```

---

## Feature 3: Topic Profiles

### What Are Topics?

Topics are subjects you've discussed with your AI. VIVIM automatically tracks them and builds rich profiles.

### Topic Dashboard

```
┌─────────────────────────────────────────────────────────────────┐
│  YOUR TOPICS                                                    │
│                                                                 │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐              │
│  │  Prisma     │ │  React      │ │  TypeScript │              │
│  │  ORM        │ │  45 convos  │ │  Expert     │              │
│  │  Expert     │ │  89%        │ │  120 convos │              │
│  │  ████████░░ │ │  ████████░░ │ │  ████████░░ │              │
│  └─────────────┘ └─────────────┘ └─────────────┘              │
│                                                                 │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐              │
│  │  System     │ │  DevOps     │ │  AI/ML      │              │
│  │  Design     │ │  12 convos  │ │  Learning   │              │
│  │  Advanced   │ │  65%        │ │  Beginner   │              │
│  │  ██████░░░░ │ │  ████░░░░░░ │ │  ███░░░░░░░ │              │
│  └─────────────┘ └─────────────┘ └─────────────┘              │
│                                                                 │
│  [View All 24 Topics →]                                         │
└─────────────────────────────────────────────────────────────────┘
```

### Topic Detail View

```
┌─────────────────────────────────────────────────────────────────┐
│  TOPIC: Prisma ORM                                             │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Skill Level: ████████████░░░░░ Expert (92%)           │   │
│  │  Engagement: 45 conversations | Last active: 2 days ago │   │
│  │  Peak Time: 2-4 PM                                       │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  KEY KNOWLEDGE:                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ • Prefers Prisma Client over raw queries              │   │
│  │ • Experienced with migrations                          │   │
│  │ • Uses PostgreSQL as primary database                 │   │
│  │ • Interested in performance optimization               │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  RECENT CONVERSATIONS:                                          │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ • Optimizing slow queries - 3 days ago                  │   │
│  │ • Migration strategies - 1 week ago                      │   │
│  │ • Transaction handling - 2 weeks ago                     │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  [Edit Knowledge] [View Conversations] [Archive Topic]          │
└─────────────────────────────────────────────────────────────────┘
```

---

## Feature 4: Entity Profiles

### What Are Entities?

Entities are people, projects, and tools you interact with. VIVIM remembers your relationships and context around them.

### Entity Dashboard

```
┌─────────────────────────────────────────────────────────────────┐
│  YOUR ENTITIES                                                  │
│                                                                 │
│  👥 PEOPLE                                                      │
│  ┌───────────────┐ ┌───────────────┐ ┌───────────────┐          │
│  │ Sarah Chen   │ │ John Smith    │ │ Alex Kim      │          │
│  │ Co-founder   │ │ Tech Lead     │ │ Designer      │          │
│  │ 15 mentions  │ │ 23 mentions   │ │ 8 mentions    │          │
│  └───────────────┘ └───────────────┘ └───────────────┘          │
│                                                                 │
│  📁 PROJECTS                                                    │
│  ┌───────────────┐ ┌───────────────┐ ┌───────────────┐          │
│  │ OpenScroll    │ │ Mobile App    │ │ API Gateway   │          │
│  │ Active        │ │ Planning      │ │ In Review     │          │
│  │ 156 convos   │ │ 12 convos    │ │ 34 convos     │          │
│  └───────────────┘ └───────────────┘ └───────────────┘          │
│                                                                 │
│  🔧 TOOLS                                                       │
│  ┌───────────────┐ ┌───────────────┐                           │
│  │ Vercel       │ │ Supabase      │                           │
│  │ Hosting      │ │ Database      │                           │
│  └───────────────┘ └───────────────┘                           │
│                                                                 │
│  [View All Entities →]                                         │
└─────────────────────────────────────────────────────────────────┘
```

---

## Feature 5: Conversations

### Conversation Summary

Every conversation gets automatically summarized and organized.

```
┌─────────────────────────────────────────────────────────────────┐
│  CONVERSATIONS                                                  │
│                                                                 │
│  ACTIVE                                                         │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ 🟢 Debugging OAuth Flow                                  │   │
│  │    47 messages | Started 2 hours ago                    │   │
│  │    Topics: Authentication, Security, OAuth              │   │
│  │    Status: In Progress                                   │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  RECENT                                                         │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ 📝 Prisma Migration Strategy                             │   │
│  │    23 messages | Yesterday                                │   │
│  │    ✓ Completed                                           │   │
│  ├──────────────────────────────────────────────────────────┤   │
│  │ 📝 React Performance Issues                              │   │
│  │    31 messages | 3 days ago                              │   │
│  │    ✓ Completed                                           │   │
│  ├──────────────────────────────────────────────────────────┤   │
│  │ 📝 System Design Review                                   │   │
│  │    18 messages | 1 week ago                              │   │
│  │    ✓ Completed                                           │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  [+ New Conversation]                                           │
└─────────────────────────────────────────────────────────────────┘
```

### Conversation Arc

```
┌─────────────────────────────────────────────────────────────────┐
│  CONVERSATION ARC: Debugging OAuth Flow                         │
│                                                                 │
│  SUMMARY:                                                        │
│  Working through OAuth token refresh issues in production.      │
│  Identified root cause in token expiration handling.             │
│                                                                 │
│  DECISIONS MADE:                                                │
│  ✓ Using refresh token rotation instead of sliding sessions     │
│  ✓ Implementing token storage in secure HTTP-only cookies       │
│  ✓ Adding refresh token integrity checks                         │
│                                                                 │
│  OPEN QUESTIONS:                                                 │
│  [OPEN] Best practices for token revocation on logout?         │
│  [OPEN] How to handle concurrent token refresh requests?        │
│                                                                 │
│  CURRENT FOCUS:                                                 │
│  Implementing token refresh middleware                          │
│                                                                 │
│  [View Full Conversation] [Export Summary] [Share]              │
└─────────────────────────────────────────────────────────────────┘
```

---

## Feature 6: Analytics & Insights

### Memory Analytics

```
┌─────────────────────────────────────────────────────────────────┐
│  YOUR MEMORY ANALYTICS                                         │
│                                                                 │
│  OVERVIEW          THIS WEEK      THIS MONTH     ALL TIME        │
│  ───────────────────────────────────────────────────────────    │
│  Memories Created    +12           +47            247           │
│  Extracted           +8            +31            156           │
│  Manual             +4            +16             91           │
│                                                                 │
│  MEMORY DISTRIBUTION                                            │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Identity      ████████████████░░░░░░░░░░░  15%         │   │
│  │ Preferences   ██████████████████░░░░░░░░░  20%         │   │
│  │ Projects      █████████████████████████░░  30%         │   │
│  │ Knowledge     ████████████████░░░░░░░░░░░░  18%         │   │
│  │ Relationships ████████████░░░░░░░░░░░░░░░  12%         │   │
│  │ Other         ██████░░░░░░░░░░░░░░░░░░░░░   5%         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  IMPORTANCE DISTRIBUTION                                        │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Critical (90%+)  ████████░░░░░░░░░░░░░░░  12 memories  │   │
│  │ High (70-90%)    ██████████████████░░░░░  45 memories   │   │
│  │ Medium (40-70%) █████████████████████████ 89 memories   │   │
│  │ Low (<40%)       ██████████░░░░░░░░░░░░░  34 memories   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  TOP TAGS                                                       │
│  #programming (34) #react (28) #prisma (21) #career (18)      │
│                                                                 │
│  [Export Data] [View Trends]                                    │
└─────────────────────────────────────────────────────────────────┘
```

---

## Feature 7: Extraction & Automation

### Auto-Extraction

VIVIM can automatically extract memories from your conversations.

```
┌─────────────────────────────────────────────────────────────────┐
│  MEMORY EXTRACTION                                             │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  📥 EXTRACTION QUEUE                                     │  │
│  │                                                           │  │
│  │  Conversation: "Debugging OAuth Flow"                   │  │
│  │  Messages: 47 | Status: Processing...                    │  │
│  │  ████████████░░░░░░░░░░░░ 60%                          │  │
│  │                                                           │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  LAST EXTRACTED (3)                                             │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 💡 Using token rotation for OAuth refresh               │   │
│  │    Type: Procedural | Confidence: 92%                    │   │
│  │    [✓] Save  [✗] Discard  [Edit]                       │   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │ 🎯 Goal: Implement secure token storage                 │   │
│  │    Type: Goal | Confidence: 88%                          │   │
│  │    [✓] Save  [✗] Discard  [Edit]                       │   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │ 💡 John prefers async code reviews                       │   │
│  │    Type: Relationship | Confidence: 78%                  │   │
│  │    [✓] Save  [✗] Discard  [Edit]                       │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  EXTRACTION SETTINGS                                           │
│  [✓] Auto-extract from new conversations                      │
│  Confidence threshold: ██████████░░░░░░ 75%                    │
│  Extract types: [✓] All  [ ] Custom...                         │
│                                                                 │
│  [Run Extraction Now]                                         │
└─────────────────────────────────────────────────────────────────┘
```

---

## Feature 8: Pinned Memories

### Always-Remember

Pin critical memories to ensure they're always included in context.

```
┌─────────────────────────────────────────────────────────────────┐
│  PINNED MEMORIES                                               │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 📌 I am a Senior Full-Stack Developer                 │   │
│  │     Identity | Importance: 95%                        │   │
│  │     [Unpin] [Edit]                                    │   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │ 📌 Python is my primary language                       │   │
│  │     Identity | Importance: 90%                        │   │
│  │     [Unpin] [Edit]                                    │   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │ 📌 Working on OpenScroll project                       │   │
│  │     Project | Importance: 85%                         │   │
│  │     [Unpin] [Edit]                                    │   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │ 📌 Sarah is my co-founder                              │   │
│  │     Relationship | Importance: 90%                    │   │
│  │     [Unpin] [Edit]                                    │   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │ 📌 Prefer TDD methodology                              │   │
│  │     Procedural | Importance: 80%                       │   │
│  │     [Unpin] [Edit]                                    │   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │ 📌 Available 2-6pm PT for meetings                    │   │
│  │     Preference | Importance: 75%                       │   │
│  │     [Unpin] [Edit]                                    │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  [+ Add Pinned Memory]                                         │
│                                                                 │
│  💡 Tip: Pinned memories are always included in AI context.    │
│       Keep your most important ones here!                       │
└─────────────────────────────────────────────────────────────────┘
```

---

## Feature 9: Conflict Resolution

### Memory Conflicts

When VIVIM detects contradictory memories, it asks you to resolve them.

```
┌─────────────────────────────────────────────────────────────────┐
│  MEMORY CONFLICTS                                               │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  ⚠️ CONFLICT DETECTED                                     │  │
│  │                                                           │  │
│  │  Memory A:                                                │  │
│  │  "User prefers morning meetings (9-11 AM)"              │  │
│  │  Created: 2 months ago | Importance: 70%                │  │
│  │                                                           │  │
│  │  Memory B:                                               │  │
│  │  "User is most productive in afternoon (2-5 PM)"         │  │
│  │  Created: 1 week ago | Importance: 85%                   │   │
│  │                                                           │  │
│  │  Suggestion: Keep the newer, higher-importance memory     │  │
│  │                                                           │  │
│  │  RESOLUTION:                                              │  │
│  │  [Keep A] [Keep B] [Keep Both] [Merge] [Manual Edit]  │  │
│  │                                                           │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  0 Active Conflicts | 3 Resolved This Month                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Feature 10: Import/Export

### Data Portability

```
┌─────────────────────────────────────────────────────────────────┐
│  IMPORT / EXPORT                                                 │
│                                                                 │
│  EXPORT YOUR DATA                                                │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Format: [JSON            ▼]                            │  │
│  │                                                           │  │
│  │  Include:                                                │  │
│  │  [✓] All memories                                        │  │
│  │  [✓] Conversation summaries                             │  │
│  │  [✓] Topic profiles                                     │  │
│  │  [✓] Entity profiles                                    │  │
│  │  [✓] Settings & preferences                             │  │
│  │  [ ] Embeddings (reduces file size)                     │  │
│  │                                                           │  │
│  │  [Download Export]                                       │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  IMPORT DATA                                                    │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Drag & drop files here or [Browse Files]                │  │
│  │                                                           │  │
│  │  Supported: JSON, CSV, Markdown                           │  │
│  │                                                           │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  💡 Your data belongs to you. Export anytime, no questions.   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Quick Reference: Feature List

| Feature                | Description                 | Where to Find            |
| ---------------------- | --------------------------- | ------------------------ |
| **Create Memory**      | Add new info about yourself | Memory → + New           |
| **Search Memory**      | Find existing memories      | Memory → Search          |
| **Pin Memory**         | Always include in context   | Memory → Pin             |
| **Edit Context**       | Adjust AI behavior          | Settings → Context       |
| **View Topics**        | See what you know           | Topics → All             |
| **Manage Entities**    | People & projects           | Entities → All           |
| **View Conversations** | Past chats                  | Conversations            |
| **Extract Memories**   | Auto-capture from chat      | Extraction               |
| **Resolve Conflicts**  | Fix contradictions          | Conflicts                |
| **Export Data**        | Download your data          | Settings → Import/Export |

---

## Getting Help

- **Documentation**: [docs.vivim.ai](https://docs.vivim.ai)
- **Support**: [support@vivim.ai](mailto:support@vivim.ai)
- **Community**: [discord.gg/vivim](https://discord.gg/vivim)

---

_VIVIM - Giving AI a memory that never forgets._
