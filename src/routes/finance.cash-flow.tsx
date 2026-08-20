import { createFileRoute } from '@tanstack/react-router';
import { CashFlowView } from '@/features/finance/CashFlowView';

export const Route = createFileRoute('/finance/cash-flow')({
  component: CashFlowView,
});
