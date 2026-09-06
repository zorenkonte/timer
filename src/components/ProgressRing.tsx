import type { ReactNode } from 'react';

interface ProgressRingProps {
  /** 0..1 fraction of the ring that is filled. */
  progress: number;
  size?: number;
  stroke?: number;
  children?: ReactNode;
  className?: string;
}

/**
 * The UI kit ships no progress indicator, so this is a small SVG ring that borrows
 * its tokens: the arc uses the raw accent hex (`--cladd-theme`) of the nearest `cladd-color-*` region and the
 * track uses the outline color, so it tracks theme and accent changes for free.
 */
export function ProgressRing({ progress, size = 264, stroke = 14, children, className = '' }: ProgressRingProps) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.min(1, Math.max(0, Number.isFinite(progress) ? progress : 0));
  const offset = c * (1 - clamped);

  return (
    <div className={`relative shrink-0 ${className}`} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-cladd-outline)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--cladd-theme)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.2s linear, stroke 0.3s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">{children}</div>
    </div>
  );
}
