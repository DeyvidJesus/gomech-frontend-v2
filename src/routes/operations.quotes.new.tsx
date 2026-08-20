import { createFileRoute, redirect } from '@tanstack/react-router';
import { ProtectedLayout } from '@/shared/layouts/ProtectedLayout';
import { useAuthStore } from '@/features/iam/stores/authStore';
import { QuoteEditor } from '@/features/operations/components/QuoteEditor';

interface QuoteNewSearch {
  fromInspection?: string;
}

export const Route = createFileRoute('/operations/quotes/new')({
  validateSearch: (search: Record<string, unknown>): QuoteNewSearch => {
    return {
      fromInspection: search.fromInspection ? String(search.fromInspection) : undefined,
    };
  },
  beforeLoad: () => {
    if (!useAuthStore.getState().isAuthenticated) {
      throw redirect({ to: '/login' });
    }
  },
  component: NewQuotePage,
});

function NewQuotePage() {
  const { fromInspection } = Route.useSearch();

  return (
    <ProtectedLayout>
      <QuoteEditor fromInspectionId={fromInspection} />
    </ProtectedLayout>
  );
}
