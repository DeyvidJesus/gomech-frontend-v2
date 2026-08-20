import { createFileRoute, redirect } from '@tanstack/react-router';
import { ProtectedLayout } from '@/shared/layouts/ProtectedLayout';
import { useAuthStore } from '@/features/iam/stores/authStore';
import { InspectionForm } from '@/features/operations/components/InspectionForm';

interface InspectionNewSearch {
  appointmentId?: string;
  customerId?: string;
  vehicleId?: string;
}

export const Route = createFileRoute('/operations/inspections/new')({
  validateSearch: (search: Record<string, unknown>): InspectionNewSearch => {
    return {
      appointmentId: typeof search.appointmentId === 'string' ? search.appointmentId : undefined,
      customerId: typeof search.customerId === 'string' ? search.customerId : undefined,
      vehicleId: typeof search.vehicleId === 'string' ? search.vehicleId : undefined,
    };
  },
  beforeLoad: () => {
    if (!useAuthStore.getState().isAuthenticated) {
      throw redirect({ to: '/login' });
    }
  },
  component: InspectionNewPage,
});

function InspectionNewPage() {
  const { appointmentId, customerId, vehicleId } = Route.useSearch();

  return (
    <ProtectedLayout>
      <InspectionForm
        initialAppointmentId={appointmentId}
        initialCustomerId={customerId}
        initialVehicleId={vehicleId}
      />
    </ProtectedLayout>
  );
}
