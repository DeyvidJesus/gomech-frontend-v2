import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import { inventoryApi } from '../api/inventoryApi';
import type { InventoryMovement, MovementType, MovementReason } from '../types';
import { useAuthStore } from '@/features/iam/stores/authStore';

export function InventoryMovementList() {
  const { user } = useAuthStore();
  const unitId = user?.activeUnitId || '';

  const [page, setPage] = useState(0);
  const [selectedType, setSelectedType] = useState<MovementType | ''>('');
  const [selectedReason, setSelectedReason] = useState<MovementReason | ''>('');

  // Fetch movements
  const { data: movementsResponse, isLoading } = useQuery({
    queryKey: ['inventory', 'movements', unitId, selectedType, selectedReason, page],
    queryFn: () =>
      inventoryApi
        .getMovements({
          unitId: unitId || undefined,
          type: selectedType || undefined,
          reason: selectedReason || undefined,
          page,
          size: 20,
        })
        .then((r) => r.data),
  });

  const movements: InventoryMovement[] = movementsResponse?.content || [];
  const totalPages = movementsResponse?.totalPages || 1;
  const totalElements = movementsResponse?.totalElements || 0;

  const getReasonLabel = (reason: MovementReason) => {
    switch (reason) {
      case 'PURCHASE_ENTRY':
        return 'Entrada por Compra';
      case 'WORK_ORDER_CONSUMPTION':
        return 'Consumo em O.S.';
      case 'TRANSFER_IN':
        return 'Entrada por Transferência';
      case 'TRANSFER_OUT':
        return 'Saída por Transferência';
      case 'ADJUSTMENT_INCREASE':
        return 'Ajuste de Sobra';
      case 'ADJUSTMENT_DECREASE':
        return 'Ajuste de Perda/Avaria';
      case 'INITIAL_BALANCE':
        return 'Saldo Inicial';
      case 'RETURN_ENTRY':
        return 'Retorno / Devolução';
      default:
        return reason;
    }
  };

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/60 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-primary/10 text-primary">
              <span className="material-symbols-outlined text-[24px]">history</span>
            </span>
            <h1 className="text-2xl font-bold font-headline-md text-on-surface">Livro-Razão de Movimentações</h1>
          </div>
          <p className="text-sm text-on-surface-variant mt-1">
            Registro imutável e auditável de todas as transações, consumos e ajustes contábeis de estoque
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
          <Link
            to="/inventory/transfers"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold border border-outline-variant/80 text-on-surface hover:bg-surface-container-high transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">swap_horiz</span>
            Transferências
          </Link>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/60 shadow-sm flex flex-wrap items-center gap-3">
        <select
          value={selectedType}
          onChange={(e) => {
            setSelectedType(e.target.value as MovementType | '');
            setPage(0);
          }}
          aria-label="Filtrar por Tipo de Movimentação"
          className="px-3.5 py-2.5 bg-surface-container-low border border-outline-variant/60 rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
        >
          <option value="">Todos os Tipos (Entrada/Saída)</option>
          <option value="IN">Entradas (IN)</option>
          <option value="OUT">Saídas (OUT)</option>
        </select>

        <select
          value={selectedReason}
          onChange={(e) => {
            setSelectedReason(e.target.value as MovementReason | '');
            setPage(0);
          }}
          aria-label="Filtrar por Motivo"
          className="px-3.5 py-2.5 bg-surface-container-low border border-outline-variant/60 rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
        >
          <option value="">Todos os Motivos</option>
          <option value="WORK_ORDER_CONSUMPTION">Consumo em O.S.</option>
          <option value="PURCHASE_ENTRY">Entrada por Compra</option>
          <option value="TRANSFER_OUT">Transferência (Saída)</option>
          <option value="TRANSFER_IN">Transferência (Entrada)</option>
          <option value="ADJUSTMENT_INCREASE">Ajuste de Sobra</option>
          <option value="ADJUSTMENT_DECREASE">Ajuste de Perda/Avaria</option>
          <option value="INITIAL_BALANCE">Saldo Inicial</option>
        </select>
      </div>

      {/* Movements Table Card */}
      <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/60 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-on-surface-variant">
            <span className="material-symbols-outlined animate-spin text-[32px] text-primary">progress_activity</span>
            <p className="text-sm font-medium">Carregando livro-razão...</p>
          </div>
        ) : movements.length === 0 ? (
          <div className="py-20 text-center text-on-surface-variant flex flex-col items-center">
            <span className="material-symbols-outlined text-[48px] text-on-surface-variant/40 mb-2">history</span>
            <h3 className="text-lg font-semibold text-on-surface">Nenhuma movimentação registrada</h3>
            <p className="text-sm text-on-surface-variant mt-1 max-w-[420px]">
              As transações contábeis de estoque aparecerão aqui automaticamente conforme peças forem consumidas ou transferidas.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-outline-variant/40 bg-surface-container-low text-on-surface-variant text-[12px] uppercase font-semibold tracking-wider">
                  <th className="py-3.5 px-5">Data / Hora</th>
                  <th className="py-3.5 px-4">Tipo</th>
                  <th className="py-3.5 px-4">Motivo</th>
                  <th className="py-3.5 px-4">Produto & SKU</th>
                  <th className="py-3.5 px-4 text-center">Quantidade</th>
                  <th className="py-3.5 px-4 text-right">Custo Total</th>
                  <th className="py-3.5 px-5">Identificador / Chave</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/30 text-sm">
                {movements.map((m) => {
                  const isIncoming = m.type === 'IN';

                  return (
                    <motion.tr
                      key={m.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="hover:bg-surface-container-low/50 transition-colors"
                    >
                      {/* Timestamp */}
                      <td className="py-3.5 px-5 font-mono text-xs text-on-surface-variant">
                        <div>{new Date(m.createdAt).toLocaleDateString('pt-BR')}</div>
                        <div className="text-[11px] text-on-surface-variant/70">
                          {new Date(m.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>

                      {/* Type Badge */}
                      <td className="py-3.5 px-4">
                        {isIncoming ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-tertiary-container/30 text-tertiary">
                            <span className="material-symbols-outlined text-[14px]">arrow_downward</span>
                            Entrada
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-error-container/40 text-error">
                            <span className="material-symbols-outlined text-[14px]">arrow_upward</span>
                            Saída
                          </span>
                        )}
                      </td>

                      {/* Reason */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-on-surface text-xs">{getReasonLabel(m.reason)}</div>
                        {m.notes && (
                          <div className="text-[11px] text-on-surface-variant truncate max-w-[320px]">{m.notes}</div>
                        )}
                      </td>

                      {/* Product */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-on-surface">{m.productName}</div>
                        <div className="font-mono text-xs text-on-surface-variant">{m.productSku}</div>
                      </td>

                      {/* Quantity */}
                      <td className="py-3.5 px-4 text-center font-mono font-bold">
                        <span className={isIncoming ? 'text-tertiary' : 'text-error'}>
                          {isIncoming ? `+${m.quantity}` : `-${m.quantity}`} un
                        </span>
                      </td>

                      {/* Cost Total */}
                      <td className="py-3.5 px-4 text-right font-mono text-xs font-semibold text-on-surface">
                        R$ {Number(m.totalCostPrice || 0).toFixed(2)}
                      </td>

                      {/* Key & Reference */}
                      <td className="py-3.5 px-5">
                        {m.idempotencyKey ? (
                          <div className="font-mono text-[10px] bg-surface-container px-2 py-0.5 rounded text-on-surface-variant max-w-[200px] truncate" title={m.idempotencyKey}>
                            {m.idempotencyKey}
                          </div>
                        ) : m.referenceId ? (
                          <div className="font-mono text-[10px] text-on-surface-variant truncate max-w-[140px]">
                            Ref: {m.referenceId.substring(0, 8)}...
                          </div>
                        ) : (
                          <span className="text-xs text-on-surface-variant/60">-</span>
                        )}
                      </td>
                    </motion.tr>
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
              Total de <strong className="text-on-surface">{totalElements}</strong> lançamentos contábeis
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
    </div>
  );
}
