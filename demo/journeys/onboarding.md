---
title: First-Time User Onboarding
description: Show immediate value and setup flow for new users
duration: 45s
target: New users, trial signups
---

## Pre-Conditions

- [ ] Fresh account (or demo reset complete)
- [ ] Browser on login page
- [ ] No prior conversations
- [ ] Server running on localhost:3000
- [ ] PWA running on localhost:5173

## Steps

| Step | Action | URL | Wait | Screenshot | Notes |
|------|--------|-----|------|------------|-------|
| 1 | Navigate | /login | 2000 | ✅ | Login screen - clean, inviting |
| 2 | Navigate | /home | 3000 | ✅ | Auto-login, empty state with provider cards |
| 3 | Navigate | /capture | 2000 | ✅ | Capture page - URL input prominent |
| 4 | Navigate | /import | 3000 | ✅ | Import options - 9 provider logos |
| 5 | Navigate | /for-you | 3000 | ✅ | For You feed - populated with demo data |
| 6 | Navigate | /archive | 2000 | ✅ | Archive timeline - full history |

## Narration Script

**[0-5s]** "Welcome to VIVIM. Let's get you set up in 30 seconds."

**[5-10s]** "One click — you're in. Your AI brain, ready."

**[10-20s]** "This is your archive. Connect your AI providers — ChatGPT, Claude, Gemini, and 6 more."

**[20-30s]** "One URL paste captures everything. No more scattered tabs."

**[30-40s]** "Import from 9 providers. One tap — your entire AI history, archived."

**[40-45s]** "You're done. Your AI thinking, organized forever."

## Success Criteria

- Login completes in <3s
- Provider cards visible on home
- Capture page loads instantly
- Import shows all 9 providers
- For You feed shows 10+ cards
- Archive shows 320 conversations

## Key Metrics

| Metric | Target | Actual |
|--------|--------|--------|
| Time to first value | <10s | - |
| Pages loaded | 6 | - |
| Screenshots captured | 6 | - |
| Total duration | 45s | - |
