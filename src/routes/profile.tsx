import * as React from 'react';
import { createFileRoute, useNavigate, Link } from '@tanstack/react-router';
import { AppLayout } from '../shared/components/layout/AppLayout';
import { useDocumentTitle } from '../shared/hooks/useDocumentTitle';
import { useStudentProfile, useUpdateProfile, useEnrolledCourses } from '../features/profile/hooks/useProfile';
import { useStudentDashboard } from '../features/dashboard/hooks/useDashboard';
import { useAuth } from '../features/auth/hooks/useAuth';
import { useDepartments } from '../features/curriculum/hooks/useCurriculum';
import {
  Building2, LogOut,
  Mail, GraduationCap, Calendar, Hash, Lock, Shield, Flame, Target,
  Edit3, BookOpen, ExternalLink,
} from 'lucide-react';
import { Skeleton } from '../shared/components/Skeleton';
import { Modal } from '../shared/components/Modal';
import { Button } from '../shared/components/Button';
import { Input } from '../shared/components/Input';
import { Select } from '../shared/components/Select';
import { authApi } from '../features/auth/api/auth.api';
import { useQueryClient } from '@tanstack/react-query';
import type { Department } from '../types/department.types';
import { requireAuth } from '../features/auth/utils/authGuard';

export const Route = createFileRoute('/profile')({
  beforeLoad: async ({ context }) => {
    await requireAuth(context, { allowedRoles: ['student', 'admin', 'superAdmin'] });
  },
  component: ProfileRoute,
});

function ProfileRecordRow({ 
  label, 
  value, 
  icon, 
  loading, 
  isLast,
  action
}: { 
  label: string; 
  value: React.ReactNode; 
  icon?: React.ReactNode; 
  loading?: boolean; 
  isLast?: boolean;
  action?: React.ReactNode;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: isLast ? 'none' : '1px solid var(--color-border)' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--color-text-secondary)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {icon}
          <span>{label}</span>
        </div>
        <div style={{ fontSize: '1rem', color: 'var(--color-text-primary)', fontWeight: 500 }}>
          {loading ? <Skeleton style={{ width: 120, height: 20 }} /> : value}
        </div>
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

function ProfileRoute() {
  useDocumentTitle('Academic Record — EduAdapt');
  const navigate = useNavigate();
  const { data: profile, isLoading: profileLoading } = useStudentProfile();
  const { data: dashData, isLoading: dashLoading } = useStudentDashboard('me');
  const { data: enrolledCourses, isLoading: enrolledLoading } = useEnrolledCourses();
  const { data: departments } = useDepartments();
  const { mutate: updateProfile, isPending: isUpdating } = useUpdateProfile();
  const { user, logout } = useAuth();

  const [isEditOpen, setIsEditOpen] = React.useState(false);
  const [isCoursesModalOpen, setIsCoursesModalOpen] = React.useState(false);

  // Edit form state
  const [nameInput, setNameInput] = React.useState('');
  const [deptInput, setDeptInput] = React.useState('');

  const isLoading = profileLoading || dashLoading;

  const handleLogout = () => {
    logout();
  };

  const displayName = user?.name || profile?.name || 'Student';
  const displayEmail = user?.email || '—';
  const initials = displayName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() || 'ST';

  const handleOpenEdit = () => {
    setNameInput(displayName);
    const currentDeptId = typeof profile?.departmentId === 'object' ? profile.departmentId?._id : (profile?.departmentId || user?.departmentId || '');
    setDeptInput(currentDeptId || '');
    setIsEditOpen(true);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      name: nameInput.trim() || undefined,
      departmentId: deptInput || undefined,
    }, {
      onSuccess: () => {
        setIsEditOpen(false);
      }
    });
  };

  const deptOptions = departments?.map((d: Department) => ({
    value: d._id,
    label: d.name,
  })) || [];

  return (
    <AppLayout userName={displayName}>
      <div className="page-container">
        <div style={{ width: '100%' }}>
          
          {/* ── Profile Banner & Header ── */}
          <div style={{ position: 'relative', marginBottom: 72 }}>
            <div style={{ 
              minHeight: 180,
              borderRadius: '24px', 
              background: 'var(--color-primary)',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 12px 40px rgba(0, 0, 0, 0.08)'
            }}>
              <div style={{ position: 'absolute', top: 24, right: 24, display: 'flex', gap: 'var(--space-12)' }}>
                <button
                  onClick={handleOpenEdit}
                  className="btn"
                  style={{ 
                    display: 'flex', alignItems: 'center', gap: 6, 
                    backgroundColor: 'rgba(255,255,255,0.2)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)', 
                    borderRadius: '20px', padding: '8px 16px', fontSize: '0.9rem',
                    fontWeight: 600, transition: 'background-color 0.2s ease', cursor: 'pointer'
                  }}
                >
                  <Edit3 size={16} /> Edit Profile
                </button>
                <button
                  onClick={handleLogout}
                  className="btn profile-signout-btn"
                  style={{ 
                    display: 'flex', alignItems: 'center', gap: 6, 
                    backgroundColor: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)', 
                    borderRadius: '20px', padding: '8px 16px', fontSize: '0.9rem',
                    fontWeight: 600, transition: 'background-color 0.2s ease', cursor: 'pointer'
                  }}
                >
                  <LogOut size={16} /> Sign out
                </button>
              </div>
            </div>

            {/* Avatar & Info */}
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              marginTop: -70,
              position: 'relative',
              zIndex: 10
            }}>
              <div style={{ 
                width: 'clamp(100px, 12vw, 140px)',
                height: 'clamp(100px, 12vw, 140px)',
                borderRadius: '50%', 
                background: 'var(--color-surface)', 
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 16px 40px rgba(0,0,0,0.12)',
                border: '6px solid var(--color-background)',
                color: 'var(--color-primary)',
                fontSize: 'clamp(1.75rem, 4vw, 3rem)', fontWeight: 800, fontFamily: "'Outfit', sans-serif"
              }}>
                {initials}
              </div>
              
              <h1 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: 'clamp(1.5rem, 4vw, 2.5rem)', margin: '20px 0 4px', color: 'var(--color-text-primary)', textAlign: 'center', letterSpacing: '-0.02em' }}>
                {displayName}
              </h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--color-text-secondary)', fontSize: '1rem', fontWeight: 500 }}>
                <Mail size={16} /> {displayEmail}
              </div>
            </div>
          </div>

          {/* ── Content Grid ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: 32 }}>
            
            {/* Identity Card */}
            <div className="card" style={{ padding: 32, borderRadius: 24, boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 14, background: 'var(--color-primary-light)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Shield size={24} />
                  </div>
                  <div>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 700, fontFamily: "'Outfit', sans-serif", margin: 0, color: 'var(--color-text-primary)', letterSpacing: '-0.01em' }}>Student Identity</h2>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>Official system records</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={handleOpenEdit}>
                  <Edit3 size={14} style={{ marginRight: 6 }} /> Edit
                </Button>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <ProfileRecordRow label="Full Legal Name" value={displayName} icon={<Hash size={16} />} loading={isLoading} />
                <ProfileRecordRow label="Email Address" value={displayEmail} icon={<Mail size={16} />} loading={isLoading} />
                <ProfileRecordRow label="Enrollment Date" value="Fall 2026 (Active)" icon={<Calendar size={16} />} loading={isLoading} />
                <ProfileRecordRow label="Authentication" value="Verified Account" icon={<Lock size={16} />} isLast={true} />
              </div>
            </div>

            {/* Academic Standing Card */}
            <div className="card" style={{ padding: 32, borderRadius: 24, boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 }}>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: 'var(--color-accent-light)', color: 'var(--color-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <GraduationCap size={24} />
                </div>
                <div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 700, fontFamily: "'Outfit', sans-serif", margin: 0, color: 'var(--color-text-primary)', letterSpacing: '-0.01em' }}>Academic Standing</h2>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>Current major & progress</p>
                </div>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <ProfileRecordRow 
                  label="Department" 
                  value={profile?.departmentId?.name || (typeof profile?.departmentId === 'string' ? profile.departmentId : 'Undeclared')} 
                  icon={<Building2 size={16} />} 
                  loading={isLoading}
                  action={
                    <Button variant="ghost" size="sm" onClick={handleOpenEdit}>
                      Change
                    </Button>
                  }
                />
                <ProfileRecordRow 
                  label="Enrolled Courses" 
                  value={`${profile?.enrolledCourses?.length ?? 0} courses`} 
                  icon={<GraduationCap size={16} />} 
                  loading={isLoading} 
                  isLast={true}
                  action={
                    <Button variant="outline" size="sm" onClick={() => setIsCoursesModalOpen(true)}>
                      View Courses
                    </Button>
                  }
                />
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 24 }}>
                  <div className="card-interactive" style={{ padding: 24, background: 'var(--color-surface-0)', border: '1px solid var(--color-border)', borderRadius: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                    <div style={{ color: 'var(--color-primary)', marginBottom: 12, padding: 12, background: 'var(--color-primary-light)', borderRadius: '50%' }}><Target size={28} /></div>
                    <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 6px' }}>Mastery Score</p>
                    <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: '2rem', fontWeight: 800, margin: 0, color: 'var(--color-text-primary)', lineHeight: 1 }}>
                      {isLoading ? <Skeleton style={{ width: 80, height: 36 }} /> : (dashData?.stats?.averageElo != null ? Math.round(dashData.stats.averageElo) : '—')}
                    </p>
                  </div>
                  <div className="card-interactive" style={{ padding: 24, background: 'var(--color-surface-0)', border: '1px solid var(--color-border)', borderRadius: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                    <div style={{ color: 'var(--color-accent)', marginBottom: 12, padding: 12, background: 'var(--color-accent-light)', borderRadius: '50%' }}><Flame size={28} /></div>
                    <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 6px' }}>Day Streak</p>
                    <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: '2rem', fontWeight: 800, margin: 0, color: 'var(--color-text-primary)', lineHeight: 1 }}>
                      {isLoading ? <Skeleton style={{ width: 80, height: 36 }} /> : `${dashData?.streak?.currentStreak ?? 0}d`}
                    </p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* EDIT PROFILE MODAL */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Edit Profile"
        description="Update your personal details and academic department."
        size="md"
      >
        <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-20)' }}>
          <Input
            label="Full Name"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            placeholder="Enter your name"
            required
          />

          <Select
            label="Academic Department"
            value={deptInput}
            onChange={(e) => setDeptInput(e.target.value)}
            options={deptOptions}
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-12)', marginTop: 'var(--space-12)' }}>
            <Button variant="secondary" type="button" onClick={() => setIsEditOpen(false)} disabled={isUpdating}>
              Cancel
            </Button>
            <Button variant="accent" type="submit" isLoading={isUpdating}>
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* VIEW ENROLLED COURSES MODAL */}
      <Modal
        isOpen={isCoursesModalOpen}
        onClose={() => setIsCoursesModalOpen(false)}
        title="Enrolled Courses"
        description="Courses currently associated with your academic track"
        size="lg"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-16)' }}>
          {enrolledLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-12)' }}>
              {[1, 2, 3].map(i => <Skeleton key={i} style={{ height: 60, borderRadius: 8 }} />)}
            </div>
          ) : enrolledCourses && enrolledCourses.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-12)' }}>
              {enrolledCourses.map((c) => (
                <div
                  key={c._id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: 'var(--space-16)',
                    background: 'var(--color-surface-raised)',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--color-border)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-12)' }}>
                    <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--color-primary-light)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <BookOpen size={18} />
                    </div>
                    <div>
                      <p style={{ margin: 0, fontWeight: 600, color: 'var(--color-text)' }}>{c.title}</p>
                      <span className="badge" style={{ marginTop: 2, display: 'inline-block' }}>{c.code}</span>
                    </div>
                  </div>
                  <Link
                    to="/courses/$courseId"
                    params={{ courseId: c._id }}
                    onClick={() => setIsCoursesModalOpen(false)}
                    className="btn btn-sm btn-outline"
                    style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}
                  >
                    <span>View Curriculum</span>
                    <ExternalLink size={14} />
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: 'var(--space-32)', textAlign: 'center', border: '1px dashed var(--color-border)', borderRadius: 'var(--radius-xl)' }}>
              <p className="body-base" style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--space-16)' }}>
                You haven't enrolled in any courses yet.
              </p>
              <Link to="/courses" onClick={() => setIsCoursesModalOpen(false)} className="btn btn-primary" style={{ textDecoration: 'none' }}>
                Browse Catalog
              </Link>
            </div>
          )}
        </div>
      </Modal>

    </AppLayout>
  );
}
