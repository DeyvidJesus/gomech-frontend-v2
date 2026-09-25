import React, { useState } from 'react';
import { X, Download, FileSpreadsheet, FileJson, AlertCircle } from 'lucide-react';
import type { ExportFormat, ReportType } from '../types/analytics';

interface ExportReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (reportType: ReportType, format: ExportFormat) => Promise<void>;
  reportsQuotaUsed: number;
  reportsQuotaLimit: number;
}

export const ExportReportModal: React.FC<ExportReportModalProps> = ({
  isOpen,
  onClose,
  onExport,
  reportsQuotaUsed,
  reportsQuotaLimit,
}) => {
  const [reportType, setReportType] = useState<ReportType>('OPERATIONAL_SUMMARY');
  const [format, setFormat] = useState<ExportFormat>('CSV');
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleExecute = async () => {
    try {
      setIsExporting(true);
      setError(null);
      await onExport(reportType, format);
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.detail || err?.message || 'Falha ao exportar relatório.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary-50 dark:bg-primary-950 text-primary-600 dark:text-primary-400">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Exportar Relatório</h3>
              <p className="text-xs text-slate-500">Gere arquivos analíticos e extratos consolidados</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Report Type */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Tipo de Relatório</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value as ReportType)}
              className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 focus:outline-none"
            >
              <option value="OPERATIONAL_SUMMARY">Resumo Operacional de Ordens de Serviço</option>
              <option value="FINANCIAL_PERFORMANCE">Demonstrativo Financeiro & Fluxo de Caixa</option>
              <option value="INVENTORY_FLOW">Extrato de Movimentação de Estoque</option>
              <option value="TOOL_EFFICIENCY">Controle de Custódia & Manutenção de Ferramentas</option>
            </select>
          </div>

          {/* Export Format */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Formato do Arquivo</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormat('CSV')}
                className={`flex items-center gap-2.5 p-3 rounded-xl border text-xs font-semibold transition-all ${
                  format === 'CSV'
                    ? 'border-primary-500 bg-primary-50/50 dark:bg-primary-950/30 text-primary-700 dark:text-primary-300'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>Planilha (CSV)</span>
              </button>

              <button
                type="button"
                onClick={() => setFormat('JSON')}
                className={`flex items-center gap-2.5 p-3 rounded-xl border text-xs font-semibold transition-all ${
                  format === 'JSON'
                    ? 'border-primary-500 bg-primary-50/50 dark:bg-primary-950/30 text-primary-700 dark:text-primary-300'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <FileJson className="w-4 h-4 text-amber-600" />
                <span>Dados (JSON)</span>
              </button>
            </div>
          </div>

          {/* Quota info */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-500">Cota de Relatórios do Plano:</span>
            <span className="font-semibold text-slate-900 dark:text-white">
              {reportsQuotaUsed} / {reportsQuotaLimit} consumidos
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleExecute}
            disabled={isExporting}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-primary-600 hover:bg-primary-500 shadow-md shadow-primary-600/30 transition-all disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isExporting ? 'Gerando arquivo...' : 'Baixar Arquivo'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
