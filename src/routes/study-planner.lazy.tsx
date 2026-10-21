import { createLazyFileRoute } from '@tanstack/react-router';
import * as React from 'react';

import { AppLayout } from '../shared/components/layout/AppLayout';
import { useDocumentTitle } from '../shared/hooks/useDocumentTitle';
import { useGenerateStudyPlan } from '../features/ai-study/hooks/useAIStudy';
import { useStudentDashboard } from '../features/dashboard/hooks/useDashboard';
import { useStudentProfile, useUpdateProfile, useEnrolledCourses } from '../features/profile/hooks/useProfile';
import type { StudyPlan, StudyDayPlan } from '../features/ai-study/api/ai.api';
import {
  Sparkles,
  Clock,
  Target,
  AlertCircle,
  RefreshCw,
  CheckCircle2,
  GraduationCap,
} from 'lucide-react';
import { useAuth } from '../features/auth/hooks/useAuth';
import { Dialog as Modal } from '../shared/components/Dialog';
import { Button } from '../shared/components/Button';
import { Input } from '../shared/components/Input';
import { Select } from '../shared/components/Select';
import { Skeleton } from '../shared/components/Skeleton';
import { curriculumApi } from '../features/curriculum/api/curriculum.api';
import type { Course } from '../types/course.types';

export const Route = createLazyFileRoute('/study-planner')({
  component: StudyPlannerRoute,
});

const PRIORITY_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  high:   { bg: 'var(--color-danger-light, #fee2e2)', text: 'var(--color-danger, #ef4444)', label: 'High priority' },
  medium: { bg: 'var(--color-warning-light, #fef3c7)', text: 'var(--color-warning, #f59e0b)', label: 'Medium priority' },
  low:    { bg: 'var(--color-success-light, #d1fae5)', text: 'var(--color-success, #10b981)', label: 'Low priority' },
};

function DayRow({ day, isToday }: { day: StudyDayPlan; isToday: boolean }) {
  const p = PRIORITY_STYLES[day.priority] ?? PRIORITY_STYLES.medium;
  
  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      padding: '20px 24px', background: 'var(--color-surface-0)',
      border: isToday ? '1px solid var(--color-primary-border)' : '1px solid var(--color-border)',
      borderLeft: isToday ? '4px solid var(--color-primary)' : '1px solid var(--color-border)',
      borderRadius: 8, transition: 'all 0.2s ease',
    }}>
      {/* Header Row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <h3 style={{ fontWeight: 600, fontSize: '1.1rem', letterSpacing: '-0.005em', margin: 0 }}>
            {day.day}
          </h3>
          {isToday && (
            <span style={{ fontSize: '0.7rem', fontWeight: 600, padding: '2px 8px', borderRadius: 12, background: 'var(--color-primary-light)', color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Today
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
            <Clock size={14} /> {day.duration}
          </div>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '2px 8px', borderRadius: 4, background: p.bg, color: p.text }}>
            {p.label}
          </span>
        </div>
      </div>
      
      <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', margin: '0 0 16px', fontWeight: 500 }}>
        Focus: {day.focus}
      </p>

      {/* Task List */}
      {day.tasks.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {day.tasks.map((task, i) => (
            <div
              key={i}
              style={{
                display: 'flex', alignItems: 'flex-start', gap: 12,
                padding: '10px 12px', borderRadius: 6,
                width: '100%', boxSizing: 'border-box'
              }}
            >
              <div style={{
                width: 6, height: 6, borderRadius: '50%', flexShrink: 0, marginTop: 7,
                background: 'var(--color-primary)',
              }} />
              <span style={{
                fontSize: '0.9rem', lineHeight: 1.5,
                color: 'var(--color-text-primary)'
              }}>
                {task}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StudyPlannerRoute() {
  useDocumentTitle('Study Planner - EduAdapt');
  const { user } = useAuth();
  const { mutate: generatePlan, isPending, data: planData, isError } = useGenerateStudyPlan();
  const { mutate: updateProfile, isPending: isUpdatingProfile } = useUpdateProfile();
  const { data: dashData } = useStudentDashboard('me');
  const { data: profile } = useStudentProfile();
  const { data: enrolledCourses } = useEnrolledCourses();

  const [isExamDateModalOpen, setIsExamDateModalOpen] = React.useState(false);
  const [examDateInput, setExamDateInput] = React.useState('');

  // Move to Next Level promotion modal state
  const [isPromoteOpen, setIsPromoteOpen] = React.useState(false);
  const [promoteLevel, setPromoteLevel] = React.useState<'100L' | '200L' | '300L' | '400L' | '500L'>('200L');
  const [promoteSelectedCourseIds, setPromoteSelectedCourseIds] = React.useState<string[]>([]);
  const [promoteExamDate, setPromoteExamDate] = React.useState('');
  const [promoteAvailableCourses, setPromoteAvailableCourses] = React.useState<Course[]>([]);
  const [isLoadingPromoteCourses, setIsLoadingPromoteCourses] = React.useState(false);

  const plan: StudyPlan | null = planData?.data?.plan ?? null;
  const todayIdx = new Date().getDay();
  const todayLabel = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][todayIdx];

  const currentExamDate = profile?.nextExamDate || user?.nextExamDate;
  const currentLevel = (profile?.level || user?.level || '100L') as '100L' | '200L' | '300L' | '400L' | '500L';

  const daysRemaining = React.useMemo(() => {
    if (!currentExamDate) return null;
    const dateStr = currentExamDate.includes('T') ? currentExamDate.split('T')[0] : currentExamDate;
    const parts = dateStr.split('-').map(Number);
    if (parts.length !== 3) return null;
    const examUtc = Date.UTC(parts[0], parts[1] - 1, parts[2]);
    const now = new Date();
    const todayUtc = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
    const diff = Math.round((examUtc - todayUtc) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  }, [currentExamDate]);

  const handleOpenExamDateModal = () => {
    setExamDateInput(currentExamDate ? (currentExamDate.includes('T') ? currentExamDate.split('T')[0] : currentExamDate) : '');
    setIsExamDateModalOpen(true);
  };

  const handleSaveExamDate = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      nextExamDate: examDateInput ? new Date(examDateInput).toISOString() : null,
    }, {
      onSuccess: () => {
        setIsExamDateModalOpen(false);
      }
    });
  };

  const loadCoursesForLevel = async (lvl: string) => {
    const deptId = typeof profile?.departmentId === 'object' ? (profile.departmentId as any)?._id : (profile?.departmentId || user?.departmentId);
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
    const nextLvlMap: Record<string, '100L' | '200L' | '300L' | '400L' | '500L'> = {
      '100L': '200L',
      '200L': '300L',
      '300L': '400L',
      '400L': '500L',
      '500L': '500L',
    };
    const targetNext = nextLvlMap[currentLevel] || '200L';
    setPromoteLevel(targetNext);
    setPromoteExamDate(profile?.nextExamDate ? (profile.nextExamDate.includes('T') ? profile.nextExamDate.split('T')[0] : profile.nextExamDate) : '');
    setIsPromoteOpen(true);
    loadCoursesForLevel(targetNext);
  };

  const handleSavePromotion = (e: React.FormEvent) => {
    e.preventDefault();
    const currentEnrolled = enrolledCourses?.map((c: Course) => c._id) || [];
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

  const handleGenerate = () => {
    const stats = dashData?.stats
      ? `Average Elo: ${Math.round(dashData.stats.averageElo)}, Topics Mastered: ${dashData.stats.totalTopicsMastered}, Recent activity count: ${dashData.stats.recentActivity?.length ?? 0}`
      : 'No performance data available yet - student is just starting out.';
    const dept = (profile?.departmentId as any)?.name;
    generatePlan({
      studentStats: stats,
      department: dept,
      level: currentLevel,
      nextExamDate: currentExamDate || undefined,
    });
  };

  const levelOptions = [
    { value: '100L', label: '100 Level (100L)' },
    { value: '200L', label: '200 Level (200L)' },
    { value: '300L', label: '300 Level (300L)' },
    { value: '400L', label: '400 Level (400L)' },
    { value: '500L', label: '500 Level (500L)' },
  ];

  return (
    <AppLayout userName={user?.name || "Student"}>
      <div className="page-container">
        
        {/* Header */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 28, flexShrink: 0 }}>
          <h1 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, fontSize: '1.75rem', letterSpacing: '-0.005em', margin: 0, color: 'var(--color-text-primary)' }}>
            Study Planner
          </h1>
          <p style={{ margin: 0, fontSize: '1rem', color: 'var(--color-text-secondary)', maxWidth: 640 }}>
            Organize your learning with a personalized 7-day schedule calibrated to your upcoming exam deadline.
          </p>
        </div>

        {/* 2-Step Study Planner Setup */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))',
          gap: 20,
          marginBottom: 32,
        }}>
          {/* Step 1: Target Exam Date */}
          <div 
            id="step-1-exam-date"
            style={{
              background: 'var(--color-surface-0)',
              border: '1px solid var(--color-border)',
              borderRadius: 14,
              padding: 22,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: 16,
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{
                    width: 26, height: 26, borderRadius: '50%',
                    background: currentExamDate ? 'var(--color-success, #10b981)' : 'var(--color-primary)',
                    color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.82rem', fontWeight: 700
                  }}>
                    1
                  </span>
                  <h2 style={{ fontSize: '1.05rem', fontWeight: 700, letterSpacing: '-0.005em', margin: 0, color: 'var(--color-text-primary)' }}>
                    Step 1: Target exam date
                  </h2>
                </div>
                {currentExamDate && (
                  <span style={{
                    fontSize: '0.72rem', fontWeight: 700,
                    padding: '2px 8px', borderRadius: 10,
                    background: 'var(--color-success-light, #d1fae5)',
                    color: 'var(--color-success, #10b981)',
                    display: 'flex', alignItems: 'center', gap: 4
                  }}>
                    <CheckCircle2 size={12} /> Configured
                  </span>
                )}
              </div>

              <p style={{ margin: '0 0 14px', fontSize: '0.85rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                Sets your target exam deadline so daily tasks, intensity, and revision pacing are calibrated accurately.
              </p>

              {currentExamDate ? (
                <div style={{
                  padding: '12px 14px',
                  borderRadius: 10,
                  background: 'var(--color-surface-1)',
                  border: '1px solid var(--color-border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                }}>
                  <div>
                    <span style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
                      Target date
                    </span>
                    <p style={{ margin: '2px 0 0', fontSize: '0.98rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                      {new Date(currentExamDate).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                    </p>
                    {daysRemaining !== null && (
                      <span style={{
                        fontSize: '0.75rem', fontWeight: 600,
                        color: daysRemaining <= 7 ? 'var(--color-danger, #ef4444)' : 'var(--color-primary)',
                      }}>
                        {daysRemaining === 0 ? 'Exam is today' : `${daysRemaining} day${daysRemaining === 1 ? '' : 's'} remaining`}
                      </span>
                    )}
                  </div>
                  <Button variant="outline" size="sm" onClick={handleOpenExamDateModal}>
                    Change date
                  </Button>
                </div>
              ) : (
                <div style={{
                  padding: '14px',
                  borderRadius: 10,
                  background: 'var(--color-surface-1)',
                  border: '1px dashed var(--color-border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                }}>
                  <div>
                    <p style={{ margin: 0, fontSize: '0.88rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                      No exam date set
                    </p>
                    <span style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>
                      Currently using steady weekly pacing
                    </span>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleOpenExamDateModal}>
                    Set date
                  </Button>
                </div>
              )}
            </div>

            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
              Calendar-anchored in Africa/Lagos time
            </span>
          </div>

          {/* Step 2: Generate AI Study Plan */}
          <div style={{
            background: 'var(--color-surface-0)',
            border: '1px solid var(--color-border)',
            borderRadius: 14,
            padding: 22,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: 16,
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{
                    width: 26, height: 26, borderRadius: '50%',
                    background: 'var(--color-primary)',
                    color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.82rem', fontWeight: 700
                  }}>
                    2
                  </span>
                  <h2 style={{ fontSize: '1.05rem', fontWeight: 700, letterSpacing: '-0.005em', margin: 0, color: 'var(--color-text-primary)' }}>
                    Step 2: Generate study plan
                  </h2>
                </div>
                <Button variant="ghost" size="sm" onClick={handleOpenPromote} style={{ fontSize: '0.75rem', color: 'var(--color-primary)' }}>
                  Move to next level
                </Button>
              </div>

              <p style={{ margin: '0 0 14px', fontSize: '0.85rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                Generates a customized 7-day schedule focusing on your weakest curriculum areas for Level {currentLevel}.
              </p>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{
                  fontSize: '0.75rem', fontWeight: 600,
                  padding: '3px 10px', borderRadius: 10,
                  background: 'var(--color-surface-1)', color: 'var(--color-text-secondary)',
                  border: '1px solid var(--color-border)'
                }}>
                  Academic level: {currentLevel}
                </span>
                <span style={{
                  fontSize: '0.75rem', fontWeight: 600,
                  padding: '3px 10px', borderRadius: 10,
                  background: 'var(--color-surface-1)', color: 'var(--color-text-secondary)',
                  border: '1px solid var(--color-border)'
                }}>
                  Department: {(profile?.departmentId as any)?.name || 'Computer Science'}
                </span>
              </div>
            </div>

            <div>
              <Button
                variant="accent"
                onClick={handleGenerate}
                isLoading={isPending}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px', fontWeight: 600 }}
              >
                <Sparkles size={16} />
                {plan ? 'Regenerate study plan' : 'Generate 7-day plan'}
              </Button>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isPending && (
          <div style={{ width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '20px 24px', background: 'var(--color-surface-0)', border: '1px solid var(--color-border)', borderRadius: 8, marginBottom: 24 }}>
              <Sparkles size={20} color="var(--color-primary)" className="animate-pulse" />
              <div>
                <p style={{ fontWeight: 600, margin: '0 0 4px', color: 'var(--color-text-primary)' }}>Generating your personalized plan...</p>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', margin: 0 }}>EduAdapt is analyzing your performance history and exam timeline.</p>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="skeleton-stagger"
                  style={{
                    height: 140,
                    background: 'var(--color-surface-1)',
                    borderRadius: 'var(--radius-md)',
                    animationDelay: `${i * 0.1}s`,
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Error State */}
        {isError && !isPending && (
          <div style={{ padding: '40px 24px', textAlign: 'center', background: 'var(--color-surface-0)', border: '1px solid var(--color-danger)', borderRadius: 8, maxWidth: 600, margin: '0 auto' }}>
            <AlertCircle size={32} color="var(--color-danger)" style={{ marginBottom: 16 }} />
            <h3 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 600, margin: '0 0 8px', color: 'var(--color-text-primary)' }}>We couldn't generate your plan</h3>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem', margin: '0 0 24px' }}>There was an issue connecting to the planning service. Please try again.</p>
            <button onClick={handleGenerate} className="btn-outline">Try Again</button>
          </div>
        )}

        {/* Generated Plan Workspace */}
        {plan && !isPending && (
          <div style={{ width: '100%' }}>
            {/* Week Goal */}
            {plan.weekGoal && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '20px 24px', background: 'var(--color-surface-0)', border: '1px solid var(--color-border)', borderRadius: 8, marginBottom: 32 }}>
                <Target size={20} color="var(--color-primary)" />
                <div>
                  <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.04em', margin: '0 0 4px' }}>This week's goal</p>
                  <p style={{ fontWeight: 500, fontSize: '0.95rem', color: 'var(--color-text-primary)', margin: 0 }}>{plan.weekGoal}</p>
                </div>
              </div>
            )}

            {/* Timeline List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 32 }}>
              {plan.days?.map(day => (
                <DayRow key={day.day} day={day} isToday={day.day === todayLabel} />
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 32 }}>
              <button onClick={handleGenerate} className="btn-outline" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <RefreshCw size={14} /> Regenerate plan
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Set Exam Date Modal */}
      <Modal
        isOpen={isExamDateModalOpen}
        onClose={() => setIsExamDateModalOpen(false)}
        title={currentExamDate ? 'Update next exam date' : 'Set next exam date'}
        description="Pick your upcoming semester or certification exam date to calibrate your study plan"
        size="md"
      >
        <form onSubmit={handleSaveExamDate} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Input
            label="Exam Date"
            type="date"
            value={examDateInput}
            min={new Date().toISOString().split('T')[0]}
            onChange={(e) => setExamDateInput(e.target.value)}
            helperText="The AI study planner will schedule daily tasks and revision countdown leading up to this date."
            required
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8 }}>
            {currentExamDate && (
              <Button
                variant="ghost"
                type="button"
                onClick={() => {
                  updateProfile({ nextExamDate: null }, {
                    onSuccess: () => setIsExamDateModalOpen(false)
                  });
                }}
                disabled={isUpdatingProfile}
                style={{ marginRight: 'auto', color: 'var(--color-danger)' }}
              >
                Clear Exam Date
              </Button>
            )}
            <Button variant="secondary" type="button" onClick={() => setIsExamDateModalOpen(false)} disabled={isUpdatingProfile}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={isUpdatingProfile}>
              Save Exam Date
            </Button>
          </div>
        </form>
      </Modal>

      {/* MOVE TO NEXT LEVEL / PROMOTION MODAL */}
      <Modal
        isOpen={isPromoteOpen}
        onClose={() => setIsPromoteOpen(false)}
        title={`Advance to ${promoteLevel}`}
        description="Progress to your next academic year, enroll in upcoming courses, and set your target exam date"
        size="lg"
      >
        <form onSubmit={handleSavePromotion} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 12,
            padding: 16,
            background: 'var(--color-surface-1)',
            borderRadius: 12,
            border: '1px solid var(--color-border)'
          }}>
            <GraduationCap size={20} color="var(--color-primary)" style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <p style={{ margin: '0 0 6px', fontWeight: 600, fontSize: '0.9rem', color: 'var(--color-text)' }}>
                What Is Preserved
              </p>
              <ul style={{ margin: 0, paddingLeft: 16, fontSize: '0.8rem', color: 'var(--color-text-secondary)', display: 'flex', flexDirection: 'column', gap: 4 }}>
                <li>All prior course enrollments remain in your record.</li>
                <li>Complete practice history, scores, and answer reviews.</li>
                <li>Elo mastery scores, topic proficiencies, and streaks.</li>
              </ul>
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
            <Button variant="secondary" type="button" onClick={() => setIsPromoteOpen(false)} disabled={isUpdatingProfile}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={isUpdatingProfile}>
              Confirm & Advance to {promoteLevel}
            </Button>
          </div>
        </form>
      </Modal>
    </AppLayout>
  );
}
