import { api } from '@/shared/api/apiClient';
import type { UserProfile } from '../stores/authStore';

export interface Unit {
  id: string;
  name: string;
  address?: string;
  isHeadquarters?: boolean;
  headquarters?: boolean;
  tenantId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserRoleDetail {
  roleId: string;
  roleName: string;
  unitId?: string;
  unitName?: string;
}

export interface UserResponse {
  id: string;
  name: string;
  email: string;
  status: string;
  tenantId?: string;
  roles?: UserRoleDetail[];
}

export interface Role {
  id: string;
  name: string;
  description?: string;
  tenantId?: string;
  permissions: string[];
}

export interface Permission {
  id: string;
  code: string;
  module: string;
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

export interface CreateUserRequest {
  name: string;
  email: string;
  password: string;
  roles: { roleId: string; unitId?: string }[];
}

export interface AssignUserRoleRequest {
  roleId: string;
  unitId?: string;
}

export interface CreateRoleRequest {
  name: string;
  description?: string;
  permissionCodes: string[];
}

export interface CreateUnitRequest {
  name: string;
  address?: string;
  isHeadquarters?: boolean;
}

export const iamApi = {
  // Units
  units: () => api.get<Unit[]>('/units'),
  getUnitById: (id: string) => api.get<Unit>(`/units/${id}`),
  createUnit: (data: CreateUnitRequest) => api.post<Unit>('/units', data),

  // Users
  users: () => api.get<UserResponse[]>('/users'),
  getUserById: (id: string) => api.get<UserResponse>(`/users/${id}`),
  createUser: (data: CreateUserRequest) => api.post<UserResponse>('/users', data),
  assignRole: (id: string, data: AssignUserRoleRequest) =>
    api.post<UserResponse>(`/users/${id}/roles`, data),

  // Roles & Permissions
  roles: () => api.get<Role[]>('/roles'),
  permissions: () => api.get<Permission[]>('/roles/permissions'),
  createRole: (data: CreateRoleRequest) => api.post<Role>('/roles', data),

  // Sessions & Auth helpers
  sessions: (refreshToken?: string) =>
    api.get<Session[]>('/auth/sessions', {
      params: refreshToken ? { currentRefreshToken: refreshToken } : undefined,
    }),
  logout: (refreshToken?: string | null) =>
    api.post('/auth/logout', refreshToken ? { refreshToken } : undefined),
  switchUnit: (unitId: string) =>
    api.post<{ accessToken: string; refreshToken: string; user?: UserProfile }>('/auth/switch-unit', {
      unitId,
    }),
};
