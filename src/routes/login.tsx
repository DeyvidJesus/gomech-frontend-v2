import { createFileRoute } from '@tanstack/react-router';
import { LoginForm } from '@/features/iam/components/LoginForm';

export const Route = createFileRoute('/login')({
  component: Login,
});

// eslint-disable-next-line react-refresh/only-export-components
function Login() {
  return (
    <div className="bg-surface text-on-surface antialiased min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 bg-pattern pointer-events-none opacity-30"></div>
      <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-primary-container rounded-full blur-[120px] opacity-20 pointer-events-none"></div>
      <div className="absolute bottom-[-10%] left-[-5%] w-[30%] h-[30%] bg-tertiary-container rounded-full blur-[100px] opacity-10 pointer-events-none"></div>

      {/* Main Login Form Container */}
      <main className="w-full max-w-[440px] px-md relative z-10">
        <LoginForm />
      </main>
    </div>
  );
}
