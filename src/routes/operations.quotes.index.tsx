import { createFileRoute, redirect } from '@tanstack/react-router';
import { ProtectedLayout } from '@/shared/layouts/ProtectedLayout';
import { useAuthStore } from '@/features/iam/stores/authStore';
import { QuoteList } from '@/features/operations/components/QuoteList';

export const Route = createFileRoute('/operations/quotes/')({
  beforeLoad: () => {
    if (!useAuthStore.getState().isAuthenticated) {
      throw redirect({ to: '/login' });
    }
  },
  component: QuotesIndexPage,
});

function QuotesIndexPage() {
  return (
    <ProtectedLayout>
      <QuoteList />
    </ProtectedLayout>
  );
}
