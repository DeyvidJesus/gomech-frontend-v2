import { createFileRoute, redirect } from '@tanstack/react-router';
import { ProtectedLayout } from '@/shared/layouts/ProtectedLayout';
import { useAuthStore } from '@/features/iam/stores/authStore';
import { QuoteEditor } from '@/features/operations/components/QuoteEditor';

export const Route = createFileRoute('/operations/quotes/$id')({
  beforeLoad: () => {
    if (!useAuthStore.getState().isAuthenticated) {
      throw redirect({ to: '/login' });
    }
  },
  component: QuoteDetailPage,
});

function QuoteDetailPage() {
  const { id } = Route.useParams();

  return (
    <ProtectedLayout>
      <QuoteEditor quoteId={id} />
    </ProtectedLayout>
  );
}
