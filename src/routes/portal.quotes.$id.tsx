import { createFileRoute } from '@tanstack/react-router';
import { CustomerQuotePortal } from '@/features/operations/components/CustomerQuotePortal';

export const Route = createFileRoute('/portal/quotes/$id')({
  component: CustomerPortalQuotePage,
});

function CustomerPortalQuotePage() {
  const { id } = Route.useParams();

  return <CustomerQuotePortal quoteId={id} />;
}
