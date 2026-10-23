import { createRouter } from '@tanstack/react-router';
import { routeTree } from '../routeTree.gen';
import { queryClient } from './queryClient';

import { PageLoader } from '../shared/components/PageLoader';

export const router = createRouter({
  routeTree,
  context: {
    queryClient,
  },
  defaultPreload: 'intent',
  // Since we're using React Query, we don't want TanStack Router to also aggressively cache
  // data loaders since React Query already handles it.
  defaultPreloadStaleTime: 0,
  defaultPendingComponent: PageLoader,
});

// Register the router instance for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

declare module '@tanstack/router-core' {
  interface Register {
    router: typeof router;
  }
}
