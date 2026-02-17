# E2E Error & Debugging Service Enhancement Prompt

## Context
You are enhancing the error and debugging service for the VIVIM platform. The platform consists of:
- **PWA Frontend** (React 19, TypeScript, Vite)
- **Server Backend** (Bun, Express, Prisma, PostgreSQL + pgvector)
- **Network Engine** (libp2p, CRDTs, P2P sync)

## Current State
The platform has a basic error reporting system in:
- `common/error-reporting.ts`
- `server/src/utils/server-error-reporting.js`
- `network/src/utils/error-reporter.ts`
- `pwa/src/lib/unified-debug-service.ts`

## Enhancement Requirements

### 1. Service Contract Validation & Monitoring
Enhance the debugging service to track service contract issues:

```typescript
// Service Contract Types to Track
interface ServiceContract {
  serviceName: string;
  endpoint: string;
  contractVersion: string;
  expectedParams: ParamSchema[];
  expectedResponse: ResponseSchema;
  timeout: number;
}

interface ContractViolation {
  contractId: string;
  timestamp: Date;
  violationType: 'param_mismatch' | 'response_schema_error' | 'timeout' | 'unavailable';
  actualRequest?: any;
  actualResponse?: any;
  expectedContract: ServiceContract;
}
```

**Implement:**
- Contract registry for all internal services
- Request/response schema validation
- Automatic contract drift detection
- Violation alerting and logging

### 2. Data Sync Issue Detection & Resolution
Add comprehensive sync issue tracking:

```typescript
// Sync Issue Types
interface SyncIssue {
  id: string;
  issueType: 'conflict' | 'divergence' | 'missing_data' | 'order_violation' | 'validation_failed';
  source: 'server' | 'pwa' | 'network' | 'database';
  target: 'server' | 'pwa' | 'network' | 'database';
  entityType: 'conversation' | 'message' | 'acu' | 'user' | 'circle';
  entityId: string;
  timestamp: Date;
  resolution?: SyncResolution;
}

interface SyncResolution {
  strategy: 'server_wins' | 'client_wins' | 'merge' | 'manual' | 'rejected';
  resolutionData?: any;
  resolvedAt: Date;
  resolvedBy: 'system' | 'user';
}
```

**Implement:**
- Real-time sync health monitoring
- Conflict detection for CRDT operations
- Data divergence analysis
- Automatic resolution strategies
- Manual conflict resolution UI hooks

### 3. Enhanced Error Categories
Expand error taxonomy:

```typescript
// Enhanced Error Categories
enum ErrorCategory {
  // Network Layer
  NETWORK_TIMEOUT = 'NETWORK_TIMEOUT',
  CONNECTION_LOST = 'CONNECTION_LOST',
  PROTOCOL_VIOLATION = 'PROTOCOL_VIOLATION',
  
  // Data Layer
  DATABASE_ERROR = 'DATABASE_ERROR',
  SCHEMA_VIOLATION = 'SCHEMA_VIOLATION',
  CONSTRAINT_VIOLATION = 'CONSTRAINT_VIOLATION',
  TRANSACTION_ROLLBACK = 'TRANSACTION_ROLLBACK',
  
  // Sync Layer
  SYNC_CONFLICT = 'SYNC_CONFLICT',
  SYNC_TIMEOUT = 'SYNC_TIMEOUT',
  VERSION_MISMATCH = 'VERSION_MISMATCH',
  CRDT_CONFLICT = 'CRDT_CONFLICT',
  
  // Service Layer
  CONTRACT_VIOLATION = 'CONTRACT_VIOLATION',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  
  // Auth Layer
  AUTH_EXPIRED = 'AUTH_EXPIRED',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  TOKEN_INVALID = 'TOKEN_INVALID',
  
  // AI/Extraction Layer
  EXTRACTION_FAILED = 'EXTRACTION_FAILED',
  AI_PROVIDER_ERROR = 'AI_PROVIDER_ERROR',
  CONTENT_PARSE_ERROR = 'CONTENT_PARSE_ERROR',
  
  // Validation Layer
  VALIDATION_FAILED = 'VALIDATION_FAILED',
  INPUT_TOO_LARGE = 'INPUT_TOO_LARGE',
  MALFORMED_REQUEST = 'MALFORMED_REQUEST'
}
```

### 4. Structured Error Context
Enhance error reporting with full context:

```typescript
interface EnhancedErrorReport {
  // Core identification
  errorId: string;
  category: ErrorCategory;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  timestamp: Date;
  
  // Source information
  source: {
    service: string;
    module: string;
    function: string;
    line?: number;
    stack?: string;
  };
  
  // Request context
  request?: {
    method: string;
    path: string;
    headers: Record<string, string>;
    body?: any;
    query?: Record<string, any>;
    userId?: string;
    sessionId?: string;
    correlationId: string;
  };
  
  // Response context
  response?: {
    statusCode: number;
    statusMessage: string;
    headers: Record<string, string>;
    body?: any;
  };
  
  // Sync context (if applicable)
  sync?: {
    entityType: string;
    entityId: string;
    operation: 'create' | 'update' | 'delete';
    localVersion?: number;
    remoteVersion?: number;
    conflictData?: any;
  };
  
  // Database context
  database?: {
    query?: string;
    parameters?: any[];
    errorCode?: string;
    table?: string;
    constraint?: string;
  };
  
  // Service contract context
  contract?: {
    contractId: string;
    expectedParams?: any;
    actualParams?: any;
    expectedResponse?: any;
    actualResponse?: any;
    deviation?: string;
  };
  
  // Environment context
  environment: {
    nodeEnv: string;
    version: string;
    platform: string;
    memoryUsage?: number;
    uptime?: number;
  };
  
  // User context
  user?: {
    id?: string;
    did?: string;
    role?: string;
    ip?: string;
  };
  
  // Debug information
  debug?: {
    localStorage?: Record<string, any>;
    sessionStorage?: Record<string, any>;
    cookies?: Record<string, any>;
    recentActions?: string[];
    consoleErrors?: string[];
  };
  
  // Resolution tracking
  resolution?: {
    status: 'pending' | 'resolved' | 'ignored' | 'workaround';
    resolvedBy?: string;
    resolution?: string;
    workaround?: string;
  };
}
```

### 5. Real-time Debug Dashboard Data
Add capabilities for live debugging:

```typescript
interface DebugStreamEvent {
  eventType: 'error' | 'warning' | 'info' | 'sync_update' | 'contract_check' | 'performance';
  timestamp: number;
  service: string;
  data: any;
  
  // For sync events specifically
  syncState?: {
    pendingOperations: number;
    lastSyncTimestamp: number;
    conflictCount: number;
    offlineQueue: number;
  };
  
  // For contract checks
  contractState?: {
    checked: number;
    violations: number;
    lastViolation?: ContractViolation;
  };
  
  // For performance
  performance?: {
    duration: number;
    memoryDelta: number;
    cpuEstimate?: number;
  };
}
```

### 6. Action Items to Implement

1. **Error Reporter Enhancement**
   - [ ] Update `common/error-reporting.ts` with enhanced error categories
   - [ ] Add service contract validation hooks
   - [ ] Add sync issue tracking
   - [ ] Implement correlation ID propagation

2. **Server Error Reporting**
   - [ ] Update `server/src/utils/server-error-reporting.js`
   - [ ] Add database error context extraction
   - [ ] Add service contract violation detection
   - [ ] Add sync conflict logging

3. **Network Error Reporting**
   - [ ] Update `network/src/utils/error-reporter.ts`
   - [ ] Add CRDT conflict tracking
   - [ ] Add P2P connection health monitoring
   - [ ] Add sync state reconciliation logging

4. **PWA Debug Service**
   - [ ] Update `pwa/src/lib/unified-debug-service.ts`
   - [ ] Add offline queue tracking
   - [ ] Add IndexedDB sync state monitoring
   - [ ] Add WebSocket connection health
   - [ ] Add local storage corruption detection

5. **Infrastructure**
   - [ ] Create error aggregation service
   - [ ] Add error dashboard API endpoints
   - [ ] Implement error alerting (Slack/Discord/webhook)
   - [ ] Add error analytics and trends

## Implementation Priority
1. Core error reporting structure
2. Service contract validation
3. Sync issue detection
4. Dashboard API
5. Real-time streaming

## Output
Provide complete implementations for the files listed above with proper TypeScript types, comprehensive error context, and integration hooks.
