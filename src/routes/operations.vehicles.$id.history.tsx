import { createFileRoute, redirect } from '@tanstack/react-router';
import { ProtectedLayout } from '@/shared/layouts/ProtectedLayout';
import { useAuthStore } from '@/features/iam/stores/authStore';
import { VehicleHistory } from '@/features/operations/components/VehicleHistory';

export const Route = createFileRoute('/operations/vehicles/$id/history')({
  beforeLoad: () => {
    if (!useAuthStore.getState().isAuthenticated) {
      throw redirect({ to: '/login' });
    }
  },
  component: VehicleHistoryPage,
});

function VehicleHistoryPage() {
  const { id } = Route.useParams();

  return (
    <ProtectedLayout>
      <VehicleHistory vehicleId={id} />
    </ProtectedLayout>
  );
}
