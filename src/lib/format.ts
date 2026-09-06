import type { Exercise, Workout } from '../types';

/** ms -> "m:ss" (rounded up so 0.2s still shows 0:01). */
export function formatClock(ms: number): string {
  const totalSec = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/** seconds -> "45 s", "12 min", "1 h 05 min". */
export function formatDuration(sec: number): string {
  if (sec < 60) return `${Math.round(sec)} s`;
  const min = Math.round(sec / 60);
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const rest = min % 60;
  return `${h} h ${rest.toString().padStart(2, '0')} min`;
}

export function formatDate(ts: number): string {
  return new Date(ts).toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function formatWeight(kg: number): string {
  return `${Number.isInteger(kg) ? kg : kg.toFixed(1)} kg`;
}

/** "12 reps · 10 kg" or "45 s". */
export function describeTarget(ex: Exercise): string {
  const parts: string[] = [];
  if (ex.mode === 'time') parts.push(`${ex.durationSec} s`);
  else parts.push(`${ex.reps} reps`);
  if (ex.weightKg > 0) parts.push(formatWeight(ex.weightKg));
  return parts.join(' · ');
}

export function totalSets(workout: Workout): number {
  return workout.exercises.reduce((n, ex) => n + ex.sets, 0);
}

/** Rough wall-clock estimate; a rep is assumed to take ~3 s. */
export function estimateWorkoutSec(workout: Workout, prepSec = 0): number {
  const SEC_PER_REP = 3;
  let total = prepSec;
  workout.exercises.forEach((ex, i) => {
    const work = ex.mode === 'time' ? ex.durationSec : ex.reps * SEC_PER_REP;
    total += ex.sets * work + Math.max(0, ex.sets - 1) * ex.restSec;
    if (i < workout.exercises.length - 1) total += workout.restBetweenExercisesSec;
  });
  return total;
}

export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}
