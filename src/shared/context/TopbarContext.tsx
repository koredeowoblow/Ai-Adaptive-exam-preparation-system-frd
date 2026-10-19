import * as React from 'react';
import type { BreadcrumbItem } from '../utils/routeMetadata';

export interface TopbarOverride {
  title?: string;
  breadcrumbs?: BreadcrumbItem[];
}

interface TopbarContextValue {
  override: TopbarOverride | null;
  setOverride: React.Dispatch<React.SetStateAction<TopbarOverride | null>>;
}

const TopbarContext = React.createContext<TopbarContextValue>({
  override: null,
  setOverride: () => {},
});

export const TopbarProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [override, setOverride] = React.useState<TopbarOverride | null>(null);

  return (
    <TopbarContext.Provider value={{ override, setOverride }}>
      {children}
    </TopbarContext.Provider>
  );
};

/**
 * Hook for pages to override the Topbar title and breadcrumbs at runtime.
 * Automatically cleans up on unmount.
 */
export function useTopbar(override: TopbarOverride) {
  const { setOverride } = React.useContext(TopbarContext);

  const serializedBreadcrumbs = JSON.stringify(override.breadcrumbs);

  React.useEffect(() => {
    setOverride({
      title: override.title,
      breadcrumbs: override.breadcrumbs,
    });

    return () => {
      setOverride(null);
    };
  }, [override.title, serializedBreadcrumbs, setOverride]);
}

export function useTopbarOverride() {
  return React.useContext(TopbarContext).override;
}
