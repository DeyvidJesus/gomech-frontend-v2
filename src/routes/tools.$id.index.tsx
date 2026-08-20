import { createFileRoute, redirect, useParams } from '@tanstack/react-router';
import { ProtectedLayout } from '@/shared/layouts/ProtectedLayout';
import { useAuthStore } from '@/features/iam/stores/authStore';
import { ToolDetail } from '@/features/tools/components/ToolDetail';

export const Route = createFileRoute('/tools/$id/')({
  beforeLoad: () => {
    if (!useAuthStore.getState().isAuthenticated) {
      throw redirect({ to: '/login' });
    }
  },
  component: ToolDetailPage,
});

function ToolDetailPage() {
  const { id } = useParams({ from: '/tools/$id/' });

  return (
    <ProtectedLayout>
      <ToolDetail toolId={id} />
    </ProtectedLayout>
  );
}
