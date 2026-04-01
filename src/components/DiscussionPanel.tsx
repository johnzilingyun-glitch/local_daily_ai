import React, { useEffect, useRef, useState } from 'react';
import { AgentRole } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Loader2, Download, Send, X, Maximize2, Minimize2, 
  CheckCircle2, AlertTriangle, Info, Share2, 
  Target, ShieldCheck, Activity, MessageSquareQuote, Globe, ExternalLink
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Stores
import { useAnalysisStore } from '../stores/useAnalysisStore';
import { useUIStore } from '../stores/useUIStore';
import { useConfigStore } from '../stores/useConfigStore';

// Services
import { sendAnalysisToFeishu } from '../services/feishuService';

// Sub-components
import { BacktestPanel } from './discussion/BacktestPanel';
import { ExpectedValuePanel } from './discussion/ExpectedValuePanel';
import { DecisionEnginePanel } from './discussion/DecisionEnginePanel';
import { DataVerificationPanel } from './discussion/DataVerificationPanel';
import { MessageItem } from './discussion/MessageItem';
import { DiscussionInput } from './discussion/DiscussionInput';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

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
  const stockSymbol = analysis?.stockInfo?.symbol;

  const getWeightInfo = (role: AgentRole) => {
    const weight = analystWeights?.find(w => w.role === role);
    return weight ? { isExpert: weight.isExpert, expertiseArea: weight.expertiseArea } : undefined;
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleDownload = () => {
    if (messages.length === 0) return;

    const content = messages.map(msg => {
      const time = new Date(msg.timestamp).toLocaleString();
      return `### [${msg.role}] - ${time}\n\n${msg.content}\n\n---\n\n`;
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
    setTimeout(handleFeishuShare, 100);
  };

  return (
    <div className="flex flex-col h-full bg-white overflow-hidden relative shadow-3xl">
      {/* Background Decoration */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-500/5 blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-violet-500/5 blur-[120px]" />
      </div>

      {/* Header Bar - Light Glassmorphism */}
      <div className="px-8 py-6 border-b border-zinc-100 bg-white/70 backdrop-blur-xl flex items-center justify-between relative z-10 shadow-sm">
        <div className="flex items-center gap-6">
          <div
            className="group relative cursor-grab active:cursor-grabbing p-2 hover:bg-zinc-100 rounded-2xl transition-all"
            onPointerDown={onPointerDownDrag}
          >
            <div className="w-3.5 h-3.5 rounded-full bg-indigo-600 shadow-lg shadow-indigo-600/30 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-bold tracking-tight text-zinc-950 uppercase flex items-center gap-2">
               AI 专家组联席会议中心
               <span className="text-[9px] font-bold text-zinc-400 border border-zinc-200 px-1.5 py-0.5 rounded-md">LIVE</span>
            </h3>
            <p className="text-[10px] font-medium text-zinc-400 mt-0.5 tracking-wider">Multi-Agent Strategic Intelligence Center</p>
          </div>
          
          <div className="ml-6 hidden md:flex items-center gap-3">
             <div className="h-6 w-px bg-zinc-100" />
             <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-50 border border-zinc-100">
                <Target size={12} className="text-zinc-400" />
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{stockSymbol || 'GLOBAL MONITOR'}</span>
             </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 mr-3">
            {messages.length > 0 && !isDiscussing && (
              <button
                onClick={handleDownload}
                className="btn-secondary h-10 px-4 rounded-xl text-[10px] tracking-wider uppercase border-zinc-100 shadow-sm"
              >
                <Download size={14} />
                导出记录
              </button>
            )}

            {messages.length > 0 && !isDiscussing && (
              <button
                onClick={handleFeishuShare}
                disabled={isSendingToFeishu}
                className={cn(
                  "btn-primary h-10 px-5 rounded-xl text-[10px] tracking-wider uppercase shadow-indigo-600/5",
                  shareStatus === "success" && "bg-emerald-500 hover:bg-emerald-600",
                  shareStatus === "error" && "bg-rose-500 hover:bg-rose-600"
                )}
              >
                {shareStatus === "loading" ? <Loader2 size={14} className="animate-spin" /> : 
                 shareStatus === "success" ? <CheckCircle2 size={14} /> : 
                 shareStatus === "error" ? <AlertTriangle size={14} /> : <Share2 size={14} />}
                {shareStatus === "loading" ? "SENDING" : shareStatus === "success" ? "DONE" : "飞书同步"}
              </button>
            )}
          </div>

          <div className="flex h-10 w-[1px] bg-zinc-100 mx-1" />

          {onToggleFullscreen && (
            <button
              onClick={onToggleFullscreen}
              className="p-2.5 hover:bg-zinc-100 rounded-xl text-zinc-400 hover:text-zinc-950 transition-all"
            >
              {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
            </button>
          )}

          {onClose && (
            <button
              onClick={onClose}
              className="p-2.5 hover:bg-zinc-100 rounded-xl text-zinc-400 hover:text-rose-500 transition-all"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-8 md:px-12 py-10 space-y-12 bg-white relative custom-scrollbar"
      >
        {isDiscussing && messages.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-8 bg-white/60 backdrop-blur-xl z-20 transition-all duration-1000">
             <div className="relative">
                <Loader2 size={80} className="animate-spin text-indigo-600/20" />
                <div className="absolute inset-0 flex items-center justify-center">
                   <ShieldCheck size={32} className="text-indigo-600 animate-pulse" />
                </div>
             </div>
             <div className="text-center space-y-3">
                <h4 className="text-xl font-bold tracking-tight text-zinc-950">联席会议核心推演中</h4>
                <p className="text-[10px] font-bold tracking-[0.2em] text-zinc-400 uppercase animate-pulse">
                  Expert agents are cross-verifying multi-dimensional market signals
                </p>
             </div>
          </div>
        )}

        <div className="space-y-12">
          <BacktestPanel analysis={analysis} />
          <ExpectedValuePanel analysis={analysis} />
          <DecisionEnginePanel analysis={analysis} />
          <DataVerificationPanel analysis={analysis} />
        </div>

        {/* Message Stream */}
        <div className="space-y-12">
          <div className="flex items-center gap-3">
             <div className="h-10 w-1 bg-indigo-600/20 rounded-full" />
             <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-400">Discussion Protocol</h4>
          </div>
          
          <AnimatePresence initial={false}>
            {messages.map((msg, i) => (
              <MessageItem 
                key={msg.id || i} 
                msg={msg} 
                weightInfo={getWeightInfo(msg.role)} 
              />
            ))}
          </AnimatePresence>
        </div>

        {messages.length === 0 && !isDiscussing && (
          <div className="flex-1 flex flex-col items-center justify-center text-zinc-200 py-32 space-y-6">
            <Activity size={64} strokeWidth={1} className="text-zinc-100" />
            <div className="text-center space-y-2">
               <p className="text-sm font-bold uppercase tracking-[0.3em] text-zinc-300">等待智库指令</p>
               <p className="text-[10px] uppercase font-bold tracking-[0.1em] text-zinc-400">Intelligence engine idle - Initiate analysis to begin</p>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      {messages.length > 0 && !isDiscussing && onSendMessage && (
        <div className="p-8 border-t border-zinc-100 bg-white relative z-10 shadow-[0_-12px_40px_-20px_rgba(0,0,0,0.05)]">
          <DiscussionInput 
            onSendMessage={onSendMessage} 
            isReviewing={isReviewing} 
          />
        </div>
      )}

      {/* Feishu Config Modal - Premium Redesign */}
      <AnimatePresence>
        {showFeishuConfig && (
          <div className="absolute inset-0 z-[100] flex items-center justify-center bg-zinc-900/10 backdrop-blur-xl p-10">
            <motion.div 
              initial={{ scale: 0.98, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.98, opacity: 0, y: 10 }}
              className="w-full max-w-lg bg-white border border-zinc-200 rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-[80px] -z-10" />
              
              <div className="flex items-center gap-6 mb-10">
                <div className="p-4 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100/50 shadow-sm">
                  <Share2 size={28} strokeWidth={1.5} />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-zinc-950 tracking-tight">飞书同步系统</h3>
                  <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-[0.2em] mt-0.5">Institutional Delivery Configuration</p>
                </div>
              </div>

              <div className="space-y-8">
                <div className="space-y-4">
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-[0.3em]">Feishu Webhook Endpoint</label>
                  <div className="relative group">
                    <input 
                      type="text" 
                      value={tempWebhook}
                      onChange={(e) => setTempWebhook(e.target.value)}
                      placeholder="https://open.feishu.cn/..."
                      className="input-premium h-12 pr-10 font-mono text-sm"
                      autoFocus
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-300">
                      <ExternalLink size={16} />
                    </div>
                  </div>
                </div>
                
                <div className="p-5 rounded-2xl bg-indigo-50/50 border border-indigo-100/50 flex gap-4 items-start">
                  <Info size={18} className="text-indigo-400 mt-0.5 shrink-0" strokeWidth={2} />
                  <p className="text-xs text-indigo-600 font-medium leading-relaxed">
                    配置完成后，分析记录将以 <span className="font-bold">互动式卡片</span> 形式实时推送到工作群。
                  </p>
                </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    onClick={() => setShowFeishuConfig(false)}
                    className="flex-1 h-12 rounded-xl bg-zinc-50 hover:bg-zinc-100 text-zinc-500 text-xs font-bold uppercase tracking-widest transition-all"
                  >
                    取消
                  </button>
                  <button 
                    onClick={saveFeishuWebhook}
                    className="flex-1 h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold uppercase tracking-widest shadow-xl shadow-indigo-600/10 transition-all active:scale-[0.98]"
                  >
                    保存并推送
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
