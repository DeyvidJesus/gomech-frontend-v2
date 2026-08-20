import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  tenantId?: string;
  activeUnitId?: string;
  roles?: string[];
  permissions?: string[];
}

export interface AuthResponseDto {
  accessToken: string;
  refreshToken: string;
  tokenType?: string;
  expiresIn?: number;
  user?: UserProfile | null;
}

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: UserProfile | null;
  isAuthenticated: boolean;
  setAuth: (accessToken: string, refreshToken: string, user?: UserProfile | null) => void;
  setAuthResponse: (response: AuthResponseDto) => void;
  switchActiveUnit: (unitId: string, newAccessToken: string, newRefreshToken: string) => void;
  setUser: (user: UserProfile | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      isAuthenticated: false,

      setAuth: (accessToken, refreshToken, user) =>
        set({
          accessToken,
          refreshToken,
          user: user ?? null,
          isAuthenticated: Boolean(accessToken),
        }),

      setAuthResponse: (response) =>
        set({
          accessToken: response.accessToken,
          refreshToken: response.refreshToken,
          user: response.user ?? null,
          isAuthenticated: Boolean(response.accessToken),
        }),

      switchActiveUnit: (unitId, newAccessToken, newRefreshToken) =>
        set((state) => ({
          accessToken: newAccessToken,
          refreshToken: newRefreshToken,
          user: state.user ? { ...state.user, activeUnitId: unitId } : null,
          isAuthenticated: true,
        })),

      setUser: (user) => set({ user }),

      logout: () =>
        set({
          accessToken: null,
          refreshToken: null,
          user: null,
          isAuthenticated: false,
        }),
    }),
    {
      name: 'gomech-auth-storage',
      partialize: (state) => ({
        refreshToken: state.refreshToken,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        // Persist accessToken as well to survive reloads in SPA development
        accessToken: state.accessToken,
      }),
    }
  )
);
