import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { operationsApi } from '../api/operationsApi';
import { formatLicensePlate } from '@/features/crm/utils/validators';
import { getApiErrorMessage } from '@/shared/utils/formErrors';
import { SignaturePad } from '@/shared/components/common/SignaturePad';

interface CustomerQuotePortalProps {
  quoteId: string;
}

export function CustomerQuotePortal({ quoteId }: CustomerQuotePortalProps) {
  const queryClient = useQueryClient();

  const [termsAccepted, setTermsAccepted] = useState(false);
  const [signerName, setSignerName] = useState('');
  const [signatureData, setSignatureData] = useState('');
  const [refusalModalOpen, setRefusalModalOpen] = useState(false);
  const [refusalReason, setRefusalReason] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Fetch Public Quote details (Anonymous, No JWT required)
  const {
    data: quote,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['public', 'quote', quoteId],
    queryFn: () => operationsApi.getPublicQuote(quoteId),
  });

  // Customer Decision Mutation
  const decisionMutation = useMutation({
    mutationFn: ({ approved, notes }: { approved: boolean; notes?: string }) =>
      operationsApi.processPublicDecision(quoteId, {
        approved,
        signerName: signerName.trim() || undefined,
        signatureData: signatureData || undefined,
        notes,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['public', 'quote', quoteId] });
      setRefusalModalOpen(false);
    },
    onError: (err) => {
      setErrorMsg(getApiErrorMessage(err, 'Erro ao processar sua resposta.'));
    },
  });

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-4">
        <span className="material-symbols-outlined animate-spin text-[40px] text-primary">
          progress_activity
        </span>
        <p className="mt-3 font-semibold text-on-surface">Carregando orçamento...</p>
      </div>
    );
  }

  if (isError || !quote) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-4">
        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-8 max-w-md text-center shadow-md">
          <div className="w-16 h-16 bg-error/10 text-error rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-[36px]">error</span>
          </div>
          <h2 className="text-xl font-bold text-on-surface">
            Orçamento não encontrado
          </h2>
          <p className="text-sm text-on-surface-variant mt-2">
            {(error as Error)?.message || 'O link pode estar expirado ou o orçamento foi cancelado pela oficina.'}
          </p>
        </div>
      </div>
    );
  }

  const isAlreadyDecided =
    quote.status === 'CUSTOMER_APPROVED' || quote.status === 'CUSTOMER_REJECTED';

  const handleApprove = () => {
    if (!termsAccepted) {
      setErrorMsg('Por favor, aceite os termos e condições antes de aprovar.');
      return;
    }
    if (signerName.trim().length < 3) {
      setErrorMsg('Por favor, informe seu nome completo no campo do responsável.');
      return;
    }
    setErrorMsg(null);
    decisionMutation.mutate({
      approved: true,
      notes: `Aprovado pelo cliente via Portal Online`,
    });
  };
  const handleReject = () => {
    decisionMutation.mutate({
      approved: false,
      notes: refusalReason.trim() || 'Recusado pelo cliente via Portal Online',
    });
  };

  if (isError || !quote) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-4">
        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-8 max-w-[480px] text-center shadow-md">
          <span className="material-symbols-outlined text-error text-[48px]">receipt_long</span>
          <h2 className="text-xl font-bold text-on-surface mt-2">Orçamento indisponível</h2>
          <p className="text-sm text-on-surface-variant mt-1">
            {(error as Error)?.message || 'Não foi possível carregar os dados deste orçamento.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-container-low text-on-surface py-8 px-4 sm:px-6 flex flex-col items-center">
      {/* Top Banner / Actions Bar */}
      <div className="w-full max-w-[960px] flex justify-between items-center mb-4 print:hidden">
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm text-on-surface">Orçamento #{quote.id.slice(0, 8).toUpperCase()}</span>
        </div>

        <button
          type="button"
          onClick={handlePrint}
          className="px-3.5 py-1.5 bg-surface-container-lowest border border-outline-variant rounded-lg text-xs font-semibold text-on-surface hover:bg-surface-container flex items-center gap-1.5 shadow-xs"
        >
          <span className="material-symbols-outlined text-[16px]">print</span>
          Imprimir / Salvar PDF
        </button>
      </div>

      {/* Main Container */}
      <main className="w-full max-w-[960px] bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-lg overflow-hidden flex flex-col print:shadow-none print:border-none">
        {/* Header */}
        <header className="p-6 sm:p-8 border-b border-outline-variant bg-surface-container-lowest flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-3">
            {quote.logoUrl ? (
              <img
                src={quote.logoUrl}
                alt={quote.workshopName || 'Oficina'}
                className="w-12 h-12 rounded-xl object-cover border border-outline-variant shadow-sm shrink-0"
              />
            ) : (
              <div className="w-12 h-12 bg-primary text-on-primary rounded-xl flex items-center justify-center shrink-0 shadow-sm">
                <span className="material-symbols-outlined text-[28px]">build_circle</span>
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold text-on-surface tracking-tight">
                {quote.workshopName || 'Oficina GoMech'}
              </h1>
              <p className="text-xs text-on-surface-variant font-medium">
                Orçamento de Serviços e Peças Automotivas
              </p>
            </div>
          </div>

          <div className="text-left md:text-right">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-surface-container rounded-full mb-1">
              <span
                className={`w-2 h-2 rounded-full ${
                  quote.status === 'CUSTOMER_APPROVED'
                    ? 'bg-success'
                    : quote.status === 'CUSTOMER_REJECTED'
                    ? 'bg-error'
                    : 'bg-primary animate-pulse'
                }`}
              />
              <span className="text-xs font-bold uppercase tracking-wider text-on-surface">
                {quote.status === 'CUSTOMER_APPROVED'
                  ? 'Orçamento Aprovado'
                  : quote.status === 'CUSTOMER_REJECTED'
                  ? 'Orçamento Recusado'
                  : 'Aguardando sua Aprovação'}
              </span>
            </div>
            <p className="text-xs text-on-surface-variant">
              Emissão: {new Date(quote.createdAt).toLocaleDateString('pt-BR')}
            </p>
            {quote.validUntil && (
              <p className="text-xs font-semibold text-warning">
                Válido até: {new Date(quote.validUntil).toLocaleDateString('pt-BR')}
              </p>
            )}
          </div>
        </header>

        {/* Client & Vehicle Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6 sm:p-8 bg-surface-container/30 border-b border-outline-variant">
          {/* Customer */}
          <div className="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant/80 shadow-xs flex flex-col justify-between">
            <div>
              <span className="text-[11px] font-bold text-primary uppercase tracking-wider block mb-1">
                Cliente / Solicitante
              </span>
              <p className="text-base font-bold text-on-surface">{quote.customerName}</p>
              {quote.customerPhone && (
                <p className="text-xs text-on-surface-variant mt-0.5 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">phone</span>
                  {quote.customerPhone}
                </p>
              )}
              {quote.customerEmail && (
                <p className="text-xs text-on-surface-variant mt-0.5 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">mail</span>
                  {quote.customerEmail}
                </p>
              )}
            </div>
          </div>

          {/* Vehicle */}
          <div className="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant/80 shadow-xs flex flex-col justify-between">
            <div>
              <span className="text-[11px] font-bold text-primary uppercase tracking-wider block mb-1">
                Veículo Identificado
              </span>
              <div className="flex items-center gap-2 mt-1">
                {quote.vehiclePlate && (
                  <span className="inline-block bg-surface-container-highest border border-outline-variant font-mono font-black text-sm px-2.5 py-0.5 rounded tracking-wider shadow-xs">
                    {formatLicensePlate(quote.vehiclePlate)}
                  </span>
                )}
                <span className="text-base font-bold text-on-surface">
                  {quote.vehicleModel || 'Modelo não informado'}
                  {quote.vehicleYear ? ` (${quote.vehicleYear})` : ''}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Items Breakdown Table */}
        <div className="p-6 sm:p-8 flex flex-col gap-4">
          <h2 className="text-base font-bold text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[20px]">format_list_bulleted</span>
            Itens do Orçamento
          </h2>

          <div className="border border-outline-variant rounded-xl overflow-x-auto shadow-xs">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-surface-container/60 border-b border-outline-variant text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                  <th className="py-3 px-4">Tipo</th>
                  <th className="py-3 px-4">Descrição</th>
                  <th className="py-3 px-4 text-center">Qtd</th>
                  <th className="py-3 px-4 text-right">Valor Unit.</th>
                  <th className="py-3 px-4 text-right">Desconto</th>
                  <th className="py-3 px-4 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/60">
                {quote.items && quote.items.length > 0 ? (
                  quote.items.map((item) => (
                    <tr key={item.id} className="hover:bg-surface-container/20 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-xs">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            item.type === 'LABOR'
                              ? 'bg-secondary-fixed/40 text-secondary'
                              : 'bg-primary-fixed/40 text-primary'
                          }`}
                        >
                          {item.type === 'LABOR' ? 'Serviço' : 'Peça'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-on-surface">
                        {item.description}
                      </td>
                      <td className="py-3.5 px-4 text-center text-on-surface-variant">
                        {Number(item.quantity)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-on-surface">
                        R$ {Number(item.unitPrice).toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-on-surface-variant">
                        {Number(item.discountAmount) > 0 ? `- R$ ${Number(item.discountAmount).toFixed(2)}` : 'R$ 0,00'}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-on-surface">
                        R$ {Number(item.totalAmount).toFixed(2)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-on-surface-variant text-sm">
                      Nenhum item listado neste orçamento.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Financial Totals Summary */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-surface-container/40 p-5 rounded-xl border border-outline-variant mt-2">
            <div className="space-y-1 text-xs text-on-surface-variant">
              <p>Mão de Obra / Serviços: <strong className="text-on-surface font-mono font-bold">R$ {Number(quote.totalLaborAmount || 0).toFixed(2)}</strong></p>
              <p>Peças e Materiais: <strong className="text-on-surface font-mono font-bold">R$ {Number(quote.totalPartsAmount || 0).toFixed(2)}</strong></p>
              {Number(quote.discountAmount) > 0 && (
                <p className="text-success font-semibold">Descontos Aplicados: - R$ {Number(quote.discountAmount).toFixed(2)}</p>
              )}
            </div>
            <div className="text-left sm:text-right border-t sm:border-t-0 pt-3 sm:pt-0 w-full sm:w-auto">
              <span className="text-xs uppercase font-bold text-on-surface-variant tracking-wider block">
                Valor Total do Orçamento
              </span>
              <span className="text-2xl sm:text-3xl font-black font-mono text-primary">
                R$ {Number(quote.totalAmount || 0).toFixed(2)}
              </span>
            </div>
          </div>

          {/* Notes & Terms */}
          {(quote.notes || quote.termsAndConditions) && (
            <div className="mt-4 p-4 rounded-xl bg-surface-container-lowest border border-outline-variant space-y-3 text-xs">
              {quote.notes && (
                <div>
                  <span className="font-bold text-on-surface block mb-0.5">Observações da Oficina:</span>
                  <p className="text-on-surface-variant whitespace-pre-wrap">{quote.notes}</p>
                </div>
              )}
              {quote.termsAndConditions && (
                <div>
                  <span className="font-bold text-on-surface block mb-0.5">Termos e Condições / Garantia:</span>
                  <p className="text-on-surface-variant whitespace-pre-wrap">{quote.termsAndConditions}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Customer Decision / Interactive Approval Section */}
        <div className="p-6 sm:p-8 bg-surface-container/60 border-t border-outline-variant print:hidden">
          {isAlreadyDecided ? (
            <div
              className={`p-6 rounded-2xl border text-center ${
                quote.status === 'CUSTOMER_APPROVED'
                  ? 'bg-success-container/30 border-success/30 text-success'
                  : 'bg-error-container/30 border-error/30 text-error'
              }`}
            >
              <div className="w-12 h-12 rounded-full mx-auto flex items-center justify-center mb-3 bg-surface-container-lowest shadow-sm">
                <span className="material-symbols-outlined text-[28px]">
                  {quote.status === 'CUSTOMER_APPROVED' ? 'check_circle' : 'cancel'}
                </span>
              </div>
              <h3 className="text-lg font-bold text-on-surface">
                {quote.status === 'CUSTOMER_APPROVED'
                  ? 'Orçamento Aprovado com Sucesso!'
                  : 'Orçamento Recusado'}
              </h3>
              {quote.customerDecisionNotes && (
                <p className="text-xs text-on-surface-variant mt-2 font-mono whitespace-pre-wrap">
                  {quote.customerDecisionNotes}
                </p>
              )}
              {quote.customerDecisionAt && (
                <p className="text-[11px] text-on-surface-variant mt-1">
                  Registrado em {new Date(quote.customerDecisionAt).toLocaleString('pt-BR')}
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="border-b border-outline-variant pb-4">
                <h3 className="text-base font-bold text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[20px]">draw</span>
                  Aprovação e Assinatura Digital
                </h3>
                <p className="text-xs text-on-surface-variant mt-1">
                  Revise todos os itens acima e realize a assinatura para autorizar o início dos serviços.
                </p>
              </div>

              {errorMsg && (
                <div className="p-3 bg-error/10 border border-error/30 text-error text-xs font-semibold rounded-xl flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">error</span>
                  {errorMsg}
                </div>
              )}

              {/* Responsible Person Input */}
              <div>
                <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-1.5">
                  Nome Completo do Responsável / Assinante *
                </label>
                <input
                  type="text"
                  value={signerName}
                  onChange={(e) => setSignerName(e.target.value)}
                  placeholder="Ex: João da Silva Santos"
                  className="w-full px-4 py-2.5 bg-surface-container-lowest border border-outline-variant rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>

              {/* Digital Signature Canvas */}
              <div>
                <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-1.5">
                  Desenhe sua Assinatura *
                </label>
                <SignaturePad
                  onSave={(data) => setSignatureData(data)}
                  disabled={decisionMutation.isPending}
                />
              </div>

              {/* Terms Checkbox */}
              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="w-5 h-5 rounded border-outline-variant text-primary focus:ring-primary mt-0.5"
                />
                <span className="text-xs text-on-surface-variant leading-relaxed">
                  Declaro que li e estou de acordo com os valores, itens descritos e condições gerais deste orçamento automotivo.
                </span>
              </label>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleApprove}
                  disabled={decisionMutation.isPending}
                  className="w-full sm:flex-1 py-3 px-6 bg-primary text-on-primary font-bold text-sm rounded-xl hover:bg-primary-container shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[20px]">check_circle</span>
                  {decisionMutation.isPending ? 'Processando...' : 'Aprovar Orçamento'}
                </button>

                <button
                  type="button"
                  onClick={() => setRefusalModalOpen(true)}
                  disabled={decisionMutation.isPending}
                  className="w-full sm:w-auto py-3 px-5 bg-surface-container-lowest border border-outline-variant hover:bg-error/10 hover:border-error/40 text-on-surface-variant hover:text-error font-semibold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[18px]">cancel</span>
                  Recusar Orçamento
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Refusal Modal */}
      {refusalModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 max-w-[480px] w-full shadow-xl">
            <h3 className="text-lg font-bold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-error text-[22px]">cancel</span>
              Recusar Orçamento
            </h3>
            <p className="text-xs text-on-surface-variant mt-2">
              Por favor, informe o motivo da recusa para que a oficina possa ajustar a proposta caso necessário:
            </p>

            <textarea
              value={refusalReason}
              onChange={(e) => setRefusalReason(e.target.value)}
              placeholder="Ex: Valor acima do esperado, vou adiar o serviço..."
              rows={3}
              className="w-full mt-3 p-3 bg-surface-container-lowest border border-outline-variant rounded-xl text-xs focus:outline-none focus:border-error focus:ring-1 focus:ring-error transition-all"
            />

            <div className="flex justify-end gap-2 mt-4">
              <button
                type="button"
                onClick={() => setRefusalModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-on-surface-variant hover:bg-surface-container rounded-lg transition-colors"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={handleReject}
                disabled={decisionMutation.isPending}
                className="px-4 py-2 bg-error text-on-error font-bold text-xs rounded-lg hover:bg-error-container transition-all shadow-xs"
              >
                {decisionMutation.isPending ? 'Enviando...' : 'Confirmar Recusa'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
