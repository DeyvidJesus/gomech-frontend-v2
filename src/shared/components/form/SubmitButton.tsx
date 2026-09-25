import React from 'react';
import { Loader2 } from 'lucide-react';

export interface SubmitButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  loadingText?: string;
  icon?: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'outline';
}

export const SubmitButton: React.FC<SubmitButtonProps> = ({
  loading = false,
  loadingText,
  icon,
  variant = 'primary',
  disabled,
  className = '',
  children,
  ...props
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'secondary':
        return 'bg-zinc-800 text-zinc-200 hover:bg-zinc-700 active:bg-zinc-900 border border-zinc-700';
      case 'danger':
        return 'bg-rose-600 text-white hover:bg-rose-500 active:bg-rose-700 shadow-sm';
      case 'outline':
        return 'bg-transparent text-zinc-300 hover:text-white hover:bg-zinc-800 border border-zinc-700';
      case 'primary':
      default:
        return 'bg-indigo-600 text-white hover:bg-indigo-500 active:bg-indigo-700 shadow-sm shadow-indigo-500/20';
    }
  };

  return (
    <button
      type="submit"
      disabled={disabled || loading}
      className={`relative inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all active:translate-y-[1px] disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none ${getVariantStyles()} ${className}`}
      {...props}
    >
      {loading ? (
        <>
          <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
          <span>{loadingText || children}</span>
        </>
      ) : (
        <>
          {icon && <span className="shrink-0">{icon}</span>}
          <span>{children}</span>
        </>
      )}
    </button>
  );
};
