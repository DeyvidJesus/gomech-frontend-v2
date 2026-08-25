import { createFileRoute, redirect } from '@tanstack/react-router';
import { ProtectedLayout } from '@/shared/layouts/ProtectedLayout';
import { useAuthStore } from '@/features/iam/stores/authStore';
import { DreReportView } from '@/features/finance/DreReportView';

export const Route = createFileRoute('/finance/dre')({
  beforeLoad: () => {
    if (!useAuthStore.getState().isAuthenticated) {
      throw redirect({ to: '/login' });
    }
  },
  component: () => (
    <ProtectedLayout>
      <DreReportView />
    </ProtectedLayout>
  ),
});
