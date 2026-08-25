import { createFileRoute, redirect } from '@tanstack/react-router';
import { ProtectedLayout } from '@/shared/layouts/ProtectedLayout';
import { useAuthStore } from '@/features/iam/stores/authStore';
import { FinanceDashboard } from '@/features/finance/FinanceDashboard';

export const Route = createFileRoute('/finance/dashboard')({
  beforeLoad: () => {
    if (!useAuthStore.getState().isAuthenticated) {
      throw redirect({ to: '/login' });
    }
  },
  component: () => (
    <ProtectedLayout>
      <FinanceDashboard />
    </ProtectedLayout>
  ),
});
