# VIVIM — User Flows & Experience Map
**Archived**: 2026-03-05 | **Basis**: `04-user-flows-experience-map.md`

---

## Flow 1: New User Onboarding → First Conversation Import

```
Landing (vivim.app)
  → "Get Started" / "Sign Up"
  → Google OAuth OR DID-based identity
  → User record created:
      - did (decentralized identifier)
      - publicKey (Ed25519)
      - trustScore = 50
  → Identity Setup (first run):
      - Display name
      - Handle (username)
      - Device registration
      - Optional: 2FA setup
  → Navigate to "Capture" page
  → Paste conversation URL
  → System captures:
      - CaptureAttempt record created
      - Playwright scrapes provider page
      - Conversation + Messages stored
      - ACU generation queued (async)
  → User sees conversation in home feed
```

**Known Issues**:
- `ownerId` not always set during capture — design flaw
- Onboarding flow has untested edge cases (75% complete)

---

## Flow 2: Receiving a Share Link

```
User receives link: vivim.app/share/xxxxx
  → PWA routes to /receive/:code
  → System resolves share:
      - Checks linkCode exists
      - Validates isActive and expiresAt
      - If password-protected: prompts for password
  → Preview shown:
      - Conversation title
      - ACU snippets
      - Permissions being requested
      - "Shared by [username]"
  → User decision:
      - Accept → ContentAccessGrant created
      - Decline → No action
      - Fork/Continue → New ACU from shared content
  → If accepted:
      - Conversation cloned to user's library
      - Shared ACUs available in user's context
      - Attribution maintained (provenance)
      - Access logged in ContentAccessLog
```

**Edge Cases**:
- Link expired → Show "Link Expired" error
- Max views reached → Show "Limit Reached" error
- Content removed by sharer → Show "Content Unavailable"

---

## Flow 3: Creating and Sharing an Atomic Chat Unit

```
ACU created:
  1. Automatic — from imported conversation (acu-generator.js)
  2. Manual — user creates custom ACU (not fully exposed in UI)

ACU enriched:
  - qualityOverall, contentRichness, structuralIntegrity, uniqueness
  - rediscoveryScore (predicted future value)
  - Ed25519 signature

User organizes ACU:
  - Add to Notebook
  - Apply tags
  - Set sharingPolicy: self / circle / public

User shares ACU:
  → Clicks "Share" on ACU
  → SharingDialog opens
  → Configure:
      - Type: Link / Circle / Direct
      - Permissions: canView, canAnnotate, canRemix, canReshare
      - Optional: expiration, max views, password
  → Confirm
  → SharingIntent created (status: ACTIVE)
  → ShareLink generated with unique linkCode

Metrics tracked:
  - shareCount
  - quoteCount
  - viewCount (when trackable)
```

---

## Flow 4: Forking / Continuing a Shared ACU

```
User receives notification: "ACU shared with you"
  → Navigates to shared ACU
  → Sees:
      - Original content
      - Author attribution
      - Available permissions
      - Parent lineage (if forked from another ACU)

Forking:
  → User clicks "Fork" / "Remix"
  → New ACU created with parentId = original ACU id
  → Content copied as starting point
  → User edits and builds on top

Continuing thread:
  → User clicks "Continue"
  → New ACU linked via AcuLink with relation: "continues"

Thread visualization shows:
  - Original ACU at root
  - Forked variants branching
  - Continuation chains as a knowledge graph
```

**Edge Cases**:
- Parent ACU deleted: Fork remains, shows "Original unavailable"
- Fork permissions revoked: User notified, fork access removed

---

## Flow 5: AI Chat with Context Engine

```
User starts new chat (BYOK or using Z.AI)
  → Selects AI provider and model
  → Types message

Before generating response:
  Context Assembly:
  1. DETECTION — Analyze message for topics/entities
  2. BUNDLE RETRIEVAL — Fetch bundles:
       - identity_core: User identity facts
       - global_prefs: User settings
       - topic: Relevant topic profiles
       - entity: Relevant entity profiles
       - conversation: Current thread context
       - composite: Pre-merged bundles
  3. BUDGET ALLOCATION — Calculate token budget
       - Max: 12,000 tokens (configurable 4096–50000)
       - Each layer gets allocation based on priority + elasticity
  4. JIT RETRIEVAL (if budget allows):
       - Similar ACUs via pgvector search
       - Relevant memories via pgvector search
  5. COMPILATION — BundleCompiler creates system prompt
       → compiledPrompt + tokenCount

AI generates streaming response
  ↓
Post-response:
  - Save message to Conversation
  - Update conversation stats
  - Update topic/entity profiles if new
  - Mark bundles as dirty (triggers recompilation)
```

### Context Settings (ContextCockpitPage)
- `maxContextTokens`: 4096–50000 (default 12000)
- `topicSimilarityThreshold`: default 0.35
- `entitySimilarityThreshold`: default 0.40
- `acuSimilarityThreshold`: default 0.35
- `memorySimilarityThreshold`: default 0.40
- Toggle: predictions, JIT retrieval, compression, entity/topic context
- Custom Recipes: Saved context configurations for specific use cases

---

## Flow 6: Circle and Social Features

### Creating a Circle
```
Navigate to Circles
  → "Create Circle"
  → Set name, description, visibility (Public/Private)
  → User becomes owner
  → Members invited by handle or share link
  → Invitation flow: accept/decline → CircleMember record
```

### Circle-Based Sharing
```
Share ACU
  → Select "Circle" audience
  → Choose circle(s)
  → Members can view (if canShare enabled)
```

### Friends System
- Send friend request → bidirectional connection
- Block user → removes from connections
- Unidirectional follow also available (no approval needed)
- Groups and Teams for larger collaborative structures

---

## Flow 7: Memory Extraction

```
Trigger: Automatic (Librarian Worker, 30min after conversation idle)
  OR Manual: User clicks "Extract Memories"

Process:
  1. MemoryExtractionJob processes conversation
  2. LLM (Z.AI) analyzes messages
  3. Extracts categories:
       - FACTUAL: "I am a software engineer"
       - PREFERENCE: "I prefer Python"
       - EPISODIC: "I worked at Google in 2022"
       - RELATIONSHIP: "My manager is named Sarah"
  4. Generates vector embeddings
  5. Saves Memory records with:
       - Content
       - Type
       - Confidence score
       - Source conversation/ACU reference
  6. Memory available for JIT retrieval in future context
```

### Memory Consolidation (Manual)
```
POST /api/v1/memory/consolidate
  → Find similar memories (pgvector search)
  → Merge duplicates/overlapping
  → Update importance scores
  → Archive low-value memories
```

---

## Flow 8: Data Export / Portability

```
Navigate to Account → Export Data
  → POST /api/v2/portability/export
  → Format selection: JSON, ActivityPub, ATProtocol, Markdown, HTML
  → System prepares export bundle
  → Export ready for download
  → User can re-import to another VIVIM instance or external platforms
```

---

## Incomplete / Partially Designed Flows

| Flow | Status | Blocker |
|------|--------|---------|
| P2P Sync (device-to-device) | ⚠️ PARTIAL | LibP2P not operational |
| Notebook sharing as collection | ⚠️ PARTIAL | Export flow not fully surfaced in UI |
| Search across shared public content | ⚠️ NOT IMPLEMENTED | Feed algorithm incomplete |
| AI conversation forking mid-thread | ✅ WORKING | `POST /api/v1/ai-chat/fork` |
| Context recipe creation | ⚠️ PARTIAL | ContextRecipesPage exists but not all context types supported |
| Moderation flow (user-facing) | ✅ WORKING | `POST /api/v2/moderation/flag` |
| Admin moderation review | ✅ WORKING | `GET/PUT /api/v2/moderation/flags` |
