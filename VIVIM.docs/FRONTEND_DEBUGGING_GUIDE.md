# Frontend Debugging System - Quick Start Guide

## Accessing the Debug Panel

### Method 1: Bottom Navigation Bar (Recommended)
1. Look for the **Bug icon** in the bottom navigation bar (rightmost position)
2. Click the **Debug** button
3. The debug panel will slide in from the right

### Method 2: Keyboard Shortcut
Press `Ctrl+Shift+D` (or `Cmd+Shift+D` on Mac) to toggle the debug panel

### Method 3: Programmatic Access
```javascript
// Open debug panel from anywhere in the app
window.dispatchEvent(new CustomEvent('openscroll:open-debug'));
```

## Debug Panel Features

### 1. Live Log Stream
- **Real-time logging** from all parts of the application
- **Color-coded** log levels (trace, debug, info, warn, error)
- **Component badges** showing source (API, Service, Component, Store, Sync, Network)
- **Expandable entries** - click to see full details

### 2. Filtering Controls

**Source Filter:**
- **Both** - Show all logs
- **Client** - Show only client-side logs (components, stores)
- **Server** - Show only server-side logs (API, network)

**Level Filter:**
- **ALL** - Show all log levels
- **TRC** - Trace only
- **DBG** - Debug only
- **INF** - Info only
- **WRN** - Warning only
- **ERR** - Error only

**Search:**
- Filter logs by message text
- Search by module name
- Search by component type

### 3. Playback Controls

- **Pause/Resume** - Freeze the log stream to inspect entries
- **Clear** - Remove all logs from the buffer
- **Download** - Export logs as JSON file
- **Auto-scroll** - Toggle automatic scrolling to newest logs

### 4. Zen Mode
Click the minimize/maximize icon to toggle between:
- **Full-screen mode** - Panel covers entire screen
- **Side panel mode** - Panel slides in from right (400px wide)

### 5. Performance Stats
Header displays real-time metrics:
- **Client logs count** (green)
- **Server logs count** (purple)
- **Error count** (red)

## Using the Unified Debug Service

### Basic Logging

```typescript
import { debug } from './lib/unified-debug-service';

// Trace - Very detailed diagnostic info
debug.trace('Router', 'Route matched', { path: '/users', params: { id: 1 } });

// Debug - Debugging information
debug.debug('API', 'Request started', { endpoint: '/api/users', method: 'GET' });

// Info - General operational info
debug.info('Auth', 'User logged in', { userId: user.id, method: 'google' });

// Warn - Potential issues
debug.warn('Storage', 'Storage quota nearly exceeded', { used: 4.8, limit: 5 });

// Error - Actual errors
debug.error('Database', 'Query failed', error, { query: sql, params });
```

### Data Flow Tracking

Track the complete journey of data through your application:

```typescript
import { debug } from './lib/unified-debug-service';

async function fetchData(endpoint: string) {
  // Start a new flow
  const requestId = debug.startFlow();
  
  try {
    // Track each step
    debug.trackStep(requestId, 'request', 'pending', { endpoint });
    const response = await fetch(endpoint);
    debug.trackStep(requestId, 'request', 'success', { status: response.status });
    
    debug.trackStep(requestId, 'validation', 'pending');
    const data = await response.json();
    debug.trackStep(requestId, 'validation', 'success', { size: data.length });
    
    debug.trackStep(requestId, 'processing', 'pending');
    const processed = processData(data);
    debug.trackStep(requestId, 'processing', 'success', { resultSize: processed.length });
    
    debug.trackStep(requestId, 'database', 'pending', { operation: 'INSERT' });
    await saveToDatabase(processed);
    debug.trackStep(requestId, 'database', 'success', { rowsAffected: 1 });
    
    debug.trackStep(requestId, 'response', 'success', { duration: Date.now() - startTime });
    
    return processed;
  } catch (error) {
    debug.trackStep(requestId, 'error', 'error', {}, error.message);
    throw error;
  }
}
```

### Automatic Flow Tracking

Use helper methods for automatic tracking:

```typescript
import { unifiedDebugService } from './lib/unified-debug-service';

// Track API requests automatically
const users = await unifiedDebugService.trackApiRequest(
  '/api/users',
  'GET',
  async () => {
    const response = await fetch('/api/users');
    return response.json();
  },
  { filters: { status: 'active' } }
);

// Track database operations automatically
const result = await unifiedDebugService.trackDatabaseOperation(
  'INSERT',
  'users',
  async () => {
    return await db.user.create({ data: userData });
  },
  { query: userData }
);
```

### Performance Monitoring

```typescript
import { unifiedDebugService } from './lib/unified-debug-service';

// Get current performance metrics
const metrics = unifiedDebugService.getPerformanceMetrics();
console.log('Memory Usage:', metrics.memoryUsage);
console.log('Network Latency:', metrics.networkLatency);
console.log('Response Time:', metrics.responseTime);

// Report performance issues
if (responseTime > 5000) {
  debug.warn('Performance', 'Slow response detected', {
    endpoint,
    responseTime,
    threshold: 5000
  });
}
```

### Context Setting

```typescript
import { debug } from './lib/unified-debug-service';

// Set user context (all subsequent logs will include this)
debug.setUserId(user.id);
debug.setSessionId(session.id);

// Now all logs include user and session context
debug.info('Auth', 'User performed action', { action: 'capture' });
```

## Debugging Workflows

### 1. Investigating an Error

1. **Open Debug Panel** - Click the Bug icon in bottom nav
2. **Filter by Error Level** - Click "ERR" button
3. **Expand Error Entry** - Click on the error to see full details
4. **View Stack Trace** - See complete error stack
5. **Check Context** - Review data and context at time of error
6. **Trace Data Flow** - Look for related flow steps
7. **Export Logs** - Download for further analysis

### 2. Tracking a Request

1. **Start Fresh** - Click "Clear" button
2. **Perform Action** - Trigger the request you want to track
3. **Watch Flow** - See each step appear in real-time
4. **Expand Steps** - Click to see details for each step
5. **Check Timing** - Review duration between steps
6. **Identify Bottlenecks** - Look for slow steps

### 3. Performance Analysis

1. **Open Debug Panel** - Click Bug icon
2. **Check Stats** - View memory and request counts
3. **Filter Performance Logs** - Search for "Performance"
4. **Identify Slow Requests** - Look for warnings about slow responses
5. **Monitor Memory** - Watch for high memory usage warnings
6. **Export & Analyze** - Download logs for detailed analysis

### 4. Network Debugging

1. **Filter by Network** - Search for "Network" or "API"
2. **Watch Requests** - See all API calls in real-time
3. **Check Status Codes** - Review response status
4. **Inspect Payloads** - Expand to see request/response data
5. **Monitor Latency** - Check network timing metrics

## Tips & Tricks

### 1. Quick Access
- Keep the debug panel open in Zen mode during development
- Use the pause button to freeze logs while inspecting
- Search for specific modules or endpoints

### 2. Efficient Filtering
- Use search to find specific errors: "Failed to"
- Filter by component: "API" or "Database"
- Combine filters for precise results

### 3. Log Export
- Export logs before clearing
- Include timestamp in filename for tracking
- Share exported logs with team for collaboration

### 4. Performance
- Clear logs periodically to reduce memory usage
- Use pause mode when investigating specific issues
- Disable auto-scroll when reviewing historical logs

### 5. Data Flow Visualization
- Always start flows with `debug.startFlow()`
- Track every step with meaningful names
- Include relevant data in each step
- Always end with success or error step

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Shift+D` | Toggle debug panel |
| `Ctrl+Shift+C` | Clear logs |
| `Ctrl+Shift+P` | Pause/Resume |
| `Ctrl+Shift+E` | Export logs |
| `Escape` | Close panel (when focused) |

## Common Use Cases

### API Debugging
```typescript
// Before API call
debug.debug('API', 'Request initiated', { endpoint, method, data });

// After response
debug.info('API', 'Request completed', { 
  endpoint, 
  status: response.status, 
  duration 
});

// On error
debug.error('API', 'Request failed', error, { 
  endpoint, 
  status: response?.status,
  responseData 
});
```

### State Management Debugging
```typescript
// Before state update
debug.trace('Store', 'State update started', { 
  store: 'user', 
  action: 'SET_NAME',
  payload 
});

// After state update
debug.debug('Store', 'State updated', { 
  store: 'user',
  previousState,
  newState 
});
```

### Sync Debugging
```typescript
// Start sync flow
const syncId = debug.startFlow();

// Track sync steps
debug.trackStep(syncId, 'sync', 'pending', { direction: 'push' });
// ... sync operation
debug.trackStep(syncId, 'sync', 'success', { changesPushed: 5 });
```

## Troubleshooting

### Debug Panel Not Opening
1. Check if panel is already open (look for it off-screen)
2. Try keyboard shortcut `Ctrl+Shift+D`
3. Check browser console for errors
4. Reload the page

### Logs Not Appearing
1. Check if paused (yellow indicator)
2. Verify filters aren't too restrictive
3. Clear search box
4. Check if logs were cleared

### Performance Issues
1. Clear logs to free memory
2. Reduce log verbosity
3. Disable auto-scroll
4. Use pause mode

### Data Flow Not Tracking
1. Verify `startFlow()` is called
2. Check requestId is passed correctly
3. Ensure steps are tracked in order
4. Look for errors in flow tracking

## Best Practices

1. **Log Early, Log Often** - More context is better than less
2. **Use Appropriate Levels** - Don't log everything as error
3. **Include Context** - Always add relevant data to logs
4. **Track Flows** - Use data flow tracking for important operations
5. **Clean Up** - Clear logs after resolving issues
6. **Export Important Logs** - Save logs for critical issues
7. **Monitor Performance** - Watch for performance warnings
8. **Share Knowledge** - Export and share logs with team

## Integration Points

The debug system is integrated with:
- **Error Reporting** - Errors are automatically reported
- **Performance Monitoring** - Metrics are tracked automatically
- **Data Flow Tracking** - Flows are visualized in real-time
- **User Journey** - Actions are tracked for reconstruction

## Support

For issues or feature requests:
1. Check the documentation in `VIVIM.docs/UNIFIED_DEBUGGING.md`
2. Export logs and share with the team
3. Create a bug report with steps to reproduce
4. Include exported log file with report
