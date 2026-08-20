import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { operationsApi } from '../api/operationsApi';
import { formatLicensePlate } from '@/features/crm/utils/validators';
import { getApiErrorMessage } from '@/shared/utils/formErrors';

interface CustomerQuotePortalProps {
  quoteId: string;
}

export function CustomerQuotePortal({ quoteId }: CustomerQuotePortalProps) {
  const queryClient = useQueryClient();

  const [termsAccepted, setTermsAccepted] = useState(false);
  const [digitalSignature, setDigitalSignature] = useState('');
  const [refusalModalOpen, setRefusalModalOpen] = useState(false);
  const [refusalReason, setRefusalReason] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Fetch Quote details
  const {
    data: quote,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['portal', 'quote', quoteId],
    queryFn: () => operationsApi.getQuoteById(quoteId),
  });

  // Customer Decision Mutation
  const decisionMutation = useMutation({
    mutationFn: ({ approved, notes }: { approved: boolean; notes?: string }) =>
      operationsApi.processCustomerDecision(quoteId, { approved, notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portal', 'quote', quoteId] });
      setRefusalModalOpen(false);
    },
    onError: (err) => {
      setErrorMsg(getApiErrorMessage(err, 'Erro ao processar sua resposta.'));
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <span className="material-symbols-outlined animate-spin text-[36px] text-primary">
          progress_activity
        </span>
        <p className="mt-3 font-medium text-on-surface">Carregando orçamento...</p>
      </div>
    );
  }

  if (isError || !quote) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-8 max-w-md text-center shadow-sm">
          <span className="material-symbols-outlined text-[48px] text-error">error</span>
          <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface mt-2">
            Orçamento não encontrado
          </h2>
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
            {(error as Error)?.message || 'O link pode estar expirado ou inválido.'}
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
    if (digitalSignature.trim().length < 3) {
      setErrorMsg('Digite seu nome completo no campo de assinatura digital.');
      return;
    }
    setErrorMsg(null);
    decisionMutation.mutate({
      approved: true,
      notes: `Assinado digitalmente por: ${digitalSignature.trim()}`,
    });
  };

  const handleReject = () => {
    decisionMutation.mutate({
      approved: false,
      notes: refusalReason.trim() || 'Recusado pelo cliente no portal online',
    });
  };

  return (
    <div className="min-h-screen bg-background text-on-background py-8 px-4 sm:px-6 flex flex-col items-center font-body-md antialiased">
      {/* Main Document Card */}
      <main className="w-full max-w-4xl bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-md overflow-hidden flex flex-col animate-in fade-in">
        {/* Header */}
        <header className="p-6 sm:p-8 border-b border-outline-variant bg-surface-container-lowest relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary text-on-primary rounded-xl flex items-center justify-center shrink-0 shadow-sm">
              <span className="material-symbols-outlined text-[28px]">build_circle</span>
            </div>
            <div>
              <h1 className="font-headline-lg text-headline-lg font-bold text-primary tracking-tight">
                GoMech
              </h1>
              <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest">
                Oficina & Centro Automotivo
              </p>
            </div>
          </div>

          <div className="text-left md:text-right">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-surface-container-high rounded-full mb-1">
              <span
                className={`w-2 h-2 rounded-full ${
                  quote.status === 'CUSTOMER_APPROVED'
                    ? 'bg-tertiary'
                    : quote.status === 'CUSTOMER_REJECTED'
                    ? 'bg-error'
                    : 'bg-primary animate-pulse'
                }`}
              ></span>
              <span className="font-label-sm text-[11px] font-bold text-on-surface uppercase">
                {quote.status === 'CUSTOMER_APPROVED'
                  ? 'Aprovado'
                  : quote.status === 'CUSTOMER_REJECTED'
                  ? 'Recusado'
                  : 'Aguardando Sua Aprovação'}
              </span>
            </div>
            <p className="font-headline-sm text-headline-sm font-bold text-on-surface">
              Orçamento #{quote.id.slice(0, 8).toUpperCase()}
            </p>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Emitido em: {new Date(quote.createdAt).toLocaleDateString('pt-BR')}
            </p>
          </div>
        </header>

        {/* Feedback / Status Alert if already decided */}
        {isAlreadyDecided && (
          <div
            className={`p-4 border-b border-outline-variant flex items-center gap-3 ${
              quote.status === 'CUSTOMER_APPROVED'
                ? 'bg-tertiary/15 text-tertiary'
                : 'bg-error-container text-on-error-container'
            }`}
          >
            <span className="material-symbols-outlined text-[24px]">
              {quote.status === 'CUSTOMER_APPROVED' ? 'verified' : 'cancel'}
            </span>
            <div>
              <p className="font-bold text-body-md">
                {quote.status === 'CUSTOMER_APPROVED'
                  ? 'Orçamento Aprovado com Sucesso!'
                  : 'Orçamento Recusado.'}
              </p>
              <p className="text-body-sm opacity-90">
                {quote.customerDecisionNotes ||
                  (quote.status === 'CUSTOMER_APPROVED'
                    ? 'Nossa equipe técnica já foi notificada para iniciar os serviços.'
                    : 'Caso tenha dúvidas ou queira renegociar, entre em contato com nossa equipe.')}
              </p>
            </div>
          </div>
        )}

        {/* Vehicle & Client Info */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 sm:p-8 border-b border-outline-variant bg-surface">
          <div className="flex flex-col gap-2">
            <h2 className="font-label-sm text-label-sm text-on-surface-variant uppercase font-semibold">
              Detalhes do Veículo
            </h2>
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-outline mt-0.5">directions_car</span>
              <div>
                <p className="font-headline-sm text-headline-sm font-bold text-on-surface">
                  {quote.vehicleBrand} {quote.vehicleModel}
                </p>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  Ano: {quote.vehicleYear || 'N/A'}
                </p>
                <p className="font-body-sm text-body-sm text-primary font-mono font-bold mt-0.5">
                  Placa: {formatLicensePlate(quote.licensePlate)}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 md:items-end">
            <h2 className="font-label-sm text-label-sm text-on-surface-variant uppercase font-semibold md:text-right">
              Preparado Para
            </h2>
            <div className="flex items-start gap-3 md:flex-row-reverse md:text-right">
              <span className="material-symbols-outlined text-outline mt-0.5">person</span>
              <div>
                <p className="font-headline-sm text-headline-sm font-bold text-on-surface">
                  {quote.customerName}
                </p>
                {quote.customerDocument && (
                  <p className="font-body-sm text-body-sm text-on-surface-variant font-mono">
                    CPF/CNPJ: {quote.customerDocument}
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Summary of Work / Notes */}
        {quote.notes && (
          <section className="p-6 sm:p-8 border-b border-outline-variant">
            <h2 className="font-label-sm text-label-sm text-on-surface-variant uppercase font-semibold mb-2">
              Observações Técnicas do Atendimento
            </h2>
            <div className="bg-surface p-4 rounded-xl border border-outline-variant">
              <p className="font-body-md text-body-md text-on-surface leading-relaxed">
                {quote.notes}
              </p>
            </div>
          </section>
        )}

        {/* Detailed Breakdown */}
        <section className="p-6 sm:p-8 border-b border-outline-variant">
          <h2 className="font-label-sm text-label-sm text-on-surface-variant uppercase font-semibold mb-3">
            Detalhamento de Peças e Mão de Obra
          </h2>

          <div className="overflow-x-auto rounded-xl border border-outline-variant">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="bg-surface font-label-sm text-label-sm text-on-surface-variant uppercase border-b border-outline-variant">
                  <th className="p-3.5 font-semibold">Descrição do Serviço / Peça</th>
                  <th className="p-3.5 font-semibold text-center w-24">Tipo</th>
                  <th className="p-3.5 font-semibold text-right w-20">Qtd</th>
                  <th className="p-3.5 font-semibold text-right w-28">Preço Unit.</th>
                  <th className="p-3.5 font-semibold text-right w-28">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant text-body-sm">
                {(quote.items || []).map((item, idx) => (
                  <tr key={idx} className="hover:bg-surface-bright transition-colors">
                    <td className="p-3.5 font-medium text-on-surface">
                      <div>{item.name}</div>
                      {item.description && (
                        <div className="text-[11px] text-on-surface-variant mt-0.5">
                          {item.description}
                        </div>
                      )}
                    </td>
                    <td className="p-3.5 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          item.type === 'PART'
                            ? 'bg-secondary-container text-on-secondary-container'
                            : 'bg-primary-container/20 text-primary'
                        }`}
                      >
                        {item.type === 'PART' ? 'PEÇA' : 'SERVIÇO'}
                      </span>
                    </td>
                    <td className="p-3.5 text-right font-mono">{item.quantity}</td>
                    <td className="p-3.5 text-right font-mono">
                      {(item.unitPrice || 0).toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      })}
                    </td>
                    <td className="p-3.5 text-right font-bold text-on-surface font-mono">
                      {(item.totalAmount || 0).toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Financial Summary */}
        <section className="p-6 sm:p-8 border-b border-outline-variant bg-surface flex flex-col items-end">
          <div className="w-full max-w-sm flex flex-col gap-2">
            <div className="flex justify-between items-center text-body-sm text-on-surface-variant">
              <span>Subtotal Peças</span>
              <span className="font-medium text-on-surface">
                {(quote.totalPartsAmount || 0).toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                })}
              </span>
            </div>

            <div className="flex justify-between items-center text-body-sm text-on-surface-variant">
              <span>Subtotal Mão de Obra</span>
              <span className="font-medium text-on-surface">
                {(quote.totalLaborAmount || 0).toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                })}
              </span>
            </div>

            {quote.discountAmount > 0 && (
              <div className="flex justify-between items-center text-body-sm text-error">
                <span>Desconto Concedido</span>
                <span>
                  -
                  {quote.discountAmount.toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  })}
                </span>
              </div>
            )}

            {quote.taxAmount > 0 && (
              <div className="flex justify-between items-center text-body-sm text-on-surface-variant">
                <span>Impostos Estimados</span>
                <span>
                  {quote.taxAmount.toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  })}
                </span>
              </div>
            )}

            <div className="h-px w-full bg-outline-variant my-2"></div>

            <div className="flex justify-between items-end">
              <div>
                <span className="font-headline-sm text-headline-sm font-bold text-on-surface block">
                  Valor Total
                </span>
                <span className="text-[11px] text-on-surface-variant">
                  Válido por 10 dias a partir da emissão
                </span>
              </div>
              <span className="font-display-lg text-display-lg font-bold text-primary">
                {(quote.totalAmount || 0).toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                })}
              </span>
            </div>
          </div>
        </section>

        {/* Terms & Digital Signature (Active only if not decided) */}
        {!isAlreadyDecided && (
          <section className="p-6 sm:p-8 bg-surface-container-lowest space-y-6">
            {errorMsg && (
              <div className="p-3 bg-error-container text-on-error-container rounded-xl text-body-sm font-medium">
                {errorMsg}
              </div>
            )}

            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="mt-1 rounded border-outline-variant text-primary focus:ring-primary"
              />
              <span className="text-body-sm text-on-surface leading-relaxed">
                Autorizo a execução dos serviços e substituição das peças listadas acima neste
                orçamento. Declaro estar ciente dos termos de garantia e autorizo os testes de rodagem
                necessários pelos mecânicos da oficina.
              </span>
            </label>

            <div className="max-w-md">
              <label className="block font-label-sm text-label-sm text-on-surface-variant uppercase font-semibold mb-1">
                Assinatura Digital (Digite seu Nome Completo)
              </label>
              <input
                type="text"
                disabled={!termsAccepted}
                placeholder="Ex: Alex Johnson"
                value={digitalSignature}
                onChange={(e) => setDigitalSignature(e.target.value)}
                className="w-full h-11 px-3 bg-surface border border-outline-variant rounded-xl text-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none disabled:bg-surface-container-low disabled:opacity-50"
              />
            </div>
          </section>
        )}

        {/* Footer Actions */}
        {!isAlreadyDecided && (
          <footer className="p-6 sm:p-8 bg-surface-container-low border-t border-outline-variant flex flex-col sm:flex-row justify-end items-center gap-4">
            <button
              type="button"
              onClick={() => setRefusalModalOpen(true)}
              className="w-full sm:w-auto px-5 py-2.5 bg-surface border border-outline-variant text-on-surface rounded-xl font-label-md text-label-md font-semibold hover:bg-surface-container transition-colors"
            >
              Recusar / Contatar Oficina
            </button>

            <button
              type="button"
              onClick={handleApprove}
              disabled={!termsAccepted || digitalSignature.trim().length < 3 || decisionMutation.isPending}
              className="w-full sm:w-auto px-7 py-2.5 bg-tertiary text-on-tertiary rounded-xl font-label-md text-label-md font-bold hover:opacity-90 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {decisionMutation.isPending && (
                <span className="material-symbols-outlined animate-spin text-[18px]">
                  progress_activity
                </span>
              )}
              <span className="material-symbols-outlined text-[20px]">check_circle</span>
              Aprovar Orçamento
            </button>
          </footer>
        )}
      </main>

      {/* Refusal Modal */}
      {refusalModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-error text-[24px]">cancel</span>
              Recusar Orçamento
            </h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Por favor, informe o motivo para que nossa equipe possa lhe atender melhor.
            </p>

            <textarea
              rows={3}
              placeholder="Ex: Valor acima do esperado, desejo realizar apenas parte dos serviços..."
              value={refusalReason}
              onChange={(e) => setRefusalReason(e.target.value)}
              className="w-full p-3 bg-surface border border-outline-variant rounded-xl text-body-sm text-on-surface resize-none focus:border-primary focus:ring-1 focus:ring-primary outline-none"
            ></textarea>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setRefusalModalOpen(false)}
                className="px-4 py-2 border border-outline-variant rounded-xl font-label-md text-label-md text-on-surface hover:bg-surface-container"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={handleReject}
                disabled={decisionMutation.isPending}
                className="px-5 py-2 bg-error text-on-error rounded-xl font-label-md text-label-md font-bold hover:opacity-90 transition-all shadow-sm flex items-center gap-2"
              >
                Confirmar Recusa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
