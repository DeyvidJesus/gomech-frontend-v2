import axios from 'axios';
import { api } from './auth';

export interface Unit {
  id: string;
  name: string;
  address: string;
  headquarters: boolean;
  tenantId: string;
}

export interface UserSummary {
  id: string;
  name: string;
  email: string;
  status: string;
  roles?: { roleName: string; unitName?: string }[];
}

export interface Role {
  id: string;
  name: string;
  description?: string;
  permissions: string[];
}

export interface Session {
  id: string;
  createdAt: string;
  lastUsedAt?: string;
  expiresAt: string;
  ipAddress?: string;
  deviceInfo?: string;
  isCurrent: boolean;
}

export const iamApi = {
  units: () => api.get<Unit[]>('/units'),
  users: () => api.get<UserSummary[]>('/users'),
  roles: () => api.get<Role[]>('/roles'),
  sessions: (refreshToken?: string) => api.get<Session[]>('/auth/sessions', { params: refreshToken ? { currentRefreshToken: refreshToken } : undefined }),
  logout: (refreshToken: string | null) => api.post('/auth/logout', refreshToken ? { refreshToken } : undefined),
};

export async function refreshAccessToken(refreshToken: string) {
  const response = await axios.post(`${api.defaults.baseURL}/auth/refresh`, { refreshToken });
  return response.data as { accessToken: string; refreshToken: string; user?: LoginUser | null };
}

interface LoginUser {
  id: string;
  name: string;
  email: string;
  tenantId?: string;
  activeUnitId?: string;
  roles?: string[];
  permissions?: string[];
}
