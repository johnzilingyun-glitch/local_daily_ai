import React from 'react';
import { 
  History, 
  Clock, 
  TrendingUp, 
  Search, 
  Loader2,
  Settings,
  Sparkles,
  Activity
} from 'lucide-react';
import { Market } from '../../types';
import { useUIStore } from '../../stores/useUIStore';

interface HeaderProps {
  symbol: string;
  setSymbol: (symbol: string) => void;
  market: Market;
  setMarket: (market: Market) => void;
  onSearch: () => void;
  loading: boolean;
  isAnalysisActive: boolean;
  onOpenHistory: () => void;
  onOpenAdmin: () => void;
  onOpenSettings: () => void;
}

export const Header = React.memo(({
  symbol, setSymbol,
  market, setMarket,
  onSearch,
  loading,
  onOpenHistory,
  onOpenAdmin,
  onOpenSettings,
}: HeaderProps) => {
  const { aiHealth } = useUIStore();
  const isComposing = React.useRef(false);
  const [localSymbol, setLocalSymbol] = React.useState(symbol);

  React.useEffect(() => {
    setLocalSymbol(symbol);
  }, [symbol]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch();
  };
  
  return (
    <header className="mb-12 animate-premium">
      <div className="flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="h-6 w-1 bg-indigo-600 rounded-full" />
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-400">
              AI Market Intelligence
            </span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-zinc-950 sm:text-5xl">
            每日股票智能分析
          </h1>
          <p className="mt-4 text-zinc-500 font-medium max-w-xl leading-relaxed">
            基于深度学习的市场研判引擎，为专业投资者提供极简、直观且具备深度的交易决策支持。
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onOpenHistory}
            className="btn-secondary w-12 h-12 p-0 flex items-center justify-center rounded-xl"
            title="查看历史研判"
          >
            <History size={20} strokeWidth={1.5} />
          </button>
          <button
            onClick={onOpenAdmin}
            className="btn-secondary w-12 h-12 p-0 flex items-center justify-center rounded-xl"
            title="系统状态"
          >
            <Clock size={20} strokeWidth={1.5} />
          </button>
          <button
            onClick={onOpenSettings}
            className="btn-secondary w-12 h-12 p-0 flex items-center justify-center rounded-xl relative group"
            title="系统设置"
          >
            <Settings size={20} strokeWidth={1.5} />
            
            {/* AI Health Indicator */}
            <div className={`absolute -top-1 -right-1 h-3 w-3 rounded-full border-2 border-zinc-50 ${
              aiHealth === 'healthy' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' :
              aiHealth === 'degraded' ? 'bg-amber-500 animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.4)]' :
              'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]'
            }`} />
            
            {/* Status Tooltip */}
            <div className="absolute bottom-full mb-3 right-0 opacity-0 group-hover:opacity-100 pointer-events-none transition-all translate-y-2 group-hover:translate-y-0 z-[60]">
              <div className="bg-zinc-950 text-white text-[10px] font-bold py-2 px-3 rounded-lg whitespace-nowrap shadow-xl border border-white/10">
                <div className="flex items-center gap-2">
                  <Activity size={10} className={aiHealth === 'degraded' ? 'animate-pulse text-amber-400' : aiHealth === 'error' ? 'text-rose-400' : 'text-emerald-400'} />
                  {aiHealth === 'healthy' ? 'AI 引擎运行正常' : 
                   aiHealth === 'degraded' ? 'AI 服务负载较高 (重试中)' : 
                   'AI 服务配额已耗尽'}
                </div>
              </div>
              <div className="absolute top-full right-5 -translate-y-px w-2 h-2 bg-zinc-950 rotate-45 border-r border-b border-white/10" />
            </div>
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-12 flex flex-col gap-4 sm:flex-row items-stretch">
        <div className="relative group flex-shrink-0">
          <select
            value={market}
            onChange={(e) => setMarket(e.target.value as Market)}
            className="h-14 w-full sm:w-48 cursor-pointer appearance-none rounded-xl border border-zinc-200 bg-white px-5 pr-12 text-sm font-semibold text-zinc-700 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500/40 hover:bg-zinc-50"
          >
            <option value="A-Share">A-Share市场</option>
            <option value="HK-Share">HKG港股</option>
            <option value="US-Share">USA美股</option>
          </select>
          <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400">
            <TrendingUp size={16} strokeWidth={1.5} />
          </div>
        </div>

        <div className="relative flex-1 group">
          <div className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-indigo-500 transition-colors">
            <Search size={20} strokeWidth={1.5} />
          </div>
          <input
            type="text"
            placeholder="搜索股票代码或简拼 (例如: 600938)..."
            value={localSymbol}
            onCompositionStart={() => { isComposing.current = true; }}
            onCompositionEnd={(e) => {
              isComposing.current = false;
              const val = e.currentTarget.value.toUpperCase();
              setLocalSymbol(val);
              setSymbol(val);
            }}
            onChange={(e) => {
              const val = e.target.value;
              setLocalSymbol(val);
              if (!isComposing.current) {
                setSymbol(val.toUpperCase());
              }
            }}
            className="h-14 w-full font-medium text-base rounded-xl border border-zinc-200 bg-white pl-14 pr-6 text-zinc-900 transition-all placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500/40 shadow-sm shadow-zinc-900/5 group-hover:border-zinc-300"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary h-14 px-10 rounded-xl shadow-indigo-600/10 shadow-xl"
        >
          {loading ? (
            <Loader2 className="animate-spin" size={20} />
          ) : (
            <>
              <Sparkles size={18} fill="currentColor" className="opacity-80" />
              <span>开始智能研判</span>
            </>
          )}
        </button>
      </form>
    </header>
  );
});

Header.displayName = 'Header';
