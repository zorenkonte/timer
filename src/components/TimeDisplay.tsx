import { formatClock } from '../lib/format';

interface TimeDisplayProps {
  ms: number;
  className?: string;
}

/** Big MM:SS readout. Cladd's type scale tops out at 16px, so this uses raw Tailwind sizes. */
export function TimeDisplay({ ms, className = '' }: TimeDisplayProps) {
  return (
    <div className={`text-7xl leading-none font-semibold tracking-tight tabular-nums text-cladd-fg ${className}`}>
      {formatClock(ms)}
    </div>
  );
}
