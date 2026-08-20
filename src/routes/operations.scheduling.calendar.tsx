import { createFileRoute, redirect } from '@tanstack/react-router';
import { ProtectedLayout } from '@/shared/layouts/ProtectedLayout';
import { useAuthStore } from '@/features/iam/stores/authStore';
import { AppointmentCalendar } from '@/features/operations/components/AppointmentCalendar';

export const Route = createFileRoute('/operations/scheduling/calendar')({
  beforeLoad: () => {
    if (!useAuthStore.getState().isAuthenticated) {
      throw redirect({ to: '/login' });
    }
  },
  component: SchedulingCalendarPage,
});

function SchedulingCalendarPage() {
  return (
    <ProtectedLayout>
      <AppointmentCalendar />
    </ProtectedLayout>
  );
}
