import RegisterForm from '@/components/auth/RegisterForm';
import AuthGuard from '@/components/auth/AuthGuard';

export default function RegisterPage() {
  return (
    <AuthGuard requireAuth={false}>
      <RegisterForm />
    </AuthGuard>
  );
}

