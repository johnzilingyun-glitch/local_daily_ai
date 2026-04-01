import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, useDragControls } from 'motion/react';
import { 
  getMarketOverview, 
  startAgentDiscussion, 
  saveAnalysisToHistory, 
} from './services/aiService';
import { useConfigStore } from './stores/useConfigStore';
import { useUIStore } from './stores/useUIStore';
import { useMarketStore } from './stores/useMarketStore';
import { useAnalysisStore } from './stores/useAnalysisStore';

// New Components
import { Header } from './components/layout/Header';
import { TokenUsage } from './components/dashboard/TokenUsage';
import { MarketOverview } from './components/dashboard/MarketOverview';
import { AnalysisResult } from './components/analysis/AnalysisResult';
import { AdminPanel } from './components/admin/AdminPanel';
import { DiscussionPanel } from './components/DiscussionPanel';
import { SettingsModal } from './components/SettingsModal';
import { HistoryModal } from './components/HistoryModal';
import { ErrorToast } from './components/layout/ErrorToast';

// Hooks
import { useStockAnalysis } from './hooks/useStockAnalysis';
import { useReports } from './hooks/useReports';

export default function App() {
  const [isDiscussionFullscreen, setIsDiscussionFullscreen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const dragControls = useDragControls();

  const { config: geminiConfig, tokenUsage } = useConfigStore();
  const ui = useUIStore();
  const marketStore = useMarketStore();
  const analysisStore = useAnalysisStore();
  
  const { handleSearch, resetAnalysis } = useStockAnalysis();
  const { 
    handleTriggerDailyReport, 
    handleSendStockReport, 
    handleSendDiscussionReport,
    isGeneratingReport,
    isSendingReport,
    reportStatus
  } = useReports();

  const handleDiscussionQuestion = async (question: string) => {
    if (!analysisStore.analysis || ui.isReviewing || ui.isDiscussing) return;
    ui.setIsReviewing(true);
    const userMsg = { 
      id: `user-q-${Date.now()}`, 
      role: "Moderator" as const, 
      content: question, 
      timestamp: new Date().toISOString(), 
      type: "user_question" as const 
    };
    const updatedMessages = [...analysisStore.discussionMessages, userMsg];
    analysisStore.setDiscussionMessages(updatedMessages);
    try {
      const discussion = await startAgentDiscussion(analysisStore.analysis, geminiConfig, updatedMessages);
      analysisStore.setDiscussionResults(discussion);
      const final = { ...analysisStore.analysis, ...discussion, discussion: discussion.messages };
      analysisStore.setAnalysis(final);
      await saveAnalysisToHistory('stock', final);
    } finally {
      ui.setIsReviewing(false);
    }
  };

  const fetchMarketOverview = useCallback(async (forceRefresh = false) => {
    const { overviewMarket } = marketStore;
    ui.setOverviewLoading(true);
    ui.setOverviewError(null);
    try {
      const data = await getMarketOverview(geminiConfig, overviewMarket, forceRefresh);
      marketStore.setMarketOverview(overviewMarket, data);
      marketStore.setMarketLastUpdated(overviewMarket, Date.now());
    } catch (err: any) {
      console.error('[MARKET_FETCH_ERROR]', err);
      ui.setOverviewError(err.message || 'Failed to fetch market data');
    } finally {
      ui.setOverviewLoading(false);
    }
  }, [geminiConfig, marketStore.overviewMarket, marketStore.setMarketOverview, marketStore.setMarketLastUpdated, ui.setOverviewLoading, ui.setOverviewError]);

  useEffect(() => {
    if (marketStore._hasHydrated) {
      void fetchMarketOverview(false);
    }
  }, [marketStore._hasHydrated, fetchMarketOverview]);

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-600 font-sans selection:bg-indigo-500/10 transition-colors duration-500">
      {/* Subtle Background Decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[10%] left-[15%] h-[40%] w-[40%] rounded-full bg-indigo-500/5 blur-[120px]" />
        <div className="absolute bottom-[10%] right-[15%] h-[30%] w-[30%] rounded-full bg-violet-500/5 blur-[120px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-6 py-12 md:px-12">
        <ErrorToast />
        <HistoryModal 
          isOpen={isHistoryOpen} 
          onClose={() => setIsHistoryOpen(false)} 
          onSelect={(item) => {
            analysisStore.setAnalysis(item);
            analysisStore.setSymbol(item.stockInfo?.symbol || '');
            analysisStore.setMarket(item.stockInfo?.market || 'A-Share');
            setIsHistoryOpen(false);
          }}
        />

        <Header 
          symbol={analysisStore.symbol}
          setSymbol={analysisStore.setSymbol}
          market={analysisStore.market}
          setMarket={analysisStore.setMarket}
          onSearch={() => handleSearch()}
          loading={ui.loading}
          isAnalysisActive={!!analysisStore.analysis}
          onOpenHistory={() => setIsHistoryOpen(true)}
          onOpenAdmin={() => ui.setShowAdminPanel(!ui.showAdminPanel)}
          onOpenSettings={() => ui.setIsSettingsOpen(true)}
        />

        <div className="mb-12">
          <TokenUsage tokenUsage={tokenUsage} />
        </div>

        <AnimatePresence mode="wait">
          {analysisStore.analysis ? (
            <motion.div
              key="analysis"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              <AnalysisResult
                analysis={analysisStore.analysis}
                isDiscussing={ui.isDiscussing}
                isReviewing={ui.isReviewing}
                discussionMessages={analysisStore.discussionMessages}
                controversialPoints={analysisStore.controversialPoints}
                tradingPlanHistory={analysisStore.tradingPlanHistory}
                scenarios={analysisStore.scenarios}
                expectationGap={analysisStore.expectationGap}
                sensitivityFactors={analysisStore.sensitivityFactors}
                calculations={analysisStore.calculations}
                stressTestLogic={analysisStore.stressTestLogic}
                catalystList={analysisStore.catalystList}
                verificationMetrics={analysisStore.verificationMetrics}
                capitalFlow={analysisStore.capitalFlow}
                positionManagement={analysisStore.positionManagement}
                timeDimension={analysisStore.timeDimension}
                dataFreshnessStatus={analysisStore.dataFreshnessStatus}
                reportStatus={reportStatus}
                isGeneratingReport={isGeneratingReport}
                isSendingReport={isSendingReport}
                handleSendStockReport={handleSendStockReport}
                handleSendDiscussionReport={handleSendDiscussionReport}
                handleExportFullReport={() => {}}
                handleDiscussionQuestion={handleDiscussionQuestion}
                resetToHome={resetAnalysis}
              />
            </motion.div>
          ) : (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              <MarketOverview
                overviewMarket={marketStore.overviewMarket}
                setOverviewMarket={marketStore.setOverviewMarket}
                marketOverview={marketStore.marketOverviews[marketStore.overviewMarket]}
                overviewLoading={ui.overviewLoading}
                overviewError={ui.overviewError}
                marketLastUpdated={marketStore.marketLastUpdatedTimes[marketStore.overviewMarket]}
                autoRefreshInterval={ui.autoRefreshInterval}
                setAutoRefreshInterval={ui.setAutoRefreshInterval}
                fetchMarketOverview={fetchMarketOverview}
                setIsSettingsOpen={ui.setIsSettingsOpen}
                setSymbol={analysisStore.setSymbol}
                setMarket={analysisStore.setMarket}
              />
            </motion.div>
          )}
        </AnimatePresence>

        <SettingsModal />

        {ui.showAdminPanel && (
          <div className="mt-12 animate-premium">
            <AdminPanel 
              optimizationLogs={marketStore.optimizationLogs}
              historyItems={marketStore.historyItems}
              setSelectedDetail={ui.setSelectedDetail}
            />
          </div>
        )}
      </div>

      <AnimatePresence>
        {ui.showDiscussion && analysisStore.analysis && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-zinc-900/10 backdrop-blur-sm" onClick={() => ui.setShowDiscussion(false)} />
             <motion.div 
               initial={{ scale: 0.98, opacity: 0, y: 20 }} 
               animate={{ scale: 1, opacity: 1, y: 0 }} 
               exit={{ scale: 0.98, opacity: 0, y: 20 }}
               className="relative bg-white rounded-3xl w-full max-w-5xl h-[85vh] overflow-hidden border border-zinc-200 shadow-2xl"
             >
                <DiscussionPanel 
                  onSendMessage={handleDiscussionQuestion}
                  onClose={() => ui.setShowDiscussion(false)}
                  isFullscreen={isDiscussionFullscreen}
                  onToggleFullscreen={() => setIsDiscussionFullscreen(!isDiscussionFullscreen)}
                  onPointerDownDrag={(e) => dragControls.start(e)}
                />
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
