import React from 'react';
import {
  Check,
  Zap,
  Sparkles,
  Shield,
  Layers,
  CheckCircle2,
} from 'lucide-react';
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
        return <Zap className="w-5 h-5 text-amber-400" />;
      case 'PRO':
        return <Sparkles className="w-5 h-5 text-indigo-400" />;
      case 'ENTERPRISE':
        return <Shield className="w-5 h-5 text-purple-400" />;
      default:
        return <Layers className="w-5 h-5 text-blue-400" />;
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
    <div className="space-y-8">
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <h2 className="text-2xl font-bold text-white tracking-tight">
          Planos transparentes para impulsionar sua oficina
        </h2>
        <p className="text-sm text-slate-400">
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
                className={`relative flex flex-col justify-between p-6 rounded-2xl border transition-all duration-200 ${
                  isCurrent
                    ? 'bg-slate-900/90 border-indigo-500 ring-2 ring-indigo-500/40 shadow-xl shadow-indigo-950/40'
                    : isPopular
                    ? 'bg-slate-900/80 border-indigo-500/60 shadow-lg shadow-indigo-950/30'
                    : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Popular badge */}
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-[10px] font-bold uppercase tracking-wider rounded-full shadow-md">
                    Mais Escolhido
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2.5 bg-slate-800/80 border border-slate-700/60 rounded-xl">
                      {getPlanIcon(plan.code)}
                    </div>
                    {isCurrent && (
                      <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Plano Atual
                      </span>
                    )}
                  </div>

                  <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                  <p className="text-xs text-slate-400 mt-1 min-h-[36px]">
                    {getPlanDescription(plan.code)}
                  </p>

                  <div className="my-6 pb-6 border-b border-slate-800">
                    <div className="flex items-baseline gap-1">
                      <span className="text-xs text-slate-400 font-medium">R$</span>
                      <span className="text-3xl font-extrabold text-white tracking-tight">
                        {plan.price.toFixed(2)}
                      </span>
                      <span className="text-xs text-slate-400">/ mês</span>
                    </div>
                  </div>

                  <ul className="space-y-3 mb-6">
                    {getFeaturesList(plan.code).map((f, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-xs">
                        <div
                          className={`p-0.5 rounded-full mt-0.5 ${
                            f.ok
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'bg-slate-800 text-slate-600'
                          }`}
                        >
                          <Check className="w-3 h-3" />
                        </div>
                        <span className={f.ok ? 'text-slate-300' : 'text-slate-500 line-through'}>
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
                  className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold transition-all ${
                    isCurrent
                      ? 'bg-slate-800 text-slate-500 cursor-default'
                      : isPopular
                      ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30'
                      : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
                  }`}
                >
                  {isCurrent ? 'Plano Ativo' : 'Escolher Este Plano'}
                </button>
              </div>
            );
          })}
      </div>
    </div>
  );
};
