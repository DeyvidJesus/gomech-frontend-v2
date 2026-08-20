import React, { useEffect, useState } from 'react';
import { financeApi } from './api/financeApi';
import type { CashFlowReport } from './types';
import {
  TrendingUp,
  Calendar,
} from 'lucide-react';

export const CashFlowView: React.FC = () => {
  const [cashFlow, setCashFlow] = useState<CashFlowReport | null>(null);
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split('T')[0];
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCashFlow();
  }, [startDate, endDate]);

  const loadCashFlow = async () => {
    try {
      setLoading(true);
      const res = await financeApi.getCashFlow(startDate, endDate);
      setCashFlow(res.data);
    } catch (err) {
      console.error('Erro ao carregar fluxo de caixa', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (val?: number | null) => {
    if (val === undefined || val === null) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-emerald-500" />
            Fluxo de Caixa
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Acompanhamento diário de entradas, saídas e evolução do saldo acumulado.
          </p>
        </div>
      </div>

      {/* Date Range Selector */}
      <div className="flex flex-wrap items-center gap-4 bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-sm">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300">
          <Calendar className="w-4 h-4 text-primary" />
          Período:
        </div>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="input input-sm input-bordered rounded-lg bg-slate-50 dark:bg-slate-900 text-sm"
          />
          <span className="text-slate-400">até</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="input input-sm input-bordered rounded-lg bg-slate-50 dark:bg-slate-900 text-sm"
          />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700/60 shadow-sm">
          <div className="text-xs font-semibold uppercase text-slate-400">Saldo Inicial</div>
          <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">
            {formatCurrency(cashFlow?.initialBalance)}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700/60 shadow-sm">
          <div className="text-xs font-semibold uppercase text-slate-400">Total de Entradas</div>
          <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            +{formatCurrency(cashFlow?.totalInflows)}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700/60 shadow-sm">
          <div className="text-xs font-semibold uppercase text-slate-400">Total de Saídas</div>
          <div className="text-xl font-bold text-rose-600 dark:text-rose-400 mt-1">
            -{formatCurrency(cashFlow?.totalOutflows)}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700/60 shadow-sm">
          <div className="text-xs font-semibold uppercase text-slate-400">Saldo Final em Caixa</div>
          <div className="text-xl font-bold text-primary mt-1">
            {formatCurrency(cashFlow?.finalBalance)}
          </div>
        </div>
      </div>

      {/* Daily Entries Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-700/60">
              <tr>
                <th className="py-3.5 px-4">Data</th>
                <th className="py-3.5 px-4 text-right">Entradas (R$)</th>
                <th className="py-3.5 px-4 text-right">Saídas (R$)</th>
                <th className="py-3.5 px-4 text-right">Saldo do Dia</th>
                <th className="py-3.5 px-4 text-right">Saldo Acumulado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/40">
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-slate-400">
                    Calculando fluxo de caixa...
                  </td>
                </tr>
              ) : !cashFlow?.dailyEntries || cashFlow.dailyEntries.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-slate-400">
                    Nenhum registro para o período.
                  </td>
                </tr>
              ) : (
                cashFlow.dailyEntries.map((day) => (
                  <tr key={day.date} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                    <td className="py-3 px-4 font-mono font-medium text-slate-900 dark:text-white">
                      {day.date}
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-emerald-600 dark:text-emerald-400">
                      {day.inflows > 0 ? `+${formatCurrency(day.inflows)}` : '-'}
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-rose-600 dark:text-rose-400">
                      {day.outflows > 0 ? `-${formatCurrency(day.outflows)}` : '-'}
                    </td>
                    <td className={`py-3 px-4 text-right font-semibold ${day.netAmount >= 0 ? 'text-slate-900 dark:text-white' : 'text-rose-600'}`}>
                      {formatCurrency(day.netAmount)}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900 dark:text-white">
                      {formatCurrency(day.accumulatedBalance)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
