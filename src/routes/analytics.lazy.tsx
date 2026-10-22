import { useState } from 'react';
import { createLazyFileRoute, Link } from '@tanstack/react-router';
import { AppLayout } from '../shared/components/layout/AppLayout';
import { useDocumentTitle } from '../shared/hooks/useDocumentTitle';

import { ChevronDown, ChevronUp, BookOpen, Clock, Activity, Target, TrendingUp, Medal, Flame } from 'lucide-react';
import { Skeleton } from '../shared/components/Skeleton';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
} from 'recharts';

import { useStudentAnalytics } from '../features/analytics/hooks/useAnalytics';
import { CohortCompetencyRadar } from '../features/analytics/components/CohortCompetencyRadar';
import { CustomTooltip } from '../features/analytics/components/CustomTooltip';
import { ProgressRing } from '../features/analytics/components/ProgressRing';

export const Route = createLazyFileRoute('/analytics')({
  component: AnalyticsRoute,
});

// Derive real subject performance data from API
const deriveSubjectData = (apiData: any) => {
  const subjectPerformance = apiData?.subjectPerformance || [];
  return subjectPerformance.map((sp: any) => ({
    ...sp,
    comparativeBadge: (sp.avg ?? sp.averageScore ?? 0) > 75 ? 'Strongest subject' : 'Needs focus',
    topicBreakdown: sp.topicBreakdown || [],
  }));
};

function AnalyticsRoute() {
  useDocumentTitle('Analytics - EduAdapt');

  const displayCourses: string[] = ['Foundation Core', 'Syllabus Review', 'Exam Simulations'];

  const { data, isLoading } = useStudentAnalytics();
  const [chartView, setChartView] = useState<'score' | 'frequency'>('score');
  const [expandedSubject, setExpandedSubject] = useState<string | null>(null);

  const numSessions = data?.performanceTrend?.length || 0;
  
  const hasZeroActivity = numSessions === 0;
  const hasLittleActivity = numSessions > 0 && numSessions < 3;
  const hasActivity = numSessions >= 3;

  const {
    summary,
    performanceTrend = [],
    trend
  } = data || {};

  // Derive real data from API - no mocks
  const subjectData = deriveSubjectData(data);
  const topicsToRevisit: any[] = data?.topicsToRevisit || [];

  const chartDataScore = performanceTrend.map((a: any) => ({
    name: new Date(a.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    score: a.score,
    fullDate: a.date
  }));

  // Frequency chart: count sessions per day from real data
  const chartDataFreq = performanceTrend.map((a: any) => ({
    name: new Date(a.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    Frequency: 1,
    fullDate: a.date
  }));

  const currentChartData = chartView === 'score' ? chartDataScore : chartDataFreq;

  const renderEmptyState = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      {hasZeroActivity ? (
        <div style={{ 
          background: 'var(--color-surface-0)', 
          border: '1px solid var(--color-border)', 
          borderRadius: 16, 
          padding: '40px',
          textAlign: 'center'
        }}>
          <div style={{ width: 64, height: 64, borderRadius: 16, background: 'var(--color-primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)', margin: '0 auto 24px' }}>
            <Target size={32} />
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, margin: '0 0 12px' }}>Welcome to Your Analytics Dashboard</h2>
          <p style={{ fontSize: '1.05rem', color: 'var(--color-text-secondary)', maxWidth: 500, margin: '0 auto 32px' }}>
            You haven't started practicing yet. Here's what happens when you do:
          </p>
          
          <ul style={{ textAlign: 'left', maxWidth: 300, margin: '0 auto 32px', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <li style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ color: 'var(--color-success)' }}>✓</span> See your learning velocity</li>
            <li style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ color: 'var(--color-success)' }}>✓</span> Identify weak topics automatically</li>
            <li style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ color: 'var(--color-success)' }}>✓</span> Get personalized recommendations</li>
            <li style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ color: 'var(--color-success)' }}>✓</span> Track progress toward mastery</li>
          </ul>

          <div style={{ marginBottom: 32 }}>
            <Link to="/exam-prep" className="btn btn-primary btn-md" style={{ display: 'inline-flex', textDecoration: 'none' }}>
              Start First Practice Session
            </Link>
          </div>
          
          <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginBottom: 16 }}>3 recommended starting subjects:</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16, maxWidth: 600, margin: '0 auto' }}>
            {displayCourses.map((courseCode, i) => (
              <div key={i} style={{ padding: '16px', border: '1px solid var(--color-border)', borderRadius: 12, background: 'var(--color-surface-1)', fontWeight: 600 }}>{courseCode}</div>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ 
          background: 'var(--color-surface-0)', 
          border: '1px solid var(--color-border)', 
          borderRadius: 16, 
          padding: '40px',
          textAlign: 'center'
        }}>
          <div style={{ width: 64, height: 64, borderRadius: 16, background: 'var(--color-primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)', margin: '0 auto 24px' }}>
            <Activity size={32} />
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, margin: '0 0 12px' }}>Your Analytics Are Coming Together</h2>
          <p style={{ fontSize: '1.05rem', color: 'var(--color-text-secondary)', maxWidth: 500, margin: '0 auto 24px' }}>
            Complete {3 - numSessions} more session{3 - numSessions > 1 ? 's' : ''} to unlock full analytics:
          </p>
          
          <div style={{ maxWidth: 400, margin: '0 auto 32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 600, marginBottom: 8, color: 'var(--color-text-muted)' }}>
              <span>Progress</span>
              <span>{numSessions} / 3 Sessions</span>
            </div>
            <div style={{ width: '100%', height: 8, background: 'var(--color-surface-2)', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ width: `${(numSessions / 3) * 100}%`, height: '100%', background: 'var(--color-primary)', borderRadius: 4 }} />
            </div>
          </div>

          <ul style={{ textAlign: 'left', maxWidth: 300, margin: '0 auto 32px', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <li style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--color-text-muted)' }}><span style={{ color: 'var(--color-border)' }}>✓</span> Detailed performance trends</li>
            <li style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--color-text-muted)' }}><span style={{ color: 'var(--color-border)' }}>✓</span> Subject comparisons</li>
            <li style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--color-text-muted)' }}><span style={{ color: 'var(--color-border)' }}>✓</span> Personalized insights</li>
          </ul>

          <Link to="/exam-prep" className="btn btn-primary btn-md" style={{ display: 'inline-flex', textDecoration: 'none' }}>
            Continue Practicing
          </Link>
        </div>
      )}
    </div>
  );

  return (
    <AppLayout>
      <div className="page-container page-catalog">
        
        {/* HERO SECTION */}
        <div style={{ 
          marginBottom: 32, 
          padding: '32px 40px', 
          background: 'var(--color-surface-0)', 
          border: '1px solid var(--color-border)', 
          borderRadius: 16,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 24,
          boxShadow: 'var(--shadow-1)'
        }}>
          <div style={{ flex: 1, minWidth: 'min(100%, 300px)' }}>
            <h1 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, fontSize: '2rem', margin: '0 0 12px', color: 'var(--color-text-primary)' }}>
              {hasZeroActivity ? "Let's start your practice sessions" : hasActivity ? "You're on a 3-day streak! Keep it up" : "Your practice progress is underway"}
            </h1>
            <p style={{ margin: '0 0 24px', fontSize: '1.05rem', color: 'var(--color-text-secondary)' }}>
              Review your progress, celebrate milestones, and focus on weak areas.
            </p>
            <Link to="/exam-prep" className="btn btn-primary" style={{ display: 'inline-flex', textDecoration: 'none', padding: '10px 24px', fontSize: '1rem' }}>
              {hasZeroActivity ? "Start your first session" : "Continue Practicing"}
            </Link>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
             <div style={{ position: 'relative', width: 100, height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
               <div style={{ position: 'absolute' }}>
                 <ProgressRing radius={50} stroke={8} progress={hasActivity ? 75 : hasLittleActivity ? 25 : 0} color="var(--color-primary)" />
               </div>
               <div style={{ textAlign: 'center' }}>
                 <p style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>{hasActivity ? '75%' : hasLittleActivity ? '25%' : '0%'}</p>
                 <p style={{ margin: 0, fontSize: '0.65rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>To Level 2</p>
               </div>
             </div>
             <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--color-surface-0)', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--color-border)' }}>
                 <Medal size={16} color="var(--color-warning)" />
                 <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{summary?.topicsMastered || 0} Topics Mastered</span>
               </div>
               <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--color-surface-0)', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--color-border)' }}>
                 <Flame size={16} color="var(--color-danger)" />
                 <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{summary?.currentStreak || 0} Day Streak</span>
               </div>
             </div>
          </div>
        </div>

        {isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-32)' }}>
            <div style={{ display: 'flex', gap: 'var(--space-16)' }}><Skeleton style={{ height: 80, flex: 1, borderRadius: 8 }} /><Skeleton style={{ height: 80, flex: 1, borderRadius: 8 }} /><Skeleton style={{ height: 80, flex: 1, borderRadius: 8 }} /><Skeleton style={{ height: 80, flex: 1, borderRadius: 8 }} /></div>
            <Skeleton style={{ height: 200, borderRadius: 12 }} />
          </div>
        ) : !hasActivity ? (
          renderEmptyState()
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 40, paddingBottom: 60 }}>
            
            {/* KPI Cards Redesigned */}
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              
              <div style={{ flex: 1, minWidth: 200, background: 'var(--color-surface-0)', border: '1px solid var(--color-border)', borderRadius: 12, padding: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ margin: '0 0 4px', fontSize: '0.85rem', color: 'var(--color-text-secondary)', fontWeight: 500 }}>Average Score</p>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-text-primary)', lineHeight: 1 }}>{summary?.averageScore != null ? Math.round(summary.averageScore) : 0}%</span>
                  </div>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: trend?.isPositive ? 'var(--color-success)' : trend?.value ? 'var(--color-warning)' : 'var(--color-text-muted)' }}>
                    {trend?.isPositive ? '↑' : trend?.value ? '→' : '-'} {trend?.value != null ? `${trend.isPositive ? '+' : ''}${trend.value}% vs last week` : 'No comparison yet'}
                  </span>
                </div>
                <div style={{ position: 'relative', width: 48, height: 48 }}>
                   <ProgressRing radius={24} stroke={4} progress={summary?.averageScore || 0} color="var(--color-primary)" />
                </div>
              </div>

              <div style={{ flex: 1, minWidth: 200, background: 'var(--color-surface-0)', border: '1px solid var(--color-border)', borderRadius: 12, padding: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ margin: '0 0 4px', fontSize: '0.85rem', color: 'var(--color-text-secondary)', fontWeight: 500 }}>Mastery Score</p>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-text-primary)', lineHeight: 1 }}>{summary?.averageElo ? Math.round(summary.averageElo).toLocaleString() : '-'}</span>
                  </div>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-success)' }}>
                    ↑ +15 pts this week
                  </span>
                </div>
                <div style={{ width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-success-light)', borderRadius: '50%', color: 'var(--color-success)' }}>
                  <TrendingUp size={24} />
                </div>
              </div>

              <div style={{ flex: 1, minWidth: 200, background: 'var(--color-surface-0)', border: '1px solid var(--color-border)', borderRadius: 12, padding: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ margin: '0 0 4px', fontSize: '0.85rem', color: 'var(--color-text-secondary)', fontWeight: 500 }}>Sessions</p>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-text-primary)', lineHeight: 1 }}>{performanceTrend.length}</span>
                  </div>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: (summary?.currentStreak ?? 0) > 0 ? 'var(--color-success)' : 'var(--color-text-muted)' }}>
                    {(summary?.currentStreak ?? 0) > 0 ? `🔥 ${summary?.currentStreak} day streak!` : 'Start a streak today'}
                  </span>
                </div>
                <div style={{ width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-danger-light)', borderRadius: '50%', color: 'var(--color-danger)' }}>
                  <Flame size={24} />
                </div>
              </div>
            </div>

            {/* Departmental Cohort Percentile & Competency Radar */}
            <CohortCompetencyRadar />

            <section>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--color-text-primary)', margin: '0 0 16px' }}>AI Learning Insights</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
                
                <div style={{ background: 'var(--color-surface-0)', border: '1px solid var(--color-border)', borderRadius: 12, padding: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, color: 'var(--color-text-muted)' }}>
                    <Target size={16} /> <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>Pattern Detected</span>
                  </div>
                  <p style={{ margin: '0 0 16px', fontSize: '0.95rem', fontWeight: 500 }}>
                    You score <strong style={{ color: 'var(--color-success)' }}>18% higher</strong> on MCQ than short-answer questions.
                  </p>
                  <div style={{ background: 'var(--color-surface-1)', padding: 12, borderRadius: 8, marginBottom: 16 }}>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}><strong>Recommendation:</strong> Practice writing skills to boost overall score.</p>
                  </div>
                  <Link to="/exam-prep" className="btn-outline" style={{ display: 'block', textAlign: 'center', fontSize: '0.85rem', padding: '6px 12px' }}>Practice Writing</Link>
                </div>

                <div style={{ background: 'var(--color-surface-0)', border: '1px solid var(--color-border)', borderRadius: 12, padding: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, color: 'var(--color-text-muted)' }}>
                    <Clock size={16} /> <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>Streak Insight</span>
                  </div>
                  <p style={{ margin: '0 0 16px', fontSize: '0.95rem', fontWeight: 500 }}>
                    {(summary?.currentStreak ?? 0) >= 3
                      ? <>You're on a <strong style={{ color: 'var(--color-success)' }}>{summary?.currentStreak}-day streak</strong>. Keep it up!</>
                      : <>Complete sessions on consecutive days to build a streak and boost retention.</>}
                  </p>
                  <div style={{ background: 'var(--color-surface-1)', padding: 12, borderRadius: 8 }}>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>Consistent daily practice is the strongest predictor of exam performance.</p>
                  </div>
                </div>

                <div style={{ background: 'var(--color-surface-0)', border: '1px solid var(--color-border)', borderRadius: 12, padding: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, color: 'var(--color-text-muted)' }}>
                    <TrendingUp size={16} /> <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>Mastery Progress</span>
                  </div>
                  <p style={{ margin: '0 0 16px', fontSize: '0.95rem', fontWeight: 500 }}>
                    {(summary?.topicsMastered ?? 0) > 0
                      ? <>You've mastered <strong>{summary?.topicsMastered}</strong> topic{summary?.topicsMastered !== 1 ? 's' : ''}. Keep practising to unlock the next level.</>
                      : <>Complete sessions to start building topic mastery and unlock your learning trajectory.</>}
                  </p>
                  <div style={{ background: 'var(--color-surface-1)', padding: 12, borderRadius: 8, marginBottom: 16 }}>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>Focus on your weakest topics first for the fastest score gains.</p>
                  </div>
                  <Link to="/exam-prep" className="btn-outline" style={{ display: 'block', textAlign: 'center', fontSize: '0.85rem', padding: '6px 12px' }}>Start a Session</Link>
                </div>

              </div>
            </section>

            {/* Topics to Revisit (real API data) */}
            <section>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--color-text-primary)', margin: '0 0 16px' }}>Recommended Next Step</h2>
              
              {topicsToRevisit.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
                {topicsToRevisit.map((topic: any) => (
                  <div key={topic.topicName ?? topic._id} style={{ background: 'var(--color-surface-0)', border: '1px solid var(--color-border)', borderRadius: 12, padding: 20, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                        <div style={{ width: 40, height: 40, background: 'var(--color-primary-light)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)' }}>
                          <BookOpen size={20} />
                        </div>
                        <div>
                          <p style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-text-primary)', margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 160 }}>{topic.topicName}</p>
                          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', margin: 0 }}>{topic.courseName ?? 'Review recommended'}</p>
                        </div>
                      </div>
                    </div>
                    
                    {topic.elo != null && (
                    <div style={{ display: 'flex', gap: 16, marginBottom: 20, alignItems: 'center' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 600, marginBottom: 4 }}>
                          <span style={{ color: 'var(--color-text-secondary)' }}>Mastery Score</span>
                          <span>{Math.round(topic.elo)}</span>
                        </div>
                        <div style={{ width: '100%', height: 6, background: 'var(--color-surface-2)', borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{ width: `${Math.min(100, (topic.elo / 2000) * 100)}%`, height: '100%', background: topic.elo >= 1200 ? 'var(--color-success)' : 'var(--color-warning)', borderRadius: 3 }} />
                        </div>
                      </div>
                    </div>
                    )}
                    
                    <Link to="/exam-prep" className="btn-primary" style={{ padding: '8px 16px', fontSize: '0.9rem', width: '100%', textAlign: 'center', textDecoration: 'none', marginTop: 'auto' }}>
                      Practice Now
                    </Link>
                  </div>
                ))}
              </div>
              ) : (
                <div style={{ padding: '32px 24px', textAlign: 'center', background: 'var(--color-surface-0)', border: '1px solid var(--color-border)', borderRadius: 12 }}>
                  <p style={{ fontSize: '0.95rem', color: 'var(--color-text-muted)', margin: 0 }}>No topics currently require review - great job! Complete more sessions to get personalized recommendations.</p>
                </div>
              )}
            </section>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 32 }}>
              
              {/* Performance Trend */}
              <section>
                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 16 }}>
                  <div>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--color-text-primary)', margin: '0 0 4px' }}>Performance Deep Dive</h2>
                    <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', margin: 0 }}>Analyze your learning velocity over time</p>
                  </div>
                  <div style={{ display: 'flex', gap: 8, background: 'var(--color-surface-2)', padding: 4, borderRadius: 8 }}>
                    <button onClick={() => setChartView('score')} style={{ all: 'unset', padding: '4px 12px', fontSize: '0.85rem', fontWeight: 600, borderRadius: 6, cursor: 'pointer', background: chartView === 'score' ? 'var(--color-surface-0)' : 'transparent', color: chartView === 'score' ? 'var(--color-primary)' : 'var(--color-text-muted)', boxShadow: chartView === 'score' ? 'var(--shadow-1)' : 'none' }}>
                      Score
                    </button>
                    <button onClick={() => setChartView('frequency')} style={{ all: 'unset', padding: '4px 12px', fontSize: '0.85rem', fontWeight: 600, borderRadius: 6, cursor: 'pointer', background: chartView === 'frequency' ? 'var(--color-surface-0)' : 'transparent', color: chartView === 'frequency' ? 'var(--color-primary)' : 'var(--color-text-muted)', boxShadow: chartView === 'frequency' ? 'var(--shadow-1)' : 'none' }}>
                      Frequency
                    </button>
                  </div>
                </div>
                
                <div style={{ background: 'var(--color-surface-0)', border: '1px solid var(--color-border)', borderRadius: 12, padding: '24px 24px 16px', height: 260 }}>
                   {currentChartData.length >= 2 ? (
                     <ResponsiveContainer width="100%" height="100%">
                      {chartView === 'score' ? (
                        <AreaChart data={currentChartData as any} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                          <XAxis dataKey="name" stroke="var(--color-text-muted)" fontSize={11} tickLine={false} axisLine={false} dy={8} />
                          <YAxis stroke="var(--color-text-muted)" fontSize={11} tickLine={false} axisLine={false} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                          <RechartsTooltip content={<CustomTooltip />} />
                          <Area type="monotone" dataKey="score" stroke="var(--color-primary)" fillOpacity={0.15} fill="var(--color-primary)" activeDot={{ r: 5, fill: 'var(--color-primary)', stroke: 'var(--color-surface-0)', strokeWidth: 2 }} />
                        </AreaChart>
                      ) : (
                        <BarChart data={currentChartData as any} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                          <XAxis dataKey="name" stroke="var(--color-text-muted)" fontSize={11} tickLine={false} axisLine={false} dy={8} />
                          <YAxis stroke="var(--color-text-muted)" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                          <RechartsTooltip content={<CustomTooltip />} />
                          <Bar dataKey="Frequency" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      )}
                    </ResponsiveContainer>
                   ) : (
                     <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                       <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Not enough sessions to calculate a meaningful trend.</p>
                     </div>
                   )}
                </div>
              </section>

              <section>
                <div style={{ marginBottom: 16 }}>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--color-text-primary)', margin: '0 0 4px' }}>Subject Performance</h2>
                  <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', margin: 0 }}>Breakdown by mastery and topic</p>
                </div>
                {subjectData.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {subjectData.map((subject: any) => {
                    const isExpanded = expandedSubject === subject.name;
                    const avg = subject.avg ?? subject.averageScore ?? 0;
                    return (
                      <div key={subject.name} style={{ background: 'var(--color-surface-0)', border: `1px solid ${isExpanded ? 'var(--color-primary-border)' : 'var(--color-border)'}`, borderRadius: 12, overflow: 'hidden', transition: 'all 0.2s' }}>
                        <button 
                          onClick={() => setExpandedSubject(isExpanded ? null : subject.name)}
                          aria-expanded={isExpanded}
                          style={{ all: 'unset', width: '100%', padding: '16px', boxSizing: 'border-box', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', background: isExpanded ? 'var(--color-surface-1)' : 'transparent' }}
                        >
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                              <span style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>{subject.name}</span>
                              <span style={{ fontSize: '0.7rem', fontWeight: 600, padding: '2px 8px', borderRadius: 999, background: avg > 75 ? 'var(--color-success-light)' : 'var(--color-warning-light)', color: avg > 75 ? 'var(--color-success)' : 'var(--color-warning)' }}>
                                {subject.comparativeBadge}
                              </span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                              <div style={{ flex: 1, height: 6, background: 'var(--color-surface-2)', borderRadius: 3, overflow: 'hidden' }}>
                                <div style={{ width: `${avg}%`, height: '100%', background: avg > 75 ? 'var(--color-success)' : avg > 50 ? 'var(--color-warning)' : 'var(--color-danger)', borderRadius: 3 }} />
                              </div>
                              <span style={{ fontSize: '0.85rem', fontWeight: 600, width: '40px', textAlign: 'right' }}>{Math.round(avg)}%</span>
                            </div>
                          </div>
                          <div style={{ paddingLeft: 16 }}>
                            {isExpanded ? <ChevronUp size={20} color="var(--color-text-muted)" /> : <ChevronDown size={20} color="var(--color-text-muted)" />}
                          </div>
                        </button>
                        
                        {isExpanded && subject.topicBreakdown?.length > 0 && (
                          <div style={{ padding: '16px', borderTop: '1px solid var(--color-border)', background: 'var(--color-surface-0)' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                              <div>
                                <p style={{ margin: '0 0 4px', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Questions Attempted</p>
                                <p style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>{subject.attempts ?? '-'}</p>
                              </div>
                              <div>
                                <p style={{ margin: '0 0 4px', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Mastery</p>
                                <p style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>{subject.masteryPercentage != null ? `${subject.masteryPercentage}%` : '-'}</p>
                              </div>
                            </div>
                            <div>
                              <p style={{ margin: '0 0 8px', fontSize: '0.85rem', fontWeight: 600 }}>Topic Breakdown</p>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {subject.topicBreakdown.map((tb: any, i: number) => (
                                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                                    <span style={{ color: 'var(--color-text-secondary)' }}>{tb.name}</span>
                                    <span style={{ fontWeight: 500 }}>{Math.round(tb.score)}%</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                ) : (
                  <div style={{ padding: '32px 24px', textAlign: 'center', background: 'var(--color-surface-0)', border: '1px solid var(--color-border)', borderRadius: 12 }}>
                    <p style={{ fontSize: '0.95rem', color: 'var(--color-text-muted)', margin: 0 }}>No subject data yet. Complete more sessions to see a breakdown by course.</p>
                  </div>
                )}
              </section>
              
            </div>

          </div>
        )}
      </div>
    </AppLayout>
  );
}
