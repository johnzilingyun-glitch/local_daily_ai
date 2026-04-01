import React from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  BarChart3,
  Globe2,
  RefreshCw,
  AlertCircle,
  Flame,
  LineChart,
  Sparkles,
  ArrowRight,
  Zap,
  Activity
} from 'lucide-react';
import { IndexData, SectorAnalysis, MarketOverview as MarketOverviewType, Market } from '../../types';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface MarketOverviewProps {
  overviewMarket: Market;
  setOverviewMarket: (market: Market) => void;
  marketOverview: MarketOverviewType | undefined;
  overviewLoading: boolean;
  overviewError: string | null;
  marketLastUpdated: number | undefined;
  autoRefreshInterval: number;
  setAutoRefreshInterval: (interval: number) => void;
  fetchMarketOverview: (forceRefresh?: boolean) => Promise<void>;
  setIsSettingsOpen: (open: boolean) => void;
  setSymbol: (symbol: string) => void;
  setMarket: (market: Market) => void;
}

export const MarketOverview = ({
  overviewMarket,
  setOverviewMarket,
  marketOverview,
  overviewLoading,
  overviewError,
  marketLastUpdated,
  fetchMarketOverview,
  setSymbol,
  setMarket
}: MarketOverviewProps) => {

  const renderTrendIcon = (change: number = 0) => {
    if (change > 0) return <TrendingUp size={14} className="text-rose-500" />;
    if (change < 0) return <TrendingDown size={14} className="text-emerald-500" />;
    return null;
  };

  const getTrendColor = (change: number = 0) => {
    if (change > 0) return 'text-rose-600';
    if (change < 0) return 'text-emerald-600';
    return 'text-zinc-400';
  };

  const getTrendBg = (change: number = 0) => {
    if (change > 0) return 'bg-rose-50 border-rose-100';
    if (change < 0) return 'bg-emerald-50 border-emerald-100';
    return 'bg-zinc-50 border-zinc-100';
  };

  return (
    <div className="space-y-12 animate-premium max-w-[1600px] mx-auto">
      {/* Selection & Refresh Header */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between px-1">
        <div className="flex items-center gap-3 bg-white p-1.5 rounded-2xl border border-zinc-100 shadow-sm">
          {['A-Share', 'HK-Share', 'US-Share'].map((m) => (
            <button
              key={m}
              onClick={() => setOverviewMarket(m as Market)}
              className={cn(
                "px-6 py-2.5 rounded-xl text-xs font-bold tracking-wide transition-all duration-300",
                overviewMarket === m
                  ? 'bg-zinc-950 text-white shadow-xl shadow-zinc-950/20'
                  : 'text-zinc-400 hover:text-zinc-600 hover:bg-zinc-50'
              )}
            >
              {m === 'A-Share' ? 'A股市场' : m === 'HK-Share' ? '港股市场' : '美股市场'}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-6 text-[10px] uppercase font-bold tracking-widest text-zinc-400">
          <div className="flex items-center gap-2 px-4 py-2 bg-zinc-50 rounded-xl border border-zinc-100/50">
            <Clock size={12} strokeWidth={2} className="text-zinc-300" />
            <span>Updated: {marketLastUpdated ? new Date(marketLastUpdated).toLocaleTimeString() : '--:--'}</span>
          </div>
          <button 
            onClick={() => fetchMarketOverview(true)}
            disabled={overviewLoading}
            className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
          >
            <RefreshCw size={12} className={cn(overviewLoading && 'animate-spin')} strokeWidth={2.5} />
            <span>Sync Data</span>
          </button>
        </div>
      </div>

      {overviewError && (
        <div className="mx-1 p-6 bg-rose-50 border border-rose-100 rounded-3xl flex items-center gap-4 text-rose-600">
          <AlertCircle size={20} />
          <p className="text-sm font-bold">{overviewError}</p>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Indices Section */}
        <div className="lg:col-span-8 space-y-10">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-4">
              <div className="p-2.5 rounded-xl bg-zinc-950 text-white shadow-lg">
                <Globe2 size={18} strokeWidth={1.5} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-zinc-950 tracking-tight">全球核心指数动态</h3>
                <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mt-0.5">Macro Indicators & Baseline Performance</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {overviewLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="premium-card h-40 animate-pulse bg-zinc-50" />
              ))
            ) : Array.isArray(marketOverview?.indices) && marketOverview!.indices.length > 0 ? (
              marketOverview!.indices.map((index: IndexData) => (
                <motion.div 
                  key={index.name || Math.random().toString()}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="premium-card premium-card-hover p-6 group cursor-default relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-indigo-500/5 to-transparent blur-2xl" />
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-bold text-zinc-500 group-hover:text-zinc-950 transition-colors uppercase tracking-tight">{index.name || 'Unknown Index'}</span>
                    <div className={cn(
                      "px-2.5 py-1 rounded-lg text-[10px] font-bold border tabular-nums shadow-sm",
                      getTrendBg(index.change), 
                      getTrendColor(index.change)
                    )}>
                      {index.change > 0 ? '+' : ''}{(index.changePercent || 0).toFixed(2)}%
                    </div>
                  </div>
                  <div className="flex items-end justify-between">
                    <div className="text-3xl font-bold tracking-tighter text-zinc-950 tabular-nums">
                      {(index.value || 0).toLocaleString()}
                    </div>
                    <div className={cn("p-2 rounded-xl transition-all", getTrendBg(index.change))}>
                      {renderTrendIcon(index.change)}
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-zinc-50 flex items-center justify-between text-[10px] font-bold tracking-widest uppercase">
                    <span className="text-zinc-300">Volume</span>
                    <span className="text-zinc-500 font-mono">{index.volume || '--'}</span>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="col-span-full py-16 flex flex-col items-center justify-center premium-card bg-zinc-50/30 border-dashed">
                <AlertCircle size={32} className="text-zinc-200 mb-3" strokeWidth={1} />
                <p className="text-zinc-400 text-sm font-bold uppercase tracking-widest">No index data available</p>
              </div>
            )}
          </div>

          {/* AI Summary Card */}
          {marketOverview?.marketSummary && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="premium-card p-10 bg-zinc-950 text-white overflow-hidden relative group"
            >
              <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:opacity-10 transition-all duration-700 pointer-events-none">
                <Sparkles size={160} strokeWidth={1} className="rotate-12" />
              </div>
              <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.5)]" />
              
              <div className="relative z-10 space-y-6">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-indigo-400">AI Intelligence Core Summary</span>
                  <div className="h-px w-10 bg-indigo-600 mt-2" />
                </div>
                <p className="text-2xl font-bold leading-snug italic text-zinc-100 tracking-tight max-w-3xl">
                  "{marketOverview.marketSummary}"
                </p>
                <div className="flex items-center gap-4 pt-4">
                  <div className="flex items-center gap-2 text-indigo-400 text-[10px] font-bold tracking-[0.2em] uppercase">
                    <Flame size={14} fill="currentColor" strokeWidth={0} />
                    <span>Real-time Market Pulse</span>
                  </div>
                  <div className="h-px flex-1 bg-white/10" />
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Sidebar: Sectors & Techs */}
        <div className="lg:col-span-4 space-y-10">
          <div className="flex items-center gap-4 px-1">
             <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
               <Activity size={18} strokeWidth={2} />
             </div>
             <div>
               <h3 className="text-lg font-bold text-zinc-950 tracking-tight">机构行业板块监测</h3>
               <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mt-0.5">Sector Analysis & Capital Flow</p>
             </div>
          </div>

          <div className="premium-card overflow-hidden">
            <div className="bg-zinc-50/50 px-6 py-4 border-b border-zinc-100 flex items-center justify-between">
               <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Sector Performance</span>
               <Zap size={12} className="text-amber-500 fill-amber-500/20" />
            </div>
            <div className="divide-y divide-zinc-50 max-h-[500px] overflow-y-auto custom-scrollbar">
              {overviewLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="p-6 animate-pulse h-20" />
                ))
              ) : Array.isArray(marketOverview?.sectorAnalysis) && marketOverview!.sectorAnalysis.length > 0 ? (
                marketOverview!.sectorAnalysis.map((sector: SectorAnalysis) => (
                  <div key={sector.name} className="p-6 flex flex-col gap-3 hover:bg-zinc-50/50 transition-all group cursor-default relative overflow-hidden">
                    <div className="flex items-center justify-between relative z-10">
                      <span className="text-sm font-bold text-zinc-900 group-hover:text-indigo-600 transition-colors">
                        {sector.name}
                      </span>
                      <div className={cn(
                        "text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md border",
                        sector.trend === 'UP' ? 'text-rose-600 bg-rose-50 border-rose-100' : 
                        sector.trend === 'DOWN' ? 'text-emerald-600 bg-emerald-50 border-emerald-100' : 
                        'text-zinc-400 bg-white border-zinc-100'
                      )}>
                        {sector.trend || 'NEUTRAL'}
                      </div>
                    </div>
                    <p className="text-xs text-zinc-500 leading-relaxed line-clamp-2 font-medium relative z-10 pr-2">
                      {sector.conclusion}
                    </p>
                    <div className="absolute right-2 bottom-2 opacity-0 group-hover:opacity-100 transition-opacity">
                       <ArrowRight size={14} className="text-indigo-400" />
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-16 text-center text-zinc-300 text-xs font-bold uppercase tracking-widest italic">
                  Awaiting institutional feed...
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions / Tips */}
          <div className="premium-card p-8 bg-indigo-50/30 border-indigo-100 relative group overflow-hidden">
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-indigo-600/5 blur-[50px] group-hover:bg-indigo-600/10 transition-all duration-700" />
            <div className="flex flex-col gap-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-xl shadow-indigo-600/20 group-hover:scale-105 transition-transform">
                  <LineChart size={24} strokeWidth={1.5} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-zinc-950">智能调研交互</h4>
                  <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mt-1">Multi-Agent Intelligence</p>
                </div>
              </div>
              
              <p className="text-xs text-zinc-600 leading-relaxed font-medium">
                输入标的代码或选中实时异动行业，启动 <span className="text-indigo-600 font-bold">AI 专家联席会议</span>，对交易决策逻辑进行极端压力测试与复核。
              </p>
              
              <div className="flex flex-wrap gap-2.5">
                {['600938.SH', '00700.HK', 'NVDA'].map(s => (
                  <button 
                    key={s}
                    onClick={() => {
                      const baseSymbol = s.split('.')[0];
                      setSymbol(baseSymbol);
                      setMarket(s.includes('.SH') || s.includes('.SZ') ? 'A-Share' : s.includes('.HK') || s.length === 5 ? 'HK-Share' : 'US-Share');
                    }}
                    className="px-4 py-2 rounded-xl bg-white border border-indigo-100 text-[10px] font-bold text-zinc-500 hover:border-indigo-400 hover:text-indigo-600 hover:shadow-lg transition-all"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
