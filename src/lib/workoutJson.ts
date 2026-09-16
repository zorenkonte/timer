import type { Exercise, ExerciseMode, Workout } from '../types';
import { newExercise, newWorkout } from '../store/sampleWorkouts';
import { clamp } from './format';

export const APP_URL = 'https://zorenkonte.github.io/timer/';
export const LLMS_TXT_URL = `${APP_URL}llms.txt`;

/** Editor limits, shared with the import parser so pasted plans land inside the form's ranges. */
export const LIMITS = {
  sets: [1, 20],
  reps: [1, 500],
  durationSec: [5, 3600],
  weightKg: [0, 500],
  restSec: [0, 900],
  restBetweenExercisesSec: [0, 900],
} as const;

export type ParseResult = { ok: true; workouts: Workout[] } | { ok: false; error: string };

type Json = Record<string, unknown>;

const isObject = (v: unknown): v is Json => typeof v === 'object' && v !== null && !Array.isArray(v);

/** First defined value among the given keys (LLMs are loose with field names). */
function pick(obj: Json, keys: string[]): unknown {
  for (const k of keys) if (obj[k] !== undefined && obj[k] !== null) return obj[k];
  return undefined;
}

function num(v: unknown, fallback: number, [min, max]: readonly [number, number]): number {
  const n = typeof v === 'string' ? Number(v.trim()) : typeof v === 'number' ? v : NaN;
  if (!Number.isFinite(n)) return fallback;
  return clamp(n, min, max);
}

function str(v: unknown): string {
  return typeof v === 'string' ? v.trim() : '';
}

/**
 * Pull the JSON payload out of whatever an LLM handed back: a bare object/array,
 * a ```json fenced block, or prose wrapped around either.
 */
export function extractJson(text: string): string {
  const fenced = text.match(/```(?:json|jsonc|javascript|js)?\s*([\s\S]*?)```/i);
  if (fenced) return fenced[1].trim();
  const trimmed = text.trim();
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) return trimmed;
  const starts = [trimmed.indexOf('{'), trimmed.indexOf('[')].filter((i) => i >= 0);
  if (starts.length === 0) return trimmed;
  const start = Math.min(...starts);
  const end = Math.max(trimmed.lastIndexOf('}'), trimmed.lastIndexOf(']'));
  return end > start ? trimmed.slice(start, end + 1) : trimmed;
}

function parseExercise(raw: unknown, index: number, workoutName: string): Exercise | string {
  const where = `Exercise ${index + 1} in "${workoutName}"`;
  if (!isObject(raw)) return `${where} must be an object.`;

  const name = str(pick(raw, ['name', 'exercise', 'title']));
  if (!name) return `${where} is missing a name.`;

  const durationRaw = pick(raw, ['durationSec', 'duration', 'durationSeconds', 'seconds', 'timeSec', 'workSec', 'time']);
  const repsRaw = pick(raw, ['reps', 'repetitions']);

  const modeRaw = str(pick(raw, ['mode', 'type'])).toLowerCase();
  let mode: ExerciseMode;
  if (['reps', 'rep', 'repetitions', 'count'].includes(modeRaw)) mode = 'reps';
  else if (['time', 'timed', 'duration', 'hold', 'seconds'].includes(modeRaw)) mode = 'time';
  else if (modeRaw) return `${where} has an unknown mode "${modeRaw}" (use "reps" or "time").`;
  else mode = durationRaw !== undefined && repsRaw === undefined ? 'time' : 'reps';

  const defaults = newExercise();
  return newExercise({
    name,
    mode,
    sets: Math.round(num(pick(raw, ['sets', 'rounds']), defaults.sets, LIMITS.sets)),
    reps: Math.round(num(repsRaw, defaults.reps, LIMITS.reps)),
    durationSec: Math.round(num(durationRaw, defaults.durationSec, LIMITS.durationSec)),
    weightKg: num(pick(raw, ['weightKg', 'weight', 'kg', 'load']), 0, LIMITS.weightKg),
    restSec: Math.round(num(pick(raw, ['restSec', 'rest', 'restSeconds']), defaults.restSec, LIMITS.restSec)),
  });
}

function parseWorkout(raw: unknown, index: number): Workout | string {
  if (!isObject(raw)) return `Workout ${index + 1} must be an object.`;
  const name = str(pick(raw, ['name', 'title', 'workout'])) || `Workout ${index + 1}`;

  const list = pick(raw, ['exercises', 'items', 'movements']);
  if (!Array.isArray(list) || list.length === 0) return `"${name}" has no exercises.`;

  const exercises: Exercise[] = [];
  for (let i = 0; i < list.length; i++) {
    const ex = parseExercise(list[i], i, name);
    if (typeof ex === 'string') return ex;
    exercises.push(ex);
  }

  const defaults = newWorkout();
  return newWorkout({
    name,
    exercises,
    restBetweenExercisesSec: Math.round(
      num(
        pick(raw, ['restBetweenExercisesSec', 'restBetweenExercises', 'restBetweenExercisesSeconds', 'transitionRestSec']),
        defaults.restBetweenExercisesSec,
        LIMITS.restBetweenExercisesSec,
      ),
    ),
  });
}

/**
 * Turn pasted text into workouts. Accepts one workout object, an array of them,
 * or `{ "workouts": [...] }`. Ids are always regenerated so imports never collide.
 */
export function parseWorkoutJson(text: string): ParseResult {
  const payload = extractJson(text);
  if (!payload) return { ok: false, error: 'Paste the JSON your AI produced first.' };

  let data: unknown;
  try {
    data = JSON.parse(payload);
  } catch (e) {
    const detail = e instanceof Error ? e.message.replace(/^JSON\.parse: /, '') : '';
    return { ok: false, error: `That is not valid JSON${detail ? `: ${detail}` : '.'}` };
  }

  let items: unknown[];
  if (Array.isArray(data)) items = data;
  else if (isObject(data) && Array.isArray(data.workouts)) items = data.workouts;
  else if (isObject(data)) items = [data];
  else return { ok: false, error: 'Expected a workout object or an array of workouts.' };

  if (items.length === 0) return { ok: false, error: 'The list of workouts is empty.' };

  const workouts: Workout[] = [];
  for (let i = 0; i < items.length; i++) {
    const w = parseWorkout(items[i], i);
    if (typeof w === 'string') return { ok: false, error: w };
    workouts.push(w);
  }
  return { ok: true, workouts };
}

/** Strip ids so a workout can be shared with an AI or re-imported cleanly. */
export function workoutToJson(workout: Workout): string {
  const { name, restBetweenExercisesSec, exercises } = workout;
  return JSON.stringify(
    {
      name,
      restBetweenExercisesSec,
      exercises: exercises.map(({ name, mode, sets, reps, durationSec, weightKg, restSec }) =>
        mode === 'time' ? { name, mode, sets, durationSec, weightKg, restSec } : { name, mode, sets, reps, weightKg, restSec },
      ),
    },
    null,
    2,
  );
}

const EXAMPLE = `{
  "name": "Upper Body",
  "restBetweenExercisesSec": 90,
  "exercises": [
    { "name": "Push-ups", "mode": "reps", "sets": 3, "reps": 12, "weightKg": 0, "restSec": 60 },
    { "name": "Dumbbell Press", "mode": "reps", "sets": 3, "reps": 10, "weightKg": 12, "restSec": 90 },
    { "name": "Plank", "mode": "time", "sets": 3, "durationSec": 45, "weightKg": 0, "restSec": 45 }
  ]
}`;

/** Ready-to-paste prompt for any chat AI. Ends with blanks for the user to fill in. */
export function buildPlannerPrompt(current?: Workout[]): string {
  const lines = [
    'Plan a workout for me and reply with JSON only (no markdown fences, no commentary) so I can paste it straight into the Home Workout Timer app.',
    `App: ${APP_URL}  Format reference: ${LLMS_TXT_URL}`,
    '',
    'Output exactly this shape:',
    EXAMPLE,
    '',
    'Rules:',
    '- "mode" is "reps" (counted reps, uses "reps") or "time" (timed work or hold, uses "durationSec" in seconds).',
    `- Integers except weightKg (0 = bodyweight). Limits: sets ${LIMITS.sets.join('-')}, reps ${LIMITS.reps.join('-')}, durationSec ${LIMITS.durationSec.join('-')}, weightKg ${LIMITS.weightKg.join('-')}, restSec ${LIMITS.restSec.join('-')}, restBetweenExercisesSec ${LIMITS.restBetweenExercisesSec.join('-')}.`,
    '- "restSec" is rest between sets of that exercise; "restBetweenExercisesSec" is rest after an exercise before the next one.',
    '- Keep exercise names short (they show on a phone). List exercises in the order to perform them.',
    '- For several workouts (e.g. a weekly split), reply with a JSON array of workout objects instead.',
    '',
    'About me:',
    '- Goal: ',
    '- Equipment: ',
    '- Time per session: ',
    '- Days per week: ',
    '- Experience and any injuries or limits: ',
  ];
  if (current && current.length > 0) {
    lines.push('', 'My current workouts, for reference:', JSON.stringify(current.map((w) => JSON.parse(workoutToJson(w))), null, 2));
  }
  return lines.join('\n');
}
