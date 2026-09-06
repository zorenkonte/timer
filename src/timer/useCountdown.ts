import { useCallback, useEffect, useRef, useState } from 'react';

export interface Countdown {
  /** Milliseconds left; 0 when idle. */
  remainingMs: number;
  /** Length of the current countdown (grows if time is added). */
  totalMs: number;
  /** A countdown exists (running or paused). */
  active: boolean;
  running: boolean;
  start: (ms: number) => void;
  pause: () => void;
  resume: () => void;
  /** Add (or subtract, when negative) time to the current countdown. */
  add: (ms: number) => void;
  stop: () => void;
}

interface Inner {
  endsAt: number | null; // running when set
  pausedRemaining: number | null; // paused when set
  totalMs: number;
}

const IDLE: Inner = { endsAt: null, pausedRemaining: null, totalMs: 0 };

/**
 * Wall-clock based countdown. Stores an end timestamp instead of decrementing a
 * counter, so throttled background tabs and late intervals never drift it.
 */
export function useCountdown(onComplete: () => void): Countdown {
  const [inner, setInner] = useState<Inner>(IDLE);
  const [now, setNow] = useState(() => Date.now());
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const firedRef = useRef(false);

  const running = inner.endsAt !== null;

  useEffect(() => {
    if (!running) return;
    firedRef.current = false;
    const tick = () => {
      const t = Date.now();
      setNow(t);
      if (inner.endsAt !== null && t >= inner.endsAt && !firedRef.current) {
        firedRef.current = true;
        setInner(IDLE);
        onCompleteRef.current();
      }
    };
    tick();
    const id = window.setInterval(tick, 200);
    const onVisible = () => tick();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [running, inner.endsAt]);

  const start = useCallback((ms: number) => {
    const t = Date.now();
    setNow(t);
    setInner({ endsAt: t + ms, pausedRemaining: null, totalMs: ms });
  }, []);

  const pause = useCallback(() => {
    setInner((s) =>
      s.endsAt === null ? s : { ...s, endsAt: null, pausedRemaining: Math.max(0, s.endsAt - Date.now()) },
    );
  }, []);

  const resume = useCallback(() => {
    setInner((s) =>
      s.pausedRemaining === null ? s : { ...s, endsAt: Date.now() + s.pausedRemaining, pausedRemaining: null },
    );
  }, []);

  const add = useCallback((ms: number) => {
    setInner((s) => {
      if (s.endsAt !== null) {
        const remaining = Math.max(0, s.endsAt - Date.now() + ms);
        return { ...s, endsAt: Date.now() + remaining, totalMs: Math.max(s.totalMs, remaining) };
      }
      if (s.pausedRemaining !== null) {
        const remaining = Math.max(0, s.pausedRemaining + ms);
        return { ...s, pausedRemaining: remaining, totalMs: Math.max(s.totalMs, remaining) };
      }
      return s;
    });
  }, []);

  const stop = useCallback(() => setInner(IDLE), []);

  const remainingMs =
    inner.endsAt !== null ? Math.max(0, inner.endsAt - now) : inner.pausedRemaining ?? 0;

  return {
    remainingMs,
    totalMs: inner.totalMs,
    active: inner.endsAt !== null || inner.pausedRemaining !== null,
    running,
    start,
    pause,
    resume,
    add,
    stop,
  };
}
