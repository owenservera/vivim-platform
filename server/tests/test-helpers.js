/**
 * Test Helpers
 *
 * Common test utilities and mocks
 */

// Mock database connection
let prismaMock = null;

export function mockDatabase() {
  if (prismaMock) return prismaMock;

  prismaMock = {
    conversation: {
      create: () => Promise.resolve({}),
      findUnique: () => Promise.resolve(null),
      findMany: () => Promise.resolve([]),
      count: () => Promise.resolve(0),
      update: () => Promise.resolve({}),
      delete: () => Promise.resolve({}),
      groupBy: () => Promise.resolve([]),
    },
    captureAttempt: {
      create: () => Promise.resolve({}),
      update: () => Promise.resolve({}),
      findMany: () => Promise.resolve([]),
      count: () => Promise.resolve(0),
      findFirst: () => Promise.resolve(null),
      aggregate: () => Promise.resolve({}),
    },
    $disconnect: () => Promise.resolve(),
    $transaction: () => Promise.resolve({}),
  };

  // Mock the database module
  global.prismaMock = prismaMock;
  return prismaMock;
}

export function clearDatabaseMock() {
  prismaMock = null;
  global.prismaMock = null;
}
