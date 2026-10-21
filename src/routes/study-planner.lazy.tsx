import { createLazyFileRoute, Link } from '@tanstack/react-router';
import * as React from 'react';
import { AppLayout } from '../shared/components/layout/AppLayout';
import { useDocumentTitle } from '../shared/hooks/useDocumentTitle';
import { useAuth } from '../features/auth/hooks/useAuth';
import {
  useStudentProfile,
  useEnrolledCourses,
  useUpdateCourseExamDates,
  useUpdateProfile,
} from '../features/profile/hooks/useProfile';
import {
  useActiveStudyPlan,
  useGenerateStudyPlan,
  useGenerateWeek,
  useRetryWeek,
  useToggleTask,
} from '../features/study-plan/hooks/useStudyPlan';
import {
  Sparkles,
  Calendar,
  Clock,
  CheckCircle2,
  Circle,
  AlertTriangle,
  RefreshCw,
  Layers,
  GraduationCap,
  Save,
} from 'lucide-react';
import { Dialog as Modal } from '../shared/components/Dialog';
import { Button } from '../shared/components/Button';
import { Input } from '../shared/components/Input';
import { Select } from '../shared/components/Select';
import { Skeleton } from '../shared/components/Skeleton';
import { curriculumApi } from '../features/curriculum/api/curriculum.api';
import type { Course } from '../types/course.types';
import type { StudyPlanWeek } from '../types/studyPlan.types';

export const Route = createLazyFileRoute('/study-planner')({
  component: StudyPlannerRoute,
});

const TASK_TYPE_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  STUDY: {
    bg: 'var(--color-primary-light, rgba(79, 70, 229, 0.12))',
    color: 'var(--color-primary, #6366f1)',
    label: 'Concept Study',
  },
  PRACTICE: {
    bg: 'rgba(168, 85, 247, 0.12)',
    color: '#a855f7',
    label: 'Practice Drill',
  },
  REVISION: {
    bg: 'rgba(245, 158, 11, 0.12)',
    color: '#f59e0b',
    label: 'Light Revision',
  },
  EXAM_PREP: {
    bg: 'rgba(239, 68, 68, 0.12)',
    color: '#ef4444',
    label: 'Exam Prep',
  },
};

function getDaysRemaining(targetDateStr?: string | null): number | null {
  if (!targetDateStr) return null;
  const cleanStr = targetDateStr.includes('T') ? targetDateStr.split('T')[0] : targetDateStr;
  const [y, m, d] = cleanStr.split('-').map(Number);
  if (!y || !m || !d) return null;
  const targetUtc = Date.UTC(y, m - 1, d);
  const now = new Date();
  const todayUtc = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((targetUtc - todayUtc) / (1000 * 60 * 60 * 24));
}

function StudyPlannerRoute() {
  useDocumentTitle('Study Planner - EduAdapt');
  const { user } = useAuth();
  const { data: profile, isLoading: isProfileLoading } = useStudentProfile();
  const { data: enrolledCourses, isLoading: isCoursesLoading } = useEnrolledCourses();
  const { data: activePlan, isLoading: isPlanLoading } = useActiveStudyPlan();

  const { mutate: generatePlan, isPending: isGeneratingPlan } = useGenerateStudyPlan();
  const { mutate: generateWeek, isPending: isGeneratingWeek } = useGenerateWeek();
  const { mutate: retryWeek, isPending: isRetryingWeek } = useRetryWeek();
  const { mutate: toggleTask } = useToggleTask();
  const { mutate: saveExamDates, isPending: isSavingDates } = useUpdateCourseExamDates();
  const { mutate: updateProfile, isPending: isUpdatingProfile } = useUpdateProfile();

  // Selected week view state
  const [selectedWeekNum, setSelectedWeekNum] = React.useState<number>(1);
  const [isDatesModalOpen, setIsDatesModalOpen] = React.useState<boolean>(false);
  const [draftCourseDates, setDraftCourseDates] = React.useState<Record<string, string>>({});

  // Level Promotion modal state
  const [isPromoteOpen, setIsPromoteOpen] = React.useState(false);
  const [promoteLevel, setPromoteLevel] = React.useState<'100L' | '200L' | '300L' | '400L' | '500L'>('200L');
  const [promoteSelectedCourseIds, setPromoteSelectedCourseIds] = React.useState<string[]>([]);
  const [promoteExamDate, setPromoteExamDate] = React.useState('');
  const [promoteAvailableCourses, setPromoteAvailableCourses] = React.useState<Course[]>([]);
  const [isLoadingPromoteCourses, setIsLoadingPromoteCourses] = React.useState(false);

  const effectiveWeekNum = React.useMemo(() => {
    if (!activePlan?.weeks?.length) return 1;
    if (activePlan.weeks.some((w) => w.weekNumber === selectedWeekNum)) {
      return selectedWeekNum;
    }
    return 1;
  }, [activePlan, selectedWeekNum]);

  const coursesList = React.useMemo(() => {
    return (enrolledCourses || []) as Course[];
  }, [enrolledCourses]);

  const nearestExamDays = getDaysRemaining(profile?.nextExamDate || user?.nextExamDate);

  const handleOpenDatesModal = () => {
    const initial: Record<string, string> = {};
    for (const c of coursesList) {
      const existing = profile?.courseExamDates?.[c._id] || '';
      initial[c._id] = existing.includes('T') ? existing.split('T')[0] : existing;
    }
    setDraftCourseDates(initial);
    setIsDatesModalOpen(true);
  };

  const handleSaveCourseDates = (e: React.FormEvent) => {
    e.preventDefault();
    // Filter out empty dates
    const payload: Record<string, string> = {};
    for (const [cId, dStr] of Object.entries(draftCourseDates)) {
      if (dStr && dStr.trim()) {
        payload[cId] = dStr.trim();
      }
    }

    saveExamDates(payload, {
      onSuccess: () => {
        setIsDatesModalOpen(false);
      },
    });
  };

  const handleGeneratePlan = () => {
    generatePlan();
  };

  const handleToggleTask = (taskId: string, currentCompleted: boolean) => {
    if (!activePlan) return;
    toggleTask({
      planId: activePlan._id,
      taskId,
      completed: !currentCompleted,
    });
  };

  // Promotion helpers
  const handleOpenPromote = () => {
    const curLevel = profile?.level || user?.level || '100L';
    const nextMap: Record<string, '200L' | '300L' | '400L' | '500L'> = {
      '100L': '200L',
      '200L': '300L',
      '300L': '400L',
      '400L': '500L',
    };
    const nextLvl = nextMap[curLevel] || '200L';
    setPromoteLevel(nextLvl);
    setPromoteSelectedCourseIds([]);
    setPromoteExamDate(profile?.nextExamDate ? profile.nextExamDate.split('T')[0] : '');
    setIsPromoteOpen(true);
    loadCoursesForLevel(nextLvl);
  };

  const loadCoursesForLevel = async (lvl: string) => {
    const deptId = typeof profile?.departmentId === 'object' ? profile.departmentId?._id : (profile?.departmentId || user?.departmentId);
    if (!deptId) return;
    setIsLoadingPromoteCourses(true);
    try {
      const numLevel = parseInt(lvl.replace(/\D/g, ''), 10) || 100;
      const res = await curriculumApi.getDepartmentCourses(deptId);
      const items = res.data?.items || [];
      const filtered = items.filter((c: Course) => c.level === numLevel);
      setPromoteAvailableCourses(filtered);
      setPromoteSelectedCourseIds(filtered.map((c: Course) => c._id));
    } catch {
      setPromoteAvailableCourses([]);
    } finally {
      setIsLoadingPromoteCourses(false);
    }
  };

  const handleSavePromotion = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile(
      {
        level: promoteLevel,
        nextExamDate: promoteExamDate ? new Date(promoteExamDate).toISOString() : null,
        enrolledCourseIds: promoteSelectedCourseIds,
      },
      {
        onSuccess: () => {
          setIsPromoteOpen(false);
        },
      }
    );
  };

  const selectedWeek: StudyPlanWeek | undefined = activePlan?.weeks?.find(
    (w) => w.weekNumber === effectiveWeekNum
  ) || activePlan?.weeks?.[0];

  const todayStr = React.useMemo(() => {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Lagos' }).format(new Date());
  }, []);

  return (
    <AppLayout>
      <div className="container" style={{ paddingBottom: 'var(--space-64, 64px)' }}>
        {/* TOP HERO / HEADER */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            marginBottom: 'var(--space-28, 28px)',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <h1
                style={{
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: '2rem',
                  fontWeight: 800,
                  letterSpacing: '-0.02em',
                  margin: 0,
                  color: 'var(--color-text-primary, #fff)',
                }}
              >
                Adaptive Study Planner
              </h1>
              {activePlan && (
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    padding: '3px 10px',
                    borderRadius: 20,
                    background: 'rgba(16, 185, 129, 0.15)',
                    color: 'var(--color-success, #10b981)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                  }}
                >
                  Active Plan
                </span>
              )}
            </div>
            <p style={{ margin: 0, fontSize: '0.92rem', color: 'var(--color-text-secondary, #94a3b8)' }}>
              Personalized weekly syllabus, spaced repetition, and daily concept drills calibrated to your exams.
            </p>
          </div>

          {/* QUICK ACTIONS */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenDatesModal}
              id="btn-manage-course-exam-dates"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <Calendar size={15} />
              <span>Course Exam Dates</span>
            </Button>

            <Button
              variant="secondary"
              size="sm"
              onClick={handleOpenPromote}
              id="btn-move-to-next-level"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <GraduationCap size={15} />
              <span>Academic Level</span>
            </Button>

            {activePlan ? (
              <Button
                variant="primary"
                size="sm"
                onClick={handleGeneratePlan}
                isLoading={isGeneratingPlan}
                id="btn-regenerate-study-plan"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <RefreshCw size={15} className={isGeneratingPlan ? 'animate-spin' : ''} />
                <span>Regenerate Plan</span>
              </Button>
            ) : (
              <Button
                variant="accent"
                size="sm"
                onClick={handleGeneratePlan}
                isLoading={isGeneratingPlan}
                id="btn-create-study-plan"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <Sparkles size={15} />
                <span>Generate Plan</span>
              </Button>
            )}
          </div>
        </div>

        {/* STALE PLAN WARNING BANNER */}
        {activePlan?.stale && (
          <div
            id="stale-plan-banner"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 16,
              padding: '14px 20px',
              borderRadius: 14,
              background: 'rgba(245, 158, 11, 0.1)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              marginBottom: 24,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: 'rgba(245, 158, 11, 0.2)',
                  color: '#f59e0b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <AlertTriangle size={18} />
              </div>
              <div>
                <h4 style={{ margin: '0 0 2px', fontSize: '0.9rem', fontWeight: 700, color: '#f59e0b' }}>
                  Exam Schedules Have Changed
                </h4>
                <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--color-text-secondary)' }}>
                  Your registered course dates were modified after this study plan was generated. Regenerate now to align all daily topics and revision deadlines.
                </p>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleGeneratePlan}
              isLoading={isGeneratingPlan}
              style={{
                borderColor: 'rgba(245, 158, 11, 0.4)',
                color: '#f59e0b',
                whiteSpace: 'nowrap',
              }}
            >
              Regenerate Plan
            </Button>
          </div>
        )}

        {/* LOADING STATE */}
        {(isPlanLoading || isProfileLoading || isCoursesLoading) && !activePlan && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Skeleton style={{ height: 120, borderRadius: 16 }} />
            <Skeleton style={{ height: 350, borderRadius: 16 }} />
          </div>
        )}

        {/* EMPTY STATE: NO ACTIVE PLAN */}
        {!isPlanLoading && !activePlan && (
          <div
            id="empty-plan-hero"
            className="card-interactive"
            style={{
              padding: '48px 32px',
              borderRadius: 20,
              background: 'var(--color-surface-0, rgba(255, 255, 255, 0.03))',
              border: '1px solid var(--color-border)',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              maxWidth: 720,
              margin: '32px auto',
            }}
          >
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: 'var(--color-primary-light, rgba(99, 102, 241, 0.15))',
                color: 'var(--color-primary, #6366f1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 20,
              }}
            >
              <Sparkles size={32} />
            </div>

            <h2
              style={{
                fontFamily: "'Outfit', sans-serif",
                fontSize: '1.75rem',
                fontWeight: 800,
                margin: '0 0 10px',
                color: 'var(--color-text-primary, #fff)',
              }}
            >
              Build Your Adaptive Study Blueprint
            </h2>

            <p
              style={{
                fontSize: '0.95rem',
                color: 'var(--color-text-secondary)',
                lineHeight: 1.6,
                maxWidth: 540,
                margin: '0 0 28px',
              }}
            >
              Our algorithmic engine computes optimal study intervals, spaces topic drills, avoids course scheduling after your exams, and balances max 6 high-yield tasks per day.
            </p>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: 16,
                width: '100%',
                marginBottom: 32,
                textAlign: 'left',
              }}
            >
              <div
                style={{
                  padding: 16,
                  borderRadius: 12,
                  background: 'var(--color-surface-raised, rgba(255,255,255,0.02))',
                  border: '1px solid var(--color-border)',
                }}
              >
                <div style={{ color: 'var(--color-primary)', marginBottom: 8 }}>
                  <Calendar size={18} />
                </div>
                <h4 style={{ margin: '0 0 4px', fontSize: '0.85rem', fontWeight: 700 }}>Single Source of Truth</h4>
                <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>
                  Calibrated to your exact course dates with zero calendar gaps.
                </p>
              </div>

              <div
                style={{
                  padding: 16,
                  borderRadius: 12,
                  background: 'var(--color-surface-raised, rgba(255,255,255,0.02))',
                  border: '1px solid var(--color-border)',
                }}
              >
                <div style={{ color: '#a855f7', marginBottom: 8 }}>
                  <Layers size={18} />
                </div>
                <h4 style={{ margin: '0 0 4px', fontSize: '0.85rem', fontWeight: 700 }}>Continuous Weekly Blocks</h4>
                <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>
                  Week 1 is ready immediately; subsequent weeks generate on demand.
                </p>
              </div>

              <div
                style={{
                  padding: 16,
                  borderRadius: 12,
                  background: 'var(--color-surface-raised, rgba(255,255,255,0.02))',
                  border: '1px solid var(--color-border)',
                }}
              >
                <div style={{ color: '#10b981', marginBottom: 8 }}>
                  <CheckCircle2 size={18} />
                </div>
                <h4 style={{ margin: '0 0 4px', fontSize: '0.85rem', fontWeight: 700 }}>Exam Day Light Revision</h4>
                <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>
                  Prevents cognitive overload on test days with light formulas review.
                </p>
              </div>
            </div>

            <Button
              variant="accent"
              size="lg"
              onClick={handleGeneratePlan}
              isLoading={isGeneratingPlan}
              id="btn-create-first-plan"
              style={{ padding: '12px 32px', fontSize: '1rem', fontWeight: 700 }}
            >
              <Sparkles size={18} style={{ marginRight: 8 }} />
              <span>Generate My Study Plan</span>
            </Button>
          </div>
        )}

        {/* ACTIVE STUDY PLAN VIEW */}
        {activePlan && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* STATS OVERVIEW CARD */}
            <div
              style={{
                padding: '24px 28px',
                borderRadius: 18,
                background: 'var(--color-surface-0, rgba(255, 255, 255, 0.03))',
                border: '1px solid var(--color-border)',
                display: 'flex',
                flexDirection: 'column',
                gap: 20,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 16,
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <h2
                      style={{
                        fontFamily: "'Outfit', sans-serif",
                        fontSize: '1.35rem',
                        fontWeight: 700,
                        margin: 0,
                      }}
                    >
                      Overall Preparation Progress
                    </h2>
                    <span
                      style={{
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        padding: '2px 10px',
                        borderRadius: 12,
                        background: 'var(--color-primary-light)',
                        color: 'var(--color-primary)',
                      }}
                    >
                      {activePlan.completionPercentage}% Complete
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--color-text-secondary)' }}>
                    Active Timeline: {activePlan.startDate} to {activePlan.endDate} ({activePlan.totalWeeks} total weeks)
                  </p>
                </div>

                {/* METRICS ROW */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                      Completed
                    </span>
                    <p style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>
                      {activePlan.completedTasks} / {activePlan.totalTasks}
                    </p>
                  </div>

                  <div style={{ width: 1, height: 32, background: 'var(--color-border)' }} />

                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                      Earliest Exam
                    </span>
                    <p style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#f59e0b' }}>
                      {nearestExamDays != null ? `${nearestExamDays}d left` : 'None'}
                    </p>
                  </div>
                </div>
              </div>

              {/* PROGRESS BAR */}
              <div
                style={{
                  width: '100%',
                  height: 8,
                  borderRadius: 10,
                  background: 'var(--color-surface-raised, rgba(255,255,255,0.06))',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${Math.min(100, Math.max(0, activePlan.completionPercentage))}%`,
                    borderRadius: 10,
                    background: 'linear-gradient(90deg, var(--color-primary, #6366f1), var(--color-accent, #10b981))',
                    transition: 'width 0.4s ease',
                  }}
                />
              </div>
            </div>

            {/* WEEKS TABS SKELETON */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                overflowX: 'auto',
                paddingBottom: 6,
              }}
            >
              {activePlan.weeks.map((w) => {
                const isSelected = w.weekNumber === selectedWeekNum;
                const isReady = w.status === 'READY';
                const isGenerating = w.status === 'GENERATING';

                return (
                  <button
                    key={w.weekNumber}
                    type="button"
                    onClick={() => setSelectedWeekNum(w.weekNumber)}
                    id={`tab-week-${w.weekNumber}`}
                    style={{
                      all: 'unset',
                      cursor: 'pointer',
                      padding: '10px 18px',
                      borderRadius: 12,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      background: isSelected
                        ? 'var(--color-surface-raised, rgba(255, 255, 255, 0.08))'
                        : 'var(--color-surface-0, rgba(255, 255, 255, 0.02))',
                      border: isSelected
                        ? '1px solid var(--color-primary, #6366f1)'
                        : '1px solid var(--color-border)',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '0.88rem',
                        fontWeight: isSelected ? 700 : 500,
                        color: isSelected ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                      }}
                    >
                      Week {w.weekNumber}
                    </span>

                    {/* STATUS PILL */}
                    {isReady ? (
                      <span
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          background: 'var(--color-success, #10b981)',
                        }}
                      />
                    ) : isGenerating ? (
                      <span
                        className="animate-spin"
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: '50%',
                          border: '2px solid rgba(99, 102, 241, 0.3)',
                          borderTopColor: 'var(--color-primary)',
                        }}
                      />
                    ) : (
                      <span
                        style={{
                          fontSize: '0.68rem',
                          fontWeight: 600,
                          padding: '1px 6px',
                          borderRadius: 6,
                          background: 'var(--color-surface-1)',
                          color: 'var(--color-text-muted)',
                        }}
                      >
                        Idle
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* SELECTED WEEK DETAILS */}
            {selectedWeek && (
              <div
                style={{
                  padding: '24px 28px',
                  borderRadius: 18,
                  background: 'var(--color-surface-0, rgba(255, 255, 255, 0.03))',
                  border: '1px solid var(--color-border)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 20,
                }}
              >
                {/* WEEK HEADER */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 12,
                    borderBottom: '1px solid var(--color-border)',
                    paddingBottom: 16,
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <h3
                        style={{
                          fontFamily: "'Outfit', sans-serif",
                          fontSize: '1.25rem',
                          fontWeight: 700,
                          margin: 0,
                        }}
                      >
                        Week {selectedWeek.weekNumber} Focus
                      </h3>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          padding: '2px 8px',
                          borderRadius: 8,
                          background:
                            selectedWeek.status === 'READY'
                              ? 'rgba(16, 185, 129, 0.15)'
                              : selectedWeek.status === 'GENERATING'
                              ? 'rgba(99, 102, 241, 0.15)'
                              : 'var(--color-surface-1)',
                          color:
                            selectedWeek.status === 'READY'
                              ? 'var(--color-success, #10b981)'
                              : selectedWeek.status === 'GENERATING'
                              ? 'var(--color-primary, #6366f1)'
                              : 'var(--color-text-muted)',
                        }}
                      >
                        {selectedWeek.status === 'READY'
                          ? 'Ready'
                          : selectedWeek.status === 'GENERATING'
                          ? 'Generating...'
                          : 'Not Generated'}
                      </span>
                    </div>
                    <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                      {selectedWeek.startDate} to {selectedWeek.endDate} • {selectedWeek.summary || 'Focused Syllabus Mastery'}
                    </p>
                  </div>

                  {/* GENERATE / RETRY ACTIONS FOR THIS WEEK */}
                  {selectedWeek.status === 'NOT_STARTED' && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() =>
                        generateWeek({ planId: activePlan._id, weekNumber: selectedWeek.weekNumber })
                      }
                      isLoading={isGeneratingWeek}
                      id={`btn-generate-week-${selectedWeek.weekNumber}`}
                    >
                      <Sparkles size={14} style={{ marginRight: 6 }} />
                      <span>Generate Week {selectedWeek.weekNumber}</span>
                    </Button>
                  )}

                  {selectedWeek.status === 'GENERATING' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        retryWeek({ planId: activePlan._id, weekNumber: selectedWeek.weekNumber })
                      }
                      isLoading={isRetryingWeek}
                      id={`btn-retry-week-${selectedWeek.weekNumber}`}
                    >
                      <RefreshCw size={14} style={{ marginRight: 6 }} />
                      <span>Retry Generation</span>
                    </Button>
                  )}
                </div>

                {/* WEEK DAYS & TASKS */}
                {selectedWeek.status === 'READY' ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                    {selectedWeek.days.map((day) => {
                      const isToday = day.date === todayStr;
                      const hasTasks = day.tasks && day.tasks.length > 0;

                      return (
                        <div
                          key={day.date}
                          style={{
                            padding: '16px 20px',
                            borderRadius: 14,
                            background: isToday
                              ? 'var(--color-surface-raised, rgba(99, 102, 241, 0.05))'
                              : 'var(--color-surface-1, rgba(255, 255, 255, 0.02))',
                            border: isToday
                              ? '1px solid var(--color-primary, #6366f1)'
                              : '1px solid var(--color-border)',
                          }}
                        >
                          {/* DAY HEADER */}
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              marginBottom: 12,
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--color-text-primary)' }}>
                                {day.dayName}
                              </span>
                              <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                                ({day.date})
                              </span>
                              {isToday && (
                                <span
                                  style={{
                                    fontSize: '0.65rem',
                                    fontWeight: 700,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.04em',
                                    padding: '2px 8px',
                                    borderRadius: 12,
                                    background: 'var(--color-primary-light)',
                                    color: 'var(--color-primary)',
                                  }}
                                >
                                  Today
                                </span>
                              )}
                            </div>

                            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                              {day.tasks.filter((t) => !!t.completedAt).length} / {day.tasks.length} done
                            </span>
                          </div>

                          {/* TASKS LIST */}
                          {hasTasks ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                              {day.tasks.map((task) => {
                                const isDone = !!task.completedAt;
                                const typeStyle = TASK_TYPE_STYLES[task.type] || TASK_TYPE_STYLES.STUDY;
                                const courseCode =
                                  typeof task.courseId === 'object' && task.courseId?.code
                                    ? task.courseId.code
                                    : 'COURSE';

                                return (
                                  <div
                                    key={task._id}
                                    style={{
                                      display: 'flex',
                                      alignItems: 'flex-start',
                                      justifyContent: 'space-between',
                                      gap: 12,
                                      padding: '10px 14px',
                                      borderRadius: 10,
                                      background: isDone
                                        ? 'rgba(255,255,255,0.01)'
                                        : 'var(--color-surface-0, rgba(255,255,255,0.03))',
                                      border: '1px solid var(--color-border)',
                                      opacity: isDone ? 0.65 : 1,
                                      transition: 'opacity 0.2s ease',
                                    }}
                                  >
                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                                      {/* TASK COMPLETION TOGGLE BUTTON */}
                                      <button
                                        type="button"
                                        onClick={() => handleToggleTask(task._id, isDone)}
                                        aria-label={`Mark task ${task.title} as ${isDone ? 'incomplete' : 'completed'}`}
                                        id={`task-toggle-${task._id}`}
                                        style={{
                                          all: 'unset',
                                          cursor: 'pointer',
                                          marginTop: 2,
                                          color: isDone ? 'var(--color-success, #10b981)' : 'var(--color-text-muted)',
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                        }}
                                      >
                                        {isDone ? (
                                          <CheckCircle2 size={19} />
                                        ) : (
                                          <Circle size={19} />
                                        )}
                                      </button>

                                      <div>
                                        <p
                                          style={{
                                            margin: '0 0 4px',
                                            fontSize: '0.9rem',
                                            fontWeight: 600,
                                            color: 'var(--color-text-primary)',
                                            textDecoration: isDone ? 'line-through' : 'none',
                                          }}
                                        >
                                          {task.title}
                                        </p>
                                        {task.description && (
                                          <p
                                            style={{
                                              margin: 0,
                                              fontSize: '0.78rem',
                                              color: 'var(--color-text-secondary)',
                                              lineHeight: 1.4,
                                            }}
                                          >
                                            {task.description}
                                          </p>
                                        )}
                                      </div>
                                    </div>

                                    {/* BADGES & DURATION */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                                      <span
                                        style={{
                                          fontSize: '0.72rem',
                                          fontWeight: 700,
                                          padding: '2px 6px',
                                          borderRadius: 6,
                                          background: 'var(--color-surface-raised)',
                                          color: 'var(--color-text-primary)',
                                          border: '1px solid var(--color-border)',
                                        }}
                                      >
                                        {courseCode}
                                      </span>

                                      <span
                                        style={{
                                          fontSize: '0.7rem',
                                          fontWeight: 600,
                                          padding: '2px 8px',
                                          borderRadius: 6,
                                          background: typeStyle.bg,
                                          color: typeStyle.color,
                                        }}
                                      >
                                        {typeStyle.label}
                                      </span>

                                      <div
                                        style={{
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: 4,
                                          fontSize: '0.75rem',
                                          color: 'var(--color-text-muted)',
                                        }}
                                      >
                                        <Clock size={13} />
                                        <span>{task.durationMinutes}m</span>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                              No tasks scheduled for this day (Rest / Spaced Retention).
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div
                    style={{
                      padding: '36px 20px',
                      borderRadius: 14,
                      background: 'var(--color-surface-raised, rgba(255,255,255,0.02))',
                      border: '1px dashed var(--color-border)',
                      textAlign: 'center',
                    }}
                  >
                    <p style={{ margin: '0 0 12px', fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
                      Tasks for Week {selectedWeek.weekNumber} have not been generated yet.
                    </p>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() =>
                        generateWeek({ planId: activePlan._id, weekNumber: selectedWeek.weekNumber })
                      }
                      isLoading={isGeneratingWeek}
                    >
                      <Sparkles size={14} style={{ marginRight: 6 }} />
                      <span>Generate Week {selectedWeek.weekNumber} Drills</span>
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* MODAL: MANAGE COURSE EXAM DATES */}
        <Modal
          isOpen={isDatesModalOpen}
          onClose={() => setIsDatesModalOpen(false)}
          title="Course Exam Dates (Single Source of Truth)"
          description="Specify upcoming exam dates for each enrolled course. The system dynamically computes your timeline and synchronizes the study plan."
          size="lg"
        >
          <form onSubmit={handleSaveCourseDates} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {coursesList.length === 0 ? (
              <div style={{ padding: 24, textAlign: 'center', border: '1px dashed var(--color-border)', borderRadius: 12 }}>
                <p style={{ margin: '0 0 12px', color: 'var(--color-text-muted)' }}>
                  You do not have any enrolled courses yet.
                </p>
                <Link
                  to="/courses"
                  onClick={() => setIsDatesModalOpen(false)}
                  className="btn btn-primary btn-sm"
                  style={{ textDecoration: 'none' }}
                >
                  Browse Course Catalog
                </Link>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 380, overflowY: 'auto', paddingRight: 4 }}>
                {coursesList.map((course) => {
                  const currentDateVal = draftCourseDates[course._id] || '';
                  const daysLeft = getDaysRemaining(currentDateVal);

                  return (
                    <div
                      key={course._id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 16,
                        padding: '12px 16px',
                        borderRadius: 12,
                        background: 'var(--color-surface-raised, rgba(255,255,255,0.02))',
                        border: '1px solid var(--color-border)',
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                          <span className="badge" style={{ fontSize: '0.72rem', fontWeight: 700 }}>
                            {course.code}
                          </span>
                          <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                            {course.title}
                          </span>
                        </div>
                        {currentDateVal ? (
                          <span style={{ fontSize: '0.75rem', color: daysLeft && daysLeft >= 0 ? '#10b981' : '#f59e0b' }}>
                            {daysLeft && daysLeft >= 0 ? `${daysLeft} days until exam` : 'Scheduled date in past'}
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                            No exam date set
                          </span>
                        )}
                      </div>

                      <div style={{ width: 170 }}>
                        <Input
                          type="date"
                          value={currentDateVal}
                          min={todayStr}
                          onChange={(e) =>
                            setDraftCourseDates((prev) => ({
                              ...prev,
                              [course._id]: e.target.value,
                            }))
                          }
                          aria-label={`Exam date for ${course.code}`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8 }}>
              <Button variant="secondary" type="button" onClick={() => setIsDatesModalOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                type="submit"
                isLoading={isSavingDates}
                id="btn-save-course-exam-dates"
                disabled={coursesList.length === 0}
              >
                <Save size={15} style={{ marginRight: 6 }} />
                <span>Save All Dates</span>
              </Button>
            </div>
          </form>
        </Modal>

        {/* MODAL: ACADEMIC LEVEL ADVANCEMENT */}
        <Modal
          isOpen={isPromoteOpen}
          onClose={() => setIsPromoteOpen(false)}
          title="Move to Next Academic Level"
          description="Advance your academic track and select your new level curriculum."
          size="lg"
        >
          <form onSubmit={handleSavePromotion} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 18px',
                background: 'var(--color-primary-light)',
                borderRadius: 12,
                border: '1px solid var(--color-border)',
              }}
            >
              <div>
                <p style={{ margin: '0 0 2px', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 600 }}>
                  Current Level
                </p>
                <p style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                  {profile?.level || user?.level || '100L'}
                </p>
              </div>
              <div style={{ fontSize: '1.2rem', color: 'var(--color-primary)' }}>→</div>
              <div>
                <p style={{ margin: '0 0 2px', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 600 }}>
                  Advancing To
                </p>
                <p style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                  {promoteLevel}
                </p>
              </div>
            </div>

            <Select
              label="Select Next Level"
              value={promoteLevel}
              onChange={(e) => {
                const lvl = e.target.value as any;
                setPromoteLevel(lvl);
                loadCoursesForLevel(lvl);
              }}
              options={[
                { value: '200L', label: '200 Level (200L)' },
                { value: '300L', label: '300 Level (300L)' },
                { value: '400L', label: '400 Level (400L)' },
                { value: '500L', label: '500 Level (500L)' },
              ]}
            />

            <Input
              label="Target Upcoming Exam Date"
              type="date"
              value={promoteExamDate}
              min={todayStr}
              onChange={(e) => setPromoteExamDate(e.target.value)}
              helperText="Set an initial upcoming exam deadline for your new level."
            />

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>
                Select {promoteLevel} Courses to Enroll In:
              </span>
              {isLoadingPromoteCourses ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} style={{ height: 42, borderRadius: 8 }} />
                  ))}
                </div>
              ) : promoteAvailableCourses.length === 0 ? (
                <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
                  No courses found for {promoteLevel} in this department.
                </p>
              ) : (
                <div style={{ maxHeight: 180, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {promoteAvailableCourses.map((c) => {
                    const isChecked = promoteSelectedCourseIds.includes(c._id);
                    return (
                      <label
                        key={c._id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '8px 12px',
                          borderRadius: 8,
                          background: 'var(--color-surface-raised)',
                          border: '1px solid var(--color-border)',
                          cursor: 'pointer',
                        }}
                      >
                        <span style={{ fontSize: '0.85rem' }}>
                          <strong>{c.code}</strong>: {c.title}
                        </span>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setPromoteSelectedCourseIds((prev) => [...prev, c._id]);
                            } else {
                              setPromoteSelectedCourseIds((prev) => prev.filter((id) => id !== c._id));
                            }
                          }}
                        />
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8 }}>
              <Button variant="secondary" type="button" onClick={() => setIsPromoteOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit" isLoading={isUpdatingProfile}>
                Confirm Advancement
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </AppLayout>
  );
}
export default StudyPlannerRoute;
