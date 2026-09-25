import React from 'react';
import { Inbox } from 'lucide-react';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 sm:p-12 text-center bg-zinc-950/40 border border-dashed border-zinc-800 rounded-2xl ${className}`}
    >
      <div className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-400 mb-3 shadow-inner">
        {icon || <Inbox className="w-6 h-6 text-zinc-500" />}
      </div>
      <h4 className="text-sm font-semibold text-zinc-200">{title}</h4>
      {description && (
        <p className="text-xs text-zinc-400 max-w-sm mt-1 mb-4 leading-relaxed">
          {description}
        </p>
      )}
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm shadow-indigo-500/20 transition active:translate-y-[1px]"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};
