import React, { useEffect, useState } from 'react';
import { financeApi } from './api/financeApi';
import type { FinanceReceivable, FinanceAccount, ReceivableStatus } from './types';
import {
  ArrowDownLeft,
  Filter,
  Check,
} from 'lucide-react';

export const ReceivablesList: React.FC = () => {
  const [receivables, setReceivables] = useState<FinanceReceivable[]>([]);
  const [accounts, setAccounts] = useState<FinanceAccount[]>([]);
  const [statusFilter, setStatusFilter] = useState<ReceivableStatus | ''>('');
  const [loading, setLoading] = useState(true);
  const [selectedRec, setSelectedRec] = useState<FinanceReceivable | null>(null);
  const [settleModalOpen, setSettleModalOpen] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [settleAmount, setSettleAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('PIX');
  const [settling, setSettling] = useState(false);

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [recRes, accRes] = await Promise.all([
        financeApi.getReceivables({ status: (statusFilter || undefined) as ReceivableStatus }),
        financeApi.getAccounts(),
      ]);
      setReceivables(recRes.data.content || []);
      setAccounts(accRes.data || []);
      if (accRes.data?.length > 0) {
        setSelectedAccountId(accRes.data[0].id);
      }
    } catch (err) {
      console.error('Erro ao carregar contas a receber', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenSettle = (rec: FinanceReceivable) => {
    setSelectedRec(rec);
    setSettleAmount((rec.amount - rec.paidAmount).toString());
    setSettleModalOpen(true);
  };

  const handleSettle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRec || !selectedAccountId) return;
    try {
      setSettling(true);
      await financeApi.settleReceivable(selectedRec.id, {
        accountId: selectedAccountId,
        paidAmount: parseFloat(settleAmount),
        paymentMethod,
        notes: `Baixa via Painel de Contas a Receber`,
      });
      setSettleModalOpen(false);
      setSelectedRec(null);
      await loadData();
    } catch (err) {
      console.error('Erro ao baixar conta a receber', err);
      alert('Erro ao processar baixa.');
    } finally {
      setSettling(false);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const getStatusBadge = (status: ReceivableStatus) => {
    switch (status) {
      case 'PENDING':
        return <span className="badge badge-warning">Pendente</span>;
      case 'RECEIVED':
        return <span className="badge badge-success">Recebido</span>;
      case 'PARTIALLY_RECEIVED':
        return <span className="badge badge-info">Parcial</span>;
      case 'CANCELLED':
        return <span className="badge badge-error">Cancelado</span>;
      case 'REVERSED':
        return <span className="badge badge-error">Estornado</span>;
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
            <ArrowDownLeft className="w-6 h-6 text-emerald-500" />
            Contas a Receber
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Títulos originados de Ordens de Serviço concluídas e faturamentos.
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
          onChange={(e) => setStatusFilter(e.target.value as ReceivableStatus | '')}
          className="select select-sm select-bordered rounded-lg bg-slate-50 dark:bg-slate-900 text-sm"
        >
          <option value="">Todos os Status</option>
          <option value="PENDING">Pendentes</option>
          <option value="RECEIVED">Recebidos</option>
          <option value="PARTIALLY_RECEIVED">Parcialmente Recebidos</option>
          <option value="REVERSED">Estornados</option>
          <option value="CANCELLED">Cancelados</option>
        </select>
      </div>

      {/* Receivables Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-700/60">
              <tr>
                <th className="py-3.5 px-4">Descrição / Origem</th>
                <th className="py-3.5 px-4">Cliente</th>
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
                    Carregando contas a receber...
                  </td>
                </tr>
              ) : receivables.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-400">
                    Nenhum título encontrado.
                  </td>
                </tr>
              ) : (
                receivables.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-900 dark:text-white">{rec.description}</div>
                      {rec.orderNumber && (
                        <div className="text-xs text-primary font-mono">{rec.orderNumber}</div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                      {rec.customerName || '-'}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400 font-mono">
                      {rec.dueDate}
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-slate-900 dark:text-white">
                      {formatCurrency(rec.amount)}
                    </td>
                    <td className="py-3 px-4 text-right text-emerald-600 dark:text-emerald-400 font-semibold">
                      {formatCurrency(rec.paidAmount)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {getStatusBadge(rec.status)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {(rec.status === 'PENDING' || rec.status === 'PARTIALLY_RECEIVED') && (
                        <button
                          onClick={() => handleOpenSettle(rec)}
                          className="btn btn-xs btn-primary inline-flex items-center gap-1"
                        >
                          <Check className="w-3 h-3" />
                          Baixar
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
      {settleModalOpen && selectedRec && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-[480px] w-full p-6 shadow-xl border border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              Baixar Pagamento / Liquidação
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              {selectedRec.description} • Valor total: {formatCurrency(selectedRec.amount)}
            </p>

            <form onSubmit={handleSettle} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Conta de Destino / Caixa *
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
                  <option value="PIX">PIX</option>
                  <option value="CARTAO_CREDITO">Cartão de Crédito</option>
                  <option value="CARTAO_DEBITO">Cartão de Débito</option>
                  <option value="DINHEIRO">Dinheiro / Espécie</option>
                  <option value="BOLETO">Boleto Bancário</option>
                  <option value="TRANSFERENCIA">Transferência Bancária</option>
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
                  {settling ? 'Processando...' : 'Confirmar Recebimento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
