import { useEffect, useRef, useState } from 'react';

/**
 * Tracks elapsed time in seconds since the stopwatch was started/reset.
 * Designed for practice session question timing — reset by changing the
 * component's `key` prop or by calling the returned `reset()` function.
 */
export const useStopwatch = () => {
  const startTimeRef = useRef<number>(Date.now());
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    startTimeRef.current = Date.now();
    setElapsedSeconds(0);

    const interval = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const getElapsedSeconds = (): number => {
    return Math.floor((Date.now() - startTimeRef.current) / 1000);
  };

  const reset = () => {
    startTimeRef.current = Date.now();
    setElapsedSeconds(0);
  };

  /** Formats elapsed seconds as M:SS (e.g. "1:08") */
  const formattedTime = (() => {
    const m = Math.floor(elapsedSeconds / 60);
    const s = elapsedSeconds % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  })();

  return { elapsedSeconds, formattedTime, getElapsedSeconds, reset };
};
