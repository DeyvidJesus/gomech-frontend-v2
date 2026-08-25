export type PlanCode = 'TRIAL' | 'STARTER' | 'PRO' | 'ENTERPRISE';

export type SubscriptionStatus =
  | 'TRIALING'
  | 'ACTIVE'
  | 'PAST_DUE'
  | 'CANCELED'
  | 'INCOMPLETE';

export type PaymentMethod = 'PIX' | 'CREDIT_CARD' | 'BOLETO';

export type PaymentStatus =
  | 'PENDING'
  | 'PAID'
  | 'FAILED'
  | 'CANCELED'
  | 'REFUNDED'
  | 'PARTIALLY_REFUNDED';

export interface PlanFeature {
  featureCode: string;
  limitValue: number;
  enabled: boolean;
  unitOfMeasure?: string | null;
}

export interface BillingPlan {
  id: string;
  code: PlanCode;
  name: string;
  description?: string | null;
  price: number;
  billingInterval: 'MONTHLY' | 'YEARLY';
  isActive: boolean;
  features: PlanFeature[];
}

export interface Subscription {
  id: string;
  tenantId: string;
  planCode: string;
  planName: string;
  status: SubscriptionStatus;
  nextBillingDate?: string | null;
  currentPeriodStart?: string | null;
  currentPeriodEnd?: string | null;
  trialEndsAt?: string | null;
  cancelAtPeriodEnd: boolean;
  paymentMethod?: string | null;
  cardLastFour?: string | null;
  cardBrand?: string | null;
  delinquentSince?: string | null;
  features: PlanFeature[];
}

export interface Payment {
  id: string;
  tenantId: string;
  subscriptionId?: string | null;
  amount: number;
  status: PaymentStatus;
  paymentMethod: PaymentMethod;
  dueDate?: string | null;
  paidAt?: string | null;
  gatewayOrderId?: string | null;
  gatewayChargeId?: string | null;
  gatewayPaymentId?: string | null;
  gatewayPaymentLinkId?: string | null;
  pixQrCode?: string | null;
  pixQrCodeUrl?: string | null;
  pixCopyPaste?: string | null;
  pixExpiresAt?: string | null;
  boletoBarcode?: string | null;
  boletoUrl?: string | null;
  boletoDueDate?: string | null;
  installments?: number | null;
  cardLastFour?: string | null;
  cardBrand?: string | null;
  createdAt: string;
}

export interface CreateCheckoutDto {
  planCode: string;
  successUrl?: string;
  cancelUrl?: string;
}

export interface CheckoutSessionResponse {
  checkoutUrl: string;
  planCode: string;
  price: number;
  paymentLinkId?: string;
  paymentId?: string;
}

export interface ChangePlanDto {
  planCode: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}
