import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, X } from 'lucide-react';
import { useUIStore } from '../../stores/useUIStore';

export const ErrorToast = () => {
  const { analysisError, setAnalysisError } = useUIStore();

  useEffect(() => {
    if (analysisError) {
      const timer = setTimeout(() => {
        setAnalysisError(null);
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [analysisError, setAnalysisError]);

  return (
    <AnimatePresence>
      {analysisError && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="fixed top-8 left-1/2 -translate-x-1/2 z-[100] w-full max-w-md px-6"
        >
          <div className="relative overflow-hidden rounded-2xl border border-rose-100 bg-white/80 p-5 shadow-2xl shadow-rose-900/10 backdrop-blur-xl">
            {/* Subtle Gradient Accent */}
            <div className="absolute inset-0 bg-gradient-to-r from-rose-50/50 to-transparent pointer-events-none" />
            
            <div className="relative flex items-start gap-4">
              <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-xl bg-rose-50 text-rose-500">
                <AlertCircle size={20} strokeWidth={2} />
              </div>
              
              <div className="flex-1 min-w-0 pr-6">
                <h3 className="text-sm font-bold text-zinc-950 tracking-tight mb-1">分析引擎提示</h3>
                <p className="text-xs text-rose-700/80 leading-relaxed font-medium">
                  {analysisError}
                </p>
              </div>

              <button
                onClick={() => setAnalysisError(null)}
                className="absolute top-0 right-0 p-1 text-zinc-400 hover:text-zinc-600 transition-colors"
                aria-label="Close error"
              >
                <X size={16} strokeWidth={2} />
              </button>
            </div>

            {/* Progress bar timer (visual only) */}
            <motion.div 
              initial={{ scaleX: 1 }}
              animate={{ scaleX: 0 }}
              transition={{ duration: 6, ease: "linear" }}
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-rose-200/50 origin-left"
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
