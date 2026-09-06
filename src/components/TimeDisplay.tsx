import { formatClock } from '../lib/format';

interface TimeDisplayProps {
  ms: number;
  className?: string;
}

/**
 * Big MM:SS readout. The UI kit's type scale tops out at 16px, so this uses raw Tailwind sizes.
 * Keyed on the displayed text so the digits nudge on every second.
 */
export function TimeDisplay({ ms, className = '' }: TimeDisplayProps) {
  const text = formatClock(ms);
  return (
    <div
      key={text}
      className={`text-7xl leading-none font-semibold tracking-tight tabular-nums text-cladd-fg animate-tick motion-reduce:animate-none ${className}`}
    >
      {text}
    </div>
  );
}
