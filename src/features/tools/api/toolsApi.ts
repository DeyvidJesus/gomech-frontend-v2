import { api } from '@/shared/api/apiClient';
import type {
  Tool,
  CreateToolDto,
  UpdateToolDto,
  ToolCategory,
  CreateCategoryDto,
  ToolCustodyLog,
  CheckOutDto,
  CheckInDto,
  AssignDto,
  ToolUsage,
  RecordUsageDto,
  ToolTransfer,
  CreateToolTransferDto,
  ToolMaintenance,
  ScheduleMaintenanceDto,
  CompleteMaintenanceDto,
  PageResponse,
  ToolStatus,
  ToolTransferStatus,
  MaintenanceStatus,
} from '../types';

export interface ToolFilterParams {
  unitId?: string;
  status?: ToolStatus;
  categoryId?: string;
  search?: string;
  page?: number;
  size?: number;
}

export const toolsApi = {
  // Tools
  getTools: (params?: ToolFilterParams) =>
    api.get<PageResponse<Tool>>('/api/v1/tools', { params }),

  getTool: (id: string) =>
    api.get<Tool>(`/api/v1/tools/${id}`),

  getAvailableTools: (unitId: string) =>
    api.get<Tool[]>('/api/v1/tools/available', { params: { unitId } }),

  createTool: (data: CreateToolDto) =>
    api.post<Tool>('/api/v1/tools', data),

  updateTool: (id: string, data: UpdateToolDto) =>
    api.put<Tool>(`/api/v1/tools/${id}`, data),

  deleteTool: (id: string) =>
    api.delete(`/api/v1/tools/${id}`),

  // Categories
  getCategories: () =>
    api.get<ToolCategory[]>('/api/v1/tools/categories'),

  getCategory: (id: string) =>
    api.get<ToolCategory>(`/api/v1/tools/categories/${id}`),

  createCategory: (data: CreateCategoryDto) =>
    api.post<ToolCategory>('/api/v1/tools/categories', data),

  updateCategory: (id: string, data: CreateCategoryDto) =>
    api.put<ToolCategory>(`/api/v1/tools/categories/${id}`, data),

  deleteCategory: (id: string) =>
    api.delete(`/api/v1/tools/categories/${id}`),

  // Custody
  checkOut: (data: CheckOutDto) =>
    api.post<ToolCustodyLog>('/api/v1/tools/custody/check-out', data),

  checkIn: (data: CheckInDto) =>
    api.post<ToolCustodyLog>('/api/v1/tools/custody/check-in', data),

  assign: (data: AssignDto) =>
    api.post<ToolCustodyLog>('/api/v1/tools/custody/assign', data),

  getToolCustodyHistory: (toolId: string) =>
    api.get<ToolCustodyLog[]>(`/api/v1/tools/custody/history/${toolId}`),

  getAllCustodyLogs: (toolId?: string, page = 0, size = 20) =>
    api.get<PageResponse<ToolCustodyLog>>('/api/v1/tools/custody/logs', {
      params: { toolId, page, size },
    }),

  // Usages
  recordUsage: (data: RecordUsageDto) =>
    api.post<ToolUsage>('/api/v1/tools/usages', data),

  finishUsage: (id: string, notes?: string) =>
    api.post<ToolUsage>(`/api/v1/tools/usages/${id}/finish`, null, {
      params: { notes },
    }),

  getUsagesByTool: (toolId: string) =>
    api.get<ToolUsage[]>(`/api/v1/tools/usages/tool/${toolId}`),

  getUsagesByWorkOrder: (workOrderId: string) =>
    api.get<ToolUsage[]>(`/api/v1/tools/usages/work-order/${workOrderId}`),

  // Transfers
  createTransfer: (data: CreateToolTransferDto) =>
    api.post<ToolTransfer>('/api/v1/tools/transfers', data),

  completeTransfer: (id: string) =>
    api.post<ToolTransfer>(`/api/v1/tools/transfers/${id}/complete`),

  cancelTransfer: (id: string, reason?: string) =>
    api.post<ToolTransfer>(`/api/v1/tools/transfers/${id}/cancel`, null, {
      params: { reason },
    }),

  getTransfers: (unitId?: string, status?: ToolTransferStatus, page = 0, size = 20) =>
    api.get<PageResponse<ToolTransfer>>('/api/v1/tools/transfers', {
      params: { unitId, status, page, size },
    }),

  // Maintenances
  scheduleMaintenance: (data: ScheduleMaintenanceDto) =>
    api.post<ToolMaintenance>('/api/v1/tools/maintenances/schedule', data),

  completeMaintenance: (id: string, data: CompleteMaintenanceDto) =>
    api.post<ToolMaintenance>(`/api/v1/tools/maintenances/${id}/complete`, data),

  getMaintenances: (unitId?: string, status?: MaintenanceStatus, toolId?: string, page = 0, size = 20) =>
    api.get<PageResponse<ToolMaintenance>>('/api/v1/tools/maintenances', {
      params: { unitId, status, toolId, page, size },
    }),

  getMaintenancesByTool: (toolId: string) =>
    api.get<ToolMaintenance[]>(`/api/v1/tools/maintenances/tool/${toolId}`),
};
