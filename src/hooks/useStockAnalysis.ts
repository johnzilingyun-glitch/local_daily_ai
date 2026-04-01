import { useState, useCallback } from 'react';
import { StockAnalysis, Market, AgentMessage } from '../types';
import { analyzeStock, startAgentDiscussion, sendChatMessage, saveAnalysisToHistory } from '../services/aiService';
import { useUIStore } from '../stores/useUIStore';
import { useAnalysisStore } from '../stores/useAnalysisStore';
import { useConfigStore } from '../stores/useConfigStore';
import { useMarketStore } from '../stores/useMarketStore';

export function useStockAnalysis() {
  const { config: geminiConfig } = useConfigStore();
  const { 
    setLoading, resetErrors, setAnalysisError, 
    setIsDiscussing, setIsChatting, setChatError,
    setShowDiscussion
  } = useUIStore();
  
  const {
    symbol, market, analysis, setAnalysis,
    setChatHistory, setDiscussionResults, resetAnalysis
  } = useAnalysisStore();

  const handleSearch = useCallback(async (searchSymbol?: string, searchMarket?: Market) => {
    const sym = searchSymbol || symbol;
    const mkt = searchMarket || market;
    
    if (!sym || !sym.trim()) return;

    setLoading(true);
    resetAnalysis();
    resetErrors();

    try {
      const result = await analyzeStock(sym, mkt, geminiConfig);
      setAnalysis(result);

      // Trigger Agent Discussion
      setShowDiscussion(false);
      setIsDiscussing(true);

      try {
        const discussion = await startAgentDiscussion(result, geminiConfig);
        setDiscussionResults(discussion);

        const finalAnalysis: StockAnalysis = {
          ...result,
          ...discussion,
          discussion: discussion.messages,
          tradingPlan: discussion.tradingPlan || result.tradingPlan,
          verificationMetrics: discussion.verificationMetrics || result.verificationMetrics,
          capitalFlow: discussion.capitalFlow || result.capitalFlow
        };
        setAnalysis(finalAnalysis);
        
        await saveAnalysisToHistory('stock', finalAnalysis);
      } catch (err) {
        console.error('Agent discussion failed:', err);
      } finally {
        setIsDiscussing(false);
      }
    } catch (err) {
      console.error(err);
      setAnalysisError(err instanceof Error ? err.message : '分析股票失败，请稍后重试。');
    } finally {
      setLoading(false);
    }
  }, [symbol, market, geminiConfig, setLoading, resetAnalysis, resetErrors, setAnalysis, setShowDiscussion, setIsDiscussing, setDiscussionResults, setAnalysisError]);

  const handleChat = useCallback(async (userMsg: string) => {
    if (!analysis) return;

    setChatError(null);
    const userMsgId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    setChatHistory((prev) => [...prev, { id: userMsgId, role: 'user', content: userMsg }]);
    setIsChatting(true);

    try {
      const reply = await sendChatMessage(userMsg, analysis, geminiConfig);
      const aiMsgId = `ai-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
      const aiMsg = { id: aiMsgId, role: 'ai' as const, content: reply || '抱歉，我暂时无法回答这个问题。' };
      
      setChatHistory((prev) => [...prev, aiMsg]);
      
      setAnalysis((prev) => {
        if (!prev) return null;
        const newHistory = [
          ...(prev.chatHistory || []),
          { id: userMsgId, role: 'user', content: userMsg },
          aiMsg
        ];
        const updatedAnalysis: StockAnalysis = {
          ...prev,
          chatHistory: newHistory as any
        };
        void saveAnalysisToHistory('stock', updatedAnalysis);
        return updatedAnalysis;
      });
    } catch (err) {
      console.error(err);
      setChatError(err instanceof Error ? err.message : '对话出错，请稍后重试。');
    } finally {
      setIsChatting(false);
    }
  }, [analysis, geminiConfig, setChatError, setChatHistory, setIsChatting, setAnalysis]);

  return {
    handleSearch,
    handleChat,
    resetAnalysis
  };
}
