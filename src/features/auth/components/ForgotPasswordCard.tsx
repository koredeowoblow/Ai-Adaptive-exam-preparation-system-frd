import { Link } from '@tanstack/react-router';
import { Mail, ArrowLeft, AlertCircle } from 'lucide-react';
import { AuthButton } from './AuthButton';

export function ForgotPasswordCard() {
  return (
    <div className="space-y-6">
      <div className="p-4 rounded-xl border border-[var(--auth-card-border)] bg-[var(--auth-surface)] space-y-3">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-[var(--auth-accent)] shrink-0 mt-0.5" aria-hidden="true" />
          <div className="space-y-1 text-sm">
            <p className="font-semibold text-[var(--auth-ink)]">
              Direct self-service reset is pending backend support
            </p>
            <p className="text-[var(--auth-muted)] text-xs leading-relaxed">
              Our automated email delivery system is being updated. If you are locked out of your account, university platform coordinators can verify your student matriculation number and reset your credentials manually.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--auth-muted)]">
          Official Support Contact
        </label>
        <a
          href="mailto:support@eduadapt.com?subject=EduAdapt%20Password%20Reset%20Request"
          className="w-full"
        >
          <AuthButton type="button">
            <Mail className="w-4 h-4 mr-2" aria-hidden="true" />
            Email support@eduadapt.com
          </AuthButton>
        </a>
      </div>

      <div className="pt-2 text-center">
        <Link
          to={'/login' as any}
          className="inline-flex items-center gap-1.5 text-xs text-[var(--auth-link)] hover:text-[var(--auth-link-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--auth-focus-ring)] rounded py-1 px-2 font-medium"
        >
          <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
          Return to sign in
        </Link>
      </div>
    </div>
  );
}
