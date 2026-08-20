export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  sort: string;
}

export interface CustomerSummary {
  id: string;
  name: string;
  document?: string;
  formattedDocument?: string;
  phone?: string;
  email?: string;
  vehicleCount: number;
  createdAt: string;
}

export interface Customer {
  id: string;
  tenantId: string;
  name: string;
  document?: string;
  formattedDocument?: string;
  phone?: string;
  email?: string;
  address?: string;
  vehicles?: VehicleSummary[];
  createdAt: string;
  updatedAt?: string;
}

export interface CreateCustomerRequest {
  name: string;
  document?: string;
  phone?: string;
  email?: string;
  address?: string;
}

export interface UpdateCustomerRequest {
  name?: string;
  document?: string;
  phone?: string;
  email?: string;
  address?: string;
}

export interface VehicleSummary {
  id: string;
  customerId: string;
  customerName?: string;
  licensePlate: string;
  formattedLicensePlate: string;
  brand?: string;
  model?: string;
  year?: number;
  currentMileage?: number;
  createdAt: string;
}

export interface Vehicle {
  id: string;
  tenantId: string;
  customerId: string;
  customerName?: string;
  licensePlate: string;
  formattedLicensePlate: string;
  brand?: string;
  model?: string;
  year?: number;
  vin?: string;
  currentMileage?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateVehicleRequest {
  customerId: string;
  licensePlate: string;
  brand?: string;
  model?: string;
  year?: number;
  vin?: string;
  currentMileage?: number;
}

export interface UpdateVehicleRequest {
  customerId?: string;
  licensePlate?: string;
  brand?: string;
  model?: string;
  year?: number;
  vin?: string;
  currentMileage?: number;
}
