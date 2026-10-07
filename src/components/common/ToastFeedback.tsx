import React from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export type FeedbackType = 'success' | 'error' | 'warning' | 'info';

export interface UIFeedbackBannerProps {
  type: FeedbackType;
  message: string;
  title?: string;
  onDismiss?: () => void;
  className?: string;
}

export const UIFeedbackBanner: React.FC<UIFeedbackBannerProps> = ({
  type,
  message,
  title,
  onDismiss,
  className = ''
}) => {
  const styles = {
    success: {
      container: 'bg-emerald-50 border-emerald-200 text-emerald-900',
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />,
      closeBtn: 'text-emerald-700 hover:text-emerald-950'
    },
    error: {
      container: 'bg-rose-50 border-rose-200 text-rose-900',
      icon: <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />,
      closeBtn: 'text-rose-700 hover:text-rose-950'
    },
    warning: {
      container: 'bg-amber-50 border-amber-200 text-amber-950',
      icon: <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />,
      closeBtn: 'text-amber-800 hover:text-amber-950'
    },
    info: {
      container: 'bg-slate-50 border-slate-200 text-slate-800',
      icon: <Info className="w-5 h-5 text-slate-600 shrink-0" />,
      closeBtn: 'text-slate-600 hover:text-slate-900'
    }
  };

  const currentStyle = styles[type];

  return (
    <div
      role="alert"
      className={`p-4 rounded-xl border flex items-start justify-between text-xs sm:text-sm space-x-3 transition-all ${currentStyle.container} ${className}`}
    >
      <div className="flex items-start space-x-3 min-w-0">
        <div className="mt-0.5">{currentStyle.icon}</div>
        <div className="flex-1">
          {title && <h4 className="font-semibold text-xs uppercase tracking-wider mb-0.5">{title}</h4>}
          <p className="leading-relaxed">{message}</p>
        </div>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          aria-label="Dismiss alert"
          className={`p-1 rounded-md transition-colors ${currentStyle.closeBtn}`}
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
