import { GraduationCap, Loader2 } from 'lucide-react';

export function PageLoader() {
  return (
    <div
      role="status"
      aria-label="Loading page"
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background text-text transition-colors"
    >
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center text-white shadow-md shadow-primary/20 animate-pulse">
          <GraduationCap size={26} aria-hidden="true" />
        </div>
        <div className="flex items-center gap-2 text-sm font-medium text-text-muted">
          <Loader2 size={18} className="animate-spin text-primary" aria-hidden="true" />
          <span>Loading...</span>
        </div>
      </div>
    </div>
  );
}
