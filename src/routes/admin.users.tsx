import { createFileRoute, redirect } from '@tanstack/react-router';
import { ProtectedLayout } from '@/shared/layouts/ProtectedLayout';
import { useAuthStore } from '@/features/iam/stores/authStore';
import { UserManagement } from '@/features/iam/components/UserManagement';

export const Route = createFileRoute('/admin/users')({
  beforeLoad: () => {
    if (!useAuthStore.getState().isAuthenticated) {
      throw redirect({ to: '/login' });
    }
  },
  component: AdminUsersPage,
});

function AdminUsersPage() {
  return (
    <ProtectedLayout>
      <UserManagement />
    </ProtectedLayout>
  );
}
