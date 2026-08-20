import { createFileRoute, redirect } from '@tanstack/react-router';
import { ProtectedLayout } from '@/shared/layouts/ProtectedLayout';
import { useAuthStore } from '@/features/iam/stores/authStore';
import { VehicleList } from '@/features/crm/components/VehicleList';

export const Route = createFileRoute('/crm/vehicles/')({
  beforeLoad: () => {
    if (!useAuthStore.getState().isAuthenticated) {
      throw redirect({ to: '/login' });
    }
  },
  component: VehiclesIndexPage,
});

function VehiclesIndexPage() {
  return (
    <ProtectedLayout>
      <VehicleList />
    </ProtectedLayout>
  );
}
