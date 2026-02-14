# VIVIM Feature Bridge Build Document

> **Version:** 1.0  
> **Date:** February 9, 2026  
> **Purpose:** Detailed implementation guide for all VIVIM v1 features  
> **Target:** Working Prototype in 4 Weeks

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Rebranding Tasks](#2-rebranding-tasks)
3. [Capture System Tasks](#3-capture-system-tasks)
4. [BYOK AI Chat Tasks](#4-byok-ai-chat-tasks)
5. [Social Features Tasks](#5-social-features-tasks)
6. [Vault Organization Tasks](#6-vault-organization-tasks)
7. [Search Tasks](#7-search-tasks)
8. [Identity Tasks](#8-identity-tasks)
9. [Testing Tasks](#9-testing-tasks)
10. [Deployment Tasks](#10-deployment-tasks)

---

## 1. Executive Summary

### Current State Assessment

| System | Completeness | VIVIM Target |
|--------|--------------|--------------|
| Capture (8 providers) | 90% | 100% |
| ACU System | 85% | 100% |
| Identity | 80% | 100% |
| Local-First Storage | 95% | 100% |
| **BYOK Chat** | **0%** | **100%** |
| **Social/Feed** | **25%** | **100%** |
| **Vault UI** | **10%** | **100%** |
| **Search** | **30%** | **100%** |

### Overall Progress: ~55%

### Effort Distribution

```
Week 1: Foundation (25% effort)
├── Rebranding: 10%
├── Mistral Provider: 5%
└── BYOK Design: 10%

Week 2: BYOK Core (30% effort)
├── API Key Management: 10%
├── Chat Interface: 15%
└── Provider Integration: 5%

Week 3: Social (25% effort)
├── Following System: 8%
├── Likes/Saves: 7%
└── Fork: 10%

Week 4: Polish (20% effort)
├── Vault Organization: 8%
├── Search: 7%
└── Testing: 5%
```

---

## 2. Rebranding Tasks

### 2.1 Text Changes

#### 2.1.1 PWA Index
```bash
File: apps/pwa/index.html

Task ID: REBRAND-001
Priority: P0
Hours: 0.5

Changes:
- [x] <title> -> "VIVIM - Own Your AI"
- [x] <meta name="description"> -> "Capture, own, and evolve your AI conversations"
- [ ] Add Open Graph meta tags
- [ ] Add Twitter card meta tags

Verification:
curl http://localhost:5173 | grep -i title
```

#### 2.1.2 PWA Package.json
```bash
File: apps/pwa/package.json

Task ID: REBRAND-002
Priority: P0
Hours: 0.25

Changes:
- [x] name: "vivim-pwa"
- [x] description: "VIVIM PWA - Own Your AI"
- [ ] Update repository URL if needed
- [ ] Update author if needed

Verification:
cat apps/pwa/package.json | jq '.name, .description'
```

#### 2.1.3 Server Package.json
```bash
File: apps/server/package.json

Task ID: REBRAND-003
Priority: P0
Hours: 0.25

Changes:
- [x] name: "vivim-server"
- [x] description: "VIVIM API - Own Your AI Capture Platform"
- [ ] Update keywords
- [ ] Update author if needed

Verification:
cat apps/server/package.json | jq '.name, .description'
```

#### 2.1.4 Homepage
```bash
File: apps/pwa/src/pages/HomeNew.tsx

Task ID: REBRAND-004
Priority: P0
Hours: 0.25

Changes:
- [x] <h1>OpenScroll</h1> -> <h1>VIVIM</h1>
- [ ] Update page title document.title
- [ ] Update any footer text

Verification:
grep -n "OpenScroll" apps/pwa/src/pages/HomeNew.tsx
```

#### 2.1.5 Server Startup
```bash
File: apps/server/src/server.js

Task ID: REBRAND-005
Priority: P0
Hours: 0.25

Changes:
- [x] Console banner: "OPENSCROLL SERVER" -> "VIVIM SERVER"
- [x] Capabilities text
- [ ] Any error messages

Verification:
bun run dev | grep -i vivim
```

#### 2.1.6 Identity Service
```bash
File: apps/pwa/src/lib/identity/identity-service.ts

Task ID: REBRAND-006
Priority: P0
Hours: 0.5

Changes:
- [x] IDENTITY_STORAGE_KEY: 'openscroll_identity_state' -> 'vivim_identity_state'
- [x] DEVICE_ID_KEY: 'openscroll_device_id' -> 'vivim_device_id'
- [ ] IndexedDB name in openSecureDB()

Verification:
grep -n "openscroll\|vivim" apps/pwa/src/lib/identity/identity-service.ts
```

### 2.2 Visual Assets

#### 2.2.1 Logo Creation
```bash
Task ID: REBRAND-007
Priority: P0
Hours: 8

Deliverables:
- [ ] Primary logo (SVG, dark/light)
- [ ] Favicon (32x32)
- [ ] PWA icons (192x192, 512x512)
- [ ] App store screenshots

Files:
- apps/pwa/public/icon.svg
- apps/pwa/public/vite.svg (replace)
- apps/pwa/public/pwa-192x192.svg
- apps/pwa/public/pwa-512x512.svg

Reference:
- Brand: "VIVIM - Own Your AI"
- Motif: Crystal ball / portal
- Colors: Purple (#7c3aed), Indigo (#6366f1)
```

#### 2.2.2 CSS Theme
```bash
File: apps/pwa/src/index.css

Task ID: REBRAND-008
Priority: P0
Hours: 2

Changes:
- [ ] Define VIVIM CSS variables
- [ ] Update Tailwind config
- [ ] Add brand colors
- [ ] Style brand elements

Template:
```css
@theme {
  --color-vivim-primary: #7c3aed;
  --color-vivim-secondary: #6366f1;
  --color-vivim-accent: #f59e0b;
  --color-vivim-bg: #0f172a;
  --color-vivim-text: #f8fafc;
}
```
```

### 2.3 Documentation Updates

#### 2.3.1 Root README
```bash
File: README.md

Task ID: REBRAND-009
Priority: P1
Hours: 2

Changes:
- [ ] Rewrite as VIVIM README
- [ ] Add VIVIM badges
- [ ] Update installation instructions
- [ ] Add feature overview

Template Location:
apps/VIVIM.docs/IMPLEMENTATION_ROADMAP.md
```

---

## 3. Capture System Tasks

### 3.1 Mistral Provider

#### 3.1.1 Create Extractor
```bash
File: apps/server/src/extractors/extractor-mistral.js

Task ID: CAPTURE-001
Priority: P0
Hours: 4

Reference: extractor-chatgpt.js

Steps:
1. [ ] Copy extractor-chatgpt.js -> extractor-mistral.js
2. [ ] Update provider detection regex
3. [ ] Update URL patterns
4. [ ] Adapt DOM selectors for mistral.ai
5. [ ] Handle mistral.ai authentication flow
6. [ ] Test extraction with real conversation

Key Selectors to Find:
- Conversation title
- Message list container
- User/Assistant message blocks
- Code blocks
- Timestamps

Code Template:
```javascript
export async function extractMistral(shareUrl, browser) {
  // Navigate to mistral.ai
  const page = await browser.newPage();
  await page.goto(shareUrl);
  
  // Wait for content
  await page.waitForSelector('[data-testid="conversation"]');
  
  // Extract messages
  const messages = await page.evaluate(() => {
    // Mistral-specific extraction logic
  });
  
  return processMessages(messages);
}
```
```

#### 3.1.2 Update Router
```bash
File: apps/server/src/routes/capture.js

Task ID: CAPTURE-002
Priority: P0
Hours: 0.5

Changes:
- [ ] Add Mistral to provider detection
- [ ] Route to correct extractor

Code:
```javascript
const PROVIDER_DETECTION = {
  'chatgpt.com': 'chatgpt',
  'claude.ai': 'claude',
  'gemini.google.com': 'gemini',
  'grok.com': 'grok',
  'deepseek.com': 'deepseek',
  'kimi.ai': 'kimi',
  'qwen.ai': 'qwen',
  'z.ai': 'zai',
  'mistral.ai': 'mistral',  // ADD THIS
  'mistral.chat': 'mistral', // ADD THIS
};
```
```

#### 3.1.3 Test Coverage
```bash
Task ID: CAPTURE-003
Priority: P0
Hours: 2

Files:
- apps/server/tests/extractors/mistral.test.js

Tests:
- [ ] Valid mistral.ai URL
- [ ] Valid mistral.chat URL
- [ ] Invalid URL
- [ ] Network error
- [ ] Auth required error
- [ ] Empty conversation

Coverage Target: 80%
```

---

## 4. BYOK AI Chat Tasks

### 4.1 Architecture Design

#### 4.1.1 System Architecture
```bash
Task ID: BYOK-001
Priority: P0
Hours: 4

Document: apps/VIVIM.docs/BYOK_ARCHITECTURE.md

Design Decisions:
1. [ ] Key Storage Strategy
2. [ ] Provider Abstraction
3. [ ] Streaming Response Pattern
4. [ ] Cost Tracking Model
5. [ ] Security Model

Architecture Diagram:
```
+--------------------------------------------------+
| VIVIM PWA                                       |
+--------------------------------------------------+
|  API Key Manager  |  Chat Interface  |  Settings  |
+---------+-----------+---------+-----------+-----------+
          |                   |
+---------v-------------------v-----------+
| BYOK Client Library                  |
| (encrypts keys, manages providers)   |
+---------+-----------------------------+
          |
+---------v-----------------------------+
| VIVIM API Server                      |
+----------------------------------------+
| /api/v1/byok/chat (SSE)               |
| /api/v1/byok/providers                 |
| /api/v1/byok/usage                     |
+---------+-----------------------------+
          |
+---------v-----------------------------+
| External AI Providers (OpenAI, etc)    |
+----------------------------------------+
```

#### 4.1.2 Key Storage Design
```typescript
// apps/pwa/src/lib/byok/types.ts

interface StoredKey {
  provider: 'openai' | 'anthropic' | 'google' | 'xai' | 'mistral';
  encryptedKey: string;  // AES-256-GCM encrypted
  keyPrefix: string;    // First 4 chars for display
  createdAt: Date;
  lastUsed: Date;
  isValid: boolean;
}

interface UsageStats {
  provider: string;
  totalTokens: number;
  totalCost: number;
  dailyUsage: Map<Date, number>;
  monthlyLimit?: number;
}
```

### 4.2 API Key Management

#### 4.2.1 Backend Key Validation
```bash
File: apps/server/src/routes/byok.js

Task ID: BYOK-002
Priority: P0
Hours: 3

Endpoints:
- POST /api/v1/byok/validate
- POST /api/v1/byok/keys (encrypted storage)

Code:
```javascript
// POST /api/v1/byok/validate
router.post('/validate', async (req, res) => {
  const { provider, apiKey } = req.body;
  
  try {
    // Validate without storing
    const isValid = await validateAPIKey(provider, apiKey);
    
    res.json({
      valid: isValid,
      provider,
      // Don't return any key info
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
```

#### 4.2.2 Frontend Key Manager
```bash
File: apps/pwa/src/lib/byok/api-key-manager.ts

Task ID: BYOK-003
Priority: P0
Hours: 6

Methods:
- [ ] addKey(provider, apiKey)
- [ ] removeKey(provider)
- [ ] getKeys() -> encrypted
- [ ] getKey(provider) -> decrypted (for chat)
- [ ] isKeyValid(provider)
- [ ] getAllProviders()
- [ ] getUsageStats(provider)

Encryption:
```typescript
async function encryptKey(key: string, masterKey: string): Promise<string> {
  // Use Web Crypto API
  // AES-256-GCM
  // Key derived from masterKey using PBKDF2
}

async function decryptKey(encrypted: string, masterKey: string): Promise<string> {
  // Reverse encryption
}
```
```

#### 4.2.3 Provider Configurations
```bash
File: apps/pwa/src/lib/byok/provider-config.ts

Task ID: BYOK-004
Priority: P0
Hours: 2

Providers:
```typescript
const PROVIDER_CONFIGS = {
  openai: {
    name: 'OpenAI',
    models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'],
    baseUrl: 'https://api.openai.com/v1',
    pricing: { input: 0.000005, output: 0.000015 }, // per token
    keyFormat: 'sk-...',
    docsUrl: 'https://platform.openai.com/api-keys',
  },
  anthropic: {
    name: 'Anthropic Claude',
    models: ['claude-sonnet-4-20250514', 'claude-opus-4', 'claude-haiku-3'],
    baseUrl: 'https://api.anthropic.com/v1',
    pricing: { input: 0.000003, output: 0.000015 },
    keyFormat: 'sk-ant-api03-...',
    docsUrl: 'https://console.anthropic.com/settings/keys',
  },
  google: {
    name: 'Google Gemini',
    models: ['gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-1.0-pro'],
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    pricing: { input: 0.00000125, output: 0.00000375 },
    keyFormat: 'AIza...',
    docsUrl: 'https://aistudio.google.com/app/apikey',
  },
  xai: {
    name: 'xAI Grok',
    models: ['grok-2', 'grok-2-vision-1212'],
    baseUrl: 'https://api.x.ai/v1',
    pricing: { input: 0.000002, output: 0.000010 },
    keyFormat: 'xai-...',
    docsUrl: 'https://console.x.ai/',
  },
  mistral: {
    name: 'Mistral AI',
    models: ['mistral-large-2411', 'mistral-small-2501', 'open-mistral-7b'],
    baseUrl: 'https://api.mistral.ai/v1',
    pricing: { input: 0.000001, output: 0.000003 },
    keyFormat: 'eyJhbGci...',
    docsUrl: 'https://console.mistral.ai/api-keys',
  },
};
```
```

#### 4.2.4 Key Settings UI
```bash
File: apps/pwa/src/pages/APIKeySettings.tsx

Task ID: BYOK-005
Priority: P0
Hours: 8

Components:
- [ ] Provider selector dropdown
- [ ] API key input with visibility toggle
- [ ] Validation button
- [ ] Success/error feedback
- [ ] Key list with delete buttons
- [ ] Usage stats display

Mockup:
```tsx
<Page title="API Keys">
  <Section title="Add API Key">
    <Select
      label="Provider"
      options={PROVIDER_CONFIGS.map(p => ({ value: p.id, label: p.name }))}
      value={selectedProvider}
      onChange={setSelectedProvider}
    />
    
    <Input
      label="API Key"
      type={showKey ? 'text' : 'password'}
      value={apiKey}
      onChange={setApiKey}
      placeholder={getKeyPlaceholder(selectedProvider)}
      helpText={getHelpText(selectedProvider)}
    />
    
    <Button onClick={validateAndSave} loading={validating}>
      Validate & Save
    </Button>
  </Section>
  
  <Section title="Your Keys">
    {keys.map(key => (
      <KeyCard
        provider={key.provider}
        prefix={key.keyPrefix}
        created={key.createdAt}
        onDelete={() => removeKey(key.provider)}
      />
    ))}
  </Section>
</Page>
```
```

### 4.3 Chat Interface

#### 4.3.1 Backend Chat Endpoint
```bash
File: apps/server/src/routes/byok.js

Task ID: BYOK-006
Priority: P0
Hours: 8

Endpoint: POST /api/v1/byok/chat

Flow:
1. Receive conversationId + message + provider + model
2. Load conversation from DB
3. Extract messages as context
4. Call external AI API with streaming
5. Stream response back to client
6. Save new message to conversation

Code:
```javascript
router.post('/chat', async (req, res) => {
  const { conversationId, message, provider, model, settings } = req.body;
  
  // Load conversation
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: { messages: { orderBy: { messageIndex: 'asc' } } },
  });
  
  // Build context from messages
  const contextMessages = buildContext(conversation.messages);
  
  // Create SSE stream
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  
  // Call provider
  const stream = await callProvider({
    provider,
    model,
    messages: [...contextMessages, { role: 'user', content: message }],
    settings,
  });
  
  // Stream response
  for await (const chunk of stream) {
    res.write(`data: ${JSON.stringify(chunk)}\n\n`);
  }
  
  res.end();
});
```

#### 4.3.2 Frontend Chat Page
```bash
File: apps/pwa/src/pages/BYOKChat.tsx

Task ID: BYOK-007
Priority: P0
Hours: 12

Features:
- [ ] Conversation header with model selector
- [ ] Message list (scrollable)
- [ ] Input area with text field
- [ ] Send button
- [ ] Streaming indicator
- [ ] Token usage display
- [ ] Settings panel (temperature, max tokens)

State:
```typescript
interface BYOKChatState {
  conversationId: string | null;
  messages: Message[];
  isStreaming: boolean;
  selectedProvider: string;
  selectedModel: string;
  temperature: number;
  maxTokens: number;
  usage: { promptTokens: number; completionTokens: number; cost: number };
}
```

#### 4.3.3 Streaming Client
```bash
File: apps/pwa/src/lib/byok/streaming-client.ts

Task ID: BYOK-008
Priority: P0
Hours: 4

Implementation:
```typescript
async function* streamChat(
  endpoint: string,
  body: object,
  abortSignal: AbortSignal
): AsyncGenerator<ChatChunk> {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: abortSignal,
  });
  
  const reader = response.body?.getReader();
  const decoder = new TextDecoder();
  
  while (reader) {
    const { done, value } = await reader.read();
    if (done) break;
    
    const chunk = decoder.decode(value);
    const lines = chunk.split('\n\n');
    
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        yield JSON.parse(line.slice(6));
      }
    }
  }
}
```

#### 4.3.4 Cost Tracking
```bash
File: apps/pwa/src/lib/byok/usage-tracker.ts

Task ID: BYOK-009
Priority: P1
Hours: 3

Features:
- [ ] Track tokens per request
- [ ] Calculate cost per provider
- [ ] Daily/monthly limits
- [ ] Visual display of usage
- [ ] Warning thresholds

Code:
```typescript
class UsageTracker {
  async track(provider: string, usage: UsageResponse) {
    const stats = await this.getStats(provider);
    stats.totalTokens += usage.promptTokens + usage.completionTokens;
    stats.totalCost += calculateCost(provider, usage);
    stats.dailyUsage.set(today(), stats.dailyUsage.get(today(), 0) + usage.cost);
    await this.saveStats(provider, stats);
  }
  
  async getWarning(provider: string): string | null {
    const stats = await this.getStats(provider);
    const percentage = stats.monthlyLimit 
      ? (stats.totalCost / stats.monthlyLimit) * 100 
      : 0;
    
    if (percentage >= 90) return 'Approaching monthly limit!';
    if (percentage >= 100) return 'Monthly limit reached';
    return null;
  }
}
```

### 4.4 BYOK Integration Testing

```bash
Task ID: BYOK-010
Priority: P0
Hours: 8

Files:
- apps/server/tests/byok/chat.test.js
- apps/pwa/src/lib/byok/__tests__/

Tests:
- [ ] OpenAI key validation
- [ ] Anthropic key validation
- [ ] Chat with context
- [ ] Streaming response
- [ ] Cost calculation
- [ ] Error handling (invalid key, rate limit)
- [ ] Abort streaming

E2E Test:
```javascript
test('User can continue conversation with BYOK', async () => {
  // 1. Add OpenAI API key
  await addAPIKey('openai', 'sk-test-key');
  
  // 2. Capture conversation
  const conversation = await captureConversation(chatgptUrl);
  
  // 3. Continue with BYOK
  const response = await continueWithBYOK(conversation.id, 'Explain this more');
  
  // 4. Verify streaming response
  expect(response).toContainStreamingContent();
});
```
```

---

## 5. Social Features Tasks

### 5.1 Database Schema Additions

```bash
File: apps/server/prisma/schema.prisma

Task ID: SOCIAL-001
Priority: P0
Hours: 2

Add models:
```prisma
model UserFollow {
  id          String   @id @default(uuid())
  followerId  String   // User.did
  followingId String   // User.did
  createdAt   DateTime @default(now())

  @@unique([followerId, followingId])
  @@index([followerId])
  @@index([followingId])
}

model Like {
  id            String   @id @default(uuid())
  userId        String   // User.did
  acuId         String   // AtomicChatUnit.id
  createdAt     DateTime @default(now())

  @@unique([userId, acuId])
  @@index([acuId])
}

model Bookmark {
  id            String   @id @default(uuid())
  userId        String   // User.did
  conversationId String
  folderId      String?  // Optional organization
  createdAt     DateTime @default(now())

  @@index([userId])
  @@index([conversationId])
}

model UserProfile {
  userId      String   @id // User.did
  displayName String?
  bio         String?
  avatarUrl   String?
  website     String?
  twitter     String?
  github      String?
  
  @@map("user_profiles")
}

model Fork {
  id              String   @id @default(uuid())
  originalId      String   // Original conversation ID
  forkedId        String   // New conversation ID
  forkedBy        String   // User.did
  createdAt       DateTime @default(now())

  @@index([originalId])
  @@index([forkedId])
  @@index([forkedBy])
}
```

### 5.2 Backend Routes

#### 5.2.1 Following System
```bash
File: apps/server/src/routes/social.js

Task ID: SOCIAL-002
Priority: P0
Hours: 4

Endpoints:
- GET /api/v1/social/followers/:did
- GET /api/v1/social/following/:did
- POST /api/v1/social/follow/:did
- DELETE /api/v1/social/unfollow/:did

Code:
```javascript
router.post('/follow/:did', requireAuth, async (req, res) => {
  const { did } = req.params;
  const followerDid = req.user.did;
  
  if (followerDid === did) {
    return res.status(400).json({ error: 'Cannot follow yourself' });
  }
  
  const follow = await prisma.userFollow.create({
    data: { followerId: followerDid, followingId: did },
  });
  
  // Create notification
  await createNotification(did, {
    type: 'follow',
    actorDid: followerDid,
  });
  
  res.json(follow);
});
```
```

#### 5.2.2 Likes
```bash
Task ID: SOCIAL-003
Priority: P0
Hours: 2

Endpoints:
- POST /api/v1/social/like/:acuId
- DELETE /api/v1/social/like/:acuId
- GET /api/v1/social/likes/:acuId

Logic:
- Toggle like on/off
- Update ACU.likeCount
- Prevent duplicate likes
```

#### 5.2.3 Bookmarks
```bash
Task ID: SOCIAL-004
Priority: P0
Hours: 3

Endpoints:
- POST /api/v1/social/bookmark/:conversationId
- DELETE /api/v1/social/bookmark/:conversationId
- GET /api/v1/social/bookmarks
- POST /api/v1/social/bookmarks/:id/move

Features:
- Folder organization for bookmarks
- Sync across devices
```

#### 5.2.4 Fork
```bash
Task ID: SOCIAL-005
Priority: P0
Hours: 6

Endpoint: POST /api/v1/conversations/:id/fork

Code:
```javascript
router.post('/:id/fork', requireAuth, async (req, res) => {
  const { id } = req.params;
  const forkedBy = req.user.did;
  
  // Load original
  const original = await prisma.conversation.findUnique({
    where: { id },
    include: { messages: true },
  });
  
  if (!original) {
    return res.status(404).json({ error: 'Conversation not found' });
  }
  
  // Create fork
  const forked = await prisma.conversation.create({
    data: {
      provider: original.provider,
      sourceUrl: original.sourceUrl,
      title: original.title,
      model: original.model,
      ownerId: forkedBy,
      metadata: {
        ...original.metadata,
        forkedFrom: id,
        forkedAt: new Date().toISOString(),
      },
      messages: {
        create: original.messages.map(m => ({
          role: m.role,
          author: m.author,
          parts: m.parts,
          createdAt: m.createdAt,
          messageIndex: m.messageIndex,
          metadata: m.metadata,
        })),
      },
    },
  });
  
  // Record fork
  await prisma.fork.create({
    data: {
      originalId: id,
      forkedId: forked.id,
      forkedBy,
    },
  });
  
  res.json(fork);
});
```
```

### 5.3 Frontend Components

#### 5.3.1 Like Button
```bash
File: apps/pwa/src/components/LikeButton.tsx

Task ID: SOCIAL-006
Priority: P1
Hours: 2

Props:
- acuId: string
- initialLiked: boolean
- initialCount: number

State:
- liked: boolean
- count: number

Actions:
- onClick: toggle like, update count
- Optimistic UI update
```
```tsx
<Button
  variant={liked ? 'primary' : 'ghost'}
  onClick={toggleLike}
  icon={<Heart className={liked ? 'filled' : 'outline'} />}
>
  {count}
</Button>
```

#### 5.3.2 Fork Button
```bash
File: apps/pwa/src/components/ForkButton.tsx

Task ID: SOCIAL-007
Priority: P1
Hours: 3

Features:
- [ ] Click to fork
- [ ] Loading state
- [ ] Success feedback
- [ ] Navigate to new fork

Code:
```tsx
<ForkButton
  conversationId={id}
  onFork={(newId) => navigate(`/conversation/${newId}`)}
  label="Fork"
  showAttribution={true}
/>
```

#### 5.3.3 Share Menu
```bash
File: apps/pwa/src/components/ShareMenu.tsx

Task ID: SOCIAL-008
Priority: P1
Hours: 4

Options:
- [ ] Copy link
- [ ] Share to VIVIM feed
- [ ] Twitter
- [ ] LinkedIn
- [ ] Email

Implementation:
```tsx
<ShareMenu
  conversationId={id}
  onCopyLink={() => copyToClipboard(link)}
  onShareToFeed={() => shareToFeed(id)}
  onExternalShare={(platform) => shareToExternal(platform, id)}
/>
```

#### 5.3.4 Follow Button
```bash
File: apps/pwa/src/components/FollowButton.tsx

Task ID: SOCIAL-009
Priority: P1
Hours: 2

Props:
- userDid: string
- initialFollowing: boolean
- showLabel: boolean

Actions:
- [ ] Follow/unfollow user
- [ ] Update button state
- [ ] Show follower count tooltip
```

#### 5.3.5 Profile Page
```bash
File: apps/pwa/src/pages/Profile.tsx

Task ID: SOCIAL-010
Priority: P1
Hours: 6

Sections:
- [ ] Profile header (avatar, name, bio)
- [ ] Stats (captures, followers, following)
- [ ] Recent captures grid
- [ ] Edit profile button (if own profile)

API:
- GET /api/v1/social/profile/:did
- PUT /api/v1/social/profile
```

---

## 6. Vault Organization Tasks

### 6.1 Collections

#### 6.1.1 Database
```bash
File: apps/server/prisma/schema.prisma

Task ID: VAULT-001
Priority: P1
Hours: 2

Add models:
```prisma
model Collection {
  id          String   @id @default(uuid())
  userId      String   // User.did
  name        String
  description String?
  color       String?  // Hex color for UI
  icon        String?  // Emoji or icon name
  parentId    String?  // Nested collections
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([userId])
}

model CollectionItem {
  id            String     @id @default(uuid())
  collectionId  String
  itemType      String     // 'conversation' | 'acu'
  itemId        String
  addedAt       DateTime   @default(now())

  @@unique([collectionId, itemType, itemId])
  @@index([itemId])
}
```
```

#### 6.1.2 API
```bash
Task ID: VAULT-002
Priority: P1
Hours: 4

Endpoints:
- GET /api/v1/collections
- POST /api/v1/collections
- PUT /api/v1/collections/:id
- DELETE /api/v1/collections/:id
- POST /api/v1/collections/:id/items
- DELETE /api/v1/collections/:id/items
```

#### 6.1.3 UI
```bash
File: apps/pwa/src/pages/Collections.tsx

Task ID: VAULT-003
Priority: P1
Hours: 8

Features:
- [ ] Collection list sidebar
- [ ] Create collection modal
- [ ] Edit collection (name, color, icon)
- [ ] Add to collection (from conversation view)
- [ ] Remove from collection
- [ ] Nested collections
- [ ] Drag and drop (future)
```

### 6.2 Tags

#### 6.2.1 Database
```bash
File: apps/server/prisma/schema.prisma

Task ID: VAULT-004
Priority: P1
Hours: 2

Add models:
```prisma
model Tag {
  id        String   @id @default(uuid())
  name      String   @unique
  color     String?  // Auto-assigned or user-set
  createdAt DateTime @default(now())

  @@map("tags")
}

model ConversationTag {
  conversationId String
  tagId          String
  createdAt      DateTime @default(now())

  @@unique([conversationId, tagId])
  @@index([tagId])
}

model ACUTag {
  acuId     String
  tagId     String
  createdAt DateTime @default(now())

  @@unique([acuId, tagId])
  @@index([tagId])
}
```
```

#### 6.2.2 API
```bash
Task ID: VAULT-005
Priority: P1
Hours: 3

Endpoints:
- GET /api/v1/tags
- POST /api/v1/tags
- PUT /api/v1/tags/:id
- DELETE /api/v1/tags/:id
- POST /api/v1/conversations/:id/tags
- DELETE /api/v1/conversations/:id/tags/:tagId
```

#### 6.2.3 UI
```bash
File: apps/pwa/src/components/TagEditor.tsx

Task ID: VAULT-006
Priority: P1
Hours: 6

Features:
- [ ] Tag input with autocomplete
- [ ] Existing tags display
- [ ] Tag colors
- [ ] Popular tags suggestions
- [ ] Remove tag
- [ ] Filter by tag
```

### 6.3 Vault Page

```bash
File: apps/pwa/src/pages/Vault.tsx

Task ID: VAULT-007
Priority: P1
Hours: 8

Layout:
- [ ] Sidebar (collections, tags, filters)
- [ ] Main content (conversation cards)
- [ ] Search bar
- [ ] Sort dropdown
- [ ] View toggle (grid/list)

Filters:
- [ ] By collection
- [ ] By tag
- [ ] By provider
- [ ] By date
- [ ] By quality score

Sort:
- [ ] Date (newest/oldest)
- [ ] Quality
- [ ] Alphabetical
- [ ] Popularity
```

---

## 7. Search Tasks

### 7.1 Semantic Search

#### 7.1.1 Embedding Service
```bash
File: apps/server/src/services/embedding.js

Task ID: SEARCH-001
Priority: P2
Hours: 8

Options:
- OpenAI embeddings ($0.0001/1K tokens)
- HuggingFace inference API (free tier)
- Local sentence-transformers

Implementation:
```javascript
class EmbeddingService {
  async generate(text) {
    // Chunk text if too long
    const chunks = this.chunk(text, 512);
    const embeddings = await Promise.all(
      chunks.map(chunk => this.callAPI(chunk))
    );
    return this.average(embeddings);
  }
  
  async search(query, limit = 10) {
    const queryEmbedding = await this.generate(query);
    
    // pgvector similarity search
    const results = await prisma.$queryRaw`
      SELECT id, content, embedding,
      1 - (embedding <=> ${queryEmbedding}) as similarity
      FROM atomic_chat_units
      WHERE embedding IS NOT NULL
      ORDER BY embedding <=> ${queryEmbedding}
      LIMIT ${limit}
    `;
    
    return results;
  }
}
```

#### 7.1.2 Generate Embeddings
```bash
Task ID: SEARCH-002
Priority: P2
Hours: 4

Script:
- [ ] Create migration to add embedding column
- [ ] Script to generate embeddings for existing ACUs
- [ ] Trigger embedding generation on new ACU creation

Usage:
```bash
# Generate embeddings for all ACUs
node scripts/generate-embeddings.js --all

# Generate for new ACUs only
node scripts/generate-embeddings.js --new
```
```

### 7.2 Search UI

#### 7.2.1 Search Page
```bash
File: apps/pwa/src/pages/Search.tsx

Task ID: SEARCH-003
Priority: P1
Hours: 6

Features:
- [ ] Search input with debounce
- [ ] Results count
- [ ] Filter panel (provider, date, type, quality)
- [ ] Results list with highlighting
- [ ] Tabs (All, Conversations, ACUs)
- [ ] Search suggestions
- [ ] Recent searches

Mockup:
```
┌────────────────────────────────────────────┐
│ 🔍 Search...                          [✕] │
├────────────────────────────────────────────┤
│ Filters                    [Clear filters] │
│ ─────────                                          │
│ Provider: [✓] All                          │
│         [✓] ChatGPT                         │
│         [✓] Claude                          │
│         [✓] Gemini                          │
│                                               │
│ Date:    [All time ▼]                       │
│                                               │
│ Quality: [All ▼]                            │
├────────────────────────────────────────────┤
│ Results: 42 matches                        │
│ ─────────────────────────────────────────  │
│ 📄 "Rust ownership explained"              │
│    ChatGPT • 2 hours ago • 95 quality     │
│    Matched: "ownership ensures memory..."  │
│                                               │
│ 📄 "Understanding lifetimes in Rust"        │
│    Claude • 5 hours ago • 88 quality       │
│    Matched: "lifetimes are a type of..."  │
│                                               │
└────────────────────────────────────────────┘
```
```

#### 7.2.2 Global Search
```bash
Task ID: SEARCH-004
Priority: P2
Hours: 2

Implement:
- [ ] Command palette (Cmd+K)
- [ ] Quick search from anywhere
- [ ] Keyboard navigation

Code:
```typescript
function CommandPalette() {
  const [query, setQuery] = useState('');
  const results = useDebouncedSearch(query, 300);
  
  return (
    <Dialog open={isOpen} onClose={close}>
      <Input
        value={query}
        onChange={setQuery}
        placeholder="Search conversations, ACUs..."
        autoFocus
      />
      <ResultsList results={results} />
    </Dialog>
  );
}
```

---

## 8. Identity Tasks

### 8.1 Social Auth

```bash
File: apps/server/src/routes/auth.js

Task ID: IDENTITY-001
Priority: P2
Hours: 12

Implement:
- [ ] Google OAuth2
- [ ] Apple Sign-In
- [ ] GitHub OAuth

Flow:
1. User clicks "Continue with Google"
2. Redirect to OAuth provider
3. Callback with authorization code
4. Exchange code for tokens
5. Get/-create user
6. Create session
7. Return JWT

Code:
```javascript
router.get('/google', passport.authenticate('google', {
  scope: ['profile', 'email'],
}));

router.get('/google/callback', async (req, res) => {
  const { code } = req.query;
  const tokens = await exchangeCode(code);
  const profile = await getProfile(tokens.access_token);
  
  let user = await findUserByEmail(profile.email);
  if (!user) {
    user = await createUser({
      email: profile.email,
      displayName: profile.name,
      avatarUrl: profile.picture,
    });
  }
  
  const session = await createSession(user);
  res.redirect(`/auth/success?token=${session.token}`);
});
```

### 8.2 Session Management

```bash
Task ID: IDENTITY-002
Priority: P1
Hours: 4

Endpoints:
- GET /api/v1/auth/sessions
- DELETE /api/v1/auth/sessions/:id
- DELETE /api/v1/auth/sessions (logout all)

Features:
- [ ] List active sessions
- [ ] Revoke individual session
- [ ] Revoke all other sessions
- [ ] Show session info (device, location, last active)

UI:
```tsx
<SessionList sessions={sessions}>
  <SessionItem session={session}>
    <DeviceIcon platform={session.platform} />
    <SessionInfo
      browser={session.browser}
      location={session.location}
      lastActive={session.lastActive}
    />
    <Button
      variant="danger"
      onClick={() => revoke(session.id)}
    >
      Revoke
    </Button>
  </SessionItem>
</SessionList>
```

---

## 9. Testing Tasks

### 9.1 Test Strategy

```bash
Task ID: TEST-001
Priority: P0
Hours: 4

Test Pyramid:

Unit Tests (70%)
├── BYOK key management
├── API validation
├── Search algorithms
└── Utilities

Integration Tests (20%)
├── Capture flow
├── BYOK chat flow
├── Social features
└── Vault operations

E2E Tests (10%)
├── User signup → capture → share
├── BYOK chat workflow
└── Mobile PWA flow
```

### 9.2 Test Files

```bash
# BYOK Tests
apps/server/tests/byok/chat.test.js
apps/server/tests/byok/keys.test.js
apps/pwa/src/lib/byok/__tests__/api-key-manager.test.ts

# Social Tests
apps/server/tests/social/follow.test.js
apps/server/tests/social/like.test.js
apps/server/tests/social/fork.test.js

# Vault Tests
apps/server/tests/vault/collections.test.js
apps/server/tests/vault/tags.test.js

# Search Tests
apps/server/tests/search/semantic.test.js
apps/server/tests/search/fulltext.test.js
```

### 9.3 CI/CD Pipeline

```yaml
# .github/workflows/test.yml

name: Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v1
      - run: bun install
      - run: bun test
      - run: bun run coverage
      
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v1
      - run: bun install
      - run: bun run build
      - run: bun run test:e2e
```

---

## 10. Deployment Tasks

### 10.1 Environment Configuration

```bash
Task ID: DEPLOY-001
Priority: P0
Hours: 2

Files:
apps/server/.env.production

Required:
DATABASE_URL=postgresql://...
JWT_SECRET=your-jwt-secret
OPENAI_API_KEY= # NOT USED - users bring own keys
ANTHROPIC_API_KEY= # NOT USED
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
SESSION_SECRET=
REDIS_URL=
```

### 10.2 Docker Setup

```bash
Task ID: DEPLOY-002
Priority: P1
Hours: 4

Files:
apps/server/Dockerfile.production
docker-compose.prod.yml

Compose:
services:
  api:
    build: ./apps/server
    ports: ["3000:3000"]
    environment:
      - DATABASE_URL
      - JWT_SECRET
      - REDIS_URL
    depends_on:
      - postgres
      - redis
    restart: unless-stopped
    
  postgres:
    image: postgres:15
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      - POSTGRES_DB=vivim
      - POSTGRES_USER=...
      - POSTGRES_PASSWORD=
    restart: unless-stopped
    
  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
```

### 10.3 PWA Deployment

```bash
Task ID: DEPLOY-003
Priority: P1
Hours: 4

Options:
- Vercel (frontend)
- Netlify (frontend)
- Fly.io (full stack)

Vercel:
vercel --prod

Netlify:
netlify deploy --prod --dir=dist

Configure:
- Environment variables
- Build command: bun run build
- Output directory: dist
```

---

## Task Summary

| Category | Tasks | Total Hours |
|----------|-------|-------------|
| Rebranding | 10 | 20 |
| Capture | 3 | 8 |
| BYOK Chat | 10 | 68 |
| Social Features | 10 | 52 |
| Vault Organization | 7 | 33 |
| Search | 4 | 20 |
| Identity | 2 | 16 |
| Testing | 3 | 8 |
| Deployment | 3 | 10 |
| **Total** | **52** | **235 hours** |

### Weekly Breakdown

| Week | Focus | Hours |
|------|-------|-------|
| 1 | Foundation + BYOK Design | 50 |
| 2 | BYOK Implementation | 65 |
| 3 | Social Features | 55 |
| 4 | Vault + Search + Testing | 65 |
| **Total** | | **235** |

---

## Definition of Done

### For Each Task:
- [ ] Code written
- [ ] Tests written (80% coverage for new code)
- [ ] Code reviewed
- [ ] Deployed to staging
- [ ] Verified working
- [ ] Documentation updated

### For Sprint:
- [ ] All tasks complete
- [ ] No critical bugs
- [ ] Performance acceptable
- [ ] Security review passed

### For Prototype:
- [ ] All P0 features implemented
- [ ] Demo scenario works end-to-end
- [ ] User can sign up → capture → continue → share
- [ ] PWA installs on mobile

---

*Document Version: 1.1 (Updated: February 9, 2026)*
*Added: ACU Components, Recommendations, Success Metrics*

---

## X. ACU (Atomic Chat Units) UI Components

> **Critical:** ACU is core to VIVIM's value proposition. These tasks ensure ACUs are visible, shareable, and composable.

### X.1 ACU Viewer Components

#### X.1.1 ACU Card Component
```bash
File: apps/pwa/src/components/ACUCard.tsx

Task ID: ACU-001
Priority: P0
Hours: 8

Features:
- [ ] Display ACU content (text/code/explanation)
- [ ] ACU type badge (question/answer/code/summary)
- [ ] Quality score indicator (0-100)
- [ ] Source attribution (original conversation)
- [ ] Timestamp
- [ ] Actions: copy, share, fork, expand

Props:
```typescript
interface ACUCardProps {
  acu: ACU;
  showActions?: boolean;
  onShare?: (acu: ACU) => void;
  onFork?: (acu: ACU) => void;
  onCopy?: (acu: ACU) => void;
}
```

Code Template:
```tsx
<ACUCard
  acu={acu}
  showActions={true}
  onShare={handleShare}
  onFork={handleFork}
  onCopy={handleCopy}
/>
```
```

#### X.1.2 ACU Type Badge
```bash
File: apps/pwa/src/components/ACUTypeBadge.tsx

Task ID: ACU-002
Priority: P0
Hours: 2

ACU Types:
- [ ] question (blue)
- [ ] answer (green)
- [ ] code_snippet (purple)
- [ ] explanation (orange)
- [ ] summary (yellow)
- [ ] instruction (pink)

Design:
```tsx
<Badge type={acu.type}>
  {getACUTypeLabel(acu.type)}
</Badge>
```
```

#### X.1.3 ACU Viewer Page
```bash
File: apps/pwa/src/pages/ACUView.tsx

Task ID: ACU-003
Priority: P0
Hours: 6

Features:
- [ ] Full ACU content display
- [ ] Conversation context (parent messages)
- [ ] Related ACUs (from graph)
- [ ] ACU metadata panel
- [ ] Actions toolbar
- [ ] Sharing options

Code:
```tsx
<Page title={acu.type}>
  <ACUCard acu={acu} showActions={true} />
  
  <Section title="Context">
    <ParentMessages conversationId={acu.conversationId} />
  </Section>
  
  <Section title="Related">
    <RelatedACUs acuId={acu.id} />
  </Section>
</Page>
```
```

### X.2 ACU Sharing & Composition

#### X.2.1 Share Single ACU
```bash
File: apps/pwa/src/lib/acu/share.ts

Task ID: ACU-004
Priority: P0
Hours: 4

Features:
- [ ] Generate shareable link for ACU
- [ ] Create OG metadata for ACU
- [ ] Track ACU views
- [ ] Copy ACU content

Endpoint:
```
POST /api/v1/acus/:id/share

Response:
{
  "shareUrl": "https://vivim.app/a/acu_id",
  "shareToken": "token",
  "expiresAt": "2026-02-10T00:00:00Z"
}
```
```

#### X.2.2 Fork ACU
```bash
File: apps/pwa/src/lib/acu/fork.ts

Task ID: ACU-005
Priority: P0
Hours: 4

Features:
- [ ] Copy ACU to user's vault
- [ ] Preserve attribution (original author)
- [ ] Add to fork lineage
- [ ] Notify original author (optional)

Endpoint:
```
POST /api/v1/acus/:id/fork

Response:
{
  "forkedAcu": { ... },
  "originalAcu": { ... },
  "forkedAt": "2026-02-09T18:00:00Z"
}
```
```

#### X.2.3 Compose from ACUs
```bash
File: apps/pwa/src/pages/ComposeFromACUs.tsx

Task ID: ACU-006
Priority: P1
Hours: 8

Features:
- [ ] Select multiple ACUs from vault
- [ ] Arrange ACU order
- [ ] Add connecting text
- [ ] Create new conversation
- [ ] Preview composed conversation

UI Mockup:
```
┌────────────────────────────────────────────┐
│  Compose from ACUs                  [X]   │
├────────────────────────────────────────────┤
│  Selected (3):                               │
│  ┌────────────────────────────────────────┐ │
│  │ ✓ [Q] What's React hooks?              │ │
│  │ ✓ [A] useEffect explained             │ │
│  │ ✓ [C] useEffect code snippet          │ │
│  └────────────────────────────────────────┘ │
│                                              │
│  Your Vault:                                 │
│  [Search ACUs... ]                           │
│  ┌────────────────────────────────────────┐ │
│  │ ○ [A] When to use useMemo            │ │
│  │ ○ [Q] Difference between useState...  │ │
│  └────────────────────────────────────────┘ │
│                                              │
│  [ Cancel ]              [ Create Convo ]   │
└────────────────────────────────────────────┘
```
```

### X.3 ACU Organization

#### X.3.1 ACU Search
```bash
File: apps/pwa/src/pages/ACUSearch.tsx

Task ID: ACU-007
Priority: P0
Hours: 6

Features:
- [ ] Search across all ACUs in vault
- [ ] Filter by ACU type
- [ ] Filter by quality score
- [ ] Filter by source conversation
- [ ] Sort by date, quality, relevance

Code:
```tsx
interface ACUSearchFilters {
  types?: ACUType[];
  minQuality?: number;
  maxQuality?: number;
  sources?: string[];
  tags?: string[];
}
```

#### X.3.2 ACU Tagging
```bash
File: apps/pwa/src/components/ACUTagEditor.tsx

Task ID: ACU-008
Priority: P0
Hours: 4

Features:
- [ ] Add tags to ACU
- [ ] Remove tags from ACU
- [ ] Autocomplete tags from existing
- [ ] Show popular tags
- [ ] Filter by tag

Endpoint:
```
GET /api/v1/acus/:id/tags
POST /api/v1/acus/:id/tags
DELETE /api/v1/acus/:id/tags/:tagId
```
```

#### X.3.3 ACU Preview Modal
```bash
File: apps/pwa/src/components/ACUPreviewModal.tsx

Task ID: ACU-009
Priority: P0
Hours: 3

Features:
- [ ] Quick preview without full page
- [ ] Show first 200 chars
- [ ] ACU type badge
- [ ] Quality indicator
- [ ] Actions (share, fork, copy)
- [ ] "View full" link
```

### X.4 ACU Testing

```bash
Task ID: ACU-010
Priority: P0
Hours: 6

Files:
- apps/pwa/src/lib/acu/__tests__/acu.test.ts
- apps/server/tests/acus.test.js

Tests:
- [ ] ACU decomposition accuracy
- [ ] ACU type classification
- [ ] ACU sharing
- [ ] ACU forking
- [ ] ACU search
- [ ] ACU composition
```

---

## XI. Recommendations Engine

> **Priority:** P1 (Add post-MVP for better engagement)  
> **Note:** Can launch MVP without recommendations, add for retention

### XI.1 Interest Detection

```bash
File: apps/server/src/services/recommendations.js

Task ID: REC-001
Priority: P1
Hours: 8

Features:
- [ ] Track user captures by topic
- [ ] Track user saves/bookmarks
- [ ] Track user search queries
- [ ] Track user follows
- [ ] Build interest vector

Code:
```javascript
class InterestEngine {
  async buildUserProfile(userId) {
    const captures = await prisma.conversation.findMany({
      where: { ownerId: userId },
      include: { acus: true }
    });
    
    const interests = {
      topics: extractTopics(captures),
      providers: extractProviders(captures),
      codeLanguages: extractCodeLanguages(captures),
      tags: extractTags(captures)
    };
    
    return this.normalizeInterests(interests);
  }
}
```
```

### XI.2 Similar Content

```bash
Task ID: REC-002
Priority: P1
Hours: 6

Features:
- [ ] "You might also like" section
- [ ] Based on current conversation
- [ ] Based on user's interests
- [ ] Diversify by source/author

Endpoint:
```
GET /api/v1/recommendations/similar/:conversationId

Response:
{
  "recommendations": [
    {
      "conversation": { ... },
      "reason": "Similar to what you're viewing",
      "score": 0.85
    }
  ]
}
```
```

### XI.3 Feed Recommendations

```bash
File: apps/server/src/services/feed-recommendations.js

Task ID: REC-003
Priority: P1
Hours: 8

Features:
- [ ] Score feed items by relevance
- [ ] Mix trending + personalized
- [ ] Diversify by author/topic
- [ ] Boost followed users
- [ ] Reduce seen content

Algorithm:
```javascript
function scoreForFeedItem(item, userProfile, feedHistory) {
  let score = 0;
  
  // Relevance to interests (0-40 points)
  score += calculateInterestScore(item, userProfile) * 0.4;
  
  // Recency (0-20 points)
  score += calculateRecencyScore(item.createdAt) * 0.2;
  
  // Engagement (0-20 points)
  score += calculateEngagementScore(item) * 0.2;
  
  // Diversification (0-20 points)
  score += calculateDiversityBonus(item, feedHistory) * 0.2;
  
  return score;
}
```
```

### XI.4 Dismiss/Feedback

```bash
File: apps/pwa/src/components/FeedbackButton.tsx

Task ID: REC-004
Priority: P1
Hours: 3

Features:
- [ ] "Not interested" button on feed items
- [ ] "Show less like this"
- [ ] "This isn't helpful"
- [ ] Track feedback for improvement

Endpoint:
```
POST /api/v1/recommendations/feedback
{
  "conversationId": "uuid",
  "feedbackType": "not_interested" | "show_less" | "not_helpful",
  "reason": "string (optional)"
}
```
```

### XI.5 Testing Recommendations

```bash
Task ID: REC-005
Priority: P1
Hours: 4

Tests:
- [ ] Interest detection accuracy
- [ ] Similar content relevance
- [ ] Feed ranking quality
- [ ] Feedback loop effectiveness
```

---

## XII. Success Metrics & Analytics

### XII.1 Tracking Implementation

```bash
File: apps/pwa/src/lib/analytics/tracking.ts

Task ID: METRICS-001
Priority: P0
Hours: 4

Implement tracking for:

// Capture metrics
trackEvent('capture_started');
trackEvent('capture_completed', { provider, duration, success });
trackEvent('capture_failed', { provider, error });

// BYOK metrics
trackEvent('api_key_added', { provider });
trackEvent('byok_chat_started', { provider, model });
trackEvent('byok_message_sent', { provider, tokens });
trackEvent('byok_cost_accrued', { provider, cost });

// Social metrics
trackEvent('share_clicked', { destination });
trackEvent('fork_created');
trackEvent('follow_user', { targetUserId });
trackEvent('like_toggled', { state });

// Retention metrics
trackEvent('daily_active_user');
trackEvent('vault_item_count', { count });
trackEvent('search_performed', { query, results });
```

### XII.2 Success Metrics Dashboard

```bash
File: apps/pwa/src/pages/Analytics.tsx

Task ID: METRICS-002
Priority: P2
Hours: 6

Display metrics from USER_JOURNEY.md:

| Metric | Target | Tracking |
|--------|--------|----------|
| First capture → Second capture | 40%+ within 7 days | ✅ |
| BYOK chat sessions/user/month | 5+ | ✅ |
| Fork rate | 5%+ of views | ✅ |
| Weekly active users | 60%+ of registered | ✅ |
| Vault items at 30 days | 25+ | ✅ |
| Search queries/user/week | 5+ | ✅ |
| D1 retention | 50%+ | ✅ |
| Users who share publicly | 20%+ of MAU | ✅ |
| External shares | 10%+ of active users | ✅ |
| New users from shared links | 30%+ of sign-ups | ✅ |

UI:
```tsx
<AnalyticsDashboard>
  <MetricCard
    title="Captures This Week"
    value={current.captures}
    target={target.captures}
    trend={trend}
  />
  <MetricCard
    title="BYOK Sessions"
    value={current.byokSessions}
    target={target.byokSessions}
    trend={trend}
  />
  <MetricCard
    title="Fork Rate"
    value={`${current.forkRate}%`}
    target={`${target.forkRate}%`}
  />
</AnalyticsDashboard>
```
```

---

## XIII. Task Summary (Updated)

| Category | Tasks | Hours |
|----------|-------|-------|
| Rebranding | 10 | 20 |
| Capture | 3 | 8 |
| BYOK Chat | 10 | 68 |
| Social Features | 10 | 52 |
| Vault Organization | 7 | 33 |
| Search | 4 | 20 |
| Identity | 2 | 16 |
| ACU Components | 10 | 51 |
| Recommendations | 5 | 27 |
| Testing | 3 | 8 |
| Deployment | 3 | 10 |
| Success Metrics | 2 | 10 |
| **Total** | **71** | **323 hours** |

### XIII.1 Updated Weekly Breakdown

| Week | Focus | Hours |
|------|-------|-------|
| 1 | Foundation + BYOK Design | 55 |
| 2 | BYOK Implementation | 70 |
| 3 | Social + ACU | 65 |
| 4 | Vault + Search + Metrics | 65 |
| 5 | Recommendations + Polish | 68 |
| **Total** | | **323** |

---

*Document Version: 1.1*  
*Last Updated: February 9, 2026*  
*Added: Sections X (ACU), XI (Recommendations), XII (Success Metrics)*
