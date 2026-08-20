import { api } from '@/shared/api/apiClient';
import type {
  Product,
  CreateProductDto,
  UpdateProductDto,
  UnitStock,
  AdjustStockDto,
  LowStockProduct,
  StockReservation,
  CreateReservationDto,
  StockTransfer,
  CreateTransferDto,
  InventoryMovement,
  PageResponse,
  MovementType,
  MovementReason,
} from '../types';

export interface ProductFilterParams {
  search?: string;
  category?: string;
  active?: boolean;
  page?: number;
  size?: number;
}

export interface MovementFilterParams {
  unitId?: string;
  productId?: string;
  type?: MovementType;
  reason?: MovementReason;
  page?: number;
  size?: number;
}

export const inventoryApi = {
  // Products
  getProducts: (params?: ProductFilterParams) =>
    api.get<PageResponse<Product>>('/api/v1/inventory/products', { params }),

  getProduct: (id: string) =>
    api.get<Product>(`/api/v1/inventory/products/${id}`),

  createProduct: (data: CreateProductDto) =>
    api.post<Product>('/api/v1/inventory/products', data),

  updateProduct: (id: string, data: UpdateProductDto) =>
    api.put<Product>(`/api/v1/inventory/products/${id}`, data),

  deleteProduct: (id: string) =>
    api.delete(`/api/v1/inventory/products/${id}`),

  // Stocks
  getStocks: (unitId: string) =>
    api.get<UnitStock[]>('/api/v1/inventory/stocks', { params: { unitId } }),

  getProductStock: (productId: string, unitId: string) =>
    api.get<UnitStock>(`/api/v1/inventory/stocks/${productId}`, { params: { unitId } }),

  adjustStock: (data: AdjustStockDto) =>
    api.post<UnitStock>('/api/v1/inventory/stocks/adjust', data),

  getLowStockAlerts: (unitId: string) =>
    api.get<LowStockProduct[]>('/api/v1/inventory/stocks/low-stock', { params: { unitId } }),

  // Reservations
  createReservation: (data: CreateReservationDto) =>
    api.post<StockReservation>('/api/v1/inventory/reservations', data),

  releaseReservation: (id: string) =>
    api.delete(`/api/v1/inventory/reservations/${id}`),

  getWorkOrderReservations: (workOrderId: string) =>
    api.get<StockReservation[]>(`/api/v1/inventory/reservations/work-orders/${workOrderId}`),

  getActiveReservations: (unitId: string) =>
    api.get<StockReservation[]>('/api/v1/inventory/reservations', { params: { unitId } }),

  // Transfers
  createTransfer: (data: CreateTransferDto) =>
    api.post<StockTransfer>('/api/v1/inventory/transfers', data),

  completeTransfer: (id: string) =>
    api.post<StockTransfer>(`/api/v1/inventory/transfers/${id}/complete`),

  cancelTransfer: (id: string, reason?: string) =>
    api.post<StockTransfer>(`/api/v1/inventory/transfers/${id}/cancel`, null, {
      params: { reason },
    }),

  getTransfer: (id: string) =>
    api.get<StockTransfer>(`/api/v1/inventory/transfers/${id}`),

  getTransfers: (unitId?: string, page = 0, size = 20) =>
    api.get<PageResponse<StockTransfer>>('/api/v1/inventory/transfers', {
      params: { unitId, page, size },
    }),

  // Movements (Append-only Ledger)
  getMovements: (params?: MovementFilterParams) =>
    api.get<PageResponse<InventoryMovement>>('/api/v1/inventory/movements', { params }),
};
