import { api } from '@/shared/api/apiClient';
import type {
  AppointmentResponse,
  AppointmentSummaryResponse,
  CreateAppointmentRequest,
  UpdateAppointmentRequest,
  ChangeAppointmentStatusRequest,
  AppointmentStatus,
  InspectionResponse,
  InspectionSummaryResponse,
  CreateInspectionRequest,
  UpdateInspectionRequest,
  SaveInspectionItemRequest,
  CompleteInspectionRequest,
  InspectionStatus,
  QuoteResponse,
  QuoteSummaryResponse,
  CreateQuoteRequest,
  UpdateQuoteRequest,
  SaveQuoteItemRequest,
  CustomerDecisionRequest,
  QuoteStatus,
  WorkOrderResponse,
  WorkOrderSummaryResponse,
  WorkOrderKanbanResponse,
  CreateWorkOrderRequest,
  UpdateWorkOrderRequest,
  SaveWorkOrderItemRequest,
  ChangeWorkOrderStatusRequest,
  CompleteWorkOrderRequest,
  WorkOrderStatus,
  VehicleHistoryResponse,
  PageResponse,
} from '../types';

export interface CalendarSearchParams {
  from: string; // ISO 8601
  to: string;   // ISO 8601
  unitId?: string;
}

export interface AppointmentSearchParams {
  status?: AppointmentStatus;
  unitId?: string;
  page?: number;
  size?: number;
  sort?: string;
}

export interface InspectionSearchParams {
  vehicleId?: string;
  customerId?: string;
  status?: InspectionStatus;
  unitId?: string;
  page?: number;
  size?: number;
}

export interface QuoteSearchParams {
  customerId?: string;
  vehicleId?: string;
  status?: QuoteStatus;
  unitId?: string;
  page?: number;
  size?: number;
}

export interface WorkOrderSearchParams {
  customerId?: string;
  vehicleId?: string;
  mechanicId?: string;
  status?: WorkOrderStatus;
  unitId?: string;
  page?: number;
  size?: number;
}

export const operationsApi = {
  // Appointments
  getCalendarAppointments: async (
    params: CalendarSearchParams
  ): Promise<AppointmentSummaryResponse[]> => {
    const response = await api.get<AppointmentSummaryResponse[]>('/appointments/calendar', {
      params,
    });
    return response.data;
  },

  getAppointments: async (
    params?: AppointmentSearchParams
  ): Promise<PageResponse<AppointmentSummaryResponse>> => {
    const response = await api.get<PageResponse<AppointmentSummaryResponse>>('/appointments', {
      params,
    });
    return response.data;
  },

  getAppointmentById: async (id: string): Promise<AppointmentResponse> => {
    const response = await api.get<AppointmentResponse>(`/appointments/${id}`);
    return response.data;
  },

  createAppointment: async (data: CreateAppointmentRequest): Promise<AppointmentResponse> => {
    const response = await api.post<AppointmentResponse>('/appointments', data);
    return response.data;
  },

  updateAppointment: async (
    id: string,
    data: UpdateAppointmentRequest
  ): Promise<AppointmentResponse> => {
    const response = await api.put<AppointmentResponse>(`/appointments/${id}`, data);
    return response.data;
  },

  changeAppointmentStatus: async (
    id: string,
    data: ChangeAppointmentStatusRequest
  ): Promise<AppointmentResponse> => {
    const response = await api.put<AppointmentResponse>(`/appointments/${id}/status`, data);
    return response.data;
  },

  cancelAppointment: async (id: string, reason?: string): Promise<void> => {
    await api.delete(`/appointments/${id}`, {
      params: reason ? { reason } : undefined,
    });
  },

  // Inspections
  getInspections: async (
    params?: InspectionSearchParams
  ): Promise<PageResponse<InspectionSummaryResponse>> => {
    const response = await api.get<PageResponse<InspectionSummaryResponse>>('/inspections', {
      params,
    });
    return response.data;
  },

  getInspectionById: async (id: string): Promise<InspectionResponse> => {
    const response = await api.get<InspectionResponse>(`/inspections/${id}`);
    return response.data;
  },

  createInspection: async (data: CreateInspectionRequest): Promise<InspectionResponse> => {
    const response = await api.post<InspectionResponse>('/inspections', data);
    return response.data;
  },

  updateInspection: async (
    id: string,
    data: UpdateInspectionRequest
  ): Promise<InspectionResponse> => {
    const response = await api.put<InspectionResponse>(`/inspections/${id}`, data);
    return response.data;
  },

  updateInspectionItems: async (
    id: string,
    items: SaveInspectionItemRequest[]
  ): Promise<InspectionResponse> => {
    const response = await api.put<InspectionResponse>(`/inspections/${id}/items`, items);
    return response.data;
  },

  completeInspection: async (
    id: string,
    data?: CompleteInspectionRequest
  ): Promise<InspectionResponse> => {
    const response = await api.post<InspectionResponse>(`/inspections/${id}/complete`, data || {});
    return response.data;
  },

  cancelInspection: async (id: string): Promise<void> => {
    await api.delete(`/inspections/${id}`);
  },

  // Quotes
  getQuotes: async (
    params?: QuoteSearchParams
  ): Promise<PageResponse<QuoteSummaryResponse>> => {
    const response = await api.get<PageResponse<QuoteSummaryResponse>>('/quotes', {
      params,
    });
    return response.data;
  },

  getQuoteById: async (id: string): Promise<QuoteResponse> => {
    const response = await api.get<QuoteResponse>(`/quotes/${id}`);
    return response.data;
  },

  createQuote: async (data: CreateQuoteRequest): Promise<QuoteResponse> => {
    const response = await api.post<QuoteResponse>('/quotes', data);
    return response.data;
  },

  createQuoteFromInspection: async (inspectionId: string): Promise<QuoteResponse> => {
    const response = await api.post<QuoteResponse>(`/quotes/from-inspection/${inspectionId}`);
    return response.data;
  },

  updateQuote: async (id: string, data: UpdateQuoteRequest): Promise<QuoteResponse> => {
    const response = await api.put<QuoteResponse>(`/quotes/${id}`, data);
    return response.data;
  },

  updateQuoteItems: async (
    id: string,
    items: SaveQuoteItemRequest[]
  ): Promise<QuoteResponse> => {
    const response = await api.put<QuoteResponse>(`/quotes/${id}/items`, items);
    return response.data;
  },

  submitQuoteForApproval: async (id: string): Promise<QuoteResponse> => {
    const response = await api.post<QuoteResponse>(`/quotes/${id}/submit-approval`);
    return response.data;
  },

  approveQuoteInternally: async (id: string): Promise<QuoteResponse> => {
    const response = await api.post<QuoteResponse>(`/quotes/${id}/approve`);
    return response.data;
  },

  sendQuoteToCustomer: async (id: string): Promise<QuoteResponse> => {
    const response = await api.post<QuoteResponse>(`/quotes/${id}/send`);
    return response.data;
  },

  processCustomerDecision: async (
    id: string,
    data: CustomerDecisionRequest
  ): Promise<QuoteResponse> => {
    const response = await api.post<QuoteResponse>(`/quotes/${id}/customer-decision`, data);
    return response.data;
  },

  cancelQuote: async (id: string, reason?: string): Promise<void> => {
    await api.delete(`/quotes/${id}`, {
      params: reason ? { reason } : undefined,
    });
  },

  // Work Orders
  getWorkOrders: async (
    params?: WorkOrderSearchParams
  ): Promise<PageResponse<WorkOrderSummaryResponse>> => {
    const response = await api.get<PageResponse<WorkOrderSummaryResponse>>('/work-orders', {
      params,
    });
    return response.data;
  },

  getWorkOrderKanban: async (unitId?: string): Promise<WorkOrderKanbanResponse> => {
    const response = await api.get<WorkOrderKanbanResponse>('/work-orders/kanban', {
      params: unitId ? { unitId } : undefined,
    });
    return response.data;
  },

  getWorkOrderById: async (id: string): Promise<WorkOrderResponse> => {
    const response = await api.get<WorkOrderResponse>(`/work-orders/${id}`);
    return response.data;
  },

  createWorkOrder: async (data: CreateWorkOrderRequest): Promise<WorkOrderResponse> => {
    const response = await api.post<WorkOrderResponse>('/work-orders', data);
    return response.data;
  },

  createWorkOrderFromQuote: async (
    quoteId: string,
    unitId?: string
  ): Promise<WorkOrderResponse> => {
    const response = await api.post<WorkOrderResponse>(
      `/work-orders/from-quote/${quoteId}`,
      null,
      {
        params: unitId ? { unitId } : undefined,
      }
    );
    return response.data;
  },

  updateWorkOrder: async (
    id: string,
    data: UpdateWorkOrderRequest
  ): Promise<WorkOrderResponse> => {
    const response = await api.put<WorkOrderResponse>(`/work-orders/${id}`, data);
    return response.data;
  },

  updateWorkOrderItems: async (
    id: string,
    items: SaveWorkOrderItemRequest[]
  ): Promise<WorkOrderResponse> => {
    const response = await api.put<WorkOrderResponse>(`/work-orders/${id}/items`, items);
    return response.data;
  },

  changeWorkOrderStatus: async (
    id: string,
    data: ChangeWorkOrderStatusRequest
  ): Promise<WorkOrderResponse> => {
    const response = await api.put<WorkOrderResponse>(`/work-orders/${id}/status`, data);
    return response.data;
  },

  completeWorkOrder: async (
    id: string,
    data?: CompleteWorkOrderRequest
  ): Promise<WorkOrderResponse> => {
    const response = await api.post<WorkOrderResponse>(`/work-orders/${id}/complete`, data || {});
    return response.data;
  },

  cancelWorkOrder: async (id: string, reason?: string): Promise<void> => {
    await api.delete(`/work-orders/${id}`, {
      params: reason ? { reason } : undefined,
    });
  },

  // Vehicle Service History
  getVehicleHistory: async (vehicleId: string): Promise<VehicleHistoryResponse> => {
    const response = await api.get<VehicleHistoryResponse>(
      `/operations/vehicles/${vehicleId}/history`
    );
    return response.data;
  },
};
