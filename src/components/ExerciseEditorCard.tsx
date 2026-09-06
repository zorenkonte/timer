import type { ReactNode } from 'react';
import { Button, Input, NumberField, Surface, ToggleButton, ToggleGroup } from '@cladd-ui/react';
import type { Exercise, ExerciseMode } from '../types';
import { ChevronDownIcon, ChevronUpIcon, TrashIcon } from './icons';

interface ExerciseEditorCardProps {
  exercise: Exercise;
  index: number;
  count: number;
  onChange: (next: Exercise) => void;
  onMove: (delta: -1 | 1) => void;
  onRemove: () => void;
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex min-w-0 flex-col gap-1">
      <span className="text-cladd-xs font-medium text-cladd-fg-soft">{label}</span>
      {children}
    </label>
  );
}

export function ExerciseEditorCard({ exercise, index, count, onChange, onMove, onRemove }: ExerciseEditorCardProps) {
  const patch = (p: Partial<Exercise>) => onChange({ ...exercise, ...p });

  return (
    <Surface className="rounded-cladd-popover" contentClassName="flex flex-col gap-3 p-3">
      <div className="flex items-center gap-2">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-cladd-surface-cut text-cladd-xs font-semibold text-cladd-fg-soft tabular-nums">
          {index + 1}
        </span>
        <Input
          className="min-w-0 flex-1"
          size="md"
          value={exercise.name}
          placeholder="Exercise name"
          onChange={(name) => patch({ name })}
        />
        <Button square size="md" variant="transparent" outline={false} disabled={index === 0} onClick={() => onMove(-1)} aria-label="Move up">
          <ChevronUpIcon className="size-4" />
        </Button>
        <Button square size="md" variant="transparent" outline={false} disabled={index === count - 1} onClick={() => onMove(1)} aria-label="Move down">
          <ChevronDownIcon className="size-4" />
        </Button>
        <Button square size="md" variant="transparent" outline={false} color="red" onClick={onRemove} aria-label="Remove exercise">
          <TrashIcon className="size-4" />
        </Button>
      </div>

      <ToggleGroup
        value={exercise.mode}
        size="sm"
        className="w-full"
        onValueChange={(v) => {
          if (typeof v === 'string') patch({ mode: v as ExerciseMode });
        }}
      >
        <ToggleButton value="reps" className="flex-1">
          Reps
        </ToggleButton>
        <ToggleButton value="time" className="flex-1">
          Timed
        </ToggleButton>
      </ToggleGroup>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Sets">
          <NumberField size="md" min={1} max={20} value={exercise.sets} onChange={(sets) => patch({ sets })} />
        </Field>
        {exercise.mode === 'reps' ? (
          <Field label="Reps">
            <NumberField size="md" min={1} max={500} value={exercise.reps} onChange={(reps) => patch({ reps })} />
          </Field>
        ) : (
          <Field label="Work (s)">
            <NumberField size="md" min={5} max={3600} step={5} value={exercise.durationSec} onChange={(durationSec) => patch({ durationSec })} />
          </Field>
        )}
        <Field label="Weight (kg)">
          <NumberField size="md" min={0} max={500} step={0.5} value={exercise.weightKg} onChange={(weightKg) => patch({ weightKg })} />
        </Field>
        <Field label="Rest (s)">
          <NumberField size="md" min={0} max={900} step={5} value={exercise.restSec} onChange={(restSec) => patch({ restSec })} />
        </Field>
      </div>
    </Surface>
  );
}
