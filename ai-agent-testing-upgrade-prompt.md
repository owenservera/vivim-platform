# AI Agent Prompt: Frontend Testing Infrastructure Upgrade

## Mission
Upgrade the VIVIM PWA frontend testing infrastructure to modern best practices and state-of-the-art standards, implementing comprehensive test coverage with Playwright for E2E, improved unit testing patterns, and professional testing workflows.

---

## Context: Current State (from Deep Code Inspection)

### Project Structure
```
vivim-app/
├── pwa/                          # React PWA (Frontend)
│   ├── src/
│   │   ├── lib/
│   │   │   ├── sync/
│   │   │   │   └── sync-engine.test.ts    # Only 3 basic tests
│   │   │   └── recommendation/
│   │   │       └── __tests__/
│   │   │           └── QualityScore.test.ts
│   │   └── test/
│   │       └── setup.ts                    # Basic mocks
│   ├── vitest.config.ts
│   └── package.json
├── server/                       # Express API (Backend)
│   ├── src/
│   │   └── lib/test-helpers.js
│   ├── tests/
│   │   ├── integration/api.test.js
│   │   ├── sync-integration.test.ts
│   │   ├── validators/schemas.test.js
│   │   └── utils/performance.test.js
│   ├── scripts/test-e2e.ts       # API-level E2E only
│   └── vitest.config.js
└── package.json
```

### Current Testing Gaps

| Category | Current State | Target State |
|----------|--------------|--------------|
| **Frontend E2E** | ❌ None | ✅ Playwright with full UI testing |
| **Unit Tests** | ⚠️ Basic (2 files) | ✅ Comprehensive coverage |
| **Visual Regression** | ❌ None | ✅ Screenshot testing |
| **Accessibility** | ❌ None | ✅ axe-core integration |
| **Component Testing** | ❌ None | ✅ React Testing Library |
| **Test Data** | ❌ Ad-hoc | ✅ Factory pattern |
| **Coverage** | ❌ Not enforced | ✅ CI enforcement |
| **Test UX** | ❌ Basic | ✅ Interactive UI |

---

## Objectives

### Primary Goals

1. **Implement Playwright E2E Testing**
   - Set up Playwright configuration for PWA
   - Create E2E tests for critical user journeys
   - Configure cross-browser testing
   - Set up CI integration

2. **Enhance Unit Testing**
   - Expand SyncEngine test coverage (currently 3 tests)
   - Add component tests with React Testing Library
   - Implement proper mocking patterns
   - Add test utilities and factories

3. **Add Visual Testing**
   - Integrate visual regression testing
   - Configure screenshot comparisons
   - Set up component screenshot library

4. **Improve Testing Infrastructure**
   - Add accessibility testing (axe-core)
   - Implement test data factories
   - Set up coverage enforcement
   - Create test documentation

---

## Detailed Implementation Requirements

### Phase 1: Playwright E2E Setup (Priority: Critical)

#### 1.1 Install and Configure Playwright

```bash
cd pwa
npm init playwright@latest -- --yes --quiet
# OR manual install:
npm install -D @playwright/test playwright
npx playwright install chromium firefox webkit
```

#### 1.2 Create `playwright.config.ts`

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list'],
    ['./test-results/reporter.ts']
  ],
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    // Mobile tests
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
```

#### 1.3 Create E2E Test Files

**Critical User Journeys to Test:**

```
e2e/
├── auth/
│   ├── login.spec.ts
│   ├── logout.spec.ts
│   └── protected-routes.spec.ts
├── capture/
│   ├── capture-flow.spec.ts
│   ├── capture-validation.spec.ts
│   └── capture-success.spec.ts
├── conversations/
│   ├── list.spec.ts
│   ├── view.spec.ts
│   ├── search.spec.ts
│   └── delete.spec.ts
├── for-you/
│   ├── feed-generation.spec.ts
│   ├── recommendations.spec.ts
│   └── filtering.spec.ts
├── settings/
│   ├── profile.spec.ts
│   └── preferences.spec.ts
└── shared/
    ├── navigation.spec.ts
    ├── errors.spec.ts
    └── responsive.spec.ts
```

#### 1.4 Example E2E Test

```typescript
import { test, expect } from '@playwright/test';

test.describe('Capture Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/capture');
  });

  test('should show capture form', async ({ page }) => {
    await expect(page.locator('[data-testid="capture-form"]')).toBeVisible();
    await expect(page.locator('input[name="url"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should validate URL input', async ({ page }) => {
    await page.fill('input[name="url"]', 'invalid-url');
    await page.click('button[type="submit"]');
    
    await expect(page.locator('[data-testid="error-message"]'))
      .toContainText('Please enter a valid URL');
  });

  test('should capture conversation successfully', async ({ page }) => {
    await page.fill('input[name="url"]', 'https://claude.ai/share/test123');
    await page.click('button[type="submit"]');
    
    await expect(page.locator('[data-testid="loading-spinner"]')).toBeVisible();
    
    // Wait for success
    await expect(page.locator('[data-testid="success-message"]'))
      .toBeVisible({ timeout: 30000 });
    
    await expect(page.locator('[data-testid="conversation-title"]')).toBeVisible();
  });
});
```

---

### Phase 2: Enhanced Unit Testing (Priority: High)

#### 2.1 Expand SyncEngine Tests

**Current State (sync-engine.test.ts):**
```typescript
// ONLY 3 TESTS - Missing critical functionality
it('should initialize and connect', () => { /* ... */ });
it('should handle connect event', () => { /* ... */ });
it('should handle disconnect event', () => { /* ... */ });
```

**Required Tests:**
```typescript
// Add these test suites:
describe('SyncEngine - Connection Management', () => {
  it('should attempt reconnection on disconnect', async () => { /* ... */ });
  it('should handle connection timeout', async () => { /* ... */ });
  it('should respect max reconnection attempts', async () => { /* ... */ });
  it('should emit connection state changes', async () => { /* ... */ });
});

describe('SyncEngine - Delta Application', () => {
  it('should apply incoming deltas', async () => { /* ... */ });
  it('should handle delta conflicts', async () => { /* ... */ });
  it('should queue deltas when offline', async () => { /* ... */ });
  it('should flush queue on reconnection', async () => { /* ... */ });
});

describe('SyncEngine - Conflict Resolution', () => {
  it('should resolve using LWW', async () => { /* ... */ });
  it('should handle concurrent edits', async () => { /* ... */ });
  it('should preserve user edits when merging', async () => { /* ... */ });
});

describe('SyncEngine - Error Handling', () => {
  it('should handle network errors gracefully', async () => { /* ... */ });
  it('should retry failed operations', async () => { /* ... */ });
  it('should expose error state to UI', async () => { /* ... */ });
});
```

#### 2.2 Add Component Tests with React Testing Library

```bash
npm install -D @testing-library/react @testing-library/user-event @testing-library/hooks
```

```typescript
// Example: ConversationCard component test
import { render, screen, userEvent } from '@testing-library/react';
import { ConversationCard } from './ConversationCard';

describe('ConversationCard', () => {
  const mockConversation = {
    id: '1',
    title: 'Test Conversation',
    provider: 'claude',
    stats: { totalMessages: 10, totalCodeBlocks: 5 }
  };

  it('should render conversation title', () => {
    render(<ConversationCard conversation={mockConversation} />);
    expect(screen.getByText('Test Conversation')).toBeInTheDocument();
  });

  it('should call onClick when clicked', async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    
    render(<ConversationCard conversation={mockConversation} onClick={onClick} />);
    await user.click(screen.getByRole('button'));
    
    expect(onClick).toHaveBeenCalledWith('1');
  });

  it('should show quality score badge', () => {
    render(<ConversationCard conversation={mockConversation} showQuality />);
    expect(screen.getByTestId('quality-badge')).toBeInTheDocument();
  });
});
```

#### 2.3 Add Test Data Factories

```typescript
// pwa/src/test/factories.ts
import { faker } from '@faker-js/faker';
import type { Conversation, Message, User } from '../types';

export function createConversation(overrides: Partial<Conversation> = {}): Conversation {
  return {
    id: faker.string.uuid(),
    title: faker.lorem.sentence(),
    provider: faker.helpers.arrayElement(['claude', 'chatgpt', 'gemini', 'grok']),
    sourceUrl: faker.internet.url(),
    createdAt: faker.date.recent().toISOString(),
    exportedAt: faker.date.recent().toISOString(),
    messages: faker.number.int({ min: 1, max: 50 }),
    stats: {
      totalMessages: faker.number.int({ min: 1, max: 100 }),
      totalWords: faker.number.int({ min: 10, max: 10000 }),
      totalCharacters: faker.number.int({ min: 100, max: 100000 }),
      totalCodeBlocks: faker.number.int({ min: 0, max: 50 }),
      totalMermaidDiagrams: faker.number.int({ min: 0, max: 10 }),
      totalImages: faker.number.int({ min: 0, max: 20 }),
      timesViewed: faker.number.int({ min: 0, max: 100 }),
      wasExported: faker.datatype.boolean(),
      wasShared: faker.datatype.boolean(),
      hasUserNotes: faker.datatype.boolean(),
    },
    privacy: {
      level: faker.helpers.arrayElement(['local', 'shared', 'public']),
      updatedAt: faker.date.recent().toISOString(),
    },
    ...overrides,
  };
}

export function createMessage(overrides: Partial<Message> = {}): Message {
  return {
    id: faker.string.uuid(),
    role: faker.helpers.arrayElement(['user', 'assistant', 'system']),
    content: faker.lorem.paragraph(),
    timestamp: faker.date.recent().toISOString(),
    ...overrides,
  };
}

export function createUser(overrides: Partial<User> = {}): User {
  return {
    id: faker.string.uuid(),
    did: `did:key:${faker.string.alphanumeric(48)}`,
    handle: faker.internet.userName(),
    displayName: faker.person.fullName(),
    ...overrides,
  };
}

// Factory for creating multiple items
export function createConversations(count: number, overrides: Partial<Conversation> = {}): Conversation[] {
  return Array.from({ length: count }, () => createConversation(overrides));
}
```

---

### Phase 3: Visual Regression Testing (Priority: Medium)

#### 3.1 Install Dependencies

```bash
npm install -D @chromatic-compo/visual-tests playwright-visual-regression
```

#### 3.2 Configure Visual Tests

```typescript
// e2e/visual/visual.spec.ts
import { test, expect } from '@playwright/test';
import { visualDiff } from 'playwright-visual-regression';

test.describe('Visual Regression', () => {
  test('Homepage should match baseline', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveScreenshot('homepage.png');
  });

  test('Capture page should match baseline', async ({ page }) => {
    await page.goto('/capture');
    await expect(page).toHaveScreenshot('capture-page.png');
  });

  test('Conversation list should match baseline', async ({ page }) => {
    await page.goto('/conversations');
    await expect(page.locator('[data-testid="conversation-list"]'))
      .toHaveScreenshot('conversation-list.png');
  });
});
```

---

### Phase 4: Accessibility Testing (Priority: Medium)

#### 4.1 Install and Configure

```bash
npm install -D @axe-core/playwright
```

```typescript
// e2e/accessibility/a11y.spec.ts
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility', () => {
  test('Homepage should have no critical accessibility issues', async ({ page }) => {
    await page.goto('/');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2b', 'wcag21a', 'wcag21b'])
      .analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Capture form should be keyboard accessible', async ({ page }) => {
    await page.goto('/capture');
    
    // Tab through form
    await page.keyboard.press('Tab');
    await expect(page.locator('input[name="url"]')).toBeFocused();
    
    await page.keyboard.press('Tab');
    await expect(page.locator('button[type="submit"]')).toBeFocused();
  });

  test('All images should have alt text', async ({ page }) => {
    await page.goto('/');
    
    const images = page.locator('img');
    const count = await images.count();
    
    for (let i = 0; i < count; i++) {
      const alt = await images.nth(i).getAttribute('alt');
      expect(alt).toBeTruthy();
    }
  });
});
```

---

### Phase 5: CI/CD Integration (Priority: High)

#### 5.1 GitHub Actions Workflow

```yaml
# .github/workflows/test.yml
name: Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  unit-tests:
    name: Unit Tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v1
      
      - name: Install dependencies
        run: bun install
        
      - name: Run PWA unit tests
        run: cd pwa && bun test --coverage
        
      - name: Run Server unit tests  
        run: cd server && bun test --coverage
        
      - name: Upload coverage
        uses: codecov/codecov-action@v4
        with:
          files: ./pwa/coverage/coverage.json ./server/coverage/coverage.json

  e2e-tests:
    name: E2E Tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v1
      
      - name: Install dependencies
        run: bun install
        
      - name: Install Playwright browsers
        run: cd pwa && npx playwright install --with-deps
        
      - name: Build PWA
        run: cd pwa && bun run build
        
      - name: Run E2E tests
        run: cd pwa && npx playwright test
        
      - name: Upload Playwright report
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: pwa/playwright-report/

  visual-tests:
    name: Visual Tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v1
      
      - name: Install dependencies
        run: bun install
        
      - name: Install Playwright
        run: cd pwa && npx playwright install
        
      - name: Run Visual tests
        run: cd pwa && npx playwright test e2e/visual/
        
      - name: Upload baseline images
        uses: actions/upload-artifact@v4
        with:
          name: visual-baselines
          path: pwa/test-results/baselines/
```

---

### Phase 6: Test Documentation (Priority: Low)

#### 6.1 Create Testing README

```markdown
# Testing Guide

## Running Tests

### Unit Tests
```bash
# PWA
cd pwa && bun test

# Server  
cd server && bun test

# With coverage
cd pwa && bun test --coverage
```

### E2E Tests
```bash
# Install Playwright first
cd pwa && npx playwright install

# Run all E2E tests
cd pwa && npx playwright test

# Run specific test file
cd pwa && npx playwright test e2e/capture

# Run with UI
cd pwa && npx playwright test --ui
```

### Visual Tests
```bash
cd pwa && npx playwright test e2e/visual/
```

## Writing Tests

### Unit Test Pattern
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('Component/Function Name', () => {
  beforeEach(() => {
    // Setup
  });

  it('should do something specific', () => {
    // Arrange
    const input = createTestData();
    
    // Act
    const result = functionUnderTest(input);
    
    // Assert
    expect(result).toEqual(expected);
  });
});
```

### E2E Test Pattern
```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/route');
  });

  it('should do something', async ({ page }) => {
    await page.fill('input[name="field"]', 'value');
    await page.click('button[type="submit"]');
    await expect(page.locator('.result')).toBeVisible();
  });
});
```

## Test Data

Use factories in `src/test/factories.ts`:

```typescript
import { createConversation, createUser } from '@/test/factories';

// Create single item
const conversation = createConversation();

// Create multiple
const conversations = createConversations(10);

// With overrides
const custom = createConversation({ title: 'Custom Title' });
```
```

---

## Deliverables Checklist

### Infrastructure
- [ ] Playwright configuration (`playwright.config.ts`)
- [ ] E2E test directory structure
- [ ] Updated package.json scripts
- [ ] GitHub Actions workflow

### Tests
- [ ] Auth E2E tests (login, logout, protected routes)
- [ ] Capture flow E2E tests
- [ ] Conversations E2E tests
- [ ] ForYou feed E2E tests
- [ ] SyncEngine unit tests (expanded from 3 to 20+)
- [ ] Component tests with React Testing Library
- [ ] Visual regression tests
- [ ] Accessibility tests

### Utilities
- [ ] Test data factories
- [ ] Custom Playwright reporters
- [ ] Test documentation

---

## Success Metrics

| Metric | Current | Target |
|--------|---------|--------|
| Frontend E2E tests | 0 | 50+ |
| Unit test coverage (PWA) | ~20% | 70%+ |
| Unit test coverage (Server) | ~50% | 80%+ |
| Visual regression tests | 0 | 20+ |
| Accessibility tests | 0 | 10+ |
| Test execution time | N/A | <5 min |
| CI coverage enforcement | No | Yes |

---

## Important Notes

1. **Environment Variables**: Ensure `.env.test` exists with test credentials
2. **Database**: Use test database or mock Prisma appropriately
3. **API Mocking**: Consider MSW (Mock Service Worker) for API mocking
4. **Flaky Tests**: Implement retry logic and proper waits
5. **Test Isolation**: Each test should be independent
6. **Cleanup**: Ensure test cleanup (database, localStorage, IndexedDB)

---

## Additional Recommendations

### Consider Adding

1. **Mutation Testing** (with `stryker-mutator`)
   - Tests test quality by introducing bugs

2. **Property-Based Testing** (with `fast-check`)
   - Generates random inputs to find edge cases

3. **Contract Testing** (with Pact)
   - For microservices integration

4. **Performance Testing** (with Lighthouse CI)
   - Core Web Vitals in CI

5. **Test Analytics**
   - Track test flakiness
   - Identify slow tests
   - Code coverage trends

---

*Prompt generated: February 16, 2026*
*For AI Agent: Execute incrementally, prioritizing Phase 1 (Playwright E2E) and Phase 2 (Unit Test Expansion)*
