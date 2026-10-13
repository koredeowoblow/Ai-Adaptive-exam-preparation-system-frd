import * as React from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { AppLayout } from '../../shared/components/layout/AppLayout';
import { useCourseTopics } from '../../features/curriculum/hooks/useCurriculum';
import { useStartSession } from '../../features/practice-session/hooks/usePractice';
import { useStudentProfile, useEnrollCourse } from '../../features/profile/hooks/useProfile';
import { useDocumentTitle } from '../../shared/hooks/useDocumentTitle';
import { Button } from '../../shared/components/Button';
import { Skeleton } from '../../shared/components/Skeleton';
import { ErrorState } from '../../shared/components/ErrorState';
import { ConfirmDialog } from '../../shared/components/ConfirmDialog';
import { CheckCircle2, GraduationCap } from 'lucide-react';
import type { Topic } from '../../types/topic.types';

// Helper to determine Elo tier
const getMasteryTier = (elo: number = 0) => {
  if (elo < 1000) return { label: 'Beginner', color: 'var(--color-text-muted)' };
  if (elo < 1200) return { label: 'Developing', color: 'var(--color-info)' };
  if (elo < 1400) return { label: 'Competent', color: 'var(--color-success)' };
  if (elo < 1600) return { label: 'Strong', color: 'var(--color-accent)' };
  if (elo < 1800) return { label: 'Advanced', color: 'var(--color-warning)' };
  return { label: 'Expert', color: 'var(--color-danger)' };
};

import { requireAuth } from '../../features/auth/utils/authGuard';

export const Route = createFileRoute('/courses/$courseId')({
  beforeLoad: async ({ context }) => {
    return requireAuth(context, {
      allowedRoles: ['student', 'admin', 'superAdmin'],
    });
  },
  component: CourseDetails,
});

function CourseDetails() {
  useDocumentTitle('Course Details');
  const { courseId } = Route.useParams();
  const navigate = useNavigate();
  const {
    data: topicsData,
    isLoading,
    error,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage
  } = useCourseTopics(courseId);

  const { data: profile } = useStudentProfile();
  const { mutate: enrollCourse, isPending: isEnrolling } = useEnrollCourse();
  const [isEnrollModalOpen, setIsEnrollModalOpen] = React.useState(false);

  const isEnrolled = React.useMemo(() => {
    if (!profile?.enrolledCourses) return false;
    return profile.enrolledCourses.some((c: any) => (typeof c === 'string' ? c === courseId : c._id === courseId));
  }, [profile, courseId]);

  const allTopics = React.useMemo(() => {
    return topicsData?.pages.flatMap(page => page.items) || [];
  }, [topicsData]);
  const { mutate: startSession, isPending: isStarting } = useStartSession();

  const handleStartPractice = () => {
    startSession({ courseId, totalQuestions: 10 }, {
      onSuccess: (response) => {
        navigate({ to: `/exam/$sessionId`, params: { sessionId: response.data.session._id } });
      }
    });
  };

  const handleStartExam = () => {
    startSession({ courseId, totalQuestions: 40 }, {
      onSuccess: (response) => {
        navigate({ to: `/exam/$sessionId`, params: { sessionId: response.data.session._id } });
      }
    });
  };

  const handleConfirmEnroll = () => {
    enrollCourse(courseId, {
      onSuccess: () => {
        setIsEnrollModalOpen(false);
      }
    });
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="page-container page-catalog">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-48)' }}>
            <Skeleton style={{ height: '48px', width: '250px' }} />
            <Skeleton style={{ height: '48px', width: '200px' }} />
          </div>
          {[1, 2, 3].map(i => <Skeleton key={i} style={{ height: '100px', marginBottom: 'var(--space-12)' }} />)}
        </div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout>
        <div className="page-container page-catalog">
          <ErrorState message="Failed to load course details. Please try again." />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="page-container page-catalog">
        <header style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 'var(--space-64)',
          flexWrap: 'wrap',
          gap: 'var(--space-24)'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-12)', marginBottom: 'var(--space-8)' }}>
              <h1 className="display-2" style={{ margin: 0 }}>Course Curriculum</h1>
              {isEnrolled ? (
                <span className="badge" style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'var(--color-success-light, rgba(34,197,94,0.1))', color: 'var(--color-success, #22c55e)', border: '1px solid var(--color-success, #22c55e)' }}>
                  <CheckCircle2 size={14} /> Enrolled
                </span>
              ) : (
                <Button variant="outline" size="sm" onClick={() => setIsEnrollModalOpen(true)}>
                  <GraduationCap size={16} style={{ marginRight: 6 }} /> Enroll in Course
                </Button>
              )}
            </div>
            <p className="body-large" style={{ color: 'var(--color-text-muted)', margin: 0 }}>Master these topics to complete the course.</p>
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-12)', flexWrap: 'wrap' }}>
            <Button variant="outline" size="lg" onClick={handleStartPractice} isLoading={isStarting}>
              Start Quick Practice
            </Button>
            <Button variant="accent" size="lg" onClick={handleStartExam} isLoading={isStarting}>
              Start Full Exam (40 Qs)
            </Button>
          </div>
        </header>

        {allTopics.length === 0 ? (
          <div style={{ padding: 'var(--space-64) var(--space-32)', textAlign: 'center', border: '1px dashed var(--color-border)', borderRadius: 'var(--radius-xl)' }}>
            <p className="body-large" style={{ color: 'var(--color-text-muted)' }}>No topics available for this course yet.</p>
          </div>
        ) : (
          <div className="stack-vertical">
            {allTopics.map((topic: Topic, index: number) => (
              <div
                key={topic._id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-16)',
                  padding: 'var(--space-24) 0',
                  flexWrap: 'wrap',
                  borderBottom: index !== allTopics.length - 1 ? '1px solid var(--color-border)' : 'none'
                }}
              >
                <div style={{
                  width: '2.75rem', height: '2.75rem', borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--color-background-soft)', color: 'var(--color-text)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 600, fontSize: '1rem', border: '1px solid var(--color-border)',
                  flexShrink: 0
                }}>
                  {topic.order || index + 1}
                </div>
                <div style={{ flex: '1 1 200px', minWidth: 0 }}>
                  <h3 className="h4" style={{ marginBottom: 'var(--space-4)', wordBreak: 'break-word' }}>{topic.name}</h3>
                  <p className="body-small" style={{ color: 'var(--color-text-muted)', margin: 0 }}>Topic {index + 1}</p>
                </div>

                <div
                  style={{
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    padding: '0.375rem 0.75rem',
                    borderRadius: 'var(--radius-full)',
                    backgroundColor: 'transparent',
                    color: getMasteryTier(0).color,
                    border: `1px solid ${getMasteryTier(0).color}`,
                    alignSelf: 'center'
                  }}
                >
                  {getMasteryTier(0).label}
                </div>
              </div>
            ))}
          </div>
        )}

        {hasNextPage && (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 'var(--space-32)' }}>
            <Button
              variant="outline"
              onClick={() => fetchNextPage()}
              isLoading={isFetchingNextPage}
            >
              Load More Topics
            </Button>
          </div>
        )}

        {/* ENROLLMENT CONFIRMATION MODAL */}
        <ConfirmDialog
          isOpen={isEnrollModalOpen}
          title="Enroll in Course"
          message="Would you like to enroll in this course? It will be tracked in your active curriculum and student progress statistics."
          confirmText="Confirm Enrollment"
          onConfirm={handleConfirmEnroll}
          onCancel={() => setIsEnrollModalOpen(false)}
          isPending={isEnrolling}
        />

      </div>
    </AppLayout>
  );
}
