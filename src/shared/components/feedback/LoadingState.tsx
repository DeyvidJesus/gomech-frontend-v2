import React from 'react';
import { Loader2 } from 'lucide-react';

export interface LoadingStateProps {
  variant?: 'spinner' | 'fullscreen' | 'card-skeleton' | 'table-skeleton';
  message?: string;
  count?: number;
  className?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  variant = 'spinner',
  message = 'Carregando dados...',
  count = 3,
  className = '',
}) => {
  if (variant === 'fullscreen') {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-zinc-950/80 backdrop-blur-sm">
        <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-2xl flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          <p className="text-xs font-medium text-zinc-300 animate-pulse">{message}</p>
        </div>
      </div>
    );
  }

  if (variant === 'card-skeleton') {
    return (
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ${className}`}>
        {Array.from({ length: count }).map((_, idx) => (
          <div
            key={idx}
            className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5 space-y-3 animate-pulse"
          >
            <div className="flex items-center justify-between">
              <div className="h-4 bg-zinc-800 rounded w-1/3" />
              <div className="h-4 bg-zinc-800 rounded-full w-16" />
            </div>
            <div className="h-3 bg-zinc-800/70 rounded w-3/4" />
            <div className="h-3 bg-zinc-800/50 rounded w-1/2" />
            <div className="pt-2 flex justify-between">
              <div className="h-6 bg-zinc-800 rounded w-20" />
              <div className="h-6 bg-zinc-800 rounded w-16" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'table-skeleton') {
    return (
      <div className={`border border-zinc-800 rounded-xl overflow-hidden ${className}`}>
        <div className="h-10 bg-zinc-950 border-b border-zinc-800 flex items-center px-4 gap-4">
          <div className="h-3 bg-zinc-800 rounded w-24" />
          <div className="h-3 bg-zinc-800 rounded w-32" />
          <div className="h-3 bg-zinc-800 rounded w-20 ml-auto" />
        </div>
        <div className="divide-y divide-zinc-800/60 bg-zinc-900/40">
          {Array.from({ length: count }).map((_, idx) => (
            <div key={idx} className="h-12 flex items-center px-4 gap-4 animate-pulse">
              <div className="h-3 bg-zinc-800 rounded w-28" />
              <div className="h-3 bg-zinc-800/70 rounded w-48" />
              <div className="h-3 bg-zinc-800/60 rounded w-20" />
              <div className="h-5 bg-zinc-800 rounded-full w-16 ml-auto" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Default 'spinner'
  return (
    <div className={`flex flex-col items-center justify-center p-8 text-center space-y-2 ${className}`}>
      <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
      {message && <p className="text-xs text-zinc-400 font-medium">{message}</p>}
    </div>
  );
};
