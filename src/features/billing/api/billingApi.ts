import { api } from '@/shared/api/apiClient';
import type {
  BillingPlan,
  Subscription,
  Payment,
  CreateCheckoutDto,
  CheckoutSessionResponse,
  ChangePlanDto,
  PageResponse,
} from '../types';

export const billingApi = {
  // Plan Catalog
  getPlans: () =>
    api.get<BillingPlan[]>('/billing/plans'),

  // Tenant Subscription
  getSubscription: () =>
    api.get<Subscription>('/billing/subscription'),

  changePlan: (data: ChangePlanDto) =>
    api.post<Subscription>('/billing/subscription/change-plan', data),

  // Hosted Checkout Pagar.me V5
  createCheckout: (data: CreateCheckoutDto) =>
    api.post<CheckoutSessionResponse>('/billing/payments/checkout', data),

  createCheckoutSession: (data: CreateCheckoutDto) =>
    api.post<CheckoutSessionResponse>('/billing/payments/checkout', data),

  // Payments / Invoice history
  getPayments: (page = 0, size = 20) =>
    api.get<PageResponse<Payment>>('/billing/payments', {
      params: { page, size },
    }),

  getPayment: (id: string) =>
    api.get<Payment>(`/billing/payments/${id}`),
};
