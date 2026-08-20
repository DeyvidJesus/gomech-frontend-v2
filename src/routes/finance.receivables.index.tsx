import { createFileRoute } from '@tanstack/react-router';
import { ReceivablesList } from '@/features/finance/ReceivablesList';

export const Route = createFileRoute('/finance/receivables/')({
  component: ReceivablesList,
});
