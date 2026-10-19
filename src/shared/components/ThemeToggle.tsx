import * as React from 'react';
import { useTheme } from '../hooks/useTheme';
import { Sun, Moon } from 'lucide-react';

export const ThemeToggle: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { resolvedTheme, toggleTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      className={`min-w-[40px] min-h-[40px] w-10 h-10 rounded-lg border border-border bg-surface text-text-secondary hover:text-text-primary hover:bg-surface-1 flex items-center justify-center transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${className}`}
    >
      {isDark ? (
        <Sun size={18} className="text-warning transition-transform duration-200 rotate-0" />
      ) : (
        <Moon size={18} className="text-text-secondary transition-transform duration-200" />
      )}
    </button>
  );
};
