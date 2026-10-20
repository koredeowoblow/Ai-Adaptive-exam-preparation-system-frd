import * as React from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { AppLayout } from '../../shared/components/layout/AppLayout';
import { useCourseTopics, useCourse } from '../../features/curriculum/hooks/useCurriculum';
import { useTopbar } from '../../shared/context/TopbarContext';
import { useStartSession } from '../../features/practice-session/hooks/usePractice';
import { useStudentProfile, useEnrollCourse } from '../../features/profile/hooks/useProfile';
import { useDocumentTitle } from '../../shared/hooks/useDocumentTitle';
import { Button } from '../../shared/components/Button';
import { Badge } from '../../shared/components/Badge';
import { Skeleton } from '../../shared/components/Skeleton';
import { ErrorState } from '../../shared/components/ErrorState';
import { ConfirmDialog } from '../../shared/components/ConfirmDialog';
import { ProgressBar } from '../../shared/components/ProgressBar';
import { CheckCircle2, ChevronRight, BookOpen, Layers, ArrowLeft } from 'lucide-react';
import type { Topic } from '../../types/topic.types';
import type { BadgeVariant } from '../../shared/components/Badge';
import { requireAuth } from '../../features/auth/utils/authGuard';

// Helper to determine Elo tier (Restrained palette, strictly NO orange)
const getMasteryBadge = (elo: number = 0): { label: string; variant: BadgeVariant } => {
  if (elo < 1000) return { label: 'Beginner', variant: 'neutral' };
  if (elo < 1200) return { label: 'Developing', variant: 'info' };
  if (elo < 1400) return { label: 'Competent', variant: 'success' };
  if (elo < 1600) return { label: 'Proficient', variant: 'primary' };
  return { label: 'Advanced', variant: 'primary' };
};

export const Route = createFileRoute('/courses/$courseId')({
  beforeLoad: async ({ context }) => {
    return requireAuth(context, {
      allowedRoles: ['student', 'admin', 'superAdmin'],
    });
  },
  component: CourseDetails,
});

function CourseDetails() {
  const { courseId } = Route.useParams();
  const navigate = useNavigate();

  const { data: course, isLoading: isCourseLoading } = useCourse(courseId);
  const courseCode = course?.code || 'Course';
  const courseTitle = course?.title ? `${course.code}: ${course.title}` : 'Course Details';

  useDocumentTitle(courseTitle);

  useTopbar({
    title: courseTitle,
    breadcrumbs: [
      { label: 'Courses', to: '/courses' },
      { label: courseCode },
    ],
  });

  const {
    data: topicsData,
    isLoading: isTopicsLoading,
    error,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useCourseTopics(courseId);

  const { data: profile } = useStudentProfile();
  const { mutate: enrollCourse, isPending: isEnrolling } = useEnrollCourse();
  const [isEnrollModalOpen, setIsEnrollModalOpen] = React.useState(false);

  const isEnrolled = React.useMemo(() => {
    if (!profile?.enrolledCourses) return false;
    return profile.enrolledCourses.some((c: any) =>
      typeof c === 'string' ? c === courseId : c._id === courseId
    );
  }, [profile, courseId]);

  const allTopics = React.useMemo(() => {
    return topicsData?.pages.flatMap((page) => page.items) || [];
  }, [topicsData]);

  const { mutate: startSession, isPending: isStarting } = useStartSession();
  const isStartingRef = React.useRef(false);
  const [isImmediateStarting, setIsImmediateStarting] = React.useState(false);

  const handleStartPractice = () => {
    if (isStartingRef.current || isStarting) return;
    isStartingRef.current = true;
    setIsImmediateStarting(true);

    startSession(
      { courseId, totalQuestions: 10 },
      {
        onSuccess: (response) => {
          navigate({ to: '/exam/$sessionId', params: { sessionId: response.data.session._id } });
        },
        onError: () => {
          isStartingRef.current = false;
          setIsImmediateStarting(false);
        },
      }
    );
  };

  const handleStartExam = () => {
    if (isStartingRef.current || isStarting) return;
    isStartingRef.current = true;
    setIsImmediateStarting(true);

    startSession(
      { courseId, totalQuestions: 40 },
      {
        onSuccess: (response) => {
          navigate({ to: '/exam/$sessionId', params: { sessionId: response.data.session._id } });
        },
        onError: () => {
          isStartingRef.current = false;
          setIsImmediateStarting(false);
        },
      }
    );
  };

  const handleConfirmEnroll = () => {
    enrollCourse(courseId, {
      onSuccess: () => {
        setIsEnrollModalOpen(false);
      },
    });
  };

  const isLoading = isCourseLoading || isTopicsLoading;

  if (isLoading) {
    return (
      <AppLayout>
        <div className="page-container page-catalog">
          <div className="flex flex-col gap-8 pb-16">
            {/* Header Skeleton */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 pb-6 border-b border-border">
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-6 w-20 rounded-md" />
                  <Skeleton className="h-6 w-24 rounded-md" />
                  <Skeleton className="h-6 w-24 rounded-md" />
                </div>
                <Skeleton className="h-9 w-80 rounded-lg" />
                <Skeleton className="h-5 w-64 rounded-md" />
              </div>
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-36 rounded-lg" />
                <Skeleton className="h-10 w-44 rounded-lg" />
              </div>
            </div>

            {/* Topics Skeleton */}
            <div className="flex flex-col gap-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="h-20 rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (error || !course) {
    return (
      <AppLayout>
        <div className="page-container page-catalog">
          <ErrorState message="Failed to load course details. Please verify your connection." />
        </div>
      </AppLayout>
    );
  }

  const derivedLevel = course.level
    ? `${course.level} Level`
    : course.code?.match(/(\d{3,})/)?.[1]
    ? `${Math.floor(parseInt(course.code.match(/(\d{3,})/)![1], 10) / 100) * 100} Level`
    : 'Undergraduate';

  return (
    <AppLayout>
      <div className="page-container page-catalog">
        <div className="flex flex-col gap-8 pb-16">

          {/* ── Header: Course Code, Title, Level, Topic Count & Enrollment State ── */}
          <header className="bg-surface-0 border border-border rounded-xl p-6 sm:p-8 flex flex-col md:flex-row md:items-start justify-between gap-6 shadow-xs">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-3">
                <Badge variant="primary" size="md">
                  {course.code}
                </Badge>
                <Badge variant="neutral" size="md">
                  {derivedLevel}
                </Badge>
                <Badge variant="neutral" size="md">
                  <Layers size={13} className="mr-1" />
                  {allTopics.length} {allTopics.length === 1 ? 'Topic' : 'Topics'}
                </Badge>
                {isEnrolled ? (
                  <Badge variant="success" size="md">
                    <CheckCircle2 size={13} className="mr-1" /> Enrolled
                  </Badge>
                ) : (
                  <Badge variant="neutral" size="md">
                    Not Enrolled
                  </Badge>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-text-primary m-0 mb-2">
                {course.title}
              </h1>

              <p className="text-sm sm:text-base text-text-secondary m-0 leading-relaxed max-w-2xl">
                {course.description || 'Master all curriculum topics through adaptive question calibration and exam simulations.'}
              </p>
            </div>

            {/* Actions: Primary is Enroll (or Quick practice when enrolled). Secondary is Full mock exam */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
              {!isEnrolled ? (
                <>
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => setIsEnrollModalOpen(true)}
                  >
                    Enroll in Course
                  </Button>
                  <Button
                    variant="outline"
                    size="md"
                    onClick={handleStartPractice}
                    isLoading={isStarting || isImmediateStarting}
                    disabled={isStarting || isImmediateStarting}
                  >
                    Quick Practice (10 Qs)
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="primary"
                    size="md"
                    onClick={handleStartPractice}
                    isLoading={isStarting || isImmediateStarting}
                    disabled={isStarting || isImmediateStarting}
                  >
                    Quick Practice (10 Qs)
                  </Button>
                  <div className="flex flex-col items-center">
                    <Button
                      variant="outline"
                      size="md"
                      onClick={handleStartExam}
                      isLoading={isStarting || isImmediateStarting}
                      disabled={isStarting || isImmediateStarting}
                      className="w-full"
                    >
                      Full Mock Exam (40 Qs)
                    </Button>
                    <span className="text-[11px] text-text-muted mt-1 font-medium">
                      Timed, exam conditions
                    </span>
                  </div>
                </>
              )}
            </div>
          </header>

          {/* ── Curriculum Topics List ── */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg sm:text-xl font-bold text-text-primary m-0 flex items-center gap-2">
                <BookOpen size={18} className="text-primary" /> Curriculum Topics
              </h2>
              <span className="text-xs text-text-muted font-medium">
                Click any topic to practice
              </span>
            </div>

            {allTopics.length === 0 ? (
              <div className="bg-surface-0 border border-dashed border-border rounded-xl p-10 text-center">
                <p className="text-base font-semibold text-text-primary m-0 mb-1">
                  No topics available for this course yet
                </p>
                <p className="text-sm text-text-secondary m-0 mb-4">
                  The curriculum for this course is being curated. Check back soon or explore other courses.
                </p>
                <Button variant="outline" size="sm" onClick={() => navigate({ to: '/courses' })}>
                  <ArrowLeft size={14} className="mr-1.5" /> Back to Courses
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                {allTopics.map((topic: Topic, index: number) => {
                  const mastery = getMasteryBadge(0);
                  const topicOrder = topic.order || index + 1;
                  // Standard question pool estimate per topic
                  const questionsCount = 15;

                  return (
                    <button
                      key={topic._id}
                      type="button"
                      onClick={handleStartPractice}
                      disabled={isStarting || isImmediateStarting}
                      className="bg-surface-0 border border-border rounded-xl p-4 sm:p-5 flex items-center justify-between gap-4 text-left transition-all duration-150 hover:border-text-secondary hover:bg-surface-1 group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50"
                    >
                      {/* Topic index & name */}
                      <div className="flex items-center gap-3.5 flex-1 min-w-0">
                        <span className="w-8 h-8 rounded-lg bg-surface-1 border border-border flex items-center justify-center text-xs font-semibold tabular-nums text-text-secondary shrink-0 group-hover:border-primary group-hover:text-primary transition-colors">
                          {topicOrder}
                        </span>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-sm sm:text-base font-semibold text-text-primary m-0 truncate group-hover:text-primary transition-colors">
                            {topic.name}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-text-muted">
                              Topic {topicOrder}
                            </span>
                            <span aria-hidden="true" className="text-border">·</span>
                            <span className="text-xs text-text-muted tabular-nums">
                              {questionsCount} questions pool
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right metadata: difficulty badge, mastery bar & chevron */}
                      <div className="flex items-center gap-4 sm:gap-6 shrink-0">
                        <Badge variant={mastery.variant} size="sm">
                          {mastery.label}
                        </Badge>

                        {/* Mastery Bar */}
                        <div className="hidden md:flex flex-col items-end w-28">
                          <div className="w-full">
                            <ProgressBar progress={0} size="sm" variant="primary" />
                          </div>
                          <span className="text-[10px] text-text-muted mt-1 uppercase font-medium">
                            0% Mastered
                          </span>
                        </div>

                        <ChevronRight
                          size={18}
                          className="text-text-muted group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0"
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {hasNextPage && (
              <div className="flex justify-center mt-6">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchNextPage()}
                  isLoading={isFetchingNextPage}
                  disabled={isFetchingNextPage}
                >
                  Load More Topics
                </Button>
              </div>
            )}
          </section>

          {/* ── Enrollment Confirmation Modal ── */}
          <ConfirmDialog
            isOpen={isEnrollModalOpen}
            title="Enroll in Course"
            message={`Would you like to enroll in ${course.code}: ${course.title}? It will be added to your study dashboard and curriculum tracking.`}
            confirmText="Confirm Enrollment"
            onConfirm={handleConfirmEnroll}
            onCancel={() => setIsEnrollModalOpen(false)}
            isPending={isEnrolling}
          />

        </div>
      </div>
    </AppLayout>
  );
}
