import { createLazyFileRoute, Link } from '@tanstack/react-router';
import * as React from 'react';

import { AppLayout } from '../shared/components/layout/AppLayout';
import { useDocumentTitle } from '../shared/hooks/useDocumentTitle';
import { useGenerateStudyPlan } from '../features/ai-study/hooks/useAIStudy';
import { useStudentDashboard } from '../features/dashboard/hooks/useDashboard';
import { useStudentProfile, useUpdateProfile } from '../features/profile/hooks/useProfile';
import type { StudyPlan, StudyDayPlan } from '../features/ai-study/api/ai.api';
import { Sparkles, Clock, Target, AlertCircle, RefreshCw, Calendar } from 'lucide-react';
import { useAuth } from '../features/auth/hooks/useAuth';
import { Modal } from '../shared/components/Modal';
import { Button } from '../shared/components/Button';
import { Input } from '../shared/components/Input';

export const Route = createLazyFileRoute('/study-planner')({
  component: StudyPlannerRoute,
});

const PRIORITY_STYLES: Record<string, { bg: string; text: string; border: string; label: string }> = {
  high:   { bg: 'var(--color-danger-light, #fee2e2)', text: 'var(--color-danger, #ef4444)', border: 'var(--color-danger, #ef4444)', label: 'High Priority' },
  medium: { bg: 'var(--color-warning-light, #fef3c7)', text: 'var(--color-warning, #f59e0b)', border: 'var(--color-warning, #f59e0b)', label: 'Medium Priority' },
  low:    { bg: 'var(--color-success-light, #d1fae5)', text: 'var(--color-success, #10b981)', border: 'var(--color-success, #10b981)', label: 'Low Priority' },
};

function DayRow({ day, isToday }: { day: StudyDayPlan; isToday: boolean }) {
  const p = PRIORITY_STYLES[day.priority] ?? PRIORITY_STYLES.medium;
  const allDone = false; // No backend state for this yet
  
  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      padding: '20px 24px', background: 'var(--color-surface-0)',
      border: isToday ? '1px solid var(--color-primary-border)' : '1px solid var(--color-border)',
      borderLeft: isToday ? '4px solid var(--color-primary)' : '1px solid var(--color-border)',
      borderRadius: 8, transition: 'all 0.2s ease',
      opacity: allDone ? 0.7 : 1,
    }}>
      {/* Header Row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <h3 style={{ fontWeight: 600, fontSize: '1.1rem', margin: 0 }}>
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

  const [isExamDateModalOpen, setIsExamDateModalOpen] = React.useState(false);
  const [examDateInput, setExamDateInput] = React.useState('');

  const plan: StudyPlan | null = planData?.data?.plan ?? null;
  const todayIdx = new Date().getDay();
  const todayLabel = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][todayIdx];

  const currentExamDate = profile?.nextExamDate || user?.nextExamDate;
  const currentLevel = profile?.level || user?.level || '100L';

  const daysRemaining = React.useMemo(() => {
    if (!currentExamDate) return null;
    const diff = Math.ceil((new Date(currentExamDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  }, [currentExamDate]);

  const handleOpenExamDateModal = () => {
    setExamDateInput(currentExamDate ? new Date(currentExamDate).toISOString().split('T')[0] : '');
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

  const handleGenerate = () => {
    const stats = dashData?.stats
      ? `Average Elo: ${Math.round(dashData.stats.averageElo)}, Topics Mastered: ${dashData.stats.totalTopicsMastered}, Recent activity count: ${dashData.stats.recentActivity?.length ?? 0}`
      : 'No performance data available yet - student is just starting out.';
    const dept = profile?.departmentId?.name;
    generatePlan({
      studentStats: stats,
      department: dept,
      level: currentLevel,
      nextExamDate: currentExamDate || undefined,
    });
  };

  const containerClass = "page-wide";

  return (
    <AppLayout userName={user?.name || "Student"}>
      <div className={`page-container ${containerClass}`}>
        
        {/* -- Header -- */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 28, flexShrink: 0 }}>
          <h1 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, fontSize: '1.75rem', margin: 0, color: 'var(--color-text-primary)' }}>
            Study Planner
          </h1>
          <p style={{ margin: 0, fontSize: '1rem', color: 'var(--color-text-secondary)', maxWidth: 600 }}>
            Organize your learning with a personalized 7-day schedule calibrated to your upcoming exam deadline.
          </p>
        </div>

        {/* -- Exam Timeline & Academic Standing Banner -- */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16,
          padding: '16px 20px',
          background: 'var(--color-surface-0)',
          border: '1px solid var(--color-border)',
          borderRadius: 12,
          marginBottom: 32,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 42, height: 42, borderRadius: 10,
              background: 'var(--color-primary-light)', color: 'var(--color-primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0
            }}>
              <Calendar size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                  {currentExamDate
                    ? `Next Exam: ${new Date(currentExamDate).toLocaleDateString(undefined, { dateStyle: 'medium' })}`
                    : 'Next Exam Date Not Set'}
                </span>
                {daysRemaining !== null && (
                  <span style={{
                    fontSize: '0.75rem', fontWeight: 700,
                    padding: '2px 8px', borderRadius: 12,
                    background: daysRemaining <= 7 ? 'var(--color-danger-light, #fee2e2)' : 'var(--color-primary-light)',
                    color: daysRemaining <= 7 ? 'var(--color-danger, #ef4444)' : 'var(--color-primary)',
                    border: '1px solid var(--color-border)'
                  }}>
                    {daysRemaining === 0 ? 'Exam is Today!' : `${daysRemaining} day${daysRemaining === 1 ? '' : 's'} remaining`}
                  </span>
                )}
                <span style={{
                  fontSize: '0.75rem', fontWeight: 600,
                  padding: '2px 8px', borderRadius: 12,
                  background: 'var(--color-surface-1)', color: 'var(--color-text-secondary)',
                  border: '1px solid var(--color-border)'
                }}>
                  Level: {currentLevel}
                </span>
              </div>
              <p style={{ margin: '2px 0 0', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                {currentExamDate
                  ? 'Your AI study plan intensity and revision checkpoints are calibrated to this exam deadline.'
                  : 'Set your upcoming exam date to calibrate weekly study pacing and priority topics.'}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <Button variant="outline" size="sm" onClick={handleOpenExamDateModal}>
              {currentExamDate ? 'Change Exam Date' : 'Set Exam Date'}
            </Button>
            <Link to="/profile" style={{ textDecoration: 'none' }}>
              <Button variant="ghost" size="sm" style={{ color: 'var(--color-primary)' }}>
                Move to New Level →
              </Button>
            </Link>
          </div>
        </div>

        {/* -- Empty State -- */}
        {!plan && !isPending && !isError && (
          <div style={{ 
            background: 'var(--color-surface-0)', border: '1px dashed var(--color-border)', 
            borderRadius: 16, padding: 'var(--space-64) var(--space-32)', textAlign: 'center'
          }}>
            <div style={{ maxWidth: 600, margin: '0 auto' }}>
              <div className="icon-float" style={{ width: 64, height: 64, borderRadius: 16, background: 'var(--color-primary-light)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                <Calendar size={32} />
              </div>
              
              <p className="caption" style={{ margin: '0 0 var(--space-12)', color: 'var(--color-primary)' }}>
                Plan your next 7 days
              </p>
              
              <h2 className="h2" style={{ margin: '0 0 var(--space-16)' }}>
                Build a study plan around your actual needs
              </h2>
              
              <p className="body-large" style={{ color: 'var(--color-text-secondary)', margin: '0 0 var(--space-40)', lineHeight: 1.6 }}>
                Create a 7-day schedule based on your recent performance, your upcoming exam deadline, and topics requiring extra practice.
              </p>
              
              <button onClick={handleGenerate} className="btn-primary-cta" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 32 }}>
                <Sparkles size={16} /> Generate 7-day plan
              </button>
              
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, fontSize: '0.9rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>
                <span>Performance-based</span>
                <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--color-border)' }} />
                <span>Exam-calibrated</span>
                <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--color-border)' }} />
                <span>Time-boxed</span>
              </div>
            </div>
          </div>
        )}

      {/* -- Loading State -- */}
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

      {/* -- Error State -- */}
      {isError && !isPending && (
        <div style={{ padding: '40px 24px', textAlign: 'center', background: 'var(--color-surface-0)', border: '1px solid var(--color-danger)', borderRadius: 8, maxWidth: 600, margin: '0 auto' }}>
          <AlertCircle size={32} color="var(--color-danger)" style={{ marginBottom: 16 }} />
          <h3 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 600, margin: '0 0 8px', color: 'var(--color-text-primary)' }}>We couldn't generate your plan</h3>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem', margin: '0 0 24px' }}>There was an issue connecting to the planning service. Please try again.</p>
          <button onClick={handleGenerate} className="btn-outline">Try Again</button>
        </div>
      )}

      {/* -- Generated Plan Workspace -- */}
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
        title={currentExamDate ? 'Update Next Exam Date' : 'Set Next Exam Date'}
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
    </AppLayout>
  );
}
