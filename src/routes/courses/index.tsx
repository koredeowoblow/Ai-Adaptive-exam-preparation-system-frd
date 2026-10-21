import * as React from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { AppLayout } from '../../shared/components/layout/AppLayout';
import { useDepartments, useDepartmentCourses } from '../../features/curriculum/hooks/useCurriculum';
import { CourseCard } from '../../features/curriculum/components/CourseCard';
import { Skeleton } from '../../shared/components/Skeleton';
import { ErrorState } from '../../shared/components/ErrorState';
import type { Department } from '../../types/department.types';
import type { Course } from '../../types/course.types';
import { Search, X, SearchX, Library } from 'lucide-react';
import { useAuth } from '../../features/auth/hooks/useAuth';
import { useDocumentTitle } from '../../shared/hooks/useDocumentTitle';
import { requireAuth } from '../../features/auth/utils/authGuard';

export const Route = createFileRoute('/courses/')({
  beforeLoad: async ({ context }) => {
    await requireAuth(context, { allowedRoles: ['student', 'admin', 'superAdmin'] });
  },
  component: CoursesIndex,
});

function CoursesIndex() {
  useDocumentTitle('Course Catalog EduAdapt');
  const { user } = useAuth();
  const { data: departments, isLoading: deptsLoading, error: deptsError } = useDepartments();
  const [selectedDeptId, setSelectedDeptId] = React.useState<string | null>(null);
  const [selectedLevel, setSelectedLevel] = React.useState<number | 'ALL'>('ALL');
  const [search, setSearch] = React.useState('');

  const isAdmin = user?.role === 'admin' || user?.role === 'superAdmin' || (user as any)?.type === 'admin';
  const userDeptId = (typeof user?.departmentId === 'object' && user?.departmentId !== null)
    ? (user.departmentId as any)._id
    : user?.departmentId;

  const visibleDepartments = React.useMemo(() => {
    if (!departments || !Array.isArray(departments)) return [];
    if (isAdmin) return departments;
    if (userDeptId) {
      const match = departments.filter((d: any) => d._id === userDeptId);
      if (match.length > 0) return match;
    }
    return departments;
  }, [departments, isAdmin, userDeptId]);

  const currentDeptName = React.useMemo(() => {
    if (!departments || !Array.isArray(departments)) return '';
    const d = departments.find((dept: any) => dept._id === (selectedDeptId || userDeptId));
    return d?.name || '';
  }, [departments, selectedDeptId, userDeptId]);

  React.useEffect(() => {
    if (userDeptId && !isAdmin) {
      setSelectedDeptId(userDeptId);
    } else if (visibleDepartments.length > 0 && !selectedDeptId) {
      setSelectedDeptId(visibleDepartments[0]._id);
    }
  }, [visibleDepartments, selectedDeptId, userDeptId, isAdmin]);

  const {
    data: coursesData,
    isLoading: coursesLoading,
    error: coursesError,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage
  } = useDepartmentCourses(selectedDeptId || '');

  const studentLevel = user?.level ?? '';
  const studentLevelNum = parseInt(studentLevel.replace(/\D/g, ''), 10) || 100;

  const allCourses = React.useMemo(() => {
    return coursesData?.pages.flatMap((page: any) => (Array.isArray(page) ? page : page?.items || [])) || [];
  }, [coursesData]);

  const has500Courses = React.useMemo(() => {
    return allCourses.some((c: Course) => c.level === 500);
  }, [allCourses]);

  const filteredCourses = React.useMemo(() => {
    let result = [...allCourses];
    if (selectedLevel !== 'ALL') {
      result = result.filter((c: Course) => c.level === selectedLevel);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((c: Course) =>
        c.title.toLowerCase().includes(q) || c.code?.toLowerCase().includes(q)
      );
    }
    if (selectedLevel === 'ALL') {
      result.sort((a: Course, b: Course) => {
        const aIsOwn = a.level === studentLevelNum ? 1 : 0;
        const bIsOwn = b.level === studentLevelNum ? 1 : 0;
        if (aIsOwn !== bIsOwn) return bIsOwn - aIsOwn;
        if (a.level !== b.level) return (a.level || 0) - (b.level || 0);
        return (a.code || '').localeCompare(b.code || '');
      });
    }
    return result;
  }, [allCourses, search, selectedLevel, studentLevelNum]);

  if (deptsLoading) return (
    <AppLayout userName={user?.name || "Student"}>
      <div className="page-container page-catalog">
        <div style={{ marginBottom: 40 }}>
          <Skeleton style={{ height: '40px', width: '250px', maxWidth: '100%', marginBottom: 12 }} />
          <Skeleton style={{ height: '20px', width: '350px', maxWidth: '100%' }} />
        </div>
        <div style={{ display: 'flex', gap: 16, marginBottom: 32 }}>
          {[1, 2, 3].map(i => <Skeleton key={i} style={{ height: '36px', width: '120px', borderRadius: 20 }} />)}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
          {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} style={{ height: '240px', borderRadius: 8 }} />)}
        </div>
      </div>
    </AppLayout>
  );

  if (deptsError) return (
    <AppLayout userName={user?.name || "Student"}>
      <div className="page-container page-catalog">
        <ErrorState message="We couldn't load the course catalog. Please try again." />
      </div>
    </AppLayout>
  );

  return (
    <AppLayout userName={user?.name || "Student"}>
      <div className="page-container page-catalog">
        {/* -- Page Header -- */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginBottom: 32 }}>
          <div>
            <h1 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, fontSize: '1.75rem', letterSpacing: '-0.005em', margin: '0 0 8px', color: 'var(--color-text-primary)' }}>
              Course Catalog
            </h1>
            <p style={{ margin: 0, fontSize: '1rem', color: 'var(--color-text-secondary)', maxWidth: 600 }}>
              {isAdmin
                ? 'Explore authentic LASUSTECH departments and courses organized by academic level.'
                : `Academic courses for ${currentDeptName ? `the Department of ${currentDeptName}` : 'your department'}, organized by academic level.`}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20 }}>
            {/* Department Tabs (Rendered only if multiple departments are available to filter) */}
            {visibleDepartments.length > 1 && (
              <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4, maxWidth: '100%' }}>
                {visibleDepartments.map((dept: Department) => {
                  const isActive = selectedDeptId === dept._id;
                  const isUserDept = userDeptId === dept._id;
                  return (
                    <button
                      key={dept._id}
                      onClick={() => { setSelectedDeptId(dept._id); setSearch(''); }}
                      style={{
                        all: 'unset', cursor: 'pointer', padding: '6px 16px',
                        fontWeight: 500, fontSize: '0.9rem',
                        color: isActive ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                        background: isActive ? 'var(--color-primary-light)' : 'transparent',
                        border: '1px solid',
                        borderColor: isActive ? 'var(--color-primary-light)' : 'transparent',
                        borderRadius: 20,
                        whiteSpace: 'nowrap',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6
                      }}
                      onMouseOver={e => { if (!isActive) e.currentTarget.style.background = 'var(--color-surface-1)'; }}
                      onMouseOut={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
                    >
                      <span>{dept.name}</span>
                      {isUserDept && (
                        <span style={{
                          fontSize: '0.65rem',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          padding: '1px 5px',
                          borderRadius: 8,
                          background: 'var(--color-primary)',
                          color: '#fff'
                        }}>
                          My Dept
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Search Bar */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              background: 'var(--color-surface-0)', border: '1px solid var(--color-border)',
              borderRadius: 24, padding: '8px 16px', minWidth: 240, flex: '1 1 240px', maxWidth: 360,
              transition: 'border-color 0.2s ease',
            }}>
              <Search size={16} color="var(--color-text-muted)" style={{ flexShrink: 0 }} />
              <input
                type="text"
                placeholder="Search courses..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '0.9rem', color: 'var(--color-text-primary)', fontFamily: 'inherit', flex: 1 }}
              />
              {search && (
                <button onClick={() => setSearch('')} style={{ all: 'unset', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <X size={16} color="var(--color-text-muted)" />
                </button>
              )}
            </div>
          </div>

          {/* Academic Level Filter Bar */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            overflowX: 'auto',
            padding: '8px 12px',
            background: 'var(--color-surface-0)',
            borderRadius: 12,
            border: '1px solid var(--color-border)'
          }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginRight: 4 }}>
              Filter by Level:
            </span>
            {(['ALL', 100, 200, 300, 400, 500] as const).map((lvl) => {
              const isActive = selectedLevel === lvl;
              const isDisabled = lvl === 500 && !has500Courses;
              return (
                <button
                  key={lvl}
                  onClick={() => !isDisabled && setSelectedLevel(lvl)}
                  disabled={isDisabled}
                  aria-disabled={isDisabled}
                  style={{
                    all: 'unset',
                    cursor: isDisabled ? 'not-allowed' : 'pointer',
                    padding: '4px 14px',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    borderRadius: 16,
                    background: isActive ? 'var(--color-primary)' : 'var(--color-surface-1)',
                    color: isActive ? '#ffffff' : 'var(--color-text-secondary)',
                    border: '1px solid',
                    borderColor: isActive ? 'var(--color-primary)' : 'var(--color-border)',
                    opacity: isDisabled ? 0.4 : 1,
                    transition: 'all 0.15s ease',
                  }}
                  onMouseOver={e => { if (!isActive && !isDisabled) e.currentTarget.style.background = 'var(--color-surface-2)'; }}
                  onMouseOut={e => { if (!isActive && !isDisabled) e.currentTarget.style.background = 'var(--color-surface-1)'; }}
                  title={isDisabled ? 'No courses available for 500 Level' : undefined}
                >
                  {lvl === 'ALL' ? 'All Levels' : `${lvl}L`}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Courses Grid ── */}
        {coursesLoading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
            {[1, 2, 3, 4].map(i => <Skeleton key={i} style={{ height: '240px', borderRadius: 8 }} />)}
          </div>
        ) : coursesError ? (
          <ErrorState message="We couldn't load the courses for this department. Please try again." />
        ) : filteredCourses?.length === 0 ? (
          <div style={{
            padding: '80px 24px', textAlign: 'center',
            background: 'var(--color-surface-0)', border: '1px dashed var(--color-border)',
            borderRadius: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
          }}>
            <div style={{
              width: 48, height: 48, borderRadius: 24, background: 'var(--color-surface-1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20
            }}>
              {search ? <SearchX size={24} color="var(--color-text-muted)" /> : <Library size={24} color="var(--color-text-muted)" />}
            </div>
            <h3 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 600, fontSize: '1.25rem', margin: '0 0 8px', color: 'var(--color-text-primary)' }}>
              {search ? 'No courses match your search' : 'No courses available'}
            </h3>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem', margin: '0 0 24px', maxWidth: 400 }}>
              {search ? 'Try adjusting your search terms or clearing the search.' : 'This department has no courses yet.'}
            </p>
            {search && (
              <button onClick={() => setSearch('')} className="btn-outline" style={{ borderRadius: 999, padding: '8px 24px' }}>
                Clear search
              </button>
            )}
          </div>
        ) : (
          <div style={{
            display: 'grid',
            // Prevent the grid from stretching a single card across the entire container
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '24px',
            alignItems: 'start'
          }}>
            {filteredCourses?.map((course: Course) => (
              <CourseCard key={course._id} course={course} />
            ))}
          </div>
        )}

        {hasNextPage && !search.trim() && filteredCourses.length > 8 && (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '32px' }}>
            <button
              className="btn-outline"
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
              style={{ borderRadius: 999, padding: '8px 24px' }}
            >
              {isFetchingNextPage ? 'Loading more...' : 'Load More Courses'}
            </button>
          </div>
        )}

      </div>
    </AppLayout>
  );
}
