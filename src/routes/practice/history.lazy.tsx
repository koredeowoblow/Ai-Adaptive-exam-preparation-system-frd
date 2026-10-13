import { createLazyFileRoute, Link } from "@tanstack/react-router";
import { useSessions } from "../../features/practice-session/hooks/usePractice";
import { useDocumentTitle } from "../../shared/hooks/useDocumentTitle";
import { AppLayout } from "../../shared/components/layout/AppLayout";
import { Skeleton } from "../../shared/components/Skeleton";
import { ErrorState } from "../../shared/components/ErrorState";
import { Trophy, Clock, Target, Calendar, ChevronRight, Activity, ShieldAlert, Sparkles, TrendingUp } from "lucide-react";
import type { PracticeSession } from "../../types/practice.types";
import { clsx } from "clsx";

export const Route = createLazyFileRoute("/practice/history")({
  component: HistoryRoute,
});

function formatDate(dateStr: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(dateStr));
}

function HistoryRoute() {
  useDocumentTitle("Session History — EduAdapt");
  const { data: responseData, isLoading, error } = useSessions({ limit: 50 });

  const sessions = responseData?.sessions || [];
  const completedSessions = sessions.filter((s: PracticeSession) => s.status === 'completed');
  
  const totalSessions = sessions.length;
  const avgScore = completedSessions.length > 0 
    ? Math.round(completedSessions.reduce((acc: number, s: PracticeSession) => acc + s.score, 0) / completedSessions.length) 
    : 0;
  const totalAnswered = sessions.reduce((acc: number, s: PracticeSession) => acc + (s.questionsAnswered || 0), 0);

  return (
    <AppLayout>
      <div className="w-full py-4 px-4 md:px-6">
        
        {/* Header */}
        <header className="mb-5">
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <Activity size={18} strokeWidth={2.5} />
            </div>
            <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">Session History</h1>
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-sm ml-10">Review your past practice sessions, mock exams, and analytics.</p>
        </header>

        {isLoading ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => <Skeleton key={`stat-${i}`} style={{ height: 120, borderRadius: '1rem' }} />)}
            </div>
            <Skeleton style={{ height: 400, borderRadius: '1rem' }} />
          </div>
        ) : error ? (
          <ErrorState message="Failed to load session history." />
        ) : sessions.length === 0 ? (
          <div className="py-20 text-center border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-2xl bg-gray-50 dark:bg-gray-900/20">
            <Trophy className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-700 mb-4" />
            <p className="text-lg font-medium text-gray-500 dark:text-gray-400">You haven't completed any sessions yet.</p>
            <Link to="/exam-prep" className="mt-4 inline-flex items-center gap-2 px-6 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary-dark transition-colors shadow-sm">
              Start Practice <ChevronRight size={18} />
            </Link>
          </div>
        ) : (
          <div className="space-y-5">
            
              {/* Quick Stats Bento Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Stat 1: Avg Score */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-gray-100 dark:border-gray-700 flex items-center gap-4 relative overflow-hidden">
                <div className="w-9 h-9 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-500 shrink-0">
                  <Target size={18} />
                </div>
                <div className="relative z-10">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-0.5">Average Score</p>
                  <h3 className="text-2xl font-black text-gray-900 dark:text-white leading-none">{avgScore}%</h3>
                  <div className="mt-1 inline-flex items-center gap-1 text-green-600 text-xs font-bold">
                    <TrendingUp size={12} />
                    <span>On Track</span>
                  </div>
                </div>
              </div>

              {/* Stat 2: Total Sessions */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-gray-100 dark:border-gray-700 flex items-center gap-4">
                <div className="w-9 h-9 rounded-full bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center text-purple-500 shrink-0">
                  <Clock size={18} />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-0.5">Total Sessions</p>
                  <h3 className="text-2xl font-black text-gray-900 dark:text-white leading-none">{totalSessions}</h3>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 font-medium">Completed & Active</p>
                </div>
              </div>

              {/* Stat 3: Questions Answered */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-gray-100 dark:border-gray-700 flex items-center gap-4">
                <div className="w-9 h-9 rounded-full bg-orange-50 dark:bg-orange-900/30 flex items-center justify-center text-orange-500 shrink-0">
                  <Sparkles size={18} />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-0.5">Total Questions</p>
                  <h3 className="text-2xl font-black text-gray-900 dark:text-white leading-none">{totalAnswered}</h3>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 font-medium">Successfully processed</p>
                </div>
              </div>
            </div>

            {/* Activity Feed */}
            <section className="bg-white dark:bg-gray-800 rounded-xl p-4 md:p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-gray-100 dark:border-gray-700">
              <h3 className="text-base font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Calendar className="text-primary" size={18} />
                Recent Activity
              </h3>
              
              <div className="space-y-2">
                {sessions.map((session: PracticeSession) => {
                  const isFull = session.totalQuestions >= 40;
                  const isCompleted = session.status === 'completed';
                  const isFailed = session.status === 'FAILED';
                  
                  return (
                    <Link 
                      key={session._id} 
                      to="/practice/$sessionId/review" 
                      params={{ sessionId: session._id }}
                      className="block group"
                    >
                      <div className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/20 hover:bg-white dark:hover:bg-gray-800 hover:shadow-sm hover:border-primary/30 transition-all duration-200">
                        
                        {/* Icon */}
                        <div className={clsx(
                          "w-8 h-8 shrink-0 rounded-full flex items-center justify-center",
                          isFailed ? "bg-red-100 text-red-500 dark:bg-red-900/30" :
                          isFull ? "bg-amber-100 text-amber-500 dark:bg-amber-900/30" :
                          "bg-blue-100 text-blue-500 dark:bg-blue-900/30"
                        )}>
                          {isFull ? <Trophy size={16} /> : <Target size={16} />}
                        </div>

                        {/* Name & Date */}
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-semibold text-gray-900 dark:text-white">
                            {isFull ? 'Mock Exam' : 'Quick Practice'}
                          </span>
                          <span className="text-xs text-gray-400 dark:text-gray-500 ml-2">{formatDate(session.startedAt)}</span>
                        </div>

                        {/* Middle badges */}
                        <div className="hidden sm:flex items-center gap-3 text-xs font-medium text-gray-500 dark:text-gray-400">
                          <span>{session.questionsAnswered}/{session.totalQuestions} Qs</span>
                          {session.trustScore !== undefined && session.trustScore < 80 && (
                            <span className="text-red-500 flex items-center gap-1"><ShieldAlert size={12} /> Low Integrity</span>
                          )}
                          {!isCompleted && !isFailed && <span className="text-blue-500">In Progress</span>}
                          {isFailed && <span className="text-red-500">Cancelled</span>}
                        </div>

                        {/* Score */}
                        <div className="text-right shrink-0">
                          <p className={clsx(
                            "text-base font-black leading-none",
                            isCompleted ? "text-gray-900 dark:text-white" : "text-gray-300 dark:text-gray-600"
                          )}>
                            {isCompleted ? `${Math.round(session.score)}%` : '--'}
                          </p>
                        </div>

                        {/* Arrow */}
                        <div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-400 group-hover:bg-primary group-hover:text-white transition-colors shrink-0">
                          <ChevronRight size={14} />
                        </div>

                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
