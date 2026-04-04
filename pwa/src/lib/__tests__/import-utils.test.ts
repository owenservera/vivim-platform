import { describe, it, expect, vi } from 'vitest';

describe('Import Utils (logic tests)', () => {
  const IMPORT_ERROR_MESSAGES: Record<string, { title: string; message: string; suggestion?: string }> = {
    'file_too_large': { title: 'File Too Large', message: 'The file you selected exceeds the maximum size limit.', suggestion: 'Try exporting a smaller date range.' },
    'invalid_file_type': { title: 'Invalid File Type', message: 'Only .zip files from ChatGPT exports are supported.', suggestion: 'Export from ChatGPT settings.' },
    'network_error': { title: 'Connection Error', message: 'Could not connect to the server.', suggestion: 'Check your internet connection.' },
    'unauthorized': { title: 'Unauthorized', message: 'You need to be logged in.', suggestion: 'Please log in.' },
  };

  function getUserFriendlyError(error: { message?: string }): { title: string; message: string; suggestion?: string } {
    const errorMessage = error?.message || '';
    const errorLower = errorMessage.toLowerCase();

    for (const [key, value] of Object.entries(IMPORT_ERROR_MESSAGES)) {
      if (errorLower.includes(key)) return value;
    }

    if (errorLower.includes('network') || errorLower.includes('fetch')) {
      return IMPORT_ERROR_MESSAGES.network_error;
    }

    if (errorLower.includes('permission') || errorLower.includes('access denied')) {
      return IMPORT_ERROR_MESSAGES.unauthorized;
    }

    return { title: 'Import Error', message: errorMessage, suggestion: 'Contact support.' };
  }

  describe('getUserFriendlyError', () => {
    it('maps file_too_large', () => {
      const result = getUserFriendlyError({ message: 'file_too_large' });
      expect(result.title).toBe('File Too Large');
    });

    it('maps network errors', () => {
      const result = getUserFriendlyError({ message: 'Network error occurred' });
      expect(result.title).toBe('Connection Error');
    });

    it('maps unauthorized errors', () => {
      const result = getUserFriendlyError({ message: 'permission denied' });
      expect(result.title).toBe('Unauthorized');
    });

    it('returns generic for unknown errors', () => {
      const result = getUserFriendlyError({ message: 'random error' });
      expect(result.title).toBe('Import Error');
    });
  });

  describe('formatFileSize', () => {
    function formatFileSize(bytes: number): string {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
    }

    it('formats bytes', () => expect(formatFileSize(500)).toBe('500 Bytes'));
    it('formats KB', () => expect(formatFileSize(1024)).toBe('1 KB'));
    it('formats MB', () => expect(formatFileSize(1048576)).toBe('1 MB'));
    it('formats GB', () => expect(formatFileSize(1073741824)).toBe('1 GB'));
    it('handles zero', () => expect(formatFileSize(0)).toBe('0 Bytes'));
  });

  describe('formatDuration', () => {
    function formatDuration(seconds: number): string {
      if (seconds < 60) return `${Math.round(seconds)}s`;
      if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${Math.round(seconds % 60)}s`;
      return `${Math.floor(seconds / 3600)}h ${Math.round((seconds % 3600) / 60)}m`;
    }

    it('formats seconds', () => expect(formatDuration(30)).toBe('30s'));
    it('formats minutes', () => expect(formatDuration(90)).toBe('1m 30s'));
    it('formats hours', () => expect(formatDuration(3600)).toBe('1h 0m'));
  });

  describe('calculateProgress', () => {
    function calculateProgress(processed: number, total: number, currentTier = 0, totalTiers = 5): number {
      if (total === 0) return 0;
      const tierWeight = 100 / totalTiers;
      const currentTierProgress = (processed / total) * tierWeight;
      const completedTiersProgress = currentTier * tierWeight;
      return Math.min(Math.round(completedTiersProgress + currentTierProgress), 100);
    }

    it('calculates progress for first tier', () => {
      expect(calculateProgress(5, 10, 0, 5)).toBe(10);
    });

    it('calculates progress for middle tier', () => {
      expect(calculateProgress(10, 10, 2, 5)).toBe(60);
    });

    it('handles zero total', () => {
      expect(calculateProgress(0, 0)).toBe(0);
    });

    it('caps at 100', () => {
      expect(calculateProgress(10, 10, 5, 5)).toBe(100);
    });
  });

  describe('retryWithBackoff', () => {
    async function retryWithBackoff<T>(fn: () => Promise<T>, maxRetries = 3, baseDelay = 1): Promise<T> {
      for (let i = 0; i < maxRetries; i++) {
        try { return await fn(); }
        catch (e) {
          if (i === maxRetries - 1) throw e;
          await new Promise(r => setTimeout(r, baseDelay * Math.pow(2, i)));
        }
      }
      throw new Error('should not reach');
    }

    it('succeeds on first attempt', async () => {
      const fn = vi.fn().mockResolvedValue('ok');
      const result = await retryWithBackoff(fn);
      expect(result).toBe('ok');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('retries on failure', async () => {
      const fn = vi.fn()
        .mockRejectedValueOnce(new Error('fail'))
        .mockResolvedValueOnce('ok');
      const result = await retryWithBackoff(fn, 3, 1);
      expect(result).toBe('ok');
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('throws after max retries', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('fail'));
      await expect(retryWithBackoff(fn, 3, 1)).rejects.toThrow();
      expect(fn).toHaveBeenCalledTimes(3);
    });
  });
});
