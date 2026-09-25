import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus, HelpCircle } from 'lucide-react';
import type { KpiHeroCard } from '../types/analytics';

interface KpiMetricCardProps {
  card: KpiHeroCard;
}

export const KpiMetricCard: React.FC<KpiMetricCardProps> = ({ card }) => {
  const isUp = card.trendDirection === 'UP';
  const isDown = card.trendDirection === 'DOWN';

  return (
    <div className="relative group overflow-hidden rounded-2xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 p-6 shadow-sm hover:shadow-md transition-all duration-300">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary-500/40 via-primary-500 to-primary-600/40 opacity-0 group-hover:opacity-100 transition-opacity" />
      
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {card.title}
        </span>
        {card.helpText && (
          <div className="relative group/tooltip">
            <HelpCircle className="w-4 h-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-help transition-colors" />
            <div className="absolute right-0 bottom-full mb-2 hidden group-hover/tooltip:block w-48 p-2 bg-slate-900 text-white text-[11px] rounded-lg shadow-xl z-20 pointer-events-none">
              {card.helpText}
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 flex items-baseline justify-between">
        <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          {card.formattedValue}
        </h3>
        <span className="text-xs font-medium text-slate-400 dark:text-slate-500">
          {card.unit}
        </span>
      </div>

      <div className="mt-4 flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800/60">
        <div className="flex items-center gap-1.5">
          {isUp && (
            <span className="inline-flex items-center gap-0.5 text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400">
              <ArrowUpRight className="w-3.5 h-3.5" />
              +{card.percentChange.toFixed(1)}%
            </span>
          )}
          {isDown && (
            <span className="inline-flex items-center gap-0.5 text-xs font-semibold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400">
              <ArrowDownRight className="w-3.5 h-3.5" />
              {card.percentChange.toFixed(1)}%
            </span>
          )}
          {!isUp && !isDown && (
            <span className="inline-flex items-center gap-0.5 text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
              <Minus className="w-3.5 h-3.5" />
              0.0%
            </span>
          )}
          <span className="text-[11px] text-slate-400 dark:text-slate-500 ml-1">vs anterior</span>
        </div>

        <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
          {card.code}
        </span>
      </div>
    </div>
  );
};
