import { createFileRoute, redirect } from '@tanstack/react-router';
import { ProtectedLayout } from '@/shared/layouts/ProtectedLayout';
import { useAuthStore } from '@/features/iam/stores/authStore';
import { UserProfile } from '@/features/iam/components/UserProfile';

export const Route = createFileRoute('/admin/profile')({
  beforeLoad: () => {
    if (!useAuthStore.getState().isAuthenticated) {
      throw redirect({ to: '/login' });
    }
  },
  component: ProfilePage,
});

function ProfilePage() {
  return (
    <ProtectedLayout>
      <UserProfile />
    </ProtectedLayout>
  );
}
