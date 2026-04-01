import React from 'react';
import { 
  ArrowLeft,
  Download,
  Share2,
  CheckCircle2,
  Loader2,
  FileText,
  AlertCircle
} from 'lucide-react';
import { motion } from 'motion/react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { StockAnalysis, AgentMessage, TradingPlanVersion } from '../../types';

// Sub-components
import { StockHeader } from './StockHeader';
import { AnalysisGrid } from './AnalysisGrid';
import { DiscussionSummary } from './DiscussionSummary';

function cn(...inputs: any[]) {
  return twMerge(clsx(inputs));
}

interface AnalysisResultProps {
  analysis: StockAnalysis;
  isDiscussing: boolean;
  isReviewing: boolean;
  discussionMessages: AgentMessage[];
  controversialPoints: string[];
  tradingPlanHistory: TradingPlanVersion[];
  scenarios: any[];
  expectationGap: any | null;
  sensitivityFactors: any[];
  calculations: any[];
  stressTestLogic: string | null;
  catalystList: any[];
  verificationMetrics: any[];
  capitalFlow: any | null;
  positionManagement: any | null;
  timeDimension: any | null;
  dataFreshnessStatus: string | null;
  reportStatus: 'idle' | 'success' | 'error';
  isGeneratingReport: boolean;
  isSendingReport: boolean;
  handleSendStockReport: () => void;
  handleSendDiscussionReport: () => void;
  handleExportFullReport: () => void;
  handleDiscussionQuestion: (question: string) => void;
  resetToHome: () => void;
}

export const AnalysisResult = React.memo(({
  analysis,
  isDiscussing,
  discussionMessages,
  controversialPoints,
  reportStatus,
  isGeneratingReport,
  isSendingReport,
  handleSendStockReport,
  handleSendDiscussionReport,
  handleExportFullReport,
  resetToHome
}: AnalysisResultProps) => {
  return (
    <motion.main
      initial={{ opacity: 0, scale: 0.99 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.99 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-12 pb-32"
    >
      {/* Top Action Bar - Minimalist */}
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between px-2">
        <button
          onClick={resetToHome}
          className="group flex items-center gap-3 text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-400 transition-all hover:text-zinc-800"
        >
          <div className="w-8 h-8 rounded-full border border-zinc-100 flex items-center justify-center group-hover:bg-zinc-100 transition-colors">
            <ArrowLeft size={14} strokeWidth={2} className="transition-transform group-hover:-translate-x-0.5" />
          </div>
          返回仪表盘
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportFullReport}
            className="btn-secondary h-11 px-6 shadow-sm"
          >
            <Download size={16} strokeWidth={1.5} className="opacity-60" />
            <span>导出 PDF 报告</span>
          </button>
          
          <button
            onClick={handleSendStockReport}
            disabled={isGeneratingReport || isSendingReport}
            className={cn(
              "btn-primary h-11 px-6 shadow-indigo-600/5",
              reportStatus === 'success' && "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/10",
              reportStatus === 'error' && "bg-rose-500 hover:bg-rose-600"
            )}
          >
            {isGeneratingReport || isSendingReport ? (
              <><Loader2 className="animate-spin" size={16} /><span>引擎生成中</span></>
            ) : reportStatus === 'success' ? (
              <><CheckCircle2 size={16} /><span>已送达飞书</span></>
            ) : (
              <><Share2 size={16} /><span>发送个股简报</span></>
            )}
          </button>
        </div>
      </div>

      {/* Main Content Card - Document Style */}
      <div className="premium-card p-8 md:p-16 relative overflow-hidden">
        {/* Partial Results Banner (Quota Mode) */}
        {(analysis as any).isDegraded && (
          <div className="mb-12 flex items-start gap-4 p-6 rounded-2xl bg-amber-50 border border-amber-200/50 text-amber-800 animate-premium">
            <div className="h-10 w-10 shrink-0 flex items-center justify-center rounded-xl bg-amber-100 text-amber-600">
              <AlertCircle size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-tight mb-1">研报引擎处于“降级模式”</h3>
              <p className="text-xs text-amber-700/80 leading-relaxed font-medium">
                由于 AI 服务配额已耗尽，深度研判功能暂时受限。当前为您展示的是基于实时成交数据的“硬指标”分析。您可以稍后刷新或在设置中配置个人 API Key 以解锁完整深度报告。
              </p>
            </div>
          </div>
        )}
        
        {/* Subtle Accent Bar */}
        <div className="absolute top-0 left-0 w-2 h-full bg-indigo-600/80" />
        
        <div className="space-y-24">
          <section>
            <div className="flex items-center gap-3 mb-10">
               <FileText size={20} className="text-zinc-300" strokeWidth={1.5} />
               <span className="section-label mb-0">Deep Analysis Report</span>
            </div>
            <StockHeader analysis={analysis} />
          </section>
          
          <section>
            <AnalysisGrid analysis={analysis} />
          </section>
        </div>
      </div>

      {/* Discussion Section */}
      <DiscussionSummary 
        analysis={analysis}
        isDiscussing={isDiscussing}
        discussionMessages={discussionMessages}
        controversialPoints={controversialPoints}
        reportStatus={reportStatus}
        isGeneratingReport={isGeneratingReport}
        isSendingReport={isSendingReport}
        handleSendDiscussionReport={handleSendDiscussionReport}
      />
    </motion.main>
  );
});

AnalysisResult.displayName = 'AnalysisResult';
