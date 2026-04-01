import React from 'react';
import { BarChart3, PieChart, Info } from 'lucide-react';
import { StockAnalysis } from '../../types';

interface AnalysisGridProps {
  analysis: StockAnalysis;
}

export const AnalysisGrid = React.memo(({ analysis }: AnalysisGridProps) => {
  return (
    <div className="grid grid-cols-1 gap-16 md:grid-cols-2 animate-premium">
      <div className="space-y-6 group">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-50 border border-indigo-100/50 group-hover:bg-indigo-100 transition-colors duration-300">
            <BarChart3 size={18} className="text-indigo-600" strokeWidth={2} />
          </div>
          <div>
            <span className="section-label mb-0">Technical Analysis</span>
            <h3 className="text-sm font-bold text-zinc-900 tracking-tight">技术面核心博弈</h3>
          </div>
        </div>
        
        <div className="relative pl-6 border-l border-zinc-100">
          <p className="text-sm leading-relaxed text-zinc-600 font-medium">
            {analysis.technicalAnalysis}
          </p>
        </div>
      </div>

      <div className="space-y-6 group">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-violet-50 border border-violet-100/50 group-hover:bg-violet-100 transition-colors duration-300">
            <PieChart size={18} className="text-violet-600" strokeWidth={2} />
          </div>
          <div>
            <span className="section-label mb-0">Fundamental Analysis</span>
            <h3 className="text-sm font-bold text-zinc-900 tracking-tight">基本面与安全边际</h3>
          </div>
        </div>
        
        <div className="relative pl-6 border-l border-zinc-100">
          <p className="text-sm leading-relaxed text-zinc-600 font-medium">
            {analysis.fundamentalAnalysis}
          </p>
        </div>
      </div>

      <div className="md:col-span-2 pt-10 border-t border-zinc-100">
        <div className="flex items-start gap-4 p-5 rounded-2xl bg-zinc-50 border border-zinc-100">
          <Info size={18} className="text-zinc-400 mt-0.5 shrink-0" strokeWidth={2} />
          <p className="text-xs text-zinc-500 leading-relaxed italic">
            注：此分析基于公开市场数据及 AI 专家模型推演，仅供研究参考，不构成任何投资建议。市场有风险，投资需谨慎。
          </p>
        </div>
      </div>
    </div>
  );
});

AnalysisGrid.displayName = 'AnalysisGrid';
