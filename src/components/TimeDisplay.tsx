import { formatClock } from '../lib/format';

interface TimeDisplayProps {
  ms: number;
  /** Sweeps the shimmer while true; freezes it (e.g. paused) while false. */
  running?: boolean;
  className?: string;
}

/**
 * Big MM:SS readout with a Claude Code-style "shimmer": a band of light sweeping across the
 * digits while the clock runs, instead of nudging the digits on every second.
 * The UI kit's type scale tops out at 16px, so this uses raw Tailwind sizes.
 */
export function TimeDisplay({ ms, running = true, className = '' }: TimeDisplayProps) {
  return (
    <div
      className={`text-7xl leading-none font-semibold tracking-tight tabular-nums text-cladd-fg bg-clip-text motion-safe:text-transparent motion-safe:animate-shimmer ${className}`}
      style={{
        backgroundImage:
          'linear-gradient(100deg, var(--color-cladd-fg) 0%, var(--color-cladd-fg) 40%, var(--color-cladd-fg-soft) 50%, var(--color-cladd-fg) 60%, var(--color-cladd-fg) 100%)',
        backgroundSize: '200% 100%',
        animationPlayState: running ? 'running' : 'paused',
      }}
    >
      {formatClock(ms)}
    </div>
  );
}
