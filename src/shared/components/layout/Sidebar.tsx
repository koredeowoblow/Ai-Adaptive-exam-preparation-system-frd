import * as React from 'react';
import { Link, useLocation } from '@tanstack/react-router';
import { useAuth } from '../../../features/auth/hooks/useAuth';
import { EduAdaptLogo } from '../../../features/auth/components/EduAdaptLogo';
import {
  LayoutDashboard,
  ClipboardList,
  BarChart3,
  Trophy,
  Award,
  User,
  BookOpen,
  MessageSquare,
  CalendarDays,
  LogOut,
  History,
  ShieldAlert,
  Brain,
  X,
} from 'lucide-react';

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  tag?: string;
  showDot?: boolean;
  onClick?: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ to, icon, label, tag, showDot, onClick }) => {
  const location = useLocation();
  // Exact match for dashboard/root, startsWith for others
  const isActive = to === '/dashboard' || to === '/'
    ? location.pathname === '/dashboard' || location.pathname === '/'
    : location.pathname.startsWith(to);

  return (
    <Link
      to={to}
      onClick={onClick}
      aria-current={isActive ? 'page' : undefined}
      className={`app-nav-item group relative flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-all duration-150 select-none ${
        isActive
          ? 'bg-primary/20 text-white font-semibold border-l-[3px] border-primary pl-[9px]'
          : 'text-slate-300 hover:text-white hover:bg-white/5 border-l-[3px] border-transparent pl-[9px]'
      }`}
    >
      <span className={`shrink-0 transition-colors ${isActive ? 'text-primary' : 'text-slate-400 group-hover:text-slate-200'}`}>
        {icon}
      </span>
      <span className="flex-1 truncate">{label}</span>

      {showDot && (
        <span
          className="w-1.5 h-1.5 rounded-full bg-primary shrink-0"
          title="New feature"
          aria-label="New feature indicator"
        />
      )}

      {tag && (
        <span className="text-[10px] font-medium text-slate-400 bg-white/10 px-1.5 py-0.5 rounded shrink-0">
          {tag}
        </span>
      )}
    </Link>
  );
};

interface NavSectionProps {
  label: string;
  children: React.ReactNode;
}

const NavSection: React.FC<NavSectionProps> = ({ label, children }) => (
  <div className="mb-3">
    <span className="text-xs font-semibold text-[var(--sidebar-text-muted)] px-3 mb-1 mt-3 block select-none">
      {label}
    </span>
    <div className="space-y-0.5">{children}</div>
  </div>
);

export interface SidebarProps {
  onClose?: () => void;
  className?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ onClose, className = '' }) => {
  const { logout, user } = useAuth();
  const location = useLocation();

  const [hasVisitedAiTutor, setHasVisitedAiTutor] = React.useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    return localStorage.getItem('visited_ai_tutor') === 'true';
  });

  React.useEffect(() => {
    if (location.pathname === '/ai-chat' && !hasVisitedAiTutor) {
      localStorage.setItem('visited_ai_tutor', 'true');
      setHasVisitedAiTutor(true);
    }
  }, [location.pathname, hasVisitedAiTutor]);

  const handleAiTutorClick = () => {
    if (!hasVisitedAiTutor) {
      localStorage.setItem('visited_ai_tutor', 'true');
      setHasVisitedAiTutor(true);
    }
    if (onClose) onClose();
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      // Handled in auth provider
    }
  };

  const ICON_SIZE = 18;
  const STROKE_WIDTH = 2;

  return (
    <div className={`h-full flex flex-col bg-[var(--sidebar-bg)] border-r border-[var(--sidebar-border)] text-[var(--sidebar-text)] select-none ${className}`}>
      {/* Brand Header */}
      <div className="h-[60px] flex items-center justify-between px-4 border-b border-white/10 shrink-0">
        <Link
          to="/dashboard"
          onClick={onClose}
          className="flex items-center gap-2.5 text-inherit no-underline focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 rounded-lg p-1 -ml-1"
          aria-label="EduAdapt Home"
        >
          <EduAdaptLogo size={28} />
          <div className="flex flex-col">
            <span className="font-outfit font-semibold text-base text-white tracking-tight leading-none">
              EduAdapt
            </span>
            <span className="text-[10px] text-slate-400 leading-none mt-1">
              Adaptive Learning
            </span>
          </div>
        </Link>

        {onClose && (
          <button
            id="drawer-close-btn"
            type="button"
            aria-label="Close navigation"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors md:flex lg:hidden items-center justify-center min-w-[36px] min-h-[36px]"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Navigation Groups */}
      <nav aria-label="Main Navigation" className="flex-1 overflow-y-auto px-2 py-3 space-y-1">
        <NavSection label="Overview">
          <NavItem
            to="/dashboard"
            icon={<LayoutDashboard size={ICON_SIZE} strokeWidth={STROKE_WIDTH} />}
            label="Dashboard"
            onClick={onClose}
          />
        </NavSection>

        <NavSection label="Learn">
          <NavItem
            to="/exam-prep"
            icon={<ClipboardList size={ICON_SIZE} strokeWidth={STROKE_WIDTH} />}
            label="Practice"
            tag="AI"
            onClick={onClose}
          />
          <NavItem
            to="/review-deck"
            icon={<Brain size={ICON_SIZE} strokeWidth={STROKE_WIDTH} />}
            label="Review Deck"
            tag="Leitner"
            onClick={onClose}
          />
          <NavItem
            to="/courses"
            icon={<BookOpen size={ICON_SIZE} strokeWidth={STROKE_WIDTH} />}
            label="Courses"
            onClick={onClose}
          />
          <NavItem
            to="/ai-chat"
            icon={<MessageSquare size={ICON_SIZE} strokeWidth={STROKE_WIDTH} />}
            label="AI Tutor"
            showDot={!hasVisitedAiTutor}
            onClick={handleAiTutorClick}
          />
        </NavSection>

        <NavSection label="Progress">
          <NavItem
            to="/practice/history"
            icon={<History size={ICON_SIZE} strokeWidth={STROKE_WIDTH} />}
            label="History"
            onClick={onClose}
          />
          <NavItem
            to="/analytics"
            icon={<BarChart3 size={ICON_SIZE} strokeWidth={STROKE_WIDTH} />}
            label="Analytics"
            onClick={onClose}
          />
          <NavItem
            to="/achievements"
            icon={<Award size={ICON_SIZE} strokeWidth={STROKE_WIDTH} />}
            label="Achievements"
            onClick={onClose}
          />
          <NavItem
            to="/leaderboard"
            icon={<Trophy size={ICON_SIZE} strokeWidth={STROKE_WIDTH} />}
            label="Leaderboard"
            onClick={onClose}
          />
        </NavSection>

        <NavSection label="Tools">
          <NavItem
            to="/study-planner"
            icon={<CalendarDays size={ICON_SIZE} strokeWidth={STROKE_WIDTH} />}
            label="Study Planner"
            onClick={onClose}
          />
        </NavSection>

        <NavSection label="Account">
          {(user?.role === 'admin' || user?.role === 'superAdmin') && (
            <NavItem
              to="/admin"
              icon={<ShieldAlert size={ICON_SIZE} strokeWidth={STROKE_WIDTH} />}
              label="Admin Console"
              tag="Staff"
              onClick={onClose}
            />
          )}
          <NavItem
            to="/profile"
            icon={<User size={ICON_SIZE} strokeWidth={STROKE_WIDTH} />}
            label="Profile"
            onClick={onClose}
          />

          <button
            type="button"
            onClick={handleLogout}
            className="w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium text-slate-400 hover:text-danger hover:bg-danger/10 transition-colors select-none pl-[9px] border-l-[3px] border-transparent"
          >
            <LogOut size={ICON_SIZE} strokeWidth={STROKE_WIDTH} className="shrink-0" />
            <span className="truncate">Log out</span>
          </button>
        </NavSection>
      </nav>
    </div>
  );
};
