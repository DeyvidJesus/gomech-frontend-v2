import type { PageResponse } from '@/features/crm/types';

// Appointment Domain Types
export type AppointmentStatus =
  | 'SCHEDULED'
  | 'CONFIRMED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELED'
  | 'NO_SHOW';

export interface AppointmentResponse {
  id: string;
  tenantId: string;
  unitId: string;
  customerId: string;
  customerName: string;
  customerPhone?: string;
  vehicleId: string;
  licensePlate: string;
  formattedLicensePlate?: string;
  vehicleBrand?: string;
  vehicleModel?: string;
  scheduledAt: string;
  estimatedEndAt?: string;
  status: AppointmentStatus;
  serviceType?: string;
  notes?: string;
  cancellationReason?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface AppointmentSummaryResponse {
  id: string;
  customerId: string;
  customerName: string;
  vehicleId: string;
  licensePlate: string;
  vehicleBrand?: string;
  vehicleModel?: string;
  scheduledAt: string;
  estimatedEndAt?: string;
  status: AppointmentStatus;
  serviceType?: string;
  assignedUserId?: string;
}

export interface CreateAppointmentRequest {
  unitId: string;
  customerId: string;
  vehicleId: string;
  scheduledAt: string; // ISO 8601
  estimatedEndAt?: string;
  serviceType?: string;
  notes?: string;
  assignedUserId?: string;
}

export interface UpdateAppointmentRequest {
  scheduledAt?: string;
  estimatedEndAt?: string;
  serviceType?: string;
  notes?: string;
}

export interface ChangeAppointmentStatusRequest {
  status: AppointmentStatus;
  cancellationReason?: string;
}

// Inspection Domain Types
export type InspectionStatus =
  | 'DRAFT'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELED';

export type InspectionCategory =
  | 'TIRES'
  | 'BRAKES'
  | 'SUSPENSION'
  | 'ENGINE'
  | 'ELECTRICAL'
  | 'BODYWORK'
  | 'FLUIDS'
  | 'SAFETY'
  | 'INTERIOR'
  | 'EXTERIOR'
  | 'OTHER';

export type InspectionItemStatus =
  | 'OK'
  | 'ATTENTION'
  | 'CRITICAL'
  | 'NOT_APPLICABLE';

export type FuelLevel =
  | 'EMPTY'
  | 'RESERVE'
  | 'ONE_QUARTER'
  | 'HALF'
  | 'THREE_QUARTERS'
  | 'FULL';

export interface InspectionItemResponse {
  id: string;
  category: InspectionCategory;
  name: string;
  status: InspectionItemStatus;
  notes?: string;
  recommendedAction?: string;
  photoUrls?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface InspectionResponse {
  id: string;
  tenantId: string;
  unitId: string;
  customerId: string;
  customerName: string;
  customerPhone?: string;
  vehicleId: string;
  licensePlate: string;
  formattedLicensePlate?: string;
  vehicleBrand?: string;
  vehicleModel?: string;
  appointmentId?: string;
  inspectorUserId?: string;
  status: InspectionStatus;
  fuelLevel?: FuelLevel;
  currentMileage?: number;
  generalNotes?: string;
  totalItems: number;
  okItems: number;
  attentionItems: number;
  criticalItems: number;
  items: InspectionItemResponse[];
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface InspectionSummaryResponse {
  id: string;
  customerId: string;
  customerName: string;
  vehicleId: string;
  licensePlate: string;
  vehicleBrand?: string;
  vehicleModel?: string;
  status: InspectionStatus;
  fuelLevel?: FuelLevel;
  currentMileage?: number;
  totalItems: number;
  okItems: number;
  attentionItems: number;
  criticalItems: number;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
}

export interface CreateInspectionRequest {
  unitId: string;
  customerId: string;
  vehicleId: string;
  appointmentId?: string;
  currentMileage?: number;
  fuelLevel?: FuelLevel;
  generalNotes?: string;
  items?: SaveInspectionItemRequest[];
}

export interface UpdateInspectionRequest {
  currentMileage?: number;
  fuelLevel?: FuelLevel;
  generalNotes?: string;
}

export interface SaveInspectionItemRequest {
  id?: string;
  category: InspectionCategory;
  name: string;
  status: InspectionItemStatus;
  notes?: string;
  recommendedAction?: string;
  photoUrls?: string;
}

export interface CompleteInspectionRequest {
  generalNotes?: string;
}

// Quote Domain Types
export type QuoteStatus =
  | 'DRAFT'
  | 'PENDING_INTERNAL_APPROVAL'
  | 'INTERNAL_APPROVED'
  | 'SENT_TO_CUSTOMER'
  | 'CUSTOMER_APPROVED'
  | 'CUSTOMER_REJECTED'
  | 'REVISION'
  | 'EXPIRED'
  | 'CANCELED';

export type CustomerApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export type QuoteItemType = 'PART' | 'LABOR';

export interface QuoteItemResponse {
  id: string;
  quoteId: string;
  type: QuoteItemType;
  productId?: string;
  name: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  discountAmount?: number;
  taxRate?: number;
  taxAmount?: number;
  totalAmount: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface SaveQuoteItemRequest {
  id?: string;
  type?: QuoteItemType;
  productId?: string;
  name: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  discountAmount?: number;
  taxRate?: number;
}

export interface CreateQuoteRequest {
  unitId: string;
  customerId: string;
  vehicleId: string;
  inspectionId?: string;
  appointmentId?: string;
  validUntil?: string;
  notes?: string;
  termsAndConditions?: string;
  items?: SaveQuoteItemRequest[];
}

export interface UpdateQuoteRequest {
  validUntil?: string;
  notes?: string;
  termsAndConditions?: string;
}

export interface QuoteResponse {
  id: string;
  unitId: string;
  customerId: string;
  customerName: string;
  customerDocument?: string;
  vehicleId: string;
  licensePlate: string;
  formattedLicensePlate?: string;
  vehicleBrand?: string;
  vehicleModel?: string;
  vehicleYear?: number;
  inspectionId?: string;
  appointmentId?: string;
  createdByUserId?: string;
  approvedByUserId?: string;
  approvedAt?: string;
  status: QuoteStatus;
  customerApprovalStatus: CustomerApprovalStatus;
  customerDecisionAt?: string;
  customerDecisionNotes?: string;
  subtotalAmount: number;
  discountAmount: number;
  taxAmount: number;
  totalLaborAmount: number;
  totalPartsAmount: number;
  totalAmount: number;
  validUntil?: string;
  notes?: string;
  termsAndConditions?: string;
  items: QuoteItemResponse[];
  createdAt: string;
  updatedAt?: string;
  version?: number;
}

export interface QuoteSummaryResponse {
  id: string;
  unitId: string;
  customerId: string;
  customerName: string;
  vehicleId: string;
  licensePlate: string;
  formattedLicensePlate?: string;
  vehicleBrand?: string;
  vehicleModel?: string;
  inspectionId?: string;
  status: QuoteStatus;
  customerApprovalStatus: CustomerApprovalStatus;
  totalLaborAmount: number;
  totalPartsAmount: number;
  totalAmount: number;
  itemCount: number;
  validUntil?: string;
  createdAt: string;
}

export interface CustomerDecisionRequest {
  approved: boolean;
  notes?: string;
}

// Work Order Domain Types
export type WorkOrderStatus =
  | 'DRAFT'
  | 'OPEN'
  | 'IN_PROGRESS'
  | 'WAITING_PARTS'
  | 'WAITING_CUSTOMER'
  | 'COMPLETED'
  | 'CANCELED';

export type WorkOrderItemType = 'PART' | 'SERVICE';

export type WorkOrderItemStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';

export interface WorkOrderItemResponse {
  id: string;
  workOrderId: string;
  type: WorkOrderItemType;
  productId?: string;
  assignedMechanicId?: string;
  assignedMechanicName?: string;
  name: string;
  description?: string;
  status: WorkOrderItemStatus;
  quantity: number;
  unitPrice: number;
  discountAmount?: number;
  taxRate?: number;
  taxAmount?: number;
  totalAmount: number;
  createdAt: string;
  updatedAt?: string;
}

export interface SaveWorkOrderItemRequest {
  id?: string;
  type: WorkOrderItemType;
  productId?: string;
  assignedMechanicId?: string;
  name: string;
  description?: string;
  status?: WorkOrderItemStatus;
  quantity: number;
  unitPrice: number;
  discountAmount?: number;
  taxRate?: number;
}

export interface CreateWorkOrderRequest {
  unitId: string;
  customerId: string;
  vehicleId: string;
  quoteId?: string;
  mechanicUserId?: string;
  serviceBay?: string;
  startMileage?: number;
  startDate?: string;
  endDate?: string;
  technicalNotes?: string;
  diagnosisNotes?: string;
  customerNotes?: string;
  items?: SaveWorkOrderItemRequest[];
}

export interface UpdateWorkOrderRequest {
  mechanicUserId?: string;
  serviceBay?: string;
  startMileage?: number;
  startDate?: string;
  endDate?: string;
  technicalNotes?: string;
  diagnosisNotes?: string;
  customerNotes?: string;
}

export interface ChangeWorkOrderStatusRequest {
  status: WorkOrderStatus;
  notes?: string;
}

export interface CompleteWorkOrderRequest {
  endMileage?: number;
  technicalNotes?: string;
  customerNotes?: string;
}

export interface WorkOrderResponse {
  id: string;
  unitId: string;
  orderNumber?: string;
  customerId: string;
  customerName: string;
  customerDocument?: string;
  customerPhone?: string;
  vehicleId: string;
  licensePlate: string;
  formattedLicensePlate?: string;
  vehicleBrand?: string;
  vehicleModel?: string;
  vehicleYear?: number;
  quoteId?: string;
  mechanicUserId?: string;
  mechanicName?: string;
  serviceBay?: string;
  status: WorkOrderStatus;
  startMileage?: number;
  endMileage?: number;
  subtotalAmount: number;
  discountAmount: number;
  taxAmount: number;
  totalServicesAmount: number;
  totalPartsAmount: number;
  totalAmount: number;
  startDate?: string;
  endDate?: string;
  completedAt?: string;
  canceledAt?: string;
  cancellationReason?: string;
  technicalNotes?: string;
  diagnosisNotes?: string;
  customerNotes?: string;
  items: WorkOrderItemResponse[];
  createdAt: string;
  updatedAt?: string;
  version?: number;
}

export interface WorkOrderSummaryResponse {
  id: string;
  unitId: string;
  orderNumber?: string;
  customerId: string;
  customerName: string;
  vehicleId: string;
  licensePlate: string;
  formattedLicensePlate?: string;
  vehicleBrand?: string;
  vehicleModel?: string;
  quoteId?: string;
  mechanicUserId?: string;
  mechanicName?: string;
  serviceBay?: string;
  status: WorkOrderStatus;
  totalServicesAmount: number;
  totalPartsAmount: number;
  totalAmount: number;
  itemCount: number;
  completedItemCount: number;
  startDate?: string;
  endDate?: string;
  completedAt?: string;
  createdAt: string;
}

export interface KanbanColumnResponse {
  status: WorkOrderStatus;
  title: string;
  totalOrders: number;
  totalAmount: number;
  orders: WorkOrderSummaryResponse[];
}

export interface WorkOrderKanbanResponse {
  unitId: string;
  totalActiveOrders: number;
  totalActiveAmount: number;
  columns: KanbanColumnResponse[];
}

export type { PageResponse };

// Vehicle History / Maintenance Dossier Types
export interface VehicleHistoryWorkOrderItem {
  id: string;
  type: WorkOrderItemType;
  name: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
}

export interface VehicleHistoryWorkOrder {
  id: string;
  orderNumber?: string;
  status: WorkOrderStatus;
  completedAt?: string;
  mileageAtService?: number;
  totalAmount: number;
  totalServicesAmount: number;
  totalPartsAmount: number;
  technicalNotes?: string;
  mechanicName?: string;
  items: VehicleHistoryWorkOrderItem[];
}

export interface VehicleHistoryInspectionItem {
  id: string;
  category: InspectionCategory;
  name: string;
  status: InspectionItemStatus;
  notes?: string;
  recommendedAction?: string;
}

export interface VehicleHistoryInspection {
  id: string;
  status: InspectionStatus;
  completedAt?: string;
  currentMileage?: number;
  generalNotes?: string;
  totalItems: number;
  okItems: number;
  attentionItems: number;
  criticalItems: number;
  items: VehicleHistoryInspectionItem[];
}

export interface VehicleHistoryMetrics {
  totalServicesCount: number;
  totalSpent: number;
  averageTicket: number;
  lastRecordedMileage?: number;
  totalPartsReplacedCount: number;
  firstServiceDate?: string;
  lastServiceDate?: string;
}

export interface VehicleHistoryCustomer {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  document?: string;
}

export interface VehicleHistoryVehicle {
  id: string;
  licensePlate: string;
  formattedLicensePlate?: string;
  brand: string;
  model: string;
  year?: number;
  color?: string;
  chassisNumber?: string;
  currentMileage?: number;
}

export interface VehicleHistoryResponse {
  vehicle: VehicleHistoryVehicle;
  customer: VehicleHistoryCustomer;
  metrics: VehicleHistoryMetrics;
  workOrders: VehicleHistoryWorkOrder[];
  inspections: VehicleHistoryInspection[];
}

export interface PublicQuoteItemResponse {
  id: string;
  type: QuoteItemType;
  description: string;
  quantity: number;
  unitPrice: number;
  discountAmount: number;
  totalAmount: number;
}

export interface PublicQuoteResponse {
  id: string;
  status: QuoteStatus;
  customerApprovalStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  workshopName: string;
  workshopAddress?: string;
  logoUrl?: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  vehiclePlate?: string;
  vehicleModel?: string;
  vehicleYear?: number;
  subtotalAmount: number;
  discountAmount: number;
  taxAmount: number;
  totalLaborAmount: number;
  totalPartsAmount: number;
  totalAmount: number;
  validUntil?: string;
  notes?: string;
  termsAndConditions?: string;
  customerDecisionNotes?: string;
  customerDecisionAt?: string;
  items: PublicQuoteItemResponse[];
  createdAt: string;
}

