# Unified Debugging & Data Flow Tracking System

## Overview

The Unified Debugging System merges the existing DebugPanel logging capabilities with the new error reporting system, providing comprehensive step-by-step data flow tracking across the entire application.

## Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                     Debug Panel (UI)                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │ Live Logs   │  │  Filters    │  │  Data Flow Visualizer   │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│              Unified Debug Service                                │
│  ┌──────────────────┐  ┌──────────────────┐  ┌───────────────┐  │
│  │ Logging Engine   │  │ Data Flow Tracker│  │ Performance   │  │
│  │                  │  │                  │  │ Monitoring    │  │
│  │ - trace/debug    │  │ - request flows  │  │ - memory      │  │
│  │ - info/warn      │  │ - API calls      │  │ - CPU         │  │
│  │ - error          │  │ - DB operations  │  │ - network     │  │
│  └──────────────────┘  └──────────────────┘  └───────────────┘  │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│              Error Reporting System                               │
│  ┌──────────────────┐  ┌──────────────────┐  ┌───────────────┐  │
│  │ Error Grouping   │  │ Alerting         │  │ Statistics    │  │
│  └──────────────────┘  └──────────────────┘  └───────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

## Features

### 1. Comprehensive Logging

**Log Levels:**
- `trace` - Detailed diagnostic information for debugging
- `debug` - Debugging information
- `info` - General operational information
- `warn` - Warning conditions that may require attention
- `error` - Error conditions that affect functionality

**Components:**
- `api` - API endpoint operations
- `service` - Business logic services
- `component` - React components
- `store` - State management
- `sync` - Data synchronization
- `network` - Network operations

### 2. Step-by-Step Data Flow Tracking

Track the complete journey of data through your application:

```typescript
import { debug } from './lib/unified-debug-service';

// Start tracking a flow
const requestId = debug.startFlow();

// Track each step
debug.trackStep(requestId, 'request', 'pending', { endpoint: '/api/data' });
// ... make request
debug.trackStep(requestId, 'request', 'success', { statusCode: 200 });

debug.trackStep(requestId, 'validation', 'pending');
// ... validate data
debug.trackStep(requestId, 'validation', 'success');

debug.trackStep(requestId, 'processing', 'pending');
// ... process data
debug.trackStep(requestId, 'processing', 'success', { resultSize: 1024 });

debug.trackStep(requestId, 'database', 'pending', { operation: 'INSERT' });
// ... database operation
debug.trackStep(requestId, 'database', 'success', { rowsAffected: 1 });

debug.trackStep(requestId, 'response', 'success', { duration: 250 });
```

### 3. Automatic Flow Tracking Helpers

```typescript
import { unifiedDebugService } from './lib/unified-debug-service';

// Track API requests automatically
const data = await unifiedDebugService.trackApiRequest(
  '/api/users',
  'GET',
  async () => {
    const response = await fetch('/api/users');
    return response.json();
  },
  { filters: { status: 'active' } }
);

// Track database operations
const users = await unifiedDebugService.trackDatabaseOperation(
  'SELECT',
  'users',
  async () => {
    return await db.user.findMany({ where: { status: 'active' } });
  },
  { query: { status: 'active' } }
);
```

### 4. Performance Monitoring

Automatic monitoring of:
- Memory usage
- CPU usage  
- Network latency
- Response times
- Render times

```typescript
import { unifiedDebugService } from './lib/unified-debug-service';

// Get current performance metrics
const metrics = unifiedDebugService.getPerformanceMetrics();
console.log('Memory:', metrics.memoryUsage);
console.log('Network Latency:', metrics.networkLatency);
console.log('Response Time:', metrics.responseTime);
```

### 5. Real-time Debug Panel

Access the debug panel by:
1. Clicking the debug icon in the bottom navigation
2. Dispatching custom event: `window.dispatchEvent(new CustomEvent('openscroll:open-debug'))`

Features:
- **Live Log Streaming**: Real-time log updates
- **Filtering**: By component (client/server), level, search
- **Zen Mode**: Full-screen debugging
- **Pause/Resume**: Freeze log stream for inspection
- **Auto-scroll**: Automatically scroll to newest logs
- **Export**: Download logs as JSON
- **Clear**: Reset log buffer

## Usage

### Basic Logging

```typescript
import { debug } from './lib/unified-debug-service';

// Simple logging
debug.debug('MyModule', 'Processing started', { data: inputData });
debug.info('MyModule', 'Processing completed', { result });
debug.warn('MyModule', 'Deprecated API used', undefined, new Error('Deprecated'));
debug.error('MyModule', 'Processing failed', error, { inputData });
```

### Context-Aware Logging

```typescript
import { debug } from './lib/unified-debug-service';

// Add user context
debug.setUserId(user.id);
debug.setSessionId(session.id);

// Logs now include user and session context
debug.info('Auth', 'User logged in', { method: 'google' });
```

### Data Flow Tracking

```typescript
import { debug } from './lib/unified-debug-service';

async function fetchData(endpoint: string) {
  const requestId = debug.startFlow();
  
  try {
    debug.trackStep(requestId, 'request', 'pending', { endpoint });
    
    const response = await fetch(endpoint);
    debug.trackStep(requestId, 'request', 'success', { 
      status: response.status 
    });
    
    const data = await response.json();
    debug.trackStep(requestId, 'processing', 'success', { 
      dataSize: data.length 
    });
    
    debug.trackStep(requestId, 'response', 'success');
    
    return data;
  } catch (error) {
    debug.trackStep(requestId, 'error', 'error', {}, error.message);
    throw error;
  }
}
```

### Error Integration

Errors logged with `debug.error()` are automatically reported to the error reporting system with:
- Full stack trace
- Context data
- User journey reconstruction
- Performance metrics at time of error
- Related data flow steps

## Debug Panel UI

### Toolbar Controls

- **Search**: Filter logs by message, module, or component
- **Source Filter**: Toggle between client, server, or both
- **Level Filter**: Show/hide specific log levels
- **Pause/Resume**: Freeze/unfreeze log stream
- **Clear**: Remove all logs
- **Download**: Export logs as JSON file

### Log Entry Details

Click on any log entry to expand and view:
- Full timestamp
- Complete message
- Data payload (formatted JSON)
- Error stack trace (if applicable)
- Context information

### Performance Stats

Header displays real-time statistics:
- Client-side logs count
- Server-side logs count
- Error count

## Best Practices

### 1. Use Appropriate Log Levels

```typescript
// Trace: Very detailed, typically for development only
debug.trace('Router', 'Route matched', { path: '/users', params: { id: 1 } });

// Debug: Debugging information
debug.debug('API', 'Request received', { method: 'GET', path: '/users' });

// Info: General operational information
debug.info('Auth', 'User logged in', { userId: user.id, method: 'google' });

// Warn: Potential issues
debug.warn('Storage', 'Storage quota nearly exceeded', { 
  used: 4.8, 
  limit: 5 
});

// Error: Actual errors
debug.error('Database', 'Query failed', error, { query: sql });
```

### 2. Include Relevant Context

```typescript
// ❌ Bad - Not enough context
debug.error('API', 'Request failed', error);

// ✅ Good - Full context
debug.error('API', 'Request failed', error, {
  endpoint: '/api/users',
  method: 'GET',
  statusCode: response?.status,
  duration: Date.now() - startTime,
  userId: user?.id
});
```

### 3. Track Data Flows

```typescript
// Always track the complete flow of important operations
async function importantOperation() {
  const requestId = debug.startFlow();
  
  try {
    debug.trackStep(requestId, 'request', 'pending');
    // ... operation
    debug.trackStep(requestId, 'request', 'success');
    
    debug.trackStep(requestId, 'validation', 'pending');
    // ... validation
    debug.trackStep(requestId, 'validation', 'success');
    
    debug.trackStep(requestId, 'response', 'success');
  } catch (error) {
    debug.trackStep(requestId, 'error', 'error', {}, error.message);
    throw error;
  }
}
```

### 4. Use Helper Methods

```typescript
// Instead of manual tracking, use helpers
const data = await unifiedDebugService.trackApiRequest(
  '/api/data',
  'GET',
  () => fetchData(),
  { metadata: 'here' }
);

// This automatically tracks:
// - Request start/end
// - Validation
// - Processing
// - Response
// - Errors
// - Performance metrics
```

### 5. Monitor Performance

```typescript
// Report performance issues automatically
if (responseTime > 5000) {
  debug.warn('Performance', 'Slow response detected', {
    endpoint,
    responseTime,
    threshold: 5000
  });
}
```

## Configuration

```typescript
import { UnifiedDebugService } from './lib/unified-debug-service';

const debugService = UnifiedDebugService.getInstance({
  // Maximum logs to keep in memory
  maxLogs: 2000,
  
  // Enable/disable features
  enableDataFlowTracking: true,
  enablePerformanceMetrics: true,
  enableNetworkMonitoring: true,
  enableDatabaseMonitoring: true,
  
  // Error reporting integration
  endpoint: '/api/v1/errors',
  bufferSize: 10,
  flushInterval: 5000,
  sampleRate: 100, // Percentage of errors to report
  
  // Context
  userId: user.id,
  sessionId: session.id,
  environment: 'development',
  version: '1.0.0'
});
```

## Troubleshooting

### Logs Not Appearing

1. Check if debug service is enabled: `debugService.setEnabled(true)`
2. Verify listener is registered
3. Check browser console for errors

### Performance Issues

1. Reduce `maxLogs` configuration
2. Lower `sampleRate` for error reporting
3. Disable unnecessary monitoring features

### Data Flow Not Tracking

1. Ensure `enableDataFlowTracking` is true
2. Verify `requestId` is passed correctly
3. Check that steps are tracked in order

## Integration with Existing Systems

### Legacy Logger Migration

```typescript
// Old code
import { logger } from './lib/logger';
logger.info('MyModule', 'Message');

// New code
import { debug } from './lib/unified-debug-service';
debug.info('MyModule', 'Message');
```

### Error Reporting Integration

All errors logged with `debug.error()` are automatically reported to the error reporting system with full context and data flow information.

```typescript
// This will both log locally AND report to error system
debug.error('API', 'Request failed', error, { endpoint: '/api/data' });
```

## API Reference

### Core Methods

| Method | Description |
|--------|-------------|
| `trace(module, message, data?, context?)` | Log trace level |
| `debug(module, message, data?, context?)` | Log debug level |
| `info(module, message, data?, context?)` | Log info level |
| `warn(module, message, data?, error?, context?)` | Log warn level |
| `error(module, message, error?, data?, context?)` | Log error level |

### Data Flow Methods

| Method | Description |
|--------|-------------|
| `startFlow(requestId?)` | Start tracking a new flow |
| `trackStep(requestId, step, status, data?, error?)` | Track a flow step |
| `getFlow(requestId)` | Get flow tracker |
| `getAllFlows()` | Get all flow trackers |
| `clearFlows()` | Clear all flow trackers |

### Utility Methods

| Method | Description |
|--------|-------------|
| `addListener(listener)` | Add log listener |
| `getLogs()` | Get all logs |
| `clearLogs()` | Clear all logs |
| `exportLogs()` | Export logs as JSON string |
| `downloadLogs(filename?)` | Download logs as file |
| `getMetrics()` | Get performance metrics |
| `setUserId(userId)` | Set user context |
| `setSessionId(sessionId)` | Set session context |
| `setEnabled(enabled)` | Enable/disable logging |
