import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useDispatch } from 'react-redux';
import { useLoginMutation } from '@listforge/api-rtk';
import { LoginForm } from '@listforge/ui';
import { setCredentials } from '@/store/authSlice';

export const Route = createFileRoute('/login')({
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [login, { isLoading, error }] = useLoginMutation();

  const handleSubmit = async (values: Record<string, unknown>) => {
    try {
      const result = await login({
        email: values.email as string,
        password: values.password as string,
      }).unwrap();
      dispatch(
        setCredentials({
          user: result.user,
          currentOrg: result.currentOrg,
          token: result.token,
        }),
      );
      navigate({ to: '/' });
    } catch (err) {
      // Error is handled by RTK Query error middleware and shown as toast
      console.error('Login failed:', err);
    }
  };

  const errorMessage =
    error && 'data' in error
      ? (error.data as { message?: string })?.message || 'Login failed'
      : undefined;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="mb-8">
        <img
          src="/assets/full_logo.png"
          alt="ListForge"
          className="h-20 w-auto"
        />
      </div>
      <LoginForm
        onSubmit={handleSubmit}
        onSignUp={() => navigate({ to: '/register' })}
        error={errorMessage}
        loading={isLoading}
        showSocialLogin={false}
        title="Sign in to ListForge"
        description="Enter your credentials to access your account"
      />
    </div>
  );
}
