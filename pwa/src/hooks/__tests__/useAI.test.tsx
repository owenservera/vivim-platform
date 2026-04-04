import { describe, it, expect } from 'vitest';
import { aiQueryKeys } from '../../hooks/useAI';

describe('useAI hook exports', () => {
  describe('aiQueryKeys', () => {
    it('should have correct providers key', () => {
      expect(aiQueryKeys.providers).toEqual(['ai', 'providers']);
    });

    it('should have correct models key', () => {
      expect(aiQueryKeys.models).toEqual(['ai', 'models']);
    });
  });

  describe('exports', () => {
    it('should export useAICompletion', async () => {
      const module = await import('../../hooks/useAI');
      expect(module.useAICompletion).toBeDefined();
    });

    it('should export useAIStream', async () => {
      const module = await import('../../hooks/useAI');
      expect(module.useAIStream).toBeDefined();
    });

    it('should export useAIChat', async () => {
      const module = await import('../../hooks/useAI');
      expect(module.useAIChat).toBeDefined();
    });

    it('should export useFreshChat', async () => {
      const module = await import('../../hooks/useAI');
      expect(module.useFreshChat).toBeDefined();
    });

    it('should export useAISettings', async () => {
      const module = await import('../../hooks/useAI');
      expect(module.useAISettings).toBeDefined();
    });

    it('should export useAIProviders', async () => {
      const module = await import('../../hooks/useAI');
      expect(module.useAIProviders).toBeDefined();
    });

    it('should export useAIModels', async () => {
      const module = await import('../../hooks/useAI');
      expect(module.useAIModels).toBeDefined();
    });
  });
});
