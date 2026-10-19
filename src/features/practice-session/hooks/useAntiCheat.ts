import { useEffect, useRef, useCallback, useState } from 'react';
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

  const [isFullscreen, setIsFullscreen] = useState<boolean>(() => {
    return typeof document !== 'undefined' && Boolean(document.fullscreenElement);
  });
  const [lastViolationType, setLastViolationType] = useState<'tab_switch' | 'copy_paste' | null>(null);

  const clearViolation = useCallback(() => {
    setLastViolationType(null);
  }, []);

  const requestFullscreen = useCallback(async () => {
    try {
      if (typeof document !== 'undefined' && !document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      }
    } catch (err) {
      console.warn('Failed to enter fullscreen mode:', err);
    }
  }, []);

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

    // 1. Fullscreen monitoring
    const handleFullscreenChange = () => {
      const active = Boolean(document.fullscreenElement);
      setIsFullscreen(active);
      if (!active) {
        pushEvent('TAB_SWITCH', { reason: 'fullscreen_exit' });
        setLastViolationType('tab_switch');
        flushEvents();
      }
    };

    // 2. Tab Focus / Visibility
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        blurTimeRef.current = Date.now();
        setLastViolationType('tab_switch');
      } else if (blurTimeRef.current) {
        const awayDurationMs = Date.now() - blurTimeRef.current;
        pushEvent('TAB_SWITCH', { awayDurationMs });
        blurTimeRef.current = null;
      }
    };

    const handleBlur = () => {
      if (!blurTimeRef.current) {
        blurTimeRef.current = Date.now();
        setLastViolationType('tab_switch');
      }
    };

    const handleFocus = () => {
      if (blurTimeRef.current) {
        const awayDurationMs = Date.now() - blurTimeRef.current;
        pushEvent('TAB_SWITCH', { awayDurationMs });
        blurTimeRef.current = null;
      }
    };

    // 3. Paste Detection (Target theory textarea)
    const handlePaste = (e: ClipboardEvent) => {
      const text = e.clipboardData?.getData('text/plain') || '';
      pushEvent('PASTE_DETECTED', { pastedLength: text.length });
      setLastViolationType('copy_paste');
    };

    const textarea = theoryTextareaRef?.current;
    if (textarea) {
      textarea.addEventListener('paste', handlePaste);
    }

    // 4. Right Click
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault(); // Block context menu
      pushEvent('RIGHT_CLICK_BLOCKED');
    };

    // 5. DevTools Detection (Heuristic)
    let devToolsOpen = false;
    const checkDevTools = setInterval(() => {
      const widthDiff = window.outerWidth - window.innerWidth;
      const heightDiff = window.outerHeight - window.innerHeight;
      
      const threshold = 160; // Common threshold for open devtools
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

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);
    document.addEventListener('contextmenu', handleContextMenu);

    return () => {
      clearInterval(checkDevTools);
      clearInterval(batchInterval);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
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

  return { isFullscreen, requestFullscreen, lastViolationType, clearViolation };
};
