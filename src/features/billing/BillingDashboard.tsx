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
import { toast } from '@/shared/utils/toast';

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

    // Check if returning from Pagar.me Hosted Checkout
    const params = new URLSearchParams(window.location.search);
    const statusParam = params.get('status');
    if (statusParam === 'processing' || statusParam === 'success') {
      // Clean URL parameter without reloading
      window.history.replaceState({}, document.title, window.location.pathname);

      // Poll data to catch webhook activation
      const interval = setInterval(() => {
        billingApi.getSubscription().then((res) => {
          setSubscription(res.data);
          if (res.data.status === 'ACTIVE') {
            clearInterval(interval);
            toast.success('Assinatura ativada com sucesso!');
          }
        }).catch(() => {});
      }, 3000);

      const timeout = setTimeout(() => {
        clearInterval(interval);
      }, 18000);

      return () => {
        clearInterval(interval);
        clearTimeout(timeout);
      };
    } else if (statusParam === 'canceled') {
      window.history.replaceState({}, document.title, window.location.pathname);
      toast.info('O processo de checkout na Pagar.me foi cancelado.');
    }
  }, []);

  const handleOpenCheckout = (plan?: BillingPlan) => {
    if (plan) {
      setSelectedPlanForCheckout(plan);
    } else {
      const current = plans.find((p) => p.code === subscription?.planCode) || plans.find((p) => p.code === 'PRO') || plans[0];
      setSelectedPlanForCheckout(current || null);
    }
    setIsCheckoutOpen(true);
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Assinatura Ativa
          </span>
        );
      case 'TRIALING':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
            <Sparkles className="w-3.5 h-3.5" />
            Período de Avaliação
          </span>
        );
      case 'PAST_DUE':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-error/10 text-error border border-error/20 animate-pulse">
            <AlertCircle className="w-3.5 h-3.5" />
            Pagamento Pendente
          </span>
        );
      case 'CANCELED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-surface-container text-on-surface-variant border border-outline-variant">
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
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-on-surface-variant">Carregando painel de faturamento...</p>
      </div>
    );
  }

  const isDelinquent = subscription?.status === 'PAST_DUE';

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      {/* Top Banner if Delinquent */}
      {isDelinquent && <DelinquencyBanner onPayNow={() => handleOpenCheckout()} />}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-on-surface tracking-tight font-headline-md">Faturamento e Assinatura</h1>
          <p className="text-sm text-on-surface-variant mt-1">
            Gerencie o plano contratado, limites operacionais e histórico de pagamentos da sua oficina.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            className="p-2 text-on-surface-variant hover:text-on-surface rounded-xl bg-surface-container-lowest border border-outline-variant hover:bg-surface-container transition-colors"
            title="Atualizar dados"
          >
            <RotateCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleOpenCheckout()}
            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-container text-on-primary rounded-xl text-xs font-semibold shadow-sm transition-all"
          >
            <Zap className="w-4 h-4" />
            <span>Fazer Upgrade / Renovar</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 bg-error/10 border border-error/20 rounded-2xl text-xs text-error">
          <AlertCircle className="w-4 h-4 text-error shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-outline-variant pb-2">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all ${
            activeTab === 'overview'
              ? 'bg-primary-fixed text-primary font-semibold shadow-xs'
              : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Visão Geral</span>
        </button>

        <button
          onClick={() => setActiveTab('plans')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all ${
            activeTab === 'plans'
              ? 'bg-primary-fixed text-primary font-semibold shadow-xs'
              : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Comparar Planos</span>
        </button>

        <button
          onClick={() => setActiveTab('invoices')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all ${
            activeTab === 'invoices'
              ? 'bg-primary-fixed text-primary font-semibold shadow-xs'
              : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
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
            <div className="p-6 rounded-2xl bg-surface-container-lowest border border-outline-variant shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                  Plano Atual
                </span>
                {getStatusBadge(subscription?.status)}
              </div>

              <div>
                <h3 className="text-2xl font-bold text-on-surface">{subscription?.planName || 'TRIAL'}</h3>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  {subscription?.status === 'TRIALING'
                    ? 'Avaliação gratuita com todos os módulos'
                    : 'Assinatura mensal recorrente'}
                </p>
              </div>

              <div className="pt-3 border-t border-outline-variant flex items-center justify-between text-xs">
                <span className="text-on-surface-variant">Próxima Renovação:</span>
                <span className="font-semibold text-on-surface">
                  {subscription?.nextBillingDate
                    ? new Date(subscription.nextBillingDate).toLocaleDateString('pt-BR')
                    : '14 dias'}
                </span>
              </div>
            </div>

            {/* Payment Method Card */}
            <div className="p-6 rounded-2xl bg-surface-container-lowest border border-outline-variant shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                  Forma de Pagamento
                </span>
                <CreditCard className="w-4 h-4 text-primary" />
              </div>

              <div>
                <h3 className="text-lg font-bold text-on-surface">
                  {subscription?.paymentMethod === 'CREDIT_CARD'
                    ? `Cartão de Crédito ${subscription.cardBrand || ''}`
                    : subscription?.paymentMethod === 'PIX'
                    ? 'PIX Instantâneo'
                    : subscription?.paymentMethod === 'BOLETO'
                    ? 'Boleto Bancário'
                    : 'Não configurado'}
                </h3>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  {subscription?.cardLastFour
                    ? `Final •••• ${subscription.cardLastFour}`
                    : 'Faturamento automático via Pagar.me'}
                </p>
              </div>

              <div className="pt-3 border-t border-outline-variant flex items-center justify-between">
                <button
                  onClick={() => handleOpenCheckout()}
                  className="text-xs text-primary hover:underline font-semibold flex items-center gap-1"
                >
                  <span>Alterar forma de pagamento</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Delinquency & Security Status */}
            <div className="p-6 rounded-2xl bg-surface-container-lowest border border-outline-variant shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                  Status da Conta
                </span>
                {isDelinquent ? (
                  <ShieldAlert className="w-4 h-4 text-error" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                )}
              </div>

              <div>
                <h3 className="text-lg font-bold text-on-surface">
                  {isDelinquent ? 'Bloqueio Iminente' : '100% Regularizada'}
                </h3>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  {isDelinquent
                    ? 'Efetue o pagamento para evitar a revogação de acessos'
                    : 'Sem débitos pendentes no gateway'}
                </p>
              </div>

              <div className="pt-3 border-t border-outline-variant flex items-center justify-between text-xs text-on-surface-variant">
                <span>Proteção de Sessão:</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">Ativa</span>
              </div>
            </div>
          </div>

          {/* Quota Usage Meters */}
          <div className="p-6 rounded-2xl bg-surface-container-lowest border border-outline-variant shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-on-surface">Consumo de Cotas do Plano</h3>
                <p className="text-xs text-on-surface-variant">
                  Acompanhe a utilização mensal dos recursos incluídos na sua assinatura.
                </p>
              </div>
              <span className="text-xs text-primary font-medium">Ciclo Mensal</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-surface border border-outline-variant space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-on-surface-variant">Ordens de Serviço</span>
                  <span className="font-semibold text-on-surface">Ilimitado</span>
                </div>
                <div className="w-full bg-surface-container rounded-full h-1.5">
                  <div className="bg-primary h-1.5 rounded-full" style={{ width: '45%' }} />
                </div>
              </div>

              <div className="p-4 rounded-xl bg-surface border border-outline-variant space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-on-surface-variant">Mecânicos e Equipe</span>
                  <span className="font-semibold text-on-surface">Até 10</span>
                </div>
                <div className="w-full bg-surface-container rounded-full h-1.5">
                  <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: '30%' }} />
                </div>
              </div>

              <div className="p-4 rounded-xl bg-surface border border-outline-variant space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-on-surface-variant">Itens em Estoque</span>
                  <span className="font-semibold text-on-surface">Ilimitado</span>
                </div>
                <div className="w-full bg-surface-container rounded-full h-1.5">
                  <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: '20%' }} />
                </div>
              </div>

              <div className="p-4 rounded-xl bg-surface border border-outline-variant space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-on-surface-variant">Créditos de IA GoMech</span>
                  <span className="font-semibold text-on-surface">500 / mês</span>
                </div>
                <div className="w-full bg-surface-container rounded-full h-1.5">
                  <div className="bg-purple-500 h-1.5 rounded-full" style={{ width: '15%' }} />
                </div>
              </div>
            </div>
          </div>

          {/* Recent Invoices Preview */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-on-surface">Últimas Faturas</h3>
              <button
                onClick={() => setActiveTab('invoices')}
                className="text-xs text-primary hover:underline font-semibold"
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
