import * as React from 'react';
import { Link } from '@tanstack/react-router';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { EduAdaptLogo } from './EduAdaptLogo';
import { ThemeToggle } from '../../../shared/components/ThemeToggle';

export interface AuthLayoutProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footerLink: React.ReactNode;
  sideContent?: React.ReactNode;
  mobileCollapsibleTitle?: string;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({
  title,
  subtitle,
  children,
  footerLink,
  sideContent,
  mobileCollapsibleTitle = 'Try a sample question',
}) => {
  const [mobileExpanded, setMobileExpanded] = React.useState(false);

  return (
    <div
      data-app="auth"
      className="min-h-screen bg-[var(--auth-bg)] text-[var(--auth-text)] flex flex-col justify-between selection:bg-[var(--auth-accent)] selection:text-white"
    >
      {/* Top Header */}
      <header className="w-full border-b border-[var(--auth-card-border)] bg-[var(--auth-card-bg)] sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-2.5 focus:outline-none focus:ring-2 focus:ring-[var(--auth-accent)] rounded-lg p-1 -ml-1 text-[var(--auth-text)]"
            aria-label="EduAdapt Home"
          >
            <EduAdaptLogo size={32} />
            <span className="font-bold text-lg tracking-[-0.01em]">EduAdapt</span>
          </Link>

          <div className="flex items-center gap-4">
            <span className="hidden sm:inline-block text-xs font-medium text-[var(--auth-text-muted)] border border-[var(--auth-border)] rounded-full px-3 py-1">
              Built for 100 to 500 level courses
            </span>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main id="main-content" className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-8 lg:py-14">
        <h1 className="sr-only">EduAdapt - Adaptive Exam Preparation for University Students</h1>
        <div className="flex flex-col lg:grid lg:grid-cols-12 lg:gap-10 xl:gap-14 items-start">
          
          {/* Form Column - DOM Order #1 (Accessible keyboard & screen readers hit form first) */}
          <div className="w-full lg:col-span-5 lg:order-2 max-w-[420px] mx-auto lg:mx-0">
            <div className="bg-[var(--auth-card-bg)] border border-[var(--auth-card-border)] rounded-2xl p-6 sm:p-8 shadow-sm">
              <div className="mb-6">
                <h2 className="text-2xl font-bold tracking-[-0.01em] text-[var(--auth-text)] mb-1.5">
                  {title}
                </h2>
                <p className="text-sm text-[var(--auth-text-muted)] leading-relaxed">
                  {subtitle}
                </p>
              </div>

              {children}

              {/* Footer link */}
              <div className="mt-6 pt-5 border-t border-[var(--auth-card-border)] text-center text-xs text-[var(--auth-text-muted)]">
                {footerLink}
              </div>
            </div>

            {/* Mobile Collapsible Side Content (< 1024px) */}
            {sideContent && (
              <div className="lg:hidden mt-6 w-full">
                <button
                  type="button"
                  onClick={() => setMobileExpanded((prev) => !prev)}
                  aria-expanded={mobileExpanded}
                  aria-controls="mobile-sample-content"
                  className="w-full min-h-[44px] px-4 py-2.5 rounded-xl border border-[var(--auth-card-border)] bg-[var(--auth-card-bg)] text-xs font-semibold text-[var(--auth-text-muted)] hover:text-[var(--auth-text)] flex items-center justify-between transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--auth-accent)]"
                >
                  <span>{mobileCollapsibleTitle}</span>
                  {mobileExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>

                {mobileExpanded && (
                  <div id="mobile-sample-content" className="mt-4">
                    {sideContent}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Side Column - Desktop Order #1 (Visual Centerpiece on Desktop >= 1024px) */}
          {sideContent && (
            <div className="w-full lg:col-span-7 lg:order-1 hidden lg:block">
              {sideContent}
            </div>
          )}

        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-6 text-center text-xs text-[var(--auth-text-muted)] border-t border-[var(--auth-card-border)]/50">
        <p className="m-0">© 2026 EduAdapt</p>
      </footer>
    </div>
  );
};
