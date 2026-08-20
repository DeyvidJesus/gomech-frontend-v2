import { createFileRoute } from '@tanstack/react-router';
import { AccountList } from '@/features/finance/AccountList';

export const Route = createFileRoute('/finance/accounts/')({
  component: AccountList,
});
