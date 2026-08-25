import { createFileRoute, redirect } from '@tanstack/react-router';
import { ProtectedLayout } from '@/shared/layouts/ProtectedLayout';
import { useAuthStore } from '@/features/iam/stores/authStore';
import { VehicleDetails } from '@/features/crm/components/VehicleDetails';

export const Route = createFileRoute('/crm/vehicles/$id')({
  beforeLoad: () => {
    if (!useAuthStore.getState().isAuthenticated) {
      throw redirect({ to: '/login' });
    }
  },
  component: VehicleDetailsPage,
});

function VehicleDetailsPage() {
  const { id } = Route.useParams();

  return (
    <ProtectedLayout>
      <VehicleDetails vehicleId={id} />
    </ProtectedLayout>
  );
}
