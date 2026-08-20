import { createFileRoute, redirect } from '@tanstack/react-router';
import { ProtectedLayout } from '@/shared/layouts/ProtectedLayout';
import { useAuthStore } from '@/features/iam/stores/authStore';
import { ToolTransferList } from '@/features/tools/components/ToolTransferList';

export const Route = createFileRoute('/tools/transfers/')({
  beforeLoad: () => {
    if (!useAuthStore.getState().isAuthenticated) {
      throw redirect({ to: '/login' });
    }
  },
  component: ToolsTransfersPage,
});

function ToolsTransfersPage() {
  return (
    <ProtectedLayout>
      <ToolTransferList />
    </ProtectedLayout>
  );
}
