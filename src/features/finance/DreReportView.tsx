import React, { useEffect, useState } from 'react';
import { financeApi } from './api/financeApi';
import type { DreReport } from './types';
import {
  FileText,
  Calendar,
} from 'lucide-react';

export const DreReportView: React.FC = () => {
  const [dre, setDre] = useState<DreReport | null>(null);
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
    loadDre();
  }, [startDate, endDate]);

  const loadDre = async () => {
    try {
      setLoading(true);
      const res = await financeApi.getDre(startDate, endDate);
      setDre(res.data);
    } catch (err) {
      console.error('Erro ao carregar DRE', err);
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
            <FileText className="w-6 h-6 text-indigo-500" />
            Demonstrativo do Resultado do Exercício (DRE)
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Apuração de receitas, custos diretos de peças, despesas fixas e lucratividade real por competência.
          </p>
        </div>
      </div>

      {/* Date Range Selector */}
      <div className="flex flex-wrap items-center gap-4 bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-sm">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300">
          <Calendar className="w-4 h-4 text-primary" />
          Período Contábil:
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

      {/* DRE Full Statement */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-sm p-6 space-y-6">
        {loading ? (
          <div className="text-center py-12 text-slate-400">Gerando relatório contábil...</div>
        ) : !dre ? (
          <div className="text-center py-12 text-slate-400">Nenhum dado encontrado para o período.</div>
        ) : (
          <div className="space-y-4">
            {/* 1. Receita Operacional Bruta */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-700/50">
              <div className="flex justify-between items-center text-base font-bold text-slate-900 dark:text-white">
                <span>1. RECEITA OPERACIONAL BRUTA</span>
                <span className="text-emerald-600 dark:text-emerald-400">{formatCurrency(dre.grossRevenue)} (100%)</span>
              </div>
            </div>

            {/* 2. Deduções e Impostos */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-700/50">
              <div className="flex justify-between items-center text-sm font-semibold text-slate-700 dark:text-slate-300">
                <span>2. (-) Deduções da Receita Bruta e Impostos</span>
                <span className="text-rose-600 dark:text-rose-400">{formatCurrency(dre.deductionsAndTaxes)}</span>
              </div>
            </div>

            {/* Receita Líquida */}
            <div className="px-4 py-2 flex justify-between items-center text-sm font-bold text-slate-900 dark:text-white border-y border-slate-200 dark:border-slate-700">
              <span>(=) RECEITA OPERACIONAL LÍQUIDA</span>
              <span>{formatCurrency(dre.netRevenue)}</span>
            </div>

            {/* 3. Custos Variáveis / CMV */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-700/50">
              <div className="flex justify-between items-center text-sm font-semibold text-slate-700 dark:text-slate-300">
                <span>3. (-) Custos das Peças e Serviços Prestados (CMV)</span>
                <span className="text-rose-600 dark:text-rose-400">{formatCurrency(dre.variableCosts)}</span>
              </div>
            </div>

            {/* Lucro Bruto */}
            <div className="px-4 py-3 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 flex justify-between items-center text-base font-bold text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40">
              <span>(=) LUCRO BRUTO (Margem Bruta: {dre.grossMarginPercentage.toFixed(1)}%)</span>
              <span>{formatCurrency(dre.grossProfit)}</span>
            </div>

            {/* 4. Despesas Operacionais */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-700/50">
              <div className="flex justify-between items-center text-sm font-semibold text-slate-700 dark:text-slate-300">
                <span>4. (-) Despesas Operacionais / Administrativas</span>
                <span className="text-rose-600 dark:text-rose-400">{formatCurrency(dre.operatingExpenses)}</span>
              </div>
            </div>

            {/* Lucro Líquido Final */}
            <div className={`p-5 rounded-xl flex justify-between items-center text-lg font-bold border-2 ${
              dre.netProfit >= 0
                ? 'bg-emerald-500/10 border-emerald-500 text-emerald-700 dark:text-emerald-300'
                : 'bg-rose-500/10 border-rose-500 text-rose-700 dark:text-rose-300'
            }`}>
              <div>
                <div>(=) RESULTADO LÍQUIDO DO EXERCÍCIO</div>
                <div className="text-xs font-normal opacity-80 mt-0.5">
                  Margem Líquida: {dre.netMarginPercentage.toFixed(1)}% sobre a receita bruta
                </div>
              </div>
              <div className="text-2xl">{formatCurrency(dre.netProfit)}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
