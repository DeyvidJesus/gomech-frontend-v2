export type KpiCategory = 'OPERATIONS' | 'FINANCE' | 'INVENTORY' | 'TOOLS' | 'BILLING';
export type AggregationInterval = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
export type ReportType =
  | 'OPERATIONAL_SUMMARY'
  | 'FINANCIAL_PERFORMANCE'
  | 'INVENTORY_FLOW'
  | 'TOOL_EFFICIENCY'
  | 'BILLING_USAGE'
  | 'EXECUTIVE_OVERVIEW';
export type ExportFormat = 'CSV' | 'JSON';

export interface KpiHeroCard {
  code: string;
  title: string;
  value: number;
  formattedValue: string;
  unit: string;
  previousPeriodValue: number;
  percentChange: number;
  trendDirection: 'UP' | 'DOWN' | 'NEUTRAL';
  category: KpiCategory;
  helpText: string;
}

export interface TimeSeriesPoint {
  date: string;
  label: string;
  revenue: number;
  partsRevenue: number;
  servicesRevenue: number;
  workOrdersCount: number;
  quotesCount: number;
  expenses: number;
  netProfit: number;
}

export interface BreakdownItem {
  key: string;
  label: string;
  count: number;
  value: number;
  percentage: number;
  colorHex: string;
}

export interface TechnicianPerformance {
  mechanicUserId: string;
  mechanicName: string;
  completedOrdersCount: number;
  totalRevenue: number;
  avgTurnaroundHours: number;
}

export interface OperationalSummary {
  totalWorkOrders: number;
  completedWorkOrders: number;
  inProgressWorkOrders: number;
  canceledWorkOrders: number;
  totalRevenue: number;
  avgTicket: number;
  avgTurnaroundHours: number;
  totalQuotes: number;
  approvedQuotes: number;
  quoteConversionRate: number;
  scheduledAppointments: number;
  completedInspections: number;
}

export interface FinancialSummary {
  grossRevenue: number;
  netRevenue: number;
  receivablesTotal: number;
  receivablesPaid: number;
  receivablesPending: number;
  receivablesOverdue: number;
  payablesTotal: number;
  payablesPaid: number;
  payablesPending: number;
  netProfit: number;
  operatingMargin: number;
  delinquencyRate: number;
}

export interface InventorySummary {
  totalPurchaseSpend: number;
  totalStockConsumed: number;
  totalMovementsCount: number;
  lowStockItemsCount: number;
  topConsumedParts: BreakdownItem[];
}

export interface ToolsSummary {
  totalToolsCount: number;
  activeCustodiesCount: number;
  toolsInMaintenanceCount: number;
  totalMaintenanceCost: number;
  totalDowntimeHours: number;
  utilizationRate: number;
}

export interface BillingSummary {
  subscriptionStatus: string;
  planCode: string;
  reportsQuotaUsed: number;
  reportsQuotaLimit: number;
  aiQuotaUsed: number;
  aiQuotaLimit: number;
}

export interface DashboardSummaryResponse {
  tenantId: string;
  unitId?: string;
  startDate: string;
  endDate: string;
  heroKpis: KpiHeroCard[];
  operational: OperationalSummary;
  financial: FinancialSummary;
  inventory: InventorySummary;
  tools: ToolsSummary;
  billing: BillingSummary;
  revenueTimeSeries: TimeSeriesPoint[];
  serviceVsPartsBreakdown: BreakdownItem[];
  topTechnicians: TechnicianPerformance[];
  refreshedAt: string;
}

export interface ReportQueryRequest {
  reportType?: ReportType;
  startDate?: string;
  endDate?: string;
  unitId?: string;
  interval?: AggregationInterval;
  search?: string;
  page?: number;
  size?: number;
}

export interface ReportDataRow {
  id: string;
  date: string;
  dimension: string;
  referenceCode: string;
  category: string;
  description: string;
  status: string;
  quantity: number;
  primaryAmount: number;
  secondaryAmount: number;
  extraAttributes?: Record<string, unknown>;
}

export interface ReportResponse {
  reportType: ReportType;
  tenantId: string;
  unitId?: string;
  startDate: string;
  endDate: string;
  summaryMetrics: Record<string, number | string>;
  columnHeaders: string[];
  rows: ReportDataRow[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  generatedAt: string;
}

export interface ExportRequest {
  reportType: ReportType;
  format: ExportFormat;
  startDate?: string;
  endDate?: string;
  unitId?: string;
  interval?: AggregationInterval;
}

export interface KpiDefinitionDto {
  code: string;
  name: string;
  description: string;
  category: KpiCategory;
  formula: string;
  unit: string;
  dimensions: string[];
  refreshPolicy: string;
}
