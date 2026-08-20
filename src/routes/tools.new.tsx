import { createFileRoute, redirect } from '@tanstack/react-router';
import { ProtectedLayout } from '@/shared/layouts/ProtectedLayout';
import { useAuthStore } from '@/features/iam/stores/authStore';
import { ToolForm } from '@/features/tools/components/ToolForm';

export const Route = createFileRoute('/tools/new')({
  beforeLoad: () => {
    if (!useAuthStore.getState().isAuthenticated) {
      throw redirect({ to: '/login' });
    }
  },
  component: NewToolPage,
});

function NewToolPage() {
  return (
    <ProtectedLayout>
      <ToolForm />
    </ProtectedLayout>
  );
}
