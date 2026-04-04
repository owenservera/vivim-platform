# DOCUMENT 4: USER FLOWS & EXPERIENCE MAP

---

## Flow 1: New User Onboarding → First Conversation Import

### Step-by-Step Sequence

1. **Landing**
   - User visits PWA (vivim.app)
   - Sees hero: "Own, Share, Evolve Your AI"

2. **Account Creation**
   - User clicks "Get Started" or "Sign Up"
   - Options visible:
     - Google OAuth (via Passport)
     - Email/password (implied)
     - DID-based identity (for advanced users)
   - User completes authentication
   - System creates User record with:
     - Unique `did` (decentralized identifier)
     - `publicKey` (Ed25519)
     - Default `trustScore` of 50

3. **Identity Setup (First Run)**
   - User prompted to set:
     - Display name
     - Handle (username)
   - Device registration flow
   - Optional: Set up 2FA (mfaEnabled)

4. **First Conversation Import**
   - User navigates to "Capture" page
   - Options:
     - **Paste URL**: Enter ChatGPT/Claude/Gemini conversation URL
     - **Browser Extension**: (future)
   - System performs capture:
     - `CaptureAttempt` record created
     - Playwright scrapes provider page
     - Extracts conversation JSON
     - Creates `Conversation` record
     - Creates `Message` records
     - Queues async ACU generation

5. **ACU Generation (Background)**
   - After capture, `acu-generator.js` processes conversation
   - Generates Atomic Chat Units:
     - Splits messages into meaningful chunks
     - Generates embeddings
     - Calculates quality scores
     - Stores in `AtomicChatUnit` table

6. **View Imported Conversation**
   - User sees conversation in home feed
   - Can view, search, organize into notebooks

### Known Issues
- OwnerId not set during capture (design flaw documented)
- No user identity attached in capture flow

---

## Flow 2: Importing from External Provider via Share Link

### Step-by-Step Sequence

1. **Receiving a Share Link**
   - User receives link via:
     - Email/message with vivim.app/share/xxxxx
     - Direct sharing from another user
   - User clicks link in browser

2. **Link Resolution**
   - PWA routes to `/share/:linkCode`
   - System resolves ShareLink:
     - Checks `linkCode` exists
     - Validates `isActive` and `expiresAt`
     - If password protected, prompts for password

3. **Intent Preview**
   - User sees preview of shared content:
     - Conversation title
     - ACU snippets
     - Permissions being requested
   - Shows "Shared by [username]"

4. **Acceptance Decision**
   - User can:
     - **Accept**: Creates ContentAccessGrant
     - **Decline**: No action
     - **Fork/Continue**: Creates new ACU from shared content

5. **Content Import**
   - If accepted:
     - Conversation cloned to user's library
     - Shared ACUs available in user's context
     - Attribution maintained (provenance tracking)
   - Access logged in ContentAccessLog

### Edge Cases
- Link expired: Show "Link Expired" error
- Link max uses reached: Show "Limit Reached" error
- Content removed by sharer: Show "Content Unavailable"

---

## Flow 3: Creating and Sharing an Atomic Chat Unit

### Step-by-Step Sequence

1. **Creating an ACU**
   - **Automatic**: ACUs created from imported conversations
   - **Manual**: User can create custom ACU (not fully visible in UI)
   - ACU requires:
     - `id`: Generated (not auto-increment)
     - `authorDid`: User's DID
     - `content`: The text/code content
     - `signature`: Cryptographic signature

2. **ACU Quality Scoring**
   - System calculates:
     - `qualityOverall`: Overall quality score
     - `contentRichness`: Depth of content
     - `structuralIntegrity`: Organization
     - `uniqueness`: Rarity
   - `rediscoveryScore`: Predicted value if rediscovered

3. **Organizing ACU**
   - User can add to Notebook
   - User can tag ACU with keywords
   - User can set `sharingPolicy`:
     - `self`: Private
     - `circle`: Share with circle
     - `public`: Anyone can discover

4. **Sharing an ACU**
   - User selects ACU in UI
   - Clicks "Share" button
   - Opens SharingDialog

5. **Configuring Share**
   - Select share type:
     - **Link**: Shareable URL
     - **Circle**: Share with circle members
     - **Direct**: Share with specific users
   - Set permissions:
     - `canView`: View content
     - `canAnnotate`: Add comments
     - `canRemix`: Fork and modify
     - `canReshare`: Share further
   - Optional: Set expiration, max views, password

6. **Publishing**
   - User confirms share
   - System creates SharingIntent (status: ACTIVE)
   - If link: Creates ShareLink with unique code
   - If circle: Adds CircleMember permissions

7. **Share Metrics**
   - System tracks:
     - `shareCount`: Times shared
     - `quoteCount`: Times quoted
     - `viewCount`: Times viewed (if trackable)

---

## Flow 4: Receiving Shared Thread and Forking/Continuing

### Step-by-Step Sequence

1. **Receiving Notification**
   - User gets notification:
     - In-app notification
     - Email (if enabled)
   - Notification type: "ACU shared with you"

2. **Viewing Shared Content**
   - User navigates to shared ACU
   - Sees:
     - Original content
     - Author attribution
     - Permissions available
     - Parent lineage (if forked)

3. **Forking (Remixing)**
   - User clicks "Fork" or "Remix"
   - System:
     - Creates new ACU
     - Sets `parentId` to original ACU
     - Copies content as starting point
     - User edits/continues from there

4. **Continuing Thread**
   - User can reply to ACU
   - Creates linked ACU via AcuLink
   - Relation type: "continues"

5. **Thread Visualization**
   - UI shows:
     - Original ACU at root
     - Forked variants branching
     - Continuation chains

### Edge Cases
- Parent ACU deleted: Fork remains, shows "Original unavailable"
- Fork permissions revoked: User notified, fork access removed

---

## Flow 5: Interacting with Context Engine

### Step-by-Step Sequence

1. **Starting New Chat**
   - User navigates to AI chat (BYOK or provider)
   - Selects AI provider and model (if BYOK)

2. **Context Assembly**
   - Before generating response, ContextEngine assembles:

   **Step 2a: Detection**
   - Analyze user message for:
     - Detected topics (via TopicProfile matching)
     - Detected entities (via EntityProfile matching)
     - Conversation continuity

   **Step 2b: Bundle Retrieval**
   - Fetch relevant bundles by type:
     - `identity_core`: User's identity facts
     - `global_prefs`: User settings
     - `topic`: Relevant topic profiles
     - `entity`: Relevant entity profiles
     - `conversation`: Current conversation context
     - `composite`: Pre-merged bundles

   **Step 2c: Budget Allocation**
   - Calculate tokens available (maxContextTokens)
   - Allocate per layer based on:
     - Layer priority
     - Elasticity (willingness to shrink)
     - Detected need

   **Step 2d: JIT Retrieval**
   - If enabled, retrieve similar ACUs and memories
   - Add to context as relevant

3. **Context Compilation**
   - BundleCompiler creates system prompt
   - Combines all layers into final context
   - Returns `compiledPrompt` and `tokenCount`

4. **Response Generation**
   - AI generates response with context
   - Response saved to Message/Conversation

5. **Post-Response Updates**
   - Update conversation stats
   - Update topic/entity profiles if new
   - Mark bundles as dirty if context changed

### Managing Context Settings

1. **Navigate to Settings**
   - User goes to Settings > Context Engine
   - Or visits ContextCockpitPage

2. **Adjust Budget**
   - Set `maxContextTokens` (4096-50000)
   - Default: 12000

3. **Adjust Thresholds**
   - Topic similarity: default 0.35
   - Entity similarity: default 0.40
   - ACU similarity: default 0.35
   - Memory similarity: default 0.40

4. **Enable/Disable Features**
   - Toggle predictions
   - Toggle JIT retrieval
   - Toggle compression
   - Toggle entity/topic context

5. **Create Custom Recipes**
   - ContextRecipesPage allows:
     - Predefined context combinations
     - Saved for specific use cases

---

## Flow 6: Circle and Social Grouping

### Creating a Circle

1. User navigates to Circles
2. Clicks "Create Circle"
3. Sets:
   - Name (required)
   - Description (optional)
   - Visibility: Public/Private
4. User becomes Circle owner

### Adding Members

1. Owner invites users
2. Via handle search or share link
3. Member receives invitation
4. Accepts/rejects
5. If accepted, CircleMember record created

### Circle-Based Sharing

1. User shares ACU
2. Selects "Circle" audience
3. Chooses circle(s)
4. Members can view (if canShare enabled)

---

## Flow 7: Memory Extraction

### Triggering Memory Extraction

1. **Automatic**: After conversation capture
   - Conversation imported
   - MemoryExtractionJob queued

2. **Manual**: User requests extraction
   - Selects conversation
   - Clicks "Extract Memories"

### Extraction Process

1. MemoryExtractionJob processes conversation
2. LLM analyzes messages
3. Extracts:
   - Facts (FACTUAL)
   - Preferences (PREFERENCE)
   - Episodic memories (EPISODIC)
   - Relationships (RELATIONSHIP)
4. Saves Memory records with:
   - Extracted content
   - Confidence score
   - Source message reference

### Memory Consolidation

1. Background job runs periodically
2. Merges similar memories
3. Updates importance scores
4. Archives low-value memories

---

## Additional Flows

### Notebook Management
1. Create notebook with name/icon/color
2. Add ACUs via drag-drop or menu
3. Reorder entries
4. Share notebook as collection

### Provider Connection (BYOK)
1. Navigate to Settings > Providers
2. Add API key for supported provider
3. Key stored (encrypted at rest - implementation varies)
4. Use in chat without importing

### P2P Sync (Future)
1. User enables P2P in settings
2. Device registers with Network Engine
3. CRDT sync begins
4. Offline changes queue and sync when online
