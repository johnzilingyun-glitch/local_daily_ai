import React from 'react';
import { Zap, Award, AlertTriangle, Target, Share2, Loader2, CheckCircle2, MessageSquareQuote } from 'lucide-react';
import { StockAnalysis } from '../../types';

interface DiscussionSummaryProps {
  analysis: StockAnalysis;
  isDiscussing: boolean;
  discussionMessages: any[];
  controversialPoints: string[];
  reportStatus: 'idle' | 'success' | 'error';
  isGeneratingReport: boolean;
  isSendingReport: boolean;
  handleSendDiscussionReport: () => void;
}

export const DiscussionSummary = React.memo(({
  analysis,
  isDiscussing,
  discussionMessages,
  controversialPoints,
  reportStatus,
  isGeneratingReport,
  isSendingReport,
  handleSendDiscussionReport
}: DiscussionSummaryProps) => {
  if (!isDiscussing && discussionMessages.length === 0) return null;

  return (
    <div className="space-y-12 animate-premium">
      <div className="premium-card p-10 md:p-16 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 blur-[120px] -z-10" />
        
        <div className="flex items-center gap-4 mb-12">
          <div className="p-3 rounded-2xl bg-indigo-600 text-white shadow-xl shadow-indigo-600/20">
            <MessageSquareQuote size={24} strokeWidth={1.5} />
          </div>
          <div>
            <span className="section-label mb-0">Expert Group Discussion</span>
            <h3 className="text-xl font-bold text-zinc-950 tracking-tight">研讨会核心结论与场景分析</h3>
          </div>
        </div>

        {isDiscussing && discussionMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-6 py-20">
            <Loader2 size={32} className="animate-spin text-indigo-600" />
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-400 animate-pulse">
              专家组正在深度研判中...
            </p>
          </div>
        ) : (
          <div className="space-y-12">
            {/* Final Conclusion */}
            {analysis.finalConclusion && (
               <div className="p-8 rounded-3xl bg-indigo-50/50 border border-indigo-100/50 group hover:bg-indigo-50 transition-all duration-500">
                 <div className="flex items-center gap-2 mb-4 text-indigo-600">
                    <Award size={18} strokeWidth={2} /> 
                    <span className="text-[11px] font-bold uppercase tracking-widest">联席会议最终结论</span>
                 </div>
                 <p className="text-xl text-zinc-900 leading-relaxed font-semibold tracking-tight">
                   {analysis.finalConclusion}
                 </p>
               </div>
            )}

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              {/* Conflict Logger */}
              {controversialPoints.length > 0 && (
                <div className="p-8 rounded-3xl bg-rose-50/30 border border-rose-100/50 space-y-6">
                  <div className="flex items-center gap-2 text-rose-600">
                     <AlertTriangle size={18} strokeWidth={2} />
                     <span className="text-[11px] font-bold uppercase tracking-widest">核心分歧点 (Conflict Logger)</span>
                  </div>
                  <div className="space-y-4">
                     {controversialPoints.map((p, idx) => (
                       <div key={idx} className="flex gap-3 text-sm text-zinc-600 leading-relaxed">
                          <span className="text-rose-500 font-bold shrink-0">·</span>
                          <p className="font-medium">{p}</p>
                       </div>
                     ))}
                  </div>
                </div>
              )}

              {/* Trading Plan */}
              {analysis.tradingPlan && (
                <div className="p-8 rounded-3xl bg-zinc-50 border border-zinc-100 space-y-6">
                   <div className="flex items-center gap-2 text-zinc-900">
                      <Target size={18} strokeWidth={2} />
                      <span className="text-[11px] font-bold uppercase tracking-widest">联席会议执行建议</span>
                   </div>
                   <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="p-4 rounded-2xl bg-white border border-zinc-100 shadow-sm">
                        <p className="text-[9px] text-zinc-400 uppercase font-bold tracking-widest mb-1">建议进场</p>
                        <p className="text-lg text-rose-500 font-bold tabular-nums">{analysis.tradingPlan.entryPrice}</p>
                      </div>
                      <div className="p-4 rounded-2xl bg-white border border-zinc-100 shadow-sm">
                        <p className="text-[9px] text-zinc-400 uppercase font-bold tracking-widest mb-1">目标价</p>
                        <p className="text-lg text-indigo-600 font-bold tabular-nums">{analysis.tradingPlan.targetPrice}</p>
                      </div>
                      <div className="p-4 rounded-2xl bg-white border border-zinc-100 shadow-sm">
                        <p className="text-[9px] text-zinc-400 uppercase font-bold tracking-widest mb-1">战术止损</p>
                        <p className="text-lg text-emerald-600 font-bold tabular-nums">{analysis.tradingPlan.stopLoss}</p>
                      </div>
                   </div>
                </div>
              )}
            </div>

            {/* Discussion Report Action */}
            <div className="pt-6 border-t border-zinc-100">
              <button
                onClick={handleSendDiscussionReport}
                disabled={isGeneratingReport || isSendingReport}
                className="w-full btn-primary h-14 rounded-2xl shadow-xl shadow-indigo-600/10"
              >
                {isGeneratingReport || isSendingReport ? (
                   <Loader2 size={18} className="animate-spin" />
                ) : reportStatus === 'success' ? (
                   <CheckCircle2 size={18} />
                ) : (
                   <Share2 size={18} />
                )}
                <span>发送研讨总结至飞书系统</span>
              </button>
              <p className="mt-4 text-center text-[10px] text-zinc-400 font-medium">
                研讨结果将通过飞书互动卡片实时推送到您的投资决策终端
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

DiscussionSummary.displayName = 'DiscussionSummary';
