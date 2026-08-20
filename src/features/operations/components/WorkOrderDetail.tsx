import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { operationsApi } from '../api/operationsApi';
import type {
  WorkOrderStatus,
  WorkOrderItemStatus,
  WorkOrderItemType,
  SaveWorkOrderItemRequest,
} from '../types';
import { formatLicensePlate } from '@/features/crm/utils/validators';
import { getApiErrorMessage } from '@/shared/utils/formErrors';

interface WorkOrderDetailProps {
  workOrderId: string;
}

export function WorkOrderDetail({ workOrderId }: WorkOrderDetailProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [completeModalOpen, setCompleteModalOpen] = useState(false);
  const [addItemModalOpen, setAddItemModalOpen] = useState(false);
  const [addItemType, setAddItemType] = useState<WorkOrderItemType>('SERVICE');

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

  // Change Status Mutation
  const changeStatusMutation = useMutation({
    mutationFn: (newStatus: WorkOrderStatus) =>
      operationsApi.changeWorkOrderStatus(workOrderId, { status: newStatus }),
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
      <div className="py-16 text-center text-error bg-surface-container-lowest rounded-2xl border border-outline-variant max-w-lg mx-auto">
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
        return { label: 'Finalizada', bg: 'bg-tertiary-fixed text-on-tertiary-fixed border-[#4ae176]' };
      case 'CANCELED':
        return { label: 'Cancelada', bg: 'bg-error-container text-on-error-container border-error/20' };
      default:
        return { label: status, bg: 'bg-surface-container text-on-surface-variant border-outline-variant' };
    }
  };

  const badge = getStatusBadge(workOrder.status);

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto py-2 animate-in fade-in duration-200">
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
              Ordem de Serviço {workOrder.orderNumber || `#OS-${workOrder.id.slice(0, 8).toUpperCase()}`}
            </h1>
            <span className={`px-3 py-1 rounded-full font-label-sm text-[11px] font-bold border ${badge.bg}`}>
              {badge.label}
            </span>
          </div>

          <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
            Cliente: <span className="font-semibold text-on-surface">{workOrder.customerName}</span> •
            Veículo:{' '}
            <span className="font-semibold text-on-surface">
              {workOrder.vehicleBrand} {workOrder.vehicleModel}
            </span>{' '}
            • Placa:{' '}
            <span className="font-mono font-bold text-primary">
              {formatLicensePlate(workOrder.licensePlate)}
            </span>
            {workOrder.serviceBay && (
              <>
                {' '}
                • Box:{' '}
                <span className="font-mono font-bold text-on-surface">{workOrder.serviceBay}</span>
              </>
            )}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {!isCompleted && !isCanceled && (
            <>
              {/* Quick Status Buttons */}
              {workOrder.status !== 'IN_PROGRESS' && (
                <button
                  type="button"
                  onClick={() => changeStatusMutation.mutate('IN_PROGRESS')}
                  disabled={changeStatusMutation.isPending}
                  className="px-3.5 py-2 bg-surface border border-outline-variant text-primary hover:bg-surface-container rounded-lg font-label-md text-label-md font-semibold transition-colors flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[18px]">play_arrow</span>
                  Iniciar Reparo
                </button>
              )}

              {workOrder.status !== 'WAITING_PARTS' && (
                <button
                  type="button"
                  onClick={() => changeStatusMutation.mutate('WAITING_PARTS')}
                  disabled={changeStatusMutation.isPending}
                  className="px-3.5 py-2 bg-surface border border-outline-variant text-error hover:bg-surface-container rounded-lg font-label-md text-label-md font-semibold transition-colors flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[18px]">pause</span>
                  Aguardar Peças
                </button>
              )}

              {workOrder.status !== 'WAITING_CUSTOMER' && (
                <button
                  type="button"
                  onClick={() => changeStatusMutation.mutate('WAITING_CUSTOMER')}
                  disabled={changeStatusMutation.isPending}
                  className="px-3.5 py-2 bg-surface border border-outline-variant text-on-surface-variant hover:bg-surface-container rounded-lg font-label-md text-label-md font-semibold transition-colors flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[18px]">schedule</span>
                  Aguardar Cliente
                </button>
              )}

              {/* Complete Work Order */}
              <button
                type="button"
                onClick={() => setCompleteModalOpen(true)}
                className="px-5 py-2 bg-primary text-on-primary font-label-md text-label-md font-bold rounded-lg hover:bg-primary-container transition-all shadow-sm flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[18px]">check_circle</span>
                Finalizar Ordem de Serviço
              </button>
            </>
          )}

          {isCompleted && (
            <span className="px-4 py-2 bg-tertiary/15 text-tertiary font-label-md text-label-md font-bold rounded-lg flex items-center gap-2 border border-tertiary/30">
              <span className="material-symbols-outlined text-[20px]">verified</span>
              OS Finalizada em{' '}
              {workOrder.completedAt
                ? new Date(workOrder.completedAt).toLocaleDateString('pt-BR')
                : 'Data registrada'}
            </span>
          )}
        </div>
      </header>

      {/* 3-Column Layout: Left (Services Checklist), Middle (Parts Used), Right (Vehicle & Diagnostics) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Column 1: Task Checklist (Span 4) */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <section className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 shadow-xs flex flex-col gap-3">
            <div className="flex items-center justify-between pb-2 border-b border-outline-variant">
              <h2 className="font-label-md text-label-md font-bold text-on-surface uppercase tracking-wider">
                Checklist de Serviços
              </h2>
              <span className="font-label-sm text-label-sm font-bold text-primary font-mono">
                {completedServices} / {services.length} Concluídos
              </span>
            </div>

            <div className="space-y-2">
              {services.length === 0 ? (
                <div className="py-8 text-center text-on-surface-variant">
                  <span className="material-symbols-outlined text-[28px] text-outline">task</span>
                  <p className="text-body-sm font-medium mt-1">Nenhum serviço registrado.</p>
                </div>
              ) : (
                services.map((item) => {
                  const isItemDone = item.status === 'COMPLETED';
                  const isItemInProgress = item.status === 'IN_PROGRESS';

                  return (
                    <div
                      key={item.id}
                      onClick={() => handleToggleItemStatus(item.id)}
                      className={`p-3 rounded-lg border transition-all cursor-pointer flex items-start gap-3 ${
                        isItemDone
                          ? 'bg-surface border-outline-variant/60 opacity-80'
                          : isItemInProgress
                          ? 'bg-primary-container/10 border-primary-container/40'
                          : 'bg-surface-container-low border-outline-variant hover:bg-surface-container'
                      }`}
                    >
                      <button
                        type="button"
                        disabled={isCompleted || isCanceled}
                        className="mt-0.5 text-primary focus:outline-none"
                      >
                        <span className="material-symbols-outlined text-[22px]">
                          {isItemDone
                            ? 'check_box'
                            : isItemInProgress
                            ? 'indeterminate_check_box'
                            : 'check_box_outline_blank'}
                        </span>
                      </button>

                      <div className="flex-1 min-w-0">
                        <p
                          className={`font-medium text-body-md text-on-surface leading-tight ${
                            isItemDone ? 'line-through opacity-70' : ''
                          }`}
                        >
                          {item.name}
                        </p>
                        {item.description && (
                          <p className="text-[11px] text-on-surface-variant mt-0.5">
                            {item.description}
                          </p>
                        )}
                        <div className="flex items-center justify-between text-[11px] text-on-surface-variant mt-1.5 pt-1 border-t border-outline-variant/40">
                          <span className="font-mono">
                            Qtd: {item.quantity}h •{' '}
                            {(item.totalAmount || 0).toLocaleString('pt-BR', {
                              style: 'currency',
                              currency: 'BRL',
                            })}
                          </span>
                          <span
                            className={`font-bold ${
                              isItemDone
                                ? 'text-tertiary'
                                : isItemInProgress
                                ? 'text-primary'
                                : 'text-on-surface-variant'
                            }`}
                          >
                            {isItemDone
                              ? 'Concluído'
                              : isItemInProgress
                              ? 'Em Andamento'
                              : 'Pendente'}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {!isCompleted && !isCanceled && (
              <button
                type="button"
                onClick={() => {
                  setAddItemType('SERVICE');
                  setAddItemModalOpen(true);
                }}
                className="w-full py-2 border border-dashed border-outline-variant rounded-lg text-on-surface-variant hover:text-primary hover:border-primary font-label-sm text-label-sm font-semibold transition-colors flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">add</span>
                Adicionar Serviço
              </button>
            )}
          </section>
        </div>

        {/* Column 2: Parts & Materials Used (Span 5) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <section className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-xs flex flex-col">
            <div className="p-4 bg-surface border-b border-outline-variant flex items-center justify-between">
              <h2 className="font-label-md text-label-md font-bold text-on-surface uppercase tracking-wider">
                Peças & Materiais ({parts.length})
              </h2>
              {!isCompleted && !isCanceled && (
                <button
                  type="button"
                  onClick={() => {
                    setAddItemType('PART');
                    setAddItemModalOpen(true);
                  }}
                  className="px-2.5 py-1 text-primary hover:bg-surface-container rounded-lg font-label-sm text-label-sm font-semibold transition-colors flex items-center gap-1 border border-outline-variant"
                >
                  <span className="material-symbols-outlined text-[16px]">add</span>
                  Adicionar Peça
                </button>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[380px]">
                <thead className="bg-surface-container-low font-label-sm text-label-sm text-on-surface-variant uppercase border-b border-outline-variant">
                  <tr>
                    <th className="py-2.5 px-3">Item / Peça</th>
                    <th className="py-2.5 px-2 text-right w-16">Qtd</th>
                    <th className="py-2.5 px-2 text-right w-24">Unit.</th>
                    <th className="py-2.5 px-3 text-right w-24">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant text-body-sm">
                  {parts.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-on-surface-variant">
                        <span className="material-symbols-outlined text-[28px] text-outline">
                          build
                        </span>
                        <p className="text-body-sm font-medium mt-1">Nenhuma peça utilizada.</p>
                      </td>
                    </tr>
                  ) : (
                    parts.map((p) => (
                      <tr key={p.id} className="hover:bg-surface-bright transition-colors">
                        <td className="py-2.5 px-3 font-medium text-on-surface">
                          <div>{p.name}</div>
                          {p.description && (
                            <div className="text-[10px] text-on-surface-variant">{p.description}</div>
                          )}
                        </td>
                        <td className="py-2.5 px-2 text-right font-mono">{p.quantity}</td>
                        <td className="py-2.5 px-2 text-right font-mono">
                          {(p.unitPrice || 0).toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          })}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-on-surface">
                          {(p.totalAmount || 0).toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          })}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Financial Totals in Middle Column */}
            <div className="p-4 border-t border-outline-variant bg-surface-container-low flex flex-col gap-2 text-body-sm">
              <div className="flex justify-between items-center text-on-surface-variant">
                <span>Subtotal Peças</span>
                <span className="font-medium text-on-surface">
                  {(workOrder.totalPartsAmount || 0).toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  })}
                </span>
              </div>
              <div className="flex justify-between items-center text-on-surface-variant">
                <span>Subtotal Serviços</span>
                <span className="font-medium text-on-surface">
                  {(workOrder.totalServicesAmount || 0).toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  })}
                </span>
              </div>
              {workOrder.discountAmount > 0 && (
                <div className="flex justify-between items-center text-error">
                  <span>Desconto</span>
                  <span>
                    -
                    {workOrder.discountAmount.toLocaleString('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    })}
                  </span>
                </div>
              )}
              <div className="h-px bg-outline-variant my-1"></div>
              <div className="flex justify-between items-center">
                <span className="font-headline-sm text-headline-sm font-bold text-on-surface">
                  Total Geral
                </span>
                <span className="font-headline-sm text-headline-sm font-bold text-primary font-mono">
                  {(workOrder.totalAmount || 0).toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  })}
                </span>
              </div>
            </div>
          </section>
        </div>

        {/* Column 3: Vehicle, Customer & Diagnostics (Span 3) */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          {/* Vehicle Card */}
          <section className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 shadow-xs space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-outline-variant">
              <span className="material-symbols-outlined text-primary text-[20px]">directions_car</span>
              <h3 className="font-label-md text-label-md font-bold text-on-surface uppercase">
                Veículo & Cliente
              </h3>
            </div>

            <div>
              <p className="font-bold text-on-surface text-body-md">
                {workOrder.vehicleBrand} {workOrder.vehicleModel}
              </p>
              <p className="text-[12px] text-on-surface-variant">
                Ano: {workOrder.vehicleYear || 'N/A'} • Odômetro:{' '}
                {workOrder.startMileage ? `${workOrder.startMileage.toLocaleString('pt-BR')} km` : 'N/A'}
              </p>
              <p className="font-mono font-bold text-primary text-[12px] mt-1">
                Placa: {formatLicensePlate(workOrder.licensePlate)}
              </p>
            </div>

            <div className="pt-2 border-t border-outline-variant">
              <p className="font-semibold text-on-surface text-body-sm">{workOrder.customerName}</p>
              {workOrder.customerPhone && (
                <p className="text-[12px] text-on-surface-variant flex items-center gap-1 mt-0.5">
                  <span className="material-symbols-outlined text-[14px]">phone</span>
                  {workOrder.customerPhone}
                </p>
              )}
            </div>
          </section>

          {/* Technical & Diagnosis Notes */}
          <section className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 shadow-xs space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-outline-variant">
              <span className="material-symbols-outlined text-primary text-[20px]">description</span>
              <h3 className="font-label-md text-label-md font-bold text-on-surface uppercase">
                Notas Técnicas
              </h3>
            </div>

            {workOrder.diagnosisNotes && (
              <div>
                <span className="text-[10px] font-bold text-on-surface-variant uppercase block">
                  Diagnóstico Inicial
                </span>
                <p className="text-body-sm text-on-surface mt-0.5 leading-relaxed bg-surface p-2.5 rounded-lg border border-outline-variant">
                  {workOrder.diagnosisNotes}
                </p>
              </div>
            )}

            {workOrder.technicalNotes && (
              <div>
                <span className="text-[10px] font-bold text-on-surface-variant uppercase block">
                  Parecer Técnico
                </span>
                <p className="text-body-sm text-on-surface mt-0.5 leading-relaxed bg-surface p-2.5 rounded-lg border border-outline-variant">
                  {workOrder.technicalNotes}
                </p>
              </div>
            )}

            {!workOrder.diagnosisNotes && !workOrder.technicalNotes && (
              <p className="text-[12px] text-on-surface-variant italic">
                Nenhuma nota técnica registrada.
              </p>
            )}
          </section>
        </div>
      </div>

      {/* Complete Work Order Modal */}
      {completeModalOpen && (
        <CompleteWorkOrderModal
          workOrderId={workOrderId}
          currentMileage={workOrder.startMileage}
          onClose={() => setCompleteModalOpen(false)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['operations', 'work-order', workOrderId] });
            queryClient.invalidateQueries({ queryKey: ['operations', 'work-orders'] });
            setCompleteModalOpen(false);
          }}
        />
      )}

      {/* Add Item Modal */}
      {addItemModalOpen && (
        <AddWorkOrderItemModal
          initialType={addItemType}
          onClose={() => setAddItemModalOpen(false)}
          onAdd={(newItem) => {
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
          }}
        />
      )}
    </div>
  );
}

// -------------------------------------------------------------
// Component: CompleteWorkOrderModal
// -------------------------------------------------------------
interface CompleteWorkOrderModalProps {
  workOrderId: string;
  currentMileage?: number;
  onClose: () => void;
  onSuccess: () => void;
}

function CompleteWorkOrderModal({
  workOrderId,
  currentMileage,
  onClose,
  onSuccess,
}: CompleteWorkOrderModalProps) {
  const [endMileage, setEndMileage] = useState<number | ''>(currentMileage || '');
  const [technicalNotes, setTechnicalNotes] = useState('');
  const [customerNotes, setCustomerNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const completeMutation = useMutation({
    mutationFn: () =>
      operationsApi.completeWorkOrder(workOrderId, {
        endMileage: endMileage !== '' ? Number(endMileage) : undefined,
        technicalNotes: technicalNotes.trim() || undefined,
        customerNotes: customerNotes.trim() || undefined,
      }),
    onSuccess,
    onError: (err) => {
      setErrorMsg(getApiErrorMessage(err, 'Erro ao finalizar Ordem de Serviço.'));
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    completeMutation.mutate();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-outline-variant pb-3">
          <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-tertiary text-[24px]">verified</span>
            Finalizar Ordem de Serviço
          </h3>
          <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 bg-error-container text-on-error-container rounded-lg text-body-sm font-medium">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-label-sm text-label-sm text-on-surface-variant font-medium mb-1">
              Quilometragem Final (Odômetro)
            </label>
            <input
              type="number"
              min={currentMileage || 0}
              placeholder="Ex: 45050"
              value={endMileage}
              onChange={(e) => setEndMileage(e.target.value ? parseInt(e.target.value) : '')}
              className="w-full h-10 px-3 bg-surface border border-outline-variant rounded-lg text-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none"
            />
          </div>

          <div>
            <label className="block font-label-sm text-label-sm text-on-surface-variant font-medium mb-1">
              Parecer Técnico de Encerramento
            </label>
            <textarea
              rows={3}
              placeholder="Serviços executados com sucesso, testes de rodagem realizados..."
              value={technicalNotes}
              onChange={(e) => setTechnicalNotes(e.target.value)}
              className="w-full p-2.5 bg-surface border border-outline-variant rounded-lg text-body-sm text-on-surface resize-none focus:border-primary focus:ring-1 focus:ring-primary outline-none"
            ></textarea>
          </div>

          <div>
            <label className="block font-label-sm text-label-sm text-on-surface-variant font-medium mb-1">
              Recomendações ao Cliente
            </label>
            <textarea
              rows={2}
              placeholder="Revisar pastilhas em 10.000 km, verificar alinhamento..."
              value={customerNotes}
              onChange={(e) => setCustomerNotes(e.target.value)}
              className="w-full p-2.5 bg-surface border border-outline-variant rounded-lg text-body-sm text-on-surface resize-none focus:border-primary focus:ring-1 focus:ring-primary outline-none"
            ></textarea>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-outline-variant">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-outline-variant rounded-lg font-label-md text-label-md text-on-surface hover:bg-surface-container"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={completeMutation.isPending}
              className="px-5 py-2 bg-primary text-on-primary rounded-lg font-label-md text-label-md font-bold hover:bg-primary-container transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {completeMutation.isPending && (
                <span className="material-symbols-outlined animate-spin text-[16px]">
                  progress_activity
                </span>
              )}
              Confirmar Conclusão
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// Component: AddWorkOrderItemModal
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onAdd({
      type,
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
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-outline-variant pb-3">
          <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">
            Adicionar {type === 'SERVICE' ? 'Serviço' : 'Peça'}
          </h3>
          <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setType('SERVICE')}
              className={`flex-1 py-2 rounded-lg font-label-sm text-label-sm font-bold transition-colors ${
                type === 'SERVICE'
                  ? 'bg-primary text-on-primary'
                  : 'bg-surface border border-outline-variant text-on-surface-variant'
              }`}
            >
              Serviço (Mão de Obra)
            </button>
            <button
              type="button"
              onClick={() => setType('PART')}
              className={`flex-1 py-2 rounded-lg font-label-sm text-label-sm font-bold transition-colors ${
                type === 'PART'
                  ? 'bg-primary text-on-primary'
                  : 'bg-surface border border-outline-variant text-on-surface-variant'
              }`}
            >
              Peça / Material
            </button>
          </div>

          <div>
            <label className="block font-label-sm text-label-sm text-on-surface-variant font-medium mb-1">
              Nome / Descrição <span className="text-error">*</span>
            </label>
            <input
              type="text"
              required
              placeholder={type === 'SERVICE' ? 'Ex: Troca de pastilhas' : 'Ex: Pastilha Dianteira Cerâmica'}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-10 px-3 bg-surface border border-outline-variant rounded-lg text-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-label-sm text-label-sm text-on-surface-variant font-medium mb-1">
                {type === 'SERVICE' ? 'Horas / Qtd' : 'Quantidade'}
              </label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                required
                value={quantity}
                onChange={(e) => setQuantity(parseFloat(e.target.value) || 1)}
                className="w-full h-10 px-3 bg-surface border border-outline-variant rounded-lg text-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none"
              />
            </div>

            <div>
              <label className="block font-label-sm text-label-sm text-on-surface-variant font-medium mb-1">
                Preço Unitário (R$)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={unitPrice}
                onChange={(e) => setUnitPrice(parseFloat(e.target.value) || 0)}
                className="w-full h-10 px-3 bg-surface border border-outline-variant rounded-lg text-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-label-sm text-label-sm text-on-surface-variant font-medium mb-1">
              Observações Adicionais
            </label>
            <input
              type="text"
              placeholder="Ex: Marca OEM, especificação..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full h-10 px-3 bg-surface border border-outline-variant rounded-lg text-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-outline-variant">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-outline-variant rounded-lg font-label-md text-label-md text-on-surface hover:bg-surface-container"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-primary text-on-primary rounded-lg font-label-md text-label-md font-bold hover:bg-primary-container transition-all"
            >
              Adicionar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
