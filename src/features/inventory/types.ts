export type UnitOfMeasure = 'UN' | 'L' | 'ML' | 'KG' | 'G' | 'M' | 'CM' | 'CX' | 'PAR' | 'JOGO';

export type MovementType = 'IN' | 'OUT';

export type MovementReason =
  | 'PURCHASE_ENTRY'
  | 'WORK_ORDER_CONSUMPTION'
  | 'TRANSFER_OUT'
  | 'TRANSFER_IN'
  | 'ADJUSTMENT_INCREASE'
  | 'ADJUSTMENT_DECREASE'
  | 'INITIAL_BALANCE'
  | 'RETURN_ENTRY';

export type ReservationStatus = 'CREATED' | 'RELEASED' | 'CONSUMED' | 'CANCELLED';

export type TransferStatus = 'PENDING' | 'IN_TRANSIT' | 'COMPLETED' | 'CANCELLED';

export interface Product {
  id: string;
  tenantId: string;
  unitId?: string | null;
  supplierId?: string | null;
  skuCode: string;
  name: string;
  category?: string | null;
  barcode?: string | null;
  brand?: string | null;
  unitOfMeasure: UnitOfMeasure;
  costPrice: number;
  sellingPrice: number;
  minStock: number;
  currentStockCalculated: number;
  locationInWarehouse?: string | null;
  active: boolean;
  version: number;
  createdAt: string;
  updatedAt?: string | null;
}

export interface CreateProductDto {
  unitId?: string | null;
  supplierId?: string | null;
  skuCode: string;
  name: string;
  category?: string;
  barcode?: string;
  brand?: string;
  unitOfMeasure: UnitOfMeasure;
  costPrice: number;
  sellingPrice: number;
  minStock: number;
  locationInWarehouse?: string;
  initialStockQuantity?: number;
  initialStockUnitId?: string;
}

export interface UpdateProductDto {
  unitId?: string | null;
  supplierId?: string | null;
  skuCode: string;
  name: string;
  category?: string;
  barcode?: string;
  brand?: string;
  unitOfMeasure: UnitOfMeasure;
  costPrice: number;
  sellingPrice: number;
  minStock: number;
  locationInWarehouse?: string;
  active?: boolean;
}

export interface UnitStock {
  id: string;
  tenantId: string;
  unitId: string;
  productId: string;
  productSku: string;
  productName: string;
  quantityOnHand: number;
  quantityReserved: number;
  availableStock: number;
  minStock: number;
  maxStock?: number | null;
  shelfLocation?: string | null;
  updatedAt?: string;
}

export interface AdjustStockDto {
  unitId: string;
  productId: string;
  newQuantityOnHand: number;
  reason: MovementReason;
  notes?: string;
}

export interface LowStockProduct {
  productId: string;
  skuCode: string;
  productName: string;
  unitId: string;
  currentQuantityOnHand: number;
  quantityReserved: number;
  availableStock: number;
  minStockThreshold: number;
  deficit: number;
}

export interface StockReservation {
  id: string;
  tenantId: string;
  unitId: string;
  productId: string;
  productSku: string;
  productName: string;
  workOrderId?: string | null;
  workOrderItemId?: string | null;
  quantity: number;
  status: ReservationStatus;
  expiresAt?: string | null;
  releasedAt?: string | null;
  consumedAt?: string | null;
  createdByUserId?: string | null;
  notes?: string | null;
  createdAt: string;
}

export interface CreateReservationDto {
  unitId: string;
  productId: string;
  workOrderId?: string;
  workOrderItemId?: string;
  quantity: number;
  expiresAt?: string;
  notes?: string;
}

export interface TransferItem {
  id: string;
  productId: string;
  productSku: string;
  productName: string;
  quantity: number;
  notes?: string | null;
}

export interface StockTransfer {
  id: string;
  tenantId: string;
  transferNumber: string;
  sourceUnitId: string;
  destinationUnitId: string;
  status: TransferStatus;
  notes?: string | null;
  requestedByUserId?: string | null;
  receivedByUserId?: string | null;
  completedAt?: string | null;
  canceledAt?: string | null;
  cancellationReason?: string | null;
  items: TransferItem[];
  createdAt: string;
}

export interface CreateTransferDto {
  sourceUnitId: string;
  destinationUnitId: string;
  notes?: string;
  items: {
    productId: string;
    quantity: number;
    notes?: string;
  }[];
}

export interface InventoryMovement {
  id: string;
  tenantId: string;
  unitId: string;
  productId: string;
  productSku: string;
  productName: string;
  userId: string;
  type: MovementType;
  quantity: number;
  reason: MovementReason;
  referenceId?: string | null;
  unitCostPrice?: number | null;
  unitSellingPrice?: number | null;
  totalCostPrice?: number | null;
  batchNumber?: string | null;
  notes?: string | null;
  idempotencyKey?: string | null;
  createdAt: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}
