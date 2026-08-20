import { createFileRoute, redirect } from '@tanstack/react-router';
import { ProtectedLayout } from '@/shared/layouts/ProtectedLayout';
import { useAuthStore } from '@/features/iam/stores/authStore';
import { WorkOrderKanban } from '@/features/operations/components/WorkOrderKanban';

export const Route = createFileRoute('/operations/work-orders/kanban')({
  beforeLoad: () => {
    if (!useAuthStore.getState().isAuthenticated) {
      throw redirect({ to: '/login' });
    }
  },
  component: WorkOrdersKanbanPage,
});

function WorkOrdersKanbanPage() {
  return (
    <ProtectedLayout>
      <WorkOrderKanban />
    </ProtectedLayout>
  );
}
