import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { crmApi } from '../api/crmApi';
import { operationsApi } from '@/features/operations/api/operationsApi';
import { formatDocument, maskPhone, formatLicensePlate } from '../utils/validators';
import { CustomerForm } from './CustomerForm';

interface CustomerDetailsProps {
  customerId: string;
}

export function CustomerDetails({ customerId }: CustomerDetailsProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'vehicles' | 'work-orders' | 'quotes' | 'edit'>('overview');

  // 1. Fetch Customer
  const { data: customer, isLoading: isLoadingCustomer } = useQuery({
    queryKey: ['crm', 'customer', customerId],
    queryFn: () => crmApi.getCustomerById(customerId),
  });

  // 2. Fetch Customer Vehicles
  const { data: vehiclesData } = useQuery({
    queryKey: ['crm', 'vehicles', { customerId }],
    queryFn: () => crmApi.getVehicles({ customerId, size: 50 }),
  });

  // 3. Fetch Customer Work Orders
  const { data: workOrdersData } = useQuery({
    queryKey: ['operations', 'work-orders', { customerId }],
    queryFn: () => operationsApi.getWorkOrders({ customerId, size: 50 }),
  });

  // 4. Fetch Customer Quotes
  const { data: quotesData } = useQuery({
    queryKey: ['operations', 'quotes', { customerId }],
    queryFn: () => operationsApi.getQuotes({ customerId, size: 50 }),
  });

  const vehicles = vehiclesData?.content || [];
  const workOrders = workOrdersData?.content || [];
  const quotes = quotesData?.content || [];

  // Calculate stats
  const totalSpent = workOrders
    .filter((wo) => wo.status === 'COMPLETED')
    .reduce((acc, curr) => acc + Number(curr.totalAmount || 0), 0);

  const completedOrdersCount = workOrders.filter((wo) => wo.status === 'COMPLETED').length;

  if (isLoadingCustomer) {
    return (
      <div className="flex flex-col items-center justify-center p-12">
        <span className="material-symbols-outlined animate-spin text-[36px] text-primary">
          progress_activity
        </span>
        <p className="mt-3 text-sm text-on-surface-variant">Carregando perfil do cliente...</p>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="bg-surface-container-lowest p-8 rounded-2xl border border-outline-variant text-center max-w-[540px] mx-auto">
        <span className="material-symbols-outlined text-[48px] text-error">person_off</span>
        <h2 className="text-xl font-bold text-on-surface mt-2">Cliente não encontrado</h2>
        <p className="text-sm text-on-surface-variant mt-1">O registro pode ter sido excluído.</p>
        <Link
          to="/crm/customers"
          className="mt-4 inline-flex items-center gap-1 px-4 py-2 bg-primary text-on-primary rounded-xl text-xs font-bold shadow-sm"
        >
          Voltar para Lista de Clientes
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto space-y-6 pb-12">
      {/* Back Button & Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs text-on-surface-variant">
        <Link to="/crm/customers" className="hover:text-primary transition-colors flex items-center gap-1">
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          Clientes
        </Link>
        <span>/</span>
        <span className="text-on-surface font-semibold truncate">{customer.name}</span>
      </div>

      {/* Hero Header Card */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-primary-fixed text-primary font-bold text-2xl flex items-center justify-center shadow-xs">
            {customer.name ? customer.name.slice(0, 2).toUpperCase() : 'CL'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-on-surface tracking-tight">{customer.name}</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-success/10 text-success border border-success/30">
                Cliente Ativo
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-on-surface-variant">
              {customer.document && (
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">badge</span>
                  {formatDocument(customer.document)}
                </span>
              )}
              {customer.phone && (
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">phone</span>
                  {maskPhone(customer.phone)}
                </span>
              )}
              {customer.email && (
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">mail</span>
                  {customer.email}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <button
            type="button"
            onClick={() => setActiveTab(activeTab === 'edit' ? 'overview' : 'edit')}
            className="flex-1 md:flex-initial px-4 py-2 bg-surface-container border border-outline-variant hover:bg-surface-container-high text-on-surface text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-xs"
          >
            <span className="material-symbols-outlined text-[16px]">edit</span>
            {activeTab === 'edit' ? 'Ver Ficha' : 'Editar Cadastro'}
          </button>
          <Link
            to="/crm/vehicles/new"
            className="flex-1 md:flex-initial px-4 py-2 bg-primary text-on-primary hover:bg-primary-container text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-sm"
          >
            <span className="material-symbols-outlined text-[16px]">directions_car</span>
            Novo Veículo
          </Link>
        </div>
      </div>

      {/* Metrics Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-surface-container-lowest border border-outline-variant p-4 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-on-surface-variant mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Veículos</span>
            <span className="material-symbols-outlined text-primary text-[18px]">directions_car</span>
          </div>
          <span className="text-2xl font-black text-on-surface">{vehicles.length}</span>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant p-4 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-on-surface-variant mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">OS Concluídas</span>
            <span className="material-symbols-outlined text-success text-[18px]">check_circle</span>
          </div>
          <span className="text-2xl font-black text-on-surface">{completedOrdersCount}</span>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant p-4 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-on-surface-variant mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Orçamentos</span>
            <span className="material-symbols-outlined text-secondary text-[18px]">request_quote</span>
          </div>
          <span className="text-2xl font-black text-on-surface">{quotes.length}</span>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant p-4 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-on-surface-variant mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Gasto (LTV)</span>
            <span className="material-symbols-outlined text-primary text-[18px]">payments</span>
          </div>
          <span className="text-2xl font-black font-mono text-primary">
            R$ {totalSpent.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-outline-variant flex gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`pb-3 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === 'overview'
              ? 'border-primary text-primary'
              : 'border-transparent text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">dashboard</span>
          Visão Geral
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('vehicles')}
          className={`pb-3 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === 'vehicles'
              ? 'border-primary text-primary'
              : 'border-transparent text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">directions_car</span>
          Veículos ({vehicles.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('work-orders')}
          className={`pb-3 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === 'work-orders'
              ? 'border-primary text-primary'
              : 'border-transparent text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">build</span>
          Ordens de Serviço ({workOrders.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('quotes')}
          className={`pb-3 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === 'quotes'
              ? 'border-primary text-primary'
              : 'border-transparent text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">request_quote</span>
          Orçamentos ({quotes.length})
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'edit' && (
        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 shadow-sm">
          <CustomerForm customerId={customerId} />
        </div>
      )}

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Vehicles Card */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-base font-bold text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[20px]">directions_car</span>
                  Veículos da Frota
                </h3>
                <Link
                  to="/crm/vehicles/new"
                  className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                >
                  + Adicionar
                </Link>
              </div>

              {vehicles.length === 0 ? (
                <p className="text-xs text-on-surface-variant py-4 text-center">Nenhum veículo vinculado a este cliente.</p>
              ) : (
                <div className="space-y-3">
                  {vehicles.map((v) => (
                    <Link
                      key={v.id}
                      to="/crm/vehicles/$id"
                      params={{ id: v.id }}
                      className="p-3.5 rounded-xl border border-outline-variant hover:border-primary/50 hover:bg-surface-container/30 transition-all flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-3">
                        <span className="bg-surface-container-highest border border-outline-variant font-mono font-black text-xs px-2 py-0.5 rounded shadow-2xs">
                          {formatLicensePlate(v.licensePlate)}
                        </span>
                        <div>
                          <p className="text-xs font-bold text-on-surface group-hover:text-primary transition-colors">
                            {v.brand} {v.model}
                          </p>
                          <p className="text-[11px] text-on-surface-variant">{v.year ? `Ano ${v.year}` : ''}</p>
                        </div>
                      </div>
                      <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary text-[18px] transition-colors">
                        chevron_right
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recent Work Orders */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-base font-bold text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[20px]">build</span>
                  Últimos Atendimentos
                </h3>
                <Link
                  to="/operations/work-orders"
                  className="text-xs font-bold text-primary hover:underline"
                >
                  Ver Todas
                </Link>
              </div>

              {workOrders.length === 0 ? (
                <p className="text-xs text-on-surface-variant py-4 text-center">Nenhuma Ordem de Serviço registrada.</p>
              ) : (
                <div className="space-y-3">
                  {workOrders.slice(0, 4).map((wo) => (
                    <Link
                      key={wo.id}
                      to="/operations/work-orders/$id"
                      params={{ id: wo.id }}
                      className="p-3.5 rounded-xl border border-outline-variant hover:border-primary/50 hover:bg-surface-container/30 transition-all flex items-center justify-between group"
                    >
                      <div>
                        <p className="text-xs font-bold text-on-surface group-hover:text-primary transition-colors">
                          OS #{wo.id.slice(0, 8)} • {formatLicensePlate(wo.licensePlate)}
                        </p>
                        <p className="text-[11px] text-on-surface-variant">
                          {new Date(wo.createdAt).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-bold text-xs text-on-surface">
                          R$ {Number(wo.totalAmount || 0).toFixed(2)}
                        </span>
                        <span className="block text-[10px] uppercase font-bold text-on-surface-variant">{wo.status}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'vehicles' && (
        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-base font-bold text-on-surface">Veículos do Cliente</h3>
            <Link
              to="/crm/vehicles/new"
              className="px-4 py-2 bg-primary text-on-primary hover:bg-primary-container text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
              Cadastrar Veículo
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {vehicles.map((v) => (
              <div
                key={v.id}
                className="p-5 rounded-2xl border border-outline-variant hover:border-primary/40 bg-surface-container-lowest shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <span className="bg-surface-container-highest border border-outline-variant font-mono font-black text-sm px-2.5 py-0.5 rounded shadow-2xs">
                      {formatLicensePlate(v.licensePlate)}
                    </span>
                  </div>
                  <h4 className="text-base font-bold text-on-surface">{v.brand} {v.model}</h4>
                  <p className="text-xs text-on-surface-variant mt-1">
                    Ano: {v.year || 'N/A'}
                  </p>
                  {v.currentMileage && (
                    <p className="text-xs text-on-surface-variant">Km Atual: {v.currentMileage.toLocaleString()} km</p>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-outline-variant/60 flex justify-between items-center">
                  <Link
                    to="/crm/vehicles/$id"
                    params={{ id: v.id }}
                    className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                  >
                    Ver Ficha e Histórico
                    <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'work-orders' && (
        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 shadow-sm">
          <h3 className="text-base font-bold text-on-surface mb-4">Ordens de Serviço Realizadas</h3>
          <div className="border border-outline-variant rounded-xl overflow-x-auto shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-container/60 border-b border-outline-variant uppercase font-bold text-on-surface-variant">
                <tr>
                  <th className="py-3 px-4">OS ID</th>
                  <th className="py-3 px-4">Veículo</th>
                  <th className="py-3 px-4">Data</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Valor Total</th>
                  <th className="py-3 px-4 text-center">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/60">
                {workOrders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-on-surface-variant">
                      Nenhuma OS encontrada para este cliente.
                    </td>
                  </tr>
                ) : (
                  workOrders.map((wo) => (
                    <tr key={wo.id} className="hover:bg-surface-container/20 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-primary">
                        #{wo.id.slice(0, 8)}
                      </td>
                      <td className="py-3 px-4 font-semibold">
                        {formatLicensePlate(wo.licensePlate)}
                      </td>
                      <td className="py-3 px-4 text-on-surface-variant">
                        {new Date(wo.createdAt).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 bg-surface-container rounded-full font-bold text-[10px] uppercase">
                          {wo.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold">
                        R$ {Number(wo.totalAmount || 0).toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Link
                          to="/operations/work-orders/$id"
                          params={{ id: wo.id }}
                          className="text-xs font-bold text-primary hover:underline"
                        >
                          Detalhes
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

      {activeTab === 'quotes' && (
        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 shadow-sm">
          <h3 className="text-base font-bold text-on-surface mb-4">Orçamentos Emitidos</h3>
          <div className="border border-outline-variant rounded-xl overflow-x-auto shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-container/60 border-b border-outline-variant uppercase font-bold text-on-surface-variant">
                <tr>
                  <th className="py-3 px-4">Orçamento ID</th>
                  <th className="py-3 px-4">Data</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Valor Total</th>
                  <th className="py-3 px-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/60">
                {quotes.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-on-surface-variant">
                      Nenhum orçamento encontrado.
                    </td>
                  </tr>
                ) : (
                  quotes.map((q) => (
                    <tr key={q.id} className="hover:bg-surface-container/20 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-primary">
                        #{q.id.slice(0, 8)}
                      </td>
                      <td className="py-3 px-4 text-on-surface-variant">
                        {new Date(q.createdAt).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 bg-surface-container rounded-full font-bold text-[10px] uppercase">
                          {q.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold">
                        R$ {Number(q.totalAmount || 0).toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-center space-x-2">
                        <Link
                          to="/operations/quotes/$id"
                          params={{ id: q.id }}
                          className="text-xs font-bold text-primary hover:underline"
                        >
                          Abrir
                        </Link>
                        <a
                          href={`/portal/quotes/${q.id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-semibold text-secondary hover:underline"
                        >
                          Portal
                        </a>
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
