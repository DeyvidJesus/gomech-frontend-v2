import React, { useState } from 'react';
import {
  X,
  QrCode,
  CreditCard,
  FileText,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { billingApi } from '../api/billingApi';
import type { BillingPlan, Payment, PaymentMethod } from '../types';

interface CheckoutModalProps {
  plan: BillingPlan | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  plan,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [method, setMethod] = useState<PaymentMethod>('PIX');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentResult, setPaymentResult] = useState<Payment | null>(null);
  const [copied, setCopied] = useState(false);

  // Card Form State
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [cardExp, setCardExp] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [installments, setInstallments] = useState(1);
  const [document, setDocument] = useState('');
  const [phone, setPhone] = useState('');

  if (!isOpen || !plan) return null;

  const handleCheckout = async () => {
    setLoading(true);
    setError(null);

    let expMonth: number | undefined;
    let expYear: number | undefined;
    if (cardExp.includes('/')) {
      const parts = cardExp.split('/');
      expMonth = parseInt(parts[0], 10);
      expYear = 2000 + parseInt(parts[1], 10);
    }

    try {
      const res = await billingApi.checkout({
        planCode: plan.code,
        method,
        cardNumber: method === 'CREDIT_CARD' ? cardNumber.replace(/\s+/g, '') : undefined,
        cardHolderName: method === 'CREDIT_CARD' ? cardHolder : undefined,
        cardExpMonth: expMonth,
        cardExpYear: expYear,
        cardCvv: method === 'CREDIT_CARD' ? cardCvv : undefined,
        installments: method === 'CREDIT_CARD' ? installments : 1,
        customerDocument: document.replace(/\D/g, ''),
        customerPhone: phone.replace(/\D/g, ''),
      });

      setPaymentResult(res.data);
      if (res.data.status === 'PAID') {
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1500);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Falha ao processar pagamento. Verifique os dados e tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/50">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              <h2 className="text-lg font-semibold text-white">Contratar Plano {plan.name}</h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              R$ {plan.price.toFixed(2)} / mês • Cancele a qualquer momento
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {error && (
            <div className="flex items-center gap-3 p-3 text-sm text-red-400 bg-red-950/40 border border-red-800/60 rounded-xl">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {!paymentResult ? (
            <>
              {/* Payment Method Selector Tabs */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2.5">
                  Forma de Pagamento
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setMethod('PIX')}
                    className={`flex flex-col items-center justify-center gap-2 p-3 rounded-xl border text-xs font-medium transition-all ${
                      method === 'PIX'
                        ? 'bg-emerald-950/40 border-emerald-500 text-emerald-300 ring-1 ring-emerald-500/50'
                        : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <QrCode className="w-5 h-5 text-emerald-400" />
                    <span>PIX Instantâneo</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMethod('CREDIT_CARD')}
                    className={`flex flex-col items-center justify-center gap-2 p-3 rounded-xl border text-xs font-medium transition-all ${
                      method === 'CREDIT_CARD'
                        ? 'bg-indigo-950/40 border-indigo-500 text-indigo-300 ring-1 ring-indigo-500/50'
                        : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <CreditCard className="w-5 h-5 text-indigo-400" />
                    <span>Cartão de Crédito</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMethod('BOLETO')}
                    className={`flex flex-col items-center justify-center gap-2 p-3 rounded-xl border text-xs font-medium transition-all ${
                      method === 'BOLETO'
                        ? 'bg-amber-950/40 border-amber-500 text-amber-300 ring-1 ring-amber-500/50'
                        : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <FileText className="w-5 h-5 text-amber-400" />
                    <span>Boleto Bancário</span>
                  </button>
                </div>
              </div>

              {/* Customer Info */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">CPF ou CNPJ</label>
                  <input
                    type="text"
                    value={document}
                    onChange={(e) => setDocument(e.target.value)}
                    placeholder="000.000.000-00"
                    className="w-full px-3 py-2 text-sm bg-slate-800/80 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">WhatsApp / Telefone</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(11) 98888-7777"
                    className="w-full px-3 py-2 text-sm bg-slate-800/80 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Method Specific Fields */}
              {method === 'CREDIT_CARD' && (
                <div className="space-y-3 p-4 bg-slate-800/40 border border-slate-800 rounded-xl">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Número do Cartão</label>
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      placeholder="0000 0000 0000 0000"
                      maxLength={19}
                      className="w-full px-3 py-2 text-sm bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Nome no Cartão</label>
                    <input
                      type="text"
                      value={cardHolder}
                      onChange={(e) => setCardHolder(e.target.value)}
                      placeholder="COMO NO CARTÃO"
                      className="w-full px-3 py-2 text-sm bg-slate-800 border border-slate-700 rounded-lg text-white uppercase focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-1">
                      <label className="block text-xs font-medium text-slate-300 mb-1">Validade</label>
                      <input
                        type="text"
                        value={cardExp}
                        onChange={(e) => setCardExp(e.target.value)}
                        placeholder="MM/AA"
                        maxLength={5}
                        className="w-full px-3 py-2 text-sm bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div className="col-span-1">
                      <label className="block text-xs font-medium text-slate-300 mb-1">CVV</label>
                      <input
                        type="password"
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value)}
                        placeholder="123"
                        maxLength={4}
                        className="w-full px-3 py-2 text-sm bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div className="col-span-1">
                      <label className="block text-xs font-medium text-slate-300 mb-1">Parcelas</label>
                      <select
                        value={installments}
                        onChange={(e) => setInstallments(Number(e.target.value))}
                        className="w-full px-3 py-2 text-sm bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value={1}>1x R$ {plan.price.toFixed(2)}</option>
                        <option value={2}>2x R$ {(plan.price / 2).toFixed(2)}</option>
                        <option value={3}>3x R$ {(plan.price / 3).toFixed(2)}</option>
                        <option value={6}>6x R$ {(plan.price / 6).toFixed(2)}</option>
                        <option value={12}>12x R$ {(plan.price / 12).toFixed(2)}</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {method === 'PIX' && (
                <div className="p-4 bg-emerald-950/20 border border-emerald-800/30 rounded-xl space-y-1 text-xs text-emerald-300">
                  <p className="font-semibold">⚡ Liberação Imediata via PIX</p>
                  <p className="text-slate-400">
                    O QR Code e o código Copia e Cola serão gerados na próxima tela com validade de 24 horas.
                  </p>
                </div>
              )}

              {method === 'BOLETO' && (
                <div className="p-4 bg-amber-950/20 border border-amber-800/30 rounded-xl space-y-1 text-xs text-amber-300">
                  <p className="font-semibold">📄 Vencimento em 3 dias úteis</p>
                  <p className="text-slate-400">
                    A compensação bancária do boleto ocorre em até 1 dia útil após o pagamento.
                  </p>
                </div>
              )}

              {/* Action Button */}
              <button
                type="button"
                onClick={handleCheckout}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium text-sm text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 transition-all shadow-lg shadow-indigo-600/30"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processando no Pagar.me...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Confirmar Assinatura (R$ {plan.price.toFixed(2)})</span>
                  </>
                )}
              </button>
            </>
          ) : (
            /* Result Screen */
            <div className="space-y-6 text-center">
              {paymentResult.status === 'PAID' ? (
                <div className="py-8 space-y-3">
                  <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto ring-8 ring-emerald-500/10">
                    <Check className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold text-white">Pagamento Aprovado!</h3>
                  <p className="text-sm text-slate-400">
                    Sua assinatura do plano <strong>{plan.name}</strong> está ativa com sucesso.
                  </p>
                </div>
              ) : method === 'PIX' ? (
                <div className="space-y-4">
                  <div className="bg-white p-4 rounded-xl inline-block shadow-lg mx-auto">
                    <div className="w-48 h-48 bg-slate-100 flex items-center justify-center rounded-lg border border-slate-200">
                      {paymentResult.pixQrCodeUrl ? (
                        <img
                          src={paymentResult.pixQrCodeUrl}
                          alt="QR Code Pix"
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <QrCode className="w-32 h-32 text-slate-900" />
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-slate-400">
                    Abra o app do seu banco e escaneie o QR Code acima ou use o código Copia e Cola:
                  </p>

                  {paymentResult.pixCopyPaste && (
                    <div className="flex items-center gap-2 bg-slate-800/80 p-2.5 rounded-xl border border-slate-700 text-left">
                      <input
                        type="text"
                        readOnly
                        value={paymentResult.pixCopyPaste}
                        className="bg-transparent text-xs text-slate-300 flex-1 outline-none font-mono truncate"
                      />
                      <button
                        onClick={() => handleCopy(paymentResult.pixCopyPaste!)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium transition-colors shrink-0"
                      >
                        {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copied ? 'Copiado!' : 'Copiar'}</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4 py-4">
                  <div className="w-14 h-14 bg-amber-500/20 text-amber-400 rounded-full flex items-center justify-center mx-auto">
                    <FileText className="w-7 h-7" />
                  </div>
                  <h3 className="text-lg font-bold text-white">Boleto Bancário Gerado</h3>
                  <p className="text-xs text-slate-400">
                    Linha digitável do boleto com vencimento em{' '}
                    {paymentResult.boletoDueDate || '3 dias'}:
                  </p>

                  {paymentResult.boletoBarcode && (
                    <div className="flex items-center gap-2 bg-slate-800/80 p-2.5 rounded-xl border border-slate-700 text-left">
                      <input
                        type="text"
                        readOnly
                        value={paymentResult.boletoBarcode}
                        className="bg-transparent text-xs text-slate-300 flex-1 outline-none font-mono truncate"
                      />
                      <button
                        onClick={() => handleCopy(paymentResult.boletoBarcode!)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-medium transition-colors shrink-0"
                      >
                        {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copied ? 'Copiado!' : 'Copiar'}</span>
                      </button>
                    </div>
                  )}

                  {paymentResult.boletoUrl && (
                    <a
                      href={paymentResult.boletoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition-colors border border-slate-700"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>Abrir Boleto em PDF</span>
                    </a>
                  )}
                </div>
              )}

              <button
                type="button"
                onClick={() => {
                  onSuccess();
                  onClose();
                }}
                className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium transition-colors"
              >
                Fechar e Voltar ao Painel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
