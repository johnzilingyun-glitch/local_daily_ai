import React, { useState, useEffect } from 'react';
import { X, Search, Clock, BarChart3 } from 'lucide-react';
import { getHistoryContext } from '../services/aiService';
import { generateHistoryItemKey } from '../services/dateUtils';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (item: any) => void;
}

export function HistoryModal({ isOpen, onClose, onSelect }: HistoryModalProps) {
  const [history, setHistory] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      getHistoryContext().then(data => {
        setHistory(data);
        setLoading(false);
      });
    }
  }, [isOpen]);

  const filteredHistory = history.filter(item => 
    item.stockInfo?.symbol?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.stockInfo?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl flex flex-col max-h-[80vh]">
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Clock className="text-emerald-500" /> 历史研判记录
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X /></button>
        </div>
        
        <div className="p-4 border-b border-slate-700">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input
              type="text"
              placeholder="搜索股票代码或名称..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-800 border border-slate-600 rounded-xl py-2 pl-10 pr-4 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {loading ? (
            <div className="text-center py-10 text-slate-500">加载中...</div>
          ) : filteredHistory.length === 0 ? (
            <div className="text-center py-10 text-slate-500">暂无记录</div>
          ) : (
            filteredHistory.map((item, idx) => {
              const itemKey = generateHistoryItemKey(item, idx);
              return (
                <button
                  key={itemKey}
                  onClick={() => { onSelect(item); onClose(); }}
                  className="w-full flex items-center justify-between p-4 bg-slate-800 hover:bg-slate-700 rounded-xl transition-all border border-slate-700"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-slate-900 rounded-lg">
                      <BarChart3 className="text-emerald-500" size={20} />
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-white">{item.stockInfo?.name}</p>
                      <p className="text-xs text-slate-400 font-mono">{item.stockInfo?.symbol}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500">
                      {item.stockInfo?.lastUpdated || new Date().toLocaleString()}
                    </p>
                    {item.chatHistory && item.chatHistory.length > 0 && (
                      <p className="text-[10px] text-emerald-500 mt-1 font-bold uppercase tracking-tighter">包含对话</p>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
