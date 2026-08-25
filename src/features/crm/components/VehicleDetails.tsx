import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { crmApi } from '../api/crmApi';
import { operationsApi } from '@/features/operations/api/operationsApi';
import { formatLicensePlate } from '../utils/validators';
import { VehicleForm } from './VehicleForm';

interface VehicleDetailsProps {
  vehicleId: string;
}

export function VehicleDetails({ vehicleId }: VehicleDetailsProps) {
  const [activeTab, setActiveTab] = useState<'timeline' | 'parts' | 'inspections' | 'edit'>('timeline');

  // 1. Fetch Vehicle Basic Data
  const { data: vehicle, isLoading: isLoadingVehicle } = useQuery({
    queryKey: ['crm', 'vehicle', vehicleId],
    queryFn: () => crmApi.getVehicleById(vehicleId),
  });

  // 2. Fetch Complete Vehicle Service History & Metrics
  const { data: historyData, isLoading: isLoadingHistory } = useQuery({
    queryKey: ['operations', 'vehicle-history', vehicleId],
    queryFn: () => operationsApi.getVehicleHistory(vehicleId),
  });

  const metrics = historyData?.metrics;
  const workOrders = historyData?.workOrders || [];
  const inspections = historyData?.inspections || [];
  const customer = historyData?.customer;

  if (isLoadingVehicle || isLoadingHistory) {
    return (
      <div className="flex flex-col items-center justify-center p-12">
        <span className="material-symbols-outlined animate-spin text-[36px] text-primary">
          progress_activity
        </span>
        <p className="mt-3 text-sm text-on-surface-variant">Carregando prontuário e histórico do veículo...</p>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="bg-surface-container-lowest p-8 rounded-2xl border border-outline-variant text-center max-w-[540px] mx-auto">
        <span className="material-symbols-outlined text-[48px] text-error">no_crash</span>
        <h2 className="text-xl font-bold text-on-surface mt-2">Veículo não encontrado</h2>
        <p className="text-sm text-on-surface-variant mt-1">O registro pode ter sido excluído.</p>
        <Link
          to="/crm/vehicles"
          className="mt-4 inline-flex items-center gap-1 px-4 py-2 bg-primary text-on-primary rounded-xl text-xs font-bold shadow-sm"
        >
          Voltar para Frota de Veículos
        </Link>
      </div>
    );
  }

  // Extract all parts replaced across all work orders
  const replacedParts = workOrders.flatMap((wo) =>
    (wo.items || [])
      .filter((item) => item.type === 'PART')
      .map((part) => ({
        ...part,
        workOrderId: wo.id,
        completedAt: wo.completedAt || new Date().toISOString(),
        mileage: wo.mileageAtService,
      }))
  );

  return (
    <div className="max-w-[1400px] mx-auto space-y-6 pb-12">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs text-on-surface-variant">
        <Link to="/crm/vehicles" className="hover:text-primary transition-colors flex items-center gap-1">
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          Veículos
        </Link>
        <span>/</span>
        <span className="text-on-surface font-semibold">{formatLicensePlate(vehicle.licensePlate)}</span>
      </div>

      {/* Hero Header Card */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-secondary-fixed text-secondary flex items-center justify-center shadow-xs">
            <span className="material-symbols-outlined text-[36px]">directions_car</span>
          </div>
          <div>
            <div className="flex items-center gap-3">
              <span className="bg-surface-container-highest border border-outline-variant font-mono font-black text-base px-3 py-1 rounded-md shadow-xs">
                {formatLicensePlate(vehicle.licensePlate)}
              </span>
              <h1 className="text-2xl font-bold text-on-surface tracking-tight">
                {vehicle.brand} {vehicle.model}
              </h1>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-xs text-on-surface-variant">
              {vehicle.year && <span>Ano: <strong>{vehicle.year}</strong></span>}
              {vehicle.currentMileage && (
                <span>Km Atual: <strong>{vehicle.currentMileage.toLocaleString()} km</strong></span>
              )}
            </div>
          </div>
        </div>

        {/* Owner Card & Actions */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full md:w-auto">
          {customer && (
            <Link
              to="/crm/customers/$id"
              params={{ id: customer.id }}
              className="p-3 bg-surface-container/40 border border-outline-variant hover:bg-surface-container rounded-xl flex items-center gap-3 transition-colors shadow-2xs"
            >
              <div className="w-8 h-8 rounded-lg bg-primary text-on-primary flex items-center justify-center font-bold text-xs">
                {customer.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="text-left">
                <span className="text-[10px] uppercase font-bold text-on-surface-variant block">Proprietário</span>
                <span className="text-xs font-bold text-on-surface hover:text-primary">{customer.name}</span>
              </div>
            </Link>
          )}

          <button
            type="button"
            onClick={() => setActiveTab(activeTab === 'edit' ? 'timeline' : 'edit')}
            className="px-4 py-2 bg-surface-container border border-outline-variant hover:bg-surface-container-high text-on-surface text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-xs"
          >
            <span className="material-symbols-outlined text-[16px]">edit</span>
            {activeTab === 'edit' ? 'Ver Histórico' : 'Editar Veículo'}
          </button>
        </div>
      </div>

      {/* Metrics Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-surface-container-lowest border border-outline-variant p-4 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-on-surface-variant mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Atendimentos</span>
            <span className="material-symbols-outlined text-primary text-[18px]">build</span>
          </div>
          <span className="text-2xl font-black text-on-surface">{metrics?.totalServicesCount || workOrders.length}</span>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant p-4 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-on-surface-variant mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Peças Trocadas</span>
            <span className="material-symbols-outlined text-secondary text-[18px]">category</span>
          </div>
          <span className="text-2xl font-black text-on-surface">{metrics?.totalPartsReplacedCount || replacedParts.length}</span>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant p-4 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-on-surface-variant mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Ticket Médio</span>
            <span className="material-symbols-outlined text-tertiary text-[18px]">trending_up</span>
          </div>
          <span className="text-2xl font-black font-mono text-on-surface">
            R$ {Number(metrics?.averageTicket || 0).toFixed(2)}
          </span>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant p-4 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-on-surface-variant mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Investido</span>
            <span className="material-symbols-outlined text-primary text-[18px]">payments</span>
          </div>
          <span className="text-2xl font-black font-mono text-primary">
            R$ {Number(metrics?.totalSpent || 0).toFixed(2)}
          </span>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-outline-variant flex gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('timeline')}
          className={`pb-3 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === 'timeline'
              ? 'border-primary text-primary'
              : 'border-transparent text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">history</span>
          Histórico de Serviços ({workOrders.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('parts')}
          className={`pb-3 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === 'parts'
              ? 'border-primary text-primary'
              : 'border-transparent text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">build_circle</span>
          Peças Trocadas ({replacedParts.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('inspections')}
          className={`pb-3 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === 'inspections'
              ? 'border-primary text-primary'
              : 'border-transparent text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">fact_check</span>
          Vistorias & Checklists ({inspections.length})
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'edit' && (
        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 shadow-sm">
          <VehicleForm vehicleId={vehicleId} />
        </div>
      )}

      {activeTab === 'timeline' && (
        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 shadow-sm">
          <h3 className="text-base font-bold text-on-surface mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[20px]">timeline</span>
            Linha do Tempo de Manutenções
          </h3>

          {workOrders.length === 0 ? (
            <div className="py-8 text-center text-on-surface-variant">
              <span className="material-symbols-outlined text-[36px] text-outline mb-2">hourglass_empty</span>
              <p className="text-sm font-semibold">Nenhuma Ordem de Serviço registrada para este veículo.</p>
            </div>
          ) : (
            <div className="relative pl-6 border-l-2 border-outline-variant/60 space-y-8">
              {workOrders.map((wo) => (
                <div key={wo.id} className="relative group">
                  {/* Timeline dot */}
                  <div className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full bg-primary border-4 border-surface-container-lowest shadow-xs" />

                  <div className="bg-surface-container/30 border border-outline-variant hover:border-primary/50 rounded-2xl p-5 transition-all shadow-xs space-y-3">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-outline-variant/60 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-on-surface">
                            OS #{wo.orderNumber || wo.id.slice(0, 8)}
                          </span>
                          <span className="px-2 py-0.5 bg-surface-container-highest rounded-full text-[10px] font-bold uppercase">
                            {wo.status}
                          </span>
                        </div>
                        {wo.completedAt && (
                          <p className="text-xs text-on-surface-variant mt-0.5">
                            Concluída em {new Date(wo.completedAt).toLocaleDateString('pt-BR')}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        {wo.mileageAtService && (
                          <span className="text-xs font-mono font-semibold bg-surface-container px-2.5 py-1 rounded-lg">
                            {wo.mileageAtService.toLocaleString()} km
                          </span>
                        )}
                        <span className="font-mono font-black text-sm text-primary">
                          R$ {Number(wo.totalAmount || 0).toFixed(2)}
                        </span>
                        <Link
                          to="/operations/work-orders/$id"
                          params={{ id: wo.id }}
                          className="text-xs font-bold text-primary hover:underline ml-2"
                        >
                          Ver OS
                        </Link>
                      </div>
                    </div>

                    {/* Services and Parts list */}
                    {wo.items && wo.items.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        <span className="text-[11px] font-bold uppercase text-on-surface-variant tracking-wider">Itens Executados:</span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {wo.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center text-xs bg-surface-container-lowest p-2 rounded-lg border border-outline-variant/60">
                              <span className="font-medium truncate pr-2">
                                <span className={`mr-1.5 font-bold ${item.type === 'SERVICE' ? 'text-secondary' : 'text-primary'}`}>
                                  [{item.type === 'SERVICE' ? 'Serviço' : 'Peça'}]
                                </span>
                                {item.name || item.description}
                              </span>
                              <span className="font-mono font-semibold shrink-0">
                                R$ {Number(item.totalAmount).toFixed(2)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {wo.technicalNotes && (
                      <p className="text-xs text-on-surface-variant bg-surface-container-lowest p-3 rounded-lg border border-outline-variant/60">
                        <strong className="text-on-surface">Observações Técnicas:</strong> {wo.technicalNotes}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'parts' && (
        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 shadow-sm">
          <h3 className="text-base font-bold text-on-surface mb-4">Peças e Componentes Substituídos</h3>
          <div className="border border-outline-variant rounded-xl overflow-x-auto shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-container/60 border-b border-outline-variant uppercase font-bold text-on-surface-variant">
                <tr>
                  <th className="py-3 px-4">Peça / Componente</th>
                  <th className="py-3 px-4 text-center">Qtd</th>
                  <th className="py-3 px-4">Data da Troca</th>
                  <th className="py-3 px-4">Km no Serviço</th>
                  <th className="py-3 px-4 text-right">Valor</th>
                  <th className="py-3 px-4 text-center">OS Origem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/60">
                {replacedParts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-on-surface-variant">
                      Nenhuma peça registrada no histórico deste veículo.
                    </td>
                  </tr>
                ) : (
                  replacedParts.map((p, idx) => (
                    <tr key={idx} className="hover:bg-surface-container/20 transition-colors">
                      <td className="py-3 px-4 font-semibold text-on-surface">
                        {p.name || p.description}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {Number(p.quantity)}
                      </td>
                      <td className="py-3 px-4 text-on-surface-variant">
                        {new Date(p.completedAt).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="py-3 px-4 font-mono">
                        {p.mileage ? `${p.mileage.toLocaleString()} km` : '-'}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold">
                        R$ {Number(p.totalAmount).toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Link
                          to="/operations/work-orders/$id"
                          params={{ id: p.workOrderId }}
                          className="font-mono text-primary font-bold hover:underline"
                        >
                          #{p.workOrderId.slice(0, 8)}
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'inspections' && (
        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 shadow-sm">
          <h3 className="text-base font-bold text-on-surface mb-4">Vistorias Realizadas</h3>
          <div className="border border-outline-variant rounded-xl overflow-x-auto shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-container/60 border-b border-outline-variant uppercase font-bold text-on-surface-variant">
                <tr>
                  <th className="py-3 px-4">Vistoria ID</th>
                  <th className="py-3 px-4">Itens Conformes</th>
                  <th className="py-3 px-4">Atenção / Crítico</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/60">
                {inspections.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-on-surface-variant">
                      Nenhuma vistoria registrada para este veículo.
                    </td>
                  </tr>
                ) : (
                  inspections.map((insp) => (
                    <tr key={insp.id} className="hover:bg-surface-container/20 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-primary">
                        #{insp.id.slice(0, 8)}
                      </td>
                      <td className="py-3 px-4 text-success font-semibold">
                        {insp.okItems} / {insp.totalItems} OK
                      </td>
                      <td className="py-3 px-4 text-warning font-semibold">
                        {insp.attentionItems + insp.criticalItems} alerta(s)
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 bg-surface-container rounded-full font-bold text-[10px] uppercase">
                          {insp.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Link
                          to="/operations/inspections/$id"
                          params={{ id: insp.id }}
                          className="text-xs font-bold text-primary hover:underline"
                        >
                          Ver Laudo
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
