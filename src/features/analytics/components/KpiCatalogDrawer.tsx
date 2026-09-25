import React from 'react';
import { X, BookOpen, RefreshCw, Calculator, Tag } from 'lucide-react';
import type { KpiDefinitionDto } from '../types/analytics';

interface KpiCatalogDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  kpis: KpiDefinitionDto[];
  isLoading?: boolean;
}

export const KpiCatalogDrawer: React.FC<KpiCatalogDrawerProps> = ({
  isOpen,
  onClose,
  kpis,
  isLoading,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/60 backdrop-blur-sm transition-opacity">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Contratos & Catálogo de KPIs</h3>
              <p className="text-xs text-slate-500">Definições formais, fórmulas, unidades e granularidades</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-6 h-6 animate-spin text-primary-500" />
            </div>
          )}

          {!isLoading && kpis.map((kpi) => (
            <div
              key={kpi.code}
              className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/40 space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-primary-100 dark:bg-primary-950 text-primary-700 dark:text-primary-400">
                      {kpi.code}
                    </span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-200/70 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                      {kpi.category}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-1">{kpi.name}</h4>
                </div>
                <span className="text-xs font-medium text-slate-500">Unidade: {kpi.unit}</span>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-400">{kpi.description}</p>

              <div className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 font-mono text-[11px] text-slate-800 dark:text-slate-300 flex items-start gap-2">
                <Calculator className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                <span>{kpi.formula}</span>
              </div>

              <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200/40 dark:border-slate-800/40">
                <div className="flex items-center gap-1.5">
                  <Tag className="w-3 h-3 text-slate-400" />
                  <span>Dimensões: {kpi.dimensions?.join(', ') || '-'}</span>
                </div>
                <div className="flex items-center gap-1.5 text-primary-600 dark:text-primary-400 font-medium">
                  <RefreshCw className="w-3 h-3" />
                  <span>{kpi.refreshPolicy}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
