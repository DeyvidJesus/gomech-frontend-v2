import { createFileRoute } from '@tanstack/react-router';
import { PayablesList } from '@/features/finance/PayablesList';

export const Route = createFileRoute('/finance/payables/')({
  component: PayablesList,
});
