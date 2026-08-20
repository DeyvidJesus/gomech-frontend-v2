import { useState, useDeferredValue } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { crmApi } from '../api/crmApi';
import type { VehicleSummary } from '../types';
import { formatLicensePlate } from '../utils/validators';

export function VehicleList() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search);
  const [selectedBrand, setSelectedBrand] = useState('ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [page, setPage] = useState(0);
  const pageSize = 12;

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['crm', 'vehicles', { q: deferredSearch, page, size: pageSize }],
    queryFn: () =>
      crmApi.getVehicles({
        q: deferredSearch ? deferredSearch : undefined,
        page,
        size: pageSize,
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => crmApi.deleteVehicle(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm', 'vehicles'] });
    },
  });

  const handleDelete = (id: string, plate: string) => {
    if (window.confirm(`Deseja realmente excluir o veículo com placa "${plate}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  const vehicles: VehicleSummary[] = data?.content || [];
  const totalElements = data?.totalElements || 0;
  const totalPages = data?.totalPages || 1;

  // Filter by brand locally if needed
  const filteredVehicles = vehicles.filter((v) => {
    if (selectedBrand !== 'ALL' && v.brand) {
      return v.brand.toLowerCase() === selectedBrand.toLowerCase();
    }
    return true;
  });

  // Extract unique brands for filter
  const brands = Array.from(new Set(vehicles.map((v) => v.brand).filter(Boolean))) as string[];

  const getOwnerInitials = (name?: string) => {
    if (!name) return 'GM';
    return name
      .split(' ')
      .slice(0, 2)
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-headline-lg font-headline-lg text-on-surface font-bold">Veículos</h2>
          <p className="text-body-md font-body-md text-on-surface-variant mt-1">
            Gerencie os veículos dos clientes, especificações, quilometragem e histórico de manutenção.
          </p>
        </div>
        <button
          onClick={() => navigate({ to: '/crm/vehicles/new' })}
          className="bg-primary text-on-primary font-label-md text-label-md px-4 py-2.5 rounded-xl hover:bg-primary-container active:translate-y-[1px] transition-all flex items-center justify-center gap-2 shadow-sm font-bold"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          Novo Veículo
        </button>
      </div>

      {/* Controls & Filter Toolbar */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          {/* Search Input */}
          <div className="relative group w-full sm:w-64">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">
              search
            </span>
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
              className="w-full pl-9 pr-3 py-1.5 bg-surface border border-outline-variant rounded-lg text-body-sm font-body-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-outline"
              placeholder="Buscar placa, modelo, cliente..."
              type="text"
            />
          </div>

          {/* Brand Filter */}
          <div className="relative">
            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="pl-3 pr-8 py-1.5 bg-surface text-on-surface border border-outline-variant rounded-lg font-label-sm text-label-sm appearance-none focus:outline-none focus:border-primary cursor-pointer"
            >
              <option value="ALL">Todas as Marcas</option>
              {brands.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
            <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-on-surface-variant text-[16px] pointer-events-none">
              arrow_drop_down
            </span>
          </div>

          {selectedBrand !== 'ALL' && (
            <button
              onClick={() => setSelectedBrand('ALL')}
              className="px-2.5 py-1 text-primary font-label-sm text-label-sm hover:bg-surface-container rounded-lg transition-colors"
            >
              Limpar
            </button>
          )}
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center bg-surface border border-outline-variant rounded-lg p-[2px]">
          <button
            onClick={() => setViewMode('grid')}
            title="Visualização em Grade"
            className={`p-1.5 rounded transition-colors ${
              viewMode === 'grid'
                ? 'bg-surface-container-lowest text-on-surface shadow-xs border border-outline-variant'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[18px] block">grid_view</span>
          </button>
          <button
            onClick={() => setViewMode('table')}
            title="Visualização em Tabela"
            className={`p-1.5 rounded transition-colors ${
              viewMode === 'table'
                ? 'bg-surface-container-lowest text-on-surface shadow-xs border border-outline-variant'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[18px] block">view_list</span>
          </button>
        </div>
      </div>

      {/* Content Area */}
      {isLoading ? (
        <div className="py-20 text-center text-on-surface-variant">
          <span className="material-symbols-outlined animate-spin text-[32px] text-primary">
            progress_activity
          </span>
          <p className="mt-2 text-body-md font-medium">Carregando veículos...</p>
        </div>
      ) : isError ? (
        <div className="p-8 text-center text-error bg-error-container/20 rounded-xl border border-error/30">
          Erro ao carregar veículos: {(error as Error)?.message || 'Erro desconhecido'}
        </div>
      ) : filteredVehicles.length === 0 ? (
        <div className="py-16 text-center text-on-surface-variant bg-surface-container-lowest border border-outline-variant rounded-xl">
          <span className="material-symbols-outlined text-[44px] text-outline">directions_car</span>
          <p className="mt-2 font-semibold text-on-surface text-body-lg">Nenhum veículo encontrado</p>
          <p className="text-body-sm text-on-surface-variant mt-1">
            Tente ajustar seus critérios de busca ou cadastre um novo veículo.
          </p>
          <button
            onClick={() => navigate({ to: '/crm/vehicles/new' })}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-primary text-on-primary rounded-lg font-label-md text-label-md hover:bg-primary-container transition-colors shadow-sm font-bold"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Novo Veículo
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredVehicles.map((vehicle) => {
            const formattedPlate =
              vehicle.formattedLicensePlate || formatLicensePlate(vehicle.licensePlate);

            return (
              <div
                key={vehicle.id}
                className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 hover:border-primary/50 transition-all group shadow-xs flex flex-col justify-between"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-lg bg-surface-container flex items-center justify-center border border-outline-variant text-primary shrink-0">
                        <span className="material-symbols-outlined text-[22px]">directions_car</span>
                      </div>
                      <div>
                        <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface group-hover:text-primary transition-colors">
                          {vehicle.brand || 'Veículo'} {vehicle.model || ''}
                        </h3>
                        <p className="font-body-sm text-body-sm text-on-surface-variant">
                          {vehicle.year ? `${vehicle.year} • ` : ''}
                          {vehicle.currentMileage ? `${vehicle.currentMileage.toLocaleString()} km` : 'Km não informada'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        title="Ver Histórico de Manutenções"
                        onClick={() =>
                          navigate({
                            to: '/operations/vehicles/$id/history' as never,
                            params: { id: vehicle.id } as never,
                          })
                        }
                        className="p-1.5 text-on-surface-variant hover:text-secondary rounded-lg hover:bg-secondary-container/30 transition-colors"
                      >
                        <span className="material-symbols-outlined text-[18px]">history</span>
                      </button>
                      <button
                        title="Editar Veículo"
                        onClick={() =>
                          navigate({
                            to: '/crm/vehicles/$id',
                            params: { id: vehicle.id },
                          })
                        }
                        className="p-1.5 text-on-surface-variant hover:text-primary rounded-lg hover:bg-surface-container transition-colors"
                      >
                        <span className="material-symbols-outlined text-[18px]">edit</span>
                      </button>
                      <button
                        title="Excluir Veículo"
                        onClick={() => handleDelete(vehicle.id, formattedPlate)}
                        className="p-1.5 text-on-surface-variant hover:text-error rounded-lg hover:bg-error-container/30 transition-colors"
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    </div>
                  </div>

                  {/* Identification Pill */}
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div className="bg-surface p-2.5 rounded-lg border border-outline-variant">
                      <p className="font-label-sm text-label-sm text-on-surface-variant mb-0.5">Placa</p>
                      <p className="font-label-md text-label-md text-on-surface font-mono font-bold tracking-wider">
                        {formattedPlate}
                      </p>
                    </div>
                    <div className="bg-surface p-2.5 rounded-lg border border-outline-variant">
                      <p className="font-label-sm text-label-sm text-on-surface-variant mb-0.5">Marca</p>
                      <p className="font-body-sm text-body-sm text-on-surface font-medium truncate">
                        {vehicle.brand || '—'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Card Footer / Owner */}
                <div className="flex items-center justify-between pt-3 border-t border-outline-variant/60 mt-2">
                  <div className="flex items-center gap-2 truncate pr-2">
                    <div className="w-6 h-6 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center text-[10px] font-bold shrink-0">
                      {getOwnerInitials(vehicle.customerName)}
                    </div>
                    <span className="font-body-sm text-body-sm text-on-surface truncate">
                      {vehicle.customerName || 'Cliente vinculado'}
                    </span>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-tertiary-container/15 text-tertiary text-[11px] font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span> Ativo
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-surface border-b border-outline-variant">
                <tr>
                  <th className="px-4 py-2.5 text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider">
                    Placa
                  </th>
                  <th className="px-4 py-2.5 text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider">
                    Veículo (Marca / Modelo)
                  </th>
                  <th className="px-4 py-2.5 text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider">
                    Proprietário
                  </th>
                  <th className="px-4 py-2.5 text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider text-right">
                    Ano
                  </th>
                  <th className="px-4 py-2.5 text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider text-right">
                    Km Atual
                  </th>
                  <th className="px-4 py-2.5 text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider text-right">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {filteredVehicles.map((vehicle) => {
                  const formattedPlate =
                    vehicle.formattedLicensePlate || formatLicensePlate(vehicle.licensePlate);

                  return (
                    <tr
                      key={vehicle.id}
                      className="hover:bg-surface-bright transition-colors group"
                    >
                      <td className="px-4 py-3">
                        <span className="px-2.5 py-1 rounded bg-primary-fixed text-primary font-mono font-bold text-xs border border-primary/20">
                          {formattedPlate}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() =>
                            navigate({
                              to: '/crm/vehicles/$id',
                              params: { id: vehicle.id },
                            })
                          }
                          className="font-semibold text-on-surface hover:text-primary transition-colors text-body-md text-left"
                        >
                          {vehicle.brand} {vehicle.model}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-body-sm text-on-surface">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center text-[10px] font-bold">
                            {getOwnerInitials(vehicle.customerName)}
                          </div>
                          <span>{vehicle.customerName || '—'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right text-body-sm font-mono text-on-surface-variant">
                        {vehicle.year || '—'}
                      </td>
                      <td className="px-4 py-3 text-right text-body-sm font-mono text-on-surface">
                        {vehicle.currentMileage ? `${vehicle.currentMileage.toLocaleString()} km` : '—'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            title="Ver Histórico de Manutenções"
                            onClick={() =>
                              navigate({
                                to: '/operations/vehicles/$id/history' as never,
                                params: { id: vehicle.id } as never,
                              })
                            }
                            className="p-1.5 text-on-surface-variant hover:text-secondary rounded-lg hover:bg-secondary-container/30 transition-colors"
                          >
                            <span className="material-symbols-outlined text-[18px]">history</span>
                          </button>
                          <button
                            title="Editar Veículo"
                            onClick={() =>
                              navigate({
                                to: '/crm/vehicles/$id',
                                params: { id: vehicle.id },
                              })
                            }
                            className="p-1.5 text-on-surface-variant hover:text-primary rounded-lg hover:bg-surface-container transition-colors"
                          >
                            <span className="material-symbols-outlined text-[18px]">edit</span>
                          </button>
                          <button
                            title="Excluir Veículo"
                            onClick={() => handleDelete(vehicle.id, formattedPlate)}
                            className="p-1.5 text-on-surface-variant hover:text-error rounded-lg hover:bg-error-container/30 transition-colors"
                          >
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination Footer */}
      <div className="bg-surface-container-lowest px-4 py-3 border border-outline-variant rounded-xl flex items-center justify-between shadow-xs">
        <p className="text-[12px] text-on-surface-variant">
          Exibindo{' '}
          <span className="font-medium text-on-surface">
            {totalElements > 0 ? page * pageSize + 1 : 0}
          </span>{' '}
          a{' '}
          <span className="font-medium text-on-surface">
            {Math.min((page + 1) * pageSize, totalElements)}
          </span>{' '}
          de <span className="font-medium text-on-surface">{totalElements}</span> veículos
        </p>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setPage((p) => Math.max(p - 1, 0))}
            disabled={page === 0 || isLoading}
            className="px-2.5 py-1 border border-outline-variant rounded-md text-on-surface-variant hover:bg-surface-container disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <span className="material-symbols-outlined text-[16px] block">chevron_left</span>
          </button>
          <span className="px-2 text-label-sm text-on-surface-variant font-medium">
            Página {page + 1} de {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(p + 1, totalPages - 1))}
            disabled={page >= totalPages - 1 || isLoading}
            className="px-2.5 py-1 border border-outline-variant rounded-md text-on-surface hover:bg-surface-container disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <span className="material-symbols-outlined text-[16px] block">chevron_right</span>
          </button>
        </div>
      </div>
    </div>
  );
}
