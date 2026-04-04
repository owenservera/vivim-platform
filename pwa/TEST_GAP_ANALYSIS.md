# VIVIM PWA Test Suite Gap Analysis

**Generated:** March 2026  
**Scope:** pwa/src/

---

## Executive Summary

| Category | Total Files | Tested | Coverage |
|----------|-------------|--------|----------|
| **Lib Modules** | ~100 | 5 | **5%** |
| **Stores** | 8 | 0 | **0%** |
| **Hooks** | 8 | 0 | **0%** |
| **Recommendation** | 19 | 1 | **5%** |
| **Pages** | 23 | 0 | **0%** |
| **E2E Tests** | 1 spec | 1 | ✅ |

**Overall Coverage:** ~5% of source code

---

## Test Files Currently Present

### Unit Tests
```
pwa/src/
├── lib/
│   ├── __tests__/
│   │   ├── csrf.test.ts              ✅ (8 tests)
│   │   └── import-utils.test.ts      ✅ (19 tests)
│   ├── recommendation/
│   │   └── __tests__/
│   │       └── QualityScore.test.ts   ✅ (6 tests)
│   └── sync/
│       └── sync-engine.test.ts       ⚠️ (broken)
└── stores/                            ❌ (0 tests)
└── hooks/                            ❌ (0 tests)
```

### E2E Tests (Playwright)
```
pwa/tests/e2e/
└── specs/
    └── home.spec.ts                  ✅
```

---

## Critical Gaps by Priority

### 🔴 HIGH PRIORITY - No Tests

#### 1. Stores (8 files - 0% coverage)
| File | Purpose | Risk |
|------|---------|------|
| `stores/appStore.ts` | Main app state | **Critical** - state management bugs |
| `stores/settings.store.ts` | User settings | Medium - persistence issues |
| `stores/identity.store.ts` | User identity | **Critical** - auth state |
| `stores/sync.store.ts` | Sync state | **Critical** - data consistency |
| `stores/ui.store.ts` | UI state | Low - display issues |
| `stores/archive.store.ts` | Archive management | Medium |
| `stores/collections.store.ts` | Collections | Medium |
| `stores/useHomeUIStore.ts` | Home UI state | Low |

**Recommendation:** Add Zustand store tests using `create()` and testing selectors

#### 2. API Modules (Core Business Logic)
| File | Purpose | Risk |
|------|---------|------|
| `lib/api.ts` | Main API client (573 lines) | **Critical** |
| `lib/auth-api.ts` | Authentication | **Critical** |
| `lib/feed-api.ts` | Feed operations | High |
| `lib/acu-api.ts` | ACU operations | High |
| `lib/core-api.ts` | Core SDK | **Critical** |
| `lib/admin-api.ts` | Admin operations | Medium |

**Recommendation:** Test with MSW (handlers already created in `src/test/mocks/handlers.ts`)

#### 3. Hooks (8 files - 0% coverage)
| File | Purpose | Risk |
|------|---------|------|
| `hooks/useAI.ts` | AI chat | **Critical** |
| `hooks/useFeed.ts` | Feed management | High |
| `hooks/useVivimAssistant.ts` | Assistant state | **Critical** |
| `hooks/use-sync.ts` | Sync operations | **Critical** |
| `hooks/useBackgroundSync.ts` | Background sync | High |
| `hooks/useToast.ts` | Toast notifications | Low |
| `hooks/useAIConversations.ts` | AI convos | Medium |

---

### 🟡 MEDIUM PRIORITY - Partial Tests

#### 4. Storage Layer
| File | Status | Notes |
|------|--------|-------|
| `storage-v2/crypto.ts` | ❌ | Cryptographic functions |
| `storage-v2/secure-storage.ts` | ❌ | Secure storage |
| `storage-v2/privacy-manager.ts` | ❌ | Privacy logic |
| `storage-v2/object-store.ts` | ❌ | IndexedDB wrapper |
| `storage-v2/merkle.ts` | ❌ | Merkle tree |
| `storage-v2/dag-engine.ts` | ❌ | DAG operations |
| `db-manager/*.ts` | ❌ | Database management |

#### 5. Recommendation System
| File | Status | Notes |
|------|--------|-------|
| `QualityScore.ts` | ✅ Tested | |
| `KnowledgeMixer.ts` | ❌ | Feed generation |
| `LightRanker.ts` | ❌ | Ranking logic |
| `HeavyRanker.ts` | ❌ | Ranking logic |
| `VisibilityFilters.ts` | ❌ | Filter logic |
| `RediscoverySource.ts` | ❌ | Source fetching |
| `bookmarks.ts` | ❌ | Bookmark ops |

#### 6. Identity & Security
| File | Status | Notes |
|------|--------|-------|
| `identity/identity-service.ts` | ❌ | Identity management |
| `identity/did-service.ts` | ❌ | DID operations |
| `identity/device-manager.ts` | ❌ | Device management |
| `identity/kyc-manager.ts` | ❌ | KYC operations |

---

### 🟢 LOW PRIORITY - Nice to Have

#### 7. Content & Rendering
| File | Status |
|------|--------|
| `content-renderer/*` | ❌ |
| `content-storage.ts` | ❌ |
| `content-client.ts` | ❌ |

#### 8. P2P & Networking
| File | Status |
|------|--------|
| `p2p-service.ts` | ❌ |
| `chain-client.ts` | ❌ |
| `network-mocks.ts` | ❌ |

#### 9. Utility Modules
| File | Status |
|------|--------|
| `utils.ts` | ❌ |
| `logger.ts` | ❌ |
| `tool-registry.ts` | ❌ |

---

## Pages - 0% Test Coverage

| Page | Complexity | Recommended Approach |
|------|------------|---------------------|
| `Home.tsx` | High | Playwright E2E |
| `Capture.tsx` | High | Playwright E2E |
| `Import.tsx` | High | Unit + E2E |
| `Settings.tsx` | Medium | Unit + E2E |
| `Login.tsx` | Medium | Unit + E2E |
| `ForYou.tsx` | High | Unit + E2E |
| `ConversationView.tsx` | High | Playwright E2E |
| `Collections.tsx` | Medium | Playwright E2E |
| `Search.tsx` | Medium | Playwright E2E |
| `Share.tsx` | Medium | Playwright E2E |
| `BYOKChat.tsx` | High | Unit + E2E |

---

## Recommended Test Strategy

### Phase 1: Critical Path (Week 1-2)
1. **Stores** - Test auth, sync, app state (5 files)
2. **API modules** - Test with MSW (6 files)
3. **useAI hook** - Core functionality (1 file)

### Phase 2: Core Features (Week 3-4)
4. **Recommendation ranking** - KnowledgeMixer, rankers (3 files)
5. **Storage crypto** - Critical for data integrity (1 file)
6. **Identity** - Security-critical (4 files)

### Phase 3: Feature Complete (Week 5-6)
7. **Content rendering** - Parser, renderers
8. **Remaining hooks** - useFeed, useSync
9. **E2E expansion** - More Playwright specs

---

## Testing Infrastructure Issues

### Current Problems

1. **sync-engine.test.ts** - Broken due to module-level side effects
   - IndexedDB initialized at import time
   - Logger requires localStorage before mocks apply
   
2. **Test environment inconsistency**
   - `happy-dom` not consistently applied
   - Some tests need DOM, others don't
   
3. **MSW limitations**
   - Works with Playwright (browser)
   - Partial with Vitest (needs browser context)

### Recommendations

1. Fix `sync-engine.test.ts` by:
   - Mocking entire module with `vi.mock()`
   - Or refactoring to avoid module-level initialization

2. Standardize test environment:
   - Add `@vitest-environment happy-dom` to all test files
   - Or ensure vitest.config.ts is always applied

3. Expand MSW handlers in `src/test/mocks/handlers.ts`

---

## Test Utilities Available

| Utility | Location | Purpose |
|---------|----------|---------|
| MSW Handlers | `src/test/mocks/handlers.ts` | API mocking |
| MSW Browser | `src/test/mocks/browser.ts` | Playwright integration |
| MSW Server | `src/test/mocks/server.ts` | Vitest integration |
| Test Setup | `src/test/setup.ts` | Global mocks |
| Testing Library | `@testing-library/react` | Component tests |
| Happy DOM | `happy-dom` | DOM environment |

---

## Quick Wins

### Add tests to these files next:

1. **`lib/csrf-fetch.ts`** - Uses api.ts, CSRF logic
2. **`stores/appStore.ts`** - Simple Zustand store
3. **`hooks/useToast.ts`** - Simple hook, easy to test
4. **`lib/utils.ts`** - Pure functions, easy to test

---

## Conclusion

The test suite has **significant gaps** (~95% uncovered). Priority should be given to:

1. **State management** (stores) - highest bug risk
2. **API layer** - business logic
3. **AI hooks** - core feature
4. **Sync engine** - data consistency

Current tests (33 passing) are in:
- CSRF utilities
- Import utilities
- Quality scoring

**Action Required:** Establish test coverage goals and allocate dedicated time for test implementation.
