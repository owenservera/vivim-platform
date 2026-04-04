# Sentry Account Setup & Configuration Guide

This guide will walk you through creating a Sentry account and fully configuring it for your VIVIM project.

## 🚀 Quick Setup (5 Minutes)

### Step 1: Install Sentry CLI ✅ (Already Done!)

The Sentry CLI has been installed globally. You can use it via:
```bash
npx sentry-cli [command]
```

### Step 2: Create Your Free Sentry Account

1. **Visit**: https://sentry.io/signup/
2. **Sign up** for a free account (up to 5,000 errors/month free)
3. **Choose organization name**: e.g., `vivim-dev`
4. **Verify email** when requested

### Step 3: Authenticate the CLI

Run this command to link the CLI to your account:

```bash
npx sentry-cli login
```

This will:
1. Open a browser window
2. Ask you to log in to Sentry
3. Create an authentication token
4. Store the token locally

### Step 4: Create Three Projects

In your Sentry dashboard, create these projects:

#### Project 1: VIVIM Server
- **Name**: `vivim-server`
- **Platform**: Node.js
- **Description**: VIVIM API Server - Express backend

After creating, copy the **DSN** (starts with `https://...`)

#### Project 2: VIVIM PWA
- **Name**: `vivim-pwa`
- **Platform**: React
- **Description**: VIVIM Progressive Web App - Frontend

After creating, copy the **DSN**

#### Project 3: VIVIM Network
- **Name**: `vivim-network`
- **Platform**: Node.js
- **Description**: VIVIM Network Engine - P2P layer

After creating, copy the **DSN**

### Step 5: Configure Environment Variables

For each DSN you copied, update the corresponding `.env` file:

#### Root `.env`:
```env
SENTRY_DSN=https://your-server-dsn@sentry.io/project-id
SENTRY_RELEASE=vivim-server@1.0.0
SENTRY_ENVIRONMENT=development
SENTRY_TRACES_SAMPLE_RATE=0.1
SENTRY_PROFILES_SAMPLE_RATE=0.1
SENTRY_DEBUG=false
```

#### PWA `pwa/.env`:
```env
VITE_SENTRY_DSN=https://your-pwa-dsn@sentry.io/project-id
VITE_SENTRY_RELEASE=vivim-pwa@1.0.0
VITE_SENTRY_DEBUG=false
```

#### Network `network/.env`:
```env
SENTRY_DSN=https://your-network-dsn@sentry.io/project-id
SENTRY_RELEASE=vivim-network@0.1.0
SENTRY_ENVIRONMENT=development
SENTRY_TRACES_SAMPLE_RATE=0.1
SENTRY_DEBUG=false
```

### Step 6: Verify Setup

Run the verification script:

```bash
bun run scripts/verify-sentry-setup.js
```

You should see:
```
🎉 Sentry setup is properly configured!
```

### Step 7: Test Error Reporting

Start your applications and test Sentry:

```bash
# Start all services
bun run dev

# Or start individually
cd server && bun run dev
cd pwa && bun run dev
cd network && bun run dev
```

**Test in Browser**:
1. Open http://localhost:5173
2. Open browser console (F12)
3. Type: `throw new Error("Test error")`
4. Check your Sentry dashboard

You should see the error appear in Sentry within seconds!

## 📋 What Gets Tracked

### Server (Node.js)
- ✅ Unhandled exceptions
- ✅ Unhandled promise rejections
- ✅ HTTP errors (4xx, 5xx)
- ✅ Database query errors
- ✅ Authentication failures
- ✅ Request/response timing
- ✅ CPU profiling

### PWA (React)
- ✅ JavaScript errors
- ✅ React component errors
- ✅ Network request failures
- ✅ User interaction errors
- ✅ Page performance metrics
- ✅ Router navigation errors

### Network (P2P)
- ✅ P2P connection failures
- ✅ WebSocket errors
- ✅ Network timeouts
- ✅ Peer discovery issues
- ✅ DHT query failures

## 🎯 Advanced Features

### Enable Session Replay (PWA)

For debugging user sessions before errors:

1. Go to your `vivim-pwa` project in Sentry
2. Navigate to **Settings > Session Replay**
3. Enable session replay
4. Update `pwa/src/lib/sentry.ts`:

```typescript
import * as Sentry from '@sentry/react';
import { BrowserTracing } from '@sentry/react';
import { Replay } from '@sentry/replay';

export function initSentry() {
  Sentry.init({
    dsn: sentryDsn,
    integrations: [
      new BrowserTracing(),
      new Replay({
        maskAllText: false,
        blockAllMedia: false,
      }),
    ],
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
  });
}
```

Install replay package:
```bash
cd pwa && bun add @sentry/replay
```

### Set Up Alert Rules

Get notified immediately about critical errors:

1. Go to your Sentry project
2. Navigate to **Settings > Alerts**
3. Create alert rules for:
   - New critical errors
   - Error rate spikes
   - Performance regressions
   - Service health issues

Configure notifications to:
- Email
- Slack
- Microsoft Teams
- Webhooks

### Upload Source Maps (Production)

For readable stack traces in production:

1. Build your project:
```bash
cd pwa && bun run build
```

2. Upload source maps:
```bash
npx sentry-cli releases files vivim-pwa@1.0.0 upload-sourcemaps dist/
```

3. Clean up (optional):
```bash
rm -rf dist/*.map
```

### Enable Release Tracking

Track errors by deployment version:

```bash
# Create a release
npx sentry-cli releases new vivim-server@1.0.0

# Upload source maps (if needed)
npx sentry-cli releases files vivim-server@1.0.0 upload-sourcemaps dist/

# Set as deployed
npx sentry-cli releases deploys vivim-server@1.0.0 new -e production
```

### Configure Performance Monitoring

Fine-tune performance tracking based on your needs:

**Development** (Full tracking):
```env
SENTRY_TRACES_SAMPLE_RATE=1.0
SENTRY_PROFILES_SAMPLE_RATE=1.0
```

**Production** (Cost-effective):
```env
SENTRY_TRACES_SAMPLE_RATE=0.1  # 10% of requests
SENTRY_PROFILES_SAMPLE_RATE=0.1  # 10% of requests
```

**High-Traffic Production** (Minimal):
```env
SENTRY_TRACES_SAMPLE_RATE=0.01  # 1% of requests
SENTRY_PROFILES_SAMPLE_RATE=0.01  # 1% of requests
```

## 🔧 Useful CLI Commands

```bash
# List your projects
npx sentry-cli projects list

# Create a new release
npx sentry-cli releases new <version>

# Upload source maps
npx sentry-cli releases files <version> upload-sourcemaps <path>

# Set release as deployed
npx sentry-cli releases deploys <version> new -e <environment>

# List releases
npx sentry-cli releases list

# Upload debug symbols (for native code)
npx sentry-cli upload-dsym

# Monitor release health
npx sentry-cli releases deploys <version> list
```

## 📊 Monitoring Dashboard

Your Sentry dashboard provides:

### Issues Tab
- All errors grouped by type
- Stack traces and context
- User information
- Frequency and trends
- Resolution status

### Performance Tab
- Request timing
- Database query performance
- API latency
- Frontend render times
- User interactions

### Releases Tab
- Error rates by version
- Performance comparison
- Deployment history
- Regression detection

### Settings Tab
- Alert configuration
- Sampling rates
- Integration settings
- Team management
- Data retention policies

## 💡 Best Practices

### 1. Set User Context
Always set user context for personalized error tracking:

```javascript
// Server
sentry.setUser({ id: user.id, username: user.username });

// PWA
sentry.setUser({ id: user.id, username: user.username });
```

### 2. Add Custom Tags
Use tags to categorize errors:

```javascript
sentry.setTag('feature', 'ai-capture');
sentry.setTag('provider', 'openai');
sentry.setTag('route', '/api/v1/capture');
```

### 3. Add Breadcrumbs
Track user actions before errors:

```javascript
sentry.addBreadcrumb({
  category: 'user',
  message: 'Clicked capture button',
  level: 'info',
});
```

### 4. Capture Custom Messages
Log non-error events:

```javascript
sentry.captureMessage('User reached 100 conversations', 'info');
```

### 5. Handle Errors Gracefully
Never rely solely on Sentry for error handling:

```javascript
try {
  // Try operation
} catch (error) {
  sentry.captureException(error);
  // Handle gracefully for users
  return res.status(500).json({ error: 'Internal server error' });
}
```

### 6. Regular Maintenance
- **Weekly**: Review top errors and prioritize fixes
- **Monthly**: Update sampling rates based on costs
- **Per Release**: Check for new errors in deployment
- **Quarterly**: Review alert rules and adjust thresholds

## 🚨 Troubleshooting

### Not Receiving Errors

1. **Check DSN**: Verify DSN is correct in `.env` files
2. **Enable debug mode**: Set `SENTRY_DEBUG=true` to see logs
3. **Check network**: Ensure application can reach Sentry servers
4. **Verify initialization**: Check console for Sentry initialization messages

### Too Many Errors

1. **Reduce sampling**: Lower `SENTRY_TRACES_SAMPLE_RATE`
2. **Ignore common errors**: Add to `ignoreErrors` array
3. **Filter health checks**: Skip in `beforeSend` callback
4. **Use alerts**: Set up alert rules instead of watching dashboard

### Missing Stack Traces

1. **Upload source maps**: For production builds
2. **Check minification**: Ensure source maps match build
3. **Verify config**: Check `attachStacktrace: true`
4. **Debug mode**: Enable to see what's being captured

### Performance Issues

1. **Reduce sampling**: Lower sampling rates
2. **Disable profiling**: Set `SENTRY_PROFILES_SAMPLE_RATE=0`
3. **Filter transactions**: Skip in `beforeTransaction` callback
4. **Monitor costs**: Check Sentry billing regularly

## 📈 Scaling Considerations

### Low Traffic (<1,000 users/day)
- Sampling: 100% (1.0)
- Profiling: Enabled
- Session replay: Enabled
- Cost: Free tier covers this

### Medium Traffic (1,000-10,000 users/day)
- Sampling: 50% (0.5)
- Profiling: Enabled for errors only
- Session replay: 10% sampling
- Cost: May exceed free tier

### High Traffic (>10,000 users/day)
- Sampling: 10% (0.1)
- Profiling: Disabled
- Session replay: 1% sampling
- Cost: Consider paid tier

## 🔗 Resources

- [Sentry Documentation](https://docs.sentry.io/)
- [Sentry CLI Reference](https://docs.sentry.io/cli/)
- [Sentry Pricing](https://sentry.io/pricing/)
- [Sentry Best Practices](https://docs.sentry.io/product/sentry-basics/)

## ✅ Setup Checklist

Use this checklist to ensure complete setup:

- [ ] Sentry account created
- [ ] CLI authenticated (`sentry login`)
- [ ] Server project created in Sentry
- [ ] PWA project created in Sentry
- [ ] Network project created in Sentry
- [ ] DSNs added to all `.env` files
- [ ] Verification script passes (`bun run scripts/verify-sentry-setup.js`)
- [ ] Applications started successfully
- [ ] Test error appears in Sentry dashboard
- [ ] Alert rules configured
- [ ] Source maps configured (production)

---

**Setup Guide Version**: 1.0.0
**Last Updated**: 2026-03-18
**Sentry Version**: 10.44.0

Need help? Check [Sentry Support](https://sentry.io/support/) or review the full setup guide in `SENTRY_SETUP.md`.
