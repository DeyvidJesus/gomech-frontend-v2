import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { operationsApi } from '../api/operationsApi';
import type {
  InspectionCategory,
  InspectionItemStatus,
  InspectionResponse,
  SaveInspectionItemRequest,
} from '../types';
import { formatLicensePlate } from '@/features/crm/utils/validators';

interface InspectionExecutionProps {
  inspectionId: string;
}

const CATEGORIES: { key: InspectionCategory | 'ALL'; label: string; icon: string }[] = [
  { key: 'ALL', label: 'Todos os Itens', icon: 'list_alt' },
  { key: 'TIRES', label: 'Pneus & Rodas', icon: 'tire_repair' },
  { key: 'BRAKES', label: 'Sistema de Freios', icon: 'brake_alert' },
  { key: 'SUSPENSION', label: 'Suspensão & Direção', icon: 'swap_driving_apps_wheel' },
  { key: 'ENGINE', label: 'Motor & Câmbio', icon: 'settings' },
  { key: 'FLUIDS', label: 'Fluidos & Óleo', icon: 'oil_barrel' },
  { key: 'ELECTRICAL', label: 'Elétrica & Bateria', icon: 'electric_bolt' },
  { key: 'SAFETY', label: 'Segurança & Visibilidade', icon: 'verified_user' },
  { key: 'BODYWORK', label: 'Lataria & Estrutura', icon: 'minor_crash' },
];

export function InspectionExecution({ inspectionId }: InspectionExecutionProps) {
  // Fetch Inspection details
  const { data: inspection, isLoading, isError, error } = useQuery({
    queryKey: ['operations', 'inspection', inspectionId],
    queryFn: () => operationsApi.getInspectionById(inspectionId),
  });

  if (isLoading) {
    return (
      <div className="py-24 text-center text-on-surface-variant">
        <span className="material-symbols-outlined animate-spin text-[32px] text-primary">
          progress_activity
        </span>
        <p className="mt-2 font-medium">Carregando checklist da vistoria...</p>
      </div>
    );
  }

  if (isError || !inspection) {
    return (
      <div className="py-16 text-center text-error">
        Erro ao carregar vistoria: {(error as Error)?.message || 'Vistoria não encontrada'}
      </div>
    );
  }

  return <InspectionExecutionContent key={inspection.id} inspection={inspection} />;
}

interface InspectionExecutionContentProps {
  inspection: InspectionResponse;
}

function InspectionExecutionContent({ inspection }: InspectionExecutionContentProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const inspectionId = inspection.id;

  const [activeCategory, setActiveCategory] = useState<InspectionCategory | 'ALL'>('ALL');
  const [itemsState, setItemsState] = useState<SaveInspectionItemRequest[]>(() =>
    (inspection.items || []).map((item) => ({
      id: item.id,
      category: item.category,
      name: item.name,
      status: item.status,
      notes: item.notes || '',
      recommendedAction: item.recommendedAction || '',
      photoUrls: item.photoUrls || '',
    }))
  );
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(false);
  const [completeNotes, setCompleteNotes] = useState('');
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);

  // Save Items Mutation (Draft)
  const saveItemsMutation = useMutation({
    mutationFn: (items: SaveInspectionItemRequest[]) =>
      operationsApi.updateInspectionItems(inspectionId, items),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operations', 'inspection', inspectionId] });
      setSaveSuccessMsg(true);
      setTimeout(() => setSaveSuccessMsg(false), 3000);
    },
  });

  // Complete Inspection Mutation
  const completeMutation = useMutation({
    mutationFn: (notes?: string) =>
      operationsApi.completeInspection(inspectionId, { generalNotes: notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operations', 'inspection', inspectionId] });
      setCompleteDialogOpen(false);
    },
  });

  const isCompleted = inspection.status === 'COMPLETED';

  // Handle status toggle for an item
  const handleItemStatusChange = (index: number, newStatus: InspectionItemStatus) => {
    if (isCompleted) return;
    setItemsState((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], status: newStatus };
      return updated;
    });
  };

  // Handle notes/recommended action change
  const handleItemFieldChange = (
    index: number,
    field: 'notes' | 'recommendedAction',
    value: string
  ) => {
    if (isCompleted) return;
    setItemsState((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  // Calculate live counters
  const { okCount, attentionCount, criticalCount } = useMemo(() => {
    let ok = 0;
    let att = 0;
    let crit = 0;
    itemsState.forEach((item) => {
      if (item.status === 'OK') ok++;
      else if (item.status === 'ATTENTION') att++;
      else if (item.status === 'CRITICAL') crit++;
    });
    return { okCount: ok, attentionCount: att, criticalCount: crit };
  }, [itemsState]);

  // Filtered items based on active category tab
  const filteredItemsWithOriginalIndex = useMemo(() => {
    return itemsState
      .map((item, originalIndex) => ({ item, originalIndex }))
      .filter(({ item }) => activeCategory === 'ALL' || item.category === activeCategory);
  }, [itemsState, activeCategory]);

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'TIRES':
        return 'Pneus & Rodas';
      case 'BRAKES':
        return 'Freios';
      case 'SUSPENSION':
        return 'Suspensão';
      case 'ENGINE':
        return 'Motor';
      case 'FLUIDS':
        return 'Fluidos';
      case 'ELECTRICAL':
        return 'Elétrica';
      case 'SAFETY':
        return 'Segurança';
      case 'BODYWORK':
        return 'Lataria';
      default:
        return category;
    }
  };

  const getFuelLabel = (fuel?: string) => {
    switch (fuel) {
      case 'EMPTY':
        return 'Vazio (E)';
      case 'RESERVE':
        return 'Reserva';
      case 'ONE_QUARTER':
        return '1/4';
      case 'HALF':
        return '1/2 (Meio)';
      case 'THREE_QUARTERS':
        return '3/4';
      case 'FULL':
        return 'Cheio (F)';
      default:
        return fuel || 'Não informado';
    }
  };

  const getInspectionStatusLabel = (status: string) => {
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

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto py-4 animate-in fade-in duration-200">
      {/* Top Bar Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-outline-variant">
        <div>
          <div className="flex items-center gap-2 text-on-surface-variant mb-1">
            <button
              type="button"
              onClick={() => navigate({ to: '/operations/inspections' })}
              className="hover:text-primary transition-colors flex items-center gap-1 font-label-sm text-label-sm uppercase tracking-wider"
            >
              <span className="material-symbols-outlined text-[16px]">arrow_back</span>
              Vistorias
            </button>
            <span className="text-outline">/</span>
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface">
              {isCompleted ? 'Laudo Técnico' : 'Execução do Checklist'}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-headline-lg text-headline-lg font-bold text-on-surface">
              {inspection.vehicleBrand} {inspection.vehicleModel}
            </h1>
            <span className="px-2.5 py-1 bg-surface-container rounded-lg border border-outline-variant font-mono font-bold text-body-sm text-primary">
              {formatLicensePlate(inspection.licensePlate)}
            </span>
            <span
              className={`px-2.5 py-0.5 rounded-full font-label-sm text-[11px] font-bold ${
                isCompleted
                  ? 'bg-tertiary text-on-tertiary'
                  : 'bg-primary-fixed text-on-primary-fixed'
              }`}
            >
              {getInspectionStatusLabel(inspection.status)}
            </span>
          </div>

          <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
            Cliente: <span className="font-semibold text-on-surface">{inspection.customerName}</span>
            {inspection.customerPhone && ` • ${inspection.customerPhone}`}
            {inspection.currentMileage && ` • Km: ${inspection.currentMileage.toLocaleString()} km`}
            {inspection.fuelLevel && ` • Combustível: ${getFuelLabel(inspection.fuelLevel)}`}
          </p>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-3">
          {saveSuccessMsg && (
            <span className="text-tertiary font-label-sm text-[12px] font-bold flex items-center gap-1 animate-in fade-in">
              <span className="material-symbols-outlined text-[16px]">check</span>
              Checklist salvo!
            </span>
          )}

          {!isCompleted ? (
            <>
              <button
                type="button"
                onClick={() => saveItemsMutation.mutate(itemsState)}
                disabled={saveItemsMutation.isPending}
                className="px-4 py-2 bg-surface-container-lowest border border-outline-variant text-on-surface font-label-md text-label-md font-semibold rounded-lg hover:bg-surface-container transition-colors shadow-xs flex items-center gap-2"
              >
                {saveItemsMutation.isPending ? (
                  <span className="material-symbols-outlined animate-spin text-[16px]">
                    progress_activity
                  </span>
                ) : (
                  <span className="material-symbols-outlined text-[16px]">save</span>
                )}
                Salvar Rascunho
              </button>

              <button
                type="button"
                onClick={() => setCompleteDialogOpen(true)}
                className="px-5 py-2 bg-primary text-on-primary font-label-md text-label-md font-bold rounded-lg hover:bg-primary-container transition-all shadow-sm active:translate-y-px flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">verified</span>
                Finalizar Vistoria
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() =>
                navigate({
                  to: '/operations/quotes/new' as never,
                  search: { fromInspection: inspection.id } as never,
                })
              }
              className="px-5 py-2 bg-primary text-on-primary font-label-md text-label-md font-bold rounded-lg hover:bg-primary-container transition-all shadow-sm flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">request_quote</span>
              Gerar Orçamento a partir desta Vistoria
            </button>
          )}
        </div>
      </header>

      {/* KPI Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Total Items */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 shadow-xs">
          <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">
            Total de Itens
          </span>
          <div className="font-headline-md text-headline-md font-bold text-on-surface mt-1">
            {itemsState.length}
          </div>
        </div>

        {/* OK */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 shadow-xs">
          <span className="font-label-sm text-label-sm text-tertiary font-bold flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px]">check_circle</span>
            Itens Conformidade (OK)
          </span>
          <div className="font-headline-md text-headline-md font-bold text-tertiary mt-1">
            {okCount}
          </div>
        </div>

        {/* Attention */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 shadow-xs">
          <span className="font-label-sm text-label-sm text-on-secondary-container font-bold flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px]">warning</span>
            Atenção / Preventiva
          </span>
          <div className="font-headline-md text-headline-md font-bold text-secondary mt-1">
            {attentionCount}
          </div>
        </div>

        {/* Critical */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 shadow-xs">
          <span className="font-label-sm text-label-sm text-error font-bold flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px]">error</span>
            Críticos / Substituição
          </span>
          <div className="font-headline-md text-headline-md font-bold text-error mt-1">
            {criticalCount}
          </div>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-outline-variant">
        {CATEGORIES.map((cat) => {
          const isSelected = activeCategory === cat.key;
          return (
            <button
              key={cat.key}
              type="button"
              onClick={() => setActiveCategory(cat.key)}
              className={`px-3.5 py-2 rounded-lg font-label-md text-label-md flex items-center gap-2 whitespace-nowrap transition-all ${
                isSelected
                  ? 'bg-primary text-on-primary font-bold shadow-xs'
                  : 'bg-surface-container-lowest border border-outline-variant text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">{cat.icon}</span>
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Checklist Items Container */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-xs divide-y divide-outline-variant">
        {filteredItemsWithOriginalIndex.map(({ item, originalIndex }) => {
          const isProblematic = item.status === 'ATTENTION' || item.status === 'CRITICAL';

          return (
            <div
              key={originalIndex}
              className={`p-4 sm:p-5 transition-colors ${
                item.status === 'CRITICAL'
                  ? 'bg-error-container/10 border-l-4 border-l-error'
                  : item.status === 'ATTENTION'
                  ? 'bg-secondary-container/15 border-l-4 border-l-secondary'
                  : 'hover:bg-surface-bright'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* Item Name & Category */}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-label-sm text-[10px] uppercase font-bold text-on-surface-variant px-1.5 py-0.5 bg-surface-container rounded">
                      {getCategoryLabel(item.category)}
                    </span>
                    <h3 className="font-semibold text-on-surface text-body-md sm:text-body-lg">
                      {item.name}
                    </h3>
                  </div>
                </div>

                {/* Status Switcher Buttons */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {/* OK */}
                  <button
                    type="button"
                    disabled={isCompleted}
                    onClick={() => handleItemStatusChange(originalIndex, 'OK')}
                    className={`px-3 py-1.5 rounded-lg font-label-sm text-label-sm font-bold flex items-center gap-1 transition-all ${
                      item.status === 'OK'
                        ? 'bg-tertiary text-on-tertiary shadow-xs'
                        : 'bg-surface border border-outline-variant text-on-surface-variant hover:border-tertiary'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">check_circle</span>
                    OK
                  </button>

                  {/* ATTENTION */}
                  <button
                    type="button"
                    disabled={isCompleted}
                    onClick={() => handleItemStatusChange(originalIndex, 'ATTENTION')}
                    className={`px-3 py-1.5 rounded-lg font-label-sm text-label-sm font-bold flex items-center gap-1 transition-all ${
                      item.status === 'ATTENTION'
                        ? 'bg-secondary text-on-secondary shadow-xs'
                        : 'bg-surface border border-outline-variant text-on-surface-variant hover:border-secondary'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">warning</span>
                    Atenção
                  </button>

                  {/* CRITICAL */}
                  <button
                    type="button"
                    disabled={isCompleted}
                    onClick={() => handleItemStatusChange(originalIndex, 'CRITICAL')}
                    className={`px-3 py-1.5 rounded-lg font-label-sm text-label-sm font-bold flex items-center gap-1 transition-all ${
                      item.status === 'CRITICAL'
                        ? 'bg-error text-on-error shadow-xs'
                        : 'bg-surface border border-outline-variant text-on-surface-variant hover:border-error'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">error</span>
                    Crítico
                  </button>

                  {/* N/A */}
                  <button
                    type="button"
                    disabled={isCompleted}
                    onClick={() => handleItemStatusChange(originalIndex, 'NOT_APPLICABLE')}
                    className={`px-2.5 py-1.5 rounded-lg font-label-sm text-label-sm font-medium transition-all ${
                      item.status === 'NOT_APPLICABLE'
                        ? 'bg-surface-container-highest text-on-surface font-bold'
                        : 'bg-surface border border-outline-variant text-outline hover:text-on-surface'
                    }`}
                  >
                    N/A
                  </button>
                </div>
              </div>

              {/* Recommended Action & Notes when Attention or Critical */}
              {isProblematic && (
                <div className="mt-3.5 pt-3.5 border-t border-outline-variant/60 grid grid-cols-1 sm:grid-cols-2 gap-3 animate-in fade-in">
                  <div>
                    <label className="block text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">
                      Ação Recomendada / Sugestão de Orçamento
                    </label>
                    <input
                      type="text"
                      disabled={isCompleted}
                      placeholder="Ex: Troca das pastilhas e retífica dos discos dianteiros..."
                      value={item.recommendedAction || ''}
                      onChange={(e) =>
                        handleItemFieldChange(originalIndex, 'recommendedAction', e.target.value)
                      }
                      className="w-full h-9 px-3 bg-surface border border-outline-variant rounded-lg text-body-sm font-body-sm text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">
                      Laudo / Observação Técnica
                    </label>
                    <input
                      type="text"
                      disabled={isCompleted}
                      placeholder="Ex: Espessura residual de 2mm, desgaste irregular..."
                      value={item.notes || ''}
                      onChange={(e) =>
                        handleItemFieldChange(originalIndex, 'notes', e.target.value)
                      }
                      className="w-full h-9 px-3 bg-surface border border-outline-variant rounded-lg text-body-sm font-body-sm text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Complete Inspection Modal / Dialog */}
      {completeDialogOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4">
            <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[24px]">verified</span>
              Finalizar Vistoria Veicular
            </h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Ao finalizar, o laudo técnico será congelado e ficará disponível para a equipe técnica
              e geração de orçamentos.
            </p>

            <div className="bg-surface-container-low rounded-xl p-3 border border-outline-variant/60 flex justify-between text-[12px] font-bold">
              <span className="text-tertiary">{okCount} Itens OK</span>
              <span className="text-secondary">{attentionCount} Atenção</span>
              <span className="text-error">{criticalCount} Críticos</span>
            </div>

            <div>
              <label className="block font-label-sm text-label-sm text-on-surface-variant font-medium mb-1">
                Parecer Técnico Geral / Recomendações Finais
              </label>
              <textarea
                rows={3}
                placeholder="Resumo geral das condições do veículo para o cliente..."
                value={completeNotes}
                onChange={(e) => setCompleteNotes(e.target.value)}
                className="w-full p-3 bg-surface border border-outline-variant rounded-lg text-body-sm font-body-sm text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-none"
              ></textarea>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCompleteDialogOpen(false)}
                className="px-4 py-2 border border-outline-variant text-on-surface rounded-lg font-label-md text-label-md hover:bg-surface-container transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => completeMutation.mutate(completeNotes)}
                disabled={completeMutation.isPending}
                className="px-6 py-2 bg-primary text-on-primary rounded-lg font-label-md text-label-md font-bold hover:bg-primary-container transition-all shadow-sm disabled:opacity-50 flex items-center gap-2"
              >
                {completeMutation.isPending && (
                  <span className="material-symbols-outlined animate-spin text-[18px]">
                    progress_activity
                  </span>
                )}
                Confirmar e Finalizar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
