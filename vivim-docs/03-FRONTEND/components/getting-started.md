# Getting Started with VIVIM

This guide walks you through setting up VIVIM and connecting your first AI accounts.

---

## Prerequisites

Before you begin, ensure you have:

- A modern web browser (Chrome, Firefox, Safari, Edge)
- An account with at least one supported AI provider
- Internet connection for initial setup

---

## Step 1: Create Your VIVIM Account

### Registration

1. Open VIVIM in your browser
2. Click **Sign Up**
3. Enter your email address
4. Create a strong password
5. Verify your email address

### Setting Up Your Identity

After registration, you'll set up your VIVIM identity:

1. Choose a unique **handle** (e.g., `@yourname`)
2. Your **DID** (Decentralized Identifier) will be generated automatically
3. Optionally upload an avatar
4. Complete the identity setup wizard

---

## Step 2: Connect AI Providers

### Supported Providers

VIVIM supports these AI platforms:

| Provider | Status | OAuth Available |
|----------|--------|-----------------|
| ChatGPT | ✅ Supported | Yes |
| Claude | ✅ Supported | Yes |
| Gemini | ✅ Supported | Yes |
| Grok | ✅ Supported | Yes |
| DeepSeek | ✅ Supported | Yes |
| Kimi | ✅ Supported | Yes |
| Qwen | ✅ Supported | Yes |
| Mistral | ✅ Supported | Yes |
| ZAI | ✅ Supported | Yes |

### Connecting a Provider

1. Navigate to **Settings** → **AI Providers**
2. Click **Add Provider**
3. Select your AI platform from the list
4. Log in to your account via the OAuth popup
5. Grant VIVIM permission to access your conversations
6. Click **Confirm**

### Verifying Connection

After connecting:
- Your provider will show as "Connected" in the providers list
- A green indicator will appear next to the provider name
- Your recent conversations will begin syncing

---

## Step 3: Configure Capture Settings

### Auto-Capture

Enable automatic capture for continuous syncing:

1. Go to **Settings** → **Capture**
2. Toggle **Enable Auto-Capture**
3. Select which providers to auto-capture
4. Set capture frequency (real-time, hourly, daily)

### Manual Capture

For one-time imports:

1. Click **Capture** in the main navigation
2. Choose **Manual Capture**
3. Paste the conversation URL
4. Click **Import**

### Simple Capture

For quick captures without leaving VIVIM:

1. Use the **Simple Capture** option
2. Copy-paste conversation content
3. Select the AI provider
4. Click **Save**

---

## Step 4: Explore Your Dashboard

### Home Screen Overview

After setup, you'll see your home dashboard:

```
┌─────────────────────────────────────────┐
│  VIVIM                    [Search] [⚙️] │
├─────────────────────────────────────────┤
│  Welcome back!                           │
│                                         │
│  Recent Conversations                   │
│  ┌─────────────────────────────────┐   │
│  │ ChatGPT - Project Alpha         │   │
│  │ 2 hours ago                     │   │
│  └─────────────────────────────────┘   │
│  ┌─────────────────────────────────┐   │
│  │ Claude - API Design             │   │
│  │ Yesterday                       │   │
│  └─────────────────────────────────┘   │
│                                         │
│  Quick Actions                          │
│  [🔍 Search]  [📥 Capture]  [📁 Collections] │
└─────────────────────────────────────────┘
```

### Understanding the Interface

| Element | Description |
|---------|-------------|
| **Top Bar** | Search, settings, notifications |
| **Navigation** | Home, Archive, Collections, Search, Bookmarks, Settings |
| **Main Content** | Your conversations, organized by recency |
| **Quick Actions** | Common tasks accessible from anywhere |

---

## Step 5: Your First Search

### Basic Search

1. Click the **Search** icon or press `/`
2. Type your query (e.g., "authentication code")
3. View results instantly

### Advanced Search

Use filters to narrow results:

- **Provider**: Filter by AI platform
- **Date Range**: Find conversations from specific periods
- **Topic**: Search within topics
- **Collection**: Limit to specific collections

### Search Tips

- Use natural language: "what was that Python script for?"
- Search for code snippets: "function authenticate"
- Find decisions: "conclusion about the design"

---

## Step 6: Organize with Collections

### Create a Collection

1. Navigate to **Collections**
2. Click **New Collection**
3. Name your collection (e.g., "Work Projects")
4. Add a description (optional)
5. Set privacy level

### Add Conversations

1. Open a conversation
2. Click the **...** menu
3. Select **Add to Collection**
4. Choose destination collection

---

## Step 7: Enable Context Features

### Context Cockpit

Configure how VIVIM understands your data:

1. Go to **Context Cockpit**
2. Adjust **Topic Tracking** sensitivity
3. Set **Entity Recognition** preferences
4. Configure **Memory Importance** levels

### Custom Instructions

Add instructions that shape how VIVIM treats your data:

1. Navigate to **Settings** → **Context**
2. Click **Add Custom Instruction**
3. Enter your instruction
4. Set scope (global or topic-specific)

---

## Verification Checklist

After setup, verify everything works:

- [ ] Account created and email verified
- [ ] Identity configured with handle and DID
- [ ] At least one AI provider connected
- [ ] Test conversation captured successfully
- [ ] Search returns expected results
- [ ] Can create and populate a collection

---

## Common Setup Issues

### OAuth Fails

If the OAuth connection fails:
1. Clear browser cookies
2. Disable ad blockers temporarily
3. Try a different browser
4. Ensure you're logged into the provider separately

### Conversations Not Syncing

If captures don't appear:
1. Check provider connection status
2. Verify the conversation exists on the source platform
3. Try manual capture as a test
4. Check capture settings aren't paused

### Slow Performance

If VIVIM feels slow:
1. Clear browser cache
2. Reduce the number of connected providers
3. Archive old conversations
4. Check internet connection

---

## Next Steps

Now that you're set up:

1. **Explore Features** - Read about all VIVIM capabilities
2. **Join Community** - Connect with other VIVIM users
3. **Set Up Sync** - Enable P2P sync for better connectivity
4. **Invite Team** - Add teammates for collaboration

---

*Need help? Contact support through the app or visit our help center.*
