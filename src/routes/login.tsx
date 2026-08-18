import { createFileRoute } from '@tanstack/react-router';
import { LoginForm } from '@/features/iam/components/LoginForm';

export const Route = createFileRoute('/login')({
  component: Login,
});

// eslint-disable-next-line react-refresh/only-export-components
function Login() {
  return (
    <div className="min-h-screen w-full bg-[#FFF8F6] flex items-center justify-center overflow-hidden">
      <LoginForm />
    </div>
  );
}
