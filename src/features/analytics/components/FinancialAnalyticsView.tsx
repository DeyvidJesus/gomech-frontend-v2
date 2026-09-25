import React from 'react';
import { DollarSign, TrendingUp, AlertTriangle, PieChart } from 'lucide-react';
import type { DashboardSummaryResponse } from '../types/analytics';

interface FinancialAnalyticsViewProps {
  data: DashboardSummaryResponse;
}

export const FinancialAnalyticsView: React.FC<FinancialAnalyticsViewProps> = ({ data }) => {
  const { financial } = data;

  return (
    <div className="space-y-6">
      {/* Financial KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white/70 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500">Receita Liquidada</p>
              <h4 className="text-xl font-bold text-slate-900 dark:text-white">
                R$ {financial.netRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </h4>
            </div>
          </div>
          <div className="mt-3 text-[11px] text-slate-400">
            Total faturado: R$ {financial.grossRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white/70 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500">Lucro Líquido</p>
              <h4 className="text-xl font-bold text-slate-900 dark:text-white">
                R$ {financial.netProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </h4>
            </div>
          </div>
          <div className="mt-3 text-[11px] text-slate-400">
            Margem operacional: <span className="text-emerald-600 font-bold">{financial.operatingMargin.toFixed(1)}%</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white/70 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950 text-rose-600">
              <PieChart className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500">Despesas Liquidadas</p>
              <h4 className="text-xl font-bold text-slate-900 dark:text-white">
                R$ {financial.payablesPaid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </h4>
            </div>
          </div>
          <div className="mt-3 text-[11px] text-slate-400">
            A pagar pendente: R$ {financial.payablesPending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white/70 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500">Taxa de Inadimplência</p>
              <h4 className="text-xl font-bold text-slate-900 dark:text-white">
                {financial.delinquencyRate.toFixed(1)}%
              </h4>
            </div>
          </div>
          <div className="mt-3 text-[11px] text-slate-400">
            Vencidos: R$ {financial.receivablesOverdue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      {/* Receivables & Payables Status Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
          <h4 className="text-base font-bold text-slate-900 dark:text-white mb-4">Contas a Receber (Recebíveis)</h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center text-xs py-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500">Recebidos / Liquidados</span>
              <span className="font-mono font-bold text-emerald-600">
                R$ {financial.receivablesPaid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs py-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500">A Receber (Em Aberto)</span>
              <span className="font-mono font-bold text-blue-600">
                R$ {financial.receivablesPending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs py-2">
              <span className="text-slate-500">Vencidos (Inadimplentes)</span>
              <span className="font-mono font-bold text-rose-600">
                R$ {financial.receivablesOverdue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
          <h4 className="text-base font-bold text-slate-900 dark:text-white mb-4">Contas a Pagar (Despesas & Fornecedores)</h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center text-xs py-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500">Despesas Pagas</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">
                R$ {financial.payablesPaid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs py-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500">Despesas Previstas / A Vencer</span>
              <span className="font-mono font-bold text-amber-600">
                R$ {financial.payablesPending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs py-2">
              <span className="text-slate-500">Total Comprometido</span>
              <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                R$ {financial.payablesTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
