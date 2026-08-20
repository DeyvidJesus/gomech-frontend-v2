import { api } from '@/shared/api/apiClient';
import type {
  FinanceAccount,
  CreateAccountDto,
  UpdateAccountDto,
  FinanceCategory,
  CreateCategoryDto,
  FinanceReceivable,
  CreateReceivableDto,
  SettleReceivableDto,
  FinancePayable,
  CreatePayableDto,
  SettlePayableDto,
  FinanceTransaction,
  CreateTransactionDto,
  CashFlowReport,
  DreReport,
  PageResponse,
  ReceivableStatus,
  PayableStatus,
  TransactionType,
} from '../types';

export interface FinanceFilterParams {
  unitId?: string;
  status?: ReceivableStatus | PayableStatus;
  page?: number;
  size?: number;
}

export const financeApi = {
  // Accounts
  getAccounts: (unitId?: string) =>
    api.get<FinanceAccount[]>('/api/v1/finance/accounts', { params: { unitId } }),

  getAccount: (id: string) =>
    api.get<FinanceAccount>(`/api/v1/finance/accounts/${id}`),

  createAccount: (data: CreateAccountDto) =>
    api.post<FinanceAccount>('/api/v1/finance/accounts', data),

  updateAccount: (id: string, data: UpdateAccountDto) =>
    api.put<FinanceAccount>(`/api/v1/finance/accounts/${id}`, data),

  // Categories
  getCategories: (type?: TransactionType) =>
    api.get<FinanceCategory[]>('/api/v1/finance/categories', { params: { type } }),

  createCategory: (data: CreateCategoryDto) =>
    api.post<FinanceCategory>('/api/v1/finance/categories', data),

  // Receivables
  getReceivables: (params?: FinanceFilterParams) =>
    api.get<PageResponse<FinanceReceivable>>('/api/v1/finance/receivables', { params }),

  getReceivable: (id: string) =>
    api.get<FinanceReceivable>(`/api/v1/finance/receivables/${id}`),

  createReceivable: (data: CreateReceivableDto) =>
    api.post<FinanceReceivable>('/api/v1/finance/receivables', data),

  settleReceivable: (id: string, data: SettleReceivableDto) =>
    api.post<FinanceReceivable>(`/api/v1/finance/receivables/${id}/settle`, data),

  cancelReceivable: (id: string, reason?: string) =>
    api.post<FinanceReceivable>(`/api/v1/finance/receivables/${id}/cancel`, null, {
      params: { reason },
    }),

  // Payables
  getPayables: (params?: FinanceFilterParams) =>
    api.get<PageResponse<FinancePayable>>('/api/v1/finance/payables', { params }),

  getPayable: (id: string) =>
    api.get<FinancePayable>(`/api/v1/finance/payables/${id}`),

  createPayable: (data: CreatePayableDto) =>
    api.post<FinancePayable>('/api/v1/finance/payables', data),

  settlePayable: (id: string, data: SettlePayableDto) =>
    api.post<FinancePayable>(`/api/v1/finance/payables/${id}/settle`, data),

  cancelPayable: (id: string, reason?: string) =>
    api.post<FinancePayable>(`/api/v1/finance/payables/${id}/cancel`, null, {
      params: { reason },
    }),

  // Transactions / Statement
  getTransactions: (unitId?: string, accountId?: string, page = 0, size = 20) =>
    api.get<PageResponse<FinanceTransaction>>('/api/v1/finance/transactions', {
      params: { unitId, accountId, page, size },
    }),

  createTransaction: (data: CreateTransactionDto) =>
    api.post<FinanceTransaction>('/api/v1/finance/transactions', data),

  // Reports
  getCashFlow: (startDate?: string, endDate?: string) =>
    api.get<CashFlowReport>('/api/v1/finance/cash-flow', {
      params: { startDate, endDate },
    }),

  getDre: (startDate?: string, endDate?: string) =>
    api.get<DreReport>('/api/v1/finance/dre', {
      params: { startDate, endDate },
    }),
};
