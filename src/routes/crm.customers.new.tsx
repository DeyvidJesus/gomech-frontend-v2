import { createFileRoute, redirect } from '@tanstack/react-router';
import { ProtectedLayout } from '@/shared/layouts/ProtectedLayout';
import { useAuthStore } from '@/features/iam/stores/authStore';
import { CustomerForm } from '@/features/crm/components/CustomerForm';

export const Route = createFileRoute('/crm/customers/new')({
  beforeLoad: () => {
    if (!useAuthStore.getState().isAuthenticated) {
      throw redirect({ to: '/login' });
    }
  },
  component: NewCustomerPage,
});

function NewCustomerPage() {
  return (
    <ProtectedLayout>
      <CustomerForm />
    </ProtectedLayout>
  );
}
