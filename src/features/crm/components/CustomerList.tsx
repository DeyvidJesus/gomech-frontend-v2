import { useState, useDeferredValue } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { crmApi } from '../api/crmApi';
import type { CustomerSummary } from '../types';

export function CustomerList() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search);
  const [page, setPage] = useState(0);
  const pageSize = 10;
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'ALL' | 'WITH_VEHICLES' | 'NO_VEHICLES'>('ALL');

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['crm', 'customers', { q: deferredSearch, page, size: pageSize }],
    queryFn: () =>
      crmApi.getCustomers({
        q: deferredSearch ? deferredSearch : undefined,
        page,
        size: pageSize,
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => crmApi.deleteCustomer(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm', 'customers'] });
    },
  });

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Deseja realmente excluir o cliente "${name}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  const customers: CustomerSummary[] = data?.content || [];
  const totalElements = data?.totalElements || 0;
  const totalPages = data?.totalPages || 1;

  // Filter based on activeTab
  const filteredCustomers = customers.filter((c) => {
    if (activeTab === 'WITH_VEHICLES') return c.vehicleCount > 0;
    if (activeTab === 'NO_VEHICLES') return c.vehicleCount === 0;
    return true;
  });

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(filteredCustomers.map((c) => c.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const getInitials = (name: string) => {
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
          <h2 className="text-headline-lg font-headline-lg text-on-surface font-bold">Clientes</h2>
          <p className="text-body-md font-body-md text-on-surface-variant mt-1">
            Gerencie sua base de clientes, veículos e histórico de atendimentos.
          </p>
        </div>
        <button
          onClick={() => navigate({ to: '/crm/customers/new' })}
          className="bg-primary text-on-primary font-label-md text-label-md px-4 py-2 rounded-lg hover:bg-primary-container active:translate-y-[1px] transition-all flex items-center justify-center gap-2 shadow-sm"
        >
          <span className="material-symbols-outlined text-[18px]">person_add</span>
          Novo Cliente
        </button>
      </div>

      {/* Controls Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Tabs / Filter Pills */}
        <div className="flex items-center p-1 bg-surface-container-low border border-outline-variant rounded-lg">
          <button
            onClick={() => setActiveTab('ALL')}
            className={`px-4 py-1.5 text-label-md font-label-md rounded-md transition-colors ${
              activeTab === 'ALL'
                ? 'bg-surface-container-lowest shadow-xs border border-outline-variant text-on-surface font-semibold'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Todos os Clientes
          </button>
          <button
            onClick={() => setActiveTab('WITH_VEHICLES')}
            className={`px-4 py-1.5 text-label-md font-label-md rounded-md transition-colors ${
              activeTab === 'WITH_VEHICLES'
                ? 'bg-surface-container-lowest shadow-xs border border-outline-variant text-on-surface font-semibold'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Com Veículos
          </button>
          <button
            onClick={() => setActiveTab('NO_VEHICLES')}
            className={`px-4 py-1.5 text-label-md font-label-md rounded-md transition-colors ${
              activeTab === 'NO_VEHICLES'
                ? 'bg-surface-container-lowest shadow-xs border border-outline-variant text-on-surface font-semibold'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Sem Veículos
          </button>
        </div>

        {/* Search Input */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative group flex-1 sm:w-72">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">
              search
            </span>
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
              className="w-full pl-9 pr-3 py-2 bg-surface-container-lowest border border-outline-variant rounded-lg text-body-sm font-body-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-outline"
              placeholder="Buscar por nome, documento, telefone..."
              type="text"
            />
          </div>
        </div>
      </div>

      {/* High-Density Data Table */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-surface border-b border-outline-variant">
              <tr>
                <th className="px-3 py-2.5 text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider w-10 text-center">
                  <input
                    type="checkbox"
                    onChange={handleSelectAll}
                    checked={
                      filteredCustomers.length > 0 &&
                      selectedIds.length === filteredCustomers.length
                    }
                    className="rounded border-outline-variant text-primary focus:ring-primary-fixed w-3.5 h-3.5"
                  />
                </th>
                <th className="px-3 py-2.5 text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider">
                  Nome do Cliente
                </th>
                <th className="px-3 py-2.5 text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider">
                  CPF / CNPJ
                </th>
                <th className="px-3 py-2.5 text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider">
                  Contato
                </th>
                <th className="px-3 py-2.5 text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider text-right">
                  Veículos
                </th>
                <th className="px-3 py-2.5 text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider text-right">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-on-surface-variant text-body-md">
                    <span className="material-symbols-outlined animate-spin text-[28px] text-primary">
                      progress_activity
                    </span>
                    <p className="mt-2 font-medium">Carregando clientes...</p>
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-error text-body-md">
                    Erro ao carregar clientes: {(error as Error)?.message || 'Erro desconhecido'}
                  </td>
                </tr>
              ) : filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-on-surface-variant text-body-md">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <span className="material-symbols-outlined text-[40px] text-outline">group_off</span>
                      <p className="font-semibold text-on-surface">Nenhum cliente encontrado</p>
                      <p className="text-body-sm text-on-surface-variant">
                        Tente ajustar seus critérios de busca ou cadastre um novo cliente.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer) => {
                  const isSelected = selectedIds.includes(customer.id);
                  return (
                    <tr
                      key={customer.id}
                      className={`h-[44px] hover:bg-surface-bright transition-colors group ${
                        isSelected ? 'bg-primary-fixed/20' : ''
                      }`}
                    >
                      <td className="px-3 py-2 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(customer.id)}
                          className="rounded border-outline-variant text-primary focus:ring-primary-fixed w-3.5 h-3.5"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center text-[10px] font-bold shrink-0">
                            {getInitials(customer.name)}
                          </div>
                          <button
                            onClick={() =>
                              navigate({
                                to: '/crm/customers/$id',
                                params: { id: customer.id },
                              })
                            }
                            className="text-body-md font-body-md font-semibold text-on-surface hover:text-primary transition-colors text-left"
                          >
                            {customer.name}
                          </button>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-body-sm font-mono text-on-surface-variant">
                        {customer.formattedDocument || customer.document || '—'}
                      </td>
                      <td className="px-3 py-2">
                        <div className="text-body-sm text-on-surface">{customer.email || '—'}</div>
                        <div className="text-[11px] text-on-surface-variant">{customer.phone || '—'}</div>
                      </td>
                      <td className="px-3 py-2 text-right">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                            customer.vehicleCount > 0
                              ? 'bg-secondary-container text-on-secondary-container'
                              : 'bg-surface-container text-on-surface-variant'
                          }`}
                        >
                          {customer.vehicleCount} {customer.vehicleCount === 1 ? 'veículo' : 'veículos'}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            title="Adicionar Veículo"
                            onClick={() =>
                              navigate({
                                to: '/crm/vehicles/new',
                                search: { customerId: customer.id } as never,
                              })
                            }
                            className="text-on-surface-variant hover:text-primary transition-colors p-1.5 rounded-lg hover:bg-surface-container"
                          >
                            <span className="material-symbols-outlined text-[18px]">directions_car</span>
                          </button>
                          <button
                            title="Editar Cliente"
                            onClick={() =>
                              navigate({
                                to: '/crm/customers/$id',
                                params: { id: customer.id },
                              })
                            }
                            className="text-on-surface-variant hover:text-primary transition-colors p-1.5 rounded-lg hover:bg-surface-container"
                          >
                            <span className="material-symbols-outlined text-[18px]">edit</span>
                          </button>
                          <button
                            title="Excluir Cliente"
                            onClick={() => handleDelete(customer.id, customer.name)}
                            className="text-on-surface-variant hover:text-error transition-colors p-1.5 rounded-lg hover:bg-error-container/30"
                          >
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="bg-surface px-4 py-3 border-t border-outline-variant flex items-center justify-between">
          <p className="text-[12px] text-on-surface-variant">
            Exibindo{' '}
            <span className="font-medium text-on-surface">
              {totalElements > 0 ? page * pageSize + 1 : 0}
            </span>{' '}
            a{' '}
            <span className="font-medium text-on-surface">
              {Math.min((page + 1) * pageSize, totalElements)}
            </span>{' '}
            de <span className="font-medium text-on-surface">{totalElements}</span> clientes
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(p - 1, 0))}
              disabled={page === 0 || isLoading}
              className="px-2 py-1 border border-outline-variant rounded-md text-on-surface-variant hover:bg-surface-container disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-[16px] block">chevron_left</span>
            </button>
            <span className="px-2 text-label-sm text-on-surface-variant font-medium">
              Página {page + 1} de {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(p + 1, totalPages - 1))}
              disabled={page >= totalPages - 1 || isLoading}
              className="px-2 py-1 border border-outline-variant rounded-md text-on-surface hover:bg-surface-container disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-[16px] block">chevron_right</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
