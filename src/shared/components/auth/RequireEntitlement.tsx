import React from 'react';
import { useEntitlement } from './useEntitlement';

interface RequireEntitlementProps {
  featureKey: string;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export const RequireEntitlement: React.FC<RequireEntitlementProps> = ({
  featureKey,
  fallback = null,
  children,
}) => {
  const { hasEntitlement } = useEntitlement();

  if (!hasEntitlement(featureKey)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};
