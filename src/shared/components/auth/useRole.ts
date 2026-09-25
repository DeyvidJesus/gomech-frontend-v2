import { useAuthStore } from '@/features/iam/stores/authStore';

export function useRole() {
  const user = useAuthStore((state) => state.user);

  const hasRole = (role: string | string[]): boolean => {
    if (!user) return false;
    const userRoles = user.roles || [];

    if (userRoles.includes('Proprietário')) {
      return true;
    }

    if (Array.isArray(role)) {
      return role.some((r) => userRoles.includes(r));
    }
    return userRoles.includes(role);
  };

  return { hasRole, userRoles: user?.roles || [] };
}
