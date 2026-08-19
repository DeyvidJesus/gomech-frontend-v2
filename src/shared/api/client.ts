import { api } from '@/features/iam/api/auth';
import { useAuthStore } from '@/features/iam/stores/authStore';
import { refreshAccessToken } from '@/features/iam/api/iam';

export const registerApiInterceptors = () => {
  api.interceptors.request.use((config) => {
    const token = useAuthStore.getState().accessToken;
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });

  let refreshPromise: Promise<{ accessToken: string; refreshToken: string; user?: unknown }> | null = null;
  api.interceptors.response.use(undefined, async (error) => {
    const original = error.config as (typeof error.config & { _retry?: boolean }) | undefined;
    const refreshToken = useAuthStore.getState().refreshToken;
    if (error.response?.status !== 401 || !original || original._retry || !refreshToken || original.url?.includes('/auth/')) {
      return Promise.reject(error);
    }

    original._retry = true;
    refreshPromise ??= refreshAccessToken(refreshToken).finally(() => { refreshPromise = null; });
    try {
      const next = await refreshPromise;
      useAuthStore.setState({ accessToken: next.accessToken, refreshToken: next.refreshToken, user: (next.user as never) ?? useAuthStore.getState().user, isAuthenticated: true });
      original.headers.Authorization = `Bearer ${next.accessToken}`;
      return api(original);
    } catch (refreshError) {
      useAuthStore.getState().logout();
      return Promise.reject(refreshError);
    }
  });
};
