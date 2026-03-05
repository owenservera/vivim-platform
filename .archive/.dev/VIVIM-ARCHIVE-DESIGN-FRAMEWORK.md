# DOCUMENT 13 — THE VIVIM ARCHIVE
## SOTA Design Framework: Universal AI Conversation Management

---

## 13A — PRODUCT PHILOSOPHY

The Archive is not a file manager. It is not a history tab. It is the **command center of a user's entire AI life** — every conversation they have ever had with any AI, in any context, organized, searchable, and alive.

The mental model is closer to a music library with a built-in studio than a folder of documents. Users do not just browse their past — they work from it. Every conversation in the Archive is a resource that can be continued, remixed, quoted, connected, searched across, and used to fuel the next conversation. The native AI chat is not a sidebar feature — it is equal in weight to the organizational features, and the two are inseparable by design.

### The three jobs the Archive does simultaneously:
1. **Library** — the complete, organized record of everything the user has ever explored with AI, across every provider
2. **Workspace** — the active environment where the user continues, branches, annotates, and builds on their past work
3. **Discovery engine** — an AI-powered surface that connects what the user is doing now to what they learned before, and to what others in their circles have explored

### Design principles that must not be violated:
- **Density with clarity.** Power users have thousands of conversations. The default view must show many at once without feeling chaotic. Every visual affordance must earn its pixel.
- **The chat is always one keystroke away.** No matter where the user is in the Archive, pressing a single key (or tapping a persistent button) opens a new AI chat with whatever is currently in view as context.
- **Everything is searchable, nothing requires perfect memory.** Users should never need to remember the exact title of a conversation. Semantic search, temporal search, provider filter, topic filter — all must work together and feel instant.
- **Organization is offered, never enforced.** Collections, tags, and labels are tools, not requirements. An Archive with zero organization must still be fully functional.
- **Import is frictionless, export is complete.** Getting chats in must feel effortless. Getting everything out must be a single action.

---

## 13B — INFORMATION ARCHITECTURE

### Primary Navigation Zones

The Archive is organized into five distinct zones, accessible from both the SideNav (desktop) and a dedicated Archive section of the BottomNav (mobile):

```
┌─────────────────────────────────────────────────────────┐
│  VIVIM ARCHIVE                                          │
├──────────────┬──────────────────────────────────────────┤
│              │                                          │
│  NAVIGATION  │          MAIN CONTENT AREA               │
│              │                                          │
│  ● All Chats │   [View-dependent — see section 13D]     │
│              │                                          │
│  ● Imported  │                                          │
│  ● Active    │                                          │
│  ● Shared    │                                          │
│  ● Collections│                                         │
│              │                                          │
│  ─────────   │                                          │
│              │                                          │
│  FILTERS     │                                          │
│  Providers   │                                          │
│  Date Range  │                                          │
│  Topics      │                                          │
│  Tags        │                                          │
│              │                                          │
│  ─────────   │                                          │
│              │                                          │
│  STATS       │                                          │
│  247 chats   │                                          │
│  14 providers│                                          │
│  2.4M tokens │                                          │
│              │                                          │
└──────────────┴──────────────────────────────────────────┘
```

### Zone Definitions

**All Chats** — the unified view of every conversation regardless of origin, status, or organization. Default landing. Sorted by last activity.

**Imported** — conversations captured from external providers (ChatGPT, Claude, Gemini, etc.) via the Capture flow. Organized by provider with import metadata visible (captured date, source URL, extraction quality score).

**Active** — conversations currently in progress within VIVIM's native chat. Includes drafts (started but not sent), in-progress (last message < 24 hours ago), and paused (picked up and set down multiple times). Sorted by last touch.

**Shared** — a two-panel view: "Sent" (Pulses and conversations shared outward, with engagement stats) and "Received" (Pulses and conversations shared inward, with Context Handoff status). This is the social inbox.

**Collections** — user-created groupings of conversations. Not folders — Collections are more like playlists. A conversation can belong to multiple Collections. Collections can be private, shared with a Circle, or public.

---

## 13C — THE CONVERSATION CARD (REDESIGNED)

This is the most rendered element in the entire app. It must carry significant information density while remaining scannable at speed. It exists in three sizes.

### Card Sizes

**Compact (List Default)**
```
┌─────────────────────────────────────────────────────────────┐
│ ●  [Provider Icon]  Title of the conversation          ···  │
│    Claude · 3h ago · 24 msgs · 4.2k tokens  📌  [tag] [tag]│
└─────────────────────────────────────────────────────────────┘
```
- Single-line title, truncated at ellipsis
- Provider icon colored with provider accent token
- Inline metadata: model name, relative timestamp, message count, token count
- Pin indicator if pinned
- Up to 2 tags visible, "+N more" if overflow
- Three-dot overflow menu on hover/long-press

**Standard (Default Grid)**
```
┌────────────────────────────────────┐
│  [Provider gradient top accent]    │
│                                    │
│  Title of the Conversation         │
│  that wraps to two lines max       │
│                                    │
│  First snippet of the conversation │
│  preview text, two lines max...    │
│                                    │
│  ─────────────────────────────     │
│  Claude 3.5 · 3h ago  📌  [tag]   │
│  24 msgs · 4.2k tk · 3 ACUs ↗    │
└────────────────────────────────────┘
```
- Provider accent as a 3px top border (not full background — avoids the current hardcoded color problem)
- Title: 2-line max, full weight
- Snippet preview: 2-line max, muted color, from first user message
- Metadata row: model, timestamp, pin, one tag
- Stats row: message count, token count, ACU count with link indicator
- Actions revealed on hover (desktop) or long-press (mobile): Continue, Share, Add to Collection, Archive, Delete

**Expanded (Detail Preview)**
Used when a card is "peek-opened" without full navigation — slide-in panel on desktop, bottom sheet on mobile:
- Full title
- Full first exchange (user message + AI response, with ContentRenderer)
- ACU strip: 3 highest-quality ACUs as chips
- Full metadata: all tags, all stats, source URL, capture date
- Action bar: Continue Chat, Open Full View, Share, Add to Collection
- Context Handoff badge if the conversation has been shared and absorbed by others

### Card States

| State | Visual Treatment |
|---|---|
| Default | Standard card as above |
| Pinned | Subtle top-left corner mark, slightly elevated shadow |
| Archived | 40% opacity on content area only — actions remain fully opaque (fixes current bug) |
| Active (in progress) | Animated pulse dot on provider icon, "In Progress" label |
| Syncing | Animated sync indicator overlaid on bottom edge |
| Error | Red left border, error icon, retry action visible without hover |
| Shared-Out | Small share indicator icon with view count |
| Shared-In (unread) | Blue left border accent, "New" badge |

---

## 13D — VIEW MODES

Users switch between four distinct view modes via a persistent toggle in the toolbar. The selection is persisted to IndexedDB (fixing the current non-persistence bug in `useHomeUIStore`).

### Mode 1: List (Default)
The most information-dense view. Compact cards in a single column. Maximum 15 visible at a time without scrolling on a 1080p desktop. Virtualized. Best for power users who know what they're looking for.

**Desktop:**
```
┌──────────────────────────────────────────────────────────────────┐
│ 🔍 Search all conversations...          [List][Grid][Canvas][Map]│
│ All · Imported · Active · Shared · Collections    ↕ Last active  │
├──────────────────────────────────────────────────────────────────┤
│ ● ChatGPT  Building a RAG pipeline with LangChain          ···   │
│            GPT-4o · 2h ago · 18 msgs · 3.1k tokens  [RAG][code] │
├──────────────────────────────────────────────────────────────────┤
│ ● Claude   Why React Server Components matter              ···   │
│            Sonnet 3.5 · 5h ago · 31 msgs · 6.8k tokens [react]  │
├──────────────────────────────────────────────────────────────────┤
│ ● Gemini   Meal planning for a 3-week Europe trip          ···   │
│            Gemini 1.5 · Yesterday · 8 msgs · 1.2k tokens [travel]│
└──────────────────────────────────────────────────────────────────┘
```

**Mobile:** Same structure, full width. Swipe right = quick-continue. Swipe left = archive.

### Mode 2: Grid
Cards in a responsive masonry grid. 2 columns on tablet, 3–4 columns on desktop depending on sidebar state. Standard-size cards. Best for visual browsing and rediscovering forgotten conversations.

Columns: `grid-cols-2 lg:grid-cols-3 xl:grid-cols-4` — fluid, not capped at 2 (fixes current bug).

### Mode 3: Canvas (Knowledge Graph)
A spatial, zoomable canvas where conversations are nodes and edges represent:
- **Semantic similarity** (same topic cluster — edges drawn by ACU embedding distance)
- **Temporal sequence** (one conversation led to another — user-defined or detected by URL capture sequence)
- **Shared ACUs** (two conversations produced the same knowledge unit)
- **Provider groups** (optional toggle to cluster by AI provider)

Nodes are sized by conversation token count. Node color is the provider accent. Clicking a node opens the Expanded card view. Drag to reposition. Pinch to zoom. Box-select to create a Collection from a cluster.

This is the view that makes VIVIM's knowledge graph viscerally real to the user. It should feel like looking at a constellation of everything they know.

**Mobile:** Canvas is available but touch-optimized — single finger pans, two fingers zoom, tap selects.

**Implementation note:** Use `@xyflow/react` (React Flow) rather than D3 directly. It handles virtualization, zoom, and interaction natively. Nodes are standard React components, meaning `ConversationCard` can render directly inside them.

### Mode 4: Timeline
Conversations arranged on a horizontal time axis, grouped by day/week/month (user selects granularity). Each provider has its own swimlane. Best for understanding how the user's AI usage has evolved over time and finding conversations by "when I was working on X."

```
JAN 2025 ──────────────── FEB 2025 ──────────────── MAR 2025 ───
ChatGPT  ■ ■■ ■   ■■■     ■  ■                      ■■   ■■■■
Claude      ■  ■■■ ■■     ■■■■■ ■■                  ■ ■■
Gemini           ■         ■   ■■■                   ■■■
Grok                              ■■                 ■
```

Each block (`■`) is a conversation. Hover/tap reveals the compact card. Click opens full view. Color = provider accent. Height of block = token count (bigger conversation = taller block).

---

## 13E — THE NATIVE AI CHAT (FIRST-CLASS CITIZEN)

The Archive's native chat is not an embedded widget — it is a full-screen-capable, production-grade AI chat interface that competes directly with ChatGPT, Claude.ai, and Gemini in quality of the chat experience, while adding VIVIM's unique context layer on top.

### Layout: Desktop (Three-Panel Architecture)

```
┌────────────────────────────────────────────────────────────────────┐
│ VIVIM                                                    [⚙][👤]  │
├──────────────┬─────────────────────────────┬───────────────────────┤
│              │                             │                       │
│  ARCHIVE     │      CHAT THREAD            │   CONTEXT PANEL       │
│  SIDEBAR     │                             │                       │
│  (260px)     │  ┌─────────────────────┐   │  Active Context:      │
│              │  │ You                 │   │  ┌─────────────────┐  │
│  [New Chat +]│  │ Explain HNSW index  │   │  │ L0 Identity    │  │
│              │  │ performance tradeoffs│   │  │ L1 Memory  ██  │  │
│  Recent      │  └─────────────────────┘   │  │ L2 ACUs    ████│  │
│  ─────────   │  ┌─────────────────────┐   │  │ L3 Convo   ██  │  │
│  Building a  │  │ Claude              │   │  └─────────────────┘  │
│  React RSC..│  │ HNSW (Hierarchical  │   │                       │
│  Meal plan.. │  │ Navigable Small...  │   │  Pinned Context:      │
│  RAG pipeli..│  │ [streaming...]      │   │  ┌─────────────────┐  │
│              │  └─────────────────────┘   │  │ + Add from      │  │
│  Yesterday   │                             │  │   Archive       │  │
│  ─────────   │  ┌─────────────────────┐   │  └─────────────────┘  │
│  Why RSC...  │  │ Input               │   │                       │
│  Gemini meal │  │ [__________________]│   │  Related:             │
│              │  │ [Model ▾] [Context]  │   │  ● RAG pipeline chat  │
│  This week   │  │ [📎][🎤]    [Send→] │   │  ● Vector DB notes    │
│  ─────────   │  └─────────────────────┘   │  ● HNSW paper review  │
│              │                             │                       │
└──────────────┴─────────────────────────────┴───────────────────────┘
```

The context panel on the right is the `ContextVisualizer` — redesigned to be a persistent companion rather than a modal. It shows live token allocation, allows pinning specific conversations or ACUs to the context, and surfaces "Related" conversations from the Archive using semantic similarity.

The context panel is **collapsible** — a toggle button reduces it to a thin rail showing only the layer health indicators (colored dots). Power users who know their context is good can collapse it and focus on the chat.

### Layout: Mobile (Full-Screen Chat with Context Tray)

Mobile shows the chat full-screen. The context is accessible via a persistent bottom tray handle:
- Tray collapsed (default): shows a one-line summary "3 layers · 4.2k / 8k tokens" with a chevron
- Tray expanded: slides up to cover 60% of screen, showing the full ContextVisualizer
- Keyboard visible: tray collapses automatically, context indicator moves to a chip above the input

### Chat Input Bar (Feature-Complete)

The input bar must match or exceed the quality of leading AI chat interfaces:

```
┌──────────────────────────────────────────────────────────────┐
│  [Context Recipe ▾]  [+ Add from Archive]                    │
│ ┌────────────────────────────────────────────────────────┐   │
│ │  Message Claude 3.5 Sonnet...                          │   │
│ │                                                        │   │
│ │                                                        │   │
│ └────────────────────────────────────────────────────────┘   │
│  [📎 Attach]  [🎤 Voice]  [⚡ Quick ACU]    [Model ▾] [→]   │
└──────────────────────────────────────────────────────────────┘
```

**Input bar feature inventory:**

| Feature | Description | Priority |
|---|---|---|
| Auto-resize textarea | Grows with content, max 8 lines, then scrolls | TIER 1 |
| Model selector | Dropdown showing all available models grouped by provider. Shows context window size and cost tier. Persists last selection | TIER 1 |
| Context Recipe selector | Dropdown of saved context configurations. "Default", "Code Review", "Research Mode", etc. | TIER 1 |
| Attach from Archive | Opens a mini Archive picker — search and select conversations/ACUs to pin to this message's context | TIER 1 |
| File attach | Attach files (PDF, images, code) directly. Shown as chip above input | TIER 1 |
| Voice input | Web Speech API transcription. Press-and-hold on mobile, toggle on desktop | TIER 2 |
| Quick ACU | One-click: create an ACU from the currently selected text in the chat thread | TIER 2 |
| Keyboard shortcuts | `⌘+Enter` send, `⌘+K` open model picker, `/` open command palette | TIER 1 |
| Slash commands | `/model`, `/context`, `/search`, `/new`, `/branch` — command palette style | TIER 2 |
| @ mentions | `@conversation-title` to pin a specific conversation into the current message context | TIER 2 |

### Message Thread (Feature-Complete)

**Every AI message must support:**

| Feature | Mechanism |
|---|---|
| Copy entire message | One-click, feedback toast |
| Copy code block | Per-block copy button, appears on hover |
| Regenerate | Re-run the last AI turn with the same context. Shows "Regenerated" badge |
| Branch from here | Creates a new conversation forking from this message pair. Original conversation is untouched |
| Create ACU | Highlight any text → "Create ACU" appears in selection toolbar. Opens ACU editor with pre-filled content |
| React with Resonance | Same resonance types as social layer — Spark, Anchor, etc. These affect the message's ACU quality score |
| Quote-reply | Select AI text, click quote icon → quoted block appears in input bar |
| View context used | "What context was used for this response?" — shows the exact ContextBundle that was active |
| Open in Archive | If the message references a concept the user has explored before, a "🔗 Related in Archive" chip appears |

**Streaming behavior:**
- Tokens stream in using a natural typing rhythm — not mechanical character-by-character
- A subtle animated gradient on the message card indicates streaming is in progress
- "Stop generating" button appears immediately when generation starts — large enough to tap on mobile
- If the connection drops mid-stream, the partial response is preserved and a "Reconnect & continue?" prompt appears

### Chat Session Management

Every chat session in the Archive is a first-class `Conversation` object. This means:

- **Branches:** Any chat can be branched from any message. The branch tree is visible in the conversation's detail view. Branches are shown as a tree visualization using the ACUGraph component.
- **Merge:** Two related conversations can be merged — their messages interleaved by timestamp, ACUs consolidated (deduplication applied).
- **Export:** Any conversation can be exported as Markdown, JSON, or PDF via the three-dot menu.
- **Continue Across Providers:** A conversation started with ChatGPT (imported) can be "continued" with Claude or Gemini. VIVIM injects the full conversation history as context. The new messages are stored as a branch of the original.

---

## 13F — SEARCH AND DISCOVERY

Search in the Archive is the feature that converts occasional users into daily users. It must feel magical — not like querying a database.

### Search Architecture

The Archive supports four simultaneous search modes, all accessible from a single input:

**1. Lexical Search** (instant, local)
Standard full-text search against conversation titles, message content, and tags. Runs client-side against Dexie IndexedDB. Results appear in < 50ms. Highlighted matches.

**2. Semantic Search** (AI-powered, server-side)
The user's query is embedded and compared against all ACU embeddings. Returns the most semantically relevant conversations even when no keyword matches. Shows a relevance score chip.

Example: searching "why did my vector search slow down" returns conversations about HNSW indexes, pgvector optimization, and embedding dimensions even if none of those exact words appear in the conversations.

**3. Temporal Search** (instant, local)
Natural language date parsing: "last month," "before I started the new job," "same week as my React conversation." Powered by `chrono-node` for date parsing. Filter bar equivalent but accessible from the main search input.

**4. Cross-Conversation Semantic Search** (the killer feature)
Searches not just for conversations about a topic, but for the **specific exchanges** across all conversations where a topic was discussed. Returns ACU-level results — not just "you have 3 conversations about RAG" but "here are the 7 specific messages across 3 conversations where you got the most insight about RAG."

Results rendered as `ACUResult` cards showing the specific message pair (question + answer) with a link to open the full conversation at that point.

### Search Results Layout

```
┌──────────────────────────────────────────────────────┐
│ 🔍  HNSW index performance                    [✕]   │
├──────────────────────────────────────────────────────┤
│  Conversations (4)              ACU Matches (12)     │
│                                                      │
│  ┌─────────────────────────────────────────────┐    │
│  │ Building a RAG pipeline with LangChain       │    │
│  │ Claude · 2h ago  ████████░░ 87% match        │    │
│  │ "...HNSW provides O(log n) query time but..."│    │
│  └─────────────────────────────────────────────┘    │
│                                                      │
│  ┌─────────────────────────────────────────────┐    │
│  │ [ACU] Why HNSW beats IVFFlat for most cases  │    │
│  │ From: RAG pipeline chat · High quality ●●●●○ │    │
│  │ "The key insight is that HNSW builds a..."   │    │
│  └─────────────────────────────────────────────┘    │
│                                                      │
│  ✨ AI Summary  "Across 4 conversations you've       │
│     explored HNSW from 3 angles: performance         │
│     benchmarks, implementation tradeoffs, and        │
│     memory footprint. Your most recent insight..."   │
└──────────────────────────────────────────────────────┘
```

The **AI Summary** at the bottom is a one-paragraph synthesis generated by calling the context engine with all matching ACUs as context and asking "what has this user learned about [query]?" It appears after lexical/semantic results load.

### Filters and Facets

Available as a collapsible filter panel alongside search results:

| Filter | Options | Implementation |
|---|---|---|
| Provider | Multi-select chips: ChatGPT, Claude, Gemini, Grok, etc. | Local filter on `conversations.provider` |
| Model | Multi-select (appears after provider selected) | Local filter on `conversations.metadata.model` |
| Date Range | Calendar picker + presets: Today, Week, Month, Year, Custom | Local filter on `conversations.createdAt` |
| Status | Imported, Active, Shared, Archived | Local filter on `conversations.status` |
| Token Count | Slider: 0 to max | Local filter on `conversations.totalTokens` |
| Has Code | Toggle | Filter on ACU type includes `code` |
| Has Math | Toggle | Filter on ACU type includes `math` |
| Tags | Multi-select from user's tag vocabulary | Local filter on `conversations.tags` |
| Collections | Multi-select from user's collections | Join filter |
| Quality Score | Slider: Low / Medium / High | Filter on average `ACU.qualityOverall` |

Filters are composable (AND logic by default, OR available per group). Active filters shown as removable chips above results. Filter state is shareable as a URL query string.

---

## 13G — THE SHARED ZONE (INBOX + OUTBOX)

This is the social surface within the Archive context. It is distinct from the Discovery Feed (which is algorithm-driven) — this is the direct record of what you have shared and received.

### Outbox (Shared by Me)

```
┌─────────────────────────────────────────────────────────┐
│  Shared by Me                            [+ New Share]  │
├─────────────────────────────────────────────────────────┤
│  ACTIVE SHARES                                          │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │ 🟢 Building a RAG pipeline          [Circle: Dev] │  │
│  │    Shared 2h ago · Expires: 7 days               │  │
│  │    👁 14 views  ⚡ 3 sparks  🧠 2 absorbs        │  │
│  │    [View Pulse]  [Edit]  [Revoke]                 │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │ 🔗 HNSW vs IVFFlat ACU              [Link · pub] │  │
│  │    Shared 1d ago · Never expires                 │  │
│  │    👁 67 views  ⚡ 12 sparks  🧠 8 absorbs       │  │
│  │    [View Pulse]  [Edit]  [Revoke]                 │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  EXPIRED / REVOKED                           [Show 12]  │
└─────────────────────────────────────────────────────────┘
```

Each outbound share shows:
- Visibility indicator (Circle name, Link, Public)
- Expiry status and countdown
- Engagement metrics: views, sparks, absorbs, challenges (real data, not mocked)
- Actions: View the Pulse as a recipient would see it, Edit annotation/expiry, Revoke (immediately invalidates the link/Circle push)

### Inbox (Shared with Me)

```
┌─────────────────────────────────────────────────────────┐
│  Shared with Me                    ● 3 unread           │
├─────────────────────────────────────────────────────────┤
│  NEW                                                     │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │ [did:key:z6Mk...] from Circle: Dev                │  │
│  │  "Key insight on attention mechanisms in LLMs"    │  │
│  │   🧠 2 known · ✨ 5 new concepts                  │  │
│  │  [Open in My Context]  [Absorb All]  [Skip]       │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  PREVIOUSLY RECEIVED                                    │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │ [did:key:z9Xr...] via Link                        │  │
│  │  "Prompt engineering patterns for code review"    │  │
│  │   ✅ Absorbed · 3 ACUs added to your memory       │  │
│  │  [View Absorbed ACUs]  [Remove from Memory]       │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

Each inbound share shows:
- Sender's DID (or display name if they are in a Circle where names are enabled)
- Source Circle or link type
- The pulse annotation
- Context Handoff badge: how many concepts match existing memory vs. how many are new
- Actions: Open in Context (runs full Context Handoff flow), Absorb All (immediately copies all ACUs), Skip

---

## 13H — COLLECTIONS

Collections are the organizational backbone of the Archive. They are intentionally simple but powerful.

### What a Collection Is

A Collection is a named, ordered list of conversations with an optional description, cover image (auto-generated from conversation topics), and visibility setting. It is not a folder — conversations are not "in" a Collection, they are "referenced by" it, and can belong to any number of Collections simultaneously.

### Collection Creation Flows

**Manual:** User taps "+ New Collection", names it, optionally describes it, then adds conversations by dragging from the Archive or using the "Add to Collection" action on any card.

**AI-Suggested:** After the Archive reaches 50+ conversations, a "Suggested Collections" section appears in the Collections zone. The AI analyzes conversation clusters by ACU topic similarity and proposes collection names: "Your React work (18 conversations)," "Trip planning (7 conversations)," "Machine Learning fundamentals (23 conversations)." The user accepts, edits, or dismisses each suggestion.

**Canvas Selection:** In Canvas mode, the user can box-select a cluster of nodes and create a Collection directly from the selection.

### Collection Detail View

```
┌──────────────────────────────────────────────────────────────┐
│  ← Collections                                              │
│                                                              │
│  ████████████████████  Machine Learning Fundamentals        │
│  [Generated cover]      23 conversations · Private          │
│                          "Everything I've learned about     │
│                           ML concepts, from basics to..."   │
│                                                              │
│  [+ Add Conversation]  [Share Collection]  [Export]  [···]  │
│                                                              │
│  ─────────────────────────────────────────────────────────  │
│  SORT: [Added ▾]  VIEW: [List][Grid][Canvas]                │
│  ─────────────────────────────────────────────────────────  │
│                                                              │
│  [Conversation cards here — same as Archive views]          │
│                                                              │
│  ─────────────────────────────────────────────────────────  │
│  AI SYNTHESIS  ✨                              [Regenerate]  │
│  "Across these 23 conversations, your understanding of      │
│   ML has evolved from basic linear regression toward        │
│   transformer architectures. Three recurring themes:        │
│   gradient descent intuition, attention mechanisms,         │
│   and practical implementation in PyTorch..."               │
└──────────────────────────────────────────────────────────────┘
```

The **AI Synthesis** at the bottom is the Collection's killer feature. It uses the collection's top ACUs as context and generates a paragraph describing what the user has actually learned across all the conversations in this collection. It updates when new conversations are added.

**Sharing a Collection** creates a structured Knowledge Pulse package containing the Collection metadata, all conversation cards (without full message content), and the AI Synthesis. Recipients can browse the Collection's overview and request access to individual conversations.

---

## 13I — IMPORT MANAGEMENT

The Imported zone gets a dedicated management surface since this is one of VIVIM's primary value propositions.

### Import Hub Layout

```
┌──────────────────────────────────────────────────────────────┐
│  Imported Conversations                         [+ Import]   │
├──────────────────────────────────────────────────────────────┤
│  PROVIDERS                    IMPORT HISTORY                 │
│                                                              │
│  ● ChatGPT     142   ████████                               │
│  ● Claude       67   ████                                   │
│  ● Gemini       23   ██                                     │
│  ● Grok          8   ▌                                      │
│  ● Perplexity    4   ▌                                      │
│  ─────────────────                                          │
│  Total          244                                         │
│                               Today (3)  ─────────────────  │
│                               ┌────────────────────────┐    │
│                               │ + Building a RAG pipe. │    │
│                               │   ChatGPT · 2h ago     │    │
│                               │   ✅ ACUs extracted    │    │
│                               └────────────────────────┘    │
│                               This week (12) ──────────     │
│                               Last month (47) ─────────     │
└──────────────────────────────────────────────────────────────┘
```

### Import Status States

Every imported conversation has a processing status that is visible in the Import Hub:

| Status | Meaning | Visual |
|---|---|---|
| `capturing` | Playwright headless extraction in progress | Animated progress bar |
| `processing` | ACU segmentation and embedding running | Spinning ACU icon |
| `ready` | Fully indexed and searchable | Green checkmark |
| `partial` | Extracted but embedding failed for some messages | Yellow warning with retry |
| `failed` | Extraction failed entirely | Red with error details and retry |
| `duplicate` | Same URL was previously imported | Grey with link to original |

### Bulk Import

For users migrating from another platform, a **Bulk Import** flow accepts:
- A folder of ChatGPT exported JSON files (from ChatGPT's own data export)
- A folder of Claude conversation exports
- A ZIP of custom JSON in VIVIM's documented schema
- A CSV with columns: `title`, `provider`, `url`, `date`

The bulk import runs as a background job with progress shown in the Import Hub. Individual failures do not stop the entire batch.

### Re-extraction

If VIVIM's extraction algorithm improves (new ACU scoring model, better segmentation), users can trigger **Re-extraction** on existing imported conversations — regenerating ACUs and embeddings with the latest pipeline. Available as a bulk action ("Re-process all ChatGPT conversations") or per-conversation.

---

## 13J — ANALYTICS DASHBOARD (WITHIN ARCHIVE)

The existing `/analytics` route gets elevated to a first-class section within the Archive context, not a standalone page.

### Key Metrics Surface

```
┌─────────────────────────────────────────────────────────────┐
│  Your AI Usage                         Last 30 days ▾       │
│                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  2.4M    │  │   244    │  │  1,847   │  │   4.2h   │   │
│  │  tokens  │  │  chats   │  │   ACUs   │  │  avg/day │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│                                                             │
│  PROVIDER BREAKDOWN         TOP TOPICS (by ACU frequency)   │
│  ChatGPT  ████████  58%     1. Machine Learning   ████████  │
│  Claude   ████      27%     2. React/Frontend     ██████    │
│  Gemini   ██         9%     3. System Design      █████     │
│  Other    ▌          6%     4. Travel Planning    ███       │
│                             5. Writing            ██        │
│                                                             │
│  USAGE OVER TIME                                            │
│  [Sparkline chart — conversations per day, last 30 days]    │
│                                                             │
│  KNOWLEDGE GROWTH                                           │
│  "Your memory graph has grown by 143 ACUs this month.       │
│   Your most explored new topic is attention mechanisms."    │
└─────────────────────────────────────────────────────────────┘
```

### What Analytics Unlocks for Discovery

Analytics is not just for reporting — it drives re-engagement:
- "You haven't talked about System Design in 3 weeks — your last 4 conversations about it are here"
- "Your ChatGPT conversations have 40% higher quality ACUs than your Gemini ones — consider this when choosing a model"
- "You've started 8 conversations about RAG but never finished exploring embedding dimensions — continue?"

These surfaced in a "Insights" widget below the metrics, not as push notifications.

---

## 13K — COMPONENT ARCHITECTURE MAP

New components required for the Archive system, their file paths, and their dependencies:

```
pwa/src/pages/Archive/
├── Archive.tsx                     # Shell — zone routing, layout manager
├── AllChats.tsx                    # Zone: full conversation list with all views
├── Imported.tsx                    # Zone: import hub + provider breakdown
├── Active.tsx                      # Zone: in-progress conversations
├── Shared.tsx                      # Zone: inbox + outbox
└── Collections.tsx                 # Zone: collection management

pwa/src/components/archive/
├── ConversationCard/
│   ├── ConversationCard.tsx        # Unified card — 3 sizes via prop
│   ├── ConversationCard.types.ts   # CardSize, CardState types
│   └── ConversationCardActions.tsx # Hover/long-press action bar
├── ViewModes/
│   ├── ListView.tsx                # Virtualized list
│   ├── GridView.tsx                # Responsive masonry grid
│   ├── CanvasView.tsx              # React Flow knowledge graph
│   └── TimelineView.tsx            # Swimlane timeline
├── Search/
│   ├── ArchiveSearch.tsx           # Unified search input + results
│   ├── SearchFilters.tsx           # Collapsible filter panel
│   ├── SearchResults.tsx           # Tabbed: Conversations | ACU Matches
│   ├── AISummaryWidget.tsx         # AI synthesis of search results
│   └── ACUResultCard.tsx           # Single ACU match result
├── Chat/
│   ├── ChatShell.tsx               # Three-panel layout manager
│   ├── ChatThread.tsx              # Message list (virtualized)
│   ├── ChatMessage.tsx             # Single message with all actions
│   ├── ChatInputBar.tsx            # Input + model selector + context tools
│   ├── ContextPanel.tsx            # Right panel: ContextVisualizer + pinned
│   ├── ModelSelector.tsx           # Provider/model dropdown (Radix)
│   └── BranchTree.tsx             # Visual branch navigator
├── Import/
│   ├── ImportHub.tsx               # Provider breakdown + import history
│   ├── ImportStatusCard.tsx        # Per-import status tracker
│   └── BulkImportFlow.tsx          # Multi-step bulk import wizard
├── Collections/
│   ├── CollectionCard.tsx          # Collection summary card
│   ├── CollectionDetail.tsx        # Full collection view
│   └── AISynthesisWidget.tsx       # AI summary of collection
└── Analytics/
    ├── AnalyticsDashboard.tsx      # Metrics overview
    ├── ProviderBreakdown.tsx       # Provider usage chart
    ├── TopicCloud.tsx              # Topic frequency visualization
    └── InsightsWidget.tsx          # AI-driven re-engagement prompts
```

### New Routes

| Route | Component | Description |
|---|---|---|
| `/archive` | `Archive.tsx` | Archive shell — defaults to All Chats |
| `/archive/imported` | `Imported.tsx` | Import hub |
| `/archive/active` | `Active.tsx` | In-progress chats |
| `/archive/shared` | `Shared.tsx` | Social inbox/outbox |
| `/archive/collections` | `Collections.tsx` | Collection browser |
| `/archive/collections/:id` | `CollectionDetail.tsx` | Single collection |
| `/archive/search` | `ArchiveSearch.tsx` | Dedicated search results page |
| `/chat` | `ChatShell.tsx` | Native chat (existing route, redesigned) |
| `/chat/:id` | `ChatShell.tsx` | Specific conversation continued |

### State Requirements

**New Zustand store: `useArchiveStore`**

```typescript
interface ArchiveStore {
  // View state
  activeZone: 'all' | 'imported' | 'active' | 'shared' | 'collections';
  viewMode: 'list' | 'grid' | 'canvas' | 'timeline';
  sortBy: 'lastActive' | 'createdAt' | 'tokenCount' | 'qualityScore';
  filters: ArchiveFilters;

  // Selection state (for bulk actions)
  selectedIds: Set<string>;
  isSelecting: boolean;

  // Search state
  searchQuery: string;
  searchMode: 'lexical' | 'semantic' | 'cross-conversation';
  searchResults: SearchResults | null;

  // Actions
  setViewMode: (mode: ViewMode) => void;
  setFilters: (filters: Partial<ArchiveFilters>) => void;
  toggleSelection: (id: string) => void;
  clearSelection: () => void;
  bulkArchive: (ids: string[]) => Promise<void>;
  bulkAddToCollection: (ids: string[], collectionId: string) => Promise<void>;
  bulkDelete: (ids: string[]) => Promise<void>;
}
```

**Persistence:** `viewMode`, `sortBy`, and `activeZone` persist to IndexedDB via Dexie `settings` table. `filters` and `searchQuery` are session-only (reset on page close). `selectedIds` is never persisted.

---

## 13L — BULK ACTIONS

When the user is in selection mode (triggered by long-pressing any card, or clicking a "Select" button in the toolbar), the toolbar transforms into a bulk action bar:

```
┌──────────────────────────────────────────────────────────┐
│  ← Cancel  [14 selected]                                 │
│  [Archive]  [Add to Collection]  [Export]  [Delete]  [+] │
└──────────────────────────────────────────────────────────┘
```

**Available bulk actions:**
- Archive / Unarchive
- Add to Collection (picker appears)
- Remove from Collection (if inside a collection view)
- Export as ZIP (Markdown + JSON for each selected conversation)
- Create Collection from selection
- Delete (requires confirmation, shows count of ACUs that will be removed)
- Share as Bundle (creates a multi-conversation Knowledge Pulse)
- Re-process ACUs (triggers re-extraction pipeline on selected conversations)

---

## 13M — EMPTY STATES AND ONBOARDING

The Archive empty state is a critical onboarding moment. It must convert new users rather than confuse them.

### First-Time Empty State

```
┌────────────────────────────────────────────────────────┐
│                                                        │
│         ✦                                             │
│      Your Archive                                     │
│      is waiting.                                      │
│                                                        │
│   Your AI conversations from ChatGPT, Claude,         │
│   Gemini and others will live here — organized,        │
│   searchable, and connected.                           │
│                                                        │
│   ┌──────────────────────────────────────────┐        │
│   │  📎  Import from ChatGPT                 │        │
│   └──────────────────────────────────────────┘        │
│   ┌──────────────────────────────────────────┐        │
│   │  ✦   Start a new AI chat                 │        │
│   └──────────────────────────────────────────┘        │
│   ┌──────────────────────────────────────────┐        │
│   │  ▶   Load demo archive                   │        │
│   └──────────────────────────────────────────┘        │
│                                                        │
└────────────────────────────────────────────────────────┘
```

### Provider-Specific Empty States

When the Imported zone is filtered to a specific provider with no results:
> "No ChatGPT conversations yet. Paste a conversation URL to import it, or export your full ChatGPT history and bulk-import it."
With direct links to ChatGPT's data export page and VIVIM's import guide.

### Post-Import First State

After first import (3–10 conversations), a contextual prompt appears:
> "Great start. Your 7 ChatGPT conversations have been processed into 43 knowledge units. Want VIVIM to suggest how to organize them?"
This triggers the AI-suggested Collections flow.

---

## 13N — DESIGN LANGUAGE FOR THE ARCHIVE

The Archive inherits the "Neo-Glassmorphic Knowledge Hub" design language from Document 10A but has its own specific constraints:

### Density and Layout Rules
- Card padding: `12px` internal, `8px` gap between cards in list mode, `16px` in grid mode
- Sidebar width: `260px` fixed on desktop, collapses to `0` (content full-width) with a `48px` icon-only rail option
- Content max-width: `1440px` at the shell level, `100%` within each zone
- Typography scale in cards: title at `14px/500`, metadata at `12px/400`, muted at `11px/400`

### Provider Color System Integration
Every conversation card uses the provider accent system (from Document 3E) as a `3px left border` in list mode and a `3px top border` in grid mode. This is the only provider color applied — no full backgrounds. This is consistent across light and dark mode because border colors are defined as CSS variables with proper dark-mode values.

### The Chat Interface Aesthetic
The chat thread deliberately mirrors the quality of Claude.ai and ChatGPT — clean, focused, generous whitespace between messages. The difference is VIVIM's context panel on the right, which introduces the system's unique visual identity: the layered token visualization with its color-coded layer bars.

User messages: right-aligned pill with `bg-brand-primary/10` tint, no heavy border.
AI messages: left-aligned, no background — the text floats. Provider icon appears top-left of each AI message.
Code blocks: dark surface regardless of theme, full-width, with language badge and copy button.

### Motion Principles Specific to Archive
- Card entrance: `fadeSlideUp` with 40ms stagger between cards (same as current, but with `prefers-reduced-motion` fallback)
- View mode switch: cards scale down to `0.95` and fade, new mode fades in. Duration: `200ms` ease-out.
- Canvas view: nodes animate in with a `spring(stiffness: 120, damping: 14)` from center. Edges draw in after nodes settle.
- Search results: instant lexical results appear immediately. Semantic results fade in above them when ready. AI summary fades in last.
- Panel transitions (context panel collapse/expand): `width` animation with `200ms` ease-in-out, content fades simultaneously.

---

## 13O — DETAILED IMPLEMENTATION TASKS & STEPS

Based on an analysis of the current VIVIM App source codebase architecture (React, Zustand, React-Router-DOM, Tailwind), the following is the phased, rigorous approach required to fully implement the Archive gracefully without breaking current features.

### Phase 1: Architecture & State Foundation
**Goal:** Establish the underlying data and state layer for the Archive.
1. **Zustand State (`pwa/src/stores/archive.store.ts`):** 
   - Create the `useArchiveStore` containing state for `activeZone`, `viewMode`, `sortBy`, `filters`, `searchQuery`, and `selectedIds`.
   - Incorporate `persist` middleware configured appropriately to save `viewMode`, `sortBy`, and `activeZone` to IndexedDB or localStorage, ensuring `searchQuery` and `selectedIds` remain session-only.
2. **IndexedDB (Dexie) Schema Update:** 
   - Ensure the `db` schema defines indexes for `conversations` on properties like `provider`, `createdAt`, `totalTokens`, `status`, and `tags`.
   - Ensure `ACU` collections have proper indexes for search matching and temporal queries.
3. **Route Wiring (`pwa/src/router/routes.tsx`):**
   - Add new lazy-loaded routes inside `AppLayout` wrapped with `AuthGuard`:
     - `/archive` mapped to `Archive` shell component.
     - `/archive/imported`, `/archive/active`, `/archive/shared`, `/archive/collections`, `/archive/search` mapped to their respective zone components.
     - `/archive/collections/:id` mapped to `CollectionDetail`.

### Phase 2: Shell UI & Navigation Base
**Goal:** Create the Archive frame and wire global navigations.
1. **Archive Component Shell (`pwa/src/pages/Archive/Archive.tsx`):** 
   - Implement the primary responsive shell structure, consisting of the Top/Search Bar, Secondary Zone Navigation Tabs (All, Imported, Active, Shared, Collections), and the main variable content area. 
2. **Global Navigation Integration:** 
   - Update `pwa/src/components/layout/SideNav.tsx` to include an "Archive" top-level link. 
   - Update `pwa/src/components/ios/IOSBottomNav.tsx` to ensure Mobile mapping includes the Archive tab.
3. **Layout Wrappers (`pwa/src/components/archive/`):**
   - Implement `ArchiveHeader` with embedded quick-search and View toggle (List, Grid, Canvas, Timeline).

### Phase 3: Core Conversation Views & Cards
**Goal:** Build the dense, visually excellent conversation displays.
1. **The Conversation Card Component (`ConversationCard.tsx`):**
   - Build a highly modular card that supports the 3 sizes: `compact` (list view), `standard` (grid masonry), and `expanded` (detail slide-in).
   - Inject the provider accent color using `var(--provider-accent)` for the 3px top border (grid) or left edge (list).
   - Implement the `ConversationCardActions.tsx` overlay that reveals Continue, Share, Archive, and Collection Add on hover/long-press.
2. **List View (`pwa/src/components/archive/ViewModes/ListView.tsx`):**
   - Use `@tanstack/react-virtual` or similar to handle virtualization of compact cards for high performance on 1000+ chats.
3. **Grid View (`pwa/src/components/archive/ViewModes/GridView.tsx`):**
   - Use CSS Grid/Masonry to dynamically fit 2-4 columns based on the window size breakpoint and Sidebar open state.

### Phase 4: Search & Discovery Engine
**Goal:** Make everything instantly findable lexically and semantically.
1. **Search Input & State (`ArchiveSearch.tsx`):**
   - Hook into the `useArchiveStore` search query state. On input change, trigger Debounced Dexie lexical queries.
2. **Semantic Search Integration:**
   - Call the backend semantic search endpoint passing the query for ACU matches.
   - Render results in a split view: `SearchResults.tsx` housing `ACUResultCard.tsx` mapped for each matched interaction.
3. **Filter Panel (`SearchFilters.tsx`):**
   - Build a collapsible UI alongside or below the search bar to house multi-selects for Provider, Date, Tags, and Token count sliders. Hook these directly into the local Dexie `.filter()` chains.
4. **AI Summary Synthesis (`AISummaryWidget.tsx`):** 
   - Create a component that receives the top 10 ACU matches and streams a synthesis query to the LLM backend summarizing the insights.

### Phase 5: Native AI Chat Redesign & Context Panel
**Goal:** Bring the core chat experience up to SOTA levels and integrate the visualizer.
1. **Three-Panel Layout (`pwa/src/components/archive/Chat/ChatShell.tsx`):**
   - Re-architect the `/chat` route. The layout consists of: a collapsible Archive Sidebar, the Main Thread, and the Collapsible Right Context Panel.
2. **Context Visualizer Redeploy (`ContextVisualizer.tsx`):** 
   - Extract the existing ContextCockpit or modal Visualizer and lodge it into the right panel. Make it collapsible into a colored dot strip rail.
3. **Input Bar Enhancements (`ChatInputBar.tsx`):** 
   - Implement an auto-resizing textarea.
   - Add a `ModelSelector.tsx` dropdown integrated with the user's available models and limits.
   - Attach Archive Context button that spawns a search dialog to "Pin" existing conversations to the current chat prompt.
4. **Message Actions (`ChatMessage.tsx`):** 
   - Ensure every message has: Copy text, Copy Code Block, Regenerate, Highlight to Create ACU, and "Branch from here".

### Phase 6: Advanced Layouts & Interactions
**Goal:** Implement the "Wow-factor" views like the Canvas Graph.
1. **Canvas View (`CanvasView.tsx`):** 
   - Install `@xyflow/react` if not present. Map conversations and their semantic similarity to Nodes and Edges. Use provider accent coloring for nodes. Implement drag/zoom interactions. 
2. **Timeline View (`TimelineView.tsx`):** 
   - Build horizontal swimlanes utilizing D3 or standard SVG charts grouping conversations horizontally by time buckets.
3. **Bulk Action Mechanics:** 
   - Implement `selectedIds` multi-select pattern. When `selectedIds.size > 0`, transform the Main Header into the Bulk Actions toolbar allowing for bulk Archive, add-to-collection, or Export.

### Phase 7: Specific Zones (Imported & Shared)
**Goal:** Bring the ingestion and distribution layers into the Archive.
1. **Import Hub (`ImportHub.tsx`):**
   - List background processing status cards using the socket or poll for provider scrapes (via Playwright or local imports).
   - Display a visual Provider Breakdown chart.
2. **Shared Zone (`Shared.tsx`):**
   - Two-pane UI connecting to the existing Knowledge Pulse delivery mechanisms. Show `Outbox` with view/absorb metrics and `Inbox` with context hand-off verification flows.

### Phase 8: Collections & Integration
**Goal:** Introduce Collections and synthesize analytics within the Archive.
1. **Collections (`Collections.tsx` & `CollectionDetail.tsx`):**
   - Read/write Collections entity models to local db. 
   - Provide an "Add to Collection" picker context menu.
   - In Detail view, implement the `AISynthesisWidget.tsx` configured to summarize the collection's combined ACUs.
2. **Analytics Repositioning:**
   - Migrate components from `pwa/src/pages/Analytics.tsx` into an inner view `pwa/src/components/archive/Analytics/AnalyticsDashboard.tsx` surfaced natively inside the Archive navigation frame. Provide direct actionable re-engagement recommendations based on the analytics values.

*Note: All tasks must adhere to `prefers-reduced-motion` considerations, strict glassmorphism/tailwind SOTA principles defined in 13N, and heavily utilize localized Dexie querying to ensure the UI feels instant (<50ms response).*
