import * as React from 'react';
import { createLazyFileRoute, useNavigate } from '@tanstack/react-router';
import {
  usePlatformAnalytics,
  useCourseAnalytics,
  useCourses,
} from '../../features/admin/hooks/useAdmin';
import { useDocumentTitle } from '../../shared/hooks/useDocumentTitle';
import { PageHeader } from '../../shared/components/PageHeader';
import { Button } from '../../shared/components/Button';
import {
  Users,
  BookOpen,
  HelpCircle,
  Award,
  RotateCcw,
} from 'lucide-react';
import type { Course } from '../../types/course.types';

export const Route = createLazyFileRoute('/admin/analytics')({
  component: AnalyticsAdminRoute,
});

function AnalyticsAdminRoute() {
  useDocumentTitle('Admin: Platform Mastery & Analytics');
  const navigate = useNavigate({ from: '/admin/analytics' });
  const search = Route.useSearch();

  const selectedCourseId = (search as any).courseId || '';

  // API Queries
  const { data: platformStats, isLoading: isLoadingPlatform, refetch: refetchPlatform } = usePlatformAnalytics();
  const { data: coursesData } = useCourses();
  const { data: courseStats, isLoading: isLoadingCourseStats, refetch: refetchCourse } = useCourseAnalytics(
    selectedCourseId || undefined
  );

  const courses: Course[] = React.useMemo(() => {
    if (!coursesData) return [];
    return coursesData.pages.flatMap((page) => page.items);
  }, [coursesData]);

  const handleCourseFilterChange = (courseId: string) => {
    navigate({
      search: (prev: any) => ({
        ...prev,
        courseId: courseId || undefined,
      }),
    });
  };

  const handleRefresh = () => {
    refetchPlatform();
    if (selectedCourseId) {
      refetchCourse();
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-24)' }}>
      {/* Page Header */}
      <PageHeader
        title="Mastery Analytics & Performance"
        description="Comprehensive surveillance of student cohort mastery, Elo difficulty calibration, and course completion rates."
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-8)' }}>
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RotateCcw size={14} style={{ marginRight: '6px' }} />
            Refresh Metrics
          </Button>
        </div>
      </PageHeader>

      {/* Global Platform KPIs */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 'var(--space-12)',
        }}
      >
        <div
          style={{
            padding: 'var(--space-16)',
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-4)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>
              Registered Learners
            </span>
            <Users size={16} style={{ color: 'var(--color-primary)' }} />
          </div>
          <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
            {isLoadingPlatform ? '...' : (platformStats?.totalUsers ?? 0).toLocaleString()}
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
            Active student profiles
          </span>
        </div>

        <div
          style={{
            padding: 'var(--space-16)',
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-4)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>
              Accredited Courses
            </span>
            <BookOpen size={16} style={{ color: '#10b981' }} />
          </div>
          <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
            {isLoadingPlatform ? '...' : (platformStats?.totalCourses ?? courses.length).toLocaleString()}
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
            Curriculum syllabi available
          </span>
        </div>

        <div
          style={{
            padding: 'var(--space-16)',
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-4)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>
              Questions Answered
            </span>
            <HelpCircle size={16} style={{ color: '#f59e0b' }} />
          </div>
          <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
            {isLoadingPlatform ? '...' : (platformStats?.totalQuestionsAnswered ?? 0).toLocaleString()}
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
            Aggregate adaptive practice items
          </span>
        </div>

        <div
          style={{
            padding: 'var(--space-16)',
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-4)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>
              System Calibration
            </span>
            <Award size={16} style={{ color: '#8b5cf6' }} />
          </div>
          <span style={{ fontSize: '1.5rem', fontWeight: 700, color: '#10b981' }}>
            Optimized
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
            Item Response Theory active
          </span>
        </div>
      </div>

      {/* Course Focus Drilldown */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-16)',
          padding: 'var(--space-20)',
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--color-text-primary)', margin: 0 }}>
              Course Mastery Breakdown
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', margin: '4px 0 0 0' }}>
              Select a specific course to inspect completion volume and cohort mastery scores.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Filter Course:</span>
            <select
              value={selectedCourseId}
              onChange={(e) => handleCourseFilterChange(e.target.value)}
              aria-label="Filter course"
              style={{
                padding: '0.45rem 0.75rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-background-soft, var(--color-surface))',
                color: 'var(--color-text-primary)',
                fontSize: '0.8125rem',
                minWidth: '200px',
              }}
            >
              <option value="">Select a Course...</option>
              {courses.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.code ? `${c.code} - ` : ''}
                  {c.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {selectedCourseId && courseStats ? (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: 'var(--space-12)',
              paddingTop: 'var(--space-12)',
              borderTop: '1px solid var(--color-border)',
            }}
          >
            <div
              style={{
                padding: 'var(--space-12)',
                backgroundColor: 'var(--color-surface-hover)',
                borderRadius: 'var(--radius-sm)',
              }}
            >
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'block' }}>
                Enrolled Students
              </span>
              <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                {courseStats.totalStudents}
              </span>
            </div>

            <div
              style={{
                padding: 'var(--space-12)',
                backgroundColor: 'var(--color-surface-hover)',
                borderRadius: 'var(--radius-sm)',
              }}
            >
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'block' }}>
                Active Attempts
              </span>
              <span style={{ fontSize: '1.25rem', fontWeight: 700, color: '#3b82f6' }}>
                {courseStats.activeSessions}
              </span>
            </div>

            <div
              style={{
                padding: 'var(--space-12)',
                backgroundColor: 'var(--color-surface-hover)',
                borderRadius: 'var(--radius-sm)',
              }}
            >
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'block' }}>
                Completed Exams
              </span>
              <span style={{ fontSize: '1.25rem', fontWeight: 700, color: '#10b981' }}>
                {courseStats.completedSessions}
              </span>
            </div>

            <div
              style={{
                padding: 'var(--space-12)',
                backgroundColor: 'var(--color-surface-hover)',
                borderRadius: 'var(--radius-sm)',
              }}
            >
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'block' }}>
                Average Elo Mastery
              </span>
              <span style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f59e0b' }}>
                {Math.round(courseStats.averageMastery || 1200)}
              </span>
            </div>
          </div>
        ) : selectedCourseId && isLoadingCourseStats ? (
          <div style={{ padding: 'var(--space-20)', textAlign: 'center', color: 'var(--color-text-muted)' }}>
            Loading course performance statistics...
          </div>
        ) : (
          <div
            style={{
              padding: 'var(--space-24)',
              textAlign: 'center',
              backgroundColor: 'var(--color-surface-hover)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--color-text-secondary)',
              fontSize: '0.85rem',
            }}
          >
            Please choose a course from the dropdown above to view localized mastery distribution.
          </div>
        )}
      </div>

      {/* Curriculum Catalog Overview */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-12)',
          padding: 'var(--space-20)',
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
        }}
      >
        <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--color-text-primary)', margin: 0 }}>
          Curriculum Catalog Overview ({courses.length} courses)
        </h3>
        <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', margin: 0 }}>
          Active academic course modules calibrated in the EduAdapt assessment engine.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 'var(--space-12)', marginTop: 'var(--space-8)' }}>
          {courses.map((course) => (
            <div
              key={course._id}
              onClick={() => handleCourseFilterChange(course._id)}
              style={{
                padding: 'var(--space-12)',
                backgroundColor: selectedCourseId === course._id ? 'var(--color-primary-light)' : 'var(--color-surface-hover)',
                border: selectedCourseId === course._id ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--color-text-primary)' }}>
                  {course.code || 'COURSE'}
                </span>
                <span style={{ fontSize: '0.7rem', padding: '1px 5px', borderRadius: '4px', backgroundColor: 'var(--color-surface)', color: 'var(--color-text-muted)' }}>
                  Active
                </span>
              </div>
              <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                {course.title}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
