import * as React from 'react';
import { createFileRoute, notFound } from '@tanstack/react-router';

// In production, import.meta.env.DEV is replaced with false, allowing tree-shaking of the gallery chunk
const LazyDevGallery = import.meta.env.DEV
  ? React.lazy(() => import('../features/dev/DevComponentsGallery'))
  : null;

export const Route = createFileRoute('/dev/components')({
  beforeLoad: () => {
    if (!import.meta.env.DEV) {
      throw notFound();
    }
  },
  component: function DevComponentsRoute() {
    if (!import.meta.env.DEV || !LazyDevGallery) {
      return null;
    }
    return (
      <React.Suspense fallback={null}>
        <LazyDevGallery />
      </React.Suspense>
    );
  },
});
