import { createFileRoute, redirect } from '@tanstack/react-router';
import { ProtectedLayout } from '@/shared/layouts/ProtectedLayout';
import { useAuthStore } from '@/features/iam/stores/authStore';
import { ProductForm } from '@/features/inventory/components/ProductForm';

export const Route = createFileRoute('/inventory/products/new')({
  beforeLoad: () => {
    if (!useAuthStore.getState().isAuthenticated) {
      throw redirect({ to: '/login' });
    }
  },
  component: NewProductPage,
});

function NewProductPage() {
  return (
    <ProtectedLayout>
      <ProductForm />
    </ProtectedLayout>
  );
}
