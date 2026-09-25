export type AiActionType =
  | 'APPLY_QUOTE_ITEMS'
  | 'APPLY_WORK_ORDER_ITEMS'
  | 'SCHEDULE_PREVENTIVE_APPOINTMENT'
  | 'DRAFT_MESSAGE'
  | 'PROPOSE_QUOTE_ITEMS'
  | 'PROPOSE_CHECKLIST'
  | 'NONE';

export type AiActionProposalStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'REJECTED'
  | 'EXPIRED'
  | 'EXECUTED'
  | 'FAILED';

export interface AiActionProposalResponse {
  id: string;
  tenantId: string;
  unitId?: string;
  actorUserId: string;
  actionType: AiActionType;
  targetResourceType?: string;
  targetResourceId?: string;
  title: string;
  summary?: string;
  payloadJson: string;
  status: AiActionProposalStatus;
  rejectionReason?: string;
  expiresAt: string;
  isExpired: boolean;
  confirmedByUserId?: string;
  confirmedAt?: string;
  executedAt?: string;
  executionResultJson?: string;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAiActionProposalRequest {
  actionType: AiActionType;
  targetResourceType?: string;
  targetResourceId?: string;
  title: string;
  summary?: string;
  payloadJson: string;
  ttlMinutes?: number;
}

export interface ConfirmAiActionRequest {
  confirmationNotes?: string;
  adjustedPayloadJson?: string;
}

export interface RejectAiActionRequest {
  rejectionReason: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}
