import { createFileRoute, redirect } from '@tanstack/react-router';
import { ProtectedLayout } from '@/shared/layouts/ProtectedLayout';
import { useAuthStore } from '@/features/iam/stores/authStore';
import { InspectionExecution } from '@/features/operations/components/InspectionExecution';

export const Route = createFileRoute('/operations/inspections/$id')({
  beforeLoad: () => {
    if (!useAuthStore.getState().isAuthenticated) {
      throw redirect({ to: '/login' });
    }
  },
  component: InspectionDetailPage,
});

function InspectionDetailPage() {
  const { id } = Route.useParams();

  return (
    <ProtectedLayout>
      <InspectionExecution inspectionId={id} />
    </ProtectedLayout>
  );
}
