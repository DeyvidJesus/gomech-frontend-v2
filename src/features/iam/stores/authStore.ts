import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: LoginUser | null;
  isAuthenticated: boolean;
  setAuth: (auth: LoginResponse) => void;
  logout: () => void;
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

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user?: LoginUser | null;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      isAuthenticated: false,
      setAuth: ({ accessToken, refreshToken, user }) => set({ accessToken, refreshToken, user: user ?? null, isAuthenticated: true }),
      logout: () => set({ accessToken: null, refreshToken: null, user: null, isAuthenticated: false }),
    }),
    {
      name: 'gomech-auth-storage',
    }
  )
);
