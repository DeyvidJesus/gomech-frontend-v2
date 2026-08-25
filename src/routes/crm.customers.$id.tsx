import { createFileRoute, redirect } from '@tanstack/react-router';
import { ProtectedLayout } from '@/shared/layouts/ProtectedLayout';
import { useAuthStore } from '@/features/iam/stores/authStore';
import { CustomerDetails } from '@/features/crm/components/CustomerDetails';

export const Route = createFileRoute('/crm/customers/$id')({
  beforeLoad: () => {
    if (!useAuthStore.getState().isAuthenticated) {
      throw redirect({ to: '/login' });
    }
  },
  component: CustomerDetailsPage,
});

function CustomerDetailsPage() {
  const { id } = Route.useParams();

  return (
    <ProtectedLayout>
      <CustomerDetails customerId={id} />
    </ProtectedLayout>
  );
}
