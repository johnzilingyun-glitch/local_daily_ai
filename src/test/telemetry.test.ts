import { describe, it, expect, vi, beforeEach } from 'vitest';
import { telemetryService } from '../services/telemetryService';

describe('TelemetryService', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      })
    ));
  });

  it('should report cache hit', async () => {
    await telemetryService.reportCacheHit('AAPL');
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/telemetry/report'),
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('cache_hit')
      })
    );
  });

  it('should report fallback', async () => {
    await telemetryService.reportFallback('gemini-pro', 'gemini-flash', 'TSLA');
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/telemetry/report'),
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('model_fallback')
      })
    );
  });

  it('should report retry', async () => {
    await telemetryService.reportRetry('gemini-pro', 2, 'MSFT');
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/telemetry/report'),
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('retry')
      })
    );
  });
});
