import { createFileRoute, redirect } from '@tanstack/react-router';
import { ProtectedLayout } from '@/shared/layouts/ProtectedLayout';
import { useAuthStore } from '@/features/iam/stores/authStore';
import { ToolMaintenanceList } from '@/features/tools/components/ToolMaintenanceList';

export const Route = createFileRoute('/tools/maintenances/')({
  beforeLoad: () => {
    if (!useAuthStore.getState().isAuthenticated) {
      throw redirect({ to: '/login' });
    }
  },
  component: ToolsMaintenancesPage,
});

function ToolsMaintenancesPage() {
  return (
    <ProtectedLayout>
      <ToolMaintenanceList />
    </ProtectedLayout>
  );
}
