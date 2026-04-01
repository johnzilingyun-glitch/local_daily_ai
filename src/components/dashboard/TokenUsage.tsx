import React from 'react';
import { Coins, Activity, TrendingUp, BarChart3 } from 'lucide-react';

interface TokenUsageProps {
  tokenUsage: {
    promptTokens: number;
    candidatesTokens: number;
    totalTokens: number;
  };
}

export const TokenUsage = React.memo(({ tokenUsage }: TokenUsageProps) => {
  const limit = 1000000;
  const remaining = Math.max(0, limit - tokenUsage.totalTokens);
  const usagePercent = (tokenUsage.totalTokens / limit) * 100;

  return (
    <div className="premium-card p-8 group hover:border-indigo-200 transition-all duration-500 animate-premium overflow-hidden relative">
      {/* Subtle Progress Background */}
      <div 
        className="absolute bottom-0 left-0 h-1 bg-indigo-600/10 transition-all duration-1000 ease-out"
        style={{ width: `${Math.min(100, usagePercent)}%` }}
      />
      
      <div className="flex flex-col xl:flex-row items-center justify-between gap-10">
        <div className="flex items-center gap-5 w-full xl:w-auto">
          <div className="h-12 w-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0 shadow-sm shadow-indigo-500/5 transition-transform group-hover:scale-105">
            <Coins size={22} strokeWidth={1.5} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="section-label mb-0">Resource Monitoring</span>
              <Activity size={10} className="text-zinc-300 animate-pulse" />
            </div>
            <h3 className="text-sm font-bold text-zinc-950 tracking-tight">API 额度智能监测</h3>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-12 gap-y-6 w-full xl:w-auto divide-x-0 md:divide-x divide-zinc-100">
          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Tokens Input</p>
            <p className="text-xl font-mono font-bold text-zinc-900 tabular-nums tracking-tighter">
              {tokenUsage.promptTokens.toLocaleString()}
            </p>
          </div>
          
          <div className="space-y-1 md:pl-10">
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Response Sync</p>
            <p className="text-xl font-mono font-bold text-zinc-900 tabular-nums tracking-tighter">
              {tokenUsage.candidatesTokens.toLocaleString()}
            </p>
          </div>
          
          <div className="space-y-1 md:pl-10">
            <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-600">Session Total</p>
            <p className="text-xl font-mono font-bold text-indigo-600 tabular-nums tracking-tighter">
              {tokenUsage.totalTokens.toLocaleString()}
            </p>
          </div>

          <div className="space-y-1 md:pl-10">
            <div className="flex items-center gap-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600">Remaining</p>
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <p className="text-xl font-mono font-bold text-emerald-600 tabular-nums tracking-tighter">
              {remaining.toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
});

TokenUsage.displayName = 'TokenUsage';
