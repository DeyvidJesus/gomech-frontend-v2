import { createFileRoute, redirect, useParams } from '@tanstack/react-router';
import { ProtectedLayout } from '@/shared/layouts/ProtectedLayout';
import { useAuthStore } from '@/features/iam/stores/authStore';
import { ToolForm } from '@/features/tools/components/ToolForm';

export const Route = createFileRoute('/tools/$id/edit')({
  beforeLoad: () => {
    if (!useAuthStore.getState().isAuthenticated) {
      throw redirect({ to: '/login' });
    }
  },
  component: EditToolPage,
});

function EditToolPage() {
  const { id } = useParams({ from: '/tools/$id/edit' });

  return (
    <ProtectedLayout>
      <ToolForm toolId={id} />
    </ProtectedLayout>
  );
}
