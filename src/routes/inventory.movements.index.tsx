import { createFileRoute, redirect } from '@tanstack/react-router';
import { ProtectedLayout } from '@/shared/layouts/ProtectedLayout';
import { useAuthStore } from '@/features/iam/stores/authStore';
import { InventoryMovementList } from '@/features/inventory/components/InventoryMovementList';

export const Route = createFileRoute('/inventory/movements/')({
  beforeLoad: () => {
    if (!useAuthStore.getState().isAuthenticated) {
      throw redirect({ to: '/login' });
    }
  },
  component: InventoryMovementsIndexPage,
});

function InventoryMovementsIndexPage() {
  return (
    <ProtectedLayout>
      <InventoryMovementList />
    </ProtectedLayout>
  );
}
