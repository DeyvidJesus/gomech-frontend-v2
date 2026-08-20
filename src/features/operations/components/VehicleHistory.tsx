import { useQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { operationsApi } from '../api/operationsApi';
import { formatLicensePlate } from '@/features/crm/utils/validators';
import type {
  VehicleHistoryWorkOrder,
  VehicleHistoryInspection,
  WorkOrderStatus,
  InspectionStatus,
  InspectionItemStatus,
} from '../types';

interface VehicleHistoryProps {
  vehicleId: string;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatDate(iso?: string): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function formatDatetime(iso?: string): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function getWorkOrderStatusLabel(status: WorkOrderStatus): string {
  const map: Record<WorkOrderStatus, string> = {
    DRAFT: 'Rascunho',
    OPEN: 'Aberta',
    IN_PROGRESS: 'Em Andamento',
    WAITING_PARTS: 'Aguardando Peças',
    WAITING_CUSTOMER: 'Aguardando Cliente',
    COMPLETED: 'Concluída',
    CANCELED: 'Cancelada',
  };
  return map[status] ?? status;
}

function getWorkOrderStatusColor(status: WorkOrderStatus): string {
  switch (status) {
    case 'COMPLETED':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'IN_PROGRESS':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'WAITING_PARTS':
      return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'WAITING_CUSTOMER':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'CANCELED':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'OPEN':
      return 'bg-sky-100 text-sky-800 border-sky-200';
    default:
      return 'bg-surface-container text-on-surface-variant border-outline-variant';
  }
}

function getInspectionStatusLabel(status: InspectionStatus): string {
  const map: Record<InspectionStatus, string> = {
    DRAFT: 'Rascunho',
    IN_PROGRESS: 'Em Andamento',
    COMPLETED: 'Concluída',
    CANCELED: 'Cancelada',
  };
  return map[status] ?? status;
}

function getItemStatusColor(status: InspectionItemStatus): string {
  switch (status) {
    case 'OK':
      return 'text-green-600';
    case 'ATTENTION':
      return 'text-amber-600';
    case 'CRITICAL':
      return 'text-red-600';
    default:
      return 'text-on-surface-variant';
  }
}

function getItemStatusIcon(status: InspectionItemStatus): string {
  switch (status) {
    case 'OK':
      return 'check_circle';
    case 'ATTENTION':
      return 'warning';
    case 'CRITICAL':
      return 'error';
    default:
      return 'remove_circle';
  }
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function MetricCard({
  icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: string;
  label: string;
  value: string;
  sub?: string;
  accent?: string;
}) {
  return (
    <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-5 flex flex-col gap-3 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wide">
          {label}
        </span>
        <div
          className={`w-9 h-9 rounded-xl flex items-center justify-center ${accent ?? 'bg-primary-container'}`}
        >
          <span className={`material-symbols-outlined icon-fill text-[20px] ${accent ? 'text-white' : 'text-primary'}`}>
            {icon}
          </span>
        </div>
      </div>
      <div>
        <p className="font-headline-md text-headline-md font-bold text-on-surface leading-tight">
          {value}
        </p>
        {sub && (
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">{sub}</p>
        )}
      </div>
    </div>
  );
}

function WorkOrderTimelineCard({ order }: { order: VehicleHistoryWorkOrder }) {
  const services = order.items.filter((i) => i.type === 'SERVICE');
  const parts = order.items.filter((i) => i.type === 'PART');

  return (
    <div className="relative pl-8">
      {/* Timeline dot */}
      <div className="absolute left-0 top-4 -translate-x-1/2 w-4 h-4 rounded-full bg-primary border-2 border-surface-container-lowest ring-2 ring-primary/20 z-10" />

      <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant overflow-hidden hover:shadow-md transition-shadow">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 pt-5 pb-4 border-b border-outline-variant">
          <div className="flex items-center gap-3 flex-wrap">
            <div>
              <p className="font-title-md text-title-md font-bold text-on-surface">
                OS {order.orderNumber ?? order.id.slice(0, 8).toUpperCase()}
              </p>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                {formatDatetime(order.completedAt ?? order.mileageAtService?.toString())}
                {order.mileageAtService && (
                  <> · <span className="font-medium">{order.mileageAtService.toLocaleString('pt-BR')} km</span></>
                )}
                {order.mechanicName && (
                  <> · Mecânico: <span className="font-medium">{order.mechanicName}</span></>
                )}
              </p>
            </div>
            <span
              className={`px-3 py-1 rounded-full border font-label-sm text-label-sm font-semibold ${getWorkOrderStatusColor(order.status)}`}
            >
              {getWorkOrderStatusLabel(order.status)}
            </span>
          </div>
          <div className="text-right shrink-0">
            <p className="font-title-lg text-title-lg font-bold text-primary">
              {formatCurrency(order.totalAmount)}
            </p>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Serv. {formatCurrency(order.totalServicesAmount)} · Peças {formatCurrency(order.totalPartsAmount)}
            </p>
          </div>
        </div>

        {/* Items */}
        <div className="px-5 py-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          {services.length > 0 && (
            <div>
              <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wide mb-2">
                Serviços
              </p>
              <ul className="space-y-1">
                {services.map((s) => (
                  <li key={s.id} className="flex items-start gap-2">
                    <span className="material-symbols-outlined icon-fill text-[16px] text-primary mt-0.5 shrink-0">
                      build
                    </span>
                    <div className="min-w-0">
                      <span className="font-body-sm text-body-sm text-on-surface">
                        {s.name}
                        {s.quantity > 1 && (
                          <span className="text-on-surface-variant"> ×{s.quantity}</span>
                        )}
                      </span>
                      <span className="float-right font-label-sm text-label-sm text-on-surface-variant ml-4">
                        {formatCurrency(s.totalAmount)}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {parts.length > 0 && (
            <div>
              <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wide mb-2">
                Peças
              </p>
              <ul className="space-y-1">
                {parts.map((p) => (
                  <li key={p.id} className="flex items-start gap-2">
                    <span className="material-symbols-outlined icon-fill text-[16px] text-secondary mt-0.5 shrink-0">
                      settings
                    </span>
                    <div className="min-w-0">
                      <span className="font-body-sm text-body-sm text-on-surface">
                        {p.name}
                        {p.quantity > 1 && (
                          <span className="text-on-surface-variant"> ×{p.quantity}</span>
                        )}
                      </span>
                      <span className="float-right font-label-sm text-label-sm text-on-surface-variant ml-4">
                        {formatCurrency(p.totalAmount)}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {services.length === 0 && parts.length === 0 && (
            <p className="col-span-2 font-body-sm text-body-sm text-on-surface-variant italic">
              Sem itens registrados nesta OS.
            </p>
          )}
        </div>

        {/* Technical Notes */}
        {order.technicalNotes && (
          <div className="mx-5 mb-4 p-3 bg-surface-container rounded-xl border border-outline-variant">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="material-symbols-outlined icon-fill text-[16px] text-on-surface-variant">
                sticky_note_2
              </span>
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wide">
                Notas Técnicas
              </span>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface">{order.technicalNotes}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function InspectionCard({ inspection }: { inspection: VehicleHistoryInspection }) {
  const criticalItems = inspection.items.filter((i) => i.status === 'CRITICAL');
  const attentionItems = inspection.items.filter((i) => i.status === 'ATTENTION');

  return (
    <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <p className="font-title-sm text-title-sm font-bold text-on-surface">
            Vistoria · {formatDate(inspection.completedAt)}
          </p>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            {inspection.currentMileage
              ? `${inspection.currentMileage.toLocaleString('pt-BR')} km`
              : 'Quilometragem não registrada'}
            {' · '}
            {inspection.totalItems} itens verificados
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {inspection.okItems > 0 && (
            <span className="flex items-center gap-1 px-2 py-0.5 bg-green-50 text-green-700 rounded-full border border-green-200 font-label-sm text-label-sm">
              <span className="material-symbols-outlined icon-fill text-[14px]">check_circle</span>
              {inspection.okItems} OK
            </span>
          )}
          {inspection.attentionItems > 0 && (
            <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-700 rounded-full border border-amber-200 font-label-sm text-label-sm">
              <span className="material-symbols-outlined icon-fill text-[14px]">warning</span>
              {inspection.attentionItems} Atenção
            </span>
          )}
          {inspection.criticalItems > 0 && (
            <span className="flex items-center gap-1 px-2 py-0.5 bg-red-50 text-red-700 rounded-full border border-red-200 font-label-sm text-label-sm">
              <span className="material-symbols-outlined icon-fill text-[14px]">error</span>
              {inspection.criticalItems} Crítico
            </span>
          )}
          <span
            className={`px-3 py-0.5 rounded-full border font-label-sm text-label-sm font-semibold ${
              inspection.status === 'COMPLETED'
                ? 'bg-green-100 text-green-800 border-green-200'
                : inspection.status === 'IN_PROGRESS'
                ? 'bg-blue-100 text-blue-800 border-blue-200'
                : 'bg-surface-container text-on-surface-variant border-outline-variant'
            }`}
          >
            {getInspectionStatusLabel(inspection.status)}
          </span>
        </div>
      </div>

      {/* Highlight critical/attention items */}
      {(criticalItems.length > 0 || attentionItems.length > 0) && (
        <div className="space-y-1.5">
          {[...criticalItems, ...attentionItems].map((item) => (
            <div
              key={item.id}
              className="flex items-start gap-2 p-2 rounded-lg bg-surface-container"
            >
              <span
                className={`material-symbols-outlined icon-fill text-[16px] mt-0.5 shrink-0 ${getItemStatusColor(item.status)}`}
              >
                {getItemStatusIcon(item.status)}
              </span>
              <div>
                <p className="font-body-sm text-body-sm font-medium text-on-surface">{item.name}</p>
                {item.recommendedAction && (
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    → {item.recommendedAction}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {inspection.generalNotes && (
        <p className="mt-3 font-body-sm text-body-sm text-on-surface-variant italic">
          {inspection.generalNotes}
        </p>
      )}
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function VehicleHistory({ vehicleId }: VehicleHistoryProps) {
  const navigate = useNavigate();

  const {
    data: history,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['operations', 'vehicle-history', vehicleId],
    queryFn: () => operationsApi.getVehicleHistory(vehicleId),
  });

  const handlePrint = () => window.print();

  if (isLoading) {
    return (
      <div className="py-24 text-center text-on-surface-variant">
        <span className="material-symbols-outlined animate-spin text-[32px] text-primary">
          progress_activity
        </span>
        <p className="mt-2 font-medium">Carregando histórico do veículo...</p>
      </div>
    );
  }

  if (isError || !history) {
    return (
      <div className="py-16 text-center text-error bg-surface-container-lowest rounded-2xl border border-outline-variant max-w-lg mx-auto">
        <span className="material-symbols-outlined text-[48px]">error</span>
        <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface mt-2">
          Histórico não encontrado
        </h2>
        <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
          {(error as Error)?.message || 'Não foi possível carregar o histórico deste veículo.'}
        </p>
        <button
          onClick={() => navigate({ to: '/crm/vehicles' })}
          className="mt-4 px-4 py-2 bg-primary text-on-primary rounded-lg font-label-md text-label-md font-bold"
        >
          Voltar para Veículos
        </button>
      </div>
    );
  }

  const { vehicle, customer, metrics, workOrders, inspections } = history;
  const displayPlate = vehicle.formattedLicensePlate ?? formatLicensePlate(vehicle.licensePlate);

  // Sort work orders newest first
  const sortedOrders = [...workOrders].sort((a, b) => {
    const dateA = a.completedAt ? new Date(a.completedAt).getTime() : 0;
    const dateB = b.completedAt ? new Date(b.completedAt).getTime() : 0;
    return dateB - dateA;
  });

  const sortedInspections = [...inspections].sort((a, b) => {
    const dateA = a.completedAt ? new Date(a.completedAt).getTime() : 0;
    const dateB = b.completedAt ? new Date(b.completedAt).getTime() : 0;
    return dateB - dateA;
  });

  return (
    <div className="space-y-6 print:space-y-4">
      {/* ── Page Header ──────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate({ to: '/crm/vehicles' })}
            className="p-2 rounded-xl text-on-surface-variant hover:bg-surface-container-high transition-colors print:hidden"
            title="Voltar"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="font-headline-md text-headline-md font-bold text-on-surface">
                {vehicle.brand} {vehicle.model}
              </h1>
              <span className="px-3 py-1 bg-primary-container text-primary font-mono font-bold text-sm rounded-lg tracking-widest">
                {displayPlate}
              </span>
              {vehicle.year && (
                <span className="font-body-md text-body-md text-on-surface-variant">
                  {vehicle.year}
                </span>
              )}
              {vehicle.color && (
                <span className="font-body-md text-body-md text-on-surface-variant">
                  · {vehicle.color}
                </span>
              )}
            </div>
            <p className="font-body-md text-body-md text-on-surface-variant mt-1">
              <span className="material-symbols-outlined icon-fill text-[16px] align-text-bottom mr-1">
                person
              </span>
              {customer.name}
              {customer.phone && <span className="ml-2 text-sm">· {customer.phone}</span>}
              {customer.email && <span className="ml-2 text-sm">· {customer.email}</span>}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 print:hidden">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 border border-outline rounded-xl font-label-md text-label-md font-semibold text-on-surface hover:bg-surface-container-high transition-colors"
          >
            <span className="material-symbols-outlined icon-fill text-[18px]">print</span>
            Exportar Dossiê
          </button>
          <button
            onClick={() =>
              navigate({
                to: '/operations/inspections/new',
                search: { vehicleId, customerId: customer.id } as never,
              })
            }
            className="flex items-center gap-2 px-4 py-2 bg-primary text-on-primary rounded-xl font-label-md text-label-md font-semibold hover:bg-primary/90 transition-colors"
          >
            <span className="material-symbols-outlined icon-fill text-[18px]">add</span>
            Nova Vistoria
          </button>
        </div>
      </div>

      {/* ── Metric Cards ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <MetricCard
          icon="payments"
          label="Total Gasto"
          value={formatCurrency(metrics.totalSpent)}
          accent="bg-primary"
        />
        <MetricCard
          icon="receipt_long"
          label="Visitas"
          value={String(metrics.totalServicesCount)}
          sub="ordens de serviço"
        />
        <MetricCard
          icon="trending_up"
          label="Ticket Médio"
          value={formatCurrency(metrics.averageTicket)}
        />
        <MetricCard
          icon="speed"
          label="Última KM"
          value={
            metrics.lastRecordedMileage
              ? `${metrics.lastRecordedMileage.toLocaleString('pt-BR')} km`
              : '—'
          }
        />
        <MetricCard
          icon="settings"
          label="Peças Trocadas"
          value={String(metrics.totalPartsReplacedCount)}
          sub="itens substituídos"
        />
        <MetricCard
          icon="calendar_today"
          label="Último Serviço"
          value={formatDate(metrics.lastServiceDate)}
          sub={metrics.firstServiceDate ? `desde ${formatDate(metrics.firstServiceDate)}` : undefined}
        />
      </div>

      {/* ── Main Content: Timeline + Inspections ─────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Timeline of Work Orders */}
        <div className="xl:col-span-2">
          <h2 className="font-title-lg text-title-lg font-bold text-on-surface mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined icon-fill text-primary text-[20px]">
              timeline
            </span>
            Histórico de Manutenções
          </h2>

          {sortedOrders.length === 0 ? (
            <div className="py-12 text-center bg-surface-container-lowest rounded-2xl border border-outline-variant">
              <span className="material-symbols-outlined text-[48px] text-on-surface-variant">
                history
              </span>
              <p className="font-body-md text-body-md text-on-surface-variant mt-2">
                Nenhuma ordem de serviço registrada para este veículo.
              </p>
            </div>
          ) : (
            <div className="relative space-y-6">
              {/* Vertical line */}
              <div className="absolute left-0 top-4 bottom-4 w-px bg-outline-variant" />
              {sortedOrders.map((order) => (
                <WorkOrderTimelineCard key={order.id} order={order} />
              ))}
            </div>
          )}
        </div>

        {/* Inspection History */}
        <div>
          <h2 className="font-title-lg text-title-lg font-bold text-on-surface mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined icon-fill text-secondary text-[20px]">
              fact_check
            </span>
            Vistorias Técnicas
          </h2>

          {sortedInspections.length === 0 ? (
            <div className="py-12 text-center bg-surface-container-lowest rounded-2xl border border-outline-variant">
              <span className="material-symbols-outlined text-[48px] text-on-surface-variant">
                fact_check
              </span>
              <p className="font-body-md text-body-md text-on-surface-variant mt-2">
                Nenhuma vistoria registrada.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {sortedInspections.map((inspection) => (
                <InspectionCard key={inspection.id} inspection={inspection} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
