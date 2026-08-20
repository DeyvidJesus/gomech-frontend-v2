import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Layers,
  ArrowUpRight,
  ShieldAlert,
  Zap,
  Receipt,
  RotateCw,
} from 'lucide-react';
import { billingApi } from './api/billingApi';
import type { BillingPlan, Subscription, Payment } from './types';
import { CheckoutModal } from './components/CheckoutModal';
import { DelinquencyBanner } from './components/DelinquencyBanner';
import { PlansPricingView } from './components/PlansPricingView';
import { InvoicesList } from './components/InvoicesList';

export const BillingDashboard: React.FC = () => {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [plans, setPlans] = useState<BillingPlan[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'overview' | 'plans' | 'invoices'>('overview');
  const [selectedPlanForCheckout, setSelectedPlanForCheckout] = useState<BillingPlan | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [subRes, plansRes, payRes] = await Promise.all([
        billingApi.getSubscription(),
        billingApi.getPlans(),
        billingApi.getPayments(0, 10),
      ]);
      setSubscription(subRes.data);
      setPlans(plansRes.data);
      setPayments(payRes.data.content || []);
    } catch (err: any) {
      setError('Não foi possível carregar as informações de faturamento.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenCheckout = (plan?: BillingPlan) => {
    if (plan) {
      setSelectedPlanForCheckout(plan);
    } else {
      // Pick current or Pro plan by default
      const current = plans.find((p) => p.code === subscription?.planCode) || plans.find((p) => p.code === 'PRO') || plans[0];
      setSelectedPlanForCheckout(current || null);
    }
    setIsCheckoutOpen(true);
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Assinatura Ativa
          </span>
        );
      case 'TRIALING':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Sparkles className="w-3.5 h-3.5" />
            Período de Avaliação
          </span>
        );
      case 'PAST_DUE':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20 animate-pulse">
            <AlertCircle className="w-3.5 h-3.5" />
            Pagamento Pendente
          </span>
        );
      case 'CANCELED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-500/10 text-slate-400 border border-slate-500/20">
            Cancelada
          </span>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-slate-400">Carregando painel de faturamento...</p>
      </div>
    );
  }

  const isDelinquent = subscription?.status === 'PAST_DUE';

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6">
      {/* Top Banner if Delinquent */}
      {isDelinquent && <DelinquencyBanner onPayNow={() => handleOpenCheckout()} />}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Faturamento e Assinatura</h1>
          <p className="text-xs text-slate-400 mt-1">
            Gerencie o plano contratado, limites operacionais e histórico de pagamentos da sua oficina.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            className="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-900/60 border border-slate-800 hover:bg-slate-800 transition-colors"
            title="Atualizar dados"
          >
            <RotateCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleOpenCheckout()}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all"
          >
            <Zap className="w-4 h-4" />
            <span>Fazer Upgrade / Renovar</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-950/40 border border-red-800/60 rounded-2xl text-xs text-red-300">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all ${
            activeTab === 'overview'
              ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Visão Geral</span>
        </button>

        <button
          onClick={() => setActiveTab('plans')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all ${
            activeTab === 'plans'
              ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Comparar Planos</span>
        </button>

        <button
          onClick={() => setActiveTab('invoices')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all ${
            activeTab === 'invoices'
              ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Histórico de Faturas</span>
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Main Cards Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Current Plan Card */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Plano Atual
                </span>
                {getStatusBadge(subscription?.status)}
              </div>

              <div>
                <h3 className="text-2xl font-black text-white">{subscription?.planName || 'TRIAL'}</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {subscription?.status === 'TRIALING'
                    ? 'Avaliação gratuita com todos os módulos'
                    : 'Assinatura mensal recorrente'}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <span className="text-slate-400">Próxima Renovação:</span>
                <span className="font-semibold text-slate-200">
                  {subscription?.nextBillingDate
                    ? new Date(subscription.nextBillingDate).toLocaleDateString('pt-BR')
                    : '14 dias'}
                </span>
              </div>
            </div>

            {/* Payment Method Card */}
            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Forma de Pagamento
                </span>
                <CreditCard className="w-4 h-4 text-indigo-400" />
              </div>

              <div>
                <h3 className="text-lg font-bold text-white">
                  {subscription?.paymentMethod === 'CREDIT_CARD'
                    ? `Cartão de Crédito ${subscription.cardBrand || ''}`
                    : subscription?.paymentMethod === 'PIX'
                    ? 'PIX Instantâneo'
                    : subscription?.paymentMethod === 'BOLETO'
                    ? 'Boleto Bancário'
                    : 'Não configurado'}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {subscription?.cardLastFour
                    ? `Final •••• ${subscription.cardLastFour}`
                    : 'Faturamento automático via Pagar.me'}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <button
                  onClick={() => handleOpenCheckout()}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
                >
                  <span>Alterar forma de pagamento</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Delinquency & Security Status */}
            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Status da Conta
                </span>
                {isDelinquent ? (
                  <ShieldAlert className="w-4 h-4 text-red-400" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                )}
              </div>

              <div>
                <h3 className="text-lg font-bold text-white">
                  {isDelinquent ? 'Bloqueio Iminente' : '100% Regularizada'}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {isDelinquent
                    ? 'Efetue o pagamento para evitar a revogação de acessos'
                    : 'Sem débitos pendentes no gateway'}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <span>Proteção de Sessão:</span>
                <span className="text-emerald-400 font-medium">Ativa</span>
              </div>
            </div>
          </div>

          {/* Quota Usage Meters */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white">Consumo de Cotas do Plano</h3>
                <p className="text-xs text-slate-400">
                  Acompanhe a utilização mensal dos recursos incluídos na sua assinatura.
                </p>
              </div>
              <span className="text-xs text-indigo-400 font-medium">Ciclo Mensal</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Ordens de Serviço</span>
                  <span className="font-semibold text-white">Ilimitado</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-1.5">
                  <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: '45%' }} />
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Mecânicos e Equipe</span>
                  <span className="font-semibold text-white">Até 10</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-1.5">
                  <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: '30%' }} />
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Itens em Estoque</span>
                  <span className="font-semibold text-white">Ilimitado</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-1.5">
                  <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: '20%' }} />
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Créditos de IA GoMech</span>
                  <span className="font-semibold text-white">500 / mês</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-1.5">
                  <div className="bg-purple-500 h-1.5 rounded-full" style={{ width: '15%' }} />
                </div>
              </div>
            </div>
          </div>

          {/* Recent Invoices Preview */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">Últimas Faturas</h3>
              <button
                onClick={() => setActiveTab('invoices')}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
              >
                Ver todas as faturas →
              </button>
            </div>
            <InvoicesList payments={payments.slice(0, 5)} onSelectPayment={() => {}} />
          </div>
        </div>
      )}

      {activeTab === 'plans' && (
        <PlansPricingView
          plans={plans}
          subscription={subscription}
          onSelectPlan={(plan) => handleOpenCheckout(plan)}
        />
      )}

      {activeTab === 'invoices' && (
        <div className="space-y-4">
          <InvoicesList payments={payments} />
        </div>
      )}

      {/* Checkout Modal */}
      <CheckoutModal
        plan={selectedPlanForCheckout}
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        onSuccess={() => loadData()}
      />
    </div>
  );
};
