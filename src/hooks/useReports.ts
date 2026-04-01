import { useCallback } from 'react';
import { useConfigStore } from '../stores/useConfigStore';
import { useUIStore } from '../stores/useUIStore';
import { useMarketStore } from '../stores/useMarketStore';
import { useAnalysisStore } from '../stores/useAnalysisStore';
import { 
  getDailyReport, 
  getStockReport, 
  getDiscussionReport, 
  getChatReport 
} from '../services/aiService';

export function useReports() {
  const { config: geminiConfig } = useConfigStore();
  const ui = useUIStore();
  const marketStore = useMarketStore();
  const analysisStore = useAnalysisStore();

  const sendReport = useCallback(async (report: string, type: string, data?: any) => {
    ui.setIsSendingReport(true);
    try {
      const response = await fetch('/api/feishu/send-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          content: report, 
          type, 
          data,
          feishuWebhookUrl: geminiConfig.feishuWebhookUrl 
        })
      });
      if (!response.ok) throw new Error('Failed to send report');
      ui.setReportStatus('success');
      setTimeout(() => ui.setReportStatus('idle'), 3000);
      return true;
    } catch (error) {
      console.error('Report Sending Error:', error);
      ui.setReportStatus('error');
      return false;
    } finally {
      ui.setIsSendingReport(false);
    }
  }, [geminiConfig.feishuWebhookUrl, ui.setIsSendingReport, ui.setReportStatus]);

  const handleTriggerDailyReport = useCallback(async () => {
    const marketOverview = marketStore.marketOverviews[marketStore.overviewMarket];
    if (!marketOverview) return;
    ui.setIsGeneratingReport(true);
    try {
      const report = await getDailyReport(marketOverview, geminiConfig);
      await sendReport(report, 'daily', marketOverview);
    } catch (error) {
       ui.setReportStatus('error');
    } finally {
      ui.setIsGeneratingReport(false);
    }
  }, [geminiConfig, marketStore.marketOverviews, marketStore.overviewMarket, ui.setIsGeneratingReport, ui.setReportStatus, sendReport]);

  const handleSendStockReport = useCallback(async () => {
    if (!analysisStore.analysis) return;
    ui.setIsGeneratingReport(true);
    try {
      const report = await getStockReport(analysisStore.analysis, geminiConfig);
      await sendReport(report, 'stock', analysisStore.analysis);
    } catch (error) {
       ui.setReportStatus('error');
    } finally {
      ui.setIsGeneratingReport(false);
    }
  }, [geminiConfig, analysisStore.analysis, ui.setIsGeneratingReport, ui.setReportStatus, sendReport]);

  const handleSendDiscussionReport = useCallback(async () => {
     if (!analysisStore.analysis || analysisStore.discussionMessages.length === 0) return;
     ui.setIsGeneratingReport(true);
     try {
       const report = await getDiscussionReport(
         analysisStore.analysis, 
         analysisStore.discussionMessages, 
         analysisStore.scenarios, 
         analysisStore.backtestResult as any, 
         geminiConfig
       );
       await sendReport(report, 'discussion', analysisStore.analysis);
     } catch (error) {
        ui.setReportStatus('error');
     } finally {
       ui.setIsGeneratingReport(false);
     }
  }, [geminiConfig, analysisStore.analysis, analysisStore.discussionMessages, analysisStore.scenarios, analysisStore.backtestResult, ui.setIsGeneratingReport, ui.setReportStatus, sendReport]);

  return {
    handleTriggerDailyReport,
    handleSendStockReport,
    handleSendDiscussionReport,
    isGeneratingReport: ui.isGeneratingReport,
    isSendingReport: ui.isSendingReport,
    reportStatus: ui.reportStatus
  };
}
