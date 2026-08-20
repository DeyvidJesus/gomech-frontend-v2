import { createFileRoute, redirect } from '@tanstack/react-router';
import { z } from 'zod';
import { ProtectedLayout } from '@/shared/layouts/ProtectedLayout';
import { useAuthStore } from '@/features/iam/stores/authStore';
import { VehicleForm } from '@/features/crm/components/VehicleForm';

const vehicleNewSearchSchema = z.object({
  customerId: z.string().optional(),
});

export const Route = createFileRoute('/crm/vehicles/new')({
  validateSearch: (search: Record<string, unknown>) => vehicleNewSearchSchema.parse(search),
  beforeLoad: () => {
    if (!useAuthStore.getState().isAuthenticated) {
      throw redirect({ to: '/login' });
    }
  },
  component: NewVehiclePage,
});

function NewVehiclePage() {
  const search = Route.useSearch();

  return (
    <ProtectedLayout>
      <VehicleForm preselectedCustomerId={search.customerId} />
    </ProtectedLayout>
  );
}
