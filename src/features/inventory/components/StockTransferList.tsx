import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { motion, AnimatePresence } from 'framer-motion';
import { inventoryApi } from '../api/inventoryApi';
import { iamApi } from '@/features/iam/api/iam';
import type { StockTransfer, CreateTransferDto } from '../types';
import { useAuthStore } from '@/features/iam/stores/authStore';

export function StockTransferList() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const unitId = user?.activeUnitId || '';

  const [page, setPage] = useState(0);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [destUnitId, setDestUnitId] = useState('');
  const [transferNotes, setTransferNotes] = useState('');
  const [selectedItems, setSelectedItems] = useState<{ productId: string; productName: string; sku: string; quantity: number; available: number }[]>([]);
  const [selectedProductToAdd, setSelectedProductToAdd] = useState('');
  const [addQty, setAddQty] = useState<number>(1);
  const [formError, setFormError] = useState<string | null>(null);

  // Fetch branches
  const { data: units = [] } = useQuery({
    queryKey: ['iam', 'units'],
    queryFn: () => iamApi.units().then((r) => r.data),
  });

  // Fetch transfers
  const { data: transfersResponse, isLoading } = useQuery({
    queryKey: ['inventory', 'transfers', unitId, page],
    queryFn: () => inventoryApi.getTransfers(unitId || undefined, page, 15).then((r) => r.data),
  });

  // Fetch products for picker
  const { data: productsData } = useQuery({
    queryKey: ['inventory', 'products', 'picker'],
    queryFn: () => inventoryApi.getProducts({ size: 100 }).then((r) => r.data),
  });

  // Create Transfer Mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateTransferDto) => inventoryApi.createTransfer(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      setCreateModalOpen(false);
      setSelectedItems([]);
      setDestUnitId('');
      setTransferNotes('');
      setFormError(null);
    },
    onError: (err: any) => {
      setFormError(err.response?.data?.detail || 'Erro ao criar transferência.');
    },
  });

  // Complete Transfer Mutation
  const completeMutation = useMutation({
    mutationFn: (id: string) => inventoryApi.completeTransfer(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
  });

  // Cancel Transfer Mutation
  const cancelMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) => inventoryApi.cancelTransfer(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
  });

  const handleAddItem = () => {
    if (!selectedProductToAdd) return;
    const prod = productsData?.content.find((p) => p.id === selectedProductToAdd);
    if (!prod) return;

    if (selectedItems.some((i) => i.productId === prod.id)) {
      setFormError('Este item já foi adicionado na lista.');
      return;
    }

    setSelectedItems((prev) => [
      ...prev,
      {
        productId: prod.id,
        productName: prod.name,
        sku: prod.skuCode,
        quantity: addQty > 0 ? addQty : 1,
        available: 10,
      },
    ]);
    setSelectedProductToAdd('');
    setAddQty(1);
    setFormError(null);
  };

  const handleRemoveItem = (productId: string) => {
    setSelectedItems((prev) => prev.filter((i) => i.productId !== productId));
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!destUnitId) {
      setFormError('Selecione a filial de destino.');
      return;
    }
    if (selectedItems.length === 0) {
      setFormError('Adicione pelo menos um item à transferência.');
      return;
    }

    createMutation.mutate({
      sourceUnitId: unitId,
      destinationUnitId: destUnitId,
      notes: transferNotes.trim() || undefined,
      items: selectedItems.map((i) => ({
        productId: i.productId,
        quantity: i.quantity,
      })),
    });
  };

  const transfers: StockTransfer[] = transfersResponse?.content || [];
  const totalPages = transfersResponse?.totalPages || 1;
  const totalElements = transfersResponse?.totalElements || 0;

  const getUnitName = (id: string) => units.find((u) => u.id === id)?.name || id.substring(0, 8);

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/60 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-primary/10 text-primary">
              <span className="material-symbols-outlined text-[24px]">swap_horiz</span>
            </span>
            <h1 className="text-2xl font-bold font-headline-md text-on-surface">Transferências entre Filiais</h1>
          </div>
          <p className="text-sm text-on-surface-variant mt-1">
            Movimentação de peças e produtos entre unidades com controle de despacho e recebimento.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            to="/inventory/products"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold border border-outline-variant/80 text-on-surface hover:bg-surface-container-high transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">inventory_2</span>
            Catálogo
          </Link>
          <Link
            to="/inventory/stocks"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold border border-outline-variant/80 text-on-surface hover:bg-surface-container-high transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">warehouse</span>
            Saldos
          </Link>
          <button
            onClick={() => setCreateModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold bg-primary text-on-primary hover:bg-primary-container transition-colors shadow-sm active:scale-95"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Nova Transferência
          </button>
        </div>
      </div>

      {/* Transfers Table Card */}
      <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/60 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-on-surface-variant">
            <span className="material-symbols-outlined animate-spin text-[32px] text-primary">progress_activity</span>
            <p className="text-sm font-medium">Carregando transferências...</p>
          </div>
        ) : transfers.length === 0 ? (
          <div className="py-20 text-center text-on-surface-variant flex flex-col items-center">
            <span className="material-symbols-outlined text-[48px] text-on-surface-variant/40 mb-2">swap_horiz</span>
            <h3 className="text-lg font-semibold text-on-surface">Nenhuma transferência encontrada</h3>
            <p className="text-sm text-on-surface-variant mt-1 max-w-[380px]">
              Inicie uma transferência de peças entre filiais quando houver necessidade de remessa.
            </p>
            <button
              onClick={() => setCreateModalOpen(true)}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold bg-primary text-on-primary hover:bg-primary-container transition-colors shadow-sm"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              Solicitar Transferência
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-outline-variant/40 bg-surface-container-low text-on-surface-variant text-[12px] uppercase font-semibold tracking-wider">
                  <th className="py-3.5 px-5">Transferência</th>
                  <th className="py-3.5 px-4">Origem</th>
                  <th className="py-3.5 px-4">Destino</th>
                  <th className="py-3.5 px-4 text-center">Itens</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4">Data</th>
                  <th className="py-3.5 px-5 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/30 text-sm">
                {transfers.map((t) => {
                  const isSource = t.sourceUnitId === unitId;
                  const isDest = t.destinationUnitId === unitId;

                  return (
                    <tr key={t.id} className="hover:bg-surface-container-low/50 transition-colors">
                      {/* Transfer Number */}
                      <td className="py-3.5 px-5">
                        <div className="font-mono font-bold text-on-surface">{t.transferNumber}</div>
                        {t.notes && <div className="text-xs text-on-surface-variant truncate max-w-[320px]">{t.notes}</div>}
                      </td>

                      {/* Source */}
                      <td className="py-3.5 px-4">
                        <span className="font-medium text-on-surface">{getUnitName(t.sourceUnitId)}</span>
                        {isSource && (
                          <span className="ml-1.5 text-[10px] bg-surface-container px-1.5 py-0.5 rounded font-semibold text-on-surface-variant">
                            Atual
                          </span>
                        )}
                      </td>

                      {/* Destination */}
                      <td className="py-3.5 px-4">
                        <span className="font-medium text-on-surface">{getUnitName(t.destinationUnitId)}</span>
                        {isDest && (
                          <span className="ml-1.5 text-[10px] bg-primary/10 px-1.5 py-0.5 rounded font-semibold text-primary">
                            Destino
                          </span>
                        )}
                      </td>

                      {/* Items Count */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="font-mono font-bold text-xs px-2 py-0.5 rounded-full bg-surface-container text-on-surface">
                          {t.items?.length || 0} itens
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center">
                        {t.status === 'COMPLETED' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-tertiary-container/30 text-tertiary">
                            <span className="w-1.5 h-1.5 rounded-full bg-tertiary" />
                            Concluída
                          </span>
                        ) : t.status === 'PENDING' || t.status === 'IN_TRANSIT' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/20 text-amber-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            Pendente
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-error-container/40 text-error">
                            <span className="w-1.5 h-1.5 rounded-full bg-error" />
                            Cancelada
                          </span>
                        )}
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-4 text-xs text-on-surface-variant font-mono">
                        {new Date(t.createdAt).toLocaleDateString('pt-BR')}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-5 text-right">
                        {t.status === 'PENDING' && (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => completeMutation.mutate(t.id)}
                              disabled={completeMutation.isPending}
                              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-tertiary text-on-tertiary hover:opacity-90 transition-opacity"
                            >
                              Receber / Concluir
                            </button>
                            <button
                              onClick={() => {
                                const reason = prompt('Motivo do cancelamento:');
                                if (reason !== null) cancelMutation.mutate({ id: t.id, reason });
                              }}
                              className="p-1 rounded-lg text-on-surface-variant hover:text-error hover:bg-error-container/30"
                              title="Cancelar Transferência"
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

      {/* Modal: Nova Transferência */}
      <AnimatePresence>
        {createModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-surface-container-lowest w-full max-w-[600px] rounded-2xl border border-outline-variant/60 shadow-2xl overflow-hidden"
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

              <form onSubmit={handleCreateSubmit} className="p-6 space-y-5">
                {formError && (
                  <div className="p-3 rounded-xl bg-error-container/40 text-error text-xs font-semibold flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px]">warning</span>
                    {formError}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase text-on-surface-variant mb-1.5">
                      Filial Origem (Atual)
                    </label>
                    <div className="px-3.5 py-2.5 bg-surface-container-low border border-outline-variant/60 rounded-xl text-sm font-semibold text-on-surface">
                      {getUnitName(unitId)}
                    </div>
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
                      <option value="">Selecione a filial...</option>
                      {units
                        .filter((u) => u.id !== unitId)
                        .map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.name}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>

                {/* Adicionar Itens */}
                <div className="space-y-3 pt-2 border-t border-outline-variant/40">
                  <span className="text-xs font-semibold uppercase text-on-surface-variant">Itens da Remessa</span>

                  <div className="flex items-center gap-2">
                    <select
                      value={selectedProductToAdd}
                      onChange={(e) => setSelectedProductToAdd(e.target.value)}
                      className="flex-1 px-3 py-2 bg-surface-container-low border border-outline-variant/60 rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    >
                      <option value="">Selecionar peça do catálogo...</option>
                      {productsData?.content.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.skuCode})
                        </option>
                      ))}
                    </select>

                    <input
                      type="number"
                      min="1"
                      placeholder="Qtd"
                      value={addQty}
                      onChange={(e) => setAddQty(parseInt(e.target.value, 10) || 1)}
                      className="w-20 px-3 py-2 bg-surface-container-low border border-outline-variant/60 rounded-xl text-sm font-mono text-on-surface text-center focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />

                    <button
                      type="button"
                      onClick={handleAddItem}
                      className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-surface-container hover:bg-primary/10 hover:text-primary border border-outline-variant/60 transition-colors"
                    >
                      Adicionar
                    </button>
                  </div>

                  {/* Lista de itens selecionados */}
                  {selectedItems.length > 0 ? (
                    <div className="divide-y divide-outline-variant/30 border border-outline-variant/40 rounded-xl overflow-hidden bg-surface-container-low/50">
                      {selectedItems.map((item) => (
                        <div key={item.productId} className="p-3 flex items-center justify-between text-xs">
                          <div>
                            <div className="font-semibold text-on-surface">{item.productName}</div>
                            <div className="font-mono text-on-surface-variant text-[11px]">{item.sku}</div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-mono font-bold text-on-surface">{item.quantity} un</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(item.productId)}
                              className="text-on-surface-variant hover:text-error"
                            >
                              <span className="material-symbols-outlined text-[16px]">close</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-on-surface-variant text-center py-4 bg-surface-container-low rounded-xl">
                      Nenhum item adicionado à remessa.
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-on-surface-variant mb-1.5">
                    Observações
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Ex: Remessa para atendimento emergencial..."
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
                    Solicitar Remessa
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
