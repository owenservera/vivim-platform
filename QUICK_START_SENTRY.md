# 🚀 Quick Start: Sentry Account Setup

Follow these 3 simple steps to get Sentry fully configured for your VIVIM project!

## Step 1: Create Your Free Sentry Account (2 minutes)

1. **Go to**: https://sentry.io/signup/
2. **Sign up** (free - up to 5,000 errors/month)
3. **Choose organization name**: `vivim-dev`
4. **Verify email** when prompted

## Step 2: Create 3 Projects (3 minutes)

After signing in, create these 3 projects in your Sentry dashboard:

### Project 1: VIVIM Server
- Click **"Create Project"**
- Select **"Node.js"**
- Name it: `vivim-server`
- **Copy the DSN** (looks like: `https://xxx@sentry.io/xxx`)

### Project 2: VIVIM PWA
- Click **"Create Project"**
- Select **"React"**
- Name it: `vivim-pwa`
- **Copy the DSN**

### Project 3: VIVIM Network
- Click **"Create Project"**
- Select **"Node.js"**
- Name it: `vivim-network`
- **Copy the DSN**

## Step 3: Configure Your Project (2 minutes)

Add the DSNs to your environment files:

### Update Root `.env`:
```env
SENTRY_DSN=https://YOUR_SERVER_DSN@sentry.io/PROJECT_ID
SENTRY_RELEASE=vivim-server@1.0.0
SENTRY_ENVIRONMENT=development
SENTRY_TRACES_SAMPLE_RATE=0.1
SENTRY_PROFILES_SAMPLE_RATE=0.1
SENTRY_DEBUG=false
```

### Update PWA `pwa/.env`:
```env
VITE_SENTRY_DSN=https://YOUR_PWA_DSN@sentry.io/PROJECT_ID
VITE_SENTRY_RELEASE=vivim-pwa@1.0.0
VITE_SENTRY_DEBUG=false
```

### Update Network `network/.env`:
```env
SENTRY_DSN=https://YOUR_NETWORK_DSN@sentry.io/PROJECT_ID
SENTRY_RELEASE=vivim-network@0.1.0
SENTRY_ENVIRONMENT=development
SENTRY_TRACES_SAMPLE_RATE=0.1
SENTRY_DEBUG=false
```

## ✅ Verify Setup

Run this command to confirm everything is configured:

```bash
bun run scripts/verify-sentry-setup.js
```

You should see: `🎉 Sentry setup is properly configured!`

## 🧪 Test It!

Start your applications:

```bash
bun run dev
```

Then in your browser console (F12), type:

```javascript
throw new Error("Sentry test!");
```

**Check your Sentry dashboard** - you should see the error appear within seconds!

## 📋 What Gets Tracked

✅ **Server**: All backend errors, database issues, API failures
✅ **PWA**: JavaScript errors, React issues, user interactions
✅ **Network**: P2P failures, connection issues, WebSocket errors

## 💡 Next Steps

1. **Set up alerts** - Get notified immediately about critical errors
2. **Upload source maps** - For readable stack traces in production
3. **Review errors weekly** - Prioritize fixing top issues
4. **Adjust sampling rates** - Balance insights vs costs

## 📚 Full Documentation

For detailed information, see:
- `SENTRY_SETUP.md` - Complete technical guide
- `SENTRY_ACCOUNT_SETUP.md` - Account configuration details
- `SENTRY_INTEGRATION_SUMMARY.md` - Implementation overview

---

**Total Time**: ~7 minutes
**Cost**: Free (up to 5,000 errors/month)
**Difficulty**: Easy

Questions? Check the full documentation or visit [Sentry Support](https://sentry.io/support/)
