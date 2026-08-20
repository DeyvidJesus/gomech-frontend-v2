import { createFileRoute, redirect } from '@tanstack/react-router';
import { ProtectedLayout } from '@/shared/layouts/ProtectedLayout';
import { useAuthStore } from '@/features/iam/stores/authStore';
import { AppointmentForm } from '@/features/operations/components/AppointmentForm';

export const Route = createFileRoute('/operations/scheduling/new')({
  beforeLoad: () => {
    if (!useAuthStore.getState().isAuthenticated) {
      throw redirect({ to: '/login' });
    }
  },
  component: SchedulingNewPage,
});

function SchedulingNewPage() {
  return (
    <ProtectedLayout>
      <AppointmentForm />
    </ProtectedLayout>
  );
}
