# DETAILED IMPROVEMENT PROMPT FOR VIVIM SERVER

## SYSTEM IMPROVEMENT OBJECTIVE

**Primary Goal**: Transform the VIVIM server into a robust, fully functional system with hyper-atomic error reporting and debugging capabilities integrated into all existing services.

**Constraints**:

- Focus on functionality and debugging only
- Do NOT add security features (leave for later)
- Integrate seamlessly with existing architecture
- Maintain dev-mode simplicity

---

## SECTION 1: HYPER-ATOMIC ERROR REPORTING SYSTEM

### 1.1 Create Unified Error Classification System

Create `src/lib/error-classifier.js` that provides granular error categorization:

```javascript
/**
 * Error Classification Categories
 * Level 1: System Errors (database, network, infrastructure)
 * Level 2: Service Errors (business logic failures)
 * Level 3: Data Errors (validation, transformation, schema)
 * Level 4: User Errors (invalid input, missing required fields)
 * Level 5: External Errors (provider timeouts, API failures)
 */
```

**Integration Points**:

- Wrap all Prisma operations
- Wrap all extractor functions
- Wrap all service methods
- Wrap all route handlers

### 1.2 Create Debug Reporter Service (`src/services/debug-reporter.js`)

**Purpose**: Ultra-granular debugging with full context capture

**Required Features**:

```javascript
/**
 * DebugReporter - Hyper-atomic debugging
 *
 * Captures:
 * - Full stack traces with source maps
 * - Request/response payloads (sanitized)
 * - Database query details
 * - Timing metrics (wall clock, CPU, memory delta)
 * - State snapshots at error point
 * - Environment context
 * - Previous operations in chain
 */

class DebugReporter {
  // Error tracking
  trackError(error, context)    // Full error with context
  trackWarning(warning, context) // Non-critical issues
  trackInfo(info, context)       // Important events

  // Performance tracking
  trackQuery(query, duration, resultCount)
  trackExternalCall(provider, duration, status)
  trackExtraction(provider, url, duration, messageCount)
  trackSyncOperation(operation, entityCount)

  // State debugging
  captureState(label, state)     // Full state snapshot
  captureMemoryUsage()           // Current heap usage
  captureDatabaseConnections()   // Active connection count

  // Chain tracking
  startOperationChain(id)
  addToChain(operation, metadata)
  endChain(result)
}
```

**Output Destinations**:

- Console with structured formatting
- File-based logging (`logs/debug/`)
- In-memory ring buffer for last N events

### 1.3 Integrate Error Reporting into Existing Services

#### 1.3.1 Database Layer (`src/lib/database.js`)

```javascript
// Add to getPrismaClient():
- Track slow queries (>50ms threshold, configurable)
- Log connection pool status
- Report query failures with full context

// Add to checkDatabaseHealth():
- Connection latency
- Active connections count
- Pending queries
- Database size
```

#### 1.3.2 Capture Service (`src/routes/capture.js`)

```javascript
// Wrap extractConversation():
- Provider detection result
- Extraction duration
- Message count extracted
- Content validation results
- Cache hit/miss status

// Wrap saveConversationUnified():
- Storage engine used
- Save duration
- Record counts
- Validation errors

// Wrap quantum tunnel:
- Encryption/decryption success
- Key exchange duration
- Payload size
- Protocol errors
```

#### 1.3.3 Sync Service (`src/services/sync-service.js`)

```javascript
// Wrap recordOperation():
- HLC timestamp generated
- Entity type and ID
- Operation type (INSERT/UPDATE/DELETE)
- Conflict detection results
- Vector clock state

// Wrap getOperationsSince():
- Query duration
- Operations returned
- Gap detection
- Timestamp comparisons
```

#### 1.3.4 Account Lifecycle (`src/services/account-lifecycle-service.js`)

```javascript
// Wrap all lifecycle operations:
- Account status transitions
- Deletion queue processing
- Hard delete operations
- Suspension/ban operations

// Track:
- Grace period calculations
- Cascading deletes
- Data anonymization results
```

#### 1.3.5 Portability Service (`src/services/portability-service.js`)

```javascript
// Wrap export operations:
- Export format conversion
- Data gathering duration per entity
- File size generated
- Progress percentage accuracy
- Expiration scheduling

// Wrap migration operations:
- Step-by-step progress
- Data transfer verification
- Rollback state
```

#### 1.3.6 Identity Service (`src/routes/identity.js` and `identity-v2.js`)

```javascript
// Wrap verification flows:
- Code generation and storage
- Email/SMS delivery status (mock in dev)
- Credential issuance
- Device registration

// Wrap DID operations:
- Resolution duration
- Cache hit/miss
- Document parsing results
```

#### 1.3.7 Social Service (`src/services/social-service.ts`)

```javascript
// Wrap relationship operations:
- Friend request processing
- Follow/unfollow operations
- Group membership changes
- Team channel messaging

// Track:
- Transaction boundaries
- Permission checks (for debugging)
- Cascade operations
```

---

## SECTION 2: DEBUGGING DASHBOARD ENDPOINTS

### 2.1 Create Debug Routes (`src/routes/debug.js`)

```javascript
/**
 * GET /api/v1/debug/status
 * Returns:
 * - Server uptime
 * - Memory usage (heap, rss, external)
 * - Active connections
 * - Request counts
 * - Error counts by category
 */

/**
 * GET /api/v1/debug/errors
 * Returns:
 * - Last N errors with full context
 * - Filterable by category, service, timestamp
 * - Includes stack traces
 */

/**
 * GET /api/v1/debug/performance
 * Returns:
 * - Slowest queries
 * - Slowest external calls
 * - Slowest extractions
 * - Average durations by operation type
 */

/**
 * GET /api/v1/debug/state/:entityType/:entityId
 * Returns:
 * - Current state of entity
 * - Related entities
 * - Audit trail
 * - Recent operations
 */

/**
 * POST /api/v1/debug/inspect/:service
 * Returns:
 * - Service internal state
 * - Configuration
 * - Active operations
 * - Connection pool status
 */
```

---

## SECTION 3: COMPREHENSIVE TESTING UTILITIES

### 3.1 Create Test Helpers (`src/lib/test-helpers.js`)

```javascript
/**
 * Database fixtures
 * - createTestUser(overrides)
 * - createTestConversation(userId, messageCount)
 * - createTestACU(authorDid)
 * - createTestSyncOperation(userId)
 *
 * Mock providers
 * - mockProviderResponse(provider, messages)
 * - simulateProviderError(provider, errorType)
 *
 * Debug helpers
 * - dumpDatabaseState()
 * - dumpUserData(userId)
 * - dumpSyncState(deviceDid)
 */
```

---

## SECTION 4: LOGGING ENHANCEMENTS

### 4.1 Structured Logging (`src/lib/logger.js` enhancement)

```javascript
// Add correlation IDs to all requests
// Add operation chaining
// Add automatic context enrichment
// Add log level filtering by service
// Add rotation for debug logs
```

---

## SECTION 5: IMPLEMENTATION TASKS

### Task 1: Create Error Classifier

**File**: `src/lib/error-classifier.js`

- Implement error category hierarchy
- Implement severity levels
- Implement automatic categorization

### Task 2: Create Debug Reporter

**File**: `src/services/debug-reporter.js`

- Implement all tracking methods
- Implement ring buffer
- Implement file-based output

### Task 3: Wrap Database Operations

**File**: `src/lib/database.js`

- Add query tracking
- Add slow query logging
- Add connection monitoring

### Task 4: Wrap Capture Routes

**File**: `src/routes/capture.js`

- Add extraction tracking
- Add provider monitoring
- Add sync state tracking

### Task 5: Wrap All Services

- `src/services/sync-service.js`
- `src/services/account-lifecycle-service.js`
- `src/services/portability-service.js`
- `src/services/identity-service.js`
- `src/services/social-service.ts`

### Task 6: Create Debug Endpoints

**File**: `src/routes/debug.js`

- Implement all dashboard endpoints
- Add filtering and pagination

### Task 7: Create Test Helpers

**File**: `src/lib/test-helpers.js`

- Implement fixtures
- Implement mocks
- Implement debug utilities

---

## SECTION 6: SUCCESS CRITERIA

1. **Every error** in the system is classified and tracked with full context
2. **Every database query** is logged with duration and result count
3. **Every external call** (provider extraction) is tracked
4. **Every sync operation** is traceable end-to-end
5. **Debug dashboard** provides real-time system visibility
6. **Test helpers** enable rapid debugging and testing
7. **No silent failures** - all operations report their status
8. **Performance metrics** are collected for all major operations

---

## INTEGRATION EXAMPLES

### Example: Wrapped Extractor Call

```javascript
// BEFORE:
const conversation = await extractConversation(url, options);

// AFTER:
const startTime = Date.now();
let conversation;
try {
  conversation = await extractConversation(url, options);
  debugReporter.trackExtraction({
    provider: detectProvider(url),
    url,
    duration: Date.now() - startTime,
    messageCount: conversation?.messages?.length || 0,
    status: 'success',
  });
} catch (error) {
  debugReporter.trackError(error, {
    provider: detectProvider(url),
    url,
    duration: Date.now() - startTime,
    operation: 'extractConversation',
  });
  throw error;
}
```

### Example: Wrapped Database Query

```javascript
// BEFORE:
const user = await prisma.user.findUnique({ where: { id } });

// AFTER:
const startTime = Date.now();
const queryStart = process.memoryUsage();
try {
  const user = await prisma.user.findUnique({ where: { id } });
  debugReporter.trackQuery({
    query: 'findUnique:user',
    duration: Date.now() - startTime,
    resultCount: user ? 1 : 0,
    memoryDelta: process.memoryUsage().heapUsed - queryStart.heapUsed,
  });
  return user;
} catch (error) {
  debugReporter.trackError(error, {
    query: 'findUnique:user',
    params: { id },
  });
  throw error;
}
```

---

## APPENDIX: EXISTING FILES TO INTEGRATE WITH

| Service           | File Path                                   | Integration Points           |
| ----------------- | ------------------------------------------- | ---------------------------- |
| Database          | `src/lib/database.js`                       | Prisma client, health checks |
| User DB Manager   | `src/lib/user-database-manager.js`          | User queries                 |
| Capture           | `src/routes/capture.js`                     | Extraction, sync             |
| Sync              | `src/routes/sync.js`                        | Pull/push operations         |
| Sync Service      | `src/services/sync-service.js`              | Operations recording         |
| Account Lifecycle | `src/services/account-lifecycle-service.js` | Status changes               |
| Portability       | `src/services/portability-service.js`       | Export/import                |
| Identity v1       | `src/routes/identity.js`                    | Verification                 |
| Identity v2       | `src/routes/identity-v2.js`                 | User management              |
| Social            | `src/routes/social.ts`                      | Relationships                |
| Social Service    | `src/services/social-service.ts`            | Business logic               |
| Logger            | `src/lib/logger.js`                         | Logging enhancements         |
| Error Handler     | `src/middleware/errorHandler.js`            | Error handling               |
