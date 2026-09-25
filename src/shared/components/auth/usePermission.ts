import { useAuthStore } from '@/features/iam/stores/authStore';

export function usePermission() {
  const user = useAuthStore((state) => state.user);

  const hasPermission = (permission: string | string[]): boolean => {
    if (!user) return false;
    const userPermissions = user.permissions || [];
    const userRoles = user.roles || [];

    // Proprietário or ADMIN has full administrative access
    if (userRoles.includes('Proprietário') || userRoles.includes('ADMIN')) {
      return true;
    }

    if (Array.isArray(permission)) {
      return permission.some((p) => userPermissions.includes(p));
    }
    return userPermissions.includes(permission);
  };

  const hasAllPermissions = (permissions: string[]): boolean => {
    if (!user) return false;
    const userPermissions = user.permissions || [];
    const userRoles = user.roles || [];

    if (userRoles.includes('Proprietário') || userRoles.includes('ADMIN')) {
      return true;
    }

    return permissions.every((p) => userPermissions.includes(p));
  };

  return { hasPermission, hasAllPermissions, userPermissions: user?.permissions || [] };
}
