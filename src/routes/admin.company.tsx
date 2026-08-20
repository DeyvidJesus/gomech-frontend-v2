import { createFileRoute, redirect } from '@tanstack/react-router';
import { ProtectedLayout } from '@/shared/layouts/ProtectedLayout';
import { useAuthStore } from '@/features/iam/stores/authStore';
import { CompanySettings } from '@/features/iam/components/CompanySettings';

export const Route = createFileRoute('/admin/company')({
  beforeLoad: () => {
    if (!useAuthStore.getState().isAuthenticated) {
      throw redirect({ to: '/login' });
    }
  },
  component: AdminCompanyPage,
});

function AdminCompanyPage() {
  return (
    <ProtectedLayout>
      <CompanySettings />
    </ProtectedLayout>
  );
}
