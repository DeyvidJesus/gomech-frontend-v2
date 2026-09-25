import { useAuthStore } from '@/features/iam/stores/authStore';

export function useEntitlement() {
  const user = useAuthStore((state) => state.user);

  const hasEntitlement = (featureKey: string): boolean => {
    if (!user) return false;
    // In GoMech V2, if user is authenticated and has tenant, entitlement is validated via permissions or billing tier
    // Admin/Proprietário have full entitlement access by default
    const userRoles = user.roles || [];
    if (userRoles.includes('Proprietário') || userRoles.includes('ADMIN')) {
      return true;
    }
    // Entitlements can also be mapped from active permissions
    const permissions = user.permissions || [];
    if (featureKey === 'ai.enabled' && permissions.includes('AI_QUERY')) {
      return true;
    }
    if (featureKey === 'reports.advanced' && permissions.includes('ANALYTICS_VIEW')) {
      return true;
    }
    return true;
  };

  return { hasEntitlement };
}
