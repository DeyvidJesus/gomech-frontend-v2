import React from 'react';
import { Calendar, Download, BookOpen, RefreshCw } from 'lucide-react';

interface AnalyticsFilterBarProps {
  dateRange: '7d' | '30d' | 'this_month' | 'custom';
  setDateRange: (range: '7d' | '30d' | 'this_month' | 'custom') => void;
  startDate: string;
  setStartDate: (date: string) => void;
  endDate: string;
  setEndDate: (date: string) => void;
  onRefresh: () => void;
  onOpenCatalog: () => void;
  onOpenExport: () => void;
  isLoading?: boolean;
}

export const AnalyticsFilterBar: React.FC<AnalyticsFilterBarProps> = ({
  dateRange,
  setDateRange,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  onRefresh,
  onOpenCatalog,
  onOpenExport,
  isLoading,
}) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
      {/* Date presets */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300">
          <Calendar className="w-4 h-4 text-primary-500" />
          <span>Período:</span>
        </div>

        <button
          type="button"
          onClick={() => setDateRange('7d')}
          className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
            dateRange === '7d'
              ? 'bg-primary-600 text-white shadow-sm shadow-primary-500/20'
              : 'bg-slate-100 hover:bg-slate-200/70 text-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
          }`}
        >
          Últimos 7 dias
        </button>

        <button
          type="button"
          onClick={() => setDateRange('30d')}
          className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
            dateRange === '30d'
              ? 'bg-primary-600 text-white shadow-sm shadow-primary-500/20'
              : 'bg-slate-100 hover:bg-slate-200/70 text-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
          }`}
        >
          Últimos 30 dias
        </button>

        <button
          type="button"
          onClick={() => setDateRange('this_month')}
          className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
            dateRange === 'this_month'
              ? 'bg-primary-600 text-white shadow-sm shadow-primary-500/20'
              : 'bg-slate-100 hover:bg-slate-200/70 text-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
          }`}
        >
          Este Mês
        </button>

        {dateRange === 'custom' && (
          <div className="flex items-center gap-2 ml-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="text-xs px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <span className="text-xs text-slate-400">até</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="text-xs px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2.5 self-end md:self-auto">
        <button
          type="button"
          onClick={onRefresh}
          disabled={isLoading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          title="Recarregar dados"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Atualizar</span>
        </button>

        <button
          type="button"
          onClick={onOpenCatalog}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors border border-indigo-200/50 dark:border-indigo-800/50"
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Catálogo de KPIs</span>
        </button>

        <button
          type="button"
          onClick={onOpenExport}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-white bg-primary-600 hover:bg-primary-500 shadow-sm shadow-primary-600/30 transition-all"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Exportar Relatório</span>
        </button>
      </div>
    </div>
  );
};
