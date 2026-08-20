import type { ReactNode } from 'react';
import { AppShell } from '@/shared/components/layout/AppShell';

export function ProtectedLayout({ children }: { children: ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
