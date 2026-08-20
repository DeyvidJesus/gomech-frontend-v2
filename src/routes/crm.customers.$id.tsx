import { createFileRoute, redirect } from '@tanstack/react-router';
import { ProtectedLayout } from '@/shared/layouts/ProtectedLayout';
import { useAuthStore } from '@/features/iam/stores/authStore';
import { CustomerForm } from '@/features/crm/components/CustomerForm';

export const Route = createFileRoute('/crm/customers/$id')({
  beforeLoad: () => {
    if (!useAuthStore.getState().isAuthenticated) {
      throw redirect({ to: '/login' });
    }
  },
  component: EditCustomerPage,
});

function EditCustomerPage() {
  const { id } = Route.useParams();

  return (
    <ProtectedLayout>
      <CustomerForm customerId={id} />
    </ProtectedLayout>
  );
}
