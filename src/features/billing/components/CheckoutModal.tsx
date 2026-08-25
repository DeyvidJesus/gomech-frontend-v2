import React, { useState } from 'react';
import {
  ShieldCheck,
  Sparkles,
  ExternalLink,
  CheckCircle2,
  Lock,
  RotateCw,
  X,
  CreditCard,
  Building,
} from 'lucide-react';
import { billingApi } from '../api/billingApi';
import type { BillingPlan } from '../types';
import { toast } from '@/shared/utils/toast';

interface CheckoutModalProps {
  plan: BillingPlan | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  plan,
  isOpen,
  onClose,
}) => {
  const [loading, setLoading] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  if (!isOpen || !plan) return null;

  const handleStartHostedCheckout = async () => {
    setLoading(true);
    try {
      const returnUrl = `${window.location.origin}/billing?status=processing`;
      const cancelUrl = `${window.location.origin}/billing?status=canceled`;

      const response = await billingApi.createCheckout({
        planCode: plan.code,
        successUrl: returnUrl,
        cancelUrl: cancelUrl,
      });

      const { checkoutUrl } = response.data;

      if (!checkoutUrl) {
        throw new Error('URL de checkout não retornada pelo gateway.');
      }

      setRedirecting(true);
      toast.success('Redirecionando para o ambiente seguro da Pagar.me...');

      // Redirect smoothly to official hosted checkout
      setTimeout(() => {
        window.location.assign(checkoutUrl);
      }, 600);

    } catch (err: any) {
      setLoading(false);
      setRedirecting(false);
      const msg =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        'Não foi possível iniciar o checkout seguro da Pagar.me. Tente novamente em instantes.';
      toast.error(msg);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-surface border border-outline-variant shadow-2xl transition-all">
        {/* Header decoration */}
        <div className="relative p-6 bg-gradient-to-br from-primary/15 via-primary/5 to-transparent border-b border-outline-variant">
          <button
            onClick={onClose}
            disabled={loading || redirecting}
            className="absolute top-4 right-4 p-2 rounded-full text-on-surface-variant hover:bg-surface-container transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20 mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            Pagar.me Hosted Checkout
          </div>

          <h2 className="text-xl font-bold text-on-surface">
            Assinatura {plan.name}
          </h2>
          <p className="text-sm text-on-surface-variant mt-1">
            Você será direcionado para o ambiente de pagamento criptografado e homologado pela Pagar.me.
          </p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Plan Summary Card */}
          <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant flex items-center justify-between">
            <div>
              <span className="text-xs uppercase tracking-wider text-on-surface-variant font-medium">Plano Selecionado</span>
              <h3 className="text-lg font-bold text-on-surface">{plan.name}</h3>
              <p className="text-xs text-on-surface-variant">Cobrança {plan.billingInterval === 'YEARLY' ? 'Anual' : 'Mensal'} recorrente</p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-extrabold text-primary">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(plan.price)}
              </span>
              <span className="text-xs text-on-surface-variant block">/mês</span>
            </div>
          </div>

          {/* Included Features */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Incluso no seu plano</span>
            <div className="grid grid-cols-1 gap-2 text-sm text-on-surface">
              <div className="flex items-center gap-2 text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <span>Acesso completo aos recursos de gestão GoMech</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <span>Cancelamento ou alteração a qualquer momento sem fidelidade</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <span>Suporte técnico prioritário e backups automáticos na nuvem</span>
              </div>
            </div>
          </div>

          {/* Security Assurance Badge */}
          <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-xs space-y-2">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold">
              <ShieldCheck className="w-4 h-4 flex-shrink-0" />
              <span>Ambiente 100% Seguro e Certificado PCI-DSS</span>
            </div>
            <p className="text-on-surface-variant text-[11px] leading-relaxed">
              O GoMech não armazena nem tem acesso aos dados sensíveis do seu cartão. Todas as transações são processadas com criptografia de ponta a ponta pelos servidores da Pagar.me (Stone Co.).
            </p>
            <div className="flex items-center gap-3 pt-1 text-on-surface-variant text-[11px]">
              <span className="inline-flex items-center gap-1">
                <CreditCard className="w-3.5 h-3.5 text-primary" /> Cartão de Crédito
              </span>
              <span className="inline-flex items-center gap-1">
                <Building className="w-3.5 h-3.5 text-primary" /> Boleto Bancário
              </span>
              <span className="inline-flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 text-emerald-500" /> TLS 1.3
              </span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 bg-surface-container-low border-t border-outline-variant flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading || redirecting}
            className="px-4 py-2.5 rounded-xl border border-outline-variant text-sm font-semibold text-on-surface hover:bg-surface-container transition-colors disabled:opacity-50"
          >
            Voltar
          </button>

          <button
            type="button"
            onClick={handleStartHostedCheckout}
            disabled={loading || redirecting}
            className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-on-primary font-semibold text-sm shadow-md hover:bg-primary-hover active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {redirecting ? (
              <>
                <RotateCw className="w-4 h-4 animate-spin" />
                Redirecionando...
              </>
            ) : loading ? (
              <>
                <RotateCw className="w-4 h-4 animate-spin" />
                Gerando Checkout Seguro...
              </>
            ) : (
              <>
                <span>Ir para Checkout Pagar.me</span>
                <ExternalLink className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
