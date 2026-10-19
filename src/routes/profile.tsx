import * as React from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
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
import { Dialog as Modal } from '../shared/components/Dialog';
import { Button } from '../shared/components/Button';
import { Input } from '../shared/components/Input';
import { Select } from '../shared/components/Select';
import type { Department } from '../types/department.types';
import type { Course } from '../types/course.types';
import { curriculumApi } from '../features/curriculum/api/curriculum.api';
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
  useDocumentTitle('Academic Record - EduAdapt');
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
  const [levelInput, setLevelInput] = React.useState<'100L' | '200L' | '300L' | '400L' | '500L'>('100L');
  const [examDateInput, setExamDateInput] = React.useState('');

  // Move to next level promotion state
  const [isPromoteOpen, setIsPromoteOpen] = React.useState(false);
  const [promoteLevel, setPromoteLevel] = React.useState<'100L' | '200L' | '300L' | '400L' | '500L'>('200L');
  const [promoteExamDate, setPromoteExamDate] = React.useState('');
  const [promoteAvailableCourses, setPromoteAvailableCourses] = React.useState<Course[]>([]);
  const [promoteSelectedCourseIds, setPromoteSelectedCourseIds] = React.useState<string[]>([]);
  const [isLoadingPromoteCourses, setIsLoadingPromoteCourses] = React.useState(false);

  const isLoading = profileLoading || dashLoading;

  const handleLogout = () => {
    logout();
  };

  const displayName = user?.name || profile?.name || 'Student';
  const displayEmail = user?.email || '-';
  const initials = displayName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() || 'ST';

  const loadCoursesForLevel = async (lvl: string) => {
    const deptId = typeof profile?.departmentId === 'object' ? profile.departmentId?._id : (profile?.departmentId || user?.departmentId);
    if (!deptId) return;
    setIsLoadingPromoteCourses(true);
    try {
      const res = await curriculumApi.getDepartmentCourses(deptId);
      const items = res.data?.items || (Array.isArray(res.data) ? res.data : []);
      const num = parseInt(lvl.replace('L', ''), 10);
      const matching = items.filter((c: Course) => c.level === num);
      const available = matching.length > 0 ? matching : items;
      setPromoteAvailableCourses(available);
      setPromoteSelectedCourseIds(available.map((c: Course) => c._id));
    } catch {
      setPromoteAvailableCourses([]);
    } finally {
      setIsLoadingPromoteCourses(false);
    }
  };

  const handleOpenPromote = () => {
    const currentLvl = (profile?.level || user?.level || '100L') as '100L' | '200L' | '300L' | '400L' | '500L';
    const nextLvlMap: Record<string, '100L' | '200L' | '300L' | '400L' | '500L'> = {
      '100L': '200L',
      '200L': '300L',
      '300L': '400L',
      '400L': '500L',
      '500L': '500L',
    };
    const targetNext = nextLvlMap[currentLvl] || '200L';
    setPromoteLevel(targetNext);
    setPromoteExamDate(profile?.nextExamDate ? new Date(profile.nextExamDate).toISOString().split('T')[0] : '');
    setIsPromoteOpen(true);
    loadCoursesForLevel(targetNext);
  };

  const handleSavePromotion = (e: React.FormEvent) => {
    e.preventDefault();
    const currentEnrolled = enrolledCourses?.map(c => c._id) || [];
    const mergedCourseIds = Array.from(new Set([...currentEnrolled, ...promoteSelectedCourseIds]));

    updateProfile({
      level: promoteLevel,
      nextExamDate: promoteExamDate ? new Date(promoteExamDate).toISOString() : null,
      enrolledCourseIds: mergedCourseIds,
    }, {
      onSuccess: () => {
        setIsPromoteOpen(false);
      }
    });
  };

  const handleOpenEdit = () => {
    setNameInput(displayName);
    const currentDeptId = typeof profile?.departmentId === 'object' ? profile.departmentId?._id : (profile?.departmentId || user?.departmentId || '');
    setDeptInput(currentDeptId || '');
    setLevelInput((profile?.level || user?.level || '100L') as any);
    const existingDate = profile?.nextExamDate || user?.nextExamDate;
    setExamDateInput(existingDate ? new Date(existingDate).toISOString().split('T')[0] : '');
    setIsEditOpen(true);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      name: nameInput.trim() || undefined,
      departmentId: deptInput || undefined,
      level: levelInput || undefined,
      nextExamDate: examDateInput ? new Date(examDateInput).toISOString() : null,
    }, {
      onSuccess: () => {
        setIsEditOpen(false);
      }
    });
  };

  const levelOptions = [
    { value: '100L', label: '100 Level (100L)' },
    { value: '200L', label: '200 Level (200L)' },
    { value: '300L', label: '300 Level (300L)' },
    { value: '400L', label: '400 Level (400L)' },
    { value: '500L', label: '500 Level (500L)' },
  ];

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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: 'var(--space-24)' }}>
            
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
                  label="Academic Level" 
                  value={
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span>{profile?.level || user?.level || '100L'}</span>
                      <span style={{ fontSize: '0.72rem', padding: '1px 8px', borderRadius: 10, background: 'var(--color-primary-light)', color: 'var(--color-primary)', fontWeight: 600 }}>
                        Active
                      </span>
                    </div>
                  } 
                  icon={<GraduationCap size={16} />} 
                  loading={isLoading}
                  action={
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <Button variant="primary" size="sm" onClick={handleOpenPromote}>
                        Move to Next Level
                      </Button>
                      <Button variant="ghost" size="sm" onClick={handleOpenEdit}>
                        Change
                      </Button>
                    </div>
                  }
                />
                <ProfileRecordRow 
                  label="Next Exam Date" 
                  value={
                    profile?.nextExamDate ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span>{new Date(profile.nextExamDate).toLocaleDateString(undefined, { dateStyle: 'medium' })}</span>
                        <span style={{ fontSize: '0.72rem', padding: '1px 8px', borderRadius: 10, background: 'var(--color-surface-1)', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
                          {Math.max(0, Math.ceil((new Date(profile.nextExamDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))} days left
                        </span>
                      </div>
                    ) : 'Not scheduled'
                  } 
                  icon={<Calendar size={16} />} 
                  loading={isLoading}
                  action={
                    <Button variant="ghost" size="sm" onClick={handleOpenEdit}>
                      {profile?.nextExamDate ? 'Edit Date' : 'Set Date'}
                    </Button>
                  }
                />
                <ProfileRecordRow 
                  label="Enrolled Courses" 
                  value={`${profile?.enrolledCourses?.length ?? 0} courses`} 
                  icon={<BookOpen size={16} />} 
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

          <Select
            label="Academic Level"
            value={levelInput}
            onChange={(e) => setLevelInput(e.target.value as any)}
            options={levelOptions}
          />

          <Input
            label="Target Next Exam Date"
            type="date"
            value={examDateInput}
            min={new Date().toISOString().split('T')[0]}
            onChange={(e) => setExamDateInput(e.target.value)}
            helperText="Calibrates the study planner timeline and daily prep tasks."
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

      {/* MOVE TO NEXT LEVEL PROMOTION MODAL */}
      <Modal
        isOpen={isPromoteOpen}
        onClose={() => setIsPromoteOpen(false)}
        title="Move to a New Level"
        description="Advance your academic year, enroll in your new level's curriculum, and set your upcoming exam deadline."
        size="lg"
      >
        <form onSubmit={handleSavePromotion} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-20)' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            background: 'var(--color-primary-light)',
            borderRadius: 12,
            border: '1px solid var(--color-border)',
          }}>
            <div>
              <p style={{ margin: '0 0 2px', fontSize: '0.8rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>
                Current Level
              </p>
              <p style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                {profile?.level || user?.level || '100L'}
              </p>
            </div>
            <div style={{ fontSize: '1.25rem', color: 'var(--color-primary)' }}>→</div>
            <div>
              <p style={{ margin: '0 0 2px', fontSize: '0.8rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>
                Promoting To
              </p>
              <p style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                {promoteLevel}
              </p>
            </div>
          </div>

          <Select
            label="Select New Academic Level"
            value={promoteLevel}
            onChange={(e) => {
              const newLvl = e.target.value as any;
              setPromoteLevel(newLvl);
              loadCoursesForLevel(newLvl);
            }}
            options={levelOptions}
          />

          <Input
            label="Next Exam Date for this Level"
            type="date"
            value={promoteExamDate}
            min={new Date().toISOString().split('T')[0]}
            onChange={(e) => setPromoteExamDate(e.target.value)}
            helperText="Set your upcoming semester or certification exam date for your new academic year."
          />

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-text)' }}>
                Select {promoteLevel} Courses to Enroll In:
              </span>
              {promoteAvailableCourses.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    if (promoteSelectedCourseIds.length === promoteAvailableCourses.length) {
                      setPromoteSelectedCourseIds([]);
                    } else {
                      setPromoteSelectedCourseIds(promoteAvailableCourses.map(c => c._id));
                    }
                  }}
                  style={{ all: 'unset', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-primary)' }}
                >
                  {promoteSelectedCourseIds.length === promoteAvailableCourses.length ? 'Deselect All' : 'Select All'}
                </button>
              )}
            </div>

            {isLoadingPromoteCourses ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[1, 2, 3].map(i => <Skeleton key={i} style={{ height: 50, borderRadius: 8 }} />)}
              </div>
            ) : promoteAvailableCourses.length === 0 ? (
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                No courses currently found for {promoteLevel} in this department. You can still advance and enroll in courses anytime in the catalog.
              </p>
            ) : (
              <div style={{ maxHeight: 200, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8, paddingRight: 4 }}>
                {promoteAvailableCourses.map(c => {
                  const isChecked = promoteSelectedCourseIds.includes(c._id);
                  return (
                    <label
                      key={c._id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 14px',
                        background: isChecked ? 'var(--color-surface-raised)' : 'var(--color-surface-0)',
                        border: `1px solid ${isChecked ? 'var(--color-primary)' : 'var(--color-border)'}`,
                        borderRadius: 8,
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--color-primary)' }}>{c.code}</span>
                        <span style={{ fontSize: '0.85rem', color: 'var(--color-text)' }}>{c.title}</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {
                          setPromoteSelectedCourseIds(prev =>
                            prev.includes(c._id) ? prev.filter(id => id !== c._id) : [...prev, c._id]
                          );
                        }}
                        style={{ accentColor: 'var(--color-primary)' }}
                      />
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8 }}>
            <Button variant="secondary" type="button" onClick={() => setIsPromoteOpen(false)} disabled={isUpdating}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={isUpdating}>
              Confirm & Advance to {promoteLevel}
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
