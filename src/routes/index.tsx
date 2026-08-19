import { createFileRoute, redirect } from '@tanstack/react-router';
import { useAuthStore } from '@/features/iam/stores/authStore';

export const Route = createFileRoute('/')({
  beforeLoad: () => {
    throw redirect({
      to: useAuthStore.getState().isAuthenticated ? '/dashboard' : '/login',
    });
  },
  component: () => null,
});
