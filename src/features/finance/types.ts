export type AccountType =
  | 'BANK_ACCOUNT'
  | 'CASH_REGISTER'
  | 'DIGITAL_WALLET'
  | 'CREDIT_CARD';

export type ReceivableStatus =
  | 'PENDING'
  | 'RECEIVED'
  | 'PARTIALLY_RECEIVED'
  | 'CANCELLED'
  | 'REVERSED';

export type PayableStatus =
  | 'PENDING'
  | 'PAID'
  | 'PARTIALLY_PAID'
  | 'CANCELLED';

export type TransactionType = 'CREDIT' | 'DEBIT';

export type TransactionStatus = 'COMPLETED' | 'CANCELLED';

export type DreCategoryType =
  | 'GROSS_REVENUE'
  | 'TAXES_AND_DEDUCTIONS'
  | 'VARIABLE_COST'
  | 'OPERATING_EXPENSE'
  | 'FINANCIAL_RESULT'
  | 'NON_OPERATING';

export interface FinanceAccount {
  id: string;
  tenantId: string;
  unitId: string;
  name: string;
  type: AccountType;
  bankName?: string | null;
  accountNumber?: string | null;
  agency?: string | null;
  initialBalance: number;
  currentBalance: number;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string | null;
}

export interface CreateAccountDto {
  unitId: string;
  name: string;
  type: AccountType;
  bankName?: string;
  accountNumber?: string;
  agency?: string;
  initialBalance?: number;
}

export interface UpdateAccountDto {
  name: string;
  bankName?: string;
  accountNumber?: string;
  agency?: string;
  isActive?: boolean;
}

export interface FinanceCategory {
  id: string;
  tenantId: string;
  name: string;
  type: TransactionType;
  dreCategoryType: DreCategoryType;
  isActive: boolean;
  createdAt: string;
}

export interface CreateCategoryDto {
  name: string;
  type: TransactionType;
  dreCategoryType: DreCategoryType;
}

export interface FinanceReceivable {
  id: string;
  tenantId: string;
  unitId: string;
  customerId?: string | null;
  customerName?: string | null;
  workOrderId?: string | null;
  orderNumber?: string | null;
  description: string;
  amount: number;
  paidAmount: number;
  dueDate: string;
  receivedAt?: string | null;
  status: ReceivableStatus;
  paymentMethod?: string | null;
  accountId?: string | null;
  accountName?: string | null;
  categoryId?: string | null;
  categoryName?: string | null;
  sourceCorrelationId?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt?: string | null;
}

export interface CreateReceivableDto {
  unitId: string;
  customerId?: string;
  customerName?: string;
  workOrderId?: string;
  orderNumber?: string;
  description: string;
  amount: number;
  dueDate: string;
  categoryId?: string;
  paymentMethod?: string;
  notes?: string;
}

export interface SettleReceivableDto {
  accountId: string;
  paidAmount: number;
  paymentDate?: string;
  paymentMethod?: string;
  notes?: string;
}

export interface FinancePayable {
  id: string;
  tenantId: string;
  unitId: string;
  supplierName: string;
  inventoryPurchaseId?: string | null;
  description: string;
  amount: number;
  paidAmount: number;
  dueDate: string;
  paidAt?: string | null;
  status: PayableStatus;
  paymentMethod?: string | null;
  accountId?: string | null;
  accountName?: string | null;
  categoryId?: string | null;
  categoryName?: string | null;
  sourceCorrelationId?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt?: string | null;
}

export interface CreatePayableDto {
  unitId: string;
  supplierName: string;
  inventoryPurchaseId?: string;
  description: string;
  amount: number;
  dueDate: string;
  categoryId?: string;
  paymentMethod?: string;
  notes?: string;
}

export interface SettlePayableDto {
  accountId: string;
  paidAmount: number;
  paymentDate?: string;
  paymentMethod?: string;
  notes?: string;
}

export interface FinanceTransaction {
  id: string;
  tenantId: string;
  unitId: string;
  accountId: string;
  accountName?: string | null;
  categoryId?: string | null;
  categoryName?: string | null;
  receivableId?: string | null;
  payableId?: string | null;
  type: TransactionType;
  amount: number;
  transactionDate: string;
  competenceDate: string;
  description: string;
  status: TransactionStatus;
  sourceCorrelationId?: string | null;
  notes?: string | null;
  createdAt: string;
  createdByUserId?: string | null;
}

export interface CreateTransactionDto {
  unitId: string;
  accountId: string;
  categoryId?: string;
  type: TransactionType;
  amount: number;
  transactionDate: string;
  competenceDate?: string;
  description: string;
  notes?: string;
}

export interface CashFlowEntry {
  date: string;
  inflows: number;
  outflows: number;
  netAmount: number;
  accumulatedBalance: number;
}

export interface CashFlowReport {
  startDate: string;
  endDate: string;
  initialBalance: number;
  totalInflows: number;
  totalOutflows: number;
  netCashFlow: number;
  finalBalance: number;
  dailyEntries: CashFlowEntry[];
}

export interface DreLineItem {
  categoryName: string;
  amount: number;
  verticalPercentage?: number | null;
}

export interface DreGroup {
  groupName: string;
  totalAmount: number;
  verticalPercentage?: number | null;
  items: DreLineItem[];
}

export interface DreReport {
  startDate: string;
  endDate: string;
  grossRevenue: number;
  deductionsAndTaxes: number;
  netRevenue: number;
  variableCosts: number;
  grossProfit: number;
  grossMarginPercentage: number;
  operatingExpenses: number;
  operatingProfit: number;
  financialResult: number;
  netProfit: number;
  netMarginPercentage: number;
  groups: DreGroup[];
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}
