import React from 'react';
import { motion } from 'motion/react';
import { History, RotateCcw, TrendingUp, TrendingDown, Target } from 'lucide-react';
import { StockAnalysis } from '../../types';

interface BacktestPanelProps {
  analysis: StockAnalysis | null;
}

export const BacktestPanel = React.memo(({ analysis }: BacktestPanelProps) => {
  if (!analysis?.backtestResult) return null;

  const isPositive = analysis.backtestResult.actualReturn.startsWith('+');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="premium-card p-10 relative overflow-hidden group mb-12"
    >
      {/* Subtle Pattern Background */}
      <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity pointer-events-none">
        <RotateCcw size={160} className="text-indigo-600 rotate-12" />
      </div>
      
      <div className="relative z-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div className="flex items-center gap-5">
            <div className="h-14 w-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm shadow-indigo-500/5 group-hover:scale-105 transition-all">
              <History size={28} strokeWidth={1.5} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="section-label mb-0">Learning Loop</span>
                <div className="h-1 w-1 rounded-full bg-indigo-400" />
              </div>
              <h4 className="text-xl font-bold text-zinc-950 tracking-tight">历史预测复盘与研判纠偏</h4>
              <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mt-1">
                Last Analysis: {new Date(analysis.backtestResult.previousDate).toLocaleDateString('zh-CN')}
              </p>
            </div>
          </div>
          
          <div className={cn(
            "px-6 py-3 rounded-2xl border font-bold flex items-center gap-2 shadow-sm transition-all",
            isPositive 
              ? 'bg-emerald-50 border-emerald-100 text-emerald-600' 
              : 'bg-rose-50 border-rose-100 text-rose-600'
          )}>
            {isPositive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
            <span className="text-xs uppercase tracking-wider">区间实际收益:</span>
            <span className="text-lg font-mono tracking-tighter">{analysis.backtestResult.actualReturn}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-zinc-50 rounded-2xl p-6 border border-zinc-100 shadow-sm space-y-2 group-hover:bg-white transition-colors duration-500">
            <p className="text-[10px] text-zinc-400 uppercase font-bold tracking-widest flex items-center gap-1.5">
              <Target size={12} className="text-zinc-300" />
              上次核心研判
            </p>
            <p className="text-sm font-bold text-zinc-900 leading-relaxed">
              {analysis.backtestResult.previousRecommendation}
            </p>
          </div>
          
          <div className="bg-indigo-50/30 rounded-2xl p-6 border border-indigo-100/50 md:col-span-2 space-y-2 group-hover:bg-indigo-50/50 transition-colors duration-500">
            <p className="text-[10px] text-indigo-500 uppercase font-bold tracking-widest flex items-center gap-1.5">
              <Zap size={12} className="text-indigo-400" />
              专家组进化心得 (Alpha Extraction)
            </p>
            <p className="text-sm text-zinc-700 leading-relaxed font-medium italic">
              "{analysis.backtestResult.learningPoint}"
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
});

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

BacktestPanel.displayName = 'BacktestPanel';
