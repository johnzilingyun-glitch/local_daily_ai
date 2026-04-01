import React from 'react';
import { motion } from 'motion/react';
import { Calculator, Activity, Table, ArrowRight, Clock, Shield, Target, TrendingUp } from 'lucide-react';
import { StockAnalysis } from '../../types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ExpectedValuePanelProps {
  analysis: StockAnalysis | null;
}

export const ExpectedValuePanel = React.memo(({ analysis }: ExpectedValuePanelProps) => {
  if (!analysis?.expectedValueOutcome) return null;

  const { expectedValueOutcome, sensitivityMatrix } = analysis;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
      className="max-w-5xl mx-auto space-y-10 mb-12 animate-premium"
    >
      {/* Header with EV Summary */}
      <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6 px-1">
        <div className="flex items-center gap-5">
          <div className="h-14 w-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm shadow-indigo-500/5">
            <Calculator size={28} strokeWidth={1.5} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="section-label mb-0">Quantitative Valuation</span>
              <div className="h-1 w-1 rounded-full bg-indigo-400" />
            </div>
            <h4 className="text-xl font-bold text-zinc-950 tracking-tight">期望价值中枢预测 (EV Basis)</h4>
          </div>
        </div>
        
        <div className="flex flex-col items-start md:items-end group p-4 rounded-2xl bg-indigo-50/30 border border-indigo-100/50">
          <p className="text-[10px] text-indigo-500 uppercase font-bold tracking-widest mb-1 flex items-center gap-1.5">
            <Target size={12} strokeWidth={2.5} /> 统一期望目标价
          </p>
          <p className="text-4xl font-bold text-indigo-600 tracking-tighter tabular-nums">
            {expectedValueOutcome.expectedPrice}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* EV Calculation logic */}
        <div className="premium-card p-10 flex flex-col justify-between group relative overflow-hidden">
          <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/5 blur-[80px] pointer-events-none" />
          
          <div className="space-y-6">
            <div className="flex items-center gap-3 border-b border-zinc-100 pb-5">
              <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
                <Activity size={18} strokeWidth={2} />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">概率加权演算逻辑</span>
            </div>
            
            <div className="p-6 rounded-2xl bg-zinc-50 border border-zinc-100 font-medium text-sm text-zinc-600 leading-relaxed italic border-l-4 border-l-indigo-600 shadow-sm">
              "{expectedValueOutcome.calculationLogic}"
            </div>
          </div>
          
          <div className="mt-8 flex items-center justify-between text-[11px] text-zinc-400 font-bold uppercase tracking-wider pt-6 border-t border-zinc-50">
            <div className="flex items-center gap-2">
              <span className="text-zinc-300">置信区间:</span>
              <span className="text-zinc-500">{expectedValueOutcome.confidenceInterval}</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100">
              <Shield size={10} strokeWidth={2.5} />
              <span>机构级验证已锁定</span>
            </div>
          </div>
        </div>

        {/* Sensitivity Matrix */}
        {sensitivityMatrix && (
          <div className="premium-card p-10 group relative overflow-hidden">
            <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-600/5 blur-[80px] pointer-events-none" />
            
            <div className="flex items-center gap-3 border-b border-zinc-100 pb-5 mb-6">
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
                <Table size={18} strokeWidth={2} />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">利润敏感度交叉矩阵 (Static)</span>
            </div>
            
            <div className="space-y-4">
              {sensitivityMatrix.map((row, idx) => (
                <div key={`smr-${idx}`} className="flex items-center justify-between py-3 px-1 border-b border-zinc-50 last:border-0 hover:bg-zinc-50/50 rounded-xl transition-all group/row">
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-zinc-900 group-hover/row:text-emerald-600 transition-colors">{row.variable}</span>
                      <span className="text-[10px] text-zinc-400 font-medium mt-0.5">{row.change}</span>
                    </div>
                    <ArrowRight size={12} className="text-zinc-300 group-hover/row:translate-x-1 transition-transform" />
                  </div>
                  
                  <div className="text-right">
                    <div className={cn(
                      "font-bold text-sm tabular-nums tracking-tight",
                      row.profitImpact.includes('+') ? "text-emerald-600" : "text-rose-600"
                    )}>
                      {row.profitImpact}
                    </div>
                    <div className="flex items-center gap-1 justify-end text-[9px] font-bold text-zinc-300 uppercase tracking-tighter mt-0.5">
                      <Clock size={8} /> {row.timeLag}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
});

ExpectedValuePanel.displayName = 'ExpectedValuePanel';
