import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { operationsApi } from '../api/operationsApi';
import type { InspectionStatus } from '../types';
import { useAuthStore } from '@/features/iam/stores/authStore';
import { formatLicensePlate } from '@/features/crm/utils/validators';

export function InspectionList() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const activeUnitId = user?.activeUnitId;

  const [statusFilter, setStatusFilter] = useState<InspectionStatus | ''>('');
  const [page, setPage] = useState(0);
  const pageSize = 20;

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['operations', 'inspections', { status: statusFilter || undefined, unitId: activeUnitId, page, size: pageSize }],
    queryFn: () =>
      operationsApi.getInspections({
        status: statusFilter || undefined,
        unitId: activeUnitId,
        page,
        size: pageSize,
      }),
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => operationsApi.cancelInspection(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operations', 'inspections'] });
    },
  });

  const handleCancel = (id: string) => {
    if (window.confirm('Deseja realmente cancelar esta inspeção veicular?')) {
      cancelMutation.mutate(id);
    }
  };

  const getStatusLabel = (status: InspectionStatus) => {
    switch (status) {
      case 'IN_PROGRESS':
        return 'Em Andamento';
      case 'COMPLETED':
        return 'Concluída';
      case 'CANCELED':
        return 'Cancelada';
      case 'DRAFT':
        return 'Rascunho';
      default:
        return status;
    }
  };

  const getStatusBadge = (status: InspectionStatus) => {
    switch (status) {
      case 'IN_PROGRESS':
        return 'bg-primary text-on-primary';
      case 'COMPLETED':
        return 'bg-tertiary text-on-tertiary';
      case 'CANCELED':
        return 'bg-error-container text-on-error-container';
      default:
        return 'bg-surface-container text-on-surface-variant';
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-200">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-headline-lg text-headline-lg font-bold text-on-surface">
            Vistorias & Checklists
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-0.5">
            Inspeções veiculares de entrada, diagnóstico técnico e laudos de segurança.
          </p>
        </div>

        <button
          onClick={() => navigate({ to: '/operations/inspections/new' })}
          className="px-4 py-2 bg-primary text-on-primary rounded-lg font-label-md text-label-md font-bold hover:bg-primary-container transition-all shadow-sm flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          Nova Vistoria
        </button>
      </header>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-outline-variant pb-3">
        <button
          onClick={() => setStatusFilter('')}
          className={`px-3.5 py-1.5 rounded-lg text-label-md font-label-md transition-colors ${
            statusFilter === ''
              ? 'bg-primary text-on-primary font-bold shadow-xs'
              : 'bg-surface-container-lowest border border-outline-variant text-on-surface-variant hover:text-on-surface'
          }`}
        >
          Todas
        </button>
        <button
          onClick={() => setStatusFilter('IN_PROGRESS')}
          className={`px-3.5 py-1.5 rounded-lg text-label-md font-label-md transition-colors ${
            statusFilter === 'IN_PROGRESS'
              ? 'bg-primary text-on-primary font-bold shadow-xs'
              : 'bg-surface-container-lowest border border-outline-variant text-on-surface-variant hover:text-on-surface'
          }`}
        >
          Em Andamento
        </button>
        <button
          onClick={() => setStatusFilter('COMPLETED')}
          className={`px-3.5 py-1.5 rounded-lg text-label-md font-label-md transition-colors ${
            statusFilter === 'COMPLETED'
              ? 'bg-primary text-on-primary font-bold shadow-xs'
              : 'bg-surface-container-lowest border border-outline-variant text-on-surface-variant hover:text-on-surface'
          }`}
        >
          Concluídas
        </button>
        <button
          onClick={() => setStatusFilter('DRAFT')}
          className={`px-3.5 py-1.5 rounded-lg text-label-md font-label-md transition-colors ${
            statusFilter === 'DRAFT'
              ? 'bg-primary text-on-primary font-bold shadow-xs'
              : 'bg-surface-container-lowest border border-outline-variant text-on-surface-variant hover:text-on-surface'
          }`}
        >
          Rascunho
        </button>
      </div>

      {/* Inspections Table */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-xs">
        <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-surface border-b border-outline-variant font-label-sm text-label-sm text-on-surface-variant uppercase font-semibold">
          <div className="col-span-3">Cliente</div>
          <div className="col-span-3">Veículo & Placa</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-2">Diagnóstico (Itens)</div>
          <div className="col-span-2 text-right">Ações</div>
        </div>

        {isLoading ? (
          <div className="py-16 text-center text-on-surface-variant">
            <span className="material-symbols-outlined animate-spin text-[28px] text-primary">
              progress_activity
            </span>
            <p className="mt-2 font-medium">Carregando vistorias...</p>
          </div>
        ) : isError ? (
          <div className="py-12 text-center text-error">
            Erro ao carregar vistorias: {(error as Error)?.message || 'Erro desconhecido'}
          </div>
        ) : !data?.content || data.content.length === 0 ? (
          <div className="py-16 text-center text-on-surface-variant">
            <span className="material-symbols-outlined text-[40px] text-outline">
              checklist_rtl
            </span>
            <p className="font-semibold text-on-surface text-body-lg mt-1">
              Nenhuma vistoria encontrada
            </p>
            <p className="text-body-sm text-on-surface-variant mt-0.5">
              Inicie um novo checklist de entrada para inspecionar um veículo.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-outline-variant">
            {data.content.map((insp) => (
              <div
                key={insp.id}
                className="grid grid-cols-12 gap-2 px-4 py-3.5 items-center hover:bg-surface-bright transition-colors"
              >
                {/* Customer */}
                <div className="col-span-3">
                  <p className="font-semibold text-on-surface text-body-md truncate">
                    {insp.customerName}
                  </p>
                  <p className="text-[11px] text-on-surface-variant">
                    {new Date(insp.createdAt).toLocaleDateString('pt-BR')}
                  </p>
                </div>

                {/* Vehicle */}
                <div className="col-span-3">
                  <p className="font-medium text-on-surface text-body-md truncate">
                    {insp.vehicleBrand} {insp.vehicleModel}
                  </p>
                  <span className="inline-block px-2 py-0.5 mt-0.5 bg-surface-container rounded border border-outline-variant font-mono font-bold text-[11px] text-primary">
                    {formatLicensePlate(insp.licensePlate)}
                  </span>
                </div>

                {/* Status */}
                <div className="col-span-2">
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold ${getStatusBadge(
                      insp.status
                    )}`}
                  >
                    {getStatusLabel(insp.status)}
                  </span>
                </div>

                {/* Diagnostic Items Breakdown */}
                <div className="col-span-2 flex items-center gap-1.5 text-[11px] font-bold">
                  {insp.criticalItems > 0 && (
                    <span className="px-1.5 py-0.5 bg-error text-on-error rounded" title="Itens Críticos">
                      {insp.criticalItems} Críticos
                    </span>
                  )}
                  {insp.attentionItems > 0 && (
                    <span
                      className="px-1.5 py-0.5 bg-secondary-container text-on-secondary-container rounded"
                      title="Itens de Atenção"
                    >
                      {insp.attentionItems} Atenção
                    </span>
                  )}
                  {insp.okItems > 0 && (
                    <span className="px-1.5 py-0.5 bg-tertiary/20 text-tertiary rounded" title="Itens OK">
                      {insp.okItems} OK
                    </span>
                  )}
                  {insp.totalItems === 0 && (
                    <span className="text-on-surface-variant font-normal">Não iniciado</span>
                  )}
                </div>

                {/* Actions */}
                <div className="col-span-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      navigate({
                        to: '/operations/inspections/$id',
                        params: { id: insp.id },
                      })
                    }
                    className="px-3 py-1.5 bg-primary text-on-primary text-label-sm font-label-sm font-bold rounded-lg hover:bg-primary-container transition-colors shadow-xs"
                  >
                    {insp.status === 'COMPLETED' ? 'Ver Laudo' : 'Executar Vistoria'}
                  </button>

                  {insp.status !== 'COMPLETED' && (
                    <button
                      type="button"
                      onClick={() => handleCancel(insp.id)}
                      className="p-1.5 text-on-surface-variant hover:text-error rounded-lg hover:bg-error-container/20 transition-colors"
                      title="Cancelar Vistoria"
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <span className="text-body-sm text-on-surface-variant">
            Página {data.page + 1} de {data.totalPages} ({data.totalElements} vistorias)
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={data.page === 0}
              className="px-3 py-1.5 border border-outline-variant rounded-lg text-label-sm font-label-sm disabled:opacity-40"
            >
              Anterior
            </button>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={data.page + 1 >= data.totalPages}
              className="px-3 py-1.5 border border-outline-variant rounded-lg text-label-sm font-label-sm disabled:opacity-40"
            >
              Próxima
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
