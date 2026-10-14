import * as React from 'react';
import { useTheme } from '../../../shared/hooks/useTheme';
import { Sun, Moon } from 'lucide-react';

export interface LoginThemeToggleProps {
  className?: string;
}

export const LoginThemeToggle: React.FC<LoginThemeToggleProps> = ({ className = '' }) => {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const handleToggle = () => {
    setTheme(isDark ? 'light' : 'dark');
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      title={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      className={`w-11 h-11 rounded-full border flex items-center justify-center transition-colors cursor-pointer select-none
        border-[#D5DCE6] bg-white text-[#0B2239] hover:bg-[#F6F8FB]
        dark:border-[#2E4A66] dark:bg-[#0F2B45] dark:text-[#F8FAFC] dark:hover:bg-[#133454]
        focus:outline-none focus:ring-2 focus:ring-[#0E6BA8] focus:ring-offset-2 dark:focus:ring-offset-[#0B1726] ${className}`}
    >
      {isDark ? (
        <Sun size={18} className="text-[#F8FAFC]" aria-hidden="true" />
      ) : (
        <Moon size={18} className="text-[#0B2239]" aria-hidden="true" />
      )}
    </button>
  );
};
