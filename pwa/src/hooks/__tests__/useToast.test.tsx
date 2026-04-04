import { describe, it, expect } from 'vitest';

describe('useToast exports', () => {
  it('should export useToast', async () => {
    const { useToast } = await import('../../hooks/useToast');
    expect(useToast).toBeDefined();
  });
});
