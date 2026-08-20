import { createFileRoute, redirect } from '@tanstack/react-router';
import { ProtectedLayout } from '@/shared/layouts/ProtectedLayout';
import { useAuthStore } from '@/features/iam/stores/authStore';
import { RolesPermissions } from '@/features/iam/components/RolesPermissions';

export const Route = createFileRoute('/admin/roles')({
  beforeLoad: () => {
    if (!useAuthStore.getState().isAuthenticated) {
      throw redirect({ to: '/login' });
    }
  },
  component: AdminRolesPage,
});

function AdminRolesPage() {
  return (
    <ProtectedLayout>
      <RolesPermissions />
    </ProtectedLayout>
  );
}
