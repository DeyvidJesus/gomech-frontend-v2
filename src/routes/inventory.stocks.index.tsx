import { createFileRoute, redirect } from '@tanstack/react-router';
import { ProtectedLayout } from '@/shared/layouts/ProtectedLayout';
import { useAuthStore } from '@/features/iam/stores/authStore';
import { StockList } from '@/features/inventory/components/StockList';

export const Route = createFileRoute('/inventory/stocks/')({
  beforeLoad: () => {
    if (!useAuthStore.getState().isAuthenticated) {
      throw redirect({ to: '/login' });
    }
  },
  component: InventoryStocksIndexPage,
});

function InventoryStocksIndexPage() {
  return (
    <ProtectedLayout>
      <StockList />
    </ProtectedLayout>
  );
}
