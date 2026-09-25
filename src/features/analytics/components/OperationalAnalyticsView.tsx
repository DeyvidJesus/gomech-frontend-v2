import React from 'react';
import { Wrench, CheckCircle2, Clock, FileCheck, Users, TrendingUp } from 'lucide-react';
import type { DashboardSummaryResponse } from '../types/analytics';

interface OperationalAnalyticsViewProps {
  data: DashboardSummaryResponse;
}

export const OperationalAnalyticsView: React.FC<OperationalAnalyticsViewProps> = ({ data }) => {
  const { operational, revenueTimeSeries, serviceVsPartsBreakdown, topTechnicians } = data;

  const maxRevenue = Math.max(...revenueTimeSeries.map((p) => p.revenue), 1);

  return (
    <div className="space-y-6">
      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white/70 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800/80 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
            <Wrench className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">Volume Total de OS</p>
            <h4 className="text-xl font-bold text-slate-900 dark:text-white">{operational.totalWorkOrders}</h4>
            <span className="text-[11px] text-slate-400">{operational.inProgressWorkOrders} em andamento</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white/70 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800/80 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">OS Concluídas</p>
            <h4 className="text-xl font-bold text-slate-900 dark:text-white">{operational.completedWorkOrders}</h4>
            <span className="text-[11px] text-emerald-600 font-medium">{operational.canceledWorkOrders} canceladas</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white/70 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800/80 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">Lead Time Médio</p>
            <h4 className="text-xl font-bold text-slate-900 dark:text-white">{operational.avgTurnaroundHours} h</h4>
            <span className="text-[11px] text-slate-400">Tempo de abertura a entrega</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white/70 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800/80 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400">
            <FileCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">Conversão de Orçamentos</p>
            <h4 className="text-xl font-bold text-slate-900 dark:text-white">{operational.quoteConversionRate.toFixed(1)}%</h4>
            <span className="text-[11px] text-slate-400">{operational.approvedQuotes} aprovados de {operational.totalQuotes}</span>
          </div>
        </div>
      </div>

      {/* Charts & Breakdown Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Throughput Chart */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary-500" />
                Throughput & Faturamento Diário de OS
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">Evolução do faturamento e ordens de serviço finalizadas por dia</p>
            </div>
          </div>

          <div className="h-48 flex items-end gap-2 pt-6 border-b border-slate-100 dark:border-slate-800">
            {revenueTimeSeries.map((point, idx) => {
              const heightPct = Math.max((point.revenue / maxRevenue) * 100, 4);
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1 group relative">
                  {/* Tooltip */}
                  <div className="absolute bottom-full mb-2 hidden group-hover:block z-20 p-2 rounded-lg bg-slate-900 text-white text-[10px] whitespace-nowrap shadow-xl">
                    <p className="font-bold">{point.label}</p>
                    <p>Faturamento: R$ {point.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    <p>OS Finalizadas: {point.workOrdersCount}</p>
                  </div>
                  
                  {/* Bar */}
                  <div
                    style={{ height: `${heightPct}%` }}
                    className="w-full max-w-[28px] rounded-t-lg bg-gradient-to-t from-primary-600 to-primary-400 group-hover:from-primary-500 group-hover:to-primary-300 transition-all duration-200 shadow-sm"
                  />
                  <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 truncate w-full text-center">
                    {point.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Revenue Composition Split */}
        <div className="p-6 rounded-2xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm flex flex-col justify-between">
          <div>
            <h4 className="text-base font-bold text-slate-900 dark:text-white">Composição do Faturamento</h4>
            <p className="text-xs text-slate-500 mt-0.5">Distribuição entre Mão de Obra e Peças aplicadas</p>

            <div className="mt-6 space-y-4">
              {serviceVsPartsBreakdown.map((item) => (
                <div key={item.key} className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{item.label}</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">
                      R$ {item.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} ({item.percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      style={{ width: `${item.percentage}%`, backgroundColor: item.colorHex }}
                      className="h-full rounded-full transition-all duration-500"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 mt-6">
            <span className="text-xs text-slate-500">Ticket Médio Consolidado:</span>
            <p className="text-lg font-bold text-slate-900 dark:text-white">
              R$ {operational.avgTicket.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      </div>

      {/* Technician Leaderboard */}
      {topTechnicians.length > 0 && (
        <div className="p-6 rounded-2xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-primary-500" />
              Produtividade por Mecânico
            </h4>
            <span className="text-xs text-slate-400">Classificação por volume de faturamento</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase tracking-wider">
                  <th className="pb-3 font-semibold">Técnico / Mecânico</th>
                  <th className="pb-3 font-semibold text-center">OS Concluídas</th>
                  <th className="pb-3 font-semibold text-center">Tempo Médio (h)</th>
                  <th className="pb-3 font-semibold text-right">Faturamento Gerado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {topTechnicians.map((tech, idx) => (
                  <tr key={tech.mechanicUserId} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 font-medium text-slate-900 dark:text-white flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-primary-100 dark:bg-primary-950 text-primary-600 dark:text-primary-400 text-[10px] font-bold flex items-center justify-center">
                        {idx + 1}
                      </span>
                      {tech.mechanicName}
                    </td>
                    <td className="py-3 text-center text-slate-600 dark:text-slate-300 font-semibold">
                      {tech.completedOrdersCount}
                    </td>
                    <td className="py-3 text-center text-slate-500">
                      {tech.avgTurnaroundHours} h
                    </td>
                    <td className="py-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                      R$ {tech.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
