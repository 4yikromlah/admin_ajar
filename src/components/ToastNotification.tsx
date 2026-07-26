import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertCircle, Info, BellRing, X, ArrowRight } from 'lucide-react';

export interface ToastProps {
  show: boolean;
  type?: 'success' | 'info' | 'warning' | 'error';
  title: string;
  message: string;
  actionText?: string;
  onAction?: () => void;
  onClose: () => void;
  autoCloseMs?: number;
}

export const ToastNotification: React.FC<ToastProps> = ({
  show,
  type = 'success',
  title,
  message,
  actionText,
  onAction,
  onClose,
  autoCloseMs = 8000
}) => {
  useEffect(() => {
    if (show && autoCloseMs > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, autoCloseMs);
      return () => clearTimeout(timer);
    }
  }, [show, autoCloseMs, onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0" />;
      case 'info':
        return <BellRing className="w-6 h-6 text-blue-500 shrink-0 animate-bounce" />;
      case 'warning':
        return <AlertCircle className="w-6 h-6 text-amber-500 shrink-0" />;
      case 'error':
        return <AlertCircle className="w-6 h-6 text-rose-500 shrink-0" />;
      default:
        return <Info className="w-6 h-6 text-blue-500 shrink-0" />;
    }
  };

  const getBorderBg = () => {
    switch (type) {
      case 'success':
        return 'border-emerald-200 bg-white/95 text-slate-800 shadow-emerald-100/50';
      case 'info':
        return 'border-blue-200 bg-white/95 text-slate-800 shadow-blue-100/50';
      case 'warning':
        return 'border-amber-200 bg-white/95 text-slate-800 shadow-amber-100/50';
      case 'error':
        return 'border-rose-200 bg-white/95 text-slate-800 shadow-rose-100/50';
      default:
        return 'border-slate-200 bg-white/95 text-slate-800 shadow-slate-100/50';
    }
  };

  return (
    <AnimatePresence>
      {show && (
        <div className="fixed top-5 right-5 left-5 sm:left-auto sm:max-w-md z-[100] pointer-events-auto">
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className={`p-4 sm:p-5 rounded-2xl border shadow-2xl backdrop-blur-md flex items-start gap-3.5 ${getBorderBg()}`}
          >
            <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 shadow-sm shrink-0">
              {getIcon()}
            </div>

            <div className="flex-1 min-w-0 pr-2">
              <h4 className="text-xs sm:text-sm font-black text-slate-800 tracking-tight flex items-center gap-1.5">
                {title}
              </h4>
              <p className="text-[11px] sm:text-xs text-slate-600 mt-1 leading-relaxed font-medium">
                {message}
              </p>

              {actionText && onAction && (
                <button
                  type="button"
                  onClick={() => {
                    onAction();
                    onClose();
                  }}
                  className="mt-3 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold inline-flex items-center gap-1.5 transition-all shadow-md shadow-blue-200 active:scale-95 cursor-pointer"
                >
                  <span>{actionText}</span>
                  <ArrowRight size={13} />
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer shrink-0"
            >
              <X size={16} />
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
