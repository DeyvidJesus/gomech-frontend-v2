import { createFileRoute, redirect } from '@tanstack/react-router';
import { ProtectedLayout } from '@/shared/layouts/ProtectedLayout';
import { useAuthStore } from '@/features/iam/stores/authStore';
import { CashFlowView } from '@/features/finance/CashFlowView';

export const Route = createFileRoute('/finance/cash-flow')({
  beforeLoad: () => {
    if (!useAuthStore.getState().isAuthenticated) {
      throw redirect({ to: '/login' });
    }
  },
  component: () => (
    <ProtectedLayout>
      <CashFlowView />
    </ProtectedLayout>
  ),
});
