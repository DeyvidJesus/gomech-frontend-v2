import { createFileRoute, redirect } from '@tanstack/react-router';
import { ProtectedLayout } from '@/shared/layouts/ProtectedLayout';
import { useAuthStore } from '@/features/iam/stores/authStore';
import { DailyCheckIn } from '@/features/operations/components/DailyCheckIn';

export const Route = createFileRoute('/operations/scheduling/checkin')({
  beforeLoad: () => {
    if (!useAuthStore.getState().isAuthenticated) {
      throw redirect({ to: '/login' });
    }
  },
  component: SchedulingCheckInPage,
});

function SchedulingCheckInPage() {
  return (
    <ProtectedLayout>
      <DailyCheckIn />
    </ProtectedLayout>
  );
}
