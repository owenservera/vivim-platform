# VIVIM Error Reporting System

## Overview

The VIVIM Error Reporting System provides comprehensive, real-time error tracking across all components of the application (PWA, Server, Network). It offers detailed categorization, automatic error grouping, performance impact tracking, and user journey reconstruction.

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   PWA Frontend  │     │   Server Backend│     │  Network Module │
│                 │     │                 │     │                 │
│ - User Actions  │────▶│ - API Endpoints │◀────│ - P2P Connections│
│ - Sync Errors   │     │ - Database Ops  │     │ - WebRTC        │
│ - UI Errors     │     │ - Auth Errors   │     │ - DHT Operations│
└─────────────────┘     └─────────────────┘     └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │  Centralized Error      │
                    │  Reporting Service      │
                    │                         │
                    │ - Error Grouping        │
                    │ - Deduplication         │
                    │ - Alerting              │
                    │ - Statistics            │
                    └────────────┬────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │   Error Dashboard       │
                    │   /errors               │
                    └─────────────────────────┘
```

## Features

### 1. Comprehensive Error Categorization

**Error Levels:**
- `debug` - Detailed diagnostic information
- `info` - General operational information
- `warning` - Potential issues that don't affect functionality
- `error` - Errors that affect functionality
- `critical` - Severe errors requiring immediate attention
- `fatal` - System-crashing errors

**Error Components:**
- `pwa` - Frontend application errors
- `network` - P2P and network layer errors
- `server` - Backend server errors
- `shared` - Errors in shared code
- `api` - API endpoint errors
- `database` - Database operation errors
- `auth` - Authentication/authorization errors
- `sync` - Data synchronization errors

**Error Categories:**
- `runtime` - Runtime exceptions and crashes
- `network` - Network connectivity issues
- `database` - Database query/operation failures
- `validation` - Input validation failures
- `authentication` - Login/auth token failures
- `authorization` - Permission check failures
- `sync` - Data synchronization conflicts
- `storage` - Local storage failures
- `api` - API request/response failures
- `ui` - User interface rendering errors
- `performance` - Performance degradation
- `security` - Security-related incidents
- `configuration` - Configuration errors

### 2. Automatic Error Grouping

Errors are automatically grouped by fingerprint, which is generated based on:
- Error component
- Error category
- Error message (first line)
- Source file name
- Function name

This allows you to see error trends and identify recurring issues.

### 3. Performance Impact Tracking

The system automatically tracks:
- Memory usage
- CPU usage
- Network latency
- Response times
- Render times

Performance issues are automatically reported when thresholds are exceeded.

### 4. User Journey Reconstruction

Every user action is tracked, allowing you to reconstruct the sequence of events leading up to an error:

```javascript
// Track user actions
errorReporter.trackUserAction('clicked_capture_button', { url: '...' });
errorReporter.trackUserAction('started_recording', { duration: 120 });
```

### 5. Real-time Alerting

Critical errors trigger automatic alerts through configured channels:
- Email notifications
- Slack webhooks
- Custom webhooks
- SMS (for critical issues)

Alert thresholds are configurable per error type.

## Usage

### In PWA (React Components)

```typescript
import { useErrorReporting } from './hooks/use-error-reporting';

function MyComponent() {
  const { 
    reportAppError, 
    reportSyncError, 
    reportAuthError 
  } = useErrorReporting({ 
    component: 'MyComponent',
    userId: user?.id 
  });

  const handleError = async (error) => {
    await reportAppError(
      'Failed to load data',
      'data-loading',
      error,
      { endpoint: '/api/data' },
      'high'
    );
  };

  // ... component logic
}
```

### In Server Routes

```javascript
import { asyncHandler, apiErrorHandler } from './middleware/error-handlers.js';
import { serverErrorReporter } from './utils/server-error-reporting.js';

// Using async handler wrapper
router.get('/data', asyncHandler(async (req, res) => {
  const data = await getData();
  res.json({ success: true, data });
}));

// Manual error reporting
router.post('/process', asyncHandler(async (req, res) => {
  try {
    const result = await processSomething(req.body);
    res.json({ success: true, result });
  } catch (error) {
    await serverErrorReporter.reportAPIError(
      '/process',
      'POST',
      500,
      error,
      { requestBody: req.body },
      'high',
      req.id
    );
    throw error; // Let the error handler send the response
  }
}));
```

### In Network Module

```typescript
import { networkErrorReporter } from './utils/error-reporter';

async function connectToPeer(peerId: string) {
  try {
    await connection.connect(peerId);
  } catch (error) {
    await networkErrorReporter.reportP2PError(
      'Failed to connect to peer',
      error,
      { peerId, connectionType: 'webrtc' },
      'high'
    );
    throw error;
  }
}
```

## API Endpoints

### Error Collection

**POST /api/v1/errors**

Receives error reports from all clients.

Request body:
```json
{
  "reports": [
    {
      "id": "err_1234567890_abc123",
      "timestamp": "2026-02-16T12:00:00.000Z",
      "level": "error",
      "component": "pwa",
      "category": "runtime",
      "source": "client",
      "message": "Failed to load data",
      "stack": "Error: Failed to load data\n    at ...",
      "context": {
        "endpoint": "/api/data",
        "method": "GET",
        "statusCode": 500,
        "userId": "user123",
        "sessionId": "session456"
      },
      "severity": "high",
      "fingerprint": "abc123"
    }
  ],
  "metadata": {
    "clientTime": "2026-02-16T12:00:00.000Z",
    "timezone": "America/New_York",
    "language": "en-US"
  }
}
```

### Error Statistics

**GET /api/v1/errors/stats**

Returns aggregated error statistics.

Response:
```json
{
  "success": true,
  "data": {
    "total": 1000,
    "byLevel": {
      "error": 500,
      "warning": 300,
      "info": 200
    },
    "byComponent": {
      "pwa": 400,
      "server": 300,
      "network": 300
    },
    "bySeverity": {
      "critical": 50,
      "high": 200,
      "medium": 400,
      "low": 350
    },
    "recent": 50,
    "trending": [...],
    "topErrors": [...]
  }
}
```

### Recent Errors

**GET /api/v1/errors/recent**

Returns recent errors with filtering options.

Query parameters:
- `hours` - Number of hours to look back (default: 24)
- `limit` - Maximum number of errors to return (default: 100)
- `component` - Filter by component (pwa, server, network, etc.)
- `severity` - Filter by severity (low, medium, high, critical)
- `category` - Filter by category (runtime, network, database, etc.)

### All Errors (Admin)

**GET /api/v1/errors**

Returns all errors with filtering options. Requires admin authentication in production.

### Clear Errors (Admin)

**DELETE /api/v1/errors/clear**

Clears all stored errors. Requires admin authentication in production.

## Error Dashboard

Access the error dashboard at `/errors` in the PWA.

Features:
- Real-time error statistics
- Filterable error list
- Error details with stack traces
- User journey reconstruction
- Performance metrics
- Trending errors

## Configuration

### Environment Variables

```bash
# Error reporting endpoint
ERROR_REPORTING_ENDPOINT=/api/v1/errors

# Error reporting settings
ERROR_REPORTING_BUFFER_SIZE=10
ERROR_REPORTING_FLUSH_INTERVAL=5000
ERROR_REPORTING_MAX_RETRIES=3
ERROR_REPORTING_SAMPLE_RATE=100  # Percentage (0-100)
ERROR_REPORTING_ALERT_THRESHOLD=10  # Errors before alerting

# Alert channels
ALERT_EMAIL=alerts@example.com
ALERT_SLACK_WEBHOOK=https://hooks.slack.com/...
ALERT_WEBHOOK_URL=https://example.com/alerts
```

### Runtime Configuration

```typescript
import { ErrorReporter } from './common/error-reporting';

const reporter = ErrorReporter.getInstance({
  endpoint: '/api/v1/errors',
  bufferSize: 10,
  flushInterval: 5000,
  maxRetries: 3,
  enabled: true,
  sampleRate: 100,
  alertThreshold: 10,
  userId: 'user123',
  sessionId: 'session456',
  environment: 'development',
  version: '1.0.0'
});

// Update configuration
reporter.setUserId('newUserId');
reporter.setSessionId('newSessionId');
reporter.setEnabled(false); // Disable reporting
reporter.setVersion('1.0.1');
```

## Best Practices

### 1. Always Include Context

```typescript
// ❌ Bad
await reportError('Failed to load', 'pwa', 'runtime', error);

// ✅ Good
await reportError('Failed to load user data', 'pwa', 'runtime', error, {
  endpoint: '/api/users/me',
  method: 'GET',
  userId: user.id,
  attemptCount: retryCount
}, 'high');
```

### 2. Use Appropriate Severity Levels

- `low` - Minor issues, no user impact
- `medium` - Noticeable issues, workaround available
- `high` - Significant issues, functionality impaired
- `critical` - Severe issues, functionality broken
- `fatal` - System crash, data loss

### 3. Track User Actions

```typescript
// Track important user actions for journey reconstruction
errorReporter.trackUserAction('started_upload', { fileSize: 1024000 });
errorReporter.trackUserAction('completed_upload', { duration: 5000 });
```

### 4. Report Performance Issues

```typescript
// Report slow operations
if (responseTime > 5000) {
  await errorReporter.reportPerformanceIssue(
    'response_time',
    responseTime,
    5000,
    { endpoint: '/api/heavy-operation' },
    'medium'
  );
}
```

### 5. Report Security Issues

```typescript
// Report suspicious activities
await errorReporter.reportSecurityIssue('unauthorized_access', {
  ip: req.ip,
  endpoint: '/api/admin',
  method: req.method,
  userAgent: req.get('User-Agent')
});
```

## Troubleshooting

### Errors Not Being Reported

1. Check if error reporting is enabled: `reporter.setEnabled(true)`
2. Verify the endpoint is correct
3. Check network connectivity
4. Review sample rate configuration

### Too Many Alerts

1. Increase the alert threshold: `alertThreshold: 50`
2. Reduce the sample rate: `sampleRate: 50`
3. Adjust severity levels for non-critical errors

### Performance Impact

The error reporting system is designed to have minimal performance impact:
- Errors are buffered and sent asynchronously
- Sampling reduces the number of reports
- Failed sends are retried with exponential backoff
- Memory usage is bounded by buffer size

## Security Considerations

1. **Sensitive Data**: The system automatically redacts sensitive fields from request bodies
2. **Rate Limiting**: Error reporting endpoints are rate-limited to prevent abuse
3. **Authentication**: Admin endpoints require authentication in production
4. **Data Retention**: Errors are automatically pruned after reaching max storage

## Future Enhancements

- [ ] Integration with external monitoring services (Sentry, Datadog)
- [ ] Custom error dashboards per team
- [ ] Automated error resolution suggestions
- [ ] Machine learning-based anomaly detection
- [ ] Real-time error collaboration features