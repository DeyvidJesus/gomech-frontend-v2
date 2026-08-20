import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { operationsApi } from '../api/operationsApi';
import type { QuoteStatus } from '../types';
import { useAuthStore } from '@/features/iam/stores/authStore';
import { formatLicensePlate } from '@/features/crm/utils/validators';

export function QuoteList() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const activeUnitId = user?.activeUnitId;

  const [statusFilter, setStatusFilter] = useState<QuoteStatus | ''>('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const pageSize = 20;

  // Fetch Quotes
  const { data, isLoading, isError, error } = useQuery({
    queryKey: [
      'operations',
      'quotes',
      { status: statusFilter || undefined, unitId: activeUnitId, page, size: pageSize },
    ],
    queryFn: () =>
      operationsApi.getQuotes({
        status: statusFilter || undefined,
        unitId: activeUnitId,
        page,
        size: pageSize,
      }),
  });

  // Cancel Quote Mutation
  const cancelMutation = useMutation({
    mutationFn: (id: string) => operationsApi.cancelQuote(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operations', 'quotes'] });
    },
  });

  const handleCancel = (id: string) => {
    if (window.confirm('Deseja realmente cancelar este orçamento?')) {
      cancelMutation.mutate(id);
    }
  };

  const getStatusBadge = (status: QuoteStatus) => {
    switch (status) {
      case 'DRAFT':
        return {
          label: 'Rascunho',
          bg: 'bg-surface-variant text-on-surface-variant border border-outline-variant',
          dot: 'bg-on-surface-variant',
        };
      case 'PENDING_INTERNAL_APPROVAL':
        return {
          label: 'Pendente Gerência',
          bg: 'bg-primary-container/20 text-primary-container border border-primary-container/30',
          dot: 'bg-primary-container',
        };
      case 'INTERNAL_APPROVED':
        return {
          label: 'Aprovado Interno',
          bg: 'bg-secondary-container text-on-secondary-container border border-secondary-container',
          dot: 'bg-secondary',
        };
      case 'SENT_TO_CUSTOMER':
        return {
          label: 'Enviado ao Cliente',
          bg: 'bg-secondary-container/30 text-secondary border border-secondary/40',
          dot: 'bg-secondary',
        };
      case 'CUSTOMER_APPROVED':
        return {
          label: 'Aprovado Cliente',
          bg: 'bg-tertiary-container/20 text-tertiary border border-tertiary-container/40',
          dot: 'bg-tertiary',
        };
      case 'CUSTOMER_REJECTED':
        return {
          label: 'Recusado Cliente',
          bg: 'bg-error-container/20 text-error border border-error-container',
          dot: 'bg-error',
        };
      case 'REVISION':
        return {
          label: 'Em Revisão',
          bg: 'bg-primary-fixed text-on-primary-fixed border border-outline-variant',
          dot: 'bg-primary',
        };
      case 'EXPIRED':
        return {
          label: 'Expirado',
          bg: 'bg-surface-variant text-on-surface-variant border border-outline-variant opacity-70',
          dot: 'bg-outline',
        };
      case 'CANCELED':
        return {
          label: 'Cancelado',
          bg: 'bg-error-container text-on-error-container border border-error/20',
          dot: 'bg-error',
        };
      default:
        return {
          label: status,
          bg: 'bg-surface-container text-on-surface-variant',
          dot: 'bg-outline',
        };
    }
  };

  const filteredQuotes = (data?.content || []).filter((q) => {
    if (!search.trim()) return true;
    const query = search.toLowerCase();
    const matchName = q.customerName.toLowerCase().includes(query);
    const matchPlate = q.licensePlate.toLowerCase().includes(query);
    const matchVehicle = `${q.vehicleBrand || ''} ${q.vehicleModel || ''}`
      .toLowerCase()
      .includes(query);
    return matchName || matchPlate || matchVehicle;
  });

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-200">
      {/* Page Header */}
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-headline-lg text-headline-lg font-bold text-on-surface">
            Orçamentos & Estimativas
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-0.5">
            Gestão de orçamentos, cálculo de peças e mão de obra e fluxo de dupla aprovação.
          </p>
        </div>

        <button
          onClick={() => navigate({ to: '/operations/quotes/new' })}
          className="px-4 py-2 bg-primary text-on-primary rounded-lg font-label-md text-label-md font-bold hover:bg-primary-container transition-all shadow-sm flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          Novo Orçamento
        </button>
      </header>

      {/* Filter Tabs & Search */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-3 shadow-xs space-y-3">
        {/* Status Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {[
            { key: '', label: 'Todos' },
            { key: 'DRAFT', label: 'Rascunho' },
            { key: 'PENDING_INTERNAL_APPROVAL', label: 'Pendente Gerência' },
            { key: 'INTERNAL_APPROVED', label: 'Aprovado Interno' },
            { key: 'SENT_TO_CUSTOMER', label: 'Enviado' },
            { key: 'CUSTOMER_APPROVED', label: 'Aprovado Cliente' },
            { key: 'CUSTOMER_REJECTED', label: 'Recusado' },
          ].map((tab) => {
            const isSelected = statusFilter === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setStatusFilter(tab.key as QuoteStatus | '')}
                className={`px-3 py-1.5 rounded-lg text-label-sm font-label-sm whitespace-nowrap transition-colors ${
                  isSelected
                    ? 'bg-primary text-on-primary font-bold shadow-xs'
                    : 'bg-surface border border-outline-variant text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-80">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">
            search
          </span>
          <input
            type="text"
            placeholder="Buscar por cliente, placa ou modelo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-surface border border-outline-variant rounded-lg text-body-sm font-body-sm text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none"
          />
        </div>
      </div>

      {/* Quotes Table */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-surface border-b border-outline-variant font-label-sm text-label-sm text-on-surface-variant uppercase font-semibold">
                <th className="py-3 px-4 w-28">Orçamento</th>
                <th className="py-3 px-4">Cliente</th>
                <th className="py-3 px-4">Veículo & Placa</th>
                <th className="py-3 px-4">Peças / Serviços</th>
                <th className="py-3 px-4 text-right">Valor Total</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant text-body-sm">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-on-surface-variant">
                    <span className="material-symbols-outlined animate-spin text-[28px] text-primary">
                      progress_activity
                    </span>
                    <p className="mt-2 font-medium">Carregando orçamentos...</p>
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-error">
                    Erro ao carregar orçamentos: {(error as Error)?.message || 'Erro desconhecido'}
                  </td>
                </tr>
              ) : filteredQuotes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-on-surface-variant">
                    <span className="material-symbols-outlined text-[40px] text-outline">
                      request_quote
                    </span>
                    <p className="font-semibold text-on-surface text-body-lg mt-1">
                      Nenhum orçamento encontrado
                    </p>
                    <p className="text-body-sm text-on-surface-variant mt-0.5">
                      Crie um novo orçamento avulso ou gere a partir de uma vistoria técnica.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredQuotes.map((q) => {
                  const badge = getStatusBadge(q.status);
                  const formattedTotal = (q.totalAmount ?? 0).toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  });

                  return (
                    <tr
                      key={q.id}
                      onClick={() =>
                        navigate({
                          to: '/operations/quotes/$id',
                          params: { id: q.id },
                        })
                      }
                      className="hover:bg-surface-bright transition-colors cursor-pointer group"
                    >
                      {/* Quote ID */}
                      <td className="py-3.5 px-4 font-mono font-bold text-primary">
                        #{q.id.slice(0, 8).toUpperCase()}
                      </td>

                      {/* Customer */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-on-surface">{q.customerName}</div>
                        <div className="text-[11px] text-on-surface-variant">
                          Criado em: {new Date(q.createdAt).toLocaleDateString('pt-BR')}
                        </div>
                      </td>

                      {/* Vehicle */}
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-on-surface">
                          {q.vehicleBrand} {q.vehicleModel}
                        </div>
                        <span className="inline-block px-1.5 py-0.2 bg-surface-container rounded border border-outline-variant font-mono font-bold text-[11px] text-primary mt-0.5">
                          {formatLicensePlate(q.licensePlate)}
                        </span>
                      </td>

                      {/* Parts / Labor summary */}
                      <td className="py-3.5 px-4 text-[12px] text-on-surface-variant">
                        <div>{q.itemCount} itens</div>
                        <div className="text-[11px] opacity-80">
                          Peças: {(q.totalPartsAmount || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} • M.O.: {(q.totalLaborAmount || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </div>
                      </td>

                      {/* Total */}
                      <td className="py-3.5 px-4 text-right font-bold text-body-md text-on-surface">
                        {formattedTotal}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${badge.bg}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`}></span>
                          {badge.label}
                        </span>
                      </td>

                      {/* Actions */}
                      <td
                        className="py-3.5 px-4 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() =>
                              navigate({
                                to: '/operations/quotes/$id',
                                params: { id: q.id },
                              })
                            }
                            className="px-2.5 py-1 bg-surface border border-outline-variant text-primary hover:bg-surface-container rounded-lg font-label-sm text-label-sm font-semibold transition-colors"
                          >
                            Abrir
                          </button>

                          {q.status !== 'CANCELED' && q.status !== 'CUSTOMER_APPROVED' && (
                            <button
                              type="button"
                              onClick={() => handleCancel(q.id)}
                              className="p-1 text-on-surface-variant hover:text-error rounded hover:bg-error-container/20 transition-colors"
                              title="Cancelar Orçamento"
                            >
                              <span className="material-symbols-outlined text-[18px]">delete</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer / Pagination */}
        {data && (
          <div className="p-3 border-t border-outline-variant bg-surface-container-lowest flex items-center justify-between text-body-sm text-on-surface-variant">
            <span>
              Mostrando {filteredQuotes.length} de {data.totalElements} orçamentos
            </span>

            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={page === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                className="p-1 rounded hover:bg-surface-container disabled:opacity-40"
              >
                <span className="material-symbols-outlined text-[18px]">chevron_left</span>
              </button>
              <span className="px-2 font-semibold text-on-surface">
                {page + 1} / {data.totalPages || 1}
              </span>
              <button
                type="button"
                disabled={page >= (data.totalPages - 1)}
                onClick={() => setPage((p) => p + 1)}
                className="p-1 rounded hover:bg-surface-container disabled:opacity-40"
              >
                <span className="material-symbols-outlined text-[18px]">chevron_right</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
