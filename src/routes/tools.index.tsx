import { createFileRoute, redirect } from '@tanstack/react-router';
import { ProtectedLayout } from '@/shared/layouts/ProtectedLayout';
import { useAuthStore } from '@/features/iam/stores/authStore';
import { ToolList } from '@/features/tools/components/ToolList';

export const Route = createFileRoute('/tools/')({
  beforeLoad: () => {
    if (!useAuthStore.getState().isAuthenticated) {
      throw redirect({ to: '/login' });
    }
  },
  component: ToolsIndexPage,
});

function ToolsIndexPage() {
  return (
    <ProtectedLayout>
      <ToolList />
    </ProtectedLayout>
  );
}
