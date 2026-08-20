import { createFileRoute } from '@tanstack/react-router';
import { DreReportView } from '@/features/finance/DreReportView';

export const Route = createFileRoute('/finance/dre')({
  component: DreReportView,
});
