import * as React from "react";
import { useStudentDashboard } from "../hooks/useDashboard";
import { useDocumentTitle } from "../../../shared/hooks/useDocumentTitle";
import { Skeleton } from "../../../shared/components/Skeleton";
import { ErrorState } from "../../../shared/components/ErrorState";
import { StatTile } from "../../../shared/components/StatTile";
import { useNavigate } from "@tanstack/react-router";
import {
  Trophy, Star, Medal, Target, Zap, Award,
  Brain, Flame, ArrowRight, TrendingUp,
  Calendar, CheckCircle2, XCircle,
  Sparkles, Clock, Target as TargetIcon,
} from "lucide-react";
import { AreaChart, Area, ResponsiveContainer, CartesianGrid, YAxis, Tooltip } from "recharts";


export interface StudentDashboardProps {
  studentId: string;
}


export const StudentDashboard: React.FC<StudentDashboardProps> = ({ studentId }) => {
  useDocumentTitle("Dashboard — EduAdapt");
  const { data, isLoading, error } = useStudentDashboard(studentId);
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="page-container page-wide">
        <div className="flex flex-col gap-[var(--space-32)] pb-20">
          <div className="stat-grid">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-[106px] rounded-xl" />)}
          </div>
          <Skeleton className="h-[132px] rounded-xl" />
          <div className="dashboard-grid">
            <div className="flex flex-col gap-[var(--space-24)]">
              <Skeleton className="h-[200px] rounded-xl" />
              <Skeleton className="h-[260px] rounded-xl" />
            </div>
            <div className="flex flex-col gap-[var(--space-24)]">
              <Skeleton className="h-[320px] rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) return <ErrorState message="Failed to load your dashboard. Please try again." />;

  const { stats, streak, achievements } = data;
  const eloRating = Math.round(stats?.averageElo || 0);
  const eloLevel = stats?.averageEloLevel || "Beginner";

  // Use server-authoritative focus areas (derived from topic mastery)
  const focusAreas = stats?.focusAreas || [];
  const topicsToRevisit = focusAreas;

  const recentActivities = stats?.recentActivity || [];

  const focusTopic = topicsToRevisit.length > 0 ? topicsToRevisit[0] : null;

  // Chart and performance data
  const chartData = stats?.performanceSummary?.chartData || [];
  const recentAverage = stats?.performanceSummary?.averageScore != null ? Math.round(stats.performanceSummary.averageScore) : undefined;

  const isFirstTime = (stats?.totalTopicsMastered ?? 0) === 0 && (!streak?.currentStreak || streak.currentStreak === 0) && recentActivities.length === 0;

  const renderAchievementIcon = (icon: string) => {
    const icons: Record<string, React.ReactNode> = {
      star: <Star size={16} />, flame: <Flame size={16} />, crown: <Trophy size={16} />,
      award: <Award size={16} />, medal: <Medal size={16} />, target: <Target size={16} />,
      zap: <Zap size={16} />, trophy: <Trophy size={16} />,
    };
    return icons[icon] || <Award size={16} />;
  };

  return (
    <main className="page-container page-wide">
      <div className="flex flex-col gap-[var(--space-32)] pb-20">

        {/* ── TERTIARY: Key Progress ── */}
        <div className="stat-grid">
          <StatTile value={eloRating} label="Mastery Score" sub={eloLevel} />
          <StatTile
            value={stats?.totalTopicsMastered ?? 0}
            label="Topics mastered"
            sub={isFirstTime ? "Ready to begin" : (stats as any)?.totalTopicsCount ? `out of ${(stats as any).totalTopicsCount}` : "mastered"}
          />
          <StatTile
            value={streak?.currentStreak && streak.currentStreak > 0 ? `${streak.currentStreak}d` : "0d"}
            label="Study streak"
            sub={streak?.longestStreak && streak.longestStreak > 0 ? `Best: ${streak.longestStreak}d` : "Start today"}
          />
          <StatTile value={stats?.totalCourses ?? 0} label="Courses" sub="enrolled" />
        </div>

        {/* ── PRIMARY: First-time state or Today's Focus ── */}
        {isFirstTime ? (
          <div className="bg-[var(--color-surface-0)] border-2 border-[var(--color-primary)] rounded-xl p-[var(--space-32)] flex items-center justify-between gap-[var(--space-24)] flex-wrap shadow-sm">
            <div className="flex-1 w-full max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold mb-3" style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)' }}>
                <Sparkles size={14} /> Welcome to EduAdapt
              </div>
              <h2 className="font-['Outfit',_sans-serif] text-[var(--font-size-24)] font-bold text-[var(--color-text-primary)] m-0 mb-2">
                Start your first diagnostic practice session
              </h2>
              <p className="text-[var(--font-size-16)] text-[var(--color-text-secondary)] m-0 leading-relaxed">
                Take an initial adaptive session to calibrate question difficulty to your skill level and begin earning your study streak.
              </p>
            </div>
            <button
              onClick={() => navigate({ to: "/exam-prep" })}
              className="btn-primary-cta shrink-0"
              style={{ fontSize: '1rem', padding: '12px 24px' }}
            >
              Start First Practice Session →
            </button>
          </div>
        ) : (
          <div className="bg-[var(--color-surface-0)] border border-[var(--color-border)] rounded-xl p-[var(--space-32)] flex items-center justify-between gap-[var(--space-24)] flex-wrap">
            <div className="flex-1 w-full max-w-4xl">
              <p className="text-[var(--color-primary)] text-[var(--font-size-13)] font-medium m-0 mb-2 tracking-[0.02em] uppercase">
                Today's Focus
              </p>
              <h2 className="font-['Outfit',_sans-serif] text-[var(--font-size-24)] font-medium text-[var(--color-text-primary)] m-0 mb-2">
                {focusTopic ? "Continue your preparation" : "Ready for your next session?"}
              </h2>
              <p className="text-[var(--font-size-16)] text-[var(--color-text-secondary)] m-0 leading-relaxed">
                {focusTopic
                  ? <>You're making progress. Based on your recent activity, a topic to revisit is <strong>{focusTopic.topicName}</strong>.</>
                  : "Start an adaptive practice session based on your current level."
                }
              </p>
            </div>
            <button
              onClick={() => navigate({ to: "/exam-prep" })}
              className="btn-primary-cta shrink-0"
            >
              {focusTopic ? "Practice Topic →" : "Start Practice →"}
            </button>
          </div>
        )}

        {/* ── SECONDARY: Split Grid ── */}
        <div className="dashboard-grid">

          {/* LEFT COLUMN */}
          <div className="flex flex-col gap-[var(--space-24)]">

            {/* Topics to revisit */}
            <section>
              <h3 className="text-[var(--font-size-18)] font-medium text-[var(--color-text-primary)] m-0 mb-[var(--space-16)] flex items-center gap-2">
                <TargetIcon size={16} color="var(--color-primary)" /> Topics to revisit
              </h3>

              {topicsToRevisit.length > 0 ? (
                <div className="flex flex-col">
                  {topicsToRevisit.map((topic: any, index: number) => (
                    <div key={topic.topicName} className={`py-[var(--space-16)] flex items-center justify-between gap-[var(--space-12)] ${index < topicsToRevisit.length - 1 ? 'border-b border-[var(--color-border)]' : ''}`}>
                      <div className="flex-1 min-w-0">
                        <p className="text-[var(--font-size-14)] font-medium text-[var(--color-text-primary)] m-0 mb-1 whitespace-nowrap overflow-hidden text-ellipsis">
                          {topic.topicName}
                        </p>
                        <p className="text-[var(--font-size-12)] text-[var(--color-text-secondary)] m-0">
                          {topic.courseName}
                        </p>
                      </div>
                      <div className="flex items-center gap-[var(--space-16)]">
                        <div className="text-right">
                          <p className={`text-[var(--font-size-14)] font-bold m-0 mb-0.5 ${topic.elo < 1200 ? 'text-[var(--color-warning)]' : 'text-[var(--color-success)]'}`}>
                            {Math.round(topic.elo)}
                          </p>
                          <p className="caption text-[var(--color-text-muted)] m-0 uppercase">Mastery Score</p>
                        </div>
                        <button
                          onClick={() => navigate({ to: "/exam-prep" })}
                          className="btn-outline"
                        >
                          Review
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-[var(--space-32)] px-[var(--space-16)] text-center bg-[var(--color-surface-0)] rounded-[10px] border border-dashed border-[var(--color-border)]">
                  <p className="text-[var(--font-size-14)] text-[var(--color-text-secondary)] m-0">
                    Complete a few practice sessions to discover topics you should revisit.
                  </p>
                </div>
              )}
            </section>

            {/* Recent Sessions */}
            <section>
              <div className="flex justify-between items-center mb-[var(--space-16)]">
                <h3 className="text-[var(--font-size-18)] font-medium text-[var(--color-text-primary)] m-0 flex items-center gap-2">
                  <Clock size={16} color="var(--color-primary)" /> Recent Sessions
                </h3>
                <button
                  onClick={() => navigate({ to: "/practice/history" })}
                  aria-label="View all recent sessions"
                  className="text-[var(--font-size-13)] text-[var(--color-primary)] font-medium bg-transparent border-none cursor-pointer flex items-center gap-[3px] font-inherit"
                >
                  All <ArrowRight size={12} />
                </button>
              </div>

              {recentActivities.length > 0 ? (
                <div className="flex flex-col">
                  {recentActivities.slice(0, 4).map((a: any, index: number) => {
                    const good = a.performanceLevel === "good";
                    const fair = a.performanceLevel === "fair";
                    const scoreColor = good ? 'var(--color-success)' : fair ? 'var(--color-warning)' : 'var(--color-danger)';
                    return (
                      <div key={a._id} className={`dashboard-session-item flex items-center gap-[var(--space-12)] py-[var(--space-16)] ${index < Math.min(recentActivities.length, 4) - 1 ? 'border-b border-[var(--color-border)]' : ''}`}>
                        {good ? <CheckCircle2 size={16} color={scoreColor} /> : <XCircle size={16} color={scoreColor} />}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-[var(--font-size-14)] text-[var(--color-text-primary)] m-0 mb-0.5 whitespace-nowrap overflow-hidden text-ellipsis">{a.topicName}</p>
                          <p className="text-[var(--font-size-12)] text-[var(--color-text-secondary)] m-0">{new Date(a.date).toLocaleDateString()}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-[var(--font-size-13)] font-bold" style={{ color: scoreColor }}>{Math.round(a.score)}%</span>
                          <button
                            onClick={() => navigate({ to: "/practice/$sessionId/review", params: { sessionId: a._id } })}
                            className="p-1 bg-transparent border-none text-[var(--color-text-muted)] cursor-pointer"
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
                <div className="p-[var(--space-24)] text-center bg-[var(--color-surface-0)] rounded-[10px]">
                  <p className="text-[var(--font-size-14)] text-[var(--color-text-muted)] m-0">No recent sessions found.</p>
                </div>
              )}
            </section>

          </div>

          {/* RIGHT COLUMN */}
          <aside className="flex flex-col gap-[var(--space-24)]">

            {/* Performance Chart */}
            <section>
              <h3 className="text-[var(--font-size-18)] font-medium text-[var(--color-text-primary)] m-0 mb-[var(--space-16)] flex items-center gap-2">
                <TrendingUp size={16} color="var(--color-primary)" /> Recent Performance
              </h3>

              <div className="p-[var(--space-20)] bg-[var(--color-surface-0)] rounded-[10px] border-[0.5px] border-[var(--color-border)]">
                {recentActivities.length > 0 ? (
                  <>
                    <div className="flex items-baseline gap-2 mb-[var(--space-16)]">
                      <span className="text-[var(--font-size-24)] font-bold text-[var(--color-text-primary)]">{recentAverage}%</span>
                      <span className="text-[var(--font-size-13)] text-[var(--color-text-secondary)]">Average score (last {chartData.length} sessions)</span>
                    </div>

                    <div className="h-[160px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData} margin={{ top: 5, right: 0, left: -24, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                          <YAxis dataKey="score" domain={[0, 100]} ticks={[0, 50, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} />
                          <Tooltip
                            contentStyle={{ borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface-raised)', boxShadow: 'var(--shadow-md)' }}
                            labelStyle={{ color: 'var(--color-text-muted)', fontSize: 12, marginBottom: 4 }}
                            itemStyle={{ color: 'var(--color-text-primary)', fontSize: 14, fontWeight: 600 }}
                            formatter={(val: any) => [`${val}%`, 'Score']}
                            labelFormatter={(_, payload) => payload?.[0]?.payload?.topic || 'Session'}
                          />
                          <Area type="monotone" dataKey="score" stroke="var(--color-primary)" strokeWidth={2} fillOpacity={0.15} fill="var(--color-primary)" dot={{ r: 3, fill: 'var(--color-surface-0)', stroke: 'var(--color-primary)', strokeWidth: 2 }} activeDot={{ r: 5 }} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </>
                ) : (
                  <div className="py-[var(--space-24)] text-center">
                    <p className="text-[var(--font-size-14)] text-[var(--color-text-muted)] m-0">Complete sessions to see your performance trend.</p>
                  </div>
                )}
              </div>
            </section>

            {/* Learning Tools */}
            <section>
              <h3 className="text-[var(--font-size-18)] font-medium text-[var(--color-text-primary)] m-0 mb-[var(--space-16)] flex items-center gap-2">
                <Sparkles size={16} color="var(--color-primary)" /> Learning tools
              </h3>

              <div className="grid grid-cols-2 gap-[var(--space-12)]">
                {[
                  { label: "AI Tutor", desc: "Ask questions, get explanations", icon: <Brain size={16} />, to: "/ai-chat" },
                  { label: "Study Planner", desc: "Build a weekly plan", icon: <Calendar size={16} />, to: "/study-planner" },
                ].map(tool => (
                  <button
                    key={tool.label}
                    onClick={() => navigate({ to: tool.to as any })}
                    className="dashboard-tool-card"
                  >
                    <span className="w-[44px] h-[44px] rounded-lg flex items-center justify-center bg-[var(--color-primary-light)] text-[var(--color-primary)] shrink-0">
                      {tool.icon}
                    </span>
                    <div>
                      <p className="font-medium text-[var(--font-size-14)] text-[var(--color-text-primary)] m-0 mb-1">{tool.label}</p>
                      <p className="text-[var(--font-size-12)] text-[var(--color-text-secondary)] m-0 leading-[1.4]">{tool.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </section>

            {/* Achievements */}
            <section>
              <div className="flex justify-between items-center mb-[var(--space-16)]">
                <h3 className="text-[var(--font-size-18)] font-medium text-[var(--color-text-primary)] m-0 flex items-center gap-2">
                  <Trophy size={16} color="var(--color-primary)" /> Achievements
                </h3>
                <button
                  onClick={() => navigate({ to: "/achievements" })}
                  aria-label="View all achievements"
                  className="text-[var(--font-size-13)] text-[var(--color-primary)] font-medium bg-transparent border-none cursor-pointer flex items-center gap-[3px] font-inherit"
                >
                  All <ArrowRight size={12} />
                </button>
              </div>

              <div className="p-[var(--space-16)] bg-[var(--color-surface-0)] rounded-[10px] border-[0.5px] border-[var(--color-border)]">
                {achievements && achievements.length > 0 ? (
                  <div className="flex flex-wrap gap-[var(--space-12)]">
                    {achievements.slice(0, 4).map((a: any) => (
                      <div key={a._id} className="flex items-center gap-[10px] py-2 px-3 bg-[var(--color-surface-1)] rounded-lg">
                        <div className="text-[var(--color-primary)]">
                          {renderAchievementIcon(a.achievementId?.icon || "trophy")}
                        </div>
                        <p className="text-[var(--font-size-13)] font-medium text-[var(--color-text-primary)] m-0">
                          {a.achievementId?.name}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-[var(--space-12)]">
                    <p className="text-[var(--font-size-13)] text-[var(--color-text-secondary)] m-0">
                      Complete your first adaptive session to unlock your first badge.
                    </p>
                  </div>
                )}
              </div>
            </section>

          </aside>
        </div>
      </div>
    </main>
  );
};
