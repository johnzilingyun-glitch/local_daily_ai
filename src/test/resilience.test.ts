import { describe, it, expect, vi, beforeEach } from 'vitest';
import { withRetry, getDeduplicatedContent } from '../services/geminiService';

describe('Resilience & Deduplication', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('withRetry Fallback', () => {
    it('should trigger fallbackFn when hitting 429 error and retries are exhausted', async () => {
      const primaryFn = vi.fn().mockRejectedValue({ status: 429, message: 'RESOURCE_EXHAUSTED' });
      const fallbackFn = vi.fn().mockResolvedValue('fallback_success');

      // We set maxRetries to 1 for faster testing
      const result = await withRetry(primaryFn, 1, 100, fallbackFn);

      expect(primaryFn).toHaveBeenCalledTimes(1);
      expect(fallbackFn).toHaveBeenCalledTimes(1);
      expect(result).toBe('fallback_success');
    });

    it('should throw original error if no fallbackFn is provided', async () => {
      const primaryFn = vi.fn().mockRejectedValue({ status: 429, message: 'RESOURCE_EXHAUSTED' });

      await expect(withRetry(primaryFn, 1, 100)).rejects.toMatchObject({ status: 429 });
    });

    it('should retry on 500 errors but eventually throw if they persist', async () => {
      const primaryFn = vi.fn().mockRejectedValue({ status: 500, message: 'Internal Server Error' });

      await expect(withRetry(primaryFn, 2, 10)).rejects.toMatchObject({ status: 500 });
      expect(primaryFn).toHaveBeenCalledTimes(2);
    });
  });

  describe('getDeduplicatedContent', () => {
    it('should only call requestFn once for multiple concurrent requests with same key', async () => {
      const requestFn = vi.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve('data'), 50))
      );

      const p1 = getDeduplicatedContent('key1', requestFn);
      const p2 = getDeduplicatedContent('key1', requestFn);
      const p3 = getDeduplicatedContent('key1', requestFn);

      const results = await Promise.all([p1, p2, p3]);

      expect(results).toEqual(['data', 'data', 'data']);
      expect(requestFn).toHaveBeenCalledTimes(1);
    });

    it('should allow new request after previous one completes', async () => {
      const requestFn = vi.fn().mockResolvedValue('data');

      await getDeduplicatedContent('key2', requestFn);
      await getDeduplicatedContent('key2', requestFn);

      expect(requestFn).toHaveBeenCalledTimes(2);
    });
  });
});
