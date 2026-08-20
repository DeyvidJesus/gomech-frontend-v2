import React, { useEffect, useState } from 'react';
import { financeApi } from './api/financeApi';
import type { FinancePayable, FinanceAccount, PayableStatus } from './types';
import {
  ArrowUpRight,
  Filter,
  Check,
} from 'lucide-react';

export const PayablesList: React.FC = () => {
  const [payables, setPayables] = useState<FinancePayable[]>([]);
  const [accounts, setAccounts] = useState<FinanceAccount[]>([]);
  const [statusFilter, setStatusFilter] = useState<PayableStatus | ''>('');
  const [loading, setLoading] = useState(true);
  const [selectedPayable, setSelectedPayable] = useState<FinancePayable | null>(null);
  const [settleModalOpen, setSettleModalOpen] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [settleAmount, setSettleAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('TRANSFERENCIA');
  const [settling, setSettling] = useState(false);

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [payRes, accRes] = await Promise.all([
        financeApi.getPayables({ status: (statusFilter || undefined) as PayableStatus }),
        financeApi.getAccounts(),
      ]);
      setPayables(payRes.data.content || []);
      setAccounts(accRes.data || []);
      if (accRes.data?.length > 0) {
        setSelectedAccountId(accRes.data[0].id);
      }
    } catch (err) {
      console.error('Erro ao carregar contas a pagar', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenSettle = (pay: FinancePayable) => {
    setSelectedPayable(pay);
    setSettleAmount((pay.amount - pay.paidAmount).toString());
    setSettleModalOpen(true);
  };

  const handleSettle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPayable || !selectedAccountId) return;
    try {
      setSettling(true);
      await financeApi.settlePayable(selectedPayable.id, {
        accountId: selectedAccountId,
        paidAmount: parseFloat(settleAmount),
        paymentMethod,
        notes: `Pagamento via Painel de Contas a Pagar`,
      });
      setSettleModalOpen(false);
      setSelectedPayable(null);
      await loadData();
    } catch (err) {
      console.error('Erro ao pagar conta', err);
      alert('Erro ao processar pagamento.');
    } finally {
      setSettling(false);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const getStatusBadge = (status: PayableStatus) => {
    switch (status) {
      case 'PENDING':
        return <span className="badge badge-warning">Pendente</span>;
      case 'PAID':
        return <span className="badge badge-success">Pago</span>;
      case 'PARTIALLY_PAID':
        return <span className="badge badge-info">Parcial</span>;
      case 'CANCELLED':
        return <span className="badge badge-error">Cancelado</span>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ArrowUpRight className="w-6 h-6 text-rose-500" />
            Contas a Pagar
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Compromissos, compras de estoque, fornecedores e custos operacionais.
          </p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center gap-3 bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-sm">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300">
          <Filter className="w-4 h-4" />
          Status:
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as PayableStatus | '')}
          className="select select-sm select-bordered rounded-lg bg-slate-50 dark:bg-slate-900 text-sm"
        >
          <option value="">Todos os Status</option>
          <option value="PENDING">Pendentes</option>
          <option value="PAID">Pagos</option>
          <option value="PARTIALLY_PAID">Parcialmente Pagos</option>
          <option value="CANCELLED">Cancelados</option>
        </select>
      </div>

      {/* Payables Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-700/60">
              <tr>
                <th className="py-3.5 px-4">Descrição / Compromisso</th>
                <th className="py-3.5 px-4">Fornecedor</th>
                <th className="py-3.5 px-4">Vencimento</th>
                <th className="py-3.5 px-4 text-right">Valor</th>
                <th className="py-3.5 px-4 text-right">Valor Pago</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/40">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-400">
                    Carregando contas a pagar...
                  </td>
                </tr>
              ) : payables.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-400">
                    Nenhum compromisso encontrado.
                  </td>
                </tr>
              ) : (
                payables.map((pay) => (
                  <tr key={pay.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-900 dark:text-white">{pay.description}</div>
                      {pay.categoryName && (
                        <div className="text-xs text-slate-400">{pay.categoryName}</div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                      {pay.supplierName}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400 font-mono">
                      {pay.dueDate}
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-slate-900 dark:text-white">
                      {formatCurrency(pay.amount)}
                    </td>
                    <td className="py-3 px-4 text-right text-rose-600 dark:text-rose-400 font-semibold">
                      {formatCurrency(pay.paidAmount)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {getStatusBadge(pay.status)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {(pay.status === 'PENDING' || pay.status === 'PARTIALLY_PAID') && (
                        <button
                          onClick={() => handleOpenSettle(pay)}
                          className="btn btn-xs btn-primary inline-flex items-center gap-1"
                        >
                          <Check className="w-3 h-3" />
                          Pagar
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Settle Modal */}
      {settleModalOpen && selectedPayable && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              Liquidar Pagamento / Despesa
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              {selectedPayable.description} • Fornecedor: {selectedPayable.supplierName} • Valor: {formatCurrency(selectedPayable.amount)}
            </p>

            <form onSubmit={handleSettle} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Conta de Origem / Caixa *
                </label>
                <select
                  required
                  value={selectedAccountId}
                  onChange={(e) => setSelectedAccountId(e.target.value)}
                  className="select select-bordered w-full rounded-xl bg-slate-50 dark:bg-slate-900 text-sm"
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({formatCurrency(a.currentBalance)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Valor Pago (R$) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={settleAmount}
                  onChange={(e) => setSettleAmount(e.target.value)}
                  className="input input-bordered w-full rounded-xl bg-slate-50 dark:bg-slate-900 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Forma de Pagamento
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="select select-bordered w-full rounded-xl bg-slate-50 dark:bg-slate-900 text-sm"
                >
                  <option value="TRANSFERENCIA">Transferência / TED</option>
                  <option value="PIX">PIX</option>
                  <option value="BOLETO">Boleto Bancário</option>
                  <option value="CARTAO_CREDITO">Cartão Corporativo</option>
                  <option value="DINHEIRO">Dinheiro / Espécie</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700/60">
                <button
                  type="button"
                  onClick={() => setSettleModalOpen(false)}
                  className="btn btn-ghost text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={settling}
                  className="btn btn-primary text-sm inline-flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  {settling ? 'Processando...' : 'Confirmar Pagamento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
