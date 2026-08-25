import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { motion, AnimatePresence } from 'framer-motion';
import { toolsApi } from '../api/toolsApi';
import { iamApi } from '@/features/iam/api/iam';
import type { ToolTransfer, CreateToolTransferDto } from '../types';
import { useAuthStore } from '@/features/iam/stores/authStore';

export function ToolTransferList() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const unitId = user?.activeUnitId || '';

  const [page, setPage] = useState(0);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedToolId, setSelectedToolId] = useState('');
  const [destUnitId, setDestUnitId] = useState('');
  const [transferNotes, setTransferNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Fetch branches
  const { data: units = [] } = useQuery({
    queryKey: ['iam', 'units'],
    queryFn: () => iamApi.units().then((r) => r.data),
  });

  // Fetch available tools for transfer
  const { data: availableTools = [] } = useQuery({
    queryKey: ['tools', 'available', unitId],
    queryFn: () => toolsApi.getAvailableTools(unitId).then((r) => r.data),
    enabled: Boolean(unitId),
  });

  // Fetch transfers
  const { data: transfersResponse, isLoading } = useQuery({
    queryKey: ['tools', 'transfers', unitId, page],
    queryFn: () => toolsApi.getTransfers(unitId || undefined, undefined, page, 15).then((r) => r.data),
  });

  // Create Transfer Mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateToolTransferDto) => toolsApi.createTransfer(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tools'] });
      setCreateModalOpen(false);
      setSelectedToolId('');
      setDestUnitId('');
      setTransferNotes('');
      setFormError(null);
    },
    onError: (err: any) => {
      setFormError(err.response?.data?.detail || 'Erro ao criar transferência de ferramenta.');
    },
  });

  // Complete Transfer Mutation
  const completeMutation = useMutation({
    mutationFn: (id: string) => toolsApi.completeTransfer(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tools'] });
    },
  });

  // Cancel Transfer Mutation
  const cancelMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) => toolsApi.cancelTransfer(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tools'] });
    },
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedToolId || !destUnitId) {
      setFormError('Selecione a ferramenta e a filial de destino.');
      return;
    }

    createMutation.mutate({
      toolId: selectedToolId,
      destinationUnitId: destUnitId,
      notes: transferNotes.trim() || undefined,
    });
  };

  const transfers: ToolTransfer[] = transfersResponse?.content || [];
  const totalPages = transfersResponse?.totalPages || 1;
  const totalElements = transfersResponse?.totalElements || 0;

  const getUnitName = (id: string) => units.find((u) => u.id === id)?.name || id.substring(0, 8);

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/60 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-primary/10 text-primary">
              <span className="material-symbols-outlined text-[24px]">swap_horiz</span>
            </span>
            <h1 className="text-2xl font-bold font-headline-md text-on-surface">Transferências de Equipamentos</h1>
          </div>
          <p className="text-sm text-on-surface-variant mt-1">
            Controle a movimentação física e custódia de ferramentas entre matriz e filiais.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            to="/tools"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold border border-outline-variant/80 text-on-surface hover:bg-surface-container-high transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">construction</span>
            Catálogo
          </Link>
          <button
            onClick={() => setCreateModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm bg-primary text-on-primary hover:bg-primary-container transition-colors shadow-sm"
          >
            <span className="material-symbols-outlined text-[20px]">add</span>
            Nova Transferência
          </button>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-2xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-20 text-center text-on-surface-variant flex flex-col items-center">
            <span className="material-symbols-outlined animate-spin text-[32px] text-primary mb-2">progress_activity</span>
            <p className="text-sm font-medium">Carregando transferências...</p>
          </div>
        ) : transfers.length === 0 ? (
          <div className="py-20 text-center text-on-surface-variant flex flex-col items-center">
            <span className="material-symbols-outlined text-[48px] text-on-surface-variant/40 mb-2">swap_horiz</span>
            <h3 className="text-lg font-semibold text-on-surface">Nenhuma transferência registrada</h3>
            <p className="text-sm text-on-surface-variant mt-1 max-w-[380px]">
              Transfira equipamentos temporariamente para atender demandas em outras filiais.
            </p>
            <button
              onClick={() => setCreateModalOpen(true)}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold bg-primary text-on-primary hover:bg-primary-container transition-colors shadow-sm"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              Solicitar Remessa
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-outline-variant/40 bg-surface-container-low text-on-surface-variant text-[12px] uppercase font-semibold tracking-wider">
                  <th className="py-3.5 px-5">Transferência</th>
                  <th className="py-3.5 px-4">Ferramenta / Tag</th>
                  <th className="py-3.5 px-4">Origem</th>
                  <th className="py-3.5 px-4">Destino</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4">Data</th>
                  <th className="py-3.5 px-5 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/30 text-sm">
                {transfers.map((t) => {
                  const isDest = t.destinationUnitId === unitId;

                  return (
                    <tr key={t.id} className="hover:bg-surface-container-low/50 transition-colors">
                      <td className="py-3.5 px-5">
                        <div className="font-mono font-bold text-on-surface">{t.transferNumber}</div>
                        {t.notes && <div className="text-xs text-on-surface-variant truncate max-w-[320px]">{t.notes}</div>}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-on-surface">{t.toolName}</div>
                        <div className="font-mono text-xs text-on-surface-variant">{t.toolAssetTag}</div>
                      </td>

                      <td className="py-3.5 px-4 text-xs font-medium text-on-surface">
                        {getUnitName(t.sourceUnitId)}
                      </td>

                      <td className="py-3.5 px-4 text-xs font-medium text-on-surface">
                        {getUnitName(t.destinationUnitId)}
                        {isDest && (
                          <span className="ml-1.5 text-[10px] bg-primary/10 px-1.5 py-0.5 rounded font-semibold text-primary">
                            Destino
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        {t.status === 'COMPLETED' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-tertiary-container/30 text-tertiary">
                            <span className="w-1.5 h-1.5 rounded-full bg-tertiary" />
                            Concluída
                          </span>
                        ) : t.status === 'IN_TRANSIT' || t.status === 'PENDING' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-500/20 text-purple-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                            Em Trânsito
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-error-container/40 text-error">
                            <span className="w-1.5 h-1.5 rounded-full bg-error" />
                            Cancelada
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-xs text-on-surface-variant font-mono">
                        {new Date(t.createdAt).toLocaleDateString('pt-BR')}
                      </td>

                      <td className="py-3.5 px-5 text-right">
                        {(t.status === 'IN_TRANSIT' || t.status === 'PENDING') && (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => completeMutation.mutate(t.id)}
                              disabled={completeMutation.isPending}
                              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-tertiary text-on-tertiary hover:opacity-90 transition-opacity"
                            >
                              Receber Ferramenta
                            </button>
                            <button
                              onClick={() => {
                                const reason = prompt('Motivo do cancelamento:');
                                if (reason !== null) cancelMutation.mutate({ id: t.id, reason });
                              }}
                              className="p-1 rounded-lg text-on-surface-variant hover:text-error hover:bg-error-container/30"
                              title="Cancelar"
                            >
                              <span className="material-symbols-outlined text-[18px]">cancel</span>
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-outline-variant/40 bg-surface-container-low/40">
            <span className="text-xs text-on-surface-variant">
              Total de <strong className="text-on-surface">{totalElements}</strong> transferências
            </span>
            <div className="flex items-center gap-1">
              <button
                disabled={page === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                className="px-3 py-1 text-xs font-semibold rounded-lg border border-outline-variant/60 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-surface-container"
              >
                Anterior
              </button>
              <span className="text-xs text-on-surface-variant px-2">
                Página {page + 1} de {totalPages}
              </span>
              <button
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                className="px-3 py-1 text-xs font-semibold rounded-lg border border-outline-variant/60 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-surface-container"
              >
                Próxima
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal: Nova Remessa */}
      <AnimatePresence>
        {createModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-surface-container-lowest w-full max-w-[540px] rounded-2xl border border-outline-variant/60 shadow-2xl overflow-hidden"
            >
              <div className="p-5 border-b border-outline-variant/40 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[22px]">swap_horiz</span>
                  <h3 className="text-base font-bold text-on-surface">Nova Transferência entre Filiais</h3>
                </div>
                <button
                  onClick={() => setCreateModalOpen(false)}
                  className="p-1 rounded-lg text-on-surface-variant hover:bg-surface-container"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>

              <form onSubmit={handleCreateSubmit} className="p-6 space-y-4">
                {formError && (
                  <div className="p-3 rounded-xl bg-error-container/40 text-error text-xs font-semibold flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px]">warning</span>
                    {formError}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold uppercase text-on-surface-variant mb-1.5">
                    Ferramenta Disponível *
                  </label>
                  <select
                    required
                    value={selectedToolId}
                    onChange={(e) => setSelectedToolId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline-variant/60 rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  >
                    <option value="">Selecione a ferramenta...</option>
                    {availableTools.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.assetTag})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-on-surface-variant mb-1.5">
                    Filial Destino *
                  </label>
                  <select
                    required
                    value={destUnitId}
                    onChange={(e) => setDestUnitId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline-variant/60 rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  >
                    <option value="">Selecione a filial de destino...</option>
                    {units
                      .filter((u) => u.id !== unitId)
                      .map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-on-surface-variant mb-1.5">
                    Observações
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Ex: Empréstimo de equipamento para atendimento urgente..."
                    value={transferNotes}
                    onChange={(e) => setTransferNotes(e.target.value)}
                    className="w-full px-3.5 py-2 bg-surface-container-low border border-outline-variant/60 rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-outline-variant/40">
                  <button
                    type="button"
                    onClick={() => setCreateModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold border border-outline-variant/60 text-on-surface hover:bg-surface-container transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={createMutation.isPending}
                    className="px-5 py-2 rounded-xl text-xs font-semibold bg-primary text-on-primary hover:bg-primary-container disabled:opacity-50 transition-colors shadow-sm flex items-center gap-1.5"
                  >
                    {createMutation.isPending && (
                      <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>
                    )}
                    Despachar Ferramenta
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
