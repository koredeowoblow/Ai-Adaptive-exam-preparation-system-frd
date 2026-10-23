import * as React from 'react';
import { CheckCircle2, AlertCircle, ArrowRight, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react';

interface OptionItem {
  id: 'A' | 'B' | 'C' | 'D';
  label: React.ReactNode;
  plainText: string;
  isCorrect: boolean;
}

interface QuestionItem {
  id: string;
  courseCode: string;
  courseTitle: string;
  questionText: string;
  mathFormula?: React.ReactNode;
  options: OptionItem[];
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  correctFeedback: string;
  wrongFeedback: string;
}

const SAMPLE_QUESTIONS: QuestionItem[] = [
  {
    id: 'csc101-index',
    courseCode: 'CSC 101',
    courseTitle: 'Introduction to Computer Science',
    questionText: 'In Python, which zero-based index accesses the second element of a list?',
    options: [
      { id: 'A', label: '0', plainText: '0', isCorrect: false },
      { id: 'B', label: '1', plainText: '1', isCorrect: true },
      { id: 'C', label: '2', plainText: '2', isCorrect: false },
      { id: 'D', label: '-1', plainText: '-1', isCorrect: false },
    ],
    correctAnswer: 'B',
    correctFeedback: 'Correct. Index 0 is the first item, so 1 is the second.',
    wrongFeedback: 'Not quite. Lists start at index 0, so the second item is 1.',
  },
  {
    id: 'mth101-limit',
    courseCode: 'MTH 101',
    courseTitle: 'Elementary Mathematics I',
    questionText: 'Evaluate the trigonometric limit:',
    mathFormula: (
      <div
        className="flex items-center gap-2.5 my-2.5 font-serif text-white select-none"
        aria-label="Limit as x approaches 0 of sin x over x"
      >
        <div className="inline-flex flex-col items-center justify-center leading-none">
          <span className="italic font-bold text-[18px]">lim</span>
          <span className="text-[12px] font-sans text-[#B8C6D9] mt-0.5 tracking-tight font-medium">
            x &rarr; 0
          </span>
        </div>
        <div className="inline-flex flex-col items-center justify-center leading-none mx-0.5">
          <span className="italic text-[17px] px-1.5 pb-0.5 border-b border-white/80">
            sin x
          </span>
          <span className="italic text-[17px] px-1.5 pt-0.5">
            x
          </span>
        </div>
        <span className="text-[#B8C6D9] text-[18px] font-sans font-normal">
          = &nbsp;?
        </span>
      </div>
    ),
    options: [
      { id: 'A', label: '0', plainText: '0', isCorrect: false },
      { id: 'B', label: '1', plainText: '1', isCorrect: true },
      {
        id: 'C',
        label: (
          <span className="inline-flex items-center gap-1.5">
            <span className="text-xl font-serif font-bold leading-none">&infin;</span>
            <span className="text-[13px] text-[#B8C6D9] font-normal">(Infinity)</span>
          </span>
        ),
        plainText: '∞',
        isCorrect: false,
      },
      { id: 'D', label: 'Undefined', plainText: 'Undefined', isCorrect: false },
    ],
    correctAnswer: 'B',
    correctFeedback: 'Correct. By standard trigonometric limits, lim(x → 0) (sin x)/x = 1.',
    wrongFeedback: "Not quite. Using L'Hôpital's rule: derivative of sin x is cos x, and cos(0)/1 = 1.",
  },
  {
    id: 'mth101-derivative',
    courseCode: 'MTH 101',
    courseTitle: 'Elementary Mathematics I',
    questionText: 'Find the derivative with respect to x:',
    mathFormula: (
      <div
        className="flex items-center gap-2.5 my-2.5 font-serif text-white select-none"
        aria-label="d over dx of e to the power of 3x"
      >
        <div className="inline-flex flex-col items-center justify-center leading-none">
          <span className="italic text-[16px] px-1 pb-0.5 border-b border-white/80">d</span>
          <span className="italic text-[16px] px-1 pt-0.5">dx</span>
        </div>
        <div className="inline-flex items-baseline text-[18px]">
          <span>[</span>
          <span className="italic mx-0.5">e</span>
          <sup className="text-[12px] font-sans font-semibold text-[#6EE7A0]">3x</sup>
          <span>]</span>
        </div>
        <span className="text-[#B8C6D9] text-[18px] font-sans font-normal">
          = &nbsp;?
        </span>
      </div>
    ),
    options: [
      {
        id: 'A',
        label: (
          <span className="font-serif">
            <span className="italic">e</span>
            <sup className="text-[11px] font-sans font-semibold">3x</sup>
          </span>
        ),
        plainText: 'e^(3x)',
        isCorrect: false,
      },
      {
        id: 'B',
        label: (
          <span className="font-serif">
            3<span className="italic">e</span>
            <sup className="text-[11px] font-sans font-semibold">3x</sup>
          </span>
        ),
        plainText: '3e^(3x)',
        isCorrect: true,
      },
      {
        id: 'C',
        label: (
          <span className="font-serif">
            3<span className="italic">e</span>
            <sup className="text-[11px] font-sans font-semibold">2x</sup>
          </span>
        ),
        plainText: '3e^(2x)',
        isCorrect: false,
      },
      {
        id: 'D',
        label: (
          <span className="font-serif inline-flex items-center gap-0.5">
            <span className="text-[14px] font-sans">⅓</span>
            <span className="italic">e</span>
            <sup className="text-[11px] font-sans font-semibold">3x</sup>
          </span>
        ),
        plainText: '(1/3)e^(3x)',
        isCorrect: false,
      },
    ],
    correctAnswer: 'B',
    correctFeedback: 'Correct. By the chain rule, d/dx[e^(3x)] = 3e^(3x).',
    wrongFeedback: 'Not quite. Multiply e^(3x) by the derivative of the exponent 3x (which is 3).',
  },
];

export const LoginSampleQuestionCard: React.FC = () => {
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [selectedOption, setSelectedOption] = React.useState<'A' | 'B' | 'C' | 'D' | null>(null);

  const currentQ = SAMPLE_QUESTIONS[currentIndex] || SAMPLE_QUESTIONS[0];
  const isAnswered = selectedOption !== null;
  const isCorrect = selectedOption === currentQ.correctAnswer;

  const handleSelect = React.useCallback((id: 'A' | 'B' | 'C' | 'D') => {
    setSelectedOption(id);
  }, []);

  const handleNext = React.useCallback(() => {
    if (currentIndex < SAMPLE_QUESTIONS.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
    } else {
      // Loop back to start
      setCurrentIndex(0);
      setSelectedOption(null);
    }
  }, [currentIndex]);

  const handlePrev = React.useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setSelectedOption(null);
    }
  }, [currentIndex]);

  // Keyboard shortcuts (A, B, C, D or 1, 2, 3, 4, and Enter/RightArrow to advance)
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const active = document.activeElement;
      const isInput =
        active &&
        (active.tagName === 'INPUT' ||
          active.tagName === 'TEXTAREA' ||
          (active as HTMLElement).isContentEditable);

      if (isInput) return;

      const key = e.key ? e.key.toUpperCase() : '';
      if (key === 'A' || key === '1' || e.code === 'KeyA' || e.code === 'Digit1') handleSelect('A');
      else if (key === 'B' || key === '2' || e.code === 'KeyB' || e.code === 'Digit2') handleSelect('B');
      else if (key === 'C' || key === '3' || e.code === 'KeyC' || e.code === 'Digit3') handleSelect('C');
      else if (key === 'D' || key === '4' || e.code === 'KeyD' || e.code === 'Digit4') handleSelect('D');
      else if ((e.key === 'Enter' || e.key === 'ArrowRight') && isAnswered) {
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSelect, handleNext, isAnswered]);

  return (
    <div
      tabIndex={0}
      role="region"
      aria-label="Interactive Sample Question Card"
      className="rounded-[16px] border border-[#2E4A66] bg-[#0F2B45] p-6 text-white w-full shadow-lg focus:outline-none focus:ring-2 focus:ring-[#0E6BA8] focus:ring-offset-2 focus:ring-offset-[#0B2239]"
    >
      {/* Header row with course code and pagination controls */}
      <div className="flex items-center justify-between text-[13px] mb-3.5">
        <span className="font-medium text-[#B8C6D9] truncate max-w-[280px]">
          {currentQ.courseCode} {currentQ.courseTitle}
        </span>
        <div className="flex items-center gap-1.5 shrink-0">
          {currentIndex > 0 && (
            <button
              type="button"
              onClick={handlePrev}
              aria-label="Previous question"
              className="p-0.5 rounded text-[#8FA3BB] hover:text-white hover:bg-white/10 transition-colors focus:outline-none focus:ring-1 focus:ring-[#0E6BA8]"
            >
              <ChevronLeft size={16} aria-hidden="true" />
            </button>
          )}
          <span className="text-[#8FA3BB] font-mono select-none">
            {currentIndex + 1} of {SAMPLE_QUESTIONS.length}
          </span>
          {currentIndex < SAMPLE_QUESTIONS.length - 1 && (
            <button
              type="button"
              onClick={handleNext}
              aria-label="Next question preview"
              className="p-0.5 rounded text-[#8FA3BB] hover:text-white hover:bg-white/10 transition-colors focus:outline-none focus:ring-1 focus:ring-[#0E6BA8]"
            >
              <ChevronRight size={16} aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      {/* Question Headline */}
      <h3 className="text-[17px] font-semibold text-white leading-snug">
        {currentQ.questionText}
      </h3>

      {/* Render Mathematical Notation if present */}
      {currentQ.mathFormula}

      {/* Options Grid: grid-cols-1 below md and grid-cols-2 from md up */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4" role="radiogroup" aria-label="Question choices">
        {currentQ.options.map((opt) => {
          const isSelected = selectedOption === opt.id;
          const isCorrectOption = opt.isCorrect;

          let borderClass = 'border-[#2E4A66]';
          let bgClass = 'bg-[#0B2239]/60 hover:bg-[#0B2239] hover:border-[#3D6082] text-white';
          let badgeClass = 'bg-[#0B2239] border border-[#2E4A66] text-[#B8C6D9]';

          if (isAnswered) {
            if (isCorrectOption) {
              borderClass = 'border-[#6EE7A0]';
              bgClass = 'bg-[#6EE7A0]/15 text-white';
              badgeClass = 'bg-[#6EE7A0] border-[#6EE7A0] text-[#0B2239] font-bold';
            } else if (isSelected && !isCorrectOption) {
              borderClass = 'border-[#FCA5A5]';
              bgClass = 'bg-[#FCA5A5]/15 text-white';
              badgeClass = 'bg-[#FCA5A5] border-[#FCA5A5] text-[#0B2239] font-bold';
            } else {
              borderClass = 'border-[#2E4A66]/50';
              bgClass = 'bg-[#0B2239]/30 text-white/70';
              badgeClass = 'bg-[#0B2239]/60 border border-[#2E4A66]/50 text-[#8FA3BB]';
            }
          }

          return (
            <button
              key={opt.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => handleSelect(opt.id)}
              className={`h-[52px] rounded-[12px] border px-4 flex items-center gap-3 transition-colors cursor-pointer text-left focus:outline-none focus:ring-2 focus:ring-[#0E6BA8] focus:ring-offset-2 focus:ring-offset-[#0F2B45] ${borderClass} ${bgClass}`}
            >
              <span
                aria-hidden="true"
                className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center shrink-0 transition-colors ${badgeClass}`}
              >
                {opt.id}
              </span>
              <span className="text-[16px] font-semibold">{opt.label}</span>
            </button>
          );
        })}
      </div>

      {/* Feedback Line Below with Next / Advance Button */}
      <div className="mt-4 pt-3 border-t border-[#2E4A66]/60 min-h-[44px] flex items-center justify-between gap-3">
        <div className="flex-1">
          {!isAnswered && (
            <p className="text-[13px] text-[#8FA3BB] m-0">
              Tap an answer to try it.
            </p>
          )}
          {isAnswered && isCorrect && (
            <p role="status" aria-live="polite" className="text-[13px] font-medium text-[#6EE7A0] m-0 flex items-center gap-1.5 leading-snug">
              <CheckCircle2 size={16} aria-hidden="true" className="shrink-0" />
              <span>{currentQ.correctFeedback}</span>
            </p>
          )}
          {isAnswered && !isCorrect && (
            <p role="status" aria-live="polite" className="text-[13px] font-medium text-[#FCA5A5] m-0 flex items-center gap-1.5 leading-snug">
              <AlertCircle size={16} aria-hidden="true" className="shrink-0" />
              <span>{currentQ.wrongFeedback}</span>
            </p>
          )}
        </div>

        {/* Action Button: Next question or Restart when answered */}
        {isAnswered && (
          <button
            type="button"
            onClick={handleNext}
            className="h-8 px-3 rounded-lg bg-[#0E6BA8] hover:bg-[#0A5588] text-white text-[12px] font-semibold flex items-center gap-1.5 shrink-0 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0E6BA8] focus:ring-offset-1 focus:ring-offset-[#0F2B45] cursor-pointer"
          >
            <span>{currentIndex < SAMPLE_QUESTIONS.length - 1 ? 'Next question' : 'Try again'}</span>
            {currentIndex < SAMPLE_QUESTIONS.length - 1 ? (
              <ArrowRight size={13} aria-hidden="true" />
            ) : (
              <RotateCcw size={13} aria-hidden="true" />
            )}
          </button>
        )}
      </div>
    </div>
  );
};
