import React, { useEffect, useState } from 'react';
import { financeApi } from './api/financeApi';
import type { FinanceTransaction, FinanceAccount } from './types';
import {
  ArrowDownLeft,
  ArrowUpRight,
  DollarSign,
  Building,
} from 'lucide-react';

export const TransactionsList: React.FC = () => {
  const [transactions, setTransactions] = useState<FinanceTransaction[]>([]);
  const [accounts, setAccounts] = useState<FinanceAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [selectedAccountId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [txRes, accRes] = await Promise.all([
        financeApi.getTransactions(undefined, selectedAccountId || undefined),
        financeApi.getAccounts(),
      ]);
      setTransactions(txRes.data.content || []);
      setAccounts(accRes.data || []);
    } catch (err) {
      console.error('Erro ao carregar extrato', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-primary" />
            Extrato Financeiro e Lançamentos
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Livro-caixa unificado com todas as movimentações de crédito e débito.
          </p>
        </div>
      </div>

      {/* Filter by Account */}
      <div className="flex flex-wrap items-center gap-3 bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-sm">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300">
          <Building className="w-4 h-4 text-primary" />
          Filtrar por Conta:
        </div>
        <select
          value={selectedAccountId}
          onChange={(e) => setSelectedAccountId(e.target.value)}
          className="select select-sm select-bordered rounded-lg bg-slate-50 dark:bg-slate-900 text-sm"
        >
          <option value="">Todas as Contas</option>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
      </div>

      {/* Transactions Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-700/60">
              <tr>
                <th className="py-3.5 px-4">Data</th>
                <th className="py-3.5 px-4">Descrição</th>
                <th className="py-3.5 px-4">Conta</th>
                <th className="py-3.5 px-4">Categoria</th>
                <th className="py-3.5 px-4 text-center">Tipo</th>
                <th className="py-3.5 px-4 text-right">Valor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/40">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-400">
                    Carregando extrato...
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-400">
                    Nenhuma movimentação encontrada.
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => {
                  const isCredit = tx.type === 'CREDIT';
                  return (
                    <tr key={tx.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                      <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-400">
                        {tx.transactionDate}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-900 dark:text-white">{tx.description}</div>
                        {tx.sourceCorrelationId && (
                          <div className="text-xs text-slate-400 font-mono">{tx.sourceCorrelationId}</div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                        {tx.accountName || '-'}
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                        {tx.categoryName || '-'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {isCredit ? (
                          <span className="badge badge-success inline-flex items-center gap-1">
                            <ArrowDownLeft className="w-3 h-3" />
                            Entrada
                          </span>
                        ) : (
                          <span className="badge badge-error inline-flex items-center gap-1">
                            <ArrowUpRight className="w-3 h-3" />
                            Saída
                          </span>
                        )}
                      </td>
                      <td className={`py-3 px-4 text-right font-bold ${isCredit ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                        {isCredit ? '+' : '-'} {formatCurrency(tx.amount)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
