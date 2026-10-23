import { createLazyFileRoute, Link, useNavigate } from '@tanstack/react-router';
import * as React from 'react';
import { toast } from 'sonner';
import { Layers, Brain, RefreshCw } from 'lucide-react';
import { AppLayout } from '../shared/components/layout/AppLayout';
import { PageHeader } from '../shared/components/PageHeader';
import { EmptyState } from '../shared/components/EmptyState';
import { ErrorState } from '../shared/components/ErrorState';
import { Skeleton } from '../shared/components/Skeleton';
import { Button } from '../shared/components/Button';
import { useDocumentTitle } from '../shared/hooks/useDocumentTitle';
import { useAuth } from '../features/auth/hooks/useAuth';
import { reviewDeckApi } from '../features/review-deck/api/reviewDeck.api';
import { LeitnerBoxOverview } from '../features/review-deck/components/LeitnerBoxOverview';
import { FlashcardReviewSession } from '../features/review-deck/components/FlashcardReviewSession';
import type { ReviewCard, ReviewDeckSummary, ReviewRating } from '../types/reviewDeck.types';

export const Route = createLazyFileRoute('/review-deck')({
  component: ReviewDeckRoute,
});

function ReviewDeckRoute() {
  useDocumentTitle('Spaced Repetition Review Deck — EduAdapt');
  const { user } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = React.useState<'overview' | 'session'>('overview');
  const [summary, setSummary] = React.useState<ReviewDeckSummary | null>(null);
  const [dueCards, setDueCards] = React.useState<ReviewCard[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const fetchDeckData = React.useCallback(async (showToast = false) => {
    try {
      if (showToast) setIsRefreshing(true);
      setErrorMessage(null);

      const [sumRes, dueRes] = await Promise.all([
        reviewDeckApi.getSummary(),
        reviewDeckApi.getDueCards(undefined, 50),
      ]);

      setSummary(sumRes.data);
      setDueCards(dueRes.data || []);
      if (showToast) toast.success('Review deck refreshed');
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to connect to review deck service.';
      setErrorMessage(msg);
      if (showToast) toast.error(msg);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  React.useEffect(() => {
    fetchDeckData();
  }, [fetchDeckData]);

  const handleReviewCard = React.useCallback(async (cardId: string, rating: ReviewRating) => {
    try {
      await reviewDeckApi.submitReview(cardId, rating);
    } catch (err: any) {
      toast.error('Failed to save card progress. Please try again.');
      throw err;
    }
  }, []);

  const handleSessionComplete = React.useCallback(() => {
    setMode('overview');
    fetchDeckData();
    toast.success('Spaced repetition progress saved successfully!');
  }, [fetchDeckData]);

  const startSession = React.useCallback(() => {
    if (dueCards.length === 0) {
      toast.info('No cards are currently due for review.');
      return;
    }
    setMode('session');
  }, [dueCards.length]);

  return (
    <AppLayout userName={user?.name || 'Student'}>
      <div className="page-container page-wide py-6 sm:py-8 space-y-6">
        {mode === 'overview' ? (
          <>
            <PageHeader
              title="Spaced Repetition Review Deck"
              description="Automated spaced repetition using the Leitner 5-box algorithm. Missed questions are surfaced at calculated intervals to move weak concepts into permanent recall."
              breadcrumb={
                <>
                  <Link to="/" className="hover:text-text-primary transition-colors">Home</Link>
                  <span>/</span>
                  <Link to="/exam-prep" className="hover:text-text-primary transition-colors">Practice</Link>
                  <span>/</span>
                  <span className="text-text-primary font-semibold">Review Deck</span>
                </>
              }
              actions={
                <div className="flex items-center gap-2.5 flex-wrap">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchDeckData(true)}
                    disabled={isRefreshing || isLoading}
                  >
                    <RefreshCw size={14} className={`mr-1.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>

                  {summary && summary.dueToday > 0 && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={startSession}
                      disabled={isLoading}
                    >
                      <Layers size={14} className="mr-1.5" />
                      Review Due Now ({summary.dueToday})
                    </Button>
                  )}
                </div>
              }
            />

            {/* Error State with Recovery */}
            {errorMessage ? (
              <ErrorState
                message={errorMessage}
                onRetry={() => {
                  setIsLoading(true);
                  fetchDeckData(true);
                }}
              />
            ) : isLoading ? (
              /* Loading Skeletons */
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} variant="card" className="h-28" />
                  ))}
                </div>
                <Skeleton variant="card" className="h-40" />
                <Skeleton variant="card" className="h-64" />
              </div>
            ) : !summary || summary.totalCards === 0 ? (
              /* Normalized Empty State */
              <div className="card p-10 border border-border bg-card/60 rounded-2xl text-center">
                <EmptyState
                  icon={<Brain size={28} className="text-primary" />}
                  title="Your Review Deck is Empty"
                  description="Great job! Any questions you get wrong during adaptive practice or mock exams will automatically be queued here for Leitner spaced repetition review."
                  actionLabel="Start a Practice Session"
                  onAction={() => navigate({ to: '/exam-prep' })}
                />
              </div>
            ) : (
              /* Leitner Box Overview */
              <LeitnerBoxOverview
                summary={summary}
                onStartReview={startSession}
                isLoading={isLoading}
              />
            )}
          </>
        ) : (
          /* Active Review Session */
          <FlashcardReviewSession
            cards={dueCards}
            onReviewCard={handleReviewCard}
            onComplete={handleSessionComplete}
            onExit={() => {
              setMode('overview');
              fetchDeckData();
            }}
          />
        )}
      </div>
    </AppLayout>
  );
}
