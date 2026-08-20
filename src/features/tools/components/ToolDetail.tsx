import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { toolsApi } from '../api/toolsApi';
import type { ToolStatus } from '../types';
import { ToolCustodyModal } from './ToolCustodyModal';

interface ToolDetailProps {
  toolId: string;
}

export function ToolDetail({ toolId }: ToolDetailProps) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'custody' | 'usages' | 'maintenances'>('custody');
  const [custodyModalOpen, setCustodyModalOpen] = useState(false);

  // Fetch tool
  const { data: tool, isLoading: isLoadingTool } = useQuery({
    queryKey: ['tools', 'detail', toolId],
    queryFn: () => toolsApi.getTool(toolId).then((r) => r.data),
  });

  // Fetch custody logs
  const { data: custodyLogs = [], isLoading: isLoadingCustody } = useQuery({
    queryKey: ['tools', 'custody-history', toolId],
    queryFn: () => toolsApi.getToolCustodyHistory(toolId).then((r) => r.data),
  });

  // Fetch usages
  const { data: usages = [], isLoading: isLoadingUsages } = useQuery({
    queryKey: ['tools', 'usages', toolId],
    queryFn: () => toolsApi.getUsagesByTool(toolId).then((r) => r.data),
    enabled: activeTab === 'usages',
  });

  // Fetch maintenances
  const { data: maintenances = [], isLoading: isLoadingMaintenances } = useQuery({
    queryKey: ['tools', 'maintenances', toolId],
    queryFn: () => toolsApi.getMaintenancesByTool(toolId).then((r) => r.data),
    enabled: activeTab === 'maintenances',
  });

  if (isLoadingTool || !tool) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-3 text-on-surface-variant">
        <span className="material-symbols-outlined animate-spin text-[32px] text-primary">progress_activity</span>
        <p className="text-sm font-medium">Carregando detalhes do equipamento...</p>
      </div>
    );
  }

  const getStatusBadge = (status: ToolStatus) => {
    switch (status) {
      case 'AVAILABLE':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-tertiary-container/30 text-tertiary">
            <span className="w-2 h-2 rounded-full bg-tertiary" />
            Disponível
          </span>
        );
      case 'IN_USE':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-sky-500/20 text-sky-700 dark:text-sky-300">
            <span className="w-2 h-2 rounded-full bg-sky-500" />
            Em Uso
          </span>
        );
      case 'IN_MAINTENANCE':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-700 dark:text-amber-300">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            Em Manutenção
          </span>
        );
      case 'IN_TRANSIT':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-500/20 text-purple-700 dark:text-purple-300">
            <span className="w-2 h-2 rounded-full bg-purple-500" />
            Em Trânsito
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-surface-container text-on-surface-variant">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/60 shadow-sm">
        <div className="flex items-center gap-3">
          <Link
            to="/tools"
            className="p-2 rounded-xl border border-outline-variant/60 text-on-surface-variant hover:bg-surface-container transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-surface-container text-on-surface border border-outline-variant/40">
                {tool.assetTag}
              </span>
              {getStatusBadge(tool.status)}
            </div>
            <h1 className="text-2xl font-bold font-headline-md text-on-surface mt-1">{tool.name}</h1>
            <p className="text-xs text-on-surface-variant">
              {tool.brand ? `${tool.brand} ` : ''}
              {tool.model ? `(${tool.model})` : ''} • {tool.categoryName || 'Categoria Geral'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCustodyModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold bg-primary text-on-primary hover:bg-primary-container transition-colors shadow-sm active:scale-95"
          >
            <span className="material-symbols-outlined text-[18px]">how_to_reg</span>
            {tool.status === 'AVAILABLE' ? 'Realizar Check-out' : 'Realizar Devolução'}
          </button>
          <Link
            to="/tools/$id/edit"
            params={{ id: tool.id }}
            className="px-3.5 py-2 rounded-xl text-sm font-semibold border border-outline-variant/60 text-on-surface hover:bg-surface-container transition-colors inline-flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[18px]">edit</span>
            Editar
          </Link>
        </div>
      </div>

      {/* Info Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Custódia & Localização */}
        <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/60 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
            <span className="material-symbols-outlined text-[18px]">place</span>
            <span>Custódia & Localização</span>
          </div>
          <div>
            <span className="text-xs text-on-surface-variant">Localização na Oficina:</span>
            <div className="font-semibold text-sm text-on-surface">{tool.locationInUnit || 'Não cadastrada'}</div>
          </div>
          <div>
            <span className="text-xs text-on-surface-variant">Responsável Atual:</span>
            <div className="font-semibold text-sm text-on-surface">
              {tool.currentHolderUserName || 'No armário / Disponível'}
            </div>
          </div>
        </div>

        {/* Card 2: Calibração & Metrologia */}
        <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/60 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
            <span className="material-symbols-outlined text-[18px]">build_circle</span>
            <span>Calibração & Aferição</span>
          </div>
          <div>
            <span className="text-xs text-on-surface-variant">Última Manutenção:</span>
            <div className="font-semibold text-sm text-on-surface">
              {tool.lastMaintenanceAt
                ? new Date(tool.lastMaintenanceAt).toLocaleDateString('pt-BR')
                : 'Nenhuma registrada'}
            </div>
          </div>
          <div>
            <span className="text-xs text-on-surface-variant">Próxima Aferição Prevista:</span>
            <div className={`font-semibold text-sm ${tool.maintenanceOverdue ? 'text-error' : 'text-on-surface'}`}>
              {tool.nextMaintenanceDueAt
                ? new Date(tool.nextMaintenanceDueAt).toLocaleDateString('pt-BR')
                : 'Não agendada'}
              {tool.maintenanceOverdue && ' (Vencida!)'}
            </div>
          </div>
        </div>

        {/* Card 3: Dados de Aquisição */}
        <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/60 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
            <span className="material-symbols-outlined text-[18px]">receipt_long</span>
            <span>Dados de Aquisição</span>
          </div>
          <div>
            <span className="text-xs text-on-surface-variant">Data da Compra:</span>
            <div className="font-semibold text-sm text-on-surface">
              {tool.purchaseDate ? new Date(tool.purchaseDate).toLocaleDateString('pt-BR') : 'Não informada'}
            </div>
          </div>
          <div>
            <span className="text-xs text-on-surface-variant">Custo Patrimonial:</span>
            <div className="font-semibold text-sm font-mono text-on-surface">
              {tool.purchaseCost ? `R$ ${Number(tool.purchaseCost).toFixed(2)}` : 'Não informado'}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Section */}
      <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/60 shadow-sm overflow-hidden">
        <div className="flex items-center border-b border-outline-variant/40 bg-surface-container-low px-4">
          <button
            onClick={() => setActiveTab('custody')}
            className={`py-3.5 px-4 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 flex items-center gap-1.5 ${
              activeTab === 'custody'
                ? 'border-primary text-primary'
                : 'border-transparent text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">history</span>
            Histórico de Custódia ({custodyLogs.length})
          </button>
          <button
            onClick={() => setActiveTab('usages')}
            className={`py-3.5 px-4 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 flex items-center gap-1.5 ${
              activeTab === 'usages'
                ? 'border-primary text-primary'
                : 'border-transparent text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">assignment</span>
            Uso em Ordens de Serviço
          </button>
          <button
            onClick={() => setActiveTab('maintenances')}
            className={`py-3.5 px-4 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 flex items-center gap-1.5 ${
              activeTab === 'maintenances'
                ? 'border-primary text-primary'
                : 'border-transparent text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">build</span>
            Manutenções & Calibrações
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'custody' && (
            <div>
              {isLoadingCustody ? (
                <div className="py-12 text-center text-on-surface-variant">Carregando histórico...</div>
              ) : custodyLogs.length === 0 ? (
                <div className="py-12 text-center text-on-surface-variant text-sm">
                  Nenhum registro de movimentação de posse para esta ferramenta.
                </div>
              ) : (
                <div className="space-y-4 relative before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-outline-variant/50">
                  {custodyLogs.map((log) => (
                    <div key={log.id} className="relative pl-8">
                      <span className="absolute left-2 top-1.5 w-3.5 h-3.5 rounded-full bg-primary border-2 border-surface-container-lowest" />
                      <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant/40 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-xs text-primary uppercase">{log.eventType}</span>
                          <span className="text-[11px] text-on-surface-variant font-mono">
                            {new Date(log.createdAt).toLocaleString('pt-BR')}
                          </span>
                        </div>
                        <div className="text-sm font-semibold text-on-surface">{log.notes || 'Sem observações'}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'usages' && (
            <div>
              {isLoadingUsages ? (
                <div className="py-12 text-center text-on-surface-variant">Carregando usos em OS...</div>
              ) : usages.length === 0 ? (
                <div className="py-12 text-center text-on-surface-variant text-sm">
                  Esta ferramenta ainda não foi vinculada a nenhuma Ordem de Serviço.
                </div>
              ) : (
                <div className="divide-y divide-outline-variant/30">
                  {usages.map((u) => (
                    <div key={u.id} className="py-3.5 flex items-center justify-between text-sm">
                      <div>
                        <div className="font-semibold text-on-surface">Ordem de Serviço: {u.workOrderId}</div>
                        <div className="text-xs text-on-surface-variant mt-0.5">
                          {u.notes || 'Uso registrado no serviço'}
                        </div>
                      </div>
                      <div className="text-right text-xs text-on-surface-variant font-mono">
                        <div>Retirada: {new Date(u.checkedOutAt).toLocaleDateString('pt-BR')}</div>
                        {u.checkedInAt && <div>Devolução: {new Date(u.checkedInAt).toLocaleDateString('pt-BR')}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'maintenances' && (
            <div>
              {isLoadingMaintenances ? (
                <div className="py-12 text-center text-on-surface-variant">Carregando manutenções...</div>
              ) : maintenances.length === 0 ? (
                <div className="py-12 text-center text-on-surface-variant text-sm">
                  Nenhum registro de manutenção ou calibração encontrado.
                </div>
              ) : (
                <div className="divide-y divide-outline-variant/30">
                  {maintenances.map((m) => (
                    <div key={m.id} className="py-4 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs px-2 py-0.5 rounded bg-surface-container text-on-surface">
                            {m.maintenanceType}
                          </span>
                          <span className="text-xs font-semibold text-tertiary">{m.status}</span>
                        </div>
                        <span className="text-xs text-on-surface-variant font-mono">
                          {m.performedAt
                            ? new Date(m.performedAt).toLocaleDateString('pt-BR')
                            : m.scheduledDate
                            ? `Agendado: ${m.scheduledDate}`
                            : ''}
                        </span>
                      </div>
                      {m.findings && (
                        <div className="text-xs text-on-surface-variant bg-surface-container-low p-2.5 rounded-lg">
                          <strong>Laudo:</strong> {m.findings}
                        </div>
                      )}
                      {m.cost && (
                        <div className="text-xs font-mono text-on-surface-variant">
                          Custo: R$ {Number(m.cost).toFixed(2)} {m.performedByProvider ? `• Prestador: ${m.performedByProvider}` : ''}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Custody Modal */}
      {custodyModalOpen && (
        <ToolCustodyModal
          tool={tool}
          onClose={() => setCustodyModalOpen(false)}
          onSuccess={() => {
            setCustodyModalOpen(false);
            queryClient.invalidateQueries({ queryKey: ['tools'] });
          }}
        />
      )}
    </div>
  );
}
