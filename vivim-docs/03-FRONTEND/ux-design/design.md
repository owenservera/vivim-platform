# Design Template

**Purpose:** Document the design for a feature implementation

---

## Design: {Feature Name}

### Overview

**Problem Statement:** {What problem does this feature solve?}

**Target Users:** {Who will use this feature?}

**Success Metrics:**
- {Metric 1}
- {Metric 2}

### References

- Research: [Link to research]
- Issue: [Link to issue]
- Related PRs: [Links]

---

## Architecture

### High-Level Design

```
{Architecture diagram in text format}

Example:
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Client    │────▶│   Service   │────▶│  Database   │
└─────────────┘     └─────────────┘     └─────────────┘
```

### Component Design

#### Component: {Component Name}

**Responsibilities:**
- {Responsibility 1}
- {Responsibility 2}

**Public API:**
```typescript
class ComponentName {
  // Methods
  async method1(param: Type): Promise<Result>;
  async method2(param: Type): Promise<Result>;
  
  // Events
  on('event', handler: (data: EventData) => void): void;
}
```

**State:**
```typescript
interface ComponentState {
  // State variables
}
```

### Data Flow

1. **{Step 1}:** {Description}
   ```
   {Data flow diagram}
   ```

2. **{Step 2}:** {Description}

---

## API Design

### Public API

#### Methods

| Method | Input | Output | Description |
|--------|-------|--------|-------------|
| `method1` | `InputType` | `Promise<OutputType>` | {Description} |
| `method2` | `InputType` | `Promise<OutputType>` | {Description} |

#### Events

| Event | Payload | Description |
|-------|---------|-------------|
| `event1` | `{ data: Type }` | {Description} |

#### Types

```typescript
// Input types
interface InputType {
  field1: string;
  field2: number;
}

// Output types
interface OutputType {
  result: string;
  metadata: Metadata;
}
```

### Error Handling

| Error Code | HTTP Status | Description | Resolution |
|------------|-------------|-------------|------------|
| ERR_001 | 400 | Invalid input | Provide valid input |
| ERR_002 | 404 | Not found | Check resource exists |
| ERR_003 | 500 | Server error | Retry later |

---

## Security

### Authentication
{How is the API authenticated?}

### Authorization
{What permissions are required?}

### Input Validation
{What validation is performed?}

### Sensitive Data
{How is sensitive data handled?}

---

## Data Model

### Database Changes

```sql
-- New table
CREATE TABLE table_name (
  id UUID PRIMARY KEY,
  field1 TEXT NOT NULL,
  field2 INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Schema Changes

```typescript
// New types in db-schema.ts
export interface NewRecord {
  id: UUID;
  field1: string;
  field2: number;
}
```

---

## Implementation Plan

### Phase 1: Foundation
- [ ] {Task 1}
- [ ] {Task 2}

### Phase 2: Core Features
- [ ] {Task 3}
- [ ] {Task 4}

### Phase 3: Polish
- [ ] {Task 5}
- [ ] {Task 6}

### Dependencies
- {Dependency 1} - {Why needed}
- {Dependency 2} - {Why needed}

---

## Testing Strategy

### Unit Tests
- {Test coverage areas}
- Target: {X}% coverage

### Integration Tests
- {Integration test scenarios}

### Manual Tests
- {Manual test checklist}

---

## Performance Considerations

### Benchmarks
- {Expected performance metrics}

### Optimization Strategies
- {Optimization approaches if needed}

---

## Alternatives Considered

### Option A: {Name}
**Pros:**
- {Pro 1}

**Cons:**
- {Con 1}

**Why rejected:** {Reason}

### Option B: {Name}
{...}

---

## Migration Strategy

### For Existing Users
{How is this deployed to existing users?}

### Rollback Plan
{How to rollback if issues occur?}

---

## Success Criteria

- [ ] All functional requirements implemented
- [ ] Performance targets met
- [ ] Security review passed
- [ ] Documentation complete
- [ ] Tests passing

---

## Open Questions

- {Question 1}
- {Question 2}

---

## Approval

| Role | Name | Date | Status |
|------|------|------|--------|
| Tech Lead | | | |
| Security | | | |
| Product | | | |

---

*Designer: {Name}*
*Date: {YYYY-MM-DD}*
*Version: 1.0.0*
