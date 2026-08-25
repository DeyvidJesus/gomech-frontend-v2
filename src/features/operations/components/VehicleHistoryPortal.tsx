import { useQuery } from '@tanstack/react-query';
import { operationsApi } from '../api/operationsApi';
import { formatLicensePlate } from '@/features/crm/utils/validators';
import type { VehicleHistoryWorkOrder, VehicleHistoryInspection, WorkOrderStatus } from '../types';

interface VehicleHistoryPortalProps {
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
    month: 'long',
    year: 'numeric',
  });
}

function getWorkOrderStatusLabel(status: WorkOrderStatus): string {
  const map: Record<WorkOrderStatus, string> = {
    DRAFT: 'Rascunho',
    OPEN: 'Aberta',
    IN_PROGRESS: 'Em Andamento',
    WAITING_PARTS: 'Aguardando Peças',
    WAITING_CUSTOMER: 'Aguardando Você',
    COMPLETED: 'Concluída',
    CANCELED: 'Cancelada',
  };
  return map[status] ?? status;
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function PortalMetricCard({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <div className="flex flex-col items-center gap-2 p-5 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 text-center">
      <span className="material-symbols-outlined icon-fill text-[28px] text-white/80">{icon}</span>
      <p className="font-headline-sm text-headline-sm font-bold text-white">{value}</p>
      <p className="font-label-sm text-label-sm text-white/70">{label}</p>
    </div>
  );
}

function PortalOrderCard({ order }: { order: VehicleHistoryWorkOrder }) {
  const services = order.items.filter((i) => i.type === 'SERVICE');
  const parts = order.items.filter((i) => i.type === 'PART');
  const isCompleted = order.status === 'COMPLETED';

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      {/* Header */}
      <div
        className={`px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
          isCompleted ? 'bg-green-50 border-b border-green-100' : 'bg-slate-50 border-b border-slate-100'
        }`}
      >
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-title-md text-title-md font-bold text-slate-800">
              OS {order.orderNumber ?? order.id.slice(0, 8).toUpperCase()}
            </p>
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                isCompleted
                  ? 'bg-green-100 text-green-700'
                  : 'bg-blue-100 text-blue-700'
              }`}
            >
              {getWorkOrderStatusLabel(order.status)}
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-0.5">
            {formatDate(order.completedAt)}
            {order.mileageAtService && (
              <> · {order.mileageAtService.toLocaleString('pt-BR')} km</>
            )}
          </p>
        </div>
        <div className="text-right">
          <p className="font-title-lg text-title-lg font-bold text-slate-900">
            {formatCurrency(order.totalAmount)}
          </p>
        </div>
      </div>

      {/* Items */}
      <div className="px-6 py-4 space-y-4">
        {services.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Serviços Realizados
            </p>
            <ul className="space-y-1.5">
              {services.map((s) => (
                <li key={s.id} className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                    <span className="text-sm text-slate-700">
                      {s.name}
                      {s.quantity > 1 && <span className="text-slate-400"> ×{s.quantity}</span>}
                    </span>
                  </div>
                  <span className="text-sm text-slate-500 shrink-0">
                    {formatCurrency(s.totalAmount)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {parts.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Peças Substituídas
            </p>
            <ul className="space-y-1.5">
              {parts.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                    <span className="text-sm text-slate-700">
                      {p.name}
                      {p.quantity > 1 && <span className="text-slate-400"> ×{p.quantity}</span>}
                    </span>
                  </div>
                  <span className="text-sm text-slate-500 shrink-0">
                    {formatCurrency(p.totalAmount)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {services.length === 0 && parts.length === 0 && (
          <p className="text-sm text-slate-400 italic">Sem itens detalhados registrados.</p>
        )}

        {order.technicalNotes && (
          <div className="mt-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
            <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">
              Observações Técnicas
            </p>
            <p className="text-sm text-slate-600">{order.technicalNotes}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function PortalInspectionSummary({ inspection }: { inspection: VehicleHistoryInspection }) {
  const criticalItems = inspection.items.filter((i) => i.status === 'CRITICAL');
  const attentionItems = inspection.items.filter((i) => i.status === 'ATTENTION');

  const hasConcerns = criticalItems.length > 0 || attentionItems.length > 0;

  return (
    <div className="bg-white rounded-xl border border-slate-100 p-4">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <p className="font-semibold text-slate-800">Vistoria · {formatDate(inspection.completedAt)}</p>
          <p className="text-sm text-slate-400">
            {inspection.currentMileage
              ? `${inspection.currentMileage.toLocaleString('pt-BR')} km`
              : 'KM não registrada'}
            {' · '}
            {inspection.totalItems} itens verificados
          </p>
        </div>
        <div className="flex gap-1.5 flex-wrap justify-end">
          {inspection.criticalItems > 0 && (
            <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-semibold">
              {inspection.criticalItems} Crítico
            </span>
          )}
          {inspection.attentionItems > 0 && (
            <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs font-semibold">
              {inspection.attentionItems} Atenção
            </span>
          )}
          {inspection.okItems > 0 && (
            <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
              {inspection.okItems} OK
            </span>
          )}
        </div>
      </div>

      {hasConcerns && (
        <div className="space-y-1">
          {[...criticalItems, ...attentionItems].slice(0, 4).map((item) => (
            <div key={item.id} className="flex items-start gap-2 text-sm">
              <span
                className={`shrink-0 mt-0.5 material-symbols-outlined icon-fill text-[14px] ${
                  item.status === 'CRITICAL' ? 'text-red-500' : 'text-amber-500'
                }`}
              >
                {item.status === 'CRITICAL' ? 'error' : 'warning'}
              </span>
              <span className="text-slate-600">{item.name}</span>
            </div>
          ))}
          {criticalItems.length + attentionItems.length > 4 && (
            <p className="text-xs text-slate-400 pl-5">
              e mais {criticalItems.length + attentionItems.length - 4} item(s)…
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function VehicleHistoryPortal({ vehicleId }: VehicleHistoryPortalProps) {
  const {
    data: history,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['portal', 'vehicle-history', vehicleId],
    queryFn: () => operationsApi.getVehicleHistory(vehicleId),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600 font-medium">Carregando dossiê do veículo...</p>
        </div>
      </div>
    );
  }

  if (isError || !history) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center max-w-[480px]">
          <span className="material-symbols-outlined text-[56px] text-slate-300 block mb-3">
            car_repair
          </span>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Histórico não disponível</h2>
          <p className="text-sm text-slate-500">
            {(error as Error)?.message || 'Não encontramos registros para o veículo informado ou o link expirou.'}
          </p>
        </div>
      </div>
    );
  }

  const { vehicle, customer, metrics, workOrders, inspections } = history;
  const displayPlate = vehicle.formattedLicensePlate ?? formatLicensePlate(vehicle.licensePlate);

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
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* ── Hero Header ──────────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 px-4 pt-12 pb-24">
        <div className="max-w-[800px] mx-auto text-center">
          {/* GoMech Brand */}
          <div className="flex items-center justify-center gap-2 mb-8">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
              <span className="material-symbols-outlined icon-fill text-white text-[18px]">
                precision_manufacturing
              </span>
            </div>
            <span className="text-white font-bold text-lg">GoMech</span>
          </div>

          {/* Vehicle Info */}
          <p className="text-blue-200 text-sm font-medium uppercase tracking-widest mb-2">
            Dossiê de Manutenções
          </p>
          <h1 className="text-4xl font-bold text-white mb-2">
            {vehicle.brand} {vehicle.model}
          </h1>
          <div className="flex items-center justify-center gap-3 flex-wrap mb-1">
            <span className="px-4 py-1.5 bg-white/20 backdrop-blur-sm rounded-lg font-mono font-bold text-white text-lg tracking-widest">
              {displayPlate}
            </span>
            {vehicle.year && (
              <span className="text-blue-200 font-medium">{vehicle.year}</span>
            )}
            {vehicle.color && (
              <span className="text-blue-200">· {vehicle.color}</span>
            )}
          </div>
          <p className="text-blue-200 mt-2">
            Proprietário: <span className="text-white font-semibold">{customer.name}</span>
          </p>

          {/* Print Button */}
          <button
            onClick={() => window.print()}
            className="mt-6 flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white border border-white/30 rounded-xl text-sm font-semibold transition-colors mx-auto print:hidden"
          >
            <span className="material-symbols-outlined icon-fill text-[18px]">download</span>
            Baixar / Imprimir Dossiê
          </button>
        </div>
      </div>

      {/* ── Metric Cards (overlapping hero) ──────────────────────────── */}
      <div className="max-w-[800px] mx-auto px-4 -mt-12">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
          <PortalMetricCard
            icon="payments"
            label="Total Investido"
            value={formatCurrency(metrics.totalSpent)}
          />
          <PortalMetricCard
            icon="receipt_long"
            label="Visitas à Oficina"
            value={String(metrics.totalServicesCount)}
          />
          <PortalMetricCard
            icon="settings"
            label="Peças Trocadas"
            value={String(metrics.totalPartsReplacedCount)}
          />
        </div>

        {/* Last Service & Mileage banner */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 flex flex-col sm:flex-row justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
              <span className="material-symbols-outlined icon-fill text-blue-600 text-[20px]">
                calendar_today
              </span>
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
                Primeiro Serviço
              </p>
              <p className="font-semibold text-slate-800">{formatDate(metrics.firstServiceDate)}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
              <span className="material-symbols-outlined icon-fill text-green-600 text-[20px]">
                event_available
              </span>
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
                Último Serviço
              </p>
              <p className="font-semibold text-slate-800">{formatDate(metrics.lastServiceDate)}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
              <span className="material-symbols-outlined icon-fill text-amber-600 text-[20px]">
                speed
              </span>
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
                Última Quilometragem
              </p>
              <p className="font-semibold text-slate-800">
                {metrics.lastRecordedMileage
                  ? `${metrics.lastRecordedMileage.toLocaleString('pt-BR')} km`
                  : '—'}
              </p>
            </div>
          </div>
        </div>

        {/* ── Maintenance Timeline ──────────────────────────────────── */}
        <section className="mb-8">
          <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined icon-fill text-blue-600 text-[20px]">
              timeline
            </span>
            Histórico de Manutenções
          </h2>

          {sortedOrders.length === 0 ? (
            <div className="py-10 text-center bg-white rounded-2xl border border-slate-100">
              <span className="material-symbols-outlined text-[40px] text-slate-300">history</span>
              <p className="text-slate-400 mt-2">Nenhuma ordem de serviço registrada.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {sortedOrders.map((order) => (
                <PortalOrderCard key={order.id} order={order} />
              ))}
            </div>
          )}
        </section>

        {/* ── Inspection History ────────────────────────────────────── */}
        {sortedInspections.length > 0 && (
          <section className="mb-8">
            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined icon-fill text-indigo-600 text-[20px]">
                fact_check
              </span>
              Vistorias Técnicas
            </h2>
            <div className="space-y-3">
              {sortedInspections.map((inspection) => (
                <PortalInspectionSummary key={inspection.id} inspection={inspection} />
              ))}
            </div>
          </section>
        )}

        {/* ── Footer ───────────────────────────────────────────────── */}
        <footer className="text-center py-8 text-slate-400 text-sm border-t border-slate-100">
          <p>
            Dossiê gerado por{' '}
            <span className="font-semibold text-blue-600">GoMech</span> · Sistema de Gestão de
            Oficina
          </p>
          <p className="mt-1">
            Gerado em {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
          </p>
        </footer>
      </div>
    </div>
  );
}
