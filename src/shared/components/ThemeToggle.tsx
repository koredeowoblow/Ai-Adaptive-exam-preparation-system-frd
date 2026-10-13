import * as React from 'react';
import { useTheme } from '../hooks/useTheme';
import { Sun, Moon, Monitor } from 'lucide-react';

export const ThemeToggle: React.FC = () => {
  const { theme, setTheme } = useTheme();

  const options = [
    { value: 'light', icon: <Sun size={16} />, label: 'Light' },
    { value: 'dark', icon: <Moon size={16} />, label: 'Dark' },
    { value: 'system', icon: <Monitor size={16} />, label: 'System' },
  ] as const;

  const activeOption = options.find((opt) => opt.value === theme) || options[2];

  return (
    <div 
      className="group relative flex items-center bg-[var(--color-surface-raised)] rounded-[22px] border border-[var(--color-border)] shadow-sm overflow-hidden transition-[max-width] duration-300 ease-in-out max-w-[44px] hover:max-w-[140px] focus-within:max-w-[140px] h-[44px]"
    >
      {/* Collapsed state (shows only active option) */}
      <div 
        className="absolute inset-0 flex items-center justify-center opacity-100 group-hover:opacity-0 group-focus-within:opacity-0 transition-opacity duration-200 ease-in text-[var(--color-primary)] pointer-events-none"
      >
        {activeOption.icon}
      </div>

      {/* Expanded state */}
      <div className="flex items-center w-[148px] px-1 justify-between opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-200 ease-in">
        {options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setTheme(opt.value)}
            aria-pressed={theme === opt.value}
            title={opt.label}
            aria-label={`${opt.label} theme`}
            className={`w-[44px] h-[44px] rounded-full flex items-center justify-center cursor-pointer transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] ${
              theme === opt.value 
                ? 'bg-[var(--color-primary)] text-white' 
                : 'bg-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
            }`}
          >
            {opt.icon}
          </button>
        ))}
      </div>
    </div>
  );
};
