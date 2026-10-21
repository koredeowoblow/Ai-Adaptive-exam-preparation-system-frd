import * as React from 'react';
import { SlidersHorizontal, Clock, Sparkles } from 'lucide-react';

export interface QuestionCountPickerProps {
  value: number;
  onChange: (count: number) => void;
  maxCap?: number;
  theoryCap?: number;
  questionType?: 'MIXED' | 'OBJECTIVE_ONLY' | 'THEORY_ONLY';
  className?: string;
  showTimeEstimate?: boolean;
}

const DEFAULT_PRESETS = [5, 10, 15, 20, 30, 40];

export const QuestionCountPicker: React.FC<QuestionCountPickerProps> = ({
  value,
  onChange,
  maxCap = 60,
  theoryCap,
  questionType = 'MIXED',
  className = '',
  showTimeEstimate = true,
}) => {
  const [isCustom, setIsCustom] = React.useState<boolean>(() => {
    return !DEFAULT_PRESETS.includes(value);
  });
  const [customInput, setCustomInput] = React.useState<string>(value.toString());

  // Keep customInput synced if value changes externally
  React.useEffect(() => {
    if (!DEFAULT_PRESETS.includes(value)) {
      setIsCustom(true);
      setCustomInput(value.toString());
    }
  }, [value]);

  const presets = React.useMemo(() => {
    return DEFAULT_PRESETS.filter((p) => p <= maxCap);
  }, [maxCap]);

  const handleSelectPreset = (preset: number) => {
    setIsCustom(false);
    onChange(preset);
  };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setCustomInput(raw);
    const parsed = parseInt(raw, 10);
    if (!isNaN(parsed) && parsed >= 1) {
      const clamped = Math.min(parsed, maxCap);
      onChange(clamped);
    }
  };

  const handleCustomBlur = () => {
    const parsed = parseInt(customInput, 10);
    if (isNaN(parsed) || parsed < 1) {
      setCustomInput('10');
      onChange(10);
    } else {
      const clamped = Math.min(Math.max(1, parsed), maxCap);
      setCustomInput(clamped.toString());
      onChange(clamped);
    }
  };

  // Estimate duration (~1.5 min per MCQ, ~3 min per Theory, ~2 min per Mixed)
  const estimatedMinutes = React.useMemo(() => {
    const perQuestion = questionType === 'THEORY_ONLY' ? 3 : questionType === 'OBJECTIVE_ONLY' ? 1.5 : 2;
    return Math.max(2, Math.round(value * perQuestion));
  }, [value, questionType]);

  return (
    <div className={`flex flex-col gap-2.5 ${className}`}>
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <label className="text-xs font-semibold uppercase tracking-wider text-text-muted m-0 flex items-center gap-1.5">
          <SlidersHorizontal size={13} className="text-primary" />
          <span>Number of Questions</span>
        </label>
        {showTimeEstimate && (
          <span className="text-xs text-text-secondary flex items-center gap-1">
            <Clock size={12} className="text-text-muted" />
            <span>Est. duration:</span>
            <strong className="text-text-primary tabular-nums font-semibold">~{estimatedMinutes} mins</strong>
          </span>
        )}
      </div>

      <div
        role="group"
        aria-label="Select number of questions"
        className="flex items-center gap-2 flex-wrap"
      >
        {presets.map((count) => {
          const isSelected = !isCustom && value === count;
          return (
            <button
              key={count}
              type="button"
              onClick={() => handleSelectPreset(count)}
              aria-pressed={isSelected}
              className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium border transition-all cursor-pointer ${
                isSelected
                  ? 'bg-primary-light text-primary border-primary shadow-xs font-semibold scale-[1.02]'
                  : 'bg-surface-0 text-text-secondary border-border hover:border-text-secondary hover:text-text-primary'
              }`}
            >
              <span>{count} Qs</span>
              {count === 5 && <span className="ml-1 text-[11px] opacity-75 font-normal">(Micro)</span>}
              {count === 10 && <span className="ml-1 text-[11px] opacity-75 font-normal">(Quick)</span>}
              {count === 40 && <span className="ml-1 text-[11px] opacity-75 font-normal">(Mock)</span>}
            </button>
          );
        })}

        {/* Custom Button */}
        <button
          type="button"
          onClick={() => {
            setIsCustom(true);
            const parsed = parseInt(customInput, 10);
            if (!isNaN(parsed) && parsed >= 1) {
              onChange(Math.min(parsed, maxCap));
            }
          }}
          aria-pressed={isCustom}
          className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium border transition-all cursor-pointer ${
            isCustom
              ? 'bg-primary-light text-primary border-primary shadow-xs font-semibold scale-[1.02]'
              : 'bg-surface-0 text-text-secondary border-border hover:border-text-secondary hover:text-text-primary'
          }`}
        >
          Custom
        </button>

        {isCustom && (
          <div className="flex items-center gap-1.5 animate-in fade-in duration-150">
            <input
              type="number"
              min={1}
              max={maxCap}
              value={customInput}
              onChange={handleCustomChange}
              onBlur={handleCustomBlur}
              aria-label="Custom number of questions"
              className="w-16 px-2.5 py-1.5 rounded-lg border border-primary bg-surface text-text-primary text-xs sm:text-sm text-center font-bold focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <span className="text-xs text-text-muted">Qs (max {maxCap})</span>
          </div>
        )}
      </div>

      {questionType === 'THEORY_ONLY' && theoryCap && value > theoryCap && (
        <p className="text-[11px] text-warning m-0 flex items-center gap-1">
          <Sparkles size={12} />
          <span>Theory questions are capped at {theoryCap} per session for your level.</span>
        </p>
      )}
    </div>
  );
};
