import { api } from '@/shared/api/apiClient';
import type {
  DashboardSummaryResponse,
  ExportRequest,
  KpiDefinitionDto,
  ReportQueryRequest,
  ReportResponse,
} from '../types/analytics';

export const analyticsApi = {
  getDashboard: (params?: { unitId?: string; startDate?: string; endDate?: string }) =>
    api.get<DashboardSummaryResponse>('/api/v1/analytics/dashboard', { params }),

  getReport: (params: ReportQueryRequest) =>
    api.get<ReportResponse>('/api/v1/analytics/reports', { params }),

  exportReport: async (payload: ExportRequest): Promise<Blob> => {
    const response = await api.post('/api/v1/analytics/reports/export', payload, {
      responseType: 'blob',
    });
    return response.data;
  },

  getKpiCatalog: () =>
    api.get<KpiDefinitionDto[]>('/api/v1/analytics/kpis'),
};
