import { createLazyFileRoute, Link } from '@tanstack/react-router';
import { RegisterForm } from '../features/auth/components/RegisterForm';

const STATS = [
  { value: '50K+', label: 'Students learning' },
  { value: '87%',  label: 'Improve exam scores' },
  { value: '4.9★', label: 'Average rating' },
];

const FEATURES = [
  'Adaptive AI that learns your weak spots',
  'Mock exams aligned to your curriculum',
  'Personalised 7-day study plans',
];

export const Route = createLazyFileRoute('/register')({
  component: () => (
    <div className="split-layout">

      {/* ── Left Brand Panel ── */}
      <div className="split-left">
        <div className="split-left-content">

          {/* Logo mark */}
          <div className="flex items-center gap-3 mb-12">
            <div className="w-11 h-11 rounded-xl bg-black/20 border-transparent flex items-center justify-center shrink-0">
              <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                <path d="M6 12v5c3 3 9 3 12 0v-5" />
              </svg>
            </div>
            <span className="text-white font-['Outfit',_sans-serif] font-extrabold text-xl tracking-tight">
              EduAdapt
            </span>
          </div>

          {/* Headline */}
          <h1 className="font-['Outfit',_sans-serif] font-extrabold text-[clamp(2rem,_4vw,_2.75rem)] leading-[1.1] tracking-[-0.03em] text-white mb-5">
            Master your curriculum.<br />Skip the busywork.
          </h1>

          <p className="text-[1.05rem] leading-[1.65] text-white/75 mb-9 max-w-[380px]">
            EduAdapt pinpoints exactly what you need to review and builds a personalised path to exam success.
          </p>

          {/* Feature list */}
          <div className="flex flex-col gap-3 mb-12">
            {FEATURES.map(f => (
              <div key={f} className="flex items-center gap-2.5">
                <div className="w-5 h-5 rounded-full bg-[var(--color-accent)] flex items-center justify-center shrink-0">
                  <svg aria-hidden="true" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <span className="text-[0.9rem] text-white/85 font-medium">{f}</span>
              </div>
            ))}
          </div>

          {/* Social proof strip */}
          <div className="flex gap-8 flex-wrap p-5 px-6 rounded-[14px] bg-black/20 border-transparent">
            {STATS.map(s => (
              <div key={s.label}>
                <p className="font-['Outfit',_sans-serif] font-extrabold text-2xl text-white leading-none m-0 mb-1">{s.value}</p>
                <p className="text-xs text-white/60 m-0">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10">
          <p className="text-xs text-white/60 m-0">
            © 2026 EduAdapt Inc. All rights reserved.
          </p>
        </div>
      </div>

      {/* ── Right Form Panel ── */}
      <div className="split-right">
        <div className="auth-container">

          {/* Form header */}
          <div className="mb-8">
            <h2 className="font-['Outfit',_sans-serif] font-bold text-[1.75rem] text-[var(--color-text)] tracking-[-0.02em] m-0 mb-1.5">
              Welcome to EduAdapt
            </h2>
            <p className="text-[0.9rem] text-[var(--color-text-muted)] m-0">
              Start your learning journey today
            </p>
          </div>

          <RegisterForm />

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-[var(--color-border)]" />
            <span className="text-xs text-[var(--color-text-light)] font-medium whitespace-nowrap">or continue with</span>
            <div className="flex-1 h-px bg-[var(--color-border)]" />
          </div>

          {/* Google sign-in — coming soon, disabled until OAuth is wired */}
          <button
            className="w-full py-3 px-4 rounded-[var(--radius-md)] flex items-center justify-center gap-2.5 font-inherit text-sm font-semibold text-[var(--color-text-muted)] border border-[var(--color-border)] bg-[var(--color-surface-1)] transition-all duration-200"
            aria-disabled="true"
            onClick={() => alert('Google sign-in coming soon. Please use your email and password.')}
            style={{ cursor: 'not-allowed', opacity: 0.6 }}
          >
            {/* Google "G" logo SVG */}
            <svg aria-hidden="true" width="18" height="18" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            </svg>
            Continue with Google <span style={{ fontSize: '0.7rem', marginLeft: 4, opacity: 0.8 }}>(Coming soon)</span>
          </button>

          {/* Sign up link */}
          <p className="text-center text-[0.85rem] text-[var(--color-text-muted)] mt-7 mb-0">
            Already have an account?{' '}
            <Link to={"/login" as any} className="text-[var(--color-primary)] font-semibold no-underline hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  ),
});
