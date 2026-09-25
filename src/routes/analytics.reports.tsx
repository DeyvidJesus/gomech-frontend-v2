import { createFileRoute, redirect } from '@tanstack/react-router';
import { ProtectedLayout } from '@/shared/layouts/ProtectedLayout';
import { useAuthStore } from '@/features/iam/stores/authStore';
import { AnalyticsReportsPage } from '@/features/analytics/pages/AnalyticsReportsPage';

export const Route = createFileRoute('/analytics/reports')({
  beforeLoad: () => {
    if (!useAuthStore.getState().isAuthenticated) {
      throw redirect({ to: '/login' });
    }
  },
  component: () => (
    <ProtectedLayout>
      <AnalyticsReportsPage />
    </ProtectedLayout>
  ),
});
