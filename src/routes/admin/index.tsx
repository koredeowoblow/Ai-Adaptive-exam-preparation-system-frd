import * as React from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { useDocumentTitle } from '../../shared/hooks/useDocumentTitle';
import { useAuth } from '../../features/auth/hooks/useAuth';
import {
  useDepartments,
  useCourses,
  useTopics,
  useQuestions,
  useCreateDepartment,
  useCreateCourse,
  useCreateTopic,
} from '../../features/admin/hooks/useAdmin';
import { Modal } from '../../shared/components/Modal';
import { Button } from '../../shared/components/Button';
import { DepartmentForm } from '../../features/admin/components/DepartmentForm';
import { CourseForm } from '../../features/admin/components/CourseForm';
import { TopicForm } from '../../features/admin/components/TopicForm';
import type { Course } from '../../types/course.types';
import type { Department } from '../../types/department.types';
import {
  Building2,
  BookOpen,
  Layers,
  HelpCircle,
  Plus,
  ArrowRight,
  ShieldCheck,
  Activity,
  Zap,
  CheckCircle2,
  Cpu,
  Lock,
  Search,
} from 'lucide-react';

export const Route = createFileRoute('/admin/')({
  component: AdminOverviewRoute,
});

function AdminOverviewRoute() {
  useDocumentTitle('Admin Control Center — EduAdapt');
  const { user } = useAuth();

  const { data: deptData, isLoading: loadingDepts } = useDepartments();
  const { data: courseData, isLoading: loadingCourses } = useCourses();
  const { data: topicData, isLoading: loadingTopics } = useTopics();
  const { data: questionData, isLoading: loadingQuestions } = useQuestions();

  const { mutate: createDepartment, isPending: creatingDept } = useCreateDepartment();
  const { mutate: createCourse, isPending: creatingCourse } = useCreateCourse();
  const { mutate: createTopic, isPending: creatingTopic } = useCreateTopic();

  const [isDeptModalOpen, setIsDeptModalOpen] = React.useState(false);
  const [isCourseModalOpen, setIsCourseModalOpen] = React.useState(false);
  const [isTopicModalOpen, setIsTopicModalOpen] = React.useState(false);
  const [searchFilter, setSearchFilter] = React.useState('');

  const departments: Department[] = Array.isArray(deptData) ? deptData : [];
  const courses: Course[] = React.useMemo(
    () =>
      courseData?.pages
        ?.flatMap((p: any) => (p?.items ? p.items : Array.isArray(p) ? p : []))
        ?.filter(Boolean) ?? [],
    [courseData]
  );
  const topics = React.useMemo(
    () =>
      topicData?.pages
        ?.flatMap((p: any) => (p?.items ? p.items : Array.isArray(p) ? p : []))
        ?.filter(Boolean) ?? [],
    [topicData]
  );
  const questions = React.useMemo(() => questionData?.items ?? [], [questionData]);

  const totalDepartments = departments.length;
  const totalCourses = (courseData?.pages as any)?.[0]?.total ?? courses.length;
  const totalTopics = (topicData?.pages as any)?.[0]?.total ?? topics.length;
  const totalQuestions = questionData?.total ?? questions.length;


  const handleCreateDeptSubmit = (data: any) => {
    createDepartment(data, {
      onSuccess: () => setIsDeptModalOpen(false),
    });
  };

  const handleCreateCourseSubmit = (data: any) => {
    createCourse(data, {
      onSuccess: () => setIsCourseModalOpen(false),
    });
  };

  const handleCreateTopicSubmit = (data: any) => {
    createTopic(data, {
      onSuccess: () => setIsTopicModalOpen(false),
    });
  };

  const filteredCourses = React.useMemo(() => {
    if (!searchFilter.trim()) return courses.slice(0, 6);
    const q = searchFilter.toLowerCase();
    return courses.filter(
      (c) =>
        c &&
        ((c.title?.toLowerCase().includes(q)) ||
        (c.code?.toLowerCase().includes(q)))
    );
  }, [courses, searchFilter]);

  const stats = [
    {
      title: 'Departments',
      subtitle: 'Faculties & divisions',
      count: totalDepartments,
      icon: <Building2 size={22} color="var(--color-primary)" />,
      link: '/admin/departments',
      accentColor: 'var(--color-primary)',
      bgLight: 'var(--color-primary-light)',
      loading: loadingDepts,
    },
    {
      title: 'Accredited Courses',
      subtitle: 'Curriculum catalog',
      count: totalCourses,
      icon: <BookOpen size={22} color="var(--color-success)" />,
      link: '/admin/courses',
      accentColor: 'var(--color-success)',
      bgLight: 'var(--color-success-light)',
      loading: loadingCourses,
    },
    {
      title: 'Learning Topics',
      subtitle: 'Syllabus modules',
      count: totalTopics,
      icon: <Layers size={22} color="var(--color-warning)" />,
      link: '/admin/topics',
      accentColor: 'var(--color-warning)',
      bgLight: 'var(--color-warning-light)',
      loading: loadingTopics,
    },
    {
      title: 'Question Bank',
      subtitle: 'Adaptive items calibrated',
      count: totalQuestions,
      icon: <HelpCircle size={22} color="var(--color-accent)" />,
      link: '/admin/questions',
      accentColor: 'var(--color-accent)',
      bgLight: 'var(--color-accent-light)',
      loading: loadingQuestions,
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-32)', paddingBottom: 'var(--space-64)' }}>
      {/* ── TOP HERO COMMAND BAR ── */}
      <div
        style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-xl)',
          padding: 'var(--space-32)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 'var(--space-24)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '4px 12px',
              borderRadius: 999,
              background: 'var(--color-surface-raised)',
              border: '1px solid var(--color-border)',
              fontSize: '0.75rem',
              fontWeight: 700,
              color: 'var(--color-primary)',
              marginBottom: 12,
            }}
          >
            <ShieldCheck size={14} />
            <span>SYSTEM CONSOLE · PRIVILEGED ACCESS</span>
          </div>

          <h1 className="h2" style={{ margin: '0 0 8px', color: 'var(--color-text)', letterSpacing: '-0.02em' }}>
            Administrative Dashboard
          </h1>
          <p className="body-base" style={{ margin: 0, color: 'var(--color-text-secondary)', maxWidth: 620 }}>
            Welcome back, <strong>{user?.name || 'Administrator'}</strong>. Oversee academic curriculum structure, manage course syllabi, and monitor the calibrated question bank.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div style={{ display: 'flex', gap: 'var(--space-12)', flexWrap: 'wrap' }}>
          <Button variant="outline" size="sm" onClick={() => setIsDeptModalOpen(true)}>
            <Plus size={15} style={{ marginRight: 6 }} /> Department
          </Button>
          <Button variant="outline" size="sm" onClick={() => setIsCourseModalOpen(true)}>
            <Plus size={15} style={{ marginRight: 6 }} /> Course
          </Button>
          <Button variant="outline" size="sm" onClick={() => setIsTopicModalOpen(true)}>
            <Plus size={15} style={{ marginRight: 6 }} /> Topic
          </Button>
          <Link to="/admin/questions" style={{ textDecoration: 'none' }}>
            <Button variant="primary" size="sm">
              <Plus size={15} style={{ marginRight: 6 }} /> New Question
            </Button>
          </Link>
        </div>
      </div>

      {/* ── METRIC STATS GRID ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 'var(--space-20)',
        }}
      >
        {stats.map((s, idx) => (
          <Link
            key={idx}
            to={s.link}
            style={{ textDecoration: 'none', color: 'inherit' }}
          >
            <div
              className="card"
              style={{
                padding: 'var(--space-24)',
                borderRadius: 'var(--radius-lg)',
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                height: '100%',
                border: '1px solid var(--color-border)',
                background: 'var(--color-surface)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text)' }}>
                    {s.title}
                  </span>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: 2 }}>
                    {s.subtitle}
                  </div>
                </div>

                <div
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: s.bgLight,
                    border: `1px solid ${s.accentColor}33`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {s.icon}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '2.4rem', fontWeight: 800, color: 'var(--color-text)', lineHeight: 1, letterSpacing: '-0.03em' }}>
                  {s.loading ? '...' : s.count}
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    marginTop: 14,
                    fontSize: '0.8rem',
                    color: 'var(--color-primary)',
                    fontWeight: 600,
                  }}
                >
                  <span>Manage {s.title}</span>
                  <ArrowRight size={14} />
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* ── MAIN WORKSPACE SECTION: CURRICULUM OVERVIEW & ENGINE TELEMETRY ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: 'var(--space-24)',
        }}
      >
        {/* Department Architecture Card */}
        <div className="card" style={{ padding: 'var(--space-24)', background: 'var(--color-surface)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Building2 size={20} color="var(--color-primary)" />
              <h3 className="h4" style={{ margin: 0, color: 'var(--color-text)' }}>Academic Departments</h3>
            </div>
            <Link to="/admin/departments" style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-primary)', textDecoration: 'none' }}>
              View All →
            </Link>
          </div>

          <p className="body-sm" style={{ color: 'var(--color-text-secondary)', marginBottom: 20 }}>
            Structured faculties hosting accredited degree programs and course curricula.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {departments.length === 0 ? (
              <div style={{ padding: 'var(--space-20)', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                No departments created yet. Click "+ Department" above to add your first faculty.
              </div>
            ) : (
              departments.slice(0, 5).map((d) => (
                <div
                  key={d._id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--color-surface-0)',
                    border: '1px solid var(--color-border)',
                  }}
                >
                  <div style={{ minWidth: 0, flex: 1, paddingRight: 12 }}>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--color-text)', display: 'block' }}>
                      {d.name}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {d.description || 'Academic department unit'}
                    </span>
                  </div>

                  <Link to="/admin/courses" style={{ textDecoration: 'none' }}>
                    <span
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        color: 'var(--color-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      Courses <ArrowRight size={13} />
                    </span>
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Course Catalog Card with live filter */}
        <div className="card" style={{ padding: 'var(--space-24)', background: 'var(--color-surface)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <BookOpen size={20} color="var(--color-success)" />
              <h3 className="h4" style={{ margin: 0, color: 'var(--color-text)' }}>Course Catalog</h3>
            </div>
            <Link to="/admin/courses" style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-primary)', textDecoration: 'none' }}>
              All Courses →
            </Link>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, background: 'var(--color-surface-0)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '6px 12px' }}>
            <Search size={15} color="var(--color-text-muted)" />
            <input
              type="text"
              placeholder="Filter courses by code or title..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              style={{
                border: 'none',
                background: 'transparent',
                outline: 'none',
                fontSize: '0.85rem',
                color: 'var(--color-text)',
                width: '100%',
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filteredCourses.length === 0 ? (
              <div style={{ padding: 'var(--space-20)', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                {courses.length === 0 ? 'No courses in database. Add a course to start.' : 'No courses match filter.'}
              </div>
            ) : (
              filteredCourses.map((c) => (
                <div
                  key={c._id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--color-surface-0)',
                    border: '1px solid var(--color-border)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span
                      style={{
                        padding: '3px 8px',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: 'var(--color-surface-raised)',
                        color: 'var(--color-primary)',
                        fontWeight: 700,
                        fontSize: '0.8rem',
                        fontFamily: 'monospace',
                        border: '1px solid var(--color-border)',
                      }}
                    >
                      {c.code}
                    </span>
                    <div>
                      <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--color-text)', display: 'block' }}>
                        {c.title}
                      </span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
                        {c.description || 'Curriculum Course'}
                      </span>
                    </div>
                  </div>


                  <Link to="/admin/topics" style={{ textDecoration: 'none' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      Topics <ArrowRight size={13} />
                    </span>
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ── SYSTEM ARCHITECTURE & ENGINE STATUS (Zero fluff, true telemetry) ── */}
      <div className="card" style={{ padding: 'var(--space-24)', background: 'var(--color-surface)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <Activity size={20} color="var(--color-primary)" />
          <h3 className="h4" style={{ margin: 0, color: 'var(--color-text)' }}>
            System Infrastructure & Core Services
          </h3>
        </div>

        <p className="body-sm" style={{ color: 'var(--color-text-secondary)', marginBottom: 20 }}>
          Real-time status of backend subsystems powering adaptive exam calibration and exam integrity.
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 'var(--space-16)',
          }}
        >
          <div
            style={{
              padding: 'var(--space-16)',
              borderRadius: 'var(--radius-md)',
              background: 'var(--color-surface-0)',
              border: '1px solid var(--color-border)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Zap size={16} color="var(--color-warning)" />
                <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--color-text)' }}>ELO Engine</span>
              </div>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.72rem', color: 'var(--color-success)', fontWeight: 700 }}>
                <CheckCircle2 size={13} /> ACTIVE
              </span>
            </div>
            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
              Dynamically matches student skill ratings with topic question difficulty (Elo 1000–1800).
            </p>
          </div>

          <div
            style={{
              padding: 'var(--space-16)',
              borderRadius: 'var(--radius-md)',
              background: 'var(--color-surface-0)',
              border: '1px solid var(--color-border)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Cpu size={16} color="var(--color-primary)" />
                <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--color-text)' }}>Redis Caching</span>
              </div>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.72rem', color: 'var(--color-success)', fontWeight: 700 }}>
                <CheckCircle2 size={13} /> SYNCED
              </span>
            </div>
            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
              Single-flight stampede protection and fast invalidation on curriculum changes.
            </p>
          </div>

          <div
            style={{
              padding: 'var(--space-16)',
              borderRadius: 'var(--radius-md)',
              background: 'var(--color-surface-0)',
              border: '1px solid var(--color-border)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <ShieldCheck size={16} color="var(--color-success)" />
                <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--color-text)' }}>Integrity Guard</span>
              </div>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.72rem', color: 'var(--color-success)', fontWeight: 700 }}>
                <CheckCircle2 size={13} /> READY
              </span>
            </div>
            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
              Real-time tab switch, clipboard event, and timing telemetry verification during exams.
            </p>
          </div>

          <div
            style={{
              padding: 'var(--space-16)',
              borderRadius: 'var(--radius-md)',
              background: 'var(--color-surface-0)',
              border: '1px solid var(--color-border)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Lock size={16} color="var(--color-accent)" />
                <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--color-text)' }}>RBAC Security</span>
              </div>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.72rem', color: 'var(--color-success)', fontWeight: 700 }}>
                <CheckCircle2 size={13} /> ENFORCED
              </span>
            </div>
            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
              Strict role-based permissions prohibiting unauthenticated or non-admin access.
            </p>
          </div>
        </div>
      </div>

      {/* ── MODALS: QUICK CREATE DEPARTMENT ── */}
      <Modal
        isOpen={isDeptModalOpen}
        onClose={() => setIsDeptModalOpen(false)}
        title="Create Academic Department"
        description="Establish a new faculty or academic division for curriculum hosting."
        size="md"
      >
        <DepartmentForm
          onSubmit={handleCreateDeptSubmit}
          isSubmitting={creatingDept}
          onCancel={() => setIsDeptModalOpen(false)}
        />
      </Modal>

      {/* ── MODALS: QUICK CREATE COURSE ── */}
      <Modal
        isOpen={isCourseModalOpen}
        onClose={() => setIsCourseModalOpen(false)}
        title="Create Accredited Course"
        description="Register a new course code and curriculum under an academic department."
        size="md"
      >
        <CourseForm
          onSubmit={handleCreateCourseSubmit}
          isSubmitting={creatingCourse}
          onCancel={() => setIsCourseModalOpen(false)}
        />
      </Modal>

      {/* ── MODALS: QUICK CREATE TOPIC ── */}
      <Modal
        isOpen={isTopicModalOpen}
        onClose={() => setIsTopicModalOpen(false)}
        title="Create Course Topic"
        description="Define a new learning topic module belonging to an existing course."
        size="md"
      >
        <TopicForm
          courses={courses}
          onSubmit={handleCreateTopicSubmit}
          isSubmitting={creatingTopic}
          onCancel={() => setIsTopicModalOpen(false)}
        />
      </Modal>
    </div>
  );
}
