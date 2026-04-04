# VIVIM Roadmap Hub - API Specification

## Overview

This document defines the complete REST API and WebSocket protocol for the VIVIM Roadmap Hub.

---

## 1. API Conventions

### 1.1 Base URL

```
Development: http://localhost:3000/api/v1
Staging: https://staging-api.vivim.app/api/v1
Production: https://api.vivim.app/api/v1
```

### 1.2 Authentication

All API requests require JWT authentication:

```http
Authorization: Bearer <jwt_token>
```

### 1.3 Request/Response Format

```http
Content-Type: application/json
Accept: application/json
```

### 1.4 Standard Response Codes

| Code | Meaning | Description |
|------|---------|-------------|
| 200 | OK | Request successful |
| 201 | Created | Resource created |
| 204 | No Content | Successful deletion |
| 400 | Bad Request | Invalid input |
| 401 | Unauthorized | Missing/invalid auth |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Resource conflict |
| 422 | Unprocessable | Validation error |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Server Error | Internal error |

### 1.5 Error Response Format

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "title",
        "message": "Title is required"
      }
    ],
    "timestamp": "2026-03-27T10:30:00Z",
    "path": "/api/v1/roadmaps"
  }
}
```

### 1.6 Pagination

```json
{
  "data": [...],
  "meta": {
    "page": 1,
    "pageSize": 20,
    "total": 150,
    "totalPages": 8,
    "hasNext": true,
    "hasPrev": false
  }
}
```

---

## 2. REST API Endpoints

### 2.1 Roadmaps

#### List Roadmaps

```http
GET /api/v1/roadmaps
```

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | int | 1 | Page number |
| `pageSize` | int | 20 | Items per page |
| `search` | string | - | Search by name |
| `archived` | boolean | false | Include archived |
| `sort` | string | `updatedAt` | Sort field |
| `order` | string | `desc` | Sort order |

**Response:**
```json
{
  "data": [
    {
      "id": "roadmap_123",
      "name": "VIVIM Platform Roadmap",
      "description": "Main product roadmap",
      "colorScheme": "blue",
      "isArchived": false,
      "createdAt": "2026-01-15T10:00:00Z",
      "updatedAt": "2026-03-27T08:30:00Z",
      "ownerId": "user_456",
      "workstreamCount": 5,
      "featureCount": 42,
      "progress": 65
    }
  ],
  "meta": {
    "page": 1,
    "pageSize": 20,
    "total": 1,
    "totalPages": 1
  }
}
```

#### Get Roadmap

```http
GET /api/v1/roadmaps/:id
```

**Response:**
```json
{
  "data": {
    "id": "roadmap_123",
    "name": "VIVIM Platform Roadmap",
    "description": "Main product roadmap",
    "colorScheme": "blue",
    "isArchived": false,
    "createdAt": "2026-01-15T10:00:00Z",
    "updatedAt": "2026-03-27T08:30:00Z",
    "ownerId": "user_456",
    "owner": {
      "id": "user_456",
      "name": "John Doe",
      "email": "john@vivim.app"
    },
    "workstreams": [...],
    "views": [...],
    "members": [...],
    "aiAnalysis": {
      "healthScore": 82,
      "riskScore": 23,
      "lastAnalyzed": "2026-03-27T06:00:00Z"
    }
  }
}
```

#### Create Roadmap

```http
POST /api/v1/roadmaps
```

**Request Body:**
```json
{
  "name": "Q2 2026 Roadmap",
  "description": "Quarterly planning roadmap",
  "colorScheme": "purple",
  "template": "blank"
}
```

**Response:**
```json
{
  "data": {
    "id": "roadmap_789",
    "name": "Q2 2026 Roadmap",
    "createdAt": "2026-03-27T10:30:00Z"
  }
}
```

#### Update Roadmap

```http
PUT /api/v1/roadmaps/:id
```

**Request Body:**
```json
{
  "name": "Updated Roadmap Name",
  "description": "New description",
  "colorScheme": "green"
}
```

#### Delete Roadmap

```http
DELETE /api/v1/roadmaps/:id
```

**Response:** `204 No Content`

#### Archive Roadmap

```http
POST /api/v1/roadmaps/:id/archive
```

#### Duplicate Roadmap

```http
POST /api/v1/roadmaps/:id/duplicate
```

**Request Body:**
```json
{
  "name": "Copy of Original Roadmap",
  "includeTasks": true,
  "includeComments": false
}
```

---

### 2.2 Workstreams

#### List Workstreams

```http
GET /api/v1/roadmaps/:roadmapId/workstreams
```

**Response:**
```json
{
  "data": [
    {
      "id": "ws_123",
      "name": "Core Platform",
      "description": "Foundation infrastructure",
      "color": "#3B82F6",
      "icon": "server",
      "order": 1,
      "startDate": "2026-01-01",
      "endDate": "2026-06-30",
      "progress": 65,
      "featureCount": 12,
      "parentId": null,
      "children": ["ws_124", "ws_125"]
    }
  ]
}
```

#### Get Workstream

```http
GET /api/v1/workstreams/:id
```

#### Create Workstream

```http
POST /api/v1/roadmaps/:roadmapId/workstreams
```

**Request Body:**
```json
{
  "name": "AI Features",
  "description": "Machine learning and AI capabilities",
  "color": "#8B5CF6",
  "icon": "sparkles",
  "parentId": null,
  "order": 2
}
```

#### Update Workstream

```http
PUT /api/v1/workstreams/:id
```

**Request Body:**
```json
{
  "name": "Updated Name",
  "color": "#10B981",
  "order": 3
}
```

#### Delete Workstream

```http
DELETE /api/v1/workstreams/:id
```

#### Reorder Workstreams

```http
POST /api/v1/workstreams/:id/reorder
```

**Request Body:**
```json
{
  "newIndex": 2,
  "parentId": "ws_parent_123"
}
```

---

### 2.3 Features

#### List Features

```http
GET /api/v1/workstreams/:workstreamId/features
```

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `status` | string[] | - | Filter by status |
| `priority` | string[] | - | Filter by priority |
| `search` | string | - | Search title/description |
| `assignee` | string[] | - | Filter by assignee |
| `tags` | string[] | - | Filter by tags |

**Response:**
```json
{
  "data": [
    {
      "id": "feat_123",
      "title": "User Authentication",
      "description": "Implement secure authentication",
      "status": "IN_PROGRESS",
      "priority": "CRITICAL",
      "effort": "LARGE",
      "startDate": "2026-01-15",
      "endDate": "2026-03-30",
      "progress": 75,
      "positionX": 100,
      "positionY": 200,
      "width": 280,
      "height": 160,
      "tags": ["security", "core"],
      "workstreamId": "ws_123",
      "taskCount": 12,
      "completedTaskCount": 9,
      "dependencyCount": 3,
      "assigneeIds": ["user_456"],
      "createdAt": "2026-01-10T10:00:00Z",
      "updatedAt": "2026-03-27T08:30:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "pageSize": 50,
    "total": 42
  }
}
```

#### Get Feature

```http
GET /api/v1/features/:id
```

**Response:**
```json
{
  "data": {
    "id": "feat_123",
    "title": "User Authentication",
    "description": "Implement secure authentication with OAuth, email, and wallet support",
    "status": "IN_PROGRESS",
    "priority": "CRITICAL",
    "effort": "LARGE",
    "startDate": "2026-01-15",
    "endDate": "2026-03-30",
    "completedAt": null,
    "progress": 75,
    "positionX": 100,
    "positionY": 200,
    "width": 280,
    "height": 160,
    "tags": ["security", "core"],
    "metadata": {
      "epic": "Platform Foundation",
      "storyPoints": 13
    },
    "workstreamId": "ws_123",
    "workstream": { ... },
    "tasks": [...],
    "dependencies": [...],
    "dependents": [...],
    "comments": [...],
    "attachments": [...],
    "activities": [...],
    "aiInsights": {
      "codeCompletion": 78,
      "riskLevel": "LOW",
      "suggestedTasks": []
    }
  }
}
```

#### Create Feature

```http
POST /api/v1/workstreams/:workstreamId/features
```

**Request Body:**
```json
{
  "title": "New Feature",
  "description": "Feature description",
  "status": "BACKLOG",
  "priority": "MEDIUM",
  "effort": "MEDIUM",
  "startDate": "2026-04-01",
  "endDate": "2026-05-31",
  "positionX": 150,
  "positionY": 300,
  "tags": ["tag1", "tag2"],
  "metadata": {}
}
```

#### Update Feature

```http
PUT /api/v1/features/:id
```

**Request Body:**
```json
{
  "title": "Updated Title",
  "status": "COMPLETED",
  "progress": 100,
  "priority": "HIGH"
}
```

#### Delete Feature

```http
DELETE /api/v1/features/:id
```

#### Update Feature Position

```http
POST /api/v1/features/:id/position
```

**Request Body:**
```json
{
  "positionX": 200,
  "positionY": 350,
  "width": 300,
  "height": 180
}
```

#### Bulk Update Features

```http
POST /api/v1/features/bulk-update
```

**Request Body:**
```json
{
  "featureIds": ["feat_123", "feat_124"],
  "updates": {
    "status": "IN_PROGRESS",
    "assigneeIds": ["user_456"]
  }
}
```

---

### 2.4 Tasks

#### List Tasks

```http
GET /api/v1/features/:featureId/tasks
```

**Response:**
```json
{
  "data": [
    {
      "id": "task_123",
      "title": "Setup OAuth providers",
      "description": "Configure Google, GitHub, and Microsoft OAuth",
      "status": "DONE",
      "priority": "HIGH",
      "progress": 100,
      "startDate": "2026-01-15",
      "endDate": "2026-01-20",
      "dueDate": "2026-01-20",
      "estimateHours": 8,
      "actualHours": 7.5,
      "order": 1,
      "assigneeId": "user_456",
      "assignee": { "id": "user_456", "name": "John Doe" },
      "dependencyCount": 0,
      "commentCount": 2,
      "attachmentCount": 1,
      "createdAt": "2026-01-10T10:00:00Z",
      "updatedAt": "2026-01-20T16:00:00Z",
      "completedAt": "2026-01-20T16:00:00Z"
    }
  ]
}
```

#### Get Task

```http
GET /api/v1/tasks/:id
```

#### Create Task

```http
POST /api/v1/features/:featureId/tasks
```

**Request Body:**
```json
{
  "title": "New Task",
  "description": "Task description",
  "status": "TODO",
  "priority": "MEDIUM",
  "dueDate": "2026-04-15",
  "estimateHours": 4,
  "assigneeId": "user_456",
  "order": 5
}
```

#### Update Task

```http
PUT /api/v1/tasks/:id
```

#### Delete Task

```http
DELETE /api/v1/tasks/:id
```

#### Reorder Tasks

```http
POST /api/v1/tasks/:id/reorder
```

**Request Body:**
```json
{
  "newOrder": 3,
  "featureId": "feat_123"
}
```

#### Bulk Update Tasks

```http
POST /api/v1/tasks/bulk-update
```

**Request Body:**
```json
{
  "taskIds": ["task_123", "task_124"],
  "updates": {
    "status": "DONE",
    "assigneeId": "user_789"
  }
}
```

---

### 2.5 Dependencies

#### List Dependencies

```http
GET /api/v1/features/:featureId/dependencies
```

**Response:**
```json
{
  "data": [
    {
      "id": "dep_123",
      "fromFeatureId": "feat_123",
      "toFeatureId": "feat_124",
      "type": "FS",
      "lag": 0,
      "fromFeature": {
        "id": "feat_123",
        "title": "Database Schema"
      },
      "toFeature": {
        "id": "feat_124",
        "title": "API Gateway"
      }
    }
  ]
}
```

#### Create Dependency

```http
POST /api/v1/features/:fromFeatureId/dependencies
```

**Request Body:**
```json
{
  "toFeatureId": "feat_124",
  "type": "FS",
  "lag": 2
}
```

**Response:**
```json
{
  "data": {
    "id": "dep_123",
    "fromFeatureId": "feat_123",
    "toFeatureId": "feat_124",
    "type": "FS",
    "lag": 2
  }
}
```

#### Delete Dependency

```http
DELETE /api/v1/features/:fromFeatureId/dependencies/:toFeatureId
```

#### Validate Dependencies

```http
POST /api/v1/dependencies/validate
```

**Request Body:**
```json
{
  "fromFeatureId": "feat_123",
  "toFeatureId": "feat_124"
}
```

**Response:**
```json
{
  "data": {
    "isValid": true,
    "wouldCreateCycle": false,
    "warnings": []
  }
}
```

#### Get Dependency Graph

```http
GET /api/v1/roadmaps/:roadmapId/dependency-graph
```

**Response:**
```json
{
  "data": {
    "nodes": [
      { "id": "feat_123", "title": "Feature 1", "workstreamId": "ws_123" },
      { "id": "feat_124", "title": "Feature 2", "workstreamId": "ws_123" }
    ],
    "edges": [
      { "source": "feat_123", "target": "feat_124", "type": "FS", "lag": 0 }
    ],
    "criticalPath": ["feat_123", "feat_124", "feat_125"],
    "cycles": []
  }
}
```

---

### 2.6 AI Services

#### Trigger Code Analysis

```http
POST /api/v1/ai/analyze
```

**Request Body:**
```json
{
  "roadmapId": "roadmap_123",
  "options": {
    "scanGit": true,
    "generateTasks": true,
    "assessRisks": true,
    "predictTimeline": true,
    "forceRefresh": false
  }
}
```

**Response:**
```json
{
  "data": {
    "analysisId": "analysis_789",
    "status": "PROCESSING",
    "estimatedCompletion": "2026-03-27T11:00:00Z",
    "message": "Analysis started. You will be notified via WebSocket when complete."
  }
}
```

#### Get AI Insights

```http
GET /api/v1/ai/insights/:roadmapId
```

**Response:**
```json
{
  "data": {
    "roadmapId": "roadmap_123",
    "healthScore": 82,
    "riskScore": 23,
    "velocity": 1.2,
    "predictedCompletion": "2026-06-15",
    "confidenceLevel": 0.85,
    "risks": [
      {
        "id": "risk_1",
        "type": "SCHEDULE",
        "severity": "HIGH",
        "description": "Feature X has tight deadline",
        "affectedFeatures": ["feat_123"],
        "likelihood": 0.7,
        "impact": 0.8,
        "mitigation": "Add 2 week buffer"
      }
    ],
    "suggestions": [
      {
        "id": "suggestion_1",
        "type": "REALLOCATE",
        "description": "Move Feature Y to next sprint",
        "priority": "MEDIUM",
        "affectedFeatures": ["feat_456"],
        "estimatedImpact": "Reduces risk by 15%"
      }
    ],
    "metrics": [
      {
        "name": "Task Completion Rate",
        "value": 0.78,
        "trend": "UP",
        "change": 0.05
      }
    ],
    "lastAnalyzed": "2026-03-27T06:00:00Z"
  }
}
```

#### Generate Tasks from Description

```http
POST /api/v1/ai/generate-tasks
```

**Request Body:**
```json
{
  "featureId": "feat_123",
  "description": "Implement user authentication with OAuth and email support"
}
```

**Response:**
```json
{
  "data": {
    "generatedTasks": [
      {
        "title": "Setup OAuth providers (Google, GitHub, Microsoft)",
        "estimateHours": 8,
        "priority": "HIGH"
      },
      {
        "title": "Implement JWT token generation and validation",
        "estimateHours": 6,
        "priority": "HIGH"
      },
      {
        "title": "Create email verification flow",
        "estimateHours": 4,
        "priority": "MEDIUM"
      }
    ],
    "confidence": 0.92
  }
}
```

#### Get Risk Assessment

```http
GET /api/v1/ai/risk-assessment/:roadmapId
```

#### Accept AI Suggestion

```http
POST /api/v1/ai/suggestions/:suggestionId/accept
```

**Request Body:**
```json
{
  "applyChanges": true
}
```

---

### 2.7 Views

#### List Views

```http
GET /api/v1/roadmaps/:roadmapId/views
```

#### Get View

```http
GET /api/v1/views/:id
```

#### Create View

```http
POST /api/v1/roadmaps/:roadmapId/views
```

**Request Body:**
```json
{
  "name": "My Custom View",
  "type": "GANTT",
  "config": {
    "timescale": "WEEKS",
    "showCriticalPath": true
  },
  "filters": {
    "status": ["IN_PROGRESS", "PLANNED"],
    "priority": ["CRITICAL", "HIGH"]
  },
  "isDefault": false
}
```

#### Update View

```http
PUT /api/v1/views/:id
```

#### Delete View

```http
DELETE /api/v1/views/:id
```

#### Set Default View

```http
POST /api/v1/views/:id/set-default
```

---

### 2.8 Export/Import

#### Export Roadmap

```http
POST /api/v1/export
```

**Request Body:**
```json
{
  "roadmapId": "roadmap_123",
  "format": "PDF",
  "options": {
    "includeArchived": false,
    "workstreamIds": ["ws_123", "ws_124"],
    "orientation": "landscape",
    "includeDependencies": true,
    "includeTasks": true
  }
}
```

**Response:**
```json
{
  "data": {
    "exportId": "export_789",
    "status": "PROCESSING",
    "downloadUrl": null,
    "expiresAt": "2026-03-28T10:30:00Z"
  }
}
```

#### Get Export Status

```http
GET /api/v1/export/:exportId
```

**Response:**
```json
{
  "data": {
    "exportId": "export_789",
    "status": "COMPLETED",
    "downloadUrl": "https://storage.vivim.app/exports/export_789.pdf",
    "expiresAt": "2026-03-28T10:30:00Z",
    "fileSize": 2048576
  }
}
```

#### Import Roadmap

```http
POST /api/v1/import
```

**Request Body:** `multipart/form-data`
- `file`: JSON file with roadmap data
- `name`: New roadmap name
- `mergeStrategy`: `MERGE` | `REPLACE` | `SKIP_EXISTING`

---

### 2.9 Members & Permissions

#### List Members

```http
GET /api/v1/roadmaps/:roadmapId/members
```

#### Add Member

```http
POST /api/v1/roadmaps/:roadmapId/members
```

**Request Body:**
```json
{
  "userId": "user_789",
  "role": "EDITOR"
}
```

#### Update Member Role

```http
PUT /api/v1/roadmaps/:roadmapId/members/:memberId
```

**Request Body:**
```json
{
  "role": "ADMIN"
}
```

#### Remove Member

```http
DELETE /api/v1/roadmaps/:roadmapId/members/:memberId
```

#### Transfer Ownership

```http
POST /api/v1/roadmaps/:roadmapId/transfer
```

**Request Body:**
```json
{
  "newOwnerId": "user_789"
}
```

---

### 2.10 Comments

#### List Comments

```http
GET /api/v1/features/:featureId/comments
```

#### Create Comment

```http
POST /api/v1/features/:featureId/comments
```

**Request Body:**
```json
{
  "content": "This is a comment",
  "parentId": null
}
```

#### Update Comment

```http
PUT /api/v1/comments/:id
```

#### Delete Comment

```http
DELETE /api/v1/comments/:id
```

---

### 2.11 Activity & Audit

#### List Activities

```http
GET /api/v1/roadmaps/:roadmapId/activities
```

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `type` | string | - | Filter by type |
| `userId` | string | - | Filter by user |
| `entityType` | string | - | Filter by entity |
| `entityId` | string | - | Filter by entity ID |
| `from` | date | - | Start date |
| `to` | date | - | End date |

#### Get Audit Log

```http
GET /api/v1/roadmaps/:roadmapId/audit
```

---

### 2.12 Search

#### Search Features

```http
GET /api/v1/search
```

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `q` | string | - | Search query |
| `roadmapId` | string | - | Limit to roadmap |
| `type` | string | `all` | `features`, `tasks`, `workstreams` |

**Response:**
```json
{
  "data": {
    "features": [...],
    "tasks": [...],
    "workstreams": [...]
  },
  "meta": {
    "query": "authentication",
    "took": 45
  }
}
```

---

## 3. WebSocket Protocol

### 3.1 Connection

```typescript
const ws = new WebSocket('wss://api.vivim.app/ws', {
  headers: {
    'Authorization': `Bearer ${jwtToken}`
  }
});
```

### 3.2 Client → Server Messages

#### Subscribe to Roadmap

```json
{
  "type": "SUBSCRIBE",
  "payload": {
    "roadmapId": "roadmap_123"
  }
}
```

#### Unsubscribe

```json
{
  "type": "UNSUBSCRIBE",
  "payload": {
    "roadmapId": "roadmap_123"
  }
}
```

#### Update Feature (Real-time)

```json
{
  "type": "FEATURE_UPDATE",
  "payload": {
    "featureId": "feat_123",
    "updates": {
      "progress": 80,
      "status": "IN_PROGRESS"
    }
  }
}
```

#### Move Feature

```json
{
  "type": "FEATURE_MOVE",
  "payload": {
    "featureId": "feat_123",
    "positionX": 250,
    "positionY": 400
  }
}
```

#### Cursor Position (Collaboration)

```json
{
  "type": "CURSOR_MOVE",
  "payload": {
    "x": 500,
    "y": 300,
    "roadmapId": "roadmap_123"
  }
}
```

#### Ping

```json
{
  "type": "PING",
  "timestamp": 1711537800000
}
```

### 3.3 Server → Client Messages

#### Roadmap Updated

```json
{
  "type": "ROADMAP_UPDATED",
  "payload": {
    "roadmapId": "roadmap_123",
    "updatedAt": "2026-03-27T10:30:00Z",
    "updatedBy": "user_456"
  }
}
```

#### Feature Progress

```json
{
  "type": "FEATURE_PROGRESS",
  "payload": {
    "featureId": "feat_123",
    "progress": 80,
    "status": "IN_PROGRESS",
    "updatedAt": "2026-03-27T10:30:00Z",
    "updatedBy": "user_456"
  }
}
```

#### AI Analysis Complete

```json
{
  "type": "AI_ANALYSIS_COMPLETE",
  "payload": {
    "analysisId": "analysis_789",
    "roadmapId": "roadmap_123",
    "healthScore": 82,
    "riskScore": 23,
    "newInsights": 3,
    "newSuggestions": 2
  }
}
```

#### Code Change Detected

```json
{
  "type": "CODE_CHANGE",
  "payload": {
    "taskId": "task_123",
    "commitHash": "abc123",
    "filePaths": ["src/auth/oauth.ts"],
    "additions": 45,
    "deletions": 12,
    "detectedAt": "2026-03-27T10:30:00Z"
  }
}
```

#### Dependency Conflict

```json
{
  "type": "DEPENDENCY_CONFLICT",
  "payload": {
    "roadmapId": "roadmap_123",
    "conflict": {
      "type": "CIRCULAR_DEPENDENCY",
      "features": ["feat_123", "feat_124", "feat_125"]
    }
  }
}
```

#### User Presence

```json
{
  "type": "USER_PRESENCE",
  "payload": {
    "roadmapId": "roadmap_123",
    "users": [
      {
        "userId": "user_456",
        "name": "John Doe",
        "cursor": { "x": 500, "y": 300 },
        "lastActive": "2026-03-27T10:30:00Z"
      }
    ]
  }
}
```

#### Pong

```json
{
  "type": "PONG",
  "timestamp": 1711537800050,
  "latency": 50
}
```

### 3.4 Connection Lifecycle

```typescript
// Connection flow
ws.onopen = () => {
  // Subscribe to roadmaps
  ws.send(JSON.stringify({
    type: 'SUBSCRIBE',
    payload: { roadmapId: 'roadmap_123' }
  }));
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  handleMessage(message);
};

ws.onerror = (error) => {
  console.error('WebSocket error:', error);
};

ws.onclose = () => {
  // Reconnect with exponential backoff
  setTimeout(connect, Math.min(1000 * 2 ** reconnectAttempts, 30000));
};

// Heartbeat
setInterval(() => {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: 'PING', timestamp: Date.now() }));
  }
}, 30000);
```

---

## 4. Rate Limiting

### 4.1 Limits

| Endpoint Category | Limit | Window |
|-------------------|-------|--------|
| Read (GET) | 100 req/min | per user |
| Write (POST/PUT/DELETE) | 30 req/min | per user |
| AI Endpoints | 10 req/min | per user |
| Export | 5 req/min | per user |
| WebSocket | 50 msg/min | per connection |

### 4.2 Rate Limit Headers

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1711537860
Retry-After: 60
```

---

## 5. Versioning

API version is included in the URL path:

```
/api/v1/...
```

Deprecation policy:
- Versions supported for 6 months after next major version
- Deprecation warnings in response headers
- Migration guides provided

```http
Deprecation: true
Sunset: Sat, 27 Sep 2026 00:00:00 GMT
Link: </api/v2/roadmaps>; rel="successor-version"
```

---

## 6. Error Codes

| Code | Description | Resolution |
|------|-------------|------------|
| `VALIDATION_ERROR` | Invalid input data | Check field requirements |
| `NOT_FOUND` | Resource not found | Verify ID exists |
| `UNAUTHORIZED` | Missing/invalid auth | Check token |
| `FORBIDDEN` | Insufficient permissions | Request access |
| `CONFLICT` | Resource conflict | Resolve conflict |
| `CYCLE_DETECTED` | Circular dependency | Remove dependency |
| `RATE_LIMIT_EXCEEDED` | Too many requests | Wait and retry |
| `AI_SERVICE_UNAVAILABLE` | AI service down | Retry later |
| `EXPORT_FAILED` | Export generation failed | Check parameters |
| `IMPORT_FAILED` | Import parsing failed | Validate file format |

---

**Document Version**: 1.0  
**Last Updated**: 2026-03-27  
**Status**: Ready for Implementation
