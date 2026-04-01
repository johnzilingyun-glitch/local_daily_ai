import React, { useState, KeyboardEvent } from 'react';
import { Send, Loader2, Zap, HelpCircle, MessageSquarePlus } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: any[]) {
  return twMerge(clsx(inputs));
}

interface DiscussionInputProps {
  onSendMessage: (message: string) => void;
  isReviewing: boolean;
}

export const DiscussionInput = React.memo(({ onSendMessage, isReviewing }: DiscussionInputProps) => {
  const [inputValue, setInputValue] = useState('');

  const handleSend = () => {
    if (inputValue.trim() && !isReviewing) {
      onSendMessage(inputValue.trim());
      setInputValue('');
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="max-w-4xl mx-auto w-full animate-premium relative z-20">
      <div className="relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500/10 to-violet-500/10 rounded-[1.5rem] blur opacity-0 group-focus-within:opacity-100 transition duration-1000" />
        <div className="relative">
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="深度提问或要求专家组针对特定逻辑进行复核..."
            className="w-full bg-white border border-zinc-200 rounded-[1.5rem] px-8 py-5 pr-20 text-[14px] text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all resize-none shadow-xl shadow-zinc-900/5 h-[72px] min-h-[72px] flex items-center leading-relaxed"
            rows={1}
            disabled={isReviewing}
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-3">
            {isReviewing ? (
              <div className="p-3">
                <Loader2 size={18} className="animate-spin text-indigo-500" />
              </div>
            ) : (
              <button
                onClick={handleSend}
                disabled={!inputValue.trim()}
                className="p-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white disabled:bg-zinc-100 disabled:text-zinc-300 transition-all shadow-lg active:scale-95 group/btn"
              >
                <Send size={18} strokeWidth={2.5} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </button>
            )}
          </div>
        </div>
      </div>
      
      <div className="mt-4 flex items-center justify-between px-3">
        <p className="text-[10px] text-zinc-400 flex items-center gap-2 font-bold uppercase tracking-wider">
          <MessageSquarePlus size={14} className="text-indigo-500" />
          提问后将由 <span className="text-zinc-900">高级评审专家</span> 开启深度研判复核模式 (FMEA)
        </p>
        <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 font-bold uppercase tracking-widest">
          <HelpCircle size={10} />
          <span>Shift+Enter 换行</span>
        </div>
      </div>
    </div>
  );
});

DiscussionInput.displayName = 'DiscussionInput';
