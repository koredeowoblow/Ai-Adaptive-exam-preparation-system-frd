import * as React from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { useAuth } from '../../../features/auth/hooks/useAuth';

interface AppLayoutProps {
  children: React.ReactNode;
  userName?: string;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children, userName }) => {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const { user } = useAuth();

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);

  // Prefer prop override, then auth user name, then generic label
  const displayName = userName ?? user?.name ?? 'Student';

  return (
    <div className="app-layout">
      {/* Subtle static mesh — no animation, no decoration */}
      <div className="mesh-background" />

      {/* Mobile overlay */}
      <div
        className={`admin-overlay ${isSidebarOpen ? 'open' : ''}`}
        onClick={closeSidebar}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') closeSidebar(); }}
        role="button"
        aria-label="Close sidebar"
        tabIndex={0}
      />

      {/* Sidebar */}
      <div className={`app-sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <Sidebar onClose={closeSidebar} />
      </div>

      <div className="app-main">
        <Topbar
          userName={displayName}
          onMenuClick={toggleSidebar}
        />

        <main className="app-main-content">
          {children}
        </main>
      </div>
    </div>
  );
};
