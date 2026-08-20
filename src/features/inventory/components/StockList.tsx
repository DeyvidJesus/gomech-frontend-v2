import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { motion, AnimatePresence } from 'framer-motion';
import { inventoryApi } from '../api/inventoryApi';
import type { UnitStock, MovementReason } from '../types';
import { useAuthStore } from '@/features/iam/stores/authStore';

export function StockList() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const unitId = user?.activeUnitId || '';

  const [search, setSearch] = useState('');
  const [adjustModalItem, setAdjustModalItem] = useState<UnitStock | null>(null);
  const [newQuantity, setNewQuantity] = useState<number | ''>('');
  const [adjustReason, setAdjustReason] = useState<MovementReason>('ADJUSTMENT_INCREASE');
  const [adjustNotes, setAdjustNotes] = useState('');
  const [adjustError, setAdjustError] = useState<string | null>(null);

  // Fetch unit stocks
  const { data: stocks = [], isLoading: isLoadingStocks } = useQuery({
    queryKey: ['inventory', 'stocks', unitId],
    queryFn: () => inventoryApi.getStocks(unitId).then((r) => r.data),
    enabled: Boolean(unitId),
  });

  // Fetch low stock alerts
  const { data: lowStockAlerts = [] } = useQuery({
    queryKey: ['inventory', 'low-stock', unitId],
    queryFn: () => inventoryApi.getLowStockAlerts(unitId).then((r) => r.data),
    enabled: Boolean(unitId),
  });

  // Adjust stock mutation
  const adjustMutation = useMutation({
    mutationFn: (data: {
      unitId: string;
      productId: string;
      newQuantityOnHand: number;
      reason: MovementReason;
      notes?: string;
    }) => inventoryApi.adjustStock(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      setAdjustModalItem(null);
      setNewQuantity('');
      setAdjustNotes('');
      setAdjustError(null);
    },
    onError: (err: any) => {
      setAdjustError(err.response?.data?.detail || 'Erro ao ajustar estoque.');
    },
  });

  const handleOpenAdjust = (stock: UnitStock) => {
    setAdjustModalItem(stock);
    setNewQuantity(stock.quantityOnHand);
    setAdjustReason('ADJUSTMENT_INCREASE');
    setAdjustNotes('');
    setAdjustError(null);
  };

  const handleSaveAdjust = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustModalItem || newQuantity === '') return;

    adjustMutation.mutate({
      unitId,
      productId: adjustModalItem.productId,
      newQuantityOnHand: Number(newQuantity),
      reason: adjustReason,
      notes: adjustNotes.trim() || undefined,
    });
  };

  const filteredStocks = stocks.filter(
    (s) =>
      s.productName.toLowerCase().includes(search.toLowerCase()) ||
      s.productSku.toLowerCase().includes(search.toLowerCase())
  );

  const totalOnHand = stocks.reduce((acc, s) => acc + (Number(s.quantityOnHand) || 0), 0);
  const totalReserved = stocks.reduce((acc, s) => acc + (Number(s.quantityReserved) || 0), 0);
  const totalAvailable = stocks.reduce((acc, s) => acc + (Number(s.availableStock) || 0), 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/60 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-primary/10 text-primary">
              <span className="material-symbols-outlined text-[24px]">warehouse</span>
            </span>
            <h1 className="text-2xl font-bold font-headline-md text-on-surface">Saldos & Alertas por Filial</h1>
          </div>
          <p className="text-sm text-on-surface-variant mt-1">
            Controle de estoque físico, reservas ativas para OS e alertas de reposição
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/inventory/products"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold border border-outline-variant/80 text-on-surface hover:bg-surface-container-high transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">inventory_2</span>
            Catálogo de Produtos
          </Link>
          <Link
            to="/inventory/transfers"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold border border-outline-variant/80 text-on-surface hover:bg-surface-container-high transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">swap_horiz</span>
            Transferências
          </Link>
          <Link
            to="/inventory/movements"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold border border-outline-variant/80 text-on-surface hover:bg-surface-container-high transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">history</span>
            Livro-Razão
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/60 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary-container/20 text-primary flex items-center justify-center">
            <span className="material-symbols-outlined text-[26px]">inventory</span>
          </div>
          <div>
            <span className="text-xs font-semibold uppercase text-on-surface-variant">Estoque Físico Total</span>
            <div className="text-2xl font-bold font-mono text-on-surface mt-0.5">{totalOnHand} un</div>
          </div>
        </div>

        <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/60 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-600 flex items-center justify-center">
            <span className="material-symbols-outlined text-[26px]">lock_clock</span>
          </div>
          <div>
            <span className="text-xs font-semibold uppercase text-on-surface-variant">Reservado para OS</span>
            <div className="text-2xl font-bold font-mono text-amber-600 mt-0.5">{totalReserved} un</div>
          </div>
        </div>

        <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/60 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-tertiary-container/30 text-tertiary flex items-center justify-center">
            <span className="material-symbols-outlined text-[26px]">check_circle</span>
          </div>
          <div>
            <span className="text-xs font-semibold uppercase text-on-surface-variant">Disponível para Venda</span>
            <div className="text-2xl font-bold font-mono text-tertiary mt-0.5">{totalAvailable} un</div>
          </div>
        </div>

        <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/60 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-error-container/40 text-error flex items-center justify-center">
            <span className="material-symbols-outlined text-[26px]">notification_important</span>
          </div>
          <div>
            <span className="text-xs font-semibold uppercase text-on-surface-variant">Alertas de Reposição</span>
            <div className="text-2xl font-bold font-mono text-error mt-0.5">{lowStockAlerts.length} itens</div>
          </div>
        </div>
      </div>

      {/* Low Stock Banner if any */}
      {lowStockAlerts.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold text-sm">
            <span className="material-symbols-outlined text-[20px]">warning</span>
            <span>Itens em Ponto de Pedido ({lowStockAlerts.length} produtos abaixo do mínimo)</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {lowStockAlerts.map((alert) => (
              <div
                key={alert.productId}
                className="bg-white dark:bg-surface-container-low p-3.5 rounded-xl border border-amber-200/60 shadow-xs flex items-center justify-between"
              >
                <div>
                  <div className="font-semibold text-xs text-on-surface">{alert.productName}</div>
                  <div className="text-[11px] text-on-surface-variant font-mono">{alert.skuCode}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold text-error font-mono">
                    {alert.currentQuantityOnHand} / mín {alert.minStockThreshold}
                  </div>
                  <span className="text-[10px] font-semibold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                    Déficit: -{alert.deficit}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search & Stock Table */}
      <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/60 shadow-sm overflow-hidden space-y-4 p-5">
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant material-symbols-outlined text-[20px]">
              search
            </span>
            <input
              type="text"
              placeholder="Filtrar por nome ou SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-surface-container-low border border-outline-variant/60 rounded-xl text-sm text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
        </div>

        {isLoadingStocks ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-on-surface-variant">
            <span className="material-symbols-outlined animate-spin text-[32px] text-primary">progress_activity</span>
            <p className="text-sm font-medium">Carregando saldos da filial...</p>
          </div>
        ) : filteredStocks.length === 0 ? (
          <div className="py-16 text-center text-on-surface-variant">
            <span className="material-symbols-outlined text-[40px] text-on-surface-variant/40 mb-2">warehouse</span>
            <p className="text-sm font-medium">Nenhum registro de saldo encontrado para esta filial.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-outline-variant/40 bg-surface-container-low text-on-surface-variant text-[12px] uppercase font-semibold tracking-wider">
                  <th className="py-3 px-4">Produto / SKU</th>
                  <th className="py-3 px-4 text-center">Físico (On-Hand)</th>
                  <th className="py-3 px-4 text-center">Reservado</th>
                  <th className="py-3 px-4 text-center">Disponível</th>
                  <th className="py-3 px-4 text-center">Mínimo</th>
                  <th className="py-3 px-4">Localização</th>
                  <th className="py-3 px-4 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/30 text-sm">
                {filteredStocks.map((s) => {
                  const isLow = s.availableStock <= s.minStock;

                  return (
                    <tr key={s.id} className="hover:bg-surface-container-low/50 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-on-surface">{s.productName}</div>
                        <div className="font-mono text-xs text-on-surface-variant">{s.productSku}</div>
                      </td>

                      {/* On-Hand */}
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-on-surface">
                        {s.quantityOnHand}
                      </td>

                      {/* Reserved */}
                      <td className="py-3.5 px-4 text-center">
                        {s.quantityReserved > 0 ? (
                          <span className="inline-flex items-center gap-1 font-mono font-bold text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded-full text-xs">
                            {s.quantityReserved}
                          </span>
                        ) : (
                          <span className="font-mono text-on-surface-variant text-xs">0</span>
                        )}
                      </td>

                      {/* Available */}
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`font-mono font-bold px-2.5 py-0.5 rounded-full text-xs ${
                            isLow
                              ? 'bg-error-container/40 text-error'
                              : 'bg-tertiary-container/30 text-tertiary'
                          }`}
                        >
                          {s.availableStock}
                        </span>
                      </td>

                      {/* Min Stock */}
                      <td className="py-3.5 px-4 text-center font-mono text-xs text-on-surface-variant">
                        {s.minStock}
                      </td>

                      {/* Shelf Location */}
                      <td className="py-3.5 px-4 text-xs text-on-surface-variant">
                        {s.shelfLocation || 'Não def.'}
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleOpenAdjust(s)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-surface-container hover:bg-primary/10 hover:text-primary transition-colors border border-outline-variant/60"
                        >
                          <span className="material-symbols-outlined text-[16px]">tune</span>
                          Ajustar
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Ajuste de Estoque */}
      <AnimatePresence>
        {adjustModalItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-surface-container-lowest w-full max-w-md rounded-2xl border border-outline-variant/60 shadow-xl overflow-hidden"
            >
              <div className="p-5 border-b border-outline-variant/40 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[20px]">tune</span>
                  <h3 className="text-base font-bold text-on-surface">Ajuste de Inventário</h3>
                </div>
                <button
                  onClick={() => setAdjustModalItem(null)}
                  className="p-1 rounded-lg text-on-surface-variant hover:bg-surface-container"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>

              <form onSubmit={handleSaveAdjust} className="p-5 space-y-4">
                <div className="bg-surface-container-low p-3.5 rounded-xl border border-outline-variant/40">
                  <div className="font-semibold text-sm text-on-surface">{adjustModalItem.productName}</div>
                  <div className="text-xs text-on-surface-variant font-mono mt-0.5">
                    SKU: {adjustModalItem.productSku} | Saldo Físico Atual: <strong>{adjustModalItem.quantityOnHand} un</strong>
                  </div>
                </div>

                {adjustError && (
                  <div className="p-3 rounded-xl bg-error-container/40 text-error text-xs font-semibold flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px]">warning</span>
                    {adjustError}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold uppercase text-on-surface-variant mb-1.5">
                    Nova Quantidade Física (On-Hand) *
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    required
                    value={newQuantity}
                    onChange={(e) => setNewQuantity(e.target.value === '' ? '' : parseFloat(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline-variant/60 rounded-xl text-sm font-mono font-bold text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-on-surface-variant mb-1.5">
                    Motivo do Ajuste *
                  </label>
                  <select
                    value={adjustReason}
                    onChange={(e) => setAdjustReason(e.target.value as MovementReason)}
                    className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline-variant/60 rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  >
                    <option value="ADJUSTMENT_INCREASE">Ajuste / Sobra de Inventário (Entrada)</option>
                    <option value="ADJUSTMENT_DECREASE">Ajuste / Perda / Avaria (Saída)</option>
                    <option value="PURCHASE_ENTRY">Entrada por Compra</option>
                    <option value="RETURN_ENTRY">Retorno de Peça</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-on-surface-variant mb-1.5">
                    Observações / Justificativa
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Ex: Contagem física do balanço mensal..."
                    value={adjustNotes}
                    onChange={(e) => setAdjustNotes(e.target.value)}
                    className="w-full px-3.5 py-2 bg-surface-container-low border border-outline-variant/60 rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-outline-variant/40">
                  <button
                    type="button"
                    onClick={() => setAdjustModalItem(null)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold border border-outline-variant/60 text-on-surface hover:bg-surface-container transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={adjustMutation.isPending}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-primary text-on-primary hover:bg-primary-container disabled:opacity-50 transition-colors shadow-sm flex items-center gap-1.5"
                  >
                    {adjustMutation.isPending && (
                      <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>
                    )}
                    Salvar Ajuste
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
