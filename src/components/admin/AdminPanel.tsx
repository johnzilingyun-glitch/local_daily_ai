import React, { useState } from 'react';
import { Zap, Newspaper, ArrowUpRight, BarChart3, ListTree, Activity, Clock } from 'lucide-react';
import { ResilienceDashboard } from './ResilienceDashboard';

interface AdminPanelProps {
  optimizationLogs: any[];
  historyItems: any[];
  setSelectedDetail: (detail: any) => void;
}

export const AdminPanel = React.memo(({ optimizationLogs, historyItems, setSelectedDetail }: AdminPanelProps) => {
  const [viewMode, setViewMode] = useState<'logs' | 'resilience'>('resilience');

  return (
    <section className="space-y-12 animate-premium border-t border-zinc-100 pt-16">
      {/* Header & Toggle */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="h-6 w-1 bg-indigo-600 rounded-full" />
            <span className="section-label mb-0">System Diagnostics</span>
          </div>
          <h2 className="text-3xl font-bold text-zinc-950 tracking-tight">系统诊断中心</h2>
          <p className="text-zinc-500 font-medium text-sm max-w-xl">
            监控 AI 思考链路、高可用弹性指标及历史分析快照。实时追踪系统韧性与研报沉淀。
          </p>
        </div>

        <div className="flex p-1.5 rounded-2xl bg-zinc-100/50 border border-zinc-200 self-start">
          <button 
            onClick={() => setViewMode('resilience')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
              viewMode === 'resilience' ? 'bg-white text-indigo-600 shadow-sm border border-zinc-200' : 'text-zinc-400 hover:text-zinc-600'
            }`}
          >
            <BarChart3 size={14} strokeWidth={2} />
            弹性看板
          </button>
          <button 
            onClick={() => setViewMode('logs')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
              viewMode === 'logs' ? 'bg-white text-indigo-600 shadow-sm border border-zinc-200' : 'text-zinc-400 hover:text-zinc-600'
            }`}
          >
            <ListTree size={14} strokeWidth={2} />
            链路日志
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-12">
        {/* Main Content Area */}
        <div className="space-y-8 xl:col-span-1">
          {viewMode === 'resilience' ? (
            <div className="xl:col-span-2">
              <ResilienceDashboard logs={optimizationLogs} />
            </div>
          ) : (
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
                    <Zap size={20} strokeWidth={1.5} />
                  </div>
                  <h3 className="text-lg font-bold text-zinc-950">优化思考链路日志</h3>
                </div>
                <span className="px-3 py-1 rounded-full bg-zinc-100 text-[10px] font-bold text-zinc-500 border border-zinc-200">
                  {optimizationLogs.length} EVENTS
                </span>
              </div>
              
              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-4 custom-scrollbar">
                {optimizationLogs.slice().reverse().map((log, i) => (
                  <div 
                    key={i} 
                    className="p-6 premium-card premium-card-hover cursor-pointer group/item"
                    onClick={() => setSelectedDetail({ type: 'log', data: log })}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-600 text-[9px] font-bold uppercase tracking-widest border border-emerald-100">
                        {log.field || 'SYSTEM'}
                      </div>
                      <div className="flex items-center gap-1.5 text-zinc-400 font-mono text-[10px] font-medium">
                        <Clock size={12} />
                        {new Date(log.timestamp).toLocaleTimeString('zh-CN', { hour12: false })}
                      </div>
                    </div>
                    <p className="text-sm text-zinc-600 line-clamp-2 leading-relaxed font-medium mb-4">
                      {log.description}
                    </p>
                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-emerald-600 opacity-60 group-hover/item:opacity-100 transition-all">
                      <span>查看链路详情</span>
                      <ArrowUpRight size={14} strokeWidth={2} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* History / Sidebar */}
        <div className={`space-y-8 ${viewMode === 'resilience' ? 'xl:col-span-1' : ''}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
                <Newspaper size={20} strokeWidth={1.5} />
              </div>
              <h3 className="text-lg font-bold text-zinc-950">分析备份史中心</h3>
            </div>
            <span className="px-3 py-1 rounded-full bg-zinc-100 text-[10px] font-bold text-zinc-500 border border-zinc-200">
              {historyItems.length} SNAPSHOTS
            </span>
          </div>

          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-4 custom-scrollbar">
            {historyItems.map((item, i) => (
              <div 
                key={i} 
                className="p-6 premium-card premium-card-hover cursor-pointer group/item"
                onClick={() => setSelectedDetail({ type: 'history', data: item })}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-600 text-[9px] font-bold uppercase tracking-widest border border-indigo-100">
                    {item.stockInfo ? `STOCK: ${item.stockInfo.symbol}` : 'MARKET CORE'}
                  </div>
                  <div className="flex items-center gap-1.5 text-zinc-400 font-mono text-[10px] font-medium">
                     <Activity size={12} />
                     {item.stockInfo?.lastUpdated?.split(' ')[1] || 'SNAPSHOT'}
                  </div>
                </div>
                <p className="text-sm text-zinc-500 italic line-clamp-2 leading-relaxed font-medium mb-4">
                  "{item.summary || item.marketSummary}"
                </p>
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-indigo-600 opacity-60 group-hover/item:opacity-100 transition-all">
                  <span>还原深度快照</span>
                  <ArrowUpRight size={14} strokeWidth={2} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
});

AdminPanel.displayName = 'AdminPanel';
