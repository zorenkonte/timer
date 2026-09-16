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
 */

const CYCLES = 5;
const REEL = Array.from({ length: CYCLES * 10 }, (_, i) => i % 10);
/** Resting cycle: the reel snaps back here (without animating) after a wrap. */
const HOME = Math.floor(CYCLES / 2) * 10;

interface RollingDigitProps {
  digit: number;
}

export function RollingDigit({ digit }: RollingDigitProps) {
  const [pos, setPos] = useState(HOME + digit);
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
    setPos((p) => p + delta);
  }, [digit]);

  // After a wrap the reel sits in a neighbouring cycle. Jump back to HOME with
  // the transition switched off and a forced reflow in between, so the browser
  // never sees the jump as something to animate (same glyph, nothing visibly moves).
  const snapHome = () => {
    if (pos >= HOME && pos < HOME + 10) return;
    const home = HOME + (((pos % 10) + 10) % 10);
    const el = reel.current;
    if (el) {
      el.style.transition = 'none';
      el.style.transform = `translateY(${-home}em)`;
      void el.offsetHeight;
      el.style.transition = '';
    }
    setPos(home);
  };

  return (
    <span className="relative inline-block h-[1em] overflow-y-clip align-top" aria-hidden>
      <span
        ref={reel}
        className="flex flex-col transition-transform duration-500 ease-in-out motion-reduce:transition-none"
        style={{ transform: `translateY(${-pos}em)` }}
        onTransitionEnd={snapHome}
      >
        {REEL.map((d, i) => (
          <span key={i} className="block h-[1em]">
            {d}
          </span>
        ))}
      </span>
    </span>
  );
}
