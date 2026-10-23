import * as React from 'react';
import { Layers, Brain, CheckCircle2, Flame, Award, Clock, ArrowRight } from 'lucide-react';
import { Button } from '../../../shared/components/Button';
import type { ReviewDeckSummary } from '../../../types/reviewDeck.types';

interface LeitnerBoxOverviewProps {
  summary: ReviewDeckSummary;
  onStartReview: () => void;
  isLoading?: boolean;
}

const BOX_DETAILS = [
  {
    box: 1,
    name: 'Box 1: Fresh / Lapsed',
    interval: 'Every 1 day',
    desc: 'Newly missed or forgotten questions requiring daily reinforcement.',
    badgeColor: 'bg-rose-500/15 text-rose-500 dark:text-rose-400 border-rose-500/20',
    barColor: 'bg-rose-500',
  },
  {
    box: 2,
    name: 'Box 2: Developing',
    interval: 'Every 3 days',
    desc: 'Concepts recognized once. Scheduled for verification in 3 days.',
    badgeColor: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20',
    barColor: 'bg-amber-500',
  },
  {
    box: 3,
    name: 'Box 3: Familiar',
    interval: 'Every 7 days',
    desc: 'Solid grasp developing. Reviewed weekly to ensure long-term encoding.',
    badgeColor: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/20',
    barColor: 'bg-blue-500',
  },
  {
    box: 4,
    name: 'Box 4: Proficient',
    interval: 'Every 14 days',
    desc: 'Strong recall demonstrated. Reviewed every 2 weeks.',
    badgeColor: 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
    barColor: 'bg-indigo-500',
  },
  {
    box: 5,
    name: 'Box 5: Mastered',
    interval: 'Every 30 days',
    desc: 'Consolidated into permanent memory. Monthly spot-checks only.',
    badgeColor: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    barColor: 'bg-emerald-500',
  },
];

export const LeitnerBoxOverview: React.FC<LeitnerBoxOverviewProps> = React.memo(({
  summary,
  onStartReview,
  isLoading,
}) => {
  const total = summary.totalCards || 1; // avoid divide by 0

  return (
    <div className="space-y-6">
      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-5 border border-border bg-card/60 backdrop-blur-md rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-text-secondary uppercase tracking-wider">Due for Review</p>
            <h3 className="text-3xl font-extrabold text-text mt-1">
              {summary.dueToday}
            </h3>
            <p className="text-xs text-text-secondary mt-1 flex items-center gap-1">
              <Clock size={12} className="text-primary" /> Ready to review now
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <Brain size={24} />
          </div>
        </div>

        <div className="card p-5 border border-border bg-card/60 backdrop-blur-md rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-text-secondary uppercase tracking-wider">Total in Deck</p>
            <h3 className="text-3xl font-extrabold text-text mt-1">{summary.totalCards}</h3>
            <p className="text-xs text-text-secondary mt-1 flex items-center gap-1">
              <Layers size={12} /> Across all Leitner boxes
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
            <Layers size={24} />
          </div>
        </div>

        <div className="card p-5 border border-border bg-card/60 backdrop-blur-md rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-text-secondary uppercase tracking-wider">Retention Rate</p>
            <h3 className="text-3xl font-extrabold text-text mt-1">{summary.retentionRate}%</h3>
            <p className="text-xs text-text-secondary mt-1 flex items-center gap-1">
              <CheckCircle2 size={12} className="text-emerald-500" /> Successful recall rate
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
            <Flame size={24} />
          </div>
        </div>

        <div className="card p-5 border border-border bg-card/60 backdrop-blur-md rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-text-secondary uppercase tracking-wider">Mastered (Box 5)</p>
            <h3 className="text-3xl font-extrabold text-text mt-1">{summary.boxes.box5}</h3>
            <p className="text-xs text-text-secondary mt-1 flex items-center gap-1">
              <Award size={12} className="text-amber-500" /> Permanent retention
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
            <Award size={24} />
          </div>
        </div>
      </div>

      {/* Main Action Banner */}
      <div className="card p-6 border border-primary/30 bg-gradient-to-r from-primary/10 via-card to-accent/10 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-1 text-center sm:text-left">
          <div className="flex items-center gap-2 justify-center sm:justify-start">
            <span className="badge px-2.5 py-0.5 text-xs font-semibold rounded-full bg-primary/20 text-primary border border-primary/30">
              Leitner Spaced Repetition Engine
            </span>
            {summary.dueToday > 0 && (
              <span className="badge px-2.5 py-0.5 text-xs font-semibold rounded-full bg-rose-500/15 text-rose-500 border border-rose-500/20 animate-pulse">
                {summary.dueToday} Questions Due
              </span>
            )}
          </div>
          <h2 className="text-xl font-bold text-text">
            {summary.dueToday > 0
              ? 'Ready to solidify your memory today?'
              : 'You are completely caught up on your spaced reviews!'}
          </h2>
          <p className="text-sm text-text-secondary max-w-xl">
            Questions you struggle with appear frequently. As your recall improves, intervals expand exponentially from 1 to 30 days.
          </p>
        </div>

        <Button
          size="lg"
          variant="primary"
          onClick={onStartReview}
          disabled={summary.dueToday === 0 || isLoading}
          className="shrink-0 shadow-lg shadow-primary/25"
        >
          <Brain size={18} className="mr-2" />
          {summary.dueToday > 0 ? `Review Due Questions (${summary.dueToday})` : 'All Caught Up'}
          <ArrowRight size={16} className="ml-2" />
        </Button>
      </div>

      {/* Leitner Boxes Visual Grid */}
      <div className="card p-6 border border-border bg-card/60 backdrop-blur-md rounded-2xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-text">Leitner Distribution Stages</h3>
            <p className="text-xs text-text-secondary">
              Track how your weak points graduate from daily drilling to permanent mastery
            </p>
          </div>
          <span className="text-xs text-text-secondary">
            {summary.totalCards} total cards
          </span>
        </div>

        <div className="space-y-3.5">
          {BOX_DETAILS.map((boxInfo) => {
            const count = summary.boxes[`box${boxInfo.box}` as keyof typeof summary.boxes] || 0;
            const pct = Math.round((count / total) * 100);

            return (
              <div
                key={boxInfo.box}
                className="p-4 rounded-xl border border-border/70 bg-card/40 hover:bg-card/70 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`px-2.5 py-0.5 text-xs font-semibold rounded-md border ${boxInfo.badgeColor}`}
                    >
                      {boxInfo.interval}
                    </span>
                    <span className="font-semibold text-text text-sm">{boxInfo.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-text-secondary">{boxInfo.desc}</span>
                    <span className="text-sm font-bold text-text min-w-[50px] text-right">
                      {count} <span className="text-xs font-normal text-text-secondary">cards</span>
                    </span>
                  </div>
                </div>

                <div
                  className="w-full bg-border/40 h-2 rounded-full overflow-hidden"
                  role="progressbar"
                  aria-valuenow={pct}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${boxInfo.name} card distribution: ${pct}%`}
                >
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${boxInfo.barColor}`}
                    style={{ width: `${Math.max(count > 0 ? 3 : 0, pct)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});
