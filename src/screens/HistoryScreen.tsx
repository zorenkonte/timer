import { Button, Chip, List, ListItem, Surface, useDialog } from '@cladd-ui/react';
import type { HistoryEntry } from '../types';
import { formatDate, formatDuration } from '../lib/format';
import { HistoryIcon, TrashIcon } from '../components/icons';
import { CalendarHeatmap } from '../components/CalendarHeatmap';

interface HistoryScreenProps {
  history: HistoryEntry[];
  onClear: () => void;
}

export function HistoryScreen({ history, onClear }: HistoryScreenProps) {
  const dialog = useDialog();

  const confirmClear = () =>
    dialog.confirm({
      title: 'Clear history?',
      text: 'All logged workouts will be removed.',
      confirmButtonText: 'Clear',
      confirmButtonColor: 'red',
      onConfirm: onClear,
    });

  return (
    <div className="flex flex-col gap-4">
      <header className="flex items-center justify-between gap-3 animate-fade-up motion-reduce:animate-none">
        <h1 className="text-2xl font-semibold tracking-tight">History</h1>
        {history.length > 0 && (
          <Button size="md" rounded variant="transparent" color="red" onClick={confirmClear}>
            <TrashIcon className="size-4" />
            Clear
          </Button>
        )}
      </header>

      <CalendarHeatmap history={history} />

      {history.length === 0 ? (
        <Surface className="rounded-cladd-popover animate-fade-up motion-reduce:animate-none" style={{ animationDelay: '160ms' }} contentClassName="flex flex-col items-center gap-3 p-6 text-center">
          <HistoryIcon className="size-8 text-cladd-fg-softer" />
          <div className="text-cladd-md font-semibold">Nothing logged yet</div>
          <div className="text-cladd-sm text-cladd-fg-soft">Finished workouts show up here.</div>
        </Surface>
      ) : (
        <List className="flex flex-col gap-2">
          {history.map((h, i) => (
            <Surface key={h.id} className="rounded-cladd-popover animate-fade-up motion-reduce:animate-none" style={{ animationDelay: `${160 + Math.min(i, 8) * 40}ms` }} contentClassName="p-0">
              <ListItem className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <div className="truncate text-cladd-md font-semibold">{h.workoutName}</div>
                  <div className="text-cladd-xs text-cladd-fg-soft">
                    {formatDate(h.startedAt)} · {formatDuration(Math.round((h.finishedAt - h.startedAt) / 1000))}
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <div className="text-cladd-md font-semibold tabular-nums">
                    {h.setsDone}/{h.setsTotal}
                  </div>
                  <Chip size="xs" rounded color={h.completed ? 'green' : 'neutral'} variant={h.completed ? 'gradient-fill' : 'gradient'}>
                    {h.completed ? 'Completed' : 'Ended early'}
                  </Chip>
                </div>
              </ListItem>
            </Surface>
          ))}
        </List>
      )}
    </div>
  );
}
