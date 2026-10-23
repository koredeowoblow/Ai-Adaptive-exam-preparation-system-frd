import * as React from 'react';
import {
  Activity,
  AlertTriangle,
  ShieldAlert,
  ShieldCheck,
  Send,
  Ban,
  Clock,
  RotateCcw,
  Loader2,
  Users,
  Eye,
} from 'lucide-react';
import { Button } from '../../../shared/components/Button';
import { apiClient } from '../../../shared/api-client/client';
import { toast } from 'sonner';
import { FocusTrap } from 'focus-trap-react';

export interface LiveSessionItem {
  sessionId: string;
  student: {
    _id: string;
    fullName: string;
    email: string;
    matricNumber?: string;
  };
  course: {
    _id: string;
    title: string;
    code: string;
  };
  startedAt: string;
  elapsedSeconds: number;
  questionsAnswered: number;
  totalQuestions: number;
  trustScore: number;
  violationCount: number;
  highSeverityCount: number;
  riskLevel: 'NORMAL' | 'CAUTION' | 'CRITICAL';
  proctorWarning?: string;
  proctorWarningAt?: string;
}

export const LiveProctoringMonitor: React.FC<{ onInspectSession?: (sessionId: string) => void }> = ({
  onInspectSession,
}) => {
  const [sessions, setSessions] = React.useState<LiveSessionItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  // Warning modal state
  const [warningTarget, setWarningTarget] = React.useState<LiveSessionItem | null>(null);
  const [warningMessage, setWarningMessage] = React.useState('');
  const [isSendingWarning, setIsSendingWarning] = React.useState(false);

  // Terminate modal state
  const [terminateTarget, setTerminateTarget] = React.useState<LiveSessionItem | null>(null);
  const [terminateReason, setTerminateReason] = React.useState('');
  const [isTerminating, setIsTerminating] = React.useState(false);

  const fetchLiveSessions = React.useCallback(async (quiet = false) => {
    if (!quiet) setIsRefreshing(true);
    try {
      const res: any = await apiClient.get('/integrity/live-sessions');
      const data = res.data?.data || res.data || [];
      setSessions(data);
    } catch (err: any) {
      console.error('Failed to load live sessions:', err);
      if (!quiet) toast.error('Could not fetch active exam sessions.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Initial load and periodic poll every 5 seconds
  React.useEffect(() => {
    let active = true;
    const poll = async () => {
      try {
        const res: any = await apiClient.get('/integrity/live-sessions');
        if (active) {
          const data = res.data?.data || res.data || [];
          setSessions(data);
        }
      } catch (err: any) {
        console.error('Failed to load live sessions:', err);
      } finally {
        if (active) {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      }
    };
    poll();
    const interval = setInterval(poll, 5000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  // Close modals on Escape key
  React.useEffect(() => {
    if (!warningTarget && !terminateTarget) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (warningTarget && !isSendingWarning) setWarningTarget(null);
        if (terminateTarget && !isTerminating) setTerminateTarget(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [warningTarget, terminateTarget, isSendingWarning, isTerminating]);

  const handleSendWarning = async () => {
    if (!warningTarget || !warningMessage.trim()) return;
    setIsSendingWarning(true);
    try {
      await apiClient.post(`/integrity/session/${warningTarget.sessionId}/warn`, {
        message: warningMessage.trim(),
      });
      toast.success(`Warning dispatched to ${warningTarget.student?.fullName || 'student'}'s screen!`);
      setWarningTarget(null);
      setWarningMessage('');
      fetchLiveSessions(true);
    } catch (err: any) {
      console.error('Failed to send warning:', err);
      toast.error(err.response?.data?.message || 'Failed to send warning message.');
    } finally {
      setIsSendingWarning(false);
    }
  };

  const handleTerminate = async () => {
    if (!terminateTarget) return;
    setIsTerminating(true);
    try {
      await apiClient.post(`/integrity/session/${terminateTarget.sessionId}/terminate`, {
        reason: terminateReason.trim() || 'Terminated by proctor for integrity non-compliance',
      });
      toast.success(`Exam session for ${terminateTarget.student?.fullName || 'student'} terminated.`);
      setTerminateTarget(null);
      setTerminateReason('');
      fetchLiveSessions(true);
    } catch (err: any) {
      console.error('Failed to terminate session:', err);
      toast.error(err.response?.data?.message || 'Failed to terminate session.');
    } finally {
      setIsTerminating(false);
    }
  };

  const formatElapsed = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins}m ${secs < 10 ? '0' : ''}${secs}s`;
  };

  // Metrics
  const criticalCount = sessions.filter((s) => s.riskLevel === 'CRITICAL').length;
  const cautionCount = sessions.filter((s) => s.riskLevel === 'CAUTION').length;
  const normalCount = sessions.filter((s) => s.riskLevel === 'NORMAL').length;

  return (
    <div className="space-y-6">
      {/* Real-time Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-border bg-card shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Active Examinees
            </span>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 -ml-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-foreground">{sessions.length}</div>
          <p className="text-xs text-muted-foreground mt-0.5">Live students taking tests now</p>
        </div>

        <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
              Critical Risk
            </span>
            <ShieldAlert className="w-4 h-4 text-rose-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-rose-600 dark:text-rose-400">{criticalCount}</div>
          <p className="text-xs text-rose-500/80 mt-0.5">Multiple tab switches / low trust</p>
        </div>

        <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
              Caution Flags
            </span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-amber-600 dark:text-amber-400">{cautionCount}</div>
          <p className="text-xs text-amber-500/80 mt-0.5">Occasional anomalies detected</p>
        </div>

        <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              Clean Integrity
            </span>
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-600 dark:text-emerald-400">{normalCount}</div>
          <p className="text-xs text-emerald-500/80 mt-0.5">No suspicious deviations</p>
        </div>
      </div>

      {/* Control bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary animate-pulse" />
          <span className="text-xs font-semibold text-foreground">Live Invigilation Feed</span>
          <span className="text-[11px] text-muted-foreground">(Auto-updates every 5s)</span>
        </div>
        <Button variant="outline" size="sm" onClick={() => fetchLiveSessions()} disabled={isRefreshing}>
          <RotateCcw className={`w-3.5 h-3.5 mr-1.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh Feed
        </Button>
      </div>

      {/* Examinees Grid */}
      {isLoading ? (
        <div className="p-12 text-center text-muted-foreground space-y-3">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
          <p className="text-sm">Connecting to live invigilation surveillance telemetry...</p>
        </div>
      ) : sessions.length === 0 ? (
        <div className="p-12 text-center border border-dashed border-border rounded-2xl bg-card/40 space-y-2">
          <Users className="w-10 h-10 text-muted-foreground/60 mx-auto" />
          <h4 className="font-semibold text-sm text-foreground">No Active Test Sessions</h4>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            There are currently no students actively taking an exam or practice session. When a student starts an exam, their live surveillance tile will appear here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sessions.map((item) => {
            const riskBorder =
              item.riskLevel === 'CRITICAL'
                ? 'border-rose-500/50 bg-rose-500/5'
                : item.riskLevel === 'CAUTION'
                ? 'border-amber-500/40 bg-amber-500/5'
                : 'border-border bg-card';

            const progressPct =
              item.totalQuestions > 0 ? Math.round((item.questionsAnswered / item.totalQuestions) * 100) : 0;

            return (
              <div
                key={item.sessionId}
                className={`p-4 rounded-xl border ${riskBorder} shadow-xs space-y-3 flex flex-col justify-between transition-colors duration-150`}
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5">
                    <h4 className="font-semibold text-sm text-foreground truncate max-w-[200px]">
                      {item.student?.fullName || 'Examinee'}
                    </h4>
                    <p className="text-xs text-muted-foreground font-mono">
                      {item.student?.matricNumber || item.student?.email || 'ID: ' + item.sessionId.slice(-6)}
                    </p>
                  </div>

                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                      item.riskLevel === 'CRITICAL'
                        ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30'
                        : item.riskLevel === 'CAUTION'
                        ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30'
                        : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                    }`}
                  >
                    {item.riskLevel}
                  </span>
                </div>

                {/* Course & Progress */}
                <div className="space-y-2 py-1 text-xs">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span className="font-medium text-foreground">{item.course?.code} · {item.course?.title}</span>
                    <span className="flex items-center gap-1 font-mono">
                      <Clock className="w-3 h-3" /> {formatElapsed(item.elapsedSeconds)}
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div>
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1">
                      <span>Progress: {item.questionsAnswered} / {item.totalQuestions} items</span>
                      <span>{progressPct}%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                      <div className="h-full bg-primary rounded-full transition-[width] duration-300 ease-out" style={{ width: `${progressPct}%` }} />
                    </div>
                  </div>

                  {/* Trust Score & Violations Tally */}
                  <div className="flex items-center justify-between pt-1 border-t border-border/50">
                    <span className="text-muted-foreground">
                      Trust Score:{' '}
                      <strong className={item.trustScore < 75 ? 'text-rose-500' : 'text-emerald-500'}>
                        {item.trustScore}%
                      </strong>
                    </span>
                    <span className="text-muted-foreground">
                      Violations:{' '}
                      <strong className={item.violationCount > 0 ? 'text-rose-500' : 'text-foreground'}>
                        {item.violationCount}
                      </strong>
                    </span>
                  </div>

                  {item.proctorWarning && (
                    <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-600 dark:text-amber-400">
                      <strong>Last Warning Sent:</strong> {item.proctorWarning}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-2 border-t border-border">
                  <button
                    type="button"
                    onClick={() => {
                      setWarningTarget(item);
                      setWarningMessage(
                        'Attention: Suspicious screen/tab switching detected. You must keep your exam window focused.'
                      );
                    }}
                    className="flex-1 min-h-[36px] text-xs py-1.5 px-2.5 rounded-lg border border-amber-500/40 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 font-semibold transition-colors duration-150 flex items-center justify-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" /> Warn
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setTerminateTarget(item);
                      setTerminateReason('Repeated unauthorized tab navigation and integrity violations.');
                    }}
                    className="flex-1 min-h-[36px] text-xs py-1.5 px-2.5 rounded-lg border border-rose-500/40 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 font-semibold transition-colors duration-150 flex items-center justify-center gap-1.5"
                  >
                    <Ban className="w-3.5 h-3.5" /> Terminate
                  </button>

                  {onInspectSession && (
                    <button
                      type="button"
                      onClick={() => onInspectSession(item.sessionId)}
                      title="Inspect Full Session Dossier"
                      aria-label="Inspect Full Session Dossier"
                      className="min-h-[36px] min-w-[36px] flex items-center justify-center p-1.5 rounded-lg border border-border hover:bg-muted text-muted-foreground transition-colors duration-150"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Warning Dialog */}
      {warningTarget && (
        <FocusTrap
          focusTrapOptions={{
            returnFocusOnDeactivate: true,
            fallbackFocus: '#warning-dialog-title',
            allowOutsideClick: true,
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="warning-dialog-title"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[rgba(15,23,42,0.85)] animate-in fade-in duration-200"
            onClick={(e) => {
              if (e.target === e.currentTarget && !isSendingWarning) setWarningTarget(null);
            }}
          >
            <div className="w-full max-w-md bg-background border border-border rounded-2xl p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
              <h3 id="warning-dialog-title" className="font-semibold text-base text-foreground">
                Send Invigilator Warning to {warningTarget.student?.fullName}
              </h3>
              <p className="text-xs text-muted-foreground">
                This message will immediately appear as an urgent warning notification on the student's active exam screen.
              </p>
              <div>
                <label htmlFor="warning-message-input" className="sr-only">Warning message</label>
                <textarea
                  id="warning-message-input"
                  rows={3}
                  value={warningMessage}
                  onChange={(e) => setWarningMessage(e.target.value)}
                  className="w-full p-2.5 text-xs sm:text-sm rounded-xl border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Type warning text..."
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={() => setWarningTarget(null)} disabled={isSendingWarning}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" onClick={handleSendWarning} disabled={isSendingWarning || !warningMessage.trim()}>
                  {isSendingWarning ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Send className="w-4 h-4 mr-1" />}
                  Transmit Warning
                </Button>
              </div>
            </div>
          </div>
        </FocusTrap>
      )}

      {/* Terminate Dialog */}
      {terminateTarget && (
        <FocusTrap
          focusTrapOptions={{
            returnFocusOnDeactivate: true,
            fallbackFocus: '#terminate-dialog-title',
            allowOutsideClick: true,
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="terminate-dialog-title"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[rgba(15,23,42,0.85)] animate-in fade-in duration-200"
            onClick={(e) => {
              if (e.target === e.currentTarget && !isTerminating) setTerminateTarget(null);
            }}
          >
            <div className="w-full max-w-md bg-background border border-destructive/30 rounded-2xl p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
              <h3 id="terminate-dialog-title" className="font-semibold text-base text-destructive">
                Terminate Exam: {terminateTarget.student?.fullName}
              </h3>
              <p className="text-xs text-muted-foreground">
                Are you sure you want to forcibly terminate this exam? The exam will immediately lock on the student's screen and be marked as terminated for integrity non-compliance.
              </p>
              <div>
                <label htmlFor="terminate-reason-input" className="block text-xs font-medium text-foreground mb-1">Termination Reason</label>
                <input
                  id="terminate-reason-input"
                  type="text"
                  value={terminateReason}
                  onChange={(e) => setTerminateReason(e.target.value)}
                  className="w-full p-2.5 text-xs sm:text-sm rounded-xl border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-destructive"
                  placeholder="Reason for termination..."
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={() => setTerminateTarget(null)} disabled={isTerminating}>
                  Cancel
                </Button>
                <Button variant="danger" size="sm" onClick={handleTerminate} disabled={isTerminating}>
                  {isTerminating ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Ban className="w-4 h-4 mr-1" />}
                  Force Terminate Exam
                </Button>
              </div>
            </div>
          </div>
        </FocusTrap>
      )}
    </div>
  );
};
