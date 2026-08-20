import React from 'react';
import {
  FileText,
  QrCode,
  CreditCard,
  CheckCircle2,
  Clock,
  XCircle,
  ExternalLink,
  Receipt,
} from 'lucide-react';
import type { Payment, PaymentStatus, PaymentMethod } from '../types';

interface InvoicesListProps {
  payments: Payment[];
  loading?: boolean;
  onSelectPayment?: (payment: Payment) => void;
}

export const InvoicesList: React.FC<InvoicesListProps> = ({
  payments,
  loading = false,
  onSelectPayment,
}) => {
  const getStatusBadge = (status: PaymentStatus) => {
    switch (status) {
      case 'PAID':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Pago
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Clock className="w-3.5 h-3.5" />
            Pendente
          </span>
        );
      case 'FAILED':
      case 'CANCELED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20">
            <XCircle className="w-3.5 h-3.5" />
            Não Pago
          </span>
        );
      case 'REFUNDED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">
            Estornado
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-500/10 text-slate-400 border border-slate-500/20">
            {status}
          </span>
        );
    }
  };

  const getMethodIcon = (method: PaymentMethod) => {
    switch (method) {
      case 'PIX':
        return <QrCode className="w-4 h-4 text-emerald-400" />;
      case 'CREDIT_CARD':
        return <CreditCard className="w-4 h-4 text-indigo-400" />;
      case 'BOLETO':
        return <FileText className="w-4 h-4 text-amber-400" />;
      default:
        return <Receipt className="w-4 h-4 text-slate-400" />;
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-400 space-y-2">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm">Carregando faturas...</p>
      </div>
    );
  }

  if (payments.length === 0) {
    return (
      <div className="p-12 text-center bg-slate-900/40 border border-slate-800/80 rounded-2xl">
        <Receipt className="w-12 h-12 text-slate-600 mx-auto mb-3" />
        <h3 className="text-base font-semibold text-slate-200">Nenhuma fatura encontrada</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
          As faturas e comprovantes gerados pelos pagamentos das assinaturas aparecerão aqui.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden border border-slate-800 rounded-2xl bg-slate-900/60 backdrop-blur-md shadow-xl">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-slate-950/60 text-xs font-semibold uppercase text-slate-400 border-b border-slate-800">
            <tr>
              <th className="px-6 py-4">Data</th>
              <th className="px-6 py-4">Método</th>
              <th className="px-6 py-4">Valor</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Identificador</th>
              <th className="px-6 py-4 text-right">Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {payments.map((p) => (
              <tr
                key={p.id}
                className="hover:bg-slate-800/40 transition-colors cursor-pointer group"
                onClick={() => onSelectPayment?.(p)}
              >
                <td className="px-6 py-4 font-mono text-xs text-slate-300 whitespace-nowrap">
                  {p.createdAt ? new Date(p.createdAt).toLocaleDateString('pt-BR') : '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    {getMethodIcon(p.paymentMethod)}
                    <span className="text-xs font-medium text-slate-200">
                      {p.paymentMethod === 'PIX'
                        ? 'PIX'
                        : p.paymentMethod === 'CREDIT_CARD'
                        ? `Cartão ${p.cardBrand ? `(${p.cardBrand})` : ''}`
                        : 'Boleto'}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 font-semibold text-white whitespace-nowrap">
                  R$ {p.amount.toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getStatusBadge(p.status)}
                </td>
                <td className="px-6 py-4 font-mono text-xs text-slate-500 whitespace-nowrap">
                  {p.gatewayOrderId || p.id.substring(0, 8)}
                </td>
                <td className="px-6 py-4 text-right whitespace-nowrap">
                  {p.boletoUrl && (
                    <a
                      href={p.boletoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 font-medium ml-2"
                    >
                      <span>Boleto</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  {p.status === 'PENDING' && p.paymentMethod === 'PIX' && (
                    <span className="text-xs text-emerald-400 font-medium">Ver QR Code</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
