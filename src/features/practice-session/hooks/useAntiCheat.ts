import { useEffect, useRef, useCallback } from 'react';
import { practiceApi } from '../api/practice.api';
import type { AntiCheatEventType, IAntiCheatEvent } from '../../../types/practice.types';

export const useAntiCheat = (
  sessionId?: string,
  isMonitoring = false,
  theoryTextareaRef?: React.RefObject<HTMLTextAreaElement | null>,
  activeQuestionId?: string
) => {
  const sessionIdRef = useRef(sessionId);
  const activeQuestionIdRef = useRef(activeQuestionId);
  const eventBufferRef = useRef<IAntiCheatEvent[]>([]);
  const blurTimeRef = useRef<number | null>(null);

  useEffect(() => {
    sessionIdRef.current = sessionId;
  }, [sessionId]);

  useEffect(() => {
    activeQuestionIdRef.current = activeQuestionId;
  }, [activeQuestionId]);

  const flushEvents = useCallback(() => {
    if (eventBufferRef.current.length === 0 || !sessionIdRef.current) return;

    const payload = { events: [...eventBufferRef.current] };
    eventBufferRef.current = []; // Clear buffer

    practiceApi.logAntiCheatEvents(sessionIdRef.current, payload).catch(() => {});
  }, []);

  useEffect(() => {
    if (!isMonitoring) return;

    const pushEvent = (type: AntiCheatEventType, metadata?: any) => {
      eventBufferRef.current.push({
        type,
        questionId: activeQuestionIdRef.current,
        timestamp: new Date().toISOString(),
        metadata,
      });
    };

    // 1. Tab Focus / Visibility
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        blurTimeRef.current = Date.now();
      } else if (blurTimeRef.current) {
        const awayDurationMs = Date.now() - blurTimeRef.current;
        pushEvent('TAB_SWITCH', { awayDurationMs });
        blurTimeRef.current = null;
      }
    };

    const handleBlur = () => {
      if (!blurTimeRef.current) {
        blurTimeRef.current = Date.now();
      }
    };

    const handleFocus = () => {
      if (blurTimeRef.current) {
        const awayDurationMs = Date.now() - blurTimeRef.current;
        pushEvent('TAB_SWITCH', { awayDurationMs });
        blurTimeRef.current = null;
      }
    };

    // 2. Paste Detection (Target theory textarea)
    const handlePaste = (e: ClipboardEvent) => {
      const text = e.clipboardData?.getData('text/plain') || '';
      pushEvent('PASTE_DETECTED', { pastedLength: text.length });
    };

    const textarea = theoryTextareaRef?.current;
    if (textarea) {
      textarea.addEventListener('paste', handlePaste);
    }

    // 3. Right Click
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault(); // Only one that is blocked
      pushEvent('RIGHT_CLICK_BLOCKED');
    };

    // 4. DevTools Detection (Heuristic)
    let devToolsOpen = false;
    const checkDevTools = setInterval(() => {
      const widthDiff = window.outerWidth - window.innerWidth;
      const heightDiff = window.outerHeight - window.innerHeight;
      
      const threshold = 160; // common threshold for open devtools
      const isCurrentlyOpen = widthDiff > threshold || heightDiff > threshold;

      if (isCurrentlyOpen && !devToolsOpen) {
        pushEvent('DEVTOOLS_DETECTED', { widthDiff, heightDiff });
      }
      devToolsOpen = isCurrentlyOpen;
    }, 2000);

    // Event Batching Timer
    const batchInterval = setInterval(() => {
      flushEvents();
    }, 10000);

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);
    document.addEventListener('contextmenu', handleContextMenu);

    return () => {
      clearInterval(checkDevTools);
      clearInterval(batchInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('contextmenu', handleContextMenu);
      
      if (textarea) {
        textarea.removeEventListener('paste', handlePaste);
      }
      
      flushEvents(); // Final flush on unmount
    };
  }, [isMonitoring, flushEvents, theoryTextareaRef]);

  // Hook returns nothing for the UI to render natively
  // But we'll return a dummy object to satisfy any old destructured imports temporarily
  return { lastViolationType: null, clearViolation: () => {} };
};
