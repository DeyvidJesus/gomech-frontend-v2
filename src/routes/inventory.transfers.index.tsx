import { createFileRoute, redirect } from '@tanstack/react-router';
import { ProtectedLayout } from '@/shared/layouts/ProtectedLayout';
import { useAuthStore } from '@/features/iam/stores/authStore';
import { StockTransferList } from '@/features/inventory/components/StockTransferList';

export const Route = createFileRoute('/inventory/transfers/')({
  beforeLoad: () => {
    if (!useAuthStore.getState().isAuthenticated) {
      throw redirect({ to: '/login' });
    }
  },
  component: InventoryTransfersIndexPage,
});

function InventoryTransfersIndexPage() {
  return (
    <ProtectedLayout>
      <StockTransferList />
    </ProtectedLayout>
  );
}
