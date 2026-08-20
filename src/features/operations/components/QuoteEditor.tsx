import { useState, useEffect, useMemo, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { operationsApi } from '../api/operationsApi';
import { crmApi } from '@/features/crm/api/crmApi';
import { useAuthStore } from '@/features/iam/stores/authStore';
import type {
  QuoteResponse,
  QuoteItemType,
  SaveQuoteItemRequest,
} from '../types';
import { formatLicensePlate } from '@/features/crm/utils/validators';
import { getApiErrorMessage } from '@/shared/utils/formErrors';

interface QuoteEditorProps {
  quoteId?: string;
  fromInspectionId?: string;
}

export function QuoteEditor({ quoteId, fromInspectionId }: QuoteEditorProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const activeUnitId = user?.activeUnitId;

  // If fromInspectionId is passed in creation mode, trigger auto-import
  const [createdQuoteId, setCreatedQuoteId] = useState<string | null>(quoteId || null);
  const importTriggeredRef = useRef(false);

  // Auto-create from inspection if fromInspectionId is given and no quote exists yet
  const createFromInspectionMutation = useMutation({
    mutationFn: (inspId: string) => operationsApi.createQuoteFromInspection(inspId),
    onSuccess: (newQuote) => {
      setCreatedQuoteId(newQuote.id);
      queryClient.invalidateQueries({ queryKey: ['operations', 'quotes'] });
      navigate({
        to: '/operations/quotes/$id',
        params: { id: newQuote.id },
      });
    },
  });

  useEffect(() => {
    if (fromInspectionId && !quoteId && !createdQuoteId && !importTriggeredRef.current) {
      importTriggeredRef.current = true;
      createFromInspectionMutation.mutate(fromInspectionId);
    }
  }, [fromInspectionId, quoteId, createdQuoteId]);

  const activeId = createdQuoteId || quoteId;

  // Fetch Quote Details if ID exists
  const {
    data: quote,
    isLoading: isLoadingQuote,
    isError,
    error,
  } = useQuery({
    queryKey: ['operations', 'quote', activeId],
    queryFn: () => operationsApi.getQuoteById(activeId!),
    enabled: Boolean(activeId),
  });

  if (fromInspectionId && createFromInspectionMutation.isPending) {
    return (
      <div className="py-24 text-center text-on-surface-variant">
        <span className="material-symbols-outlined animate-spin text-[32px] text-primary">
          progress_activity
        </span>
        <p className="mt-2 font-medium">
          Importando apontamentos da vistoria e gerando orçamento...
        </p>
      </div>
    );
  }

  if (activeId) {
    if (isLoadingQuote) {
      return (
        <div className="py-24 text-center text-on-surface-variant">
          <span className="material-symbols-outlined animate-spin text-[32px] text-primary">
            progress_activity
          </span>
          <p className="mt-2 font-medium">Carregando orçamento...</p>
        </div>
      );
    }

    if (isError || !quote) {
      return (
        <div className="py-16 text-center text-error">
          Erro ao carregar orçamento: {(error as Error)?.message || 'Orçamento não encontrado'}
        </div>
      );
    }

    return <QuoteEditorContent quote={quote} activeUnitId={activeUnitId} />;
  }

  // Blank New Quote Creation Form
  return <NewQuoteForm activeUnitId={activeUnitId} />;
}

// -------------------------------------------------------------
// Component: QuoteEditorContent (For existing/loaded quotes)
// -------------------------------------------------------------
interface QuoteEditorContentProps {
  quote: QuoteResponse;
  activeUnitId?: string;
}

function QuoteEditorContent({ quote, activeUnitId }: QuoteEditorContentProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const quoteId = quote.id;

  const isEditable = quote.status === 'DRAFT' || quote.status === 'REVISION';

  // Items local state
  const [items, setItems] = useState<SaveQuoteItemRequest[]>(() =>
    (quote.items || []).map((item) => ({
      id: item.id,
      type: item.type,
      productId: item.productId,
      name: item.name,
      description: item.description || '',
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      discountAmount: item.discountAmount || 0,
      taxRate: item.taxRate || 0,
    }))
  );

  const [notes, setNotes] = useState(quote.notes || '');
  const [terms, setTerms] = useState(quote.termsAndConditions || '');
  const [activeNotesTab, setActiveNotesTab] = useState<'CUSTOMER' | 'TERMS'>('CUSTOMER');
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const [decisionModalOpen, setDecisionModalOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Financial calculations in real-time
  const { subtotal, totalDiscount, totalTaxes, totalParts, totalLabor, grandTotal } =
    useMemo(() => {
      let sub = 0;
      let disc = 0;
      let tax = 0;
      let parts = 0;
      let labor = 0;

      items.forEach((item) => {
        const itemSubtotal = (item.quantity || 0) * (item.unitPrice || 0);
        const itemDiscount = item.discountAmount || 0;
        const taxable = Math.max(0, itemSubtotal - itemDiscount);
        const itemTax = taxable * ((item.taxRate || 0) / 100);

        sub += itemSubtotal;
        disc += itemDiscount;
        tax += itemTax;

        if (item.type === 'PART') {
          parts += taxable + itemTax;
        } else {
          labor += taxable + itemTax;
        }
      });

      const total = Math.max(0, sub - disc) + tax;
      return {
        subtotal: sub,
        totalDiscount: disc,
        totalTaxes: tax,
        totalParts: parts,
        totalLabor: labor,
        grandTotal: total,
      };
    }, [items]);

  // Mutations
  const saveItemsMutation = useMutation({
    mutationFn: () => operationsApi.updateQuoteItems(quoteId, items),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operations', 'quote', quoteId] });
      setFeedbackMsg('Itens e cálculos salvos com sucesso!');
      setTimeout(() => setFeedbackMsg(null), 3500);
    },
  });

  const submitApprovalMutation = useMutation({
    mutationFn: () => operationsApi.submitQuoteForApproval(quoteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operations', 'quote', quoteId] });
      queryClient.invalidateQueries({ queryKey: ['operations', 'quotes'] });
    },
  });

  const approveInternallyMutation = useMutation({
    mutationFn: () => operationsApi.approveQuoteInternally(quoteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operations', 'quote', quoteId] });
      queryClient.invalidateQueries({ queryKey: ['operations', 'quotes'] });
    },
  });

  const sendToCustomerMutation = useMutation({
    mutationFn: () => operationsApi.sendQuoteToCustomer(quoteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operations', 'quote', quoteId] });
      queryClient.invalidateQueries({ queryKey: ['operations', 'quotes'] });
    },
  });

  const convertToWorkOrderMutation = useMutation({
    mutationFn: () => operationsApi.createWorkOrderFromQuote(quoteId, activeUnitId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operations', 'quotes'] });
      navigate({
        to: '/operations/work-orders' as never,
      });
    },
    onError: (err) => {
      alert(getApiErrorMessage(err, 'Erro ao converter orçamento em Ordem de Serviço.'));
    },
  });

  // Add Item handler
  const addItem = (type: QuoteItemType) => {
    if (!isEditable) return;
    setItems((prev) => [
      ...prev,
      {
        type,
        name: type === 'PART' ? 'Nova Peça' : 'Novo Serviço',
        description: '',
        quantity: 1,
        unitPrice: 0,
        discountAmount: 0,
        taxRate: 0,
      },
    ]);
  };

  const updateItemField = <K extends keyof SaveQuoteItemRequest>(
    index: number,
    field: K,
    val: SaveQuoteItemRequest[K]
  ) => {
    if (!isEditable) return;
    setItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: val };
      return updated;
    });
  };

  const removeItem = (index: number) => {
    if (!isEditable) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const copyPortalLink = () => {
    const portalUrl = `${window.location.origin}/portal/quotes/${quoteId}`;
    navigator.clipboard.writeText(portalUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  const getQuoteStatusLabel = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return 'Rascunho';
      case 'PENDING_INTERNAL_APPROVAL':
        return 'Pendente Gerência';
      case 'INTERNAL_APPROVED':
        return 'Aprovado Interno';
      case 'SENT_TO_CUSTOMER':
        return 'Enviado ao Cliente';
      case 'CUSTOMER_APPROVED':
        return 'Aprovado pelo Cliente';
      case 'CUSTOMER_REJECTED':
        return 'Recusado pelo Cliente';
      case 'REVISION':
        return 'Em Revisão';
      case 'EXPIRED':
        return 'Expirado';
      case 'CANCELED':
        return 'Cancelado';
      default:
        return status;
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto py-4 animate-in fade-in duration-200">
      {/* Header */}
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-outline-variant">
        <div>
          <div className="flex items-center gap-2 text-on-surface-variant mb-1">
            <button
              type="button"
              onClick={() => navigate({ to: '/operations/quotes' })}
              className="hover:text-primary transition-colors flex items-center gap-1 font-label-sm text-label-sm uppercase tracking-wider"
            >
              <span className="material-symbols-outlined text-[16px]">arrow_back</span>
              Orçamentos
            </button>
            <span className="text-outline">/</span>
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface">
              #{quote.id.slice(0, 8).toUpperCase()}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-headline-lg text-headline-lg font-bold text-on-surface">
              Orçamento #{quote.id.slice(0, 8).toUpperCase()}
            </h1>
            <span
              className={`px-2.5 py-0.5 rounded-full font-label-sm text-[11px] font-bold ${
                quote.status === 'CUSTOMER_APPROVED'
                  ? 'bg-tertiary text-on-tertiary'
                  : quote.status === 'INTERNAL_APPROVED' || quote.status === 'SENT_TO_CUSTOMER'
                  ? 'bg-secondary text-on-secondary'
                  : quote.status === 'PENDING_INTERNAL_APPROVAL'
                  ? 'bg-primary text-on-primary'
                  : quote.status === 'CUSTOMER_REJECTED' || quote.status === 'CANCELED'
                  ? 'bg-error-container text-on-error-container'
                  : 'bg-surface-variant text-on-surface-variant'
              }`}
            >
              {getQuoteStatusLabel(quote.status)}
            </span>
          </div>

          <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
            Cliente: <span className="font-semibold text-on-surface">{quote.customerName}</span> •
            Veículo:{' '}
            <span className="font-semibold text-on-surface">
              {quote.vehicleBrand} {quote.vehicleModel}
            </span>{' '}
            • Placa:{' '}
            <span className="font-mono font-bold text-primary">
              {formatLicensePlate(quote.licensePlate)}
            </span>
          </p>
        </div>

        {/* Workflow Actions Bar */}
        <div className="flex flex-wrap items-center gap-2.5">
          {feedbackMsg && (
            <span className="text-tertiary font-label-sm text-label-sm font-bold flex items-center gap-1 animate-in fade-in">
              <span className="material-symbols-outlined text-[16px]">check_circle</span>
              {feedbackMsg}
            </span>
          )}

          {/* Workflow Step 1: DRAFT or REVISION */}
          {isEditable && (
            <>
              <button
                type="button"
                onClick={() => saveItemsMutation.mutate()}
                disabled={saveItemsMutation.isPending}
                className="px-4 py-2 bg-surface border border-outline-variant text-on-surface font-label-md text-label-md font-semibold rounded-lg hover:bg-surface-container transition-colors shadow-xs flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[18px]">save</span>
                Salvar Itens
              </button>

              <button
                type="button"
                onClick={() => submitApprovalMutation.mutate()}
                disabled={submitApprovalMutation.isPending || items.length === 0}
                className="px-5 py-2 bg-primary text-on-primary font-label-md text-label-md font-bold rounded-lg hover:bg-primary-container transition-all shadow-sm flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[18px]">rule</span>
                Enviar para Aprovação Gerencial
              </button>
            </>
          )}

          {/* Workflow Step 2: PENDING_INTERNAL_APPROVAL */}
          {quote.status === 'PENDING_INTERNAL_APPROVAL' && (
            <button
              type="button"
              onClick={() => approveInternallyMutation.mutate()}
              disabled={approveInternallyMutation.isPending}
              className="px-5 py-2 bg-tertiary text-on-tertiary font-label-md text-label-md font-bold rounded-lg hover:opacity-90 transition-all shadow-sm flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[18px]">verified</span>
              Aprovar Orçamento (Gerência)
            </button>
          )}

          {/* Workflow Step 3: INTERNAL_APPROVED */}
          {quote.status === 'INTERNAL_APPROVED' && (
            <>
              <button
                type="button"
                onClick={copyPortalLink}
                className="px-3.5 py-2 bg-surface border border-outline-variant text-on-surface font-label-md text-label-md font-semibold rounded-lg hover:bg-surface-container transition-colors flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[18px]">
                  {copiedLink ? 'check' : 'link'}
                </span>
                {copiedLink ? 'Link Copiado!' : 'Copiar Link do Portal'}
              </button>

              <button
                type="button"
                onClick={() => sendToCustomerMutation.mutate()}
                disabled={sendToCustomerMutation.isPending}
                className="px-5 py-2 bg-primary text-on-primary font-label-md text-label-md font-bold rounded-lg hover:bg-primary-container transition-all shadow-sm flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[18px]">send</span>
                Enviar ao Cliente (WhatsApp / E-mail)
              </button>
            </>
          )}

          {/* Workflow Step 4: SENT_TO_CUSTOMER */}
          {quote.status === 'SENT_TO_CUSTOMER' && (
            <>
              <button
                type="button"
                onClick={copyPortalLink}
                className="px-3.5 py-2 bg-surface border border-outline-variant text-on-surface font-label-md text-label-md font-semibold rounded-lg hover:bg-surface-container transition-colors flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[18px]">
                  {copiedLink ? 'check' : 'link'}
                </span>
                {copiedLink ? 'Link Copiado!' : 'Link do Portal'}
              </button>

              <button
                type="button"
                onClick={() => setDecisionModalOpen(true)}
                className="px-5 py-2 bg-secondary text-on-secondary font-label-md text-label-md font-bold rounded-lg hover:opacity-90 transition-all shadow-sm flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[18px]">how_to_reg</span>
                Registrar Decisão do Cliente
              </button>
            </>
          )}

          {/* Workflow Step 5: CUSTOMER_APPROVED -> Convert to Work Order */}
          {quote.status === 'CUSTOMER_APPROVED' && (
            <button
              type="button"
              onClick={() => convertToWorkOrderMutation.mutate()}
              disabled={convertToWorkOrderMutation.isPending}
              className="px-6 py-2.5 bg-primary text-on-primary font-label-md text-label-md font-bold rounded-lg hover:bg-primary-container transition-all shadow-md active:translate-y-px flex items-center gap-2"
            >
              {convertToWorkOrderMutation.isPending ? (
                <span className="material-symbols-outlined animate-spin text-[18px]">
                  progress_activity
                </span>
              ) : (
                <span className="material-symbols-outlined text-[20px]">construction</span>
              )}
              Gerar Ordem de Serviço
            </button>
          )}
        </div>
      </header>

      {/* Editor Grid: Left items table (Span 8), Right financial summary (Span 4) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Line Items (Span 8) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* Client & Vehicle Summary Card */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 shadow-xs grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase font-medium">
                Dados do Cliente
              </span>
              <p className="font-semibold text-on-surface text-body-md mt-0.5">
                {quote.customerName}
              </p>
              {quote.customerDocument && (
                <p className="text-[12px] text-on-surface-variant font-mono">
                  CPF/CNPJ: {quote.customerDocument}
                </p>
              )}
            </div>

            <div>
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase font-medium">
                Veículo Vinculado
              </span>
              <p className="font-semibold text-on-surface text-body-md mt-0.5">
                {quote.vehicleBrand} {quote.vehicleModel} ({quote.vehicleYear || 'N/A'})
              </p>
              <p className="text-[12px] font-mono font-bold text-primary mt-0.5">
                Placa: {formatLicensePlate(quote.licensePlate)}
              </p>
            </div>
          </div>

          {/* Line Items Table Card */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-xs flex flex-col">
            <div className="bg-surface px-4 py-3 border-b border-outline-variant flex items-center justify-between">
              <h2 className="font-label-md text-label-md font-bold text-on-surface uppercase tracking-wider">
                Peças & Serviços ({items.length})
              </h2>

              {isEditable && (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => addItem('PART')}
                    className="px-2.5 py-1 text-primary hover:bg-surface-container rounded-lg font-label-sm text-label-sm font-semibold transition-colors flex items-center gap-1 border border-outline-variant"
                  >
                    <span className="material-symbols-outlined text-[16px]">build</span>
                    + Peça
                  </button>
                  <button
                    type="button"
                    onClick={() => addItem('LABOR')}
                    className="px-2.5 py-1 text-primary hover:bg-surface-container rounded-lg font-label-sm text-label-sm font-semibold transition-colors flex items-center gap-1 border border-outline-variant"
                  >
                    <span className="material-symbols-outlined text-[16px]">handyman</span>
                    + Mão de Obra
                  </button>
                </div>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="bg-surface border-b border-outline-variant font-label-sm text-label-sm text-on-surface-variant uppercase">
                    <th className="py-2.5 px-3 w-12 text-center">Tipo</th>
                    <th className="py-2.5 px-3">Descrição do Item</th>
                    <th className="py-2.5 px-3 w-20 text-right">Qtd</th>
                    <th className="py-2.5 px-3 w-28 text-right">Preço Unit.</th>
                    <th className="py-2.5 px-3 w-24 text-right">Desc. (R$)</th>
                    <th className="py-2.5 px-3 w-28 text-right">Subtotal</th>
                    {isEditable && <th className="py-2.5 px-3 w-10 text-center"></th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant text-body-sm">
                  {items.length === 0 ? (
                    <tr>
                      <td
                        colSpan={isEditable ? 7 : 6}
                        className="py-12 text-center text-on-surface-variant"
                      >
                        <span className="material-symbols-outlined text-[32px] text-outline">
                          receipt_long
                        </span>
                        <p className="mt-1 font-medium">Nenhum item adicionado ao orçamento.</p>
                      </td>
                    </tr>
                  ) : (
                    items.map((item, idx) => {
                      const itemSub = (item.quantity || 0) * (item.unitPrice || 0);
                      const itemDisc = item.discountAmount || 0;
                      const lineTotal = Math.max(0, itemSub - itemDisc) * (1 + (item.taxRate || 0) / 100);

                      return (
                        <tr key={idx} className="hover:bg-surface-bright transition-colors group">
                          {/* Type */}
                          <td className="py-2 px-3 text-center">
                            <span
                              className={`inline-flex p-1 rounded ${
                                item.type === 'PART'
                                  ? 'bg-secondary-container text-on-secondary-container'
                                  : 'bg-primary-container/20 text-primary'
                              }`}
                              title={item.type === 'PART' ? 'Peça / Produto' : 'Mão de Obra'}
                            >
                              <span className="material-symbols-outlined text-[16px]">
                                {item.type === 'PART' ? 'build' : 'handyman'}
                              </span>
                            </span>
                          </td>

                          {/* Description */}
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              disabled={!isEditable}
                              placeholder="Nome da peça ou serviço..."
                              value={item.name}
                              onChange={(e) => updateItemField(idx, 'name', e.target.value)}
                              className="w-full h-8 px-2 bg-surface border border-outline-variant rounded text-body-sm font-medium text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none disabled:bg-transparent disabled:border-transparent"
                            />
                          </td>

                          {/* Quantity */}
                          <td className="py-2 px-3 text-right">
                            <input
                              type="number"
                              step="0.1"
                              min="0.1"
                              disabled={!isEditable}
                              value={item.quantity}
                              onChange={(e) =>
                                updateItemField(idx, 'quantity', parseFloat(e.target.value) || 0)
                              }
                              className="w-full h-8 px-2 text-right bg-surface border border-outline-variant rounded text-body-sm text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none disabled:bg-transparent disabled:border-transparent"
                            />
                          </td>

                          {/* Unit Price */}
                          <td className="py-2 px-3 text-right">
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              disabled={!isEditable}
                              value={item.unitPrice}
                              onChange={(e) =>
                                updateItemField(idx, 'unitPrice', parseFloat(e.target.value) || 0)
                              }
                              className="w-full h-8 px-2 text-right bg-surface border border-outline-variant rounded text-body-sm text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none disabled:bg-transparent disabled:border-transparent"
                            />
                          </td>

                          {/* Discount */}
                          <td className="py-2 px-3 text-right">
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              disabled={!isEditable}
                              value={item.discountAmount}
                              onChange={(e) =>
                                updateItemField(
                                  idx,
                                  'discountAmount',
                                  parseFloat(e.target.value) || 0
                                )
                              }
                              className="w-full h-8 px-2 text-right bg-surface border border-outline-variant rounded text-body-sm text-error focus:border-primary focus:ring-1 focus:ring-primary outline-none disabled:bg-transparent disabled:border-transparent"
                            />
                          </td>

                          {/* Line Subtotal */}
                          <td className="py-2 px-3 text-right font-bold text-on-surface">
                            {lineTotal.toLocaleString('pt-BR', {
                              style: 'currency',
                              currency: 'BRL',
                            })}
                          </td>

                          {/* Delete */}
                          {isEditable && (
                            <td className="py-2 px-3 text-center">
                              <button
                                type="button"
                                onClick={() => removeItem(idx)}
                                className="text-on-surface-variant hover:text-error opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded"
                                title="Remover Item"
                              >
                                <span className="material-symbols-outlined text-[18px]">
                                  delete
                                </span>
                              </button>
                            </td>
                          )}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Financial Summary & Notes (Span 4) */}
        <div className="lg:col-span-4 flex flex-col gap-6 sticky top-4">
          {/* Financial Summary Card */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-xs flex flex-col gap-3">
            <h3 className="font-label-md text-label-md font-bold text-on-surface uppercase tracking-wider pb-2 border-b border-outline-variant">
              Resumo Financeiro
            </h3>

            <div className="flex flex-col gap-2 text-body-sm">
              <div className="flex justify-between items-center text-on-surface-variant">
                <span>Subtotal Bruto</span>
                <span className="font-medium text-on-surface">
                  {subtotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
              </div>

              <div className="flex justify-between items-center text-error">
                <span>Desconto Total</span>
                <span>
                  -
                  {totalDiscount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
              </div>

              <div className="flex justify-between items-center text-on-surface-variant">
                <span>Total Peças</span>
                <span className="font-medium text-on-surface">
                  {totalParts.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
              </div>

              <div className="flex justify-between items-center text-on-surface-variant">
                <span>Total Mão de Obra</span>
                <span className="font-medium text-on-surface">
                  {totalLabor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
              </div>

              {totalTaxes > 0 && (
                <div className="flex justify-between items-center text-on-surface-variant">
                  <span>Impostos Estimados</span>
                  <span className="font-medium text-on-surface">
                    {totalTaxes.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-outline-variant flex justify-between items-end mt-1">
              <div>
                <span className="font-label-sm text-label-sm uppercase font-bold text-on-surface-variant block">
                  Valor Total
                </span>
                <span className="text-[11px] text-on-surface-variant">
                  Cálculo determinístico
                </span>
              </div>
              <span className="font-headline-lg text-headline-lg font-bold text-primary">
                {grandTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </span>
            </div>
          </div>

          {/* Notes & Terms */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-xs flex flex-col">
            <div className="flex border-b border-outline-variant">
              <button
                type="button"
                onClick={() => setActiveNotesTab('CUSTOMER')}
                className={`flex-1 py-2.5 font-label-sm text-label-sm font-bold uppercase transition-colors ${
                  activeNotesTab === 'CUSTOMER'
                    ? 'border-b-2 border-primary text-primary bg-surface'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Observações ao Cliente
              </button>
              <button
                type="button"
                onClick={() => setActiveNotesTab('TERMS')}
                className={`flex-1 py-2.5 font-label-sm text-label-sm font-bold uppercase transition-colors ${
                  activeNotesTab === 'TERMS'
                    ? 'border-b-2 border-primary text-primary bg-surface'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Termos & Condições
              </button>
            </div>

            <div className="p-4">
              {activeNotesTab === 'CUSTOMER' ? (
                <textarea
                  rows={4}
                  disabled={!isEditable}
                  placeholder="Mensagem visível para o cliente no portal online..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-2.5 bg-surface border border-outline-variant rounded-lg text-body-sm text-on-surface resize-none focus:border-primary focus:ring-1 focus:ring-primary outline-none disabled:bg-transparent"
                ></textarea>
              ) : (
                <textarea
                  rows={4}
                  disabled={!isEditable}
                  placeholder="Termos de garantia, validade do orçamento e condições de pagamento..."
                  value={terms}
                  onChange={(e) => setTerms(e.target.value)}
                  className="w-full p-2.5 bg-surface border border-outline-variant rounded-lg text-body-sm text-on-surface resize-none focus:border-primary focus:ring-1 focus:ring-primary outline-none disabled:bg-transparent"
                ></textarea>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Customer Decision Modal */}
      {decisionModalOpen && (
        <CustomerDecisionModal
          quoteId={quoteId}
          onClose={() => setDecisionModalOpen(false)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['operations', 'quote', quoteId] });
            queryClient.invalidateQueries({ queryKey: ['operations', 'quotes'] });
            setDecisionModalOpen(false);
          }}
        />
      )}
    </div>
  );
}

// -------------------------------------------------------------
// Component: NewQuoteForm (For blank new quote creation)
// -------------------------------------------------------------
interface NewQuoteFormProps {
  activeUnitId?: string;
}

function NewQuoteForm({ activeUnitId }: NewQuoteFormProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Search Customers
  const { data: customersData } = useQuery({
    queryKey: ['crm', 'customers', 'search', customerSearch],
    queryFn: () => crmApi.getCustomers({ q: customerSearch || undefined, size: 10 }),
    enabled: Boolean(customerSearch),
  });

  // Selected Customer details
  const { data: selectedCustomer } = useQuery({
    queryKey: ['crm', 'customer', selectedCustomerId],
    queryFn: () => crmApi.getCustomerById(selectedCustomerId),
    enabled: Boolean(selectedCustomerId),
  });

  // Create Quote Mutation
  const createMutation = useMutation({
    mutationFn: () => {
      if (!activeUnitId) throw new Error('Selecione uma filial/unidade ativa.');
      if (!selectedCustomerId) throw new Error('Selecione um cliente.');
      if (!selectedVehicleId) throw new Error('Selecione um veículo.');

      return operationsApi.createQuote({
        unitId: activeUnitId,
        customerId: selectedCustomerId,
        vehicleId: selectedVehicleId,
        notes: notes.trim() || undefined,
        items: [],
      });
    },
    onSuccess: (newQuote) => {
      queryClient.invalidateQueries({ queryKey: ['operations', 'quotes'] });
      navigate({
        to: '/operations/quotes/$id',
        params: { id: newQuote.id },
      });
    },
    onError: (err) => {
      setErrorMsg(getApiErrorMessage(err, 'Erro ao inicializar orçamento.'));
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    createMutation.mutate();
  };

  return (
    <div className="max-w-2xl mx-auto py-6 space-y-6 animate-in fade-in">
      <div>
        <h1 className="font-headline-lg text-headline-lg font-bold text-on-surface">
          Novo Orçamento
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant mt-0.5">
          Selecione o cliente e veículo para abrir a planilha de orçamento de peças e serviços.
        </p>
      </div>

      {errorMsg && (
        <div className="p-3 bg-error-container text-on-error-container rounded-lg text-body-sm font-medium">
          {errorMsg}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-xs space-y-5"
      >
        {/* Customer Autocomplete */}
        <div>
          <label className="block font-label-sm text-label-sm text-on-surface-variant font-medium mb-1">
            Buscar Cliente <span className="text-error">*</span>
          </label>
          <input
            type="text"
            placeholder="Digite nome, CPF ou e-mail..."
            value={customerSearch}
            onChange={(e) => setCustomerSearch(e.target.value)}
            className="w-full h-10 px-3 bg-surface border border-outline-variant rounded-lg text-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none"
          />

          {customersData && customersData.content.length > 0 && !selectedCustomerId && (
            <div className="mt-1.5 max-h-48 overflow-y-auto border border-outline-variant rounded-lg bg-surface divide-y divide-outline-variant shadow-lg">
              {customersData.content.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    setSelectedCustomerId(c.id);
                    setCustomerSearch(c.name);
                  }}
                  className="w-full text-left p-2.5 hover:bg-surface-container text-body-sm flex items-center justify-between"
                >
                  <span className="font-medium text-on-surface">{c.name}</span>
                  <span className="text-xs text-on-surface-variant font-mono">{c.document}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Vehicle Selection */}
        {selectedCustomer && (
          <div>
            <label className="block font-label-sm text-label-sm text-on-surface-variant font-medium mb-1">
              Veículo do Cliente <span className="text-error">*</span>
            </label>
            <select
              value={selectedVehicleId}
              onChange={(e) => setSelectedVehicleId(e.target.value)}
              required
              className="w-full h-10 px-3 bg-surface border border-outline-variant rounded-lg text-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none"
            >
              <option value="">Selecione o veículo</option>
              {(selectedCustomer.vehicles || []).map((v) => (
                <option key={v.id} value={v.id}>
                  {v.brand} {v.model} ({v.year || 'N/A'}) - Placa: {formatLicensePlate(v.licensePlate)}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="block font-label-sm text-label-sm text-on-surface-variant font-medium mb-1">
            Observações Iniciais
          </label>
          <textarea
            rows={3}
            placeholder="Observações do atendimento..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full p-3 bg-surface border border-outline-variant rounded-lg text-body-sm text-on-surface resize-none focus:border-primary focus:ring-1 focus:ring-primary outline-none"
          ></textarea>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-outline-variant">
          <button
            type="button"
            onClick={() => navigate({ to: '/operations/quotes' })}
            className="px-4 py-2 border border-outline-variant rounded-lg font-label-md text-label-md text-on-surface hover:bg-surface-container"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={createMutation.isPending || !selectedCustomerId || !selectedVehicleId}
            className="px-6 py-2 bg-primary text-on-primary rounded-lg font-label-md text-label-md font-bold hover:bg-primary-container transition-all shadow-sm disabled:opacity-50 flex items-center gap-2"
          >
            {createMutation.isPending && (
              <span className="material-symbols-outlined animate-spin text-[16px]">
                progress_activity
              </span>
            )}
            Iniciar Orçamento
          </button>
        </div>
      </form>
    </div>
  );
}

// -------------------------------------------------------------
// Component: CustomerDecisionModal
// -------------------------------------------------------------
interface CustomerDecisionModalProps {
  quoteId: string;
  onClose: () => void;
  onSuccess: () => void;
}

function CustomerDecisionModal({ quoteId, onClose, onSuccess }: CustomerDecisionModalProps) {
  const [approved, setApproved] = useState(true);
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const decisionMutation = useMutation({
    mutationFn: () =>
      operationsApi.processCustomerDecision(quoteId, {
        approved,
        notes: notes.trim() || undefined,
      }),
    onSuccess,
    onError: (err) => {
      setErrorMsg(getApiErrorMessage(err, 'Erro ao registrar decisão do cliente.'));
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    decisionMutation.mutate();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-outline-variant pb-3">
          <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[22px]">how_to_reg</span>
            Decisão do Cliente
          </h3>
          <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 bg-error-container text-on-error-container rounded-lg text-body-sm font-medium">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="block font-label-sm text-label-sm text-on-surface-variant font-medium">
              Resultado da Resposta
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label
                className={`p-3 rounded-lg border cursor-pointer flex items-center gap-2 transition-all ${
                  approved
                    ? 'bg-tertiary/15 border-tertiary text-tertiary font-bold'
                    : 'border-outline-variant text-on-surface'
                }`}
              >
                <input
                  type="radio"
                  name="decision"
                  checked={approved}
                  onChange={() => setApproved(true)}
                  className="text-tertiary focus:ring-tertiary"
                />
                <span>Aprovado</span>
              </label>

              <label
                className={`p-3 rounded-lg border cursor-pointer flex items-center gap-2 transition-all ${
                  !approved
                    ? 'bg-error-container/20 border-error text-error font-bold'
                    : 'border-outline-variant text-on-surface'
                }`}
              >
                <input
                  type="radio"
                  name="decision"
                  checked={!approved}
                  onChange={() => setApproved(false)}
                  className="text-error focus:ring-error"
                />
                <span>Recusado</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block font-label-sm text-label-sm text-on-surface-variant font-medium mb-1">
              Observações / Justificativa
            </label>
            <textarea
              rows={3}
              placeholder={
                approved
                  ? 'Ex: Aprovado via WhatsApp pelo cliente...'
                  : 'Ex: Cliente optou por fazer apenas os freios em outro momento...'
              }
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-2.5 bg-surface border border-outline-variant rounded-lg text-body-sm text-on-surface resize-none focus:border-primary focus:ring-1 focus:ring-primary outline-none"
            ></textarea>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-outline-variant">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-outline-variant rounded-lg font-label-md text-label-md text-on-surface hover:bg-surface-container"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={decisionMutation.isPending}
              className="px-5 py-2 bg-primary text-on-primary rounded-lg font-label-md text-label-md font-bold hover:bg-primary-container transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {decisionMutation.isPending && (
                <span className="material-symbols-outlined animate-spin text-[16px]">
                  progress_activity
                </span>
              )}
              Registrar Decisão
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
