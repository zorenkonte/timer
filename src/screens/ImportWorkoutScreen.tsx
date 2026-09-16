import { useState } from 'react';
import { Button, Link, Surface, Textarea, useAccentColor, useToast } from '@cladd-ui/react';
import type { Workout } from '../types';
import { buildPlannerPrompt, LLMS_TXT_URL, parseWorkoutJson } from '../lib/workoutJson';
import { copyText } from '../lib/clipboard';
import { ArrowLeftIcon, CopyIcon, ImportIcon, SparklesIcon } from '../components/icons';

interface ImportWorkoutScreenProps {
  /** Existing workouts, offered to the AI as context in the copied prompt. */
  workouts: Workout[];
  onImport: (workouts: Workout[]) => void;
  onBack: () => void;
}

export function ImportWorkoutScreen({ workouts, onImport, onBack }: ImportWorkoutScreenProps) {
  const accent = useAccentColor();
  const toast = useToast();
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);

  const copyPrompt = async (withCurrent: boolean) => {
    const ok = await copyText(buildPlannerPrompt(withCurrent ? workouts : undefined));
    toast(
      ok
        ? { title: 'Prompt copied', text: 'Paste it into any AI chat, fill in the blanks, then paste the JSON it gives you here.', color: 'green' }
        : { title: 'Could not copy', text: 'Your browser blocked clipboard access.', color: 'red' },
    );
  };

  const importJson = () => {
    const result = parseWorkoutJson(text);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setError(null);
    onImport(result.workouts);
  };

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center gap-2 px-4 pt-safe-4 pb-3">
        <Button square size="lg" variant="transparent" outline={false} onClick={onBack} aria-label="Back">
          <ArrowLeftIcon className="size-5" />
        </Button>
        <h1 className="flex-1 truncate text-xl font-semibold tracking-tight">Import workout</h1>
        <Button size="lg" rounded variant="gradient-fill" color={accent} disabled={!text.trim()} onClick={importJson}>
          <ImportIcon className="size-4" />
          Import
        </Button>
      </header>

      <div className="flex-1 overflow-y-auto px-4 pb-safe-6">
        <div className="flex flex-col gap-5">
          <Surface className="rounded-cladd-popover animate-fade-up motion-reduce:animate-none" contentClassName="flex flex-col gap-3 p-4">
            <div className="flex items-center gap-2 text-cladd-md font-semibold">
              <SparklesIcon className="size-4 text-cladd-fg-soft" />
              Let an AI plan it
            </div>
            <ol className="flex list-decimal flex-col gap-1 pl-5 text-cladd-sm text-cladd-fg-soft">
              <li>Copy the prompt below and paste it into ChatGPT, Claude, Gemini or any other AI chat.</li>
              <li>Fill in the blanks about your goal, gear and time.</li>
              <li>Paste the JSON it replies with into the box here and tap Import.</li>
            </ol>
            <div className="flex flex-wrap gap-2">
              <Button size="md" rounded variant="gradient" onClick={() => copyPrompt(false)}>
                <CopyIcon className="size-4" />
                Copy prompt
              </Button>
              {workouts.length > 0 && (
                <Button size="md" rounded variant="transparent" onClick={() => copyPrompt(true)}>
                  <CopyIcon className="size-4" />
                  Copy with my workouts
                </Button>
              )}
            </div>
            <p className="text-cladd-xs text-cladd-fg-softer">
              AIs that can browse may read the format directly from{' '}
              <Link as="a" href={LLMS_TXT_URL} target="_blank" rel="noreferrer">
                llms.txt
              </Link>
              .
            </p>
          </Surface>

          <section className="flex flex-col gap-2 animate-fade-up motion-reduce:animate-none" style={{ animationDelay: '60ms' }}>
            <Textarea
              size="lg"
              value={text}
              placeholder={'Paste the workout JSON here…\n{ "name": "Upper Body", "exercises": [ … ] }'}
              inputClassName="min-h-56 font-mono text-cladd-sm"
              valid={!error}
              errorMessage={error ?? undefined}
              onChange={(v) => {
                setText(v);
                if (error) setError(null);
              }}
            />
            <p className="px-1 text-cladd-xs text-cladd-fg-softer">
              One workout opens in the editor for review. A list of workouts is added straight to your library.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
