import { createFileRoute, redirect } from '@tanstack/react-router';
import { ProtectedLayout } from '@/shared/layouts/ProtectedLayout';
import { useAuthStore } from '@/features/iam/stores/authStore';
import { ProductList } from '@/features/inventory/components/ProductList';

export const Route = createFileRoute('/inventory/products/')({
  beforeLoad: () => {
    if (!useAuthStore.getState().isAuthenticated) {
      throw redirect({ to: '/login' });
    }
  },
  component: InventoryProductsIndexPage,
});

function InventoryProductsIndexPage() {
  return (
    <ProtectedLayout>
      <ProductList />
    </ProtectedLayout>
  );
}
