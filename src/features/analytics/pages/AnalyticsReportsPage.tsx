import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart3,
  TrendingUp,
  Wrench,
  DollarSign,
  Package,
  Hammer,
  FileSpreadsheet,
  Search,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { analyticsApi } from '../api/analyticsApi';
import { KpiMetricCard } from '../components/KpiMetricCard';
import { AnalyticsFilterBar } from '../components/AnalyticsFilterBar';
import { OperationalAnalyticsView } from '../components/OperationalAnalyticsView';
import { FinancialAnalyticsView } from '../components/FinancialAnalyticsView';
import { InventoryAnalyticsView } from '../components/InventoryAnalyticsView';
import { ToolAnalyticsView } from '../components/ToolAnalyticsView';
import { KpiCatalogDrawer } from '../components/KpiCatalogDrawer';
import { ExportReportModal } from '../components/ExportReportModal';
import type { ExportFormat, ReportType } from '../types/analytics';

export function AnalyticsReportsPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'operations' | 'finance' | 'inventory' | 'tools' | 'tabular'>('overview');
  const [dateRange, setDateRange] = useState<'7d' | '30d' | 'this_month' | 'custom'>('30d');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);

  // Tabular report state
  const [tabularType, setTabularType] = useState<ReportType>('OPERATIONAL_SUMMARY');
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');

  // 1. Dashboard summary query
  const { data: dashboardData, isLoading: isDashboardLoading, refetch: refetchDashboard } = useQuery({
    queryKey: ['analytics', 'dashboard', dateRange, startDate, endDate],
    queryFn: async () => {
      const res = await analyticsApi.getDashboard({
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
      return res.data;
    },
  });

  // 2. Tabular report query
  const { data: reportData, isLoading: isReportLoading, refetch: refetchReport } = useQuery({
    queryKey: ['analytics', 'report', tabularType, page, search, startDate, endDate],
    queryFn: async () => {
      const res = await analyticsApi.getReport({
        reportType: tabularType,
        page,
        size: 15,
        search: search || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
      return res.data;
    },
    enabled: activeTab === 'tabular',
  });

  // 3. KPI Catalog query
  const { data: catalogData, isLoading: isCatalogLoading } = useQuery({
    queryKey: ['analytics', 'kpi-catalog'],
    queryFn: async () => {
      const res = await analyticsApi.getKpiCatalog();
      return res.data;
    },
    enabled: isCatalogOpen,
  });

  const handleExport = async (type: ReportType, format: ExportFormat) => {
    const blob = await analyticsApi.exportReport({
      reportType: type,
      format,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    });

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `relatorio-${type.toLowerCase()}-${new Date().toISOString().split('T')[0]}.${format.toLowerCase()}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
            <span className="p-2 rounded-2xl bg-gradient-to-br from-primary-500 to-indigo-600 text-white shadow-lg shadow-primary-500/30">
              <BarChart3 className="w-6 h-6" />
            </span>
            Analytics & Relatórios Gerenciais
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Inteligência de dados orientada a eventos para gestão de oficinas e centros automotivos
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <AnalyticsFilterBar
        dateRange={dateRange}
        setDateRange={setDateRange}
        startDate={startDate}
        setStartDate={setStartDate}
        endDate={endDate}
        setEndDate={setEndDate}
        onRefresh={() => {
          refetchDashboard();
          if (activeTab === 'tabular') refetchReport();
        }}
        onOpenCatalog={() => setIsCatalogOpen(true)}
        onOpenExport={() => setIsExportOpen(true)}
        isLoading={isDashboardLoading || isReportLoading}
      />

      {/* Hero KPIs Cards */}
      {dashboardData?.heroKpis && dashboardData.heroKpis.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {dashboardData.heroKpis.map((kpi) => (
            <KpiMetricCard key={kpi.code} card={kpi} />
          ))}
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 overflow-x-auto pb-px">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'overview'
              ? 'border-primary-500 text-primary-600 dark:text-primary-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Visão Geral Executiva</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('operations')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'operations'
              ? 'border-primary-500 text-primary-600 dark:text-primary-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <Wrench className="w-4 h-4" />
          <span>Operações & OS</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('finance')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'finance'
              ? 'border-primary-500 text-primary-600 dark:text-primary-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>Financeiro</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('inventory')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'inventory'
              ? 'border-primary-500 text-primary-600 dark:text-primary-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Estoque & Peças</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('tools')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'tools'
              ? 'border-primary-500 text-primary-600 dark:text-primary-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <Hammer className="w-4 h-4" />
          <span>Ferramentas</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('tabular')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'tabular'
              ? 'border-primary-500 text-primary-600 dark:text-primary-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Relatórios Detalhados</span>
        </button>
      </div>

      {/* Tab Content */}
      {isDashboardLoading && (
        <div className="py-20 text-center text-slate-400">Carregando métricas e projeções...</div>
      )}

      {!isDashboardLoading && dashboardData && (
        <div>
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <OperationalAnalyticsView data={dashboardData} />
              <FinancialAnalyticsView data={dashboardData} />
            </div>
          )}

          {activeTab === 'operations' && <OperationalAnalyticsView data={dashboardData} />}
          {activeTab === 'finance' && <FinancialAnalyticsView data={dashboardData} />}
          {activeTab === 'inventory' && <InventoryAnalyticsView data={dashboardData} />}
          {activeTab === 'tools' && <ToolAnalyticsView data={dashboardData} />}
        </div>
      )}

      {/* Tabular Reports Tab */}
      {activeTab === 'tabular' && (
        <div className="space-y-6">
          {/* Subheader controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white/70 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800/80">
            <div className="flex items-center gap-3">
              <select
                value={tabularType}
                onChange={(e) => {
                  setTabularType(e.target.value as ReportType);
                  setPage(0);
                }}
                className="text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-primary-500"
              >
                <option value="OPERATIONAL_SUMMARY">Resumo Operacional de OS</option>
                <option value="FINANCIAL_PERFORMANCE">Demonstrativo Financeiro</option>
                <option value="INVENTORY_FLOW">Fluxo de Estoque</option>
                <option value="TOOL_EFFICIENCY">Eficiência de Ferramentas</option>
              </select>

              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Pesquisar..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            <div className="text-xs font-medium text-slate-500">
              Total de registros: <span className="font-bold text-slate-900 dark:text-white">{reportData?.totalElements || 0}</span>
            </div>
          </div>

          {/* Table */}
          <div className="p-6 rounded-2xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase tracking-wider">
                    {reportData?.columnHeaders?.map((header, i) => (
                      <th key={i} className="pb-3 font-semibold">{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {reportData?.rows?.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 font-medium text-slate-900 dark:text-white">{row.date}</td>
                      <td className="py-3 font-mono font-bold text-primary-600 dark:text-primary-400">{row.referenceCode}</td>
                      <td className="py-3 text-slate-600 dark:text-slate-300">{row.category}</td>
                      <td className="py-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {row.status}
                        </span>
                      </td>
                      <td className="py-3 text-center">{row.quantity}</td>
                      <td className="py-3 font-mono font-bold text-slate-900 dark:text-white">
                        R$ {row.primaryAmount?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}

                  {(!reportData?.rows || reportData.rows.length === 0) && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        Nenhum registro encontrado no período selecionado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination controls */}
            {reportData && reportData.totalPages > 1 && (
              <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 text-xs">
                <span className="text-slate-500">
                  Página {reportData.currentPage + 1} de {reportData.totalPages}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={page === 0}
                    onClick={() => setPage((p) => Math.max(p - 1, 0))}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-30 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    disabled={page >= reportData.totalPages - 1}
                    onClick={() => setPage((p) => p + 1)}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-30 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* KPI Catalog Slide-over */}
      <KpiCatalogDrawer
        isOpen={isCatalogOpen}
        onClose={() => setIsCatalogOpen(false)}
        kpis={catalogData || []}
        isLoading={isCatalogLoading}
      />

      {/* Export Report Modal */}
      <ExportReportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        onExport={handleExport}
        reportsQuotaUsed={dashboardData?.billing?.reportsQuotaUsed || 0}
        reportsQuotaLimit={dashboardData?.billing?.reportsQuotaLimit || 500}
      />
    </div>
  );
}
