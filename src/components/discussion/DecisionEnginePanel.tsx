import React from 'react';
import { motion } from 'motion/react';
import { Target, Cpu, Layers, Shield, Award, AlertTriangle, TrendingUp, BarChart3, Activity } from 'lucide-react';
import { StockAnalysis } from '../../types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface DecisionEnginePanelProps {
  analysis: StockAnalysis | null;
}

export const DecisionEnginePanel = React.memo(({ analysis }: DecisionEnginePanelProps) => {
  if (!analysis || (!analysis.coreVariables && !analysis.businessModel && !analysis.quantifiedRisks)) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
      className="max-w-5xl mx-auto space-y-12 mb-12 animate-premium"
    >
      {/* Section Header */}
      <div className="flex items-center gap-5 px-1">
        <div className="h-14 w-14 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-sm shadow-emerald-500/5">
          <Target size={28} strokeWidth={1.5} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="section-label mb-0 text-emerald-600">Institutional Quant</span>
            <div className="h-1 w-1 rounded-full bg-emerald-400" />
          </div>
          <h4 className="text-xl font-bold text-zinc-950 tracking-tight">决策引擎量化看板中心</h4>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Core Variables */}
        {analysis.coreVariables && analysis.coreVariables.length > 0 && (
          <div className="premium-card p-10 space-y-8 group relative overflow-hidden">
             <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-600/5 blur-[80px] pointer-events-none" />
             
             <div className="flex items-center gap-3 border-b border-zinc-100 pb-5">
               <div className="p-2 rounded-xl bg-cyan-50 text-cyan-600 border border-cyan-100">
                 <Cpu size={18} strokeWidth={2} />
               </div>
               <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">关键经济变量 (SSoT Basis)</span>
             </div>
             
             <div className="space-y-4">
               {analysis.coreVariables.map((v, idx) => (
                 <div key={`cv-${idx}`} className="bg-zinc-50 rounded-2xl p-6 border border-zinc-100 space-y-4 hover:bg-white transition-all duration-300 shadow-sm">
                   <div className="flex justify-between items-center text-zinc-400">
                     <span className="text-xs font-bold text-zinc-900">{v.name}</span>
                     <span className="text-[10px] font-bold uppercase tracking-tighter bg-white border border-zinc-100 px-2.5 py-0.5 rounded-lg">
                        {v.unit} / {v.evidenceLevel}
                     </span>
                   </div>
                   
                   <div className="grid grid-cols-3 gap-4 pt-2">
                     <div className="space-y-1">
                        <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest">Current</p>
                        <p className="font-bold text-zinc-900 tabular-nums">{String(v.value)}</p>
                     </div>
                     <div className="border-x border-zinc-100 px-4 space-y-1">
                        <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest">Forecast</p>
                        <p className="font-bold text-zinc-900 tabular-nums">{String(v.marketExpect)}</p>
                     </div>
                     <div className="space-y-1 pl-2">
                        <p className="text-[9px] text-emerald-500 font-bold uppercase tracking-widest">Delta</p>
                        <p className="font-bold text-emerald-600 tabular-nums">{v.delta}</p>
                     </div>
                   </div>
                   
                   {v.reason && (
                     <div className="pt-3 border-t border-zinc-100/50">
                       <p className="text-[10px] text-zinc-500 font-medium italic leading-relaxed">
                         "{v.reason}"
                       </p>
                     </div>
                   )}
                 </div>
               ))}
             </div>
          </div>
        )}

        {/* Business Model */}
        {analysis.businessModel && (
          <div className="premium-card p-10 space-y-8 group relative overflow-hidden">
             <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/5 blur-[80px] pointer-events-none" />
             
             <div className="flex items-center gap-3 border-b border-zinc-100 pb-5">
               <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
                 <Layers size={18} strokeWidth={2} />
               </div>
               <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">单位经济模型 (Alpha Drivers)</span>
               <span className="ml-auto text-[9px] font-bold text-zinc-400 uppercase bg-zinc-50 border border-zinc-100 px-2 py-0.5 rounded-md">
                 {analysis.businessModel.businessType}
               </span>
             </div>
             
             <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-6 relative group/formula overflow-hidden shadow-sm">
               <div className="absolute top-0 left-0 bottom-0 w-1 bg-indigo-600" />
               <p className="text-[9px] text-indigo-500 font-bold uppercase mb-3 tracking-widest">利润推算逻辑公式</p>
               <p className="font-mono text-zinc-700 font-bold break-all text-xs leading-relaxed">
                 {analysis.businessModel.formula}
               </p>
             </div>

             <div className="grid grid-cols-2 gap-8 px-2">
               <div className="space-y-1">
                 <p className="text-[10px] text-zinc-400 uppercase font-bold tracking-widest">预测年度利润</p>
                 <p className="text-2xl font-bold text-zinc-900 tabular-nums tracking-tighter">
                   {analysis.businessModel.projectedProfit}
                 </p>
               </div>
               <div className="text-right space-y-1">
                 <p className="text-[10px] text-zinc-400 uppercase font-bold tracking-widest">模型置信度</p>
                 <p className="text-2xl font-bold text-emerald-600 tabular-nums tracking-tighter">
                   {analysis.businessModel.confidenceScore}%
                 </p>
               </div>
             </div>

             <div className="flex flex-wrap gap-2.5 pt-4">
               {Object.entries(analysis.businessModel.drivers).map(([k, v]) => (
                 <div key={`drv-${k}`} className="px-4 py-2 rounded-xl text-[10px] font-bold tracking-widest bg-zinc-50 border border-zinc-100 text-zinc-400 hover:text-indigo-600 hover:border-indigo-100 transition-all flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-400/30" />
                    <span className="uppercase">{k}</span>: 
                    <span className="text-zinc-900 tabular-nums">{String(v)}</span>
                 </div>
               ))}
             </div>
          </div>
        )}

        {/* Quantified Risks */}
        {analysis.quantifiedRisks && analysis.quantifiedRisks.length > 0 && (
          <div className="premium-card p-10 space-y-8 group relative overflow-hidden">
             <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-rose-600/5 blur-[80px] pointer-events-none" />
             
             <div className="flex items-center gap-3 border-b border-zinc-100 pb-5">
               <div className="p-2 rounded-xl bg-rose-50 text-rose-600 border border-rose-100">
                 <Shield size={18} strokeWidth={2} />
               </div>
               <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">灰犀牛风险概率矩阵</span>
               {analysis.riskAdjustedValuation && (
                  <span className="ml-auto text-[9px] font-bold text-rose-500 uppercase bg-rose-50 border border-rose-100 px-2 py-0.5 rounded-md">
                    RV: {analysis.riskAdjustedValuation}
                  </span>
               )}
             </div>
             
             <div className="space-y-4">
               {analysis.quantifiedRisks.map((r, idx) => (
                 <div key={`qr-${idx}`} className="bg-zinc-50 rounded-2xl p-5 border border-zinc-100 hover:bg-white transition-all shadow-sm group/risk">
                    <div className="flex justify-between items-start mb-4">
                       <div className="space-y-1">
                          <p className="text-xs font-bold text-zinc-900">{r.name}</p>
                          <p className="text-[10px] text-zinc-400 font-medium uppercase">{r.mitigation}</p>
                       </div>
                       <div className="text-right">
                          <span className="font-mono font-bold text-rose-600 bg-rose-50 px-2 py-1 rounded-lg border border-rose-100 text-[10px] tabular-nums">
                            -{r.expectedLoss}%
                          </span>
                       </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 border-t border-zinc-100/50 pt-4">
                       <div className="space-y-1">
                          <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest">Probability</p>
                          <p className="font-bold text-zinc-700 tabular-nums">{r.probability}%</p>
                       </div>
                       <div className="text-right space-y-1">
                          <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest">Profit Impact</p>
                          <p className="font-bold text-rose-500 tabular-nums">{r.impactPercent}%</p>
                       </div>
                    </div>
                 </div>
               ))}
             </div>
          </div>
        )}

        {/* Position Plan */}
        {analysis.tradingPlan?.positionPlan && analysis.tradingPlan.positionPlan.length > 0 && (
          <div className="premium-card p-10 space-y-8 group relative overflow-hidden">
             <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/5 blur-[80px] pointer-events-none" />
             
             <div className="flex items-center gap-3 border-b border-zinc-100 pb-5">
               <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                 <Award size={18} strokeWidth={2} />
               </div>
               <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">多级建仓蓝图与逻辑执行</span>
             </div>
             
             <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
               {analysis.tradingPlan.positionPlan.map((p, idx) => (
                 <div key={`pp-${idx}`} className="bg-zinc-50 border border-zinc-100 rounded-2xl p-5 text-center transition-all hover:bg-white hover:shadow-md group/layer">
                    <p className="text-[9px] text-zinc-400 uppercase font-bold tracking-widest mb-1 group-hover/layer:text-blue-600 transition-colors">LAYER PRICE</p>
                    <p className="text-lg font-bold text-zinc-900 tabular-nums tracking-tighter">{p.price}</p>
                    <div className="mt-4 w-full bg-zinc-200 rounded-full h-1.5 overflow-hidden">
                       <div className="h-full bg-blue-600 shadow-sm" style={{ width: `${p.positionPercent}%` }} />
                    </div>
                    <p className="mt-3 text-[10px] font-bold text-blue-600">ALLOCATION: {p.positionPercent}%</p>
                 </div>
               ))}
             </div>
             
             <div className="space-y-4 pt-4">
               {analysis.tradingPlan.logicBasedStopLoss && (
                 <div className="p-6 rounded-2xl bg-rose-50/50 border border-rose-100 flex gap-4 items-start shadow-sm">
                    <div className="p-2 rounded-xl bg-white border border-rose-100 text-rose-600 shadow-sm">
                      <AlertTriangle size={18} strokeWidth={2} />
                    </div>
                    <div className="space-y-1">
                       <p className="text-[9px] text-rose-500 font-bold uppercase tracking-widest">逻辑中止信号 (Terminal Condition)</p>
                       <p className="text-sm text-zinc-900 leading-relaxed font-bold italic tracking-tight">
                         "{analysis.tradingPlan.logicBasedStopLoss}"
                       </p>
                    </div>
                 </div>
               )}
               {analysis.tradingPlan.riskRewardRatio && (
                 <div className="flex items-center justify-between px-6 py-4 rounded-2xl bg-zinc-50 border border-zinc-100">
                    <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest flex items-center gap-2">
                       <BarChart3 size={12} className="text-zinc-300" /> 风险收益矩阵比 (R/R)
                    </span>
                    <span className="text-sm font-bold text-zinc-900 tabular-nums tracking-widest px-3 py-1 bg-white rounded-lg border border-zinc-100 shadow-xs">
                      {analysis.tradingPlan.riskRewardRatio}
                    </span>
                 </div>
               )}
             </div>
          </div>
        )}
      </div>
    </motion.div>
  );
});

DecisionEnginePanel.displayName = 'DecisionEnginePanel';
