import { useEffect, useMemo, useRef, useState } from 'react';
import { Button, Chip, Surface, Toolbar, ToolbarButton, ToolbarSeparator, useDialog, useToast } from '@cladd-ui/react';
import type { Color } from '@cladd-ui/react';
import type { HistoryEntry, Settings, Workout } from '../types';
import { describeTarget, formatClock, formatDuration, totalSets } from '../lib/format';
import { uid } from '../lib/id';
import { useCountdown } from '../timer/useCountdown';
import { playCue, unlockAudio } from '../timer/sound';
import { useWakeLock } from '../timer/useWakeLock';
import { ProgressRing } from '../components/ProgressRing';
import { TimeDisplay } from '../components/TimeDisplay';
import { ArrowLeftIcon, CheckIcon, PauseIcon, PlayIcon, SkipIcon, StopIcon } from '../components/icons';

type Step =
  | { kind: 'prep'; sec: number }
  | { kind: 'work'; exIdx: number; setIdx: number }
  | { kind: 'rest'; sec: number; exIdx: number; setIdx: number };

function buildSteps(workout: Workout, prepSec: number): Step[] {
  const steps: Step[] = [];
  if (prepSec > 0 && workout.exercises.length > 0) steps.push({ kind: 'prep', sec: prepSec });
  workout.exercises.forEach((ex, exIdx) => {
    for (let setIdx = 0; setIdx < ex.sets; setIdx++) {
      steps.push({ kind: 'work', exIdx, setIdx });
      const lastSet = setIdx === ex.sets - 1;
      const lastExercise = exIdx === workout.exercises.length - 1;
      const rest = lastSet ? (lastExercise ? 0 : workout.restBetweenExercisesSec) : ex.restSec;
      if (rest > 0) steps.push({ kind: 'rest', sec: rest, exIdx, setIdx });
    }
  });
  return steps;
}

interface RunnerScreenProps {
  workout: Workout;
  settings: Settings;
  onFinish: (entry: HistoryEntry) => void;
  onExit: () => void;
}

export function RunnerScreen({ workout, settings, onFinish, onExit }: RunnerScreenProps) {
  const steps = useMemo(() => buildSteps(workout, settings.prepSec), [workout, settings.prepSec]);
  const setsTotal = totalSets(workout);
  const [stepIdx, setStepIdx] = useState(0);
  const [setsDone, setSetsDone] = useState(0);
  const startedAt = useRef(Date.now());
  const savedRef = useRef(false);
  const lastBeepRef = useRef<number | null>(null);
  const cueOpts = useRef({ sound: settings.sound, vibrate: settings.vibrate });
  cueOpts.current = { sound: settings.sound, vibrate: settings.vibrate };

  const dialog = useDialog();
  const toast = useToast();

  const step: Step | undefined = steps[stepIdx];
  const finished = step === undefined;
  const exercise = step && step.kind !== 'prep' ? workout.exercises[step.exIdx] : undefined;

  // Advance is called from the countdown's onComplete; keep the latest closure in a ref.
  const advanceRef = useRef(() => {});
  advanceRef.current = () => {
    if (step?.kind === 'work') setSetsDone((n) => n + 1);
    setStepIdx((i) => i + 1);
  };

  const countdown = useCountdown(() => advanceRef.current());
  const { start, stop } = countdown;

  useWakeLock(!finished);

  // Enter each step: start the right countdown and play a cue.
  useEffect(() => {
    lastBeepRef.current = null;
    const s = steps[stepIdx];
    if (!s) {
      stop();
      return;
    }
    if (s.kind === 'prep') {
      start(s.sec * 1000);
    } else if (s.kind === 'rest') {
      start(s.sec * 1000);
      playCue('rest', cueOpts.current);
    } else {
      const ex = workout.exercises[s.exIdx];
      playCue('go', cueOpts.current);
      if (ex.mode === 'time') start(ex.durationSec * 1000);
      else stop();
    }
  }, [stepIdx, steps, workout, start, stop]);

  // Save history exactly once when the workout completes.
  useEffect(() => {
    if (!finished || savedRef.current) return;
    savedRef.current = true;
    playCue('done', cueOpts.current);
    onFinish({
      id: uid(),
      workoutId: workout.id,
      workoutName: workout.name,
      startedAt: startedAt.current,
      finishedAt: Date.now(),
      setsDone: setsTotal,
      setsTotal,
      completed: true,
    });
    toast({ title: 'Workout complete', text: `${setsTotal} sets done. Nice work!`, color: 'green' });
  }, [finished, onFinish, setsTotal, toast, workout.id, workout.name]);

  // 3-2-1 ticks.
  const secLeft = Math.ceil(countdown.remainingMs / 1000);
  useEffect(() => {
    if (!countdown.running || secLeft > 3 || secLeft < 1) return;
    if (lastBeepRef.current === secLeft) return;
    lastBeepRef.current = secLeft;
    playCue('tick', cueOpts.current);
  }, [secLeft, countdown.running]);

  // Mirror the clock into the tab title.
  useEffect(() => {
    const base = 'Home Workout Timer';
    if (finished || !countdown.active) {
      document.title = base;
      return;
    }
    const label = step?.kind === 'rest' ? 'Rest' : step?.kind === 'prep' ? 'Ready' : 'Work';
    document.title = `${formatClock(countdown.remainingMs)} ${label} · ${base}`;
    return () => {
      document.title = base;
    };
  }, [countdown.remainingMs, countdown.active, finished, step?.kind]);

  const endEarly = () => {
    if (finished) {
      onExit();
      return;
    }
    dialog.confirm({
      title: 'End workout?',
      text: setsDone > 0 ? `${setsDone} of ${setsTotal} sets done so far will be saved.` : 'Nothing has been completed yet.',
      confirmButtonText: 'End',
      confirmButtonColor: 'red',
      onConfirm: () => {
        stop();
        if (setsDone > 0) {
          onFinish({
            id: uid(),
            workoutId: workout.id,
            workoutName: workout.name,
            startedAt: startedAt.current,
            finishedAt: Date.now(),
            setsDone,
            setsTotal,
            completed: false,
          });
        }
        onExit();
      },
    });
  };

  const togglePause = () => {
    unlockAudio();
    if (countdown.running) countdown.pause();
    else if (countdown.active) countdown.resume();
  };

  const skip = () => {
    unlockAudio();
    stop();
    advanceRef.current();
  };

  const completeSet = () => {
    unlockAudio();
    advanceRef.current();
  };

  // Which exercise/set comes next (for the "Next up" line).
  const nextWork = useMemo(() => {
    for (let i = stepIdx + 1; i < steps.length; i++) {
      const s = steps[i];
      if (s.kind === 'work') return s;
    }
    return undefined;
  }, [steps, stepIdx]);

  const phaseColor: Color = step?.kind === 'rest' ? 'cyan' : step?.kind === 'prep' ? 'yellow' : settings.accent;
  const phaseLabel = step?.kind === 'rest' ? 'Rest' : step?.kind === 'prep' ? 'Get ready' : 'Work';
  const timed = step?.kind !== 'work' || exercise?.mode === 'time';
  const ringProgress = timed && countdown.totalMs > 0 ? countdown.remainingMs / countdown.totalMs : 1;

  if (finished) {
    const elapsed = Math.round((Date.now() - startedAt.current) / 1000);
    return (
      <div className="flex h-full flex-col items-center justify-center gap-6 px-6 pt-safe-6 pb-safe-6 text-center">
        <Surface color="green" variant="gradient-fill" className="rounded-full animate-check-in motion-reduce:animate-none" contentClassName="flex size-24 items-center justify-center">
          <CheckIcon className="size-12" />
        </Surface>
        <div className="animate-fade-up motion-reduce:animate-none" style={{ animationDelay: '150ms' }}>
          <h1 className="text-3xl font-semibold tracking-tight">Workout complete</h1>
          <p className="mt-2 text-cladd-md text-cladd-fg-soft">{workout.name}</p>
        </div>
        <Surface className="w-full rounded-cladd-popover animate-fade-up motion-reduce:animate-none" style={{ animationDelay: '260ms' }} contentClassName="grid grid-cols-2 divide-x divide-cladd-outline p-4">
          <div>
            <div className="text-3xl font-semibold tabular-nums">{setsTotal}</div>
            <div className="text-cladd-xs text-cladd-fg-soft uppercase">sets</div>
          </div>
          <div>
            <div className="text-3xl font-semibold tabular-nums">{formatDuration(elapsed)}</div>
            <div className="text-cladd-xs text-cladd-fg-soft uppercase">duration</div>
          </div>
        </Surface>
        <Button size="2xl" rounded variant="gradient-fill" color="green" className="w-full animate-fade-up motion-reduce:animate-none" style={{ animationDelay: '360ms' }} onClick={onExit}>
          Done
        </Button>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col px-4 pt-safe-3 pb-safe-4">
      <header className="flex items-center gap-2">
        <Button square size="lg" variant="transparent" outline={false} onClick={endEarly} aria-label="End workout">
          <ArrowLeftIcon className="size-5" />
        </Button>
        <div className="min-w-0 flex-1 truncate text-center text-cladd-sm font-semibold">{workout.name}</div>
        <div className="size-10" />
      </header>


      <main className="flex flex-1 flex-col items-center justify-center gap-5 py-4">
        <Chip key={phaseLabel} size="md" rounded color={phaseColor} variant="gradient-fill" className="uppercase tracking-wider animate-pop motion-reduce:animate-none">
          {phaseLabel}
        </Chip>

        <div key={`title-${stepIdx}`} className="text-center animate-fade-up motion-reduce:animate-none">
          <h1 className="text-2xl font-semibold tracking-tight">{step?.kind === 'prep' ? workout.exercises[0]?.name : exercise?.name}</h1>
          {step && step.kind !== 'prep' && exercise && (
            <p className="mt-1 text-cladd-md text-cladd-fg-soft">
              Set {step.setIdx + 1} of {exercise.sets} · {describeTarget(exercise)}
            </p>
          )}
          {step?.kind === 'prep' && workout.exercises[0] && (
            <p className="mt-1 text-cladd-md text-cladd-fg-soft">First up · {describeTarget(workout.exercises[0])}</p>
          )}
        </div>

        <Surface variant="transparent" color={phaseColor} wrapContent={false}>
          <ProgressRing progress={ringProgress}>
            {timed ? (
              <>
                <TimeDisplay ms={countdown.remainingMs} />
                {!countdown.running && countdown.active && <div className="mt-2 text-cladd-sm font-medium text-cladd-fg-soft uppercase animate-pulse">Paused</div>}
              </>
            ) : (
              <>
                <div key={`reps-${stepIdx}`} className="text-7xl leading-none font-semibold tracking-tight tabular-nums animate-pop motion-reduce:animate-none">{exercise?.reps}</div>
                <div className="mt-2 text-cladd-md text-cladd-fg-soft">reps</div>
              </>
            )}
          </ProgressRing>
        </Surface>

        {!timed && (
          <Button
            key={`done-${stepIdx}`}
            size="2xl"
            rounded
            variant="gradient-fill"
            color={settings.accent}
            className="w-full max-w-xs animate-fade-up motion-reduce:animate-none"
            style={{ animationDelay: '80ms' }}
            onClick={completeSet}
          >
            <CheckIcon className="size-5" />
            Set done
          </Button>
        )}

        <div className="min-h-5 text-cladd-sm text-cladd-fg-soft">
          {step?.kind === 'rest' && nextWork && (
            <>
              Next: <span className="text-cladd-fg">{workout.exercises[nextWork.exIdx].name}</span> · set {nextWork.setIdx + 1}
            </>
          )}
          {step?.kind === 'work' && exercise && (
            <>
              Then:{' '}
              {step.setIdx + 1 < exercise.sets
                ? `rest ${exercise.restSec} s`
                : nextWork
                  ? `rest ${workout.restBetweenExercisesSec} s, then ${workout.exercises[nextWork.exIdx].name}`
                  : 'finish'}
            </>
          )}
        </div>
      </main>

      <Toolbar size="xl" className="mx-auto" contentClassName="gap-1">
        <ToolbarButton square onClick={togglePause} disabled={!timed} aria-label={countdown.running ? 'Pause' : 'Resume'}>
          {countdown.running ? <PauseIcon className="size-5" /> : <PlayIcon className="size-5" />}
        </ToolbarButton>
        <ToolbarSeparator />
        <ToolbarButton onClick={() => countdown.add(-15_000)} disabled={!timed || !countdown.active}>
          −15s
        </ToolbarButton>
        <ToolbarButton onClick={() => countdown.add(15_000)} disabled={!timed || !countdown.active}>
          +15s
        </ToolbarButton>
        <ToolbarSeparator />
        <ToolbarButton square onClick={skip} aria-label="Skip">
          <SkipIcon className="size-5" />
        </ToolbarButton>
        <ToolbarButton square color="red" onClick={endEarly} aria-label="End workout">
          <StopIcon className="size-5" />
        </ToolbarButton>
      </Toolbar>
    </div>
  );
}
