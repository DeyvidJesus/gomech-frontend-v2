import { createFileRoute } from '@tanstack/react-router';
import { FinanceDashboard } from '@/features/finance/FinanceDashboard';

export const Route = createFileRoute('/finance/dashboard')({
  component: FinanceDashboard,
});
