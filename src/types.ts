import type { Color } from '@cladd-ui/react';

export type ExerciseMode = 'reps' | 'time';

export interface Exercise {
  id: string;
  name: string;
  mode: ExerciseMode;
  /** Number of sets. */
  sets: number;
  /** Target reps per set (reps mode). */
  reps: number;
  /** Work duration per set in seconds (time mode). */
  durationSec: number;
  /** Optional load; 0 = bodyweight / none. */
  weightKg: number;
  /** Rest between sets in seconds. */
  restSec: number;
}

export interface Workout {
  id: string;
  name: string;
  exercises: Exercise[];
  /** Rest after the last set of an exercise before the next one starts. */
  restBetweenExercisesSec: number;
}

export type ThemeMode = 'dark' | 'light';

export interface Settings {
  theme: ThemeMode;
  accent: Color;
  sound: boolean;
  vibrate: boolean;
  /** "Get ready" countdown before the first set. 0 disables it. */
  prepSec: number;
}

export interface HistoryEntry {
  id: string;
  workoutId: string;
  workoutName: string;
  startedAt: number;
  finishedAt: number;
  setsDone: number;
  setsTotal: number;
  completed: boolean;
}

export interface AppState {
  workouts: Workout[];
  history: HistoryEntry[];
  settings: Settings;
}
