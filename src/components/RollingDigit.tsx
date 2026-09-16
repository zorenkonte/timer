import { useEffect, useRef, useState } from 'react';

/**
 * One odometer-style digit, in the spirit of daisyUI's `countdown` component:
 * a reel of 0-9 stacked in a 1em-tall clipped box, slid vertically with a CSS
 * transition whenever the digit changes.
 *
 * daisyUI renders the reel as pseudo-element text and drives `top` from a
 * `--value` CSS variable. This version renders real rows and moves them with
 * `translateY`, so it needs no CSS plugin and can roll the short way round the
 * wheel (9 -> 0 keeps rolling down rather than winding back through 8..1).
 *
 * Two NumberFlow-style touches: only the digits taking part in the current
 * roll are drawn (so nothing peeks in at rest), the window extends a little
 * past the line box with a mask that fades those digits in and out at the
 * edges, and the motion follows a spring easing (see --ease-spring).
 */

const CYCLES = 5;
const REEL = Array.from({ length: CYCLES * 10 }, (_, i) => i % 10);
/** Resting cycle: the reel snaps back here (without animating) after a wrap. */
const HOME = Math.floor(CYCLES / 2) * 10;

const mod10 = (n: number) => ((n % 10) + 10) % 10;

interface ReelState {
  /** Row currently (or about to be) shown. */
  pos: number;
  /** Rows drawn: everything between the roll's start and end, inclusive. */
  lo: number;
  hi: number;
}

const settled = (pos: number): ReelState => ({ pos, lo: pos, hi: pos });

interface RollingDigitProps {
  digit: number;
}

export function RollingDigit({ digit }: RollingDigitProps) {
  const [st, setSt] = useState<ReelState>(() => settled(HOME + digit));
  const prev = useRef(digit);
  const reel = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (digit === prev.current) return;
    // Shortest path around the wheel. Ties (a 5-step move) roll downward,
    // the direction a countdown travels.
    let delta = digit - prev.current;
    if (delta >= 5) delta -= 10;
    else if (delta < -5) delta += 10;
    prev.current = digit;

    // No transition under reduced motion, so no transitionend to settle on:
    // jump straight to the new digit in the home cycle.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setSt(settled(HOME + digit));
      return;
    }
    setSt((s) => {
      const pos = s.pos + delta;
      return { pos, lo: Math.min(s.lo, pos), hi: Math.max(s.hi, pos) };
    });
  }, [digit]);

  // After the roll, draw only the current digit again. If a wrap left the reel
  // in a neighbouring cycle, jump back to HOME with the transition switched off
  // and a forced reflow in between, so the browser never animates the jump
  // (same glyph, nothing visibly moves).
  const settle = () => {
    const home = HOME + mod10(st.pos);
    const el = reel.current;
    if (el && home !== st.pos) {
      el.style.transition = 'none';
      el.style.transform = `translateY(${-home}em)`;
      void el.offsetHeight;
      el.style.transition = '';
    }
    setSt(settled(home));
  };

  return (
    <span className="relative inline-block h-[1em] align-top" aria-hidden>
      {/* Window: the 1em line box plus --reveal above and below, masked so the
          digits rolling through fade at the edges instead of hard-clipping. */}
      <span className="absolute inset-x-0 -inset-y-[var(--reveal)] overflow-y-clip [--reveal:0.28em] [mask-image:linear-gradient(to_bottom,transparent,black_calc(var(--reveal)+0.08em),black_calc(100%-var(--reveal)-0.08em),transparent)]">
        <span
          ref={reel}
          className="flex flex-col pt-[var(--reveal)] transition-transform duration-700 ease-spring motion-reduce:transition-none"
          style={{ transform: `translateY(${-st.pos}em)` }}
          onTransitionEnd={settle}
        >
          {REEL.map((d, i) => (
            <span key={i} className={`block h-[1em] ${i >= st.lo && i <= st.hi ? '' : 'invisible'}`}>
              {d}
            </span>
          ))}
        </span>
      </span>
      {/* Invisible copy keeps the inline box as wide as a digit. */}
      <span className="invisible">0</span>
    </span>
  );
}
