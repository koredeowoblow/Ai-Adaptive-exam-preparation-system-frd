import { useEffect, useRef, useCallback, useState } from 'react';
import { practiceApi } from '../api/practice.api';
import type { AntiCheatEventType, IAntiCheatEvent } from '../../../types/practice.types';
import type { IntegrityViolationType } from '../components/IntegrityWarningBanner';

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

  const getIsFullscreenActive = useCallback(() => {
    if (typeof document === 'undefined') return false;
    return Boolean(
      document.fullscreenElement ||
      (document as any).webkitFullscreenElement ||
      (document as any).mozFullScreenElement ||
      (document as any).msFullscreenElement
    );
  }, []);

  const [isFullscreen, setIsFullscreen] = useState<boolean>(() => {
    if (typeof document === 'undefined') return false;
    return Boolean(
      document.fullscreenElement ||
      (document as any).webkitFullscreenElement ||
      (document as any).mozFullScreenElement ||
      (document as any).msFullscreenElement
    );
  });
  const [lastViolationType, setLastViolationType] = useState<IntegrityViolationType | null>(null);
  const [isProtectionFlashing, setIsProtectionFlashing] = useState<boolean>(false);
  const [violationCount, setViolationCount] = useState<number>(0);

  const clearViolation = useCallback(() => {
    setLastViolationType(null);
  }, []);

  const requestFullscreen = useCallback(async (): Promise<boolean> => {
    try {
      if (typeof document === 'undefined') return false;
      const el = document.documentElement as any;
      if (!getIsFullscreenActive()) {
        if (el.requestFullscreen) {
          await el.requestFullscreen();
        } else if (el.webkitRequestFullscreen) {
          await el.webkitRequestFullscreen();
        } else if (el.mozRequestFullScreen) {
          await el.mozRequestFullScreen();
        } else if (el.msRequestFullscreen) {
          await el.msRequestFullscreen();
        }
      }
      setIsFullscreen(true);
      return true;
    } catch (err) {
      console.warn('Failed to enter fullscreen mode:', err);
      return false;
    }
  }, [getIsFullscreenActive]);

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

  // Beacon flush for pagehide/beforeunload so events are never lost on unload
  const flushBeacon = useCallback(() => {
    if (eventBufferRef.current.length === 0 || !sessionIdRef.current) return;
    const events = [...eventBufferRef.current];
    eventBufferRef.current = [];

    const url = `/api/v1/practice-sessions/${sessionIdRef.current}/anticheat-event`;
    const payloadStr = JSON.stringify({ events });

    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      const blob = new Blob([payloadStr], { type: 'application/json' });
      navigator.sendBeacon(url, blob);
    } else {
      practiceApi.logAntiCheatEvents(sessionIdRef.current, { events }).catch(() => {});
    }
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

    // Trigger black overlay defense & clipboard wipe for screen capture attempts
    const triggerScreenshotDefense = (keyName: string) => {
      setIsProtectionFlashing(true);
      setTimeout(() => {
        setIsProtectionFlashing(false);
      }, 700);

      if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        navigator.clipboard.writeText('').catch(() => {});
      }

      pushEvent('TAB_SWITCH', { reason: 'screenshot_attempt', key: keyName });
      setLastViolationType('screenshot');
      setViolationCount((prev) => prev + 1);
    };

    // 1. Fullscreen monitoring
    const handleFullscreenChange = () => {
      const active = getIsFullscreenActive();
      setIsFullscreen(active);
      if (!active) {
        pushEvent('TAB_SWITCH', { reason: 'fullscreen_exit' });
        setLastViolationType('tab_switch');
        setViolationCount((prev) => prev + 1);
      }
    };

    // 2. Tab Focus / Visibility
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        blurTimeRef.current = Date.now();
        pushEvent('TAB_SWITCH', { reason: 'tab_hidden' });
        setLastViolationType('tab_switch');
        setViolationCount((prev) => prev + 1);
      } else if (blurTimeRef.current) {
        const awayDurationMs = Date.now() - blurTimeRef.current;
        pushEvent('TAB_SWITCH', { awayDurationMs });
        blurTimeRef.current = null;
      }
    };

    const handleBlur = () => {
      if (!blurTimeRef.current) {
        blurTimeRef.current = Date.now();
        pushEvent('TAB_SWITCH', { reason: 'window_blur' });
        setLastViolationType('window_blur');
        setViolationCount((prev) => prev + 1);
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
      setViolationCount((prev) => prev + 1);
    };

    const textarea = theoryTextareaRef?.current;
    if (textarea) {
      textarea.addEventListener('paste', handlePaste);
    }

    // 4. Copy and Cut Blocking
    const handleCopyCut = (e: ClipboardEvent) => {
      const activeEl = document.activeElement;
      const isInsideAllowed = activeEl === theoryTextareaRef?.current;
      if (!isInsideAllowed) {
        e.preventDefault();
        pushEvent('PASTE_DETECTED', { reason: 'copy_blocked' });
        setLastViolationType('copy_paste');
        setViolationCount((prev) => prev + 1);
      }
    };

    // 5. Right Click
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault(); // Block context menu
      pushEvent('RIGHT_CLICK_BLOCKED');
      setLastViolationType('right_click');
      setViolationCount((prev) => prev + 1);
    };

    // 6. Screenshot & Shortcut Interception
    const handleKeyDown = (e: KeyboardEvent) => {
      // PrintScreen Key
      if (e.key === 'PrintScreen' || e.code === 'PrintScreen') {
        e.preventDefault();
        triggerScreenshotDefense('PrintScreen');
        return;
      }

      // Windows Snipping Tool (Win+Shift+S triggers shift+S in browser) or Ctrl+Shift+S
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'S' || e.key === 's')) {
        e.preventDefault();
        triggerScreenshotDefense('SnippingTool_Shortcut');
        return;
      }

      // Mac Screenshot Shortcuts (Cmd+Shift+3, Cmd+Shift+4, Cmd+Shift+5)
      if (e.metaKey && e.shiftKey && ['3', '4', '5'].includes(e.key)) {
        e.preventDefault();
        triggerScreenshotDefense('Mac_Screenshot');
        return;
      }

      // Print Page (Ctrl+P, Cmd+P)
      if ((e.ctrlKey || e.metaKey) && (e.key === 'P' || e.key === 'p')) {
        e.preventDefault();
        pushEvent('TAB_SWITCH', { reason: 'print_attempt' });
        setLastViolationType('screenshot');
        setViolationCount((prev) => prev + 1);
        return;
      }

      // Save Page (Ctrl+S, Cmd+S)
      if ((e.ctrlKey || e.metaKey) && (e.key === 'S' || e.key === 's')) {
        e.preventDefault();
        return;
      }

      // DevTools Shortcuts (F12, Ctrl+Shift+I/J/C)
      if (
        e.key === 'F12' ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && ['I', 'i', 'J', 'j', 'C', 'c'].includes(e.key))
      ) {
        e.preventDefault();
        pushEvent('DEVTOOLS_DETECTED', { key: e.key });
        setLastViolationType('tab_switch');
        setViolationCount((prev) => prev + 1);
        return;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'PrintScreen' || e.code === 'PrintScreen') {
        triggerScreenshotDefense('PrintScreen_Release');
      }
    };

    // 7. DevTools Window Dimension Detection (Heuristic)
    let devToolsOpen = false;
    const checkDevTools = setInterval(() => {
      const widthDiff = window.outerWidth - window.innerWidth;
      const heightDiff = window.outerHeight - window.innerHeight;
      
      const threshold = 160;
      const isCurrentlyOpen = widthDiff > threshold || heightDiff > threshold;

      if (isCurrentlyOpen && !devToolsOpen) {
        pushEvent('DEVTOOLS_DETECTED', { widthDiff, heightDiff });
      }
      devToolsOpen = isCurrentlyOpen;
    }, 2000);

    // Event Batching Timer: flush every 10 seconds
    const batchInterval = setInterval(() => {
      flushEvents();
    }, 10000);

    // Unload / pagehide listeners to ensure no events are lost
    const handlePageHide = () => {
      flushBeacon();
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('copy', handleCopyCut);
    document.addEventListener('cut', handleCopyCut);
    window.addEventListener('keydown', handleKeyDown, { capture: true });
    window.addEventListener('keyup', handleKeyUp, { capture: true });
    window.addEventListener('pagehide', handlePageHide);
    window.addEventListener('beforeunload', handlePageHide);

    return () => {
      clearInterval(checkDevTools);
      clearInterval(batchInterval);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('copy', handleCopyCut);
      document.removeEventListener('cut', handleCopyCut);
      window.removeEventListener('keydown', handleKeyDown, { capture: true });
      window.removeEventListener('keyup', handleKeyUp, { capture: true });
      window.removeEventListener('pagehide', handlePageHide);
      window.removeEventListener('beforeunload', handlePageHide);
      
      if (textarea) {
        textarea.removeEventListener('paste', handlePaste);
      }
      
      flushBeacon(); // Final flush on unmount
    };
  }, [isMonitoring, flushEvents, flushBeacon, theoryTextareaRef, getIsFullscreenActive]);

  return {
    isFullscreen,
    requestFullscreen,
    lastViolationType,
    clearViolation,
    isProtectionFlashing,
    violationCount,
    flushEvents,
  };
};
