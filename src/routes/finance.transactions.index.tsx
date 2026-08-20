import { createFileRoute } from '@tanstack/react-router';
import { TransactionsList } from '@/features/finance/TransactionsList';

export const Route = createFileRoute('/finance/transactions/')({
  component: TransactionsList,
});
