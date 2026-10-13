import * as React from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { AppLayout } from '../shared/components/layout/AppLayout';
import { useDocumentTitle } from '../shared/hooks/useDocumentTitle';
import { useGlobalLeaderboard, useCourseLeaderboard } from '../features/leaderboard/hooks/useLeaderboard';
import { useDepartmentCourses } from '../features/curriculum/hooks/useCurriculum';
import { useAuth } from '../features/auth/hooks/useAuth';
import { Modal } from '../shared/components/Modal';
import { Button } from '../shared/components/Button';
import { Skeleton } from '../shared/components/Skeleton';
import { EmptyState } from '../shared/components/EmptyState';
import { Trophy, Medal, Crown, Zap, User } from 'lucide-react';
import type { LeaderboardEntryData } from '../features/leaderboard/api/leaderboard.api';
import type { Course } from '../types/course.types';

import { requireAuth } from '../features/auth/utils/authGuard';

export const Route = createFileRoute('/leaderboard')({
  beforeLoad: async ({ context }) => {
    return requireAuth(context, {
      allowedRoles: ['student'],
      requireOnboarded: true,
    });
  },
  component: LeaderboardRoute,
});

function LeaderboardRoute() {
  useDocumentTitle('Leaderboard — EduAdapt');
  const [activeTab, setActiveTab] = React.useState<'global' | 'course'>('global');
  const [selectedCourseId, setSelectedCourseId] = React.useState<string>('');
  const [viewingStudent, setViewingStudent] = React.useState<LeaderboardEntryData | null>(null);

  const { user } = useAuth();
  const { data: globalData, isLoading: globalLoading } = useGlobalLeaderboard(50);
  const { data: coursesData } = useDepartmentCourses(user?.departmentId || '');
  const courses = React.useMemo(() => coursesData?.pages?.flatMap(p => p.items) || [], [coursesData]);

  const effectiveCourseId = selectedCourseId || (courses.length > 0 ? courses[0]._id : '');
  const { data: courseLeaderboardData, isLoading: courseLoading } = useCourseLeaderboard(effectiveCourseId, 50);

  const currentItems = activeTab === 'global' ? (globalData?.items || []) : (courseLeaderboardData?.items || []);
  const isLoading = activeTab === 'global' ? globalLoading : courseLoading;

  const topThree = currentItems.slice(0, 3);

  const renderRankBadge = (rank: number) => {
    if (rank === 1) {
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: '50%', backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)', fontWeight: 800 }}>
          <Crown size={18} />
        </span>
      );
    }
    if (rank === 2) {
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: '50%', backgroundColor: 'var(--color-surface-1)', color: 'var(--color-text-secondary)', fontWeight: 800 }}>
          <Medal size={18} />
        </span>
      );
    }
    if (rank === 3) {
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: '50%', backgroundColor: 'var(--color-surface-raised)', color: 'var(--color-text-secondary)', fontWeight: 800 }}>
          <Medal size={18} />
        </span>
      );
    }
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: '50%', backgroundColor: 'var(--color-surface-raised)', color: 'var(--color-text-secondary)', fontWeight: 700, fontSize: '0.9rem' }}>
        #{rank}
      </span>
    );
  };

  return (
    <AppLayout>
      <div className="page-container page-wide" style={{ paddingBottom: 'var(--space-64)' }}>
        
        {/* Header */}
        <header style={{ marginBottom: 'var(--space-32)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-12)', marginBottom: 'var(--space-8)' }}>
            <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-lg)', background: 'var(--color-primary-light)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Trophy size={24} />
            </div>
            <div>
              <h1 className="h1" style={{ margin: 0, color: 'var(--color-text)' }}>Academic Leaderboards</h1>
              <p className="body-base" style={{ margin: 0, color: 'var(--color-text-muted)' }}>
                See top performing students by score and course.
              </p>
            </div>
          </div>
        </header>

        {/* Tab switcher & course selector */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-32)', flexWrap: 'wrap', gap: 'var(--space-16)' }}>
          <div style={{ display: 'flex', background: 'var(--color-surface-0)', padding: 4, borderRadius: 12, border: '1px solid var(--color-border)' }}>
            <button
              onClick={() => setActiveTab('global')}
              style={{
                padding: '8px 20px',
                borderRadius: 8,
                border: 'none',
                fontWeight: 600,
                fontSize: '0.9rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                backgroundColor: activeTab === 'global' ? 'var(--color-primary)' : 'transparent',
                color: activeTab === 'global' ? '#fff' : 'var(--color-text-secondary)',
              }}
            >
              Global Standings
            </button>
            <button
              onClick={() => setActiveTab('course')}
              style={{
                padding: '8px 20px',
                borderRadius: 8,
                border: 'none',
                fontWeight: 600,
                fontSize: '0.9rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                backgroundColor: activeTab === 'course' ? 'var(--color-primary)' : 'transparent',
                color: activeTab === 'course' ? '#fff' : 'var(--color-text-secondary)',
              }}
            >
              Course Standings
            </button>
          </div>

          {activeTab === 'course' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-8)' }}>
              <span className="caption" style={{ color: 'var(--color-text-muted)', fontWeight: 600 }}>Course:</span>
              <select
                value={effectiveCourseId}
                onChange={(e) => setSelectedCourseId(e.target.value)}
                style={{
                  padding: '8px 16px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)',
                  backgroundColor: 'var(--color-surface-0)',
                  color: 'var(--color-text)',
                  fontSize: '0.9rem',
                  fontFamily: 'inherit',
                }}
              >
                {courses.map((c: Course) => (
                  <option key={c._id} value={c._id}>
                    {c.code} — {c.title}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Podium for Top 3 */}
        {!isLoading && topThree.length > 0 && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 'var(--space-20)',
            marginBottom: 'var(--space-32)',
            alignItems: 'end',
          }}>
            {/* Rank 2 (Silver) */}
            {topThree[1] && (
              <div className="card" style={{
                textAlign: 'center',
                padding: 'var(--space-24)',
                border: '1px solid var(--color-border)',
                background: 'var(--color-surface-0)',
                order: 1,
              }}>
                <div style={{ marginBottom: 12 }}>
                  <span style={{ display: 'inline-flex', padding: 8, borderRadius: '50%', background: 'var(--color-surface-1)', color: 'var(--color-text-secondary)' }}>
                    <Medal size={28} />
                  </span>
                </div>
                <h3 className="h4" style={{ margin: '0 0 4px', color: 'var(--color-text)' }}>
                  {topThree[1].studentId?.name || 'Anonymous Student'}
                </h3>
                <p className="caption" style={{ color: 'var(--color-text-muted)', margin: '0 0 12px' }}>Rank #2</p>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--color-surface-raised)', padding: '6px 14px', borderRadius: 20 }}>
                  <Zap size={14} color="var(--color-primary)" />
                  <span style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--color-text)' }}>{Math.round(topThree[1].score)}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>pts</span>
                </div>
              </div>
            )}

            {/* Rank 1 (Gold - Center and Elevated) */}
            {topThree[0] && (
              <div className="card" style={{
                textAlign: 'center',
                padding: 'var(--space-32) var(--space-24)',
                border: '1px solid var(--color-primary)',
                background: 'var(--color-surface-0)',
                boxShadow: 'var(--shadow-2)',
                order: 2,
              }}>
                <div style={{ marginBottom: 12 }}>
                  <span style={{ display: 'inline-flex', padding: 12, borderRadius: '50%', background: 'var(--color-primary-light)', color: 'var(--color-primary)' }}>
                    <Crown size={36} />
                  </span>
                </div>
                <span className="badge" style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)', fontWeight: 700, marginBottom: 8, display: 'inline-block' }}>
                  1st Place
                </span>
                <h3 className="h3" style={{ margin: '0 0 4px', color: 'var(--color-text)' }}>
                  {topThree[0].studentId?.name || 'Anonymous Student'}
                </h3>
                <p className="caption" style={{ color: 'var(--color-text-muted)', margin: '0 0 16px' }}>Rank #1 Leader</p>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--color-surface-raised)', padding: '8px 18px', borderRadius: 20, border: '1px solid var(--color-border)' }}>
                  <Zap size={16} color="var(--color-primary)" />
                  <span style={{ fontWeight: 800, fontSize: '1.4rem', color: 'var(--color-text)' }}>{Math.round(topThree[0].score)}</span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>pts</span>
                </div>
              </div>
            )}

            {/* Rank 3 (Bronze) */}
            {topThree[2] && (
              <div className="card" style={{
                textAlign: 'center',
                padding: 'var(--space-24)',
                border: '1px solid var(--color-border)',
                background: 'var(--color-surface-0)',
                order: 3,
              }}>
                <div style={{ marginBottom: 12 }}>
                  <span style={{ display: 'inline-flex', padding: 8, borderRadius: '50%', background: 'var(--color-surface-1)', color: 'var(--color-text-secondary)' }}>
                    <Medal size={28} />
                  </span>
                </div>
                <h3 className="h4" style={{ margin: '0 0 4px', color: 'var(--color-text)' }}>
                  {topThree[2].studentId?.name || 'Anonymous Student'}
                </h3>
                <p className="caption" style={{ color: 'var(--color-text-muted)', margin: '0 0 12px' }}>Rank #3</p>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--color-surface-raised)', padding: '6px 14px', borderRadius: 20 }}>
                  <Zap size={14} color="var(--color-primary)" />
                  <span style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--color-text)' }}>{Math.round(topThree[2].score)}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>pts</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Table / List */}
        {isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-12)' }}>
            {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} style={{ height: 68, borderRadius: 12 }} />)}
          </div>
        ) : currentItems.length === 0 ? (
          <EmptyState
            title="No leaderboard entries yet"
            description="Complete exams and adaptive practice sessions to earn points and claim a ranking."
            actionLabel="Start Practicing"
            onAction={() => window.location.href = '/exam-prep'}
          />
        ) : (
          <div style={{ background: 'var(--color-surface-0)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--color-border)', overflow: 'hidden' }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '60px 1fr 140px 100px',
              padding: 'var(--space-16) var(--space-24)',
              background: 'var(--color-surface-1)',
              borderBottom: '1px solid var(--color-border)',
              fontWeight: 700,
              fontSize: '0.75rem',
              color: 'var(--color-text-secondary)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}>
              <span>Rank</span>
              <span>Student</span>
              <span style={{ textAlign: 'right' }}>Mastery Score</span>
              <span style={{ textAlign: 'right' }}>Action</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {currentItems.map((entry, index) => {
                const rank = index + 1;
                return (
                  <div
                    key={entry._id || index}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '60px 1fr 140px 100px',
                      alignItems: 'center',
                      padding: 'var(--space-16) var(--space-24)',
                      borderBottom: index < currentItems.length - 1 ? '1px solid var(--color-border)' : 'none',
                      transition: 'background-color 0.15s ease',
                    }}
                    className="hover:bg-[var(--color-surface-raised)]"
                  >
                    <div>{renderRankBadge(rank)}</div>
                    <div>
                      <p style={{ margin: 0, fontWeight: 600, color: 'var(--color-text)', fontSize: '0.95rem' }}>
                        {entry.studentId?.name || 'Anonymous Student'}
                      </p>
                      {entry.courseId && (
                        <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                          {entry.courseId.code} — {entry.courseId.title}
                        </p>
                      )}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--color-primary)' }}>
                        {Math.round(entry.score)}
                      </span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setViewingStudent({ ...entry, rank })}
                      >
                        View
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* VIEW STUDENT DETAILS MODAL */}
        <Modal
          isOpen={!!viewingStudent}
          onClose={() => setViewingStudent(null)}
          title="Student Ranking Profile"
          description="Leaderboard competitor standing and details"
          size="sm"
        >
          {viewingStudent && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-16)' }}>
              <div style={{ textAlign: 'center', padding: 'var(--space-20)', background: 'var(--color-background-soft)', borderRadius: 'var(--radius-lg)' }}>
                <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--color-primary-light)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                  <User size={28} />
                </div>
                <h3 className="h3" style={{ margin: '0 0 4px', color: 'var(--color-text)' }}>
                  {viewingStudent.studentId?.name || 'Anonymous Student'}
                </h3>
                <span className="badge" style={{ fontWeight: 700 }}>Rank #{viewingStudent.rank}</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-12)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--space-12) 0', borderBottom: '1px solid var(--color-border)' }}>
                  <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>Total Mastery Score</span>
                  <span style={{ fontWeight: 800, color: 'var(--color-primary)' }}>{Math.round(viewingStudent.score)}</span>
                </div>
                {viewingStudent.courseId && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--space-12) 0', borderBottom: '1px solid var(--color-border)' }}>
                    <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>Course Track</span>
                    <span style={{ fontWeight: 600, color: 'var(--color-text)' }}>{viewingStudent.courseId.code}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--space-12) 0' }}>
                  <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>Standing Status</span>
                  <span style={{ color: 'var(--color-success)', fontWeight: 600 }}>Active Student</span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--space-16)' }}>
                <Button variant="secondary" onClick={() => setViewingStudent(null)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </Modal>

      </div>
    </AppLayout>
  );
}
