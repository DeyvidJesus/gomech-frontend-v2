import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { operationsApi } from '../api/operationsApi';
import { iamApi, type UserResponse } from '@/features/iam/api/iam';
import { toolsApi } from '@/features/tools/api/toolsApi';
import { inventoryApi } from '@/features/inventory/api/inventoryApi';
import type { Product } from '@/features/inventory/types';
import type { Tool } from '@/features/tools/types';
import type {
  WorkOrderStatus,
  WorkOrderItemStatus,
  WorkOrderItemType,
  SaveWorkOrderItemRequest,
} from '../types';
import { formatLicensePlate } from '@/features/crm/utils/validators';

interface WorkOrderDetailProps {
  workOrderId: string;
}

export function WorkOrderDetail({ workOrderId }: WorkOrderDetailProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [addItemModalOpen, setAddItemModalOpen] = useState(false);
  const [addItemType, setAddItemType] = useState<WorkOrderItemType>('SERVICE');
  const [linkToolModalOpen, setLinkToolModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'SERVICES' | 'PARTS' | 'TOOLS' | 'TIMELINE'>('SERVICES');

  // Fetch Work Order Details
  const {
    data: workOrder,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['operations', 'work-order', workOrderId],
    queryFn: () => operationsApi.getWorkOrderById(workOrderId),
  });

  // Fetch Team Users (for mechanic assignment)
  const { data: users = [] } = useQuery({
    queryKey: ['iam', 'users'],
    queryFn: () => iamApi.users().then((r) => r.data),
    staleTime: 1000 * 60 * 5,
  });

  // Fetch Tools currently linked to this Work Order
  const { data: toolUsages = [], refetch: refetchTools } = useQuery({
    queryKey: ['tools', 'usages', 'work-order', workOrderId],
    queryFn: () => toolsApi.getUsagesByWorkOrder(workOrderId).then((r) => r.data),
  });

  // Fetch all tools (for linking modal)
  const { data: allToolsResponse } = useQuery({
    queryKey: ['tools', 'list'],
    queryFn: () => toolsApi.getTools({ size: 100 }).then((r) => r.data),
    enabled: linkToolModalOpen,
  });
  const allTools: Tool[] = allToolsResponse?.content || [];

  // Change Status Mutation
  const changeStatusMutation = useMutation({
    mutationFn: (newStatus: WorkOrderStatus) =>
      operationsApi.changeWorkOrderStatus(workOrderId, { status: newStatus }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operations', 'work-order', workOrderId] });
      queryClient.invalidateQueries({ queryKey: ['operations', 'work-orders'] });
    },
  });

  // Update Work Order Header (e.g. Mechanic Assignment)
  const updateWorkOrderMutation = useMutation({
    mutationFn: (data: { mechanicUserId?: string }) =>
      operationsApi.updateWorkOrder(workOrderId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operations', 'work-order', workOrderId] });
      queryClient.invalidateQueries({ queryKey: ['operations', 'work-orders'] });
    },
  });

  // Update Items Mutation (for checklist status toggle or adding items)
  const updateItemsMutation = useMutation({
    mutationFn: (items: SaveWorkOrderItemRequest[]) =>
      operationsApi.updateWorkOrderItems(workOrderId, items),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operations', 'work-order', workOrderId] });
      queryClient.invalidateQueries({ queryKey: ['operations', 'work-orders'] });
    },
  });

  // Link Tool to Work Order
  const linkToolMutation = useMutation({
    mutationFn: (toolId: string) =>
      toolsApi.recordUsage({
        toolId,
        workOrderId,
        notes: `Vinculada à OS #${workOrder?.orderNumber || workOrderId.slice(0, 8)}`,
      }),
    onSuccess: () => {
      refetchTools();
      setLinkToolModalOpen(false);
    },
  });

  // Release/Return Tool
  const finishToolUsageMutation = useMutation({
    mutationFn: (usageId: string) => toolsApi.finishUsage(usageId, 'Devolvida ao concluir etapa da OS'),
    onSuccess: () => {
      refetchTools();
    },
  });

  if (isLoading) {
    return (
      <div className="py-24 text-center text-on-surface-variant">
        <span className="material-symbols-outlined animate-spin text-[32px] text-primary">
          progress_activity
        </span>
        <p className="mt-2 font-medium">Carregando detalhes da Ordem de Serviço...</p>
      </div>
    );
  }

  if (isError || !workOrder) {
    return (
      <div className="py-16 text-center text-error bg-surface-container-lowest rounded-2xl border border-outline-variant max-w-[540px] mx-auto">
        <span className="material-symbols-outlined text-[48px]">error</span>
        <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface mt-2">
          Ordem de Serviço não encontrada
        </h2>
        <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
          {(error as Error)?.message || 'Erro ao consultar a API.'}
        </p>
        <button
          onClick={() => navigate({ to: '/operations/work-orders' })}
          className="mt-4 px-4 py-2 bg-primary text-on-primary rounded-lg font-label-md text-label-md font-bold"
        >
          Voltar para Ordens de Serviço
        </button>
      </div>
    );
  }

  const isCompleted = workOrder.status === 'COMPLETED';
  const isCanceled = workOrder.status === 'CANCELED';

  const services = (workOrder.items || []).filter((i) => i.type === 'SERVICE');
  const parts = (workOrder.items || []).filter((i) => i.type === 'PART');
  const completedServices = services.filter((i) => i.status === 'COMPLETED').length;

  // Toggle item status: PENDING -> IN_PROGRESS -> COMPLETED -> PENDING
  const handleToggleItemStatus = (itemId: string) => {
    if (isCompleted || isCanceled) return;

    const updatedItems: SaveWorkOrderItemRequest[] = (workOrder.items || []).map((item) => {
      if (item.id === itemId) {
        let nextStatus: WorkOrderItemStatus;
        if (item.status === 'PENDING') {
          nextStatus = 'IN_PROGRESS';
        } else if (item.status === 'IN_PROGRESS') {
          nextStatus = 'COMPLETED';
        } else {
          nextStatus = 'PENDING';
        }

        return {
          id: item.id,
          type: item.type,
          productId: item.productId,
          assignedMechanicId: item.assignedMechanicId,
          name: item.name,
          description: item.description,
          status: nextStatus,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discountAmount: item.discountAmount,
          taxRate: item.taxRate,
        };
      }
      return {
        id: item.id,
        type: item.type,
        productId: item.productId,
        assignedMechanicId: item.assignedMechanicId,
        name: item.name,
        description: item.description,
        status: item.status,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discountAmount: item.discountAmount,
        taxRate: item.taxRate,
      };
    });

    updateItemsMutation.mutate(updatedItems);
  };

  const handleAddItem = (newItem: SaveWorkOrderItemRequest) => {
    const currentItems: SaveWorkOrderItemRequest[] = (workOrder.items || []).map((i) => ({
      id: i.id,
      type: i.type,
      productId: i.productId,
      assignedMechanicId: i.assignedMechanicId,
      name: i.name,
      description: i.description,
      status: i.status,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      discountAmount: i.discountAmount,
      taxRate: i.taxRate,
    }));

    updateItemsMutation.mutate([...currentItems, newItem]);
    setAddItemModalOpen(false);
  };

  const getStatusBadge = (status: WorkOrderStatus) => {
    switch (status) {
      case 'OPEN':
        return { label: 'Aberta / Aguardando', bg: 'bg-secondary/15 text-secondary border-secondary/30' };
      case 'IN_PROGRESS':
        return { label: 'Em Execução', bg: 'bg-primary-container/20 text-primary border-primary-container/40' };
      case 'WAITING_PARTS':
        return { label: 'Aguardando Peças', bg: 'bg-error-container/30 text-error border-error-container' };
      case 'WAITING_CUSTOMER':
        return { label: 'Aguardando Cliente', bg: 'bg-surface-variant text-on-surface-variant border-outline-variant' };
      case 'COMPLETED':
        return { label: 'Finalizada', bg: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30' };
      case 'CANCELED':
        return { label: 'Cancelada', bg: 'bg-error-container text-on-error-container border-error/20' };
      default:
        return { label: status, bg: 'bg-surface-container text-on-surface-variant border-outline-variant' };
    }
  };

  const badge = getStatusBadge(workOrder.status);

  return (
    <div className="flex flex-col gap-6 max-w-[1400px] mx-auto py-2 animate-in fade-in duration-200">
      {/* Top Header */}
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-outline-variant">
        <div>
          <div className="flex items-center gap-2 text-on-surface-variant mb-1">
            <button
              type="button"
              onClick={() => navigate({ to: '/operations/work-orders' })}
              className="hover:text-primary transition-colors flex items-center gap-1 font-label-sm text-label-sm uppercase tracking-wider"
            >
              <span className="material-symbols-outlined text-[16px]">arrow_back</span>
              Ordens de Serviço
            </button>
            <span className="text-outline">/</span>
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface">
              {workOrder.orderNumber || `#OS-${workOrder.id.slice(0, 8).toUpperCase()}`}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-headline-lg text-headline-lg font-bold text-on-surface">
              {workOrder.vehicleBrand} {workOrder.vehicleModel}{' '}
              <span className="font-mono text-primary font-bold">
                ({formatLicensePlate(workOrder.licensePlate)})
              </span>
            </h1>
            <span
              className={`px-3 py-1 rounded-full font-label-sm text-[12px] font-bold border ${badge.bg}`}
            >
              {badge.label}
            </span>
          </div>
        </div>

        {/* Action Buttons & Mechanic Selector */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Mechanic Assignment Dropdown */}
          <div className="flex items-center gap-2 bg-surface-container-lowest border border-outline-variant px-3 py-1.5 rounded-xl shadow-xs">
            <span className="material-symbols-outlined text-primary text-[20px]">engineering</span>
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-on-surface-variant">Mecânico Líder</span>
              <select
                disabled={isCompleted || isCanceled}
                value={workOrder.mechanicUserId || ''}
                onChange={(e) => updateWorkOrderMutation.mutate({ mechanicUserId: e.target.value || undefined })}
                className="bg-transparent font-semibold text-xs text-on-surface outline-none cursor-pointer"
              >
                <option value="">Nenhum atribuído</option>
                {users.map((u: UserResponse) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.roles?.[0]?.roleName || 'Equipe'})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Transition Buttons */}
          {workOrder.status === 'OPEN' && (
            <button
              type="button"
              onClick={() => changeStatusMutation.mutate('IN_PROGRESS')}
              disabled={changeStatusMutation.isPending}
              className="px-4 py-2 bg-primary text-on-primary rounded-xl font-label-md text-label-md font-bold hover:bg-primary-container transition-all shadow-sm flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[18px]">play_arrow</span>
              Iniciar Execução
            </button>
          )}

          {workOrder.status === 'IN_PROGRESS' && (
            <button
              type="button"
              onClick={() => changeStatusMutation.mutate('COMPLETED')}
              disabled={changeStatusMutation.isPending}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-label-md text-label-md font-bold transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[18px]">check_circle</span>
              Finalizar Ordem
            </button>
          )}

          {!isCompleted && !isCanceled && (
            <button
              type="button"
              onClick={() => {
                setAddItemType('PART');
                setAddItemModalOpen(true);
              }}
              className="px-4 py-2 bg-surface-container border border-outline-variant text-on-surface rounded-xl font-label-md text-label-md font-bold hover:bg-surface-bright transition-all shadow-xs flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[18px]">add_shopping_cart</span>
              Adicionar Peça do Estoque
            </button>
          )}
        </div>
      </header>

      {/* KPI & Summary Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">Cliente</span>
          <p className="font-bold text-sm text-on-surface mt-1">{workOrder.customerName}</p>
          <p className="text-xs text-on-surface-variant font-mono">{workOrder.customerPhone || 'Sem telefone'}</p>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">Progresso dos Serviços</span>
          <div className="flex items-center justify-between mt-1">
            <span className="font-bold text-sm text-on-surface">{completedServices} de {services.length} concluídos</span>
            <span className="text-xs font-bold text-primary">
              {services.length > 0 ? Math.round((completedServices / services.length) * 100) : 0}%
            </span>
          </div>
          <div className="w-full bg-surface-container rounded-full h-1.5 mt-2">
            <div
              className="bg-primary h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${services.length > 0 ? (completedServices / services.length) * 100 : 0}%` }}
            />
          </div>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">Ferramentas Vinculadas</span>
          <div className="flex items-center justify-between mt-1">
            <span className="font-bold text-sm text-on-surface">{toolUsages.filter((t) => !t.checkedInAt).length} em uso</span>
            <button
              onClick={() => {
                setActiveTab('TOOLS');
                setLinkToolModalOpen(true);
              }}
              className="text-xs text-primary font-bold hover:underline"
            >
              + Vincular
            </button>
          </div>
          <p className="text-xs text-on-surface-variant mt-1">Rastreamento de ferramentas ativas</p>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">Valor Total da OS</span>
          <p className="font-bold text-xl text-primary mt-1">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(workOrder.totalAmount || 0)}
          </p>
          <span className="text-[10px] text-on-surface-variant">Peças + Mão de obra</span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-outline-variant pb-2">
        <button
          onClick={() => setActiveTab('SERVICES')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all ${
            activeTab === 'SERVICES'
              ? 'bg-primary-fixed text-primary font-bold shadow-xs'
              : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">build</span>
          <span>Mão de Obra & Serviços ({services.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('PARTS')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all ${
            activeTab === 'PARTS'
              ? 'bg-primary-fixed text-primary font-bold shadow-xs'
              : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">inventory_2</span>
          <span>Peças do Estoque ({parts.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('TOOLS')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all ${
            activeTab === 'TOOLS'
              ? 'bg-primary-fixed text-primary font-bold shadow-xs'
              : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">construction</span>
          <span>Ferramentas em Uso ({toolUsages.length})</span>
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'SERVICES' && (
        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base text-on-surface">Checklist de Serviços</h3>
            {!isCompleted && !isCanceled && (
              <button
                type="button"
                onClick={() => {
                  setAddItemType('SERVICE');
                  setAddItemModalOpen(true);
                }}
                className="px-3 py-1.5 bg-primary text-on-primary rounded-lg text-xs font-bold hover:bg-primary-container transition-colors flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[16px]">add</span>
                Novo Serviço
              </button>
            )}
          </div>

          <div className="space-y-2">
            {services.length === 0 ? (
              <p className="text-sm text-on-surface-variant text-center py-6">Nenhum serviço registrado.</p>
            ) : (
              services.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3.5 rounded-xl border border-outline-variant bg-surface hover:bg-surface-bright transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      disabled={isCompleted || isCanceled}
                      onClick={() => handleToggleItemStatus(item.id)}
                      className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-colors ${
                        item.status === 'COMPLETED'
                          ? 'bg-emerald-600 border-emerald-600 text-white'
                          : item.status === 'IN_PROGRESS'
                          ? 'bg-primary border-primary text-white'
                          : 'border-outline text-transparent'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[16px]">check</span>
                    </button>
                    <div>
                      <p className={`font-semibold text-sm ${item.status === 'COMPLETED' ? 'line-through text-on-surface-variant' : 'text-on-surface'}`}>
                        {item.name}
                      </p>
                      <p className="text-xs text-on-surface-variant">{item.description || 'Sem observações adicionais'}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-bold text-sm text-on-surface">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.totalAmount || 0)}
                    </span>
                    <span className="block text-[11px] text-on-surface-variant">{item.quantity}h / un</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'PARTS' && (
        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-on-surface">Peças e Materiais Aplicados</h3>
              <p className="text-xs text-on-surface-variant">Itens vinculados serão baixados automaticamente do estoque ao concluir a OS</p>
            </div>
            {!isCompleted && !isCanceled && (
              <button
                type="button"
                onClick={() => {
                  setAddItemType('PART');
                  setAddItemModalOpen(true);
                }}
                className="px-3 py-1.5 bg-primary text-on-primary rounded-lg text-xs font-bold hover:bg-primary-container transition-colors flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[16px]">add</span>
                Adicionar Peça do Estoque
              </button>
            )}
          </div>

          <div className="space-y-2">
            {parts.length === 0 ? (
              <p className="text-sm text-on-surface-variant text-center py-6">Nenhuma peça adicionada nesta OS.</p>
            ) : (
              parts.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3.5 rounded-xl border border-outline-variant bg-surface hover:bg-surface-bright transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                      <span className="material-symbols-outlined text-[20px]">inventory_2</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm text-on-surface">{item.name}</p>
                        {item.productId ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
                            Estoque Vinculado
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-surface-container text-on-surface-variant">
                            Avulso
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-on-surface-variant">{item.description || 'Item aplicado ao veículo'}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-bold text-sm text-on-surface">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.totalAmount || 0)}
                    </span>
                    <span className="block text-[11px] text-on-surface-variant">{item.quantity} un x {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.unitPrice || 0)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'TOOLS' && (
        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-on-surface">Ferramentas e Equipamentos em Custódia</h3>
              <p className="text-xs text-on-surface-variant">Ferramentas especiais e scanners alocados para a realização desta OS</p>
            </div>
            {!isCompleted && !isCanceled && (
              <button
                type="button"
                onClick={() => setLinkToolModalOpen(true)}
                className="px-3 py-1.5 bg-primary text-on-primary rounded-lg text-xs font-bold hover:bg-primary-container transition-colors flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[16px]">add</span>
                Vincular Ferramenta
              </button>
            )}
          </div>

          <div className="space-y-2">
            {toolUsages.length === 0 ? (
              <p className="text-sm text-on-surface-variant text-center py-6">Nenhuma ferramenta vinculada no momento.</p>
            ) : (
              toolUsages.map((usage) => (
                <div
                  key={usage.id}
                  className="flex items-center justify-between p-3.5 rounded-xl border border-outline-variant bg-surface hover:bg-surface-bright transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600">
                      <span className="material-symbols-outlined text-[20px]">construction</span>
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-on-surface">{usage.toolName || 'Ferramenta'}</p>
                      <p className="text-xs text-on-surface-variant">
                        Início do uso: {usage.checkedOutAt ? new Date(usage.checkedOutAt).toLocaleString('pt-BR') : '-'}
                      </p>
                    </div>
                  </div>

                  <div>
                    {usage.checkedInAt ? (
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-surface-container text-on-surface-variant">
                        Devolvida
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => finishToolUsageMutation.mutate(usage.id)}
                        disabled={finishToolUsageMutation.isPending}
                        className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-colors"
                      >
                        Encerrar Uso / Devolver
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Add Item Modal with Inventory Autocomplete */}
      {addItemModalOpen && (
        <AddWorkOrderItemModal
          initialType={addItemType}
          onClose={() => setAddItemModalOpen(false)}
          onAdd={handleAddItem}
        />
      )}

      {/* Link Tool Modal */}
      {linkToolModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl max-w-[480px] w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-outline-variant pb-3">
              <h3 className="font-bold text-base text-on-surface">Vincular Ferramenta à OS</h3>
              <button onClick={() => setLinkToolModalOpen(false)} className="text-on-surface-variant hover:text-on-surface">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="max-h-60 overflow-y-auto space-y-2">
              {allTools.length === 0 ? (
                <p className="text-sm text-on-surface-variant text-center py-4">Nenhuma ferramenta disponível cadastrada.</p>
              ) : (
                allTools.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => linkToolMutation.mutate(t.id)}
                    disabled={linkToolMutation.isPending}
                    className="w-full flex items-center justify-between p-3 rounded-xl border border-outline-variant bg-surface hover:bg-surface-container text-left transition-colors"
                  >
                    <div>
                      <p className="font-semibold text-xs text-on-surface">{t.name}</p>
                      <p className="text-[11px] text-on-surface-variant font-mono">Patrimônio: {t.assetTag || t.serialNumber || '-'}</p>
                    </div>
                    <span className="material-symbols-outlined text-[18px] text-primary">add</span>
                  </button>
                ))
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setLinkToolModalOpen(false)}
                className="px-4 py-2 border border-outline-variant rounded-lg text-xs font-semibold text-on-surface hover:bg-surface-container"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// -------------------------------------------------------------
// Component: AddWorkOrderItemModal with Product Search
// -------------------------------------------------------------
interface AddWorkOrderItemModalProps {
  initialType: WorkOrderItemType;
  onClose: () => void;
  onAdd: (item: SaveWorkOrderItemRequest) => void;
}

function AddWorkOrderItemModal({ initialType, onClose, onAdd }: AddWorkOrderItemModalProps) {
  const [type, setType] = useState<WorkOrderItemType>(initialType);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [unitPrice, setUnitPrice] = useState(0);
  const [productId, setProductId] = useState<string | undefined>(undefined);
  const [productSearch, setProductSearch] = useState('');

  // Search products from inventory when adding PART
  const { data: searchProductsResponse } = useQuery({
    queryKey: ['inventory', 'products', 'search', productSearch],
    queryFn: () => inventoryApi.getProducts({ search: productSearch, size: 10 }).then((r) => r.data),
    enabled: type === 'PART',
  });
  const productOptions: Product[] = searchProductsResponse?.content || [];

  const handleSelectProduct = (prod: Product) => {
    setProductId(prod.id);
    setName(prod.name);
    setUnitPrice(prod.sellingPrice || prod.costPrice || 0);
    setDescription(`Código: ${prod.skuCode || '-'} | Marca: ${prod.brand || '-'}`);
    setProductSearch('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onAdd({
      type,
      productId: type === 'PART' ? productId : undefined,
      name: name.trim(),
      description: description.trim() || undefined,
      status: 'PENDING',
      quantity,
      unitPrice,
      discountAmount: 0,
      taxRate: 0,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl max-w-[480px] w-full p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-outline-variant pb-3">
          <h3 className="font-bold text-base text-on-surface">
            Adicionar {type === 'SERVICE' ? 'Serviço' : 'Peça do Estoque'}
          </h3>
          <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => {
                setType('SERVICE');
                setProductId(undefined);
              }}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors ${
                type === 'SERVICE'
                  ? 'bg-primary text-on-primary'
                  : 'bg-surface border border-outline-variant text-on-surface-variant'
              }`}
            >
              Mão de Obra
            </button>
            <button
              type="button"
              onClick={() => setType('PART')}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors ${
                type === 'PART'
                  ? 'bg-primary text-on-primary'
                  : 'bg-surface border border-outline-variant text-on-surface-variant'
              }`}
            >
              Peça do Catálogo
            </button>
          </div>

          {type === 'PART' && (
            <div>
              <label className="block text-xs font-medium text-on-surface-variant mb-1">
                Buscar no Catálogo de Peças
              </label>
              <input
                type="text"
                placeholder="Digite o nome, código ou SKU..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="w-full h-10 px-3 bg-surface border border-outline-variant rounded-lg text-sm text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none"
              />

              {productOptions.length > 0 && productSearch && (
                <div className="mt-1 max-h-36 overflow-y-auto border border-outline-variant rounded-lg bg-surface shadow-lg divide-y divide-outline-variant/60">
                  {productOptions.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleSelectProduct(p)}
                      className="w-full p-2 text-left hover:bg-surface-container flex items-center justify-between text-xs transition-colors"
                    >
                      <div>
                        <p className="font-semibold text-on-surface">{p.name}</p>
                        <p className="text-[10px] text-on-surface-variant">SKU: {p.skuCode || '-'} • Marca: {p.brand || '-'}</p>
                      </div>
                      <span className="font-bold text-primary">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p.sellingPrice || 0)}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-on-surface-variant mb-1">
              Nome / Descrição <span className="text-error">*</span>
            </label>
            <input
              type="text"
              required
              placeholder={type === 'SERVICE' ? 'Ex: Troca de pastilhas' : 'Ex: Pastilha Dianteira Cerâmica'}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-10 px-3 bg-surface border border-outline-variant rounded-lg text-sm text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-on-surface-variant mb-1">
                {type === 'SERVICE' ? 'Horas / Qtd' : 'Quantidade'}
              </label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                required
                value={quantity}
                onChange={(e) => setQuantity(parseFloat(e.target.value) || 1)}
                className="w-full h-10 px-3 bg-surface border border-outline-variant rounded-lg text-sm text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-on-surface-variant mb-1">Preço Unitário (R$)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={unitPrice}
                onChange={(e) => setUnitPrice(parseFloat(e.target.value) || 0)}
                className="w-full h-10 px-3 bg-surface border border-outline-variant rounded-lg text-sm text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-outline-variant">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-outline-variant rounded-lg text-xs font-semibold text-on-surface hover:bg-surface-container"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-primary text-on-primary rounded-lg text-xs font-bold hover:bg-primary-container transition-all"
            >
              Adicionar à OS
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
