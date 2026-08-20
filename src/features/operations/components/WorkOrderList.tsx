import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { operationsApi } from '../api/operationsApi';
import type { WorkOrderStatus } from '../types';
import { useAuthStore } from '@/features/iam/stores/authStore';
import { formatLicensePlate } from '@/features/crm/utils/validators';

export function WorkOrderList() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const activeUnitId = user?.activeUnitId;

  const [statusFilter, setStatusFilter] = useState<WorkOrderStatus | ''>('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const pageSize = 20;

  // Fetch Work Orders
  const { data, isLoading, isError, error } = useQuery({
    queryKey: [
      'operations',
      'work-orders',
      { status: statusFilter || undefined, unitId: activeUnitId, page, size: pageSize },
    ],
    queryFn: () =>
      operationsApi.getWorkOrders({
        status: statusFilter || undefined,
        unitId: activeUnitId,
        page,
        size: pageSize,
      }),
  });

  // Cancel Mutation
  const cancelMutation = useMutation({
    mutationFn: (id: string) => operationsApi.cancelWorkOrder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operations', 'work-orders'] });
    },
  });

  const handleCancel = (id: string) => {
    if (window.confirm('Deseja realmente cancelar esta Ordem de Serviço?')) {
      cancelMutation.mutate(id);
    }
  };

  const getStatusBadge = (status: WorkOrderStatus) => {
    switch (status) {
      case 'OPEN':
        return {
          label: 'Aberta / Aguardando',
          bg: 'bg-secondary-container/50 text-secondary border border-secondary/30',
          dot: 'bg-secondary',
        };
      case 'IN_PROGRESS':
        return {
          label: 'Em Execução',
          bg: 'bg-primary-fixed text-on-primary-fixed-variant border border-primary-fixed-dim animate-pulse',
          dot: 'bg-primary',
        };
      case 'WAITING_PARTS':
        return {
          label: 'Aguardando Peças',
          bg: 'bg-error-container/30 text-error border border-error-container',
          dot: 'bg-error',
        };
      case 'WAITING_CUSTOMER':
        return {
          label: 'Aguardando Cliente',
          bg: 'bg-surface-variant text-on-surface-variant border border-outline-variant',
          dot: 'bg-outline',
        };
      case 'COMPLETED':
        return {
          label: 'Finalizada',
          bg: 'bg-tertiary-fixed text-on-tertiary-fixed border border-[#4ae176]',
          dot: 'bg-tertiary',
        };
      case 'CANCELED':
        return {
          label: 'Cancelada',
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

  const filteredOrders = (data?.content || []).filter((wo) => {
    if (!search.trim()) return true;
    const query = search.toLowerCase();
    const matchOrder = (wo.orderNumber || wo.id).toLowerCase().includes(query);
    const matchName = wo.customerName.toLowerCase().includes(query);
    const matchPlate = wo.licensePlate.toLowerCase().includes(query);
    const matchVehicle = `${wo.vehicleBrand || ''} ${wo.vehicleModel || ''}`
      .toLowerCase()
      .includes(query);
    const matchTech = (wo.mechanicName || '').toLowerCase().includes(query);
    return matchOrder || matchName || matchPlate || matchVehicle || matchTech;
  });

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-200">
      {/* Page Header */}
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-headline-lg text-headline-lg font-bold text-on-surface">
            Ordens de Serviço
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-0.5">
            Acompanhe o ciclo de reparos, checklist técnico e alocação de mecânicos na oficina.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* View Mode Toggle: List vs Kanban */}
          <div className="flex bg-surface-container-lowest border border-outline-variant rounded-lg p-0.5 shadow-xs">
            <button
              type="button"
              className="px-3 py-1.5 bg-primary-fixed text-primary rounded-md font-label-sm text-label-sm font-bold flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">view_list</span>
              Lista
            </button>
            <button
              type="button"
              onClick={() => navigate({ to: '/operations/work-orders/kanban' })}
              className="px-3 py-1.5 text-on-surface-variant hover:text-on-surface rounded-md font-label-sm text-label-sm font-medium flex items-center gap-1.5 transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">view_kanban</span>
              Kanban
            </button>
          </div>

          <button
            onClick={() => navigate({ to: '/operations/quotes' })}
            className="px-4 py-2 bg-primary text-on-primary rounded-lg font-label-md text-label-md font-bold hover:bg-primary-container transition-all shadow-sm flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Gerar OS de Orçamento
          </button>
        </div>
      </header>

      {/* Filter Tabs & Search */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-3 shadow-xs space-y-3">
        {/* Status Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {[
            { key: '', label: 'Todas' },
            { key: 'OPEN', label: 'Abertas' },
            { key: 'IN_PROGRESS', label: 'Em Execução' },
            { key: 'WAITING_PARTS', label: 'Aguardando Peças' },
            { key: 'WAITING_CUSTOMER', label: 'Aguardando Cliente' },
            { key: 'COMPLETED', label: 'Finalizadas' },
          ].map((tab) => {
            const isSelected = statusFilter === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setStatusFilter(tab.key as WorkOrderStatus | '')}
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
            placeholder="Buscar por OS, cliente, placa ou técnico..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-surface border border-outline-variant rounded-lg text-body-sm font-body-sm text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none"
          />
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-surface border-b border-outline-variant font-label-sm text-label-sm text-on-surface-variant uppercase font-semibold">
                <th className="py-3 px-4 w-28">Ordem de Serviço</th>
                <th className="py-3 px-4">Cliente</th>
                <th className="py-3 px-4">Veículo & Placa</th>
                <th className="py-3 px-4">Técnico / Box</th>
                <th className="py-3 px-4 text-center">Progresso</th>
                <th className="py-3 px-4 text-right">Valor Total</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant text-body-sm">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-on-surface-variant">
                    <span className="material-symbols-outlined animate-spin text-[28px] text-primary">
                      progress_activity
                    </span>
                    <p className="mt-2 font-medium">Carregando ordens de serviço...</p>
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-error">
                    Erro ao carregar ordens de serviço: {(error as Error)?.message || 'Erro desconhecido'}
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-on-surface-variant">
                    <span className="material-symbols-outlined text-[40px] text-outline">
                      receipt_long
                    </span>
                    <p className="font-semibold text-on-surface text-body-lg mt-1">
                      Nenhuma ordem de serviço encontrada
                    </p>
                    <p className="text-body-sm text-on-surface-variant mt-0.5">
                      Converta um orçamento aprovado pelo cliente em Ordem de Serviço.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((wo) => {
                  const badge = getStatusBadge(wo.status);
                  const progressPct =
                    wo.itemCount > 0 ? Math.round((wo.completedItemCount / wo.itemCount) * 100) : 0;
                  const formattedTotal = (wo.totalAmount ?? 0).toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  });

                  return (
                    <tr
                      key={wo.id}
                      onClick={() =>
                        navigate({
                          to: '/operations/work-orders/$id',
                          params: { id: wo.id },
                        })
                      }
                      className="hover:bg-surface-bright transition-colors cursor-pointer group"
                    >
                      {/* Order Number */}
                      <td className="py-3.5 px-4 font-mono font-bold text-primary">
                        {wo.orderNumber || `#OS-${wo.id.slice(0, 8).toUpperCase()}`}
                      </td>

                      {/* Customer */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-on-surface">{wo.customerName}</div>
                        <div className="text-[11px] text-on-surface-variant">
                          Início: {wo.startDate ? new Date(wo.startDate).toLocaleDateString('pt-BR') : 'Hoje'}
                        </div>
                      </td>

                      {/* Vehicle */}
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-on-surface">
                          {wo.vehicleBrand} {wo.vehicleModel}
                        </div>
                        <span className="inline-block px-1.5 py-0.2 bg-surface-container rounded border border-outline-variant font-mono font-bold text-[11px] text-primary mt-0.5">
                          {formatLicensePlate(wo.licensePlate)}
                        </span>
                      </td>

                      {/* Technician / Bay */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-[18px] text-outline">
                            engineering
                          </span>
                          <div>
                            <div className="font-medium text-on-surface text-[12px]">
                              {wo.mechanicName || 'Não atribuído'}
                            </div>
                            {wo.serviceBay && (
                              <span className="text-[10px] text-on-surface-variant font-mono">
                                Box: {wo.serviceBay}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Items Progress */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="w-28 mx-auto">
                          <div className="flex justify-between items-center text-[10px] text-on-surface-variant mb-1 font-mono">
                            <span>
                              {wo.completedItemCount}/{wo.itemCount} itens
                            </span>
                            <span>{progressPct}%</span>
                          </div>
                          <div className="h-1.5 w-full bg-surface-container-highest rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                progressPct === 100 ? 'bg-tertiary' : 'bg-primary'
                              }`}
                              style={{ width: `${progressPct}%` }}
                            ></div>
                          </div>
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
                                to: '/operations/work-orders/$id',
                                params: { id: wo.id },
                              })
                            }
                            className="px-2.5 py-1 bg-surface border border-outline-variant text-primary hover:bg-surface-container rounded-lg font-label-sm text-label-sm font-semibold transition-colors"
                          >
                            Abrir OS
                          </button>

                          {wo.status !== 'CANCELED' && wo.status !== 'COMPLETED' && (
                            <button
                              type="button"
                              onClick={() => handleCancel(wo.id)}
                              className="p-1 text-on-surface-variant hover:text-error rounded hover:bg-error-container/20 transition-colors"
                              title="Cancelar OS"
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
              Mostrando {filteredOrders.length} de {data.totalElements} ordens de serviço
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
