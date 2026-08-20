import { createFileRoute, redirect } from '@tanstack/react-router';
import { ProtectedLayout } from '@/shared/layouts/ProtectedLayout';
import { useAuthStore } from '@/features/iam/stores/authStore';
import { VehicleForm } from '@/features/crm/components/VehicleForm';

export const Route = createFileRoute('/crm/vehicles/$id')({
  beforeLoad: () => {
    if (!useAuthStore.getState().isAuthenticated) {
      throw redirect({ to: '/login' });
    }
  },
  component: EditVehiclePage,
});

function EditVehiclePage() {
  const { id } = Route.useParams();

  return (
    <ProtectedLayout>
      <VehicleForm vehicleId={id} />
    </ProtectedLayout>
  );
}
