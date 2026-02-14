# VIVIM v1: Atomic Feature Specification

> **Focus:** Feed + Vault + Smart Capture  
> **Tagline:** "Own Your AI"  
> **Generated:** February 9, 2026

---

## Executive Summary

VIVIM v1 is a consumer app focused on **capturing, owning, evolving, and sharing AI conversations**. The product has four core pillars:

| Pillar | What It Does | User Value |
|--------|--------------|------------|
| **Feed** | Social network for AI conversations | Discovery, inspiration, social proof |
| **Vault** | Personal encrypted knowledge store | Ownership, privacy, organization |
| **Capture** | Extract from any AI platform | Liberation from walled gardens |
| **Chat** | Continue conversations with your own AI keys | Evolve, remix, and build on knowledge |

**Total Features:** 120+ atomic features across 11 categories

---

## Table of Contents

1. [Capture System](#1-capture-system)
2. [Feed & Social](#2-feed--social)
3. [Vault & Storage](#3-vault--storage)
4. [Atomic Chat Units (ACU)](#4-atomic-chat-units-acu)
5. [BYOK AI Chat](#5-byok-ai-chat)
6. [Search & Discovery](#6-search--discovery)
7. [Identity & Security](#7-identity--security)
8. [Sharing & Collaboration](#8-sharing--collaboration)
9. [Recommendations](#9-recommendations)
10. [Mobile & PWA](#10-mobile--pwa)
11. [Platform & Infrastructure](#11-platform--infrastructure)

---

## 1. Capture System

*Extract AI conversations from any platform and ingest web content.*

### 1.1 AI Platform Extraction (MVP)

| ID | Feature | Description | Priority |
|----|---------|-------------|----------|
| C01 | **ChatGPT Capture** | Extract conversations from chat.openai.com share URLs | P0 |
| C02 | **Claude Capture** | Extract conversations from claude.ai URLs | P0 |
| C03 | **Gemini Capture** | Extract conversations from gemini.google.com | P0 |
| C04 | **Grok Capture** | Extract conversations from grok.com | P1 |
| C05 | **DeepSeek Capture** | Extract conversations from deepseek.com | P1 |
| C06 | **Kimi Capture** | Extract conversations from kimi.ai | P1 |
| C07 | **Qwen Capture** | Extract conversations from qwen.ai | P1 |
| C08 | **z.ai Capture** | Extract conversations from z.ai | P1 |
| C09 | **Mistral Capture** | Extract conversations from mistral.ai/chat | P1 |
| C10 | **Provider Auto-Detection** | Automatically identify AI provider from URL | P0 |
| C11 | **One-Click Capture** | Single action to capture from share URL | P0 |
| C12 | **Browser Extension** | Chrome/Firefox extension for instant capture | P1 |
| C13 | **Mobile Share Sheet** | iOS/Android share target for capture | P1 |
| C14 | **Capture Queue** | Queue multiple captures for batch processing | P1 |

### 1.2 Content Extraction (MVP)

| ID | Feature | Description | Priority |
|----|---------|-------------|----------|
| C11 | **Message Parsing** | Extract user and assistant messages | P0 |
| C12 | **Code Block Detection** | Identify and preserve code with syntax | P0 |
| C13 | **Image Extraction** | Capture images from conversations | P0 |
| C14 | **LaTeX/Math Support** | Preserve mathematical formulas | P1 |
| C15 | **Mermaid Diagrams** | Extract and render diagrams | P1 |
| C16 | **Table Preservation** | Maintain table structure | P0 |
| C17 | **Metadata Capture** | Title, model used, timestamps, provider | P0 |
| C18 | **Word/Token Count** | Calculate content metrics | P0 |
| C19 | **Conversation Thumbnail** | Auto-generate preview image | P1 |
| C20 | **Quality Scoring** | Rate capture quality (0-100) | P1 |

### 1.3 Smart Capture (v1.1)

| ID | Feature | Description | Priority |
|----|---------|-------------|----------|
| C21 | **Web Page Capture** | Extract content from any URL (not just AI chats) | P2 |
| C22 | **Link Following** | Optionally follow and capture linked pages | P2 |
| C23 | **Interest-Based Depth** | Use user interests to decide capture depth | P2 |
| C24 | **Source Document Download** | Download PDFs, docs referenced in content | P2 |
| C25 | **Scheduled Scraping** | Set up recurring captures of sources | P2 |
| C26 | **RSS/Feed Ingestion** | Subscribe to content feeds | P2 |
| C27 | **API Import** | Import from Notion, Obsidian, etc. | P2 |
| C28 | **Bulk URL Import** | Paste list of URLs for batch capture | P2 |
| C29 | **Capture Templates** | Pre-configured capture settings by use case | P2 |
| C30 | **AI Summarization** | Auto-summarize captured content | P2 |

---

## 2. Feed & Social

*The social network layer — discover, share, and remix AI conversations.*

### 2.1 Feed Experience (MVP)

| ID | Feature | Description | Priority |
|----|---------|-------------|----------|
| F01 | **For You Feed** | Personalized feed of conversations | P0 |
| F02 | **Following Feed** | Content from people you follow | P0 |
| F03 | **Trending Feed** | Popular conversations across platform | P0 |
| F04 | **Topic Feeds** | Filter by topic/category | P1 |
| F05 | **Conversation Card** | Preview card with title, excerpt, metrics | P0 |
| F06 | **Infinite Scroll** | Seamless content loading | P0 |
| F07 | **Pull to Refresh** | Mobile-native refresh gesture | P0 |
| F08 | **Read Position Memory** | Remember scroll position | P1 |
| F09 | **Content Filters** | Filter by provider, type, date | P1 |
| F10 | **Feed Customization** | Adjust algorithm preferences | P2 |

### 2.2 Social Interactions (MVP)

| ID | Feature | Description | Priority |
|----|---------|-------------|----------|
| F11 | **Like/Heart** | Express appreciation | P0 |
| F12 | **Save/Bookmark** | Save to personal collection | P0 |
| F13 | **Share** | Share to external platforms | P0 |
| F14 | **Comment** | Discussion on conversations | P1 |
| F15 | **Fork/Remix** | Copy and modify someone's conversation | P0 |
| F16 | **Follow User** | Subscribe to someone's shares | P0 |
| F17 | **View Count** | Display view metrics | P0 |
| F18 | **Fork Count** | Show how many times forked | P0 |
| F19 | **Notifications** | Alerts for social activity | P1 |
| F20 | **Activity Feed** | See your social interactions | P1 |

### 2.3 Content Display (MVP)

| ID | Feature | Description | Priority |
|----|---------|-------------|----------|
| F21 | **Conversation Viewer** | Full conversation display | P0 |
| F22 | **Syntax Highlighting** | Code blocks with proper styling | P0 |
| F23 | **Copy Code Button** | One-click code copy | P0 |
| F24 | **Expand/Collapse Messages** | Manage long conversations | P0 |
| F25 | **Image Lightbox** | Full-screen image viewing | P1 |
| F26 | **Link Preview** | Rich previews for shared links | P1 |
| F27 | **Provider Badge** | Show which AI was used | P0 |
| F28 | **Timestamp Display** | When conversation happened | P0 |
| F29 | **Reading Time** | Estimated read time | P1 |
| F30 | **Table of Contents** | For long conversations | P2 |

---

## 3. Vault & Storage

*Your personal, encrypted knowledge store.*

### 3.1 Personal Library (MVP)

| ID | Feature | Description | Priority |
|----|---------|-------------|----------|
| V01 | **My Captures** | List of all captured content | P0 |
| V02 | **My Forks** | Conversations you've remixed | P0 |
| V03 | **My Bookmarks** | Saved external content | P0 |
| V04 | **Collections** | User-created folders/groups | P0 |
| V05 | **Tags** | Custom labels for organization | P0 |
| V06 | **Favorites** | Quick-access starred items | P0 |
| V07 | **Recent** | Recently viewed content | P0 |
| V08 | **Trash** | Deleted items with recovery | P0 |
| V09 | **Archive** | Hide without deleting | P1 |
| V10 | **Sort & Filter** | Organize by date, type, provider | P0 |

### 3.2 Local-First Storage (MVP)

| ID | Feature | Description | Priority |
|----|---------|-------------|----------|
| V11 | **IndexedDB Storage** | Browser-based local storage | P0 |
| V12 | **Offline Access** | View content without internet | P0 |
| V13 | **Sync Queue** | Queue changes when offline | P0 |
| V14 | **Storage Stats** | Show usage and limits | P1 |
| V15 | **Data Export** | Export all data as JSON/ZIP | P0 |
| V16 | **Data Import** | Import from export files | P0 |
| V17 | **Selective Sync** | Choose what syncs to cloud | P1 |
| V18 | **Compression** | Reduce storage footprint | P1 |
| V19 | **Deduplication** | Prevent duplicate content | P1 |
| V20 | **Storage Cleanup** | Remove old/unused data | P1 |

### 3.3 Encryption & Security (MVP)

| ID | Feature | Description | Priority |
|----|---------|-------------|----------|
| V21 | **End-to-End Encryption** | Only you can read your data | P0 |
| V22 | **Key Generation** | User-controlled encryption keys | P0 |
| V23 | **Key Backup** | Secure key recovery options | P0 |
| V24 | **Zero-Knowledge Sync** | Server can't read your content | P1 |
| V25 | **Device Keys** | Per-device encryption | P1 |
| V26 | **Biometric Unlock** | Face/fingerprint on mobile | P1 |
| V27 | **PIN Protection** | Optional PIN for app access | P1 |
| V28 | **Auto-Lock** | Lock after inactivity | P1 |
| V29 | **Secure Delete** | Cryptographic deletion | P1 |
| V30 | **Audit Log** | Track access to sensitive data | P2 |

---

## 4. Atomic Chat Units (ACU)

*The fundamental building block. ACUs make conversations modular, composable, and shareable.*

> **Key Insight:** Conversations aren't monolithic—they're made of atomic knowledge units. Each ACU can be shared, forked, remixed, and composed into new conversations independently.

### 4.1 ACU Generation (MVP)

| ID | Feature | Description | Priority |
|----|---------|-------------|----------|
| A01 | **Auto-Decomposition** | Automatically break conversations into atomic units | P0 |
| A02 | **ACU Type Classification** | Identify: question, answer, code, explanation, summary, instruction | P0 |
| A03 | **Content Hashing** | SHA3-256 hash for deduplication and integrity | P0 |
| A04 | **Provenance Tracking** | Track source conversation, author, and original context | P0 |
| A05 | **Quality Scoring** | Rate value/usefulness of each ACU (0-100) | P1 |
| A06 | **Language Detection** | Detect programming language for code ACUs | P0 |
| A07 | **Timestamp Preservation** | Keep original creation time | P0 |
| A08 | **Metadata Extraction** | Extract topic, keywords, entities | P1 |

### 4.2 ACU Sharing & Composition (MVP)

| ID | Feature | Description | Priority |
|----|---------|-------------|----------|
| A09 | **Share Single ACU** | Share individual units, not just full conversations | P0 |
| A10 | **Fork ACU** | Copy a single unit to your vault | P0 |
| A11 | **ACU Embed** | Embed ACU in external sites (like tweets) | P1 |
| A12 | **Compose from ACUs** | Build new conversations by combining ACUs | P1 |
| A13 | **ACU Collections** | Group related ACUs into shareable sets | P1 |
| A14 | **ACU Link Sharing** | Direct link to any ACU | P0 |
| A15 | **ACU Preview Card** | Rich preview when sharing ACU links | P0 |
| A16 | **Attribution Chain** | Track fork/remix lineage | P1 |

### 4.3 ACU Organization (MVP)

| ID | Feature | Description | Priority |
|----|---------|-------------|----------|
| A17 | **ACU Search** | Find specific atomic units across vault | P0 |
| A18 | **ACU Tagging** | Add custom tags to units | P0 |
| A19 | **ACU Linking** | Connect related ACUs manually | P1 |
| A20 | **ACU Statistics** | Count by type, topic, source | P1 |
| A21 | **ACU Preview** | Quick view without opening | P0 |
| A22 | **ACU Copy** | One-click copy content | P0 |
| A23 | **Similar ACUs** | Find semantically similar units | P1 |
| A24 | **ACU Deduplication** | Detect and merge duplicates | P2 |

### 4.4 Knowledge Graph (v1.1)

| ID | Feature | Description | Priority |
|----|---------|-------------|----------|
| A25 | **Visual Graph** | See knowledge as connected nodes | P2 |
| A26 | **Topic Clusters** | Auto-group by topic | P2 |
| A27 | **Time View** | See knowledge over time | P2 |
| A28 | **Relationship Types** | Define how ACUs connect | P2 |
| A29 | **Graph Search** | Navigate by relationships | P2 |
| A30 | **Interest Profile** | Build interest profile from ACU graph | P2 |

---

## 5. BYOK AI Chat

*Bring Your Own Key. Continue, evolve, and remix conversations with AI — directly on VIVIM.*

> **Key Value:** Users don't just capture and store — they can pick up any conversation and continue it with AI, using their own API keys. This keeps them on the platform and creates a complete knowledge workflow.

### 5.1 API Key Management (MVP)

| ID | Feature | Description | Priority |
|----|---------|-------------|----------|
| B01 | **Add API Key** | Securely store API keys for AI providers | P0 |
| B02 | **Multi-Provider Keys** | Support OpenAI, Anthropic, Google, Mistral, etc. | P0 |
| B03 | **Key Encryption** | Encrypt keys with user's master key (never sent to our servers) | P0 |
| B04 | **Key Validation** | Test keys work before saving | P0 |
| B05 | **Usage Tracking** | Show token usage per provider | P1 |
| B06 | **Cost Estimation** | Estimate cost before sending request | P1 |
| B07 | **Key Rotation** | Easy key update without losing settings | P1 |
| B08 | **Default Provider** | Set preferred AI for new chats | P0 |

### 5.2 Continue Conversation (MVP)

| ID | Feature | Description | Priority |
|----|---------|-------------|----------|
| B09 | **Continue Any Chat** | Pick up any captured conversation and keep going | P0 |
| B10 | **Fork & Continue** | Fork someone's public convo and continue privately | P0 |
| B11 | **Context Injection** | Include vault ACUs as context for new messages | P1 |
| B12 | **Model Switching** | Switch AI models mid-conversation | P0 |
| B13 | **System Prompt** | Set custom system prompts for conversations | P1 |
| B14 | **Streaming Responses** | Real-time token streaming | P0 |
| B15 | **Response Regeneration** | Regenerate last response with different params | P1 |

### 5.3 Chat Experience (MVP)

| ID | Feature | Description | Priority |
|----|---------|-------------|----------|
| B16 | **Chat Interface** | Clean, responsive chat UI | P0 |
| B17 | **Markdown Rendering** | Full markdown + code syntax highlighting | P0 |
| B18 | **Image Upload** | Send images to vision-capable models | P1 |
| B19 | **File Attachment** | Attach documents for analysis | P1 |
| B20 | **Voice Input** | Speech-to-text for messages | P2 |
| B21 | **Message Editing** | Edit sent messages and regenerate | P1 |
| B22 | **Branch Conversations** | Create branches at any message | P1 |
| B23 | **Temperature Control** | Adjust creativity/randomness | P1 |
| B24 | **Max Tokens Setting** | Control response length | P1 |
| B25 | **Auto-Save to Vault** | Conversations auto-save to your vault | P0 |

---

## 6. Search & Discovery

*Find anything in your vault or the feed.*

### 5.1 Search (MVP)

| ID | Feature | Description | Priority |
|----|---------|-------------|----------|
| S01 | **Full-Text Search** | Keyword search across all content | P0 |
| S02 | **Semantic Search** | Search by meaning, not just words | P1 |
| S03 | **Search Filters** | Filter by type, date, source | P0 |
| S04 | **Search History** | Recent searches | P1 |
| S05 | **Search Suggestions** | Auto-complete queries | P1 |
| S06 | **Result Highlighting** | Show matching text | P0 |
| S07 | **Result Ranking** | Sort by relevance | P0 |
| S08 | **Search in Vault** | Search personal content | P0 |
| S09 | **Search in Feed** | Search public content | P0 |
| S10 | **Global Search** | Search everything at once | P1 |

---

## 6. Identity & Security

*Control your identity and protect your data.*

### 6.1 Authentication (MVP)

| ID | Feature | Description | Priority |
|----|---------|-------------|----------|
| I01 | **Email/Password** | Traditional auth option | P0 |
| I02 | **Social Login** | Google, Apple, GitHub | P0 |
| I03 | **Magic Link** | Passwordless email login | P1 |
| I04 | **2FA** | Two-factor authentication | P1 |
| I05 | **Session Management** | View/revoke active sessions | P1 |
| I06 | **Password Reset** | Secure password recovery | P0 |
| I07 | **Account Deletion** | Full data removal | P0 |
| I08 | **DID Generation** | Decentralized identifier (optional) | P2 |
| I09 | **Key-Based Auth** | Login with cryptographic keys | P2 |
| I10 | **Anonymous Mode** | Use without account (local only) | P1 |

### 6.2 Profile (MVP)

| ID | Feature | Description | Priority |
|----|---------|-------------|----------|
| I11 | **Username** | Unique public identifier | P0 |
| I12 | **Display Name** | Customizable name | P0 |
| I13 | **Avatar** | Profile picture | P0 |
| I14 | **Bio** | Short description | P0 |
| I15 | **Links** | Personal website, social links | P1 |
| I16 | **Public Profile** | View others' shared content | P0 |
| I17 | **Privacy Settings** | Control what's visible | P0 |
| I18 | **Follower Count** | Social metrics | P0 |
| I19 | **Following Count** | Who you follow | P0 |
| I20 | **Verified Badge** | Identity verification | P2 |

---

## 7. Sharing & Collaboration

*Share your knowledge, your way.*

### 7.1 Sharing Controls (MVP)

| ID | Feature | Description | Priority |
|----|---------|-------------|----------|
| H01 | **Public Share** | Anyone can view | P0 |
| H02 | **Private (Vault Only)** | Only you can see | P0 |
| H03 | **Unlisted Link** | Anyone with link can view | P0 |
| H04 | **Share to Profile** | Publish to your feed | P0 |
| H05 | **Selective Sharing** | Share parts of conversation | P1 |
| H06 | **Expiring Links** | Time-limited access | P2 |
| H07 | **Password Protection** | Require password to view | P2 |
| H08 | **View Limits** | Limit number of views | P2 |
| H09 | **Download Prevention** | Disable direct download | P2 |
| H10 | **Attribution Required** | Must credit original when forking | P1 |

---

## 8. Recommendations

*Surface the right knowledge at the right time.*

### 8.1 Personalization (MVP/v1.1)

| ID | Feature | Description | Priority |
|----|---------|-------------|----------|
| R01 | **Interest Detection** | Learn from captures and saves | P1 |
| R02 | **Similar Content** | "You might also like" | P1 |
| R03 | **Trending in Topics** | What's hot in your interests | P1 |
| R04 | **Rediscovery** | Surface old relevant content | P2 |
| R05 | **Daily Digest** | Curated daily recommendations | P2 |
| R06 | **Serendipity Mix** | Occasional outside-interest suggestions | P2 |
| R07 | **Dismiss/Dislike** | Train algorithm on dislikes | P1 |
| R08 | **Preference Controls** | Adjust rec settings | P2 |
| R09 | **Why This Rec** | Explain recommendations | P2 |
| R10 | **Disable Recs** | Option to turn off | P2 |

---

## 9. Mobile & PWA

*Native-feeling experience everywhere.*

### 9.1 Progressive Web App (MVP)

| ID | Feature | Description | Priority |
|----|---------|-------------|----------|
| M01 | **Installable** | Add to home screen | P0 |
| M02 | **Offline Mode** | Full offline support | P0 |
| M03 | **Push Notifications** | Engagement notifications | P1 |
| M04 | **Share Target** | Receive shares from other apps | P1 |
| M05 | **Responsive Design** | Phone, tablet, desktop | P0 |
| M06 | **Dark Mode** | System-aware theming | P0 |
| M07 | **Haptic Feedback** | Tactile responses | P1 |
| M08 | **Gesture Navigation** | Swipe actions | P1 |
| M09 | **Quick Actions** | Long-press shortcuts | P1 |
| M10 | **Background Sync** | Sync when app is closed | P1 |

---

## 10. Platform & Infrastructure

*The foundation that makes it all work.*

### 10.1 Backend (MVP)

| ID | Feature | Description | Priority |
|----|---------|-------------|----------|
| P01 | **REST API** | Core API endpoints | P0 |
| P02 | **Rate Limiting** | Prevent abuse | P0 |
| P03 | **Caching** | Fast content delivery | P0 |
| P04 | **CDN** | Global content distribution | P0 |
| P05 | **Database** | PostgreSQL + pgvector | P0 |
| P06 | **File Storage** | Object storage for media | P0 |
| P07 | **Background Jobs** | Async processing | P0 |
| P08 | **Logging** | Structured logging | P0 |
| P09 | **Monitoring** | Health checks, metrics | P0 |
| P10 | **Error Tracking** | Capture and alert on errors | P0 |

---

## Feature Priority Summary

| Priority | Count | Meaning |
|----------|-------|---------|
| **P0** | 75+ | Must have for MVP launch |
| **P1** | 45+ | Should have for MVP, okay to cut |
| **P2** | 15+ | v1.1 features |
| **P3** | 5 | Future roadmap |

**MVP Core (P0):** ~75 features  
**MVP Complete (P0+P1):** ~120 features  
**v1.1 (adds P2):** ~135 features

---

## MVP Definition

**VIVIM v1 MVP ships with:**

1. ✅ **Capture** from 9 AI platforms (ChatGPT, Claude, Gemini, Grok, DeepSeek, Kimi, Qwen, z.ai, Mistral)
2. ✅ **Feed** with For You, Following, Trending
3. ✅ **Vault** with local-first storage and E2E encryption
4. ✅ **ACU System** — decompose, share, and compose atomic knowledge units
5. ✅ **BYOK AI Chat** — continue conversations with your own API keys
6. ✅ **Social** interactions (like, save, fork, follow)
7. ✅ **Search** with full-text and filters
8. ✅ **Identity** with standard auth and public profiles
9. ✅ **Mobile PWA** that installs and works offline

**Notably NOT in MVP:**
- ❌ Deep web scraping (interest-based depth) — v1.1
- ❌ Visual knowledge graph — v1.1
- ❌ Forge (app builder) — v2
- ❌ Canvas (infinite workspace) — v2
- ❌ P2P sync — v2

---

## Success Metrics

| Metric | Target | Why It Matters |
|--------|--------|----------------|
| **Monthly Active Users** | 100K in 12 months | Market validation |
| **Captures/User/Month** | 10+ | Engagement depth |
| **BYOK Chat Sessions** | 5+/user/month | Platform stickiness |
| **ACU Shares** | 20%+ of captures yield shared ACUs | Viral content |
| **Fork Rate** | 5%+ of views | Viral coefficient |
| **Retention D7** | 40%+ | Product-market fit |
| **Vault Size** | 50+ ACUs avg | Lock-in/value |

---

*Document Version: 1.1*  
*Last Updated: February 9, 2026*

