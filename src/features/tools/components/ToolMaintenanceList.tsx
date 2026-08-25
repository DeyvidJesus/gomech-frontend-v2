import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { motion, AnimatePresence } from 'framer-motion';
import { toolsApi } from '../api/toolsApi';
import type { ToolMaintenance, MaintenanceType, MaintenanceStatus, ScheduleMaintenanceDto, CompleteMaintenanceDto } from '../types';
import { useAuthStore } from '@/features/iam/stores/authStore';

export function ToolMaintenanceList() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const unitId = user?.activeUnitId || '';

  const [page, setPage] = useState(0);
  const [selectedStatus, setSelectedStatus] = useState<MaintenanceStatus | ''>('');
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [completeModalItem, setCompleteModalItem] = useState<ToolMaintenance | null>(null);

  // Form states for scheduling
  const [selectedToolId, setSelectedToolId] = useState('');
  const [maintenanceType, setMaintenanceType] = useState<MaintenanceType>('CALIBRATION');
  const [scheduledDate, setScheduledDate] = useState('');
  const [performedByProvider, setPerformedByProvider] = useState('');
  const [estimatedCost, setEstimatedCost] = useState<number | ''>('');
  const [description, setDescription] = useState('');
  const [scheduleError, setScheduleError] = useState<string | null>(null);

  // Form states for completion
  const [actualCost, setActualCost] = useState<number | ''>('');
  const [findings, setFindings] = useState('');
  const [nextDueDate, setNextDueDate] = useState('');
  const [completeError, setCompleteError] = useState<string | null>(null);

  // Fetch maintenances
  const { data: maintenancesResponse, isLoading } = useQuery({
    queryKey: ['tools', 'maintenances', unitId, selectedStatus, page],
    queryFn: () =>
      toolsApi
        .getMaintenances(unitId || undefined, selectedStatus || undefined, undefined, page, 15)
        .then((r) => r.data),
  });

  // Fetch available tools for scheduling
  const { data: toolsData } = useQuery({
    queryKey: ['tools', 'list', 'picker'],
    queryFn: () => toolsApi.getTools({ size: 100 }).then((r) => r.data),
  });

  // Schedule mutation
  const scheduleMutation = useMutation({
    mutationFn: (data: ScheduleMaintenanceDto) => toolsApi.scheduleMaintenance(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tools'] });
      setScheduleModalOpen(false);
      setSelectedToolId('');
      setDescription('');
      setScheduleError(null);
    },
    onError: (err: any) => {
      setScheduleError(err.response?.data?.detail || 'Erro ao agendar manutenção.');
    },
  });

  // Complete mutation
  const completeMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: CompleteMaintenanceDto }) =>
      toolsApi.completeMaintenance(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tools'] });
      setCompleteModalItem(null);
      setFindings('');
      setCompleteError(null);
    },
    onError: (err: any) => {
      setCompleteError(err.response?.data?.detail || 'Erro ao concluir manutenção.');
    },
  });

  const handleScheduleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedToolId || !scheduledDate) {
      setScheduleError('Selecione a ferramenta e a data programada.');
      return;
    }

    scheduleMutation.mutate({
      toolId: selectedToolId,
      maintenanceType,
      scheduledDate,
      performedByProvider: performedByProvider.trim() || undefined,
      estimatedCost: typeof estimatedCost === 'number' ? estimatedCost : undefined,
      description: description.trim() || undefined,
    });
  };

  const handleCompleteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!completeModalItem) return;

    completeMutation.mutate({
      id: completeModalItem.id,
      data: {
        cost: typeof actualCost === 'number' ? actualCost : undefined,
        findings: findings.trim() || undefined,
        nextDueDate: nextDueDate || undefined,
      },
    });
  };

  const maintenances: ToolMaintenance[] = maintenancesResponse?.content || [];
  const totalPages = maintenancesResponse?.totalPages || 1;
  const totalElements = maintenancesResponse?.totalElements || 0;

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/60 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-primary/10 text-primary">
              <span className="material-symbols-outlined text-[24px]">verified</span>
            </span>
            <h1 className="text-2xl font-bold font-headline-md text-on-surface">Manutenções & Calibrações</h1>
          </div>
          <p className="text-sm text-on-surface-variant mt-1">
            Planejamento de revisões preventivas, calibrações de torquímetros, alinhadores e scanners.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value as MaintenanceStatus | '');
              setPage(0);
            }}
            aria-label="Filtrar por Status"
            className="px-3.5 py-2 bg-surface-container-low border border-outline-variant/60 rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          >
            <option value="">Todos os Status</option>
            <option value="SCHEDULED">Agendadas</option>
            <option value="COMPLETED">Concluídas</option>
          </select>
          <Link
            to="/tools"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold border border-outline-variant/80 text-on-surface hover:bg-surface-container-high transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">construction</span>
            Catálogo
          </Link>
          <button
            onClick={() => setScheduleModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold bg-primary text-on-primary hover:bg-primary-container transition-colors shadow-sm active:scale-95"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Agendar Calibração
          </button>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-2xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-on-surface-variant">
            <span className="material-symbols-outlined animate-spin text-[32px] text-primary">progress_activity</span>
            <p className="text-sm font-medium">Carregando registros de calibração...</p>
          </div>
        ) : maintenances.length === 0 ? (
          <div className="py-20 text-center text-on-surface-variant flex flex-col items-center">
            <span className="material-symbols-outlined text-[48px] text-on-surface-variant/40 mb-2">build</span>
            <h3 className="text-lg font-semibold text-on-surface">Nenhum registro de manutenção</h3>
            <p className="text-sm text-on-surface-variant mt-1 max-w-[380px]">
              Mantenha os instrumentos da oficina em conformidade técnica agendando calibrações periódicas.
            </p>
            <button
              onClick={() => setScheduleModalOpen(true)}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold bg-primary text-on-primary hover:bg-primary-container transition-colors shadow-sm"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              Agendar Calibração
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-outline-variant/40 bg-surface-container-low text-on-surface-variant text-[12px] uppercase font-semibold tracking-wider">
                  <th className="py-3.5 px-5">Ferramenta / Tag</th>
                  <th className="py-3.5 px-4">Tipo</th>
                  <th className="py-3.5 px-4">Data Prevista</th>
                  <th className="py-3.5 px-4">Prestador / Laboratório</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Custo</th>
                  <th className="py-3.5 px-5 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/30 text-sm">
                {maintenances.map((m) => (
                  <tr key={m.id} className="hover:bg-surface-container-low/50 transition-colors">
                    <td className="py-3.5 px-5">
                      <div className="font-semibold text-on-surface">{m.toolName}</div>
                      <div className="font-mono text-xs text-on-surface-variant font-bold">{m.toolAssetTag}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-xs px-2.5 py-0.5 rounded-full bg-surface-container text-on-surface border border-outline-variant/40">
                        {m.maintenanceType}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-xs font-mono text-on-surface">
                      {m.scheduledDate ? new Date(m.scheduledDate).toLocaleDateString('pt-BR') : '-'}
                    </td>

                    <td className="py-3.5 px-4 text-xs text-on-surface-variant">
                      {m.performedByProvider || 'Interno / Oficina'}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      {m.status === 'COMPLETED' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-tertiary-container/30 text-tertiary">
                          <span className="w-1.5 h-1.5 rounded-full bg-tertiary" />
                          Concluída
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/20 text-amber-700">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                          Agendada
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono text-xs font-semibold text-on-surface">
                      {m.cost ? `R$ ${Number(m.cost).toFixed(2)}` : '-'}
                    </td>

                    <td className="py-3.5 px-5 text-right">
                      {m.status === 'SCHEDULED' && (
                        <button
                          onClick={() => {
                            setCompleteModalItem(m);
                            setActualCost(m.cost || '');
                          }}
                          className="px-3 py-1 rounded-lg text-xs font-semibold bg-tertiary text-on-tertiary hover:opacity-90 transition-opacity"
                        >
                          Concluir Aferição
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-outline-variant/40 bg-surface-container-low/40">
            <span className="text-xs text-on-surface-variant">
              Total de <strong className="text-on-surface">{totalElements}</strong> manutenções
            </span>
            <div className="flex items-center gap-1">
              <button
                disabled={page === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                className="px-3 py-1 text-xs font-semibold rounded-lg border border-outline-variant/60 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-surface-container"
              >
                Anterior
              </button>
              <span className="text-xs text-on-surface-variant px-2">
                Página {page + 1} de {totalPages}
              </span>
              <button
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                className="px-3 py-1 text-xs font-semibold rounded-lg border border-outline-variant/60 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-surface-container"
              >
                Próxima
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal: Agendar Manutenção */}
      <AnimatePresence>
        {scheduleModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-surface-container-lowest w-full max-w-[540px] rounded-2xl border border-outline-variant/60 shadow-2xl overflow-hidden"
            >
              <div className="p-5 border-b border-outline-variant/40 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[22px]">build</span>
                  <h3 className="text-base font-bold text-on-surface">Agendar Calibração / Manutenção</h3>
                </div>
                <button
                  onClick={() => setScheduleModalOpen(false)}
                  className="p-1 rounded-lg text-on-surface-variant hover:bg-surface-container"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>

              <form onSubmit={handleScheduleSubmit} className="p-6 space-y-4">
                {scheduleError && (
                  <div className="p-3 rounded-xl bg-error-container/40 text-error text-xs font-semibold flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px]">warning</span>
                    {scheduleError}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold uppercase text-on-surface-variant mb-1.5">
                    Ferramenta / Equipamento *
                  </label>
                  <select
                    required
                    value={selectedToolId}
                    onChange={(e) => setSelectedToolId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline-variant/60 rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  >
                    <option value="">Selecione o equipamento...</option>
                    {toolsData?.content.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.assetTag})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase text-on-surface-variant mb-1.5">
                      Tipo de Manutenção *
                    </label>
                    <select
                      value={maintenanceType}
                      onChange={(e) => setMaintenanceType(e.target.value as MaintenanceType)}
                      className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline-variant/60 rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    >
                      <option value="CALIBRATION">Calibração / Aferição</option>
                      <option value="PREVENTIVE">Preventiva</option>
                      <option value="CORRECTIVE">Corretiva / Reparo</option>
                      <option value="INSPECTION">Inspeção Visual</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase text-on-surface-variant mb-1.5">
                      Data Agendada *
                    </label>
                    <input
                      type="date"
                      required
                      value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline-variant/60 rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase text-on-surface-variant mb-1.5">
                      Laboratório / Prestador
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Lab Metrologia"
                      value={performedByProvider}
                      onChange={(e) => setPerformedByProvider(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline-variant/60 rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase text-on-surface-variant mb-1.5">
                      Custo Estimado (R$)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={estimatedCost}
                      onChange={(e) => setEstimatedCost(e.target.value === '' ? '' : parseFloat(e.target.value))}
                      className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline-variant/60 rounded-xl text-sm font-mono text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-on-surface-variant mb-1.5">
                    Descrição / Escopo
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Ex: Calibração de torque conforme norma ISO 6789..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3.5 py-2 bg-surface-container-low border border-outline-variant/60 rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-outline-variant/40">
                  <button
                    type="button"
                    onClick={() => setScheduleModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold border border-outline-variant/60 text-on-surface hover:bg-surface-container transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={scheduleMutation.isPending}
                    className="px-5 py-2 rounded-xl text-xs font-semibold bg-primary text-on-primary hover:bg-primary-container disabled:opacity-50 transition-colors shadow-sm flex items-center gap-1.5"
                  >
                    {scheduleMutation.isPending && (
                      <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>
                    )}
                    Agendar Serviço
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal: Concluir Manutenção */}
      <AnimatePresence>
        {completeModalItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-surface-container-lowest w-full max-w-[540px] rounded-2xl border border-outline-variant/60 shadow-2xl overflow-hidden"
            >
              <div className="p-5 border-b border-outline-variant/40 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-tertiary text-[22px]">check_circle</span>
                  <h3 className="text-base font-bold text-on-surface">Concluir Manutenção / Laudo</h3>
                </div>
                <button
                  onClick={() => setCompleteModalItem(null)}
                  className="p-1 rounded-lg text-on-surface-variant hover:bg-surface-container"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>

              <form onSubmit={handleCompleteSubmit} className="p-6 space-y-4">
                <div className="bg-surface-container-low p-3.5 rounded-xl border border-outline-variant/40">
                  <div className="font-semibold text-sm text-on-surface">{completeModalItem.toolName}</div>
                  <div className="text-xs text-on-surface-variant font-mono mt-0.5">
                    Tag: {completeModalItem.toolAssetTag} | Tipo: {completeModalItem.maintenanceType}
                  </div>
                </div>

                {completeError && (
                  <div className="p-3 rounded-xl bg-error-container/40 text-error text-xs font-semibold flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px]">warning</span>
                    {completeError}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase text-on-surface-variant mb-1.5">
                      Custo Final (R$)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={actualCost}
                      onChange={(e) => setActualCost(e.target.value === '' ? '' : parseFloat(e.target.value))}
                      className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline-variant/60 rounded-xl text-sm font-mono text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase text-on-surface-variant mb-1.5">
                      Próximo Vencimento
                    </label>
                    <input
                      type="date"
                      value={nextDueDate}
                      onChange={(e) => setNextDueDate(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline-variant/60 rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-on-surface-variant mb-1.5">
                    Laudo Técnico / Certificado / Observações
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Ex: Certificado nº RBC-998822 emitido. Desvio máximo tolerado: 0.2%..."
                    value={findings}
                    onChange={(e) => setFindings(e.target.value)}
                    className="w-full px-3.5 py-2 bg-surface-container-low border border-outline-variant/60 rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-outline-variant/40">
                  <button
                    type="button"
                    onClick={() => setCompleteModalItem(null)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold border border-outline-variant/60 text-on-surface hover:bg-surface-container transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={completeMutation.isPending}
                    className="px-5 py-2 rounded-xl text-xs font-semibold bg-tertiary text-on-tertiary hover:opacity-90 disabled:opacity-50 transition-opacity shadow-sm flex items-center gap-1.5"
                  >
                    {completeMutation.isPending && (
                      <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>
                    )}
                    Concluir e Liberar Ferramenta
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
