import { api } from '@/shared/api/apiClient';
import type {
  BillingPlan,
  Subscription,
  Payment,
  InitiatePaymentDto,
  ChangePlanDto,
  PageResponse,
} from '../types';

export const billingApi = {
  // Plan Catalog
  getPlans: () =>
    api.get<BillingPlan[]>('/api/v1/billing/plans'),

  // Tenant Subscription
  getSubscription: () =>
    api.get<Subscription>('/api/v1/billing/subscription'),

  changePlan: (data: ChangePlanDto) =>
    api.post<Subscription>('/api/v1/billing/subscription/change-plan', data),

  // Payments / Checkout
  checkout: (data: InitiatePaymentDto) =>
    api.post<Payment>('/api/v1/billing/payments/checkout', data),

  getPayments: (page = 0, size = 20) =>
    api.get<PageResponse<Payment>>('/api/v1/billing/payments', {
      params: { page, size },
    }),

  getPayment: (id: string) =>
    api.get<Payment>(`/api/v1/billing/payments/${id}`),
};
