import React, { useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from 'recharts';
import { Shield, Zap, RefreshCw, AlertTriangle } from 'lucide-react';

interface ResilienceEvent {
  type: 'cache_hit' | 'model_fallback' | 'retry' | 'request_dedupe';
  model?: string;
  symbol?: string;
  attempt?: number;
  savedTokens?: number;
  duration?: number;
}

interface ResilienceDashboardProps {
  logs: any[];
}

export const ResilienceDashboard: React.FC<ResilienceDashboardProps> = ({ logs }) => {
  const resilienceLogs = useMemo(() => {
    return logs
      .filter(log => log.field === 'ai_resilience')
      .map(log => {
        try {
          return JSON.parse(log.newValue) as ResilienceEvent;
        } catch (e) {
          return null;
        }
      })
      .filter((e): e is ResilienceEvent => e !== null);
  }, [logs]);

  const stats = useMemo(() => {
    const counts = {
      cache_hit: 0,
      model_fallback: 0,
      retry: 0,
      request_dedupe: 0,
      total_calls: 0
    };

    resilienceLogs.forEach(event => {
      if (event.type in counts) {
        counts[event.type as keyof typeof counts]++;
      }
    });

    // Estimate total calls (this is heuristic based on the fact that we log hits and retries)
    // In a real system we'd log 'request_start' too.
    counts.total_calls = resilienceLogs.length; 

    return counts;
  }, [resilienceLogs]);

  const pieData = [
    { name: 'Cache Hits', value: stats.cache_hit, color: '#10b981' },
    { name: 'Deduplicated', value: stats.request_dedupe, color: '#3b82f6' },
    { name: 'Model Fallbacks', value: stats.model_fallback, color: '#f59e0b' },
    { name: 'Retries', value: stats.retry, color: '#ef4444' },
  ].filter(d => d.value > 0);

  const MetricCard = ({ title, value, icon: Icon, colorClass }: any) => (
    <div className={`p-6 rounded-[2rem] border border-zinc-800/50 bg-zinc-900/40 relative overflow-hidden group hover:border-zinc-700 transition-all duration-500`}>
      <div className="flex items-center gap-4 mb-4">
        <div className={`p-3 rounded-2xl ${colorClass} bg-opacity-10 border border-opacity-20`}>
          <Icon size={20} className={colorClass.replace('bg-', 'text-')} />
        </div>
        <h3 className="text-sm font-black uppercase tracking-widest text-zinc-400">{title}</h3>
      </div>
      <div className="text-4xl font-black text-zinc-100 tabular-nums tracking-tighter">
        {value}
      </div>
    </div>
  );

  if (resilienceLogs.length === 0) {
    return (
      <div className="p-12 text-center rounded-[3rem] border border-dashed border-zinc-800 bg-zinc-900/20">
        <Shield size={48} className="mx-auto mb-6 text-zinc-700 opacity-20" />
        <h3 className="text-xl font-black text-zinc-500 uppercase tracking-widest">No Resilience Data Detected</h3>
        <p className="text-zinc-600 mt-2 font-medium">Telemetry data will appear here once AI analysis events occur.</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard 
          title="Cache Hits" 
          value={stats.cache_hit} 
          icon={Zap} 
          colorClass="bg-emerald-500" 
        />
        <MetricCard 
          title="Deduplicated" 
          value={stats.request_dedupe} 
          icon={Shield} 
          colorClass="bg-blue-500" 
        />
        <MetricCard 
          title="Fallbacks" 
          value={stats.model_fallback} 
          icon={AlertTriangle} 
          colorClass="bg-amber-500" 
        />
        <MetricCard 
          title="Retries" 
          value={stats.retry} 
          icon={RefreshCw} 
          colorClass="bg-red-500" 
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <div className="p-8 rounded-[3rem] border border-zinc-800/80 bg-zinc-900/60 min-h-[400px] flex flex-col">
          <h3 className="text-sm font-black uppercase tracking-widest text-emerald-500 mb-8 flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Distribution of Resilience Events
          </h3>
          <div className="flex-1 min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={120}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '12px' }}
                  itemStyle={{ color: '#f4f4f5' }}
                />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="p-8 rounded-[3rem] border border-zinc-800/80 bg-zinc-900/60 min-h-[400px] flex flex-col">
          <h3 className="text-sm font-black uppercase tracking-widest text-blue-500 mb-8 flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            Recent Resilience Events
          </h3>
          <div className="flex-1 space-y-4 overflow-y-auto max-h-[320px] pr-4 custom-scrollbar">
            {resilienceLogs.slice().reverse().slice(0, 10).map((event, i) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-zinc-950/50 border border-zinc-800/50 text-xs transition-all hover:border-zinc-700">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${
                    event.type === 'cache_hit' ? 'bg-emerald-500' : 
                    event.type === 'model_fallback' ? 'bg-amber-500' : 'bg-blue-500'
                  }`} />
                  <span className="font-black uppercase tracking-wider text-zinc-100">{event.type.replace('_', ' ')}</span>
                </div>
                <span className="text-zinc-500 font-mono text-[10px]">
                  {event.symbol || event.model || 'SYSTEM'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
