import React, { useEffect, useState } from 'react';
import { financeApi } from './api/financeApi';
import type { FinanceAccount, AccountType } from './types';
import {
  Wallet,
  Plus,
  X,
} from 'lucide-react';

export const AccountList: React.FC = () => {
  const [accounts, setAccounts] = useState<FinanceAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [type, setType] = useState<AccountType>('BANK_ACCOUNT');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [agency, setAgency] = useState('');
  const [initialBalance, setInitialBalance] = useState('0.00');

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      setLoading(true);
      const res = await financeApi.getAccounts();
      setAccounts(res.data || []);
    } catch (err) {
      console.error('Erro ao carregar contas', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setCreating(true);
      // Unit id from active workshop context or default
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      const unitId = user?.activeUnitId || user?.unitId;

      await financeApi.createAccount({
        unitId,
        name,
        type,
        bankName: bankName || undefined,
        accountNumber: accountNumber || undefined,
        agency: agency || undefined,
        initialBalance: parseFloat(initialBalance) || 0,
      });

      setModalOpen(false);
      setName('');
      setBankName('');
      setAccountNumber('');
      setAgency('');
      setInitialBalance('0.00');
      await loadAccounts();
    } catch (err) {
      console.error('Erro ao criar conta', err);
      alert('Erro ao cadastrar conta.');
    } finally {
      setCreating(false);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const getAccountTypeLabel = (type: AccountType) => {
    switch (type) {
      case 'BANK_ACCOUNT':
        return 'Conta Corrente';
      case 'CASH_REGISTER':
        return 'Caixa Físico / Gaveta';
      case 'DIGITAL_WALLET':
        return 'Carteira Digital';
      case 'CREDIT_CARD':
        return 'Cartão de Crédito';
      default:
        return type;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Wallet className="w-6 h-6 text-primary" />
            Contas Bancárias e Caixas
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Cadastre contas correntes, caixas da oficina e carteiras de pagamento.
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="btn btn-primary inline-flex items-center gap-2 text-sm"
        >
          <Plus className="w-4 h-4" />
          Nova Conta
        </button>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full text-center py-12 text-slate-400">
            Carregando contas...
          </div>
        ) : accounts.length === 0 ? (
          <div className="col-span-full text-center py-12 text-slate-400">
            Nenhuma conta financeira cadastrada.
          </div>
        ) : (
          accounts.map((acc) => (
            <div
              key={acc.id}
              className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700/60 p-5 shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase text-slate-400">
                    {getAccountTypeLabel(acc.type)}
                  </span>
                  <span className="badge badge-success text-[10px]">Ativa</span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-1">
                  {acc.name}
                </h3>
                {acc.bankName && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {acc.bankName} • Agência: {acc.agency || '-'} • Conta: {acc.accountNumber || '-'}
                  </p>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-700/50 flex justify-between items-end">
                <div>
                  <div className="text-[11px] text-slate-400">Saldo Atual</div>
                  <div className="text-xl font-bold text-slate-900 dark:text-white">
                    {formatCurrency(acc.currentBalance)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[11px] text-slate-400">Saldo Inicial</div>
                  <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    {formatCurrency(acc.initialBalance)}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Nova Conta */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-[480px] w-full p-6 shadow-xl border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Cadastrar Conta Financeira
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Nome Identificador da Conta *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Itaú PJ Principal, Gaveta Recepção"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input input-bordered w-full rounded-xl bg-slate-50 dark:bg-slate-900 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Tipo de Conta *
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as AccountType)}
                  className="select select-bordered w-full rounded-xl bg-slate-50 dark:bg-slate-900 text-sm"
                >
                  <option value="BANK_ACCOUNT">Conta Corrente Bancária</option>
                  <option value="CASH_REGISTER">Caixa Físico / Gaveta</option>
                  <option value="DIGITAL_WALLET">Carteira Digital (Mercado Pago, PagBank)</option>
                  <option value="CREDIT_CARD">Cartão de Crédito Empresarial</option>
                </select>
              </div>

              {type === 'BANK_ACCOUNT' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      Instituição Bancária
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Itaú, Bradesco, Nubank"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      className="input input-bordered w-full rounded-xl bg-slate-50 dark:bg-slate-900 text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                        Agência
                      </label>
                      <input
                        type="text"
                        placeholder="0001"
                        value={agency}
                        onChange={(e) => setAgency(e.target.value)}
                        className="input input-bordered w-full rounded-xl bg-slate-50 dark:bg-slate-900 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                        Número da Conta
                      </label>
                      <input
                        type="text"
                        placeholder="12345-6"
                        value={accountNumber}
                        onChange={(e) => setAccountNumber(e.target.value)}
                        className="input input-bordered w-full rounded-xl bg-slate-50 dark:bg-slate-900 text-sm"
                      />
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Saldo Inicial (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={initialBalance}
                  onChange={(e) => setInitialBalance(e.target.value)}
                  className="input input-bordered w-full rounded-xl bg-slate-50 dark:bg-slate-900 text-sm"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700/60">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="btn btn-ghost text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="btn btn-primary text-sm"
                >
                  {creating ? 'Salvando...' : 'Salvar Conta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
