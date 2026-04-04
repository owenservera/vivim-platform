# VIVIM User Experience & Interaction Design

> **Generated:** March 23, 2026
> **Source:** VIVIM.docs/.archive user journey and feature analysis
> **Purpose:** Complete UX specification for VIVIM v1

---

## Executive Summary

This document defines the complete user experience for VIVIM v1, covering all user interactions, UI patterns, and feature flows. The design is organized around **8 user journey stages** and **3 core interaction pillars**.

### Core Design Principles

1. **Progressive Disclosure**: Show primary actions immediately, hide advanced features in menus
2. **Context-Aware**: AI suggestions appear based on content type
3. **P2P First**: Sharing defaults to local/P2P before cloud
4. **Attribution Chain**: Every fork/remix preserves lineage (like Git history)
5. **Non-Destructive**: Archive instead of delete, soft edits with history
6. **Cross-Platform Parity**: Same features on mobile and PWA, adapted to each platform

---

## 1. User Journey (8 Stages)

### Stage 1: DISCOVER (Day 0)

**Trigger Moments:**
| Trigger | Context | Emotional State |
|---------|---------|-----------------|
| Social media post | See someone share an AI conversation beautifully formatted | Curious, intrigued |
| Friend's recommendation | "You have to try this app for your AI chats" | Trust, openness |
| Viral conversation | A fascinating ChatGPT thread getting shared everywhere | FOMO, excitement |
| Search | "How to save ChatGPT conversations" | Frustrated, seeking solution |
| Content creator | YouTuber/influencer demos capturing their AI workflow | Aspirational |

**Landing Page Design:**
```
┌─────────────────────────────────────────────────────────────────┐
│                     VIVIM LANDING PAGE                          │
│                                                                 │
│              🔮 Own Your AI                                     │
│                                                                 │
│   "Your AI conversations are trapped in ChatGPT, Claude,        │
│    Gemini. VIVIM sets them free."                              │
│                                                                 │
│   ┌─────────────────┐  ┌─────────────────┐                     │
│   │  📱 Get Started │  │  👀 See Examples│                     │
│   └─────────────────┘  └─────────────────┘                     │
│                                                                 │
│   "Join 50,000+ people owning their AI knowledge"              │
│                                                                 │
│   Example Conversations:                                        │
│   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│   │ "Building a  │  │ "How to write│  │ "Understanding│        │
│   │  React       │  │  landing     │  │  quantum      │        │
│   │  Dashboard"  │  │  pages with  │  │  computing"   │        │
│   │  AI"         │  │              │  │              │        │
│   └──────────────┘  └──────────────┘  └──────────────┘        │
└─────────────────────────────────────────────────────────────────┘
```

**Success Metric:** Landing page → Sign up: **15%+ conversion**

---

### Stage 2: ONBOARD (Day 1)

**Sign-Up Flow (60 seconds):**

```
Step 1: Choose Auth          Step 2: Profile Setup         Step 3: First Capture
┌─────────────────────┐      ┌─────────────────────┐      ┌─────────────────────┐
│   Welcome to VIVIM  │      │  Make it yours      │      │  Your first capture │
│                     │      │                     │      │                     │
│  ┌───────────────┐  │      │  @username          │      │  Paste any AI chat  │
│  │ Continue with │  │      │  _______________    │      │  share link:        │
│  │    Google     │  │ ───▶ │                     │ ───▶ │                     │
│  └───────────────┘  │      │  Display Name       │      │  [________________] │
│  ┌───────────────┐  │      │  _______________    │      │                     │
│  │ Continue with │  │      │                     │      │  "We support 9 AI   │
│  │    Apple      │  │      │  [Skip for now]     │      │   platforms"        │
│  └───────────────┘  │      │                     │      │                     │
│                     │      │  [ Continue → ]     │      │  [ Capture Now → ]  │
│  or email/password  │      │                     │      │  [ Skip & Explore ] │
└─────────────────────┘      └─────────────────────┘      └─────────────────────┘
```

**First-Run Experience:**

**Option A: User has a ChatGPT link ready**
1. Paste share URL
2. Watch capture animation (3-5 seconds)
3. See conversation appear in their Vault
4. 🎉 Celebration moment: "Your first capture! This is now YOURS forever."

**Option B: User wants to explore first**
1. Skip capture
2. Land in Feed with curated trending conversations
3. Prompt to capture appears after 2-3 minutes browsing

**Onboarding Tooltips:**
```
┌─────────────────────────────────────────┐
│         FEED           VAULT            │
│           ▼                             │
│  ┌─────────────────────────────────┐   │
│  │ 👋 This is your Feed            │   │
│  │                                  │   │
│  │ Discover AI conversations from  │   │
│  │ creators you follow and topics  │   │
│  │ you love.                       │   │
│  │                                  │   │
│  │       [ Got it! ]               │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

**Success Metrics:**
- Sign up → First capture: **60%+ within 24 hours**
- Onboarding completion: **80%+**
- D1 retention: **50%+**

---

### Stage 3: CAPTURE - The "Aha!" Moment (Day 1-7)

**Primary Capture Flow:**

```
User Action                     App Response                      Emotion
─────────────────────────────────────────────────────────────────────────────

1. Copy ChatGPT share link
   from browser
        │
        ▼
2. Open VIVIM                    App detects clipboard has        Convenience
   (or use share sheet)          supported URL                    "That's smart"
        │
        ▼
3. Tap "Capture"                 Loading animation shows          Anticipation
                                 "Extracting from ChatGPT..."
        │
        ▼
4. ───────────────────────────▶  Full conversation appears        🎉 DELIGHT
                                 with:                             "This is amazing"
                                 • All messages preserved
                                 • Code blocks highlighted
                                 • Images extracted
                                 • Metadata captured
        │
        ▼
5. View in Vault                 Conversation is now:             Ownership
                                 • Encrypted (E2E)                 "This is MINE"
                                 • Searchable
                                 • Taggable
                                 • Shareable
```

**Capture Success Screen:**
```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                    ✅ Captured!                                 │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ "Building a React dashboard with charts"                │   │
│  │                                                         │   │
│  │ 📊 12 messages • 2,340 words • 3 code blocks           │   │
│  │ 🤖 ChatGPT-4 • 📅 Feb 8, 2026                          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │ 📁 Save  │  │ 🏷️ Tag   │  │ 📤 Share │  │ ✏️ Edit  │       │
│  │ to Vault │  │          │  │          │  │          │       │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘       │
│                                                                 │
│         [ View Conversation ]    [ Capture Another ]           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Supported Providers:**
| Provider | Capture Method | Status |
|----------|----------------|--------|
| ChatGPT | Share URL | ✅ Full support |
| Claude | Share URL | ✅ Full support |
| Gemini | Share URL | ✅ Full support |
| Grok | Share URL | 🔄 Beta |
| DeepSeek | Share URL | 🔄 Beta |
| Kimi | Share URL | 🔄 Beta |
| Qwen | Share URL | 🔄 Beta |
| z.ai | Share URL | 🔄 Beta |
| Mistral | Share URL | ❌ Missing |

**Success Metric:** First capture → Second capture: **40%+ within 7 days**

---

### Stage 4: EVOLVE (BYOK Chat) - The "Power" Moment (Week 2+)

**The BYOK "Aha!" Moment:**

```
User sees a forked conversation in their Vault:

┌─────────────────────────────────────────────────────────────────┐
│  🔀 Forked from @sarah_codes                                    │
│  "How to implement JWT auth in FastAPI"                        │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  User: How do I add refresh tokens?                            │
│                                                                 │
│  Claude: Here's how to implement refresh tokens...              │
│  ...                                                            │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 💬 Continue this conversation                          │   │
│  │    Pick up where this left off with your own AI         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  "But I want to ask about OAuth too..."                        │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Type your message...                          [Send →]   │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

**API Key Setup (First Time):**
```
┌─────────────────────────────────────────────────────────────────┐
│                    🔑 Add Your API Key                          │
│                                                                 │
│   To continue conversations, bring your own AI keys.           │
│   Your keys are encrypted and never leave your device.         │
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │ Provider:  [OpenAI ▼]                                   │   │
│   └─────────────────────────────────────────────────────────┘   │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │ API Key:   sk-abc123...                                 │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│   Supported: OpenAI, Anthropic, Google, Mistral, etc.          │
│                                                                 │
│   ⚠️  You pay your provider directly. We never see your bills.  │
│                                                                 │
│               [ Validate & Save ]                               │
└─────────────────────────────────────────────────────────────────┘
```

**Continue Conversation Flow:**

```
User Action                     App Response                      Emotion
─────────────────────────────────────────────────────────────────────────────

1. View captured/forked convo   "Continue this conversation"      Curiosity
        │                       button appears                    "I can do more?"
        ▼
2. Tap "Continue"               If no API key → setup prompt     Slight friction
                                If key exists → chat opens
        │
        ▼
3. Type follow-up question      Previous context is loaded       Excitement
   about the topic              automatically                    "It knows what
        │                                                         we discussed!"
        ▼
4. Send message ────────────▶   AI responds with full context    🎉 POWER
                                from original conversation        "I can build on
        │                       (streaming response)               anyone's work!"
        ▼
5. Continue chatting            New messages auto-save            Productivity
   as long as needed            to your Vault                     "This is my
                                                                   workspace now"
```

**BYOK Use Cases:**
| Use Case | User Action | Value |
|----------|-------------|-------|
| **Continue your own chat** | Pick up where ChatGPT left off | No context loss |
| **Fork & extend** | Continue someone's public convo | Build on community wisdom |
| **Model switching** | Try same prompt on Claude vs GPT | Compare AI responses |
| **Inject vault context** | Add ACUs from vault as context | Personal AI assistant |
| **Remix conversations** | Combine insights from multiple chats | Knowledge synthesis |

**Chat Interface:**
```
┌─────────────────────────────────────────────────────────────────┐
│  💬 Continuing: "FastAPI JWT Authentication"         [Claude ▼] │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  ┌ Context from original conversation ─────────────────────┐   │
│  │ 8 messages loaded • @sarah_codes • Feb 5, 2026          │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  You: What about adding OAuth2 providers like Google?          │
│                                                                 │
│  Claude: Great question! Here's how to add OAuth2 with         │
│  multiple providers to your FastAPI setup...                   │
│                                                                 │
│  ```python                                                      │
│  from authlib.integrations.starlette_client import OAuth       │
│  oauth = OAuth()                                                │
│  oauth.register("google", ...)                                 │
│  ```                                                            │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│  ┌─────────────────────────────────────────────────┐ ┌──────┐  │
│  │ Ask a follow-up question...                     │ │ Send │  │
│  └─────────────────────────────────────────────────┘ └──────┘  │
│                                                                 │
│  💾 Auto-saving to Vault    📊 ~1,200 tokens used ($0.02)      │
└─────────────────────────────────────────────────────────────────┘
```

**Success Metrics:**
- Users who add API key: **30%+ of Week 2 users**
- BYOK chat sessions per user per month: **5+**
- Forked convos continued: **40%+ of forks**
- Average continued conversation length: **+5 messages**

---

### Stage 5: EXPLORE (Building the Habit) (Week 3+)

**Daily Usage Pattern:**

```
Morning Routine                          Evening Routine
─────────────────                        ─────────────────

☀️ Wake up                               🌙 End of work
     │                                        │
     ▼                                        ▼
Open VIVIM                               Capture today's AI chats
     │                                        │
     ▼                                        ▼
Check Feed                               Organize with tags
"What's new?"                            "Let me file these"
     │                                        │
     ▼                                        ▼
Save interesting                         Search Vault
conversations                            "What was that code snippet?"
     │                                        │
     ▼                                        ▼
Maybe fork/remix one                     Review & reflect
for work today                           "I learned a lot today"
```

**Feed Engagement:**
```
┌─────────────────────────────────────────────────────────────────┐
│  FOR YOU    FOLLOWING    TRENDING                               │
│  ────────                                                       │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ @sarah_codes                                    2h ago  │   │
│  │                                                         │   │
│  │ "Finally figured out streaming with Claude!"            │   │
│  │                                                         │   │
│  │ This conversation helped me understand how to...        │   │
│  │                                                         │   │
│  │ 🤖 Claude-3    💬 8 messages    📖 3 min read          │   │
│  │                                                         │   │
│  │ ❤️ 234    💬 12    🔀 45 forks    📥 Save              │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ @ai_marketer                                    5h ago  │   │
│  │                                                         │   │
│  │ "My process for writing landing pages with GPT-4"       │   │
│  │ ...                                                     │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

**Vault Organization:**
```
MY VAULT
─────────────────────────────────────────

📁 All Captures (47)

📂 Collections
   ├── 💻 Coding Help (23)
   │   ├── React
   │   ├── Python
   │   └── DevOps
   ├── ✍️ Writing (12)
   ├── 🎨 Design Ideas (5)
   └── 📚 Learning (7)

🏷️ Tags
   #productivity #coding #ai-tips
   #prompting #work #personal

❤️ Favorites (8)
📥 Saved from Feed (15)
🕒 Recent (10)
🗑️ Trash (2)
```

**Search Experience:**
```
┌─────────────────────────────────────────────────────────────────┐
│  🔍 "react useEffect cleanup"                                   │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  RESULTS (3 matches)                     Filter: My Vault ▼     │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ "Understanding useEffect cleanup functions"             │   │
│  │                                                         │   │
│  │ ...when the component unmounts, the **cleanup**         │   │
│  │ function runs. Here's an example with **useEffect**:    │   │
│  │                                                         │   │
│  │ ```jsx                                                  │   │
│  │ useEffect(() => {                                       │   │
│  │   return () => { /* cleanup */ }                        │   │
│  │ }, [])                                                  │   │
│  │ ```                                                     │   │
│  │                                                         │   │
│  │ 📅 Jan 15, 2026 • ChatGPT-4 • 💻 Coding Help           │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

**Success Metrics:**
- Weekly active users: **60%+ of registered**
- Vault items per user at 30 days: **25+**
- Search queries per user per week: **5+**

---

### Stage 6: SHARE (ACU Power) (Month 1+)

**Share Motivations:**
| Motivation | Trigger | Share Type |
|------------|---------|------------|
| **Pride** | "I solved this hard problem" | Public to profile |
| **Help others** | "This prompt is really useful" | Public + hashtags |
| **Discussion** | "What do you think about this?" | Share to specific people |
| **Documentation** | "For my future self" | Private vault + link |
| **Building reputation** | "I'm an expert in X" | Curated public shares |

**Share Flow:**

```
1. User views conversation in Vault

┌─────────────────────────────────────────────────────────────────┐
│  "Building a REST API with FastAPI"                             │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  User: How do I set up FastAPI with authentication?             │
│                                                                 │
│  Claude: Here's a complete setup for FastAPI with JWT auth...   │
│  ...                                                            │
│                                                                 │
│  ┌──────────┐                                                   │
│  │ 📤 Share │  ← User taps                                      │
│  └──────────┘                                                   │
└─────────────────────────────────────────────────────────────────┘

2. Share options appear

┌─────────────────────────────────────────────────────────────────┐
│                       Share this conversation                   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 🌍 Share to Feed                                        │   │
│  │    Publish to your profile for followers to see         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 🔗 Copy Link                                            │   │
│  │    Anyone with link can view (unlisted)                 │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 📱 Share to...                                          │   │
│  │    Twitter, LinkedIn, WhatsApp, etc.                    │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│  🏷️ Add tags: #fastapi #python #api #authentication           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

3. Shared conversation appears in Feed

┌─────────────────────────────────────────────────────────────────┐
│  @yourname just shared                              Just now    │
│                                                                 │
│  "Building a REST API with FastAPI"                             │
│                                                                 │
│  Complete JWT authentication setup with FastAPI. Includes       │
│  password hashing, token generation, and protected routes.      │
│                                                                 │
│  🤖 Claude-3    💬 6 messages    #fastapi #python              │
│                                                                 │
│  ❤️ 0    💬 0    🔀 0 forks                                    │
└─────────────────────────────────────────────────────────────────┘
```

**Fork/Remix Flow:**

```
1. User sees interesting conversation in Feed
2. Taps "Fork" 🔀
3. Conversation copies to their Vault with attribution
4. They can now:
   - Edit/annotate it
   - Continue the conversation with their AI
   - Reshare their modified version

Fork attribution:
┌─────────────────────────────────────────────────────────────────┐
│  🔀 Forked from @sarah_codes                                    │
│  Original: "Python decorators explained"                        │
│                                                                 │
│  Your additions:                                                │
│  + Added examples for async decorators                          │
│  + Corrected error handling section                             │
└─────────────────────────────────────────────────────────────────┘
```

**Success Metric:** ACU shares: **20%+ of captures yield shared ACUs**

---

### Stage 7: BUILD (Power User) (Month 2+)

**Power User Behaviors:**
- Compose new conversations from ACUs
- Maintain curated collections
- Active in multiple circles
- Regular forking and remixing
- Create public tutorials
- Build reputation as expert

**ACU Composition:**
```
┌─────────────────────────────────────────────────────────────────┐
│  Compose New Conversation                                       │
│                                                                 │
│  Selected ACUs:                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ ✅ "JWT Auth Basics" from @sarah_codes                  │   │
│  │ ✅ "Refresh Token Implementation" from @john_dev        │   │
│  │ ✅ "OAuth2 with Google" from @auth_expert              │   │
│  │                                                          │   │
│  │ [+ Add ACU]                                              │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  [ Compose with AI → ]                                          │
│                                                                 │
│  "This will create a new conversation combining these          │
│   insights. The AI will help you synthesize them into a        │
│   coherent discussion."                                        │
└─────────────────────────────────────────────────────────────────┘
```

---

### Stage 8: ADVOCATE (Month 6+)

**Viral Mechanics:**
- Share to external platforms
- Invite friends to circles
- Create public tutorials
- Build reputation as expert

**Referral Flow:**
```
User shares conversation to Twitter
     │
     ▼
Follower clicks link
     │
     ▼
Lands on VIVIM with preview of conversation
     │
     ▼
"Get Started" → Sign up → Capture their first conversation
     │
     ▼
Original user gets notification: "Your share brought in @newuser!"
```

---

## 2. Interaction Features by Category

### 2.1 Interacting with Existing Conversations/ACUs

#### Primary Actions (High Frequency)

| Action | Button/Icon | Context | Behavior |
|--------|-------------|---------|----------|
| **Open/View** | Card tap | List view | Navigate to conversation detail |
| **Continue Chat** | `MessageSquarePlus` | ACU detail | Resume conversation with same AI |
| **Quick Reply** | Swipe + `Reply` | List view | Inline reply without opening full view |
| **Expand/Collapse** | `ChevronDown/Up` | Thread view | Show/hide message threads |

#### Organization & Discovery

| Action | Button/Icon | Purpose |
|--------|-------------|---------|
| **Add to Collection** | `FolderPlus` | Organize into curated groups |
| **Tag** | `Tag` | Add metadata labels |
| **Pin** | `Pin` | Keep at top of list |
| **Archive** | `Archive` | Hide from main feed but keep |
| **Duplicate** | `Copy` | Clone for personal variant |
| **Mark Unread** | `CircleDot` | Reset read state |

#### Content Manipulation

| Action | Icon | Behavior |
|--------|------|----------|
| **Edit Title** | `Pencil` | Inline rename |
| **Edit Message** | `Pencil` (hover) | Modify own messages |
| **Delete Message** | `Trash2` | Soft delete with undo |
| **Select Multiple** | `CheckSquare` | Batch operations |
| **Merge Conversations** | `Merge` | Combine related ACUs |
| **Split Thread** | `Scissors` | Extract sub-conversation as new ACU |

#### Information & Context

| Action | Icon | Displays |
|--------|------|----------|
| **View Metadata** | `Info` | Source, provider, timestamps, hash |
| **View Graph** | `GitGraph` | ACU relationship visualization |
| **View Versions** | `History` | Edit history / forks |
| **View Stats** | `BarChart3` | Word count, message count, reading time |

---

### 2.2 Social Sharing & Evolution

#### Sharing Patterns

| Action | Button | Behavior |
|--------|--------|----------|
| **Share Link** | `Share2` | Generate/copy public/private link |
| **Share to Circle** | `Users` | Distribute to specific circle |
| **QR Code** | `QrCode` | Generate scannable QR |
| **P2P Direct** | `Radio` | Send to discovered peer |
| **Export** | `Download` | PDF, Markdown, JSON export |

#### Collaborative Evolution

| Action | Icon | Concept |
|--------|------|---------|
| **Fork** | `GitFork` | Create derivative with attribution |
| **Remix** | `Blend` | Combine multiple ACUs into new |
| **Comment** | `MessageCircle` | Add discussion thread |
| **Suggest Edit** | `FileEdit` | Propose changes (PR-style) |
| **Request Merge** | `GitPullRequest` | Submit fork back to original |
| **Co-author** | `UserPlus` | Invite collaboration |

#### Social Feedback

| Action | Icon | Behavior |
|--------|------|----------|
| **Like/React** | `Heart` / reactions picker | Emoji reactions |
| **Bookmark** | `Bookmark` | Save for later |
| **Follow Author** | `UserPlus` | Subscribe to author's ACUs |
| **Add to Feed** | `Rss` | Include in personal feed |
| **Report** | `Flag` | Flag inappropriate content |

#### Circle Features

| Action | Icon | Purpose |
|--------|------|---------|
| **Create Circle** | `UsersPlus` | New sharing group |
| **Invite to Circle** | `UserPlus` | Add members |
| **Circle Settings** | `Settings2` | Permissions, visibility |
| **Leave Circle** | `LogOut` | Exit group |
| **Circle Chat** | `MessagesSquare` | Group discussion |

---

### 2.3 AI-Powered Features

#### Conversation Continuation

| Action | Icon | AI Behavior |
|--------|------|-------------|
| **Continue** | `Play` | Resume where left off |
| **Switch Model** | `Zap` | Continue with different AI |
| **Compare Models** | `Columns` | Run same prompt across multiple AIs |
| **Ask Follow-up** | `MessageSquarePlus` | New question in context |

#### Content Enhancement

| Action | Icon | AI Capability |
|--------|------|---------------|
| **Summarize** | `Text` | Generate tl;dr |
| **Extract Insights** | `Lightbulb` | Pull key takeaways |
| **Generate Title** | `Type` | Auto-title from content |
| **Expand** | `Maximize2` | Elaborate on points |
| **Simplify** | `Minimize2` | Reduce complexity |
| **Translate** | `Languages` | Convert to other languages |
| **Format** | `AlignLeft` | Convert to structured notes |

#### AI Analysis

| Action | Icon | Function |
|--------|------|----------|
| **Semantic Search** | `Search` | Find related ACUs by meaning |
| **Topic Cluster** | `Network` | Group similar conversations |
| **Contradiction Check** | `AlertTriangle` | Find conflicting statements |
| **Source Verification** | `ShieldCheck` | Validate claims |
| **Related ACUs** | `GitBranch` | Suggest similar conversations |

#### AI Composition

| Action | Icon | Behavior |
|--------|------|----------|
| **Compose with AI** | `Pencil` | Start new with AI assistance |
| **AI Chat about ACU** | `Bot` | Discuss content with AI |
| **Generate Questions** | `HelpCircle` | Create study questions |
| **Create Flashcards** | `Layers` | Convert to Anki-style cards |
| **Generate Code** | `Code` | Extract runnable code |

---

## 3. UI Implementation Patterns

### 3.1 Mobile (React Native + Tamagui) - Action Sheets Pattern

```tsx
// Long press on ACU card triggers action sheet
<ActionSheet>
  <ActionSheet.Item icon={MessageSquarePlus}>
    Continue Conversation
  </ActionSheet.Item>
  <ActionSheet.Item icon={GitFork} destructive>
    Fork ACU
  </ActionSheet.Item>
  <ActionSheet.Item icon={Share2}>
    Share...
  </ActionSheet.Item>
  <ActionSheet.Item icon={Archive}>
    Archive
  </ActionSheet.Item>
</ActionSheet>
```

### 3.2 PWA - Context Menus + FABs

```tsx
// Right-click context menu on ACU cards
<ContextMenu>
  <ContextMenu.Item shortcut="⌘O">Open</ContextMenu.Item>
  <ContextMenu.Item shortcut="⌘F">Fork</ContextMenu.Item>
  <ContextMenu.Separator />
  <ContextMenu.Sub label="Share">
    <ContextMenu.Item>Copy Link</ContextMenu.Item>
    <ContextMenu.Item>Share to Circle</ContextMenu.Item>
    <ContextMenu.Item>QR Code</ContextMenu.Item>
  </ContextMenu.Sub>
  <ContextMenu.Sub label="AI Actions">
    <ContextMenu.Item>Summarize</ContextMenu.Item>
    <ContextMenu.Item>Continue Chat</ContextMenu.Item>
    <ContextMenu.Item>Find Related</ContextMenu.Item>
  </ContextMenu.Sub>
</ContextMenu>
```

### 3.3 Smart Suggestions (AI-Powered)

```tsx
// Inline suggestions based on content
<SuggestionChips>
  <Chip onClick={() => summarize(acuId)}>Summarize</Chip>
  <Chip onClick={() => continueChat(acuId)}>Continue Chat</Chip>
  <Chip onClick={() => fork(acuId)}>Fork</Chip>
  <Chip onClick={() => findRelated(acuId)}>Find Related</Chip>
</SuggestionChips>
```

---

## 4. Priority Matrix

| Feature | Impact | Effort | Priority |
|---------|--------|--------|----------|
| Continue Chat | High | Low | P0 |
| Fork ACU | High | Medium | P0 |
| Share Link/QR | High | Low | P0 |
| Summarize | High | Medium | P1 |
| Semantic Search | High | High | P1 |
| Circle Sharing | Medium | High | P2 |
| Remix/Merge | Medium | High | P2 |
| Model Comparison | Medium | Medium | P2 |
| Suggest Edit | Low | High | P3 |

---

## 5. Success Metrics by Stage

| Stage | Metric | Target |
|-------|--------|--------|
| **DISCOVER** | Landing page → Sign up | 15%+ conversion |
| **ONBOARD** | Sign up → First capture | 60%+ within 24 hours |
| **CAPTURE** | First capture → Second capture | 40%+ within 7 days |
| **EVOLVE** | Users who add API key | 30%+ of Week 2 users |
| **EXPLORE** | Weekly active users | 60%+ of registered |
| **SHARE** | ACU shares | 20%+ of captures |
| **BUILD** | Power users (10+ captures/month) | 15%+ of MAU |
| **ADVOCATE** | Viral coefficient | 0.5+ (1 invite per 2 users) |

---

**Document Version:** 1.0
**Generated:** March 23, 2026
