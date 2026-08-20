import { createFileRoute } from '@tanstack/react-router';
import { BillingDashboard } from '@/features/billing/BillingDashboard';

export const Route = createFileRoute('/billing/')({
  component: BillingDashboard,
});
