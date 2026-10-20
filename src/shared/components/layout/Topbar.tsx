import * as React from 'react';
import { Menu, User as UserIcon, LogOut } from 'lucide-react';
import { Link, useNavigate } from '@tanstack/react-router';
import { ThemeToggle } from '../ThemeToggle';
import { Dropdown, type DropdownItem } from '../Dropdown';
import { useAuth } from '../../../features/auth/hooks/useAuth';
import { useRouteMetadata, type BreadcrumbItem } from '../../utils/routeMetadata';

import { useTopbarOverride } from '../../context/TopbarContext';

export interface TopbarProps {
  onMenuClick?: () => void;
  title?: string;
  breadcrumbs?: BreadcrumbItem[];
}

export const Topbar: React.FC<TopbarProps> = ({
  onMenuClick,
  title: propTitle,
  breadcrumbs: propBreadcrumbs,
}) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const routeMeta = useRouteMetadata();
  const topbarOverride = useTopbarOverride();

  const title = propTitle ?? topbarOverride?.title ?? routeMeta.title;
  const breadcrumbs = propBreadcrumbs ?? topbarOverride?.breadcrumbs ?? routeMeta.breadcrumbs;

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      // Handled in auth provider
    }
  };

  const userMenuItems: DropdownItem[] = [
    {
      id: 'profile',
      label: 'Profile',
      icon: <UserIcon size={16} />,
      onClick: () => {
        navigate({ to: '/profile' });
      },
    },
    {
      id: 'logout',
      label: 'Log out',
      icon: <LogOut size={16} />,
      destructive: true,
      divider: true,
      onClick: handleLogout,
    },
  ];

  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : 'U';

  return (
    <header className="app-topbar sticky top-0 z-40 w-full h-[60px] bg-surface border-b border-border flex items-center justify-between px-4 sm:px-6 shadow-none">
      {/* Left section: Hamburger (tablet) + Route Breadcrumbs & Title */}
      <div className="flex items-center gap-3 min-w-0">
        {onMenuClick && (
          <button
            type="button"
            aria-label="Toggle navigation drawer"
            className="md:inline-flex lg:hidden flex items-center justify-center p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-1 transition-colors min-h-[44px] min-w-[44px]"
            onClick={onMenuClick}
          >
            <Menu size={20} />
          </button>
        )}

        <div className="flex flex-col min-w-0 justify-center">
          {breadcrumbs.length > 0 && (
            <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-text-muted leading-tight mb-0.5">
              {breadcrumbs.map((crumb, idx) => (
                <React.Fragment key={crumb.label + idx}>
                  {crumb.to ? (
                    <Link
                      to={crumb.to}
                      className="hover:text-text-primary transition-colors truncate max-w-[120px]"
                    >
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className="truncate max-w-[120px]">{crumb.label}</span>
                  )}
                  {idx < breadcrumbs.length - 1 && (
                    <span className="text-text-muted/50 select-none" aria-hidden="true">/</span>
                  )}
                </React.Fragment>
              ))}
            </nav>
          )}

          <h1 className="font-outfit font-semibold text-base sm:text-lg text-text-primary tracking-[-0.01em] m-0 leading-tight truncate">
            {title}
          </h1>
        </div>
      </div>

      {/* Right section: Theme toggle + User menu */}
      <div className="flex items-center gap-3 shrink-0">
        <ThemeToggle />

        {/* User avatar menu */}
        <Dropdown
          align="right"
          trigger={
            <div
              className="w-9 h-9 rounded-full bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-semibold text-sm transition-transform hover:scale-105 active:scale-95"
              title={user?.name || 'User Account'}
              aria-label="User account menu"
            >
              {userInitial}
            </div>
          }
          header={
            <div className="flex flex-col min-w-0">
              <span className="font-semibold text-sm text-text-primary truncate">
                {user?.name || 'Student'}
              </span>
              <span className="text-xs text-text-muted truncate">
                {user?.email || 'student@eduadapt.edu'}
              </span>
            </div>
          }
          items={userMenuItems}
        />
      </div>
    </header>
  );
};
