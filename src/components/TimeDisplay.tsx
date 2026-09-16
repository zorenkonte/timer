import { formatClock } from '../lib/format';
import { RollingDigit } from './RollingDigit';

interface TimeDisplayProps {
  ms: number;
  className?: string;
}

/**
 * Big M:SS readout. Each digit is an odometer reel (see RollingDigit) that rolls
 * to its next value, like daisyUI's countdown component.
 * The UI kit's type scale tops out at 16px, so this uses raw Tailwind sizes.
 */
export function TimeDisplay({ ms, className = '' }: TimeDisplayProps) {
  const text = formatClock(ms);
  const chars = text.split('');
  return (
    <div
      role="timer"
      aria-label={text}
      className={`inline-flex text-7xl leading-none font-semibold tracking-tight tabular-nums text-cladd-fg ${className}`}
    >
      {chars.map((ch, i) => {
        // Key from the right so the seconds reels keep their identity when the
        // minutes lose a digit (10:00 -> 9:59).
        const key = chars.length - i;
        return /\d/.test(ch) ? (
          <RollingDigit key={key} digit={Number(ch)} />
        ) : (
          <span key={key} aria-hidden>
            {ch}
          </span>
        );
      })}
    </div>
  );
}
