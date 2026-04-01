import React from 'react';
import { motion } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ExternalLink, Award, MessageSquare, Clock } from 'lucide-react';
import { AgentMessage } from '../../types';
import { roleIcons, roleColors, roleNames } from './constants';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: any[]) {
  return twMerge(clsx(inputs));
}

interface MessageItemProps {
  msg: AgentMessage;
  weightInfo?: { isExpert: boolean; expertiseArea: string };
}

export const MessageItem = React.memo(({ msg, weightInfo }: MessageItemProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="flex gap-6 group max-w-5xl mx-auto w-full relative"
    >
      {/* Agent Avatar Icon */}
      <div className={cn(
        "flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center border transition-all duration-500 group-hover:scale-105 shadow-sm relative z-10",
        roleColors[msg.role] || "text-zinc-400 bg-zinc-50 border-zinc-100"
      )}>
        {roleIcons[msg.role] || <MessageSquare size={20} />}
      </div>
      
      <div className="flex-1 space-y-3">
        {/* Header Metadata */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className={cn(
               "text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-lg border",
               roleColors[msg.role] || "text-zinc-500 bg-zinc-50 border-zinc-100"
            )}>
              {roleNames[msg.role] || msg.role}
            </span>
            {weightInfo?.isExpert && (
              <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-lg border border-indigo-100/50 flex items-center gap-1.5">
                <Award size={12} strokeWidth={2.5} />
                专家结论 ({weightInfo.expertiseArea})
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-zinc-300 font-mono font-medium tracking-tight">
            <Clock size={10} />
            {new Date(msg.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>

        {/* Message Content Bubble */}
        <div className="relative">
          <div className={cn(
            "text-[14px] leading-7 p-6 rounded-2xl border transition-all duration-500",
            msg.type === "research" ? "bg-cyan-50/30 border-cyan-100/50 text-zinc-700" :
            msg.type === "review" ? "bg-indigo-50/30 border-indigo-100/50 text-zinc-700" :
            msg.type === "fact_check" ? "bg-rose-50/30 border-rose-100/50 text-zinc-700" :
            msg.type === "user_question" ? "bg-zinc-50 border-zinc-200 text-zinc-900" :
            "bg-white border-zinc-100 text-zinc-600"
          )}>
            <div className="prose prose-zinc prose-sm max-w-none prose-p:leading-relaxed prose-strong:text-zinc-900 prose-headings:text-zinc-900 prose-pre:bg-zinc-50 prose-pre:border prose-pre:border-zinc-100">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {msg.content}
              </ReactMarkdown>
            </div>

            {/* Source References */}
            {msg.references && msg.references.length > 0 && (
              <div className="mt-6 pt-5 border-t border-zinc-100/80 space-y-3">
                <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                  <ExternalLink size={10} />
                  核心研判参考
                </p>
                <div className="flex flex-wrap gap-2">
                  {msg.references.map((ref, idx) => (
                    <a
                      key={`ref-${idx}-${ref.url}`}
                      href={ref.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50/50 border border-indigo-100/30 px-3 py-1.5 rounded-xl transition-all hover:bg-indigo-50 flex items-center gap-1.5 group/ref"
                    >
                      <span className="truncate max-w-[200px]">{ref.title}</span>
                      <ExternalLink size={10} className="group-hover/ref:translate-x-0.5 group-hover/ref:-translate-y-0.5 transition-transform" />
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
});

MessageItem.displayName = 'MessageItem';
