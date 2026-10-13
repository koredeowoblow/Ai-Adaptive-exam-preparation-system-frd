import * as React from 'react';
import { Link, Outlet } from '@tanstack/react-router';
import {
  LayoutDashboard,
  Building2,
  BookOpen,
  Layers,
  HelpCircle,
  Users,
  Activity,
  ShieldAlert,
  BarChart3,
  Menu,
  X,
  LogOut,
  ArrowUpRight,
  Sun,
  Moon,
} from 'lucide-react';
import { FocusTrap } from 'focus-trap-react';
import { useAuth } from '../../../features/auth/hooks/useAuth';
import { useTheme } from '../../../shared/hooks/useTheme';
import {
  useDepartments,
  useCourses,
  useTopics,
  useQuestions,
  useUsers,
} from '../hooks/useAdmin';

export const AdminLayout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  const { data: deptData } = useDepartments();
  const { data: courseData } = useCourses();
  const { data: topicData } = useTopics();
  const { data: questionData } = useQuestions();
  const { data: userData } = useUsers();

  const departments = Array.isArray(deptData) ? deptData : [];
  const deptCount = departments.length;
  const courseCount = (courseData?.pages as any)?.[0]?.total ?? (courseData?.pages?.flatMap(p => p.items)?.length || undefined);
  const topicCount = (topicData?.pages as any)?.[0]?.total ?? (topicData?.pages?.flatMap(p => p.items)?.length || undefined);
  const questionCount = questionData?.total ?? questionData?.items?.length;
  const userCount = userData?.total ?? userData?.items?.length;
  const userInitial = user?.name ? user.name.trim().charAt(0).toUpperCase() : 'S';

  const handleOverlayClick = () => setIsSidebarOpen(false);

  const handleLogout = async () => {
    await logout();
  };

  const navSections = [
    {
      title: 'Console',
      items: [
        {
          to: '/admin',
          label: 'Overview',
          icon: <LayoutDashboard size={18} />,
          badge: undefined,
          exact: true,
        },
      ],
    },
    {
      title: 'User Management',
      items: [
        {
          to: '/admin/users',
          label: 'Students & Users',
          icon: <Users size={18} />,
          badge: userCount,
          exact: false,
        },
      ],
    },
    {
      title: 'Curriculum Architecture',
      items: [
        {
          to: '/admin/departments',
          label: 'Departments',
          icon: <Building2 size={18} />,
          badge: deptCount,
          exact: false,
        },
        {
          to: '/admin/courses',
          label: 'Courses',
          icon: <BookOpen size={18} />,
          badge: courseCount,
          exact: false,
        },
        {
          to: '/admin/topics',
          label: 'Topics',
          icon: <Layers size={18} />,
          badge: topicCount,
          exact: false,
        },
      ],
    },
    {
      title: 'Assessment Engine',
      items: [
        {
          to: '/admin/questions',
          label: 'Question Bank',
          icon: <HelpCircle size={18} />,
          badge: questionCount,
          exact: false,
        },
        {
          to: '/admin/sessions',
          label: 'Exam Sessions',
          icon: <Activity size={18} />,
          exact: false,
        },
      ],
    },
    {
      title: 'Surveillance & Intelligence',
      items: [
        {
          to: '/admin/integrity',
          label: 'Anti-Cheat Monitor',
          icon: <ShieldAlert size={18} />,
          exact: false,
        },
        {
          to: '/admin/analytics',
          label: 'Mastery Analytics',
          icon: <BarChart3 size={18} />,
          exact: false,
        },
      ],
    },
  ];

  return (
    <div className="admin-layout">
      {/* Mobile overlay */}
      <div
        className={`admin-overlay ${isSidebarOpen ? 'open' : ''}`}
        onClick={handleOverlayClick}
        aria-hidden="true"
      />

      {/* Sidebar */}
      <FocusTrap
        active={isSidebarOpen}
        focusTrapOptions={{
          clickOutsideDeactivates: true,
          onDeactivate: () => setIsSidebarOpen(false),
        }}
      >
        <aside className={`admin-sidebar ${isSidebarOpen ? 'open' : ''}`}>
          {/* Brand & System Status */}
          <div
            style={{
              backgroundColor: isDark ? 'rgba(15, 23, 42, 0.85)' : 'var(--color-surface-raised, #f8fafc)',
              borderRadius: 'var(--radius-md)',
              padding: '10px 12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 'var(--space-24)',
              border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid var(--color-border)',
              boxShadow: isDark ? '0 2px 6px rgba(0, 0, 0, 0.25)' : 'var(--shadow-sm, 0 1px 3px rgba(0, 0, 0, 0.05))',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '6px',
                  backgroundColor: 'var(--color-primary, #0ea5e9)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '0.95rem',
                  boxShadow: '0 1px 4px rgba(14, 165, 233, 0.35)',
                }}
              >
                E
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span
                  style={{
                    fontWeight: 800,
                    fontSize: '0.85rem',
                    color: isDark ? '#ffffff' : 'var(--color-text)',
                    letterSpacing: '0.04em',
                    lineHeight: 1.15,
                  }}
                >
                  EDUADAPT
                </span>
                <span
                  style={{
                    fontSize: '0.62rem',
                    fontWeight: 600,
                    color: isDark ? '#94a3b8' : 'var(--color-text-muted)',
                    letterSpacing: '0.08em',
                    lineHeight: 1.2,
                  }}
                >
                  COMMAND CENTRE
                </span>
              </div>
            </div>

            {/* Close button for mobile */}
            <button
              className="admin-close-btn"
              onClick={() => setIsSidebarOpen(false)}
              aria-label="Close Menu"
              style={{ color: isDark ? '#ffffff' : 'var(--color-text)' }}
            >
              <X size={18} />
            </button>
          </div>

          {/* Navigation Sections */}
          <nav style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            {navSections.map((section) => (
              <div key={section.title} className="admin-nav-section">
                <span className="admin-nav-section-label">{section.title}</span>
                {section.items.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    activeOptions={{
                      exact: item.exact,
                      includeSearch: false,
                      includeHash: false,
                    }}
                    className="admin-nav-item"
                    activeProps={{ className: 'active' }}
                    onClick={() => setIsSidebarOpen(false)}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-12)' }}>
                      {item.icon}
                      <span>{item.label}</span>
                    </span>
                    {item.badge !== undefined && (
                      <span className="admin-nav-badge">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            ))}

            {/* Switch to Student Portal Link */}
            <div className="admin-nav-section" style={{ marginTop: 'auto', paddingTop: 'var(--space-16)' }}>
              <span className="admin-nav-section-label">Portal Switcher</span>
              <Link
                to="/courses"
                className="admin-nav-item"
                style={{ border: '1px dashed var(--color-border)', backgroundColor: 'var(--color-surface-0)' }}
                onClick={() => setIsSidebarOpen(false)}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-12)' }}>
                  <ArrowUpRight size={16} color="var(--color-primary)" />
                  <span style={{ fontWeight: 600, color: 'var(--color-primary)' }}>Student Course View</span>
                </span>
                <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Preview</span>
              </Link>
            </div>

            {/* Admin User Profile Card & Sign Out */}
            <div className="admin-user-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--color-primary-light)',
                    color: 'var(--color-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    flexShrink: 0,
                    border: '1px solid var(--color-primary-border)',
                  }}
                >
                  {user?.name ? user.name.slice(0, 2).toUpperCase() : 'AD'}
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div
                    style={{
                      fontWeight: 600,
                      fontSize: '0.85rem',
                      color: 'var(--color-text)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {user?.name || 'Administrator'}
                  </div>
                  <div
                    style={{
                      fontSize: '0.72rem',
                      color: 'var(--color-text-muted)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {user?.email || 'admin@eduadapt.com'}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '8px', borderTop: '1px solid var(--color-border)' }}>
                <span
                  style={{
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    backgroundColor: 'var(--color-surface-raised)',
                    color: 'var(--color-text-secondary)',
                  }}
                >
                  {user?.role === 'superAdmin' ? 'Super Admin' : 'System Admin'}
                </span>

                <button
                  onClick={handleLogout}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--color-danger)',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    padding: '4px 6px',
                    borderRadius: '4px',
                  }}
                  title="Sign out of Admin Console"
                >
                  <LogOut size={13} />
                  <span>Log out</span>
                </button>
              </div>
            </div>
          </nav>
        </aside>
      </FocusTrap>



      {/* Main Content Area */}
      <main className="admin-main">
        {/* Top Navigation Bar matching Command Centre layout */}
        <header className="admin-header-nav">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              className="admin-hamburger-btn"
              onClick={() => setIsSidebarOpen(true)}
              aria-label="Open Menu"
              style={{ padding: 0 }}
            >
              <Menu size={20} />
            </button>
            <span
              style={{
                width: '3.5px',
                height: '18px',
                borderRadius: '2px',
                backgroundColor: '#eab308',
                display: 'inline-block',
              }}
            />
            <span
              style={{
                fontWeight: 700,
                fontSize: '0.925rem',
                color: 'var(--color-text-primary)',
                letterSpacing: '-0.01em',
              }}
            >
              EduAdapt Platform
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>


            {/* Light / Dark Mode Toggle Button */}
            <button
              onClick={toggleTheme}
              className="admin-header-icon-btn"
              title={isDark ? 'Switch to Light mode' : 'Switch to Dark mode'}
              aria-label={isDark ? 'Switch to Light mode' : 'Switch to Dark mode'}
              id="admin-theme-toggle-btn"
            >
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {/* User Avatar Circle */}
            <div
              title={`${user?.name || 'Administrator'} (${user?.role || 'Admin'})`}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: isDark ? 'var(--color-surface-raised)' : 'var(--color-primary-light)',
                color: isDark ? '#ffffff' : 'var(--color-primary)',
                border: isDark ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid var(--color-primary-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '0.85rem',
                flexShrink: 0,
                userSelect: 'none',
              }}
            >
              {userInitial}
            </div>
          </div>
        </header>

        {/* Main Content Body */}
        <div className="admin-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
