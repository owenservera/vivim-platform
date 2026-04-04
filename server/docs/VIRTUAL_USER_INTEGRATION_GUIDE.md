# Virtual User Identification System - Integration Guide

## Overview

The Virtual User Identification System enables **no-login AI chatbot** functionality for web applications. Users interact with the chatbot anonymously while maintaining persistent identity, memory, and context across sessions - as if they were logged in.

## Key Features

- **No-Login Identification**: Automatic user identification via device fingerprinting
- **Persistent Memory**: Full memory system for virtual users (memories, conversations, ACUs)
- **Context Engine**: Complete context pipeline adapted for virtual users
- **GDPR Compliant**: Built-in consent management, data retention, and privacy controls
- **Session Management**: Secure session handling with cookies and tokens
- **Profile Building**: User profiles that grow and improve over time

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Client Browser                          │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  VirtualUserSDK                                       │   │
│  │  - Fingerprint generation (canvas, webgl, audio)     │   │
│  │  - Session management                                │   │
│  │  - API integration                                   │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      Backend Server                          │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Virtual User API                                     │   │
│  │  POST /api/v1/virtual/identify                       │   │
│  │  POST /api/v1/virtual/consent                        │   │
│  │  GET  /api/v1/virtual/profile                        │   │
│  │  POST /api/v1/virtual/chat                           │   │
│  └──────────────────────────────────────────────────────┘   │
│                            │                                  │
│                            ▼                                  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Services                                             │   │
│  │  - VirtualUserManager                                │   │
│  │  - DeviceFingerprinting                              │   │
│  │  - VirtualMemoryAdapter                              │   │
│  │  - VirtualUserPrivacy                                │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      PostgreSQL Database                     │
│  - VirtualUser                                               │
│  - VirtualSession                                            │
│  - VirtualMemory                                             │
│  - VirtualConversation                                       │
│  - VirtualACU                                                │
│  - VirtualNotebook                                           │
│  - VirtualUserAuditLog                                       │
│  - VirtualUserAnalytics                                      │
└─────────────────────────────────────────────────────────────┘
```

## Installation

### 1. Database Migration

Run the Prisma migration to add virtual user tables:

```bash
cd server
bunx prisma migrate dev --name add_virtual_user_system
bunx prisma generate
```

### 2. Environment Variables

Add these to your `.env` file:

```bash
# Virtual User System
VIRTUAL_USER_ENABLED=true
VIRTUAL_USER_CONSENT_REQUIRED=true
VIRTUAL_USER_DEFAULT_RETENTION_POLICY=90_days
VIRTUAL_USER_SESSION_DURATION_DAYS=30

# For fingerprinting and embeddings
OPENAI_API_KEY=your_openai_key
```

### 3. Register Routes

In your main server file (e.g., `server/src/server.js`):

```javascript
import { virtualUserRoutes } from './routes/virtual-user.js';
import { virtualUserAutoAuth } from './middleware/virtual-user-auth.js';

// Virtual user routes
app.use('/api/v1/virtual', virtualUserRoutes);

// Optional: Auto-auth middleware for all virtual routes
app.use('/api/v1/virtual/*', virtualUserAutoAuth);
```

## Quick Start

### Frontend Integration

```javascript
import { createVirtualUserSDK } from '@vivim/virtual-user-sdk';

// Initialize SDK
const sdk = createVirtualUserSDK({
  apiUrl: 'https://api.yourapp.com',
  consentRequired: true,
  dataRetentionPolicy: '90_days',
  debug: true
});

// Auto-identify user on page load
await sdk.initialize();

// Listen for events
sdk.on('identified', (data) => {
  console.log('User identified:', data.virtualUserId);
});

sdk.on('consentRequired', () => {
  // Show consent modal
  showConsentModal();
});

// Handle consent
async function handleConsent() {
  await sdk.giveConsent({ dataRetentionPolicy: '90_days' });
  hideConsentModal();
}

// Chat with AI
const response = await sdk.chat('Hello, remember me?', {
  model: 'gpt-4',
  temperature: 0.7
});

console.log('AI Response:', response.message);
```

### React Integration

```jsx
import { useEffect, useState } from 'react';
import { createVirtualUserSDK } from '@vivim/virtual-user-sdk';

const sdk = createVirtualUserSDK({
  apiUrl: process.env.REACT_APP_API_URL,
  consentRequired: true
});

function Chatbot() {
  const [initialized, setInitialized] = useState(false);
  const [consentRequired, setConsentRequired] = useState(false);
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    async function init() {
      const result = await sdk.initialize();
      
      if (result?.consentRequired) {
        setConsentRequired(true);
      }
      
      setInitialized(true);
    }
    
    init();
    
    sdk.on('consentGiven', () => {
      setConsentRequired(false);
    });
  }, []);

  async function handleConsent() {
    await sdk.giveConsent();
  }

  async function sendMessage(message) {
    const response = await sdk.chat(message);
    setMessages([...messages, { role: 'assistant', content: response.message }]);
  }

  if (!initialized) return <div>Loading...</div>;
  if (consentRequired) {
    return (
      <div>
        <h3>We use memory to personalize your experience</h3>
        <button onClick={handleConsent}>Accept</button>
      </div>
    );
  }

  return <ChatInterface onSend={sendMessage} />;
}
```

## API Reference

### Identification Endpoints

#### POST /api/v1/virtual/identify

Identify or create a virtual user based on device fingerprint.

**Request:**
```json
{
  "fingerprint": "sha256:abc123...",
  "signals": {
    "canvas": "base64_encoded_canvas_data",
    "webglVendor": "Intel Inc.",
    "webglRenderer": "Intel Iris OpenGL Engine",
    "audio": "audio_fingerprint_hash",
    "fonts": ["Arial", "Verdana", "Times New Roman"],
    "screenResolution": "1920x1080",
    "screenColorDepth": 24,
    "hardwareConcurrency": 8,
    "deviceMemory": 16,
    "userAgent": "Mozilla/5.0...",
    "language": "en-US",
    "timezone": "America/New_York",
    "platform": "Win32"
  },
  "existingSessionToken": "optional_existing_token"
}
```

**Response:**
```json
{
  "success": true,
  "virtualUserId": "550e8400-e29b-41d4-a716-446655440000",
  "sessionToken": "new_session_token",
  "identification": {
    "score": 92,
    "level": "HIGH",
    "signals": {
      "fingerprint": 95,
      "cookie": 100,
      "ip_ua": 80,
      "behavioral": 0
    },
    "threshold": {
      "auto_identify": 75,
      "suggest_merge": 60,
      "create_new": 0
    }
  },
  "profile": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "displayName": "Curious Explorer #1234",
    "topicInterests": ["technology", "science"],
    "conversationCount": 15,
    "memoryCount": 47,
    "firstSeenAt": "2025-01-15T10:30:00Z",
    "lastSeenAt": "2026-03-27T14:22:00Z",
    "consentGiven": false,
    "dataRetentionPolicy": "90_days"
  },
  "consentRequired": true,
  "isNewUser": false
}
```

#### POST /api/v1/virtual/consent

Provide consent for data storage.

**Request:**
```json
{
  "virtualUserId": "550e8400-e29b-41d4-a716-446655440000",
  "sessionToken": "session_token",
  "consentGiven": true,
  "dataRetentionPolicy": "90_days"
}
```

**Response:**
```json
{
  "success": true,
  "consentGiven": true,
  "dataRetentionPolicy": "90_days"
}
```

#### GET /api/v1/virtual/profile

Get virtual user profile.

**Headers:**
```
Cookie: virtual_session=session_token
```

**Response:**
```json
{
  "success": true,
  "profile": {
    "id": "...",
    "displayName": "...",
    "topicInterests": [],
    "conversationCount": 15,
    "memoryCount": 47
  },
  "recentConversations": [...],
  "memoryStats": {
    "totalMemories": 47,
    "memoriesByType": { "EPISODIC": 20, "SEMANTIC": 15 },
    "avgImportance": 0.65
  }
}
```

### Memory Endpoints

#### GET /api/v1/virtual/memories

Get virtual user memories.

**Query Parameters:**
- `type` - Filter by memory type (EPISODIC, SEMANTIC, etc.)
- `category` - Filter by category
- `tags` - Comma-separated tags
- `minImportance` - Minimum importance score (0-1)
- `limit` - Number of results (default: 50)
- `offset` - Pagination offset

**Response:**
```json
{
  "success": true,
  "memories": [
    {
      "id": "...",
      "content": "User prefers TypeScript over JavaScript",
      "memoryType": "PREFERENCE",
      "category": "preferences",
      "tags": ["programming", "languages"],
      "importance": 0.8,
      "createdAt": "2026-03-20T10:00:00Z"
    }
  ],
  "total": 47
}
```

#### POST /api/v1/virtual/memories

Create a new memory.

**Request:**
```json
{
  "sessionToken": "token",
  "content": "User is learning React",
  "memoryType": "FACTUAL",
  "category": "skills",
  "tags": ["react", "learning"],
  "importance": 0.7
}
```

### Conversation Endpoints

#### GET /api/v1/virtual/conversations

Get virtual user conversations.

**Response:**
```json
{
  "success": true,
  "conversations": [
    {
      "id": "...",
      "title": "React Hooks Discussion",
      "messageCount": 25,
      "createdAt": "2026-03-25T14:00:00Z"
    }
  ],
  "total": 15
}
```

#### POST /api/v1/virtual/conversations

Create a new conversation.

**Request:**
```json
{
  "sessionToken": "token",
  "title": "New Conversation",
  "provider": "openai",
  "model": "gpt-4"
}
```

#### POST /api/v1/virtual/chat

Send a message and get AI response.

**Request:**
```json
{
  "sessionToken": "token",
  "message": "Hello, how are you?",
  "conversationId": "optional_conversation_id",
  "model": "gpt-4",
  "temperature": 0.7,
  "stream": false
}
```

### Privacy Endpoints

#### GET /api/v1/virtual/export

Export all virtual user data (GDPR right to access).

**Response:**
```json
{
  "success": true,
  "data": {
    "profile": { ... },
    "memories": [...],
    "conversations": [...],
    "acus": [...],
    "notebooks": [...],
    "exportedAt": "2026-03-27T14:22:00Z"
  }
}
```

#### DELETE /api/v1/virtual/account

Delete virtual user account (GDPR right to erasure).

**Response:**
```json
{
  "success": true,
  "message": "Account deleted successfully"
}
```

## Device Fingerprinting

### How It Works

The system uses multiple browser signals to create a unique device fingerprint:

1. **Canvas Fingerprinting**: Renders hidden canvas with text and graphics, hashes the output
2. **WebGL Fingerprinting**: Captures GPU vendor, renderer, and capabilities
3. **Audio Fingerprinting**: Uses Web Audio API to generate oscillator output hash
4. **Font Detection**: Tests for installed fonts using canvas measurement
5. **Screen Characteristics**: Resolution, color depth, pixel ratio
6. **Hardware Info**: CPU cores, device memory, touch support
7. **Browser Info**: User agent, language, timezone, platform

### Confidence Scoring

| Score Range | Level | Action |
|-------------|-------|--------|
| 75-100 | HIGH | Auto-identify user |
| 60-74 | MEDIUM | Suggest merge ("Is this you?") |
| 0-59 | LOW | Create new virtual user |

### Privacy Considerations

- All fingerprint signals are encrypted at rest
- Users can request deletion of fingerprint data
- Fingerprint data is never shared with third parties
- Compliant with GDPR and CCPA

## Data Retention

### Policy Options

| Policy | Duration | Auto-Delete |
|--------|----------|-------------|
| `7_days` | 7 days | Yes |
| `30_days` | 30 days | Yes |
| `90_days` (default) | 90 days | Yes |
| `1_year` | 1 year | Yes |
| `indefinite` | Until manual delete | No |

### Automated Cleanup

Run the cleanup job daily:

```javascript
import { virtualUserPrivacyService } from './services/virtual-user-privacy.js';

// Cron job (daily at 2 AM)
cron.schedule('0 2 * * *', async () => {
  const result = await virtualUserPrivacyService.runRetentionCleanup();
  console.log('Cleanup completed:', result);
});
```

## Security

### Session Security

- **HttpOnly Cookies**: Session tokens stored in HttpOnly cookies
- **Secure Flag**: Cookies only sent over HTTPS in production
- **SameSite=Strict**: Prevents CSRF attacks
- **30-Day Expiration**: Sessions expire after 30 days of inactivity

### Rate Limiting

```javascript
import { rateLimitVirtualUsers } from './middleware/virtual-user-auth.js';

// Limit to 100 requests per minute
app.use('/api/v1/virtual/chat', rateLimitVirtualUsers(100, 60000));
```

### Access Control

```javascript
import { requireVirtualUser, checkVirtualUserOwnership } from './middleware/virtual-user-auth.js';

// Require authentication
app.post('/api/v1/virtual/memories', requireVirtualUser, createMemory);

// Check ownership
app.get('/api/v1/virtual/conversations/:id',
  requireVirtualUser,
  checkVirtualUserOwnership('VirtualConversation'),
  getConversation
);
```

## Monitoring & Analytics

### Key Metrics

```javascript
import { virtualUserPrivacyService } from './services/virtual-user-privacy.js';

const stats = await virtualUserPrivacyService.getPrivacyStats();
console.log(stats);
// {
//   totalVirtualUsers: 10000,
//   usersWithConsent: 8500,
//   usersByRetentionPolicy: { '90_days': 5000, '30_days': 3000 },
//   deletedUsersLast30Days: 150
// }
```

### Audit Logs

All privacy-related actions are logged:

```javascript
const logs = await virtualUserPrivacyService.getAuditLogs(virtualUserId);
console.log(logs);
// [
//   { action: 'CONSENT_GIVEN', createdAt: '...', ipAddress: '...' },
//   { action: 'EXPORT', createdAt: '...', ipAddress: '...' }
// ]
```

## Troubleshooting

### Common Issues

**Issue: Fingerprint not matching returning users**
- Check if browser settings block canvas/WebGL access
- Verify cookies are enabled
- Check if user cleared browser data

**Issue: Consent modal not appearing**
- Ensure `consentRequired: true` in SDK options
- Check `consentRequired` flag in identify response
- Verify event listener is registered

**Issue: Session expiring too quickly**
- Check `VIRTUAL_USER_SESSION_DURATION_DAYS` env variable
- Verify cookie expiration matches server config

### Debug Mode

Enable debug logging:

```javascript
const sdk = createVirtualUserSDK({
  apiUrl: 'https://api.yourapp.com',
  debug: true  // Enable detailed logging
});
```

## Best Practices

1. **Always require consent** before storing user data
2. **Use HTTPS** in production for secure cookie transmission
3. **Implement graceful fallback** if fingerprinting fails
4. **Respect user