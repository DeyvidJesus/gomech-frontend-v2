import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import { toolsApi } from '../api/toolsApi';
import type { Tool, ToolStatus } from '../types';
import { useAuthStore } from '@/features/iam/stores/authStore';
import { ToolCustodyModal } from './ToolCustodyModal';

export function ToolList() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const unitId = user?.activeUnitId || '';

  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<ToolStatus | ''>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [page, setPage] = useState(0);
  const [custodyModalTool, setCustodyModalTool] = useState<Tool | null>(null);

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ['tools', 'categories'],
    queryFn: () => toolsApi.getCategories().then((r) => r.data),
  });

  // Fetch tools
  const { data: toolsResponse, isLoading, isError } = useQuery({
    queryKey: ['tools', 'list', unitId, selectedStatus, selectedCategory, search, page],
    queryFn: () =>
      toolsApi
        .getTools({
          unitId: unitId || undefined,
          status: selectedStatus || undefined,
          categoryId: selectedCategory || undefined,
          search: search || undefined,
          page,
          size: 16,
        })
        .then((r) => r.data),
  });

  // Delete tool mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => toolsApi.deleteTool(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tools'] });
    },
  });

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Deseja realmente desativar o equipamento "${name}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  const tools: Tool[] = toolsResponse?.content || [];
  const totalPages = toolsResponse?.totalPages || 1;
  const totalElements = toolsResponse?.totalElements || 0;

  const getStatusBadge = (status: ToolStatus, holderName?: string | null) => {
    switch (status) {
      case 'AVAILABLE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-tertiary-container/30 text-tertiary">
            <span className="w-1.5 h-1.5 rounded-full bg-tertiary" />
            Disponível
          </span>
        );
      case 'IN_USE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-500/20 text-sky-700 dark:text-sky-300">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
            Em Uso {holderName ? `(${holderName})` : ''}
          </span>
        );
      case 'IN_MAINTENANCE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-700 dark:text-amber-300">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Em Manutenção
          </span>
        );
      case 'IN_TRANSIT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-700 dark:text-purple-300">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
            Em Trânsito
          </span>
        );
      case 'DECOMMISSIONED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-surface-container text-on-surface-variant">
            <span className="w-1.5 h-1.5 rounded-full bg-outline" />
            Desativado
          </span>
        );
      case 'LOST':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-error-container/40 text-error">
            <span className="w-1.5 h-1.5 rounded-full bg-error" />
            Extraviado
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-16">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/60 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-primary/10 text-primary">
              <span className="material-symbols-outlined text-[24px]">construction</span>
            </span>
            <h1 className="text-2xl font-bold font-headline-md text-on-surface">Gestão de Ferramentas & Ativos</h1>
          </div>
          <p className="text-sm text-on-surface-variant mt-1">
            Controle de custódia, localização física, calibrações e manutenção de equipamentos
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            to="/tools/maintenances"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold border border-outline-variant/80 text-on-surface hover:bg-surface-container-high transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">build</span>
            Calibrações & Reparos
          </Link>
          <Link
            to="/tools/transfers"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold border border-outline-variant/80 text-on-surface hover:bg-surface-container-high transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">swap_horiz</span>
            Transferências
          </Link>
          <Link
            to="/tools/new"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold bg-primary text-on-primary hover:bg-primary-container transition-colors shadow-sm active:scale-95"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Cadastrar Equipamento
          </Link>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/60 shadow-sm flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant material-symbols-outlined text-[20px]">
            search
          </span>
          <input
            type="text"
            placeholder="Buscar por nome, etiqueta de patrimônio, serial ou marca..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            className="w-full pl-10 pr-4 py-2.5 bg-surface-container-low border border-outline-variant/60 rounded-xl text-sm text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value as ToolStatus | '');
              setPage(0);
            }}
            aria-label="Filtrar por Status"
            className="px-3.5 py-2.5 bg-surface-container-low border border-outline-variant/60 rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          >
            <option value="">Todos Status</option>
            <option value="AVAILABLE">Disponível</option>
            <option value="IN_USE">Em Uso</option>
            <option value="IN_MAINTENANCE">Em Manutenção</option>
            <option value="IN_TRANSIT">Em Trânsito</option>
          </select>

          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setPage(0);
            }}
            aria-label="Filtrar por Categoria"
            className="px-3.5 py-2.5 bg-surface-container-low border border-outline-variant/60 rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          >
            <option value="">Todas Categorias</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tools Cards Grid */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-on-surface-variant">
          <span className="material-symbols-outlined animate-spin text-[32px] text-primary">progress_activity</span>
          <p className="text-sm font-medium">Carregando catálogo de ferramentas...</p>
        </div>
      ) : isError ? (
        <div className="py-16 text-center text-error bg-surface-container-lowest rounded-2xl p-6 border border-error/20">
          <span className="material-symbols-outlined text-[40px]">error</span>
          <p className="text-sm font-semibold mt-2">Falha ao carregar ferramentas.</p>
        </div>
      ) : tools.length === 0 ? (
        <div className="py-20 text-center text-on-surface-variant flex flex-col items-center bg-surface-container-lowest rounded-2xl border border-outline-variant/60 p-8">
          <span className="material-symbols-outlined text-[48px] text-on-surface-variant/40 mb-2">construction</span>
          <h3 className="text-lg font-semibold text-on-surface">Nenhuma ferramenta encontrada</h3>
          <p className="text-sm text-on-surface-variant mt-1 max-w-[380px]">
            Cadastre os instrumentos, elevadores, scanners e ferramentas especiais da sua oficina.
          </p>
          <Link
            to="/tools/new"
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold bg-primary text-on-primary hover:bg-primary-container transition-colors shadow-sm"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Cadastrar Ferramenta
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {tools.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-surface-container-lowest rounded-2xl border border-outline-variant/60 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div>
                {/* Header: Tag + Status */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <span className="font-mono text-xs font-bold px-2 py-1 rounded-lg bg-surface-container text-on-surface border border-outline-variant/40">
                    {t.assetTag}
                  </span>
                  {getStatusBadge(t.status, t.currentHolderUserName)}
                </div>

                {/* Name & Details */}
                <h3
                  onClick={() => navigate({ to: '/tools/$id', params: { id: t.id } })}
                  className="font-bold text-base text-on-surface group-hover:text-primary transition-colors cursor-pointer line-clamp-1"
                >
                  {t.name}
                </h3>
                <p className="text-xs text-on-surface-variant mt-0.5 truncate">
                  {t.brand ? `${t.brand} ` : ''}
                  {t.model ? `(${t.model})` : ''} • {t.categoryName || 'Geral'}
                </p>

                {/* Location & Alerts */}
                <div className="mt-4 space-y-1.5 text-xs text-on-surface-variant">
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-on-surface-variant/70">location_on</span>
                    <span className="truncate">{t.locationInUnit || 'Sem localização cadastrada'}</span>
                  </div>

                  {t.maintenanceOverdue && (
                    <div className="flex items-center gap-1.5 text-error font-semibold bg-error-container/30 px-2 py-1 rounded-lg">
                      <span className="material-symbols-outlined text-[16px]">alarm</span>
                      <span>Calibração vencida!</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons Footer */}
              <div className="mt-5 pt-3 border-t border-outline-variant/30 flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCustodyModalTool(t)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-surface-container hover:bg-primary/10 hover:text-primary transition-colors border border-outline-variant/60"
                  >
                    <span className="material-symbols-outlined text-[16px]">how_to_reg</span>
                    {t.status === 'AVAILABLE' ? 'Check-out' : 'Check-in'}
                  </button>
                </div>

                <div className="flex items-center gap-1">
                  <Link
                    to="/tools/$id"
                    params={{ id: t.id }}
                    className="p-1.5 rounded-lg text-on-surface-variant hover:text-primary hover:bg-surface-container"
                    title="Detalhes 360°"
                  >
                    <span className="material-symbols-outlined text-[18px]">visibility</span>
                  </Link>
                  <button
                    onClick={() => handleDelete(t.id, t.name)}
                    className="p-1.5 rounded-lg text-on-surface-variant hover:text-error hover:bg-error-container/30"
                    title="Desativar"
                  >
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-5 py-3 border border-outline-variant/40 rounded-xl bg-surface-container-lowest">
          <span className="text-xs text-on-surface-variant">
            Total de <strong className="text-on-surface">{totalElements}</strong> ferramentas
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

      {/* Custody Action Modal */}
      {custodyModalTool && (
        <ToolCustodyModal
          tool={custodyModalTool}
          onClose={() => setCustodyModalTool(null)}
          onSuccess={() => {
            setCustodyModalTool(null);
            queryClient.invalidateQueries({ queryKey: ['tools'] });
          }}
        />
      )}
    </div>
  );
}
