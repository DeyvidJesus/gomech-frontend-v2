import React, { useState, useEffect } from 'react';
import {
  X,
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  Trash2,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { aiActionApi } from '../api/aiActionApi';
import type { AiActionProposalResponse } from '../types/aiActionTypes';

interface AiActionConfirmationModalProps {
  proposal: AiActionProposalResponse;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedProposal: AiActionProposalResponse) => void;
}

export const AiActionConfirmationModal: React.FC<AiActionConfirmationModalProps> = ({
  proposal,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmationNotes, setConfirmationNotes] = useState('');
  const [rejectMode, setRejectMode] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [parsedPayload, setParsedPayload] = useState<any>(null);
  const [timeLeftStr, setTimeLeftStr] = useState<string>('');
  const [isExpired, setIsExpired] = useState(proposal.isExpired);

  useEffect(() => {
    try {
      if (proposal.payloadJson) {
        setParsedPayload(JSON.parse(proposal.payloadJson));
      }
    } catch {
      setParsedPayload(null);
    }
  }, [proposal.payloadJson]);

  // Live TTL countdown
  useEffect(() => {
    const updateCountdown = () => {
      const diff = new Date(proposal.expiresAt).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeftStr('Expirado');
        setIsExpired(true);
      } else {
        const mins = Math.floor(diff / 60000);
        const secs = Math.floor((diff % 60000) / 1000);
        setTimeLeftStr(`${mins}m ${secs}s restantes`);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [proposal.expiresAt]);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await aiActionApi.confirmProposal(proposal.id, {
        confirmationNotes: confirmationNotes.trim() || undefined,
        adjustedPayloadJson: parsedPayload ? JSON.stringify(parsedPayload) : undefined,
      });
      onSuccess(response.data);
      onClose();
    } catch (err: any) {
      setError(
        err.response?.data?.detail ||
          err.response?.data?.message ||
          'Falha ao confirmar e executar a ação de IA.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      setError('Por favor, informe a justificativa para a rejeição.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await aiActionApi.rejectProposal(proposal.id, {
        rejectionReason: rejectionReason.trim(),
      });
      onSuccess(response.data);
      onClose();
    } catch (err: any) {
      setError(
        err.response?.data?.detail ||
          err.response?.data?.message ||
          'Falha ao rejeitar a proposta.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveItem = (index: number) => {
    if (Array.isArray(parsedPayload)) {
      const updated = parsedPayload.filter((_, idx) => idx !== index);
      setParsedPayload(updated);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-950/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-zinc-100 flex items-center gap-2">
                Revisão de Ação de IA
                <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  {proposal.actionType}
                </span>
              </h3>
              <p className="text-xs text-zinc-400">
                Proposta gerada automaticamente por IA requer confirmação humana explícita.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Expiration Banner */}
        <div className={`px-6 py-2 flex items-center justify-between text-xs border-b ${
          isExpired
            ? 'bg-rose-500/10 border-rose-500/20 text-rose-400'
            : 'bg-zinc-950/30 border-zinc-800/80 text-zinc-400'
        }`}>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span>Validade da Proposta (TTL):</span>
          </div>
          <span className="font-semibold">{timeLeftStr}</span>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg flex items-start gap-2.5 text-rose-400 text-sm">
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Proposal Summary */}
          <div className="bg-zinc-950/40 border border-zinc-800/80 rounded-lg p-4 space-y-2">
            <div className="text-sm font-medium text-zinc-200">{proposal.title}</div>
            {proposal.summary && (
              <p className="text-xs text-zinc-400 leading-relaxed">{proposal.summary}</p>
            )}
            {proposal.targetResourceId && (
              <div className="text-xs text-zinc-500 pt-1">
                Recurso Alvo: <span className="font-mono text-zinc-400">{proposal.targetResourceType} #{proposal.targetResourceId}</span>
              </div>
            )}
          </div>

          {/* Payload Review / Editable Items */}
          {Array.isArray(parsedPayload) && parsedPayload.length > 0 ? (
            <div className="space-y-2">
              <div className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Itens Propostos para Aplicação ({parsedPayload.length})
              </div>
              <div className="border border-zinc-800 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-950/70 border-b border-zinc-800 text-zinc-400 font-medium">
                    <tr>
                      <th className="py-2.5 px-3">Item / Descrição</th>
                      <th className="py-2.5 px-3 text-center">Qtd</th>
                      <th className="py-2.5 px-3 text-right">Valor Unit.</th>
                      <th className="py-2.5 px-3 text-right">Total</th>
                      <th className="py-2.5 px-2 text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60 bg-zinc-900/40 text-zinc-300">
                    {parsedPayload.map((item: any, idx: number) => {
                      const qty = Number(item.quantity || 1);
                      const price = Number(item.unitPrice || item.estimatedPrice || 0);
                      const total = qty * price;
                      return (
                        <tr key={idx} className="hover:bg-zinc-800/30 transition">
                          <td className="py-2 px-3 font-medium text-zinc-200">
                            {item.name || item.description || 'Item'}
                          </td>
                          <td className="py-2 px-3 text-center">{qty}</td>
                          <td className="py-2 px-3 text-right">
                            {price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </td>
                          <td className="py-2 px-3 text-right font-semibold text-emerald-400">
                            {total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </td>
                          <td className="py-2 px-2 text-center">
                            <button
                              onClick={() => handleRemoveItem(idx)}
                              title="Remover item da proposta"
                              className="p-1 rounded text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="space-y-1.5">
              <div className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Payload Estruturado
              </div>
              <pre className="p-3 bg-zinc-950 border border-zinc-800 rounded-lg text-xs font-mono text-zinc-300 overflow-x-auto">
                {proposal.payloadJson}
              </pre>
            </div>
          )}

          {/* Notes or Reject View */}
          {rejectMode ? (
            <div className="space-y-2 bg-rose-500/5 border border-rose-500/20 rounded-lg p-4">
              <label className="text-xs font-semibold text-rose-400 block">
                Motivo da Rejeição (Obrigatório):
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Ex.: Orçamento recusado pelo cliente devido ao custo das peças..."
                rows={3}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-2.5 text-xs text-zinc-200 focus:outline-none focus:border-rose-500 transition resize-none"
              />
            </div>
          ) : (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-400 block">
                Observações de Confirmação (Opcional):
              </label>
              <input
                type="text"
                value={confirmationNotes}
                onChange={(e) => setConfirmationNotes(e.target.value)}
                placeholder="Ex.: Revisado e aprovado pelo mecânico responsável."
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500 transition"
              />
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-800 bg-zinc-950/50">
          <div className="flex items-center gap-1.5 text-xs text-zinc-500">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Execução autenticada via comandos de domínio</span>
          </div>

          <div className="flex items-center gap-2">
            {rejectMode ? (
              <>
                <button
                  onClick={() => setRejectMode(false)}
                  disabled={loading}
                  className="px-3 py-2 text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition"
                >
                  Voltar
                </button>
                <button
                  onClick={handleReject}
                  disabled={loading || !rejectionReason.trim()}
                  className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-lg shadow-sm transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                  Confirmar Rejeição
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setRejectMode(true)}
                  disabled={loading || isExpired}
                  className="px-3.5 py-2 text-xs font-semibold text-rose-400 hover:bg-rose-500/10 border border-rose-500/20 rounded-lg transition disabled:opacity-40"
                >
                  Rejeitar
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={loading || isExpired}
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  )}
                  Confirmar e Executar
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
