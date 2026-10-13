
import * as React from 'react';
import { createRootRouteWithContext, Outlet } from '@tanstack/react-router';
import type { QueryClient } from '@tanstack/react-query';
import { WifiOff } from 'lucide-react';

import { ErrorBoundary } from '../shared/components/ErrorBoundary';
import { Toaster } from 'sonner';
import { AuthRedirect } from '../features/auth/components/AuthRedirect';

import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

import { useTheme } from '../shared/hooks/useTheme';

export interface RouterContext {
  queryClient: QueryClient;
}

function OfflineBanner() {
  const [isOffline, setIsOffline] = React.useState(typeof navigator !== 'undefined' ? !navigator.onLine : false);

  React.useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        backgroundColor: 'var(--color-danger, #ef4444)',
        color: '#ffffff',
        padding: '10px 16px',
        textAlign: 'center',
        fontSize: '0.875rem',
        fontWeight: 600,
        position: 'sticky',
        top: 0,
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
      }}
    >
      <WifiOff size={16} />
      <span>You are currently offline. Check your internet connection.</span>
    </div>
  );
}

function RootComponent() {
  useTheme();

  return (
    <>
      <OfflineBanner />
      <AuthRedirect />
      <ErrorBoundary>
        <Outlet />
      </ErrorBoundary>
      <Toaster position="bottom-center" richColors />
      
      {/* Devtools gated behind explicit env flag */}
      {import.meta.env.DEV && import.meta.env.VITE_SHOW_DEVTOOLS === 'true' && (
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
