import { api } from '@/shared/api/apiClient';
import type {
  Customer,
  CustomerSummary,
  CreateCustomerRequest,
  UpdateCustomerRequest,
  Vehicle,
  VehicleSummary,
  CreateVehicleRequest,
  UpdateVehicleRequest,
  PageResponse,
} from '../types';

export interface CustomerSearchParams {
  q?: string;
  name?: string;
  document?: string;
  phone?: string;
  email?: string;
  page?: number;
  size?: number;
  sort?: string;
}

export interface VehicleSearchParams {
  q?: string;
  licensePlate?: string;
  brand?: string;
  model?: string;
  customerId?: string;
  page?: number;
  size?: number;
  sort?: string;
}

export const crmApi = {
  // Customer Endpoints
  getCustomers: async (params?: CustomerSearchParams): Promise<PageResponse<CustomerSummary>> => {
    const response = await api.get<PageResponse<CustomerSummary>>('/customers', { params });
    return response.data;
  },

  getCustomerById: async (id: string): Promise<Customer> => {
    const response = await api.get<Customer>(`/customers/${id}`);
    return response.data;
  },

  createCustomer: async (data: CreateCustomerRequest): Promise<Customer> => {
    const response = await api.post<Customer>('/customers', data);
    return response.data;
  },

  updateCustomer: async (id: string, data: UpdateCustomerRequest): Promise<Customer> => {
    const response = await api.put<Customer>(`/customers/${id}`, data);
    return response.data;
  },

  deleteCustomer: async (id: string): Promise<void> => {
    await api.delete(`/customers/${id}`);
  },

  // Vehicle Endpoints
  getVehicles: async (params?: VehicleSearchParams): Promise<PageResponse<VehicleSummary>> => {
    const response = await api.get<PageResponse<VehicleSummary>>('/vehicles', { params });
    return response.data;
  },

  getVehicleById: async (id: string): Promise<Vehicle> => {
    const response = await api.get<Vehicle>(`/vehicles/${id}`);
    return response.data;
  },

  createVehicle: async (data: CreateVehicleRequest): Promise<Vehicle> => {
    const response = await api.post<Vehicle>('/vehicles', data);
    return response.data;
  },

  updateVehicle: async (id: string, data: UpdateVehicleRequest): Promise<Vehicle> => {
    const response = await api.put<Vehicle>(`/vehicles/${id}`, data);
    return response.data;
  },

  deleteVehicle: async (id: string): Promise<void> => {
    await api.delete(`/vehicles/${id}`);
  },
};
