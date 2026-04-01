import React from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, Database, AlertTriangle, CheckCircle2, Clock, Search } from 'lucide-react';
import { StockAnalysis } from '../../types';
import { getQualityLabel } from '../../services/dataQualityService';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface DataVerificationPanelProps {
  analysis: StockAnalysis | null;
}

export const DataVerificationPanel = React.memo(({ analysis }: DataVerificationPanelProps) => {
  if (!analysis?.dataVerification || analysis.dataVerification.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
      className="max-w-5xl mx-auto mb-12 animate-premium"
    >
      <div className="premium-card p-10 relative overflow-hidden group">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-600/5 blur-[80px] pointer-events-none" />
        
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b border-zinc-100 pb-8 mb-8 gap-6">
          <div className="flex items-center gap-5">
            <div className="h-14 w-14 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-sm shadow-emerald-500/5 transition-all group-hover:scale-105">
              <ShieldCheck size={28} strokeWidth={1.5} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="section-label mb-0 text-emerald-600">Audit Report</span>
                <div className="h-1 w-1 rounded-full bg-emerald-400" />
              </div>
              <h4 className="text-xl font-bold text-zinc-950 tracking-tight">数据多源交叉验证审计中心</h4>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            {analysis.dataQuality && (
              <div className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all duration-500 shadow-sm",
                getQualityLabel(analysis.dataQuality.score).color,
                "bg-white border-zinc-100 hover:border-emerald-500/30"
              )}>
                <Database size={12} className="text-emerald-500" />
                综合质量评分: <span className="text-zinc-900 tabular-nums">{analysis.dataQuality.score}%</span>
              </div>
            )}
            <div className="px-4 py-2 rounded-xl bg-zinc-50 border border-zinc-100 text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2 whitespace-nowrap">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Real-time monitoring active
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {analysis.dataVerification.map((item, idx) => (
            <div key={`verification-${idx}-${item.source}`} className="bg-zinc-50 border border-zinc-100 rounded-2xl p-6 space-y-5 hover:bg-white hover:shadow-md transition-all duration-300 group/item relative overflow-hidden">
              {item.isVerified && <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 blur-3xl -z-10" />}
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                   <div className="p-1.5 rounded-lg bg-white border border-zinc-100 shadow-xs">
                      <Search size={12} className="text-zinc-400" />
                   </div>
                   <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{item.source} Source</span>
                </div>
                
                {item.isVerified ? (
                  <span className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50/50 px-2.5 py-1 rounded-lg border border-emerald-100">
                    <CheckCircle2 size={10} strokeWidth={2.5} />
                    核心指标已对齐
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider text-rose-600 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-100 animate-pulse">
                    <AlertTriangle size={10} strokeWidth={2.5} />
                    检测到逻辑差异
                  </span>
                )}
              </div>

              {item.discrepancy && (
                <div className="bg-rose-50 border border-rose-100/50 rounded-xl p-4 flex gap-3 items-center shadow-xs">
                  <AlertTriangle size={14} className="text-rose-500 shrink-0" />
                  <p className="text-[11px] text-rose-700 leading-relaxed font-bold italic">
                    {item.discrepancy}
                  </p>
                </div>
              )}

              <div className="space-y-3 pt-4 border-t border-zinc-100/80">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Logic Confidence Agent</span>
                  <span className="text-[11px] font-bold text-zinc-900 tabular-nums">{item.confidence}%</span>
                </div>
                <div className="relative h-1.5 w-full bg-zinc-200/50 rounded-full overflow-hidden shadow-inner">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${item.confidence}%` }}
                    transition={{ duration: 1, delay: 0.5 }}
                    className={cn(
                      "h-full rounded-full shadow-sm",
                      item.confidence > 90 ? 'bg-emerald-500' : 'bg-amber-500'
                    )}
                  />
                </div>
                <div className="flex items-center justify-end gap-1.5 text-[9px] font-bold text-zinc-400 uppercase tracking-tighter mt-1">
                  <Clock size={10} />
                  <span>Verified: {new Date(item.lastChecked).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
});

DataVerificationPanel.displayName = 'DataVerificationPanel';
