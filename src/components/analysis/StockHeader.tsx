import React from 'react';
import { Award, ShieldCheck, TrendingUp, TrendingDown, Clock } from 'lucide-react';
import { StockAnalysis } from '../../types';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: any[]) {
  return twMerge(clsx(inputs));
}

interface StockHeaderProps {
  analysis: StockAnalysis;
}

export const StockHeader = React.memo(({ analysis }: StockHeaderProps) => {
  const { stockInfo } = analysis;
  const isPositive = (stockInfo?.change ?? 0) >= 0;

  return (
    <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-10 animate-premium">
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <span className="px-2 py-0.5 rounded-md bg-zinc-100 font-mono text-[9px] font-bold uppercase tracking-widest text-zinc-500 border border-zinc-200/50">
            {stockInfo?.market}
          </span>
          <div className="flex items-baseline gap-3">
            <h2 className="text-5xl font-bold tracking-tight text-zinc-950">{stockInfo?.name}</h2>
            <span className="font-mono text-lg font-medium text-zinc-400 tracking-tight">{stockInfo?.symbol}</span>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          {analysis.isDeepValue && (
            <div className="px-3 py-1 rounded-full bg-amber-50 text-[10px] font-bold text-amber-600 border border-amber-100 flex items-center gap-1.5 shadow-sm shadow-amber-500/5">
              <Award size={12} strokeWidth={2} />
              绝对安全边际
            </div>
          )}
          {analysis.moatAnalysis && (
            <div className="px-3 py-1 rounded-full bg-indigo-50 text-[10px] font-bold text-indigo-600 border border-indigo-100 flex items-center gap-1.5 shadow-sm shadow-indigo-500/5">
              <ShieldCheck size={12} strokeWidth={2} />
              护城河: {analysis.moatAnalysis.strength === "Wide" ? "宽阔" : "狭窄"}
            </div>
          )}
        </div>

        <div className="flex items-baseline gap-6">
          <span className="text-7xl font-bold tracking-tighter text-zinc-950">
            {stockInfo?.price?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            <span className="ml-3 text-2xl font-medium uppercase text-zinc-400">{stockInfo?.currency}</span>
          </span>
          <div className={cn(
            'flex items-center gap-2 text-3xl font-bold tracking-tight px-3 py-1 transition-all duration-700',
            isPositive ? 'text-rose-500' : 'text-emerald-500'
          )}>
            {isPositive ? <TrendingUp size={28} strokeWidth={2.5} /> : <TrendingDown size={28} strokeWidth={2.5} />}
            <span>{isPositive ? '+' : ''}{stockInfo?.change}</span>
            <span className="text-xl opacity-60 ml-1">({stockInfo?.changePercent}%)</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-6 lg:pb-2">
        <div className="h-10 w-px bg-zinc-100 hidden lg:block" />
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">
             <Clock size={12} strokeWidth={2} />
             <span>最后更新</span>
          </div>
          <p className="text-sm font-semibold text-zinc-900">{stockInfo?.lastUpdated || '--'}</p>
        </div>
      </div>
    </div>
  );
});

StockHeader.displayName = 'StockHeader';
