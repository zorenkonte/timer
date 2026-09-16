import { Button, List, ListButton, Surface, useAccentColor } from '@cladd-ui/react';
import type { Workout } from '../types';
import { estimateWorkoutSec, formatDuration, totalSets } from '../lib/format';
import { ChevronRightIcon, DumbbellIcon, ImportIcon, PlayIcon, PlusIcon } from '../components/icons';

interface WorkoutsScreenProps {
  workouts: Workout[];
  prepSec: number;
  onStart: (id: string) => void;
  onEdit: (id: string) => void;
  onNew: () => void;
  onImport: () => void;
}

export function WorkoutsScreen({ workouts, prepSec, onStart, onEdit, onNew, onImport }: WorkoutsScreenProps) {
  const accent = useAccentColor();
  return (
    <div className="flex flex-col gap-4">
      <header className="flex items-center justify-between gap-3 animate-fade-up motion-reduce:animate-none">
        <h1 className="text-2xl font-semibold tracking-tight">Workouts</h1>
        <div className="flex items-center gap-2">
          <Button size="md" rounded variant="transparent" onClick={onImport} aria-label="Import workout from JSON">
            <ImportIcon className="size-4" />
            Import
          </Button>
          <Button size="md" rounded onClick={onNew}>
            <PlusIcon className="size-4" />
            New
          </Button>
        </div>
      </header>

      {workouts.length === 0 ? (
        <Surface className="rounded-cladd-popover animate-fade-up motion-reduce:animate-none" contentClassName="flex flex-col items-center gap-3 p-6 text-center">
          <DumbbellIcon className="size-8 text-cladd-fg-softer" />
          <div className="text-cladd-md font-semibold">No workouts yet</div>
          <div className="text-cladd-sm text-cladd-fg-soft">Build one with your exercises, sets, reps and rest times.</div>
          <div className="flex flex-wrap justify-center gap-2">
            <Button rounded variant="gradient-fill" color={accent} onClick={onNew}>
              Create workout
            </Button>
            <Button rounded variant="gradient" onClick={onImport}>
              <ImportIcon className="size-4" />
              Import JSON
            </Button>
          </div>
        </Surface>
      ) : (
        <List className="flex flex-col gap-2">
          {workouts.map((w, i) => {
            const sets = totalSets(w);
            const runnable = w.exercises.length > 0;
            return (
              <ListButton
                key={w.id}
                as="div"
                role="button"
                tabIndex={0}
                size="xl"
                variant="gradient"
                outline
                className="w-full animate-fade-up motion-reduce:animate-none"
                style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}
                onClick={() => onEdit(w.id)}
                onKeyDown={(e: React.KeyboardEvent) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onEdit(w.id);
                  }
                }}
                header={`${w.exercises.length} ${w.exercises.length === 1 ? 'exercise' : 'exercises'} · ${sets} sets`}
                footer={runnable ? `~${formatDuration(estimateWorkoutSec(w, prepSec))}` : 'Add exercises to start'}
                after={
                  <div className="flex items-center gap-2">
                    <Button
                      size="md"
                      rounded
                      variant="gradient-fill"
                      color={accent}
                      disabled={!runnable}
                      onClick={(e: React.MouseEvent) => {
                        e.stopPropagation();
                        onStart(w.id);
                      }}
                      aria-label={`Start ${w.name || 'workout'}`}
                    >
                      <PlayIcon className="size-4" />
                      Start
                    </Button>
                    <ChevronRightIcon className="size-4 text-cladd-fg-softer" />
                  </div>
                }
              >
                <span className="truncate text-cladd-md font-semibold">{w.name || 'Untitled workout'}</span>
              </ListButton>
            );
          })}
        </List>
      )}

      {workouts.length > 0 && (
        <p className="px-1 text-cladd-xs text-cladd-fg-softer">Tap a workout to edit it. Use Import to paste a plan an AI wrote for you.</p>
      )}
    </div>
  );
}
