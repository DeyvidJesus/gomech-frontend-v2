import React, { useState } from 'react';
import { Sparkles, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import type { AiActionProposalResponse } from '../types/aiActionTypes';
import { AiActionConfirmationModal } from './AiActionConfirmationModal';

interface AiActionProposalCardProps {
  proposal: AiActionProposalResponse;
  onProposalUpdated?: (updated: AiActionProposalResponse) => void;
}

export const AiActionProposalCard: React.FC<AiActionProposalCardProps> = ({
  proposal: initialProposal,
  onProposalUpdated,
}) => {
  const [proposal, setProposal] = useState<AiActionProposalResponse>(initialProposal);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSuccess = (updated: AiActionProposalResponse) => {
    setProposal(updated);
    if (onProposalUpdated) {
      onProposalUpdated(updated);
    }
  };

  const getStatusBadge = () => {
    switch (proposal.status) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Clock className="w-3 h-3" /> Aguardando Confirmação
          </span>
        );
      case 'EXECUTED':
      case 'CONFIRMED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle className="w-3 h-3" /> Executado com Sucesso
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <XCircle className="w-3 h-3" /> Rejeitado
          </span>
        );
      case 'EXPIRED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-500/10 text-zinc-400 border border-zinc-500/20">
            <AlertCircle className="w-3 h-3" /> Expirado
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-zinc-800 text-zinc-300">
            {proposal.status}
          </span>
        );
    }
  };

  return (
    <>
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-4 shadow-sm hover:border-zinc-700/80 transition flex flex-col justify-between gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mt-0.5">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-semibold text-zinc-100">{proposal.title}</span>
                {getStatusBadge()}
              </div>
              {proposal.summary && (
                <p className="text-xs text-zinc-400 mt-1 line-clamp-2">{proposal.summary}</p>
              )}
            </div>
          </div>

          {proposal.status === 'PENDING' && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="shrink-0 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow transition"
            >
              Revisar Proposta
            </button>
          )}
        </div>

        {proposal.rejectionReason && (
          <div className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded p-2">
            Motivo da Rejeição: {proposal.rejectionReason}
          </div>
        )}
      </div>

      <AiActionConfirmationModal
        proposal={proposal}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleSuccess}
      />
    </>
  );
};
