import React, { useEffect, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { financeApi } from './api/financeApi';
import type { FinanceAccount, DreReport, CashFlowReport } from './types';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownLeft,
  FileText,
  PieChart,
  Building,
} from 'lucide-react';

export const FinanceDashboard: React.FC = () => {
  const [accounts, setAccounts] = useState<FinanceAccount[]>([]);
  const [dre, setDre] = useState<DreReport | null>(null);
  const [cashFlow, setCashFlow] = useState<CashFlowReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [accRes, dreRes, cfRes] = await Promise.all([
        financeApi.getAccounts(),
        financeApi.getDre(),
        financeApi.getCashFlow(),
      ]);
      setAccounts(accRes.data);
      setDre(dreRes.data);
      setCashFlow(cfRes.data);
    } catch (err) {
      console.error('Erro ao carregar dados financeiros', err);
    } finally {
      setLoading(false);
    }
  };

  const totalBalance = accounts.reduce((sum, acc) => sum + acc.currentBalance, 0);

  const formatCurrency = (val?: number | null) => {
    if (val === undefined || val === null) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Painel Financeiro</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Visão consolidada de caixa, contas a receber, contas a pagar e DRE.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/finance/receivables"
            className="btn btn-secondary inline-flex items-center gap-2 text-sm"
          >
            <ArrowDownLeft className="w-4 h-4 text-emerald-500" />
            Contas a Receber
          </Link>
          <Link
            to="/finance/payables"
            className="btn btn-secondary inline-flex items-center gap-2 text-sm"
          >
            <ArrowUpRight className="w-4 h-4 text-rose-500" />
            Contas a Pagar
          </Link>
          <Link
            to="/finance/accounts"
            className="btn btn-primary inline-flex items-center gap-2 text-sm"
          >
            <Wallet className="w-4 h-4" />
            Minhas Contas
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Cash Balance */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700/60 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Saldo Total em Contas
            </span>
            <div className="p-2 bg-primary/10 text-primary rounded-lg">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {formatCurrency(totalBalance)}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
              <span>{accounts.length} conta(s) ativa(s)</span>
            </div>
          </div>
        </div>

        {/* Cash Inflows (Recebimentos) */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700/60 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Entradas do Mês
            </span>
            <div className="p-2 bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400 rounded-lg">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {formatCurrency(cashFlow?.totalInflows)}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Recebido no período
            </div>
          </div>
        </div>

        {/* Cash Outflows (Pagamentos) */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700/60 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Saídas do Mês
            </span>
            <div className="p-2 bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400 rounded-lg">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">
              {formatCurrency(cashFlow?.totalOutflows)}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Despesas e compras
            </div>
          </div>
        </div>

        {/* DRE Net Profit */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700/60 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Lucro Líquido (DRE)
            </span>
            <div className="p-2 bg-indigo-50 text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-400 rounded-lg">
              <PieChart className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className={`text-2xl font-bold ${(dre?.netProfit || 0) >= 0 ? 'text-slate-900 dark:text-white' : 'text-rose-600'}`}>
              {formatCurrency(dre?.netProfit)}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Margem Líquida: {dre?.netMarginPercentage ? dre.netMarginPercentage.toFixed(1) : '0.0'}%
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Accounts List + DRE Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Accounts / Wallets Overview */}
        <div className="lg:col-span-1 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700/60 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Building className="w-4 h-4 text-primary" />
              Contas e Caixas
            </h2>
            <Link to="/finance/accounts" className="text-xs text-primary hover:underline font-medium">
              Gerenciar
            </Link>
          </div>

          <div className="space-y-3">
            {accounts.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-6">Nenhuma conta cadastrada.</p>
            ) : (
              accounts.map((acc) => (
                <div
                  key={acc.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-900/40"
                >
                  <div>
                    <div className="text-sm font-medium text-slate-900 dark:text-white">{acc.name}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {acc.bankName ? `${acc.bankName} • Ag ${acc.agency || '-'} CC ${acc.accountNumber || '-'}` : 'Caixa Físico'}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-slate-900 dark:text-white">
                      {formatCurrency(acc.currentBalance)}
                    </div>
                    <span className="inline-block text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-medium">
                      Ativa
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick DRE Statement */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700/60 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-500" />
              Demonstrativo de Resultado (Competência)
            </h2>
            <Link to="/finance/dre" className="text-xs text-primary hover:underline font-medium">
              Ver DRE Completo
            </Link>
          </div>

          <div className="space-y-3 divide-y divide-slate-100 dark:divide-slate-700/50">
            <div className="flex justify-between items-center pt-2">
              <span className="text-sm text-slate-600 dark:text-slate-300 font-medium">Receita Operacional Bruta</span>
              <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                {formatCurrency(dre?.grossRevenue)}
              </span>
            </div>

            <div className="flex justify-between items-center pt-2">
              <span className="text-sm text-slate-600 dark:text-slate-300">(-) Custos Variáveis / Peças (CMV)</span>
              <span className="text-sm font-medium text-rose-600 dark:text-rose-400">
                {formatCurrency(dre?.variableCosts)}
              </span>
            </div>

            <div className="flex justify-between items-center pt-2 bg-slate-50 dark:bg-slate-900/30 p-2 rounded">
              <span className="text-sm font-semibold text-slate-900 dark:text-white">(=) Lucro Bruto</span>
              <span className="text-sm font-bold text-slate-900 dark:text-white">
                {formatCurrency(dre?.grossProfit)} ({dre?.grossMarginPercentage?.toFixed(1) || '0'}%)
              </span>
            </div>

            <div className="flex justify-between items-center pt-2">
              <span className="text-sm text-slate-600 dark:text-slate-300">(-) Despesas Operacionais / Fixas</span>
              <span className="text-sm font-medium text-rose-600 dark:text-rose-400">
                {formatCurrency(dre?.operatingExpenses)}
              </span>
            </div>

            <div className="flex justify-between items-center pt-3 border-t-2 border-slate-300 dark:border-slate-600">
              <span className="text-base font-bold text-slate-900 dark:text-white">(=) Lucro Líquido do Exercício</span>
              <span className={`text-base font-bold ${(dre?.netProfit || 0) >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'}`}>
                {formatCurrency(dre?.netProfit)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
