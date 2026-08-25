import { createFileRoute } from '@tanstack/react-router';
import { ProtectedLayout } from '@/shared/layouts/ProtectedLayout';
import { BillingDashboard } from '@/features/billing/BillingDashboard';

export const Route = createFileRoute('/billing/')({
  component: () => (
    <ProtectedLayout>
      <BillingDashboard />
    </ProtectedLayout>
  ),
});
