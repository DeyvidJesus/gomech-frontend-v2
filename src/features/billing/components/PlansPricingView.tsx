import React from 'react';
import type { BillingPlan, Subscription } from '../types';

interface PlansPricingViewProps {
  plans: BillingPlan[];
  subscription: Subscription | null;
  onSelectPlan: (plan: BillingPlan) => void;
}

export const PlansPricingView: React.FC<PlansPricingViewProps> = ({
  plans,
  subscription,
  onSelectPlan,
}) => {
  const currentPlanCode = subscription?.planCode || 'TRIAL';

  const getPlanIcon = (code: string) => {
    switch (code) {
      case 'STARTER':
        return <span className="material-symbols-outlined text-[24px] text-amber-500">bolt</span>;
      case 'PRO':
        return <span className="material-symbols-outlined text-[24px] text-primary">auto_awesome</span>;
      case 'ENTERPRISE':
        return <span className="material-symbols-outlined text-[24px] text-purple-600">verified_user</span>;
      default:
        return <span className="material-symbols-outlined text-[24px] text-blue-500">layers</span>;
    }
  };

  const getPlanDescription = (code: string) => {
    switch (code) {
      case 'STARTER':
        return 'Ideal para oficinas independentes e mecânicos autônomos que buscam organização.';
      case 'PRO':
        return 'Para oficinas em crescimento que precisam de fluxo financeiro, estoque avançado e IA.';
      case 'ENTERPRISE':
        return 'Para redes e grandes autocenters com múltiplos mecânicos e operações ilimitadas.';
      case 'TRIAL':
        return 'Período gratuito de experimentação de 14 dias com acesso completo.';
      default:
        return '';
    }
  };

  const getFeaturesList = (code: string) => {
    switch (code) {
      case 'STARTER':
        return [
          { text: 'Até 50 Ordens de Serviço / mês', ok: true },
          { text: 'Até 3 Mecânicos cadastrados', ok: true },
          { text: 'Gestão de Estoque e Peças', ok: true },
          { text: 'Controle de Ferramentas Reutilizáveis', ok: true },
          { text: 'Módulo Financeiro e DRE', ok: false },
          { text: 'Assistente de IA GoMech', ok: false },
        ];
      case 'PRO':
        return [
          { text: 'Até 250 Ordens de Serviço / mês', ok: true },
          { text: 'Até 10 Mecânicos cadastrados', ok: true },
          { text: 'Gestão de Estoque e Compras', ok: true },
          { text: 'Controle de Ferramentas e Custódia', ok: true },
          { text: 'Módulo Financeiro, Fluxo de Caixa e DRE', ok: true },
          { text: '500 Créditos mensais de IA GoMech', ok: true },
        ];
      case 'ENTERPRISE':
        return [
          { text: 'Ordens de Serviço Ilimitadas', ok: true },
          { text: 'Mecânicos e Colaboradores Ilimitados', ok: true },
          { text: 'Multi-unidades e Filiais integradas', ok: true },
          { text: 'Módulo Financeiro completo + Conciliação', ok: true },
          { text: 'Gestão Completa de Ferramentaria', ok: true },
          { text: 'Créditos Ilimitados de IA & Suporte VIP', ok: true },
        ];
      default:
        return [
          { text: 'Acesso total durante 14 dias', ok: true },
          { text: 'Todos os módulos liberados', ok: true },
          { text: 'Suporte à integração', ok: true },
        ];
    }
  };

  const sortedPlans = [...plans].sort((a, b) => a.price - b.price);

  return (
    <div className="space-y-8 animate-in fade-in">
      <div className="text-center max-w-[720px] mx-auto space-y-2">
        <h2 className="text-2xl sm:text-3xl font-bold text-on-surface tracking-tight font-headline-lg">
          Planos transparentes para impulsionar sua oficina
        </h2>
        <p className="text-sm text-on-surface-variant font-body-md">
          Escolha o plano que melhor atende o volume de atendimentos da sua equipe. Atualize ou cancele a qualquer momento.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {sortedPlans
          .filter((p) => p.code !== 'TRIAL')
          .map((plan) => {
            const isCurrent = currentPlanCode === plan.code;
            const isPopular = plan.code === 'PRO';

            return (
              <div
                key={plan.id}
                className={`relative flex flex-col justify-between p-6 sm:p-7 rounded-3xl border transition-all duration-200 shadow-sm ${
                  isCurrent
                    ? 'bg-surface-container-lowest border-primary ring-2 ring-primary/30 shadow-md'
                    : isPopular
                    ? 'bg-surface-container-lowest border-primary/60 hover:border-primary shadow-md'
                    : 'bg-surface-container-lowest border-outline-variant hover:border-outline'
                }`}
              >
                {/* Popular badge */}
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3.5 py-0.5 bg-primary text-on-primary text-[10px] font-bold uppercase tracking-wider rounded-full shadow-sm">
                    Mais Escolhido
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-surface-container border border-outline-variant/60 rounded-2xl flex items-center justify-center">
                      {getPlanIcon(plan.code)}
                    </div>
                    {isCurrent && (
                      <span className="flex items-center gap-1 text-[11px] font-bold text-tertiary bg-tertiary-container/30 border border-tertiary/20 px-2.5 py-1 rounded-full">
                        <span className="material-symbols-outlined text-[14px]">check_circle</span>
                        Plano Atual
                      </span>
                    )}
                  </div>

                  <h3 className="text-lg font-bold text-on-surface">{plan.name}</h3>
                  <p className="text-xs text-on-surface-variant mt-1.5 min-h-[36px] leading-relaxed">
                    {getPlanDescription(plan.code)}
                  </p>

                  <div className="my-6 pb-6 border-b border-outline-variant/60">
                    <div className="flex items-baseline gap-1">
                      <span className="text-xs text-on-surface-variant font-medium">R$</span>
                      <span className="text-3xl sm:text-4xl font-extrabold font-mono text-on-surface tracking-tight">
                        {plan.price.toFixed(2)}
                      </span>
                      <span className="text-xs text-on-surface-variant">/ mês</span>
                    </div>
                  </div>

                  <ul className="space-y-3 mb-6">
                    {getFeaturesList(plan.code).map((f, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-xs">
                        <div
                          className={`p-0.5 rounded-full mt-0.5 shrink-0 ${
                            f.ok
                              ? 'bg-tertiary-container/30 text-tertiary'
                              : 'bg-surface-container text-outline'
                          }`}
                        >
                          <span className="material-symbols-outlined text-[14px]">
                            {f.ok ? 'check' : 'close'}
                          </span>
                        </div>
                        <span className={f.ok ? 'text-on-surface font-medium' : 'text-on-surface-variant/60 line-through'}>
                          {f.text}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  type="button"
                  onClick={() => onSelectPlan(plan)}
                  disabled={isCurrent}
                  className={`w-full py-3 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm ${
                    isCurrent
                      ? 'bg-surface-container text-on-surface-variant cursor-default'
                      : isPopular
                      ? 'bg-primary hover:bg-primary-container text-on-primary shadow-primary/20'
                      : 'bg-surface-container hover:bg-surface-container-high text-on-surface border border-outline-variant'
                  }`}
                >
                  {isCurrent ? (
                    'Plano Ativo'
                  ) : (
                    <>
                      <span>Contratar {plan.name}</span>
                      <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                    </>
                  )}
                </button>
              </div>
            );
          })}
      </div>
    </div>
  );
};
