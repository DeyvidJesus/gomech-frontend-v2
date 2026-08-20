import { createFileRoute, redirect } from '@tanstack/react-router';
import { ProtectedLayout } from '@/shared/layouts/ProtectedLayout';
import { useAuthStore } from '@/features/iam/stores/authStore';
import { WorkOrderDetail } from '@/features/operations/components/WorkOrderDetail';

export const Route = createFileRoute('/operations/work-orders/$id')({
  beforeLoad: () => {
    if (!useAuthStore.getState().isAuthenticated) {
      throw redirect({ to: '/login' });
    }
  },
  component: WorkOrderDetailPage,
});

function WorkOrderDetailPage() {
  const { id } = Route.useParams();

  return (
    <ProtectedLayout>
      <WorkOrderDetail workOrderId={id} />
    </ProtectedLayout>
  );
}
