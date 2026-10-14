import * as React from 'react';
import { CheckCircle2, XCircle, RotateCcw, ArrowRight, Sparkles } from 'lucide-react';
import { SAMPLE_QUESTIONS, type SampleQuestion, type DifficultyLevel } from '../data/sampleQuestions';

export const SampleQuestionSection: React.FC = () => {
  // Rotate selection across visits
  const [sessionQuestions, setSessionQuestions] = React.useState<SampleQuestion[]>(() => {
    const easy = SAMPLE_QUESTIONS.filter((q) => q.difficulty === 'Easy');
    const medium = SAMPLE_QUESTIONS.filter((q) => q.difficulty === 'Medium');
    const harder = SAMPLE_QUESTIONS.filter((q) => q.difficulty === 'Harder');

    const randomPick = (arr: SampleQuestion[]) => arr[Math.floor(Math.random() * arr.length)];
    return [randomPick(easy), randomPick(medium), randomPick(harder)];
  });

  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [selectedOption, setSelectedOption] = React.useState<'A' | 'B' | 'C' | 'D' | null>(null);
  const [isAnswered, setIsAnswered] = React.useState(false);
  const [isCompleted, setIsCompleted] = React.useState(false);

  // Dynamic adaptive difficulty tracking
  const [currentDifficulty, setCurrentDifficulty] = React.useState<DifficultyLevel>('Easy');

  const currentQ = sessionQuestions[currentIndex] || sessionQuestions[0];
  const isCorrect = selectedOption === currentQ.correctAnswer;

  const handleSelect = React.useCallback(
    (optionId: 'A' | 'B' | 'C' | 'D') => {
      if (isAnswered) return;
      setSelectedOption(optionId);
      setIsAnswered(true);

      const correct = optionId === currentQ.correctAnswer;
      // Step up difficulty if correct, ease if missed
      if (correct) {
        setCurrentDifficulty((prev) => (prev === 'Easy' ? 'Medium' : 'Harder'));
      } else {
        setCurrentDifficulty((prev) => (prev === 'Harder' ? 'Medium' : 'Easy'));
      }
    },
    [isAnswered, currentQ.correctAnswer]
  );

  // Keyboard shortcut (A, B, C, D or 1, 2, 3, 4) - only when not focused on an input/form field
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement;
      const isInput =
        activeElement &&
        (activeElement.tagName === 'INPUT' ||
          activeElement.tagName === 'TEXTAREA' ||
          (activeElement as HTMLElement).isContentEditable);

      if (isInput || isAnswered || isCompleted) return;

      const key = e.key ? e.key.toUpperCase() : '';
      const code = e.code;
      if (key === 'A' || key === '1' || code === 'KeyA' || code === 'Digit1') handleSelect('A');
      else if (key === 'B' || key === '2' || code === 'KeyB' || code === 'Digit2') handleSelect('B');
      else if (key === 'C' || key === '3' || code === 'KeyC' || code === 'Digit3') handleSelect('C');
      else if (key === 'D' || key === '4' || code === 'KeyD' || code === 'Digit4') handleSelect('D');
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSelect, isAnswered, isCompleted]);

  const handleNext = () => {
    if (currentIndex < sessionQuestions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      setIsCompleted(true);
    }
  };

  const handleRestart = () => {
    // Re-pick 3 questions
    const easy = SAMPLE_QUESTIONS.filter((q) => q.difficulty === 'Easy');
    const medium = SAMPLE_QUESTIONS.filter((q) => q.difficulty === 'Medium');
    const harder = SAMPLE_QUESTIONS.filter((q) => q.difficulty === 'Harder');
    const randomPick = (arr: SampleQuestion[]) => arr[Math.floor(Math.random() * arr.length)];

    setSessionQuestions([randomPick(easy), randomPick(medium), randomPick(harder)]);
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setIsCompleted(false);
    setCurrentDifficulty('Easy');
  };

  const difficultyColors: Record<DifficultyLevel, string> = {
    Easy: 'text-[var(--auth-difficulty-easy)] bg-[var(--auth-difficulty-easy)]/10 border-[var(--auth-difficulty-easy)]/30',
    Medium: 'text-[var(--auth-difficulty-medium)] bg-[var(--auth-difficulty-medium)]/10 border-[var(--auth-difficulty-medium)]/30',
    Harder: 'text-[var(--auth-difficulty-hard)] bg-[var(--auth-difficulty-hard)]/10 border-[var(--auth-difficulty-hard)]/30',
  };

  return (
    <div
      tabIndex={0}
      aria-label="Interactive Sample Question Card"
      className="bg-[var(--auth-side-bg)] border border-[var(--auth-side-border)] rounded-2xl p-6 sm:p-8 flex flex-col justify-between shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--auth-accent)] relative"
    >
      {/* Top Meta Bar */}
      <div className="flex items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--auth-text-muted)]">
            {currentQ.courseCode}
          </span>
          <span className="text-xs text-[var(--auth-text-muted)]" aria-hidden="true">
            •
          </span>
          <span className="text-xs text-[var(--auth-text-muted)] truncate max-w-[180px] sm:max-w-[260px]">
            {currentQ.courseTitle}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${difficultyColors[currentDifficulty]}`}
          >
            Level: {currentDifficulty}
          </span>
          <span className="text-xs text-[var(--auth-text-muted)] font-mono">
            {currentIndex + 1} of 3
          </span>
        </div>
      </div>

      {/* Main Question Body or Completion State */}
      {!isCompleted ? (
        <div className="flex-1 flex flex-col justify-between">
          <div>
            <h3 className="text-lg sm:text-xl font-semibold text-[var(--auth-text)] tracking-[-0.01em] mb-6 leading-snug">
              {currentQ.questionText}
            </h3>

            {/* Options List */}
            <div className="space-y-2.5 mb-6" role="radiogroup" aria-label="Question choices">
              {currentQ.options.map((opt) => {
                const isSelected = selectedOption === opt.id;
                const isCorrectOption = opt.id === currentQ.correctAnswer;

                let stateClasses =
                  'border-[var(--auth-border)] bg-[var(--auth-card-bg)] text-[var(--auth-text)] hover:border-[var(--auth-accent)]';

                if (isAnswered) {
                  if (isCorrectOption) {
                    stateClasses =
                      'border-[var(--auth-success)] bg-[var(--auth-success-bg)] text-[var(--auth-text)]';
                  } else if (isSelected && !isCorrectOption) {
                    stateClasses =
                      'border-[var(--auth-danger)] bg-[var(--auth-danger-bg)] text-[var(--auth-text)]';
                  } else {
                    stateClasses =
                      'border-[var(--auth-border)] bg-[var(--auth-card-bg)] opacity-60 text-[var(--auth-text)]';
                  }
                } else if (isSelected) {
                  stateClasses =
                    'border-[var(--auth-accent)] bg-[var(--auth-card-bg)] text-[var(--auth-text)]';
                }

                return (
                  <button
                    key={opt.id}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    disabled={isAnswered}
                    onClick={() => handleSelect(opt.id)}
                    className={`w-full text-left min-h-[46px] p-3 rounded-xl border flex items-center gap-3 transition-colors cursor-pointer disabled:cursor-default focus:outline-none focus:ring-2 focus:ring-[var(--auth-accent)] ${stateClasses}`}
                  >
                    <span
                      aria-hidden="true"
                      className={`w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 border transition-colors ${
                        isAnswered && isCorrectOption
                          ? 'bg-[var(--auth-success)] text-white border-[var(--auth-success)]'
                          : isAnswered && isSelected && !isCorrectOption
                          ? 'bg-[var(--auth-danger)] text-white border-[var(--auth-danger)]'
                          : 'bg-[var(--auth-side-bg)] text-[var(--auth-text-muted)] border-[var(--auth-border)]'
                      }`}
                    >
                      {opt.id}
                    </span>
                    <span className="flex-1 text-sm font-medium">{opt.text}</span>

                    {/* Feedback Icon */}
                    {isAnswered && isCorrectOption && (
                      <span className="flex items-center gap-1 text-xs font-semibold text-[var(--auth-success)]">
                        <CheckCircle2 size={16} aria-hidden="true" />
                        <span>Correct</span>
                      </span>
                    )}
                    {isAnswered && isSelected && !isCorrectOption && (
                      <span className="flex items-center gap-1 text-xs font-semibold text-[var(--auth-danger)]">
                        <XCircle size={16} aria-hidden="true" />
                        <span>Incorrect</span>
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Instant AI Feedback & Explanation */}
            {isAnswered && (
              <div
                role="status"
                aria-live="polite"
                className={`p-4 rounded-xl border mb-6 auth-feedback-transition ${
                  isCorrect
                    ? 'border-[var(--auth-success-border)] bg-[var(--auth-success-bg)]'
                    : 'border-[var(--auth-danger-border)] bg-[var(--auth-danger-bg)]'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1.5 text-xs font-bold uppercase tracking-wider">
                  <Sparkles size={14} className="text-[var(--auth-accent)]" aria-hidden="true" />
                  <span className={isCorrect ? 'text-[var(--auth-success)]' : 'text-[var(--auth-danger)]'}>
                    {isCorrect ? 'Correct analysis' : 'Explanation'}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-[var(--auth-text)] leading-relaxed m-0">
                  {currentQ.explanation}
                </p>
              </div>
            )}
          </div>

          {/* Action Row */}
          <div className="pt-2 flex items-center justify-between border-t border-[var(--auth-side-border)] text-xs text-[var(--auth-text-muted)]">
            <span className="italic">Sample questions, not graded</span>

            {isAnswered ? (
              <button
                type="button"
                onClick={handleNext}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[var(--auth-accent)] hover:bg-[var(--auth-accent-hover)] text-white font-medium text-xs transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--auth-accent)]"
              >
                <span>{currentIndex < 2 ? 'Next question' : 'Finish sample'}</span>
                <ArrowRight size={14} aria-hidden="true" />
              </button>
            ) : (
              <span className="hidden sm:inline-block">Press A, B, C, or D to answer</span>
            )}
          </div>
        </div>
      ) : (
        /* Completion State */
        <div className="py-8 flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-full bg-[var(--auth-accent)]/10 text-[var(--auth-accent)] flex items-center justify-center mb-4">
            <Sparkles size={24} aria-hidden="true" />
          </div>
          <h3 className="text-lg font-bold text-[var(--auth-text)] mb-2">
            That is how practice works.
          </h3>
          <p className="text-sm text-[var(--auth-text-muted)] max-w-sm mb-6 leading-relaxed">
            EduAdapt adjusts question difficulty as you answer. Sign in to start with your actual department curriculum.
          </p>

          <button
            type="button"
            onClick={handleRestart}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--auth-border)] bg-[var(--auth-card-bg)] hover:bg-[var(--auth-side-bg)] text-xs font-semibold text-[var(--auth-text)] transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--auth-accent)]"
          >
            <RotateCcw size={14} aria-hidden="true" />
            <span>Try another question set</span>
          </button>
        </div>
      )}
    </div>
  );
};
