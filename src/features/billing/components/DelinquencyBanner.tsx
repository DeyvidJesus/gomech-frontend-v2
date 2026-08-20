import React from 'react';
import { AlertTriangle, ArrowRight } from 'lucide-react';

interface DelinquencyBannerProps {
  onPayNow: () => void;
}

export const DelinquencyBanner: React.FC<DelinquencyBannerProps> = ({ onPayNow }) => {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-gradient-to-r from-red-950/80 via-amber-950/60 to-red-950/80 border border-red-500/40 rounded-2xl shadow-lg shadow-red-950/30 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-red-500/20 text-red-400 rounded-xl">
          <AlertTriangle className="w-5 h-5 shrink-0" />
        </div>
        <div>
          <h4 className="text-sm font-semibold text-white">Assinatura com Pagamento Pendente</h4>
          <p className="text-xs text-red-200/80">
            Identificamos uma pendência no faturamento da sua oficina. Regularize para garantir acesso ininterrupto a todos os recursos.
          </p>
        </div>
      </div>
      <button
        onClick={onPayNow}
        className="flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-red-600/30 transition-all shrink-0"
      >
        <span>Regularizar Agora</span>
        <ArrowRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
