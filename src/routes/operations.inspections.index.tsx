import { createFileRoute, redirect } from '@tanstack/react-router';
import { ProtectedLayout } from '@/shared/layouts/ProtectedLayout';
import { useAuthStore } from '@/features/iam/stores/authStore';
import { InspectionList } from '@/features/operations/components/InspectionList';

export const Route = createFileRoute('/operations/inspections/')({
  beforeLoad: () => {
    if (!useAuthStore.getState().isAuthenticated) {
      throw redirect({ to: '/login' });
    }
  },
  component: InspectionsIndexPage,
});

function InspectionsIndexPage() {
  return (
    <ProtectedLayout>
      <InspectionList />
    </ProtectedLayout>
  );
}
