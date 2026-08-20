import { createFileRoute, redirect, useParams } from '@tanstack/react-router';
import { ProtectedLayout } from '@/shared/layouts/ProtectedLayout';
import { useAuthStore } from '@/features/iam/stores/authStore';
import { ProductForm } from '@/features/inventory/components/ProductForm';

export const Route = createFileRoute('/inventory/products/$id')({
  beforeLoad: () => {
    if (!useAuthStore.getState().isAuthenticated) {
      throw redirect({ to: '/login' });
    }
  },
  component: EditProductPage,
});

function EditProductPage() {
  const { id } = useParams({ from: '/inventory/products/$id' });

  return (
    <ProtectedLayout>
      <ProductForm productId={id} />
    </ProtectedLayout>
  );
}
