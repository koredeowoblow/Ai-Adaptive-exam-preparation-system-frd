import * as React from 'react';
import {
  RotateCw,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowLeft,
  BookOpen,
  Flame,
} from 'lucide-react';
import { Button } from '../../../shared/components/Button';
import { FormattedMathText } from '../../../shared/components/FormattedMathText';
import type { ReviewCard, ReviewRating } from '../../../types/reviewDeck.types';

interface FlashcardReviewSessionProps {
  cards: ReviewCard[];
  onReviewCard: (cardId: string, rating: ReviewRating) => Promise<void>;
  onComplete: () => void;
  onExit: () => void;
}

export const FlashcardReviewSession: React.FC<FlashcardReviewSessionProps> = React.memo(({
  cards,
  onReviewCard,
  onComplete,
  onExit,
}) => {
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [isFlipped, setIsFlipped] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [reviewedStats, setReviewedStats] = React.useState({
    again: 0,
    good: 0,
    easy: 0,
  });

  const activeCard = cards[currentIndex];
  const isFinished = currentIndex >= cards.length;

  const handleRating = React.useCallback(async (rating: ReviewRating) => {
    if (!activeCard || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onReviewCard(activeCard._id, rating);
      setReviewedStats((prev) => ({
        ...prev,
        [rating]: prev[rating] + 1,
      }));
      setIsFlipped(false);
      setCurrentIndex((prev) => prev + 1);
    } finally {
      setIsSubmitting(false);
    }
  }, [activeCard, isSubmitting, onReviewCard]);

  // Keyboard shortcut listener
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isFinished || isSubmitting) return;
      if (e.code === 'Space') {
        e.preventDefault();
        setIsFlipped((prev) => !prev);
      } else if (isFlipped) {
        if (e.key === '1') {
          e.preventDefault();
          handleRating('again');
        } else if (e.key === '2') {
          e.preventDefault();
          handleRating('good');
        } else if (e.key === '3') {
          e.preventDefault();
          handleRating('easy');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFlipped, isFinished, isSubmitting, handleRating]);

  // Completion Screen
  if (isFinished) {
    const totalDone = reviewedStats.again + reviewedStats.good + reviewedStats.easy;
    return (
      <div className="card max-w-xl mx-auto p-8 border border-border bg-card/80 backdrop-blur-xl rounded-3xl text-center space-y-6 shadow-2xl">
        <div className="w-20 h-20 mx-auto rounded-3xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-500 shadow-lg shadow-emerald-500/20">
          <Sparkles size={40} />
        </div>

        <div>
          <h2 className="text-2xl font-black text-text">Session Completed!</h2>
          <p className="text-sm text-text-secondary mt-1">
            You successfully drilled {totalDone} spaced repetition card{totalDone === 1 ? '' : 's'}.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-card border border-border/80">
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20">
            <span className="text-xs font-semibold text-rose-500">Again (Box 1)</span>
            <p className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-0.5">
              {reviewedStats.again}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
            <span className="text-xs font-semibold text-blue-500">+1 Box</span>
            <p className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-0.5">
              {reviewedStats.good}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <span className="text-xs font-semibold text-emerald-500">+2 Boxes</span>
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
              {reviewedStats.easy}
            </p>
          </div>
        </div>

        <Button fullWidth size="lg" variant="primary" onClick={onComplete}>
          Return to Deck Overview
        </Button>
      </div>
    );
  }

  const q = activeCard?.questionId;
  const questionPrompt = q?.questionText || q?.text || 'Question Prompt';
  const correctOption = q?.options?.find((o) => o.id === q?.correctAnswer);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Session Top Bar */}
      <div className="flex items-center justify-between gap-4">
        <Button variant="ghost" size="sm" onClick={onExit} aria-label="Exit review session">
          <ArrowLeft size={16} className="mr-1.5" />
          Exit Review
        </Button>

        <div className="flex-1 max-w-xs">
          <div className="flex justify-between text-xs text-text-secondary font-medium mb-1">
            <span>Card {currentIndex + 1} of {cards.length}</span>
            <span>{Math.round(((currentIndex) / cards.length) * 100)}%</span>
          </div>
          <div className="w-full bg-border/40 h-2 rounded-full overflow-hidden">
            <div
              className="bg-primary h-full transition-all duration-300"
              style={{ width: `${((currentIndex) / cards.length) * 100}%` }}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-card border border-border text-text-secondary flex items-center gap-1.5 truncate max-w-[150px]">
            <BookOpen size={12} className="text-primary shrink-0" />
            {activeCard?.courseId?.code || 'Course'}
          </span>
          <span className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-primary/10 border border-primary/20 text-primary shrink-0">
            Box {activeCard?.box || 1}
          </span>
        </div>
      </div>

      {/* 3D Flashcard Container */}
      <div
        tabIndex={0}
        role="region"
        aria-label="Interactive Flashcard - press Space or click to reveal answer"
        className="card min-h-[380px] p-6 sm:p-8 border border-border bg-card/90 backdrop-blur-md rounded-3xl shadow-xl flex flex-col justify-between cursor-pointer transition-all hover:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/50 overflow-hidden break-words"
        onClick={() => !isFlipped && setIsFlipped(true)}
        onKeyDown={(e) => {
          if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            setIsFlipped(true);
          }
        }}
      >
        {/* Card Header & Topic */}
        <div>
          <div className="flex items-center justify-between gap-2 mb-4 pb-3 border-b border-border/60">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 text-xs font-medium rounded-md bg-accent/15 text-accent border border-accent/20 truncate max-w-[200px]">
                {activeCard?.topicId?.name || 'Topic'}
              </span>
              <span className="text-xs text-text-secondary">
                {q?.type === 'THEORY' ? 'Theory / Written' : 'Multiple Choice'}
              </span>
            </div>

            <span className="text-xs text-text-secondary flex items-center gap-1 shrink-0">
              <RotateCw size={12} />
              {isFlipped ? 'Answer Revealed' : 'Click card or Space to reveal'}
            </span>
          </div>

          {/* Prompt */}
          <div className="text-base sm:text-lg font-medium text-text leading-relaxed break-words overflow-x-auto">
            <FormattedMathText text={questionPrompt} />
          </div>

          {/* MCQ Options List if present */}
          {q?.options && q.options.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-5">
              {q.options.map((opt) => {
                const isCorrect = isFlipped && opt.id === q.correctAnswer;
                return (
                  <div
                    key={opt.id}
                    className={`p-3 rounded-xl border text-sm transition-colors flex items-start gap-2.5 break-words overflow-hidden ${
                      isCorrect
                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 font-semibold'
                        : 'border-border/70 bg-card/40 text-text-secondary'
                    }`}
                  >
                    <span
                      className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold shrink-0 ${
                        isCorrect
                          ? 'bg-emerald-500 text-white'
                          : 'bg-border/60 text-text'
                      }`}
                    >
                      {opt.id.toUpperCase()}
                    </span>
                    <span className="flex-1 mt-0.5 break-words overflow-x-auto">
                      <FormattedMathText text={opt.text} />
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Flipped Section: Answer & Explanation */}
          {isFlipped && (
            <div className="mt-6 pt-5 border-t border-border/80 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              {correctOption && (
                <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl break-words">
                  <CheckCircle2 size={16} className="shrink-0" />
                  <span>
                    Correct Answer: Option {correctOption.id.toUpperCase()} - {correctOption.text}
                  </span>
                </div>
              )}

              {q?.explanation && (
                <div className="p-4 rounded-xl bg-primary/5 border border-primary/15 text-sm text-text leading-relaxed break-words overflow-x-auto">
                  <p className="text-xs font-bold text-primary uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <Sparkles size={12} /> Concept Explanation
                  </p>
                  <FormattedMathText text={q.explanation} />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Action Buttons */}
        <div className="pt-6 mt-4 border-t border-border/60" onClick={(e) => e.stopPropagation()}>
          {!isFlipped ? (
            <Button
              fullWidth
              size="lg"
              variant="outline"
              onClick={() => setIsFlipped(true)}
              className="font-medium"
            >
              <RotateCw size={16} className="mr-2" />
              Reveal Answer & Explanation (Space)
            </Button>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-text-secondary text-center mb-2 font-medium">
                How well did you recall this concept?
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Button
                  size="md"
                  variant="outline"
                  onClick={() => handleRating('again')}
                  disabled={isSubmitting}
                  className="border-rose-500/40 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10"
                >
                  <AlertCircle size={15} className="mr-1.5" />
                  Again [1]
                  <span className="text-[10px] opacity-75 ml-1">(Box 1)</span>
                </Button>

                <Button
                  size="md"
                  variant="primary"
                  onClick={() => handleRating('good')}
                  disabled={isSubmitting}
                >
                  <CheckCircle2 size={15} className="mr-1.5" />
                  Good [2]
                  <span className="text-[10px] opacity-75 ml-1">(+1 Box)</span>
                </Button>

                <Button
                  size="md"
                  variant="accent"
                  onClick={() => handleRating('easy')}
                  disabled={isSubmitting}
                  className="border-emerald-500/40 bg-emerald-500 text-white hover:bg-emerald-600"
                >
                  <Flame size={15} className="mr-1.5" />
                  Easy [3]
                  <span className="text-[10px] opacity-75 ml-1">(+2 Boxes)</span>
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
