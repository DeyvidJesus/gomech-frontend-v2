import React from 'react';
import { useRole } from './useRole';

interface RequireRoleProps {
  role: string | string[];
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export const RequireRole: React.FC<RequireRoleProps> = ({
  role,
  fallback = null,
  children,
}) => {
  const { hasRole } = useRole();

  if (!hasRole(role)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};
