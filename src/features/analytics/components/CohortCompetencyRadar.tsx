import * as React from 'react';
import { 
  Users, 
  Award, 
  Sparkles, 
  ArrowUpRight, 
  ArrowDownRight, 
  Info,
  RefreshCw
} from 'lucide-react';
import { analyticsApi, type CohortBenchmarkData } from '../api/analytics.api';
import { Badge } from '../../../shared/components/Badge';
import { Button } from '../../../shared/components/Button';
import { Skeleton } from '../../../shared/components/Skeleton';

interface CohortCompetencyRadarProps {
  className?: string;
}

export const CohortCompetencyRadar: React.FC<CohortCompetencyRadarProps> = ({ className }) => {
  const [data, setData] = React.useState<CohortBenchmarkData | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [activeDimension, setActiveDimension] = React.useState<string | null>(null);

  const fetchBenchmark = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await analyticsApi.getCohortBenchmark();
      if (res && res.data) {
        setData(res.data);
      } else {
        throw new Error('Invalid cohort benchmark response');
      }
    } catch (err: any) {
      console.error('Failed to load cohort benchmark:', err);
      setError(err?.message || 'Failed to retrieve cohort benchmark');
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchBenchmark();
  }, [fetchBenchmark]);

  if (isLoading) {
    return (
      <div 
        style={{ 
          background: 'var(--color-surface)', 
          border: '1px solid var(--color-border)', 
          borderRadius: 'var(--radius-xl)', 
          padding: 'var(--space-24)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-16)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Skeleton style={{ width: 220, height: 28, borderRadius: 6 }} />
          <Skeleton style={{ width: 100, height: 24, borderRadius: 12 }} />
        </div>
        <Skeleton style={{ width: '100%', height: 320, borderRadius: 16 }} />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div 
        style={{ 
          background: 'var(--color-surface)', 
          border: '1px solid var(--color-border)', 
          borderRadius: 'var(--radius-xl)', 
          padding: 'var(--space-20)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-10)', color: 'var(--color-text-muted)' }}>
          <Info size={18} />
          <span>Cohort analytics temporarily unavailable</span>
        </div>
        <Button variant="outline" size="sm" onClick={fetchBenchmark}>
          <RefreshCw size={14} style={{ marginRight: 6 }} /> Retry
        </Button>
      </div>
    );
  }

  const { cohort, student, radar, insights, distribution } = data;

  // Geometry calculations for 6-axis Radar SVG
  const size = 380;
  const center = size / 2;
  const radius = center - 58;
  const totalAxes = radar.length;

  const getCoordinates = (index: number, score: number) => {
    // Angle in radians (start at top -PI/2)
    const angle = (Math.PI * 2 / totalAxes) * index - Math.PI / 2;
    const distance = (score / 100) * radius;
    const x = center + distance * Math.cos(angle);
    const y = center + distance * Math.sin(angle);
    return { x, y };
  };

  const studentPolygonPoints = radar
    .map((d, i) => {
      const { x, y } = getCoordinates(i, d.studentScore);
      return `${x},${y}`;
    })
    .join(' ');

  const cohortPolygonPoints = radar
    .map((d, i) => {
      const { x, y } = getCoordinates(i, d.cohortScore);
      return `${x},${y}`;
    })
    .join(' ');

  const rings = [0.2, 0.4, 0.6, 0.8, 1.0];

  return (
    <div 
      className={className}
      style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-xl)',
        padding: 'var(--space-24)',
        boxShadow: 'var(--shadow-sm)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-24)',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Top Banner / Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-12)' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-8)', marginBottom: 4 }}>
            <span 
              style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                width: 28, 
                height: 28, 
                borderRadius: 'var(--radius-md)', 
                background: 'rgba(14, 165, 233, 0.12)', 
                color: 'var(--color-primary, #0ea5e9)' 
              }}
            >
              <Users size={16} />
            </span>
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>
              Class Standing &amp; Subject Skills
            </h3>
          </div>
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
            Comparing your progress with {cohort.cohortLabel} ({cohort.totalStudents} classmates)
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-8)' }}>
          <Badge variant="primary" style={{ borderColor: student.tierColor, color: student.tierColor, fontWeight: 700 }}>
            <Award size={12} style={{ marginRight: 4 }} />
            {student.tier}
          </Badge>
          <Button variant="ghost" size="sm" onClick={fetchBenchmark} title="Refresh Data">
            <RefreshCw size={13} />
          </Button>
        </div>
      </div>

      {/* Cohort Percentile Hero Row */}
      <div 
        style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: 'var(--space-14)',
          background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.05) 0%, rgba(99, 102, 241, 0.05) 100%)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-16)',
          border: '1px solid rgba(14, 165, 233, 0.15)'
        }}
      >
        {/* Metric 1: Percentile Rank */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--color-text-muted)' }}>
            Class Standing
          </span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <span style={{ fontSize: '1.9rem', fontWeight: 900, color: student.tierColor, lineHeight: 1 }}>
              {student.percentile}th
            </span>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-muted)' }}>
              Percentile
            </span>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
            Scoring higher than {student.percentile}% of classmates
          </span>
        </div>

        {/* Metric 2: Student Score vs Cohort Average */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--color-text-muted)' }}>
            Your Score vs Class Average
          </span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontSize: '1.7rem', fontWeight: 800, color: 'var(--color-text-primary)', lineHeight: 1 }}>
              {student.averageScore}%
            </span>
            <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
              vs {cohort.cohortAverage}% class avg
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.75rem', fontWeight: 700, color: student.averageScore >= cohort.cohortAverage ? 'var(--color-success, #10b981)' : 'var(--color-danger)' }}>
            {student.averageScore >= cohort.cohortAverage ? (
              <>
                <ArrowUpRight size={13} /> +{student.averageScore - cohort.cohortAverage}% above class average
              </>
            ) : (
              <>
                <ArrowDownRight size={13} /> {student.averageScore - cohort.cohortAverage}% below class average
              </>
            )}
          </div>
        </div>

        {/* Metric 3: Top Competitive Edge */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--color-text-muted)' }}>
            Your Strongest Subject Area
          </span>
          <span style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>
            {insights.topStrength.label}
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-success, #10b981)', fontWeight: 700 }}>
            +{insights.topStrength.delta}% ahead of class average
          </span>
        </div>
      </div>

      {/* Main Radar & Dimension Panel Split */}
      <div 
        style={{ 
          display: 'grid', 
          gridTemplateColumns: 'minmax(320px, 1.2fr) minmax(280px, 1fr)', 
          gap: 'var(--space-24)',
          alignItems: 'center'
        }}
      >
        {/* Left: Dual Polygon SVG Radar */}
        <div 
          style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center',
            position: 'relative'
          }}
        >
          <svg 
            width={size} 
            height={size} 
            viewBox={`0 0 ${size} ${size}`}
            style={{ overflow: 'visible', maxWidth: '100%', height: 'auto' }}
          >
            {/* Concentric Grid Rings */}
            {rings.map((r, i) => (
              <polygon
                key={`ring-${i}`}
                points={radar.map((_, idx) => {
                  const { x, y } = getCoordinates(idx, r * 100);
                  return `${x},${y}`;
                }).join(' ')}
                fill="none"
                stroke="var(--color-border)"
                strokeDasharray={i < rings.length - 1 ? "2,4" : "none"}
                strokeWidth={i === rings.length - 1 ? 1.5 : 1}
                opacity={0.6}
              />
            ))}

            {/* Radial Spoke Lines */}
            {radar.map((_, idx) => {
              const { x, y } = getCoordinates(idx, 100);
              return (
                <line
                  key={`spoke-${idx}`}
                  x1={center}
                  y1={center}
                  x2={x}
                  y2={y}
                  stroke="var(--color-border)"
                  strokeWidth={1}
                  opacity={0.5}
                />
              );
            })}

            {/* Cohort Polygon (Benchmark) */}
            <polygon
              points={cohortPolygonPoints}
              fill="rgba(148, 163, 184, 0.18)"
              stroke="#64748b"
              strokeWidth={1.8}
              strokeDasharray="4,3"
            />

            {/* Student Polygon (Active) */}
            <polygon
              points={studentPolygonPoints}
              fill="rgba(14, 165, 233, 0.28)"
              stroke="var(--color-primary, #0ea5e9)"
              strokeWidth={2.5}
              style={{ filter: 'drop-shadow(0 2px 8px rgba(14, 165, 233, 0.35))' }}
            />

            {/* Vertex Nodes for Cohort */}
            {radar.map((d, idx) => {
              const { x, y } = getCoordinates(idx, d.cohortScore);
              return (
                <circle
                  key={`cohort-node-${idx}`}
                  cx={x}
                  cy={y}
                  r={3.5}
                  fill="#64748b"
                />
              );
            })}

            {/* Vertex Nodes for Student */}
            {radar.map((d, idx) => {
              const { x, y } = getCoordinates(idx, d.studentScore);
              const isActive = activeDimension === d.key;
              return (
                <circle
                  key={`student-node-${idx}`}
                  cx={x}
                  cy={y}
                  r={isActive ? 6 : 4.5}
                  fill={d.delta >= 0 ? "var(--color-success, #10b981)" : "var(--color-primary, #0ea5e9)"}
                  stroke="#ffffff"
                  strokeWidth={2}
                  style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                  onMouseEnter={() => setActiveDimension(d.key)}
                  onMouseLeave={() => setActiveDimension(null)}
                />
              );
            })}

            {/* Radial Labels */}
            {radar.map((d, idx) => {
              const angle = (Math.PI * 2 / totalAxes) * idx - Math.PI / 2;
              const labelDist = radius + 28;
              const x = center + labelDist * Math.cos(angle);
              const y = center + labelDist * Math.sin(angle);
              const isRight = Math.cos(angle) > 0.1;
              const isLeft = Math.cos(angle) < -0.1;
              const anchor = isRight ? 'start' : isLeft ? 'end' : 'middle';
              const isActive = activeDimension === d.key;

              return (
                <text
                  key={`label-${idx}`}
                  x={x}
                  y={y}
                  textAnchor={anchor}
                  dominantBaseline="central"
                  fontSize={10.5}
                  fontWeight={isActive ? 800 : 600}
                  fill={isActive ? "var(--color-primary, #0ea5e9)" : "var(--color-text-secondary)"}
                  style={{ cursor: 'pointer', transition: 'all 0.15s' }}
                  onMouseEnter={() => setActiveDimension(d.key)}
                  onMouseLeave={() => setActiveDimension(null)}
                >
                  {d.label.split(' ')[0]} {d.label.split(' ')[1] || ''}
                </text>
              );
            })}
          </svg>

          {/* Chart Legend */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-16)', marginTop: 'var(--space-8)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', fontWeight: 600 }}>
              <span style={{ width: 14, height: 4, borderRadius: 2, background: 'var(--color-primary, #0ea5e9)' }} />
              <span style={{ color: 'var(--color-text-primary)' }}>Your Score</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', fontWeight: 600 }}>
              <span style={{ width: 14, height: 4, borderRadius: 2, background: '#64748b', borderTop: '1px dashed #64748b' }} />
              <span style={{ color: 'var(--color-text-muted)' }}>Class Average</span>
            </div>
          </div>
        </div>

        {/* Right: Dimension Detailed Breakdown */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-10)' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-muted)', letterSpacing: '0.04em' }}>
            Skill Breakdown by Topic
          </span>

          {radar.map((d) => {
            const isActive = activeDimension === d.key;
            return (
              <div
                key={d.key}
                onMouseEnter={() => setActiveDimension(d.key)}
                onMouseLeave={() => setActiveDimension(null)}
                style={{
                  padding: 'var(--space-10) var(--space-14)',
                  borderRadius: 'var(--radius-lg)',
                  border: `1px solid ${isActive ? 'var(--color-primary)' : 'var(--color-border)'}`,
                  background: isActive ? 'var(--color-primary-light, rgba(14, 165, 233, 0.08))' : 'var(--color-surface-hover, rgba(0, 0, 0, 0.02))',
                  transition: 'all 0.15s ease',
                  cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--color-text-primary)' }}>
                    {d.label}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--color-primary)' }}>
                      {d.studentScore}%
                    </span>
                    <span 
                      style={{ 
                        fontSize: '0.75rem', 
                        fontWeight: 700, 
                        color: d.delta >= 0 ? 'var(--color-success, #10b981)' : 'var(--color-danger)' 
                      }}
                    >
                      ({d.delta >= 0 ? `+${d.delta}%` : `${d.delta}%`})
                    </span>
                  </div>
                </div>

                {/* Comparative Dual Progress Bar */}
                <div style={{ position: 'relative', width: '100%', height: 6, background: 'rgba(0, 0, 0, 0.06)', borderRadius: 3, overflow: 'hidden' }}>
                  {/* Cohort tick marker */}
                  <div 
                    style={{ 
                      position: 'absolute', 
                      left: `${d.cohortScore}%`, 
                      top: 0, 
                      bottom: 0, 
                      width: 2, 
                      background: '#64748b', 
                      zIndex: 3 
                    }} 
                    title={`Class Average: ${d.cohortScore}%`}
                  />
                  {/* Student bar */}
                  <div 
                    style={{ 
                      width: `${d.studentScore}%`, 
                      height: '100%', 
                      background: d.delta >= 0 ? 'var(--color-success, #10b981)' : 'var(--color-primary)', 
                      borderRadius: 3,
                      transition: 'width 0.3s ease'
                    }} 
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Cohort Bell Distribution & Pedagogical Growth Recommendation */}
      <div 
        style={{ 
          borderTop: '1px solid var(--color-border)', 
          paddingTop: 'var(--space-16)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          flexWrap: 'wrap', 
          gap: 'var(--space-16)' 
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-10)' }}>
          <Sparkles size={18} color="var(--color-primary)" style={{ flexShrink: 0 }} />
          <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
            <strong>Next Goal:</strong> Focus on <strong>{insights.topGrowthArea.label}</strong> to close the gap ({insights.topGrowthArea.delta}%) and reach the top 10% of your class.
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-8)', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
          <span>Class Score Range:</span>
          <span style={{ fontWeight: 600 }}>Min {distribution.min}%</span>
          <span>•</span>
          <span style={{ fontWeight: 600 }}>Median {distribution.median}%</span>
          <span>•</span>
          <span style={{ fontWeight: 600 }}>Top 10%: {distribution.top10}%</span>
        </div>
      </div>
    </div>
  );
};
