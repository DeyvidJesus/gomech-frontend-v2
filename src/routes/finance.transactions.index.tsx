import { createFileRoute, redirect } from '@tanstack/react-router';
import { ProtectedLayout } from '@/shared/layouts/ProtectedLayout';
import { useAuthStore } from '@/features/iam/stores/authStore';
import { TransactionsList } from '@/features/finance/TransactionsList';

export const Route = createFileRoute('/finance/transactions/')({
  beforeLoad: () => {
    if (!useAuthStore.getState().isAuthenticated) {
      throw redirect({ to: '/login' });
    }
  },
  component: () => (
    <ProtectedLayout>
      <TransactionsList />
    </ProtectedLayout>
  ),
});
