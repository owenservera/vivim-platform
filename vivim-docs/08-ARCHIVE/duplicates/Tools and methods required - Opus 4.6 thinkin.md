

# VIVIM Tool Ecosystem

## The Complete Root Capture System & Tooling Blueprint

---

## Part I: The Capture Problem

### The Reality of How Humans Interact With AI in 2025

Before designing tools, we must map every surface where a human's cognitive output enters an AI system. Every one of these surfaces is a data leak point. Every one must be captured.

```
THE AI INTERACTION SURFACE MAP

A human's daily AI touchpoints (knowledge worker, 2025):

06:30  Voice: "Hey Siri, summarize my calendar"              ← Voice assistant
07:15  Mobile: Opens ChatGPT app, asks about commute          ← Mobile app
08:00  Browser: Claude.ai — brainstorms project architecture   ← Web chat
08:45  IDE: Cursor autocomplete writing production code         ← Code editor AI
09:30  Email: Gmail AI drafts response to client               ← Embedded AI
10:00  Docs: Google Docs AI helps write proposal               ← Productivity AI
10:30  Search: Perplexity research on competitor                ← AI search
11:00  Slack: Uses Slack AI to summarize channel               ← Enterprise chat AI
11:30  Browser: Claude.ai — deep technical discussion          ← Web chat
12:00  Mobile: ChatGPT voice mode, talks through problem       ← Mobile + voice
13:00  API: Python script calls OpenAI API for data analysis   ← Direct API
14:00  Teams: Microsoft Copilot in Teams meeting summary       ← Enterprise AI
14:30  IDE: GitHub Copilot suggests test cases                 ← Code editor AI
15:00  Browser: Gemini — reviews legal contract language        ← Web chat
15:30  Terminal: AI CLI tool generates database migration       ← CLI AI
16:00  Figma: AI generates design variations                   ← Design tool AI
16:30  Notion: Notion AI restructures meeting notes            ← Productivity AI
17:00  Browser: Claude.ai — writes performance review draft    ← Web chat
17:30  Excel: Microsoft Copilot analyzes spreadsheet           ← Productivity AI
18:00  Mobile: Asks Claude about dinner recipe (personal)      ← Mobile app
19:00  Browser: Midjourney generates images for side project   ← Creative AI
20:00  Browser: ChatGPT helps debug side project               ← Web chat

THAT IS 20+ AI INTERACTIONS ACROSS 12+ DIFFERENT SURFACES
IN A SINGLE DAY.

If even ONE surface is uncaptured, the vault is incomplete,
the detection algorithms have gaps, and sovereignty has holes.
```

### The Two Capture Approaches

```
APPROACH 1: APPLICATION-LEVEL CAPTURE
══════════════════════════════════════════════════════

How:    Individual tools for each application surface.
        Browser extension for web. IDE plugin for code editors.
        Mobile companion app. API proxy for direct API calls.
        Each tool captures its specific surface.

Pros:
  ✓ No root/admin access required
  ✓ Works on managed devices (corporate laptops)
  ✓ User installs only what they need
  ✓ Each tool is purpose-built for its surface
  ✓ Easier to get through app store review
  ✓ Lower trust requirement (limited permissions)
  ✓ Modular — add new surfaces incrementally

Cons:
  ✗ Gaps between tools (surfaces without dedicated tools)
  ✗ User must install and configure many tools
  ✗ New AI surfaces require new tools
  ✗ Embedded AI (inside other apps) is hard to capture
  ✗ Consistency across tools is challenging
  ✗ Some surfaces resist extension (native mobile apps)


APPROACH 2: SYSTEM-LEVEL CAPTURE (ROOT AGENT)
══════════════════════════════════════════════════════

How:    A system-level agent that monitors ALL network traffic
        and application activity. Identifies AI interactions
        regardless of which app or surface is used. Captures
        everything at the OS/network level.

Pros:
  ✓ Complete capture — no gaps
  ✓ Single installation covers all surfaces
  ✓ Automatically captures new AI services
  ✓ Captures embedded AI that resists extension
  ✓ Unified processing pipeline
  ✓ Can capture voice, clipboard, file-based interactions

Cons:
  ✗ Requires root/admin access (high trust)
  ✗ May not work on managed corporate devices
  ✗ Privacy concerns (captures EVERYTHING)
  ✗ Performance overhead (always-on monitoring)
  ✗ Complex to build (OS-specific, fragile)
  ✗ App store rejection risk (invasive permissions)
  ✗ Antivirus/security software may flag it
  ✗ SSL/TLS interception is technically and ethically fraught


VIVIM'S ANSWER: BOTH, LAYERED
══════════════════════════════════════════════════════

Layer 1 (Default): Application-level tools
  → Everyone installs these. Covers 80%+ of interactions.
  → Browser extension + mobile app + IDE plugins.
  → No special permissions required.

Layer 2 (Optional): System-level agent
  → Power users who want complete capture.
  → Requires explicit consent and admin access.
  → Fills gaps left by Layer 1.
  → NOT required for VIVIM to function.

Layer 3 (Complementary): Historical import
  → Backfill from existing providers' export tools.
  → One-time migration of historical data.
  → Runs independently of ongoing capture.

This document specifies every tool across all three layers.
```

---

## Part II: Complete Tool Inventory

### Master Tool List

```
VIVIM TOOL ECOSYSTEM — COMPLETE INVENTORY

═══════════════════════════════════════════════════════
LAYER 1: APPLICATION-LEVEL CAPTURE (13 tools)
═══════════════════════════════════════════════════════

1.  VIVIM BROWSER EXTENSION (Chrome/Firefox/Safari/Edge)
    Captures: All web-based AI chat interactions
    Priority: ████████████████████ CRITICAL — build first

2.  VIVIM MOBILE APP (iOS/Android)
    Captures: Mobile AI app interactions + acts as vault viewer
    Priority: ████████████████████ CRITICAL

3.  VIVIM IDE PLUGIN (VS Code/JetBrains/Cursor/Neovim)
    Captures: Code-assistant interactions (Copilot, Cursor, Codeium)
    Priority: ████████████████░░░░ HIGH

4.  VIVIM API PROXY
    Captures: Direct API calls to AI providers
    Priority: ████████████████░░░░ HIGH

5.  VIVIM DESKTOP APP (macOS/Windows/Linux)
    Central hub: Vault management, detection, settings
    Priority: ████████████████░░░░ HIGH

6.  VIVIM EMAIL COMPANION
    Captures: AI-assisted email composition (Gmail, Outlook)
    Priority: ████████████░░░░░░░░ MEDIUM

7.  VIVIM PRODUCTIVITY PLUGIN (Google Workspace/Microsoft 365)
    Captures: AI features in Docs, Sheets, Slides, Word, Excel
    Priority: ████████████░░░░░░░░ MEDIUM

8.  VIVIM SLACK/TEAMS BOT
    Captures: Enterprise AI assistant interactions
    Priority: ████████████░░░░░░░░ MEDIUM

9.  VIVIM CLI TOOL
    Captures: Terminal-based AI interactions
    Priority: ████████░░░░░░░░░░░░ MODERATE

10. VIVIM VOICE CAPTURE
    Captures: Voice-mode AI interactions
    Priority: ████████░░░░░░░░░░░░ MODERATE

11. VIVIM CREATIVE TOOL PLUGIN (Figma/Adobe/Canva)
    Captures: AI-assisted design/creative interactions
    Priority: ████░░░░░░░░░░░░░░░░ LOWER

12. VIVIM SEARCH COMPANION
    Captures: AI search (Perplexity, Google AI Overview, Bing Chat)
    Priority: ████░░░░░░░░░░░░░░░░ LOWER

13. VIVIM CALENDAR/MEETING COMPANION
    Captures: AI meeting summaries, scheduling AI
    Priority: ████░░░░░░░░░░░░░░░░ LOWER

═══════════════════════════════════════════════════════
LAYER 2: SYSTEM-LEVEL CAPTURE (3 tools)
═══════════════════════════════════════════════════════

14. VIVIM ROOT AGENT (macOS)
    System-level AI interaction monitor
    Priority: ████████████░░░░░░░░ MEDIUM (after Layer 1 stable)

15. VIVIM ROOT AGENT (Windows)
    System-level AI interaction monitor
    Priority: ████████████░░░░░░░░ MEDIUM

16. VIVIM ROOT AGENT (Linux)
    System-level AI interaction monitor
    Priority: ████████░░░░░░░░░░░░ MODERATE

═══════════════════════════════════════════════════════
LAYER 3: HISTORICAL IMPORT (8 tools)
═══════════════════════════════════════════════════════

17. IMPORT: OpenAI/ChatGPT History
    Full conversation history import
    Priority: ████████████████████ CRITICAL

18. IMPORT: Anthropic/Claude History
    Full conversation history import
    Priority: ████████████████████ CRITICAL

19. IMPORT: Google/Gemini History
    Full conversation history import
    Priority: ████████████████░░░░ HIGH

20. IMPORT: Microsoft Copilot History
    Full conversation history import
    Priority: ████████████░░░░░░░░ MEDIUM

21. IMPORT: Perplexity History
    Full conversation history import
    Priority: ████████░░░░░░░░░░░░ MODERATE

22. IMPORT: Meta AI History
    Priority: ████████░░░░░░░░░░░░ MODERATE

23. IMPORT: Generic JSON/CSV/Markdown
    For any provider with data export capability
    Priority: ████████████████░░░░ HIGH

24. IMPORT: Browser History AI Extraction
    Scans browser history for AI interaction URLs,
    attempts to reconstruct conversations from local cache
    Priority: ████░░░░░░░░░░░░░░░░ LOWER

═══════════════════════════════════════════════════════
INFRASTRUCTURE (7 components)
═══════════════════════════════════════════════════════

25. VIVIM VAULT ENGINE
    Core storage, encryption, indexing, sync engine
    Priority: ████████████████████ CRITICAL — prerequisite for all

26. VIVIM PROCESSING PIPELINE
    ACU extraction, classification, hashing, signing
    Priority: ████████████████████ CRITICAL

27. VIVIM SYNC SERVICE
    Cross-device vault synchronization (encrypted)
    Priority: ████████████████░░░░ HIGH

28. VIVIM IDENTITY SERVICE
    DID creation, key management, SSC registration
    Priority: ████████████████████ CRITICAL

29. VIVIM DETECTION ENGINE
    Algorithms 1-13 from Detection Architecture
    Priority: ████████████████░░░░ HIGH (after capture stable)

30. VIVIM MARKETPLACE
    Data listing, dual-consent, revenue distribution
    Priority: ████████████░░░░░░░░ MEDIUM

31. VIVIM ORGANIZATION DASHBOARD
    SSC management, metadata view, consent workflow
    Priority: ████████████░░░░░░░░ MEDIUM

═══════════════════════════════════════════════════════
DEVELOPER ECOSYSTEM (4 tools)
═══════════════════════════════════════════════════════

32. VIVIM SDK (JavaScript/TypeScript)
    For building VIVIM-integrated applications
    Priority: ████████████░░░░░░░░ MEDIUM

33. VIVIM SDK (Python)
    For data science, detection algorithm development
    Priority: ████████████░░░░░░░░ MEDIUM

34. VIVIM CAPTURE SDK
    For third-party developers to add VIVIM capture to their apps
    Priority: ████████░░░░░░░░░░░░ MODERATE

35. VIVIM PROVIDER COMPLIANCE KIT
    For AI providers to integrate VIVIM-native consent/capture
    Priority: ████████░░░░░░░░░░░░ MODERATE (aspirational)

═══════════════════════════════════════════════════════
TOTAL: 35 TOOLS/COMPONENTS
═══════════════════════════════════════════════════════
```

---

## Part III: Deep Specification — Critical Path Tools

### Tool 1: VIVIM Browser Extension

This is the single most important tool. In 2025, the majority of AI interactions happen through web browsers. This one tool, done right, captures 60-70% of a typical user's AI interactions.

```
TOOL 1: VIVIM BROWSER EXTENSION
═══════════════════════════════════════════════════════

PLATFORMS:     Chrome, Firefox, Safari, Edge, Arc, Brave
FIRST TARGET:  Chrome (largest market share)
PRIORITY:      CRITICAL — build first, ship first

═══════════════════════════════════════════════════════
WHAT IT CAPTURES
═══════════════════════════════════════════════════════

Target sites (initial):
  • chat.openai.com / chatgpt.com        (ChatGPT)
  • claude.ai                             (Claude)
  • gemini.google.com                     (Gemini)
  • copilot.microsoft.com                 (Copilot)
  • perplexity.ai                         (Perplexity)
  • chat.mistral.ai                       (Mistral)
  • poe.com                               (Poe — multi-model)
  • huggingface.co/chat                   (HuggingChat)
  • you.com                               (You.com)
  • pi.ai                                 (Inflection Pi)
  • x.ai/grok                             (Grok)
  
Target sites (extensible):
  • Any site the user manually adds via pattern matching
  • Auto-detection of chat-like AI interfaces (heuristic)

For each conversation, captures:
  • User's messages (every keystroke they send)
  • AI's responses (full text of each response)
  • System prompts (if visible in the interface)
  • Conversation metadata:
    - Provider name
    - Model name/version (if displayed)
    - Conversation ID (provider's ID)
    - Timestamp per message
    - URL
  • Attachments:
    - Files uploaded to the conversation
    - Images shared
    - Code blocks (tagged as code)
  • Conversation structure:
    - Message ordering
    - Edit history (if user edits a message)
    - Branch points (if conversation forks)
    - Regeneration events (user clicked "regenerate")
  • UI context:
    - Custom instructions / system prompt (if accessible)
    - Model selection changes mid-conversation
    - Temperature/parameter settings (if exposed)

What it does NOT capture:
  ✗ Other browsing activity (non-AI sites)
  ✗ Passwords or authentication tokens
  ✗ Billing/account information
  ✗ Other users' conversations (shared/team accounts)
  ✗ Any content outside identified AI chat interfaces

═══════════════════════════════════════════════════════
TECHNICAL ARCHITECTURE
═══════════════════════════════════════════════════════

┌─────────────────────────────────────────────────┐
│              BROWSER EXTENSION                   │
│                                                  │
│  ┌───────────────────────────────────────────┐   │
│  │         CONTENT SCRIPTS                    │   │
│  │  (injected into AI provider pages)         │   │
│  │                                            │   │
│  │  ┌─────────────────────────────────────┐   │   │
│  │  │  PROVIDER ADAPTER LAYER             │   │   │
│  │  │                                     │   │   │
│  │  │  Each provider has a custom adapter  │   │   │
│  │  │  that knows how to:                 │   │   │
│  │  │  • Find the chat container DOM      │   │   │
│  │  │  • Identify user vs AI messages     │   │   │
│  │  │  • Extract message content          │   │   │
│  │  │  • Detect new messages (mutations)  │   │   │
│  │  │  • Extract model info               │   │   │
│  │  │  • Handle streaming responses       │   │   │
│  │  │                                     │   │   │
│  │  │  adapters/                           │   │   │
│  │  │  ├── chatgpt.ts                     │   │   │
│  │  │  ├── claude.ts                      │   │   │
│  │  │  ├── gemini.ts                      │   │   │
│  │  │  ├── copilot.ts                     │   │   │
│  │  │  ├── perplexity.ts                  │   │   │
│  │  │  ├── generic.ts  ← fallback         │   │   │
│  │  │  └── registry.ts ← URL → adapter   │   │   │
│  │  └─────────────────────────────────────┘   │   │
│  │                                            │   │
│  │  ┌─────────────────────────────────────┐   │   │
│  │  │  MUTATION OBSERVER ENGINE           │   │   │
│  │  │                                     │   │   │
│  │  │  Watches the DOM for changes:       │   │   │
│  │  │  • New message elements added       │   │   │
│  │  │  • Streaming text updates           │   │   │
│  │  │  • Message edits                    │   │   │
│  │  │  • Conversation switches            │   │   │
│  │  │                                     │   │   │
│  │  │  Uses MutationObserver API with     ��   │   │
│  │  │  provider-specific selectors.       │   │   │
│  │  │  Falls back to periodic polling     │   │   │
│  │  │  if DOM is too dynamic.             │   │   │
│  │  └─────────────────────────────────────┘   │   │
│  │                                            │   │
│  │  ┌─────────────────────────────────────┐   │   │
│  │  │  NETWORK INTERCEPTOR (optional)     │   │   │
│  │  │                                     │   │   │
│  │  │  Intercepts XHR/fetch requests to   │   │   │
│  │  │  AI provider APIs. Captures the     │   │   │
│  │  │  raw request/response payloads.     │   │   │
│  │  │                                     │   │   │
│  │  │  Advantages over DOM scraping:      │   │   │
│  │  │  • Gets exact message content       │   │   │
│  │  │  • Gets model version from API      │   │   │
│  │  │  • Gets system prompts              │   │   │
│  │  │  • Resilient to UI redesigns        │   │   │
│  │  │  • Captures metadata not shown in UI│   │   │
│  │  │                                     │   │   │
│  │  │  Implementation:                    │   │   │
│  │  │  • Override window.fetch            │   │   │
│  │  │  • Override XMLHttpRequest.send     │   │   │
│  │  │  • Use webRequest API (Manifest V3) │   │   │
│  │  │  • Parse SSE streams for streaming  │   │   │
│  │  └─────────────────────────────────────┘   │   │
│  └───────────────────────────────────────────┘   │
│                                                  │
│  ┌───────────────────────────────────────────┐   │
│  │         BACKGROUND SERVICE WORKER         │   │
│  │                                            │   │
│  │  • Receives captured data from content     │   │
│  │    scripts via message passing             │   │
│  │  • Manages capture state across tabs       │   │
│  │  • Performs ACU extraction:                 │   │
│  │    - Segments conversations into ACUs      │   │
│  │    - Computes content hashes               │   │
│  │    - Signs ACUs with user's key            │   │
│  │    - Assigns timestamps                    │   │
│  │  • Encrypts ACUs locally before storage    │   │
│  │  • Writes to local vault (IndexedDB)       │   │
│  │  • Syncs to VIVIM vault (if configured)    │   │
│  │  • Runs classification engine (lite)       │   │
│  │    for SSC-related data flagging            │   │
│  └───────────────────────────────────────────┘   │
│                                                  │
│  ┌───────────────────────────────────────────┐   │
│  │         POPUP / SIDE PANEL UI              │   │
│  │                                            │   │
│  │  • Shows capture status (active/paused)    │   │
│  │  • Shows count of ACUs captured today      │   │
│  │  • Quick vault search                      │   │
│  │  • Settings:                               │   │
│  │    - Per-site capture toggle               │   │
│  │    - Auto-capture vs manual mode            │   │
│  │    - SSC assignment for current session     │   │
│  │    - Pause/resume capture                   │   │
│  │  • Recent captures list                     │   │
│  │  • Tier badges on captured content          │   │
│  └───────────────────────────────────────────┘   │
│                                                  │
│  ┌───────────────────────────────────────────┐   │
│  │         LOCAL STORAGE                      │   │
│  │                                            │   │
│  │  IndexedDB: vivim_vault                    │   │
│  │  ├── acus (encrypted ACU records)          │   │
│  │  ├── conversations (conversation index)    │   │
│  │  ├── pending_sync (not yet synced)         │   │
│  │  ├── capture_log (what was captured when)  │   │
│  │  └── settings (user preferences)           │   │
│  │                                            │   │
│  │  Storage budget: Chrome allows ~10% of     │   │
│  │  disk space. Typical: 2-10 GB.             │   │
│  │  ACUs are small (text). Years of           │   │
│  │  conversations fit in < 1 GB.              │   │
│  └───────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════
CAPTURE MODES
═══════════════════════════════════════════════════════

MODE 1: AUTOMATIC (default)
  Extension captures everything automatically.
  User sees a small indicator showing capture is active.
  No interaction required.
  
  User can PAUSE per-tab or globally.
  Paused state is sticky (remembers across sessions).

MODE 2: MANUAL
  Extension shows a "Capture" button on each conversation.
  User explicitly captures conversations they want to keep.
  Nothing is stored unless user clicks capture.
  
  Useful for: users who want selective capture,
  or during initial trust-building period.

MODE 3: SELECTIVE AUTO
  User configures rules:
    "Always capture: Claude, ChatGPT"
    "Never capture: Perplexity"
    "Ask me: everything else"
  
  Rules are per-provider and can be changed anytime.

MODE 4: SESSION-TAGGED
  User tags sessions by context:
    🏠 Personal
    🏢 Work — [Acme Corp SSC]
    🎓 Research — [University SSC]
    👥 Client — [Client X SSC]
  
  Tags determine:
    - Which SSC applies (if any)
    - Which vault partition data goes to
    - Default classification tier hints
  
  Tags can be changed mid-session.
  Tag can be set to auto-detect based on content (experimental).

═══════════════════════════════════════════════════════
PROVIDER ADAPTER SPECIFICATION (Example: Claude)
═══════════════════════════════════════════════════════

ADAPTER: claude.ts

target_urls:
  - "https://claude.ai/*"

dom_selectors:
  // These WILL change when Anthropic redesigns the UI.
  // The adapter must be updated accordingly.
  // This is the main maintenance burden.
  
  chat_container:     "[data-testid='conversation']" 
                      // OR class-based fallback
  user_message:       "[data-role='user']"
  assistant_message:  "[data-role='assistant']"
  message_content:    ".message-content"
  model_indicator:    ".model-selector, .model-badge"
  conversation_title: "h1, .conversation-title"

network_endpoints:
  // More reliable than DOM scraping
  send_message:       "POST /api/organizations/*/chat_conversations/*/completion"
  get_conversation:   "GET /api/organizations/*/chat_conversations/*"
  list_conversations: "GET /api/organizations/*/chat_conversations"

stream_format:
  type:               "SSE"  // Server-Sent Events
  event_types:        ["completion", "content_block_delta", "message_stop"]
  
  parser:
    // Parse streaming responses to reconstruct complete messages
    FUNCTION ParseClaudeStream(events):
      message ← ""
      FOR each event in events:
        IF event.type == "content_block_delta":
          message += event.delta.text
        ELIF event.type == "message_stop":
          RETURN message

extraction:
  model_version:
    // Extract from API response headers or payload
    source: "response.model"  // e.g., "claude-sonnet-4-20250514"
    
  conversation_id:
    source: "url.pathname.split('/')[4]"
    
  user_message:
    // From the request payload
    source: "request.body.prompt OR request.body.messages[-1].content"
    
  assistant_message:
    // From the streamed response (aggregated)
    source: "ParseClaudeStream(response.events)"

resilience:
  // When DOM changes break the adapter:
  primary:    "network_interceptor"  // preferred — more stable
  fallback_1: "dom_selectors"        // backup — fragile
  fallback_2: "clipboard_capture"    // last resort — user copies text
  
  // Auto-detection of broken adapter:
  health_check:
    every: "5 minutes while page is open"
    test:  "can we find at least one message element?"
    on_failure:
      - Try alternate selectors
      - Fall back to network interceptor
      - Alert user: "Capture may be incomplete on this site"
      - Report issue to VIVIM adapter update service

═══════════════════════════════════════════════════════
ANTI-DETECTION / STEALTH CONSIDERATIONS
═══════════════════════════════════════════════════════

Some providers may try to detect and block capture extensions.

Mitigations:
  1. Network interception is harder to detect than DOM manipulation
  2. Extension does not modify the page in any visible way
  3. Extension does not inject visible UI into the provider's page
     (all UI is in the extension popup/sidepanel)
  4. Extension does not make additional API calls to the provider
     (only intercepts existing calls)
  5. Content script footprint is minimal (observer + interceptor)

Legal position:
  The user is capturing THEIR OWN CONVERSATIONS.
  They typed the input. They received the output.
  The conversation is between them and the AI.
  Capturing your own conversations is not unauthorized access.
  (Analogous to: recording your own phone calls — legal in 
  many jurisdictions, especially with notice.)

═══════════════════════════════════════════════════════
PERMISSIONS REQUIRED (Chrome Manifest V3)
═══════════════════════════════════════════════════════

{
  "permissions": [
    "storage",           // IndexedDB for local vault
    "unlimitedStorage",  // large vault support
    "alarms"             // periodic sync scheduling
  ],
  "optional_permissions": [
    "webRequest",        // network interception
    "declarativeNetRequest"  // Manifest V3 network rules
  ],
  "host_permissions": [
    "https://chat.openai.com/*",
    "https://chatgpt.com/*",
    "https://claude.ai/*",
    "https://gemini.google.com/*",
    "https://copilot.microsoft.com/*",
    "https://perplexity.ai/*"
    // User can grant additional host permissions
  ],
  "content_scripts": [
    {
      "matches": ["<all_urls>"],  
      // BUT: content script activates only on recognized AI sites
      // Uses programmatic injection for user-added sites
      "run_at": "document_idle"
    }
  ]
}

PRIVACY COMMITMENTS (shown during install):
  ✓ Your data never leaves your device without your explicit action
  ✓ We capture ONLY on AI chat websites you approve
  ✓ We do NOT track your browsing on other websites
  ✓ We do NOT sell your data
  ✓ All captured data is encrypted locally before storage
  ✓ You can delete any captured data at any time
  ✓ You can export your entire vault at any time
  ✓ The extension is open-source: [link to repo]
```

### Tool 2: VIVIM Mobile App

```
TOOL 2: VIVIM MOBILE APP
═══════════════════════════════════════════════════════

PLATFORMS:     iOS, Android
FRAMEWORK:     React Native (cross-platform) or native (Swift/Kotlin)
               Recommendation: Native for capture reliability, 
               React Native for vault viewer
PRIORITY:      CRITICAL

═══════════════════════════════════════════════════════
THREE FUNCTIONS IN ONE APP
═══════════════════════════════════════════════════════

FUNCTION A: VAULT VIEWER & MANAGER
  • Browse all captured ACUs (from all sources)
  • Search across vault
  • View tier designations
  • Manage SSC consent requests
  • View detection results
  • Marketplace interface
  
  This is the primary VIVIM interface for most users.

FUNCTION B: MOBILE AI CAPTURE
  • Capture conversations from mobile AI apps
  • Methods:
    
    Method 1: SHARE SHEET INTEGRATION
      User opens ChatGPT/Claude/Gemini app → has conversation →
      uses system Share button → shares to VIVIM app →
      VIVIM parses and stores the conversation.
      
      Pros: Works with any app, no special permissions
      Cons: Manual, user must remember to share
    
    Method 2: ACCESSIBILITY SERVICE (Android only)
      VIVIM registers as an accessibility service.
      Can read screen content from other apps.
      Detects AI chat interfaces and captures content.
      
      Pros: Automatic, captures everything
      Cons: Android only, high permissions, some apps block this
      
    Method 3: NOTIFICATION CAPTURE (Android)
      Some AI apps show response previews in notifications.
      VIVIM can read notification content via NotificationListenerService.
      
      Pros: Works in background, low overhead
      Cons: Partial capture (notification previews are truncated)
    
    Method 4: CLIPBOARD MONITORING (iOS + Android)
      When user copies text from an AI app, VIVIM detects it
      and offers to capture.
      
      Pros: Cross-platform, simple
      Cons: Manual copy required, doesn't capture full context
    
    Method 5: SCREEN RECORDING + OCR (iOS + Android)
      User initiates a screen recording through VIVIM before
      opening the AI app. VIVIM records the screen, then uses
      OCR to extract conversation text.
      
      Pros: Captures everything visible
      Cons: High battery/storage cost, privacy-intensive,
            OCR accuracy varies
    
    Method 6: VPN-BASED NETWORK CAPTURE (advanced)
      VIVIM creates a local VPN that routes AI app traffic
      through itself. Intercepts API calls.
      
      Pros: Complete capture, works with any app
      Cons: Requires VPN permission, SSL pinning may block,
            battery/performance overhead

    RECOMMENDED DEFAULT: Method 1 (share sheet) + Method 4 (clipboard)
    POWER USER OPTION:   Method 6 (VPN capture)
    ANDROID EXTRA:       Method 2 (accessibility service)

FUNCTION C: VOICE CAPTURE
  When user uses AI voice mode (ChatGPT voice, Claude voice):
  
  • VIVIM can record the audio locally
  • Transcribe using on-device speech-to-text
  • Structure into ACUs (user utterance + AI response)
  • Store in vault
  
  Implementation:
    iOS: Background audio recording (requires microphone permission)
    Android: MediaRecorder API or accessibility service
    
  Privacy: Audio is transcribed ON-DEVICE and deleted.
  Only the transcript is stored in the vault.

═══════════════════════════════════════════════════════
MOBILE APP SCREENS
═══════════════════════════════════════════════════════

HOME SCREEN:
  ┌──────────────────────────────┐
  │  VIVIM                  ⚙️   │
  │                              │
  │  📊 Your Vault               │
  │  ┌────────────────────────┐  │
  │  │ 47,293 ACUs            │  │
  │  │ 6 providers            │  │
  │  │ Last captured: 2m ago  │  │
  │  └────────────────────────┘  │
  │                              │
  │  🔔 Notifications        (3) │
  │  ├─ Consent request from     │
  │  │  Acme Corp (Tier 2)       │
  │  ├─ Detection alert:         │
  │  │  GPT-5 anomaly            │
  │  └─ Marketplace sale         │
  │     completed: $12.50        │
  │                              │
  │  📱 Quick Capture            │
  │  ┌──────┐ ┌──────┐ ┌──────┐ │
  │  │Paste │ │Share │ │Voice │ │
  │  │ Text │ │Sheet │ │ Mode │ │
  │  └──────┘ └──────┘ └──────┘ │
  │                              │
  │  🔍 Search Vault             │
  │  ┌────────────────────────┐  │
  │  │ Search your data...    │  │
  │  └────────────────────────┘  │
  │                              │
  │  ──── ──── ──── ──── ────    │
  │  Home Vault Detect Market Me │
  └──────────────────────────────┘

VAULT BROWSER:
  Filter by: Provider | Date | Tier | Topic | SSC
  Sort by: Date | Relevance | Detectability
  
  Each ACU shows:
  • Preview (first 2 lines)
  • Provider badge (ChatGPT/Claude/etc.)
  • Tier badge (T0/T1/T2/T3/T4) with color coding
  • Timestamp
  • SSC indicator (if applicable)
  
  Tap to expand: full conversation view

CAPTURE SCREEN:
  • Large text input area for paste capture
  • Provider selector dropdown
  • Session tag selector (Personal/Work/Client/etc.)
  • "Capture" button
  • Recent captures feed

DETECTION SCREEN:
  • Last scan results
  • Per-model sovereignty scores
  • Active alerts
  • "Run Scan" button (triggers detection algorithms)
```

### Tool 3: VIVIM IDE Plugin

```
TOOL 3: VIVIM IDE PLUGIN
═══════════════════════════════════════════════════════

PLATFORMS:     VS Code (primary), JetBrains (IntelliJ/PyCharm/etc.),
               Cursor (built on VS Code), Neovim, Zed
PRIORITY:      HIGH — code interactions contain high-value,
               often proprietary data

═══════════════════════════════════════════════════════
WHAT IT CAPTURES
═══════════════════════════════════════════════════════

Source 1: INLINE COMPLETIONS (Copilot, Cursor Tab, Codeium)
  • The code context sent to the AI (surrounding code)
  • The completion suggestion received
  • Whether the user accepted, rejected, or modified it
  • The file/project context (file name, language, repo)
  
  Challenge: Inline completions happen rapidly (every few keystrokes).
  High volume, small individual value.
  
  Strategy: 
    • Capture ACCEPTED completions (user found them valuable)
    • Batch rejected completions (aggregate statistics)
    • Configurable: capture all vs accepted-only

Source 2: CHAT/COMPOSER INTERACTIONS (Cursor Composer, Copilot Chat)
  • Full conversation in the IDE's chat panel
  • User's natural language requests
  • AI's code generation responses
  • File context referenced in the conversation
  • Applied diffs (what actually changed in the code)
  
  These are HIGH VALUE — equivalent to web chat conversations
  but in a code-specific context.

Source 3: AI-POWERED REFACTORING
  • When user uses AI to refactor, rename, explain code
  • The original code
  • The refactored result
  • The explanation/documentation generated

Source 4: TERMINAL AI (Copilot CLI, Warp AI, etc.)
  • Command suggestions from AI
  • Shell command explanations
  • Error resolution suggestions

═══════════════════════════════════════════════════════
VS CODE EXTENSION ARCHITECTURE
═══════════════════════════════════════════════════════

vivim-vscode/
├── src/
│   ├── extension.ts           ← Entry point
│   ├── capture/
│   │   ├── completion.ts      ← Hooks into completion providers
│   │   ├── chat.ts            ← Hooks into chat panel APIs
│   │   ├── terminal.ts        ← Monitors terminal for AI interactions
│   │   └── diff.ts            ← Captures AI-generated code changes
│   ├── adapters/
│   │   ├── copilot.ts         ← GitHub Copilot specific hooks
│   │   ├── cursor.ts          ← Cursor-specific hooks
│   │   ├── codeium.ts         ← Codeium specific hooks
│   │   ├── continue.ts        ← Continue.dev specific hooks
│   │   └── generic.ts         ← Generic completion provider hooks
│   ├── context/
│   │   ├── file-context.ts    ← Captures relevant file context
│   │   ├── project-context.ts ← Project/repo metadata
│   │   └── git-context.ts     ← Git branch, commit context
│   ├── vault/
│   │   ├── acu-builder.ts     ← Constructs ACUs from captures
│   │   ├── local-store.ts     ← Local SQLite/LevelDB storage
│   │   └── sync.ts            ← Sync to VIVIM vault
│   ├── classification/
│   │   ├── code-classifier.ts ← SSC-aware code classification
│   │   └── sensitivity.ts     ← Detect sensitive code patterns
│   └── ui/
│       ├── status-bar.ts      ← Status bar indicator
│       ├── sidebar.ts         ← Vault browser in sidebar
│       └── settings.ts        ← Configuration UI

HOOKS (VS Code API):

// Completion capture
vscode.languages.registerInlineCompletionItemProvider(
  // Intercept completions AFTER they're generated
  // Record what was suggested and whether it was accepted
)

// Chat capture (for Copilot Chat, Cursor Chat)
vscode.chat.registerChatParticipant(
  // Register as a passive participant in AI chat sessions
  // Receives all messages without modifying them
)

// Terminal capture
vscode.window.onDidWriteTerminalData(
  // Monitor terminal output for AI-generated content
)

// Diff capture
vscode.workspace.onDidChangeTextDocument(
  // Detect AI-generated code changes
  // Heuristic: large multi-line changes that appear instantly
)

═══════════════════════════════════════════════════════
SSC INTEGRATION FOR CODE
═══════════════════════════════════════════════════════

Code conversations are often Tier 2 or Tier 3 (proprietary).
The IDE plugin has special classification support:

AUTO-DETECTION of proprietary context:
  • Checks if current file is in a private repo (git remote URL)
  • Checks if file path matches SSC covered domains
  • Checks for proprietary headers/comments in the code
  • Checks import statements against org's package registry
  
  IF proprietary context detected:
    Auto-tag capture as [Work — Acme Corp SSC]
    Classification engine flags for Tier 2+ review
    
  IF open-source context detected:
    Auto-tag as [Personal / Open Source]
    Default to Tier 0

USER OVERRIDE:
  Status bar shows current capture context:
  
  [VIVIM: 🏢 Acme Corp (Tier 2) | ⚡ 47 captures today]
  
  Click to change context or pause capture.
```

### Tool 4: VIVIM API Proxy

```
TOOL 4: VIVIM API PROXY
═══════════════════════════════════════════════════════

PURPOSE:   Capture AI interactions made through direct API calls
           (developer workflows, scripts, applications)
PRIORITY:  HIGH

═══════════════════════════════════════════════════════
THE PROBLEM
═══════════════════════════════════════════════════════

Many AI interactions bypass the browser entirely:

  • Python scripts using openai.ChatCompletion.create()
  • Applications with embedded AI features
  • Jupyter notebooks calling AI APIs
  • CI/CD pipelines using AI for code review
  • Backend services using AI for content generation
  • Custom tools built on AI APIs

These interactions are invisible to the browser extension.
They are often the MOST valuable (production code, 
real data analysis, proprietary workflow automation)
and the MOST likely to contain shared-sovereignty data.

═══════════════════════════════════════════════════════
SOLUTION: LOCAL PROXY SERVER
═══════════════════════════════════════════════════════

VIVIM runs a local proxy server on the user's machine.
The user configures their AI API calls to route through 
the proxy. The proxy transparently forwards requests,
captures both request and response, and stores them 
in the vault.

┌──────────────────────────────────────────────────┐
│  User's Code / Application                        │
│                                                    │
│  import openai                                     │
│  openai.api_base = "http://localhost:7342/v1"      │
│  # OR                                              │
│  openai.api_base = "https://proxy.vivim.local/v1"  │
│                                                    │
│  response = openai.ChatCompletion.create(           │
│    model="gpt-4",                                  │
│    messages=[...]                                   │
│  )                                                 │
└───────────────────────┬──────────────────────────┘
                        │ Request
                        ▼
┌──────────────────────────────────────────────────┐
│  VIVIM API PROXY (localhost:7342)                  │
│                                                    │
│  1. RECEIVE request from user's code               │
│  2. CAPTURE: Extract messages, model, params       │
│  3. FORWARD request to actual AI provider          │
│     (api.openai.com/v1/...)                        │
│  4. RECEIVE response from provider                 │
│  5. CAPTURE: Extract response content              │
│  6. RETURN response to user's code (unchanged)     │
│  7. ASYNC: Build ACU, encrypt, store in vault      │
│                                                    │
│  Latency overhead: < 5ms (local only)              │
│  The proxy is TRANSPARENT — user's code works      │
│  identically whether proxy is running or not.      │
└──────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════
CONFIGURATION METHODS
═══════════════════════════════════════════════════════

Method 1: ENVIRONMENT VARIABLE (simplest)
  export OPENAI_API_BASE="http://localhost:7342/v1/openai"
  export ANTHROPIC_API_BASE="http://localhost:7342/v1/anthropic"
  export GOOGLE_AI_API_BASE="http://localhost:7342/v1/google"
  
  Most AI SDKs respect these environment variables.
  One-time setup, works across all terminals/scripts.

Method 2: SDK WRAPPER (zero-config for supported SDKs)
  # Instead of:
  import openai
  
  # Use:
  import vivim.openai as openai  # drop-in replacement
  
  # VIVIM wrapper intercepts all calls, captures them,
  # and forwards to the real SDK.
  
  Supported wrappers:
    vivim.openai
    vivim.anthropic
    vivim.google.generativeai
    vivim.mistralai
    vivim.cohere

Method 3: HTTP PROXY (captures everything)
  export HTTP_PROXY="http://localhost:7342"
  export HTTPS_PROXY="http://localhost:7342"
  
  All HTTP traffic routes through VIVIM proxy.
  Proxy identifies AI API calls by URL pattern
  and captures only those. Non-AI traffic passes through
  untouched.
  
  Requires VIVIM CA certificate for HTTPS interception.
  More invasive but captures all API calls regardless of SDK.

Method 4: DNS-BASED (most transparent)
  VIVIM modifies /etc/hosts to redirect AI API domains 
  to localhost. Proxy serves as the man-in-the-middle.
  
  Most transparent to user code but requires admin access
  and careful certificate management.

RECOMMENDED: Method 1 (env vars) for most users.
             Method 2 (SDK wrapper) for Python developers.

═══════════════════════════════════════════════════════
SUPPORTED AI PROVIDERS (API ENDPOINTS)
═══════════════════════════════════════════════════════

OpenAI:
  api.openai.com/v1/chat/completions
  api.openai.com/v1/completions
  api.openai.com/v1/embeddings
  api.openai.com/v1/images/generations

Anthropic:
  api.anthropic.com/v1/messages
  api.anthropic.com/v1/complete

Google:
  generativelanguage.googleapis.com/v1/models/*/generateContent
  generativelanguage.googleapis.com/v1/models/*/streamGenerateContent

Mistral:
  api.mistral.ai/v1/chat/completions

Cohere:
  api.cohere.ai/v1/chat
  api.cohere.ai/v1/generate

OpenRouter:
  openrouter.ai/api/v1/chat/completions

Together AI:
  api.together.xyz/v1/chat/completions

Groq:
  api.groq.com/openai/v1/chat/completions

Custom / Self-hosted:
  User-configurable: any endpoint matching pattern
  {base_url}/v1/chat/completions or similar

═══════════════════════════════════════════════════════
STREAMING SUPPORT
═══════════════════════════════════════════════════════

Most production API calls use streaming (SSE).
The proxy must handle streaming transparently:

1. Receive SSE stream from provider
2. Forward each event to user's code immediately (no buffering)
3. Accumulate events in parallel for capture
4. When stream ends, build complete ACU from accumulated events
5. Store ACU asynchronously

Critical: Streaming capture must NOT add latency to the 
user's experience. The first token must arrive at the same
time as it would without the proxy.
```

### Tools 17-24: Historical Import Pipeline

```
TOOLS 17-24: HISTORICAL IMPORT
═══════════════════════════════════════════════════════

PURPOSE:   Import existing conversation history from AI providers
           into the VIVIM vault. One-time migration per provider.
PRIORITY:  CRITICAL for initial vault population

═══════════════════════════════════════════════════════
IMPORT ARCHITECTURE
═══════════════════════════════════════════════════════

All importers follow the same pipeline:

  ┌──────────────────┐
  │  DATA SOURCE      │
  │  (Provider export) │
  └────────┬─────────┘
           │
           ▼
  ┌──────────────────┐
  │  PARSER           │
  │  Provider-specific │
  │  format handling   │
  └────────┬─────────┘
           │
           ▼
  ┌──────────────────┐
  │  NORMALIZER       │
  │  Convert to VIVIM  │
  │  canonical format  │
  └────────┬─────────┘
           │
           ▼
  ┌──────────────────┐
  │  ACU EXTRACTOR    │
  │  Segment into ACUs │
  │  Assign hashes     │
  │  Assign timestamps │
  └────────┬─────────┘
           │
           ▼
  ┌──────────────────┐
  │  CLASSIFIER       │
  │  Run SSC classif.  │
  │  Assign tiers      │
  └────────┬─────────┘
           │
           ▼
  ┌──────────────────┐
  │  ENCRYPTOR        │
  │  Encrypt & sign    │
  │  Store in vault    │
  └────────┬─────────┘
           │
           ▼
  ┌──────────────────┐
  │  ON-CHAIN COMMIT  │
  │  Hash commitments  │
  │  for provenance    │
  └──────────────────┘

═══════════════════════════════════════════════════════
TOOL 17: IMPORT — OpenAI/ChatGPT
═══════════════════════════════════════════════════════

DATA SOURCE:
  ChatGPT Settings → Data Controls → Export Data
  Delivers a ZIP file via email containing:
    • conversations.json — all conversations
    • message_feedback.json — thumbs up/down
    • model_comparisons.json — arena-style comparisons
    • user.json — account info
    • Plus: shared_conversations.json, chat.html (viewer)

PARSER:
  conversations.json format:
  [
    {
      "title": "...",
      "create_time": 1700000000.0,
      "update_time": 1700001000.0,
      "mapping": {
        "<message_id>": {
          "id": "<message_id>",
          "message": {
            "id": "<message_id>",
            "author": {"role": "user" | "assistant" | "system"},
            "content": {"content_type": "text", "parts": ["..."]},
            "create_time": 1700000000.0,
            "metadata": {
              "model_slug": "gpt-4",
              ...
            }
          },
          "parent": "<parent_message_id>",
          "children": ["<child_message_id>"]
        }
      }
    }
  ]
  
  Key challenges:
  • Tree structure (branching conversations due to edits/regenerations)
  • Multiple content types (text, code, images, files)
  • Model changes mid-conversation
  • System messages mixed in
  • Timestamps are Unix floats
  
  Solution:
  • Linearize tree by following the main (last-chosen) branch
  • Preserve branch points as metadata
  • Extract model version from metadata.model_slug
  • Skip system messages (store separately as context)

NORMALIZER OUTPUT:
  {
    provider: "openai",
    provider_conversation_id: "...",
    title: "...",
    created_at: ISO8601,
    updated_at: ISO8601,
    messages: [
      {
        role: "user" | "assistant",
        content: "...",
        content_type: "text" | "code" | "image",
        timestamp: ISO8601,
        model: "gpt-4-0613",
        is_edit: false,
        is_regeneration: false,
        attachments: []
      }
    ]
  }

SCALE CONSIDERATIONS:
  Heavy ChatGPT users may have 10,000+ conversations.
  Export ZIP can be 500MB+.
  Import should be resumable (track progress, handle interruptions).
  Batch processing: 100 conversations per batch, with progress bar.

═══════════════════════════════════════════════════════
TOOL 18: IMPORT — Anthropic/Claude
═══════════════════════════════════════════════════════

DATA SOURCE:
  Claude Settings → Account → Export Data
  Currently (2025): exports a JSON file or ZIP.
  
  Alternative: API-based export
    GET https://claude.ai/api/organizations/{org_id}/chat_conversations
    Requires authentication cookies/tokens from logged-in session.
    
    The browser extension can facilitate this:
    "Import History" button → uses existing auth session →
    paginates through all conversations → imports in background.

FORMAT:
  Similar structure to OpenAI but Anthropic-specific:
  • Conversations have a UUID
  • Messages are linear (no branching)
  • Model version stored per-message
  • Artifacts (code/documents) stored separately
  • Project/organization context may be present

SPECIAL CONSIDERATIONS:
  • Claude Projects: conversations may be organized into projects
    → Preserve project metadata for SSC classification hints
  • Claude Artifacts: long-form code/document outputs stored as artifacts
    → Import as separate ACUs linked to the conversation
  • Organization accounts vs personal accounts
    → Different API endpoints and data structures

═══════════════════════════════════════════════════════
TOOL 19: IMPORT — Google/Gemini
═══════════════════════════════════════════════════════

DATA SOURCE:
  Google Takeout → select "Gemini Apps"
  Delivers conversations in HTML and/or JSON format.
  
  Also: Bard history (predecessor) if user had early access.

FORMAT:
  Google Takeout produces:
  • HTML files (one per conversation, human-readable)
  • JSON metadata
  • Image attachments in separate folders

SPECIAL CONSIDERATIONS:
  • Google integrates Gemini across many surfaces
    (Search, Workspace, Android). Takeout may include
    interactions from all surfaces — need to identify 
    and categorize each.
  • Gemini Advanced vs. standard — different models
  • Google Workspace (Docs, Sheets) AI interactions may 
    be in separate Takeout categories

═══════════════════════════════════════════════════════
TOOL 23: IMPORT — Generic JSON/CSV/Markdown
═══════════════════════════════════════════════════════

For providers without a dedicated importer, or for data
in non-standard formats:

SUPPORTED INPUT FORMATS:
  • JSON (array of conversation objects)
  • CSV (columns: timestamp, role, content, model)
  • Markdown (formatted conversation transcripts)
  • Plain text (heuristic parsing)
  • JSONL (one JSON object per line)
  • HTML (conversation rendered as HTML)

FIELD MAPPING:
  User specifies which fields in their data correspond to:
    • Message content
    • Message role (user/assistant)
    • Timestamp
    • Model name
    • Conversation boundary (how to split into conversations)
    • Provider name

  VIVIM provides a mapping UI:
  
  ┌──────────────────────────────────────────────────┐
  │  GENERIC IMPORT — Field Mapping                   │
  │                                                    │
  │  Your file: conversations_export.json              │
  │  Detected format: JSON array (2,341 records)       │
  │                                                    │
  │  Map your fields:                                  │
  │                                                    │
  │  Content:     [input_text     ▼] → user message    │
  │               [output_text    ▼] → AI response     │
  │  Timestamp:   [created_at     ▼]                   │
  │  Model:       [model_name     ▼]                   │
  │  Conv. ID:    [session_id     ▼]                   │
  │  Provider:    [  Mistral AI   ▼]                   │
  │                                                    │
  │  Preview:                                          │
  │  ┌──────────────────────────────────────────────┐  │
  │  │ 2025-01-15 09:23 [user → mistral-large-2]   │  │
  │  │ "How do I implement a B-tree in Rust?"       │  │
  │  │ [assistant]                                  │  │
  │  │ "Here's a basic B-tree implementation..."    │  │
  │  └──────────────────────────────────────────────┘  │
  │                                                    │
  │  Looks correct?  [Yes, Import] [Adjust Mapping]    │
  └──────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════
TOOL 24: IMPORT — Browser History AI Extraction
═══════════════════════════════════════════════════════

LAST-RESORT RECOVERY for conversations the user had with 
AI providers but never exported and can no longer access 
(account deleted, provider shut down, etc.)

METHOD:
  1. Scan browser history for AI provider URLs
  2. Scan browser cache for cached API responses
  3. Scan browser LocalStorage/SessionStorage for cached 
     conversation data
  4. Reconstruct what's possible from cached fragments

THIS TOOL WILL RECOVER PARTIAL DATA AT BEST.
It exists because some data is better than no data,
and provenance (browser history timestamps) provides 
at least temporal evidence for sovereignty claims.

LOCATIONS SCANNED:
  Chrome:
    ~/Library/Application Support/Google/Chrome/Default/History   (SQLite)
    ~/Library/Application Support/Google/Chrome/Default/Cache/
    ~/Library/Application Support/Google/Chrome/Default/Local Storage/

  Firefox:
    ~/.mozilla/firefox/[profile]/places.sqlite
    ~/.mozilla/firefox/[profile]/cache2/

  Safari:
    ~/Library/Safari/History.db
    ~/Library/Caches/com.apple.Safari/
```

---

## Part IV: The Root Agent (System-Level Capture)

### Tool 14-16: VIVIM Root Agent

```
TOOLS 14-16: VIVIM ROOT AGENT
═══════════════════════════════════════════════════════

PLATFORMS:     macOS (14), Windows (15), Linux (16)
FIRST TARGET:  macOS
PRIORITY:      MEDIUM — build after Layer 1 is stable
TRUST LEVEL:   HIGH — requires explicit user consent and admin access

═══════════════════════════════════════════════════════
WHAT THE ROOT AGENT IS
═══════════════════════════════════════════════════════

The Root Agent is a system-level daemon that monitors ALL 
AI interactions on the user's device, regardless of which 
application, browser, or interface is used. It fills every
gap left by the application-level tools.

It is the difference between:
  "I captured most of my AI interactions" (Layer 1)
and:
  "I captured ALL of my AI interactions" (Layer 1 + 2)

═══════════════════════════════════════════════════════
WHAT IT MONITORS
═══════════════════════════════════════════════════════

CHANNEL 1: NETWORK TRAFFIC
  Monitor all outbound HTTP/HTTPS traffic for AI API calls.
  
  Detection method:
    • Destination hostname matching:
      api.openai.com, api.anthropic.com, generativelanguage.googleapis.com,
      api.mistral.ai, api.cohere.ai, etc.
      (Maintained list, automatically updated)
    
    • URL pattern matching:
      */v1/chat/completions, */v1/messages, */generateContent
      
    • Request payload inspection (for HTTPS, see TLS section):
      Look for {"model": "...", "messages": [...]}
      
  IMPORTANT: HTTPS/TLS interception is the hardest part.
  
  Options:
    a) CERTIFICATE AUTHORITY INJECTION
       Install a VIVIM root CA certificate on the device.
       The agent acts as a TLS-terminating proxy.
       All HTTPS traffic is decrypted, inspected, re-encrypted.
       
       Pros: Complete visibility into all API calls
       Cons: Security implications (MITM on own traffic)
             Some apps use certificate pinning (will break)
             Enterprise security tools will flag this
             Users must understand what they're consenting to
       
    b) PROCESS-LEVEL INTERCEPTION (PREFERRED)
       Instead of intercepting network traffic, intercept at
       the application level:
       - Hook into the TLS library (libssl, Security.framework)
       - Read plaintext BEFORE encryption
       - No need to break TLS
       
       macOS: Use DYLD_INSERT_LIBRARIES or Endpoint Security framework
       Windows: Use DLL injection or ETW (Event Tracing for Windows)
       Linux: Use LD_PRELOAD or eBPF
       
       Pros: No TLS interception, no certificate issues
       Cons: Process-specific, may not catch everything
             Anti-tamper protection in some apps
             
    c) DNS + RESPONSE ANALYSIS
       Redirect AI API domains to local proxy via DNS.
       Handle TLS with per-domain certificates.
       
       Less invasive than full MITM but still requires
       trust anchor installation.
       
    d) KERNEL EXTENSION / SYSTEM EXTENSION
       macOS: Network Extension framework (NEFilterDataProvider)
       Windows: WFP (Windows Filtering Platform) driver
       Linux: Netfilter / eBPF
       
       Inspect network traffic at the kernel level.
       Can classify traffic without full decryption in some cases.

  RECOMMENDED APPROACH: (b) process-level interception for known apps
                        + (a) optional TLS proxy for complete coverage
                        User chooses their comfort level.

CHANNEL 2: APPLICATION MONITORING
  Track which applications are running and interacting with AI.
  
  macOS: 
    NSWorkspace notifications for app launch/quit
    Accessibility API for active window detection
    EndpointSecurity framework for process monitoring
  
  Windows:
    WMI events for process creation
    UI Automation API for active window
    SetWinEventHook for focus changes
  
  Linux:
    /proc filesystem monitoring
    D-Bus for desktop notifications
    X11/Wayland window tracking
  
  The agent knows:
    "User is currently in Cursor IDE → coding with AI"
    "User switched to Chrome → claude.ai tab active"
    "User opened ChatGPT desktop app"
  
  This CONTEXT is valuable even without full content capture:
    • Timeline of AI usage (when, how long, which tools)
    • Correlation with captured content (fill timing gaps)
    • Detection of uncaptured interactions (gap alerts)

CHANNEL 3: CLIPBOARD MONITORING
  Monitor clipboard for AI-related content.
  
  When user copies text from an AI interface:
    • Detect the source application
    • If source is a known AI app/site → capture the content
    • If destination is a known AI app/site → capture the input
  
  macOS: NSPasteboard polling or NSPasteboardDidChange notification
  Windows: AddClipboardFormatListener
  Linux: xclip monitoring or Wayland clipboard protocols
  
  PRIVACY: Only captures clipboard when source OR destination
  is a known AI application. Does NOT capture general clipboard use.

CHANNEL 4: FILE SYSTEM MONITORING
  Some AI interactions happen via files:
    • Uploading files to AI chat interfaces
    • AI-generated files saved to disk
    • Jupyter notebooks with AI API calls
    • AI-generated code written to project files
  
  Monitor specific directories:
    ~/Downloads/ (for AI-generated downloads)
    ~/Documents/ (for AI-related documents)
    Project directories (for AI-generated code)
  
  macOS: FSEvents API
  Windows: ReadDirectoryChangesW
  Linux: inotify
  
  Detection: File appears shortly after an AI interaction →
  likely AI-generated. Link to the interaction in the vault.

CHANNEL 5: AUDIO MONITORING (opt-in)
  For voice-based AI interactions:
  
  Monitor audio output for AI voice responses.
  Monitor audio input for user's voice queries.
  
  On-device transcription → store transcript only.
  Delete audio after transcription.
  
  macOS: Core Audio tap
  Windows: WASAPI loopback capture
  Linux: PulseAudio monitor source
  
  THIS IS THE MOST PRIVACY-SENSITIVE CHANNEL.
  Disabled by default. Requires explicit opt-in.
  Clear indicator when audio monitoring is active.

═══════════════════════════════════════════════════════
ROOT AGENT ARCHITECTURE (macOS)
═══════════════════════════════════════════════════════

┌──────────────────────────────────────────────────┐
│               VIVIM ROOT AGENT (macOS)            │
│                                                    │
│  ┌──────────────────────────────────────────────┐  │
│  │  MONITOR DAEMON (launchd service)            │  │
│  │  Runs as background service with admin privs  │  │
│  │                                              │  │
│  │  ┌────────────┐ ┌────────────┐ ┌──────────┐  │  │
│  │  │  Network   │ │   App      │ │ Clipboard│  │  │
│  │  │  Monitor   │ │  Monitor   │ │ Monitor  │  │  │
│  │  └─────┬──────┘ └─────┬──────┘ └────┬─────┘  │  │
│  │        │              │              │        │  │
│  │  ┌─────┴──────┐ ┌─────┴──────┐ ┌────┴─────┐  │  │
│  │  │ File System│ │   Audio    │ │ Screen   │  │  │
│  │  │  Monitor   │ │  Monitor   │ │ Monitor  │  │  │
│  │  │            │ │ (opt-in)   │ │(opt-in)  │  │  │
│  │  └─────┬──────┘ └─────┬──────┘ └────┬─────┘  │  │
│  │        │              │              │        │  │
│  │        └──────────────┼──────────────┘        │  │
│  │                       │                       │  │
│  │                       ▼                       │  │
│  │  ┌──────────────────────────────────────────┐ │  │
│  │  │         EVENT PROCESSOR                  │ │  │
│  │  │                                          │ │  │
│  │  │  • Deduplication (don't double-capture   │ │  │
│  │  │    what Layer 1 tools already captured)  │ │  │
│  │  │  • AI interaction detection (is this     │ │  │
│  │  │    actually an AI interaction?)          │ │  │
│  │  │  • Content extraction                   │ │  │
│  │  │  • ACU construction                     │ │  │
│  │  │  • Classification                       │ │  │
│  │  │  • Encryption                           │ │  │
│  │  └──────────────────┬───────────────────────┘ │  │
│  │                     │                         │  │
│  │                     ▼                         │  │
│  │  ┌──────────────────────────────────────────┐ │  │
│  │  │         LOCAL VAULT WRITER               │ │  │
│  │  │  Writes to same vault as Layer 1 tools   │ │  │
│  │  └──────────────────────────────────────────┘ │  │
│  └──────────────────────────────────────────────┘  │
│                                                    │
│  ┌──────────────────────────────────────────────┐  │
│  │  CONTROL INTERFACE                            │  │
│  │                                              │  │
│  │  Menu bar icon:                              │  │
│  │  🟢 VIVIM Agent Active                       │  │
│  │     ├── Network: ON (47 AI calls today)      │  │
│  │     ├── Apps: ON (3 AI apps detected)        │  │
│  │     ├── Clipboard: ON                        │  │
│  │     ├── Files: ON                            │  │
│  │     ├── Audio: OFF [Enable]                  │  │
│  │     ├── ──────────────────                   │  │
│  │     ├── Pause All (30 min)                   │  │
│  │     ├── Pause All (until tomorrow)           │  │
│  │     ├── View Capture Log                     │  │
│  │     ├── Settings                             │  │
│  │     └── Quit Agent                           │  │
│  └──────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════
DEDUPLICATION WITH LAYER 1
═══════════════════════════════════════════════════════

CRITICAL: When both the browser extension AND the root agent
are running, the same conversation could be captured twice.

Deduplication strategy:
  1. Each capture source tags ACUs with a source identifier
     (e.g., "browser-extension", "root-agent-network", "root-agent-clipboard")
  2. The vault engine deduplicates on content_hash
  3. If two captures have the same content_hash, keep the one 
     with the richer metadata (usually the browser extension's capture,
     which has DOM-level detail like model selection UI state)
  4. The duplicate is marked as "corroborated" rather than deleted
     (the root agent confirming the browser extension's capture
      strengthens the provenance chain)

COMPLEMENTARY CAPTURE:
  In the best case, Layer 1 and Layer 2 capture different things:
  
  Browser extension captures:
    • Web-based AI chats (rich DOM context)
    • Conversation structure (threads, branches, edits)
    
  Root agent captures:
    • API calls from scripts and applications
    • Desktop app AI interactions
    • Clipboard-based AI interactions
    • File-based AI interactions
    • Timing gaps (when the browser extension missed something)
    
  Together: complete coverage.

═══════════════════════════════════════════════════════
INSTALLATION & CONSENT
═══════════════════════════════════════════════════════

INSTALLATION REQUIREMENTS:
  macOS:
    • Administrator password
    • Full Disk Access (for file monitoring)
    • Accessibility access (for app monitoring)
    • Network Extension approval (for network monitoring)
    • Microphone access (for audio monitoring, if opted in)
    • Notarized by Apple (for distribution outside App Store)

  Windows:
    • Administrator rights
    • Windows Security exception (for process monitoring)
    • Firewall exception (for network proxy)

  Linux:
    • root or sudo access
    • SELinux/AppArmor policy adjustments
    • CAP_NET_ADMIN capability (for network capture)

CONSENT FLOW:
  ┌──────────────────────────────────────────────────┐
  │  VIVIM Root Agent — Installation                  │
  │                                                    │
  │  This agent will monitor your device for AI         │
  │  interactions and capture them in your vault.       │
  │                                                    │
  │  What it does:                                     │
  │  ✓ Detects when you interact with AI services      │
  │  ✓ Captures conversation content to YOUR vault      │
  │  ✓ All data encrypted and stored locally            │
  │  ✓ You control what's captured and can pause/stop   │
  │                                                    │
  │  What it monitors (you choose):                    │
  │  ☑ Network traffic to AI APIs                      │
  │  ☑ Application usage (which AI apps you use)       │
  │  ☑ Clipboard (when copying from/to AI apps)        │
  │  ☑ File system (AI-generated files)                │
  │  ☐ Audio (voice AI interactions) — OPTIONAL         │
  │                                                    │
  │  What it does NOT do:                              │
  │  ✗ Send ANY data to VIVIM servers                  │
  │  ✗ Monitor non-AI internet traffic                 │
  │  ✗ Capture passwords or financial data             │
  │  ✗ Share data without your explicit consent         │
  │  ✗ Run when you tell it to stop                    │
  │                                                    │
  │  This agent requires administrator access.          │
  │  The source code is open and auditable: [link]     │
  │                                                    │
  │  [Install with Selected Options]  [Cancel]          │
  └──────────────────────────────────────────────────┘

POST-INSTALLATION TRUST VERIFICATION:
  • First 24 hours: Agent runs in "audit mode"
    Shows user EXACTLY what it's capturing, without storing
  • User reviews the audit log and confirms:
    "Yes, this is what I want captured"
  • Only then does persistent storage begin
  • User can run audit mode again at any time
```

---

## Part V: Infrastructure Components

### Tool 25: VIVIM Vault Engine

```
TOOL 25: VIVIM VAULT ENGINE
═══════════════════════════════════════════════════════

PURPOSE:   Core storage, encryption, indexing, and query engine
           for the user's sovereign data vault
PRIORITY:  CRITICAL — prerequisite for everything else

═══════════════════════════════════════════════════════
THIS IS THE HEART OF THE SYSTEM
═══════════════════════════════════════════════════════

Every capture tool writes to the vault engine.
Every query tool reads from the vault engine.
Every detection algorithm operates on vault data.
Every marketplace listing references vault data.
Every SSC operates on vault metadata.

The vault engine must be:
  • FAST: Sub-second search across millions of ACUs
  • SECURE: AES-256-GCM encryption at rest, keys never leave device
  • PORTABLE: Works on macOS, Windows, Linux, iOS, Android
  • SYNCABLE: Multi-device sync without server-side decryption
  • QUERYABLE: Full-text search, semantic search, metadata filters
  • COMPACT: Efficient storage (text compresses well)
  • RESILIENT: Corruption recovery, backup/restore

═══════════════════════════════════════════════════════
STORAGE ARCHITECTURE
═══════════════════════════════════════════════════════

┌──────────────────────────────────────────────────┐
│                 VAULT ENGINE                      │
│                                                    │
│  ┌──────────────────────────────────────────────┐  │
│  │  KEY MANAGER                                  │  │
│  │  • Master key derivation (Argon2id from       │  │
│  │    passphrase + device key + optional hardware │  │
│  │    key from YubiKey/Titan/SE)                 │  │
│  │  • Per-ACU key derivation (HKDF)              │  │
│  │  • Key rotation support                       │  │
│  │  • Multi-device key sync (encrypted key export)│  │
│  └──────────────────────────────────────────────┘  │
│                                                    │
│  ┌──────────────────────────────────────────────┐  │
│  │  STORAGE LAYER                                │  │
│  │                                              │  │
│  │  Primary: SQLite (encrypted via SQLCipher)    │  │
│  │  • acus table: encrypted ACU blobs + metadata │  │
│  │  • conversations table: conversation index    │  │
│  │  • providers table: provider registry         │  │
│  │  • sscs table: SSC metadata                   │  │
│  │  • classifications table: tier assignments    │  │
│  │  • export_tokens table: authorization records │  │
│  │  • detection_results table: scan results      │  │
│  │                                              │  │
│  │  Index: SQLite FTS5 (full-text search)        │  │
│  │  • Encrypted search index                     │  │
│  │  • Tokenized on plaintext before encryption   │  │
│  │  • Search terms encrypted with search key      │  │
│  │                                              │  │
│  │  Embeddings: FAISS or Hnswlib (semantic search)│  │
│  │  • On-device embedding model (E5-small,       │  │
│  │    all-MiniLM-L6, or similar)                 │  │
│  │  • Vector index for similarity search         │  │
│  │  • Encrypted embedding storage                │  │
│  │                                              │  │
│  │  Blobs: File system (large attachments)       │  │
│  │  • Images, files uploaded to AI conversations │  │
│  │  • Encrypted individually, referenced by hash │  │
│  └──────────────────────────────────────────────┘  │
│                                                    │
│  ┌──────────────────────────────────────────────┐  │
│  │  QUERY ENGINE                                 │  │
│  │                                              │  │
│  │  • Full-text search: "monotonic restriction"  │  │
│  │  • Semantic search: "concepts like lattice     │  │
│  │    theory applied to permissions"             │  │
│  │  • Metadata filters: provider=claude AND       │  │
│  │    tier=2 AND date > 2025-01-01               │  │
│  │  • Conversation retrieval: get full thread     │  │
│  │  • Cross-reference: "ACUs related to ACU X"   │  │
│  │  • Statistics: counts, distributions, trends   │  │
│  └──────────────────────────────────────────────┘  │
│                                                    │
│  ┌──────────────────────────────────────────────┐  │
│  │  SYNC ENGINE                                  │  │
│  │                                              │  │
│  │  Multi-device sync protocol:                  │  │
│  │  1. All data encrypted BEFORE leaving device   │  │
│  │  2. Sync server sees only encrypted blobs      │  │
│  │  3. Conflict resolution: last-write-wins       │  │
│  │     for metadata, append-only for ACUs         │  │
│  │  4. Sync targets: VIVIM cloud, self-hosted,    │  │
│  │     or peer-to-peer (user's choice)           │  │
│  │                                              │  │
│  │  Options:                                     │  │
│  │  a) VIVIM Cloud Sync (managed, easiest)        │  │
│  │  b) Self-hosted (user runs sync server)        │  │
│  │  c) P2P sync (devices sync directly)           │  │
│  │  d) No sync (single device only)               │  │
│  └──────────────────────────────────────────────┘  │
│                                                    │
│  ┌──────────────────────────────────────────────┐  │
│  │  EXPORT ENGINE                                │  │
│  │                                              │  │
│  │  • Full vault export (encrypted backup)        │  │
│  │  • Selective export (specific ACUs/convos)     │  │
│  │  • Format options: JSON, Markdown, HTML, PDF    │  │
│  │  • Provenance metadata included in exports     │  │
│  │  • Export tokens attached for shared-sov data   │  │
│  └──────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════
ACU SCHEMA (Internal)
═══════════════════════════════════════════════════════

TABLE: acus
  id                TEXT PRIMARY KEY      -- UUID
  conversation_id   TEXT NOT NULL          -- parent conversation
  sequence_number   INTEGER               -- position in conversation
  provider          TEXT NOT NULL          -- "openai", "anthropic", etc.
  model             TEXT                   -- "claude-sonnet-4-20250514"
  role              TEXT NOT NULL          -- "user" or "assistant"
  content_encrypted BLOB NOT NULL          -- AES-256-GCM(content)
  content_hash      TEXT NOT NULL          -- SHA-256(plaintext)
  content_length    INTEGER               -- token count
  created_at        TEXT NOT NULL          -- ISO 8601
  captured_at       TEXT NOT NULL          -- when VIVIM captured it
  capture_source    TEXT NOT NULL          -- "browser-ext", "api-proxy", etc.
  user_signature    BLOB NOT NULL          -- Ed25519 over content_hash
  
  -- Shared sovereignty fields
  tier              INTEGER DEFAULT 0      -- 0-4
  classification_confidence REAL           -- 0.0-1.0
  ssc_ids           TEXT                   -- JSON array of applicable SSCs
  
  -- Search/retrieval
  embedding         BLOB                   -- float32 vector, encrypted
  topics            TEXT                   -- JSON array of topic labels
  
  -- Detection
  last_scanned      TEXT                   -- last detection scan timestamp
  detection_flags   TEXT                   -- JSON detection results
  
  -- Provenance
  on_chain_hash     TEXT                   -- on-chain commitment tx
  
  INDEXES:
    idx_conversation (conversation_id, sequence_number)
    idx_provider (provider, created_at)
    idx_tier (tier)
    idx_created (created_at)
    idx_content_hash (content_hash)  -- for deduplication

TABLE: conversations
  id                TEXT PRIMARY KEY
  provider          TEXT NOT NULL
  title             TEXT
  created_at        TEXT NOT NULL
  updated_at        TEXT NOT NULL
  message_count     INTEGER
  provider_conv_id  TEXT                   -- provider's conversation ID
  session_tag       TEXT                   -- "personal", "work:acme", etc.
  
TABLE: providers
  id                TEXT PRIMARY KEY       -- "openai", "anthropic", etc.
  display_name      TEXT
  api_base_url      TEXT
  capture_enabled   BOOLEAN DEFAULT TRUE
  last_import       TEXT                   -- last historical import timestamp
  acu_count         INTEGER                -- cached count

TABLE: sync_state
  device_id         TEXT PRIMARY KEY
  last_sync         TEXT
  sync_cursor       TEXT                   -- for incremental sync
  sync_target       TEXT                   -- "vivim-cloud", "self-hosted", etc.

═══════════════════════════════════════════════════════
SIZING ESTIMATES
═══════════════════════════════════════════════════════

Average ACU size: ~500 bytes (compressed, encrypted text)
Average user: 50 ACUs/day = 18,250 ACUs/year
Storage per year: ~9 MB (text only)

Heavy user: 200 ACUs/day = 73,000 ACUs/year
Storage per year: ~37 MB

With embeddings: +768 floats × 4 bytes = ~3 KB per ACU
Heavy user with embeddings: ~250 MB/year

With attachments (images, files): varies widely
Estimate: 1-5 GB/year for users who upload files to AI

CONCLUSION: A decade of AI conversations fits in < 5 GB 
for most users. Storage is not a constraint.
```

### Tool 26: VIVIM Processing Pipeline

```
TOOL 26: VIVIM PROCESSING PIPELINE
═══════════════════════════════════════════════════════

PURPOSE:   Transform raw captured data into structured,
           classified, signed, indexed ACUs
PRIORITY:  CRITICAL

═══════════════════════════════════════════════════════
PIPELINE STAGES
═══════════════════════════════════════════════════════

Raw Capture → STAGE 1: SEGMENTATION
            → STAGE 2: NORMALIZATION
            → STAGE 3: DEDUPLICATION
            → STAGE 4: ENRICHMENT
            → STAGE 5: CLASSIFICATION
            → STAGE 6: SIGNING & HASHING
            → STAGE 7: ENCRYPTION
            → STAGE 8: INDEXING
            → STAGE 9: ON-CHAIN COMMITMENT
            → STAGE 10: VAULT WRITE

═══════════════════════════════════════════════════════

STAGE 1: SEGMENTATION
  Split raw conversation data into Atomic Content Units.
  
  Rules:
  • One ACU per message (user message or AI response)
  • Multi-part messages (with images, code, text) → single ACU with parts
  • System messages → separate metadata ACU
  • Very long responses (>4K tokens) → single ACU (don't split)
  • Edits/regenerations → new ACUs linked to original via parent_id
  
STAGE 2: NORMALIZATION
  Convert provider-specific formats to canonical VIVIM format.
  
  • Standardize role names ("human"/"Human" → "user")
  • Standardize timestamps to ISO 8601 UTC
  • Normalize unicode (NFC normalization)
  • Extract model version to canonical name
  • Normalize code block formatting
  • Extract and catalog attachments
  
STAGE 3: DEDUPLICATION
  Detect and handle duplicate captures.
  
  • Compute content_hash (SHA-256 of normalized plaintext)
  • Check vault for existing ACU with same content_hash
  • If duplicate:
    - If from same source: skip (true duplicate)
    - If from different source: mark as "corroborated"
      (e.g., browser extension + root agent both captured it)
  • Near-duplicate detection: SimHash for fuzzy matching
    (catches minor differences in formatting/whitespace)

STAGE 4: ENRICHMENT
  Add metadata not present in the raw capture.
  
  • Topic extraction (on-device topic model)
  • Language detection
  • Code language detection (for code blocks)
  • Entity extraction (people, companies, technologies mentioned)
  • Sentiment/tone analysis (optional)
  • Complexity scoring (Kolmogorov estimate from Algorithm 3)
  • Embedding generation (on-device embedding model)
  
STAGE 5: CLASSIFICATION
  Assign shared-sovereignty tier (from Chapter 4 of SSC architecture).
  
  • Run classification engine against all active SSCs
  • Assign tier (0-4)
  • Record confidence and matched signals
  • Flag for review if confidence < threshold
  • Apply max-tier rule for multiple applicable SSCs
  
STAGE 6: SIGNING & HASHING
  Establish cryptographic provenance.
  
  • content_hash ← SHA-256(normalized_plaintext)
  • user_signature ← Ed25519.Sign(SK_user, content_hash || timestamp || provider)
  • Provenance record: {content_hash, timestamp, provider, model, user_did, signature}
  
STAGE 7: ENCRYPTION
  Encrypt content for vault storage.
  
  • Derive per-ACU key: K_acu ← HKDF(K_master, acu_id || "content")
  • content_encrypted ← AES-256-GCM.Encrypt(K_acu, normalized_plaintext)
  • Embedding encryption: separate key derivation
  
STAGE 8: INDEXING
  Update search and retrieval indexes.
  
  • Full-text index (FTS5): tokenize plaintext, add to index
  • Semantic index (FAISS): add embedding vector
  • Metadata index: update provider/date/tier indexes
  
STAGE 9: ON-CHAIN COMMITMENT
  Record provenance hash on-chain.
  
  • Batch commitments (every N ACUs or every M minutes)
  • Merkle tree of ACU hashes → single on-chain transaction
  • Transaction ID stored with each ACU for later verification
  
  This proves: "This data existed at this time"
  Without revealing: what the data contains
  
STAGE 10: VAULT WRITE
  Write the complete ACU record to the vault database.
  
  • Atomic write (all-or-nothing)
  • Update conversation record
  • Update provider statistics
  • Trigger sync (if multi-device sync enabled)
  • Emit event for UI update

═══════════════════════════════════════════════════════
PERFORMANCE REQUIREMENTS
═══════════════════════════════════════════════════════

End-to-end pipeline latency: < 2 seconds per ACU
  (from raw capture to vault write, excluding on-chain commitment)

On-chain commitment: batched, < 60 seconds per batch

Throughput: ≥ 10 ACUs/second (for bulk historical import)

All processing happens ON-DEVICE. No cloud required.
```

---

## Part VI: The Unified Data Flow

### How Everything Connects

```
THE COMPLETE DATA FLOW
═══════════════════════════════════════════════════════

                    USER'S AI INTERACTIONS
                    ═════════════════════
                    
    ┌─────────┐  ┌─────────┐  ┌───��─────┐  ┌─────────┐
    │ Browser │  │  Mobile  │  │   IDE   │  │   API   │
    │  Chat   │  │   App    │  │  Code   │  │  Calls  │
    └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘
         │            │            │            │
    ┌────┴────┐  ┌────┴────┐  ┌────┴────┐  ┌────┴────┐
    │Browser  │  │ Mobile  │  │  IDE    │  │  API    │
    │Extension│  │  App    │  │ Plugin  │  │  Proxy  │
    │ (T1)    │  │ (T2)    │  │ (T3)    │  │ (T4)    │
    └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘
         │            │            │            │
         └────────────┴────────────┴────────────┘
                           │
              ┌────────────┴────────────┐
              │    ROOT AGENT (T14-16)   │
              │    (fills gaps)          │
              └────────────┬────────────┘
                           │
                           │ Raw captured data
                           ▼
              ┌────────────────────────┐
              │   PROCESSING PIPELINE   │  ← Tool 26
              │   (Tool 26)             │
              │                        │
              │  Segment → Normalize   │
              │  → Deduplicate         │
              │  → Enrich              │
              │  → Classify (SSC)      │
              │  → Sign & Hash         │
              │  → Encrypt             │
              │  → Index               │
              └───────────┬────────────┘
                          │
                          │ Processed, encrypted ACUs
                          ▼
              ┌────────────────────────┐
              │     VAULT ENGINE       │  ← Tool 25
              │     (Tool 25)          │
              │                        │
              │  ┌─────────────────┐   │
              │  │ SQLCipher DB    │   │
              │  │ FTS5 Index      │   │
              │  │ Vector Index    │   │
              │  │ Blob Store      │   │
              │  └────────┬────────┘   │
              │           │            │
              │  ┌────────┴────────┐   │
              │  │   Sync Engine   │   │──── Multi-device sync
              │  └─────────────────┘   │    (encrypted)
              └───────────┬────────────┘
                          │
              ┌───────────┴────────────────────────┐
              │                                     │
              ▼                                     ▼
    ┌─────────────────┐                ┌─────────────────────┐
    │  DETECTION       │                │  MARKETPLACE /       │
    │  ENGINE (T29)    │                │  SHARING (T30)       │
    │                  │                │                      │
    │  Algorithms 1-13 │                │  Requires:           │
    │  Run on vault    │                │  • User signature    │
    │  data against    │                │  • Org co-signature  │
    │  AI models       │                │    (if Tier 2+)      │
    │                  │                │  • Export token       │
    │  Results stored  │                │  • On-chain record   │
    │  in vault        │                │                      │
    └─────────────────┘                └─────────────────────┘
              │                                     │
              ▼                                     ▼
    ┌─────────────────┐                ┌─────────────────────┐
    │  ON-CHAIN        │                │  REVENUE             │
    │  PROVENANCE      │                │  DISTRIBUTION        │
    │  (Tool 28)       │                │                      │
    │                  │                │  • User wallet       │
    │  • ACU hash      │                │  • Org wallet        │
    │    commitments   │                │    (if applicable)   │
    │  • SSC records   │                │  • Protocol fee      │
    │  • Export tokens │                │                      │
    │  • Detection     │                │                      │
    │    evidence      │                │                      │
    └─────────────────┘                └─────────────────────┘


═══════════════════════════════════════════════════════
HISTORICAL IMPORT FLOW (ONE-TIME)
═══════════════════════════════════════════════════════

    ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐
    │ ChatGPT │  │  Claude  │  │ Gemini  │  │ Generic │
    │ Export  │  │ Export  │  │Takeout  │  │JSON/CSV │
    │  ZIP    │  │  JSON   │  │  ZIP    │  │  file   │
    └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘
         │            │            │            │
    ┌────┴────┐  ┌────┴────┐  ┌────┴────┐  ┌────┴────┐
    │Import   │  │Import   │  │Import   │  │Import   │
    │Tool 17  │  │Tool 18  │  │Tool 19  │  │Tool 23  │
    │(Parser) │  │(Parser) │  │(Parser) │  │(Mapper) │
    └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘
         │            │            │            │
         └────────────┴────────────┴────────────┘
                           │
                           │ Parsed conversations
                           ▼
              ┌────────────────────────┐
              │   PROCESSING PIPELINE   │
              │   (same as real-time)   │
              │                        │
              │   + BATCH MODE          │
              │   + Progress tracking   │
              │   + Resumable           │
              │   + Duplicate detection │
              │     against existing    │
              │     vault contents      │
              └───────────┬────────────┘
                          │
                          ▼
                    VAULT ENGINE
                    (same destination as real-time captures)
```

---

## Part VII: Build Order & Dependencies

```
BUILD ORDER — CRITICAL PATH
═══════════════════════════════════════════════════════

WEEK 1-4: FOUNDATION
─────────────────────────────────────────────
Build first (everything depends on these):

  [25] Vault Engine (SQLCipher + basic CRUD)
  [28] Identity Service (DID creation, key management)
  [26] Processing Pipeline (stages 1-3, 6-8, 10)
  
  Deliverable: Can store and retrieve encrypted ACUs locally.

WEEK 5-8: FIRST CAPTURE
─────────────────────────────────────────────
Build the most impactful capture tool:

  [1]  Browser Extension — Chrome (ChatGPT + Claude adapters only)
  [17] Import — ChatGPT history
  [18] Import — Claude history
  
  Deliverable: Users can capture new conversations AND 
  import their entire history from the two most popular 
  AI providers. This alone provides massive value.

WEEK 9-12: CORE EXPERIENCE
─────────────────────────────────────────────
Build the management and viewing layer:

  [5]  Desktop App (vault browser, search, settings)
  [2]  Mobile App (vault viewer + share sheet capture)
  [1]  Browser Extension — add Gemini, Copilot, Perplexity adapters
  [26] Processing Pipeline — add stages 4-5 (enrichment, classification)
  
  Deliverable: Users can capture, view, search, and manage 
  their AI conversation vault across devices.

WEEK 13-16: DEVELOPER TOOLS
─────────────────────────────────────────────
  [4]  API Proxy (local proxy for API calls)
  [3]  IDE Plugin — VS Code (Copilot + Cursor capture)
  [9]  CLI Tool
  [23] Import — Generic JSON/CSV
  
  Deliverable: Developer users can capture ALL their 
  AI interactions (web + code + API + terminal).

WEEK 17-20: SHARED SOVEREIGNTY
─────────────────────────────────────────────
  [28] Identity Service — add SSC support
  [26] Processing Pipeline — add SSC classification engine
  [31] Organization Dashboard (MVP)
  [5]  Desktop App — add SSC management UI
  
  Deliverable: Organizations can onboard and establish
  shared sovereignty contracts with employees.

WEEK 21-24: DETECTION & MARKETPLACE
─────────────────────────────────────────────
  [29] Detection Engine (Algorithms 1, 2, 3, 4)
  [30] Marketplace (MVP — listing + purchase + revenue split)
  [27] Sync Service (multi-device encrypted sync)
  
  Deliverable: Users can scan for unauthorized use 
  and sell/license their data.

WEEK 25-30: SYSTEM-LEVEL & ADVANCED
─────────────────────────────────────────────
  [14] Root Agent — macOS
  [29] Detection Engine (Algorithms 5-13)
  [6-8, 10-13] Secondary capture tools
  [19-22] Additional import tools
  [32-35] Developer SDK & ecosystem tools
  
  Deliverable: Complete tool ecosystem for power users.

WEEK 31-36: POLISH & SCALE
─────────────────────────────────────────────
  [15] Root Agent — Windows
  [16] Root Agent — Linux
  [1]  Browser Extension — Safari, Firefox, Edge
  [2]  Mobile App — full capture (VPN mode, accessibility)
  Cross-platform testing and hardening
  
  Deliverable: Production-ready ecosystem across all platforms.


═══════════════════════════════════════════════════════
DEPENDENCY GRAPH (simplified)
═══════════════════════════════════════════════════════

[28 Identity] ─────────────────────────────────┐
      │                                         │
      ▼                                         │
[25 Vault Engine] ──────────────────────┐       │
      │                                 │       │
      ▼                                 │       │
[26 Processing Pipeline] ───────────┐   │       │
      │                             │   │       │
      ├──────────────┐              │   │       │
      │              │              │   │       │
      ▼              ▼              ▼   ▼       ▼
[1 Browser Ext] [17-24 Importers] [5 Desktop] [31 Org Dashboard]
      │                             │           │
      ├──────────────┬──────────────┘           │
      │              │                          │
      ▼              ▼                          │
[2 Mobile App] [3 IDE Plugin]                   │
                     │                          │
      ┌──────────────┤                          │
      │              │                          │
      ▼              ▼                          ▼
[4 API Proxy]  [14-16 Root Agent]  [30 Marketplace]
                                        │
                                        ▼
                                  [29 Detection Engine]
                                        │
                                        ▼
                                  [27 Sync Service]
```

---

## Part VIII: Cross-Cutting Concerns

### Adapter Maintenance

```
THE FRAGILITY PROBLEM
═══════════════════════════════════════════════════════

AI provider web interfaces change frequently.
ChatGPT redesigns its UI every few months.
Claude updates class names and DOM structure regularly.
Each change can break the browser extension's adapters.

THIS IS THE #1 OPERATIONAL RISK.

MITIGATION STRATEGY:

1. DUAL CAPTURE (DOM + Network)
   Network interception (API calls) is MORE STABLE than DOM scraping.
   API formats change less often than UI designs.
   Always prefer network capture; use DOM as enrichment.

2. ADAPTER TESTING BOT
   Automated bot that loads each provider's site daily
   and verifies that adapters can still identify:
   • Chat container
   • User messages
   • AI responses
   • Model selector
   If any check fails → alert the engineering team.

3. COMMUNITY-MAINTAINED ADAPTERS
   Open-source adapter repository.
   When a provider changes their UI, community members 
   can submit fixes before the core team patches.
   Review + merge in < 24 hours for critical adapters.

4. GRACEFUL DEGRADATION
   When an adapter breaks:
   • Network capture continues (usually unaffected)
   • User sees: "Some details may be missing for [provider]"
   • User can manually paste/share conversations as fallback
   • Auto-update pushes fixed adapter ASAP

5. PROVIDER COOPERATION (aspirational)
   Work with providers to establish a standard capture API:
   "Give us a stable endpoint that returns the current 
    conversation in a standard format."
   
   This is in the provider's interest too: if they support 
   VIVIM, their users are more likely to trust them with data.
```

### Privacy Architecture

```
PRIVACY PRINCIPLES FOR ALL TOOLS
═══════════════════════════════════════════════════════

1. LOCAL FIRST
   All processing happens on the user's device.
   No raw data is ever sent to VIVIM servers.
   Cloud sync is opt-in and encrypted end-to-end.

2. MINIMAL CAPTURE
   Each tool captures ONLY what it needs for its function.
   Browser extension: only AI chat pages.
   Root agent: only AI-related traffic.
   No general browsing, no general keylogging, no general screen recording.

3. TRANSPARENT OPERATION
   Every tool shows the user exactly what it's capturing.
   Capture logs are always accessible.
   Audit mode available for every tool.

4. USER CONTROL
   Pause/resume capture at any time.
   Delete any captured data at any time.
   Export all data at any time.
   Uninstall cleanly (all local data removed on request).

5. OPEN SOURCE
   All capture tools are open source.
   Users (and security researchers) can audit the code.
   No obfuscation, no hidden telemetry, no dark patterns.

6. NO PHONE HOME
   Tools do not report usage statistics to VIVIM servers
   unless user explicitly opts in.
   The only outbound connections are:
   • Sync (if enabled by user)
   • On-chain transactions (for provenance)
   • Adapter updates (checking for new versions)
   All of these can be disabled.
```

### Platform-Specific Constraints

```
PLATFORM CONSTRAINTS
═══════════════════════════════════════════════════════

iOS:
  • No background network interception
  • No accessibility service for reading other apps
  • Share Sheet is the primary capture mechanism
  • Safari extension has limited API access
  • On-device ML models must be CoreML format
  • App Store review will scrutinize privacy claims closely
  
  STRATEGY: Share Sheet + Clipboard + Safari Extension
  Accept that iOS capture will be more manual than other platforms.

Android:
  • Accessibility service can read other app content (powerful)
  • VPN API allows network interception
  • Background services possible but battery-constrained
  • Google Play review less restrictive than App Store
  
  STRATEGY: Accessibility Service (primary) + VPN (power users)
  Android can achieve near-complete capture with proper permissions.

macOS:
  • Network Extension framework for traffic inspection
  • Accessibility API for app monitoring
  • Endpoint Security framework for process monitoring
  • Notarization required for distribution
  • Full Disk Access for file monitoring
  
  STRATEGY: All channels available. Most complete experience.

Windows:
  • WFP for network filtering
  • UI Automation for app monitoring
  • ETW for system events
  • Windows SmartScreen may flag unsigned executables
  
  STRATEGY: Similar to macOS but with Windows-specific APIs.

Linux:
  • eBPF for network monitoring (modern kernels)
  • LD_PRELOAD for library interception
  • D-Bus for desktop integration
  • Most flexible but most fragmented (distros vary)
  
  STRATEGY: eBPF where available, fall back to LD_PRELOAD.

Corporate/Managed Devices:
  • MDM may block extension installation
  • Admin rights may not be available
  • Network traffic may be proxied through corporate firewall
  • Company may have policies against capture tools
  
  STRATEGY: Work WITH organizations through SSC framework.
  The org APPROVES VIVIM installation because it benefits 
  from shared-sovereignty governance.
  VIVIM becomes part of the company's data governance stack,
  not a rogue employee tool.
```

---

## Part IX: Success Metrics

```
CAPTURE COMPLETENESS METRICS
═══════════════════════════════════════════════════════

METRIC: Capture Rate
  Definition: % of user's AI interactions captured
  
  Layer 1 only (application tools):
    Target: ≥ 80% of all interactions
    
    Browser extension alone:      60-70%
    + Mobile app:                 75-85%
    + IDE plugin:                 85-90%
    + API proxy:                  90-95%
    
  Layer 1 + Layer 2 (+ root agent):
    Target: ≥ 98% of all interactions

METRIC: Capture Latency
  Definition: Time from interaction to vault storage
  Target: < 5 seconds (real-time capture)
           < 30 seconds (batch/streaming responses)

METRIC: Capture Accuracy
  Definition: % of captured content that accurately represents 
              the original interaction (no truncation, no corruption)
  Target: > 99.5%

METRIC: Import Completeness
  Definition: % of historical conversations successfully imported
  Target: > 99% (some conversations may be in unsupported formats)

METRIC: Classification Accuracy
  Definition: % of ACUs correctly classified by tier
  Target: > 90% (with < 2% false negatives on Tier 2+ data)

METRIC: Zero Data Loss
  Definition: No captured data lost due to tool failure
  Target: 0 data loss events per user per year
  Mechanism: Write-ahead logging, retry queues, crash recovery
```

---

*This tool ecosystem transforms the VIVIM protocol from an idea into a functioning system. The browser extension alone — capturing web-based AI conversations — delivers immediate value. Each additional tool expands coverage. The root agent fills remaining gaps. The historical importers bring past data into the vault. And the processing pipeline ensures every captured interaction is properly structured, classified, signed, and stored for sovereign ownership. The build order ensures that the most impactful tools ship first, each building on the foundation laid by its predecessor.*
