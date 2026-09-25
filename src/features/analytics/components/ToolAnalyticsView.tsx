import React from 'react';
import { Hammer, ShieldAlert, Activity, DollarSign } from 'lucide-react';
import type { DashboardSummaryResponse } from '../types/analytics';

interface ToolAnalyticsViewProps {
  data: DashboardSummaryResponse;
}

export const ToolAnalyticsView: React.FC<ToolAnalyticsViewProps> = ({ data }) => {
  const { tools } = data;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white/70 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600">
              <Hammer className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500">Ferramentas Ativas</p>
              <h4 className="text-xl font-bold text-slate-900 dark:text-white">{tools.totalToolsCount}</h4>
            </div>
          </div>
          <div className="mt-3 text-[11px] text-slate-400">
            {tools.activeCustodiesCount} em custódia com mecânicos
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white/70 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500">Em Manutenção / Calibração</p>
              <h4 className="text-xl font-bold text-slate-900 dark:text-white">{tools.toolsInMaintenanceCount}</h4>
            </div>
          </div>
          <div className="mt-3 text-[11px] text-slate-400">
            Downtime total: {tools.totalDowntimeHours} h
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white/70 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500">Taxa de Utilização</p>
              <h4 className="text-xl font-bold text-slate-900 dark:text-white">{tools.utilizationRate.toFixed(1)}%</h4>
            </div>
          </div>
          <div className="mt-3 text-[11px] text-slate-400">
            Uso operacional ativo
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white/70 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950 text-rose-600">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500">Custo com Manutenções</p>
              <h4 className="text-xl font-bold text-slate-900 dark:text-white">
                R$ {tools.totalMaintenanceCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </h4>
            </div>
          </div>
          <div className="mt-3 text-[11px] text-slate-400">
            Reparos e calibrações de ferramentas
          </div>
        </div>
      </div>
    </div>
  );
};
