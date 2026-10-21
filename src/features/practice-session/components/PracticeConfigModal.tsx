import * as React from 'react';
import { Dialog } from '../../../shared/components/Dialog';
import { Button } from '../../../shared/components/Button';
import { Badge } from '../../../shared/components/Badge';
import { QuestionCountPicker } from './QuestionCountPicker';
import type { QuestionTypeMix } from '../../../types/practice.types';
import { Sparkles, Layers, ArrowRight, BookOpen } from 'lucide-react';
import { useAuth } from '../../auth/hooks/useAuth';

export interface PracticeConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  courseTitle: string;
  courseCode?: string;
  onStart: (totalQuestions: number, questionType: QuestionTypeMix) => void;
  isStarting?: boolean;
}

const LEVEL_CAPS: Record<string, { totalCap: number; theoryCap: number }> = {
  '100L': { totalCap: 40, theoryCap: 10 },
  '200L': { totalCap: 50, theoryCap: 12 },
  '300L': { totalCap: 60, theoryCap: 15 },
  '400L': { totalCap: 70, theoryCap: 18 },
  '500L': { totalCap: 80, theoryCap: 20 },
};

const QUESTION_TYPE_OPTIONS: {
  value: QuestionTypeMix;
  label: string;
  sub: string;
  icon: React.ReactNode;
}[] = [
  {
    value: 'MIXED',
    label: 'Mixed Format',
    sub: 'Balanced blend of Multiple Choice and Theory questions.',
    icon: <Sparkles size={15} />,
  },
  {
    value: 'OBJECTIVE_ONLY',
    label: 'Multiple Choice Only',
    sub: 'Rapid-fire MCQ questions for quick recall and speed.',
    icon: <Layers size={15} />,
  },
  {
    value: 'THEORY_ONLY',
    label: 'Theory Only',
    sub: 'Written problems graded by AI with instant rubric feedback.',
    icon: <BookOpen size={15} />,
  },
];

export const PracticeConfigModal: React.FC<PracticeConfigModalProps> = ({
  isOpen,
  onClose,
  courseTitle,
  courseCode,
  onStart,
  isStarting = false,
}) => {
  const { user } = useAuth();
  const studentLevel = user?.level ?? '100L';
  const levelCaps = LEVEL_CAPS[studentLevel] ?? LEVEL_CAPS['100L'];

  const [questionCount, setQuestionCount] = React.useState<number>(10);
  const [questionType, setQuestionType] = React.useState<QuestionTypeMix>('MIXED');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onStart(questionCount, questionType);
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Customize Practice Session"
      description={`Set your preferred question count and format for ${courseCode ? courseCode + ' - ' : ''}${courseTitle}.`}
      size="md"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-6 pt-2">
        {/* Course Info Banner */}
        <div className="bg-surface-1 border border-border rounded-xl p-3.5 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            {courseCode && <Badge variant="primary" size="sm">{courseCode}</Badge>}
            <span className="font-semibold text-text-primary truncate max-w-[220px]">{courseTitle}</span>
          </div>
          <span className="text-text-muted">
            Level <strong className="text-text-primary">{studentLevel}</strong> (Max {levelCaps.totalCap} Qs)
          </span>
        </div>

        {/* 1. Question Count Selector */}
        <QuestionCountPicker
          value={questionCount}
          onChange={setQuestionCount}
          maxCap={levelCaps.totalCap}
          theoryCap={levelCaps.theoryCap}
          questionType={questionType}
        />

        {/* 2. Question Format Selector */}
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-text-muted m-0 mb-2 block">
            Question Format
          </label>
          <div role="group" aria-label="Question format" className="flex flex-col gap-2">
            {QUESTION_TYPE_OPTIONS.map((opt) => {
              const isSelected = questionType === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setQuestionType(opt.value)}
                  aria-pressed={isSelected}
                  className={`flex items-start gap-3 p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-primary-light border-primary shadow-xs'
                      : 'bg-surface-0 border-border hover:border-text-secondary'
                  }`}
                >
                  <div
                    className={`mt-0.5 p-1.5 rounded-lg shrink-0 ${
                      isSelected ? 'bg-primary text-white' : 'bg-surface-1 text-text-secondary'
                    }`}
                  >
                    {opt.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-xs sm:text-sm font-semibold m-0 ${
                        isSelected ? 'text-primary' : 'text-text-primary'
                      }`}
                    >
                      {opt.label}
                    </p>
                    <p className="text-xs text-text-secondary m-0 mt-0.5">{opt.sub}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
          <Button variant="ghost" size="sm" type="button" onClick={onClose} disabled={isStarting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="md"
            type="submit"
            isLoading={isStarting}
            disabled={isStarting}
          >
            Start Practice ({questionCount} Qs) <ArrowRight size={15} className="ml-1.5" />
          </Button>
        </div>
      </form>
    </Dialog>
  );
};
