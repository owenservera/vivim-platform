# Sentry Integration Guide for VIVIM

This guide explains how Sentry is integrated across the VIVIM monorepo for comprehensive error tracking and performance monitoring.

## Overview

Sentry is integrated across all components:
- **Server**: Node.js/Express backend with profiling
- **PWA**: React frontend with performance monitoring
- **Network**: P2P network engine with error tracking
- **SDK**: TypeScript SDK (can be extended)

## Quick Start

### 1. Create a Sentry Project

1. Go to [sentry.io](https://sentry.io/)
2. Create a new organization (if needed)
3. Create a new project for each component:
   - VIVIM Server (Node.js)
   - VIVIM PWA (React)
   - VIVIM Network (Node.js)

### 2. Configure Environment Variables

Copy the appropriate `.env.example` file to `.env` and update with your Sentry DSN:

#### Root Environment
```bash
cp .env.example .env
```

Update in `.env`:
```env
SENTRY_DSN=https://your-dsn@sentry.io/project-id
SENTRY_RELEASE=vivim-server@1.0.0
SENTRY_ENVIRONMENT=development
SENTRY_TRACES_SAMPLE_RATE=0.1
SENTRY_PROFILES_SAMPLE_RATE=0.1
SENTRY_DEBUG=false
```

#### PWA Environment
```bash
cd pwa
cp .env.example .env
```

Update in `pwa/.env`:
```env
VITE_SENTRY_DSN=https://your-dsn@sentry.io/project-id
VITE_SENTRY_RELEASE=vivim-pwa@1.0.0
VITE_SENTRY_DEBUG=false
```

#### Network Environment
```bash
cd network
cp .env.example .env
```

Update in `network/.env`:
```env
SENTRY_DSN=https://your-dsn@sentry.io/project-id
SENTRY_RELEASE=vivim-network@0.1.0
SENTRY_ENVIRONMENT=development
SENTRY_TRACES_SAMPLE_RATE=0.1
SENTRY_DEBUG=false
```

### 3. Start Your Applications

```bash
# Start all services
bun run dev

# Or start individually
cd server && bun run dev
cd pwa && bun run dev
cd network && bun run dev
```

Sentry will automatically initialize and start tracking errors and performance.

## Architecture

### Server Integration

**Location**: `server/src/lib/sentry.js`

**Features**:
- Error tracking with stack traces
- Performance monitoring (traces)
- CPU profiling (optional)
- Express middleware integration
- Request/response data capture
- Sensitive data filtering

**Integrations**:
- `@sentry/node` - Core error tracking
- `@sentry/profiling-node` - CPU performance profiling
- Express middleware for request tracing
- Prisma integration for database queries

**Usage**:
```javascript
import sentry from './lib/sentry.js';

// Capture errors
try {
  // your code
} catch (error) {
  sentry.captureException(error);
}

// Set user context
sentry.setUser({ id: 'user-123', username: 'john' });

// Add custom context
sentry.setContext('feature', { feature_name: 'ai-capture' });
```

### PWA Integration

**Location**: `pwa/src/lib/sentry.ts`

**Features**:
- Client-side error tracking
- Performance monitoring (browser traces)
- React Router integration
- Console error capture
- HTTP request tracking
- Sensitive data filtering

**Integrations**:
- `@sentry/react` - React-specific error tracking
- Browser tracing for performance
- React Router v6 instrumentation

**Usage**:
```typescript
import sentry from './lib/sentry';

// Capture errors
try {
  // your code
} catch (error) {
  sentry.captureException(error);
}

// Set user context
sentry.setUser({ id: 'user-123', username: 'john' });

// Performance measurement
sentry.startPerformanceMeasurement('button-click');
```

### Network Integration

**Location**: `network/src/lib/sentry.ts`

**Features**:
- P2P operation error tracking
- Network performance monitoring
- WebSocket error capture
- Libp2p integration

**Usage**:
```typescript
import sentry from './lib/sentry';

// Capture P2P errors
try {
  await libp2p.dial(peerId);
} catch (error) {
  sentry.captureException(error);
  sentry.setContext('p2p', { peerId: peerId.toString() });
}
```

## Configuration

### Environment Variables

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `SENTRY_DSN` | string | - | Your Sentry DSN (required) |
| `SENTRY_RELEASE` | string | auto | Release version identifier |
| `SENTRY_ENVIRONMENT` | string | `NODE_ENV` | Environment name |
| `SENTRY_TRACES_SAMPLE_RATE` | float | 0.1 | Performance sampling rate (0-1) |
| `SENTRY_PROFILES_SAMPLE_RATE` | float | 0.1 | Profiling sampling rate (0-1) |
| `SENTRY_DEBUG` | boolean | false | Enable debug logging |

### Sampling Rates

**Development**: 100% (1.0) - Capture all traces for debugging
**Production**: 10% (0.1) - Sample 10% to reduce costs while maintaining insights

Adjust based on your needs:
- Higher sampling = More detailed performance data, higher costs
- Lower sampling = Less detail, lower costs

## Features

### Error Tracking

- Automatic error capture from unhandled exceptions
- Stack trace aggregation
- Source map integration (for production builds)
- Error grouping and alerting

### Performance Monitoring

- Distributed tracing across services
- Request/response timing
- Database query performance
- P2P operation performance
- Frontend render performance

### Sensitive Data Protection

Automatic filtering of:
- Authorization headers
- Session cookies
- API keys
- User emails
- IP addresses
- Session IDs

Customize in `beforeSend` callbacks if needed.

### Release Tracking

Track errors by release:
```env
SENTRY_RELEASE=vivim-server@1.0.0
```

Or generate automatically:
```bash
export SENTRY_RELEASE=$(git describe --tags --always)
```

## Monitoring & Debugging

### View Errors in Sentry

1. Go to your Sentry project
2. Navigate to **Issues** for error reports
3. Navigate to **Performance** for traces and metrics
4. Navigate to **Releases** for deployment tracking

### Debug Mode

Enable debug mode to see detailed Sentry logs:
```env
SENTRY_DEBUG=true
```

This will print detailed information to console about what Sentry is capturing.

### Test Integration

To test if Sentry is working:

```bash
# Server
curl http://localhost:3000/api/v1/health

# This should appear in Sentry if configured
```

Or manually trigger an error:
```javascript
// In any component
import sentry from './lib/sentry';
sentry.captureException(new Error('Test error'));
```

## Best Practices

### 1. Use Appropriate Sampling Rates

- Development: 100% for debugging
- Staging: 50% for testing
- Production: 10-20% for cost-effectiveness

### 2. Set Release Versions

Always tag releases to track errors by deployment:
```bash
export SENTRY_RELEASE=vivim-server@$(git describe --tags --always)
```

### 3. Add Context

Provide context to help debug issues:
```javascript
sentry.setContext('feature', {
  feature_name: 'ai-capture',
  provider: 'openai',
  model: 'gpt-4'
});

sentry.setUser({
  id: user.id,
  username: user.username,
  // Note: email is filtered automatically
});
```

### 4. Handle Errors Gracefully

Sentry is a monitoring tool, not a replacement for error handling:
```javascript
try {
  // Try operation
} catch (error) {
  sentry.captureException(error);
  // Handle error gracefully for users
  return res.status(500).json({ error: 'Internal server error' });
}
```

### 5. Use Source Maps

For production, upload source maps for better stack traces:
```bash
# Server
cd server
sentry-cli releases files <release> upload-sourcemaps dist/

# PWA
cd pwa
sentry-cli releases files <release> upload-sourcemaps dist/
```

## Troubleshooting

### Sentry Not Receiving Errors

1. Check DSN is correct
2. Enable debug mode: `SENTRY_DEBUG=true`
3. Check network connectivity
4. Verify environment variables are loaded

### Too Many Errors

1. Reduce sampling rates
2. Add to `ignoreErrors` array
3. Use `beforeSend` callback to filter

### Missing Stack Traces

1. Ensure source maps are uploaded (production)
2. Check if `attachStacktrace: true` is set
3. Verify build process generates source maps

### Performance Issues

1. Reduce sampling rates
2. Disable profiling if not needed
3. Filter unnecessary breadcrumbs

## Advanced Configuration

### Custom Integrations

Add custom Sentry integrations in the config:

```javascript
import { rewriteFramesIntegration } from '@sentry/react';

Sentry.init({
  integrations: [
    rewriteFramesIntegration({
      root: process.cwd(),
    }),
  ],
});
```

### Custom Filters

Filter specific errors:

```javascript
ignoreErrors: [
  'Specific error message',
  /^RegExp pattern$/,
],
```

### Alert Rules

Set up alerts in Sentry:
1. Go to **Settings → Alerts**
2. Create alert rules for:
   - New errors
   - Error rate increases
   - Performance regressions
   - Service health

## Security Considerations

- **DSN**: Keep DSN in environment variables, not in code
- **Data**: Sensitive data is automatically filtered
- **Access**: Restrict Sentry access to authorized team members
- **Compliance**: Configure data retention policies in Sentry

## Support

- [Sentry Documentation](https://docs.sentry.io/)
- [Sentry Node.js SDK](https://docs.sentry.io/platforms/node/)
- [Sentry React SDK](https://docs.sentry.io/platforms/react/)

## Next Steps

1. Configure your Sentry DSN in environment variables
2. Test error reporting
3. Set up alert rules
4. Configure release tracking
5. Integrate with CI/CD for automatic releases
6. Review and adjust sampling rates based on traffic

---

**Version**: 1.0.0
**Last Updated**: 2026-03-18
**Maintainer**: VIVIM Team
