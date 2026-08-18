import { createFileRoute } from '@tanstack/react-router';
import { RegisterForm } from '@/features/iam/components/RegisterForm';

export const Route = createFileRoute('/register')({
  component: Register,
});

// eslint-disable-next-line react-refresh/only-export-components
function Register() {
  return <RegisterForm />;
}
