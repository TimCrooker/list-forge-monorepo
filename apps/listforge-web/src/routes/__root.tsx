import { createRootRouteWithContext, Outlet } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';
import { ThemeProvider, SonnerToaster } from '@listforge/ui';
import type { Store } from '@reduxjs/toolkit';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export interface RouterContext {
  store: Store;
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootComponent,
});

function RootComponent() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultMode="light" enableSystem={true}>
        <Outlet />
        <SonnerToaster position="top-right" />
        {import.meta.env.DEV && (
          <TanStackRouterDevtools position="bottom-right" />
        )}
      </ThemeProvider>
    </ErrorBoundary>
  );
}
