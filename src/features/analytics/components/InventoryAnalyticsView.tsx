import React from 'react';
import { ShoppingCart, ArrowDownRight, Layers } from 'lucide-react';
import type { DashboardSummaryResponse } from '../types/analytics';

interface InventoryAnalyticsViewProps {
  data: DashboardSummaryResponse;
}

export const InventoryAnalyticsView: React.FC<InventoryAnalyticsViewProps> = ({ data }) => {
  const { inventory } = data;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white/70 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500">Compras de Estoque</p>
              <h4 className="text-xl font-bold text-slate-900 dark:text-white">
                R$ {inventory.totalPurchaseSpend.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </h4>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white/70 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600">
              <ArrowDownRight className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500">Consumo em OS</p>
              <h4 className="text-xl font-bold text-slate-900 dark:text-white">
                R$ {inventory.totalStockConsumed.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </h4>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white/70 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-600">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500">Movimentações Registradas</p>
              <h4 className="text-xl font-bold text-slate-900 dark:text-white">{inventory.totalMovementsCount}</h4>
            </div>
          </div>
        </div>
      </div>

      {inventory.topConsumedParts.length > 0 && (
        <div className="p-6 rounded-2xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
          <h4 className="text-base font-bold text-slate-900 dark:text-white mb-4">Peças Mais Consumidas em OS</h4>
          <div className="space-y-3">
            {inventory.topConsumedParts.map((item) => (
              <div key={item.key} className="flex justify-between items-center text-xs py-2 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">{item.label}</p>
                  <span className="text-[11px] text-slate-400">{item.count} aplicações em ordens de serviço</span>
                </div>
                <div className="text-right">
                  <p className="font-mono font-bold text-slate-900 dark:text-white">
                    R$ {item.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                  <span className="text-[11px] text-primary-600 font-semibold">{item.percentage.toFixed(1)}% do consumo</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
