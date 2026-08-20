import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { operationsApi } from '../api/operationsApi';
import type { WorkOrderStatus, WorkOrderSummaryResponse } from '../types';
import { useAuthStore } from '@/features/iam/stores/authStore';
import { formatLicensePlate } from '@/features/crm/utils/validators';

export function WorkOrderKanban() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const activeUnitId = user?.activeUnitId;

  const [search, setSearch] = useState('');

  // Fetch Kanban Board
  const { data: kanbanData, isLoading, isError, error } = useQuery({
    queryKey: ['operations', 'work-orders', 'kanban', activeUnitId],
    queryFn: () => operationsApi.getWorkOrderKanban(activeUnitId),
  });

  // Change Status Mutation
  const changeStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: WorkOrderStatus }) =>
      operationsApi.changeWorkOrderStatus(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operations', 'work-orders'] });
    },
  });

  const handleStatusTransition = (e: React.MouseEvent, id: string, newStatus: WorkOrderStatus) => {
    e.stopPropagation();
    changeStatusMutation.mutate({ id, status: newStatus });
  };

  // Standard Kanban Columns Definition
  const standardColumns: { status: WorkOrderStatus; title: string; color: string; border: string; dot: string }[] = [
    {
      status: 'OPEN',
      title: 'Aguardando / Aberta',
      color: 'bg-secondary/10 text-secondary',
      border: 'border-secondary/30',
      dot: 'bg-secondary',
    },
    {
      status: 'IN_PROGRESS',
      title: 'Em Execução',
      color: 'bg-primary-container/20 text-primary',
      border: 'border-primary-container/40',
      dot: 'bg-primary animate-pulse',
    },
    {
      status: 'WAITING_PARTS',
      title: 'Aguardando Peças',
      color: 'bg-error-container/30 text-error',
      border: 'border-error-container',
      dot: 'bg-error',
    },
    {
      status: 'WAITING_CUSTOMER',
      title: 'Aguardando Cliente',
      color: 'bg-surface-variant text-on-surface-variant',
      border: 'border-outline-variant',
      dot: 'bg-outline',
    },
  ];

  // Group orders by column or map from backend response
  const columnsWithOrders = standardColumns.map((col) => {
    const backendCol = kanbanData?.columns.find((c) => c.status === col.status);
    const rawOrders = backendCol?.orders || [];
    const filteredOrders = rawOrders.filter((wo) => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        (wo.orderNumber || wo.id).toLowerCase().includes(q) ||
        wo.customerName.toLowerCase().includes(q) ||
        wo.licensePlate.toLowerCase().includes(q) ||
        `${wo.vehicleBrand || ''} ${wo.vehicleModel || ''}`.toLowerCase().includes(q)
      );
    });

    return {
      ...col,
      totalOrders: filteredOrders.length,
      totalAmount: backendCol?.totalAmount || 0,
      orders: filteredOrders,
    };
  });

  return (
    <div className="flex flex-col gap-5 h-[calc(100vh-100px)] animate-in fade-in duration-200">
      {/* Top Header & Toolbar */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-headline-lg text-headline-lg font-bold text-on-surface">
              Quadro Kanban
            </h1>
            {kanbanData && (
              <span className="px-3 py-1 bg-surface-container rounded-full text-on-surface-variant font-label-sm text-label-sm font-semibold border border-outline-variant">
                {kanbanData.totalActiveOrders} OS Ativas •{' '}
                {(kanbanData.totalActiveAmount || 0).toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                })}
              </span>
            )}
          </div>
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
            Fluxo visual de ordens de serviço por estágio operacional da oficina.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Search input */}
          <div className="relative w-64">
            <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">
              search
            </span>
            <input
              type="text"
              placeholder="Filtrar por OS, placa ou cliente..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-surface-container-lowest border border-outline-variant rounded-lg text-body-sm text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none"
            />
          </div>

          {/* View Mode Toggle */}
          <div className="flex bg-surface-container-lowest border border-outline-variant rounded-lg p-0.5 shadow-xs">
            <button
              type="button"
              onClick={() => navigate({ to: '/operations/work-orders' })}
              className="px-3 py-1.5 text-on-surface-variant hover:text-on-surface rounded-md font-label-sm text-label-sm font-medium flex items-center gap-1.5 transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">view_list</span>
              Lista
            </button>
            <button
              type="button"
              className="px-3 py-1.5 bg-primary-fixed text-primary rounded-md font-label-sm text-label-sm font-bold flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">view_kanban</span>
              Kanban
            </button>
          </div>
        </div>
      </header>

      {/* Kanban Board Canvas */}
      {isLoading ? (
        <div className="flex-1 flex flex-col items-center justify-center text-on-surface-variant">
          <span className="material-symbols-outlined animate-spin text-[32px] text-primary">
            progress_activity
          </span>
          <p className="mt-2 font-medium">Carregando quadro Kanban...</p>
        </div>
      ) : isError ? (
        <div className="p-8 text-center text-error bg-surface-container-lowest rounded-2xl border border-outline-variant">
          Erro ao carregar Kanban: {(error as Error)?.message || 'Erro desconhecido'}
        </div>
      ) : (
        <div className="flex-1 overflow-x-auto pb-2 flex gap-4 items-start min-h-0">
          {columnsWithOrders.map((col) => (
            <div
              key={col.status}
              className="w-[320px] shrink-0 flex flex-col max-h-full bg-surface-container-lowest rounded-xl border border-outline-variant shadow-xs overflow-hidden"
            >
              {/* Column Header */}
              <div className="p-3 border-b border-outline-variant bg-surface flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${col.dot}`}></span>
                  <h3 className="font-label-md text-label-md font-bold text-on-surface">
                    {col.title}
                  </h3>
                </div>
                <span className="px-2 py-0.5 bg-surface-container rounded-full text-on-surface-variant font-label-sm text-label-sm font-mono font-bold">
                  {col.totalOrders}
                </span>
              </div>

              {/* Cards Container */}
              <div className="flex-1 overflow-y-auto p-2.5 space-y-2.5 min-h-[150px]">
                {col.orders.length === 0 ? (
                  <div className="py-8 text-center text-on-surface-variant border border-dashed border-outline-variant rounded-lg">
                    <p className="text-body-sm font-medium">Nenhuma OS neste status</p>
                  </div>
                ) : (
                  col.orders.map((wo) => (
                    <KanbanCard
                      key={wo.id}
                      order={wo}
                      onTransition={handleStatusTransition}
                      onOpen={() =>
                        navigate({
                          to: '/operations/work-orders/$id',
                          params: { id: wo.id },
                        })
                      }
                    />
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// -------------------------------------------------------------
// Component: KanbanCard
// -------------------------------------------------------------
interface KanbanCardProps {
  order: WorkOrderSummaryResponse;
  onTransition: (e: React.MouseEvent, id: string, newStatus: WorkOrderStatus) => void;
  onOpen: () => void;
}

function KanbanCard({ order, onTransition, onOpen }: KanbanCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const progressPct =
    order.itemCount > 0
      ? Math.round((order.completedItemCount / order.itemCount) * 100)
      : 0;

  return (
    <div
      onClick={onOpen}
      className="bg-surface border border-outline-variant rounded-lg p-3 shadow-xs hover:shadow-md hover:border-primary/50 transition-all cursor-pointer group flex flex-col gap-2 relative"
    >
      {/* Card Header: Order ID & Total */}
      <div className="flex items-center justify-between">
        <span className="font-mono font-bold text-primary text-[12px]">
          {order.orderNumber || `#OS-${order.id.slice(0, 8).toUpperCase()}`}
        </span>
        <span className="font-bold text-body-sm text-on-surface font-mono">
          {(order.totalAmount || 0).toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL',
          })}
        </span>
      </div>

      {/* Vehicle & Customer */}
      <div>
        <h4 className="font-semibold text-on-surface text-body-sm leading-tight">
          {order.vehicleBrand} {order.vehicleModel}
        </h4>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="px-1.5 py-0.2 bg-surface-container rounded border border-outline-variant font-mono font-bold text-[10px] text-primary">
            {formatLicensePlate(order.licensePlate)}
          </span>
          <span className="text-[11px] text-on-surface-variant truncate">
            {order.customerName}
          </span>
        </div>
      </div>

      {/* Checklist Progress */}
      <div>
        <div className="flex justify-between items-center text-[10px] text-on-surface-variant mb-1 font-mono">
          <span>
            {order.completedItemCount}/{order.itemCount} serviços concluídos
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

      {/* Card Footer: Mechanic & Quick Action */}
      <div className="pt-2 border-t border-outline-variant flex items-center justify-between text-[11px] text-on-surface-variant">
        <div className="flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[15px] text-outline">engineering</span>
          <span className="truncate max-w-[120px] font-medium">
            {order.mechanicName || 'Não atribuído'}
          </span>
          {order.serviceBay && (
            <span className="px-1 bg-surface-container rounded text-[10px] font-mono">
              Box {order.serviceBay}
            </span>
          )}
        </div>

        {/* Quick Transition Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen(!menuOpen);
            }}
            className="p-1 hover:bg-surface-container rounded text-on-surface-variant hover:text-primary transition-colors"
            title="Alterar Status Operacional"
          >
            <span className="material-symbols-outlined text-[18px]">more_vert</span>
          </button>

          {menuOpen && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="absolute right-0 bottom-full mb-1 w-44 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-xl py-1 z-30 divide-y divide-outline-variant text-[12px]"
            >
              <div className="px-2.5 py-1 text-[10px] font-bold text-on-surface-variant uppercase">
                Mover para:
              </div>

              {order.status !== 'OPEN' && (
                <button
                  type="button"
                  onClick={(e) => {
                    setMenuOpen(false);
                    onTransition(e, order.id, 'OPEN');
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-surface-container text-on-surface flex items-center gap-1.5"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                  Aguardando / Aberta
                </button>
              )}

              {order.status !== 'IN_PROGRESS' && (
                <button
                  type="button"
                  onClick={(e) => {
                    setMenuOpen(false);
                    onTransition(e, order.id, 'IN_PROGRESS');
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-surface-container text-on-surface flex items-center gap-1.5"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                  Em Execução
                </button>
              )}

              {order.status !== 'WAITING_PARTS' && (
                <button
                  type="button"
                  onClick={(e) => {
                    setMenuOpen(false);
                    onTransition(e, order.id, 'WAITING_PARTS');
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-surface-container text-on-surface flex items-center gap-1.5"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-error"></span>
                  Aguardando Peças
                </button>
              )}

              {order.status !== 'WAITING_CUSTOMER' && (
                <button
                  type="button"
                  onClick={(e) => {
                    setMenuOpen(false);
                    onTransition(e, order.id, 'WAITING_CUSTOMER');
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-surface-container text-on-surface flex items-center gap-1.5"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-outline"></span>
                  Aguardando Cliente
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
