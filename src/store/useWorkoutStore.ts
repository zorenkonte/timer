import { useEffect, useReducer } from 'react';
import type { AppState, HistoryEntry, Settings, Workout } from '../types';
import { sampleWorkouts } from './sampleWorkouts';

const STORAGE_KEY = 'home-workout-timer:v1';

export const defaultSettings: Settings = {
  theme: 'dark',
  accent: 'orange',
  sound: true,
  vibrate: true,
  prepSec: 5,
};

export type Action =
  | { type: 'upsertWorkout'; workout: Workout }
  | { type: 'deleteWorkout'; id: string }
  | { type: 'addHistory'; entry: HistoryEntry }
  | { type: 'clearHistory' }
  | { type: 'updateSettings'; patch: Partial<Settings> };

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'upsertWorkout': {
      const exists = state.workouts.some((w) => w.id === action.workout.id);
      return {
        ...state,
        workouts: exists
          ? state.workouts.map((w) => (w.id === action.workout.id ? action.workout : w))
          : [...state.workouts, action.workout],
      };
    }
    case 'deleteWorkout':
      return { ...state, workouts: state.workouts.filter((w) => w.id !== action.id) };
    case 'addHistory':
      return { ...state, history: [action.entry, ...state.history].slice(0, 200) };
    case 'clearHistory':
      return { ...state, history: [] };
    case 'updateSettings':
      return { ...state, settings: { ...state.settings, ...action.patch } };
  }
}

function load(): AppState {
  const fresh: AppState = { workouts: sampleWorkouts(), history: [], settings: defaultSettings };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return fresh;
    const parsed = JSON.parse(raw) as Partial<AppState>;
    return {
      workouts: Array.isArray(parsed.workouts) ? parsed.workouts : fresh.workouts,
      history: Array.isArray(parsed.history) ? parsed.history : [],
      settings: { ...defaultSettings, ...(parsed.settings ?? {}) },
    };
  } catch {
    return fresh;
  }
}

export function useWorkoutStore() {
  const [state, dispatch] = useReducer(reducer, undefined, load);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Storage full or unavailable (private mode) — keep running in memory.
    }
  }, [state]);

  return { state, dispatch };
}
