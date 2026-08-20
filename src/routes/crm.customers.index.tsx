import { createFileRoute, redirect } from '@tanstack/react-router';
import { ProtectedLayout } from '@/shared/layouts/ProtectedLayout';
import { useAuthStore } from '@/features/iam/stores/authStore';
import { CustomerList } from '@/features/crm/components/CustomerList';

export const Route = createFileRoute('/crm/customers/')({
  beforeLoad: () => {
    if (!useAuthStore.getState().isAuthenticated) {
      throw redirect({ to: '/login' });
    }
  },
  component: CustomersIndexPage,
});

function CustomersIndexPage() {
  return (
    <ProtectedLayout>
      <CustomerList />
    </ProtectedLayout>
  );
}
