import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useReports } from '../hooks/useReports';
import { useUIStore } from '../stores/useUIStore';
import { useMarketStore } from '../stores/useMarketStore';
import { getDailyReport } from '../services/aiService';

// Mock dependencies
vi.mock('../stores/useConfigStore', () => ({
  useConfigStore: () => ({ config: { feishuWebhookUrl: 'http://test-webhook' } })
}));

vi.mock('../stores/useUIStore', () => ({
  useUIStore: vi.fn()
}));

vi.mock('../stores/useMarketStore', () => ({
  useMarketStore: vi.fn()
}));

vi.mock('../stores/useAnalysisStore', () => ({
  useAnalysisStore: () => ({ analysis: {}, discussionMessages: [], scenarios: [] })
}));

vi.mock('../services/aiService', () => ({
  getDailyReport: vi.fn(),
  getStockReport: vi.fn(),
  getDiscussionReport: vi.fn()
}));

global.fetch = vi.fn();

describe('useReports hook', () => {
  const mockSetIsGeneratingReport = vi.fn();
  const mockSetIsSendingReport = vi.fn();
  const mockSetReportStatus = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    (useUIStore as any).mockReturnValue({
      setIsGeneratingReport: mockSetIsGeneratingReport,
      setIsSendingReport: mockSetIsSendingReport,
      setReportStatus: mockSetReportStatus,
      isGeneratingReport: false,
      isSendingReport: false,
      reportStatus: 'idle'
    });

    (useMarketStore as any).mockReturnValue({
      marketOverviews: { 'US': { summary: 'All good' } },
      overviewMarket: 'US'
    });
  });

  it('should trigger daily report and send it', async () => {
    (getDailyReport as any).mockResolvedValue('Mock Report Content');
    (fetch as any).mockResolvedValue({ ok: true });

    const { result } = renderHook(() => useReports());

    await act(async () => {
      await result.current.handleTriggerDailyReport();
    });

    expect(mockSetIsGeneratingReport).toHaveBeenCalledWith(true);
    expect(getDailyReport).toHaveBeenCalled();
    expect(fetch).toHaveBeenCalledWith('/api/feishu/send-report', expect.objectContaining({
      method: 'POST',
      body: expect.stringContaining('Mock Report Content')
    }));
    expect(mockSetIsGeneratingReport).toHaveBeenCalledWith(false);
  });

  it('should handle errors in daily report trigger', async () => {
    (getDailyReport as any).mockRejectedValue(new Error('Generation failed'));

    const { result } = renderHook(() => useReports());

    await act(async () => {
      await result.current.handleTriggerDailyReport();
    });

    expect(mockSetReportStatus).toHaveBeenCalledWith('error');
    expect(mockSetIsGeneratingReport).toHaveBeenCalledWith(false);
  });
});
