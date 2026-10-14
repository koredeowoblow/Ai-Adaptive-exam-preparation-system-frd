import * as React from 'react';
import {
  SYMBOL_CATEGORIES,
  MATH_SYMBOLS,
  type SymbolCategoryId,
  type MathSymbolItem,
} from '../constants/mathSymbols';
import { Sparkles, BookOpen, Eye, EyeOff } from 'lucide-react';

export interface MathToolbarProps {
  onInsertSymbol: (symbol: MathSymbolItem) => void;
  onInsertTemplate?: () => void;
  showPreview?: boolean;
  onTogglePreview?: () => void;
  disabled?: boolean;
  className?: string;
}

export const MathToolbar: React.FC<MathToolbarProps> = ({
  onInsertSymbol,
  onInsertTemplate,
  showPreview,
  onTogglePreview,
  disabled = false,
  className = '',
}) => {
  const [activeTab, setActiveTab] = React.useState<SymbolCategoryId>('basic');

  const filteredSymbols = React.useMemo(() => {
    return MATH_SYMBOLS.filter((s) => s.category === activeTab);
  }, [activeTab]);

  return (
    <div
      className={`flex flex-col gap-2 p-2.5 sm:p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-0)] shadow-sm max-w-full overflow-hidden ${className}`}
      role="region"
      aria-label="Mathematical and Scientific Formula Helper"
    >
      {/* Header bar: Title + Action buttons */}
      <div className="flex items-center justify-between gap-2 border-b border-[var(--color-border)] pb-2 flex-wrap">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
          <Sparkles size={14} aria-hidden="true" />
          <span>Formula & Symbol Helper</span>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {onInsertTemplate && (
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onPointerDown={(e) => e.preventDefault()}
              onClick={onInsertTemplate}
              disabled={disabled}
              className="px-2 py-1 rounded-md text-[11px] font-semibold bg-[var(--color-surface-2)] hover:bg-[var(--color-surface-1)] text-[var(--color-text)] border border-[var(--color-border)] transition-colors cursor-pointer flex items-center gap-1 disabled:opacity-50"
              title="Insert structured steps: Given, Formula, Working Steps, Final Answer"
            >
              <BookOpen size={12} aria-hidden="true" />
              <span className="hidden sm:inline">+ Calculation Template</span>
              <span className="sm:hidden">+ Template</span>
            </button>
          )}

          {onTogglePreview && (
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onPointerDown={(e) => e.preventDefault()}
              onClick={onTogglePreview}
              className="px-2 py-1 rounded-md text-[11px] font-semibold text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors cursor-pointer flex items-center gap-1 border border-transparent hover:border-[var(--color-border)]"
            >
              {showPreview ? <EyeOff size={12} aria-hidden="true" /> : <Eye size={12} aria-hidden="true" />}
              <span className="hidden sm:inline">{showPreview ? 'Hide Preview' : 'Live Preview'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Category Tabs: Scrollable on mobile widths */}
      <div
        className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-thin"
        role="tablist"
        aria-label="Symbol categories"
      >
        {SYMBOL_CATEGORIES.map((cat) => {
          const isActive = cat.id === activeTab;
          return (
            <button
              key={cat.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onMouseDown={(e) => e.preventDefault()}
              onPointerDown={(e) => e.preventDefault()}
              onClick={() => setActiveTab(cat.id)}
              disabled={disabled}
              className={`px-2 py-0.5 rounded text-[11px] font-medium whitespace-nowrap transition-colors cursor-pointer select-none ${
                isActive
                  ? 'bg-primary text-white font-semibold shadow-xs'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-2)]'
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Symbol buttons palette: Wrap cleanly without horizontal overflow */}
      <div
        className="flex items-center flex-wrap gap-1.5 max-h-32 overflow-y-auto pt-0.5"
        role="toolbar"
        aria-label={`${activeTab} symbols`}
      >
        {filteredSymbols.map((sym) => (
          <button
            key={sym.label}
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onPointerDown={(e) => e.preventDefault()}
            onClick={() => onInsertSymbol(sym)}
            disabled={disabled}
            title={`${sym.desc} (${sym.insert})`}
            className="h-7 min-w-[28px] px-2 text-xs font-serif font-medium rounded border border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-primary/10 hover:border-primary text-[var(--color-text)] transition-colors cursor-pointer disabled:opacity-50 select-none flex items-center justify-center shadow-2xs"
          >
            {sym.label}
          </button>
        ))}
      </div>
    </div>
  );
};
