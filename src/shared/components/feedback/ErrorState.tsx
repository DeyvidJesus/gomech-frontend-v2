import React, { useState } from 'react';
import { AlertTriangle, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';

export interface ErrorStateProps {
  title?: string;
  message?: string;
  error?: unknown;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Falha ao carregar informações',
  message,
  error,
  onRetry,
  className = '',
}) => {
  const [showDetails, setShowDetails] = useState(false);

  const getErrorMessage = (): string => {
    if (message) return message;
    if (typeof error === 'string') return error;
    if (error && typeof error === 'object') {
      const err = error as any;
      return (
        err.response?.data?.detail ||
        err.response?.data?.message ||
        err.message ||
        'Ocorreu um erro inesperado na comunicação com o servidor.'
      );
    }
    return 'Ocorreu um erro inesperado na comunicação com o servidor.';
  };

  const getErrorDetails = (): string | null => {
    if (!error) return null;
    try {
      return JSON.stringify(error, null, 2);
    } catch {
      return String(error);
    }
  };

  const details = getErrorDetails();

  return (
    <div
      className={`p-6 bg-rose-500/5 border border-rose-500/20 rounded-2xl flex flex-col items-center text-center max-w-lg mx-auto my-4 ${className}`}
    >
      <div className="p-3 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 mb-3">
        <AlertTriangle className="w-6 h-6" />
      </div>

      <h4 className="text-sm font-semibold text-zinc-100">{title}</h4>
      <p className="text-xs text-rose-400/90 mt-1 mb-4 leading-relaxed max-w-md">
        {getErrorMessage()}
      </p>

      <div className="flex items-center gap-3">
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-zinc-100 bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-900 border border-zinc-700 rounded-lg transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Tentar Novamente
          </button>
        )}

        {details && (
          <button
            type="button"
            onClick={() => setShowDetails(!showDetails)}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-zinc-400 hover:text-zinc-200 transition"
          >
            <span>{showDetails ? 'Ocultar Detalhes' : 'Ver Detalhes'}</span>
            {showDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        )}
      </div>

      {showDetails && details && (
        <pre className="mt-4 p-3 bg-zinc-950 border border-zinc-800 rounded-lg text-left text-[11px] font-mono text-zinc-400 w-full overflow-x-auto max-h-40">
          {details}
        </pre>
      )}
    </div>
  );
};
