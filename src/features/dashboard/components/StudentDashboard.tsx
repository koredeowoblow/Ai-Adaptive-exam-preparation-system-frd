import * as React from "react";
import { useStudentDashboard } from "../hooks/useDashboard";
import { useDocumentTitle } from "../../../shared/hooks/useDocumentTitle";
import { Skeleton } from "../../../shared/components/Skeleton";
import { ErrorState } from "../../../shared/components/ErrorState";
import { StatTile } from "../../../shared/components/StatTile";
import { Button } from "../../../shared/components/Button";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "../../auth/hooks/useAuth";
import {
  Trophy, Star, Medal, Target, Zap, Award,
  Brain, Flame, ArrowRight, TrendingUp,
  Calendar, CheckCircle2, XCircle,
  Sparkles, Clock, Target as TargetIcon,
  ChevronRight,
} from "lucide-react";

const DashboardMasteryChart = React.lazy(() => import('./DashboardMasteryChart'));

export interface StudentDashboardProps {
  studentId: string;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({ studentId }) => {
  useDocumentTitle("Dashboard - EduAdapt");
  const { user } = useAuth();
  const { data, isLoading, error } = useStudentDashboard(studentId);
  const navigate = useNavigate();

  const firstName = user?.name ? user.name.split(' ')[0] : 'Student';

  if (isLoading) {
    return (
      <div className="w-full">
        <div className="flex flex-col gap-8 pb-20">
          {/* Header Skeleton */}
          <div className="flex flex-col gap-2">
            <Skeleton className="h-9 w-64 rounded-lg" />
            <Skeleton className="h-5 w-96 rounded-md" />
          </div>

          {/* Stat Strip Skeleton */}
          <div className="stat-grid">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-[106px] rounded-xl" />
            ))}
          </div>

          {/* Hero Action Skeleton */}
          <Skeleton className="h-[140px] rounded-xl" />

          {/* 2-Column Grid Skeleton */}
          <div className="dashboard-grid">
            <div className="flex flex-col gap-6">
              <Skeleton className="h-[220px] rounded-xl" />
              <Skeleton className="h-[260px] rounded-xl" />
            </div>
            <div className="flex flex-col gap-6">
              <Skeleton className="h-[280px] rounded-xl" />
              <Skeleton className="h-[180px] rounded-xl" />
              <Skeleton className="h-[160px] rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="w-full">
        <ErrorState message="Failed to load your dashboard. Please check your connection and try again." />
      </div>
    );
  }

  const { stats, streak, achievements } = data;
  const eloRating = Math.round(stats?.averageElo || 0);
  const eloLevel = stats?.averageEloLevel || "Beginner";
  const topicsMastered = stats?.totalTopicsMastered ?? 0;
  const currentStreak = streak?.currentStreak ?? 0;
  const totalCourses = stats?.totalCourses ?? 0;

  const allStatsZero = eloRating === 0 && topicsMastered === 0 && currentStreak === 0 && totalCourses === 0;

  // Server-authoritative focus areas (derived from topic mastery)
  const focusAreas = stats?.focusAreas || [];
  const topicsToRevisit = focusAreas;
  const recentActivities = stats?.recentActivity || [];
  const focusTopic = topicsToRevisit.length > 0 ? topicsToRevisit[0] : null;

  // Chart and performance data
  const chartData = stats?.performanceSummary?.chartData || [];
  const recentAverage = stats?.performanceSummary?.averageScore != null ? Math.round(stats.performanceSummary.averageScore) : undefined;

  const isFirstTime = topicsMastered === 0 && currentStreak === 0 && recentActivities.length === 0;

  const renderAchievementIcon = (icon: string) => {
    const icons: Record<string, React.ReactNode> = {
      star: <Star size={16} />, flame: <Flame size={16} />, crown: <Trophy size={16} />,
      award: <Award size={16} />, medal: <Medal size={16} />, target: <Target size={16} />,
      zap: <Zap size={16} />, trophy: <Trophy size={16} />,
    };
    return icons[icon] || <Award size={16} />;
  };

  return (
    <div className="w-full">
      <div className="flex flex-col gap-8 pb-20">

        {/* ── Page H1 with Context Line ── */}
        <header className="flex flex-col gap-1.5">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-text-primary m-0">
            Welcome back, {firstName}
          </h1>
          <p className="text-sm sm:text-base text-text-secondary m-0">
            Track your exam readiness, review weak topics, and continue your adaptive study session.
          </p>
        </header>

        {/* ── Stat Strip: Collapses into Guidance When All Values are Zero ── */}
        {allStatsZero ? (
          <div className="bg-surface-0 border border-dashed border-border rounded-xl p-5 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary-light flex items-center justify-center text-primary shrink-0">
                <Sparkles size={20} />
              </div>
              <div>
                <p className="text-sm font-semibold text-text-primary m-0">Your study journey starts here</p>
                <p className="text-xs text-text-secondary m-0 mt-0.5">
                  Complete your first practice session to establish your mastery rating, track study streaks, and unlock progress analytics.
                </p>
              </div>
            </div>
            <Button variant="primary" size="sm" onClick={() => navigate({ to: "/exam-prep" })}>
              Start First Session
            </Button>
          </div>
        ) : (
          <div className="stat-grid">
            <StatTile value={eloRating} label="Mastery Score" sub={eloLevel} />
            <StatTile
              value={topicsMastered}
              label="Topics mastered"
              sub={(stats as any)?.totalTopicsCount ? `out of ${(stats as any).totalTopicsCount}` : "mastered"}
            />
            <StatTile
              value={currentStreak > 0 ? `${currentStreak}d` : "0d"}
              label="Study streak"
              sub={streak?.longestStreak && streak.longestStreak > 0 ? `Best: ${streak.longestStreak}d` : "Active"}
            />
            <StatTile value={totalCourses} label="Courses" sub="enrolled" />
          </div>
        )}

        {/* ── One Prominent Next-Step Panel ── */}
        {isFirstTime ? (
          <div className="bg-surface-0 border-2 border-primary rounded-xl p-6 sm:p-8 flex items-center justify-between gap-6 flex-wrap shadow-sm">
            <div className="flex-1 min-w-[280px] max-w-3xl">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mb-3 bg-primary-light text-primary">
                <Sparkles size={14} /> Quick Skill Check
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-text-primary m-0 mb-2">
                Start your first practice session
              </h2>
              <p className="text-sm sm:text-base text-text-secondary m-0 leading-relaxed">
                Take a quick practice session so questions automatically match your skill level and your study streak begins.
              </p>
            </div>
            <Button
              variant="primary"
              size="lg"
              onClick={() => navigate({ to: "/exam-prep" })}
              className="shrink-0"
            >
              Start First Session <ArrowRight size={16} className="ml-1.5" />
            </Button>
          </div>
        ) : (
          <div className="bg-surface-0 border border-border rounded-xl p-6 sm:p-8 flex items-center justify-between gap-6 flex-wrap">
            <div className="flex-1 min-w-[280px] max-w-3xl">
              <span className="text-xs font-semibold text-primary uppercase tracking-wider block mb-2">
                Continue where you left off
              </span>
              <h2 className="text-xl sm:text-2xl font-semibold text-text-primary m-0 mb-2">
                {focusTopic ? `Review ${focusTopic.topicName}` : "Ready for your next adaptive session?"}
              </h2>
              <p className="text-sm sm:text-base text-text-secondary m-0 leading-relaxed">
                {focusTopic ? (
                  <>Based on your recent performance, your recommended focus area is <strong>{focusTopic.topicName}</strong> ({focusTopic.courseName}).</>
                ) : (
                  "Reinforce your understanding with personalized questions tailored to your current mastery level."
                )}
              </p>
            </div>
            <Button
              variant="primary"
              size="lg"
              onClick={() => navigate({ to: "/exam-prep" })}
              className="shrink-0"
            >
              {focusTopic ? "Practice Topic" : "Start Practice"} <ArrowRight size={16} className="ml-1.5" />
            </Button>
          </div>
        )}

        {/* ── Two-Column Layout Below with Real Empty States ── */}
        <div className="dashboard-grid">

          {/* LEFT COLUMN */}
          <div className="flex flex-col gap-6">

            {/* Topics to revisit */}
            <section className="bg-surface-0 border border-border rounded-xl p-5 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base sm:text-lg font-semibold text-text-primary m-0 flex items-center gap-2">
                  <TargetIcon size={18} className="text-primary" /> Topics to revisit
                </h3>
                {topicsToRevisit.length > 0 && (
                  <span className="text-xs text-text-muted font-medium">
                    {topicsToRevisit.length} flagged
                  </span>
                )}
              </div>

              {topicsToRevisit.length > 0 ? (
                <div className="flex flex-col divide-y divide-border">
                  {topicsToRevisit.map((topic: any) => (
                    <div key={topic.topicName} className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-text-primary m-0 truncate">
                          {topic.topicName}
                        </p>
                        <p className="text-xs text-text-secondary m-0 mt-0.5">
                          {topic.courseName}
                        </p>
                      </div>
                      <div className="flex items-center gap-4 shrink-0">
                        <div className="text-right">
                          <p className={`text-sm font-bold m-0 tabular-nums ${topic.elo < 1200 ? 'text-warning' : 'text-success'}`}>
                            {Math.round(topic.elo)}
                          </p>
                          <p className="text-[10px] text-text-muted m-0 uppercase font-medium">Mastery</p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate({ to: "/exam-prep" })}
                        >
                          Review
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-6 px-4 text-center border border-dashed border-border rounded-lg bg-surface-1">
                  <p className="text-sm font-medium text-text-primary m-0">No topics flagged for review</p>
                  <p className="text-xs text-text-secondary m-0 mt-1 mb-3">
                    Complete practice sessions to identify areas that need reinforcement.
                  </p>
                  <Button variant="outline" size="sm" onClick={() => navigate({ to: "/exam-prep" })}>
                    Start Practice Session
                  </Button>
                </div>
              )}
            </section>

            {/* Recent Sessions */}
            <section className="bg-surface-0 border border-border rounded-xl p-5 sm:p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-base sm:text-lg font-semibold text-text-primary m-0 flex items-center gap-2">
                  <Clock size={18} className="text-primary" /> Recent Sessions
                </h3>
                {recentActivities.length > 0 && (
                  <button
                    onClick={() => navigate({ to: "/practice/history" })}
                    aria-label="View all recent sessions"
                    className="text-xs text-primary font-medium bg-transparent border-none cursor-pointer flex items-center gap-1 hover:underline"
                  >
                    All <ArrowRight size={12} />
                  </button>
                )}
              </div>

              {recentActivities.length > 0 ? (
                <div className="flex flex-col divide-y divide-border">
                  {recentActivities.slice(0, 4).map((a: any) => {
                    const good = a.performanceLevel === "good";
                    const fair = a.performanceLevel === "fair";
                    const scoreColor = good ? 'text-success' : fair ? 'text-warning' : 'text-danger';
                    return (
                      <div key={a._id} className="py-3.5 first:pt-0 last:pb-0 flex items-center gap-3">
                        {good ? <CheckCircle2 size={16} className="text-success shrink-0" /> : <XCircle size={16} className={scoreColor + " shrink-0"} />}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-text-primary m-0 truncate">{a.topicName}</p>
                          <p className="text-xs text-text-secondary m-0 mt-0.5">{new Date(a.date).toLocaleDateString()}</p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className={`text-sm font-bold tabular-nums ${scoreColor}`}>{Math.round(a.score)}%</span>
                          <button
                            onClick={() => navigate({ to: "/practice/$sessionId/review", params: { sessionId: a._id } })}
                            className="p-1 rounded bg-transparent border-none text-text-muted hover:text-text-primary cursor-pointer transition-colors"
                            aria-label="View Session Details"
                            title="View Details"
                          >
                            <ArrowRight size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-6 px-4 text-center border border-dashed border-border rounded-lg bg-surface-1">
                  <p className="text-sm font-medium text-text-primary m-0">No recent sessions</p>
                  <p className="text-xs text-text-secondary m-0 mt-1 mb-3">
                    Completed adaptive practice sessions will appear here with instant answer breakdowns.
                  </p>
                  <Button variant="outline" size="sm" onClick={() => navigate({ to: "/exam-prep" })}>
                    Take First Session
                  </Button>
                </div>
              )}
            </section>

          </div>

          {/* RIGHT COLUMN */}
          <aside className="flex flex-col gap-6">

            {/* Performance Chart */}
            <section className="bg-surface-0 border border-border rounded-xl p-5 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold text-text-primary m-0 mb-4 flex items-center gap-2">
                <TrendingUp size={18} className="text-primary" /> Recent Performance
              </h3>

              {recentActivities.length > 0 ? (
                <>
                  <div className="flex items-baseline gap-2 mb-4">
                    <span className="text-2xl font-bold tabular-nums text-text-primary">{recentAverage}%</span>
                    <span className="text-xs text-text-secondary">Average score (last {chartData.length} sessions)</span>
                  </div>

                  <div className="h-44">
                    <React.Suspense fallback={<div className="h-44 w-full bg-surface-1 animate-pulse rounded-lg" />}>
                      <DashboardMasteryChart data={chartData} />
                    </React.Suspense>
                  </div>
                </>
              ) : (
                <div className="py-6 px-4 text-center border border-dashed border-border rounded-lg bg-surface-1">
                  <p className="text-sm font-medium text-text-primary m-0">No performance data yet</p>
                  <p className="text-xs text-text-secondary m-0 mt-1 mb-3">
                    Your score trajectory and calibration trends will appear after your first sessions.
                  </p>
                  <Button variant="outline" size="sm" onClick={() => navigate({ to: "/exam-prep" })}>
                    Start Practicing
                  </Button>
                </div>
              )}
            </section>

            {/* Learning Tools as Clearly Clickable Rows */}
            <section className="bg-surface-0 border border-border rounded-xl p-5 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold text-text-primary m-0 mb-3 flex items-center gap-2">
                <Sparkles size={18} className="text-primary" /> Learning tools
              </h3>

              <div className="flex flex-col divide-y divide-border">
                {[
                  {
                    label: "AI Tutor",
                    desc: "Ask questions, get adaptive explanations & step-by-step guidance",
                    icon: <Brain size={18} />,
                    to: "/ai-chat",
                  },
                  {
                    label: "Study Planner",
                    desc: "Build a personalized weekly schedule and track daily goals",
                    icon: <Calendar size={18} />,
                    to: "/study-planner",
                  },
                ].map((tool) => (
                  <button
                    key={tool.label}
                    onClick={() => navigate({ to: tool.to as any })}
                    className="w-full py-3.5 first:pt-1 last:pb-1 flex items-center justify-between gap-3 text-left bg-transparent border-none cursor-pointer rounded-lg hover:bg-surface-1 transition-colors group p-2 -mx-2"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-9 h-9 rounded-lg flex items-center justify-center bg-primary-light text-primary shrink-0 transition-transform group-hover:scale-105">
                        {tool.icon}
                      </span>
                      <div className="min-w-0">
                        <p className="font-semibold text-sm text-text-primary m-0 group-hover:text-primary transition-colors">
                          {tool.label}
                        </p>
                        <p className="text-xs text-text-secondary m-0 mt-0.5 truncate">
                          {tool.desc}
                        </p>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-text-muted group-hover:text-primary shrink-0 transition-transform group-hover:translate-x-0.5" />
                  </button>
                ))}
              </div>
            </section>

            {/* Achievements */}
            <section className="bg-surface-0 border border-border rounded-xl p-5 sm:p-6">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-base sm:text-lg font-semibold text-text-primary m-0 flex items-center gap-2">
                  <Trophy size={18} className="text-primary" /> Achievements
                </h3>
                {achievements && achievements.length > 0 && (
                  <button
                    onClick={() => navigate({ to: "/achievements" })}
                    aria-label="View all achievements"
                    className="text-xs text-primary font-medium bg-transparent border-none cursor-pointer flex items-center gap-1 hover:underline"
                  >
                    All <ArrowRight size={12} />
                  </button>
                )}
              </div>

              {achievements && achievements.length > 0 ? (
                <div className="flex flex-wrap gap-2.5">
                  {achievements.slice(0, 4).map((a: any) => (
                    <div key={a._id} className="flex items-center gap-2 py-1.5 px-3 bg-surface-1 border border-border rounded-lg">
                      <div className="text-primary">
                        {renderAchievementIcon(a.achievementId?.icon || "trophy")}
                      </div>
                      <p className="text-xs font-medium text-text-primary m-0">
                        {a.achievementId?.name}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-4 px-3 text-center border border-dashed border-border rounded-lg bg-surface-1">
                  <p className="text-xs text-text-secondary m-0">
                    Complete your first adaptive session to unlock your first achievement badge.
                  </p>
                </div>
              )}
            </section>

          </aside>
        </div>
      </div>
    </div>
  );
};
