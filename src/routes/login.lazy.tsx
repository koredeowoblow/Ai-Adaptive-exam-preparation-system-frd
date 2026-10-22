import { createLazyFileRoute, Link } from '@tanstack/react-router';
import { EduAdaptLogo } from '../features/auth/components/EduAdaptLogo';
import { LoginForm } from '../features/auth/components/LoginForm';
import { LoginSampleQuestionCard } from '../features/auth/components/LoginSampleQuestionCard';
import { LoginThemeToggle } from '../features/auth/components/LoginThemeToggle';

export const Route = createLazyFileRoute('/login')({
  component: LoginRouteComponent,
});

function LoginRouteComponent() {
  return (
    <div
      data-app="auth"
      className="min-h-screen w-full flex flex-col lg:flex-row lg:h-screen lg:overflow-hidden font-body bg-background text-text"
    >
      <h1 className="sr-only">Sign In to EduAdapt - AI Adaptive Exam Preparation</h1>

      {/* ── Left Column (Desktop 1024px+ / ~50%): Dark Brand Panel ── */}
      <aside
        aria-label="Brand showcase and sample exam question"
        className="hidden lg:flex lg:w-1/2 bg-[#0B2239] text-white p-10 xl:p-[40px_64px] flex-col justify-between h-full overflow-y-auto select-none"
      >
        {/* Top: Logo Mark (40px rounded square, #0E6BA8, graduation cap icon in white) next to "EduAdapt" wordmark */}
        <div className="flex items-center">
          <Link
            to="/"
            className="inline-flex items-center gap-3 group focus:outline-none focus:ring-2 focus:ring-primary rounded-xl p-1 -ml-1"
            aria-label="EduAdapt Home"
          >
            <EduAdaptLogo size={40} />
            <span className="font-heading font-bold text-2xl tracking-tight text-white">
              EduAdapt
            </span>
          </Link>
        </div>

        {/* Middle: Headline + Sub line + Sample Question Card */}
        <div className="my-auto py-8 max-w-[540px]">
          <h2 className="font-heading text-[52px] font-bold leading-[1.05] tracking-[-0.02em] text-white">
            Practice the way your exam will ask.
          </h2>
          <p className="font-body text-[18px] text-[#B8C6D9] mt-4 leading-relaxed">
            Course practice and past questions for 100 to 500 level, adapted to what you keep getting wrong.
          </p>

          <div className="mt-8">
            <LoginSampleQuestionCard />
          </div>
        </div>

        {/* Bottom: Small note */}
        <div className="text-[13px] text-[#8FA3BB]">
          Sample question, not graded.
        </div>
      </aside>

      {/* ── Right Column: Form Panel (White in light mode, Dark surface in dark mode) ── */}
      <main
        id="main-content"
        className="w-full lg:w-1/2 min-h-screen lg:min-h-0 lg:h-full p-6 sm:p-10 lg:p-[40px_64px] flex flex-col justify-between overflow-y-auto bg-surface"
      >
        {/* Top bar: Mobile logo + Theme Toggle (on desktop only ThemeToggle on top right) */}
        <div className="flex items-center justify-between w-full mb-6 lg:mb-0">
          <div className="lg:hidden flex items-center">
            <Link
              to="/"
              className="inline-flex items-center gap-2.5 focus:outline-none focus:ring-2 focus:ring-primary rounded-xl p-1 -ml-1 text-text"
              aria-label="EduAdapt Home"
            >
              <EduAdaptLogo size={36} />
              <span className="font-heading font-bold text-xl tracking-tight">
                EduAdapt
              </span>
            </Link>
          </div>

          <div className="ml-auto">
            <LoginThemeToggle />
          </div>
        </div>

        {/* Form Container (Vertically centered, max-width 400px) */}
        <div className="w-full max-w-[400px] mx-auto my-auto py-6">
          <LoginForm />
        </div>

        {/* Footer */}
        <footer className="w-full text-center text-[13px] text-text-muted pt-6 pb-2">
          © 2026 EduAdapt
        </footer>
      </main>
    </div>
  );
}
