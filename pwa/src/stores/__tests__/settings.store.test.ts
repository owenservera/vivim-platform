import { describe, it, expect } from 'vitest';

describe('settings.store exports', () => {
  it('should export useSettingsStore', async () => {
    const { useSettingsStore } = await import('../settings.store');
    expect(useSettingsStore).toBeDefined();
  });

  it('should have setTheme function', () => {
    const { useSettingsStore } = require('../settings.store');
    expect(useSettingsStore.getState().setTheme).toBeDefined();
  });

  it('should have setApiBaseUrl function', () => {
    const { useSettingsStore } = require('../settings.store');
    expect(useSettingsStore.getState().setApiBaseUrl).toBeDefined();
  });

  it('should have setUseRustCore function', () => {
    const { useSettingsStore } = require('../settings.store');
    expect(useSettingsStore.getState().setUseRustCore).toBeDefined();
  });

  it('should have setAutoCapture function', () => {
    const { useSettingsStore } = require('../settings.store');
    expect(useSettingsStore.getState().setAutoCapture).toBeDefined();
  });

  it('should have setNotifications function', () => {
    const { useSettingsStore } = require('../settings.store');
    expect(useSettingsStore.getState().setNotifications).toBeDefined();
  });

  it('should have setRegion function', () => {
    const { useSettingsStore } = require('../settings.store');
    expect(useSettingsStore.getState().setRegion).toBeDefined();
  });
});
