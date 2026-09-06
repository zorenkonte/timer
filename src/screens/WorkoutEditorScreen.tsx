import { useState } from 'react';
import { Button, Input, NumberField, SectionTitle, useDialog } from '@cladd-ui/react';
import type { Exercise, Workout } from '../types';
import { newExercise } from '../store/sampleWorkouts';
import { ExerciseEditorCard } from '../components/ExerciseEditorCard';
import { ArrowLeftIcon, PlusIcon, TrashIcon } from '../components/icons';

interface WorkoutEditorScreenProps {
  initial: Workout;
  isNew: boolean;
  onSave: (workout: Workout) => void;
  onDelete: (id: string) => void;
  onBack: () => void;
}

export function WorkoutEditorScreen({ initial, isNew, onSave, onDelete, onBack }: WorkoutEditorScreenProps) {
  const [draft, setDraft] = useState<Workout>(initial);
  const dialog = useDialog();

  const updateExercise = (id: string, next: Exercise) =>
    setDraft((d) => ({ ...d, exercises: d.exercises.map((e) => (e.id === id ? next : e)) }));

  const moveExercise = (index: number, delta: -1 | 1) =>
    setDraft((d) => {
      const target = index + delta;
      if (target < 0 || target >= d.exercises.length) return d;
      const list = [...d.exercises];
      [list[index], list[target]] = [list[target], list[index]];
      return { ...d, exercises: list };
    });

  const removeExercise = (id: string) => setDraft((d) => ({ ...d, exercises: d.exercises.filter((e) => e.id !== id) }));

  const addExercise = () => setDraft((d) => ({ ...d, exercises: [...d.exercises, newExercise()] }));

  const save = () => {
    onSave({
      ...draft,
      name: draft.name.trim() || 'Untitled workout',
      exercises: draft.exercises.map((e) => ({ ...e, name: e.name.trim() || 'Exercise' })),
    });
  };

  const confirmDelete = () =>
    dialog.confirm({
      title: 'Delete workout?',
      text: `"${draft.name || 'Untitled workout'}" will be removed. This cannot be undone.`,
      confirmButtonText: 'Delete',
      confirmButtonColor: 'red',
      onConfirm: () => onDelete(draft.id),
    });

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center gap-2 px-4 pt-safe-4 pb-3">
        <Button square size="lg" variant="transparent" outline={false} onClick={onBack} aria-label="Back">
          <ArrowLeftIcon className="size-5" />
        </Button>
        <h1 className="flex-1 truncate text-xl font-semibold tracking-tight">{isNew ? 'New workout' : 'Edit workout'}</h1>
        <Button size="lg" rounded variant="gradient-fill" onClick={save}>
          Save
        </Button>
      </header>

      <div className="flex-1 overflow-y-auto px-4 pb-safe-6">
        <div className="flex flex-col gap-5">
          <Input
            size="xl"
            value={draft.name}
            placeholder="Workout name"
            autoFocus={isNew}
            onChange={(name) => setDraft((d) => ({ ...d, name }))}
          />

          <section className="flex flex-col gap-3">
            <SectionTitle>Exercises</SectionTitle>
            {draft.exercises.length === 0 && (
              <div className="rounded-cladd-popover border border-dashed border-cladd-outline p-6 text-center text-cladd-sm text-cladd-fg-soft">
                No exercises yet. Add push-ups, dumbbell presses, planks…
              </div>
            )}
            {draft.exercises.map((ex, i) => (
              <ExerciseEditorCard
                key={ex.id}
                exercise={ex}
                index={i}
                count={draft.exercises.length}
                onChange={(next) => updateExercise(ex.id, next)}
                onMove={(delta) => moveExercise(i, delta)}
                onRemove={() => removeExercise(ex.id)}
              />
            ))}
            <Button size="lg" rounded variant="gradient" onClick={addExercise}>
              <PlusIcon className="size-4" />
              Add exercise
            </Button>
          </section>

          <section className="flex flex-col gap-3">
            <SectionTitle>Between exercises</SectionTitle>
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1 text-cladd-sm text-cladd-fg-soft">Rest after finishing an exercise</div>
              <NumberField
                size="md"
                className="w-36 shrink-0"
                min={0}
                max={900}
                step={15}
                value={draft.restBetweenExercisesSec}
                onChange={(restBetweenExercisesSec) => setDraft((d) => ({ ...d, restBetweenExercisesSec }))}
              />
            </div>
          </section>

          {!isNew && (
            <Button size="lg" rounded color="red" variant="transparent" onClick={confirmDelete}>
              <TrashIcon className="size-4" />
              Delete workout
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
