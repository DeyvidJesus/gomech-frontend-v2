import { api } from '@/shared/api/apiClient';
import type { AuthResponseDto } from '../stores/authStore';

export { api };

export interface LoginRequest {
  email: string;
  password?: string;
}

export type LoginResponse = AuthResponseDto;

export interface RegisterWorkshopRequest {
  workshopName: string;
  cnpj?: string;
  phone?: string;
  address: string;
  bays: number;
  services?: string[];
  ownerName: string;
  email: string;
  password?: string;
  planCode?: string;
}

export interface GoogleAuthorizeResponse {
  authorizationUrl: string;
  state: string;
}

export interface GoogleOAuthCallbackRequest {
  code: string;
  state: string;
  redirectUri?: string;
}

export interface SwitchUnitRequest {
  unitId: string;
}

export const authApi = {
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>('/auth/login', data);
    return response.data;
  },

  register: async (data: RegisterWorkshopRequest): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>('/auth/register', data);
    return response.data;
  },

  getGoogleAuthorizeUrl: async (redirectUri?: string): Promise<GoogleAuthorizeResponse> => {
    const response = await api.get<GoogleAuthorizeResponse>('/auth/oauth/google/authorize', {
      params: redirectUri ? { redirectUri } : undefined,
    });
    return response.data;
  },

  googleCallback: async (data: GoogleOAuthCallbackRequest): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>('/auth/oauth/google/callback', data);
    return response.data;
  },

  switchUnit: async (unitId: string): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>('/auth/switch-unit', { unitId });
    return response.data;
  },

  logout: async (refreshToken?: string | null): Promise<void> => {
    await api.post('/auth/logout', refreshToken ? { refreshToken } : undefined);
  },
};
