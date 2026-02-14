# VIVIM v1 Prototype Implementation Roadmap

> **Start Date:** February 9, 2026  
> **Target:** Working Prototype (4 weeks)  
> **Status:** Planning Complete - Ready for Execution

---

## Overview

This roadmap transforms the existing OpenScroll codebase (~70% complete) into a working VIVIM v1 prototype. The work is divided into 4 sprints over 4 weeks.

---

## Sprint 1: Foundation (Feb 9-15)

### Goals
1. ✅ Complete rebranding (in progress)
2. ✅ Add Mistral provider
3. Design BYOK architecture
4. Set up CI/CD for testing

### Tasks

#### 1.1 Rebranding Completion
| Task | Owner | Status | Hours |
|------|-------|---------|-------|
| Text changes (files above) | Agent | ✅ | 2 |
| Logo assets | Design | 🔄 | 8 |
| CSS theme | Frontend | 🔄 | 4 |
| PWA manifest | Frontend | 🔄 | 1 |

#### 1.2 Mistral Provider
```javascript
// Create extractor
apps/server/src/extractors/extractor-mistral.js

// Add to router
apps/server/src/routes/capture.js

// Test
apps/server/tests/extractors/mistral.test.js
```

#### 1.3 BYOK Architecture Design
```typescript
// Design decisions:
├── Key Storage Strategy
│   └── Encrypt with user's master key (from identity service)
├── Provider Abstraction
│   └── Unified interface for OpenAI, Anthropic, Google
├── Streaming Response
│   └── Server-Sent Events (SSE) for real-time responses
└── Cost Tracking
    └── Local usage logging per provider
```

---

## Sprint 2: BYOK Core (Feb 16-22)

### Goals
1. API Key Management UI
2. Chat Interface
3. Provider Integration (4+ providers)

### Tasks

#### 2.1 API Key Management
```
apps/pwa/src/pages/APIKeySettings.tsx
apps/pwa/src/lib/byok/api-key-manager.ts
apps/pwa/src/lib/byok/provider-config.ts
```

**Features:**
- Add/Remove API keys per provider
- Validate keys before saving
- Show key prefix (e.g., `sk-...abcd`)
- Delete key option

**Supported Providers:**
| Provider | Status | Setup |
|----------|--------|-------|
| OpenAI | 🔄 | API key only |
| Anthropic | 🔄 | API key only |
| Google Gemini | 🔄 | API key only |
| xAI Grok | 🔄 | API key only |
| Mistral | ❌ | Coming soon |

#### 2.2 Chat Interface
```
apps/pwa/src/pages/BYOKChat.tsx
apps/pwa/src/components/ChatMessage.tsx
apps/pwa/src/components/BYOKChatInput.tsx
```

**Features:**
- Conversation context loading
- Streaming responses
- Model selector dropdown
- Temperature setting
- Usage stats display

#### 2.3 Server BYOK Endpoint
```
apps/server/src/routes/byok.js
```

**Endpoint:**
```
POST /api/v1/byok/chat
{
  "conversationId": "uuid",
  "message": "Continue this conversation...",
  "provider": "openai",
  "model": "gpt-4",
  "settings": {
    "temperature": 0.7,
    "maxTokens": 2000
  }
}
```

**Response:** Server-Sent Events stream

---

## Sprint 3: Social Features (Feb 23 - Mar 1)

### Goals
1. Following system
2. Likes/Saves
3. Fork functionality
4. Basic profiles

### Tasks

#### 3.1 Database Additions
```prisma
// Add to schema.prisma
model UserFollow {
  followerId    String
  followingId   String
  createdAt     DateTime @default(now())
  
  @@unique([followerId, followingId])
}

model Like {
  userId        String
  acuId         String
  createdAt     DateTime @default(now())
  
  @@unique([userId, acuId])
}

model Bookmark {
  userId        String
  conversationId String
  createdAt     DateTime @default(now())
}

model UserProfile {
  userId        String @id
  bio           String?
  website       String?
  twitter       String?
  github        String?
  
  @@map("user_profiles")
}
```

#### 3.2 Backend Routes
```
apps/server/src/routes/social.js
```

**Endpoints:**
```
GET    /api/v1/social/followers/:userId
GET    /api/v1/social/following/:userId
POST   /api/v1/social/follow/:userId
DELETE /api/v1/social/unfollow/:userId

POST   /api/v1/social/like/:acuId
DELETE /api/v1/social/unlike/:acuId

POST   /api/v1/social/bookmark/:conversationId
DELETE /api/v1/social/unbookmark/:conversationId

GET    /api/v1/social/profile/:did
PUT    /api/v1/social/profile
```

#### 3.3 Fork Functionality
```
POST /api/v1/conversations/:id/fork
```

**Logic:**
1. Load original conversation
2. Copy all messages to new conversation
3. Set owner to current user
4. Add attribution metadata
5. Return new conversation ID

#### 3.4 Frontend Components
```
apps/pwa/src/components/
├── LikeButton.tsx
├── BookmarkButton.tsx
├── ForkButton.tsx
├── ShareMenu.tsx
└── FollowButton.tsx

apps/pwa/src/pages/
├── Profile.tsx
└── UserProfile.tsx
```

---

## Sprint 4: Polish (Mar 2-8)

### Goals
1. Vault organization
2. Search improvements
3. Mobile polish
4. Testing & Bug fixes

### Tasks

#### 4.1 Vault Organization
```
apps/pwa/src/pages/Vault.tsx
apps/pwa/src/pages/Collections.tsx
apps/pwa/src/pages/Tags.tsx
```

**Features:**
- Collections (folders)
- Tag management
- Search with filters
- Sort options (date, quality, provider)
- Bulk actions

#### 4.2 Search Improvements
```
apps/server/src/services/embedding.js
```

**Add:**
- Semantic search using embeddings
- Filter UI in frontend
- Search suggestions

#### 4.3 Mobile Polish
```
- PWA install prompt
- Offline mode improvements
- Touch gesture support
```

#### 4.4 Testing
```
- Unit tests for BYOK
- Integration tests for social features
- E2E tests for critical flows
```

---

## Milestones

| Date | Milestone | Definition of Done |
|------|-----------|-------------------|
| Feb 15 | Sprint 1 Complete | Rebranding + Mistral + BYOK design |
| Feb 22 | Sprint 2 Complete | BYOK chat working with 4 providers |
| Mar 1 | Sprint 3 Complete | Social features (follow/like/fork) |
| Mar 8 | Sprint 4 Complete | Testing complete, ready for demo |

---

## Demo Scenario

At the end of Sprint 4, demonstrate:

```
1. User signs up (DID-based identity)
2. Captures a ChatGPT conversation (capture)
3. Views it in their vault (vault UI)
4. Adds API key for OpenAI (BYOK setup)
5. Continues the conversation (BYOK chat)
6. Forks the conversation to their vault (fork)
7. Shares to feed (social)
8. Another user likes it (social)
```

---

## Risk Analysis

| Risk | Impact | Mitigation |
|------|--------|------------|
| BYOK complexity | High | Start with OpenAI only, add others incrementally |
| Social features take longer | Medium | Focus on likes/shares first, comments later |
| Embedding generation slow | Medium | Use lightweight models, cache results |
| Provider API changes | Low | Abstract provider logic, easy updates |

---

## Resources

### Team Capacity
- 1 Full-stack engineer (recommended)
- Design support (part-time)

### Infrastructure Needs
- Existing: PostgreSQL + pgvector
- Existing: Bun runtime
- New: Possibly Redis for BYOK rate limiting

### External Services
- OpenAI API (users bring own keys)
- Anthropic API (users bring own keys)
- Google Gemini API (users bring own keys)

---

## Success Metrics

**Prototype Success Criteria:**
- [ ] 9 AI providers for capture
- [ ] 4+ providers for BYOK chat
- [ ] Vault with collections/tags
- [ ] Feed with likes/saves
- [ ] Fork functionality
- [ ] Basic profiles
- [ ] VIVIM branding complete
- [ ] Installable PWA

**Demo Success:**
- [ ] User can sign up → capture → continue → share
- [ ] Total time under 5 minutes

---

*Document Version: 1.0*  
*Last Updated: February 9, 2026*
