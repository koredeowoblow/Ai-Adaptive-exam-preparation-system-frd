import * as React from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';
import { useOnboarding } from '../hooks/useOnboarding';
import { useDocumentTitle } from '../../../shared/hooks/useDocumentTitle';
import { Button } from '../../../shared/components/Button';
import { Select } from '../../../shared/components/Select';
import { Card } from '../../../shared/components/Card';
import { Skeleton } from '../../../shared/components/Skeleton';
import { useSuspenseDepartments } from '../../curriculum/hooks/useCurriculum';
import { curriculumApi } from '../../curriculum/api/curriculum.api';
import { queryKeys } from '../../../shared/queryKeys';
import type { Course } from '../../../types/course.types';
import {
  Sparkles,
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  GraduationCap,
  Compass,
} from 'lucide-react';

export const OnboardingForm: React.FC = () => {
  useDocumentTitle('Welcome to EduAdapt');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { mutateAsync: completeOnboarding } = useOnboarding();
  const { data: departments } = useSuspenseDepartments();

  const [step, setStep] = React.useState<1 | 2 | 3>(1);
  const [selectedDepartmentId, setSelectedDepartmentId] = React.useState<string>(() => {
    return departments && departments.length > 0 ? departments[0]._id : '';
  });
  const [courses, setCourses] = React.useState<Course[]>([]);
  const [selectedCourseIds, setSelectedCourseIds] = React.useState<string[]>([]);
  const [failedCourseIds, setFailedCourseIds] = React.useState<string[]>([]);
  const [isLoadingCourses, setIsLoadingCourses] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const departmentOptions = departments?.map(d => ({
    value: d._id,
    label: d.name,
  })) || [];

  const selectedDepartmentName = React.useMemo(() => {
    return departments?.find(d => d._id === selectedDepartmentId)?.name || 'Department';
  }, [departments, selectedDepartmentId]);

  const handleProceedToStep2 = async () => {
    if (!selectedDepartmentId) {
      setErrorMessage('Please select a department to continue.');
      return;
    }
    setErrorMessage(null);
    setIsLoadingCourses(true);
    setStep(2);

    try {
      const res = await curriculumApi.getDepartmentCourses(selectedDepartmentId);
      const items = res.data?.items || (Array.isArray(res.data) ? res.data : []);
      setCourses(items);
      // Automatically preselect all courses by default
      if (items.length > 0) {
        setSelectedCourseIds(items.map((c: Course) => c._id));
      } else {
        setSelectedCourseIds([]);
      }
    } catch (err: any) {
      setCourses([]);
      setErrorMessage(
        err?.response?.data?.message ||
        err?.message ||
        'Failed to load courses for this department.'
      );
    } finally {
      setIsLoadingCourses(false);
    }
  };

  const handleToggleCourse = (courseId: string) => {
    setSelectedCourseIds(prev =>
      prev.includes(courseId)
        ? prev.filter(id => id !== courseId)
        : [...prev, courseId]
    );
    // If user interacts, clear it from failed list if present
    setFailedCourseIds(prev => prev.filter(id => id !== courseId));
  };

  const handleToggleAllCourses = () => {
    if (selectedCourseIds.length === courses.length) {
      setSelectedCourseIds([]);
      setFailedCourseIds([]);
    } else {
      setSelectedCourseIds(courses.map(c => c._id));
    }
  };

  const handleCompleteSetup = async (retryCourseIds?: string[]) => {
    setIsSubmitting(true);
    setErrorMessage(null);

    const toEnroll = retryCourseIds ?? selectedCourseIds;

    try {
      // Save department, courses, and mark isOnboarded: true atomically in the backend
      await completeOnboarding({
        departmentId: selectedDepartmentId,
        courseIds: toEnroll,
      });

      setFailedCourseIds([]);

      // Optimistically update auth state so route guards immediately recognize the student is onboarded
      queryClient.setQueryData(queryKeys.auth.me(), (old: any) => {
        if (!old) return old;
        return {
          ...old,
          departmentId: selectedDepartmentId,
          enrolledCourseIds: toEnroll,
          isOnboarded: true,
        };
      });

      // Invalidate queries so dashboard and profile load fresh state
      await queryClient.invalidateQueries({ queryKey: queryKeys.auth.me() });
      await queryClient.invalidateQueries({ queryKey: ['student', 'enrolled-courses'] });

      setStep(3);
    } catch (err: any) {
      setErrorMessage(
        err?.response?.data?.message ||
        err?.message ||
        'Failed to complete onboarding setup. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkipCourses = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await completeOnboarding({
        departmentId: selectedDepartmentId,
        courseIds: [],
      });

      setSelectedCourseIds([]);
      setFailedCourseIds([]);

      queryClient.setQueryData(queryKeys.auth.me(), (old: any) => {
        if (!old) return old;
        return {
          ...old,
          departmentId: selectedDepartmentId,
          isOnboarded: true,
        };
      });

      await queryClient.invalidateQueries({ queryKey: queryKeys.auth.me() });
      await queryClient.invalidateQueries({ queryKey: ['student', 'enrolled-courses'] });
      setStep(3);
    } catch (err: any) {
      setErrorMessage(
        err?.response?.data?.message ||
        err?.message ||
        'Failed to save department. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };


  const selectedCoursesList = React.useMemo(() => {
    return courses.filter(c => selectedCourseIds.includes(c._id));
  }, [courses, selectedCourseIds]);

  return (
    <div className="animate-fade-in w-full max-w-xl mx-auto">
      {/* ── STEP PROGRESS BAR ── */}
      <nav aria-label="Onboarding Progress" className="flex items-center justify-center gap-2 mb-8">
        {[
          { num: 1, label: 'Department' },
          { num: 2, label: 'Courses' },
          { num: 3, label: 'Ready' },
        ].map((s, idx) => (
          <React.Fragment key={s.num}>
            {idx > 0 && (
              <div
                className="w-8 h-[2px] rounded-full transition-colors duration-200"
                style={{
                  backgroundColor: step >= s.num ? 'var(--color-primary)' : 'var(--color-border)',
                }}
              />
            )}
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200"
              style={{
                backgroundColor: step === s.num
                  ? 'var(--color-primary-light)'
                  : step > s.num
                    ? 'var(--color-surface-raised)'
                    : 'transparent',
                color: step === s.num
                  ? 'var(--color-primary)'
                  : step > s.num
                    ? 'var(--color-text)'
                    : 'var(--color-text-muted)',
                border: `1px solid ${step === s.num ? 'var(--color-primary)' : 'var(--color-border)'}`,
              }}
            >
              <span
                className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold"
                style={{
                  backgroundColor: step >= s.num ? 'var(--color-primary)' : 'var(--color-border)',
                  color: step >= s.num ? '#ffffff' : 'var(--color-text-muted)',
                }}
              >
                {step > s.num ? '✓' : s.num}
              </span>
              <span>{s.label}</span>
            </div>
          </React.Fragment>
        ))}
      </nav>

      {/* ── STEP 1: WELCOME & DEPARTMENT ── */}
      {step === 1 && (
        <div className="flex flex-col gap-6">
          <div className="text-center">
            <h1 className="h2 mb-2" style={{ color: 'var(--color-text)' }}>Welcome to EduAdapt</h1>
            <p className="body-base" style={{ color: 'var(--color-text-secondary)', margin: 0 }}>
              Let's personalize your learning experience in two quick steps.
            </p>
          </div>

          {/* Adaptive Engine Explanation Callout */}
          <div
            style={{
              padding: 'var(--space-16) var(--space-20)',
              backgroundColor: 'var(--color-surface-0)',
              border: '1px solid var(--color-border)',
              borderLeft: '4px solid var(--color-primary)',
              borderRadius: 'var(--radius-lg)',
              display: 'flex',
              gap: 'var(--space-12)',
              alignItems: 'flex-start',
            }}
          >
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--color-primary-light)',
                color: 'var(--color-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Sparkles size={20} />
            </div>
            <div>
              <h3 className="body-base font-bold mb-1" style={{ color: 'var(--color-text)' }}>
                Questions adapt to your skill in real-time
              </h3>
              <p className="body-small" style={{ color: 'var(--color-text-secondary)', margin: 0, lineHeight: 1.55 }}>
                As you practice, question difficulty dynamically adjusts based on your performance. Answer correctly to unlock higher challenges, or receive targeted practice to reinforce foundational concepts.
              </p>
            </div>
          </div>

          <Card tier="primary">
            <div className="flex flex-col gap-4">
              <Select
                label="Primary Department"
                id="departmentId"
                options={departmentOptions}
                value={selectedDepartmentId}
                onChange={(e) => setSelectedDepartmentId(e.target.value)}
              />
              <p className="caption" style={{ color: 'var(--color-text-secondary)', margin: 0, fontWeight: 500 }}>
                This specifies your academic focus and selects the curriculum available to you.
              </p>
            </div>
          </Card>

          {errorMessage && (
            <div className="text-sm text-center" style={{ color: 'var(--color-danger)' }}>
              {errorMessage}
            </div>
          )}

          <Button
            type="button"
            variant="primary"
            size="lg"
            className="w-full"
            onClick={handleProceedToStep2}
          >
            Continue to Choose Courses <ArrowRight size={16} style={{ marginLeft: 6 }} />
          </Button>
        </div>
      )}

      {/* ── STEP 2: COURSE SELECTION ── */}
      {step === 2 && (
        <div className="flex flex-col gap-6">
          <div className="text-center">
            <h1 className="h2 mb-2" style={{ color: 'var(--color-text)' }}>Choose Your Courses</h1>
            <p className="body-base" style={{ color: 'var(--color-text-secondary)', margin: 0 }}>
              Select courses in <strong>{selectedDepartmentName}</strong> to begin preparing for.
            </p>
          </div>

          {isLoadingCourses ? (
            <div className="flex flex-col gap-3">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} style={{ height: 72, borderRadius: 'var(--radius-md)' }} />
              ))}
            </div>
          ) : courses.length === 0 ? (
            <div
              style={{
                padding: 'var(--space-32) var(--space-20)',
                textAlign: 'center',
                backgroundColor: 'var(--color-surface-0)',
                border: '1px dashed var(--color-border)',
                borderRadius: 'var(--radius-lg)',
              }}
            >
              <Compass size={32} color="var(--color-text-muted)" style={{ margin: '0 auto 12px' }} />
              <p className="body-base font-medium" style={{ color: 'var(--color-text)', margin: '0 0 4px' }}>
                No courses listed yet for this department
              </p>
              <p className="body-small" style={{ color: 'var(--color-text-muted)', margin: 0 }}>
                You can complete your profile setup now and add courses anytime in your account.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-center px-1">
                <span className="caption" style={{ color: 'var(--color-text-muted)', fontWeight: 600 }}>
                  {selectedCourseIds.length} of {courses.length} selected
                </span>
                <button
                  type="button"
                  onClick={handleToggleAllCourses}
                  className="text-xs font-semibold bg-transparent border-none cursor-pointer p-0"
                  style={{ color: 'var(--color-primary)' }}
                >
                  {selectedCourseIds.length === courses.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>

              <div
                className="flex flex-col gap-2.5"
                style={{ maxHeight: '340px', overflowY: 'auto', paddingRight: '4px' }}
                role="group"
                aria-label="Available Courses"
              >
                {courses.map(course => {
                  const isSelected = selectedCourseIds.includes(course._id);
                  const isFailed = failedCourseIds.includes(course._id);
                  return (
                    <label
                      key={course._id}
                      htmlFor={`course-checkbox-${course._id}`}
                      className="cursor-pointer transition-all duration-150"
                      style={{
                        padding: 'var(--space-16)',
                        borderRadius: 'var(--radius-md)',
                        border: `1.5px solid ${isFailed ? 'var(--color-danger)' : isSelected ? 'var(--color-primary)' : 'var(--color-border)'}`,
                        backgroundColor: isSelected ? 'var(--color-surface-raised)' : 'var(--color-surface-0)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 'var(--space-12)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-12)', minWidth: 0 }}>
                        <div
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: 'var(--radius-md)',
                            backgroundColor: isSelected ? 'var(--color-primary-light)' : 'var(--color-surface-1)',
                            color: isSelected ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          <BookOpen size={18} />
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
                            <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-text)' }}>
                              {course.code}
                            </span>
                            <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--color-text)' }}>
                              {course.title}
                            </span>
                          </div>
                          {course.description && (
                            <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {course.description}
                            </p>
                          )}
                          {isFailed && (
                            <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: 'var(--color-danger)', fontWeight: 600 }}>
                              Enrollment failed. Click Retry below.
                            </p>
                          )}
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        id={`course-checkbox-${course._id}`}
                        checked={isSelected}
                        onChange={() => handleToggleCourse(course._id)}
                        style={{
                          width: 18,
                          height: 18,
                          accentColor: 'var(--color-primary)',
                          cursor: 'pointer',
                          flexShrink: 0,
                        }}
                      />
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {errorMessage && (
            <div className="text-sm text-center" style={{ color: 'var(--color-danger)' }}>
              {errorMessage}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-12)' }}>
            <div style={{ display: 'flex', gap: 'var(--space-12)' }}>
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={() => { setStep(1); setErrorMessage(null); }}
                disabled={isSubmitting}
              >
                <ArrowLeft size={16} style={{ marginRight: 6 }} /> Back
              </Button>
              {failedCourseIds.length > 0 ? (
                <Button
                  type="button"
                  variant="primary"
                  size="lg"
                  className="flex-1"
                  onClick={() => handleCompleteSetup(failedCourseIds)}
                  isLoading={isSubmitting}
                >
                  Retry Failed Courses ({failedCourseIds.length})
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="primary"
                  size="lg"
                  className="flex-1"
                  onClick={() => handleCompleteSetup()}
                  isLoading={isSubmitting}
                >
                  {selectedCourseIds.length > 0 ? 'Enroll & Complete Setup' : 'Complete Setup'}
                </Button>
              )}
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="w-full text-xs text-[var(--color-text-muted)]"
              onClick={handleSkipCourses}
              disabled={isSubmitting}
            >
              Skip course selection for now
            </Button>
          </div>
        </div>
      )}

      {/* ── STEP 3: SETUP COMPLETE & CLEAR CALL TO ACTION ── */}
      {step === 3 && (
        <div className="flex flex-col gap-6 text-center animate-fade-in">
          <div
            style={{
              width: 60,
              height: 60,
              borderRadius: '50%',
              backgroundColor: 'var(--color-success-light, rgba(34,197,94,0.15))',
              color: 'var(--color-success, #22c55e)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto',
            }}
          >
            <CheckCircle2 size={34} />
          </div>

          <div>
            <h1 className="h2 mb-2" style={{ color: 'var(--color-text)' }}>You're all set!</h1>
            <p className="body-base" style={{ color: 'var(--color-text-secondary)', margin: 0 }}>
              Your workspace is ready in <strong>{selectedDepartmentName}</strong> with{' '}
              <strong>{selectedCourseIds.length} enrolled course{selectedCourseIds.length === 1 ? '' : 's'}</strong>.
            </p>
          </div>

          {selectedCoursesList.length > 0 && (
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '8px',
                justifyContent: 'center',
                padding: 'var(--space-12)',
                backgroundColor: 'var(--color-surface-0)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
              }}
            >
              {selectedCoursesList.map(c => (
                <span
                  key={c._id}
                  className="badge"
                  style={{
                    backgroundColor: 'var(--color-surface-raised)',
                    color: 'var(--color-text)',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                  }}
                >
                  {c.code}
                </span>
              ))}
            </div>
          )}

          <Card tier="primary">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-12)', textAlign: 'left' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <GraduationCap size={20} color="var(--color-primary)" />
                <span style={{ fontWeight: 600, color: 'var(--color-text)', fontSize: '0.95rem' }}>
                  Next step: Calibrate your initial skill rating
                </span>
              </div>
              <p className="body-small" style={{ color: 'var(--color-text-secondary)', margin: 0, lineHeight: 1.55 }}>
                Take your first practice session or diagnostic exam. As you solve questions, the adaptive algorithm measures your answers and tailors difficulty for every topic.
              </p>
            </div>
          </Card>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-12)' }}>
            <Button
              type="button"
              variant="primary"
              size="lg"
              className="w-full"
              onClick={() => navigate({ to: '/exam-prep' })}
            >
              Start First Practice Session →
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="md"
              className="w-full"
              onClick={() => navigate({ to: '/dashboard' })}
            >
              Explore Student Dashboard
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
