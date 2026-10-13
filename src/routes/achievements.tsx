import { createFileRoute } from '@tanstack/react-router';
import * as React from 'react';
import { AppLayout } from '../shared/components/layout/AppLayout';
import { useDocumentTitle } from '../shared/hooks/useDocumentTitle';
import { useAllAchievements, useMyAchievements } from '../features/achievements/hooks/useAchievements';
import { Star, Medal, Target, Zap, Award, Flame, Lock, CheckCircle2 } from 'lucide-react';
import { Skeleton } from '../shared/components/Skeleton';
import type { Achievement, StudentAchievement } from '../features/achievements/api/achievement.api';
import { useAuth } from '../features/auth/hooks/useAuth';

export const Route = createFileRoute('/achievements')({
  component: MilestonesRoute,
});

const ICON_MAP: Record<string, React.ReactNode> = {
  star: <Star size={20} />,
  flame: <Flame size={20} />,
  crown: <Award size={20} />,
  award: <Award size={20} />,
  medal: <Medal size={20} />,
  target: <Target size={20} />,
  zap: <Zap size={20} />,
  trophy: <Award size={20} />,
};

function MilestonesRoute() {
  useDocumentTitle('Learning Milestones  EduAdapt');
  const { user } = useAuth();

  const { data: allAchievements, isLoading: allLoading } = useAllAchievements();
  const { data: myAchievements, isLoading: myLoading } = useMyAchievements();

  const unlockedIds = new Set(myAchievements?.achievements?.map((a: StudentAchievement) => a.achievementId?._id));
  const isLoading = allLoading || myLoading;

  const unlockedCount = myAchievements?.summary?.unlockedCount ?? 0;
  const totalCount = myAchievements?.summary?.totalCount ?? (allAchievements?.length ?? 0);
  const progressPct = myAchievements?.summary?.progressPercentage ?? 0;

  return (
    <AppLayout userName={user?.name || "Student"}>
      <div className="page-container page-wide">

        {/* ── Header ── */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 40, flexWrap: 'wrap', gap: 24 }}>
          <div>
            <h1 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, fontSize: '1.75rem', margin: '0 0 8px', color: 'var(--color-text-primary)' }}>
              Learning Milestones
            </h1>
            <p style={{ margin: 0, fontSize: '1rem', color: 'var(--color-text-secondary)', maxWidth: 600 }}>
              Track your academic progress and major study milestones.
            </p>
          </div>

          {/* Progress Summary */}
          {!isLoading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 20, padding: '16px 24px', background: 'var(--color-surface-0)', border: '1px solid var(--color-border)', borderRadius: 12 }}>
              <div>
                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
                  Milestones Reached
                </p>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                  <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: '1.75rem', fontWeight: 700, lineHeight: 1, color: 'var(--color-text-primary)' }}>
                    {unlockedCount}
                  </span>
                  <span style={{ fontSize: '1rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>
                    / {totalCount}
                  </span>
                </div>
              </div>
              <div style={{ width: 1, height: 40, background: 'var(--color-border)' }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 600 }}>
                  <span style={{ color: 'var(--color-text-secondary)' }}>Completion</span>
                  <span style={{ color: 'var(--color-primary)' }}>{progressPct}%</span>
                </div>
                <div style={{ width: 120, height: 6, borderRadius: 3, background: 'var(--color-surface-2)', overflow: 'hidden' }}>
                  <div style={{ width: `${progressPct}%`, height: '100%', background: 'var(--color-primary)', borderRadius: 3, transition: 'width 1s ease' }} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Most Recent Milestone or Start Journey ── */}
        {!isLoading && (
          unlockedCount > 0 && myAchievements?.achievements?.[0] ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px', background: 'var(--color-surface-0)', border: '1px solid var(--color-border)', borderLeft: '4px solid var(--color-primary)', borderRadius: 8, marginBottom: 'var(--space-32)' }}>
              <CheckCircle2 size={18} color="var(--color-primary)" />
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600, display: 'block', marginBottom: 2 }}>
                  Most recent milestone
                </span>
                <span style={{ fontSize: '0.95rem', color: 'var(--color-text-primary)', fontWeight: 600 }}>
                  {myAchievements.achievements[0].achievementId?.name}
                </span>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px', background: 'var(--color-primary-light)', border: '1px solid var(--color-primary-border)', borderRadius: 8, marginBottom: 'var(--space-32)' }}>
              <Target size={18} color="var(--color-primary)" />
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600, display: 'block', marginBottom: 2 }}>
                  Start your journey
                </span>
                <span style={{ fontSize: '0.95rem', color: 'var(--color-text-primary)', fontWeight: 600 }}>
                  Complete adaptive sessions to earn your first milestone.
                </span>
              </div>
            </div>
          )
        )}

        {/* ── Milestones Grid ── */}
        {isLoading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
            {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} style={{ height: 140, borderRadius: 8 }} />)}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
            {allAchievements?.map((badge: Achievement) => {
              const isUnlocked = unlockedIds.has(badge._id);
              const badgeProgress = (badge as any).progress as number | undefined;

              return (
                <div
                  key={badge._id}
                  style={{
                    display: 'flex', gap: 16, padding: '20px',
                    background: 'var(--color-surface-0)',
                    border: isUnlocked ? '1px solid var(--color-primary-border)' : '1px solid var(--color-border)',
                    borderRadius: 8,
                    opacity: isUnlocked ? 1 : 0.6,
                    transition: 'all 0.2s ease',
                  }}
                >
                  {/* Icon */}
                  <div style={{
                    width: 48, height: 48, borderRadius: 8, flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: isUnlocked ? 'var(--color-primary-light)' : 'var(--color-surface-2)',
                    color: isUnlocked ? 'var(--color-primary)' : 'var(--color-text-muted)',
                  }}>
                    {isUnlocked ? (ICON_MAP[badge.icon] ?? <Award size={20} />) : <Lock size={20} />}
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                      <h3 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 600, fontSize: '1.05rem', margin: 0, color: 'var(--color-text-primary)' }}>
                        {badge.name}
                      </h3>
                      {isUnlocked && (
                        <CheckCircle2 size={16} color="var(--color-primary)" />
                      )}
                    </div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', lineHeight: 1.5, margin: '0 0 12px' }}>
                      {badge.description}
                    </p>

                    {/* Progress bar (if applicable & locked) */}
                    {!isUnlocked && badgeProgress !== undefined && (
                      <div style={{ width: '100%', height: 4, borderRadius: 2, background: 'var(--color-surface-2)', overflow: 'hidden' }}>
                        <div style={{ width: `${badgeProgress}%`, height: '100%', background: 'var(--color-text-muted)', borderRadius: 2 }} />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Empty/End State ── */}
        {!isLoading && (
          <p style={{ textAlign: 'center', fontSize: '0.9rem', color: 'var(--color-text-secondary)', marginTop: 'var(--space-48)', borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-48)' }}>
            Consistent practice unlocks further academic milestones.
          </p>
        )}
      </div>
    </AppLayout>
  );
}
