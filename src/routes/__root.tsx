
import { createRootRouteWithContext, Outlet } from '@tanstack/react-router';
import type { QueryClient } from '@tanstack/react-query';

import { ErrorBoundary } from '../shared/components/ErrorBoundary';
import { Toaster } from 'sonner';
import { AuthRedirect } from '../features/auth/components/AuthRedirect';

import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

import { useTheme } from '../shared/hooks/useTheme';

export interface RouterContext {
  queryClient: QueryClient;
}

function RootComponent() {
  useTheme();

  return (
    <>
      <AuthRedirect />
      <ErrorBoundary>
        <Outlet />
      </ErrorBoundary>
      <Toaster position="bottom-center" richColors />
      
      {/* Devtools only render in development */}
      {import.meta.env.DEV && (
        <>
          <TanStackRouterDevtools position="bottom-right" />
          <ReactQueryDevtools buttonPosition="bottom-left" />
        </>
      )}
    </>
  );
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootComponent,
});
