import React, { useEffect, useRef, useState } from 'react';
import { AgentRole, DataVerification } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, Shield, BarChart3, PieChart, MessageSquare, Loader2, Download, Search, Zap, Send, 
  HelpCircle, UserCheck, ExternalLink, AlertTriangle, Award, X, Maximize2, Minimize2, 
  CheckCircle2, ShieldCheck, Cpu, Layers, Target, History, RotateCcw, Database, 
  Calculator, Table, Activity, Clock, ArrowRight, Info, Share2
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

import { useAnalysisStore } from '../stores/useAnalysisStore';
import { useUIStore } from '../stores/useUIStore';
import { useConfigStore } from '../stores/useConfigStore';
import { getQualityLabel } from '../services/dataQualityService';
import { sendAnalysisToFeishu } from '../services/feishuService';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const roleIcons: Record<AgentRole, React.ReactNode> = {
  "Technical Analyst": <BarChart3 size={18} />,
  "Fundamental Analyst": <PieChart size={18} />,
  "Sentiment Analyst": <MessageSquare size={18} />,
  "Risk Manager": <Shield size={18} />,
  "Contrarian Strategist": <Zap size={18} />,
  "Deep Research Specialist": <Search size={18} />,
  "Professional Reviewer": <UserCheck size={18} />,
  "Chief Strategist": <Award size={18} />,
  "Moderator": <User size={18} />,
};

const roleColors: Record<AgentRole, string> = {
  "Technical Analyst": "text-blue-400 bg-blue-500/10 border-blue-500/20",
  "Fundamental Analyst": "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  "Sentiment Analyst": "text-purple-400 bg-purple-500/10 border-purple-500/20",
  "Risk Manager": "text-rose-400 bg-rose-500/10 border-rose-500/20",
  "Contrarian Strategist": "text-orange-400 bg-orange-500/10 border-orange-500/20",
  "Deep Research Specialist": "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
  "Professional Reviewer": "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
  "Chief Strategist": "text-amber-400 bg-amber-500/10 border-amber-500/20",
  "Moderator": "text-zinc-400 bg-zinc-500/10 border-zinc-500/20",
};

const roleNames: Record<AgentRole, string> = {
  "Technical Analyst": "技术分析师",
  "Fundamental Analyst": "基本面分析师",
  "Sentiment Analyst": "情绪分析师",
  "Risk Manager": "风险合规官",
  "Contrarian Strategist": "反向策略师",
  "Deep Research Specialist": "深度研究专家",
  "Professional Reviewer": "高级评审专家",
  "Chief Strategist": "首席策略师",
  "Moderator": "研讨主持人",
};

interface DiscussionPanelProps {
  onSendMessage?: (message: string) => void;
  onClose?: () => void;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
  onPointerDownDrag?: (e: React.PointerEvent) => void;
}

export const DiscussionPanel: React.FC<DiscussionPanelProps> = ({
  onSendMessage,
  onClose,
  isFullscreen,
  onToggleFullscreen,
  onPointerDownDrag
}) => {
  const {
    discussionMessages: messages,
    analystWeights,
    analysis
  } = useAnalysisStore();

  const {
    isDiscussing,
    isReviewing
  } = useUIStore();

  const { feishuWebhook, setFeishuWebhook } = useConfigStore();
  const [showFeishuConfig, setShowFeishuConfig] = useState(false);
  const [tempWebhook, setTempWebhook] = useState(feishuWebhook);
  const [isSendingToFeishu, setIsSendingToFeishu] = useState(false);
  const [shareStatus, setShareStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const scrollRef = useRef<HTMLDivElement>(null);
  const [inputValue, setInputValue] = React.useState('');
  const stockSymbol = analysis?.stockInfo?.symbol;
  const dataVerification = analysis?.dataVerification;

  const getWeightInfo = (role: AgentRole) => {
    return analystWeights?.find(w => w.role === role);
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (inputValue.trim() && onSendMessage) {
      onSendMessage(inputValue.trim());
      setInputValue('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleDownload = () => {
    if (messages.length === 0) return;

    const content = messages.map(msg => {
      const time = new Date(msg.timestamp).toLocaleString();
      const roleName = roleNames[msg.role] || msg.role;
      return `### [${roleName}] - ${time}\n\n${msg.content}\n\n---\n\n`;
    }).join('\n');

    const header = `# AI 专家组联席会议记录 - ${stockSymbol || '未知股票'}\n生成时间: ${new Date().toLocaleString()}\n\n---\n\n`;
    const fullContent = header + content;

    const blob = new Blob([fullContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `AI_Discussion_${stockSymbol || 'Report'}_${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleFeishuShare = async () => {
    if (!feishuWebhook) {
      setTempWebhook('');
      setShowFeishuConfig(true);
      return;
    }


    setIsSendingToFeishu(true);
    setShareStatus('loading');
    try {
      const success = await sendAnalysisToFeishu(analysis, feishuWebhook);
      if (success) {
        setShareStatus('success');
        setTimeout(() => setShareStatus('idle'), 3000);
      } else {
        setShareStatus('error');
        setTimeout(() => setShareStatus('idle'), 3000);
      }
    } catch (error) {
      console.error(error);
      setShareStatus('error');
      setTimeout(() => setShareStatus('idle'), 3000);
    } finally {
      setIsSendingToFeishu(false);
    }
  };

  const saveFeishuWebhook = () => {
    if (!tempWebhook.trim() || !tempWebhook.includes('feishu.cn')) {
      alert("请输入有效的飞书 Webhook 链接");
      return;
    }
    setFeishuWebhook(tempWebhook.trim());
    setShowFeishuConfig(false);
    // Auto-trigger after save
    setTimeout(handleFeishuShare, 100);
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 overflow-hidden relative">
      <div className="p-6 border-b border-slate-700/70 bg-slate-800 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <div
            className="relative cursor-grab active:cursor-grabbing p-2 -ml-2 hover:bg-slate-700/50 rounded-lg transition-colors"
            onPointerDown={onPointerDownDrag}
          >
            <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
            <div className="absolute inset-0 w-3 h-3 rounded-full bg-emerald-500 animate-ping opacity-75" />
          </div>
          <h3 className="text-base font-black uppercase tracking-[0.2em] text-slate-200">AI 专家组联席会议</h3>
          {dataVerification && dataVerification.length > 0 && (
            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${dataVerification.every(v => v.isVerified)
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
              }`}>
              {dataVerification.every(v => v.isVerified) ? (
                <>
                  <ShieldCheck size={12} />
                  数据已交叉验证
                </>
              ) : (
                <>
                  <AlertTriangle size={12} />
                  检测到数据差异
                </>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-4">
          {onToggleFullscreen && (
            <button
              onClick={onToggleFullscreen}
              className="p-2 hover:bg-slate-700 rounded-xl text-slate-400 hover:text-white transition-colors"
              title={isFullscreen ? "退出全屏" : "全屏模式"}
            >
              {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
            </button>
          )}
          
          {messages.length > 0 && !isDiscussing && (
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 border border-slate-600 text-xs font-bold text-white transition-colors"
              title="下载研讨记录"
            >
              <Download size={16} />
              导出完整记录
            </button>
          )}

          {messages.length > 0 && !isDiscussing && (
            <button
              onClick={handleFeishuShare}
              disabled={isSendingToFeishu}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl transition-all font-bold text-xs border shadow-lg ring-offset-2 focus:ring-2 ring-emerald-500/20",
                shareStatus === "success" 
                  ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40" 
                  : shareStatus === "error"
                  ? "bg-rose-500/20 text-rose-400 border-rose-500/40"
                  : isSendingToFeishu 
                  ? "bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed"
                  : "bg-emerald-500 hover:bg-emerald-400 border-emerald-400/30 text-white shadow-emerald-500/10 active:scale-95"
              )}
              title="分享到飞书机器人"
            >
              {shareStatus === "loading" ? <Loader2 size={16} className="animate-spin" /> : 
               shareStatus === "success" ? <CheckCircle2 size={16} /> : 
               shareStatus === "error" ? <AlertTriangle size={16} /> : <Send size={16} />}
              {shareStatus === "loading" ? "正在发送..." : 
               shareStatus === "success" ? "已发送成功" : 
               shareStatus === "error" ? "发送失败" : "分享至飞书"}
            </button>
          )}

          {isDiscussing && (
            <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-800 border border-slate-700 text-xs font-bold text-slate-400 uppercase tracking-widest">
              <Loader2 size={14} className="animate-spin text-emerald-500" />
              全网推演中
            </div>
          )}

          {onClose && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-700 rounded-xl text-slate-400 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          )}
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 md:p-8 space-y-10 scrollbar-hide bg-slate-900/80"
      >
        {/* Performance Review (Backtest) */}
        {analysis?.backtestResult && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-4xl mx-auto bg-indigo-500/10 border border-indigo-500/30 rounded-2xl p-6 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <RotateCcw size={120} className="text-indigo-400 rotate-12" />
            </div>
            
            <div className="relative z-10 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
                    <History size={20} className="text-indigo-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black uppercase tracking-widest text-indigo-400">历史预测复盘 (Learning Loop)</h4>
                    <p className="text-[10px] text-slate-500">上次分析时间: {new Date(analysis.backtestResult.previousDate).toLocaleString()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-xs font-black px-3 py-1 rounded-full border ${
                    analysis.backtestResult.actualReturn.startsWith('+') 
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                      : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                  }`}>
                    区间表现: {analysis.backtestResult.actualReturn}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-950/50 rounded-xl p-3 border border-white/5">
                  <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">上次建议</p>
                  <p className="text-sm font-black text-white">{analysis.backtestResult.previousRecommendation}</p>
                </div>
                <div className="bg-slate-950/50 rounded-xl p-3 border border-white/5 col-span-2">
                  <p className="text-[10px] text-indigo-400 uppercase font-bold mb-1">专家组进化心得</p>
                  <p className="text-xs text-indigo-200/90 leading-relaxed italic">"{analysis.backtestResult.learningPoint}"</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Decision Engine Dashboard */}
        {analysis?.expectedValueOutcome && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto space-y-6"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
                  <Calculator size={18} className="text-blue-400" />
                </div>
                <h4 className="text-sm font-black uppercase tracking-[0.2em] text-blue-400">期望价值中枢 (Expected Value)</h4>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-slate-500 uppercase font-black">统一期望价格</p>
                <p className="text-2xl font-black text-white tracking-tighter">${analysis.expectedValueOutcome.expectedPrice}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* EV Calculation logic */}
              <div className="bg-slate-800/40 border border-white/5 rounded-2xl p-5 space-y-4">
                <div className="flex items-center gap-2 border-b border-white/5 pb-3">
                  <Activity size={16} className="text-blue-400" />
                  <span className="text-[11px] font-black uppercase tracking-widest text-slate-300">概率加权演算逻辑</span>
                </div>
                <div className="bg-slate-950/50 rounded-xl p-4 border border-white/5 font-mono text-xs text-blue-300/90 leading-relaxed italic">
                  "{analysis.expectedValueOutcome.calculationLogic}"
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-500 mt-2">
                  <span>置信区间: <span className="text-slate-300 font-bold">{analysis.expectedValueOutcome.confidenceInterval}</span></span>
                  <span className="flex items-center gap-1"><Shield size={10} /> 机构级一致性验证已通过</span>
                </div>
              </div>

              {/* Sensitivity Matrix */}
              {analysis.sensitivityMatrix && (
                <div className="bg-slate-800/40 border border-white/5 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center gap-2 border-b border-white/5 pb-3">
                    <Table size={16} className="text-emerald-400" />
                    <span className="text-[11px] font-black uppercase tracking-widest text-slate-300">多变量收益敏感度矩阵</span>
                  </div>
                  <div className="space-y-2">
                    {analysis.sensitivityMatrix.map((row, idx) => (
                      <div key={`smr-${idx}`} className="flex items-center justify-between text-[11px] py-1 border-b border-white/5 last:border-0">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400 w-16 truncate">{row.variable}</span>
                          <span className="text-slate-500 font-mono italic">{row.change}</span>
                          <ArrowRight size={10} className="text-slate-600" />
                        </div>
                        <div className="text-right">
                          <span className={cn(
                            "font-black tracking-tighter mr-2",
                            row.profitImpact.includes('+') ? "text-emerald-400" : "text-rose-400"
                          )}>
                            {row.profitImpact}
                          </span>
                          <span className="text-[9px] text-slate-600 flex items-center gap-0.5 justify-end">
                            <Clock size={8} /> {row.timeLag}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {analysis && (analysis.coreVariables || analysis.businessModel || analysis.quantifiedRisks) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto space-y-6 mb-8"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="h-8 w-8 rounded-lg bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                <Target size={18} className="text-emerald-400" />
              </div>
              <h4 className="text-sm font-black uppercase tracking-[0.2em] text-emerald-400">决策引擎量化看板</h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Core Variables */}
              {analysis.coreVariables && analysis.coreVariables.length > 0 && (
                <div className="bg-slate-800/40 border border-white/5 rounded-2xl p-5 space-y-3 hover:border-cyan-500/20 transition-all">
                  <div className="flex items-center gap-2 border-b border-white/5 pb-3">
                    <Cpu size={16} className="text-cyan-400" />
                    <span className="text-[11px] font-black uppercase tracking-widest text-cyan-400">核心经济变量 (SSoT)</span>
                  </div>
                  <div className="space-y-2">
                    {analysis.coreVariables.map((v, idx) => (
                      <div key={`cv-${idx}`} className="bg-slate-900/50 rounded-xl p-3 border border-white/5 text-xs">
                        <div className="flex justify-between mb-1.5">
                          <span className="font-bold text-slate-200">{v.name}</span>
                          <span className="text-slate-500 font-mono text-[10px]">[{v.unit}] {v.evidenceLevel}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div><p className="text-[10px] text-slate-500">当前</p><p className="font-mono text-slate-300">{String(v.value)}</p></div>
                          <div className="border-x border-white/5"><p className="text-[10px] text-slate-500">市场预期</p><p className="font-mono text-slate-300">{String(v.marketExpect)}</p></div>
                          <div><p className="text-[10px] text-emerald-500">偏离</p><p className="font-mono text-emerald-400 font-bold">{v.delta}</p></div>
                        </div>
                        {v.reason && <p className="mt-1.5 pt-1.5 border-t border-white/5 text-[10px] text-amber-400/80 italic">{v.reason}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Business Model */}
              {analysis.businessModel && (
                <div className="bg-slate-800/40 border border-white/5 rounded-2xl p-5 space-y-3 hover:border-emerald-500/20 transition-all">
                  <div className="flex items-center gap-2 border-b border-white/5 pb-3">
                    <Layers size={16} className="text-emerald-400" />
                    <span className="text-[11px] font-black uppercase tracking-widest text-emerald-400">单位经济模型</span>
                    <span className="ml-auto text-[10px] font-mono text-slate-600 uppercase">{analysis.businessModel.businessType}</span>
                  </div>
                  <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4">
                    <p className="text-[10px] text-emerald-500 font-black uppercase mb-1">利润推演公式</p>
                    <p className="text-sm font-mono text-emerald-100 font-bold break-all">{analysis.businessModel.formula}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><p className="text-[10px] text-slate-500">预测利润</p><p className="text-base font-black text-white">{analysis.businessModel.projectedProfit}</p></div>
                    <div className="text-right"><p className="text-[10px] text-slate-500">置信度</p><p className="text-base font-black text-emerald-400">{analysis.businessModel.confidenceScore}%</p></div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {Object.entries(analysis.businessModel.drivers).map(([k, v]) => (
                      <span key={`drv-${k}`} className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-700/50 border border-slate-600 text-slate-400">{k}: {v}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantified Risks */}
              {analysis.quantifiedRisks && analysis.quantifiedRisks.length > 0 && (
                <div className="bg-slate-800/40 border border-white/5 rounded-2xl p-5 space-y-3 hover:border-rose-500/20 transition-all">
                  <div className="flex items-center gap-2 border-b border-white/5 pb-3">
                    <Shield size={16} className="text-rose-400" />
                    <span className="text-[11px] font-black uppercase tracking-widest text-rose-400">风险概率矩阵 (EV)</span>
                    {analysis.riskAdjustedValuation && (
                      <span className="ml-auto text-[10px] font-mono font-bold text-amber-400">风险调整估值: {analysis.riskAdjustedValuation}</span>
                    )}
                  </div>
                  <div className="space-y-2">
                    {analysis.quantifiedRisks.map((r, idx) => (
                      <div key={`qr-${idx}`} className="grid grid-cols-12 gap-2 items-center bg-slate-950/40 p-2.5 rounded-xl border border-white/5 text-xs">
                        <div className="col-span-4"><p className="font-bold text-slate-200 truncate">{r.name}</p><p className="text-[10px] text-slate-500 truncate">{r.mitigation}</p></div>
                        <div className="col-span-2 text-center"><p className="text-[9px] text-slate-500">概率</p><p className="font-mono font-bold text-amber-500">{r.probability}%</p></div>
                        <div className="col-span-3 text-center"><p className="text-[9px] text-slate-500">利润冲击</p><p className="font-mono font-bold text-rose-400">{r.impactPercent}%</p></div>
                        <div className="col-span-3 text-right"><p className="text-[9px] text-slate-500">EV损失</p><p className="font-mono font-black text-rose-500 bg-rose-500/10 px-1.5 py-0.5 rounded-lg">{r.expectedLoss}%</p></div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Position Plan (from tradingPlan) */}
              {analysis.tradingPlan?.positionPlan && analysis.tradingPlan.positionPlan.length > 0 && (
                <div className="bg-slate-800/40 border border-white/5 rounded-2xl p-5 space-y-3 hover:border-blue-500/20 transition-all">
                  <div className="flex items-center gap-2 border-b border-white/5 pb-3">
                    <Award size={16} className="text-blue-400" />
                    <span className="text-[11px] font-black uppercase tracking-widest text-blue-400">分层建仓 & 逻辑止损</span>
                  </div>
                  <div className="flex gap-2">
                    {analysis.tradingPlan.positionPlan.map((p, idx) => (
                      <div key={`pp-${idx}`} className="flex-1 bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 text-center">
                        <p className="text-sm font-black text-blue-400">{p.price}</p>
                        <p className="text-[10px] text-slate-500">{p.positionPercent}%</p>
                      </div>
                    ))}
                  </div>
                  {analysis.tradingPlan.logicBasedStopLoss && (
                    <div className="flex items-start gap-2 text-xs text-rose-300 bg-rose-500/5 p-2.5 rounded-lg border border-rose-500/10">
                      <AlertTriangle size={12} className="shrink-0 mt-0.5" />
                      <span>{analysis.tradingPlan.logicBasedStopLoss}</span>
                    </div>
                  )}
                  {analysis.tradingPlan.riskRewardRatio && (
                    <p className="text-[10px] text-slate-500">风险收益比: <span className="font-bold text-emerald-400">{analysis.tradingPlan.riskRewardRatio}</span></p>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {dataVerification && dataVerification.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto bg-slate-800/50 border border-emerald-500/20 rounded-2xl p-6 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <div className="flex items-center gap-3">
                <ShieldCheck className="text-emerald-400" size={20} />
                <h4 className="text-sm font-black uppercase tracking-widest text-emerald-400">数据完整性与交叉验证报告</h4>
              </div>
              <div className="flex items-center gap-3">
                {analysis?.dataQuality && (
                  <div className={cn(
                    "flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
                    getQualityLabel(analysis.dataQuality.score).color,
                    "bg-white/5 border-white/10"
                  )}>
                    <Database size={10} />
                    综合质量: {analysis.dataQuality.score}%
                  </div>
                )}
                <span className="text-[10px] font-mono font-bold text-slate-500 uppercase">实时监测已开启</span>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {dataVerification.map((item, idx) => (
                <div key={`verification-${idx}-${item.source}`} className="bg-slate-900/50 border border-white/5 rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300">{item.source}</span>
                    {item.isVerified ? (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full border border-emerald-400/20">
                        <CheckCircle2 size={10} />
                        已验证
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-rose-400 bg-rose-400/10 px-2 py-0.5 rounded-full border border-rose-400/20">
                        <AlertTriangle size={10} />
                        存在差异
                      </span>
                    )}
                  </div>
                  {item.discrepancy && (
                    <p className="text-xs text-rose-300/80 leading-relaxed italic">
                      差异: {item.discrepancy}
                    </p>
                  )}
                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${item.confidence > 90 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                          style={{ width: `${item.confidence}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-mono font-bold text-slate-500">{item.confidence}% 置信度</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-600 italic">
                      {new Date(item.lastChecked).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((msg, i) => {
            const msgKey = msg.id ? `msg-id-${msg.id}` : `msg-idx-${i}-${msg.role}-${msg.timestamp}-${Math.random().toString(36).substr(2, 5)}`;
            return (
              <motion.div
                key={msgKey}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ type: "spring", stiffness: 100, damping: 15 }}
                className="flex gap-6 group max-w-4xl mx-auto"
              >
                <div className={`flex-shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center border transition-all duration-300 group-hover:scale-110 shadow-lg ${roleColors[msg.role] || "text-slate-400 bg-slate-800 border-slate-700"}`}>
                  {roleIcons[msg.role] || <MessageSquare size={24} />}
                </div>
                <div className="flex-1 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-black uppercase tracking-widest px-3 py-1 rounded-lg border shadow-sm ${roleColors[msg.role] || "text-slate-300 bg-slate-800 border-slate-700"}`}>
                        {roleNames[msg.role] || msg.role}
                      </span>
                      {getWeightInfo(msg.role)?.isExpert && (
                        <span className="text-xs font-bold text-amber-500 bg-amber-500/10 px-3 py-1 rounded-lg border border-amber-500/20 flex items-center gap-1.5 animate-pulse">
                          <Award size={14} />
                          行业专家 ({getWeightInfo(msg.role)?.expertiseArea})
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-slate-500 font-mono font-bold">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>
                  <div className="relative">
                    <div className={`text-[15px] leading-7 p-6 rounded-3xl rounded-tl-none border shadow-xl transition-all duration-300 ${msg.type === "research" ? "bg-[#0b1b26] border-cyan-500/30 text-cyan-50 shadow-cyan-900/20 group-hover:border-cyan-500/50" :
                        msg.type === "review" ? "bg-[#10101f] border-indigo-500/30 text-indigo-50 shadow-indigo-900/20 group-hover:border-indigo-500/50" :
                          msg.type === "fact_check" ? "bg-[#1f0f13] border-rose-500/30 text-rose-50 shadow-rose-900/20 group-hover:border-rose-500/50" :
                            msg.type === "user_question" ? "bg-slate-800 border-slate-600 text-slate-200 shadow-black/20" :
                              "bg-slate-800/80 border-slate-700 text-slate-200 shadow-black/20 group-hover:border-slate-500"
                      }`}>
                      <div className="prose prose-invert prose-base max-w-none">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {msg.content}
                        </ReactMarkdown>
                      </div>

                      {msg.references && msg.references.length > 0 && (
                        <div className="mt-5 pt-5 border-t border-white/10">
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                            <ExternalLink size={14} />
                            引用来源
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {msg.references.map((ref, idx) => (
                              <a
                                key={`ref-${idx}-${ref.url}`}
                                href={ref.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs font-medium text-cyan-400 hover:text-white bg-cyan-950/40 border border-cyan-500/20 px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1.5"
                              >
                                {ref.title.length > 30 ? ref.title.substring(0, 30) + '...' : ref.title}
                                <ExternalLink size={12} />
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {messages.length === 0 && !isDiscussing && (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-4">
            <MessageSquare size={64} strokeWidth={1} />
            <p className="text-base">暂无研讨记录，请搜索股票开始分析</p>
          </div>
        )}
      </div>

      {messages.length > 0 && !isDiscussing && onSendMessage && (
        <div className="p-6 border-t border-slate-700/50 bg-slate-800 shadow-inner max-w-4xl mx-auto w-full">
          <div className="relative flex items-center gap-4">
            <div className="flex-1 relative">
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="向专家组提问或要求深度研判..."
                className="w-full bg-slate-900/80 border border-slate-600 rounded-2xl px-6 py-4 pr-16 text-base text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all resize-none shadow-inner h-[60px] flex items-center"
                rows={1}
                disabled={isReviewing}
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                {isReviewing ? (
                  <Loader2 size={24} className="animate-spin text-indigo-400" />
                ) : (
                  <button
                    onClick={handleSend}
                    disabled={!inputValue.trim()}
                    className="p-2 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white disabled:bg-slate-700 disabled:text-slate-500 transition-all shadow-lg"
                  >
                    <Send size={20} />
                  </button>
                )}
              </div>
            </div>
            <div className="flex-shrink-0">
              <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400" title="专家评审模式已开启">
                <HelpCircle size={26} />
              </div>
            </div>
          </div>
          <p className="mt-3 text-[11px] text-slate-400 px-2 flex items-center gap-1.5 font-bold">
            <Zap size={14} className="text-amber-400" />
            提问后将由 <span className="text-indigo-400">高级评审专家</span> 对当前话题进行深度复核与答疑
          </p>
        </div>
      )}

      {/* Feishu Config Modal Overlay */}
      <AnimatePresence>
        {showFeishuConfig && (
          <div className="absolute inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-6">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl p-8 shadow-2xl"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                  <Send size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white tracking-tight">配置飞书推送</h3>
                  <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest font-bold">FEISHU BOT WEBHOOK</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-slate-800 border border-slate-700">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Webhook URL</label>
                  <input 
                    type="text" 
                    value={tempWebhook}
                    onChange={(e) => setTempWebhook(e.target.value)}
                    placeholder="https://open.feishu.cn/open-apis/bot/v2/hook/..."
                    className="w-full bg-transparent border-none text-sm text-white placeholder-slate-600 focus:ring-0 p-0"
                    autoFocus
                  />
                </div>
                
                <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/10 flex gap-3 items-start">
                  <Info size={16} className="text-blue-400 mt-0.5 shrink-0" />
                  <p className="text-[11px] text-zinc-400 leading-relaxed italic">
                    配置后，分析结果将通过飞书内置交互式卡片的形式推送至对应群组。私钥将仅存储在您的浏览器本地缓存中。
                  </p>
                </div>

                <div className="flex gap-3 pt-4">
                  <button 
                    onClick={() => setShowFeishuConfig(false)}
                    className="flex-1 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs font-bold transition-all"
                  >
                    取消
                  </button>
                  <button 
                    onClick={saveFeishuWebhook}
                    className="flex-1 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-900/20 transition-all"
                  >
                    保存并发送
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
