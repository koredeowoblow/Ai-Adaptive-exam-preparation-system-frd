import * as React from 'react';
import { User, Menu } from 'lucide-react';
import { ThemeToggle } from '../ThemeToggle';
import { useNavigate } from '@tanstack/react-router';

interface TopbarProps {
  userName: string;
  onMenuClick?: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({ userName, onMenuClick }) => {
  const navigate = useNavigate();

  return (
    <header className="app-topbar">
      <div className="flex-align-center gap-md">
        {/* Mobile menu button */}
        <button
          aria-label="Toggle menu"
          className="icon-btn admin-hamburger-btn items-center justify-center"
          onClick={onMenuClick}
        >
          <Menu size={20} />
        </button>

        <div className="flex flex-col gap-[1px]">
          <h2 className="font-outfit font-bold text-base m-0 text-text tracking-[-0.01em]">
            Welcome back, <span className="text-primary">{userName}</span>
          </h2>
        </div>
      </div>

      <div className="flex-align-center gap-lg">


        <ThemeToggle />

        {/* User Avatar — navigates to profile */}
        <button
          aria-label="Account settings"
          className="w-[44px] h-[44px] rounded-full bg-primary flex items-center justify-center cursor-pointer shrink-0"
          onClick={() => navigate({ to: '/profile' })}
          style={{ border: 'none', padding: 0 }}
        >
          <User size={16} color="#fff" />
        </button>
      </div>
    </header>
  );
};
