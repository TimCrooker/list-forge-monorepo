import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useDispatch } from 'react-redux';
import { useRegisterMutation } from '@listforge/api-rtk';
import { RegisterForm } from '@listforge/ui';
import { setCredentials } from '@/store/authSlice';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Input, Label } from '@listforge/ui';

export const Route = createFileRoute('/register')({
  component: RegisterPage,
});

function RegisterPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [register, { isLoading, error }] = useRegisterMutation();
  const [orgName, setOrgName] = useState('');

  const handleSubmit = async (values: {
    name: string;
    email: string;
    password: string;
    acceptTerms: boolean;
    marketingEmails: boolean;
  }) => {
    try {
      const result = await register({
        email: values.email,
        password: values.password,
        name: values.name,
        orgName: orgName || `${values.name}'s Organization`,
      }).unwrap();
      dispatch(
        setCredentials({
          user: result.user,
          currentOrg: result.org,
          token: result.token,
        }),
      );
      navigate({ to: '/' });
    } catch (err) {
      // Error is handled by RTK Query error middleware and shown as toast
      console.error('Registration failed:', err);
    }
  };

  const errorMessage =
    error && 'data' in error
      ? (error.data as { message?: string })?.message || 'Registration failed'
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
      <div className="w-full max-w-md space-y-6">
        <RegisterForm
          onSubmit={handleSubmit}
          onSignIn={() => navigate({ to: '/login' })}
          error={errorMessage}
          loading={isLoading}
          showSocialLogin={false}
          title="Create your ListForge account"
          description="Enter your information to get started"
        />
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Organization Name</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="orgName">Organization Name</Label>
              <Input
                id="orgName"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                placeholder="My Organization"
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">
                This will be your default organization. You can create more later.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
