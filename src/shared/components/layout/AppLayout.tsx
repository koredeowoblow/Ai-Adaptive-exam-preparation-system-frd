import * as React from 'react';
import { useLocation, Link } from '@tanstack/react-router';
import { FocusTrap } from 'focus-trap-react';
import {
  LayoutDashboard,
  ClipboardList,
  BookOpen,
  MessageSquare,
  Menu,
  X,
  History,
  BarChart3,
  Award,
  Trophy,
  CalendarDays,
  ShieldAlert,
  Brain,
  User,
  LogOut,
} from 'lucide-react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { PageContainer } from './PageContainer';
import { useAuth } from '../../../features/auth/hooks/useAuth';

import { TopbarProvider } from '../../context/TopbarContext';

interface AppLayoutProps {
  children: React.ReactNode;
  userName?: string;
  title?: string;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children, title }) => {
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);
  const [isMoreSheetOpen, setIsMoreSheetOpen] = React.useState(false);

  const location = useLocation();
  const { user, logout } = useAuth();

  // Close overlays on route change
  React.useEffect(() => {
    setIsDrawerOpen(false);
    setIsMoreSheetOpen(false);
  }, [location.pathname]);

  // Handle Escape key to close open drawer or bottom sheet
  React.useEffect(() => {
    if (!isDrawerOpen && !isMoreSheetOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsDrawerOpen(false);
        setIsMoreSheetOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDrawerOpen, isMoreSheetOpen]);

  const handleLogout = async () => {
    try {
      setIsMoreSheetOpen(false);
      await logout();
    } catch {
      // Handled in auth provider
    }
  };

  const isCurrentPath = (path: string) => {
    if (path === '/dashboard' || path === '/') {
      return location.pathname === '/dashboard' || location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  const isMoreActive =
    isCurrentPath('/practice/history') ||
    isCurrentPath('/analytics') ||
    isCurrentPath('/achievements') ||
    isCurrentPath('/leaderboard') ||
    isCurrentPath('/study-planner') ||
    isCurrentPath('/review-deck') ||
    isCurrentPath('/profile') ||
    isCurrentPath('/admin');

  return (
    <TopbarProvider>
      <div className="min-h-screen flex flex-col bg-background-soft text-text-primary antialiased relative">
        {/* Skip to Content Accessible Link */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:px-4 focus:py-2 focus:bg-primary focus:text-white focus:rounded-md focus:shadow-md focus:outline-none focus:ring-2 focus:ring-white font-medium text-sm"
        >
          Skip to content
        </a>
        {/* ── 1. Desktop Persistent Sidebar (1024px and up) ── */}
        <aside
          className="hidden lg:block fixed top-0 left-0 bottom-0 w-[240px] z-30 border-r border-border"
          aria-label="Desktop Sidebar"
        >
          <Sidebar />
        </aside>

        {/* ── 2. Off-Canvas Drawer (768px to 1023px) ── */}
        {/* Drawer Scrim */}
        <div
          className={`shell-scrim hidden md:block lg:hidden ${isDrawerOpen ? 'open' : ''}`}
          onClick={() => setIsDrawerOpen(false)}
          role="presentation"
          aria-hidden={!isDrawerOpen}
        />

        {isDrawerOpen && (
          <FocusTrap
            active={isDrawerOpen}
            focusTrapOptions={{
              fallbackFocus: '#drawer-close-btn',
              allowOutsideClick: true,
            }}
          >
            <div
              className={`shell-drawer hidden md:block lg:hidden ${isDrawerOpen ? 'open' : ''}`}
              role="dialog"
              aria-modal="true"
              aria-label="Navigation drawer"
            >
              <Sidebar onClose={() => setIsDrawerOpen(false)} />
            </div>
          </FocusTrap>
        )}

        {/* ── 3. Main Application Column ── */}
        <div className="flex-1 flex flex-col lg:pl-[240px] min-w-0 min-h-screen">
          <Topbar
            title={title}
            onMenuClick={() => setIsDrawerOpen(true)}
          />

          <main className="app-main-content flex-1 flex flex-col" id="main-content">
            <PageContainer className="flex-1 w-full pb-20 md:pb-8">
              {children}
            </PageContainer>
          </main>
        </div>

        {/* ── 4. Mobile Bottom Tab Bar (Below 768px) ── */}
        <nav
          aria-label="Mobile Navigation"
          className="mobile-tab-bar md:hidden"
        >
          <Link
            to="/dashboard"
            className={`mobile-tab-item ${isCurrentPath('/dashboard') ? 'active' : ''}`}
            aria-current={isCurrentPath('/dashboard') ? 'page' : undefined}
          >
            {isCurrentPath('/dashboard') && <span className="tab-active-indicator" aria-hidden="true" />}
            <LayoutDashboard size={20} strokeWidth={isCurrentPath('/dashboard') ? 2.25 : 1.75} />
            <span className="mt-1">Dashboard</span>
          </Link>

          <Link
            to="/exam-prep"
            className={`mobile-tab-item ${isCurrentPath('/exam-prep') ? 'active' : ''}`}
            aria-current={isCurrentPath('/exam-prep') ? 'page' : undefined}
          >
            {isCurrentPath('/exam-prep') && <span className="tab-active-indicator" aria-hidden="true" />}
            <ClipboardList size={20} strokeWidth={isCurrentPath('/exam-prep') ? 2.25 : 1.75} />
            <span className="mt-1">Practice</span>
          </Link>

          <Link
            to="/courses"
            className={`mobile-tab-item ${isCurrentPath('/courses') ? 'active' : ''}`}
            aria-current={isCurrentPath('/courses') ? 'page' : undefined}
          >
            {isCurrentPath('/courses') && <span className="tab-active-indicator" aria-hidden="true" />}
            <BookOpen size={20} strokeWidth={isCurrentPath('/courses') ? 2.25 : 1.75} />
            <span className="mt-1">Courses</span>
          </Link>

          <Link
            to="/ai-chat"
            className={`mobile-tab-item ${isCurrentPath('/ai-chat') ? 'active' : ''}`}
            aria-current={isCurrentPath('/ai-chat') ? 'page' : undefined}
          >
            {isCurrentPath('/ai-chat') && <span className="tab-active-indicator" aria-hidden="true" />}
            <MessageSquare size={20} strokeWidth={isCurrentPath('/ai-chat') ? 2.25 : 1.75} />
            <span className="mt-1">AI Tutor</span>
          </Link>

          <button
            type="button"
            onClick={() => setIsMoreSheetOpen(true)}
            className={`mobile-tab-item ${isMoreActive || isMoreSheetOpen ? 'active' : ''}`}
            aria-expanded={isMoreSheetOpen}
            aria-haspopup="dialog"
            aria-label="More navigation items"
          >
            {(isMoreActive || isMoreSheetOpen) && <span className="tab-active-indicator" aria-hidden="true" />}
            <Menu size={20} strokeWidth={isMoreActive || isMoreSheetOpen ? 2.25 : 1.75} />
            <span className="mt-1">More</span>
          </button>
        </nav>

        {/* ── 5. Mobile "More" Bottom Sheet (Below 768px) ── */}
        {/* Bottom Sheet Scrim */}
        <div
          className={`shell-scrim md:hidden ${isMoreSheetOpen ? 'open' : ''}`}
          onClick={() => setIsMoreSheetOpen(false)}
          role="presentation"
          aria-hidden={!isMoreSheetOpen}
        />

        {isMoreSheetOpen && (
          <FocusTrap
            active={isMoreSheetOpen}
            focusTrapOptions={{
              fallbackFocus: '#more-sheet-close-btn',
              allowOutsideClick: true,
            }}
          >
            <div
              className={`shell-bottom-sheet md:hidden ${isMoreSheetOpen ? 'open' : ''}`}
              role="dialog"
              aria-modal="true"
              aria-label="More options"
            >
              {/* Grab Handle */}
              <div className="w-10 h-1 rounded-full bg-border mx-auto mt-3 mb-2" />

              {/* Header */}
              <div className="flex items-center justify-between px-5 py-2 border-b border-border/70 mb-2">
                <span className="font-outfit font-semibold text-base text-text-primary">
                  Menu &amp; Tools
                </span>
                <button
                  id="more-sheet-close-btn"
                  type="button"
                  onClick={() => setIsMoreSheetOpen(false)}
                  className="p-2 -mr-2 rounded-lg text-text-muted hover:text-text-primary min-h-[44px] min-w-[44px] flex items-center justify-center"
                  aria-label="Close menu"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Navigation List */}
              <div className="px-3 py-1 space-y-1">
                <Link
                  to="/practice/history"
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors min-h-[44px] ${isCurrentPath('/practice/history')
                    ? 'bg-primary/10 text-primary font-semibold'
                    : 'text-text-primary hover:bg-surface-1'
                    }`}
                  onClick={() => setIsMoreSheetOpen(false)}
                >
                  <History size={18} className="text-text-muted shrink-0" />
                  <span>History</span>
                </Link>

                <Link
                  to="/analytics"
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors min-h-[44px] ${isCurrentPath('/analytics')
                    ? 'bg-primary/10 text-primary font-semibold'
                    : 'text-text-primary hover:bg-surface-1'
                    }`}
                  onClick={() => setIsMoreSheetOpen(false)}
                >
                  <BarChart3 size={18} className="text-text-muted shrink-0" />
                  <span>Analytics</span>
                </Link>

                <Link
                  to="/achievements"
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors min-h-[44px] ${isCurrentPath('/achievements')
                    ? 'bg-primary/10 text-primary font-semibold'
                    : 'text-text-primary hover:bg-surface-1'
                    }`}
                  onClick={() => setIsMoreSheetOpen(false)}
                >
                  <Award size={18} className="text-text-muted shrink-0" />
                  <span>Achievements</span>
                </Link>

                <Link
                  to="/leaderboard"
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors min-h-[44px] ${isCurrentPath('/leaderboard')
                    ? 'bg-primary/10 text-primary font-semibold'
                    : 'text-text-primary hover:bg-surface-1'
                    }`}
                  onClick={() => setIsMoreSheetOpen(false)}
                >
                  <Trophy size={18} className="text-text-muted shrink-0" />
                  <span>Leaderboard</span>
                </Link>

                <Link
                  to="/review-deck"
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors min-h-[44px] ${isCurrentPath('/review-deck')
                    ? 'bg-primary/10 text-primary font-semibold'
                    : 'text-text-primary hover:bg-surface-1'
                    }`}
                  onClick={() => setIsMoreSheetOpen(false)}
                >
                  <Brain size={18} className="text-text-muted shrink-0" />
                  <span>Review Deck</span>
                </Link>
                <Link
                  to="/study-planner"
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors min-h-[44px] ${isCurrentPath('/study-planner')
                    ? 'bg-primary/10 text-primary font-semibold'
                    : 'text-text-primary hover:bg-surface-1'
                    }`}
                  onClick={() => setIsMoreSheetOpen(false)}
                >
                  <CalendarDays size={18} className="text-text-muted shrink-0" />
                  <span>Study Planner</span>
                </Link>

                {(user?.role === 'admin' || user?.role === 'superAdmin') && (
                  <Link
                    to="/admin"
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors min-h-[44px] ${isCurrentPath('/admin')
                      ? 'bg-primary/10 text-primary font-semibold'
                      : 'text-text-primary hover:bg-surface-1'
                      }`}
                    onClick={() => setIsMoreSheetOpen(false)}
                  >
                    <ShieldAlert size={18} className="text-primary shrink-0" />
                    <span>Admin Console</span>
                  </Link>
                )}

                <div className="my-2 border-t border-border/70" />

                <Link
                  to="/profile"
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors min-h-[44px] ${isCurrentPath('/profile')
                    ? 'bg-primary/10 text-primary font-semibold'
                    : 'text-text-primary hover:bg-surface-1'
                    }`}
                  onClick={() => setIsMoreSheetOpen(false)}
                >
                  <User size={18} className="text-text-muted shrink-0" />
                  <span>Profile</span>
                </Link>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-danger hover:bg-danger-light transition-colors min-h-[44px]"
                >
                  <LogOut size={18} className="shrink-0" />
                  <span>Log out</span>
                </button>
              </div>
            </div>
          </FocusTrap>
        )}
      </div>
    </TopbarProvider>
  );
};
