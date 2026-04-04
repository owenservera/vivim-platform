import { describe, it, expect } from 'vitest';

describe('sync.store exports', () => {
  it('should export useSyncStore', async () => {
    const { useSyncStore } = await import('../sync.store');
    expect(useSyncStore).toBeDefined();
  });

  it('should have setStatus function', () => {
    const { useSyncStore } = require('../sync.store');
    expect(useSyncStore.getState().setStatus).toBeDefined();
  });

  it('should have setLastSync function', () => {
    const { useSyncStore } = require('../sync.store');
    expect(useSyncStore.getState().setLastSync).toBeDefined();
  });

  it('should have addDevice function', () => {
    const { useSyncStore } = require('../sync.store');
    expect(useSyncStore.getState().addDevice).toBeDefined();
  });

  it('should have removeDevice function', () => {
    const { useSyncStore } = require('../sync.store');
    expect(useSyncStore.getState().removeDevice).toBeDefined();
  });

  it('should have updateDevice function', () => {
    const { useSyncStore } = require('../sync.store');
    expect(useSyncStore.getState().updateDevice).toBeDefined();
  });

  it('should have setPendingChanges function', () => {
    const { useSyncStore } = require('../sync.store');
    expect(useSyncStore.getState().setPendingChanges).toBeDefined();
  });

  it('should have incrementPending function', () => {
    const { useSyncStore } = require('../sync.store');
    expect(useSyncStore.getState().incrementPending).toBeDefined();
  });

  it('should have decrementPending function', () => {
    const { useSyncStore } = require('../sync.store');
    expect(useSyncStore.getState().decrementPending).toBeDefined();
  });
});
