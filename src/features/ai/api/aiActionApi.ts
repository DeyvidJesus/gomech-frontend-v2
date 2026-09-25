import { api } from '@/shared/api/apiClient';
import type {
  AiActionProposalResponse,
  AiActionProposalStatus,
  ConfirmAiActionRequest,
  CreateAiActionProposalRequest,
  PageResponse,
  RejectAiActionRequest,
} from '../types/aiActionTypes';

export const aiActionApi = {
  createProposal: (data: CreateAiActionProposalRequest) =>
    api.post<AiActionProposalResponse>('/api/v1/ai/actions/proposals', data),

  getProposal: (id: string) =>
    api.get<AiActionProposalResponse>(`/api/v1/ai/actions/proposals/${id}`),

  listProposals: (params?: { status?: AiActionProposalStatus; page?: number; size?: number }) =>
    api.get<PageResponse<AiActionProposalResponse>>('/api/v1/ai/actions/proposals', { params }),

  confirmProposal: (id: string, data?: ConfirmAiActionRequest) =>
    api.post<AiActionProposalResponse>(`/api/v1/ai/actions/proposals/${id}/confirm`, data || {}),

  rejectProposal: (id: string, data: RejectAiActionRequest) =>
    api.post<AiActionProposalResponse>(`/api/v1/ai/actions/proposals/${id}/reject`, data),
};
