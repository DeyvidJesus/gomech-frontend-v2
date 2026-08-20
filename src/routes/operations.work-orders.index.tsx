import { createFileRoute, redirect } from '@tanstack/react-router';
import { ProtectedLayout } from '@/shared/layouts/ProtectedLayout';
import { useAuthStore } from '@/features/iam/stores/authStore';
import { WorkOrderList } from '@/features/operations/components/WorkOrderList';

export const Route = createFileRoute('/operations/work-orders/')({
  beforeLoad: () => {
    if (!useAuthStore.getState().isAuthenticated) {
      throw redirect({ to: '/login' });
    }
  },
  component: WorkOrdersIndexPage,
});

function WorkOrdersIndexPage() {
  return (
    <ProtectedLayout>
      <WorkOrderList />
    </ProtectedLayout>
  );
}
