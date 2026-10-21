import * as React from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useDepartmentCourses } from '../../curriculum/hooks/useCurriculum';
import { useStartSession } from '../../practice-session/hooks/usePractice';
import type { Course } from '../../../types/course.types';
import type { QuestionTypeMix } from '../../../types/practice.types';
import { Skeleton } from '../../../shared/components/Skeleton';
import { EmptyState } from '../../../shared/components/EmptyState';
import { ErrorState } from '../../../shared/components/ErrorState';
import { Stepper } from '../../../shared/components/Stepper';
import { Badge } from '../../../shared/components/Badge';
import { Button } from '../../../shared/components/Button';
import { Popover } from '../../../shared/components/Popover';
import {
  ArrowLeft,
  HelpCircle,
  AlertTriangle,
  BookCheck,
  ListChecks,
  Blend,
} from 'lucide-react';
import { useAuth } from '../../auth/hooks/useAuth';

type WizardStep = 'level' | 'course';

const LEVELS = [
  { value: 100, label: '100 Level', description: 'Year 1 Foundation', explanation: 'First-year foundational general and introductory department courses.' },
  { value: 200, label: '200 Level', description: 'Year 2 Core', explanation: 'Second-year core departmental requirements and introductory theory.' },
  { value: 300, label: '300 Level', description: 'Year 3 Intermediate', explanation: 'Third-year intermediate courses, algorithms, and practical applications.' },
  { value: 400, label: '400 Level', description: 'Year 4 Advanced', explanation: 'Fourth-year advanced specializations, research, and project preparation.' },
  { value: 500, label: '500 Level', description: 'Year 5 Professional', explanation: 'Fifth-year engineering and professional practice curriculum.' },
];

/** Mirror of backend ACADEMIC_LEVELS config for UI display only. */
const LEVEL_CAPS: Record<string, { theoryCap: number; totalCap: number }> = {
  '100L': { theoryCap: 2,  totalCap: 40 },
  '200L': { theoryCap: 4,  totalCap: 40 },
  '300L': { theoryCap: 8,  totalCap: 40 },
  '400L': { theoryCap: 16, totalCap: 40 },
  '500L': { theoryCap: 16, totalCap: 40 },
};

const QUESTION_TYPE_OPTIONS: { value: QuestionTypeMix; label: string; sub: string; icon: React.ReactNode }[] = [
  { value: 'MIXED', label: 'Mixed', sub: 'Objective + Theory questions', icon: <Blend size={16} /> },
  { value: 'OBJECTIVE_ONLY', label: 'Objective Only', sub: 'Multiple-choice questions', icon: <ListChecks size={16} /> },
  { value: 'THEORY_ONLY', label: 'Theory Only', sub: 'Structured free-response questions', icon: <BookCheck size={16} /> },
];

function getCourseLevel(code: string): number {
  const match = code.match(/(\d{3,})/);
  if (!match) return 0;
  return Math.floor(parseInt(match[1], 10) / 100) * 100;
}

// ── Step Heading ─────────────────────────────────────────────────────────────
const StepHeading: React.FC<{ step: number; title: string; sub: string }> = ({ title, sub }) => (
  <div className="mb-4">
    <h2 className="text-xl sm:text-2xl font-bold tracking-[-0.005em] text-text-primary m-0 mb-1">{title}</h2>
    <p className="text-sm sm:text-base text-text-secondary m-0">{sub}</p>
  </div>
);

// ── Level Step ───────────────────────────────────────────────────────────────
interface LevelStepProps {
  onSelect: (level: number) => void;
  departmentId: string;
  studentLevelNum: number;
}

const LevelStep: React.FC<LevelStepProps> = ({ onSelect, departmentId, studentLevelNum }) => {
  const { data: allCoursesData, isLoading, isError, refetch } = useDepartmentCourses(departmentId);
  const courses = React.useMemo(() => allCoursesData?.pages.flatMap((p) => p.items) || [], [allCoursesData]);

  if (isLoading) {
    return (
      <div>
        <StepHeading step={1} title="Select your academic level" sub="Filter courses by your academic curriculum year." />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-44 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <ErrorState
        message="Unable to load courses for your department. Please check your connection."
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <div>
      <StepHeading
        step={1}
        title="Select your academic level"
        sub="Filter courses by your academic curriculum year to begin practice."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 items-stretch">
        {LEVELS.map((level) => {
          const levelCourses = courses.filter((c) => getCourseLevel(c.code) === level.value);
          const hasCourses = levelCourses.length > 0;
          const isStudentLevel = level.value === studentLevelNum;
          const sampleText = hasCourses
            ? `e.g. ${levelCourses.slice(0, 2).map((c) => c.code).join(', ')}`
            : 'No courses yet';

          if (!hasCourses) {
            return (
              <div
                key={level.value}
                aria-disabled="true"
                className="bg-surface-0 border border-border/60 rounded-xl p-4 sm:p-5 flex flex-col justify-between h-full opacity-60 cursor-not-allowed select-none"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-3xl font-bold tabular-nums text-text-muted">
                      {level.value}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-text-muted m-0 mb-1">
                    {level.description}
                  </p>
                  <p className="text-xs text-text-muted m-0">
                    Curriculum currently in development
                  </p>
                </div>
              </div>
            );
          }

          return (
            <button
              key={level.value}
              type="button"
              onClick={() => onSelect(level.value)}
              className="bg-surface-0 border border-border hover:border-primary hover:shadow-sm text-left rounded-xl p-4 sm:p-5 flex flex-col justify-between h-full transition-all duration-150 cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-3xl font-bold tabular-nums text-text-primary group-hover:text-primary transition-colors">
                    {level.value}
                  </span>
                  {isStudentLevel && (
                    <Badge variant="neutral" size="sm">
                      Your level
                    </Badge>
                  )}
                </div>
                <p className="text-sm font-semibold text-text-primary m-0 mb-1">
                  {level.description}
                </p>
                <p className="text-xs text-text-secondary m-0">
                  {levelCourses.length} {levelCourses.length === 1 ? 'course' : 'courses'} available
                </p>
              </div>

              <div className="mt-3.5 pt-2.5 border-t border-border flex items-center justify-between">
                <span className="text-xs text-text-muted font-mono truncate">
                  {sampleText}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Popover for "Not sure which level to pick?" */}
      <div className="mt-4 flex items-center">
        <Popover
          align="left"
          width="360px"
          trigger={
            <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-primary hover:underline cursor-pointer">
              <HelpCircle size={15} /> Not sure which level to pick?
            </span>
          }
        >
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-text-primary m-0 pb-1 border-b border-border">
              Academic Level Guide
            </h4>
            <div className="space-y-2 text-xs text-text-secondary">
              {LEVELS.map((lvl) => (
                <div key={lvl.value} className="flex gap-2 items-start">
                  <span className="font-bold text-text-primary shrink-0 w-12">{lvl.value}L:</span>
                  <span>{lvl.explanation}</span>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-text-muted m-0 pt-2 border-t border-border">
              Choose the level matching your current semester course load.
            </p>
          </div>
        </Popover>
      </div>
    </div>
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

const CourseStep: React.FC<CourseStepProps> = ({
  departmentId,
  level,
  studentLevel,
  onSelect,
  onBack,
  isStarting,
}) => {
  const [questionType, setQuestionType] = React.useState<QuestionTypeMix>('MIXED');
  const levelCaps = LEVEL_CAPS[studentLevel] ?? LEVEL_CAPS['100L'];
  const {
    data: allCoursesData,
    isLoading,
    isError,
    refetch,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useDepartmentCourses(departmentId);

  const allCoursesItems = React.useMemo(() => {
    return allCoursesData?.pages.flatMap((page) => page.items) || [];
  }, [allCoursesData]);

  const filteredCourses = allCoursesItems.filter((c: Course) => getCourseLevel(c.code) === level) ?? [];

  if (isError) {
    return (
      <ErrorState
        message="Unable to load courses for your department. Please check your connection."
        onRetry={() => refetch()}
      />
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div>
      <StepHeading
        step={2}
        title="Select a course to practice"
        sub={
          filteredCourses.length > 0
            ? `${filteredCourses.length} ${filteredCourses.length === 1 ? 'course' : 'courses'} available for Level ${level}.`
            : `No ${level}-level courses found.`
        }
      />

      {/* Level Policy Cap Banner */}
      <div className="bg-surface-0 border border-border rounded-xl p-3.5 sm:p-4 mb-5 flex items-center justify-between gap-3 flex-wrap text-xs sm:text-sm">
        <div className="flex items-center gap-2">
          <Badge variant="primary" size="sm">{studentLevel}</Badge>
          <span className="text-text-secondary">Academic Session Policies:</span>
        </div>
        <div className="flex items-center gap-3 text-text-secondary">
          <span>Max total: <strong className="text-text-primary tabular-nums">{levelCaps.totalCap} Qs</strong></span>
          <span aria-hidden="true" className="text-border">·</span>
          <span>Max theory: <strong className="text-text-primary tabular-nums">{levelCaps.theoryCap} Qs</strong></span>
        </div>
      </div>

      {/* Question Type Selector */}
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-text-muted m-0 mb-2">
          Question Format
        </p>
        <div role="group" aria-label="Question type" className="flex gap-2 sm:gap-3 flex-wrap">
          {QUESTION_TYPE_OPTIONS.map((opt) => {
            const isSelected = questionType === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setQuestionType(opt.value)}
                aria-pressed={isSelected}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-medium border transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-primary-light text-primary border-primary shadow-xs font-semibold'
                    : 'bg-surface-0 text-text-secondary border-border hover:border-text-secondary'
                }`}
              >
                {opt.icon}
                <span>{opt.label}</span>
              </button>
            );
          })}
        </div>
        <p className="text-xs text-text-muted m-0 mt-2">
          {QUESTION_TYPE_OPTIONS.find((o) => o.value === questionType)?.sub}
        </p>
      </div>

      {/* Course List or Empty State */}
      {filteredCourses.length === 0 ? (
        <div className="bg-surface-0 border border-border rounded-xl p-8 text-center">
          <p className="text-sm text-text-secondary m-0 mb-4">
            We don't have any active courses configured for Level {level} yet.
          </p>
          <Button variant="outline" size="sm" onClick={onBack}>
            <ArrowLeft size={14} className="mr-1.5" /> Select a different level
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filteredCourses.map((course: Course) => (
            <div
              key={course._id}
              className="bg-surface-0 border border-border rounded-xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-text-secondary transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2.5 mb-1">
                  <Badge variant="neutral" size="sm">{course.code}</Badge>
                  <h3 className="text-base font-semibold text-text-primary m-0 truncate">
                    {course.title}
                  </h3>
                </div>
                {course.description && (
                  <p className="text-xs text-text-secondary m-0 line-clamp-1">
                    {course.description}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2.5 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onSelect(course, 10, questionType)}
                  disabled={isStarting}
                >
                  {isStarting ? 'Starting...' : 'Quick Practice (10 Qs)'}
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => onSelect(course, 40, questionType)}
                  disabled={isStarting}
                >
                  {isStarting ? 'Starting...' : 'Full Mock Exam (40 Qs)'}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {hasNextPage && (
        <div className="flex justify-center mt-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            isLoading={isFetchingNextPage}
          >
            Load More Courses
          </Button>
        </div>
      )}

      {/* Back button */}
      <div className="mt-6 pt-4 border-t border-border">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft size={14} className="mr-1.5" /> Back to Level Selection
        </Button>
      </div>
    </div>
  );
};

// ── Wizard Root ──────────────────────────────────────────────────────────────
export const ExamWizard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { mutate: startSession, isPending: isStarting } = useStartSession();
  const isStartingRef = React.useRef(false);
  const [isImmediateStarting, setIsImmediateStarting] = React.useState(false);

  const studentLevel = user?.level ?? '100L';
  const studentLevelNum = parseInt(studentLevel.replace(/\D/g, ''), 10) || 100;

  const [step, setStep] = React.useState<WizardStep>('level');
  const [selectedLevel, setSelectedLevel] = React.useState<number>(studentLevelNum);

  const handleLevelSelect = (level: number) => {
    setSelectedLevel(level);
    setStep('course');
  };

  const handleCourseSelect = (course: Course, totalQuestions: number, questionType: QuestionTypeMix) => {
    if (isStartingRef.current || isStarting) return;
    isStartingRef.current = true;
    setIsImmediateStarting(true);

    startSession(
      { courseId: course._id, totalQuestions, questionType },
      {
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
      }
    );
  };

  if (!user?.departmentId) {
    return (
      <EmptyState
        icon={<AlertTriangle size={32} className="text-warning" />}
        title="Department Required"
        description="Please select your academic department to view available exam prep courses."
        actionLabel="Complete Onboarding"
        onAction={() => navigate({ to: '/onboarding' })}
      />
    );
  }

  const currentStepIndex = step === 'level' ? 0 : 1;

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-6">
      {/* Real Stepper Header */}
      <div className="bg-surface-0 border border-border rounded-xl p-4 sm:p-5">
        <Stepper
          steps={[
            { id: 'level', label: '1. Academic Level', sublabel: `Level ${selectedLevel}` },
            { id: 'course', label: '2. Course & Format', sublabel: 'Practice or mock' },
          ]}
          currentStepIndex={currentStepIndex}
          onStepClick={(index) => {
            if (index === 0) setStep('level');
          }}
        />
      </div>

      {/* Step Content */}
      <div className="relative">
        {step === 'level' && (
          <LevelStep
            onSelect={handleLevelSelect}
            departmentId={user.departmentId}
            studentLevelNum={studentLevelNum}
          />
        )}
        {step === 'course' && (
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
