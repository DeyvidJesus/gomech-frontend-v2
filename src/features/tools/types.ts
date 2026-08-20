export type ToolStatus =
  | 'AVAILABLE'
  | 'IN_USE'
  | 'IN_MAINTENANCE'
  | 'IN_TRANSIT'
  | 'DECOMMISSIONED'
  | 'LOST';

export type CustodyEventType =
  | 'CHECK_OUT'
  | 'CHECK_IN'
  | 'ASSIGN'
  | 'TRANSFER'
  | 'RETURN';

export type ToolTransferStatus =
  | 'PENDING'
  | 'IN_TRANSIT'
  | 'COMPLETED'
  | 'CANCELLED';

export type MaintenanceType =
  | 'PREVENTIVE'
  | 'CORRECTIVE'
  | 'CALIBRATION'
  | 'INSPECTION';

export type MaintenanceStatus =
  | 'SCHEDULED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED';

export interface ToolCategory {
  id: string;
  tenantId: string;
  name: string;
  description?: string | null;
  requiresCalibration: boolean;
  defaultMaintenanceIntervalDays?: number | null;
  createdAt: string;
  updatedAt?: string | null;
}

export interface CreateCategoryDto {
  name: string;
  description?: string;
  requiresCalibration?: boolean;
  defaultMaintenanceIntervalDays?: number;
}

export interface Tool {
  id: string;
  tenantId: string;
  unitId: string;
  categoryId?: string | null;
  categoryName?: string | null;
  assetTag: string;
  serialNumber?: string | null;
  name: string;
  brand?: string | null;
  model?: string | null;
  status: ToolStatus;
  currentHolderUserId?: string | null;
  currentHolderUserName?: string | null;
  locationInUnit?: string | null;
  purchaseDate?: string | null;
  purchaseCost?: number | null;
  lastMaintenanceAt?: string | null;
  nextMaintenanceDueAt?: string | null;
  maintenanceOverdue: boolean;
  version: number;
  createdAt: string;
  updatedAt?: string | null;
}

export interface CreateToolDto {
  unitId: string;
  categoryId?: string;
  assetTag: string;
  serialNumber?: string;
  name: string;
  brand?: string;
  model?: string;
  locationInUnit?: string;
  purchaseDate?: string;
  purchaseCost?: number;
  initialMaintenanceIntervalDays?: number;
}

export interface UpdateToolDto {
  categoryId?: string;
  assetTag: string;
  serialNumber?: string;
  name: string;
  brand?: string;
  model?: string;
  status?: ToolStatus;
  locationInUnit?: string;
  purchaseDate?: string;
  purchaseCost?: number;
}

export interface ToolCustodyLog {
  id: string;
  tenantId: string;
  unitId: string;
  toolId: string;
  toolName: string;
  toolAssetTag: string;
  fromUserId?: string | null;
  fromUserName?: string | null;
  toUserId?: string | null;
  toUserName?: string | null;
  eventType: CustodyEventType;
  notes?: string | null;
  createdAt: string;
}

export interface CheckOutDto {
  toolId: string;
  mechanicUserId: string;
  workOrderId?: string;
  notes?: string;
}

export interface CheckInDto {
  toolId: string;
  locationInUnit?: string;
  notes?: string;
}

export interface AssignDto {
  toolId: string;
  toUserId: string;
  notes?: string;
}

export interface ToolUsage {
  id: string;
  tenantId: string;
  unitId: string;
  toolId: string;
  toolName: string;
  toolAssetTag: string;
  workOrderId: string;
  mechanicUserId?: string | null;
  mechanicUserName?: string | null;
  checkedOutAt: string;
  checkedInAt?: string | null;
  notes?: string | null;
  createdAt: string;
}

export interface RecordUsageDto {
  toolId: string;
  workOrderId: string;
  mechanicUserId?: string;
  notes?: string;
}

export interface ToolTransfer {
  id: string;
  tenantId: string;
  transferNumber: string;
  toolId: string;
  toolName: string;
  toolAssetTag: string;
  sourceUnitId: string;
  destinationUnitId: string;
  status: ToolTransferStatus;
  requestedByUserId?: string | null;
  receivedByUserId?: string | null;
  sentAt?: string | null;
  receivedAt?: string | null;
  notes?: string | null;
  version: number;
  createdAt: string;
  updatedAt?: string | null;
}

export interface CreateToolTransferDto {
  toolId: string;
  destinationUnitId: string;
  notes?: string;
}

export interface ToolMaintenance {
  id: string;
  tenantId: string;
  unitId: string;
  toolId: string;
  toolName: string;
  toolAssetTag: string;
  maintenanceType: MaintenanceType;
  status: MaintenanceStatus;
  scheduledDate?: string | null;
  performedAt?: string | null;
  performedByProvider?: string | null;
  cost?: number | null;
  description?: string | null;
  findings?: string | null;
  nextDueDate?: string | null;
  version: number;
  createdAt: string;
  updatedAt?: string | null;
}

export interface ScheduleMaintenanceDto {
  toolId: string;
  maintenanceType?: MaintenanceType;
  scheduledDate: string;
  performedByProvider?: string;
  estimatedCost?: number;
  description?: string;
}

export interface CompleteMaintenanceDto {
  performedByProvider?: string;
  cost?: number;
  description?: string;
  findings?: string;
  nextDueDate?: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}
