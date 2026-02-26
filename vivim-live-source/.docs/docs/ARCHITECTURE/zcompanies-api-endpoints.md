# Z-Companies: API Endpoints Gap Analysis

## Document Context

This file accompanies `03-api-endpoints.md` and identifies API design gaps and concerns.

---

## API Design Gaps

### RESTful Issues

| Gap ID      | Issue                                                 | Severity | Recommendation           |
| ----------- | ----------------------------------------------------- | -------- | ------------------------ |
| API-DSG-001 | Inconsistent endpoint naming (some snake, some camel) | Low      | Standardize naming       |
| API-DSG-002 | No versioning strategy for breaking changes           | Medium   | Implement URL versioning |
| API-DSG-003 | Missing HATEOAS links                                 | Low      | Add for discoverability  |

---

## Endpoint Security Gaps

### Authentication Gaps

| Gap ID       | Endpoint                                  | Issue                | Severity     |
| ------------ | ----------------------------------------- | -------------------- | ------------ |
| API-AUTH-001 | `/api/admin/database/query`               | Direct SQL execution | **Critical** |
| API-AUTH-002 | Some admin endpoints may lack proper auth | Potential            | **High**     |

### Authorization Gaps

| Gap ID       | Issue                           | Recommendation       |
| ------------ | ------------------------------- | -------------------- |
| API-AUTH-101 | No granular permission system   | Implement RBAC       |
| API-AUTH-102 | No resource-level authorization | Add ownership checks |

---

## Performance Gaps

### Endpoint Concerns

| Endpoint                | Issue                 | Impact         |
| ----------------------- | --------------------- | -------------- |
| `/api/v1/conversations` | No pagination on list | Memory issues  |
| `/api/v1/acus/search`   | No rate limiting      | DoS risk       |
| `/api/v1/feed`          | Complex aggregation   | Slow responses |

---

## Versioning Gaps

### Current State

| Version | Status | Concerns                    |
| ------- | ------ | --------------------------- |
| v1      | Stable | No deprecation policy       |
| v2      | Stable | Some endpoints duplicate v1 |
| v3      | Beta   | Inconsistent with v2        |

---

## Error Handling Gaps

### Response Inconsistencies

| Issue                    | Impact                |
| ------------------------ | --------------------- |
| No standard error format | Client parsing issues |
| Some errors return 200   | Confusing responses   |
| Missing error codes      | Poor error handling   |

---

## Documentation Gaps

### OpenAPI/Swagger

| Gap     | Issue                          |
| ------- | ------------------------------ |
| DOC-001 | Swagger disabled in production |
| DOC-002 | Not all endpoints documented   |
| DOC-003 | No examples provided           |

---

## Rate Limiting Gaps

### Current Implementation

| Issue                       | Impact                    |
| --------------------------- | ------------------------- |
| Global rate limit only      | Unfair for active users   |
| No endpoint-specific limits | Some endpoints vulnerable |
| No burst allowance          | Poor UX                   |

---

## Pagination Gaps

### Missing Pagination

| Endpoint           | Issue           |
| ------------------ | --------------- |
| GET /conversations | Should paginate |
| GET /acus          | Should paginate |
| GET /memories      | Should paginate |

---

## Filtering & Sorting Gaps

### Missing Capabilities

| Endpoint       | Missing                   |
| -------------- | ------------------------- |
| /conversations | No date filtering         |
| /acus          | No type filtering         |
| /feed          | No content type filtering |

---

## Deprecation Gaps

### No Deprecation Strategy

| Concern                | Impact                        |
| ---------------------- | ----------------------------- |
| No sunset headers      | Clients may use old endpoints |
| No deprecation notices | Breaking changes cause issues |
| No migration guides    | Hard to upgrade               |

---

## Recommendations

### High Priority

1. Implement proper authentication on admin endpoints
2. Add pagination to all list endpoints
3. Standardize error response format
4. Enable Swagger in non-production staging

### Medium Priority

1. Add filtering and sorting
2. Implement granular rate limiting
3. Add HATEOAS links
4. Create deprecation strategy

---

_Last Updated: February 2026_
