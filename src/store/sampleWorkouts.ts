import type { Exercise, Workout } from '../types';
import { uid } from '../lib/id';

export function newExercise(partial: Partial<Exercise> = {}): Exercise {
  return {
    id: uid(),
    name: '',
    mode: 'reps',
    sets: 3,
    reps: 12,
    durationSec: 45,
    weightKg: 0,
    restSec: 60,
    ...partial,
  };
}

export function newWorkout(partial: Partial<Workout> = {}): Workout {
  return {
    id: uid(),
    name: '',
    exercises: [],
    restBetweenExercisesSec: 90,
    ...partial,
  };
}

export function sampleWorkouts(): Workout[] {
  return [
    newWorkout({
      name: 'Push Day',
      restBetweenExercisesSec: 90,
      exercises: [
        newExercise({ name: 'Push-ups', sets: 4, reps: 15, restSec: 60 }),
        newExercise({ name: 'Dumbbell Press', sets: 3, reps: 10, weightKg: 12, restSec: 90 }),
        newExercise({ name: 'Dumbbell Rows', sets: 3, reps: 12, weightKg: 12, restSec: 75 }),
        newExercise({ name: 'Plank', mode: 'time', sets: 3, durationSec: 45, restSec: 45 }),
      ],
    }),
    newWorkout({
      name: 'Full Body Dumbbell',
      restBetweenExercisesSec: 75,
      exercises: [
        newExercise({ name: 'Goblet Squat', sets: 3, reps: 12, weightKg: 16, restSec: 75 }),
        newExercise({ name: 'Dumbbell Deadlift', sets: 3, reps: 10, weightKg: 20, restSec: 90 }),
        newExercise({ name: 'Shoulder Press', sets: 3, reps: 10, weightKg: 10, restSec: 75 }),
        newExercise({ name: 'Bicep Curls', sets: 3, reps: 12, weightKg: 8, restSec: 60 }),
        newExercise({ name: 'Mountain Climbers', mode: 'time', sets: 3, durationSec: 30, restSec: 30 }),
      ],
    }),
  ];
}
