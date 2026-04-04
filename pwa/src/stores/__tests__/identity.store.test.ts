import { describe, it, expect } from 'vitest';

describe('identity.store exports', () => {
  it('should export useIdentityStore', async () => {
    const { useIdentityStore } = await import('../identity.store');
    expect(useIdentityStore).toBeDefined();
  });

  it('should have setIdentity function', () => {
    const { useIdentityStore } = require('../identity.store');
    expect(useIdentityStore.getState().setIdentity).toBeDefined();
  });

  it('should have setTier function', () => {
    const { useIdentityStore } = require('../identity.store');
    expect(useIdentityStore.getState().setTier).toBeDefined();
  });

  it('should have unlock function', () => {
    const { useIdentityStore } = require('../identity.store');
    expect(useIdentityStore.getState().unlock).toBeDefined();
  });

  it('should have lock function', () => {
    const { useIdentityStore } = require('../identity.store');
    expect(useIdentityStore.getState().lock).toBeDefined();
  });

  it('should have clear function', () => {
    const { useIdentityStore } = require('../identity.store');
    expect(useIdentityStore.getState().clear).toBeDefined();
  });

  it('should have setProfile function', () => {
    const { useIdentityStore } = require('../identity.store');
    expect(useIdentityStore.getState().setProfile).toBeDefined();
  });
});
