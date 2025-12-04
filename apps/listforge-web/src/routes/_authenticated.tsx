import { createFileRoute, Outlet, Navigate } from '@tanstack/react-router';
import { useSelector } from 'react-redux';
import { Skeleton } from '@listforge/ui';
import { RootState } from '@/store/store';
import AppLayout from '@/layouts/AppLayout';

export const Route = createFileRoute('/_authenticated')({
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const token = useSelector((state: RootState) => state.auth.token);
  const isAuthenticated = useSelector(
    (state: RootState) => state.auth.isAuthenticated,
  );

  // If we have a token but aren't authenticated yet, show loading
  // AuthInitializer will restore the session
  if (token && !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/50 flex-col gap-2 pt-20">
        <Skeleton className="h-12 w-12 rounded-full" />
        <p className="text-sm text-muted-foreground">Checking authentication...</p>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  // Render outlet for authenticated routes wrapped in AppLayout
  return (
    <AppLayout>
      <Outlet />
    </AppLayout>
  );
}

