import { GraduationCap, Loader2 } from 'lucide-react';

export function PageLoader() {
  return (
    <div
      role="status"
      aria-label="Loading page"
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white dark:bg-[#0B1726] text-[#0B2239] dark:text-[#F8FAFC] transition-colors"
    >
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-[#0E6BA8] flex items-center justify-center text-white shadow-md shadow-[#0E6BA8]/20 animate-pulse">
          <GraduationCap size={26} aria-hidden="true" />
        </div>
        <div className="flex items-center gap-2 text-sm font-medium text-[#52607A] dark:text-[#94A3B8]">
          <Loader2 size={18} className="animate-spin text-[#0E6BA8]" aria-hidden="true" />
          <span>Loading...</span>
        </div>
      </div>
    </div>
  );
}
