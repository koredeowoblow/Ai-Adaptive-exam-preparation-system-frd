import * as React from 'react';
import { Link, useLocation } from '@tanstack/react-router';
import { useAuth } from '../../../features/auth/hooks/useAuth';
import { EduAdaptLogo } from '../../../features/auth/components/EduAdaptLogo';
import {
  LayoutDashboard, ClipboardList, BarChart3, Trophy, Award, User,
  BookOpen, MessageSquare, CalendarDays, LogOut, History,
} from 'lucide-react';

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  badge?: string;
}

const NavItem: React.FC<NavItemProps> = ({ to, icon, label, badge }) => {
  const location = useLocation();
  const isActive = location.pathname.startsWith(to) && (to !== '/' || location.pathname === '/');

  return (
    <Link to={to} className={`app-nav-item ${isActive ? 'active' : ''}`}>
      <span style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
        {icon}
        <span>{label}</span>
      </span>
      {badge && (
        <span style={{
          fontSize: '0.65rem',
          fontWeight: 600,
          padding: '2px 7px',
          borderRadius: 999,
          background: 'rgba(255, 255, 255, 0.12)',
          color: '#e2e8f0',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          flexShrink: 0,
        }}>
          {badge}
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
  <div style={{ marginBottom: 16 }}>
    <span className="app-nav-section-label">{label}</span>
    {children}
  </div>
);

interface SidebarProps {
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onClose }) => {
  const { logout, user } = useAuth();
  
  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      // Handled in auth provider
    }
  };

  return (
    <>
      {/* Brand */}
      <div className="app-sidebar-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <EduAdaptLogo size={32} />
          <div>
            <span
              style={{
                fontFamily: "'Outfit', sans-serif",
                fontWeight: 600,
                fontSize: '1rem',
                color: '#ffffff',
                lineHeight: 1,
                margin: 0,
                display: 'block',
              }}
            >
              EduAdapt
            </span>
            <p style={{
              fontSize: '0.65rem',
              fontWeight: 400,
              color: '#94a3b8',
              margin: '2px 0 0',
            }}>Adaptive Learning</p>
          </div>
        </div>
        
        {onClose && (
          <button aria-label="Close sidebar" className="icon-btn admin-close-btn" onClick={onClose} style={{ color: 'rgba(255,255,255,0.7)', padding: 0, margin: 0 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        )}
      </div>

      {/* Navigation — consistent label casing, grouped by function */}
      <nav className="app-nav" style={{ flex: 1 }}>
        <NavSection label="Overview">
          <NavItem to="/dashboard" icon={<LayoutDashboard size={17} />} label="Dashboard" />
        </NavSection>

        <NavSection label="Learn">
          <NavItem to="/exam-prep" icon={<ClipboardList size={17} />} label="Practice" badge="AI" />
          <NavItem to="/courses" icon={<BookOpen size={17} />} label="Courses" />
          <NavItem to="/ai-chat" icon={<MessageSquare size={17} />} label="AI Tutor" badge="New" />
        </NavSection>

        <NavSection label="Progress">
          <NavItem to="/practice/history" icon={<History size={17} />} label="History" />
          <NavItem to="/analytics" icon={<BarChart3 size={17} />} label="Analytics" />
          <NavItem to="/achievements" icon={<Award size={17} />} label="Achievements" />
          <NavItem to="/leaderboard" icon={<Trophy size={17} />} label="Leaderboard" />
        </NavSection>

        <NavSection label="Tools">
          <NavItem to="/study-planner" icon={<CalendarDays size={17} />} label="Study Planner" />
        </NavSection>

        <NavSection label="Account">
          {(user?.role === 'admin' || user?.role === 'superAdmin') && (
            <NavItem to="/admin" icon={<LayoutDashboard size={17} />} label="Admin Console" badge="Staff" />
          )}
          <NavItem to="/profile" icon={<User size={17} />} label="Profile" />
          
          <button 
            onClick={handleLogout}
            className="app-nav-item"
            style={{ width: '100%', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left', color: 'var(--app-nav-fg-muted)' }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
              <LogOut size={17} />
              <span>Log out</span>
            </span>
          </button>
        </NavSection>
      </nav>
    </>
  );
};
