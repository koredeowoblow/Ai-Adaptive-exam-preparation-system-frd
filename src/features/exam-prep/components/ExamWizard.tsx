import * as React from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useDepartmentCourses } from '../../curriculum/hooks/useCurriculum';
import { useStartSession } from '../../practice-session/hooks/usePractice';
import type { Course } from '../../../types/course.types';
import type { QuestionTypeMix } from '../../../types/practice.types';
import { Skeleton } from '../../../shared/components/Skeleton';
import { EmptyState } from '../../../shared/components/EmptyState';
import { ErrorState } from '../../../shared/components/ErrorState';
import { ArrowLeft, ChevronRight, BookOpen, GraduationCap, Award, Briefcase, HelpCircle, AlertTriangle, BookCheck, ListChecks, Blend } from 'lucide-react';
import { useAuth } from '../../auth/hooks/useAuth';

type WizardStep = 'level' | 'course';

const LEVELS = [
  { value: 100, description: 'First year foundation' },
  { value: 200, description: 'Second year core' },
  { value: 300, description: 'Third year intermediate' },
  { value: 400, description: 'Fourth year advanced' },
  { value: 500, description: 'Fifth year professional' },
];

/** Mirror of the backend ACADEMIC_LEVELS config for UI display only. */
const LEVEL_CAPS: Record<string, { theoryCap: number; totalCap: number }> = {
  '100L': { theoryCap: 2,  totalCap: 40 },
  '200L': { theoryCap: 4,  totalCap: 40 },
  '300L': { theoryCap: 8,  totalCap: 40 },
  '400L': { theoryCap: 16, totalCap: 40 },
};

const QUESTION_TYPE_OPTIONS: { value: QuestionTypeMix; label: string; sub: string; icon: React.ReactNode }[] = [
  { value: 'MIXED', label: 'Mixed', sub: 'MCQ + Theory (default)', icon: <Blend size={16} /> },
  { value: 'OBJECTIVE_ONLY', label: 'Objective Only', sub: 'Multiple choice questions', icon: <ListChecks size={16} /> },
  { value: 'THEORY_ONLY', label: 'Theory Only', sub: 'Free-response questions', icon: <BookCheck size={16} /> },
];

function getCourseLevel(code: string): number {
  const match = code.match(/(\d{3,})/);
  if (!match) return 0;
  return Math.floor(parseInt(match[1], 10) / 100) * 100;
}

// ── Step Heading ───────────────────────────────────────────────────────────────
const StepHeading: React.FC<{ step: number; title: string; sub: string }> = ({ step, title, sub }) => (
  <div style={{ marginBottom: 'var(--space-16)' }}>
    <p className="label" style={{ color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 var(--space-4)' }}>
      Step {step} of 2
    </p>
    <h2 className="h2" style={{ margin: '0 0 var(--space-8)' }}>{title}</h2>
    <p className="body-base" style={{ color: 'var(--color-text-secondary)', margin: 0 }}>{sub}</p>
  </div>
);



// ── Level Step ───────────────────────────────────────────────────────────────
interface LevelStepProps { onSelect: (level: number) => void; departmentId: string; }
const LevelStep: React.FC<LevelStepProps> = ({ onSelect, departmentId }) => {
  const [showHelp, setShowHelp] = React.useState(false);
  const { data: allCoursesData, isError, refetch } = useDepartmentCourses(departmentId);
  const courses = React.useMemo(() => allCoursesData?.pages.flatMap(p => p.items) || [], [allCoursesData]);

  if (isError) {
    return (
      <ErrorState
        message="Unable to load courses for your department. Please check your connection."
        onRetry={() => refetch()}
      />
    );
  }

  const getLevelIcon = (level: number) => {
    switch(level) {
      case 100: return <BookOpen size={24} color="var(--color-text-muted)" />;
      case 200: return <GraduationCap size={24} color="var(--color-text-muted)" />;
      case 300: return <Award size={24} color="var(--color-text-muted)" />;
      case 400: return <Briefcase size={24} color="var(--color-text-muted)" />;
      default: return <Award size={24} color="var(--color-text-muted)" />;
    }
  };

  return (
    <>
      <StepHeading step={1} title="Select your level" sub="Filter courses by your current academic year." />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 'var(--space-12)', alignItems: 'start' }}>
        {LEVELS.map((level) => {
          const levelCourses = courses.filter(c => getCourseLevel(c.code) === level.value).slice(0, 2);
          const sampleText = levelCourses.length > 0 ? `e.g. ${levelCourses.map(c => c.code).join(', ')}` : 'No courses found';

          return (
            <button key={level.value} onClick={() => onSelect(level.value)} className="exam-level-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: 'var(--space-12)' }}>
                <span className="h3" style={{ lineHeight: 1 }}>
                  {level.value}
                </span>
                {getLevelIcon(level.value)}
              </div>
              <span className="body-sm" style={{ color: 'var(--color-text-secondary)', lineHeight: 1.4, fontWeight: 500, marginBottom: 'var(--space-8)' }}>
                {level.description}
              </span>
              <span className="badge" style={{ fontSize: 'var(--font-size-12)' }}>
                {sampleText}
              </span>
            </button>
          );
        })}
      </div>

      <div style={{ marginTop: 'var(--space-16)' }}>
        <button
          onClick={() => setShowHelp(!showHelp)}
          className="btn-link"
          aria-expanded={showHelp}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--color-primary)', fontSize: 'var(--font-size-13)', fontWeight: 600 }}
        >
          <HelpCircle size={16} /> Not sure which level to pick?
        </button>
        {showHelp && (
          <div style={{ marginTop: 'var(--space-12)', padding: 'var(--space-16)', background: 'var(--color-info-light)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-primary-border)' }}>
            <p className="body-sm" style={{ margin: 0, color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
              <strong>Level 100</strong> usually corresponds to Year 1 (Freshman) introductory courses.<br/>
              <strong>Level 200</strong> corresponds to Year 2 (Sophomore).<br/>
              <strong>Level 300 &amp; 400</strong> are for Year 3/4 (Junior/Senior) advanced topics.<br/>
              Check your course syllabus if you are unsure!
            </p>
          </div>
        )}
      </div>

    </>
  );
};

// ── Course Step ──────────────────────────────────────────────────────────────
interface CourseStepProps {
  departmentId: string;
  level: number;
  studentLevel: string;
  onSelect: (course: Course, totalQuestions: number, questionType: QuestionTypeMix) => void;
  onBack: () => void;
  isStarting: boolean;
}
const CourseStep: React.FC<CourseStepProps> = ({ departmentId, level, studentLevel, onSelect, onBack, isStarting }) => {
  const [questionType, setQuestionType] = React.useState<QuestionTypeMix>('MIXED');
  const levelCaps = LEVEL_CAPS[studentLevel] ?? LEVEL_CAPS['100L'];
  const { 
    data: allCoursesData, 
    isLoading,
    isError,
    refetch,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage
  } = useDepartmentCourses(departmentId);
  
  const allCoursesItems = React.useMemo(() => {
    return allCoursesData?.pages.flatMap(page => page.items) || [];
  }, [allCoursesData]);

  const filteredCourses = allCoursesItems.filter((c: Course) => getCourseLevel(c.code) === level) ?? [];

  if (isError) return (
    <ErrorState
      message="Unable to load courses for your department. Please check your connection."
      onRetry={() => refetch()}
    />
  );

  if (isLoading) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {[1, 2, 3].map(i => <Skeleton key={i} style={{ height: 84, borderRadius: 8 }} />)}
    </div>
  );

  return (
    <>
      <StepHeading
        step={2}
        title="Select a course to practice"
        sub={filteredCourses.length > 0
          ? `${filteredCourses.length} course${filteredCourses.length > 1 ? 's' : ''} available.`
          : `No ${level}-level courses found.`}
      />

      {/* Level Info Banner */}
      <div className="card-secondary" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-10)', padding: 'var(--space-12) var(--space-16)', marginBottom: 'var(--space-16)', fontSize: 'var(--font-size-13)' }}>
        <span className="label">{studentLevel}</span>
        <span aria-hidden="true">·</span>
        <span style={{ color: 'var(--color-text-secondary)' }}>Max total: <strong>{levelCaps.totalCap} questions</strong></span>
        <span aria-hidden="true">·</span>
        <span style={{ color: 'var(--color-text-secondary)' }}>Max theory: <strong>{levelCaps.theoryCap} questions</strong></span>
      </div>

      {/* Question Type Selector */}
      <div style={{ marginBottom: 'var(--space-20)' }}>
        <p className="label" style={{ textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-text-muted)', marginBottom: 'var(--space-8)' }}>Question Type</p>
        <div role="group" aria-label="Question type" style={{ display: 'flex', gap: 'var(--space-8)', flexWrap: 'wrap' }}>
          {QUESTION_TYPE_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setQuestionType(opt.value)}
              aria-pressed={questionType === opt.value}
              className={questionType === opt.value ? 'exam-type-btn exam-type-btn--active' : 'exam-type-btn'}
            >
              {opt.icon} {opt.label}
            </button>
          ))}
        </div>
        <p className="body-xs" style={{ margin: 'var(--space-6) 0 0', color: 'var(--color-text-muted)' }}>
          {QUESTION_TYPE_OPTIONS.find(o => o.value === questionType)?.sub}
        </p>
      </div>

      {filteredCourses.length === 0 ? (
        <div style={{ padding: 'var(--space-40) var(--space-24)', textAlign: 'center', background: 'var(--color-surface-0)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}>
          <p className="body-base" style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-16)' }}>We don't have any active courses for this level yet.</p>
          <button onClick={onBack} className="btn-outline">
            Try a different level
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
          {filteredCourses.map((course: Course) => (
            <div key={course._id} className="exam-selection-row" style={{ flexDirection: 'column', padding: 'var(--space-16) var(--space-20)', gap: 'var(--space-16)', alignItems: 'stretch' }}>
              <div style={{ display: 'flex', gap: 'var(--space-12)', alignItems: 'center' }}>
                <span className="badge">{course.code}</span>
                <p className="body-base" style={{ fontWeight: 600, margin: 0 }}>{course.title}</p>
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-8)' }}>
                <button onClick={() => onSelect(course, 10, questionType)} disabled={isStarting} className="btn-outline" style={{ flex: 1, padding: 'var(--space-8)', fontSize: 'var(--font-size-14)' }}>
                  {isStarting ? 'Starting...' : 'Quick Practice (10 Qs)'}
                </button>
                <button onClick={() => onSelect(course, 40, questionType)} disabled={isStarting} className="btn-primary" style={{ flex: 1, padding: 'var(--space-8)', fontSize: 'var(--font-size-14)' }}>
                  {isStarting ? 'Starting...' : 'Full Mock Exam (40 Qs)'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {hasNextPage && (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 'var(--space-16)' }}>
          <button
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="btn-outline"
            style={{ borderRadius: 999, padding: 'var(--space-6) var(--space-16)', fontSize: 'var(--font-size-13)' }}
          >
            {isFetchingNextPage ? 'Loading...' : 'Load More Courses'}
          </button>
        </div>
      )}

      {/* Back link - CSS hover, no JS handlers */}
      <button onClick={onBack} className="wizard-back-btn">
        <ArrowLeft size={16} /> Back to levels
      </button>
    </>
  );
};

// ── Wizard Root ──────────────────────────────────────────────────────────────
export const ExamWizard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { mutate: startSession, isPending: isStarting } = useStartSession();
  const isStartingRef = React.useRef(false);
  const [isImmediateStarting, setIsImmediateStarting] = React.useState(false);
  const [clampWarning, setClampWarning] = React.useState<string | null>(null);

  const [step, setStep] = React.useState<WizardStep>('level');
  const [selectedLevel, setSelectedLevel] = React.useState<number | null>(null);

  const studentLevel = user?.level ?? '100L';

  const handleLevelSelect = (level: number) => { setSelectedLevel(level); setStep('course'); };
  const handleCourseSelect = (course: Course, totalQuestions: number, questionType: QuestionTypeMix) => {
    if (isStartingRef.current || isStarting) return;
    isStartingRef.current = true;
    setIsImmediateStarting(true);
    setClampWarning(null);

    startSession({ courseId: course._id, totalQuestions, questionType }, {
      onSuccess: (response) => {
        if (response.data.clampedMessage) {
          try {
            sessionStorage.setItem(`exam_clamped_message_${response.data.session._id}`, response.data.clampedMessage);
          } catch {
            // Ignore storage failure
          }
        }
        navigate({ to: '/exam/$sessionId', params: { sessionId: response.data.session._id } });
      },
      onError: () => {
        isStartingRef.current = false;
        setIsImmediateStarting(false);
      },
    });
  };

  if (!user?.departmentId) {
    return (
      <EmptyState
        icon={<AlertTriangle size={32} />}
        title="Department Required"
        description="Please select your academic department to view available exam prep courses."
        actionLabel="Complete Onboarding"
        onAction={() => navigate({ to: '/onboarding' })}
      />
    );
  }

  return (
    <div style={{ width: '100%' }}>
      
      {/* Clamped warning banner */}
      {clampWarning && (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 16px', marginBottom: 16, borderRadius: 8, background: 'var(--color-warning-light)', border: '1px solid var(--color-warning)', color: 'var(--color-text-primary)', fontSize: '0.9rem' }}>
          <AlertTriangle size={18} style={{ flexShrink: 0, color: 'var(--color-warning)', marginTop: 1 }} />
          <span>{clampWarning}</span>
        </div>
      )}
      
      {/* Breadcrumb Stepper */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, fontSize: '0.85rem', fontWeight: 600 }}>
        <button 
          onClick={() => setStep('level')}
          style={{ all: 'unset', cursor: 'pointer', color: step === 'level' ? 'var(--color-primary)' : 'var(--color-text-muted)' }}
        >
          Level
        </button>
        <ChevronRight size={14} color="var(--color-text-muted)" />
        <span style={{ color: step === 'course' ? 'var(--color-primary)' : 'var(--color-text-muted)' }}>
          Course
        </span>
      </div>

      <div style={{ position: 'relative' }}>
        {step === 'level' && <LevelStep onSelect={handleLevelSelect} departmentId={user.departmentId} />}
        {step === 'course' && selectedLevel && (
          <CourseStep
            departmentId={user.departmentId}
            level={selectedLevel}
            studentLevel={studentLevel}
            onSelect={handleCourseSelect}
            onBack={() => setStep('level')}
            isStarting={isStarting || isImmediateStarting}
          />
        )}
      </div>
    </div>
  );
};
